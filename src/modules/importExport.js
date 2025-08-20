// ===== 檔案處理工具 (底層) =====
class FileHandler {
    /**
     * 檢測檔案類型
     * @param {File} file - 使用者選擇的檔案
     * @returns {('json'|'png'|null)} - 返回 'json', 'png', 或 null
     */
    static detectFileType(file) {
        if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
            return 'json';
        } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
            return 'png';
        }
        return null;
    }

    /**
     * 以指定格式讀取檔案
     * @param {File} file - 使用者選擇的檔案
     * @param {('text'|'arrayBuffer')} format - 讀取格式
     * @returns {Promise<string|ArrayBuffer>} - 返回檔案內容
     */
    static readFile(file, format) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error(t('fileReadError')));

            if (format === 'text') {
                reader.readAsText(file);
            } else if (format === 'arrayBuffer') {
                reader.readAsArrayBuffer(file);
            } else {
                reject(new Error(t('unsupportedFileFormat', format)));
            }
        });
    }

    /**
     * 將 Blob 物件轉換為 Base64 字串
     * @param {Blob} blob - Blob 物件
     * @returns {Promise<string>} - 返回 Base64 字串
     */
    static blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

// ===== PNG 專用工具 (底層) =====
class PNGHelper {
    /**
     * 計算 PNG chunk 的 CRC32 校驗碼
     * @param {Uint8Array} data - Chunk 類型和資料
     * @returns {number} - CRC32 校驗碼
     */
    static calculateCRC32(data) {
        const crcTable = [];
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            crcTable[i] = c;
        }

        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * 從 PNG 檔案數據中提取 "chara" tEXt chunk
     * @param {Uint8Array} pngData - PNG 檔案的 Uint8Array
     * @returns {string|null} - 返回角色資料字串，或 null
     */
    static extractCharaFromPNG(pngData) {
        let pos = 8; // 跳過 8 位元組的 PNG 簽名

        while (pos < pngData.length) {
            const view = new DataView(pngData.buffer, pos);
            const length = view.getUint32(0, false);
            const type = String.fromCharCode(pngData[pos + 4], pngData[pos + 5], pngData[pos + 6], pngData[pos + 7]);

            if (type === 'tEXt') {
                const textData = pngData.slice(pos + 8, pos + 8 + length);
                let nullPos = textData.indexOf(0);

                if (nullPos !== -1) {
                    const keyword = new TextDecoder().decode(textData.slice(0, nullPos));
                    if (keyword === 'chara') {
                        return new TextDecoder().decode(textData.slice(nullPos + 1));
                    }
                }
            }

            if (type === 'IEND') break;
            pos += 12 + length;
        }
        return null;
    }

    /**
     * 將帶有 "chara" 關鍵字的 tEXt chunk 添加到 PNG 數據中 (穩健版)
     * @param {Uint8Array} pngData - 原始 PNG 數據
     * @param {string} base64CharaData - 要嵌入的 Base64 角色資料
     * @returns {Uint8Array} - 修改後的 PNG 數據
     */
    static addCharaChunkToPNG(pngData, base64CharaData) {
        // 1. 創建新的 tEXt chunk
        const keywordBytes = new TextEncoder().encode('chara');
        const textBytes = new TextEncoder().encode(base64CharaData);
        const chunkContent = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
        chunkContent.set(keywordBytes, 0);
        chunkContent[keywordBytes.length] = 0; // Null separator
        chunkContent.set(textBytes, keywordBytes.length + 1);
        
        const chunkTypeBytes = new TextEncoder().encode('tEXt');
        const crc = this.calculateCRC32(new Uint8Array([...chunkTypeBytes, ...chunkContent]));

        const textChunk = new Uint8Array(12 + chunkContent.length);
        const view = new DataView(textChunk.buffer);
        view.setUint32(0, chunkContent.length, false); // Length
        textChunk.set(chunkTypeBytes, 4); // Type
        textChunk.set(chunkContent, 8); // Data
        view.setUint32(8 + chunkContent.length, crc, false); // CRC

        // 2. 找到 IEND chunk 的開始位置
        let iendIndex = -1;
        let pos = 8;
        while (pos < pngData.length) {
            const view = new DataView(pngData.buffer, pos);
            const length = view.getUint32(0, false);
            const type = String.fromCharCode(pngData[pos + 4], pngData[pos + 5], pngData[pos + 6], pngData[pos + 7]);
            if (type === 'IEND') {
                iendIndex = pos;
                break;
            }
            pos += 12 + length;
        }

        if (iendIndex === -1) {
            throw new Error(t('invalidPNGFile'));
        }

        // 3. 重新組合 PNG 數據
        const result = new Uint8Array(pngData.length + textChunk.length);
        const iendChunk = pngData.slice(iendIndex); // 獲取原始的 IEND chunk
        
        result.set(pngData.slice(0, iendIndex)); // 複製 IEND 之前的所有數據
        result.set(textChunk, iendIndex); // 在 IEND 之前插入我們的 tEXt chunk
        result.set(iendChunk, iendIndex + textChunk.length); // 在最後加上 IEND chunk
        
        return result;
    }

    // --- PNG Metadata 處理（對外接口）---
    static createPNGWithMetadata(canvas, base64Data, characterName, callback) {
         // 將Canvas轉為ImageData
        canvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // 在PNG中嵌入tEXt chunk with "chara" keyword
                const modifiedPNG = PNGHelper.addCharaChunkToPNG(uint8Array, base64Data);

                
                // 下載修改後的PNG
                const modifiedBlob = new Blob([modifiedPNG], { type: 'image/png' });
                const url = URL.createObjectURL(modifiedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${characterName}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                // 呼叫回調函數（如果有提供）
                if (callback) {
                    setTimeout(callback, 100);
                }
            };
            reader.readAsArrayBuffer(blob);
        }, 'image/png');
    }
    
    static createPNGWithMetadataAndFilename(canvas, base64Data, filename, callback) {
        canvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                const modifiedPNG = PNGHelper.addCharaChunkToPNG(uint8Array, base64Data);

                
                const modifiedBlob = new Blob([modifiedPNG], { type: 'image/png' });
                const url = URL.createObjectURL(modifiedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                
                if (callback) {
                    setTimeout(callback, 100);
                }
            };
            reader.readAsArrayBuffer(blob);
        }, 'image/png');
    }
}



// ===== 檔案下載工具 =====
class FileDownloader {
    /**
     * 通用下載函數
     * @param {string|BlobPart} content - 檔案內容
     * @param {string} filename - 檔名
     * @param {string} mimeType - MIME 類型
     */
    static download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 下載 JSON 檔案
     * @param {object} data - 要轉換為 JSON 的物件
     * @param {string} filename - 檔名
     */
    static downloadJSON(data, filename) {
        const content = JSON.stringify(data, null, 2);
        this.download(content, filename, 'application/json;charset=utf-8');
    }
}

// ===== 匯出管理器 =====
class ExportManager {

    // ===== 公開 API =====
    
    /**
     * 統一匯出入口
     * @param {'character'|'worldbook'|'custom'|'userpersona'|'loveydovey'} type - 項目類型
     * @param {string} itemId - 項目ID
     * @param {string} format - 匯出格式
     */
    static export(type, itemId, format) {
        const item = ItemManager.getItemsArray(type).find(i => i.id === itemId);
        if (!item) return;

        // 如果是統一匯出，直接顯示版本選擇器
        if (format === 'unified') {
            this.showVersionSelector(item, type, 'json'); // 預設JSON格式
            return;
        }
        const isSingleMode = this.checkSingleEditMode(type, itemId);
        
    if (item.versions.length === 1 || isSingleMode) {
        const currentVersionId = this.getCurrentVersionId(type, itemId);
        const currentVersion = currentVersionId ? 
            item.versions.find(v => v.id === currentVersionId) : 
            item.versions[0];
        this.downloadItemWithFilename(item, currentVersion, type, format, 
            this.generateFilename(item.name, currentVersion.name, format, false), false);
    }
}

    //匯出完整備份
    static exportAllData() {
        const exportData = {
        // 所有資料
        characters: characters,
        customSections: customSections,
        worldBooks: worldBooks,
        userPersonas: userPersonas,
        loveyDoveyCharacters: loveyDoveyCharacters,
        
        // 所有設定
        settings: {
            // 主題設定
            customThemes: localStorage.getItem('characterCreator_customThemes'), 
            currentTheme: ThemeManager.currentThemeId, 
            customColors: localStorage.getItem('characterCreatorCustomColors'), 
            
            // 其他設定
            otherSettings: localStorage.getItem('characterCreator_otherSettings'), 
            
            // 排序和介面偏好
            sortPreference: localStorage.getItem('characterCreator-sortPreference'),
            selectedTags: localStorage.getItem('characterCreator-selectedTags')
        },
        
        // 元資料
        exportDate: new Date().toISOString(),
        version: '2.0.0' 
    };
    
    const filename = `chronicler_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
    FileDownloader.downloadJSON(exportData, filename);
}

    /**
     * 匯出玩家角色（對外接口）
     * @param {string} personaId - 玩家角色ID
     */
    static exportUserPersona(personaId) {
        this.export('userpersona', personaId, 'txt');
    }

    // ===== 內部輔助方法 =====
    
        // --- 介面相關 ---
    // 顯示版本多選介面
    static showVersionSelector(item, type, format) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        let currentVersionIds = [];
        
        // 檢查是否為當前項目類型
        const isCurrentMode = (currentMode === type);
        
        if (isCurrentMode) {
            if (viewMode === 'compare') {
                // 對比模式：使用 compareVersions 陣列
                currentVersionIds = [...compareVersions];
            } else {
                // 單版本模式：使用當前版本ID
                const currentVersionId = this.getCurrentVersionId(type, item.id);
                if (currentVersionId) {
                    currentVersionIds = [currentVersionId];
                }
            }
        }
        
        const versionListHTML = this.generateVersionCheckboxes(item.versions, currentVersionIds);
        
        modal.innerHTML = `
            <div class="compact-modal-content" style="max-width: 580px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        ${IconManager.download({width: 18, height: 18})}
                        <h3 class="compact-modal-title">${t('exportItem', this.getItemTypeName(type))}</h3>
                    </div>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; padding: 0px;">
                    <!-- 版本選擇 -->
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; margin-bottom: 12px;">
                            ${IconManager.edit({width: 14, height: 14})}
                            <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectVersionsToExport')}</h4>
                        </div>
                        <div style="background: var(--header-bg); border: 0px solid var(--border-color); border-radius: 6px; padding: 12px; max-height: 50vh; overflow-y: auto;">
                            ${versionListHTML}
                            
                        <!-- 全選選項 -->
                        <div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <div style="margin-bottom: 4px;">
                                <label style="display: flex; align-items: center; gap: 8px; padding: 0px 8px 0px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; font-size: 0.85em; color: var(--text-color);"
                                    onmouseover="this.style.backgroundColor='var(--header-bg)'" 
                                    onmouseout="this.style.backgroundColor='transparent'">
                                    <input type="checkbox" id="select-all-versions">
                                    <span>${t('selectAll')}</span>
                                </label>
                            </div>
                        </div>
                        </div>
                    </div>
                    
                <!-- 格式選擇 -->
                ${this.generateFormatOptions(type)}
                    
                    <!-- 檔名設定 -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            ${IconManager.settings({width: 14, height: 14})}
                            <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('filenameSettings')}</h4>
                        </div>
                        
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 0px; cursor: pointer;">
                            <input type="checkbox" id="include-version-name">
                            <span style="font-size: 0.9em;">${t('includeVersionInFilename')}</span>
                        </label>
                        
                        <!-- 批量匯出說明 -->
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 4px;">
                        ${t('batchExportNote')}
                        </div>
                    </div>
                </div>
                
                
                <div class="compact-modal-footer">
                    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                    <button class="overview-btn btn-primary" onclick="ExportManager.processExport('${item.id}', '${type}')">${t('export')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupVersionSelectionListener();
    }


    // 根據類型生成格式選項
    static generateFormatOptions(type) {
        if (type === 'character') {
            // 角色卡支援 JSON + PNG + Markdown
return `
    <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            ${IconManager.file({width: 14, height: 14})}
            <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectExportFormat')}</h4>
        </div>
        
        <div style="display: flex; gap: 8px;">
            <label id="format-json" class="version-checkbox selected" style="flex: 1;">
                <input type="radio" name="export-format" value="json" checked onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                    ${IconManager.file({width: 16, height: 16})}
                    JSON
                </div>
            </label>
            
            <label id="format-png" class="version-checkbox" style="flex: 1;">
                <input type="radio" name="export-format" value="png" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                    ${IconManager.image({width: 16, height: 16})}
                    PNG
                </div>
            </label>
            
            <label id="format-md" class="version-checkbox" style="flex: 1;">
                <input type="radio" name="export-format" value="markdown" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                    ${IconManager.file({width: 16, height: 16})}
                    Markdown
                </div>
            </label>
        </div>
    </div>
`;
        } else if (type === 'worldbook') {
           // 世界書支援 JSON + Markdown
return `
    <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            ${IconManager.file({width: 14, height: 14})}
            <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectExportFormat')}</h4>
        </div>
        
        <div style="display: flex; gap: 12px;">
            <label id="format-json" class="version-checkbox selected" style="flex: 1;">
                <input type="radio" name="export-format" value="json" checked onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                    ${IconManager.file({width: 16, height: 16})}
                    JSON (SillyTavern)
                </div>
            </label>
            
            <label id="format-md" class="version-checkbox" style="flex: 1;">
                <input type="radio" name="export-format" value="markdown" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                    ${IconManager.file({width: 16, height: 16})}
                    Markdown
                </div>
            </label>
        </div>
    </div>
`;
        } else if (type === 'custom') {
        // 筆記支援 TXT + Markdown
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    ${IconManager.file({width: 14, height: 14})}
                    <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectExportFormat')}</h4>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <label id="format-txt" class="version-checkbox selected" style="flex: 1;">
                        <input type="radio" name="export-format" value="txt" checked onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.file({width: 16, height: 16})}
                            TXT
                        </div>
                    </label>
                    
                    <label id="format-md" class="version-checkbox" style="flex: 1;">
                        <input type="radio" name="export-format" value="markdown" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.file({width: 16, height: 16})}
                            Markdown
                        </div>
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'userpersona') {
        // 玩家角色支援 TXT + Markdown
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    ${IconManager.file({width: 14, height: 14})}
                    <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectExportFormat')}</h4>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <label id="format-txt" class="version-checkbox selected" style="flex: 1;">
                        <input type="radio" name="export-format" value="txt" checked onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.file({width: 16, height: 16})}
                            TXT
                        </div>
                    </label>
                    
                    <label id="format-md" class="version-checkbox" style="flex: 1;">
                        <input type="radio" name="export-format" value="markdown" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.file({width: 16, height: 16})}
                            Markdown
                        </div>
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'loveydovey') {
    // 卿卿我我角色支援 TXT + Markdown
    return `
        <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                ${IconManager.file({width: 14, height: 14})}
                <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('selectExportFormat')}</h4>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <label id="format-txt" class="version-checkbox selected" style="flex: 1;">
                    <input type="radio" name="export-format" value="txt" checked onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                        ${IconManager.file({width: 16, height: 16})}
                        TXT
                    </div>
                </label>
                
                <label id="format-md" class="version-checkbox" style="flex: 1;">
                    <input type="radio" name="export-format" value="markdown" onchange="ExportManager.updateFormatSelection(this)" style="margin: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                        ${IconManager.file({width: 16, height: 16})}
                        Markdown
                    </div>
                </label>
            </div>
        </div>
    `;
        }
    }


    // 生成版本選擇框
    static generateVersionCheckboxes(versions, currentVersionIds) {
        const currentIds = Array.isArray(currentVersionIds) ? currentVersionIds : [currentVersionIds];
        
        return versions.map((version, index) => {
            const isChecked = currentIds.includes(version.id);
            const isCurrent = currentIds.includes(version.id);
            
            
            
            return `
                <div style="margin-bottom: 4px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; font-size: 0.85em; color: var(--text-color);"
                        onmouseover="this.style.backgroundColor='var(--bg-color)'" 
                        onmouseout="this.style.backgroundColor='transparent'">
                        <input type="checkbox" value="${version.id}" class="version-checkbox" ${isChecked ? 'checked' : ''}>
                        <span>${version.name}</span>
                        <span style="font-size: 0.8em; color: var(--text-muted); display: flex; align-items: center;">
                            ${isCurrent ? t('currentVersion') : ''}
                        </span>
                    </label>
                </div>
            `;
        }).join('');
    }
     

    // 設置版本選擇變化監聽
    static setupVersionSelectionListener() {
        const versionCheckboxes = document.querySelectorAll('.version-checkbox');
        const includeVersionCheckbox = document.getElementById('include-version-name');
        const selectAllCheckbox = document.getElementById('select-all-versions');
        
        const updateUI = () => {
            const selectedCount = document.querySelectorAll('.version-checkbox:checked').length;
            
            if (selectedCount > 1) {
                includeVersionCheckbox.checked = true;
                includeVersionCheckbox.disabled = true;
            } else {
                includeVersionCheckbox.disabled = false;
            }
            
            const totalCount = versionCheckboxes.length;
            if (selectedCount === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (selectedCount === totalCount) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        };
        
        versionCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateUI);
        });
        
        selectAllCheckbox.addEventListener('change', () => {
            const shouldCheck = selectAllCheckbox.checked;
            versionCheckboxes.forEach(cb => {
                cb.checked = shouldCheck;
            });
            updateUI();
        });
        
        updateUI();
    }

    static updateFormatSelection(selectedInput) {
        const formatLabels = ['format-json', 'format-png', 'format-txt', 'format-md'];
        
        // 清除所有選中狀態
        formatLabels.forEach(labelId => {
            const label = document.getElementById(labelId);
            if (label) {
                label.classList.remove('selected');
            }
        });
        
        // 為選中的選項添加選中狀態
        const selectedFormat = selectedInput.value;
        let selectedLabelId;
        
        // 映射格式值到正確的ID
        switch(selectedFormat) {
            case 'json': selectedLabelId = 'format-json'; break;
            case 'png': selectedLabelId = 'format-png'; break;
            case 'txt': selectedLabelId = 'format-txt'; break;
            case 'markdown': selectedLabelId = 'format-md'; break;
            default: selectedLabelId = `format-${selectedFormat}`;
        }
        
        const selectedLabel = document.getElementById(selectedLabelId);
        if (selectedLabel) {
            selectedLabel.classList.add('selected');
        }
    }

    // --- 匯出流程控制 ---
    // 處理匯出請求
    static processExport(itemId, type) {
        const selectedCheckboxes = document.querySelectorAll('.version-checkbox:checked');
        const selectedVersionIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
            if (selectedVersionIds.length === 0) {
                NotificationManager.warning(t('pleaseSelectAtLeastOneVersion'));
                return;
            }

        
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const includeVersionName = document.getElementById('include-version-name').checked;
        
        const item = ItemManager.getItemsArray(type).find(i => i.id === itemId);
        if (!item) return;
        
        const selectedVersions = item.versions.filter(v => selectedVersionIds.includes(v.id));
        
        // 關閉選擇器
        document.querySelector('.modal').remove();
        
        // 開始匯出
        this.executeExport(item, selectedVersions, type, format, includeVersionName);
    }

    // 執行匯出
    static executeExport(item, versions, type, format, includeVersionName) {
        // 先檢查世界書綁定
        if (type === 'character') {
            this.checkWorldBookBinding(item, versions, type, format, includeVersionName);
        } else {
            // 非角色卡直接匯出
            this.performExport(item, versions, type, format, includeVersionName, false);
        }
    }

    // 實際執行匯出
    static performExport(item, versions, type, format, includeVersionName, includeWorldBook) {
        const isMultiple = versions.length > 1;
        
        versions.forEach((version, index) => {
            setTimeout(() => {
                // 生成檔名
                const filename = this.generateFilename(item.name, version.name, format, includeVersionName || isMultiple);
                
                // 匯出檔案
                this.downloadItemWithFilename(item, version, type, format, filename, includeWorldBook);
            }, index * 300);
        });
    }

    // --- 世界書綁定檢查 ---
    // 檢查世界書綁定
    static checkWorldBookBinding(item, versions, type, format, includeVersionName) {
        // 找出有綁定世界書的版本
        const boundVersions = versions.filter(version => 
            version.boundWorldBookId && version.boundWorldBookVersionId
        );
        
        if (boundVersions.length === 0) {
            // 沒有綁定，直接匯出
            this.performExport(item, versions, type, format, includeVersionName, false);
            return;
        }
        
        // 有綁定，詢問用戶
        this.showWorldBookBindingDialog(item, versions, boundVersions, type, format, includeVersionName);
    }

    // 顯示世界書綁定詢問對話框
    static showWorldBookBindingDialog(item, versions, boundVersions, type, format, includeVersionName) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        // 生成綁定清單
        const bindingList = boundVersions.map(version => {
            const worldBook = worldBooks.find(wb => wb.id === version.boundWorldBookId);
            const worldBookVersion = worldBook?.versions.find(v => v.id === version.boundWorldBookVersionId);
            const worldBookInfo = worldBook && worldBookVersion ? 
                `${worldBook.name} - ${worldBookVersion.name}` : t('unknownWorldBook');
            
            return `<li style="margin-bottom: 8px;">
                <strong>${version.name}</strong> → ${worldBookInfo}
            </li>`;
        }).join('');
        
        modal.innerHTML = `
            <div class="compact-modal-content" style="max-width: 550px;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <h3 class="compact-modal-title">${t('worldBookBindingConfirm')}</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <div style="padding: 20px;">
                    <p style="margin-bottom: 15px;">${t('followingVersionsHaveWorldBook')}</p>
                    
                    <ul style="background: var(--bg-color); padding: 15px; border-radius: 6px; margin: 15px 0; list-style: none;">
                        ${bindingList}
                    </ul>
                    
                    <p style="font-size: 0.9em; color: var(--text-muted);">
                        ${t('worldBookBindingExplanation')}
                    </p>
                </div>
                
                <div class="compact-modal-footer">
                    <button class="overview-btn hover-primary" 
                            onclick="ExportManager.finishExport('${item.id}', '${type}', '${format}', ${includeVersionName}, false)">
                        ${t('exportCharacterOnly')}
                    </button>
                    <button class="overview-btn btn-primary" 
                            onclick="ExportManager.finishExport('${item.id}', '${type}', '${format}', ${includeVersionName}, true)">
                        ${t('exportWithWorldBook')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 暫存資料供後續使用
        this._pendingExport = { item, versions, type, format, includeVersionName };
    }

    // 完成匯出（處理世界書綁定選擇）
    static finishExport(itemId, type, format, includeVersionName, includeWorldBook) {
        // 關閉對話框
        document.querySelector('.modal').remove();
        
        // 執行匯出
        const { item, versions } = this._pendingExport;
        this.performExport(item, versions, type, format, includeVersionName, includeWorldBook);
        
        // 清理暫存
        delete this._pendingExport;
    }

    // --- 檔案下載 ---
    static downloadItemWithFilename(item, version, type, format, filename, includeWorldBook = false) {
        if (type === 'character') {
            if (format === 'json') {
                const characterData = this.createCharacterData(item, version, includeWorldBook);
                this.downloadWithCustomFilename(characterData, filename, 'application/json');
            } else if (format === 'png') {
                this.exportCharacterPNGWithFilename(item, version, filename, includeWorldBook);
            } else if (format === 'markdown') {
                const content = this.createCharacterMarkdownContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/markdown; charset=utf-8');
            }
        } else if (type === 'worldbook') {
            if (format === 'json') {
                const worldBookData = this.createWorldBookData(item, version);
                this.downloadWithCustomFilename(worldBookData, filename, 'application/json');
            } else if (format === 'markdown') {
                const content = this.createWorldBookMarkdownContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/markdown; charset=utf-8');
            }
        } else if (type === 'custom') {
            if (format === 'txt') {
                const content = this.createCustomTXTContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/plain; charset=utf-8');
            } else if (format === 'markdown') {
                const content = this.createCustomMarkdownContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/markdown; charset=utf-8');
            }
        } else if (type === 'userpersona') { 
            if (format === 'txt') {
                const content = this.createUserPersonaTXTContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/plain; charset=utf-8');
            } else if (format === 'markdown') {
                const content = this.createUserPersonaMarkdownContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/markdown; charset=utf-8');
            }
        } else if (type === 'loveydovey') {
            if (format === 'txt') {
                const content = this.createLoveyDoveyTXTContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/plain; charset=utf-8');
            } else if (format === 'markdown') {
                const content = this.createLoveyDoveyMarkdownContent(item, version);
                this.downloadWithCustomFilename(content, filename, 'text/markdown; charset=utf-8');
            }
        }
    }

    // 自定義檔名下載
    static downloadWithCustomFilename(data, filename, mimeType) {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        FileDownloader.download(content, filename, mimeType);
    }

    // --- PNG 匯出 ---
    static exportCharacterPNGWithFilename(character, version, filename, includeWorldBook = false) {
        const characterData = this.createCharacterData(character, version, includeWorldBook);
        const jsonString = JSON.stringify(characterData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (version.avatar) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                PNGHelper.createPNGWithMetadataAndFilename(canvas, base64Data, filename);
            };
            img.src = BlobManager.getBlobUrl(version.avatar);
        } else {
            ExportManager.createDefaultCharacterImage(canvas, ctx, character.name);
            PNGHelper.createPNGWithMetadataAndFilename(canvas, base64Data, filename);
        }
    }

     // 創建預設角色圖片
    static createDefaultCharacterImage(canvas, ctx, characterName) {
        canvas.width = 400;
        canvas.height = 600;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#f7f5f3');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 600);
        
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 24px "Noto Serif CJK JP", serif';
        ctx.textAlign = 'center';
        ctx.fillText(characterName, 200, 300);
        
        ctx.font = '16px "Noto Serif CJK JP", serif';
        ctx.fillStyle = '#718096';
        ctx.fillText('Character Card', 200, 330);
    }

    // --- 資料格式創建 ---
     // 創建角色資料結構
    static createCharacterData(character, version, includeWorldBook = false) {
const alternateGreetings = version.alternateGreetings || [];
const hasAlternateGreetings = alternateGreetings.length > 0;
const specVersion = hasAlternateGreetings ? "3.0" : "2.0";
const spec = hasAlternateGreetings ? "chara_card_v3" : "chara_card_v2";

const characterData = {
    name: character.name,
    description: version.description,
    personality: version.personality,
    scenario: version.scenario,
    first_mes: version.firstMessage,
    mes_example: version.dialogue,
    creatorcomment: version.creatorNotes,
    avatar: "none",
    talkativeness: "0.5",
    fav: false,
    tags: version.tags ? version.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    spec: spec,
    spec_version: specVersion,
    data: {
        name: character.name,
        description: version.description,
        personality: version.personality,
        scenario: version.scenario,
        first_mes: version.firstMessage,
        mes_example: version.dialogue,
        creator_notes: version.creatorNotes,
        system_prompt: "",
        post_history_instructions: "",
        tags: version.tags ? version.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        creator: version.creator,
        character_version: version.charVersion,
        alternate_greetings: alternateGreetings,
        extensions: {
            talkativeness: "0.5",
            fav: false,
            world: "",
            depth_prompt: {
                prompt: "",
                depth: 4,
                role: "system"
            }
        },
        group_only_greetings: []
    },
    create_date: new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-').replace(',', ' @').replace(/:/g, 'h ').replace(/(\d+)$/, '$1s') + ' ' + new Date().getMilliseconds() + 'ms'
};

        // 世界書綁定功能
        try {
            if (version.boundWorldBookId && version.boundWorldBookVersionId) {
                const boundWorldBook = worldBooks.find(wb => wb.id === version.boundWorldBookId);
                if (boundWorldBook) {
                    const boundVersion = boundWorldBook.versions.find(v => v.id === version.boundWorldBookVersionId);
                    if (boundVersion) {
                        characterData.data.character_book = this.convertWorldBookToCharacterBook(boundWorldBook, boundVersion);
                        
                    }
                }
            }
        } catch (error) {
            console.warn('世界書綁定失敗，但不影響角色匯出:', error);
        }

        return characterData;
    }

    // 創建世界書資料結構
    static createWorldBookData(worldBook, version) {
        const exportData = {
            name: worldBook.name,
            description: worldBook.description || '',
            entries: {}
        };

        // 轉換為 SillyTavern 格式
        version.entries.forEach((entry, index) => {
            const baseExport = {
                uid: index,
                key: entry.key,
                keysecondary: entry.keysecondary,
                comment: entry.comment,
                content: entry.content,
                constant: entry.constant,
                vectorized: entry.vectorized || false,
                selective: entry.selective,
                selectiveLogic: entry.selectiveLogic || 0,
                addMemo: entry.addMemo !== false,
                order: entry.order || 100,
                position: entry.position || 0,
                disable: entry.disable || false,
                excludeRecursion: entry.excludeRecursion || false,
                preventRecursion: entry.preventRecursion || false,
                matchPersonaDescription: entry.matchPersonaDescription || false,
                matchCharacterDescription: entry.matchCharacterDescription || false,
                matchCharacterPersonality: entry.matchCharacterPersonality || false,
                matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt || false,
                matchScenario: entry.matchScenario || false,
                matchCreatorNotes: entry.matchCreatorNotes || false,
                delayUntilRecursion: entry.delayUntilRecursion || 0,
                probability: entry.probability !== undefined ? entry.probability : 100,
                useProbability: entry.useProbability || false,
                depth: entry.depth || 4,
                group: entry.group || '',
                groupOverride: entry.groupOverride || false,
                groupWeight: entry.groupWeight || 100,
                scanDepth: entry.scanDepth || null,
                caseSensitive: entry.caseSensitive !== undefined ? entry.caseSensitive : null,
                matchWholeWords: entry.matchWholeWords !== undefined ? entry.matchWholeWords : null,
                useGroupScoring: entry.useGroupScoring !== undefined ? entry.useGroupScoring : null,
                automationId: entry.automationId || '',
                role: entry.role || null, 
                sticky: entry.sticky || 0,
                cooldown: entry.cooldown || 0,
                delay: entry.delay || 0,
                matchPersonaDescription: entry.matchPersonaDescription || false,
                matchCharacterDescription: entry.matchCharacterDescription || false,
                matchCharacterPersonality: entry.matchCharacterPersonality || false,
                matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt || false,
                matchScenario: entry.matchScenario || false,
                matchCreatorNotes: entry.matchCreatorNotes || false,
                triggers: Array.isArray(entry.triggers) ? [...entry.triggers] : [],
                displayIndex: index
            };
            
            // 添加額外屬性（排除編輯器專用屬性）
            const knownKeys = new Set([...Object.keys(baseExport), 'id']);
            const extraProperties = {};
            Object.keys(entry).forEach(key => {
                if (!knownKeys.has(key)) {
                    extraProperties[key] = entry[key];
                }
            });
            
            exportData.entries[index.toString()] = { ...baseExport, ...extraProperties };
        });

        return exportData;
    }

    // 創建筆記TXT內容
    static createCustomTXTContent(section, version) {
        let content = `${section.name} - ${version.name}\n`;
        content += `${'='.repeat(content.length - 1)}\n\n`;
        
        version.fields.forEach(field => {
            if (field.content.trim()) {
                content += `${field.name}:\n`;
                content += `${'-'.repeat(field.name.length + 1)}\n`;
                content += `${field.content.trim()}\n\n`;
            }
        });
        
        // 添加統計資訊
        const allText = version.fields.map(field => field.content).filter(Boolean).join(' ');
        const chars = allText.length;
        const tokens = countTokens(allText);
        content += `${t('statisticsInfo')}：\n`;
        content += `${t('charCount')}：${chars}\n`;
        content += `${t('tokenCount')}：${tokens}\n`;
        content += `${t('exportTime')}：${new Date().toLocaleString()}\n`;

        return content;
    }

    // 創建筆記Markdown內容
    static createCustomMarkdownContent(section, version) {
        let content = `# ${section.name} - ${version.name}\n\n`;
        
        version.fields.forEach(field => {
            if (field.content.trim()) {
                content += `## ${field.name}\n\n`;
                content += `${field.content.trim()}\n\n`;
            }
        });
        
        // 添加統計資訊
        const allText = version.fields.map(field => field.content).filter(Boolean).join(' ');
        const chars = allText.length;
        const tokens = countTokens(allText);
        content += `---\n\n`;
        content += `### ${t('statisticsInfo')}\n\n`;
        content += `- **${t('charCount')}**：${chars}\n`;
        content += `- **${t('tokenCount')}**：${tokens}\n`;
        content += `- **${t('exportTime')}**：${new Date().toLocaleString()}\n`;

        return content;
    }


    // 創建玩家角色TXT內容
    static createUserPersonaTXTContent(persona, version) {
        let content = `${persona.name}\n`;
        content += `${'='.repeat(persona.name.length)}\n\n`;
        
        if (version.description && version.description.trim()) {
            content += `${t('description')}:\n`;
            content += `${version.description.trim()}\n\n`;
        }
        
        if (version.tags && version.tags.trim()) {
            const tags = version.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tags.length > 0) {
                content += `${t('tags')}:\n`;
                content += `${tags.join(', ')}\n\n`;
            }
        }
        
        // 添加統計資訊
        const chars = version.description ? version.description.length : 0;
        const tokens = countTokens(version.description || '');
content += `${t('statisticsInfo')}：\n`;
content += `${t('charCount')}：${chars}\n`;
content += `${t('tokenCount')}：${tokens}\n`;
content += `${t('exportTime')}：${new Date().toLocaleString()}\n`;

        return content;
    }

    // 創建玩家角色Markdown內容
    static createUserPersonaMarkdownContent(persona, version) {
        let content = `# ${persona.name}\n\n`;
        
        if (version.description && version.description.trim()) {
            content += `## ${t('description')}\n\n`;
            content += `${version.description.trim()}\n\n`;
        }
        
        if (version.tags && version.tags.trim()) {
            const tags = version.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tags.length > 0) {
                content += `## ${t('tags')}\n\n`;
                content += tags.map(tag => `- ${tag}`).join('\n') + '\n\n';
            }
        }
        
        // 添加統計資訊
        const chars = version.description ? version.description.length : 0;
        const tokens = countTokens(version.description || '');
        content += `---\n\n`;
content += `### ${t('statisticsInfo')}\n\n`;
content += `- **${t('charCount')}**：${chars}\n`;
content += `- **${t('tokenCount')}**：${tokens}\n`;
content += `- **${t('exportTime')}**：${new Date().toLocaleString()}\n`;


        return content;
    }

    // 創建卿卿我我角色TXT內容
    static createLoveyDoveyTXTContent(character, version) {
        let content = `${character.name}\n`;
        content += `${'='.repeat(character.name.length)}\n\n`;

        // === 第一大區：個人資料 ===
       if (version.characterName?.trim()) content += `${t('characterName')}：${version.characterName.trim()}\n`;
        if (version.age?.trim()) content += `${t('age')}：${version.age.trim()}\n`;
        if (version.occupation?.trim()) content += `${t('occupation')}：${version.occupation.trim()}\n`;

        
        // 空一行分隔
        if (version.characterName?.trim() || version.age?.trim() || version.occupation?.trim()) {
            content += `\n`;
        }
        
        if (version.characterQuote?.trim()) {
           content += `${t('characterQuote')}：\n${version.characterQuote.trim()}\n\n`;
        }
        if (version.publicDescription?.trim()) {
            content += `${t('publicDescription')}：\n${version.publicDescription.trim()}\n\n`;
        }
        if (version.tags?.trim()) {
            const tags = version.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            if (tags.length > 0) {
                content += `${t('tags')}：\n${tags.join(', ')}\n\n`;
            }
        }
        if (version.characterLinkUrl?.trim()) {
            content += `${t('characterLinkUrl')}：\n${version.characterLinkUrl.trim()}\n\n`;
        }
        
        // === 第二大區：角色基本設定 ===
        if (version.gender && version.gender !== 'unset') {
            const genderText = version.gender === 'male' ? t('male') : t('female');
            content += `${t('gender')}：${genderText}\n\n`;
        }
        if (version.basicInfo?.trim()) {
            content += `${t('basicInfo')}：\n${version.basicInfo.trim()}\n\n`;
        }
        if (version.personality?.trim()) {
            content += `${t('personality')}：\n${version.personality.trim()}\n\n`;
        }
        if (version.speakingStyle?.trim()) {
            content += `${t('speakingStyle')}：\n${version.speakingStyle.trim()}\n\n`;
        }

        // === 第三大區：第一次聊天場景 ===
        if (version.scenarioScript?.trim()) {
    content += `${t('scenarioScript')}：\n${version.scenarioScript.trim()}\n\n`;
        }
        if (version.characterDialogue?.trim()) {
            content += `${t('characterDialogue')}：\n${version.characterDialogue.trim()}\n\n`;
        }

        // === 第四大區：角色詳細設定 ===
if (version.likes?.trim()) content += `${t('likes')}：${version.likes.trim()}\n`;
if (version.dislikes?.trim()) content += `${t('dislikes')}：${version.dislikes.trim()}\n`;
        if (version.likes?.trim() || version.dislikes?.trim()) content += `\n`;

        if (version.additionalInfo?.length > 0) {
            const validInfo = version.additionalInfo.filter(info => info.title?.trim() || info.content?.trim());
            if (validInfo.length > 0) {
                content += `${t('additionalInfo')}：\n`;
                validInfo.forEach((info, index) => {
                    content += `${index + 1}. ${info.title || t('unnamedItem')}\n`;
                    if (info.content?.trim()) {
                        content += `   ${info.content.trim()}\n`;
                    }
                    content += `\n`;
                });
            }
        }

        // === 第五大區：創作者事件 ===
        if (version.creatorEvents?.length > 0) {
            const validEvents = version.creatorEvents.filter(event => event.title?.trim() || event.content?.trim() || event.timeAndPlace?.trim());
            if (validEvents.length > 0) {
                content += `${t('creatorEvents')}：\n`;
                validEvents.forEach((event, index) => {
                    const secretMark = event.isSecret ? t('secretMark') : '';
                    content += `${index + 1}. ${event.title || t('unnamedEvent')}${secretMark}\n`;
                    if (event.timeAndPlace?.trim()) content += `   ${t('timeAndPlace')}：${event.timeAndPlace.trim()}\n`;
                    if (event.content?.trim()) content += `   ${event.content.trim()}\n`;
                    content += `\n`;
                });
            }
        }

        // === 統計資訊 ===
        const allText = [
            version.publicDescription, version.basicInfo, version.personality,
            version.speakingStyle, version.scenarioScript, version.characterDialogue,
            ...(version.additionalInfo || []).map(info => info.content),
            ...(version.creatorEvents || []).map(event => event.content)
        ].filter(Boolean).join(' ');
        
        const chars = allText.length;
        const tokens = countTokens(allText);
content += `${t('statisticsInfo')}：\n`;
content += `${t('charCount')}：${chars}\n`;
content += `${t('tokenCount')}：${tokens}\n`;
content += `${t('exportTime')}：${new Date().toLocaleString()}\n`;

        return content;
    }

    // 創建卿卿我我角色Markdown內容 
static createLoveyDoveyMarkdownContent(character, version) {
    let content = `# ${character.name}\n\n`;

    // === 第一大區：個人資料 ===
    let personalProfileContent = '';
    if (version.characterName?.trim()) personalProfileContent += `${t('characterName')}：${version.characterName.trim()}\n`;
    if (version.age?.trim()) personalProfileContent += `${t('age')}：${version.age.trim()}\n`;
    if (version.occupation?.trim()) personalProfileContent += `${t('occupation')}：${version.occupation.trim()}\n`;

    if (personalProfileContent) {
        content += `## ${t('profileSection')}\n\n${personalProfileContent}\n`;
    }

    if (version.characterQuote?.trim()) {
        content += `## ${t('characterQuote')}\n\n${version.characterQuote.trim()}\n\n`;
    }
    if (version.publicDescription?.trim()) {
        content += `## ${t('publicDescription')}\n\n${version.publicDescription.trim()}\n\n`;
    }
    if (version.tags?.trim()) {
        const tags = version.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
            content += `## ${t('tags')}\n\n${tags.join(', ')}\n\n`;
        }
    }
    
    if (version.characterLinkUrl?.trim()) {
        content += `## ${t('characterLinkUrl')}\n\n[${version.characterLinkUrl.trim()}](${version.characterLinkUrl.trim()})\n\n`;
    }

    // === 第二大區：角色基本設定 ===
    let basicSettingsContent = '';
    if (version.gender && version.gender !== 'unset') {
        const genderText = version.gender === 'male' ? t('male') : t('female');
        basicSettingsContent += `${t('gender')}：${genderText}\n\n`;
    }
    if (basicSettingsContent) {
         content += `## ${t('basicSettingsSection')}\n\n${basicSettingsContent}`;
    }
    if (version.basicInfo?.trim()) {
        content += `### ${t('basicInfo')}\n\n${version.basicInfo.trim()}\n\n`;
    }
    if (version.personality?.trim()) {
        content += `### ${t('personality')}\n\n${version.personality.trim()}\n\n`;
    }
    if (version.speakingStyle?.trim()) {
        content += `### ${t('speakingStyle')}\n\n${version.speakingStyle.trim()}\n\n`;
    }

    // === 第三大區：第一次聊天場景 ===
    if (version.scenarioScript?.trim() || version.characterDialogue?.trim()) {
        content += `## ${t('firstChatScenario')}\n\n`;
        if (version.scenarioScript?.trim()) content += `### ${t('scenarioScript')}\n\n${version.scenarioScript.trim()}\n\n`;
        if (version.characterDialogue?.trim()) content += `### ${t('characterDialogue')}\n\n${version.characterDialogue.trim()}\n\n`;
    }
    
    // === 第四大區：角色詳細設定 ===
    let detailedSettingsContent = '';
    if (version.likes?.trim()) detailedSettingsContent += `${t('likes')}：${version.likes.trim()}\n`;
    if (version.dislikes?.trim()) detailedSettingsContent += `${t('dislikes')}：${version.dislikes.trim()}\n`;
    
    if(detailedSettingsContent) {
        content += `## ${t('detailSettingsSection')}\n\n${detailedSettingsContent}\n`;
    }

    if (version.additionalInfo?.length > 0) {
        const validInfo = version.additionalInfo.filter(info => info.title?.trim() || info.content?.trim());
        if (validInfo.length > 0) {
            content += `### ${t('additionalInfo')}\n\n`;
            validInfo.forEach((info) => {
                content += `**${info.title || t('unnamedItem')}**\n\n`;
                if (info.content?.trim()) content += `${info.content.trim()}\n\n`;
            });
        }
    }

    // === 第五大區：創作者事件 ===
    if (version.creatorEvents?.length > 0) {
        const validEvents = version.creatorEvents.filter(event => event.title?.trim() || event.content?.trim() || event.timeAndPlace?.trim());
        if (validEvents.length > 0) {
            content += `## ${t('creatorEventsSection')}\n\n`;
            validEvents.forEach((event) => {
                const secretMark = event.isSecret ? ' 🔒' : '';
                content += `### ${event.title || t('unnamedEvent')}${secretMark}\n\n`;
                if (event.timeAndPlace?.trim()) content += `**${t('timeAndPlace')}**：${event.timeAndPlace.trim()}\n\n`;
                if (event.content?.trim()) content += `${event.content.trim()}\n\n`;
            });
        }
    }

    // === 統計資訊 ===
    const allText = [
        version.publicDescription, version.basicInfo, version.personality,
        version.speakingStyle, version.scenarioScript, version.characterDialogue,
        ...(version.additionalInfo || []).map(info => info.content),
        ...(version.creatorEvents || []).map(event => event.content)
    ].filter(Boolean).join(' ');
    
    const chars = allText.length;
    const tokens = countTokens(allText);
    content += `---\n\n`;
    content += `### ${t('statisticsInfo')}\n\n`;
    content += `- **${t('charCount')}**：${chars}\n`;
    content += `- **${t('tokenCount')}**：${tokens}\n`;
    content += `- **${t('exportTime')}**：${new Date().toLocaleString()}\n`;

    return content;
}

// 創建角色卡Markdown內容
static createCharacterMarkdownContent(character, version) {
    let content = `# ${character.name}\n\n`;
    
    // 創作者資訊區塊
    let creatorInfoContent = '';
    if (version.creator?.trim()) creatorInfoContent += `**${t('creator')}**：${version.creator.trim()}\n\n`;
    if (version.charVersion?.trim()) creatorInfoContent += `**${t('charVersion')}**：${version.charVersion.trim()}\n\n`;
    
    if (creatorInfoContent) {
        content += `## ${t('creator')}\n\n${creatorInfoContent}`;
    }
    
    // 標籤
    if (version.tags?.trim()) {
        const tags = version.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
            content += `## ${t('tags')}\n\n${tags.join(', ')}\n\n`;
        }
    }
    
    // 角色描述
    if (version.description?.trim()) {
        content += `## ${t('description')}\n\n${version.description.trim()}\n\n`;
    }
    
    // 個性摘要
    if (version.personality?.trim()) {
        content += `## ${t('personality')}\n\n${version.personality.trim()}\n\n`;
    }
    
    // 場景設想
    if (version.scenario?.trim()) {
        content += `## ${t('scenario')}\n\n${version.scenario.trim()}\n\n`;
    }
    
    // 初始訊息
    if (version.firstMessage?.trim()) {
        content += `## ${t('firstMessage')}\n\n${version.firstMessage.trim()}\n\n`;
    }
    
    // 額外問候語
    if (version.alternateGreetings && version.alternateGreetings.length > 0) {
        const validGreetings = version.alternateGreetings.filter(greeting => greeting?.trim());
        if (validGreetings.length > 0) {
            content += `## ${t('alternateGreetings')}\n\n`;
            validGreetings.forEach((greeting, index) => {
                content += `### ${t('alternateGreeting')} ${index + 1}\n\n${greeting.trim()}\n\n`;
            });
        }
    }
    
    // 對話範例
    if (version.dialogue?.trim()) {
        content += `## ${t('dialogue')}\n\n\`\`\`\n${version.dialogue.trim()}\n\`\`\`\n\n`;
    }
    
    // 創作者備註
    if (version.creatorNotes?.trim()) {
        content += `## ${t('creatorNotes')}\n\n${version.creatorNotes.trim()}\n\n`;
    }
    
    // 統計資訊
    const allText = [
        version.description, version.personality, version.scenario,
        version.firstMessage, version.dialogue, version.creatorNotes,
        ...(version.alternateGreetings || [])
    ].filter(Boolean).join(' ');
    
    const chars = allText.length;
    const tokens = countTokens(allText);
    content += `---\n\n`;
    content += `### ${t('statisticsInfo')}\n\n`;
    content += `- **${t('charCount')}**：${chars}\n`;
    content += `- **${t('tokenCount')}**：${tokens}\n`;
    content += `- **${t('exportTime')}**：${new Date().toLocaleString()}\n`;

    return content;
}

// 創建世界書Markdown內容
static createWorldBookMarkdownContent(worldBook, version) {
    let content = `# ${worldBook.name}\n\n`;
    
    if (worldBook.description?.trim()) {
        content += `${worldBook.description.trim()}\n\n`;
    }
    
    content += `---\n\n`;
    
    if (version.entries && version.entries.length > 0) {
        version.entries.forEach((entry, index) => {
            // 條目標題，包含UID
            const entryTitle = entry.comment?.trim() || `${t('entryName')} ${index + 1}`;
            const uid = entry.uid !== undefined ? ` (UID: ${entry.uid})` : '';
            content += `## ${entryTitle}${uid}\n\n`;
            
            // 主要關鍵字
            if (entry.key && entry.key.length > 0) {
                const keywords = entry.key.filter(k => k?.trim()).join(', ');
                if (keywords) {
                    content += `**${t('primaryKeywords')}**：${keywords}\n\n`;
                }
            }
            
            // 選填過濾器（次要關鍵字）
            if (entry.keysecondary && entry.keysecondary.length > 0) {
                const secondaryKeys = entry.keysecondary.filter(k => k?.trim()).join(', ');
                if (secondaryKeys) {
                    content += `**${t('secondaryFilters')}**：${secondaryKeys}\n\n`;
                }
            }
            
            // 內容
            if (entry.content?.trim()) {
                content += `**${t('entryContent')}**：\n\n${entry.content.trim()}\n\n`;
            }
            
            content += `---\n\n`;
        });
    } else {
        content += `${t('noEntries')}\n\n`;
    }
    
    // 統計資訊
    const allText = version.entries ? 
        version.entries.map(entry => entry.content).filter(Boolean).join(' ') : '';
    const chars = allText.length;
    const tokens = countTokens(allText);
    content += `### ${t('statisticsInfo')}\n\n`;
    content += `- **${t('charCount')}**：${chars}\n`;
    content += `- **${t('tokenCount')}**：${tokens}\n`;
    content += `- **${t('exportTime')}**：${new Date().toLocaleString()}\n`;

    return content;
}

    // --- 格式轉換 ---
    // 轉換世界書為角色世界書格式
    static convertWorldBookToCharacterBook(worldBook, version) {
        return {
            name: worldBook.name,
            entries: version.entries.map((entry, index) => ({
                id: entry.uid !== undefined ? entry.uid : index,
                keys: Array.isArray(entry.key) ? entry.key : [],
                secondary_keys: Array.isArray(entry.keysecondary) ? entry.keysecondary : [],
                comment: entry.comment || '',
                content: entry.content || '',
                constant: entry.constant || false,
                selective: entry.selective !== false,
                insertion_order: entry.order || 100,
                enabled: !entry.disable,
                position: this.convertPositionToLegacy(entry.position),
                use_regex: true,
                extensions: {
                    position: entry.position || 1,
                    exclude_recursion: entry.excludeRecursion || false,
                    display_index: entry.displayIndex !== undefined ? entry.displayIndex : index,
                    probability: entry.probability || 100,
                    useProbability: entry.useProbability || false,
                    depth: entry.depth || 4,
                    selectiveLogic: entry.selectiveLogic || 0,
                    group: entry.group || '',
                    group_override: entry.groupOverride || false,
                    group_weight: entry.groupWeight || 100,
                    prevent_recursion: entry.preventRecursion || false,
                    delay_until_recursion: entry.delayUntilRecursion || false,
                    scan_depth: entry.scanDepth || null,
                    match_whole_words: entry.matchWholeWords || null,
                    use_group_scoring: entry.useGroupScoring || null,
                    case_sensitive: entry.caseSensitive || null,
                    automation_id: entry.automationId || '',
                    role: entry.role || 0,
                    vectorized: entry.vectorized || false,
                    sticky: entry.sticky || 0,
                    cooldown: entry.cooldown || 0,
                    delay: entry.delay || 0,
                    match_persona_description: entry.matchPersonaDescription || false,
                    match_character_description: entry.matchCharacterDescription || false,
                    match_character_personality: entry.matchCharacterPersonality || false,
                    match_character_depth_prompt: entry.matchCharacterDepthPrompt || false,
                    match_scenario: entry.matchScenario || false,
                    match_creator_notes: entry.matchCreatorNotes || false
                }
            }))
        };
    }

    // 轉換位置格式（數字轉文字）
    static convertPositionToLegacy(position) {
        const positionMap = {
            0: 'before_char',
            1: 'after_char',
            2: 'top_an', 
            3: 'bottom_an',
            4: 'at_depth'
        };
        return positionMap[position] || 'after_char';
    }

    // --- 工具方法 ---
    // 檢查是否為單版本編輯模式
    static checkSingleEditMode(type, itemId) {
        if (type === 'character') {
            return currentMode === 'character' && 
                currentCharacterId === itemId && 
                viewMode === 'single';
        } else if (type === 'worldbook') {
            return currentMode === 'worldbook' && 
                currentWorldBookId === itemId && 
                viewMode === 'single';
        } else if (type === 'custom') {
            return currentMode === 'custom' && 
                currentCustomSectionId === itemId && 
                viewMode === 'single';
        } else if (type === 'userpersona') {
            return currentMode === 'userpersona' && 
                currentUserPersonaId === itemId && 
                viewMode === 'single';
        } else if (type === 'loveydovey') { 
            return currentMode === 'loveydovey' && 
                currentLoveyDoveyId === itemId && 
                viewMode === 'single';
        }
        return false;
    }

    // 獲取當前編輯版本ID
    static getCurrentVersionId(type, itemId) {
        if (type === 'character' && currentCharacterId === itemId) {
            return currentVersionId;
        } else if (type === 'worldbook' && currentWorldBookId === itemId) {
            return currentWorldBookVersionId;
        } else if (type === 'custom' && currentCustomSectionId === itemId) {
            return currentCustomVersionId;
        } else if (type === 'userpersona' && currentUserPersonaId === itemId) {
            return currentUserPersonaVersionId;
        } else if (type === 'loveydovey' && currentLoveyDoveyId === itemId) {
            return currentLoveyDoveyVersionId;
        }
        return null;
    }

    // 獲取項目類型名稱
    static getItemTypeName(type) {
        switch (type) {
            case 'character': return t('character');
            case 'userpersona': return t('userPersona');
            case 'loveydovey': return t('loveydovey');
            case 'worldbook': return t('worldBook');
            case 'custom': return t('customFields');
            default: return t('item');
        }
    }

    // 生成檔名
    static generateFilename(itemName, versionName, format, includeVersion) {
        let extension;
        
        // 🔧 修復：添加所有支援的格式
        switch(format) {
            case 'json': extension = '.json'; break;
            case 'png': extension = '.png'; break;
            case 'txt': extension = '.txt'; break;
            case 'markdown': extension = '.md'; break; 
            default: extension = '.json'; // 預設
        }
        
        if (includeVersion) {
            return `${itemName}_${versionName}${extension}`;
        } else {
            return `${itemName}${extension}`;
        }
    }

}


// ===== 匯入管理器 (高層) =====
class ImportManager {
    // ===== 公開 API =====
    
    /**
     * 統一匯入入口
     * @param {File} file - 使用者選擇的檔案
     * @param {'character'|'worldbook'|'all'} targetType - 目標類型
     * @returns {Promise<boolean>} - 是否匯入成功
     */
    static async handleImport(file, targetType) {
        const fileType = FileHandler.detectFileType(file);
        
        if (!fileType) {
            NotificationManager.error(t('pleaseSelectJSONOrPNG'));
            return false;
        }
        
        try {
            if (targetType === 'character') {
                return await this.handleCharacterImport(file, fileType);
            } else if (targetType === 'worldbook') {
                return await this.handleWorldBookImport(file, fileType);
            } else if (targetType === 'all') {
                return await this.handleAllDataImport(file, fileType);
            }
        } catch (error) {
            NotificationManager.error(t('importFailed', error.message));
            return false;
        }
    }

    // ===== 角色匯入 =====
    static async handleCharacterImport(file, fileType) {
        try {
            let data;
            
            if (fileType === 'json') {
                const textContent = await FileHandler.readFile(file, 'text');
                data = JSON.parse(textContent);

            // 檢查是否為世界書檔案
            if (data.entries && typeof data.entries === 'object' && !data.personality && !data.first_mes) {
                NotificationManager.error(t('worldBookNotCharacterCard'));
                return false;
            }

            
            // 檢查是否為角色卡檔案
            if (!data.name && !data.data?.name && !data.description && !data.data?.description) {
                NotificationManager.error(t('invalidCharacterCardFile'));
                return false;
            }
        
            } else if (fileType === 'png') {
                const arrayBuffer = await FileHandler.readFile(file, 'arrayBuffer');
                const charaData = PNGHelper.extractCharaFromPNG(new Uint8Array(arrayBuffer));

                
                if (!charaData) {
                    NotificationManager.error(t('noPNGCharacterData'));
                    return false;
                }
                
                const jsonString = atob(charaData);
                data = JSON.parse(decodeURIComponent(escape(jsonString)));
                
                // 為PNG檔案添加頭像
                const imageBlob = new Blob([arrayBuffer], { type: 'image/png' });
                data.avatar = await FileHandler.blobToBase64(imageBlob);
            }
            
            // 檢查是否包含世界書
            const hasCharacterBook = data.data?.character_book && 
                                    data.data.character_book.entries && 
                                    data.data.character_book.entries.length > 0;
            
            if (hasCharacterBook) {
                // 先匯入角色
                this.importCharacterFromData(data);
                
                // 然後詢問是否要匯入世界書
                const worldBookName = data.data.character_book.name || t('characterWorldBookName', data.name);
                const entryCount = data.data.character_book.entries.length;
                const shouldImportWorldBook = NotificationManager.confirmWithOptions(
                    t('detectWorldBookImport', data.name, worldBookName, entryCount),
                    t('importWithWorldBook'),
                    t('importCharacterOnly')
                );
                
                if (shouldImportWorldBook) {
                    this.importCharacterWorldBook(data.data.character_book, data.name);
                }
            } else {
                // 沒有世界書，正常匯入角色
                this.importCharacterFromData(data);
            }
            
            return true;
            
        } catch (error) {
            throw new Error(t('characterFileParseError', error.message));
        }
    }

    static importCharacterFromData(data) {
        const characterName = data.name || 'Imported Character';
    
        // 檢查是否已存在同名角色
        const existingCharacter = characters.find(c => c.name === characterName);
        
        if (existingCharacter) {
            // 詢問用戶要如何處理
            const choice = NotificationManager.confirmWithOptions(
                t('characterAlreadyExists', characterName),
                t('addAsNewVersion'),
                t('createAsNewCharacter')
            );
            
            if (choice) {
                // 新增為現有角色的新版本
                this.addVersionToExistingCharacter(existingCharacter, data);
            } else {
                // 創建新角色（重命名）
                this.createNewCharacterFromImport(data, characterName);
            }
        } else {
            // 直接創建新角色
            this.createNewCharacterFromImport(data, characterName);
        }
    }

    static addVersionToExistingCharacter(existingCharacter, data) {
        // 計算新版本的名稱
        const newVersionNumber = existingCharacter.versions.length + 1;
        let versionName = t('defaultVersionNumber', newVersionNumber);
        
        // 如果原始資料有指定版本名稱，使用它
        if (data.data?.character_version || data.character_version) {
            versionName = data.data?.character_version || data.character_version;
        }
        
        // 檢查版本名稱是否重複，如果重複就加上編號
        const existingVersionNames = existingCharacter.versions.map(v => v.name);
        let finalVersionName = versionName;
        let counter = 1;
        while (existingVersionNames.includes(finalVersionName)) {
            finalVersionName = `${versionName} (${counter})`;
            counter++;
        }
        
        const newVersion = {
            id: generateId(),
            name: finalVersionName,
            avatar: data.avatar && data.avatar !== 'none' ? data.avatar : '',
            creator: data.data?.creator || data.creator || '',
            charVersion: data.data?.character_version || data.character_version || '',
            creatorNotes: data.data?.creator_notes || data.creatorcomment || '',
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.data?.tags ? data.data.tags.join(', ') : ''),
            description: data.data?.description || data.description || '',
            personality: data.data?.personality || data.personality || '',
            scenario: data.data?.scenario || data.scenario || '',
            dialogue: data.data?.mes_example || data.mes_example || '',
            firstMessage: data.data?.first_mes || data.first_mes || '',
            alternateGreetings: data.data?.alternate_greetings || data.alternate_greetings || [],
            boundWorldBookId: null,
            boundWorldBookVersionId: null,
            createdAt: TimestampManager.createTimestamp(),
            updatedAt: TimestampManager.createTimestamp()
        };
        
        // 將新版本加入現有角色
        existingCharacter.versions.push(newVersion);
        
        // 切換到該角色和新版本
        currentCharacterId = existingCharacter.id;
        currentVersionId = newVersion.id;
        currentMode = 'character';
        isHomePage = false;
        
        renderAll();
        markAsChanged();
        
        NotificationManager.success(t('versionAddedSuccess', finalVersionName, existingCharacter.name));
    }

    static createNewCharacterFromImport(data, originalName) {
        // 找到一個不重複的角色名稱
        let characterName = originalName;
        const existingNames = characters.map(c => c.name);
        let counter = 1;
        
        while (existingNames.includes(characterName)) {
            characterName = `${originalName} (${counter})`;
            counter++;
        }
        
        const character = {
            id: generateId(),
            name: characterName,
versions: [{
    id: generateId(),
    name: t('defaultImportedVersion'),
    avatar: data.avatar && data.avatar !== 'none' ? data.avatar : '',
    creator: data.data?.creator || data.creator || '',
    charVersion: data.data?.character_version || data.character_version || '',
    creatorNotes: data.data?.creator_notes || data.creatorcomment || '',
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.data?.tags ? data.data.tags.join(', ') : ''),
    description: data.data?.description || data.description || '',
    personality: data.data?.personality || data.personality || '',
    scenario: data.data?.scenario || data.scenario || '',
    dialogue: data.data?.mes_example || data.mes_example || '',
    firstMessage: data.data?.first_mes || data.first_mes || '',
    // 🆕 添加額外問候語支援
    alternateGreetings: data.data?.alternate_greetings || data.alternate_greetings || [],
    boundWorldBookId: null,
    boundWorldBookVersionId: null,
    createdAt: TimestampManager.createTimestamp(),
    updatedAt: TimestampManager.createTimestamp()
}]
        };
        
        characters.push(character);
        currentCharacterId = character.id;
        currentVersionId = character.versions[0].id;
        currentMode = 'character';
        isHomePage = false;
        
        renderAll();
        markAsChanged();
        
        const message = characterName === originalName ? 
            t('importSuccess') : 
            t('importRenamedSuccess', characterName);
        NotificationManager.success(message);
    }

    // ===== 世界書匯入 =====
    // 世界書匯入處理
    static async handleWorldBookImport(file, fileType) {
        if (fileType !== 'json') {
            NotificationManager.error(t('worldBookOnlySupportsJSON'));
            return false;
        }
        
        try {
            const textContent = await FileHandler.readFile(file, 'text');
            const data = JSON.parse(textContent);
            
            // 檢查是否為 SillyTavern 世界書格式
            if (data.entries && typeof data.entries === 'object') {
                this.importSillyTavernWorldBook(data, file.name);
                return true;
            } else {
                NotificationManager.error(t('invalidWorldBookFile'));
                return false;
            }
            
        } catch (error) {
            throw new Error(t('worldBookParseError', error.message));
        }
    }

    // 匯入 SillyTavern 格式世界書（帶同名判斷）
    static importSillyTavernWorldBook(data, filename) {
        const worldBookName = data.name || filename.replace('.json', '') || 'Imported Lorebook';
        
        // 檢查是否已存在同名世界書
        const existingWorldBook = worldBooks.find(wb => wb.name === worldBookName);
        
        if (existingWorldBook) {
            // 詢問用戶要如何處理
            const choice = NotificationManager.confirmWithOptions(
                t('worldBookAlreadyExists', worldBookName),
                t('addAsNewWorldBookVersion'),
                t('createAsNewWorldBook')
            );
            
            if (choice) {
                // 新增為現有世界書的新版本
                this.addWorldBookVersionToExisting(existingWorldBook, data, worldBookName);
            } else {
                // 創建新世界書（重命名）
                this.createNewWorldBookFromImport(data, worldBookName, true);
            }
        } else {
            // 直接創建新世界書
            this.createNewWorldBookFromImport(data, worldBookName, false);
        }
    }
    
       // 創建新的世界書
    static createNewWorldBookFromImport(bookData, bookName, isRenamed) {
        // 找到一個不重複的世界書名稱
        let worldBookName = bookName;
        if (isRenamed) {
            const existingNames = worldBooks.map(wb => wb.name);
            let counter = 1;
            while (existingNames.includes(worldBookName)) {
                worldBookName = `${bookName} (${counter})`;
                counter++;
            }
        }
        
        let convertedEntries;
        // 判斷 entries 是陣列 (來自角色卡) 還是物件 (來自獨立檔案)
        if (Array.isArray(bookData.entries)) {
            convertedEntries = this.convertCharacterBookEntries(bookData.entries);
        } else if (typeof bookData.entries === 'object' && bookData.entries !== null) {
            convertedEntries = Object.values(bookData.entries).map((entry, index) => this.convertSillyTavernEntry(entry, index));
            // 按 displayIndex 排序條目
            convertedEntries.sort((a, b) => {
                const aIndex = a.displayIndex !== undefined ? a.displayIndex : 999;
                const bIndex = b.displayIndex !== undefined ? b.displayIndex : 999;
                return aIndex - bIndex;
            });
        } else {
            convertedEntries = []; // 如果格式不符，給一個空陣列
        }
        
        const worldBook = {
            id: generateId(),
            name: worldBookName,
            description: bookData.description || t('importedFromFile'),
            versions: [{
                id: generateId(),
                name: t('importedVersion'),
                entries: convertedEntries,
                createdAt: TimestampManager.createTimestamp(),
                updatedAt: TimestampManager.createTimestamp()
            }]
        };
        
        worldBooks.push(worldBook);
        
        // 嘗試綁定到當前角色（如果適用）
        this.bindWorldBookToCurrentCharacter(worldBook.id, worldBook.versions[0].id);
        currentCharacterId = null;
        currentVersionId = null;
        currentCustomSectionId = null;
        currentCustomVersionId = null;
        currentUserPersonaId = null;
        currentUserPersonaVersionId = null;
        currentLoveyDoveyId = null;
        currentLoveyDoveyVersionId = null;
        // 切換到新世界書
        currentMode = 'worldbook';
        currentWorldBookId = worldBook.id;
        currentWorldBookVersionId = worldBook.versions[0].id;
        viewMode = 'single';
        compareVersions = [];
        isHomePage = false;
        isListPage = false;
        
// 🔧 延遲渲染，確保狀態穩定
setTimeout(() => {
    renderAll();
    markAsChanged();
    
    // 🔧 再次確保狀態正確（防止被其他函數覆蓋）
    setTimeout(() => {
        currentMode = 'worldbook';
        currentWorldBookId = worldBook.id;
        currentWorldBookVersionId = worldBook.versions[0].id;
        
        // 強制更新側邊欄狀態
        expandCurrentItemVersions();
    }, 100);
}, 50);
        
        const message = !isRenamed ? 
            t('worldBookImportSuccess', worldBookName, convertedEntries.length) : 
            t('worldBookRenamedImportSuccess', worldBookName, convertedEntries.length);
        NotificationManager.success(message);
    }


    // 為現有世界書添加新版本
    static addWorldBookVersionToExisting(existingWorldBook, bookData, bookName) {
        const versionName = t('importedFromBook', bookName);
        
        // 檢查版本名稱是否重複
        const existingVersionNames = existingWorldBook.versions.map(v => v.name);
        let finalVersionName = versionName;
        let counter = 1;
        while (existingVersionNames.includes(finalVersionName)) {
            finalVersionName = `${versionName} (${counter})`;
            counter++;
        }
        
        let convertedEntries;
        // 判斷 entries 是陣列 (來自角色卡) 還是物件 (來自獨立檔案)
        if (Array.isArray(bookData.entries)) {
            convertedEntries = this.convertCharacterBookEntries(bookData.entries);
        } else if (typeof bookData.entries === 'object' && bookData.entries !== null) {
            convertedEntries = Object.values(bookData.entries).map((entry, index) => this.convertSillyTavernEntry(entry, index));
            // 按 displayIndex 排序條目
            convertedEntries.sort((a, b) => {
                const aIndex = a.displayIndex !== undefined ? a.displayIndex : 999;
                const bIndex = b.displayIndex !== undefined ? b.displayIndex : 999;
                return aIndex - bIndex;
            });
        } else {
            convertedEntries = [];
        }

        const newVersion = {
            id: generateId(),
            name: finalVersionName,
            entries: convertedEntries,
            createdAt: TimestampManager.createTimestamp(),
            updatedAt: TimestampManager.createTimestamp()
        };
        
        existingWorldBook.versions.push(newVersion);
        this.bindWorldBookToCurrentCharacter(existingWorldBook.id, newVersion.id);
        currentCharacterId = null;
        currentVersionId = null;
        currentCustomSectionId = null;
        currentCustomVersionId = null;
        currentUserPersonaId = null;
        currentUserPersonaVersionId = null;
        currentLoveyDoveyId = null;
        currentLoveyDoveyVersionId = null;
        // 切換到該世界書和新版本
        currentMode = 'worldbook';
        currentWorldBookId = existingWorldBook.id;
        currentWorldBookVersionId = newVersion.id;
        viewMode = 'single';
        compareVersions = [];
        isHomePage = false;
        isListPage = false;
        
// 🔧 延遲渲染，確保狀態穩定
setTimeout(() => {
    renderAll();
    markAsChanged();
    
    // 🔧 再次確保狀態正確（防止被其他函數覆蓋）
    setTimeout(() => {
        currentMode = 'worldbook';
        currentWorldBookId = existingWorldBook.id;
        currentWorldBookVersionId = newVersion.id;
        
        // 強制更新側邊欄狀態
        expandCurrentItemVersions();
    }, 100);
}, 50);
        
        NotificationManager.success(t('versionAddedToWorldBook', finalVersionName, existingWorldBook.name, convertedEntries.length));

    }


    // ===== 角色內建世界書 =====
    // 匯入角色內建世界書
    static importCharacterWorldBook(characterBook, characterName) {
        try {
            // 檢查是否已存在同名世界書
            const worldBookName = characterBook.name || t('characterWorldBookName', characterName);

            const existingWorldBook = worldBooks.find(wb => wb.name === worldBookName);
            
            if (existingWorldBook) {
                const choice = NotificationManager.confirmWithOptions(
                    t('worldBookAlreadyExists', worldBookName),
                    t('addAsNewWorldBookVersion'),
                    t('createAsNewWorldBook')
                );
                
                if (choice) {
                    // 新增為現有世界書的新版本
                    this.addWorldBookVersionToExisting(existingWorldBook, characterBook, characterName);
                } else {
                    // 創建新世界書（重命名）
                    this.createNewWorldBookFromImport(characterBook, worldBookName, true);
                }
            } else {
                // 直接創建新世界書
                this.createNewWorldBookFromImport(characterBook, worldBookName, false);
            }
            
        } catch (error) {
            NotificationManager.error(t('worldBookImportFailed', error.message));
        }
    }

    static bindWorldBookToCurrentCharacter(worldBookId, versionId) {
        // 嘗試使用當前選中的角色（如果是角色模式且有選中角色）
        let targetCharacter = null;
        
        if (currentMode === 'character' && currentCharacterId) {
            targetCharacter = characters.find(c => c.id === currentCharacterId);
        }
        
        // 如果沒有選中角色，使用最後一個角色
        if (!targetCharacter && characters.length > 0) {
            targetCharacter = characters[characters.length - 1];
        }
        
        if (targetCharacter && targetCharacter.versions && targetCharacter.versions.length > 0) {
            // 綁定到角色的最後一個版本（通常是剛匯入的版本）
            const latestVersion = targetCharacter.versions[targetCharacter.versions.length - 1];
            latestVersion.boundWorldBookId = worldBookId;
            latestVersion.boundWorldBookVersionId = versionId;
            
        setTimeout(() => {
            // 只有在當前模式是角色模式時才切換
            if (currentMode === 'character') {
                currentCharacterId = targetCharacter.id;
                currentVersionId = latestVersion.id;
                renderAll();
            }
        }, 1000);
        }
    }

    // 轉換角色世界書條目格式
    static convertCharacterBookEntries(entries) {
        return entries.map((entry, index) => {
            return this.convertCharacterBookEntry(entry, index);
        });
    }

    // 轉換單個角色世界書條目格式
    static convertCharacterBookEntry(entry, index) {
        const extensions = entry.extensions || {};
        
        return {
            id: generateId(),
            uid: entry.id !== undefined ? entry.id : index,
            displayIndex: extensions.display_index !== undefined ? extensions.display_index : index,
            key: Array.isArray(entry.keys) ? entry.keys : [],
            keysecondary: Array.isArray(entry.secondary_keys) ? entry.secondary_keys : [],
            content: entry.content || '',
            comment: entry.comment || '',
            constant: entry.constant || false,
            vectorized: extensions.vectorized || false,
            selective: entry.selective !== false,
            selectiveLogic: extensions.selectiveLogic || 0,
            addMemo: true, // 預設值
            useProbability: extensions.useProbability || false,
            disable: !entry.enabled,
            order: entry.insertion_order || 100,
            position: this.convertInsertionPosition(entry.position, extensions.position),
            depth: extensions.depth || 4,
            probability: extensions.probability !== undefined ? extensions.probability : 100,
            role: extensions.role || 0,
            excludeRecursion: extensions.exclude_recursion || false,
            preventRecursion: extensions.prevent_recursion || false,
            delayUntilRecursion: extensions.delay_until_recursion || false,
            group: extensions.group || '',
            groupOverride: extensions.group_override || false,
            groupWeight: extensions.group_weight || 100,
            scanDepth: extensions.scan_depth || null,
            caseSensitive: extensions.case_sensitive !== undefined ? extensions.case_sensitive : null,
            matchWholeWords: extensions.match_whole_words !== undefined ? extensions.match_whole_words : null,
            useGroupScoring: extensions.use_group_scoring !== undefined ? extensions.use_group_scoring : null,
            automationId: extensions.automation_id || '',
            sticky: extensions.sticky || 0,
            cooldown: extensions.cooldown || 0,
            delay: extensions.delay || 0,
            matchPersonaDescription: extensions.match_persona_description || false,
            matchCharacterDescription: extensions.match_character_description || false,
            matchCharacterPersonality: extensions.match_character_personality || false,
            matchCharacterDepthPrompt: extensions.match_character_depth_prompt || false,
            matchScenario: extensions.match_scenario || false,
            matchCreatorNotes: extensions.match_creator_notes || false,
            triggers: Array.isArray(entry.triggers) ? [...entry.triggers] : []
        };
    }

    // 轉換插入位置格式
    static convertInsertionPosition(legacyPosition, extensionPosition) {
        // 如果有 extension position，優先使用
        if (extensionPosition !== undefined) {
            return extensionPosition;
        }
        
        // 否則從舊格式轉換
        const positionMap = {
            'before_char': 0,
            'after_char': 1,
            'top_an': 2,
            'bottom_an': 3,
            'at_depth': 4
        };
        
        return positionMap[legacyPosition] || 1;
    }

    // ===== 完整資料匯入 =====
    static async handleAllDataImport(file, fileType) {
        if (fileType !== 'json') {
            NotificationManager.error(t('fullBackupOnlySupportsJSON'));
            return false;
        }
        
        try {
            const textContent = await FileHandler.readFile(file, 'text');
            const data = JSON.parse(textContent);
            
            if (data.characters && Array.isArray(data.characters)) {
                const totalItems = data.characters.length + (data.customSections ? data.customSections.length : 0) + (data.worldBooks ? data.worldBooks.length : 0);
                
                // 計算要匯入的項目
                const dataItems = [];
                    if (data.characters?.length) dataItems.push(t('itemsCharacterCards', data.characters.length));
                    if (data.customSections?.length) dataItems.push(t('itemsNotebooks', data.customSections.length));
                    if (data.worldBooks?.length) dataItems.push(t('itemsWorldBooks', data.worldBooks.length));
                    if (data.userPersonas?.length) dataItems.push(t('itemsUserPersonas', data.userPersonas.length));
                    if (data.loveyDoveyCharacters?.length) dataItems.push(t('itemsLoveyDoveyCharacters', data.loveyDoveyCharacters.length));

                    const settingsItems = [];
                    if (data.settings?.customThemes) settingsItems.push(t('customThemes'));
                    if (data.settings?.otherSettings) settingsItems.push(t('personalSettings'));
                    if (data.settings?.sortPreference) settingsItems.push(t('sortPreferences'));

                    const dataText = dataItems.length ? dataItems.join('、') : t('noItems');
                    const settingsText = settingsItems.length ? settingsItems.join('、') : t('noItems');
                    const confirmMessage = t('confirmFullBackupImport', dataText, settingsText);

                const confirmImport = NotificationManager.confirm(confirmMessage);
                
               if (confirmImport) {
                    
            // 第一階段：匯入所有資料
            characters = data.characters;
            customSections = data.customSections || [];
            worldBooks = data.worldBooks || [];
            userPersonas = data.userPersonas || []; 
            loveyDoveyCharacters = data.loveyDoveyCharacters || []; 
            
        // 第二階段：恢復所有設定
        if (data.settings) {
            // 恢復主題設定
            if (data.settings.customThemes) {
                localStorage.setItem('characterCreator_customThemes', data.settings.customThemes);
                ThemeManager.loadThemes(); // 重新載入主題
            }
            if (data.settings.currentTheme) {
                ThemeManager.switchTheme(data.settings.currentTheme);
            }
            if (data.settings.customColors) {
                localStorage.setItem('characterCreatorCustomColors', data.settings.customColors);
            }
            
            // 恢復其他設定
            if (data.settings.otherSettings) {
                localStorage.setItem('characterCreator_otherSettings', data.settings.otherSettings);
                OtherSettings.loadSettings(); // 重新載入設定
                
                // 🔧 正確應用卿卿我我顯示設定
                const settings = JSON.parse(data.settings.otherSettings);
                OtherSettings.applyLoveyDoveyVisibility(settings.showLoveyDovey); // 傳入具體的布林值
            }
            
            // 恢復排序和偏好設定
            if (data.settings.sortPreference) {
                localStorage.setItem('characterCreator-sortPreference', data.settings.sortPreference);
            }
            if (data.settings.selectedTags) {
                localStorage.setItem('characterCreator-selectedTags', data.settings.selectedTags);
            }
        }
        
        // 第三階段：重置狀態變數
        currentCharacterId = characters[0]?.id || null;
        currentVersionId = characters[0]?.versions[0]?.id || null;
        currentCustomSectionId = customSections[0]?.id || null;
        currentCustomVersionId = customSections[0]?.versions[0]?.id || null;
        currentWorldBookId = worldBooks[0]?.id || null;
        currentWorldBookVersionId = worldBooks[0]?.versions[0]?.id || null;
        currentUserPersonaId = userPersonas[0]?.id || null; 
        currentUserPersonaVersionId = userPersonas[0]?.versions[0]?.id || null;
        currentLoveyDoveyId = loveyDoveyCharacters[0]?.id || null;
        currentLoveyDoveyVersionId = loveyDoveyCharacters[0]?.versions[0]?.id || null;
        currentMode = 'character';
        compareVersions = [];
        
            // 🔧 暫時禁用自動儲存通知，避免與匯入成功通知重疊
        const originalShowSaveNotification = window.showSaveNotification;
        window.showSaveNotification = false;

        renderAll();
        saveData();

        // 🔧 恢復自動儲存通知功能
        setTimeout(() => {
            window.showSaveNotification = originalShowSaveNotification;
        }, 100);

        NotificationManager.success(t('fullDataImportSuccess'));
        return true;
        }
                return false;
            } else {
                NotificationManager.error(t('invalidBackupFile'));
                return false;
            }
            
        } catch (error) {
            throw new Error(t('backupParseError', error.message));
        }
    }

    // ===== 工具方法 =====
    // 切換到世界書
    static switchToWorldBook(worldBookId, versionId) {
        currentMode = 'worldbook';
        currentWorldBookId = worldBookId;
        currentWorldBookVersionId = versionId;
        viewMode = 'single';
        compareVersions = [];
        isHomePage = false;
        isListPage = false;
    }

    // 轉換 SillyTavern 條目格式
    static convertSillyTavernEntry(entry, index) {
        // 先建立基本屬性
        const baseEntry = {
            id: generateId(),
            uid: entry.uid || index,
            displayIndex: entry.displayIndex !== undefined ? entry.displayIndex : index,
            key: Array.isArray(entry.key) ? entry.key : [],
            keysecondary: Array.isArray(entry.keysecondary) ? entry.keysecondary : [],
            content: entry.content || '',
            comment: entry.comment || '',
            constant: entry.constant || false,
            vectorized: entry.vectorized || false,
            selective: entry.selective !== false,
            selectiveLogic: entry.selectiveLogic || 0,
            addMemo: entry.addMemo !== false,
            useProbability: entry.useProbability || false,
            disable: entry.disable || false,
            order: entry.order || 100,
            depth: entry.depth || 4,
            probability: entry.probability !== undefined ? entry.probability : 100,
            position: entry.position || 0,
            role: entry.role || null,
            excludeRecursion: entry.excludeRecursion || false,
            preventRecursion: entry.preventRecursion || false,
            matchPersonaDescription: entry.matchPersonaDescription || false,
            matchCharacterDescription: entry.matchCharacterDescription || false,
            matchCharacterPersonality: entry.matchCharacterPersonality || false,
            matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt || false,
            matchScenario: entry.matchScenario || false,
            matchCreatorNotes: entry.matchCreatorNotes || false,
            delayUntilRecursion: entry.delayUntilRecursion || 0,
            group: entry.group || '',
            groupOverride: entry.groupOverride || false,
            groupWeight: entry.groupWeight || 100,
            scanDepth: entry.scanDepth || null,
            caseSensitive: entry.caseSensitive !== undefined ? entry.caseSensitive : null,
            matchWholeWords: entry.matchWholeWords !== undefined ? entry.matchWholeWords : null,
            useGroupScoring: entry.useGroupScoring !== undefined ? entry.useGroupScoring : null,
            automationId: entry.automationId || '',
            sticky: entry.sticky || 0,
            cooldown: entry.cooldown || 0,
            delay: entry.delay || 0,
            matchPersonaDescription: entry.matchPersonaDescription || false,
            matchCharacterDescription: entry.matchCharacterDescription || false,
            matchCharacterPersonality: entry.matchCharacterPersonality || false,
            matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt || false,
            matchScenario: entry.matchScenario || false,
            matchCreatorNotes: entry.matchCreatorNotes || false,
            triggers: Array.isArray(entry.triggers) ? [...entry.triggers] : []
        };
        
        // 合併額外屬性
        const knownKeys = new Set(Object.keys(baseEntry));
        const extraProperties = {};
        Object.keys(entry).forEach(key => {
            if (!knownKeys.has(key)) {
                extraProperties[key] = entry[key];
            }
        });
        
        return { ...baseEntry, ...extraProperties };
    }

    // 統一的錯誤處理和通知
    static showError(message) {
        NotificationManager.error(message);
     }

    static showSuccess(message) {
        NotificationManager.success(message);
     }

}

    // ===== 資料管理器 =====
    class DataManager {
        static exportAllFromModal() {
            exportAllData();
            setTimeout(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    const message = modal.querySelector('.modal-content > div:nth-child(2)');
                    if (message) {
                        message.innerHTML = `
                            <div style="text-align: center; padding: 20px;">
                            <div style="color: var(--success-color); font-weight: 600; margin-bottom: 8px;">${t('backupExportComplete')}</div>
                            <div style="color: var(--text-muted); font-size: 0.9em;">${t('nowSafeToClearData')}</div>
                        </div>
                        `;
                    }
                }
            }, 1000);
        }

        static async confirmClearAll() {
        try {
            // 第一階段：清空所有資料陣列
            characters = [];
            customSections = [];
            worldBooks = [];
            userPersonas = []; 
            loveyDoveyCharacters = []; 
            
            // 第二階段：重置所有狀態變數
            currentCharacterId = null;
            currentVersionId = null;
            currentCustomSectionId = null;
            currentCustomVersionId = null;
            currentWorldBookId = null;
            currentWorldBookVersionId = null;
            currentUserPersonaId = null;    
            currentUserPersonaVersionId = null;  
            currentLoveyDoveyId = null;   
            currentLoveyDoveyVersionId = null; 
            currentMode = 'character';
            viewMode = 'single';
            compareVersions = [];
            isHomePage = true;
            hasUnsavedChanges = false;
            
            // 第三階段：清空 IndexedDB
            if (characterDB.db) {
                const transaction = characterDB.db.transaction([
                    'characters', 
                    'customSections', 
                    'worldBooks', 
                    'userPersonas', 
                    'loveyDoveyCharacters' 
                ], 'readwrite');
                
                await Promise.all([
                    characterDB.clearStore(transaction.objectStore('characters')),
                    characterDB.clearStore(transaction.objectStore('customSections')),
                    characterDB.clearStore(transaction.objectStore('worldBooks')),
                    characterDB.clearStore(transaction.objectStore('userPersonas')), 
                    characterDB.clearStore(transaction.objectStore('loveyDoveyCharacters')) 
                ]);
            }
            
            // 第四階段：清空所有 localStorage 和設定
                // 清空基本資料
                localStorage.removeItem('characterCreatorData');
                localStorage.removeItem('characterCreatorCustomData');
                localStorage.removeItem('characterCreatorWorldBooks');
                localStorage.removeItem('characterCreatorUserPersonas');
                localStorage.removeItem('characterCreatorLoveyDoveyCharacters');

                // 清空主題和介面設定
                localStorage.removeItem('characterCreatorCustomColors');
                localStorage.removeItem('characterCreator_customThemes');

                // 清空其他設定
                localStorage.removeItem('characterCreator_otherSettings');  

                // 清空緩存
                localStorage.removeItem('characterCreator_tokenCache'); 
                localStorage.removeItem('characterCreator-sortPreference'); 
                localStorage.removeItem('characterCreator-selectedTags'); 

                // 清空拖曳排序相關設定
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (
                        key.startsWith('drag-sort-') ||  
                        key.startsWith('version-sort-') ||   
                        key.startsWith('textarea-height-') || 
                        key.startsWith('loveydovey-collapse-') 
                    )) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));

                // 重置主題到預設值
                ThemeManager.switchTheme('default');  

                // 重置其他設定到預設值
                OtherSettings.settings = {  
                    showLoveyDovey: true
                };
                OtherSettings.saveSettings();

                // 🔧 確保卿卿我我區塊顯示狀態正確應用
                OtherSettings.applyLoveyDoveyVisibility(true); 

                // 🔧 重置主題系統到初始狀態（清空用戶自定義主題）
                ThemeManager.themes.clear();  
                ThemeManager.createBuiltinThemes();  
                ThemeManager.currentThemeId = 'default'; 
                ThemeManager.isModified = false;  
                ThemeManager.nextId = 1;          

            const modal = document.querySelector('.modal');
            if (modal) {
                modal.remove();
            }
            
            renderAll();
            this.showClearSuccessNotification();
            
        } catch (error) {
            console.error('清空資料失敗：', error);
            alert(t('clearDataError'));
        }
    }

        static showClearSuccessNotification() {
                NotificationManager.show({
                    content: `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${IconManager.trash({ width: 20, height: 20, style: 'flex-shrink: 0;' })}
                            <div>
                                <div>${t('dataCleared')}</div>
                                <div style="font-size: 0.8em; opacity: 0.9; margin-top: 4px;">${t('pageResetToInitial')}</div>
                            </div>
                        </div>
                    `,
                    type: 'success',
                    duration: 4000
                });
            }

        static showFinalConfirmation() {
            // 關閉第一個模態框
            const modal = document.querySelector('.modal');
            if (modal) {
                modal.remove();
            }
            
            // 顯示最終確認對話框
            const confirmed = confirm(t('finalClearWarning'));
            
            if (confirmed) {
                this.confirmClearAll();
            }
        }
    }

    // ===== 通知處理 =====
    async function saveDataWithNotification() {
        await saveData();
    }

    function showSaveNotification() {
        NotificationManager.success(t('saved'));
    }


    // ===== 橋接到新的 ExportManager =====
    function exportAllData() {
        ExportManager.exportAllData();
    }

    function exportUserPersona(personaId) {
        ExportManager.exportUserPersona(personaId);
    }

    function createPNGWithMetadata(canvas, base64Data, characterName, callback) {
        PNGHelper.createPNGWithMetadata(canvas, base64Data, characterName, callback);
    }

    function createPNGWithMetadataAndFilename(canvas, base64Data, filename, callback) {
        PNGHelper.createPNGWithMetadataAndFilename(canvas, base64Data, filename, callback);
    }

    // ===== 橋接到新的 ImportManager =====
    function importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.png';
        input.onchange = function(event) {
            handleImport(event);
        };
        input.click();
    }

    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        ImportManager.handleImport(file, 'character');
        event.target.value = '';
    }

    // 匯入世界書
    function importWorldBook() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            handleWorldBookImport(event);
        };
        input.click();
    }

    function handleWorldBookImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        ImportManager.handleImport(file, 'worldbook');
        event.target.value = '';
    }

    function importAllData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            handleImportAll(event);
        };
        input.click();
    }

    function handleImportAll(event) {
        const file = event.target.files[0];
        if (!file) return;
        ImportManager.handleImport(file, 'all');
        event.target.value = '';
    }

    function importSillyTavernWorldBook(data, filename) {
        ImportManager.importSillyTavernWorldBook(data, filename);
    }

    function switchToWorldBook(worldBookId, versionId) {
        ImportManager.switchToWorldBook(worldBookId, versionId);
    }


