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
        console.log(`[OverviewManager.initialize] 從 localStorage 恢復排序設定為: "${this.currentSort}"`);
    } else {
        // 如果沒有儲存的設定，就用預設值
        this.currentSort = 'created-desc'; 
        console.log(`[OverviewManager.initialize] 未找到儲存的排序設定，使用預設值: "${this.currentSort}"`);
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
    
    setTimeout(() => {
        this.syncDropdownValue();
    }, 0);
}

// 修正 OverviewManager.renderOverview 函數，加強事件綁定處理
static renderOverview(type, options = {}) {
    const defaultOptions = {
        showImport: false,
        maxWidth: '100%'
    };
    
    // 根據類型設定預設值
    const typeDefaults = {
        'character': { 
            showImport: true, 
            maxWidth: '100%',
            gridId: 'character-grid'
        },
        'userpersona': { 
            showImport: false, 
            maxWidth: '100%',
            gridId: 'userpersona-grid' 
        },
        'loveydovey': { 
            showImport: false, 
            maxWidth: '100%',
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
    console.log(`%c[applySorting] 被呼叫，傳入的值是: "${sortValue}"`, 'background: #ffc107; color: black;');
    console.log(`[applySorting] 呼叫前的 this.currentSort 是: "${this.currentSort}"`);

    this.currentSort = sortValue;
    this.saveSortPreference(sortValue);
    
    // 🆕 重置分頁狀態，因為排序改變了
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null; // 強制重新處理
    
    // 如果切換到非自定義排序，清除自定義排序
/*
    if (sortValue !== 'custom') {
        console.warn(`[applySorting] 偵測到非 custom 排序，準備清除自定義排序...`);
        if (isHomePage) {
            DragSortManager.clearCustomOrder('character');
        } else if (isListPage) {
            DragSortManager.clearCustomOrder(listPageType);
        }
        else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            DragSortManager.clearCustomOrder('loveydovey');
        }
    }
*/
    
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
    
    // 檢查是否需要重新處理數據
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '',
        type: type,
        folderId: NavigationManager.getCurrentFolderId()
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    container.style.display = 'none';
    
    if (needReprocess) {
        // 重新處理數據
        let items = this.getItemsArray(type);
        
        const hasTagFilter = this.selectedTags && this.selectedTags.length > 0;
        const hasSearchText = searchText && searchText.trim().length > 0;
        
        if (hasTagFilter || hasSearchText) {
            // 全域篩選模式：有標籤篩選或搜尋文字時，忽略資料夾結構
        } else {
            // 正常模式：按資料夾結構篩選
            const currentFolderId = NavigationManager.getCurrentFolderId();
            
            if (currentFolderId) {
                // 在資料夾內：只顯示該資料夾的項目
                items = items.filter(item => item.folderId === currentFolderId);
            } else {
                // 在根目錄：顯示無資料夾的項目
                items = items.filter(item => !item.folderId);
            }
        }
        
        let filteredItems = this.filterItems(items, type);
        this.processedItems = this.sortItems(filteredItems, type);
        this.currentlyShown = this.itemsPerPage;
        this.lastProcessParams = currentParams;
    }
    
    // 🆕 分離資料夾和檔案
    const currentFolderId = NavigationManager.getCurrentFolderId();
    const hasTagFilter = this.selectedTags && this.selectedTags.length > 0;
    const hasSearchText = searchText && searchText.trim().length > 0;
    
    let folders = [];
    let regularItems = this.processedItems;
    
    // 只有在根目錄且無篩選條件時才顯示資料夾
    if (!currentFolderId && !hasTagFilter && !hasSearchText) {
        folders = FolderManager.getFoldersByType(type);
    }
    
    // 🆕 渲染資料夾區塊
    this.renderFoldersSection(folders, type);
    
    // 🆕 渲染檔案區塊
    const itemsToShow = regularItems.slice(0, this.currentlyShown);
    this.isShowingAll = this.currentlyShown >= regularItems.length;

    const htmlParts = [];
    
    itemsToShow.forEach(item => {
        htmlParts.push(this.generateListItem(item, type));
    });
    
    htmlParts.push(this.generateAddButton(type));
    
    if (!this.isShowingAll) {
        htmlParts.push(this.generateShowMoreButton(type));
    }
    
    container.innerHTML = htmlParts.join('');
    container.style.display = '';
    
    // 🆕 控制檔案區塊標題顯示
    this.updateFilesHeaderVisibility(folders.length > 0 && regularItems.length > 0);
    
    OverviewManager.syncDropdownValue();
}

// 渲染資料夾區塊
static renderFoldersSection(folders, type) {
    const foldersSection = document.getElementById('folders-section');
    const foldersGrid = document.getElementById('folders-grid');
    
    if (!foldersSection || !foldersGrid) return;
    
    if (folders.length === 0) {
        foldersSection.style.display = 'none';
        return;
    }
    
    // 顯示資料夾區塊
    foldersSection.style.display = 'block';
    
    // 生成資料夾小長條卡片
    const folderCards = folders.map(folder => this.generateFolderCard(folder, type)).join('');
    foldersGrid.innerHTML = folderCards;
}

// 🆕 生成資料夾小長條卡片
static generateFolderCard(folder, type) {
    const folderInfo = FolderManager.loadFolderInfo(type, folder.id);
    const folderName = folderInfo?.name || folder.name;
    
    return `
        <div class="folder-card" 
            onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('folder-${folder.id}')` : `NavigationManager.enterFolder('${type}', '${folder.id}', '${folderName}')`}"
            oncontextmenu="ContextMenuManager.showFolderMenu(event, '${type}', '${folder.id}', '${folderName}')"
            data-folder-id="${folder.id}"
            id="folder-card-${folder.id}"
            style="
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                height: 48px;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
            "
            onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
            onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='var(--surface-color)'">
            
            <!-- 選擇框（批量編輯模式下顯示） -->
            ${batchEditMode || FavoriteManager.isInEditMode() ? `
                <div style="flex-shrink: 0;">
                    <input type="checkbox" class="selection-checkbox"
                        style="width: 16px; height: 16px; cursor: pointer; pointer-events: none;">
                </div>
            ` : ''}
            
            <!-- 🔧 修正：資料夾圖示和文字垂直置中 -->
            <div style="
                flex-shrink: 0;
                display: flex;
                align-items: center;
            ">
                ${IconManager.folder({width: 20, height: 20, style: 'color: var(--text-muted);'})}
            </div>
            
            <!-- 資料夾名稱 -->
            <div style="
                flex: 1; 
                min-width: 0; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap;
                font-weight: 500;
                color: var(--text-color);
                line-height: 1;
            ">
                ${folderName}
            </div>
            
        <!-- 項目數量 -->
        <div style="
            flex-shrink: 0;
            font-size: 0.85em;
            color: var(--text-muted);
            line-height: 1;
        ">
            ${this.formatItemCount(folder.itemCount)}
        </div>
            
            <!-- 🗑️ 移除：選項按鈕（三個點） -->
            
            <!-- 選中覆蓋層 -->
            <div class="selection-overlay" style="
                position: absolute; 
                top: 0; 
                left: 0; 
                right: 0; 
                bottom: 0; 
                background: rgba(92, 193, 255, 0.4); 
                border: 3px solid #66b3ff; 
                border-radius: 8px; 
                z-index: 5;
                pointer-events: none;
                box-sizing: border-box;
                display: none;
            "></div>
        </div>
    `;
}

// 格式化項目數量顯示
static formatItemCount(count) {
    if (count === 0) {
        return 'Empty';
    } else if (count === 1) {
        return '1 item';
    } else {
        return `${count} items`;
    }
}

// 控制檔案區塊標題顯示
static updateFilesHeaderVisibility(shouldShow) {
    const filesHeader = document.getElementById('files-header');
    if (filesHeader) {
        filesHeader.style.display = shouldShow ? 'block' : 'none';
    }
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
    NavigationManager.updateBreadcrumbOnly();
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
    // 1. 永遠先把資料夾和常規項目分開
    const folders = itemList.filter(item => item.isFolder || (item.id && item.id.startsWith('folder-')));
    const regularItems = itemList.filter(item => !item.isFolder && (!item.id || !item.id.startsWith('folder-')));
    
    // 2. 處理自定義排序（它只對常規項目有效）
if (this.currentSort === 'custom') {
    folders.sort((a, b) => a.name.localeCompare(b.name));
    
    const savedOrder = DragSortManager.loadCustomOrder(type);
    if (savedOrder && savedOrder.length > 0) {
        const orderedItems = [];
        
        savedOrder.forEach(id => {
            const item = regularItems.find(i => i.id === id);
            if (item) orderedItems.push(item);
        });
        
        regularItems.forEach(item => {
            if (!savedOrder.includes(item.id)) {
                orderedItems.push(item);
            }
        });
        
        return [...folders, ...orderedItems];
    }
    // 🆕 沒有儲存的排序時，保持當前順序並應用最愛優先
    return [...folders, ...this.applyFavoritePriority(regularItems)];
}
    
    // 3. 建立一個通用的排序器，用於所有標準排序
    const sorter = (a, b) => {
        switch (this.currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'time-desc': return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            case 'time-asc': return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
            case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'created-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'tokens-desc': 
                return this.calculateItemMaxTokens(b, type) - this.calculateItemMaxTokens(a, type);
            case 'tokens-asc': 
                return this.calculateItemMaxTokens(a, type) - this.calculateItemMaxTokens(b, type);
            default: return 0;
        }
    };
    
    // 4. 分別對資料夾和常規項目進行排序
    const sortedFolders = folders.sort(sorter);
    const sortedItems = regularItems.sort(sorter);
    
    // 5. 對排序後的常規項目套用「最愛優先」
    const sortedItemsWithFavorites = this.applyFavoritePriority(sortedItems);
    
    // 6. 組合最終結果
    return [...sortedFolders, ...sortedItemsWithFavorites];
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
        // 資料夾特殊處理
        if (item.isFolder) {
            const folderInfo = FolderManager.loadFolderInfo(type, item.originalFolderId);
            const folderName = folderInfo?.name || item.name;
            
           return `
    <div class="list-item folder-list-item" 
        onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('folder-${item.originalFolderId}')` : `NavigationManager.enterFolder('${type}', '${item.originalFolderId}', '${folderName}')`}"
        oncontextmenu="ContextMenuManager.showFolderMenu(event, '${type}', '${item.originalFolderId}', '${folderName}')"
        data-folder-id="${item.originalFolderId}"
        id="folder-list-item-${item.originalFolderId}"
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
        onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
        onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='var(--surface-color)'">

                    <!-- 選擇框（批量編輯模式下顯示） -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 16px; left: 16px; z-index: 10;">
                            <input type="checkbox" class="list-selection-checkbox"
                                style="width: 18px; height: 18px; cursor: pointer; pointer-events: none;">
                        </div>
                        <div style="margin-left: 40px;">
                    ` : '<div>'}
                    
<!--  單行顯示：資料夾名稱和統計 -->
<div style="
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-right: ${!batchEditMode ? '0px' : '0px'};
    height: 60px;
">
    <div class="list-item-name" style="
        font-size: 1.1em; 
        font-weight: 600; 
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 8px;
    ">
        ${IconManager.folder({width: 24, height: 24, strokeWidth: 1, style: 'color: var(--text-muted);'})}
${folderName}
    </div>
    <span style="font-size: 0.9em; color: var(--text-muted);">
        ${item.itemCount} ${t('items')}
    </span>
</div>
                    
                    </div>
                    
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay" style="
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        right: 0; 
                        bottom: 0; 
                        background: rgba(92, 193, 255, 0.4); 
                        border: 3px solid #66b3ff; 
                        border-radius: 8px; 
                        z-index: 5;
                        pointer-events: none;
                        box-sizing: border-box;
                        display: none;
                    "></div>
                </div>
            `;
        }
        
        // 原有的一般項目邏輯
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
                oncontextmenu="ContextMenuManager.showItemMenu(event, '${type}', '${item.id}', '${item.name}')"
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

static renderBreadcrumbNav() {
    const currentPageInfo = this.getCurrentPageInfo();
    const breadcrumbs = NavigationManager.getBreadcrumbs();
    const isInFolder = NavigationManager.isInFolder();
    
    // 獲取根目錄所有項目數量（包含資料夾）
    const allItems = this.getItemsArray(currentPageInfo.type);
    const totalRootCount = allItems.length;
    
    // 構建麵包屑內容
    let breadcrumbContent = `
        <span class="sidebar-section-title" style="margin-left: 0;">${currentPageInfo.name}</span>
        ${totalRootCount > 0 ? `<span style="font-size: 0.8em; color: var(--text-muted); margin-left: 4px; margin-top: 3px;">${totalRootCount}</span>` : ''}

    `;
    
    if (isInFolder) {
        // 修改：0 的時候不顯示數字
        const currentFolderId = NavigationManager.getCurrentFolderId();
        const folderItems = FolderManager.getFolderItems(currentPageInfo.type, currentFolderId);
        const folderCount = folderItems.length;
        
        breadcrumbContent = `
            <span class="sidebar-section-title" style="margin-left: 0;">${currentPageInfo.name}</span>
            <span style="color: var(--text-muted); margin: 0 3px;">/</span>
            <span class="sidebar-section-title" style="margin-left: 0;">${breadcrumbs[1]}</span>
            ${folderCount > 0 ? `<span style="font-size: 0.8em; color: var(--text-muted); margin-left: 4px; margin-top: 3px;">${folderCount}</span>` : ''}

        `;
    }
    
    return `
        <div style="padding: 0 32px; margin-bottom: 8px;">
            <div class="breadcrumb-nav" style="
    padding: 20px 5px; 
    font-size: 1.1em; 
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    height: 32px; 
    line-height: 16px;  
    box-sizing: border-box; 
    ${isInFolder ? 'cursor: pointer;' : 'cursor: default;'}
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0px;
    overflow: hidden; 
            " ${isInFolder ? `onclick="NavigationManager.exitFolder()"` : ''}
            ${isInFolder ? `onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='var(--text-muted)'"` : ''}>
                ${breadcrumbContent}
            </div>
        </div>
    `;
}

    // 獲取當前頁面資訊（輕量實現）
    static getCurrentPageInfo() {
        if (isHomePage) {
            return { name: t('character'), type: 'character' };
        } else if (isListPage) {
            const typeNames = {
                'worldbook': t('worldBook'),
                'custom': t('customFields')
            };
            return { name: typeNames[listPageType] || listPageType, type: listPageType };
        } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
            return { name: t('userPersona'), type: 'userpersona' };
        } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            return { name: t('loveydovey'), type: 'loveydovey' };
        }
        return { name: t('unknown'), type: 'unknown' };
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
            <div class="overview-controls">
                
                <!-- 新增按鈕 -->
                <button class="overview-btn hover-primary" onclick="ItemCRUD.add('${type}')" title="${t(config_data.tooltip)}">
                    ${IconManager.plus()}
                </button>

                ${showImport && config_data.importFn ? `
                <!-- 匯入按鈕 -->
                <button class="overview-btn hover-primary" onclick="${config_data.importFn}" title="${t(config_data.importTooltip)}">
                    ${IconManager.import()}
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
                <div id="selected-tags"></div>
            </div>
        `;
    }

static renderBatchOperationsBars() {
    return `
        <!-- 批量操作列（默認隱藏） -->
        <div id="batch-operations-bar" class="batch-operations-bar" style="display: ${batchEditMode ? 'block' : 'none'};">
            <div class="batch-operations-content">
                <div class="batch-operations-left">
                    ${t('selectedCount')}<span id="selected-count">0</span>
                </div>
                <div class="batch-operations-right">
                    <button class="overview-btn hover-primary" onclick="selectAllItems()">
                        <span id="select-all-text">${t('selectAll')}</span>
                    </button>
                    
                    <button class="overview-btn hover-primary" onclick="selectAllFolders()">
                        ${t('selectAllFolders')}
                    </button>
                    
                    <button class="overview-btn hover-primary" onclick="createNewFolderInBatch()">
                        ${t('newFolder')}
                    </button>
                    
                    <button class="overview-btn hover-primary" onclick="FolderMoveDialog.show()">
                        ${t('moveToFolder')}
                    </button>
                    
                    <button class="overview-btn hover-primary" onclick="dissolveFoldersOnly()" id="dissolve-folders-btn">
                        ${t('dissolveFolders')}
                    </button>
                    
                    <button class="overview-danger-btn" onclick="deleteSelectedItems()" id="delete-button">
                        <span id="delete-button-text">${t('deleteSelected')}</span>
                    </button>
                    
                    <button class="overview-btn hover-primary" onclick="cancelBatchEdit()">
                        ${t('cancel')}
                    </button>
                </div>
            </div>
        </div>

        <!-- 愛心操作列 -->
        <div id="favorite-operations-bar" class="favorite-operations-bar" style="display: none;">
            <div class="favorite-operations-content">
                <div class="favorite-operations-left">
                    ${t('selectedFavoriteCount')}<span id="selected-favorite-count">0</span>
                </div>
                <div class="favorite-operations-right">
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
    const isListPage = (type === 'worldbook' || type === 'custom');
    const breadcrumbHtml = this.renderBreadcrumbNav();
    
    if (isListPage) {
        // 🆕 修改後的列表頁結構 - 支援分區顯示
        return `
            <div style="max-width: ${maxWidth}; margin: 0 auto; margin-top: 0px; padding: 0px;">

                ${breadcrumbHtml}
                
                ${this.renderOverviewControls({ type, showImport })}
                
                ${this.renderBatchOperationsBars()}
                
                <!-- 資料夾區塊 -->
                <div id="folders-section" style="padding: 0 32px; margin-bottom: 24px; display: none;">
                    <h3 style="color: var(--text-color); margin-left: 5px; margin-bottom: 16px; font-size: 0.9em; font-weight: 600;">
                        ${t('folders')}
                    </h3>
                    <div id="folders-grid" style="
                        display: grid; 
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
                        gap: 12px;
                        margin-bottom: 8px;
                    "></div>
                </div>
                
                <!-- 檔案區塊 -->
                <div id="files-section" style="padding: 0 32px;">
                    <div id="files-header" style="display: none; margin-left: 5px; margin-bottom: 16px;">
                        <h3 style="color: var(--text-color); font-size: 0.9em; font-weight: 600;">
                            ${t('files')}
                        </h3>
                    </div>
                    <div class="item-list" id="${gridId}">
                        <!-- 檔案項目會在這裡渲染 -->
                    </div>
                </div>
            </div>
        `;
    } else {
        // 保持原有的卡片頁結構不變
        const gridClass = type === 'loveydovey' ? 'userpersona-grid loveydovey-grid' : 
                         type === 'userpersona' ? 'userpersona-grid' : 'character-grid';
        const minWidth = type === 'loveydovey' ? '220px' : '160px';
        
        return `
            <div style="max-width: ${maxWidth}; margin: 0 auto; margin-top: 0px; padding: 0px;">
                ${breadcrumbHtml}

                ${this.renderOverviewControls({ type, showImport })}
                
                ${this.renderBatchOperationsBars()}
                
                <div class="overview-card-list-container">
                    <div class="${gridClass}" id="${gridId}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${minWidth}, 1fr));">
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
    
    // 🆕 使用 NavigationManager 的狀態
    const currentFolderId = NavigationManager.getCurrentFolderId();
    
    // 📄 檢查是否需要重新處理數據
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '',
        type: type,
        folderId: currentFolderId, // 🆕 使用導航狀態
        dataLength: this.getItemsArray(type).length
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    if (needReprocess) {
        // 重新處理數據
        let items = this.getItemsArray(type);
        
        const hasTagFilter = this.selectedTags && this.selectedTags.length > 0;
        const hasSearchText = searchText && searchText.trim().length > 0;
        
        if (hasTagFilter || hasSearchText) {
        } else {
            // 按資料夾結構篩選
            const currentFolderId = NavigationManager.getCurrentFolderId();
            
            if (currentFolderId) {
                // 在資料夾內：只顯示該資料夾的項目
                items = items.filter(item => item.folderId === currentFolderId);
            } else {
                // 在根目錄：顯示無資料夾的項目
                items = items.filter(item => !item.folderId);
                
                // 🆕 在根目錄時，在前面加入資料夾（當作特殊項目）
                const folders = FolderManager.getFoldersByType(type);
                const folderAsItems = folders.map(folder => ({
                    id: `folder-${folder.id}`,
                    name: folder.name,
                    isFolder: true,
                    folderId: null,
                    itemCount: folder.itemCount,
                    originalFolderId: folder.id,
                    versions: [{ [config.imageField]: null }]
                }));
                
                // 資料夾永遠排在最前面（除了自訂排序）
                if (this.currentSort !== 'custom') {
                    items = [...folderAsItems, ...items];
                } else {
                    items = [...folderAsItems, ...items];
                }
            }
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
    const createCard = currentFolderId ? '' : this.generateCreateCard(type, config); // 資料夾內不顯示新增卡片
    
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
        if (item.isFolder) {
            // --- 資料夾卡片 ---
            const folderItems = FolderManager.getFolderItems(type, item.originalFolderId);
            const imageField = type === 'loveydovey' ? 'profileImage' : 'avatar';
            
            const getImageUrl = (index) => {
                if (folderItems.length > index && folderItems[index] && folderItems[index].versions[0]) {
                    const imageUrl = folderItems[index].versions[0][imageField];
                    return imageUrl ? `background-image: url('${BlobManager.getBlobUrl(imageUrl)}');` : '';
                }
                return '';
            };

            return `
            <div class="home-card folder-card overview-card"
                onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('folder-${item.originalFolderId}')` : `NavigationManager.enterFolder('${type}', '${item.originalFolderId}', '${item.name}')`}"
                oncontextmenu="ContextMenuManager.showFolderMenu(event, '${type}', '${item.originalFolderId}', '${item.name}')"
                data-folder-id="${item.originalFolderId}"
                id="folder-card-${item.originalFolderId}"
                style="aspect-ratio: ${config.aspectRatio}; width: ${config.width};">
                
                <!-- 堆疊背景 (🔧 移除固定的 height) -->
                <div class="overview-folder-card-stack stack-3" style="aspect-ratio: ${config.aspectRatio}; ${getImageUrl(2)}"></div>
                <div class="overview-folder-card-stack stack-2" style="aspect-ratio: ${config.aspectRatio}; ${getImageUrl(1)}"></div>
                
                <!-- 卡片主體 (🔧 移除固定的 height) -->
                <div class="overview-folder-card-body" style="aspect-ratio: ${config.aspectRatio}; ${getImageUrl(0)}">
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay"></div>
                    
                    <!-- 選擇框 -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                            <input type="checkbox" class="selection-checkbox" style="width: 20px; height: 20px; cursor: pointer; pointer-events: none; background: white; border: 2px solid #666; border-radius: 3px;">
                        </div>
                    ` : ''}
                </div>
                
                <!-- 資料夾名稱 -->
                <div class="overview-folder-name-container">
                    <span class="overview-folder-name">
                        ${IconManager.folder({width: 16, height: 16, style: 'color: var(--text-muted);'})}
                        ${item.name}
                    </span>
                </div>
            </div>
            `;
        }
        
        // --- 一般項目卡片 (🔧 移除固定的 height) ---
        const firstVersion = item.versions[0];
        const imageUrl = firstVersion[config.imageField];
        let normalClickAction;
        if (config.clickParams) {
            const params = config.clickParams.map(p => `'${p}'`).join(', ');
            normalClickAction = `${config.clickFn}(${params}, '${item.id}')`;
        } else {
            normalClickAction = `${config.clickFn}('${item.id}')`;
        }

        const clickAction = batchEditMode || FavoriteManager.isInEditMode() ? 
            `toggleItemSelection('${item.id}')` : 
            normalClickAction;
        
        return `
            <div class="home-card overview-card" 
                onclick="${clickAction}"
                oncontextmenu="ContextMenuManager.showItemMenu(event, '${type}', '${item.id}', '${item.name}')"
                ${config.dataAttr}="${item.id}"
                id="card-${item.id}"
                style="aspect-ratio: ${config.aspectRatio}; width: ${config.width};">
                
                <!-- 卡片主體 (🔧 移除固定的 height) -->
                <div class="overview-card-body" style="aspect-ratio: ${config.aspectRatio};">
                    ${imageUrl ? `<img src="${BlobManager.getBlobUrl(imageUrl)}" class="overview-card-image" alt="${item.name}">` : ''}
                    
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay"></div>
                    
                    <!-- 選擇框 -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                            <input type="checkbox" class="selection-checkbox" style="width: 20px; height: 20px; cursor: pointer; pointer-events: none; background: white; border: 2px solid #666; border-radius: 3px;">
                        </div>
                    ` : ''}
                </div>
                
                <!-- 項目名稱 -->
                <div class="overview-card-name-container">
                    <span class="${config.nameClass} overview-card-name">
                        ${FavoriteManager.getDisplayName(item)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 統一新增卡片生成 =====
static generateCreateCard(type, config) {
    const uniqueCreateClass = `create-${type}-card`;

    return `
        <div class="home-card overview-card overview-create-card ${uniqueCreateClass}" 
             onclick="ItemCRUD.add('${type}')" 
             style="aspect-ratio: ${config.aspectRatio}; width: ${config.width};">
            
            <div class="overview-create-card-body">
                <div class="overview-create-card-plus">+</div>
                <span class="overview-create-card-text">
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

// 更新批量操作欄內容
static updateBatchOperationsBar() {
    const countElement = document.getElementById('selected-count');
    const typeInfoElement = document.getElementById('selection-type-info');
    
    if (!countElement || selectedItems.length === 0) {
        if (countElement) countElement.textContent = '0';
        if (typeInfoElement) typeInfoElement.textContent = '';
        return;
    }
    
    // 簡化版選擇分析
    const analysis = this.analyzeSelection();
    
    // 更新選擇計數
    countElement.textContent = analysis.totalCount;
    
    if (typeInfoElement) {
        typeInfoElement.textContent = '';
    }
    if (typeof updateBatchButtonStates === 'function') {
        updateBatchButtonStates();
    }
}

static updateBatchButtons(analysis) {
    const deleteButtonText = document.getElementById('delete-button-text');
    if (deleteButtonText) {
        if (analysis.hasFolders && !analysis.hasItems) {
            deleteButtonText.textContent = t('deleteFolders');
        } else {
            deleteButtonText.textContent = t('deleteSelected');
        }
    }
}

// 分析當前選取項目
static analyzeSelection() {
    const folders = selectedItems.filter(id => id.startsWith('folder-'));
    const items = selectedItems.filter(id => !id.startsWith('folder-'));
    
    return {
        totalCount: selectedItems.length,
        folders: folders,
        items: items,
        hasFolders: folders.length > 0,
        hasItems: items.length > 0,
        isMixed: folders.length > 0 && items.length > 0
    };
}
}

// ===== 資料夾管理器（超簡化版）=====
class FolderManager {
    // 類型對應的顯示名稱
    static typeDisplayNames = {
        character: '角色卡',
        userpersona: '玩家角色', 
        loveydovey: '卿卿我我',
        worldbook: '世界書',
        custom: '筆記本'
    };
    
    // 創建新資料夾（返回資料夾ID）
    static createFolder(type, name) {
        const folderId = 'folder-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 🎯 創建一個虛擬資料夾項目來顯示在UI上
        const folderInfo = {
            id: folderId,
            name: name,
            isFolder: true, // 標記這是資料夾
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 儲存資料夾資訊到 localStorage（輕量資料）
        this.saveFolderInfo(type, folderId, folderInfo);
        
        return folderId;
    }
    
    // 移動項目到資料夾
    static moveItemsToFolder(type, itemIds, targetFolderId) {
        const itemsArray = DataOperations.getItems(type);
        
        itemIds.forEach(itemId => {
            const item = itemsArray.find(i => i.id === itemId);
            if (item) {
                // 🎯 超簡單：直接設定屬性，就像最愛功能一樣
                item.folderId = targetFolderId; // null = 根目錄
            }
        });
        
        markAsChanged(); // 觸發自動儲存，就這樣！
    }
    
    // 取得項目所屬資料夾
    static getItemFolder(type, itemId) {
        const itemsArray = DataOperations.getItems(type);
        const item = itemsArray.find(i => i.id === itemId);
        return item?.folderId || null;
    }
    
    // 取得資料夾內的項目
    static getFolderItems(type, folderId) {
        const itemsArray = DataOperations.getItems(type);
        return itemsArray.filter(item => item.folderId === folderId);
    }
    
    // 取得所有資料夾（從項目中推斷）
    static getFoldersByType(type) {
        const savedFolders = this.getAllSavedFolders(type);
        // 獲取有項目的資料夾ID
        const itemsArray = DataOperations.getItems(type);
        const folderIds = [...new Set(itemsArray.map(item => item.folderId).filter(Boolean))];
        const allFolderIds = [...new Set([...savedFolders.map(f => f.id), ...folderIds])];
        
        return allFolderIds.map(folderId => {
            const folderInfo = this.loadFolderInfo(type, folderId);
            const items = this.getFolderItems(type, folderId);
            
            return {
                id: folderId,
                name: folderInfo?.name || `資料夾 ${folderId.slice(-6)}`,
                items: items.map(item => item.id),
                itemCount: items.length,
                isFolder: true
            };
        });
    }

    static getAllSavedFolders(type) {
        const folders = [];
        const prefix = `characterCreator-folder-${type}-`;
        
        // 遍歷 localStorage 找到所有該類型的資料夾
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const folderData = JSON.parse(localStorage.getItem(key));
                    if (folderData) {
                        folders.push(folderData);
                    }
                } catch (error) {
                    console.warn('讀取資料夾資料失敗:', key, error);
                }
            }
        }
        
        return folders;
    }
    
    // 儲存資料夾資訊（只存名稱等基本資料）
    static saveFolderInfo(type, folderId, info) {
        const key = `characterCreator-folder-${type}-${folderId}`;
        localStorage.setItem(key, JSON.stringify(info));
    }
    
    // 載入資料夾資訊
    static loadFolderInfo(type, folderId) {
        const key = `characterCreator-folder-${type}-${folderId}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    }
    
    // 重新命名資料夾
    static renameFolder(type, folderId, newName) {
        const folderInfo = this.loadFolderInfo(type, folderId);
        if (folderInfo) {
            folderInfo.name = newName;
            folderInfo.updatedAt = new Date().toISOString();
            this.saveFolderInfo(type, folderId, folderInfo);
            return true;
        }
        return false;
    }
    
    // 解散資料夾（項目回到根目錄）
    static dissolveFolder(type, folderId) {
        const itemsArray = DataOperations.getItems(type);
        
        // 將資料夾內所有項目移到根目錄
        itemsArray.forEach(item => {
            if (item.folderId === folderId) {
                item.folderId = null;
            }
        });
        
        // 刪除資料夾資訊
        const key = `characterCreator-folder-${type}-${folderId}`;
        localStorage.removeItem(key);
        
        markAsChanged();
        return true;
    }
    
    // 刪除資料夾（連同內容）
    static deleteFolder(type, folderId) {
        const itemsToDelete = this.getFolderItems(type, folderId);
        
        // 刪除資料夾內的所有項目
        itemsToDelete.forEach(item => {
            ItemCRUD.remove(type, item.id, true);
        });
        
        const key = `characterCreator-folder-${type}-${folderId}`;
        localStorage.removeItem(key);
        
        markAsChanged();
        return true;
    }
    
    static getTypeDisplayName(type) {
        return this.typeDisplayNames[type] || type;
    }
}

// ===== 導航狀態管理器 =====
class NavigationManager {
    // 進入資料夾
    static enterFolder(type, folderId, folderName) {
        currentFolderId = folderId;
        folderBreadcrumbs = [
            FolderManager.getTypeDisplayName(type), 
            folderName
        ];
        
        // 即時更新麵包屑（輕量實現）
        this.updateBreadcrumbOnly();
        
        // 重新渲染當前頁面（只顯示資料夾內項目）
        this.refreshCurrentPage();
    }

    static updateBreadcrumbOnly() {
        const breadcrumbContainer = document.querySelector('.breadcrumb-nav')?.parentElement;
        if (breadcrumbContainer) {
            const newBreadcrumbHtml = OverviewManager.renderBreadcrumbNav();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newBreadcrumbHtml;
            const newContainer = tempDiv.firstElementChild;
            if (newContainer) {
                breadcrumbContainer.replaceWith(newContainer);
            }
        }
        // 同時更新手機版麵包屑（如果存在的話）
        if (typeof updateMobileBreadcrumb === 'function') {
            updateMobileBreadcrumb();
        }
    }
    
    // 退出資料夾回到根目錄
    static exitFolder() {
        currentFolderId = null;
        folderBreadcrumbs = [];
        this.updateBreadcrumbOnly();
        this.refreshCurrentPage();
    }
    
    // 重新整理當前頁面
    static refreshCurrentPage() {
        if (currentFolderId) {
            const currentType = FolderMoveDialog.getCurrentPageType(); // 直接用現有的！
            const folderExists = FolderManager.getFoldersByType(currentType)
                .some(folder => folder.id === currentFolderId);
            
            if (!folderExists) {
                // 資料夾不屬於當前類型，自動重置到根目錄
                currentFolderId = null;
                folderBreadcrumbs = [];
            }
        }
        
        // 重置分頁和快取
        if (typeof OverviewManager !== 'undefined') {
            OverviewManager.invalidateCache();
        }
        
        // 根據當前模式重新渲染
        if (isHomePage) {
            OverviewManager.renderCharacters();
        } else if (isListPage) {
            OverviewManager.renderItems(listPageType, `${listPageType}-list`);
        } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderUserPersonaCards();
        } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderLoveyDoveyCards();
        }
    }
    
    // 取得當前麵包屑路徑
    static getBreadcrumbs() {
        return folderBreadcrumbs;
    }
    
    // 檢查是否在資料夾內
    static isInFolder() {
        return currentFolderId !== null;
    }
    
    // 取得當前資料夾ID
    static getCurrentFolderId() {
        return currentFolderId;
    }
}

// ===== 資料夾移動對話框 =====
class FolderMoveDialog {
    static show() {
        if (selectedItems.length === 0) {
            alert(t('pleaseSelectItemsFirst'));
            return;
        }
        
        // 取得當前頁面類型
        const currentType = this.getCurrentPageType();
        const existingFolders = FolderManager.getFoldersByType(currentType);
        
        // 創建對話框
        this.createDialog(currentType, existingFolders);
    }
    
    static getCurrentPageType() {
        if (isHomePage) return 'character';
        if (isListPage) return listPageType;
        if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) return 'userpersona';
        if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) return 'loveydovey';
        return 'character'; // 預設
    }
    
    static createDialog(type, existingFolders) {
        // 使用 ModalManager 創建 compact-modal 樣式
        const content = `
            <div class="compact-modal-content" style="max-width: 500px;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${IconManager.arrowRight({width: 18, height: 18})}
                        <h3 class="compact-modal-title">${t('selectTargetFolder')}</h3>
                    </div>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <p class="compact-modal-desc" style="text-align: left;">
                    ${this.generateMoveDescription()}
                </p>

                <div class="compact-section" style="text-align: left; padding: 0;">
                    <!-- 新增資料夾選項 -->
                    <div class="folder-option" onclick="FolderMoveDialog.createNewFolder('${type}')" 
                        style="
                            padding: 12px;
                            border: 1px solid var(--border-color);
                            border-radius: 8px;
                            margin-bottom: 8px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        "
                        onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                        onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                        ${IconManager.plus({width: 16, height: 16})}
                        <span style="color: var(--accent-color); font-weight: 500;">${t('createNewFolder')}</span>
                    </div>
                    
                    <!-- 移動到根目錄選項 -->
                    <div class="folder-option" onclick="FolderMoveDialog.moveToRoot('${type}')" 
                        style="
                            padding: 12px;
                            border: 1px solid var(--border-color);
                            border-radius: 8px;
                            margin-bottom: 8px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        "
                        onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                        onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                        ${IconManager.home({width: 16, height: 16})}
                        <span style="color: var(--text-color);">${t('moveToRoot')}</span>
                    </div>
                    
                    <!-- 現有資料夾列表 -->
                    ${existingFolders.map(folder => `
                        <div class="folder-option" onclick="FolderMoveDialog.moveToFolder('${type}', '${folder.id}')" 
                            style="
                                padding: 12px;
                                border: 1px solid var(--border-color);
                                border-radius: 8px;
                                margin-bottom: 8px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                justify-content: space-between;
                            "
                            onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                            onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                ${IconManager.folder({width: 16, height: 16})}
                                <span style="color: var(--text-color);">${folder.name}</span>
                            </div>
                            <span style="color: var(--text-muted); font-size: 0.85em;">${folder.itemCount} ${t('items')}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="compact-modal-footer">
                    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">
                        ${t('cancel')}
                    </button>
                </div>
            </div>
        `;
        
        const modal = ModalManager.create({
            title: '',
            content: content,
            footer: '',
            maxWidth: '500px'
        });
    }

    static generateMoveDescription() {
        const isSelectingFolders = selectedItems.some(id => id.startsWith('folder-'));
        
        if (isSelectingFolders) {
            // 純資料夾選取
            const folderCount = selectedItems.filter(id => id.startsWith('folder-')).length;
            return t('moveSelectedFolders', folderCount);
        } else {
            // 純項目選取
            return t('moveSelectedItems', selectedItems.length);
        }
    }
    
    static createNewFolder(type) {
        const folderName = prompt(t('enterFolderName'));
        if (!folderName || !folderName.trim()) return;
        
        const folderId = FolderManager.createFolder(type, folderName.trim());
        this.moveToFolder(type, folderId);
    }
    
    static moveToRoot(type) {
        const isSelectingFolders = selectedItems[0]?.startsWith('folder-');
        
        if (isSelectingFolders) {
            let totalMovedItems = 0;
            selectedItems.forEach(selectedId => {
                const realFolderId = selectedId.replace('folder-', '');
                const folderItems = FolderManager.getFolderItems(type, realFolderId);
                const itemIds = folderItems.map(item => item.id);
                
                FolderManager.moveItemsToFolder(type, itemIds, null);
                totalMovedItems += itemIds.length;
            });
            this.onMoveComplete(type, t('folderContentsMovedToRootComplete'));
        } else {
            FolderManager.moveItemsToFolder(type, selectedItems, null);
            this.onMoveComplete(type, t('moveToRootComplete'));
        }
    }
    
static moveToFolder(type, folderId) {
    const isSelectingFolders = selectedItems[0]?.startsWith('folder-');
    
    if (isSelectingFolders) {
        let totalMovedItems = 0;
        selectedItems.forEach(selectedId => {
            const realFolderId = selectedId.replace('folder-', '');
            const folderItems = FolderManager.getFolderItems(type, realFolderId);
            const itemIds = folderItems.map(item => item.id);

            FolderManager.moveItemsToFolder(type, itemIds, folderId);
            totalMovedItems += itemIds.length;
        });
        
        const folderInfo = FolderManager.loadFolderInfo(type, folderId);
        const folderName = folderInfo?.name || t('folder');
        this.onMoveComplete(type, t('folderContentsMovedComplete', totalMovedItems, folderName));
    } else {
        // 選取的是一般項目：直接移動
        FolderManager.moveItemsToFolder(type, selectedItems, folderId);
        const folderInfo = FolderManager.loadFolderInfo(type, folderId);
        const folderName = folderInfo?.name || t('folder');
        this.onMoveComplete(type, t('moveToFolderComplete', folderName));
    }
}
    
    static onMoveComplete(type, message) {
        // 關閉對話框
        this.close();
        
        // 退出批量編輯模式
        batchEditMode = false;
        selectedItems = [];
        const batchBar = document.getElementById('batch-operations-bar');
        if (batchBar) {
            batchBar.style.display = 'none';
        }
        
        // 重新渲染頁面
        OverviewManager.onDataChange();
        
        // 儲存資料
        saveDataSilent();
        
        // 顯示成功訊息
        NotificationManager.success(message);
    }
    
    static close() {
        // 處理新的 ModalManager 創建的模態框
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
            return;
        }
        
        // 處理舊的模態框結構（向下兼容）
        const overlay = document.getElementById('folder-move-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// ===== 右鍵選單管理器 =====
class ContextMenuManager {
    static currentMenu = null;
    
    // 顯示資料夾右鍵選單
    static showFolderMenu(event, type, folderId, folderName) {
        if (batchEditMode || FavoriteManager.isInEditMode()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        
        // 移除現有選單
        this.removeMenu();
        
        // 創建選單
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            box-shadow: var(--shadow-medium);
            z-index: 10000;
            min-width: 140px;
            padding: 4px 0;
        `;
        
        menu.innerHTML = `
            <div class="context-menu-item" onclick="ContextMenuManager.renameFolder('${type}', '${folderId}', '${folderName}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.edit()} ${t('renameFolder')}
            </div>

            <div class="context-menu-item" onclick="ContextMenuManager.moveItem('${type}', 'folder-${folderId}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.arrowRight()} ${t('organise')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <div class="context-menu-item" onclick="ContextMenuManager.dissolveFolder('${type}', '${folderId}', '${folderName}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.folderOpen()} ${t('dissolveFolder')}
            </div>
            
            <div class="context-menu-item" onclick="ContextMenuManager.deleteFolder('${type}', '${folderId}', '${folderName}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--danger-color);
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.delete()} ${t('deleteFolder')}
            </div>
        `;
        
        // 計算選單位置
        const x = Math.min(event.clientX, window.innerWidth - 200);
        const y = Math.min(event.clientY, window.innerHeight - 150);
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        document.body.appendChild(menu);
        this.currentMenu = menu;
        
        // 點擊其他地方關閉選單
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick, true);
        }, 0);
    }

    static showItemMenu(event, type, itemId, itemName) {
        if (batchEditMode || FavoriteManager.isInEditMode()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        
        // 移除現有選單
        this.removeMenu();
        
        // 創建選單
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            box-shadow: var(--shadow-medium);
            z-index: 10000;
            min-width: 140px;
            padding: 4px 0;
        `;
        
        menu.innerHTML = `
            <div class="context-menu-item" onclick="ContextMenuManager.toggleFavorite('${type}', '${itemId}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.heart()} ${t('toggleFavorite')}
            </div>

            <div class="context-menu-item" onclick="ContextMenuManager.moveItem('${type}', '${itemId}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.arrowRight()} ${t('moveToFolder')}
            </div>
            
            <div class="context-menu-item" onclick="ContextMenuManager.copyItem('${type}', '${itemId}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.copy()} ${t('rightClickCopy')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <div class="context-menu-item" onclick="ContextMenuManager.deleteItem('${type}', '${itemId}', '${itemName}')"
                style="
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 0.85em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--danger-color);
                    transition: background 0.2s ease;
                "
                onmouseover="this.style.background='var(--bg-color)'"
                onmouseout="this.style.background='transparent'">
                ${IconManager.delete()} ${t('rightClickDelete')}
            </div>
        `;
        
        // 計算選單位置
        const x = Math.min(event.clientX, window.innerWidth - 200);
        const y = Math.min(event.clientY, window.innerHeight - 150);
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        document.body.appendChild(menu);
        this.currentMenu = menu;
        
        // 點擊其他地方關閉選單
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick, true);
        }, 0);
    }

    // 移動項目
    static moveItem(type, itemId) {
        this.removeMenu();
        
        // 設定選中項目並顯示移動對話框
        selectedItems = [itemId];
        FolderMoveDialog.show();
    }

    // 切換最愛狀態
    static toggleFavorite(type, itemId) {
        this.removeMenu();
        FavoriteManager.toggleItemFavorite(type, itemId);
        
        // 立即重新渲染當前頁面以顯示變更
        if (isHomePage) {
            OverviewManager.renderCharacters();
        } else if (isListPage) {
            OverviewManager.renderItems(listPageType, `${listPageType}-list`);
        } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderUserPersonaCards();
        } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderLoveyDoveyCards();
        }
        
        // 同時更新側邊欄顯示
        if (typeof renderSidebar === 'function') {
            renderSidebar();
        }
    }

    // 複製項目  
    static copyItem(type, itemId) {
        this.removeMenu();
        ItemCRUD.copy(type, itemId);
    }

    // 刪除項目
    static deleteItem(type, itemId, itemName) {
        this.removeMenu();
        ItemCRUD.remove(type, itemId);
    }
    
    // 重新命名資料夾
    static renameFolder(type, folderId, currentName) {
        this.removeMenu();
        
        const newName = prompt(t('enterNewFolderName'), currentName);
        if (!newName || !newName.trim() || newName.trim() === currentName) return;
        
        const success = FolderManager.renameFolder(type, folderId, newName.trim());
        if (success) {
            // 重新渲染頁面
            OverviewManager.onDataChange();
            saveDataSilent();
            NotificationManager.success(t('folderRenamedSuccess'));
        } else {
            alert(t('folderRenameError'));
        }
    }
    
    // 解散資料夾
    static dissolveFolder(type, folderId, folderName) {
        this.removeMenu();
        
        const itemCount = FolderManager.getFolderItems(type, folderId).length;
        const confirmMessage = t('dissolveFolderConfirm', folderName, itemCount);
        
        if (confirm(confirmMessage)) {
            const success = FolderManager.dissolveFolder(type, folderId);
            if (success) {
                // 如果當前在該資料夾內，返回根目錄
                if (NavigationManager.getCurrentFolderId() === folderId) {
                    NavigationManager.exitFolder();
                } else {
                    OverviewManager.onDataChange();
                }
                saveDataSilent();
                NotificationManager.success(t('folderDissolvedSuccess'));
            } else {
                alert(t('folderDissolveError'));
            }
        }
    }
    
    // 刪除資料夾
    static deleteFolder(type, folderId, folderName) {
        this.removeMenu();
        
        const itemCount = FolderManager.getFolderItems(type, folderId).length;
        const confirmMessage = t('deleteFolderConfirm', folderName, itemCount);
        
        if (confirm(confirmMessage)) {
            const doubleConfirm = confirm(t('deleteFolderDoubleConfirm'));
            if (doubleConfirm) {
                const success = FolderManager.deleteFolder(type, folderId);
                if (success) {
                    // 如果當前在該資料夾內，返回根目錄
                    if (NavigationManager.getCurrentFolderId() === folderId) {
                        NavigationManager.exitFolder();
                    } else {
                        OverviewManager.onDataChange();
                    }
                    saveDataSilent();
                    NotificationManager.success(t('folderDeletedSuccess'));
                } else {
                    alert(t('folderDeleteError'));
                }
            }
        }
    }
    
    // 處理外部點擊
    static handleOutsideClick = (event) => {
        if (this.currentMenu && !this.currentMenu.contains(event.target)) {
            this.removeMenu();
        }
    }
    
    // 移除選單
    static removeMenu() {
        if (this.currentMenu) {
            this.currentMenu.remove();
            this.currentMenu = null;
        }
        document.removeEventListener('click', this.handleOutsideClick, true);
    }
}

function dissolveFoldersOnly() {
    if (selectedItems.length === 0) return;
    
    const confirmMessage = t('dissolveFoldersConfirm', selectedItems.length);
    if (!confirm(confirmMessage)) return;
    
    const currentType = isHomePage ? 'character' : 
                       isListPage ? listPageType :
                       currentMode === 'userpersona' ? 'userpersona' :
                       currentMode === 'loveydovey' ? 'loveydovey' : 'character';
    
    selectedItems.forEach(selectedId => {
        const realFolderId = selectedId.replace('folder-', '');
        FolderManager.dissolveFolder(currentType, realFolderId);
    });
    
    selectedItems = [];
    batchEditMode = false;
    
    const batchBar = document.getElementById('batch-operations-bar');
    if (batchBar) {
        batchBar.style.display = 'none';
    }
    
    OverviewManager.onDataChange();
    saveDataSilent();
    
    NotificationManager.success(t('foldersDissolvedSuccess'));
}

function selectAllFolders() {
    // 獲取當前頁面類型
    const currentType = isHomePage ? 'character' : 
                       isListPage ? listPageType :
                       currentMode === 'userpersona' ? 'userpersona' :
                       currentMode === 'loveydovey' ? 'loveydovey' : 'character';
    
    // 只在根目錄才有資料夾可選
    if (NavigationManager.getCurrentFolderId()) {
        alert(t('noFoldersInSubfolder'));
        return;
    }
    
    // 獲取所有資料夾ID
    const folders = FolderManager.getFoldersByType(currentType);
    const folderIds = folders.map(folder => `folder-${folder.id}`);
    
    if (folderIds.length === 0) {
        alert(t('noFoldersToSelect'));
        return;
    }
    
    // 🆕 清空之前的選擇（確保互斥）
    if (selectedItems.length > 0) {
        // 清除之前選中項目的視覺狀態
        selectedItems.forEach(itemId => {
            if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
                // 卡片模式
                clearCardVisualState(itemId);
            } else if (isListPage) {
                // 列表模式
                clearListItemVisualState(itemId);
            }
        });
    }
    
    selectedItems = folderIds;
    updateSelectedCount();
    
    // 更新視覺狀態
    folderIds.forEach(folderId => {
        if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
            // 卡片模式
            updateCardVisualState(folderId);
        } else if (isListPage) {
            // 列表模式
            updateListItemVisualState(folderId);
        }
    });
}

function createNewFolderInBatch() {
    const folderName = prompt(t('enterFolderName'));
    if (!folderName || !folderName.trim()) return;
    
    const currentType = isHomePage ? 'character' : 
                       isListPage ? listPageType :
                       currentMode === 'userpersona' ? 'userpersona' :
                       currentMode === 'loveydovey' ? 'loveydovey' : 'character';
    
    const folderId = FolderManager.createFolder(currentType, folderName.trim());
    
    // 重新渲染頁面以顯示新資料夾
    OverviewManager.onDataChange();
    saveDataSilent();
    
    NotificationManager.success(t('folderCreatedSuccess', folderName.trim()));
}

function updateSelectAllButtonText() {
    const selectAllTextElement = document.getElementById('select-all-text');
    if (!selectAllTextElement) return;
    
    // 根據當前頁面類型動態設置文字
    let buttonText = t('selectAll');
    
    if (isHomePage || (currentMode === 'character' && !ItemManager.getCurrentItemId())) {
        buttonText = t('selectAllCharacters');
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        buttonText = t('selectAllCharacters'); // 玩家角色也用角色
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        buttonText = t('selectAllCharacters'); // 卿卿我我也用角色
    } else if (isListPage) {
        if (listPageType === 'worldbook') {
            buttonText = t('selectAllWorldBooks');
        } else if (listPageType === 'custom') {
            buttonText = t('selectAllNotebooks');
        }
    }
    
    selectAllTextElement.textContent = buttonText;
}

function updateBatchButtonStates() {
    const analysis = OverviewManager.analyzeSelection();
    const newFolderBtn = document.querySelector('button[onclick="createNewFolderInBatch()"]');
    if (newFolderBtn) {
        if (selectedItems.length > 0) {
            // 有選取項目時禁用
            newFolderBtn.disabled = true;
            newFolderBtn.style.opacity = '0.5';
            newFolderBtn.style.cursor = 'not-allowed';
            newFolderBtn.title = t('deselectToCreateFolder'); // 需要新增翻譯
        } else {
            // 沒有選取項目時啟用
            newFolderBtn.disabled = false;
            newFolderBtn.style.opacity = '1';
            newFolderBtn.style.cursor = 'pointer';
            newFolderBtn.title = t('newFolder');
        }
    }
    
    // 解散資料夾按鈕狀態
    const dissolveFoldersBtn = document.getElementById('dissolve-folders-btn');
    if (dissolveFoldersBtn) {
        if (analysis.hasFolders && !analysis.hasItems) {
            // 只選中資料夾時啟用
            dissolveFoldersBtn.disabled = false;
            dissolveFoldersBtn.style.opacity = '1';
            dissolveFoldersBtn.style.cursor = 'pointer';
        } else {
            // 其他情況變灰
            dissolveFoldersBtn.disabled = true;
            dissolveFoldersBtn.style.opacity = '0.5';
            dissolveFoldersBtn.style.cursor = 'not-allowed';
        }
    }
    
    // 移動按鈕 - 有選中項目時才能用
    const moveBtn = document.querySelector('button[onclick="FolderMoveDialog.show()"]');
    if (moveBtn) {
        if (selectedItems.length > 0) {
            moveBtn.disabled = false;
            moveBtn.style.opacity = '1';
        } else {
            moveBtn.disabled = true;
            moveBtn.style.opacity = '0.5';
        }
    }
    
    // 刪除按鈕文字動態更新
    const deleteButtonText = document.getElementById('delete-button-text');
    if (deleteButtonText) {
        if (analysis.hasFolders && !analysis.hasItems) {
            deleteButtonText.textContent = t('deleteFolders');
        } else {
            deleteButtonText.textContent = t('deleteSelected');
        }
    }
}