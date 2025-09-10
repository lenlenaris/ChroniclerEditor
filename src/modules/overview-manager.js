// ===== 總覽管理 =====
class OverviewManager {
    static currentSort = 'created-desc';
    static selectedTags = [];
        // 分頁相關屬性
    static itemsPerPage = 50;
    static currentlyShown = 50;
    static processedItems = []; 
    static isShowingAll = false; 
    static lastProcessParams = null;

   static initialize() {
    const savedSort = localStorage.getItem('characterCreator-sortPreference');
    if (savedSort) {
        this.currentSort = savedSort;
    }
    
    const savedTags = localStorage.getItem('characterCreator-selectedTags');
    if (savedTags) {
        try {
            this.selectedTags = JSON.parse(savedTags);
        } catch (error) {
            console.warn('載入儲存的標籤篩選失敗:', error);
            this.selectedTags = [];
        }
    }
    
    // 如果是自定義排序，確保載入保存的順序
    if (this.currentSort === 'custom') {
        DragSortManager.applySavedOrder('character');
    }
    
    // 同步下拉選單顯示值
    this.syncDropdownValue();
}

// 修正 OverviewManager.renderOverview 函數，加強事件綁定處理
static renderOverview(type, options = {}) {
    const defaultOptions = {
        showImport: false,
        maxWidth: '90%'
    };
    
    // 根據類型設定預設值
    const typeDefaults = {
        'character': { 
            showImport: true, 
            maxWidth: '90%',
            gridId: 'character-grid'
        },
        'userpersona': { 
            showImport: false, 
            maxWidth: '90%',
            gridId: 'userpersona-grid' 
        },
        'loveydovey': { 
            showImport: false, 
            maxWidth: '90%',
            gridId: 'loveydovey-grid'
        },
        'worldbook': { 
            showImport: true, 
            maxWidth: '70%',
            gridId: `${type}-list`
        },
        'custom': { 
            showImport: false, 
            maxWidth: '70%',
            gridId: `${type}-list`
        }
    };
    
    const config = { 
        ...defaultOptions, 
        ...typeDefaults[type], 
        ...options,
        type 
    };
    
    // 根據類型決定容器
    const container = document.getElementById('contentArea');
    if (!container) return;
    
    // 渲染頁面結構
    container.innerHTML = this.renderOverviewLayout(config);
    
    // 呼叫對應的資料處理和卡片渲染函數
    setTimeout(() => {
        switch(type) {
            case 'character':
                this.renderCharacters();
                break;
            case 'userpersona':
                ContentRenderer.renderUserPersonaCards();
                break;
            case 'loveydovey':
                ContentRenderer.renderLoveyDoveyCards();
                break;
            case 'worldbook':
            case 'custom':
                this.renderItems(type, config.gridId);
                break;
        }
        
        // 統一的後續初始化
        this.updateTagDisplay();
        
        // 恢復排序選擇狀態  
        const sortDropdown = document.querySelector('.overview-sort-dropdown');
        if (sortDropdown) {
            this.initialize(); // 確保載入儲存的設定
            sortDropdown.value = this.getCurrentSort();
        }
        
        // 根據類型初始化拖曳功能和其他綁定
        setTimeout(() => {
            if (type === 'character' || type === 'userpersona' || type === 'loveydovey') {
                // 卡片頁拖曳功能
                if (typeof DragSortManager !== 'undefined') {
                    const dragConfig = {
                        containerSelector: `#${config.gridId}`,
                        itemSelector: this.getDragItemSelector(type),
                        type: type,
                        mode: 'grid',
                        onReorder: () => {
                            this.enableCustomSort();
                            const dropdown = document.querySelector('.overview-sort-dropdown');
                            if (dropdown) dropdown.value = 'custom';
                            
                            // 重新渲染對應類型
                            if (type === 'character') this.renderCharacters();
                            else if (type === 'userpersona') ContentRenderer.renderUserPersonaCards();
                            else if (type === 'loveydovey') ContentRenderer.renderLoveyDoveyCards();
                        }
                    };
                    DragSortManager.enableDragSort(dragConfig);
                }
                
                // 綁定hover效果
                ContentRenderer.bindCardHoverEffects();
                
                // 自動檢測並初始化所有附加資訊的拖曳排序（針對卿卿我我）
                if (type === 'loveydovey') {
                    setTimeout(() => {
                        if (typeof DragSortManager !== 'undefined' && DragSortManager.autoInitializeAdditionalInfoDragSort) {
                            DragSortManager.autoInitializeAdditionalInfoDragSort();
                        }
                    }, 500);
                }
                
            } else if (type === 'worldbook' || type === 'custom') {
                // 列表頁拖曳功能
                if (typeof DragSortManager !== 'undefined') {
                    DragSortManager.initializeListPageDragSort(type);
                }
            }
            
            // 同步下拉選單值
            this.syncDropdownValue();
            
        }, 100);
        
    }, 50);
}

// 輔助函數：獲取拖曳選擇器
static getDragItemSelector(type) {
    switch(type) {
        case 'character':
            return '.home-card[onclick*="selectCharacterFromHome"]';
        case 'userpersona':
            return '.home-card[onclick*="selectItem(\'userpersona\'"]';
        case 'loveydovey':
            return '.home-card[onclick*="selectItem(\'loveydovey\'"]';
        default:
            return '.home-card';
    }
}

static syncDropdownValue() {
    const possibleSelectors = [
        '.sort-dropdown',
        '.overview-sort-dropdown', 
        'select[class*="sort"]',
        '.sort-select'
    ];
    
    let dropdown = null;
    for (const selector of possibleSelectors) {
        dropdown = document.querySelector(selector);
        if (dropdown) break;
    }
    
    if (dropdown && this.currentSort) {
        dropdown.value = this.currentSort;
        
    }
}

    // 儲存排序設定
    static saveSortPreference(sortValue) {
        localStorage.setItem('characterCreator-sortPreference', sortValue);
    }

    // 儲存標籤篩選設定
    static saveTagsPreference() {
        localStorage.setItem('characterCreator-selectedTags', JSON.stringify(this.selectedTags));
    }

    static getCurrentSort() {
        return this.currentSort;
    }

static renderCharacters() {
    this.renderCards('character');
}
    
    static filterCharacters() {
    return characters.filter(character => {
        // 標籤篩選
        const tagMatch = TagManager.itemHasTags(character, this.selectedTags);
        
        // 搜尋篩選
        const searchMatch = !searchText || 
            character.name.toLowerCase().includes(searchText);
        
        return tagMatch && searchMatch;
    });
}

// 最愛項目優先排序
static applyFavoritePriority(itemList) {
    const favorites = [];
    const nonFavorites = [];
    
    itemList.forEach(item => {
        // 向後兼容處理
        if (item.isFavorite === undefined) {
            item.isFavorite = false;
        }
        
        if (item.isFavorite) {
            favorites.push(item);
        } else {
            nonFavorites.push(item);
        }
    });
    
    // 最愛項目排在前面，非最愛項目排在後面
    return [...favorites, ...nonFavorites];
}
    
   
static sortCharacters(characterList) {
    if (this.currentSort === 'custom') {
        //  使用自定義排序
        const savedOrder = DragSortManager.loadCustomOrder('character');
        if (savedOrder && savedOrder.length > 0) {
            const ordered = [];
            savedOrder.forEach(id => {
                const character = characterList.find(c => c.id === id);
                if (character) ordered.push(character);
            });
            
            // 添加不在排序列表中的新角色
            characterList.forEach(character => {
                if (!savedOrder.includes(character.id)) {
                    ordered.push(character);
                }
            });
            
            return ordered;
        }
    }
    
    const sorted = characterList.sort((a, b) => {
        switch (this.currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'time-desc': 
            const bLatestTime = Math.max(...b.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            const aLatestTime = Math.max(...a.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            return bLatestTime - aLatestTime;
        case 'time-asc': 
            const aLatestTimeAsc = Math.max(...a.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            const bLatestTimeAsc = Math.max(...b.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            return aLatestTimeAsc - bLatestTimeAsc;
            case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'created-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'tokens-desc': 
                return this.calculateItemTotalTokens(b) - this.calculateItemTotalTokens(a);
            case 'tokens-asc': 
                return this.calculateItemTotalTokens(a) - this.calculateItemTotalTokens(b);
                
            default: return 0;
        }
    });
    
    // 其他排序才套用最愛優先
    return this.applyFavoritePriority(sorted);
}

// 計算單個項目的總 token 數
static calculateItemTotalTokens(item) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    const itemType = this.getItemTypeFromItem(item);
    
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, itemType);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}

// 從項目推斷類型（用於統計計算）
static getItemTypeFromItem(item) {
    // 根據項目結構判斷類型
    if (item.versions && item.versions[0]) {
        const firstVersion = item.versions[0];
        
        //  卿卿我我特徵：有 profileImage, characterName 等欄位
        if (firstVersion.hasOwnProperty('profileImage') || 
            firstVersion.hasOwnProperty('characterName') ||
            firstVersion.hasOwnProperty('publicDescription')) {
            return 'loveydovey';
        }
        
        // 角色卡特徵：有 description, personality 等欄位
        if (firstVersion.hasOwnProperty('description') || 
            firstVersion.hasOwnProperty('personality')) {
            return 'character';
        }
        
        // 玩家角色特徵：只有 avatar, description 等基本欄位
        if (firstVersion.hasOwnProperty('avatar') && 
            !firstVersion.hasOwnProperty('scenario')) {
            return 'userpersona';
        }
        
        // 世界書特徵：有 entries 陣列
        if (firstVersion.hasOwnProperty('entries')) {
            return 'worldbook';
        }
        
        // 筆記特徵：有 fields 陣列
        if (firstVersion.hasOwnProperty('fields')) {
            return 'custom';
        }
    }
    
    // 預設為角色
    return 'character';
}


// 添加帶類型的 token 計算方法
static calculateItemTotalTokensWithType(item, type) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, type);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}
    
    static generateCharacterCards(characterList) {
    const cards = characterList.map((character, index) => {
        const firstVersion = character.versions[0];
        
        return `
            <div class="home-card" 
                 onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('${character.id}')` : `selectCharacterFromHome('${character.id}')`}"
                 data-character-id="${character.id}"
                 id="card-${character.id}"
                 style="aspect-ratio: 2 / 3; width: 180px; transition: all 0.2s ease; position: relative; cursor: pointer;">
                
                <!-- 角色卡片主體 -->
                <div style="
                    flex: 1 1 auto; 
                    width: 100%; 
                    height: 280px; 
                    aspect-ratio: 2 / 3; 
                    border-radius: 5px; 
                    overflow: hidden; 
                    background: transparent; 
                    border: 1px solid var(--border-color); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 12px; 
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    position: relative;
                ">
                    ${firstVersion.avatar ? 
                        `<img src="${BlobManager.getBlobUrl(firstVersion.avatar)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${character.name}">` :
                        ``
                    }
                    
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay" style="
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        right: 0; 
                        bottom: 0; 
                        background: rgba(92, 193, 255, 0.4); 
                        border: 3px solid #66b3ff; 
                        border-radius: 5px; 
                        z-index: 5;
                        pointer-events: none;
                        box-sizing: border-box;
                        display: none;
                    "></div>
                    
                    <!-- 選擇框（批量編輯模式下顯示） -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                            <input type="checkbox" class="selection-checkbox"
                                   style="
                                       width: 20px; 
                                       height: 20px; 
                                       cursor: pointer; 
                                       pointer-events: none;
                                       background: white;
                                       border: 2px solid #666;
                                       border-radius: 3px;
                                   ">
                        </div>
                    ` : ''}
                </div>
                
                <!-- 角色名稱 -->
                <div style="text-align: center; padding: 0 8px;">
                    <span class="character-name" style="
                        font-size: 1em; 
                        color: var(--text-color); 
                        font-weight: 500; 
                        line-height: 1.3; 
                        display: block;
                    ">
                        ${FavoriteManager.getDisplayName(character)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    return cards + `
<div class="home-card create-character-card" onclick="addCharacterFromHome()" 
     style="cursor: pointer; width: 180px; transition: all 0.2s ease;">
            <div style="width: 100%; height: 280px; border: 2px dashed var(--border-color); border-radius: 8px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 12px;"
                 onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                 onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                <div style="color: var(--text-muted); font-size: 3em; margin-bottom: 8px; opacity: 0.7;">+</div>
                <span style="font-size: 0.9em; color: var(--text-muted); font-weight: 500; text-align: center; line-height: 2.0; opacity: 0.7;">
                    ${t('createOrImport')}
                </span>
            </div>
        </div>
`;
}
    
static applySorting(sortValue) {
    this.currentSort = sortValue;
    this.saveSortPreference(sortValue);
    
    // 🆕 重置分頁狀態，因為排序改變了
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null; // 強制重新處理
    
    // 如果切換到非自定義排序，清除自定義排序
    if (sortValue !== 'custom') {
        if (isHomePage) {
            DragSortManager.clearCustomOrder('character');
        } else if (isListPage) {
            DragSortManager.clearCustomOrder(listPageType);
        }
        else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            DragSortManager.clearCustomOrder('loveydovey');
        }
    }
    
    this.syncDropdownValue();
    
    // 根據當前頁面類型重新渲染
    if (isHomePage) {
        this.renderCharacters();
        renderSidebar();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
        renderSidebar();
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
        renderSidebar();
    }
    else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
        renderSidebar();
    }
}
    // 添加自定義排序方法
    static enableCustomSort() {
        this.currentSort = 'custom';
        this.saveSortPreference('custom');
    }
    
    static showTagSelector(event) {
        const existingDropdown = document.getElementById('tag-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
            return;
        }
        
        const allTags = TagManager.getAllTags();
        const availableTags = allTags.filter(tag => !this.selectedTags.includes(tag));
        
        if (availableTags.length === 0) {
            return;
        }
        
        const button = event.target;
        const dropdown = document.createElement('div');
        dropdown.id = 'tag-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 120px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        dropdown.innerHTML = availableTags.map(tag => `
            <div onclick="OverviewManager.selectTag('${tag}')" 
                 style="padding: 8px 12px; cursor: pointer; font-size: 0.9em; transition: background 0.2s ease;"
                 onmouseover="this.style.background='var(--bg-color)'"
                 onmouseout="this.style.background='transparent'">
                ${tag}
            </div>
        `).join('');
        
        button.style.position = 'relative';
        button.appendChild(dropdown);
        
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    }

static selectTag(tag) {
    this.selectedTags.push(tag);
    this.saveTagsPreference();
    this.updateTagDisplay();
    
    // 🆕 重置分頁狀態
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null;
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
    
    const dropdown = document.getElementById('tag-dropdown');
    if (dropdown) dropdown.remove();
}
    
    static updateTagDisplay() {
        const container = document.getElementById('selected-tags');
        if (!container) return;
        
        container.innerHTML = this.selectedTags.map(tag => `
                <span class="tag-base tag-md" onclick="OverviewManager.removeTag('${tag}')">
                    ${tag}
                    <button class="tag-remove-btn">×</button>
                </span>
            `).join('');
    }
    
static removeTag(tag) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.saveTagsPreference();
    this.updateTagDisplay();
    
    // 🆕 重置分頁狀態
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null;
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

static renderItems(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 🆕 檢查是否需要重新處理數據
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '',
        type: type
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    container.style.display = 'none';
    
    if (needReprocess) {
        // 重新處理數據
        let items = this.getItemsArray(type);
        let filteredItems = this.filterItems(items, type);
        this.processedItems = this.sortItems(filteredItems, type);
        this.currentlyShown = this.itemsPerPage;
        this.lastProcessParams = currentParams;
    }
    
    // 計算要顯示的項目
    const itemsToShow = this.processedItems.slice(0, this.currentlyShown);
    this.isShowingAll = this.currentlyShown >= this.processedItems.length;
    
    // 使用批量字符串拼接
    const htmlParts = [];
    
    itemsToShow.forEach(item => {
        htmlParts.push(this.generateListItem(item, type));
    });
    
    htmlParts.push(this.generateAddButton(type));
    
    // 🆕 添加 Show More 按鈕（如果需要）
    if (!this.isShowingAll) {
        htmlParts.push(this.generateShowMoreButton(type));
    }
    
    container.innerHTML = htmlParts.join('');
    container.style.display = '';
    
    OverviewManager.syncDropdownValue();
}


static invalidateCache() {
    this.processedItems = [];
    this.lastProcessParams = null;
    this.currentlyShown = this.itemsPerPage;
    this.isShowingAll = false;
}


static onDataChange() {
    this.invalidateCache();
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
        renderSidebar();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
        renderSidebar();
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
        renderSidebar();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
        renderSidebar();
    }
}

static generateShowMoreButton(type) {
    const remainingCount = this.processedItems.length - this.currentlyShown;
    const showCount = Math.min(remainingCount, this.itemsPerPage);
    
    if (type === 'characters' || type === 'userpersona' || type === 'loveydovey') {
        // 卡片樣式的 Show More 按鈕
        const cardWidth = type === 'loveydovey' ? '220px' : '180px';
        const cardHeight = type === 'loveydovey' ? '220px' : '280px';
        
        return `
            <div class="home-card show-more-card" 
                 onclick="OverviewManager.showMoreItems('${type}')" 
                 style="cursor: pointer; width: ${cardWidth}; transition: all 0.2s ease;">
                <div style="
                    width: 100%; 
                    height: ${cardHeight}; 
                    border: 2px dashed var(--accent-color); 
                    border-radius: 8px; 
                    background: transparent; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 12px;
                    opacity: 0.8;
                "
                onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'; this.style.opacity='1'"
                onmouseout="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='transparent'; this.style.opacity='0.8'">
                    <div style="color: var(--accent-color); font-size: 2.5em; margin-bottom: 8px;">↓</div>
                    <span style="
                        font-size: 0.9em; 
                        color: var(--accent-color); 
                        font-weight: 500; 
                        text-align: center; 
                        line-height: 1.4;
                    ">
                        ${t('showMore')}<br>
                        <small>(+${showCount})</small>
                    </span>
                </div>
            </div>
        `;
    } else {
        // 列表樣式的 Show More 按鈕（其他類型）
        return `
            <div class="show-more-button" 
                 onclick="OverviewManager.showMoreItems('${type}')" 
                 style="
                     border: 2px dashed var(--accent-color);
                     border-radius: 8px;
                     padding: 20px;
                     text-align: center;
                     cursor: pointer;
                     transition: all 0.2s ease;
                     background: transparent;
                     margin-bottom: 16px;
                     opacity: 0.8;
                 "
                 onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'; this.style.opacity='1'"
                 onmouseout="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='transparent'; this.style.opacity='0.8'">
                <div style="color: var(--accent-color); font-size: 2em; margin-bottom: 8px;">↓</div>
                <div style="color: var(--accent-color); font-size: 1em; font-weight: 500;">
                    ${t('showMore')} (+${showCount})
                </div>
                <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 4px;">
                    ${t('showing')} ${this.currentlyShown} / ${this.processedItems.length}
                </div>
            </div>
        `;
    }
}

static showMoreItems(type) {
    this.currentlyShown = Math.min(
        this.currentlyShown + this.itemsPerPage,
        this.processedItems.length
    );
    
    // 根據類型重新渲染
    if (type === 'characters') {
        this.renderCharacters();
    } else if (isListPage && type === listPageType) {
        this.renderItems(type, `${type}-list`);
    } else if (currentMode === 'userpersona' && type === 'userpersona') {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && type === 'loveydovey') {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

    // 獲取項目陣列
    static getItemsArray(type) {
        switch (type) {
            case 'character': return characters;
            case 'loveydovey': return loveyDoveyCharacters;
            case 'userpersona': return userPersonas;
            case 'worldbook': return worldBooks;
            case 'custom': return customSections;
            default: return [];
        }
    }

    // 通用篩選邏輯
    static filterItems(items, type) {
    return items.filter(item => {
        // 標籤篩選
        const tagMatch = TagManager.itemHasTags(item, this.selectedTags);
        
        // 搜尋篩選
        const searchMatch = !searchText || 
            item.name.toLowerCase().includes(searchText);
        
        return tagMatch && searchMatch;
    });
}

static sortItems(itemList, type) {
    if (this.currentSort === 'custom') {
        const savedOrder = DragSortManager.loadCustomOrder(type);
        if (savedOrder && savedOrder.length > 0) {
            const ordered = [];
            savedOrder.forEach(id => {
                const item = itemList.find(i => i.id === id);
                if (item) ordered.push(item);
            });
            
            itemList.forEach(item => {
                if (!savedOrder.includes(item.id)) {
                    ordered.push(item);
                }
            });
            
            return ordered;
        }
    }
    
    const sorted = itemList.sort((a, b) => {
        switch (this.currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'time-desc': return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            case 'time-asc': return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
            case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'created-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'tokens-desc': 
                return this.calculateItemMaxTokens(b, type) - this.calculateItemMaxTokens(a, type);
            case 'tokens-asc': 
                return this.calculateItemMaxTokens(a, type) - this.calculateItemMaxTokens(b, type);
            default: return 0;
        }
    });
    
    // 其他排序才套用最愛優先
    return this.applyFavoritePriority(sorted);
}

static calculateItemMaxTokens(item, type) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    
    item.versions.forEach(version => {
        // 直接使用 StatsManager，它會自動使用 TokenCacheManager 緩存
        const stats = StatsManager.calculateVersionStats(version, type);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}

    // 生成項目列表HTML
    static generateItemList(items, type) {
        return items.map(item => this.generateListItem(item, type)).join('') + 
            this.generateAddButton(type);
    }

  // 生成單個列表項目
static generateListItem(item, type) {
    const stats = this.getItemStats(item, type);
    const latestVersion = item.versions.reduce((latest, version) => {
    const latestTime = new Date(latest.updatedAt || 0).getTime();
    const versionTime = new Date(version.updatedAt || 0).getTime();
    return versionTime > latestTime ? version : latest;
}, item.versions[0]);

const timestamp = TimestampManager.formatTimestamp(latestVersion?.updatedAt);
    
    return `
        <div class="list-item" 
             onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('${item.id}')` : `selectItem('${type}', '${item.id}')`}"
             data-item-id="${item.id}"
             id="list-item-${item.id}"
             style="
                 background: var(--surface-color);
                 border: 1px solid var(--border-color);
                 border-radius: 8px;
                 padding: 20px;
                 margin-bottom: 16px;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 position: relative;
             "
             onmouseover="if (!batchEditMode) { this.style.borderColor='var(--accent-color)'; const deleteBtn = this.querySelector('.delete-btn'); if(deleteBtn) deleteBtn.style.display='block' }"
             onmouseout="if (!batchEditMode) { this.style.borderColor='var(--border-color)'; const deleteBtn = this.querySelector('.delete-btn'); if(deleteBtn) deleteBtn.style.display='none' }">

            <!-- 選擇框（批量編輯模式下顯示） -->
            ${batchEditMode || FavoriteManager.isInEditMode() ? `
                <div style="position: absolute; top: 16px; left: 16px; z-index: 10;">
                    <input type="checkbox" class="list-selection-checkbox"
                           style="width: 18px; height: 18px; cursor: pointer; pointer-events: none;">
                </div>
                <div style="margin-left: 40px;">
            ` : '<div>'}
            
                <!--  標題行（包含標籤） -->
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 8px;
                    margin-right: ${!batchEditMode ? '50px' : '0px'};
                ">
                    <div class="list-item-name" style="
                        font-size: 1.1em; 
                        font-weight: 600; 
                        color: var(--text-color);
                        flex: 1;
                    ">
                        ${FavoriteManager.getDisplayName(item)}
                    </div>
                    

                </div>
                
                <!-- 統計行 -->
                <div style="font-size: 0.9em; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
                    <span>${timestamp}</span>
                    <span>${stats}</span>
                </div>
            
            </div>
            
            <!-- 刪除按鈕 -->
${!batchEditMode ? `
    <button class="delete-btn" onclick="event.stopPropagation(); ItemCRUD.remove('${type}', '${item.id}')"
        style="position: absolute; top: 12px; right: 12px; display: none;"
        title="${t('delete')}">
    ${IconManager.delete({style: 'vertical-align: middle;'})}
</button>
` : ''}
        </div>
    `;
}

// 生成項目標籤顯示
static generateItemTags(item) {
    if (!item.versions || item.versions.length === 0) return '';
    
    // 收集所有版本的標籤
    const allTags = new Set();
    item.versions.forEach(version => {
        if (version.tags) {
            const tags = TagManager.normalizeToArray(version.tags);
            tags.forEach(tag => allTags.add(tag));
        }
    });
    
    const tagsArray = Array.from(allTags);
    
    if (tagsArray.length === 0) return '';
    
    return tagsArray.map(tag => `
        <span style="
            background: var(--border-color); 
            color: var(--text-muted); 
            padding: 2px 6px; 
            border-radius: 8px; 
            font-size: 0.75em; 
            white-space: nowrap;
            opacity: 0.8;
        ">${tag}</span>
    `).join('');
}

    
// 更明確的統計顯示
static getItemStats(item, type) {
    let maxChars = 0;
    let maxTokens = 0;
    let maxVersionName = '';
    let extraInfo = '';
    
    // 找出各版本中的最高值，並記錄版本名稱
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, type);
        if (stats.tokens > maxTokens) {
            maxChars = stats.chars;
            maxTokens = stats.tokens;
            maxVersionName = version.name;
        }
    });
    
    if (type === 'worldbook') {
        const maxEntries = Math.max(...item.versions.map(v => v.entries.length));
        extraInfo = `${maxEntries} ${t('entriesCount')} / `;
    }
    
    // 如果有多個版本，顯示最高版本的提示
    const versionHint = item.versions.length > 1 ? ` (${t('highest')}: ${maxVersionName})` : '';
    
    return `${extraInfo}${maxChars} ${t('chars')} / ${maxTokens} ${t('tokens')}${versionHint}`;
}

    // 生成新增按鈕
    static generateAddButton(type) {
        const typeKeyMap = {
            'userpersona': 'userPersona',
            'worldbook': 'worldBook', 
            'custom': 'customFields'
        };
        
        return `
            <div class="add-item-card" onclick="ItemCRUD.add('${type}')" 
                style="
                    border: 2px dashed var(--border-color);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: transparent;
                    margin-bottom: 16px;
                "
                onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                <div style="color: var(--text-muted); font-size: 2em; margin-bottom: 4px;">+</div>
                <div style="color: var(--text-muted); font-size: 0.9em; margin-bottom: 8px;">
     ${type === 'worldbook' ? t('clickToAddWorldBookOrImport') : 
  type === 'custom' ? t('clickToAddNotebook') : 
  `${t('clickToAdd')} ${t(typeKeyMap[type] || 'item')}`}
</div>
            </div>
        `;
    }

    // 統一控制列
    static renderOverviewControls(config) {
        const { type, showImport = false } = config;
        
        // 根據類型設定tooltip和匯入函數
        const typeConfig = {
            'character': { 
                tooltip: 'tooltipAddCharacter',
                importFn: 'importCharacter()',
                importTooltip: 'tooltipImportCharacter'
            },
            'userpersona': { 
                tooltip: 'tooltipAddUserPersona',
                importFn: null,
                importTooltip: null
            },
            'loveydovey': { 
                tooltip: 'tooltipAddLoveydovey',
                importFn: null,
                importTooltip: null
            },
            'worldbook': { 
                tooltip: 'tooltipAddWorldbook',
                importFn: 'importWorldBook()',
                importTooltip: 'tooltipImportWorldbook'
            },
            'custom': { 
                tooltip: 'tooltipAddCustom',
                importFn: null,
                importTooltip: null
            }
        };
        
        const config_data = typeConfig[type];
        
        return `
            <div class="overview-controls" style="display: flex; gap: 12px; align-items: center; padding: 16px 32px; background: transparent; border-radius: 8px; margin-bottom: 16px; border: 0px solid var(--border-color); min-height: 48px; margin-top: 0px;">
                
                <!-- 新增按鈕 -->
                <button class="overview-btn hover-primary" onclick="ItemCRUD.add('${type}')" title="${t(config_data.tooltip)}">
                    ${IconManager.plus()}
                </button>

                ${showImport && config_data.importFn ? `
                <!-- 匯入按鈕 -->
                <button class="overview-btn hover-primary" onclick="${config_data.importFn}" title="${t(config_data.importTooltip)}">
                    ${IconManager.upload()}
                </button>
                ` : ''}
                
                <!-- 愛心按鈕 -->
                <button class="overview-btn hover-primary" onclick="FavoriteManager.toggleMode()" title="${t('tooltipManageFavorites')}">
                ${IconManager.heartFilled()} 
                </button>

                <!-- 批量編輯按鈕 -->
                <button class="overview-btn hover-primary" onclick="toggleBatchEditMode()" title="${t('tooltipBatchEdit')}">
                    ${IconManager.selectAll()}
                </button>
                
                <!-- 搜尋框 -->
                <div class="search-container">
                    ${IconManager.search({className: 'search-icon'})}
                    <input type="text" id="search-input" class="search-input" placeholder="${t('searchPlaceholder')}" oninput="handleSearchInput(this.value)">
                </div>
                
                <!-- 排序下拉 -->
                <select class="overview-sort-dropdown hover-primary" onchange="OverviewManager.applySorting(this.value)" title="${t('tooltipSortDropdown')}">
                    <option value="created-desc" selected>${t('sortNewestFirst')}</option>
                    <option value="created-asc">${t('sortOldestFirst')}</option>
                    <option value="name-asc">${t('sortNameAsc')}</option>
                    <option value="name-desc">${t('sortNameDesc')}</option>
                    <option value="time-desc">${t('sortTimeDesc')}</option>
                    <option value="time-asc">${t('sortTimeAsc')}</option>
                    <option value="tokens-desc">${t('sortTokensDesc')}</option>
                    <option value="tokens-asc">${t('sortTokensAsc')}</option>
                    <option value="custom">${t('customSort')}</option>
                </select>

                <!-- 標籤篩選按鈕 -->
                <button class="overview-btn hover-primary" onclick="OverviewManager.showTagSelector(event)" title="${t('tooltipTagFilter')}">
                    ${t('tagFilter')}
                </button>

                <!-- 已選標籤顯示區域 -->
                <div id="selected-tags" style="display: flex; gap: 4px; flex: 1;"></div>
            </div>
        `;
    }

    static renderBatchOperationsBars() {
        return `
            <!-- 批量操作列（默認隱藏） -->
            <div id="batch-operations-bar" style="display: ${batchEditMode ? 'block' : 'none'}; padding: 0px 32px; margin-bottom: 16px;">
                <div style="
                    background: var(--surface-color); 
                    border: 1px solid var(--border-color); 
                    border-radius: 8px; 
                    padding: 12px 20px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    font-size: 0.9em;
                ">
                    <div style="color: var(--text-color);">
                        ${t('selectedCount')}<span id="selected-count">0</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="overview-btn hover-primary" onclick="selectAllItems()">
                            ${t('selectAll')}
                        </button>
                        <button class="overview-btn hover-primary" onclick="cancelBatchEdit()">
                            ${t('cancel')}
                        </button>
                        <button class="overview-danger-btn" onclick="deleteSelectedItems()">
                            ${t('deleteSelected')}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 愛心操作列 -->
            <div id="favorite-operations-bar" style="display: none; padding: 0px 32px; margin-bottom: 16px;">
                <div style="
                    background: var(--surface-color); 
                    border: 1px solid var(--border-color); 
                    border-radius: 8px; 
                    padding: 12px 20px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    font-size: 0.9em;
                ">
                    <div style="color: var(--text-color);">
                        ${t('selectedFavoriteCount')}<span id="selected-favorite-count">0</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="overview-btn hover-primary" onclick="selectAllItems()">
                            ${t('selectAll')}
                        </button>
                        <button class="overview-btn hover-primary" onclick="FavoriteManager.cancelEdit()">
                            ${t('cancel')}
                        </button>
                        <button class="overview-btn btn-primary" onclick="FavoriteManager.applyChanges()">
                            ${t('applyFavoriteChanges')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }


static renderOverviewLayout(config) {
    const { type, showImport = false, gridId, maxWidth = '90%' } = config;
    
    // 判斷是列表頁還是卡片頁
    const isListPage = (type === 'worldbook' || type === 'custom');
    
    if (isListPage) {
        // 列表頁結構
        return `
            <div style="max-width: ${maxWidth}; margin: 0 auto; margin-top: 15px; padding: 0px;">
                
                ${this.renderOverviewControls({ type, showImport })}
                
                ${this.renderBatchOperationsBars()}
                
                <!-- 項目列表容器 -->
                <div class="item-list" id="${gridId}" style="padding: 0 32px;">
                    <!-- 項目會在這裡渲染 -->
                </div>
            </div>
        `;
    } else {
        // 卡片頁結構
        const gridClass = type === 'loveydovey' ? 'userpersona-grid loveydovey-grid' : 
                         type === 'userpersona' ? 'userpersona-grid' : 'character-grid';
        const minWidth = type === 'loveydovey' ? '220px' : '160px';
        
        return `
            <div style="max-width: ${maxWidth}; margin: 0 auto; margin-top: 15px; padding: 0px;">
                
                ${this.renderOverviewControls({ type, showImport })}
                
                ${this.renderBatchOperationsBars()}
                
                <!-- 卡片容器 -->
                <div style="padding: 0px 32px 32px 32px; background: transparent; border-radius: 12px;">
                    <div class="${gridClass}" id="${gridId}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${minWidth}, 1fr)); gap: 60px;">
                        <!-- 卡片會在這裡渲染 -->
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== 統一卡片渲染配置 =====
static CARD_CONFIGS = {
    character: {
        width: '180px', height: '280px', aspectRatio: '2/3',
        imageField: 'avatar',
        clickFn: 'selectCharacterFromHome', // ✅ 這個是對的
        dataAttr: 'data-character-id',
        nameClass: 'character-name',
        dragSelector: '.home-card[onclick*="selectCharacterFromHome"]',
        gridId: 'character-grid',
        gridClass: 'character-grid',
        createText: 'createOrImport'
    },
    userpersona: {
        width: '180px', height: '280px', aspectRatio: '2/3',
        imageField: 'avatar',
        clickFn: 'selectItem',
        clickParams: ['userpersona'],
        dataAttr: 'data-persona-id',
        nameClass: 'persona-name', 
        dragSelector: '.home-card[onclick*="selectItem(\'userpersona\'"]',
        gridId: 'userpersona-grid',
        gridClass: 'userpersona-grid',
        createText: 'clickToCreatePersona'
    },
    loveydovey: {
        width: '220px', height: '220px', aspectRatio: '1/1',
        imageField: 'profileImage',
        clickFn: 'selectItem',
        clickParams: ['loveydovey'],
        dataAttr: 'data-persona-id',
        nameClass: 'character-name',
        dragSelector: '.home-card[onclick*="selectItem(\'loveydovey\'"]',
        gridId: 'loveydovey-grid', 
        gridClass: 'userpersona-grid loveydovey-grid',
        createText: 'clickToCreateLoveydovey'
    }
};

// ===== 統一卡片渲染主函數 =====
static renderCards(type, folderId = null) {
    const config = this.CARD_CONFIGS[type];
    if (!config) {
        console.error('❌ 不支援的卡片類型:', type);
        return;
    }
    
    const container = document.getElementById(config.gridId);
    if (!container) return;
    
    // 🔄 檢查是否需要重新處理數據
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '',
        type: type,
        folderId: folderId, // 🗂️ 資料夾功能預留
        dataLength: this.getItemsArray(type).length
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    if (needReprocess) {
        // 重新處理數據
        let items = this.getItemsArray(type);
        
        // 🗂️ 資料夾篩選（預留功能）
        if (folderId) {
            items = items.filter(item => item.folderId === folderId);
        }
        
        // 套用現有篩選邏輯
        let filteredItems = this.filterItems(items, type);
        this.processedItems = this.sortItems(filteredItems, type);
        this.currentlyShown = this.itemsPerPage;
        this.lastProcessParams = currentParams;
    }
    
    // 計算要顯示的項目
    const itemsToShow = this.processedItems.slice(0, this.currentlyShown);
    this.isShowingAll = this.currentlyShown >= this.processedItems.length;
    
    // 🎨 生成卡片HTML
    const cards = this.generateUnifiedCards(itemsToShow, type, config);
    const createCard = this.generateCreateCard(type, config);
    
    container.innerHTML = cards + createCard;
    
    // 添加 Show More 按鈕（如果需要）
    if (!this.isShowingAll) {
        const showMoreType = type === 'character' ? 'characters' : 
                    type === 'userpersona' ? 'userpersona' :
                    type === 'loveydovey' ? 'loveydovey' : type;
container.innerHTML += this.generateShowMoreButton(showMoreType);
    }
    
    // ⚡ 延遲初始化功能（避免效能問題）
    setTimeout(() => {
        this.initializeCardFeatures(type, config);
    }, 100);
    
    this.syncDropdownValue();
}

// ===== 統一卡片HTML生成 =====
static generateUnifiedCards(itemList, type, config) {
    return itemList.map((item, index) => {
        const firstVersion = item.versions[0];
        const imageUrl = firstVersion[config.imageField];
        let normalClickAction;
        if (config.clickParams) {
            // selectItem 類型的函數需要額外參數
            const params = config.clickParams.map(p => `'${p}'`).join(', ');
            normalClickAction = `${config.clickFn}(${params}, '${item.id}')`;
        } else {
            // selectCharacterFromHome 類型的函數只需要 ID
            normalClickAction = `${config.clickFn}('${item.id}')`;
        }

        const clickAction = batchEditMode || FavoriteManager.isInEditMode() ? 
            `toggleItemSelection('${item.id}')` : 
            normalClickAction;
        
        return `
            <div class="home-card" 
                 onclick="${clickAction}"
                 ${config.dataAttr}="${item.id}"
                 id="card-${item.id}"
                 style="aspect-ratio: ${config.aspectRatio}; width: ${config.width}; transition: all 0.2s ease; position: relative; cursor: pointer;">
                
                <!-- 卡片主體 -->
                <div style="
                    flex: 1 1 auto; 
                    width: 100%; 
                    height: ${config.height}; 
                    aspect-ratio: ${config.aspectRatio}; 
                    border-radius: 5px; 
                    overflow: hidden; 
                    background: transparent; 
                    border: 1px solid var(--border-color); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 12px; 
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    position: relative;
                ">
                    ${imageUrl ? 
                        `<img src="${BlobManager.getBlobUrl(imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}">` :
                        ``
                    }
                    
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay" style="
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        right: 0; 
                        bottom: 0; 
                        background: rgba(92, 193, 255, 0.4); 
                        border: 3px solid #66b3ff; 
                        border-radius: 5px; 
                        z-index: 5;
                        pointer-events: none;
                        box-sizing: border-box;
                        display: none;
                    "></div>
                    
                    <!-- 選擇框（批量編輯模式下顯示） -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                            <input type="checkbox" class="selection-checkbox"
                                   style="
                                       width: 20px; 
                                       height: 20px; 
                                       cursor: pointer; 
                                       pointer-events: none;
                                       background: white;
                                       border: 2px solid #666;
                                       border-radius: 3px;
                                   ">
                        </div>
                    ` : ''}
                </div>
                
                <!-- 項目名稱 -->
                <div style="text-align: center; padding: 0 8px;">
                    <span class="${config.nameClass}" style="
                        font-size: 1em; 
                        color: var(--text-color); 
                        font-weight: 500; 
                        line-height: 1.3; 
                        display: block;
                    ">
                        ${FavoriteManager.getDisplayName(item)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 統一新增卡片生成 =====
static generateCreateCard(type, config) {
    return `
        <div class="home-card create-${type}-card" onclick="ItemCRUD.add('${type}')" 
             style="cursor: pointer; width: ${config.width}; transition: all 0.2s ease;">
            <div style="width: 100%; height: ${config.height}; border: 2px dashed var(--border-color); border-radius: 8px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 12px;"
                 onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                 onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                <div style="color: var(--text-muted); font-size: 3em; margin-bottom: 8px; opacity: 0.7;">+</div>
                <span style="font-size: 0.9em; color: var(--text-muted); font-weight: 500; text-align: center; line-height: 2.0; opacity: 0.7;">
                    ${t(config.createText)}
                </span>
            </div>
        </div>
    `;
}

// ===== 統一功能初始化 =====
static initializeCardFeatures(type, config) {
    // 🎯 啟用拖曳功能
    if (typeof DragSortManager !== 'undefined') {
        DragSortManager.enableDragSort({
            containerSelector: `#${config.gridId}`,
            itemSelector: config.dragSelector,
            type: type,
            mode: 'grid',
            onReorder: () => {
                this.enableCustomSort();
                // 🔧 修復：找對正確的下拉選單
                const dropdown = document.querySelector('.overview-sort-dropdown') || 
                               document.querySelector('.sort-dropdown');
                if (dropdown) dropdown.value = 'custom';
                if (typeof renderSidebar === 'function') {
                    renderSidebar();
                }
            }
        });
    }
    
    // 🎯 綁定hover效果
    ContentRenderer.bindCardHoverEffects();
    
    // 🎯 恢復選中項目的視覺狀態（如果在批量編輯模式）
    if (batchEditMode && selectedItems.length > 0) {
        selectedItems.forEach(itemId => {
            updateCardVisualState(itemId);
        });
    }
    
    // 🎯 特殊處理：卿卿我我的額外初始化
    if (type === 'loveydovey') {
        setTimeout(() => {
            if (typeof DragSortManager !== 'undefined' && DragSortManager.autoInitializeAdditionalInfoDragSort) {
                DragSortManager.autoInitializeAdditionalInfoDragSort();
            }
        }, 500);
    }
}

}