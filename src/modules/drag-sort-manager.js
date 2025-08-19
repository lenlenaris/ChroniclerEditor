// ===== 基於 SortableJS 的超流暢拖曳排序系統 =====
class DragSortManager {
    static sortableInstances = new Map();
    
    // 🚀 為容器啟用拖曳排序功能
    static enableDragSort(config) {
        const {
            containerSelector,   // 容器選擇器
            itemSelector,       // 項目選擇器
            type,              // 類型：'character', 'worldbook', 'custom'
            mode = 'grid',     // 模式：'grid', 'list'
            onReorder = null   // 重新排序回調函數
        } = config;

        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`拖曳排序：找不到容器 ${containerSelector}`);
            return;
        }

        // 如果已經有 Sortable 實例，先銷毀
        const existingInstance = this.sortableInstances.get(containerSelector);
        if (existingInstance) {
            existingInstance.destroy();
        }

        // 🎯 創建 SortableJS 實例
        const sortable = new Sortable(container, {
            // 基本配置
            group: `${type}-sort`,
            animation: 150,           // 🔧 減少動畫時間到 150ms
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",  // 🔧 更快的緩動函數
            
            // 拖曳配置
            draggable: itemSelector,  // 可拖曳的元素選擇器
            handle: itemSelector,     // 拖曳手柄（整個項目都可拖曳）
            
            // 視覺效果
            ghostClass: 'sortable-ghost',     // 佔位符樣式類
            chosenClass: 'sortable-chosen',   // 選中時的樣式類
            dragClass: 'sortable-drag',       // 拖曳時的樣式類
            
            // 🚫 排除創建角色卡片
            filter: (evt, item, container) => {
                return item.getAttribute('onclick')?.includes('addCharacterFromHome');
            },
            
            //  防止與檔案拖曳衝突
            preventOnFilter: false,  // 允許被過濾的元素正常處理事件
            
            //  重要：不要攔截外部檔案拖曳
            dragoverBubble: true,   // 允許 dragover 事件冒泡
            dropBubble: true,       // 允許 drop 事件冒泡
            
            // 🎯 拖曳開始事件
            onStart: (evt) => {
                //  如果是批量編輯模式，禁止拖曳
                if (batchEditMode) {
                    
                    return false;
                }
                
                
                document.body.classList.add('dragging-active');
                container.classList.add('drag-in-progress');
                
                //  標記當前是元素拖曳，不是檔案拖曳
                document.body.setAttribute('data-sortable-dragging', 'true');
            },
            
            // 🎯 拖曳結束事件
            onEnd: (evt) => {
                
                document.body.classList.remove('dragging-active');
                container.classList.remove('drag-in-progress');
                
                // 清除元素拖曳標記
                document.body.removeAttribute('data-sortable-dragging');
                
                // 如果位置有變化，處理排序
                if (evt.oldIndex !== evt.newIndex) {
                    this.handleReorder(type, container, itemSelector, evt, onReorder);
                }
            },
            
            // 🎯 拖曳移動事件（可選）
            onMove: (evt) => {
                //  如果正在進行檔案拖曳，不允許 Sortable 操作
                if (document.body.hasAttribute('data-file-dragging')) {
                    return false;
                }
                
                // 阻止拖曳到創建角色卡片上
                if (evt.related?.getAttribute('onclick')?.includes('addCharacterFromHome')) {
                    return false;
                }
                return true;
            },
            
            // 添加選擇過濾器，避免檔案拖曳時觸發
            onChoose: (evt) => {
                // 如果正在進行檔案拖曳，取消選擇
                if (document.body.hasAttribute('data-file-dragging')) {
                    return false;
                }
            }
        });

        // 保存實例引用
        this.sortableInstances.set(containerSelector, sortable);
        
        
        return sortable;
    }

    // 處理重新排序
static handleReorder(type, container, itemSelector, evt, onReorder) {
    // 🚀 立即處理數據更新，不等待動畫
    const items = Array.from(container.querySelectorAll(itemSelector))
        .filter(el => !el.getAttribute('onclick')?.includes('addCharacterFromHome'));
    
    const newOrder = items.map(item => this.extractItemData(item, type));
    
    // 🚀 立即應用新排序到數據
    this.applyNewOrder(type, newOrder);
    
    // 🚀 立即切換到自定義排序模式（無延遲）
    if (type === 'character' || type === 'userpersona') {  //  添加玩家角色支援
        OverviewManager.currentSort = 'custom';
        OverviewManager.saveSortPreference('custom');
        
        // 立即更新下拉選單顯示
        const dropdown = document.querySelector('.sort-dropdown');
        if (dropdown) dropdown.value = 'custom';
        
        //  立即同步側邊欄排序（支援所有類型）
        this.syncSidebarOrder(type);
    }
    
    // 🚀 使用 requestAnimationFrame 優化重新渲染時機
    if (onReorder) {
        // 延遲到下一幀，讓 SortableJS 的動畫先完成
        requestAnimationFrame(() => {
            onReorder(newOrder, evt.oldIndex, evt.newIndex);
        });
    }
    
    
}

    //  同步側邊欄排序（支援所有類型）
static syncSidebarOrder(type = 'character') {
    const containerMap = {
        'character': 'sidebarContent',
        'userpersona': 'userPersonaContent',
        'worldbook': 'worldBookContent', 
        'custom': 'customSectionContent'
    };
    
    const dataMap = {
        'character': characters,
        'userpersona': userPersonas, 
        'worldbook': worldBooks,
        'custom': customSections
    };
    
    const containerId = containerMap[type];
    const dataArray = dataMap[type];
    
    const sidebarContainer = document.getElementById(containerId);
    if (!sidebarContainer || !dataArray) return;

    
    // 獲取當前側邊欄中的項目
    const sidebarItems = Array.from(sidebarContainer.querySelectorAll('.character-item'));
    
    // 根據新的順序重新排列側邊欄項目
    dataArray.forEach((item, index) => {
        const sidebarItem = sidebarItems.find(sidebarItem => {
            const toggleClick = sidebarItem.querySelector('.character-header')?.getAttribute('onclick');
            return toggleClick?.includes(`'${item.id}'`);
        });
        
        if (sidebarItem) {
            // 將項目移動到正確位置
            sidebarContainer.appendChild(sidebarItem);
        }
    });
}

// 💾 保存版本排序偏好
static saveVersionOrder(type, itemId, orderedVersionIds) {
    const key = `characterCreator-versionOrder-${type}-${itemId}`;
    localStorage.setItem(key, JSON.stringify(orderedVersionIds));
    
}

// 📖 載入版本排序偏好
static loadVersionOrder(type, itemId) {
    const key = `characterCreator-versionOrder-${type}-${itemId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

// 🎯 應用版本排序到數據
static applyVersionOrder(type, itemId, orderedVersionIds) {
    const itemsArray = ItemManager.getItemsArray(type);
    const item = itemsArray.find(i => i.id === itemId);
    
    if (!item || !orderedVersionIds || orderedVersionIds.length === 0) return;
    
    const reorderedVersions = [];
    
    // 按照新順序添加版本
    orderedVersionIds.forEach(versionId => {
        const version = item.versions.find(v => v.id === versionId);
        if (version) {
            reorderedVersions.push(version);
        }
    });
    
    // 添加不在排序列表中的新版本
    item.versions.forEach(version => {
        if (!orderedVersionIds.includes(version.id)) {
            reorderedVersions.push(version);
        }
    });
    
    // 更新版本陣列
    item.versions = reorderedVersions;
    
}

// 🎯 啟用版本拖曳排序
static enableVersionDragSort(type, itemId) {
    const containerSelector = `#${type}-versions-${itemId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) {
        return;
    }
    
    // 銷毀現有實例
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }
    
    // 創建版本排序實例
    const sortable = new Sortable(container, {
        group: `${type}-version-sort-${itemId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.version-item',
        handle: '.version-item',
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        onStart: (evt) => {
            document.body.classList.add('dragging-active');
        },
        
        onEnd: (evt) => {
            document.body.classList.remove('dragging-active');
            
            if (evt.oldIndex !== evt.newIndex) {
                this.handleVersionReorder(type, itemId, container, evt);
            }
        }
    });
    
    this.sortableInstances.set(containerSelector, sortable);
    return sortable;
}

// 🔄 處理版本重新排序（優化版，減少閃爍）
static handleVersionReorder(type, itemId, container, evt) {
    const versionItems = Array.from(container.querySelectorAll('.version-item'));
    const newVersionOrder = [];
    
    versionItems.forEach(item => {
        const onClick = item.getAttribute('onclick');
        if (onClick) {
            // 提取版本ID
            const match = onClick.match(/selectSidebarItem\([^,]+,\s*'[^']+',\s*'([^']+)'\)/);
            if (match) {
                newVersionOrder.push(match[1]);
            }
        }
    });
    
    
    
    // 立即應用新排序
    this.applyVersionOrder(type, itemId, newVersionOrder);
    
    // 儲存排序偏好
    this.saveVersionOrder(type, itemId, newVersionOrder);
    
    // 標記數據已更改
    markAsChanged();
    
    //  平滑更新：只更新其他相同類型的側邊欄項目，不完整重新渲染
    this.updateOtherSidebarItems(type, itemId, newVersionOrder);
}

//  新增：平滑更新其他側邊欄項目
static updateOtherSidebarItems(type, currentItemId, newVersionOrder) {
    const items = DataOperations.getItems(type);
    const updatedItem = items.find(item => item.id === currentItemId);
    
    if (!updatedItem) return;
    
    // 找到同類型的其他項目，如果它們也展開了，需要重新排序其版本顯示
    items.forEach(item => {
        if (item.id !== currentItemId) {
            const versionsList = document.getElementById(`${type}-versions-${item.id}`);
            if (versionsList && versionsList.classList.contains('expanded')) {
                // 只重新渲染這個特定項目的版本列表
                this.updateSingleItemVersions(type, item);
            }
        }
    });
    
    //  如果當前在編輯模式，需要更新主內容區的版本選擇器
    if (currentMode === type && ItemManager.getCurrentItemId() === currentItemId) {
        // 平滑更新版本選擇器或其他相關 UI，但不重新渲染整個內容
        this.updateVersionUI(type, currentItemId);
    }
}

//  新增：更新單個項目的版本列表
static updateSingleItemVersions(type, item) {
    const versionsList = document.getElementById(`${type}-versions-${item.id}`);
    if (!versionsList) return;
    
    // 重新生成版本項目 HTML
    const currentItemId = ItemManager.getCurrentItemId();
    const currentVersionId = ItemManager.getCurrentVersionId();
    
    const versionsHTML = item.versions.map(version => 
        renderSidebarVersion(item, version, type, currentVersionId)
    ).join('');
    
    // 平滑替換內容
    versionsList.style.opacity = '0.7';
    setTimeout(() => {
        versionsList.innerHTML = versionsHTML;
        versionsList.style.opacity = '1';
        
        // 重新啟用拖曳排序
        this.enableVersionDragSort(type, item.id);
    }, 100);
}

//  新增：更新版本相關 UI（如果需要）
static updateVersionUI(type, itemId) {
    // 這裡可以更新版本選擇器、統計信息等，但避免完整重新渲染
    // 目前先留空，除非發現特定需要更新的 UI 元素
    
}

    // 🔍 提取項目數據
static extractItemData(item, type) {
    switch (type) {
        case 'character':
            const characterOnClick = item.getAttribute('onclick');
            if (characterOnClick && characterOnClick.includes('selectCharacterFromHome')) {
                const match = characterOnClick.match(/'([^']+)'/);
                return { id: match ? match[1] : null, element: item };
            }
            break;
            
        case 'userpersona':
            const userPersonaOnClick = item.getAttribute('onclick');
            if (userPersonaOnClick && userPersonaOnClick.includes('selectItem(\'userpersona\'')) {
                const match = userPersonaOnClick.match(/selectItem\('userpersona',\s*'([^']+)'/);
                return { id: match ? match[1] : null, element: item };
            }
            break;

        case 'loveydovey':
            const loveyDoveyOnClick = item.getAttribute('onclick');
            if (loveyDoveyOnClick && loveyDoveyOnClick.includes('selectItem(\'loveydovey\'')) {
                const match = loveyDoveyOnClick.match(/selectItem\('loveydovey',\s*'([^']+)'/);
                return { id: match ? match[1] : null, element: item };
            }
            break;
            
        case 'worldbook':
        case 'custom':
            const onClickAttr = item.getAttribute('onclick');
            if (onClickAttr) {
                //  支援列表頁面的 selectItem 調用
                if (onClickAttr.includes('selectItem')) {
                    const match = onClickAttr.match(/selectItem\([^,]+,\s*'([^']+)'/);
                    return { id: match ? match[1] : null, element: item };
                }
                // 支援側邊欄的 toggleItemVersions 調用
                else if (onClickAttr.includes('toggleItemVersions')) {
                    const match = onClickAttr.match(/'([^']+)'/);
                    return { id: match ? match[1] : null, element: item };
                }
            }
            break;
            
        case 'worldbook-entry':
            // 世界書條目：從 data-entry-id 屬性提取 ID
            const entryId = item.getAttribute('data-entry-id');
            return { id: entryId, element: item };
    }
    
    return { id: null, element: item };
}

    //  啟用附加資訊拖曳排序
static enableAdditionalInfoDragSort(characterId, versionId) {
    const containerSelector = `#additional-info-list-${versionId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) {
    // 靜默處理 - 某些角色沒有附加資訊是正常的
    if (containerSelector.includes('additional-info-list')) {
        return;
    }
    console.warn(`找不到容器: ${containerSelector}`);
    return;
}
    
    // 銷毀現有實例
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }

    let savedStates = {};
    
    // 創建附加資訊排序實例
    const sortable = new Sortable(container, {
        group: `additional-info-sort-${characterId}-${versionId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.additional-info-item',
        handle: '.drag-handle',  // 只能通過拖曳控制柄來拖曳
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        onStart: (evt) => {
            
            document.body.classList.add('dragging-active');
            container.classList.add('drag-in-progress');
            //  保存當前折疊狀態
            savedStates = getCurrentAdditionalInfoCollapseStates();
            
        },
        
        onEnd: (evt) => {
        
        document.body.classList.remove('dragging-active');
        container.classList.remove('drag-in-progress');
        
        if (evt.oldIndex !== evt.newIndex) {
            this.handleAdditionalInfoReorder(characterId, versionId, evt.oldIndex, evt.newIndex);
            
            //  恢復折疊狀態
            setTimeout(() => {
                restoreAdditionalInfoCollapseStates(savedStates);
                
            }, 10);
        }
    }
});
    
    this.sortableInstances.set(containerSelector, sortable);
    
    
    return sortable;
}

// 🔄 處理附加資訊重新排序
static handleAdditionalInfoReorder(characterId, versionId, oldIndex, newIndex) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.additionalInfo) return;
    
    
    
    // 重新排序陣列
    const additionalInfo = version.additionalInfo;
    const [movedItem] = additionalInfo.splice(oldIndex, 1);
    additionalInfo.splice(newIndex, 0, movedItem);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    // 更新編號，不重新渲染整個容器
    updateAdditionalInfoNumbers(version, versionId);
    
    
}

    // 💾 應用新排序到數據
static applyNewOrder(type, newOrder) {
    const itemIds = newOrder.map(item => item.id).filter(id => id);
    
    switch (type) {
        case 'character':
            this.reorderArray(characters, itemIds);
            break;
        case 'userpersona':
            this.reorderArray(userPersonas, itemIds);
            break;
        case 'worldbook':
            this.reorderArray(worldBooks, itemIds);
            break;
        case 'custom':
            this.reorderArray(customSections, itemIds);
            break;
        case 'loveydovey':
            this.reorderArray(loveyDoveyCharacters, itemIds);
            break;
    }

    // 保存自定義排序偏好
    this.saveCustomOrder(type, itemIds);
    
    // 標記數據已更改
    markAsChanged();
}

    // 🔄 重新排序陣列
    static reorderArray(sourceArray, orderedIds) {
        const reorderedArray = [];
        
        // 按照新順序添加項目
        orderedIds.forEach(id => {
            const item = sourceArray.find(item => item.id === id);
            if (item) {
                reorderedArray.push(item);
            }
        });

        // 添加不在排序列表中的項目（新項目）
        sourceArray.forEach(item => {
            if (!orderedIds.includes(item.id)) {
                reorderedArray.push(item);
            }
        });

        // 清空原陣列並填入重新排序的項目
        sourceArray.length = 0;
        sourceArray.push(...reorderedArray);
    }

    // 💾 保存自定義排序偏好
    static saveCustomOrder(type, orderedIds) {
        const key = `characterCreator-customOrder-${type}`;
        localStorage.setItem(key, JSON.stringify(orderedIds));
    }

    // 📖 載入自定義排序偏好
    static loadCustomOrder(type) {
        const key = `characterCreator-customOrder-${type}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    }

    // 🎯 應用保存的排序（在數據載入後調用）
static applySavedOrder(type) {
    const savedOrder = this.loadCustomOrder(type);
    if (savedOrder && savedOrder.length > 0) {
        switch (type) {
            case 'character':
                this.reorderArray(characters, savedOrder);
                break;
            case 'userpersona':
                this.reorderArray(userPersonas, savedOrder);
                break;
            case 'worldbook':
                this.reorderArray(worldBooks, savedOrder);
                break;
            case 'custom':
                this.reorderArray(customSections, savedOrder);
                break;
        }
    }
}

    // 清除自定義排序
    static clearCustomOrder(type) {
        const key = `characterCreator-customOrder-${type}`;
        localStorage.removeItem(key);
    }

    // 🎯 銷毀特定容器的 Sortable 實例
    static destroySortable(containerSelector) {
        const instance = this.sortableInstances.get(containerSelector);
        if (instance) {
            instance.destroy();
            this.sortableInstances.delete(containerSelector);
        }
    }

    // 🎯 銷毀所有 Sortable 實例
    static destroyAll() {
        this.sortableInstances.forEach((instance, selector) => {
            instance.destroy();
        });
        this.sortableInstances.clear();
    }

    // 🚀 初始化所有拖曳排序功能
    static initializeAll() {
        // 先銷毀所有現有實例
        this.destroyAll();
        
        // 延遲啟用拖曳功能，確保 DOM 已渲染
        setTimeout(() => {
            // 首頁角色卡拖曳
            if (document.querySelector('#character-grid')) {
                this.enableDragSort({
                    containerSelector: '#character-grid',
                    itemSelector: '.home-card',
                    type: 'character',
                    mode: 'grid',
                    onReorder: (newOrder, oldIndex, newIndex) => {
                        
                        
                        // 🚀 只重新渲染首頁，側邊欄已在 handleReorder 中同步
                        OverviewManager.renderCharacters();
                    }
                });
            }

            // 側邊欄角色列表拖曳
            if (document.querySelector('#sidebarContent')) {
                this.enableDragSort({
                    containerSelector: '#sidebarContent',
                    itemSelector: '.character-item',
                    type: 'character',
                    mode: 'list',
                    onReorder: () => {
                        // 🚀 只重新渲染首頁，側邊欄已在 handleReorder 中同步
                        OverviewManager.renderCharacters();
                    }
                });
            }

           // 世界書列表拖曳（側邊欄）
if (document.querySelector('#worldBookContent')) {
    this.enableDragSort({
        containerSelector: '#worldBookContent',
        itemSelector: '.character-item',
        type: 'worldbook',
        mode: 'list'
    });
}

            // 自定義筆記列表拖曳
            if (document.querySelector('#customSectionContent')) {
                this.enableDragSort({
                    containerSelector: '#customSectionContent',
                    itemSelector: '.character-item',
                    type: 'custom',
                    mode: 'list'
                });
            }
        }, 200);
    }

    //  專門為列表頁面初始化拖曳功能
static initializeListPageDragSort(pageType) {
    
    
    if (pageType === 'worldbook') {
        const container = document.querySelector('#worldbook-list');
        
        
        if (container) {
            const items = container.querySelectorAll('.list-item:not(.add-item-card)');
            
            
            this.enableDragSort({
                containerSelector: '#worldbook-list',
                itemSelector: '.list-item:not(.add-item-card)',
                type: 'worldbook',
                mode: 'list',
                onReorder: () => {
    
    OverviewManager.enableCustomSort();
    const dropdown = document.querySelector('.sort-dropdown');
    if (dropdown) dropdown.value = 'custom';
    
    //  重新渲染列表和側邊欄
    OverviewManager.renderItems('worldbook', 'worldbook-list');
    renderSidebar(); // 同步更新側邊欄
}
            });
        }
    } else if (pageType === 'custom') {
        const container = document.querySelector('#custom-list');
        
        
        if (container) {
            const items = container.querySelectorAll('.list-item:not(.add-item-card)');
            
            
            this.enableDragSort({
                containerSelector: '#custom-list',
                itemSelector: '.list-item:not(.add-item-card)',
                type: 'custom',
                mode: 'list',
                onReorder: () => {
    
    OverviewManager.enableCustomSort();
    const dropdown = document.querySelector('.sort-dropdown');
    if (dropdown) dropdown.value = 'custom';
    OverviewManager.renderItems('custom', 'custom-list');
    renderSidebar(); // 同步更新側邊欄
}
            });
        }
    }
}
    
    //  檢測是否為檔案拖曳（避免與元素拖曳衝突）
    static isFileDrag(e) {
        //  如果正在進行 Sortable 拖曳，不處理檔案拖曳
        if (document.body.hasAttribute('data-sortable-dragging')) {
            return false;
        }
        
        // 檢查 dataTransfer 中是否包含檔案
        if (e.dataTransfer && e.dataTransfer.types) {
            return e.dataTransfer.types.includes('Files');
        }
        return false;
    }

    //  自動檢測並初始化所有附加資訊的拖曳排序
static autoInitializeAdditionalInfoDragSort() {
    
    
    // 查找所有附加資訊容器
    const containers = document.querySelectorAll('[id*="additional-info-list-"]');
    
    
    containers.forEach(container => {
        const versionId = container.id.replace('additional-info-list-', '');
        
        
        // 嘗試從 DOM 中獲取 characterId
        let characterId = null;
        
        // 方法1：從全域變數獲取
        if (typeof currentLoveyDoveyId !== 'undefined') {
            characterId = currentLoveyDoveyId;
        }
        
        // 方法2：從 loveydovey 資料中查找
        if (!characterId && typeof loveyDoveyCharacters !== 'undefined') {
            const character = loveyDoveyCharacters.find(c => c.versions.some(v => v.id === versionId));
            if (character) {
                characterId = character.id;
            }
        }
        
        // 方法3：從 URL 或其他地方獲取
        if (!characterId) {
            // 嘗試從頁面中的其他元素獲取
            const characterElement = document.querySelector(`[data-character-id]`);
            characterId = characterElement?.getAttribute('data-character-id');
        }
        
        if (characterId) {
            
            this.enableAdditionalInfoDragSort(characterId, versionId);
        } else {
            console.warn(`⚠️ 無法獲取 characterId，versionId: ${versionId}`);
        }
    });
}
    
    //  初始化拖曳匯入功能（首頁專用）
    static initializeDragImport() {
        let dragCounter = 0;
        
        //  先移除現有的事件監聽器（如果有的話）
        document.removeEventListener('dragenter', this.fileDropHandler);
        document.removeEventListener('dragover', this.fileDropHandler);
        document.removeEventListener('dragleave', this.fileDropHandler);
        document.removeEventListener('drop', this.fileDropHandler);
        
        // 拖曳覆蓋層
        function createDragOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'drag-overlay';
            
            // 獲取主內容區域的位置（避開側邊欄）
            const contentArea = document.getElementById('contentArea');
            let leftOffset = 0;
            let width = '100%';
            
            if (contentArea) {
                const contentRect = contentArea.getBoundingClientRect();
                leftOffset = contentRect.left;
                width = `${contentRect.width}px`;
            } else {
                // 備援方案：計算側邊欄寬度
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    const sidebarRect = sidebar.getBoundingClientRect();
                    leftOffset = sidebarRect.width;
                    width = `calc(100% - ${leftOffset}px)`;
                }
            }
            
            overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: ${leftOffset}px;
            width: ${width};
            height: 100%;
            background: rgba(92, 193, 255, 0.3);
            color: #66b3ff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-size: 1.5em;
            font-weight: 600;
            backdrop-filter: blur(5px);
            border: 2px dashed #66b3ff;
            box-sizing: border-box;
            pointer-events: none;
        `;
            
            //  根據當前頁面類型調整提示文字
let title = '拖放檔案即可匯入角色';
let subtitle = '支援 JSON 和 PNG 格式';

if (isListPage && listPageType === 'worldbook') {
    title = '拖放檔案即可匯入世界書';
    subtitle = '支援 JSON 格式';
}

overlay.innerHTML = `
    <div style="text-align: center;">
        <div style="font-size: 3em; margin-bottom: 10px;">⇪</div>
        <div>${title}</div>
        <div style="font-size: 0.5em; margin-top: 12px; opacity: 0.9;">
            ${subtitle}
        </div>
    </div>
`;
            return overlay;
        }
        
        // 顯示拖拽提示
        function showDragOverlay() {
            if (!document.getElementById('drag-overlay')) {
                document.body.appendChild(createDragOverlay());
            }
        }
        
        // 隱藏拖拽提示
        function hideDragOverlay() {
            const overlay = document.getElementById('drag-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
        
        // 處理檔案匯入
async function handleFileImport(file) {
    if (!FileHandler.detectFileType(file)) { 
    NotificationManager.error('不支援的檔案格式！請使用 JSON 或 PNG 檔案。');
    return;
}
    
    try {
        //  根據當前頁面類型決定匯入類型
        let importType = 'character'; // 預設為角色
        
        if (isListPage && listPageType === 'worldbook') {
            importType = 'worldbook';
        } else if (isListPage && listPageType === 'custom') {
            importType = 'custom'; // 為筆記本預留
        }
        
        await ImportManager.handleImport(file, importType);
    } catch (error) {
        console.error('拖拽匯入失敗:', error);
        NotificationManager.error('匯入失敗：' + error.message);
    }
}

        const handleDragEnter = (e) => {
            //  支援首頁和世界書列表頁面（筆記列表暫不支援匯入）
if (!isHomePage && !(isListPage && listPageType === 'worldbook')) return;
            
            
            
            // 🔧 修復：只檢查 types，不檢查 files（在 dragenter 階段 files 始終為 0）
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                //  如果是檔案拖曳，立即標記以避免 SortableJS 干擾
                document.body.setAttribute('data-file-dragging', 'true');
                
                // 🔧 額外檢查：確保不是從角色卡片開始的拖曳
                if (!document.body.hasAttribute('data-sortable-dragging')) {
                    e.preventDefault();
                    e.stopPropagation();
                    dragCounter++;
                    
                    if (dragCounter === 1) {
                        
                        showDragOverlay();
                    }
                }
            }
        };

        const handleDragOver = (e) => {
            //  支援首頁和世界書列表頁面（筆記列表暫不支援匯入）
if (!isHomePage && !(isListPage && listPageType === 'worldbook')) return;
            
            // 🔧 修復：只檢查 types
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                if (!document.body.hasAttribute('data-sortable-dragging')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        const handleDragLeave = (e) => {
            //  支援首頁和世界書列表頁面（筆記列表暫不支援匯入）
if (!isHomePage && !(isListPage && listPageType === 'worldbook')) return;
            
            // 🔧 修復：只檢查 types
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                if (!document.body.hasAttribute('data-sortable-dragging')) {
                    dragCounter--;
                    if (dragCounter <= 0) {
                        dragCounter = 0;
                        
                        hideDragOverlay();
                        //  清除檔案拖曳標記
                        document.body.removeAttribute('data-file-dragging');
                    }
                }
            }
        };

        const handleDrop = async (e) => {
            
            //  支援首頁和世界書/筆記列表頁面
if (!isHomePage && !(isListPage && (listPageType === 'worldbook'))) {
    
    return;
}
            
            // 🔧 強制檢查：只要有 dataTransfer 就處理
            if (e.dataTransfer) {
                
                
                // 檢查是否有檔案
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    
                    
                    //  如果是檔案拖曳，強制處理，不管目標是什麼
                    if (document.body.hasAttribute('data-file-dragging')) {
                        // 🔧 先阻止默認行為，避免瀏覽器打開檔案
                        e.preventDefault();
                        e.stopPropagation();
                        
                        dragCounter = 0;
                        hideDragOverlay();
                        document.body.removeAttribute('data-file-dragging');
                        
                        
                        
                        const files = Array.from(e.dataTransfer.files);
                        
                        if (files.length > 0) {
                            
                            try {
                                await handleFileImport(files[0]);
                                
                                
                                // 處理多個檔案的情況
                                if (files.length > 1) {
                                    let successCount = 1; // 第一個已經處理
                                    let errorCount = 0;
                                    
                                    const importNext = async (index) => {
                                        if (index >= files.length) {
                                            if (successCount > 0) {
                                                //  根據當前頁面類型顯示對應訊息
const itemType = (isListPage && listPageType === 'worldbook') ? '世界書' : 
                 (isListPage && listPageType === 'custom') ? '筆記' : '角色';
NotificationManager.success(`成功匯入 ${successCount} 個${itemType}！${errorCount > 0 ? ` ${errorCount} 個檔案匯入失敗。` : ''}`);
                                            }
                                            return;
                                        }
                                        
                                        try {
                                            await handleFileImport(files[index]);
                                            successCount++;
                                        } catch (error) {
                                            errorCount++;
                                            console.error(`檔案 ${files[index].name} 匯入失敗:`, error);
                                        }
                                        
                                        setTimeout(() => importNext(index + 1), 100);
                                    };
                                    
                                    // 從第二個檔案開始處理
                                    setTimeout(() => importNext(1), 100);
                                }
                            } catch (error) {
                                console.error('❌ 檔案匯入失敗:', error);
                            }
                        }
                    } else {
                        
                    }
                } else {
                    
                    //  清除檔案拖曳標記
                    document.body.removeAttribute('data-file-dragging');
                }
            } else {
                
            }
        };

        //  使用 capture 模式添加事件監聽器，確保優先執行
        document.addEventListener('dragenter', handleDragEnter, true);
        document.addEventListener('dragover', handleDragOver, true);
        document.addEventListener('dragleave', handleDragLeave, true);
        document.addEventListener('drop', handleDrop, true);
        
        // 保存引用以便後續移除
        this.fileDropHandler = {
            dragenter: handleDragEnter,
            dragover: handleDragOver,
            dragleave: handleDragLeave,
            drop: handleDrop
        };
        
        
    }
    
    //  測試檔案拖曳檢測
    static testFileDragDetection() {
        
        
        // 監聽所有拖曳事件來調試
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                if (e.dataTransfer) {
                }
            }, true);
        });
    }

    // 新增到 DragSortManager 類中
static enableAlternateGreetingsDragSort(characterId, versionId) {
    const containerSelector = `#alternate-greetings-list-${versionId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) {
        console.warn(`找不到額外問候語容器: ${containerSelector}`);
        return;
    }
    
    // 銷毀現有實例
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }

    // 創建額外問候語排序實例
    const sortable = new Sortable(container, {
        group: `alternate-greetings-sort-${characterId}-${versionId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.alternate-greeting-item',
        handle: '.drag-handle',  // 只能通過拖曳控制柄來拖曳
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        onStart: (evt) => {
            
            document.body.classList.add('dragging-active');
            container.classList.add('drag-in-progress');
        },
        
        onEnd: (evt) => {
            
            document.body.classList.remove('dragging-active');
            container.classList.remove('drag-in-progress');
            
            if (evt.oldIndex !== evt.newIndex) {
                this.handleAlternateGreetingsReorder(characterId, versionId, evt.oldIndex, evt.newIndex);
            }
        }
    });
    
    this.sortableInstances.set(containerSelector, sortable);
    
    
    return sortable;
}

// 處理額外問候語重新排序
static handleAlternateGreetingsReorder(characterId, versionId, oldIndex, newIndex) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.alternateGreetings) return;
    
    
    
    // 重新排序陣列
    const alternateGreetings = version.alternateGreetings;
    const [movedItem] = alternateGreetings.splice(oldIndex, 1);
    alternateGreetings.splice(newIndex, 0, movedItem);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('character', characterId, versionId);
    markAsChanged();
    
    // 重新渲染模態框內容以更新編號
    const container = document.getElementById('alternate-greetings-container');
    if (container) {
        const character = characters.find(c => c.id === characterId);
        const version = character.versions.find(v => v.id === versionId);
        container.innerHTML = renderAlternateGreetingsModalContent(character, version);
        
        // 重新初始化功能
        setTimeout(() => {
            updateAllPageStats();
            initAutoResize();
            this.enableAlternateGreetingsDragSort(characterId, versionId);
        }, 50);
    }
    
    
}
}