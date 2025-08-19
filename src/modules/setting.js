// ===== ContentSearchManager - 內容搜尋管理器 =====
class ContentSearchManager {
    static isSearchOpen = false;
    static searchTimeout = null;
    static currentResults = null;
    
    // 開啟搜尋視窗
    static openSearchModal() {
    if (this.isSearchOpen) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'content-search-modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
    <div class="compact-modal-content" style="max-width: 700px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">   
        <div class="compact-modal-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                ${IconManager.search({width: 18, height: 18})}
                <h3 class="compact-modal-title">${t('searchContent')}</h3>
            </div>
            <button class="close-modal" onclick="ContentSearchManager.closeSearchModal()">×</button>
        </div>
        
        <div class="compact-section" style="padding: 0; background: transparent; margin-bottom: var(--spacing-lg);">
            <input type="text" 
                   id="content-search-input" 
                   class="field-input msize-input"
                   placeholder="${t('searchPlaceholderContent')}"
                   style="font-size: 0.9em; padding: 12px 16px; width: 100%;"
                   oninput="ContentSearchManager.handleSearchInput(this.value)"
                   autofocus>
        </div>
        
        <div id="search-results-container" style="flex: 1; overflow-y: auto; background: var(--header-bg); border-radius: var(--radius-md); padding: var(--spacing-lg);">
            <div style="font-size: 0.9em; text-align: center; color: var(--text-muted); padding: 40px;">
                ${t('searchEmptyState')}
            </div>
        </div>
    </div>
`;
    
    document.body.appendChild(modal);
    this.isSearchOpen = true;
        
        // 點擊遮罩關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSearchModal();
            }
        });
        
        // ESC 鍵關閉
        document.addEventListener('keydown', this.handleKeydown);
        
        // 聚焦搜尋框
        setTimeout(() => {
            document.getElementById('content-search-input')?.focus();
        }, 100);
    }
    
    // 關閉搜尋視窗
    static closeSearchModal() {
        const modal = document.getElementById('content-search-modal');
        if (modal) {
            modal.remove();
        }
        this.isSearchOpen = false;
        document.removeEventListener('keydown', this.handleKeydown);
    }
    
    // 鍵盤事件處理
    static handleKeydown = (e) => {
        if (e.key === 'Escape') {
            ContentSearchManager.closeSearchModal();
        }
    }
    
    // 搜尋輸入處理（防抖）
    static handleSearchInput(value) {
        clearTimeout(this.searchTimeout);
        
        if (value.length < 2) {
            this.showEmptyState(t('searchMinChars'));
            return;
        }
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(value);
        }, 300);
    }
    
    // 執行搜尋
    static performSearch(searchText) {
        const results = {
            characters: this.searchInCharacters(searchText),
            userPersonas: this.searchInUserPersonas(searchText),
            worldbooks: this.searchInWorldBooks(searchText),
            customs: this.searchInCustomSections(searchText),
            loveydovey: ContentSearchManager.searchInLoveyDovey(searchText)
        };
        
        this.currentResults = results;
        this.displayResults(results, searchText);
    }
    
    // 搜尋角色卡
    static searchInCharacters(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();
        
        characters.forEach(character => {
            character.versions.forEach(version => {
                const fields = {
                    [t('description')]: version.description,
                    [t('personalityTraits')]: version.personality,
                    [t('plotSetting')]: version.scenario, 
                    [t('dialogue')]: version.dialogue, 
                    [t('firstMessageField')]: version.firstMessage,
                    [t('creatorNotes')]: version.creatorNotes 
                };
                
                Object.entries(fields).forEach(([fieldName, content]) => {
                    if (content && content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(content, searchText);
                        results.push({
                            itemName: character.name,
                            versionName: version.name,
                            fieldName: fieldName,
                            snippet: snippet,
                            itemId: character.id,
                            versionId: version.id,
                            type: 'character'
                        });
                    }
                });
            });
        });
        
        return results;
    }

    // 搜尋卿卿我我角色
    static searchInLoveyDovey(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();
        
        loveyDoveyCharacters.forEach(character => {
            character.versions.forEach(version => {
                const fields = {
                [t('characterName')]: version.characterName,
                [t('age')]: version.age, 
                [t('occupation')]: version.occupation, 
                [t('characterQuote')]: version.characterQuote,
                [t('publicDescription')]: version.publicDescription,
                [t('basicInfo')]: version.basicInfo, 
                [t('personality')]: version.personality, 
                [t('speakingStyle')]: version.speakingStyle, 
                [t('scenarioScript')]: version.scenarioScript, 
                [t('characterDialogue')]: version.characterDialogue,
                [t('likes')]: version.likes,  
                [t('dislikes')]: version.dislikes, 
                [t('tags')]: version.tags 
            };
                
                // 搜尋基本欄位
                Object.entries(fields).forEach(([fieldName, content]) => {
                    if (content && content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(content, searchText);
                        results.push({
                            itemName: character.name,
                            versionName: version.name,
                            fieldName: fieldName,
                            snippet: snippet,
                            itemId: character.id,
                            versionId: version.id,
                            type: 'loveydovey'
                        });
                    }
                });
                
                // 搜尋附加資訊
                if (version.additionalInfo && Array.isArray(version.additionalInfo)) {
                    version.additionalInfo.forEach((info, index) => {
                        if (info.title && info.title.toLowerCase().includes(searchLower)) {
                            const snippet = this.createSnippet(info.title, searchText);
                            results.push({
                                itemName: character.name,
                                versionName: version.name,
                                fieldName: `${t('additionalInfo')} ${index + 1} ${t('additionalTitle')}`,
                                snippet: snippet,
                                itemId: character.id,
                                versionId: version.id,
                                type: 'loveydovey'
                            });
                        }
                        
                        if (info.content && info.content.toLowerCase().includes(searchLower)) {
                            const snippet = this.createSnippet(info.content, searchText);
                            results.push({
                                itemName: character.name,
                                versionName: version.name,
                                fieldName: `${t('additionalInfo')} ${index + 1} ${t('additionalContent')}`,
                                snippet: snippet,
                                itemId: character.id,
                                versionId: version.id,
                                type: 'loveydovey'
                            });
                        }
                    });
                }
                
                // 搜尋創作者事件
                if (version.creatorEvents && Array.isArray(version.creatorEvents)) {
                    version.creatorEvents.forEach((event, index) => {
                        const eventFields = {
                            [t('timeAndPlace')]: event.timeAndPlace,
                            [t('eventTitle')]: event.title,
                            [t('eventContent')]: event.content
                        };
                        
                        Object.entries(eventFields).forEach(([fieldName, content]) => {
                            if (content && content.toLowerCase().includes(searchLower)) {
                                const snippet = this.createSnippet(content, searchText);
                                results.push({
                                    itemName: character.name,
                                    versionName: version.name,
                                    fieldName: `${t('creatorEvents')} ${index + 1} ${fieldName}`,
                                    snippet: snippet,
                                    itemId: character.id,
                                    versionId: version.id,
                                    type: 'loveydovey'
                                });
                            }
                        });
                    });
                }
            });
        });
        
        return results;
    }

        // 搜尋玩家角色
    static searchInUserPersonas(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();
        
        userPersonas.forEach(persona => {
            persona.versions.forEach(version => {
                if (version.description && version.description.toLowerCase().includes(searchLower)) {
                    const snippet = this.createSnippet(version.description, searchText);
                    results.push({
                        itemName: persona.name,
                        versionName: version.name,
                        fieldName: t('description'),
                        snippet: snippet,
                        itemId: persona.id,
                        versionId: version.id,
                        type: 'userpersona'
                    });
                }
            });
        });
        
        return results;
    }
    
   // 搜尋世界書
static searchInWorldBooks(searchText) {
    const results = [];
    const searchLower = searchText.toLowerCase();
    
    worldBooks.forEach(worldbook => {
        worldbook.versions.forEach(version => {
            version.entries.forEach(entry => {
                const fields = {
                    [t('entryContent')]: entry.content,
                    [t('entryComment')]: entry.comment
                };
                
                Object.entries(fields).forEach(([fieldName, content]) => {
                    if (content && content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(content, searchText);
                        results.push({
                            itemName: worldbook.name,
                            versionName: version.name,
                            fieldName: fieldName,
                            snippet: snippet,
                            itemId: worldbook.id,
                            versionId: version.id,
                            type: 'worldbook',
                            entryId: entry.id
                        });
                    }
                });
            });
        });
    });
    
    return results;
}
    
    // 搜尋筆記本
    static searchInCustomSections(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();
        
        customSections.forEach(section => {
            section.versions.forEach(version => {
                version.fields.forEach(field => {
                    if (field.content && field.content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(field.content, searchText);
                        results.push({
                            itemName: section.name,
                            versionName: version.name,
                            fieldName: field.name,
                            snippet: snippet,
                            itemId: section.id,
                            versionId: version.id,
                            type: 'custom'
                        });
                    }
                });
            });
        });
        
        return results;
    }
    
    // 創建摘要片段
    static createSnippet(content, searchText, maxLength = 100) {
        const searchLower = searchText.toLowerCase();
        const contentLower = content.toLowerCase();
        const index = contentLower.indexOf(searchLower);
        
        if (index === -1) return content.substring(0, maxLength);
        
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + searchText.length + 30);
        
        let snippet = content.substring(start, end);
        
        // 添加省略號
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        // 高亮關鍵詞
        const regex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi');
        snippet = snippet.replace(regex, '<strong style="color: var(--accent-color); background: rgba(139, 115, 85, 0.2); padding: 1px 3px; border-radius: 3px;">$1</strong>');
        
        return snippet;
    }
    
    // 轉義正則表達式特殊字符
    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // 顯示結果
    static displayResults(results, searchText) {
        const container = document.getElementById('search-results-container');
        if (!container) return;
        
        const totalCount = results.characters.length + 
                  results.userPersonas.length + 
                  results.worldbooks.length + 
                  results.customs.length + 
                  results.loveydovey.length;
        
        if (totalCount === 0) {
            this.showEmptyState(t('searchNotFound').replace('$1', searchText));
            return;
        }
        
        let html = `
    <div style="margin-bottom: 20px; font-weight: 600; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
        ${IconManager.search()}
        ${t('searchResultsCount').replace('$1', searchText).replace('$2', totalCount)}
    </div>
        `;
        
        // 角色卡結果
        if (results.characters.length > 0) {
            html += this.renderResultSection(t('character'), results.characters, `${IconManager.user()}`);
        }

        // 卿卿我我結果
        if (results.loveydovey.length > 0) {
            html += this.renderResultSection(t('loveydovey'), results.loveydovey, `${IconManager.heart()}`);
        }

        // 玩家角色結果
        if (results.userPersonas.length > 0) {
            html += this.renderResultSection(t('userPersona'), results.userPersonas, `${IconManager.smile()}`);
        }

        // 世界書結果
        if (results.worldbooks.length > 0) {
            html += this.renderResultSection(t('worldBook'), results.worldbooks, `${IconManager.book()}`);
        }

        // 筆記本結果
        if (results.customs.length > 0) {
            html += this.renderResultSection(t('customFields'), results.customs, `${IconManager.file()}`);
        }

        
        container.innerHTML = html;
    }
    // 渲染結果區塊
static renderResultSection(sectionName, results, icon) {
    let html = `
    <div style="margin-bottom: 24px;">
        <h4 style="color: var(--accent-color); font-size: 1em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
            ${icon}
            <span>${sectionName} (${results.length})</span>
        </h4>
`;
    
    results.forEach(result => {
        // 根據類型生成詳細的欄位描述
        let fieldDescription = result.fieldName;
        
        if (result.type === 'worldbook' && result.entryId) {
    // 為世界書條目顯示條目標題而非 UID
    const worldbook = worldBooks.find(wb => wb.id === result.itemId);
    if (worldbook) {
        const version = worldbook.versions.find(v => v.id === result.versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === result.entryId);
            if (entry) {
                // 優先顯示條目標題，如果沒有則顯示 UID
                const entryTitle = entry.comment || `UID:${entry.uid || t('unsetValue')}`;
                fieldDescription = `${entryTitle} - ${result.fieldName}`;
            }
        }
    }
} else if (result.type === 'custom') {
    // 為筆記本添加欄位位置信息
    const section = customSections.find(s => s.id === result.itemId);
    if (section) {
        const version = section.versions.find(v => v.id === result.versionId);
        if (version) {
            const fieldIndex = version.fields.findIndex(f => f.name === result.fieldName);
            if (fieldIndex !== -1) {
                fieldDescription = `${t('fieldPrefix')}${fieldIndex + 1}${t('fieldSuffix')} ${result.fieldName}`;
            }
        }
    }
}
        
        html += `
<div class="search-result-item tag-item-hover" 
     onclick="ContentSearchManager.jumpToResult('${result.type}', '${result.itemId}', '${result.versionId}', '${result.fieldName}', '${this.escapeForAttribute(searchText)}')"
     style="
         padding: 12px 16px; 
         margin-bottom: 8px; 
         background: var(--surface-color); 
         border: 1px solid var(--border-color); 
         border-radius: 6px; 
         cursor: pointer; 
         transition: all 0.2s ease;
     ">
        
        <div style="font-weight: 500; color: var(--text-color); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            ${IconManager.folder({width: 14, height: 14, style: 'color: var(--text-muted);'})}
            ${result.itemName} > ${result.versionName}
        </div>
        
        <div style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            ${IconManager.file({width: 14, height: 14, style: 'color: var(--text-muted);'})}
            ${fieldDescription}
        </div>
        
        <div style="font-size: 0.9em; color: var(--text-color); line-height: 1.4;">
            ${result.snippet}
        </div>
    </div>
`;
    });
    
    html += '</div>';
    return html;
}
    
    // 顯示空狀態
    static showEmptyState(message) {
        const container = document.getElementById('search-results-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                ${message}
            </div>
        `;
    }
    
// 跳轉到結果
static jumpToResult(type, itemId, versionId, fieldName, searchText) {
    this.closeSearchModal();
    
    // 延遲執行，確保模態框完全關閉
    setTimeout(() => {
        selectItem(type, itemId, versionId, {
            scrollToField: fieldName,
            highlightText: searchText
        });
    }, 100);
}
// 轉義屬性值中的特殊字符
static escapeForAttribute(str) {
    if (!str) return '';
    return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
}

// 滾動到搜尋結果位置
function scrollToSearchResult(type, fieldName, searchText) {
    // 欄位名稱映射到實際的 DOM 元素 ID 或 selector
    const fieldSelectors = {
        // 角色卡欄位
        [t('description')]: 'textarea[placeholder*="' + t('descriptionPlaceholder') + '"]',
        [t('personalityTraits')]: 'textarea[placeholder*="' + t('personalityPlaceholder') + '"]',
        [t('plotSetting')]: 'textarea[placeholder*="' + t('scenarioPlaceholder') + '"]',
        [t('dialogue')]: 'textarea[placeholder*="' + t('dialoguePlaceholder') + '"]',
        [t('firstMessageField')]: 'textarea[placeholder*="' + t('firstMessagePlaceholder') + '"]',
        [t('creatorNotes')]: 'textarea[placeholder*="' + t('creatorNotesPlaceholder') + '"]',
        
        // 玩家角色欄位
        [t('description')]: 'textarea[placeholder*="' + t('userPersonaPlaceholder') + '"]',
        
        // 世界書欄位
        [t('entryContent')]: '.worldbook-entry textarea[placeholder*="' + t('entryContentPlaceholder') + '"]',
        [t('entryComment')]: '.worldbook-entry textarea[placeholder*="' + t('entryCommentPlaceholder') + '"]'
    };
    
    // 先嘗試通過欄位名稱找到對應的輸入框
    let targetElement = null;
    
    // 如果有對應的選擇器，使用它
    if (fieldSelectors[fieldName]) {
        targetElement = document.querySelector(fieldSelectors[fieldName]);
    }
    
    // 如果沒找到，嘗試通過 placeholder 文字模糊匹配
    if (!targetElement) {
        const allTextareas = document.querySelectorAll('textarea, input[type="text"]');
        for (const element of allTextareas) {
            const placeholder = element.placeholder || '';
            const label = element.previousElementSibling?.textContent || '';
            
            if (placeholder.includes(fieldName) || label.includes(fieldName)) {
                targetElement = element;
                break;
            }
        }
    }
    
    if (targetElement) {
        // 滾動到目標元素
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 添加高亮效果
        highlightElement(targetElement);
        
        // 聚焦到元素（可選）
        setTimeout(() => {
            targetElement.focus();
        }, 500);
    } else {
        console.warn('找不到對應的欄位:', fieldName);
    }
}

// 高亮元素效果
function highlightElement(element) {
    const originalStyle = {
        border: element.style.border,
        boxShadow: element.style.boxShadow
    };
    
    // 添加高亮樣式
    element.style.border = '2px solid var(--accent-color)';
    element.style.boxShadow = '0 0 10px rgba(139, 115, 85, 0.3)';
    
    // 3秒後恢復原樣式
    setTimeout(() => {
        element.style.border = originalStyle.border;
        element.style.boxShadow = originalStyle.boxShadow;
    }, 3000);
}

// 顯示其他設定介面
function showOtherSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 500px; padding: 25px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.settings({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('otherSettings')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
        
        <!-- 功能區塊顯示設定 -->
        <div class="compact-section" style="margin-top: 24px; padding: 0px;">
            <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                ${IconManager.settings({width: 14, height: 14})}
                ${t('featureDisplay')}
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color);">
                <div style="flex: 1;">
   <div style="font-weight: 500; margin-bottom: 4px; color: var(--text-color); font-size: 0.9em;">${t('showLoveyDoveySection')}</div>
<div style="font-size: 0.8em; color: var(--text-muted); margin: 0; line-height: 1.3;">${t('loveyDoveyDescription')}</div>
</div>
                
                <!-- 拉霸開關 -->
                <label style="position: relative; display: inline-block; width: 40px; height: 20px; cursor: pointer;">
                    <input type="checkbox" name="showLoveyDovey" ${OtherSettings.settings.showLoveyDovey ? 'checked' : ''} 
                        onchange="OtherSettings.updateSetting('showLoveyDovey', this.checked); updateToggleSwitch('showLoveyDovey', this.checked);" 
                        style="opacity: 0; width: 0; height: 0;">
                    <span style="
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${OtherSettings.settings.showLoveyDovey ? 'var(--accent-color)' : 'var(--border-color)'};
    transition: 0.3s;
    border-radius: 20px;
"></span>
                    <span style="
    position: absolute;
    content: '';
    height: 14px;
    width: 14px;
    left: ${OtherSettings.settings.showLoveyDovey ? '23px' : '3px'};
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
"></span>
                </label>
            </div>
       </div>
            
            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" style="margin-top: 8px;"onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


function closeFunctionMenu() {
    const menu = document.getElementById('function-menu');
    if (menu && menu.style.display !== 'none') {
        menu.style.display = 'none';
        document.removeEventListener('click', handleGlobalClickForMenu);
    }
}

/**
 * 全域點擊事件處理器。當點擊發生在選單外部時，關閉選單。
 * @param {MouseEvent} event 
 */
function handleGlobalClickForMenu(event) {
    const menu = document.getElementById('function-menu');
    const toggleButton = document.getElementById('function-toggle');
    const collapsedToggleButton = document.querySelector('.sidebar-collapsed-icons .collapsed-icon-btn[title="Setting"]');

    const isClickInsideMenu = menu && menu.contains(event.target);
    const isClickOnToggleButton = toggleButton && toggleButton.contains(event.target);
    const isClickOnCollapsedButton = collapsedToggleButton && collapsedToggleButton.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggleButton && !isClickOnCollapsedButton) {
        closeFunctionMenu();
    }
}

/**
 * 處理選單項目點擊的核心函式
 * @param {MouseEvent} event 
 */
function handleMenuAction(event) {
    const target = event.target.closest('.function-option');
    if (!target) return;

    const action = target.dataset.action;
    const value = target.dataset.value;

    closeFunctionMenu();

    setTimeout(() => {
        try {
            switch (action) {
                case 'showColorPicker': showColorPicker(); break;
                case 'showOtherSettings': showOtherSettings(); break;
                case 'selectLanguage': selectLanguage(value); break;
                case 'exportAllData': exportAllData(); break;
                case 'importAllData': importAllData(); break;
                case 'showClearDataConfirm': showClearDataConfirm(); break;
            }
        } catch (error) {
            console.error("執行選單動作時出錯:", action, error);
        }
    }, 50); 
}

/**
 * 切換功能選單的顯示與隱藏
 * @param {MouseEvent} event 
 */
function toggleFunctionMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('function-menu');
    const isVisible = menu.style.display !== 'none';

    if (isVisible) {
        closeFunctionMenu();
    } else {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();

        menu.innerHTML = generateFunctionMenu();
        menu.addEventListener('click', handleMenuAction);
        
        menu.style.display = 'block';
        
        setTimeout(() => {
            document.addEventListener('click', handleGlobalClickForMenu);
        }, 0);

        const menuContent = menu.firstElementChild;
        if (!menuContent) return;
        const menuRect = menuContent.getBoundingClientRect();
        
        let top = rect.top - menuRect.height - 8;
        let left = rect.left + (rect.width / 2) - (menuRect.width / 2);

        if (top < 10) top = 10;
        if (left < 10) left = 10;
        if (left + menuRect.width > window.innerWidth) {
            left = window.innerWidth - menuRect.width - 10;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }
}

/**
 * 動態生成功能選單的內部 HTML
 * (改用 data-action 屬性，移除 inline onclick)
 */
function generateFunctionMenu() {
    return `
        <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-medium); min-width: 140px; padding: 4px 0;">
            <!-- 介面設定 -->
            <div class="function-option" data-action="showColorPicker" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.palette()} ${t('customInterface')}
            </div>
            <div class="function-option" data-action="showOtherSettings" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.settings()} ${t('otherSettings')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <!-- 語言選項 -->
            <div class="function-option" data-action="selectLanguage" data-value="zh" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.globe()} ${t('languageChinese')}
            </div>
            <div class="function-option" data-action="selectLanguage" data-value="en" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.globe()} ${t('languageEnglish')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <!-- 資料管理 -->
            <div class="function-option" data-action="exportAllData" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
               ${IconManager.download()} ${t('exportData')}
            </div>
            <div class="function-option" data-action="importAllData" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.import()} ${t('importData')}
            </div>
            <div class="function-option" data-action="showClearDataConfirm" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; color: var(--danger-color); transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.delete()} ${t('clearAllData')}
            </div>
        </div>
    `;
}



// 搜尋功能
function handleSearchInput(searchValue) {
    searchText = searchValue.trim().toLowerCase();
    // 重置分頁狀態
    if (typeof OverviewManager !== 'undefined') {
        OverviewManager.currentlyShown = OverviewManager.itemsPerPage;
        OverviewManager.lastProcessParams = null;
    }
    
    // 重新渲染列表
    if (isHomePage) {
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        OverviewManager.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        // 玩家角色總覽頁面
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        // 卿卿我我總覽頁面
        ContentRenderer.renderLoveyDoveyCards();
    }
}

// 更新拉霸開關樣式
function updateToggleSwitch(checkboxName, isChecked) {
    const checkbox = document.querySelector(`input[name="${checkboxName}"]`);
    if (!checkbox) return;
    
    const container = checkbox.closest('label');
    if (!container) return;
    
    const background = container.querySelector('span:first-of-type');
    const slider = container.querySelector('span:last-of-type');
    
    if (background && slider) {
        // 更新背景顏色
        background.style.backgroundColor = isChecked ? 'var(--accent-color)' : 'var(--border-color)';

        // 更新滑塊位置
slider.style.left = isChecked ? '23px' : '3px';
    }
}
// 顯示說明功能
function showHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 800px; padding: 30px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.question({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('helpTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <!-- 使用說明區 -->
            <div class="compact-section" style="text-align: left; margin-top: 25px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span style="font-weight: 600; color: var(--text-color); font-size: 1.2em;">${t('helpUsageTitle')}</span>
                </div>
                
                <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                    ${t('helpUsageContent')}
                </div>
            </div>
            
            <!-- 功能介紹區 -->
            <div class="compact-section" style="text-align: left; margin-top: 30px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span style="font-weight: 600; color: var(--text-color); font-size: 1.2em;">${t('helpFeaturesTitle')}</span>
                </div>
                
                <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                    ${t('helpFeaturesContent')}
                </div>
            </div>
            
            <!-- 技巧提示區 -->
            <div class="compact-section" style="text-align: left; margin-top: 30px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span style="font-weight: 600; color: var(--text-color); font-size: 1.2em;">${t('helpTipsTitle')}</span>
                </div>
                
                <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                    ${t('helpTipsContent')}
                </div>
            </div>
            
            <div class="compact-modal-footer" style="margin-top: 25px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 顯示聯絡回報功能
function showContact() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 600px; padding: 30px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.email({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('contactTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <!-- 聯絡方式區 -->
            <div class="compact-section" style="text-align: left; margin-top: 25px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span style="font-weight: 600; color: var(--text-color); font-size: 0.95em;">${t('contactMethodsTitle')}</span>
                </div>
                
                <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                    ${t('contactMethodsContent')}
                </div>
            </div>
        
            
            <div class="compact-modal-footer" style="margin-top: 25px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}