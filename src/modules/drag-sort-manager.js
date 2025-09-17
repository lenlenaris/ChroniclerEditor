// ===== 基於 SortableJS 的超流暢拖曳排序系統 =====
class DragSortManager {
    static sortableInstances = new Map();
    
    static enableDragSort(config) {
        const {
            containerSelector,
            itemSelector,
            type,
            mode = 'grid',
            onReorder = null
        } = config;

        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`拖曳排序：找不到容器 ${containerSelector}`);
            return;
        }

        const existingInstance = this.sortableInstances.get(containerSelector);
        if (existingInstance) {
            existingInstance.destroy();
        }

        const commonConfig = this.getCommonSortableConfig();

        const sortable = new Sortable(container, {
            group: `${type}-sort`,
            animation: 150,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            
            draggable: itemSelector,
            handle: itemSelector,
            
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            
            // 應用通用配置
            forceFallback: commonConfig.forceFallback,
            fallbackOnBody: commonConfig.fallbackOnBody,
            
            filter: (evt, item, container) => {
                return item.getAttribute('onclick')?.includes('addCharacterFromHome');
            },
            
            preventOnFilter: false,
            dragoverBubble: true,
            dropBubble: true,
            
            onStart: (evt) => {
                if (batchEditMode) {
                    return false;
                }
                
                commonConfig.onStartCommon(evt, container);
                document.body.setAttribute('data-sortable-dragging', 'true');
            },
            
            onEnd: (evt) => {
                commonConfig.onEndCommon(evt, container);
                document.body.removeAttribute('data-sortable-dragging');
                
                if (evt.oldIndex !== evt.newIndex) {
                    this.handleReorder(type, container, itemSelector, evt, onReorder);
                }
            },
            
            onMove: (evt) => {
                if (document.body.hasAttribute('data-file-dragging')) {
                    return false;
                }
                
                if (evt.related?.getAttribute('onclick')?.includes('addCharacterFromHome')) {
                    return false;
                }
                return true;
            },
            
            onChoose: (evt) => {
                if (document.body.hasAttribute('data-file-dragging')) {
                    return false;
                }
            }
        });

        this.sortableInstances.set(containerSelector, sortable);
        return sortable;
    }


// ===== 替換整個 DragSortManager.handleReorder() 函數 =====
static handleReorder(type, container, itemSelector, evt, onReorder) {
    // 🆕 第一步：立即設定為自定義排序模式
    OverviewManager.currentSort = 'custom';
    OverviewManager.saveSortPreference('custom');
    
    // 立即更新下拉選單顯示
    const dropdown = document.querySelector('.overview-sort-dropdown') || document.querySelector('.sort-dropdown');
    if (dropdown) dropdown.value = 'custom';
    
    // 🚀 立即處理資料更新
    const items = Array.from(container.querySelectorAll(itemSelector))
        .filter(el => !el.getAttribute('onclick')?.includes('addCharacterFromHome'));
    
    const newOrder = items.map(item => this.extractItemData(item, type));
    
    // 🚀 應用新排序到資料
    this.applyNewOrder(type, newOrder);
    
    // 🆕 強制清除 OverviewManager 的快取
    OverviewManager.invalidateCache();
    
    // 🚀 立即同步側邊欄排序
    this.syncSidebarOrder(type);
    
    // 🚀 使用 requestAnimationFrame 優化重新渲染時機
    if (onReorder) {
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


static enableVersionDragSort(type, itemId) {
    const containerSelector = `#${type}-versions-${itemId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) return;
    
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }
    
    const commonConfig = this.getCommonSortableConfig();
    
    const sortable = new Sortable(container, {
        group: `${type}-version-sort-${itemId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.version-item',
        handle: '.version-item',
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        // 應用通用配置
        forceFallback: commonConfig.forceFallback,
        fallbackOnBody: commonConfig.fallbackOnBody,
        
        onStart: (evt) => {
            commonConfig.onStartCommon(evt, container);
        },
        
        onEnd: (evt) => {
            commonConfig.onEndCommon(evt, container);
            
            if (evt.oldIndex !== evt.newIndex) {
                this.handleVersionReorder(type, itemId, container, evt);
            }
        }
    });
    
    this.sortableInstances.set(containerSelector, sortable);
    return sortable;
}


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


static extractItemData(item, type) {
    // 🆕 優先檢查資料夾
    const folderId = item.getAttribute('data-folder-id');
    if (folderId) {
        return { id: `folder-${folderId}`, element: item };
    }
    
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
                if (onClickAttr.includes('selectItem')) {
                    const match = onClickAttr.match(/selectItem\([^,]+,\s*'([^']+)'/);
                    return { id: match ? match[1] : null, element: item };
                }
                else if (onClickAttr.includes('toggleItemVersions')) {
                    const match = onClickAttr.match(/'([^']+)'/);
                    return { id: match ? match[1] : null, element: item };
                }
            }
            break;
            
        case 'worldbook-entry':
            const entryId = item.getAttribute('data-entry-id');
            return { id: entryId, element: item };
    }
    
    return { id: null, element: item };
}

static enableAdditionalInfoDragSort(characterId, versionId) {
    const containerSelector = `#additional-info-list-${versionId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) return;
    
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }

    let savedStates = {};
    const commonConfig = this.getCommonSortableConfig();
    
    const sortable = new Sortable(container, {
        group: `additional-info-sort-${characterId}-${versionId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.additional-info-item',
        handle: '.drag-handle',
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        // 應用通用配置
        forceFallback: commonConfig.forceFallback,
        fallbackOnBody: commonConfig.fallbackOnBody,
        
        onStart: (evt) => {
            commonConfig.onStartCommon(evt, container);
            savedStates = getCurrentAdditionalInfoCollapseStates();
        },
        
        onEnd: (evt) => {
            commonConfig.onEndCommon(evt, container);
            
            if (evt.oldIndex !== evt.newIndex) {
                this.handleAdditionalInfoReorder(characterId, versionId, evt.oldIndex, evt.newIndex);
                
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

    static reorderArray(sourceArray, orderedIds) {
        const reorderedArray = [];
        const folderIds = [];
        const regularIds = [];
        
        // 🆕 分離資料夾 ID 和一般項目 ID
        orderedIds.forEach(id => {
            if (id.startsWith('folder-')) {
                folderIds.push(id);
            } else {
                regularIds.push(id);
            }
        });
        
        // 只對一般項目進行重新排序
        regularIds.forEach(id => {
            const item = sourceArray.find(item => item.id === id);
            if (item) {
                reorderedArray.push(item);
            }
        });

        // 添加不在排序列表中的新項目
        sourceArray.forEach(item => {
            if (!regularIds.includes(item.id)) {
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
        const value = JSON.stringify(orderedIds);
        console.log(`%c[saveCustomOrder] 正在儲存 ${type} 的排序...`, 'color: #28a745;', { key: key, value: value });
        localStorage.setItem(key, value);
    }

    // 📖 載入自定義排序偏好
    static loadCustomOrder(type) {
        const key = `characterCreator-customOrder-${type}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    }

// 🎯 應用保存的排序（在數據載入後調用）
static applySavedOrder(type) {
    console.log(`[applySavedOrder] 正在嘗試為 ${type} 套用儲存的排序...`);
    const savedOrder = this.loadCustomOrder(type);
    
    if (savedOrder && savedOrder.length > 0) {
        console.log(`[applySavedOrder] 找到 ${type} 的儲存順序:`, savedOrder);
        
        let targetArray;
        switch (type) {
            case 'character':
                targetArray = characters;
                console.log(`[applySavedOrder] 套用前 characters 順序 (前5項):`, characters.slice(0, 5).map(c => c.id));
                this.reorderArray(characters, savedOrder);
                console.log(`[applySavedOrder] 套用後 characters 順序 (前5項):`, characters.slice(0, 5).map(c => c.id));
                break;
            case 'userpersona':
                targetArray = userPersonas;
                this.reorderArray(userPersonas, savedOrder);
                break;
            case 'worldbook':
                targetArray = worldBooks;
                this.reorderArray(worldBooks, savedOrder);
                break;
            case 'custom':
                targetArray = customSections;
                this.reorderArray(customSections, savedOrder);
                break;
            case 'loveydovey':
                targetArray = loveyDoveyCharacters;
                this.reorderArray(loveyDoveyCharacters, savedOrder);
                break;
        }
    } else {
        console.log(`[applySavedOrder] 未找到 ${type} 的儲存順序。`);
    }
}

// 清除自定義排序
static clearCustomOrder(type) {
    const key = `characterCreator-customOrder-${type}`;
    console.warn(`%c[clearCustomOrder] 正在清除 ${type} 的自定義排序！`, 'color: #dc3545;', { key: key });
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
    const containerSelector = `#${pageType}-list`;
    const container = document.querySelector(containerSelector);
    
    if (container) {
        this.enableDragSort({
            containerSelector: containerSelector,
            itemSelector: '.list-item:not(.add-item-card)',
            type: pageType, // 使用動態的 pageType
            mode: 'list',
            onReorder: () => {
                // 1. 啟用自定義排序模式
                OverviewManager.enableCustomSort();
                
                // 2. 更新下拉選單的顯示值 (使用更通用的選擇器)
                const dropdown = document.querySelector('.overview-sort-dropdown') || document.querySelector('.sort-dropdown');
                if (dropdown) {
                    dropdown.value = 'custom';
                }
                
                // 3. 根據正確的 pageType 重新渲染列表和側邊欄
                OverviewManager.renderItems(pageType, containerSelector);
                if (typeof renderSidebar === 'function') {
                    renderSidebar();
                }
            }
        });
    }
}

static enableCustomFieldsDragSort(sectionId, versionId) {
    let containers = [];
    
    if (viewMode === 'compare') {
        // 對比模式：查找所有版本面板內的筆記本容器
        document.querySelectorAll('.version-panel').forEach(panel => {
            const container = panel.querySelector('[id*="custom-fields"]');
            if (container) {
                containers.push(container);
            }
        });
    } else {
        // 單版本模式：只查找當前版本的容器
        const container = document.querySelector(`#custom-fields-${versionId}`);
        if (container) {
            containers = [container];
        }
    }
    
    if (containers.length === 0) {
        console.warn(`找不到筆記本容器`);
        return;
    }
    
    // 為每個容器都啟用拖曳
    containers.forEach((container, index) => {
        const containerVersionId = container.dataset.versionId;
        const containerSectionId = container.dataset.sectionId;
        const uniqueSelector = `#${container.id}`;
        
        // 銷毀現有實例
        const existingInstance = this.sortableInstances.get(uniqueSelector);
        if (existingInstance) {
            existingInstance.destroy();
        }
        
        // 創建新實例
        const sortable = new Sortable(container, {
            group: `custom-fields-sort-${containerSectionId}-${containerVersionId}`,
            animation: 150,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            
            draggable: '.field-group',
            handle: '.drag-handle',
            
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            
            // 🎯 關鍵修復：禁用 clone 和 fallback
            forceFallback: false,
            fallbackOnBody: false,
            
            // 排除按鈕
            filter: (evt, item, container) => {
                return item.classList.contains('loveydovey-add-btn-transparent') || 
                       item.tagName === 'BUTTON';
            },
            
            onStart: (evt) => {
                document.body.classList.add('dragging-active');
                container.classList.add('drag-in-progress');
                
                // 🎯 修復：移除 ghost 元素的 ID 屬性，避免重複
                setTimeout(() => {
                    const ghostElement = container.querySelector('.sortable-ghost');
                    if (ghostElement) {
                        // 移除 ghost 元素內所有有 ID 的子元素的 ID
                        ghostElement.querySelectorAll('[id]').forEach(element => {
                            element.removeAttribute('id');
                        });
                    }
                    
                    // 同樣處理 drag 元素
                    const dragElement = document.querySelector('.sortable-drag');
                    if (dragElement) {
                        dragElement.querySelectorAll('[id]').forEach(element => {
                            element.removeAttribute('id');
                        });
                    }
                }, 0);
            },
            
            onEnd: (evt) => {
                document.body.classList.remove('dragging-active');
                container.classList.remove('drag-in-progress');
                
                // 🎯 修復：清理可能殘留的重複 ID
                setTimeout(() => {
                    this.cleanupDuplicateIds(container);
                }, 0);
                
                if (evt.oldIndex !== evt.newIndex) {
                    this.handleCustomFieldsReorder(container, containerSectionId, containerVersionId, evt);
                }
            }
        });
        
        this.sortableInstances.set(uniqueSelector, sortable);
    });
    
    return containers.length;
}

// 清理重複 ID 的輔助函數
static cleanupDuplicateIds(container) {
    const seenIds = new Set();
    const elementsWithIds = container.querySelectorAll('[id]');
    
    elementsWithIds.forEach(element => {
        if (seenIds.has(element.id)) {
            console.warn(`清理重複 ID: ${element.id}`);
            element.removeAttribute('id');
        } else {
            seenIds.add(element.id);
        }
    });
}

static getCommonSortableConfig() {
    return {
        // 關鍵修復：禁用 clone 和 fallback
        forceFallback: false,
        fallbackOnBody: false,
        
        // 通用的開始事件處理
        onStartCommon: (evt, container) => {
            document.body.classList.add('dragging-active');
            container.classList.add('drag-in-progress');
            setTimeout(() => {
                const ghostElement = container.querySelector('.sortable-ghost');
                if (ghostElement) {
                    ghostElement.querySelectorAll('[id]').forEach(element => {
                        element.removeAttribute('id');
                    });
                }
                
                const dragElement = document.querySelector('.sortable-drag');
                if (dragElement) {
                    dragElement.querySelectorAll('[id]').forEach(element => {
                        element.removeAttribute('id');
                    });
                }
            }, 0);
        },
        
        // 通用的結束事件處理
        onEndCommon: (evt, container) => {
            document.body.classList.remove('dragging-active');
            container.classList.remove('drag-in-progress');
            
            // 修復：清理可能殘留的重複 ID
            setTimeout(() => {
                this.cleanupDuplicateIds(container);
            }, 0);
        }
    };
}

// 處理筆記本欄位重新排序
static handleCustomFieldsReorder(container, sectionId, versionId, evt) {
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
    
    TimestampManager.updateVersionTimestamp('custom', sectionId, versionId);
    markAsChanged();
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

static enableAlternateGreetingsDragSort(characterId, versionId) {
    const containerSelector = `#alternate-greetings-list-${versionId}`;
    const container = document.querySelector(containerSelector);
    
    if (!container) {
        console.warn(`找不到額外問候語容器: ${containerSelector}`);
        return;
    }
    
    const existingInstance = this.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }

    const commonConfig = this.getCommonSortableConfig();

    const sortable = new Sortable(container, {
        group: `alternate-greetings-sort-${characterId}-${versionId}`,
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.alternate-greeting-item',
        handle: '.drag-handle',
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        // 應用通用配置
        forceFallback: commonConfig.forceFallback,
        fallbackOnBody: commonConfig.fallbackOnBody,
        
        onStart: (evt) => {
            commonConfig.onStartCommon(evt, container);
        },
        
        onEnd: (evt) => {
            commonConfig.onEndCommon(evt, container);
            
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