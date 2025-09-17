// 統一的內容渲染器
class ContentRenderer {

    // 主要內容渲染入口
static renderMainContent() {
    const originalIsHomePage = isHomePage;
    const originalIsListPage = isListPage;
    const originalCurrentMode = currentMode;
    const container = document.getElementById('contentArea');
    
    // 如果是首頁狀態，顯示歡迎頁面
    if (originalIsHomePage) {
        this.renderHomePage(container);
        return;
    }
    
    // 如果是列表頁面，顯示列表
    if (originalIsListPage) {
        this.renderListPage(container);
        return;
    }

    // 如果是玩家角色總覽頁面，顯示卡片格式
    if (!originalIsHomePage && !originalIsListPage && originalCurrentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        this.renderUserPersonaOverview(container);
        return;
    }
// 如果是卿卿我我總覽頁面，顯示卡片格式
    if (!originalIsHomePage && !originalIsListPage && originalCurrentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        this.renderLoveyDoveyOverview(container);
        return;
    }

// 如果是卿卿我我總覽頁面，顯示卡片格式
    if (!originalIsHomePage && !originalIsListPage && originalCurrentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        this.renderLoveyDoveyOverview(container);
        return;
    }
    
    const currentItem = ItemManager.getCurrentItem();
    
    if (!currentItem) {
        container.innerHTML = this.renderEmptyState();
        return;
    }
        
        const versionsToShow = this.getVersionsToShow(currentItem);
        
        const versionsHTML = `
    <div class="versions-container ${viewMode}-view">
        ${versionsToShow.map(version => this.renderVersionPanel(currentItem, version)).join('')}
    </div>
    `;

    container.innerHTML = `
    ${this.renderItemHeader(currentItem)}
    ${versionsHTML}
    `;
        
initAutoResize();

if (currentItem && currentItem.id) {
    const currentVersionId = ItemManager.getCurrentVersionId();
    if (currentVersionId) {
        DragSortManager.enableAdditionalInfoDragSort(currentItem.id, currentVersionId);
    }
}

// 🎯 立即設置滾動位置到頂部（無動畫）
document.getElementById('contentArea').scrollTop = 0;
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;

// 🎯 新增：DOM 渲染完成後更新欄位統計
requestAnimationFrame(() => {
    // 再次確保在頂部
    document.getElementById('contentArea').scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
setTimeout(() => {
    updateAllFieldStatsOnLoad();
    
    // 最終確保在頂部
    document.getElementById('contentArea').scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 啟用筆記本欄位拖曳排序（如果當前在筆記本模式）
    if (currentMode === 'custom' && currentCustomSectionId && currentCustomVersionId) {
        DragSortManager.enableCustomFieldsDragSort(currentCustomSectionId, currentCustomVersionId);
    }
}, 50);
});
    }


    // 渲染卿卿我我總覽頁面 
    static renderLoveyDoveyOverview(container) {
        // 使用統一渲染
        OverviewManager.renderOverview('loveydovey');
    }

// 渲染卿卿我我卡片
static renderLoveyDoveyCards() {
    // 🎯 直接調用統一卡片渲染函數
    OverviewManager.renderCards('loveydovey');
}
        

static renderItemHeader(item) {
    const itemType = currentMode;
    const itemTypeDisplay = this.getItemTypeDisplay(itemType);
    const versionId = ItemManager.getCurrentVersionId();

    // 1. 將可重用的 HTML 片段抽離出來
    const actionButtonsHTML = `
        <button class="btn-edit-header hover-primary" 
                onclick="VersionCRUD.add('${itemType}', '${item.id}')"
                title="${t('addVersion')}">
            ${IconManager.plus({width: 16, height: 16})}
        </button>
        <button class="btn-edit-header hover-primary" 
                onclick="ItemCRUD.copy('${itemType}', '${item.id}')"
                title="${this.getCopyButtonText(itemType)}">
            ${IconManager.copy({width: 16, height: 16})}
        </button>
        <button class="btn-edit-header hover-primary" 
                onclick="ExportManager.export('${itemType}', '${item.id}', 'unified')"
                title="${this.getExportButtonText(itemType)}">
            ${IconManager.download({width: 16, height: 16})}
        </button>
        <button class="btn-edit-header hover-primary" 
                onclick="ItemCRUD.remove('${itemType}', '${item.id}')"
                title="${this.getDeleteButtonText(itemType)}">
            ${IconManager.delete({width: 16, height: 16})}
        </button>
    `;

    const viewToggleSwitchHTML = `
        <button class="view-toggle-switch ${viewMode === 'single' ? 'single-mode' : 'compare-mode'}" 
            onclick="toggleCompareMode()">
            <div class="toggle-background"></div>
            <div class="toggle-text single">${t('singleView')}</div>
            <div class="toggle-text compare">${t('compareView')}</div>
        </button>
    `;

    const worldBookSelectorDesktopHTML = itemType === 'character' ? `
        <select id="worldbook-selector-desktop-${versionId}" 
            class="select-edit-header hover-primary"
            onchange="updateWorldBookBinding(this.value)">
            ${this.generateWorldBookOptions()}
        </select>
    ` : '';

    const worldBookSelectorMobileHTML = itemType === 'character' ? `
        <select id="worldbook-selector-mobile-${versionId}" 
            class="select-edit-header hover-primary"
            onchange="updateWorldBookBinding(this.value)">
        ${this.generateWorldBookOptions()}
        </select>
    ` : '';

    // ✨ 關鍵修正：第一行總是包含操作按鈕，同時給它一個 wrapper class 方便 CSS 定位
    const firstRowControlsContent = `<div class="main-action-buttons">${actionButtonsHTML}</div>`;
    
    // ✨ 關鍵修正：第二行只在需要時才添加內容
    const secondRowControlsContent = itemType !== 'character' ? `<div class="header-spacer"></div><div class="mobile-action-buttons">${actionButtonsHTML}</div>` : '';
    
    // 3. 組裝最終的 HTML
    return `
        <div class="character-header-bar ${viewMode}-mode ${itemType === 'character' ? '' : 'no-worldbook'}">
            <!-- 第一行：角色名 + 主要操作按鈕 -->
            <div class="character-header-inner">
                <div class="character-title-section">
                    <input type="text" class="character-main-title-fixed title-font" value="${item.name}" 
                        onchange="updateItemName('${itemType}', '${item.id}', this.value)" 
                        placeholder="${itemTypeDisplay}${t('name')}">
                </div>
                <div class="character-controls">
                    ${firstRowControlsContent}
                    <!-- 電腦版視圖：將選擇器和開關放在這裡 -->
                    <div class="desktop-only-controls">
                        ${worldBookSelectorDesktopHTML}
                        ${viewToggleSwitchHTML}
                    </div>
                </div>
            </div>

            <!-- 第二行（手機版專用）：世界書 + 對比開關 -->
            <div class="character-header-second-row mobile-only">
                ${worldBookSelectorMobileHTML}
                ${secondRowControlsContent}
                ${viewToggleSwitchHTML}
            </div>
        </div>
    `;
}

static getExportButtonText(itemType) {
switch (itemType) {
        case 'character': return t('exportCharacter');
        case 'userpersona': return t('exportUserPersona');
        case 'loveydovey': return t('exportLoveydovey');
        case 'worldbook': return t('exportWorldBook');
        case 'custom': return t('exportNotebook');
        default: return t('export');
    }
}
        
        // 渲染版本面板
static renderVersionPanel(item, version, explicitItemType = null) {
    // 🔧 優先使用明確傳入的類型，否則使用 currentMode
    const itemType = explicitItemType || currentMode;
    
    return `
        <div class="version-panel">
            ${this.renderVersionHeader(item, version, itemType)}
            ${this.renderVersionContent(item, version, itemType)}
        </div>
    `;
}
        
    static renderVersionHeader(item, version, itemType) {
    const showDelete = item.versions.length > 1;
    
    // 檢查是否有標籤
    const hasTagsSupport = (itemType === 'worldbook' || itemType === 'custom' || itemType === 'userpersona');
    const tagsArray = hasTagsSupport ? TagManager.normalizeToArray(version.tags || '') : [];
    const hasExistingTags = tagsArray.length > 0;
    
return `
<div class="version-header-container">
    <div class="version-header">
        <input type="text" class="version-title title-font" value="${version.name}" 
onchange="updateVersionName('${itemType}', '${item.id}', '${version.id}', this.value)"
            oninput="this.style.width = Math.max(350, this.scrollWidth + 20) + 'px'">
        <div class="version-controls">
                ${hasTagsSupport ? `
    <button class="version-panel-btn hover-primary" onclick="ContentRenderer.showVersionTagModal('version-tags-${version.id}', '${itemType}', '${item.id}', '${version.id}', 'tags')" title="${t('addTag')}">
        ${IconManager.bookmark({width: 14, height: 14})}
    </button>
` : ''}
                
                <!-- 版本操作按鈕 -->
                ${this.createVersionButtonGroup(itemType, item.id, version.id, showDelete)}
            </div>
        </div>

        <!-- 第二行：標籤顯示區域（只在有標籤時顯示） -->
        ${hasTagsSupport && hasExistingTags ? `
            <div class="version-tags-row">
                <div class="existing-tags" id="tags-display-version-tags-${version.id}">
                    ${tagsArray.map(tag => this.createVersionTagElement(tag, `version-tags-${version.id}`, itemType, item.id, version.id, 'tags')).join('')}
                </div>
            </div>
        ` : ''}

        <!-- 字數統計與時間戳 -->
        <div class="version-stats ${hasTagsSupport && hasExistingTags ? 'has-tags' : 'no-tags'}" id="${itemType}-version-stats-${version.id}">
            <span class="stats-text" id="version-stats-text-${version.id}">
    ${this.getCachedVersionStats(version, itemType)}
</span>
            <span class="timestamp-text">${TimestampManager.formatTimestamp(version.updatedAt)}</span>
        </div>
        
        <!-- 分隔線 -->
        <div class="version-divider"></div>
        
        <!--  標籤輸入彈窗 -->
        ${hasTagsSupport ? this.createVersionTagModal(version.id, itemType, item.id, 'tags') : ''}
        </div>
    `;
}

static getCachedVersionStats(version, itemType) {
    // 先嘗試從快取獲取
    const cached = TokenCacheManager.get(version.id, version.updatedAt);
    if (cached) {
        // 快取命中時，重新格式化以支援語言切換
        let extraInfo = '';
        if (itemType === 'worldbook' && version.entries && Array.isArray(version.entries)) {
            const entryCount = version.entries.length;
            extraInfo = `${entryCount} ${t('entriesCount')} / `;
        }
        
        // 重新生成 formatted 字串以使用當前語言
        const newFormatted = `${extraInfo}${cached.chars} ${t('chars')} / ${cached.tokens} ${t('tokens')}`;
        return newFormatted;
    }
    
    // 快取未命中時才重新計算
    const stats = StatsManager.calculateVersionStats(version, itemType);
    return stats.formatted;
}

static createVersionTagModal(versionId, itemType, itemId, fieldName) {
    return `
        <div class="version-tag-modal" id="version-tag-modal-version-tags-${versionId}">
            <input type="text" 
                   id="version-tag-input-version-tags-${versionId}" 
                   class="field-input version-tag-input"
                   placeholder="${t('enterTagName')}"
                   onkeydown="ContentRenderer.handleVersionTagKeydown(event, 'version-tags-${versionId}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')"
                   oninput="ContentRenderer.showVersionTagSuggestions('version-tags-${versionId}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')"
                   onblur="ContentRenderer.hideVersionTagModal('version-tags-${versionId}')">

            <div class="version-tag-suggestions" id="version-suggestions-version-tags-${versionId}"></div>
        </div>
    `;
}

// 顯示版本標籤智能提示
static showVersionTagSuggestions(id, itemType, itemId, versionId, fieldName) {
    const input = document.getElementById(`version-tag-input-${id}`);
    const suggestionsDiv = document.getElementById(`version-suggestions-${id}`);
    
    if (!input || !suggestionsDiv) return;
    
    const inputValue = input.value.trim();
    if (inputValue.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    // 獲取當前已有標籤
    const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
    const version = item?.versions.find(v => v.id === versionId);
    const currentTags = TagManager.normalizeToArray(version?.[fieldName] || '');
    
    // 獲取所有可用標籤
    const allTags = TagManager.getAllTags();
    
    // 過濾匹配的標籤（排除已使用的）
    const suggestions = allTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) && 
        !currentTags.includes(tag)
    ).slice(0, 5); // 最多顯示5個建議
    
    if (suggestions.length > 0) {
        suggestionsDiv.innerHTML = suggestions.map(tag => `
            <div class="version-tag-suggestion" onmousedown="ContentRenderer.selectVersionTagSuggestion('${tag}', '${id}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')">
                ${tag}
            </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

// 選擇智能提示
static selectVersionTagSuggestion(tagName, id, itemType, itemId, versionId, fieldName) {
    // 立即隱藏提示
    const suggestionsDiv = document.getElementById(`version-suggestions-${id}`);
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
    
    // 添加標籤
    this.addVersionTag(id, tagName, itemType, itemId, versionId, fieldName);
    
    // 清空輸入框並重新聚焦
    const input = document.getElementById(`version-tag-input-${id}`);
    if (input) {
        input.value = '';
        input.focus();
    }
}

// 創建版本標籤元素 - 使用與角色卡相同的樣式
static createVersionTagElement(tag, id, itemType, itemId, versionId, fieldName) {
    return `
    <span class="tag-base tag-sm">
        ${tag}
        <button onclick="ContentRenderer.removeVersionTag('${id}', '${tag}', '${itemType}', '${itemId}', '${versionId}', '${fieldName}')" class="tag-remove-btn">×</button>
    </span>
`;
}

// 顯示版本標籤彈窗
static showVersionTagModal(id, itemType, itemId, versionId, fieldName) {
    const modal = document.getElementById(`version-tag-modal-${id}`);
    const input = document.getElementById(`version-tag-input-${id}`);
    const button = document.querySelector(`[onclick*="showVersionTagModal('${id}'"]`);
    
    if (modal && input && button) {
        // 計算按鈕位置
        const buttonRect = button.getBoundingClientRect();
        modal.style.top = (buttonRect.bottom + 4) + 'px';
        modal.style.left = (buttonRect.right - 200) + 'px'; // 200px是彈窗寬度
        
        modal.style.display = 'block';
        input.focus();
        input.value = '';
        
        setTimeout(() => {
            document.addEventListener('click', function closeModal(e) {
                if (!modal.contains(e.target) && !e.target.closest('.add-version-tag-btn')) {
                    modal.style.display = 'none';
                    document.removeEventListener('click', closeModal);
                }
            });
        }, 100);
    }
}

// 隱藏版本標籤彈窗
static hideVersionTagModal(id) {
    const modal = document.getElementById(`version-tag-modal-${id}`);
    if (modal) {
        setTimeout(() => {
            modal.style.display = 'none';
        }, 150);
    }
}

// 處理版本標籤輸入
static handleVersionTagKeydown(event, id, itemType, itemId, versionId, fieldName) {
    const suggestionsDiv = document.getElementById(`version-suggestions-${id}`);
    
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const value = input.value.trim();
        
        //  檢查是否有活動的智能提示
        const activeSuggestion = suggestionsDiv?.querySelector('.version-tag-suggestion-active');
        if (activeSuggestion) {
            // 選擇智能提示
            this.selectVersionTagSuggestion(activeSuggestion.textContent, id, itemType, itemId, versionId, fieldName);
        } else if (value) {
            // 原有邏輯：直接添加輸入的標籤
            this.addVersionTag(id, value, itemType, itemId, versionId, fieldName);
            input.value = '';
            this.hideVersionTagModal(id);
        }
    } else if (event.key === 'Escape') {
        //  先嘗試隱藏智能提示，再隱藏模態框
        if (suggestionsDiv && suggestionsDiv.style.display !== 'none') {
            suggestionsDiv.style.display = 'none';
        } else {
            this.hideVersionTagModal(id);
        }
    }
}

// 新增版本標籤
static addVersionTag(id, tagValue, itemType, itemId, versionId, fieldName) {
    const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
    if (!item) return;
    
    const version = item.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const currentTags = TagManager.normalizeToArray(version[fieldName] || '');
    
    if (!currentTags.includes(tagValue)) {
        currentTags.push(tagValue);
        version[fieldName] = TagManager.normalizeToString(currentTags);
        
       TimestampManager.updateVersionTimestamp(itemType, itemId, versionId);
markAsChanged();
saveDataSilent();
this.rerenderVersionPanel(itemType, itemId, versionId);

setTimeout(() => {
    if (typeof updateAllFieldStatsOnLoad === 'function') {
        updateAllFieldStatsOnLoad();
    }
}, 100);
    }
}

// 移除版本標籤
static removeVersionTag(id, tagToRemove, itemType, itemId, versionId, fieldName) {
    const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
    if (!item) return;
    
    const version = item.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const currentTags = TagManager.normalizeToArray(version[fieldName] || '');
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    
    version[fieldName] = TagManager.normalizeToString(updatedTags);
    
   TimestampManager.updateVersionTimestamp(itemType, itemId, versionId);
markAsChanged();
saveDataSilent();
this.rerenderVersionPanel(itemType, itemId, versionId);

// 🔧 修復：版本Tag操作後恢復欄位統計
setTimeout(() => {
    if (typeof updateAllFieldStatsOnLoad === 'function') {
        updateAllFieldStatsOnLoad();
    }
}, 100);
}

        // 綁定世界書
        static generateWorldBookOptions() {
    const currentVersion = ItemManager.getCurrentVersion();
    const currentBinding = currentVersion ? 
        `${currentVersion.boundWorldBookId || ''}:${currentVersion.boundWorldBookVersionId || ''}` : '';
    
    let options = `<option value="">${t('noWorldBookBinding')}</option>`;
    
    worldBooks.forEach(wb => {
        // 為每個世界書創建一個選項組
        if (wb.versions.length === 1) {
            // 只有一個版本，直接顯示世界書名稱
            const value = `${wb.id}:${wb.versions[0].id}`;
            const selected = currentBinding === value ? 'selected' : '';
            options += `<option value="${value}" ${selected}>${wb.name}</option>`;
        } else {
            // 多個版本，顯示世界書名稱 + 版本
            wb.versions.forEach(version => {
                const value = `${wb.id}:${version.id}`;
                const selected = currentBinding === value ? 'selected' : '';
                options += `<option value="${value}" ${selected}>${wb.name} - ${version.name}</option>`;
            });
        }
    });
    
    return options;
}

    //  輔助函數：重新渲染單個版本面板
static rerenderVersionPanel(itemType, itemId, versionId) {
    const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
    if (!item) return;

    const version = item.versions.find(v => v.id === versionId);
    if (!version) return;

    const versionTitleInput = document.querySelector(`input[onchange*="updateVersionName"][onchange*="'${versionId}'"]`);
    const panel = versionTitleInput?.closest('.version-panel');

    if (panel) {
        
        // 🔧 明確傳遞 itemType
        panel.outerHTML = this.renderVersionPanel(item, version, itemType);
        
        setTimeout(() => {
            updateAllPageStats();
            initAutoResize();
        }, 50);
    }
}
        // 渲染版本內容
        static renderVersionContent(item, version, itemType) {
            switch (itemType) {
                case 'character':
                    return this.renderCharacterVersionContent(item, version);
                case 'loveydovey':
            // 卿卿我我：先返回內容，然後初始化拖曳
            const loveyDoveyHTML = LoveyDoveyRenderer.renderVersionContent(item, version);
            setTimeout(() => {
                // 初始化附加資訊拖曳
                
                if (typeof DragSortManager !== 'undefined') {
                    DragSortManager.enableAdditionalInfoDragSort(item.id, version.id);
                }
                // 初始化創作者事件拖曳
                if (typeof enableCreatorEventsDragSort === 'function') {
                    enableCreatorEventsDragSort(item.id, version.id);
                }
            }, 200);
            return loveyDoveyHTML;     
                case 'userpersona':
                    return this.renderUserPersonaVersionContent(item, version);
                case 'worldbook':
                // 渲染世界書版本內容
                const worldBookHTML = WorldBookRenderer.renderWorldBookVersionContent(item, version);
                setTimeout(() => {
                    // 延遲初始化世界書條目拖曳
                    if (typeof enableWorldBookEntriesDragSort === 'function') {
                        enableWorldBookEntriesDragSort(item.id, version.id);
                    }
                }, 200);
                return worldBookHTML;
                case 'custom':
                    return this.renderCustomVersionContent(item, version);
                default:
                    return `<div>${t('unknownItemType')}</div>`;
            }
        }
        
        // 渲染角色版本內容
static renderCharacterVersionContent(character, version) {
    return `
    <div class="character-version-content">
        <div class="character-basic-info">
            <div class="avatar-section">
                <div class="avatar-preview ${version.avatar ? '' : 'avatar-upload-placeholder'}" 
     onclick="triggerImageUpload('${character.id}', '${version.id}')" 
     ondragenter="showAvatarDragOverlay(event, this)"
     ondragover="event.preventDefault(); event.stopPropagation();"
     ondragleave="handleAvatarDragLeave(event, this)"
     ondrop="handleAvatarDrop(event, '${character.id}', '${version.id}', 'character'); hideAvatarDragOverlay(this);"
                     style="
                         cursor: pointer; 
                         transition: all 0.2s ease;
                         ${version.avatar ? 
                             'border: 1px solid var(--border-color);' : 
                             'border: 2px dashed var(--border-color);'
                         }
                     " 
                     onmouseover="this.style.opacity='0.8'${version.avatar ? '; this.style.transform=\'scale(1.02)\'' : '; this.style.borderColor=\'var(--primary-color)\''}" 
                     onmouseout="this.style.opacity='1'${version.avatar ? '; this.style.transform=\'scale(1)\'' : '; this.style.borderColor=\'var(--border-color)\''}"
                     >
                ${version.avatar ? `<img src="${BlobManager.getBlobUrl(version.avatar)}" alt="Avatar">` : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.9em; text-align: center;"><div><div style="color: var(--text-muted); font-size: 3em; margin-bottom: 12px;">+</div>${t('clickToUploadAvatar')}</div></div>`}
            </div>
                <input type="file" class="file-input" id="avatar-upload-${version.id}" accept="image/*" 
                    onchange="handleImageUpload('${character.id}', '${version.id}', this.files[0])">
            </div>
            <div class="basic-info-fields">
                ${this.renderCharacterBasicFields(character, version)}
            </div>
        </div>
        ${this.renderCharacterMainFields(character, version)}
          </div>
    `;
}

      // 渲染玩家角色版本內容
static renderUserPersonaVersionContent(userPersona, version) {
    return `
        <div class="user-persona-content" style="display: flex; flex-direction: column; align-items: center; gap: 24px;">
            <!-- 頭像區域 - 置中顯示 -->
            <div class="avatar-section" style="display: flex; flex-direction: column; align-items: center;">
               <div class="avatar-preview ${version.avatar ? '' : 'avatar-upload-placeholder'}" 
     onclick="triggerImageUpload('${userPersona.id}', '${version.id}')" 
     ondragenter="showAvatarDragOverlay(event, this)"
     ondragover="event.preventDefault(); event.stopPropagation();"
     ondragleave="handleAvatarDragLeave(event, this)"
     ondrop="handleAvatarDrop(event, '${userPersona.id}', '${version.id}', 'userpersona'); hideAvatarDragOverlay(this);"
     style="
         cursor: pointer; 
         transition: all 0.2s ease; 
         width: 360px; 
         height: 540px; 
         aspect-ratio: 2/3; 
         border-radius: var(--radius-lg);
         overflow: hidden;
         background: transparent;
         ${version.avatar ? 
             'border: 1px solid var(--border-color); box-shadow: var(--shadow-light);' : 
             'border: 2px dashed var(--border-color);'
         }
         display: flex; 
         align-items: center; 
         justify-content: center;
     " 
     onmouseover="this.style.opacity='0.8'${version.avatar ? '; this.style.transform=\'scale(1.02)\'' : '; this.style.borderColor=\'var(--primary-color)\''}" 
     onmouseout="this.style.opacity='1'${version.avatar ? '; this.style.transform=\'scale(1)\'' : '; this.style.borderColor=\'var(--border-color)\''}"
     >
                    ${version.avatar ? 
                        `<img src="${BlobManager.getBlobUrl(version.avatar)}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.9em; text-align: center;">
                            <div style="color: var(--text-muted); font-size: 3em; margin-bottom: 12px; opacity: 0.7;">+</div>
                            <div style="line-height: 1.5; opacity: 0.8;">${t('clickToUploadAvatar')}</div>
                        </div>`
                    }
                </div>
                
                <input type="file" class="file-input" id="avatar-upload-${version.id}" accept="image/*" 
                    onchange="handleImageUpload('${userPersona.id}', '${version.id}', this.files[0])">
            </div>
            
            <!-- 描述區域 - 全寬顯示 -->
            <div class="persona-description-section" style="width: 85%;">
                ${this.renderUserPersonaBasicFields(userPersona, version)}
            </div>
        </div>
    `;
}

       
// 渲染玩家角色基本欄位
static renderUserPersonaBasicFields(userPersona, version) {
    return `
        <!-- 角色描述欄位 -->
        ${this.createTextFieldWithStats({
            id: `desc-${version.id}`,
            label: t('userPersonaDesc'),
            placeholder: t('userPersonaDescPlaceholder'),
            value: version.description || '',
            itemType: 'userpersona',
            itemId: userPersona.id,
            versionId: version.id,
            fieldName: 'description',
            isTextarea: true,
            withFullscreen: true,
            extraClass: '',
            customStyle: 'height: 600px; resize: vertical;'
        })}
    `;
}
        
       // 渲染角色基本資訊欄位
static renderCharacterBasicFields(character, version) {
    return `
        <!-- 第一行：創作者 + 角色版本 -->
        <div class="character-basic-info-row">
            ${this.createTextFieldWithStats({
                id: `creator-${version.id}`,
                label: t('creator'),
                placeholder: t('creatorPlaceholder'),
                value: version.creator || '',
                itemType: 'character',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'creator',
                isTextarea: false,
                withFullscreen: false,
                extraClass: '',
                showStats: false
            }).replace('class="field-group"', 'class="field-group no-bottom-margin"')}

            ${this.createTextFieldWithStats({
                id: `charVersion-${version.id}`,
                label: t('charVersion'),
                placeholder: t('versionPlaceholder'),
                value: version.charVersion || '',
                itemType: 'character',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'charVersion',
                isTextarea: false,
                withFullscreen: false,
                extraClass: '',
                showStats: false
            }).replace('class="field-group"', 'class="field-group no-bottom-margin"')}
        </div>


<!-- 第二行：創作者備註 -->
<div class="field-group creator-notes-group">
    <label class="field-label creator-notes-label">
        ${t('creatorNotes')}
        <button class="fullscreen-btn" onclick="openFullscreenEditor('creatorNotes-${version.id}', \`${t('creatorNotes')}\`)" title="${t('fullscreenEdit')}">⛶</button>
    </label>
    <textarea class="field-input creator-notes-textarea" id="creatorNotes-${version.id}" 
    placeholder="${t('notesPlaceholder')}"
    oninput="updateField('character', '${character.id}', '${version.id}', 'creatorNotes', this.value);">${version.creatorNotes || ''}</textarea>
</div>
        <!-- 第三行：嵌入標籤（使用新的視覺化標籤輸入） -->
        <div class="field-group no-bottom-margin">
            <label class="field-label">${t('tags')}</label>
            ${TagInputManager.createTagInput({
                id: `tags-${version.id}`,
                value: version.tags || '',
                itemType: 'character',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'tags',
                placeholder: t('tagsPlaceholder')
            })}
        </div>
    `;
}
        
    // 渲染角色主要欄位
static renderCharacterMainFields(character, version) {
    const fields = [
        { id: 'description', label: t('description'), placeholder: t('descPlaceholder'), fieldName: 'description' },
        { id: 'personality', label: t('personality'), placeholder: t('personalityPlaceholder'), fieldName: 'personality' },
        { id: 'scenario', label: t('scenario'), placeholder: t('scenarioPlaceholder'), fieldName: 'scenario' },
        { id: 'dialogue', label: t('dialogue'), placeholder: t('dialoguePlaceholder'), fieldName: 'dialogue' },
        { id: 'firstMessage', label: t('firstMessage'), placeholder: t('firstMsgPlaceholder'), fieldName: 'firstMessage' }
    ];
    
    // 渲染基本欄位
    const basicFieldsHTML = fields.map(field => {
        const htmlId = field.id === 'description' ? 'desc' : 
                      field.id === 'firstMessage' ? 'firstmsg' : 
                      field.id;
        
        return this.createTextFieldWithStats({
            id: `${htmlId}-${version.id}`,
            label: field.label,
            placeholder: field.placeholder,
            value: version[field.fieldName] || '',
            itemType: 'character',
            itemId: character.id,
            versionId: version.id,
            fieldName: field.fieldName,
            isTextarea: true,
            withFullscreen: true,
            extraClass: ''
        });
    }).join('');

return basicFieldsHTML;
}

        
        // 渲染自定義版本內容
        static renderCustomVersionContent(section, version) {
            return `
            <div class="character-version-content">
                <!-- 動態欄位區域 -->
                <div id="custom-fields-${version.id}" data-section-id="${section.id}" data-version-id="${version.id}">
                    ${version.fields.map(field => this.renderCustomField(section.id, version.id, field)).join('')}
                </div>
                
               <!-- 新增欄位按鈕 -->
                <button class="loveydovey-add-btn-transparent" onclick="addCustomField('${section.id}', '${version.id}')">
                    ${IconManager.plus({width: 16, height: 16})}
                    ${t('addField')}
                </button>
                </div>
            `;
        }

   // 渲染自定義欄位
static renderCustomField(sectionId, versionId, field) {
    return `
        <div class="field-group sortable-item" id="field-${field.id}" data-field-id="${field.id}">
        <div class="custom-field-header">
            <div class="custom-field-left-controls">
        <!-- 拖曳控制柄 -->
        <div class="drag-handle custom-field-drag-handle">
            ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
        </div>
        
        <input type="text" class="version-title title-font custom-field-name-input" value="${field.name}"
                onchange="updateCustomFieldName('${sectionId}', '${versionId}', '${field.id}', this.value)"
                placeholder="${t('fieldNamePlaceholder')}">
                </div>
                <div class="custom-field-right-controls">
                <button class="fullscreen-btn" onclick="openFullscreenEditor('custom-field-${field.id}', '${field.name}')" 
                            title="${t('fullscreenEdit')}">⛶</button>
                    <span class="field-stats custom-field-stats" data-target="custom-field-${field.id}">${field.content ? field.content.length : 0} ${t('chars')} / ${field.content ? countTokens(field.content) : 0} ${t('tokens')}</span>

            <button class="delete-btn" 
                onclick="confirmRemoveCustomField('${sectionId}', '${versionId}', '${field.id}')"
                title="${t('deleteField')}">
            ${IconManager.delete()}
            </button>
                </div>
            </div>
            <textarea class="field-input standard-textarea" id="custom-field-${field.id}" 
                placeholder="${t('customFieldPlaceholder')}"
                oninput="updateField('custom', '${sectionId}', '${versionId}', 'customField-${field.id}', this.value);">${field.content}</textarea>
        </div>
    `;
}



    static createToggleGroup(toggles, columns = 3) {
        return `
            <div class="toggle-grid" style="grid-template-columns: repeat(auto-fit, minmax(${180/columns}px, 1fr));">
                ${toggles.map(toggle => `
                    <label class="toggle-item">
                        <input type="checkbox" ${toggle.checked ? 'checked' : ''} 
                            ${toggle.onChange ? `onchange="${toggle.onChange}"` : ''}>
                        <span>${toggle.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }


// 局部渲染筆記本欄位容器
static renderCustomFieldsContainer(section, version) {
    return `
        <!-- 動態欄位區域 -->
        <div id="custom-fields-${version.id}">
            ${version.fields.map(field => this.renderCustomField(section.id, version.id, field)).join('')}
        </div>
        
        <!-- 新增欄位按鈕 -->
        <button class="loveydovey-add-btn-transparent" onclick="addCustomField('${section.id}', '${version.id}')">
            ${IconManager.plus({width: 16, height: 16})}
            ${t('addField')}
        </button>
    `;
}

// 筆記本局部渲染函數
static renderCustomFieldsList(sectionId, versionId) {
    const section = customSections.find(s => s.id === sectionId);
    if (!section) return;
    
    const version = section.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const container = document.getElementById(`custom-fields-${versionId}`);
    if (!container) return;
    
    // 重新渲染容器（包含按鈕）
    const parentContainer = container.parentElement;
    if (!parentContainer) return;
    
    // 找到按鈕並一起更新
    const addButton = parentContainer.querySelector('button[onclick*="addCustomField"]');
    const newHTML = this.renderCustomFieldsContainer(section, version);
    
    // 替換從容器到按鈕的整個區域
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHTML;
    
    // 移除舊的容器和按鈕
    container.remove();
    if (addButton) addButton.remove();
    
    // 插入新內容
    parentContainer.appendChild(tempDiv.firstElementChild);
    parentContainer.appendChild(tempDiv.lastElementChild);
    
    // 重新初始化功能
    setTimeout(() => {
        updateAllPageStats();
        initAutoResize();
        // 啟用筆記本欄位拖曳排序
        DragSortManager.enableCustomFieldsDragSort(sectionId, versionId);
    }, 50);
}
        
        // 工具函數
        static getVersionsToShow(item) {
            const currentVersionId = ItemManager.getCurrentVersionId();
            
            return viewMode === 'compare' ? 
                item.versions.filter(v => compareVersions.includes(v.id)) : 
                item.versions.filter(v => v.id === currentVersionId);
        }
        
        static getItemTypeDisplay(itemType) {
            switch (itemType) {
                case 'character': return '角色';
                case 'userpersona': return '玩家角色';
                case 'worldbook': return '世界書';
                case 'custom': return '筆記';
                default: return '項目';
            }
        }
        
        static getCopyButtonText(itemType) {
            switch (itemType) {
                case 'character': return t('copyCharacter');
                case 'userpersona': return t('copyUserPersona');
                case 'worldbook': return t('copyWorldBook');
                case 'custom': return t('copySection');
                default: return t('copy');
            }
        }
        
        static getDeleteButtonText(itemType) {
            switch (itemType) {
                case 'character': return t('deleteCharacter');
                case 'userpersona': return t('deleteUserPersona');
                case 'worldbook': return t('deleteWorldBook');
                case 'custom': return t('deleteSection');
                default: return t('delete');
            }
        }

        // 統一的文字欄位渲染函數
        static createTextFieldWithStats(config) {
            const {
                id, label, placeholder, value = '', 
                itemType, itemId, versionId, fieldName,
                isTextarea = true, withFullscreen = true,
                extraClass = '', showStats = true, customStyle = ''
            } = config;
            
            const textareaClass = customStyle ? '' : 'standard-textarea';

            const inputElement = isTextarea ? 
            `<textarea class="field-input ${extraClass} ${textareaClass}" id="${id}" 
                placeholder="${placeholder}"
                ${customStyle ? `style="${customStyle}"` : ''}
                oninput="updateField('${itemType}', '${itemId}', '${versionId}', '${fieldName}', this.value);">${value}</textarea>` :
    `<input type="text" class="field-input ${extraClass}" id="${id}" 
        placeholder="${placeholder}"
        oninput="updateField('${itemType}', '${itemId}', '${versionId}', '${fieldName}', this.value);" 
        value="${value}">`;

            const isFirstMessage = (fieldName === 'firstMessage');
            
            return `
                <div class="field-group">
                    <label class="field-label">
                        ${label}
                        ${showStats ? `<span class="field-stats" data-target="${id}">0 ${t('chars')}${isTextarea ? ' / 0 ' + t('tokens') : ''}</span>` : ''}
                        ${withFullscreen && isTextarea ? `<button class="fullscreen-btn" onclick="event.stopPropagation(); openFullscreenEditor('${id}', '${label}')" title="${t('fullscreenEdit')}">⛶</button>` : ''}
                        ${isFirstMessage ? `<button class="version-panel-btn hover-primary alternate-greetings-btn" onclick="event.stopPropagation(); openAlternateGreetingsModal('${itemId}', '${versionId}');" title="${t('manageAlternateGreetings')}">${t('alternateGreetings')}</button>` : ''}
                    </label>
                    ${inputElement}
                </div>
            `;
        }

        // 統一的按鈕組渲染
    static createVersionButtonGroup(itemType, itemId, versionId, showDelete = true) {
        return `
            <div class="version-button-group">
                <button class="version-panel-btn hover-primary" 
                        onclick="VersionCRUD.copy('${itemType}', '${itemId}', '${versionId}')"
                        title="${t('copy')}">
                    ${IconManager.copy({width: 14, height: 14})}
                </button>
                ${showDelete ? `
                    <button class="version-panel-btn hover-primary" 
                            onclick="VersionCRUD.remove('${itemType}', '${itemId}', '${versionId}')"
                            title="${t('delete')}">
                        ${IconManager.delete({width: 14, height: 14})}
                    </button>
                ` : ''}
            </div>
        `;
    }
        
        static renderEmptyState() {
            return `<div class="empty-state">${t('selectCharacter') || '請選擇一個項目'}</div>`;
        }
        
        static renderHomePage(container) {
            renderHomePage(); // 使用現有的首頁渲染函數
        }

        // 通用工具函數
        static createCompactInput(id, value, placeholder, onchange, style = '') {
            return `<input type="text" class="field-input compact-input" 
                id="${id}" value="${value}" placeholder="${placeholder}"
                onchange="${onchange}" style="${style}">`;
        }

        static createFieldGroup(label, content, isInline = false) {
            return `
                <div class="field-group" style="margin-bottom: ${isInline ? '0' : '8px'};">
                    ${label ? `<label class="field-label">${label}</label>` : ''}
                    ${content}
                </div>
            `;
        }

        static createButton(text, onclick, className = 'btn btn-secondary btn-small', style = '') {
            return `<button class="${className}" onclick="${onclick}" style="${style}">${text}</button>`;
        }

        static createNumberInput(id, value, onchange, min = '', max = '', style = 'width: 60px;') {
        return `<input type="number" class="field-input compact-input" 
            id="${id}" value="${value}" onchange="${onchange}"
            ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''}
            style="${style}">`;
    }

        static createCheckbox(checked, onchange, label, style = '') {
            return `
                <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em; ${style}">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="${onchange}">
                    <span style="margin-left: 6px;">${label}</span>
                </label>
            `;
        }

        static createGridContainer(columns, content, gap = '8px') {
            return `
                <div style="display: grid; grid-template-columns: ${columns}; gap: ${gap};">
                    ${content}
                </div>
            `;
        }

            // 渲染列表頁面
        static renderListPage(container) {
            if (listPageType === 'character') {
                return;
            }
            
            // 使用統一渲染
            OverviewManager.renderOverview(listPageType);
        }

        // 渲染玩家角色總覽頁面（卡片格式）
    static renderUserPersonaOverview(container) {
        // 使用統一渲染
        OverviewManager.renderOverview('userpersona');
    }

// 渲染玩家角色卡片
static renderUserPersonaCards() {
    // 🎯 直接調用統一卡片渲染函數
    OverviewManager.renderCards('userpersona');
}
        
        //  獲取項目數量
        static getItemCount(type) {
            switch (type) {
                case 'character': return characters.length;
                case 'worldbook': return worldBooks.length;
                case 'custom': return customSections.length;
                default: return 0;
            }
        }

        //  統一的角色卡 hover 效果綁定函數
        static bindCardHoverEffects() {
            document.querySelectorAll('.home-card:not(.create-character-card):not(.create-persona-card):not(.create-loveydovey-card)').forEach(card => {
                // 移除可能存在的舊事件監聽器
                if (card._hoverEnterHandler) {
                    card.removeEventListener('mouseenter', card._hoverEnterHandler);
                }
                if (card._hoverLeaveHandler) {
                    card.removeEventListener('mouseleave', card._hoverLeaveHandler);
                }
                
                // 創建新的事件處理器
                card._hoverEnterHandler = function() {
                    this.style.transform = 'translateY(-4px)';
                    this.style.filter = 'brightness(1.02)';
                };
                
                card._hoverLeaveHandler = function() {
                    this.style.transform = 'translateY(0)';
                    this.style.filter = 'brightness(1)';
                };
                
                // 綁定新的事件監聽器
                card.addEventListener('mouseenter', card._hoverEnterHandler);
                card.addEventListener('mouseleave', card._hoverLeaveHandler);
            });
        }
}

//側邊欄
function renderSidebar() {
    const container = document.getElementById('sidebarContent');
    container.innerHTML = renderItemList('character', characters, currentCharacterId, currentVersionId);
    
    const customContainer = document.getElementById('customSectionContent');
    if (customContainer) {
        customContainer.innerHTML = renderItemList('custom', customSections, currentCustomSectionId, currentCustomVersionId);
    }

    const worldBookContainer = document.getElementById('worldBookContent');
    if (worldBookContainer) {
        worldBookContainer.innerHTML = renderItemList('worldbook', worldBooks, currentWorldBookId, currentWorldBookVersionId);
    }

    const userPersonaContainer = document.getElementById('userPersonaContent');
    if (userPersonaContainer) {
        userPersonaContainer.innerHTML = renderItemList('userpersona', userPersonas, currentUserPersonaId, currentUserPersonaVersionId);
    }

    const loveyDoveyContainer = document.getElementById('loveyDoveyContent');
    if (loveyDoveyContainer) {
        const shouldShow = OtherSettings?.settings?.showLoveyDovey !== false;
        if (shouldShow) {
            loveyDoveyContainer.innerHTML = renderItemList('loveydovey', loveyDoveyCharacters, currentLoveyDoveyId, currentLoveyDoveyVersionId);
        } else {
            loveyDoveyContainer.innerHTML = '';
        }
    }
    
    //  同時處理整個卿卿我我區塊的顯示/隱藏
    const loveyDoveySection = document.querySelector('[data-section="loveydovey"]');
    if (loveyDoveySection) {
        const shouldShow = OtherSettings?.settings?.showLoveyDovey !== false;
        loveyDoveySection.style.display = shouldShow ? 'block' : 'none';
    }
    
    // 更新翻譯文字
    updateSidebarTranslations();
    
    // 展開當前選中項目的版本列表
    expandCurrentItemVersions();

    // 為展開的版本列表啟用拖曳排序
    setTimeout(() => {
        [
            { type: 'character', items: characters },
            { type: 'loveydovey', items: loveyDoveyCharacters },
            { type: 'userpersona', items: userPersonas },
            { type: 'worldbook', items: worldBooks },
            { type: 'custom', items: customSections }
        ].forEach(({ type, items }) => {
            items.forEach(item => {
                const versionsList = document.getElementById(`${type}-versions-${item.id}`);
                if (versionsList && versionsList.classList.contains('expanded')) {
                    DragSortManager.enableVersionDragSort(type, item.id);
                }
            });
        });
    }, 100);
    initSidebarEventDelegation();
}


// 統一的版本項目渲染
function renderSidebarVersion(item, version, type, currentVersionId) {
    // 檢查是否為當前項目類型
    const isCurrentMode = (currentMode === type);
    
    // 根據檢視模式決定版本是否為活動狀態
    let isVersionActive = false;
    if (isCurrentMode) {
        if (viewMode === 'compare') {
            // 對比模式：檢查版本是否在對比列表中
            isVersionActive = compareVersions.includes(version.id);
        } else {
            // 單一檢視模式：檢查是否為當前版本
            isVersionActive = (version.id === currentVersionId);
        }
    }
    
    const stats = getCachedStatsForSidebar(version, type);
    
    return `
        <div class="version-item ${isVersionActive ? 'active' : ''}" 
             data-action="selectSidebarItem"
             data-type="${type}"
             data-item-id="${item.id}"
             data-version-id="${version.id}">
            <div class="version-item-content">
                <div class="version-item-header">
                    ${VersionUtils.getVersionIcon(version, type)}
                    <span class="version-item-name">
                        ${version.name}
                    </span>
                </div>
                <div class="version-item-stats">
                    ${stats.formatted}
                </div>
            </div>
        </div>
    `;
}

//額外問候語
// 打開額外問候語管理模態框
function openAlternateGreetingsModal(characterId, versionId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 確保陣列存在
    if (!version.alternateGreetings) {
        version.alternateGreetings = [];
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'alternate-greetings-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="compact-modal-content alternate-greetings-modal">
            <div class="compact-modal-header">
                <div class="modal-title-group">
                    ${IconManager.messageSquare({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('manageAlternateGreetings')}</h3>
                </div>
                <button class="close-modal" onclick="closeAlternateGreetingsModal()">×</button>
            </div>
            
            <div id="alternate-greetings-container" class="alternate-greetings-content">
                ${renderAlternateGreetingsModalContent(character, version)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAlternateGreetingsModal();
        }
    });
    
    // ESC 鍵關閉
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeAlternateGreetingsModal();
        }
    };
    document.addEventListener('keydown', handleKeydown);
    modal._handleKeydown = handleKeydown;
    
    // 初始化功能
    setTimeout(() => {
        updateAllPageStats();
        initAutoResize();
        DragSortManager.enableAlternateGreetingsDragSort(characterId, versionId);
    }, 100);
}

// 關閉模態框
function closeAlternateGreetingsModal() {
    const modal = document.getElementById('alternate-greetings-modal');
    if (modal) {
        if (modal._handleKeydown) {
            document.removeEventListener('keydown', modal._handleKeydown);
        }
        modal.remove();
        
        // 重新渲染主頁面以更新統計
        setTimeout(() => {
            updateAllPageStats();
        }, 50);
    }
}

// 渲染模態框內容
function renderAlternateGreetingsModalContent(character, version) {
    const alternateGreetings = version.alternateGreetings || [];
    
    return `
        <div class="alternate-greetings-add-container">
            <button class="loveydovey-add-btn" onclick="addAlternateGreetingInModal('${character.id}', '${version.id}')">
                ${IconManager.plus({width: 16, height: 16})}
                ${t('addAlternateGreeting')}
            </button>
        </div>
        
        <div id="alternate-greetings-list-${version.id}">
            ${alternateGreetings.length === 0 ? `
                <div class="alternate-greetings-empty">
                    ${t('noAlternateGreetings')}
                </div>
            ` : alternateGreetings.map((greeting, index) => `
                <div class="alternate-greeting-item">
                     
                    <!-- 標題列 -->
                    <div class="alternate-greeting-header">
                        <div class="custom-field-right-controls">
                            <!-- 拖曳控制柄 -->
                            <div class="drag-handle custom-field-drag-handle">
                                ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
                            </div>
                            
                            <h4 class="alternate-greeting-title">
                                ${t('alternateGreeting')} ${index + 1}
                            </h4>
                        </div>
                        
                        <button class="delete-btn alternate-greeting-delete" 
                                onclick="deleteAlternateGreetingInModal('${character.id}', '${version.id}', ${index})">
                            ${IconManager.delete()}
                        </button>
                    </div>

                    <!-- 內容區域 -->
                    <div class="field-group no-bottom-margin">
                        <textarea class="field-input alternate-greeting-textarea" 
          id="alternateGreeting-modal-${version.id}-${index}" 
          placeholder="${t('alternateGreetingPlaceholder')}"
          oninput="updateAlternateGreetingInModal('${character.id}', '${version.id}', ${index}, this.value);"
          onfocus="showAdditionalFullscreenBtn(this);"
          onblur="hideAdditionalFullscreenBtn(this);">${greeting}</textarea>
                        
                        <!-- 底部工具列 -->
                        <div class="alternate-greeting-toolbar">
                            <button class="fullscreen-btn-base fullscreen-btn-toolbar" 
        onclick="openFullscreenEditor('alternateGreeting-modal-${version.id}-${index}', '${t('alternateGreeting')} ${index + 1}')"
        title="${t('fullscreenEdit')}">
    ⛶
</button>
                            
                            <div class="field-stats alternate-greeting-stats" data-target="alternateGreeting-modal-${version.id}-${index}">
                                ${greeting.length} ${t('chars')} / ${countTokens(greeting)} ${t('tokens')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 模態框內新增額外問候語
function addAlternateGreetingInModal(characterId, versionId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version) return;
    
    if (!version.alternateGreetings) {
        version.alternateGreetings = [];
    }
    
    // 檢查數量限制
    if (version.alternateGreetings.length >= 10) {
        NotificationManager.warning(t('maxAlternateGreetingsReached'));
        return;
    }
    
    // 新增空的問候語
    version.alternateGreetings.push('');
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('character', characterId, versionId);
    markAsChanged();
    
    // 重新渲染模態框內容
    const container = document.getElementById('alternate-greetings-container');
    if (container) {
        container.innerHTML = renderAlternateGreetingsModalContent(character, version);
        
        // 重新初始化功能
        setTimeout(() => {
            updateAllPageStats();
            initAutoResize();
            DragSortManager.enableAlternateGreetingsDragSort(characterId, versionId);
        }, 50);
    }
}

// 模態框內刪除額外問候語
function deleteAlternateGreetingInModal(characterId, versionId, index) {
    const confirmDelete = confirm(t('deleteAlternateGreetingConfirm'));
    if (!confirmDelete) return;
    
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.alternateGreetings) return;
    
    // 刪除指定的問候語
    version.alternateGreetings.splice(index, 1);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('character', characterId, versionId);
    markAsChanged();
    
    // 重新渲染模態框內容
    const container = document.getElementById('alternate-greetings-container');
    if (container) {
        container.innerHTML = renderAlternateGreetingsModalContent(character, version);
        
        setTimeout(() => {
            updateAllPageStats();
            initAutoResize();
            DragSortManager.enableAlternateGreetingsDragSort(characterId, versionId);
        }, 50);
    }
}

function updateAlternateGreetingInModal(characterId, versionId, index, value) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.alternateGreetings) return;
    
    if (index < 0 || index >= version.alternateGreetings.length) return;
    
    // 更新內容
    version.alternateGreetings[index] = value;
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('character', characterId, versionId);
    
    // 添加統計更新
    handleFieldUpdateComplete('character', characterId, versionId);
    const textareaId = `alternateGreeting-modal-${versionId}-${index}`;
    updateFieldStats(textareaId);
}

function renderHomePage() {
    // 使用統一渲染
    OverviewManager.renderOverview('character');
}

// ===== 通用提示框渲染器 =====
class ConfirmationRenderer {
    // 渲染確認提示框
    static render(config) {
        const {
            icon,
            title,
            description,
            subText = '',
            listSection,
            infoSection,
            cancelText = '取消',
            confirmText = '確認',
            confirmAction,
            cancelAction,
            maxWidth = '400px',
            isDanger = false
        } = config;

        // 生成圖示 HTML
        const iconHtml = IconManager[icon] ? IconManager[icon]({width: 18, height: 18}) : '';
        
        // 生成列表區塊 HTML
        const listSectionHtml = this.renderListSection(listSection);
        
        // 生成說明區塊 HTML
        const infoSectionHtml = this.renderInfoSection(infoSection);
        
        // 生成副文字區塊
        const subTextHtml = subText ? `
            <div class="compact-section confirm-modal-subtext">
                <div class="confirm-modal-subtext-content">
                    ${subText}
                </div>
            </div>
        ` : '';

        // 確認按鈕樣式
        const confirmButtonClass = isDanger ? 'overview-danger-btn' : 'overview-btn btn-primary';

        // 根據位置安排內容順序
        const contentSections = this.arrangeContentSections({
            description,
            listSectionHtml,
            infoSectionHtml,
            subTextHtml,
            listPosition: listSection?.position || 'after-description',
            infoPosition: infoSection?.position || 'after-description'
        });
        
        const cancelButtonAction = cancelAction || "this.closest('.modal').remove()";
        const content = `
            <div class="compact-modal-content">
                <div class="compact-modal-header confirm-modal-header">
                    <div class="custom-field-right-controls">
                        ${iconHtml}
                        <h3 class="compact-modal-title">${title}</h3>
                    </div>
                </div>
                
                ${contentSections}

                <div class="compact-modal-footer confirm-modal-footer">
                    <button class="overview-btn hover-primary" onclick="${cancelButtonAction}">${cancelText}</button>
                    <button class="${confirmButtonClass}" onclick="${confirmAction}">${confirmText}</button>
                </div>
            </div>
        `;
        
        ModalManager.create({
            title: '',
            content: content,
            footer: '',
            maxWidth: maxWidth
        });
        
    }

    /**
     * 渲染列表區塊
     */
    static renderListSection(listSection) {
        if (!listSection || !listSection.items || listSection.items.length === 0) {
            return '';
        }

        const { title, icon, items, maxHeight = '120px' } = listSection;
        
        // 生成標題圖示
        const titleIconHtml = icon && IconManager[icon] ? 
            IconManager[icon]({width: 14, height: 14}) : '';
        
        // 生成列表項目
        const itemsHtml = items.map(item => {
            // 如果是純文字，包裝成基本 div；如果已是 HTML，直接使用
            return typeof item === 'string' && !item.includes('<') ? 
                `<div class="confirm-modal-list-item">${item}</div>` : 
                item;
        }).join('');

        return `
            <div class="compact-section list-style confirm-modal-list-section">
                <div class="compact-section-title confirm-modal-list-title">
                    ${titleIconHtml}
                    ${title}
                </div>
                <div class="confirm-modal-list-content" style="max-height: ${maxHeight};">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    /**
     * 渲染說明區塊
     */
    static renderInfoSection(infoSection) {
        if (!infoSection || !infoSection.content) {
            return '';
        }

        const { title, content } = infoSection;
        
        // 組合內容：有標題就加粗+換行，沒有就直接內容
        const fullContent = title ? 
            `<strong>${title}</strong><br>${content}` : 
            content;

        return `
            <div class="compact-section list-style">
                <div class="confirm-modal-info-content">
                    ${fullContent}
                </div>
            </div>
        `;
    }

    /**
     * 根據位置安排內容區塊順序
     */
    static arrangeContentSections({ description, listSectionHtml, infoSectionHtml, subTextHtml, listPosition, infoPosition }) {
        const descriptionHtml = `
            <p class="compact-modal-desc confirm-modal-description">
                ${description}
            </p>
        `;

        // 收集所有區塊及其位置
        const sections = [
            { content: descriptionHtml, position: 'description', order: 0 },
            { content: subTextHtml, position: 'subtext', order: 100 }
        ];

        // 添加列表區塊
        if (listSectionHtml) {
            let order = 10; // after-description 預設
            if (listPosition === 'before-subtext') order = 90;
            if (listPosition === 'after-subtext') order = 110;
            
            sections.push({ content: listSectionHtml, position: 'list', order });
        }

        // 添加說明區塊
        if (infoSectionHtml) {
            let order = 20; // after-description 預設
            if (infoPosition === 'before-subtext') order = 80;
            if (infoPosition === 'after-subtext') order = 120;
            
            sections.push({ content: infoSectionHtml, position: 'info', order });
        }

        // 按順序排列並組合
        return sections
            .sort((a, b) => a.order - b.order)
            .map(section => section.content)
            .join('');
    }
}

// 統一的側邊欄項目渲染
function renderSidebarItem(item, type, currentItemId, currentVersionId) {
    const isItemActive = (item.id === currentItemId && currentMode === type);
    
    return `
        <div class="character-item">
            <div class="character-header ${isItemActive ? 'active' : ''}" 
                 data-action="toggleItemVersions"
                 data-type="${type}"
                 data-item-id="${item.id}">
                <span class="expand-icon"><span class="arrow-icon arrow-right"></span></span>
                <div class="character-info">
                    <span>${FavoriteManager.getDisplayName(item)}</span>
                    <span class="character-version-count">${item.versions.length}</span>
                </div>
            </div>
            <div class="version-list" id="${type}-versions-${item.id}">
                ${item.versions.map(version => renderSidebarVersion(item, version, type, currentVersionId)).join('')}
            </div>
        </div>
    `;
}

function renderAll() { 
    renderSidebar();
    renderContent();
    updateLanguageUI();
    updateSaveButtonStates();

    // 立即設定頂部欄樣式，避免閃現
    updateHeaderBarStyles();

    // 在所有渲染完成後，正確設定展開狀態

setTimeout(() => {
    expandCurrentItemVersions();
    ScrollbarManager.initializeAll();
    updateAllPageStats();
    restoreAllCollapseStates();

        //  確保在最後才初始化高度管理
    setTimeout(() => {
        if (typeof OtherSettings !== 'undefined') {
            OtherSettings.initializeTextareaHeights();
        }
    }, 100);

    // 初始化創作者事件拖曳排序
    if (currentMode === 'loveydovey' && currentLoveyDoveyId && currentLoveyDoveyVersionId) {
        enableCreatorEventsDragSort(currentLoveyDoveyId, currentLoveyDoveyVersionId);

        // 恢復折疊狀態
        const character = loveyDoveyCharacters.find(c => c.id === currentLoveyDoveyId);
        if (character) {
            const version = character.versions.find(v => v.id === currentLoveyDoveyVersionId);
            if (version && version.creatorEvents) {
                version.creatorEvents.forEach(event => {
                    enableCreatorEventsDragSort(currentLoveyDoveyId, currentLoveyDoveyVersionId);
                });
            }
        }
    }
    // 初始化世界書條目拖曳排序
if (currentMode === 'worldbook' && currentWorldBookId && currentWorldBookVersionId) {
    enableWorldBookEntriesDragSort(currentWorldBookId, currentWorldBookVersionId);

    // 恢復世界書條目折疊狀態
    const worldBook = worldBooks.find(wb => wb.id === currentWorldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === currentWorldBookVersionId);
        if (version && version.entries && version.entries.length > 0) {
            // 確保拖曳排序正確初始化
            setTimeout(() => {
                enableWorldBookEntriesDragSort(currentWorldBookId, currentWorldBookVersionId);
            }, 100);
        }
    }
}
}, 50);

}

// 在渲染完成後恢復折疊狀態
function restoreAllCollapseStates() {
    const states = loadCollapseStates();
    
    setTimeout(() => {
        restoreAdditionalInfoCollapseStates(states.additionalInfo);
        restoreCreatorEventCollapseStates(states.creatorEvents);
        restoreWorldBookEntryCollapseStates(states.worldBookEntries);
    }, 100); // 確保DOM已渲染
}

//  添加世界書選擇器更新函數
function updateWorldBookSelector() {
    const currentVersionId = ItemManager.getCurrentVersionId();
    if (!currentVersionId) return;

    // ✨ 修正：同時尋找 desktop 和 mobile 版本的選擇器
    const selectorDesktop = document.getElementById(`worldbook-selector-desktop-${currentVersionId}`);
    const selectorMobile = document.getElementById(`worldbook-selector-mobile-${currentVersionId}`);
    
    // 產生一次選項內容
    const optionsHTML = ContentRenderer.generateWorldBookOptions();

    // 如果電腦版選擇器存在，就更新它
    if (selectorDesktop) {
        selectorDesktop.innerHTML = optionsHTML;
    }

    // 如果手機版選擇器存在，也更新它
    if (selectorMobile) {
        selectorMobile.innerHTML = optionsHTML;
    }
}

// 統一的內容渲染函數
function renderContent() {
    ContentRenderer.renderMainContent();
}

function renderCustomContent() {
    renderAll();
    
    // 延遲啟用筆記本欄位拖曳排序
    setTimeout(() => {
        if (currentMode === 'custom' && currentCustomSectionId && currentCustomVersionId) {
            DragSortManager.enableCustomFieldsDragSort(currentCustomSectionId, currentCustomVersionId);
        }
    }, 100);
}

function renderWorldBookContent() {
    renderAll();
    
    setTimeout(() => {
        restoreAllCollapseStates(); 
    }, 50);
}

// 統一的渲染控制函數
function renderCurrentMode() {
    switch(currentMode) {
        case 'character':
            renderAll();
            break;
        case 'worldbook':
            renderWorldBookContent();
            break;
        case 'custom':
            renderCustomContent();
            break;
        default:
            renderAll();
    }
}

function renderItemList(type, items, currentItemId, currentVersionId) {
    let filteredItems = getFilteredItemsForSidebar(items, type, currentItemId);
    
    if (typeof OverviewManager !== 'undefined') {
        if (type === 'character') {
            filteredItems = OverviewManager.sortCharacters([...filteredItems]);
        } else {
            filteredItems = OverviewManager.sortItems([...filteredItems], type);
        }
    }
    
    return filteredItems.map(item => renderSidebarItem(item, type, currentItemId, currentVersionId)).join('');
}



// 新增：基本介面渲染
function renderBasicUI() {
    renderSidebar();
    updateLanguageUI();
    updateSaveButtonStates();
    
    if (isHomePage) {
        // 首頁：顯示載入提示
        document.getElementById('contentArea').innerHTML = `
            <div class="empty-state">
                <div class="loading-main-text">${t('loadingCharacters')}</div>
                <div class="loading-sub-text">${t('pleaseWait')}</div>
            </div>
        `;
        
        // 延遲渲染角色卡
        setTimeout(() => {
            renderHomePage();
            if (typeof OverviewManager !== 'undefined') {
                OverviewManager.renderCharacters();
            }
        }, 50);
    } else {
        renderContent();
    }
    
    // 確保在所有渲染完成後調用 initAutoResize
    setTimeout(() => {
        if (typeof initAutoResize === 'function') {
            initAutoResize();
        }
    }, 200);
}

// 延遲載入進階功能
async function loadAdvancedFeatures(startTime) {
    try {
        // ✅ 1. 先載入排序管理（必須在拖曳功能前）
        if (typeof OverviewManager !== 'undefined') {
            OverviewManager.initialize();
        }
        
        // ✅ 2. 應用保存的自定義排序（必須在渲染前）
        if (typeof DragSortManager !== 'undefined') {
            DragSortManager.applySavedOrder('character');
        }
        
        // ✅ 3. 重新渲染以反映正確順序
        if (characters.length > 0) {
            // 重新渲染側邊欄（套用正確排序）
            renderSidebar();
            
            // 如果在首頁，也重新渲染角色卡
            if (isHomePage) {
                OverviewManager.renderCharacters();
            }
        }
        
        // ✅ 4. 啟用拖曳功能
        if (typeof DragSortManager !== 'undefined') {
            DragSortManager.initializeAll();
            DragSortManager.initializeDragImport();
        }
        
        // ⏰ 5. 延遲載入非關鍵功能
        setTimeout(() => {
            if (typeof ScrollbarManager !== 'undefined') {
                ScrollbarManager.initializeAll();
            }
        }, 200);
        
        setTimeout(() => {
            initTiktoken();
        }, 500);
        
        
        
    } catch (error) {
        console.warn('進階功能載入失敗:', error);
    }
}

// 📊 側邊欄事件委託系統
function initSidebarEventDelegation() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // 移除現有的事件監聽器（如果有）
    sidebar.removeEventListener('click', handleSidebarClick);
    
    // 添加統一的點擊事件處理
    sidebar.addEventListener('click', handleSidebarClick);
    
    
}

// 📊 統一的側邊欄點擊處理函數
function handleSidebarClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const type = target.getAttribute('data-type');
    const itemId = target.getAttribute('data-item-id');
    const versionId = target.getAttribute('data-version-id');
    
    // 根據action類型執行對應操作
    switch (action) {
        case 'selectSidebarItem':
            if (type && itemId && versionId) {
                selectSidebarItem(type, itemId, versionId);
            }
            break;
            
        case 'toggleItemVersions':
            if (itemId && type) {
                // ✅ 修正：正確的參數順序
                toggleItemVersions(type, itemId);
            }
            break;
            
        case 'enterListPage':
            if (type) {
                enterListPage(type);
            }
            break;
            
        case 'saveData':
            saveData();
            break;
            
        case 'openSearchModal':
            ContentSearchManager.openSearchModal();
            break;
            
        default:
            console.warn('未知的側邊欄操作:', action);
    }
}

// 筆記本欄位拖曳排序功能
function reorderCustomFieldsFromContainer(container, sectionId, versionId) {
    const section = customSections.find(s => s.id === sectionId);
    if (!section) return;
    
    const version = section.versions.find(v => v.id === versionId);
    if (!version || !version.fields) return;
    
    const fieldGroups = Array.from(container.querySelectorAll('.field-group'));
    
    const newFieldsOrder = [];
    fieldGroups.forEach(group => {
        const fieldId = group.dataset.fieldId;
        const field = version.fields.find(f => f.id === fieldId);
        if (field) {
            newFieldsOrder.push(field);
        }
    });
    
    if (newFieldsOrder.length !== version.fields.length) {
        console.warn('⚠️ 欄位數量不匹配，使用原順序');
        return;
    }
    
    // 更新陣列順序
    version.fields = newFieldsOrder;
    
    // 🎯 修復：重新渲染整個欄位容器以確保 id 正確
    ContentRenderer.renderCustomFieldsList(sectionId, versionId);
    
    TimestampManager.updateVersionTimestamp('custom', sectionId, versionId);
    markAsChanged();
}

// 🚀 在頁面載入時初始化事件委託
document.addEventListener('DOMContentLoaded', initSidebarEventDelegation);