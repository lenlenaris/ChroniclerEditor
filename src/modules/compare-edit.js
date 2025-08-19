// ===== 雙屏編輯管理器 =====
class CrossTypeCompareManager {
    
    static openSelector() {
        // 清除上次的選擇記錄
        crossTypeItems.left = {
            type: 'character',
            itemId: null,
            versionId: null
        };
        crossTypeItems.right = {
            type: 'character', 
            itemId: null,
            versionId: null
        };
        const content = `
    <div class="compact-modal-content" style="max-width: 900px; max-height: 95vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="compact-modal-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
                ${IconManager.edit({width: 18, height: 18})}
                <h3 class="compact-modal-title">${t('dualScreenSelector')}</h3>
            </div>
            <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
        </div>
        
        <div style="flex: 1; overflow-y: auto;">
            <p class="compact-modal-desc" style="text-align: left; margin-bottom: 20px;">
                ${t('dualScreenDescription')}
            </p>

            <!-- 左右選擇區域 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                
                <!-- 左側選擇器 -->
                <div>
                    ${this.renderSelector('left')}
                </div>
                
                <!-- 右側選擇器 -->
                <div>
                    ${this.renderSelector('right')}
                </div>
            </div>
        </div>

        <div class="compact-modal-footer" style="justify-content: center;">
            <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">
                ${t('cancel')}
            </button>
            <button class="overview-btn btn-primary" onclick="CrossTypeCompareManager.startCrossTypeCompare()">
                ${t('startDualScreen')}
            </button>
        </div>
    </div>
`;
        
        ModalManager.create({
            title: '',
            content: content,
            footer: '',
            maxWidth: '800px'
        });
        
        // 初始化選擇器
        this.updateItemOptions('left');
        this.updateItemOptions('right');
    }
    
 static renderSelector(side) {
    const currentType = crossTypeItems[side].type;
    
    // 檢查卿卿我我是否顯示
    const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;
    
    return `
        <div class="selector-group">
            <!-- 類型選擇 -->
            <select class="field-input" id="${side}-type-selector" onchange="CrossTypeCompareManager.onTypeChange('${side}', this.value)" style="margin-bottom: 12px;">
                <option value="character" ${currentType === 'character' ? 'selected' : ''}>${t('character')}</option>
                ${showLoveyDovey ? `<option value="loveydovey" ${currentType === 'loveydovey' ? 'selected' : ''}>${t('loveydovey')}</option>` : ''}
                <option value="userpersona" ${currentType === 'userpersona' ? 'selected' : ''}>${t('userPersona')}</option>
                <option value="worldbook" ${currentType === 'worldbook' ? 'selected' : ''}>${t('worldBook')}</option>
                <option value="custom" ${currentType === 'custom' ? 'selected' : ''}>${t('customFields')}</option>
            </select>
            
            <!-- 搜尋框 -->
            <input type="text" 
                   id="${side}-search-input" 
                   class="field-input msize-input"
                   placeholder="${t('searchItems')}"
                   style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                   oninput="CrossTypeCompareManager.filterItems('${side}', this.value)">
            
            <!-- 項目列表容器 -->
           <div id="${side}-items-container" style="max-height: 500px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color);">
                <!-- 項目會在這裡動態載入 -->
            </div>
            
        </div>
    `;
}
    
    static onTypeChange(side, type) {
        crossTypeItems[side].type = type;
        crossTypeItems[side].itemId = null;
        crossTypeItems[side].versionId = null;
        
        // 清空搜尋框
        const searchInput = document.getElementById(`${side}-search-input`);
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 重新載入項目列表
        this.renderItemsList(side);
        
        // 清空選擇顯示
        const display = document.getElementById(`${side}-selected-display`);
        if (display) {
            display.innerHTML = t('notSelectedYet');
            display.style.color = 'var(--text-muted)';
            display.style.fontWeight = 'normal';
        }
    }
    
    static onItemChange(side, itemId) {
        crossTypeItems[side].itemId = itemId;
        crossTypeItems[side].versionId = null;
        
        this.updateVersionOptions(side);
    }
    
    static onVersionChange(side, versionId) {
        crossTypeItems[side].versionId = versionId;
    }
    
static updateItemOptions(side) {
    this.renderItemsList(side);
}
    
    static updateVersionOptions(side) {
        const { type, itemId } = crossTypeItems[side];
        const selector = document.getElementById(`${side}-version-selector`);
        if (!selector || !itemId) return;
        
        //  使用正確的資料陣列
        let items = [];
        switch (type) {
            case 'character':
                items = characters;
                break;
            case 'loveydovey':
                items = loveyDoveyCharacters;
                break;
            case 'userpersona':
                items = userPersonas;
                break;
            case 'worldbook':
                items = worldBooks;
                break;
            case 'custom':
                items = customSections;
                break;
        }
        
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            selector.innerHTML = `<option value="">${t('selectVersion')}</option>` + 
                item.versions.map(version => `<option value="${version.id}">${version.name}</option>`).join('');
        }
    }
    
    static clearVersionOptions(side) {
        const selector = document.getElementById(`${side}-version-selector`);
        if (selector) {
            selector.innerHTML = `<option value="">${t('selectVersion')}</option>`;
        }
    }
    
static startCrossTypeCompare() {
    // 檢查是否都已選擇
    const left = crossTypeItems.left;
    const right = crossTypeItems.right;
    
    if (!left.itemId || !left.versionId || !right.itemId || !right.versionId) {
        alert(t('pleaseSelectBothSides'));
        return;
    }
    
    // 關閉模態框
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
    
    //  直接進入雙屏編輯模式
    crossTypeCompareMode = true;
    isHomePage = false;
    isListPage = false;
    viewMode = 'compare';  // 復用對比模式的佈局
    
    // 設定對比版本（復用現有邏輯）
    compareVersions = [left.versionId, right.versionId];
    
    //  設定當前模式為特殊的跨類型模式
    currentMode = 'crosstype';
    
    // 渲染雙屏編輯介面
    this.renderCrossTypeInterface();
}

//  渲染雙屏編輯介面
static renderCrossTypeInterface() {
    const container = document.getElementById('contentArea');
    if (!container) return;
    
    // 獲取左右兩側的項目和版本
    const leftItem = this.getItemById(crossTypeItems.left.type, crossTypeItems.left.itemId);
    const leftVersion = leftItem?.versions.find(v => v.id === crossTypeItems.left.versionId);
    
    const rightItem = this.getItemById(crossTypeItems.right.type, crossTypeItems.right.itemId);
    const rightVersion = rightItem?.versions.find(v => v.id === crossTypeItems.right.versionId);
    
    if (!leftItem || !leftVersion || !rightItem || !rightVersion) {
        container.innerHTML = `<div style="text-align: center; padding: 80px; color: var(--text-muted);">${t('dataLoadError')}</div>`;
        return;
    }
    
    container.innerHTML = `
        <!-- 雙屏編輯標題欄 -->
        ${this.renderCrossTypeHeader(leftItem, leftVersion, rightItem, rightVersion)}
        
        <!-- 雙屏編輯內容 -->
        <div class="versions-container compare-view" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <!-- 左側面板 -->
            <div class="version-panel">
                ${ContentRenderer.renderVersionHeader(leftItem, leftVersion, crossTypeItems.left.type)}
                ${ContentRenderer.renderVersionContent(leftItem, leftVersion, crossTypeItems.left.type)}
            </div>
            
            <!-- 右側面板 -->
            <div class="version-panel">
                ${ContentRenderer.renderVersionHeader(rightItem, rightVersion, crossTypeItems.right.type)}
                ${ContentRenderer.renderVersionContent(rightItem, rightVersion, crossTypeItems.right.type)}
            </div>
        </div>
    `;
    
    // 初始化功能
setTimeout(() => {
    updateAllPageStats();
    initAutoResize();
}, 50);
}

// 渲染跨類型標題欄
static renderCrossTypeHeader(leftItem, leftVersion, rightItem, rightVersion) {
    return `
        <div class="character-header-bar compare-mode" style="margin-bottom: 15px;">
            <div style="width: 98%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                <div class="character-title-section" style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        font-size: 1.2em; 
                        font-weight: 600; 
                        color: var(--text-color);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        ${IconManager.edit({width: 20, height: 20, style: 'vertical-align: middle;'})}
                        <span>${leftItem.name} + ${rightItem.name}</span>
                    </div>
                </div>
            
            </div>
        </div>
    `;
}

//  根據類型和ID獲取項目
static getItemById(type, itemId) {
    let items = [];
    switch (type) {
        case 'character': items = characters; break;
        case 'loveydovey': items = loveyDoveyCharacters; break;
        case 'userpersona': items = userPersonas; break;
        case 'worldbook': items = worldBooks; break;
        case 'custom': items = customSections; break;
    }
    return items.find(item => item.id === itemId);
}

    
//  獲取類型顯示名稱
static getTypeDisplayName(type) {
    const typeNames = {
        'character': t('character'),
        'loveydovey': t('loveydovey'),
        'userpersona': t('userPersona'),
        'worldbook': t('worldBook'),
        'custom': t('customFields')
    };
    return typeNames[type] || type;
}

    // 獲取指定類型的所有項目-版本組合
static getItemsForType(type) {
    let items = [];
    let sourceArray = [];
    
    switch (type) {
        case 'character':
            sourceArray = characters;
            break;
        case 'loveydovey':
            sourceArray = loveyDoveyCharacters;
            break;
        case 'userpersona':
            sourceArray = userPersonas;
            break;
        case 'worldbook':
            sourceArray = worldBooks;
            break;
        case 'custom':
            sourceArray = customSections;
            break;
    }
    
    sourceArray.forEach(item => {
        item.versions.forEach(version => {
            items.push({
                itemId: item.id,
                versionId: version.id,
                itemName: item.name,
                versionName: version.name,
                displayName: `${item.name} - ${version.name}`,
                searchText: `${item.name} ${version.name}`.toLowerCase()
            });
        });
    });
    
    // 按照 displayName 進行 A-Z 排序
    return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// 渲染項目列表
static renderItemsList(side) {
    const type = crossTypeItems[side].type;
    const items = this.getItemsForType(type);
    const container = document.getElementById(`${side}-items-container`);
    
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 0.9em;">
                ${t('noItemsOfType')}
            </div>
        `;
        return;
    }
    
    let html = '';
    items.forEach(item => {
        const isSelected = crossTypeItems[side].itemId === item.itemId && 
                          crossTypeItems[side].versionId === item.versionId;
        
        html += `
            <div class="tag-detail-item tag-item-hover ${isSelected ? 'selected-item' : ''}" 
                 data-item-id="${item.itemId}" 
                 data-version-id="${item.versionId}"
                 onclick="CrossTypeCompareManager.selectItem('${side}', '${item.itemId}', '${item.versionId}', '${item.displayName}')"
                 style="padding: 8px 16px; margin-bottom: 0px; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; ${isSelected ? 'background: var(--primary-color); color: white;' : ''}">
                
                <div style="font-weight: 500; color: ${isSelected ? 'white' : 'var(--text-color)'}; display: flex; align-items: center; gap: 8px; font-size: 0.85em;">
                    ${item.displayName}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 篩選項目
static filterItems(side, searchText) {
    const type = crossTypeItems[side].type;
    const items = this.getItemsForType(type);
    const container = document.getElementById(`${side}-items-container`);
    
    if (!container) return;
    
    const searchLower = searchText.toLowerCase();
    const filteredItems = items.filter(item => 
        item.searchText.includes(searchLower)
    );
    
    if (filteredItems.length === 0 && searchText.trim()) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 0.9em;">
                ${t('noMatchingItems')}
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredItems.forEach(item => {
        const isSelected = crossTypeItems[side].itemId === item.itemId && 
                          crossTypeItems[side].versionId === item.versionId;
        
        html += `
            <div class="tag-detail-item tag-item-hover ${isSelected ? 'selected-item' : ''}" 
                 data-item-id="${item.itemId}" 
                 data-version-id="${item.versionId}"
                 onclick="CrossTypeCompareManager.selectItem('${side}', '${item.itemId}', '${item.versionId}', '${item.displayName}')"
                 style="padding: 8px 16px; margin-bottom: 0px; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; ${isSelected ? 'background: var(--primary-color); color: white;' : ''}">
                
                <div style="font-weight: 500; color: ${isSelected ? 'white' : 'var(--text-color)'}; display: flex; align-items: center; gap: 8px; font-size: 0.85em;">
                    ${item.displayName}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 選擇項目
static selectItem(side, itemId, versionId, displayName) {
    crossTypeItems[side].itemId = itemId;
    crossTypeItems[side].versionId = versionId;
    
    // 更新選中狀態的視覺效果
    this.renderItemsList(side);
    
    // 更新已選擇顯示
    const display = document.getElementById(`${side}-selected-display`);
    if (display) {
        display.innerHTML = `${t('selectedPrefix')}${displayName}`;
        display.style.color = 'var(--primary-color)';
        display.style.fontWeight = '500';
    }
}
}


//  開啟雙屏編輯選擇器的函數
function openCrossTypeCompare() {
    CrossTypeCompareManager.openSelector();
}