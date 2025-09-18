// 標籤和排序管理
// ===== 統一標籤管理器 =====
class TagManager {
    // 標籤格式正規化：字串 -> 陣列
    static normalizeToArray(tagsInput) {
        if (!tagsInput) return [];
        if (Array.isArray(tagsInput)) return tagsInput;
        return tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // 標籤格式正規化：陣列 -> 字串（用於顯示）
    static normalizeToString(tagsArray) {
        if (!tagsArray) return '';
        if (typeof tagsArray === 'string') return tagsArray;
        return Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
    }
    
    // 從單個項目收集標籤（統一邏輯）
    static collectTagsFromItem(item) {
        const tags = new Set();
        item.versions.forEach(version => {
            const versionTags = this.normalizeToArray(version.tags);
            versionTags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }

        // 獲取所有標籤（四種類型共用）
    static getAllTags() {
    const allTags = new Set();
    [...characters, ...worldBooks, ...customSections, ...userPersonas, ...loveyDoveyCharacters].forEach(item => {
        const itemTags = this.collectTagsFromItem(item);
        itemTags.forEach(tag => allTags.add(tag));
    });
    
    return Array.from(allTags).sort();
}
    
    // 檢查項目是否包含指定標籤（統一邏輯）
    static itemHasTags(item, targetTags) {
        if (!targetTags || targetTags.length === 0) return true;
        
        const itemTags = this.collectTagsFromItem(item);
        const itemTagsSet = new Set(itemTags);
        
        // AND邏輯：所有目標標籤都必須存在
        return targetTags.every(targetTag => itemTagsSet.has(targetTag));
    }
}

// ===== 視覺化標籤輸入管理器 =====
class TagInputManager {
    // 創建視覺化標籤輸入欄位
static createTagInput(config) {
    const { id, value = '', itemType, itemId, versionId, fieldName, placeholder = '', compact = false } = config;
    
    // 將字串標籤轉換為陣列
    const tagsArray = TagManager.normalizeToArray(value);
    
    //  根據是否為緊湊模式調整樣式
    const containerStyle = compact ? `
        border: 1px solid var(--border-color); 
        border-radius: 4px; 
        padding: 4px 6px; 
        background: var(--surface-color);
        min-height: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        align-items: center;
        cursor: text;
        font-size: 0.85em;
    ` : `
        border: 1px solid var(--border-color); 
        border-radius: 6px; 
        padding: 8px; 
        background: var(--surface-color);
        min-height: 38px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
        cursor: text;
    `;
    
    const inputStyle = compact ? `
        border: none !important; 
        background: transparent !important; 
        outline: none !important; 
        flex: 1; 
        min-width: 80px;
        padding: 1px !important;
        margin: 0 !important;
        box-shadow: none !important;
        color: var(--text-color);
        font-size: 0.85em;
    ` : `
        border: none !important; 
        background: transparent !important; 
        outline: none !important; 
        flex: 1; 
        min-width: 100px;
        padding: 2px !important;
        margin: 0 !important;
        box-shadow: none !important;
        color: var(--text-color);
    `;
    
    return `
        <div class="tag-input-wrapper" style="position: relative;">
            <div class="tag-input-container" id="container-${id}" style="${containerStyle}" onclick="TagInputManager.focusInput('${id}')">
                <!-- 現有標籤 -->
                <div class="existing-tags" id="tags-display-${id}" style="display: flex; flex-wrap: wrap; gap: ${compact ? '2px' : '4px'};">
                    ${tagsArray.map(tag => this.createTagElement(tag, id, itemType, itemId, versionId, fieldName, compact)).join('')}
                </div>
                
                <!-- 隱藏的輸入框 -->
                <input type="text" 
                       id="${id}" 
                       class="field-input"
                       placeholder="${tagsArray.length === 0 ? placeholder : ''}"
                       style="${inputStyle}"
                       onkeydown="TagInputManager.handleKeydown(event, '${id}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')"
                       oninput="TagInputManager.handleInput(event, '${id}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')"
                       onfocus="TagInputManager.showSuggestionsIfHasValue('${id}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')">
            </div>
            
            <!-- 智能提示下拉選單 -->
            <div class="tag-suggestions" id="suggestions-${id}" style="
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-top: none;
                border-radius: 0 0 6px 6px;
                max-height: 150px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            "></div>
        </div>
    `;
}

   
    // 焦點時顯示提示（如果有值）
    static showSuggestionsIfHasValue(inputId, itemType, itemId, versionId, fieldName) {
        const input = document.getElementById(inputId);
        if (input && input.value.trim()) {
            this.showSuggestions(input.value.trim(), inputId, itemType, itemId, versionId, fieldName);
        }
    }
    
   // 創建單個標籤元素
static createTagElement(tagName, inputId, itemType, itemId, versionId, fieldName, compact = false) {
    const tagSize = compact ? 'tag-sm' : 'tag-md';
    
    return `
        <span class="tag-base ${tagSize}" data-tag="${tagName}" onclick="TagInputManager.removeTag('${tagName}', '${inputId}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')">
            ${tagName}
            <button class="tag-remove-btn">×</button>
        </span>
    `;
}
    
    // 處理鍵盤事件
    static handleKeydown(event, inputId, itemType, itemId, versionId, fieldName) {
        const input = event.target;
        const value = input.value.trim();
        const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
        
        // 處理方向鍵導航提示
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.navigateSuggestions(inputId, event.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        
        // Enter 選擇提示或添加標籤
        if (event.key === 'Enter') {
            event.preventDefault();
            const activeSuggestion = suggestionsDiv.querySelector('.suggestion-active');
            if (activeSuggestion) {
                this.selectSuggestion(activeSuggestion.textContent, inputId, itemType, itemId, versionId, fieldName);
            } else if (value) {
                this.addTag(value.replace(/,$/, ''), inputId, itemType, itemId, versionId, fieldName);
                input.value = '';
                this.hideSuggestions(inputId);
            }
            return;
        }
        
        // 逗號 + 空格 觸發添加標籤
        if ((event.key === ' ' && value.endsWith(',')) && value) {
            event.preventDefault();
            this.addTag(value.replace(/,$/, ''), inputId, itemType, itemId, versionId, fieldName);
            input.value = '';
            this.hideSuggestions(inputId);
        }
        
        // Backspace 刪除最後一個標籤（當輸入框為空時）
        if (event.key === 'Backspace' && !value) {
            const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
            const lastTag = tagsDisplay.querySelector('.tag-element:last-child');
            if (lastTag) {
                const tagName = lastTag.dataset.tag;
                this.removeTag(tagName, inputId, itemType, itemId, versionId, fieldName);
            }
        }
        
        // Escape 隱藏提示
        if (event.key === 'Escape') {
            this.hideSuggestions(inputId);
        }
    }
    
    // 處理輸入事件
    static handleInput(event, inputId, itemType, itemId, versionId, fieldName) {
        const input = event.target;
        const value = input.value.trim();
        const container = document.getElementById(`container-${inputId}`);
        const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
        
        // 更新 placeholder 顯示
        if (input.value || tagsDisplay.children.length > 0) {
            input.placeholder = '';
        }
        
        // 顯示智能提示
        if (value.length > 0) {
            this.showSuggestions(value, inputId, itemType, itemId, versionId, fieldName);
        } else {
            //  立即隱藏，不用延遲
            const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
            if (suggestionsDiv) {
                suggestionsDiv.style.display = 'none';
            }
        }
    }
    
    // 顯示智能提示
    static showSuggestions(inputValue, inputId, itemType, itemId, versionId, fieldName) {
        const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
        const currentTags = this.getCurrentTags(inputId);
        
        // 獲取所有可用標籤
        const allTags = TagManager.getAllTags();
        
        // 過濾匹配的標籤（排除已使用的）
        const suggestions = allTags.filter(tag => 
            tag.toLowerCase().includes(inputValue.toLowerCase()) && 
            !currentTags.includes(tag)
        ).slice(0, 5); // 最多顯示5個建議
        
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = suggestions.map(tag => `
                <div class="tag-suggestion" style="
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.2s ease;
" onmousedown="TagInputManager.selectSuggestion('${tag}', '${inputId}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')"
onmouseover="TagInputManager.setActiveSuggestion(this)"
onmouseout="TagInputManager.clearActiveSuggestion(this)">
                    ${tag}
                </div>
            `).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            this.hideSuggestions(inputId);
        }
    }
    
    // 隱藏提示
    static hideSuggestions(inputId) {
    const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}
    
    // 選擇提示
    static selectSuggestion(tagName, inputId, itemType, itemId, versionId, fieldName) {
    //  立即隱藏提示
    const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
    
    this.addTag(tagName, inputId, itemType, itemId, versionId, fieldName);
    const input = document.getElementById(inputId);
    input.value = '';
    input.focus();
}
    
    // 鍵盤導航提示
    static navigateSuggestions(inputId, direction) {
        const suggestionsDiv = document.getElementById(`suggestions-${inputId}`);
        const suggestions = suggestionsDiv.querySelectorAll('.tag-suggestion');
        if (suggestions.length === 0) return;
        
        const current = suggestionsDiv.querySelector('.suggestion-active');
        let newIndex = 0;
        
        if (current) {
            const currentIndex = Array.from(suggestions).indexOf(current);
            newIndex = currentIndex + direction;
            current.classList.remove('suggestion-active');
            current.style.background = '';
        }
        
        // 循環選擇
        if (newIndex < 0) newIndex = suggestions.length - 1;
        if (newIndex >= suggestions.length) newIndex = 0;
        
        const newActive = suggestions[newIndex];
        newActive.classList.add('suggestion-active');
        newActive.style.background = 'var(--border-color)';
    }
    
    // 設置活動建議
    static setActiveSuggestion(element) {
        const suggestionsDiv = element.parentNode;
        suggestionsDiv.querySelectorAll('.tag-suggestion').forEach(el => {
            el.classList.remove('suggestion-active');
            el.style.background = '';
        });
        element.classList.add('suggestion-active');
        element.style.background = 'var(--border-color)';
    }
    
    // 清除活動建議
    static clearActiveSuggestion(element) {
        if (!element.classList.contains('suggestion-active')) {
            element.style.background = '';
        }
    }
    
    // 獲取當前標籤
    static getCurrentTags(inputId) {
        const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
        return Array.from(tagsDisplay.querySelectorAll('.tag-element')).map(el => el.dataset.tag);
    }
    
    // 添加標籤
    static addTag(tagName, inputId, itemType, itemId, versionId, fieldName) {
        if (!tagName.trim()) return;
        
        const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
        const existingTags = this.getCurrentTags(inputId);
        
        // 避免重複標籤
        if (existingTags.includes(tagName)) return;
        
        // 添加新標籤元素
        const tagElement = this.createTagElement(tagName, inputId, itemType, itemId, versionId, fieldName);
        tagsDisplay.insertAdjacentHTML('beforeend', tagElement);
        
        // 更新數據
        this.updateData(inputId, itemType, itemId, versionId, fieldName);
    }
    
    // 移除標籤
    static removeTag(tagName, inputId, itemType, itemId, versionId, fieldName) {
        const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
        const tagElement = tagsDisplay.querySelector(`[data-tag="${tagName}"]`);
        if (tagElement) {
            tagElement.remove();
            this.updateData(inputId, itemType, itemId, versionId, fieldName);
            
            // 重新聚焦輸入框
            this.focusInput(inputId);
        }
    }
    
    // 聚焦輸入框
    static focusInput(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
        }
    }
    
static updateData(inputId, itemType, itemId, versionId, fieldName) {
    const tagsDisplay = document.getElementById(`tags-display-${inputId}`);
    const currentTags = Array.from(tagsDisplay.querySelectorAll('.tag-base')).map(el => {
        return el.dataset.tag || el.textContent.replace(/×$/, '').trim();
    });
    const tagsString = TagManager.normalizeToString(currentTags);

    // 更新記憶體中的資料
    updateField(itemType, itemId, versionId, fieldName, tagsString);

    // 強制靜默保存
    saveDataSilent();

    // 重新渲染版本面板以更新UI
    if (typeof ContentRenderer !== 'undefined' && ContentRenderer.rerenderVersionPanel) {
        // 檢查是否為卿卿我我類型且在雙屏模式下
        const isLoveyDoveyInCompareMode = itemType === 'loveydovey' && 
                                         ((typeof crossTypeCompareMode !== 'undefined' && crossTypeCompareMode) || 
                                          (typeof viewMode !== 'undefined' && viewMode === 'compare'));
        
        if (!isLoveyDoveyInCompareMode) {
            setTimeout(() => {
                ContentRenderer.rerenderVersionPanel(itemType, itemId, versionId);
            }, 50);
        }
        
        // 🔧 修復：重新渲染後，恢復所有欄位統計
        setTimeout(() => {
            if (typeof updateAllFieldStatsOnLoad === 'function') {
                updateAllFieldStatsOnLoad();
            }
        }, 100);
    }
}
}

// ===== TagAdminManager - 標籤管理器 =====
class TagAdminManager {
    static isTagManagerOpen = false;
    static currentView = 'list'; // 'list' 或 'detail'
    static currentTag = null;
    static tagStats = null;
    
    // 開啟標籤管理視窗
    static openTagManager() {
        if (this.isTagManagerOpen) {
        const existingModal = document.getElementById('tag-admin-modal');
        if (!existingModal) {
            console.warn('🔧 檢測到狀態不同步，自動重置 TagAdminManager 狀態');
            this.isTagManagerOpen = false;
            this.currentView = 'list';
            this.currentTag = null;
        } else {
            return;
        }
    }
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'tag-admin-modal';
        modal.style.display = 'block';
        
       modal.innerHTML = `
    <div class="compact-modal-content" style="max-width: 800px; max-height: 85%; overflow: hidden; display: flex; flex-direction: column;">
        <div id="tag-admin-header" class="compact-modal-header" style="justify-content: space-between;">
            <!-- 麵包屑 -->
        </div>
        
        <div id="tag-admin-container" style="flex: 1; overflow-y: auto;">

            <!-- 內容 -->
        </div>
    </div>
`;
        
        document.body.appendChild(modal);
        this.isTagManagerOpen = true;
        
        // 點擊遮罩關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTagManager();
            }
        });
        
        // ESC 鍵關閉
        document.addEventListener('keydown', this.handleKeydown);
        
        // 載入標籤列表
        this.loadTagList();
    }
    
    // 關閉標籤管理視窗
    static closeTagManager() {
        const modal = document.getElementById('tag-admin-modal');
        if (modal) {
            modal.remove();
        }
        this.isTagManagerOpen = false;
        this.currentView = 'list';
        this.currentTag = null;
        document.removeEventListener('keydown', this.handleKeydown);
    }
    
    // 鍵盤事件處理
    static handleKeydown = (e) => {
        if (e.key === 'Escape') {
            TagAdminManager.closeTagManager();
        }
    }
    
    // 載入標籤列表
    static loadTagList() {
        this.currentView = 'list';
        this.calculateTagStats();
        this.updateHeader(t('tagManagement'));
        this.renderTagList();
    }
    
    // 計算標籤統計
    static calculateTagStats() {
        const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
        const tagStats = new Map();
        
        // 統計角色卡標籤
        characters.forEach(character => {
            character.versions.forEach(version => {
                if (version.tags) {
                    const tags = TagManager.normalizeToArray(version.tags);
                    tags.forEach(tag => {
                        if (!tagStats.has(tag)) {
                            tagStats.set(tag, { characters: 0, loveydoveys: 0, worldbooks: 0, customs: 0, personas: 0, total: 0 });
                        }
                        tagStats.get(tag).characters++;
                        tagStats.get(tag).total++;
                    });
                }
            });
        });

        // 統計卿卿我我角色標籤
        if (showLoveyDovey) {
        loveyDoveyCharacters.forEach(loveyDovey => {
            loveyDovey.versions.forEach(version => {
                if (version.tags) {
                    const tags = TagManager.normalizeToArray(version.tags);
                    tags.forEach(tag => {
                        if (!tagStats.has(tag)) {
                            tagStats.set(tag, { 
                                characters: 0, 
                                worldbooks: 0, 
                                customs: 0, 
                                personas: 0,
                                loveydoveys: 0,
                                total: 0 
                            });
                        }
                        tagStats.get(tag).loveydoveys++;
                        tagStats.get(tag).total++;
                    });
                }
            });
        });
    }

        // 統計玩家角色標籤
        userPersonas.forEach(persona => {
            persona.versions.forEach(version => {
                if (version.tags) {
                    const tags = TagManager.normalizeToArray(version.tags);
                    tags.forEach(tag => {
                        if (!tagStats.has(tag)) {
                            tagStats.set(tag, { characters: 0, loveydoveys: 0, worldbooks: 0, customs: 0, personas: 0, total: 0 });
                        }
                        tagStats.get(tag).personas++;
                        tagStats.get(tag).total++;
                    });
                }
            });
        });
        
        // 統計世界書標籤
        worldBooks.forEach(worldbook => {
            worldbook.versions.forEach(version => {
                if (version.tags) {
                    const tags = TagManager.normalizeToArray(version.tags);
                    tags.forEach(tag => {
                        if (!tagStats.has(tag)) {
                            tagStats.set(tag, { characters: 0, loveydoveys: 0, worldbooks: 0, customs: 0, personas: 0, total: 0 });
                        }
                        tagStats.get(tag).worldbooks++;
                        tagStats.get(tag).total++;
                    });
                }
            });
        });
        
        // 統計筆記本標籤
        customSections.forEach(section => {
            section.versions.forEach(version => {
                if (version.tags) {
                    const tags = TagManager.normalizeToArray(version.tags);
                    tags.forEach(tag => {
                        if (!tagStats.has(tag)) {
                            tagStats.set(tag, { characters: 0, loveydoveys: 0, worldbooks: 0, customs: 0, personas: 0, total: 0 });
                        }
                        tagStats.get(tag).customs++;
                        tagStats.get(tag).total++;
                    });
                }
            });
        });
        
        this.tagStats = tagStats;
    }
    
    // 渲染標籤列表
    static renderTagList() {

        // 更新標題欄
    this.updateHeader(t('tagManagement'));
        const container = document.getElementById('tag-admin-container');
        if (!container) return;
        
        if (this.tagStats.size === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                    ${t('noTagsFound')}
                </div>
            `;
            return;
        }
        
        // 轉換為陣列並排序
        const sortedTags = Array.from(this.tagStats.entries())
            .sort((a, b) => b[1].total - a[1].total);
        
        let html = `
    <div style="margin: 0px 0 20px 0;">
        <input type="text" 
               id="tag-search-input" 
               class="field-input msize-input"
               placeholder="${t('searchTagsPlaceholder')}"
               style="font-size: 0.9em; padding: 12px 16px; width: 100%;"
               oninput="TagAdminManager.filterTags(this.value)">
    </div>
    
    <div id="tag-list">
`;
        
        sortedTags.forEach(([tagName, stats]) => {
            html += this.renderTagItem(tagName, stats);
        });
        
        html += '</div>';
        
        container.innerHTML = html;
    }
    
static renderTagItem(tagName, stats) {
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    return `
        <div class="tag-item tag-item-hover" data-tag="${tagName}" style="
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: var(--surface-color);
            transition: all 0.2s ease;
        ">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div onclick="TagAdminManager.showTagDetail('${tagName}')" style="cursor: pointer; flex: 1; display: flex; align-items: center; gap: 8px;">
                    ${IconManager.bookmark({style: 'color: var(--accent-color);'})}
                    <span style="font-size: 0.95em; font-weight: 500; color: var(--text-color);">
                        ${tagName}
                    </span>
                    <span style="font-size: 0.8em; color: var(--text-muted); display: flex; align-items: center;">
                        (${stats.total})
                    </span>
                </div>
                
                <div style="display: flex; gap: 1px;">
                   <button class="transparent-bg-btn hover-primary" 
            onclick="TagAdminManager.renameTag('${tagName}')" 
            title="${t('renameTag')}">
       ${IconManager.edit({width: 13, height: 13})}
    </button>
                    
                    <button class="transparent-bg-btn hover-primary" onclick="TagAdminManager.deleteTag('${tagName}')" title="${t('deleteTag')}">
                       ${IconManager.delete({width: 13, height: 13})}
                    </button>
                </div>
            </div>
            
             <div class="tag-stats-container">
                <span class="tag-stat-item">
                   ${IconManager.user({width: 11, height: 11})}
                    <span class="tag-stat-number">${stats.characters}</span>
                    <span class="tag-stat-text">${t('itemCharacterCards')}</span>
                </span>
                ${showLoveyDovey ? `
                <span class="tag-stat-item">
                    ${IconManager.heart({width: 11, height: 11})}
                    <span class="tag-stat-number">${stats.loveydoveys || 0}</span>
                    <span class="tag-stat-text">${t('itemLoveyDoveyCharacters')}</span>
                </span>
                ` : ''}
                <span class="tag-stat-item">
                    ${IconManager.smile({width: 11, height: 11})}
                    <span class="tag-stat-number">${stats.personas}</span>
                    <span class="tag-stat-text">${t('itemUserPersonas')}</span>
                </span>
                <span class="tag-stat-item">
                   ${IconManager.book({width: 11, height: 11})}
                    <span class="tag-stat-number">${stats.worldbooks}</span>
                    <span class="tag-stat-text">${t('itemWorldBooks')}</span>
                </span>
                <span class="tag-stat-item">
                    ${IconManager.file({width: 11, height: 11})}
                    <span class="tag-stat-number">${stats.customs}</span>
                    <span class="tag-stat-text">${t('itemNotebooks')}</span>
                </span>
            </div>
        </div>
    `;
}
    
    // 篩選標籤
    static filterTags(searchText) {
        const tagItems = document.querySelectorAll('.tag-item');
        const searchLower = searchText.toLowerCase();
        
        tagItems.forEach(item => {
            const tagName = item.dataset.tag.toLowerCase();
            if (tagName.includes(searchLower)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 顯示標籤詳情
static showTagDetail(tagName) {
    this.currentView = 'detail';
    this.currentTag = tagName;
    this.renderTagDetail(tagName);
}

// 返回標籤列表
static backToTagList() {
    this.currentView = 'list';
    this.currentTag = null;
    this.renderTagList();
}

// 渲染標籤詳情頁
static renderTagDetail(tagName) {
    this.updateHeader(`
    <div style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
        <button onclick="TagAdminManager.backToTagList()" 
                style="background: none; border: none; cursor: pointer; color: var(--text-color); font-size: 1em; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease; flex-shrink: 0; font-family: inherit; font-weight: 500;"
                onmouseover="this.style.color='var(--accent-color)'"
                onmouseout="this.style.color='var(--text-color)'">
           ${IconManager.arrowLeft({width: 14, height: 14})}
            ${t('tagList')}
        </button>
        <span style="color: var(--text-muted); font-weight: 500;">/</span>
        <span style="color: var(--text-color); font-weight: 500;">${tagName}</span>
    </div>
`);
    
    const container = document.getElementById('tag-admin-container');
    if (!container) return;
    
    const stats = this.tagStats.get(tagName);
    if (!stats) return;
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    const items = this.getItemsWithTag(tagName);
    
    let html = '<div style="margin-top: 0px;">';
    
    // 角色卡區塊
    if (items.characters.length > 0) {
        html += this.renderItemSection(t('character'), items.characters, 'character');
    }

    // 卿卿我我區塊
    if (showLoveyDovey && items.loveydoveys && items.loveydoveys.length > 0) {
        html += this.renderItemSection(t('loveydovey'), items.loveydoveys, 'loveydovey');
    }

    // 玩家角色區塊
    if (items.personas.length > 0) {
        html += this.renderItemSection(t('userPersona'), items.personas, 'persona');
    }
    
    // 世界書區塊
    if (items.worldbooks.length > 0) {
        html += this.renderItemSection(t('worldBook'), items.worldbooks, 'worldbook');
    }
    
    // 筆記本區塊
    if (items.customs.length > 0) {
        html += this.renderItemSection(t('customFields'), items.customs, 'custom');
    }
    html += '</div>';
    container.innerHTML = html;
}

// 更新標題欄
static updateHeader(content) {
    const header = document.getElementById('tag-admin-header');
    if (!header) return;

    const isDetailPage = content.includes('<button');
    
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            ${isDetailPage ? '' : IconManager.bookmark({width: 18, height: 18})}
            <h3 class="compact-modal-title">${content}</h3>
        </div>
        <button class="close-modal" onclick="TagAdminManager.closeTagManager()">×</button>
    `;
}

// 收集使用指定標籤的所有項目
static getItemsWithTag(tagName) {
    const result = {
    characters: [],
    loveydoveys: [],
    worldbooks: [],
    customs: [],
    personas: []
};
    
    // 收集角色卡
    characters.forEach(character => {
        character.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    result.characters.push({
                        itemName: character.name,
                        versionName: version.name,
                        itemId: character.id,
                        versionId: version.id,
                        type: 'character'
                    });
                }
            }
        });
    });

     // 收集卿卿我我角色
    loveyDoveyCharacters.forEach(loveyDovey => {
        loveyDovey.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    result.loveydoveys.push({
                        itemName: loveyDovey.name,
                        versionName: version.name,
                        itemId: loveyDovey.id,
                        versionId: version.id,
                        type: 'loveydovey'
                    });
                }
            }
        });
    });

    // 收集玩家角色
    userPersonas.forEach(persona => {
        persona.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    result.personas.push({
                        itemName: persona.name,
                        versionName: version.name,
                        itemId: persona.id,
                        versionId: version.id,
                        type: 'userpersona'
                    });
                }
            }
        });
    });
    
    // 收集世界書
    worldBooks.forEach(worldbook => {
        worldbook.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    result.worldbooks.push({
                        itemName: worldbook.name,
                        versionName: version.name,
                        itemId: worldbook.id,
                        versionId: version.id,
                        type: 'worldbook'
                    });
                }
            }
        });
    });
    
    // 收集筆記本
    customSections.forEach(section => {
        section.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    result.customs.push({
                        itemName: section.name,
                        versionName: version.name,
                        itemId: section.id,
                        versionId: version.id,
                        type: 'custom'
                    });
                }
            }
        });
    });
    
    return result;
}

// 渲染項目區塊
static renderItemSection(sectionName, items, type) {
    const iconMap = {
        'character': IconManager.user({width: 14, height: 14}),
        'loveydovey': IconManager.heart({width: 14, height: 14}),
        'worldbook': IconManager.book({width: 14, height: 14}),
        'custom': IconManager.file({width: 14, height: 14}),
        'persona': IconManager.smile({width: 14, height: 14})
    };
    
    let html = `
        <div style="margin-bottom: 24px;">
            <h4 style="color: var(--accent-color); font-size: 1em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
                ${iconMap[type]}
                ${sectionName} (${items.length})
            </h4>
    `;
    
    items.forEach(item => {
        html += `
            <div class="tag-detail-item tag-item-hover" 
     onclick="TagAdminManager.jumpToItem('${item.type}', '${item.itemId}', '${item.versionId}')"
     style="padding: 12px 16px; margin-bottom: 8px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: all 0.2s ease;">
                <div style="font-weight: 500; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                    ${IconManager.folder({width: 12, height: 12, style: 'color: var(--text-muted);'})}
                    ${item.itemName} > ${item.versionName}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 跳轉到項目
static jumpToItem(type, itemId, versionId) {
    this.closeTagManager();
    
    // 延遲執行，確保模態框完全關閉
    setTimeout(() => {
        selectItem(type, itemId, versionId);
    }, 100);
}
    
    // 重命名標籤
static renameTag(tagName) {
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    const affectedItems = this.getItemsWithTag(tagName);
    
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.edit({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('renameTag')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <p class="compact-modal-desc" style="text-align: left;">
                ${t('renameTagTo').replace('$1', tagName)}
            </p>

            <div class="compact-section" style="text-align: left; padding: 0;">
                <input type="text" 
                       id="rename-tag-input" 
                       class="field-input msize-input"
                       value="${tagName}"
                       style="width: 100%; font-size: 1em; padding: 12px 16px; margin-bottom: 16px;"
                       onkeydown="if(event.key==='Enter') TagAdminManager.confirmRename('${tagName}')"
                       autofocus>
            </div>
            
            ${ConfirmationRenderer.renderListSection({
    title: `${t('affectedItemsCount').replace('$1', this.tagStats.get(tagName).total)}`,
    icon: 'refresh',
    items: [this.renderAffectedItemsList(affectedItems)],
    maxHeight: '120px'
})}

            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                <button class="overview-btn btn-primary" onclick="TagAdminManager.confirmRename('${tagName}')">${t('confirmRename')}</button>
            </div>
        </div>
    `;
    
    const modal = ModalManager.create({
        title: '',
        content: content,
        footer: '',
        maxWidth: '500px'
    });
    
    // 聚焦並選中輸入框
    setTimeout(() => {
        const input = document.getElementById('rename-tag-input');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

    // 確認重命名
    static confirmRename(oldTagName) {
        const input = document.getElementById('rename-tag-input');
        if (!input) return;
        
        const newTagName = input.value.trim();
        
        // 驗證新標籤名稱
        if (!newTagName) {
            alert(t('tagNameCannotEmpty'));
            return;
        }
        
        if (newTagName === oldTagName) {
            // 沒有變更，直接關閉
            const renameModal = input.closest('.modal');
            if (renameModal) {
                renameModal.remove();
            }
            return;
        }
        
        if (this.tagStats.has(newTagName)) {
            alert(t('tagAlreadyExists').replace('$1', newTagName));
            return;
        }
        
        // 執行重命名
        this.performRename(oldTagName, newTagName);
        
        // 關閉重命名對話框（修正）
        const renameModal = input.closest('.modal');
        if (renameModal) {
            renameModal.remove();
        }
    }

// 執行重命名操作
static performRename(oldTagName, newTagName) {
    let affectedCount = 0;
    
    // 重命名角色卡中的標籤
    characters.forEach(character => {
        character.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(oldTagName)) {
                    const newTags = tags.map(tag => tag === oldTagName ? newTagName : tag);
                    version.tags = TagManager.normalizeToString(newTags);
                    affectedCount++;
                    
                    // 更新時間戳
                    TimestampManager.updateVersionTimestamp('character', character.id, version.id);
                }
            }
        });
    });

    // 重命名卿卿我我角色中的標籤
    loveyDoveyCharacters.forEach(loveyDovey => {
        loveyDovey.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(oldTagName)) {
                    const newTags = tags.map(tag => tag === oldTagName ? newTagName : tag);
                    version.tags = TagManager.normalizeToString(newTags);
                    affectedCount++;
                    
                    // 更新時間戳
                    TimestampManager.updateVersionTimestamp('loveydovey', loveyDovey.id, version.id);
                }
            }
        });
    });

    // 重命名玩家角色中的標籤
    userPersonas.forEach(persona => {
        persona.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(oldTagName)) {
                    const newTags = tags.map(tag => tag === oldTagName ? newTagName : tag);
                    version.tags = TagManager.normalizeToString(newTags);
                    affectedCount++;
                    
                    // 更新時間戳
                    TimestampManager.updateVersionTimestamp('persona', persona.id, version.id);
                }
            }
        });
    });
        
    // 重命名世界書中的標籤
    worldBooks.forEach(worldbook => {
        worldbook.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(oldTagName)) {
                    const newTags = tags.map(tag => tag === oldTagName ? newTagName : tag);
                    version.tags = TagManager.normalizeToString(newTags);
                    affectedCount++;
                    
                    // 更新時間戳
                    TimestampManager.updateVersionTimestamp('worldbook', worldbook.id, version.id);
                }
            }
        });
    });
    
    // 重命名筆記本中的標籤
    customSections.forEach(section => {
        section.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(oldTagName)) {
                    const newTags = tags.map(tag => tag === oldTagName ? newTagName : tag);
                    version.tags = TagManager.normalizeToString(newTags);
                    affectedCount++;
                    
                    // 更新時間戳
                    TimestampManager.updateVersionTimestamp('custom', section.id, version.id);
                }
            }
        });
    });
    
    // 標記數據已更改
    markAsChanged();

    //  自動保存數據
    saveDataSilent().then(() => {
        
    }).catch(error => {
        console.error('❌ 標籤重新命名後自動保存失敗:', error);
    });

    // 顯示成功訊息
   NotificationManager.success(t('tagRenameSuccess').replace('$1', affectedCount));

    // 重新載入標籤列表
    this.loadTagList();
    }
    
    // 刪除標籤
static deleteTag(tagName) {
    const stats = this.tagStats.get(tagName);
    if (!stats) return;
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    const affectedItems = this.getItemsWithTag(tagName);
    
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.delete({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('deleteTag')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <p class="compact-modal-desc" style="text-align: left;">
            ${t('selectDeleteMethod').replace('$1', `<span class="tag-base tag-smt">${tagName}</span>`)}

            </p>

            <div class="compact-section" style="text-align: left; padding: 0;">
                <label style="display: flex; align-items: flex-start; cursor: pointer; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 12px; transition: all 0.2s ease;" 
                       onmouseover="this.style.borderColor='var(--primary-color)'" 
                       onmouseout="this.style.borderColor='var(--border-color)'">
                    <input type="radio" name="delete-mode" value="tag-only" checked style="margin-right: 12px; margin-top: 2px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: var(--text-color); margin-bottom: 4px;">${t('removeTagOnly')}</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.4;">
                            ${t('removeTagOnlyDesc').replace('$1', `<span class="tag-base tag-smt">${tagName}</span>`)}
                        </div>
                    </div>
                </label>
                
                <label style="display: flex; align-items: flex-start; cursor: pointer; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; transition: all 0.2s ease;" 
                       onmouseover="this.style.borderColor='var(--primary-color)'" 
                       onmouseout="this.style.borderColor='var(--border-color)'">
                    <input type="radio" name="delete-mode" value="content-too" style="margin-right: 12px; margin-top: 2px;">
                    <div>
                        <div style="font-weight: 500; color: var(--text-color); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
${t('deleteAllContent')}
                        </div>
                        <div style="font-size: 0.85em; color: var(--text-muted); line-height: 1.4;">
                            ${t('deleteAllContentDesc').replace('$1', `<span class="tag-base tag-smt">${tagName}</span>`)}
                        </div>
                    </div>
                </label>
            </div>

            ${ConfirmationRenderer.renderListSection({
                title: `${t('affectedItemsCount').replace('$1', stats.total)}`,
                items: [this.renderAffectedItemsList(affectedItems)],
                maxHeight: '120px'
            })}

            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                <button class="overview-btn btn-primary" onclick="TagAdminManager.handleDeleteChoice('${tagName}')">${t('continue')}</button>
            </div>
        </div>
    `;
    
    ModalManager.create({
        title: '',
        content: content,
        footer: '',
        maxWidth: '600px'
    });
}

// 渲染受影響項目列表
static renderAffectedItemsList(affectedItems) {
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    let html = '';
    
    // 角色卡
    if (affectedItems.characters.length > 0) {
        html += `<div style="margin-bottom: 4px; font-size: 0.75em; color: var(--accent-color);">${t('categoryCharacterCards')}</div>`;
        affectedItems.characters.forEach(item => {
            html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
        });
    }

    // 卿卿我我
    if (showLoveyDovey && affectedItems.loveydoveys && affectedItems.loveydoveys.length > 0) {
    html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('categoryLoveyDoveyCharacters')}</div>`;
    affectedItems.loveydoveys.forEach(item => {
        html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
    });
}

    // 玩家角色
    if (affectedItems.personas.length > 0) {
        html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('categoryUserPersonas')}</div>`;
        affectedItems.personas.forEach(item => {
            html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
        });
    }
    
    // 世界書
    if (affectedItems.worldbooks.length > 0) {
        html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('categoryWorldBooks')}</div>`;
        affectedItems.worldbooks.forEach(item => {
            html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
        });
    }
    
    // 筆記本
    if (affectedItems.customs.length > 0) {
        html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('categoryNotebooks')}</div>`;
        affectedItems.customs.forEach(item => {
            html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
        });
    }
    
    return html;
}

// 處理刪除選擇
static handleDeleteChoice(tagName) {
    const deleteMode = document.querySelector('input[name="delete-mode"]:checked')?.value;
    
    // 關閉選擇模式的視窗
    const firstModal = document.querySelector('.modal');
    if (firstModal) {
        firstModal.remove();
    }
    
    if (deleteMode === 'tag-only') {
        // 僅移除標籤：簡單確認
        this.confirmTagOnlyDelete(tagName);
    } else {
        // 刪除內容：危險操作流程（移除最終確認）
        this.startDangerousDeleteFlow(tagName);
    }
}
// 僅移除標籤的確認
static confirmTagOnlyDelete(tagName) {
    const stats = this.tagStats.get(tagName);
    
    ConfirmationRenderer.render({
        icon: 'delete',
        title: t('confirmRemoveTag'),
        description: `${t('confirmRemoveTagMessage').replace('$1', stats.total).replace('$2', `<span class="tag-base tag-smt">${tagName}</span>`)}`,
        subText: t('contentWillBeKept'),
        cancelText: t('cancel'),
        confirmText: t('confirmRemove'),
        confirmAction: `TagAdminManager.performDeleteAndClose('${tagName}', 'tag-only')`,
        maxWidth: '400px',
        isDanger: false
    });
}

// 執行刪除並強制關閉模態框
static performDeleteAndClose(tagName, mode) {
    // 先關閉當前模態框
    const currentModal = event.target.closest('.modal');
    if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
    }
    
    // 延遲執行刪除操作，確保模態框先關閉
    setTimeout(() => {
        this.performDelete(tagName, mode);
    }, 50);
}

// 開始危險刪除流程
static startDangerousDeleteFlow(tagName) {
    const stats = this.tagStats.get(tagName);
    const affectedItems = this.getItemsWithTag(tagName);
    
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.warning({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('dangerousOperation')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <p class="compact-modal-desc" style="text-align: left;">
                ${t('permanentDeleteWarning')}
            </p>

            ${ConfirmationRenderer.renderListSection({
            title: `${t('willDeleteVersionsCount').replace('$1', stats.total)}`,
            items: [this.renderAffectedItemsList(affectedItems)],
            maxHeight: '150px'
        })}
                    
<div class="compact-modal-footer">
    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
    <button class="overview-btn btn-primary" onclick="TagAdminManager.confirmContentDelete('${tagName}')">${t('confirmExecute')}</button>
</div>
        </div>
    `;
    
    const modal = ModalManager.create({
        title: '',
        content: content,
        footer: '',
        maxWidth: '550px'
    });
    
    // 聚焦輸入框
    setTimeout(() => {
        const input = document.getElementById('dangerous-delete-input');
        if (input) {
            input.focus();
        }
    }, 100);
}

// 確認刪除內容
static confirmContentDelete(tagName) {
    const stats = this.tagStats.get(tagName);
    
    // 先關閉當前模態框
    const currentModal = document.querySelector('.modal');
    if (currentModal) {
        currentModal.remove();
    }
    
    ConfirmationRenderer.render({
        icon: 'delete',
        title: t('confirmDeleteContent'),
        description: `${t('confirmDeleteContentMessage').replace('$1', stats.total).replace('$2', `<span class="tag-base tag-smt">${tagName}</span>`)}`,
        subText: t('thisActionCannotBeUndone'),
        cancelText: t('cancel'),
        confirmText: t('confirmDelete'),
        confirmAction: `TagAdminManager.performDeleteAndClose('${tagName}', 'content-too')`,
        maxWidth: '400px',
        isDanger: true
    });
}

     // 執行刪除操作
static performDelete(tagName, mode) {
    
    try {
        let affectedCount = 0;
        
        if (mode === 'tag-only') {
            // 僅移除標籤，保留內容
            affectedCount = this.removeTagFromAllItems(tagName);
            NotificationManager.success(t('tagRemoveSuccess').replace('$1', affectedCount).replace('$2', tagName));

        } else {
            // 刪除所有相關內容
            const deletedVersions = this.deleteAllItemsWithTag(tagName);
            NotificationManager.success(t('tagDeleteSuccess').replace('$1', deletedVersions.length).replace('$2', tagName));
        }
        
        // 標記數據已更改
        markAsChanged();
        
        //  使用靜默保存，避免重複通知
        saveDataSilent();
        
        // 強制關閉所有模態框
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        // 確保標籤管理器狀態重置
        this.isTagManagerOpen = false;
        this.currentView = 'list';
        this.currentTag = null;
        
        // 延遲重新渲染界面
        setTimeout(() => {
            renderAll();
            renderSidebar();
            
            // 如果在首頁，重新渲染角色卡
            if (isHomePage) {
                OverviewManager.renderCharacters();
            }
        }, 100);
        
    } catch (error) {
        console.error('刪除過程出錯:', error);
        
        // 即使出錯也要關閉模態框
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        alert(t('deleteFailed').replace('$1', error.message));
    }
}

// 僅移除標籤（修復版）
static removeTagFromAllItems(tagName) {
    let affectedCount = 0;
    
    // 從角色卡中移除
    characters.forEach(character => {
        character.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    const newTags = tags.filter(tag => tag !== tagName);
                    version.tags = TagManager.normalizeToString(newTags);
                    TimestampManager.updateVersionTimestamp('character', character.id, version.id);
                    affectedCount++;
                }
            }
        });
    });

    // 從卿卿我我角色中移除
    loveyDoveyCharacters.forEach(loveyDovey => {
        loveyDovey.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    const newTags = tags.filter(tag => tag !== tagName);
                    version.tags = TagManager.normalizeToString(newTags);
                    TimestampManager.updateVersionTimestamp('loveydovey', loveyDovey.id, version.id);
                    affectedCount++;
                }
            }
        });
    });

    // 從玩家角色中移除
    userPersonas.forEach(persona => {
        persona.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    const newTags = tags.filter(tag => tag !== tagName);
                    version.tags = TagManager.normalizeToString(newTags);
                    TimestampManager.updateVersionTimestamp('persona', persona.id, version.id);
                    affectedCount++;
                }
            }
        });
    });
    
    // 從世界書中移除
    worldBooks.forEach(worldbook => {
        worldbook.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    const newTags = tags.filter(tag => tag !== tagName);
                    version.tags = TagManager.normalizeToString(newTags);
                    TimestampManager.updateVersionTimestamp('worldbook', worldbook.id, version.id);
                    affectedCount++;
                }
            }
        });
    });
    
    // 從筆記本中移除
    customSections.forEach(section => {
        section.versions.forEach(version => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    const newTags = tags.filter(tag => tag !== tagName);
                    version.tags = TagManager.normalizeToString(newTags);
                    TimestampManager.updateVersionTimestamp('custom', section.id, version.id);
                    affectedCount++;
                }
            }
        });
    });
    
    return affectedCount;
}

// 刪除所有相關內容
static deleteAllItemsWithTag(tagName) {
    const deletedVersions = [];
    const itemsToDelete = [];
    
    // 🔧 處理角色卡
    for (let i = characters.length - 1; i >= 0; i--) {
        const character = characters[i];
        const versionsToDelete = [];
        
        character.versions.forEach((version, index) => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    versionsToDelete.push(index);
                    deletedVersions.push(`${t('character')}：${character.name} - ${version.name}`);
                }
            }
        });
        
        if (versionsToDelete.length > 0) {
            if (versionsToDelete.length === character.versions.length) {
                // 所有版本都要刪除，刪除整個角色
                characters.splice(i, 1);
            } else {
                // 只刪除部分版本，從後往前刪除
                versionsToDelete.reverse().forEach(index => {
                    character.versions.splice(index, 1);
                });
            }
        }
    }

    // 處理卿卿我我角色
    for (let i = loveyDoveyCharacters.length - 1; i >= 0; i--) {
        const loveyDovey = loveyDoveyCharacters[i];
        const versionsToDelete = [];
        
        loveyDovey.versions.forEach((version, index) => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    versionsToDelete.push(index);
                    deletedVersions.push(`${t('loveydovey')}：${loveyDovey.name} - ${version.name}`);
                }
            }
        });
        
        if (versionsToDelete.length > 0) {
            if (versionsToDelete.length === loveyDovey.versions.length) {
                // 所有版本都要刪除，刪除整個卿卿我我角色
                loveyDoveyCharacters.splice(i, 1);
            } else {
                // 只刪除部分版本，從後往前刪除
                versionsToDelete.reverse().forEach(index => {
                    loveyDovey.versions.splice(index, 1);
                });
            }
        }
    }

    // 處理玩家角色
    for (let i = userPersonas.length - 1; i >= 0; i--) { // 從後往前遍歷
        const persona = userPersonas[i];
        const versionsToDelete = [];
        
        persona.versions.forEach((version, index) => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    versionsToDelete.push(index);
                    deletedVersions.push(`${t('userPersona')}：${persona.name} - ${version.name}`);
                }
            }
        });
        
        if (versionsToDelete.length > 0) {
            if (versionsToDelete.length === persona.versions.length) {
                // 所有版本都要刪除，刪除整個玩家角色
                userPersonas.splice(i, 1);
            } else {
                // 只刪除部分版本，從後往前刪除
                versionsToDelete.reverse().forEach(index => {
                    persona.versions.splice(index, 1);
                });
            }
        }
    }
    
    // 處理世界書
    for (let i = worldBooks.length - 1; i >= 0; i--) {
        const worldbook = worldBooks[i];
        const versionsToDelete = [];
        
        worldbook.versions.forEach((version, index) => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    versionsToDelete.push(index);
                    deletedVersions.push(`${t('worldBook')}：${worldbook.name} - ${version.name}`);
                }
            }
        });
        
        if (versionsToDelete.length > 0) {
            if (versionsToDelete.length === worldbook.versions.length) {
                // 所有版本都要刪除，刪除整個世界書
                worldBooks.splice(i, 1);
            } else {
                // 只刪除部分版本
                versionsToDelete.reverse().forEach(index => {
                    worldbook.versions.splice(index, 1);
                });
            }
        }
    }
    
    // 處理筆記本
    for (let i = customSections.length - 1; i >= 0; i--) {
        const section = customSections[i];
        const versionsToDelete = [];
        
        section.versions.forEach((version, index) => {
            if (version.tags) {
                const tags = TagManager.normalizeToArray(version.tags);
                if (tags.includes(tagName)) {
                    versionsToDelete.push(index);
                    deletedVersions.push(`${t('customFields')}：${section.name} - ${version.name}`);
                }
            }
        });
        
        if (versionsToDelete.length > 0) {
            if (versionsToDelete.length === section.versions.length) {
                // 所有版本都要刪除，刪除整個筆記本
                customSections.splice(i, 1);
            } else {
                // 只刪除部分版本
                versionsToDelete.reverse().forEach(index => {
                    section.versions.splice(index, 1);
                });
            }
        }
    }
    
    return deletedVersions;
}
    
}

// 全域點擊事件
document.addEventListener('click', function(e) {
    // 隱藏所有標籤提示框
    const allSuggestions = document.querySelectorAll('.tag-suggestions');
    allSuggestions.forEach(suggestionsDiv => {
        // 如果點擊的不是提示框或其父容器，則隱藏
        if (!suggestionsDiv.contains(e.target) && 
            !e.target.closest('.tag-input-wrapper')) {
            suggestionsDiv.style.display = 'none';
        }
    });
});