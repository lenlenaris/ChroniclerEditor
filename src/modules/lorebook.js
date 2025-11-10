// ===== HTML 轉義工具函數 =====
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

// ===== 世界書處理函數 =====
function addWorldBookEntry(worldBookId, versionId) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const maxUid = Math.max(-1, ...version.entries.map(e => e.uid || 0));
            const newUid = maxUid + 1;
            
            const newEntry = {
                id: generateId(),
                uid: newUid,
                displayIndex: version.entries.length,
                key: [],
                keysecondary: [],
                content: '',
                comment: '',
                constant: false,
                vectorized: false,
                selective: true,
                selectiveLogic: 0,
                addMemo: true,
                useProbability: false,
                disable: false,
                order: 100,
                position: 0,
                role: null,
                excludeRecursion: false,
                preventRecursion: false,
                delayUntilRecursion: 0,
                probability: 100,
                depth: 4,
                group: '',
                groupOverride: false,
                groupWeight: 100,
                scanDepth: null,
                caseSensitive: null,
                matchWholeWords: null,
                useGroupScoring: null,
                automationId: '',
                sticky: 0,
                cooldown: 0,
                delay: 0,
                matchPersonaDescription: false,
                matchCharacterDescription: false,
                matchCharacterPersonality: false,
                matchCharacterDepthPrompt: false,
                matchScenario: false,
                matchCreatorNotes: false,
                triggers: []
            };
            
            version.entries.push(newEntry);
            
            // 🎯 找到正確的容器（使用更精確的選擇器）
            const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
            
            if (container) {
                // 找到該容器內的新增按鈕
                const addButton = container.querySelector('.loveydovey-add-btn');
                
                if (addButton) {
                    // 在新增按鈕前插入新條目
                    const newEntryHTML = WorldBookRenderer.renderWorldBookEntry(worldBookId, versionId, newEntry);
                    addButton.insertAdjacentHTML('beforebegin', newEntryHTML);
                    
                    markAsChanged();
                    
                    // 🎯 只初始化新條目相關功能
                    setTimeout(() => {
                        // 更新統計
                        updateFieldStats(`worldbook-${worldBookId}-${versionId}-${newEntry.id}`);
                        // 初始化自動調整大小
                        initAutoResize();
                        // 重新啟用該版本的拖曳排序
                        enableWorldBookEntriesDragSort(worldBookId, versionId);
                    }, 50);
                } else {
                    console.warn('找不到新增按鈕，使用備用渲染方案');
                    fallbackRender();
                }
            } else {
                console.warn('找不到條目容器，使用備用渲染方案');
                fallbackRender();
            }
            
            // 🛡️ 備用渲染方案
            function fallbackRender() {
                if (crossTypeCompareMode) {
                    if (typeof WorldBookRenderer !== 'undefined' && WorldBookRenderer.renderWorldBookEntriesList) {
                        WorldBookRenderer.renderWorldBookEntriesList(worldBookId, versionId);
                    } else {
                        CrossTypeCompareManager.renderCrossTypeInterface();
                    }
                } else {
                    renderAll();
                }
                
                markAsChanged();
                setTimeout(() => {
                    enableWorldBookEntriesDragSort(worldBookId, versionId);
                }, 100);
            }
        }
    }
}

function removeWorldBookEntry(worldBookId, versionId, entryId) {
    const confirmDelete = confirm(t('deleteEntry') + '？\n\n⚠️ 刪除後無法復原！');
    
    if (confirmDelete) {
        const worldBook = worldBooks.find(wb => wb.id === worldBookId);
        if (worldBook) {
            const version = worldBook.versions.find(v => v.id === versionId);
            if (version) {
                version.entries = version.entries.filter(e => e.id !== entryId);
                
                if (crossTypeCompareMode) {
                    if (typeof WorldBookRenderer !== 'undefined' && WorldBookRenderer.renderWorldBookEntriesList) {
                        WorldBookRenderer.renderWorldBookEntriesList(worldBookId, versionId);
                    } else {
                        // 備用方案：重新渲染整個雙屏內容
                        CrossTypeCompareManager.renderCrossTypeInterface();
                    }
                } else {
                    // 單版本模式：使用原有的渲染
                    renderWorldBookContent();
                }
                
                markAsChanged();
            }
        }
    }
}

function updateWorldBookEntry(worldBookId, versionId, entryId, field, value) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                if (field === 'key' || field === 'keysecondary') {
                    entry[field] = value.split(',').map(k => k.trim()).filter(k => k);
                } else {
                    entry[field] = value;
                }
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                handleFieldUpdateComplete('worldbook', worldBookId, versionId);
            }
        }
    }
}

function updateEntryMode(worldBookId, versionId, entryId, mode) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                entry.constant = false;
                entry.vectorized = false;
                entry.selective = true;
                
                switch (mode) {
                    case 'constant':
                        entry.constant = true;
                        break;
                    case 'vectorized':
                        entry.vectorized = true;
                        break;
                    case 'selective':
                    default:
                        entry.selective = true;
                        break;
                }
                markAsChanged();
            }
        }
    }
}

function toggleEntryEnabled(worldBookId, versionId, entryId) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                entry.disable = !entry.disable;
                
                const entryPanel = document.querySelector(`[data-entry-id="${entryId}"]`);
                if (entryPanel) {
                    const toggleSwitch = entryPanel.querySelector('.toggle-switch');
                    const toggleBall = toggleSwitch.querySelector('div');
                    
                    if (!entry.disable) {
                        toggleSwitch.style.background = 'var(--primary-color)';
                        toggleBall.style.left = '14px';
                    } else {
                        toggleSwitch.style.background = 'var(--border-color)';
                        toggleBall.style.left = '4px';
                    }
                }
                
                markAsChanged();
            }
        }
    }
}

function updateEntryStatusIcon(entryId, entry) {
    const entryPanel = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (entryPanel) {
        const statusIcon = entryPanel.querySelector('.entry-status-icon');
        if (statusIcon) {
            let icon = '';
            if (entry.constant) {
                icon = '🔵';
            } else if (entry.vectorized) {
                icon = '🔗';
            } else {
                icon = '🟢';
            }
            statusIcon.textContent = icon;
        }
    }
}

function updateEntryModeFromSelect(worldBookId, versionId, entryId, mode) {
    updateEntryMode(worldBookId, versionId, entryId, mode);
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                updateEntryStatusIcon(entryId, entry);
            }
        }
    }
}

function toggleEntryContent(entryId, event = null) {
    // 先檢查是否有延遲載入版本的按鈕
    const lazyBtn = document.querySelector(`[onclick*="toggleEntryContentLazy"][onclick*="'${entryId}'"]`);
    if (lazyBtn) {
        // 如果是延遲載入版本，提取參數並呼叫對應函數
        const onclickAttr = lazyBtn.getAttribute('onclick');
        const matches = onclickAttr.match(/toggleEntryContentLazy\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
        if (matches) {
            const [, worldBookId, versionId, extractedEntryId] = matches;
            toggleEntryContentLazy(worldBookId, versionId, extractedEntryId, event);
            return;
        }
    }
    
    // 原有的邏輯保持不變
    let content, toggleBtn;
    
    if (event) {
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#entry-content-${entryId}`);
            toggleBtn = versionContainer.querySelector(`[onclick="toggleEntryContent('${entryId}')"]`);
        }
    }
    
    if (!content || !toggleBtn) {
        content = document.getElementById(`entry-content-${entryId}`);
        toggleBtn = document.querySelector(`[onclick="toggleEntryContent('${entryId}')"]`);
    }
    
    if (!content || !toggleBtn) return;
    
    const isExpanded = content.style.display !== 'none';
    
    if (isExpanded) {
        content.style.display = 'none';
        toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
    } else {
        content.style.display = 'block';
        toggleBtn.innerHTML = '<span class="arrow-icon arrow-down"></span>';
    }
    
    saveCollapseStates();
}

function copyWorldBookEntry(worldBookId, versionId, entryId) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (!worldBook) return;

    const version = worldBook.versions.find(v => v.id === versionId);
    if (!version) return;

    const originalEntryIndex = version.entries.findIndex(e => e.id === entryId);
    if (originalEntryIndex === -1) return;

    const originalEntry = version.entries[originalEntryIndex];
    
    // 1. 準備新條目數據
    const maxUid = Math.max(-1, ...version.entries.map(e => e.uid || 0));
    const newUid = maxUid + 1;
    
    const newEntry = {
        ...originalEntry,
        id: generateId(),
        uid: newUid,
        comment: (originalEntry.comment || '') + t('copyPrefix')
        // displayIndex 會在稍後重新計算
    };

    // 2. 更新數據陣列：將新條目插入到原始條目之後
    version.entries.splice(originalEntryIndex + 1, 0, newEntry);

    // 3. 重新計算所有條目的 displayIndex 以確保連續性
    version.entries.forEach((entry, index) => {
        entry.displayIndex = index;
    });

    // 4. 高效能 DOM 更新 (不重新渲染整個列表)
    //    精準找到目標容器
    const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
    if (container) {
        // 在容器內找到原始條目的 DOM 元素
        const originalEntryElement = container.querySelector(`.entry-panel[data-entry-id="${entryId}"]`);
        
        if (originalEntryElement) {
            // 只渲染新條目的 HTML
            const newEntryHTML = WorldBookRenderer.renderWorldBookEntry(worldBookId, versionId, newEntry);
            // 將新條目 HTML 插入到原始條目 DOM 元素的後面
            originalEntryElement.insertAdjacentHTML('afterend', newEntryHTML);

            markAsChanged();

            // 只初始化新條目相關功能，並重新啟用拖曳
            setTimeout(() => {
                updateFieldStats(`worldbook-${worldBookId}-${versionId}-${newEntry.id}`);
                initAutoResize();
                enableWorldBookEntriesDragSort(worldBookId, versionId); // 重新綁定拖曳
            }, 50);

        } else {
            console.warn('找不到原始條目元素，使用備用渲染方案');
            fallbackRender();
        }
    } else {
        console.warn('找不到條目容器，使用備用渲染方案');
        fallbackRender();
    }

    // 🛡️ 備用渲染方案 (以防萬一)
    function fallbackRender() {
        if (crossTypeCompareMode) {
            CrossTypeCompareManager.renderCrossTypeInterface();
        } else {
            renderWorldBookContent();
        }
        markAsChanged();
    }
}

function confirmRemoveWorldBookEntry(worldBookId, versionId, entryId) {
    const confirmDelete = confirm(t('deleteEntryConfirm'));
    
    if (confirmDelete) {
        removeWorldBookEntry(worldBookId, versionId, entryId);
    }
}

// 獲取當前世界書條目折疊狀態
function getCurrentWorldBookEntryCollapseStates() {
    const states = {};
    document.querySelectorAll('.entry-panel').forEach(panel => {
        const entryId = panel.dataset.entryId;
        const content = document.getElementById(`entry-content-${entryId}`);
        if (content) {
            states[entryId] = content.style.display === 'none';
        }
    });
    return states;
}

// 恢復世界書條目折疊狀態
function restoreWorldBookEntryCollapseStates(states) {
    if (!states) return;
    
    Object.keys(states).forEach(entryId => {
        if (states[entryId]) {
            // 查找所有匹配的元素（對比模式下可能有多個）
            const allContentElements = document.querySelectorAll(`#entry-content-${entryId}`);
            const allToggleBtns = document.querySelectorAll(`[onclick="toggleEntryContent('${entryId}')"]`);
            
            // 對每個匹配的元素都應用折疊狀態
            allContentElements.forEach(content => {
                if (content) content.style.display = 'none';
            });
            
            allToggleBtns.forEach(toggleBtn => {
                if (toggleBtn) toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
            });
        }
    });
}


class WorldBookRenderer {
    // 渲染世界書版本內容
    static renderWorldBookVersionContent(worldBook, version) {
        return `
        <div class="character-version-content">
            <!-- 條目列表 -->
            <div class="entries-container" data-world-book-id="${worldBook.id}" data-version-id="${version.id}">
                ${version.entries.length > 0 ? `
                    <!-- 條目標題標籤（只顯示一次） -->
                  ${UIUtils.createTableHeader([
    { width: '24px', title: '' },
    { width: '40px', title: '' },
    { width: '40px', title: '' },
    { width: '1fr', title: t('entryTitleComment') },
    { width: '35px', title: t('triggerStrategy'), style: 'text-align: center; margin-left: -25px;' },
    { width: '150px', title: t('insertPosition'), style: 'text-align: center; margin-left: -30px;' },
    { width: '60px', title: t('insertDepth'), style: 'text-align: center; margin-left: 0px;' },
    { width: '60px', title: t('insertOrder'), style: 'text-align: center; margin-left: 0px;' },
    { width: '60px', title: t('probabilityValue'), style: 'text-align: center; margin-left: 0px;' },
    { width: '40px', title: '' },
    { width: '40px', title: '' }
])}
                ` : ''}
                
                ${version.entries.map(entry => this.renderWorldBookEntry(worldBook.id, version.id, entry)).join('')}
                
               <!-- 新增條目按鈕 -->
            <button class="loveydovey-add-btn" onclick="addWorldBookEntry('${worldBook.id}', '${version.id}')" style="margin-top: 16px;">
                ${IconManager.plus({width: 16, height: 16})}
                ${t('addEntry')}
            </button>
            </div>
            </div>
        `;
    }

static renderWorldBookEntry(worldBookId, versionId, entry) {
    // Determine status icon
    let statusIcon = '';
    if (entry.constant) {
        statusIcon = '🔵'; // Blue light: Constant mode
    } else if (entry.vectorized) {
        statusIcon = '🔗'; // Link: Vectorized mode
    } else {
        statusIcon = '🟢'; // Green light: Selective mode
    }

    return `
        <div class="entry-panel sortable-item wb-entry-panel" data-entry-id="${entry.id}" data-display-index="${entry.displayIndex || 0}">
          <!-- Entry header -->
          <div class="entry-header wb-entry-header-grid">
             <!-- Column 1: Left Controls -->
<div class="wb-entry-col-left">
    <!-- Batch checkbox (hidden by default) -->
    <label class="batch-checkbox" 
           id="batch-checkbox-${entry.id}"
           style="display: none; cursor: pointer; margin-right: 8px;">
        <input type="checkbox" 
               class="batch-checkbox-input"
               data-entry-id="${entry.id}"
               onchange="updateBatchSelection('${worldBookId}', '${versionId}')">
    </label>
    
    <!-- Drag handle -->
    <div class="drag-handle custom-field-drag-handle">
        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
    </div>
    
    <!-- Toggle button -->
    <button class="entry-toggle-btn wb-toggle-btn" onclick="toggleEntryContentLazy('${worldBookId}', '${versionId}', '${entry.id}', event)">
        <span class="arrow-icon arrow-right"></span>
    </button>
                  
                  <!-- Enable entry toggle -->
                  <label class="wb-toggle-wrapper">
                      <input type="checkbox" ${!entry.disable ? 'checked' : ''} 
                          onchange="toggleEntryEnabled('${worldBookId}', '${versionId}', '${entry.id}')"
                          class="wb-toggle-hidden-input">
                      <div class="toggle-switch wb-toggle-switch ${!entry.disable ? 'wb-toggle-switch-enabled' : 'wb-toggle-switch-disabled'}">
                          <div class="wb-toggle-circle ${!entry.disable ? 'wb-toggle-circle-enabled' : 'wb-toggle-circle-disabled'}"></div>
                      </div>
                  </label>
              </div>

              <!-- Column 2: Main Content (wrappable) -->
              <div class="wb-entry-col-main">
                  <!-- Comment -->
                  <div class="field-group wb-field-no-margin wb-field-flex">
                    <input type="text" class="field-input compact-input wb-input-bold" 
                        placeholder="${t('entryTitle')}"
                        value="${escapeHtml(entry.comment || '')}"
                        oninput="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'comment', this.value)">
                </div>
                  
                  <!-- Trigger mode -->
                  <div class="field-group wb-field-no-margin wb-field-margin-right">
                      <select class="field-input compact-input wb-input-width-55"
                      title="${t('triggerStrategy')}" onchange="updateEntryModeFromSelect('${worldBookId}', '${versionId}', '${entry.id}', this.value)">
                          <option value="selective" ${entry.selective && !entry.constant && !entry.vectorized ? 'selected' : ''}>🟢</option>
                          <option value="constant" ${entry.constant ? 'selected' : ''}>🔵</option>
                          <option value="vectorized" ${entry.vectorized ? 'selected' : ''}>🔗</option>
                      </select>
                  </div>
                  
                  <!-- Insertion position -->
                  <div class="field-group wb-field-no-margin wb-field-margin-right">
                      <select class="field-input compact-input wb-input-width-150"
                      title="${t('insertPosition')}" onchange="updateWorldBookEntryPosition('${worldBookId}', '${versionId}', '${entry.id}', parseInt(this.value))">
                          <option value="0" ${entry.position === 0 ? 'selected' : ''}>${t('beforeCharDefs')}</option>
                          <option value="1" ${entry.position === 1 ? 'selected' : ''}>${t('afterCharDefs')}</option>
                          <option value="5" ${entry.position === 5 ? 'selected' : ''}>${t('beforeExampleMsg')}</option>
                          <option value="6" ${entry.position === 6 ? 'selected' : ''}>${t('afterExampleMsg')}</option>
                          <option value="2" ${entry.position === 2 ? 'selected' : ''}>${t('topAuthorNote')}</option>
                          <option value="3" ${entry.position === 3 ? 'selected' : ''}>${t('bottomAuthorNote')}</option>
                          <option value="4" data-role="0" ${entry.position === 4 && (entry.role === 0 || entry.role === null) ? 'selected' : ''}>${t('atSystemDepth')}</option>
                          <option value="4" data-role="1" ${entry.position === 4 && entry.role === 1 ? 'selected' : ''}>${t('atUserDepth')}</option>
                          <option value="4" data-role="2" ${entry.position === 4 && entry.role === 2 ? 'selected' : ''}>${t('atAiDepth')}</option>
                      </select>
                  </div>

                  <!-- Depth -->
                  <div class="field-group wb-field-no-margin wb-field-margin-right wb-numeric-field-mobile">
                      <span class="wb-mobile-label">${t('insertDepth')}:</span>
                      <input type="number" class="field-input compact-input wb-input-width-60" value="${entry.depth !== undefined ? entry.depth : 4}" min="0" max="999" style="${entry.position !== 4 ? 'opacity: 0;' : ''}"
                          id="depth-${entry.id}"
                          title="${t('insertDepth')}"
                          ${entry.position !== 4 ? 'disabled' : ''}
                          onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'depth', parseInt(this.value))">
                  </div>

                  <!-- Order -->
                  <div class="field-group wb-field-no-margin wb-field-margin-right wb-numeric-field-mobile">
                      <span class="wb-mobile-label">${t('insertOrder')}:</span>
                      <input type="number" class="field-input compact-input wb-input-width-60" value="${entry.order || 100}" min="0" max="999"
                      title="${t('insertOrder')}"
                          onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'order', parseInt(this.value))">
                  </div>

                  <!-- Probability -->
                  <div class="field-group wb-field-no-margin wb-field-margin-right wb-numeric-field-mobile">
                      <span class="wb-mobile-label">${t('probabilityValue')}:</span>
                      <input type="number" class="field-input compact-input wb-input-width-60" value="${entry.probability !== undefined ? entry.probability : 100}" min="0" max="100"
                      title="${t('probabilityValue')}"
                          onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'probability', this.value === '' ? 0 : parseInt(this.value))">
                  </div>
              </div>

              <!-- Column 3: Right Actions -->
              <div class="wb-entry-col-right">
                  <!-- Copy entry button -->
                  <button class="copy-btn" onclick="copyWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}')" 
                          title="${t('copyEntry')}">
                      ${IconManager.copy({width: 14, height: 14})}
                  </button>

                  <!-- Move entry button -->
                    <button class="copy-btn" onclick="openMoveEntryDialog('${worldBookId}', '${versionId}', '${entry.id}')" 
                            title="${t('moveEntry')}">
                        ${IconManager.move({width: 14, height: 14})}
                    </button>

                  <!-- Delete entry button -->
                  <button class="delete-btn" onclick="confirmRemoveWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}')" 
                          title="${t('deleteEntry')}">
                      ${IconManager.delete({width: 14, height: 14})}
                  </button>
              </div>
          </div>

            <!-- Entry content area (initially empty) -->
            <div class="entry-content wb-entry-content" id="entry-content-${entry.id}">
                <!-- Content will be loaded lazily when expanded -->
            </div>
        </div>
    `;
}


    // 局部渲染世界書條目容器
    static renderWorldBookEntriesContainer(worldBook, version) {
        return `
            <div class="entries-container">
                ${version.entries.length > 0 ? `
                    <!-- 條目標題標籤（只顯示一次） -->
                    ${UIUtils.createTableHeader([
                        { width: '40px', title: '' },
                        { width: '40px', title: '' },
                        { width: '1fr', title: t('entryTitleComment') },
                        { width: '35px', title: t('triggerStrategy'), style: 'text-align: center; margin-left: -25px;' },
                        { width: '150px', title: t('insertPosition'), style: 'text-align: center; margin-left: -25px;' },
                        { width: '60px', title: t('insertOrder'), style: 'text-align: center; margin-left: -25px;' },
                        { width: '50px', title: t('insertDepth'), style: 'text-align: center; margin-left: -25px;' },
                        { width: '40px', title: '' },
                        { width: '40px', title: '' }
                    ])}
                ` : ''}
                
                ${version.entries.map(entry => this.renderWorldBookEntry(worldBook.id, version.id, entry)).join('')}
                
                <!-- 新增條目按鈕 -->
                <button class="loveydovey-add-btn wb-add-btn-spacing" onclick="addWorldBookEntry('${worldBook.id}', '${version.id}')">
                    ${IconManager.plus({width: 16, height: 16})}
                    ${t('addEntry')}
                </button>
            </div>
        `;
    }

    // 局部渲染函數
    static renderWorldBookEntriesList(worldBookId, versionId) {
        const worldBook = worldBooks.find(wb => wb.id === worldBookId);
        if (!worldBook) return;
        
        const version = worldBook.versions.find(v => v.id === versionId);
        if (!version) return;
        
        const container = document.querySelector('.entries-container');
        if (!container) return;
        
        // 保存當前折疊狀態
        const currentStates = getCurrentWorldBookEntryCollapseStates();
        
        // 重新渲染容器
        container.outerHTML = this.renderWorldBookEntriesContainer(worldBook, version);
        
        // 重新初始化功能
        setTimeout(() => {
            updateAllPageStats();
            initAutoResize();
            // 恢復折疊狀態
            restoreWorldBookEntryCollapseStates(currentStates);
            // 重新啟用拖曳功能（如果有的話）
            if (typeof DragSortManager !== 'undefined') {
                // 這裡可能需要啟用世界書的拖曳排序
            }
        }, 50);
    }
  
}

function generateEntryDetailContent(worldBookId, versionId, entry) {
    return `
        <!-- Basic settings -->
        <div class="entry-section">
            <!-- Keywords with logic -->
<div class="wb-detail-grid-2col">
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-detail-label">${t('primaryKeywords')}</label>
        <input type="text" class="field-input compact-input" 
            placeholder="${t('keywordsPlaceholder')}"
            value="${escapeHtml(entry.key.join(', '))}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'key', this.value)">
    </div>
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-detail-label">${t('keywordLogic')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'selectiveLogic', parseInt(this.value))">
            <option value="0" ${entry.selectiveLogic === 0 ? 'selected' : ''}>${t('logicContainsAny')}</option>
            <option value="1" ${entry.selectiveLogic === 1 ? 'selected' : ''}>${t('logicNotFullyContains')}</option>
            <option value="2" ${entry.selectiveLogic === 2 ? 'selected' : ''}>${t('logicContainsNone')}</option>
            <option value="3" ${entry.selectiveLogic === 3 ? 'selected' : ''}>${t('logicContainsAll')}</option>
        </select>
    </div>
</div>

            <!-- Secondary filters -->
            <div class="field-group creator-notes-group">
                <label class="field-label wb-detail-label">${t('secondaryFilters')}</label>
                <input type="text" class="field-input compact-input" 
                    placeholder="${t('secondaryKeysPlaceholder')}"
                    value="${escapeHtml(entry.keysecondary.join(', '))}"
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'keysecondary', this.value)">
            </div>
            
            <!-- Content -->
            <div class="field-group creator-notes-group">
                <label class="field-label wb-detail-label-flex">
                    <span>
                        ${t('entryContentLabel')}
                        <span class="field-stats wb-detail-stats" data-target="worldbook-${worldBookId}-${versionId}-${entry.id}">${entry.content ? entry.content.length : 0} ${t('chars')} / ${entry.content ? countTokens(entry.content) : 0} ${t('tokens')}</span>

                        <button class="fullscreen-btn wb-detail-fullscreen-btn" onclick="openFullscreenEditor('worldbook-${worldBookId}-${versionId}-${entry.id}', '${t('entryContent')}')" 
                                title="${t('fullscreenEditor')}">⛶</button>
                    </span>
                    <span class="wb-detail-uid">(UID: ${entry.uid || 0})</span>
                </label>
               <textarea class="field-input scrollable wb-detail-textarea" id="worldbook-${worldBookId}-${versionId}-${entry.id}" 
    placeholder="${t('entryContentPlaceholder')}"
    oninput="updateFieldStats('worldbook-${worldBookId}-${versionId}-${entry.id}'); updateWorldBookEntryValue('${worldBookId}', '${versionId}', '${entry.id}', 'content', this.value);">${entry.content}</textarea>
            </div>
        </div>
        
<!-- Advanced settings -->
<details class="wb-details-no-margin">
    <summary class="wb-summary-advanced">
        <span class="wb-chevron-transition">${IconManager.chevronRight({width: 12, height: 12})}</span>
        ${t('advancedSettings')}
    </summary>
    <div class="wb-advanced-content">
        
<!-- Group and automation settings -->
<div class="wb-grid-2fr-1fr">
    <div class="field-group no-bottom-margin">
        <div class="wb-label-row-flex">
            <label class="field-label wb-label-small">${t('includeGroups')}</label>
            <div class="wb-group-priority-container">
                <span class="wb-priority-text">${t('groupPriority')}</span>
                <input type="checkbox" ${entry.groupOverride ? 'checked' : ''} 
                    id="group-override-${entry.id}"
                    class="wb-checkbox-no-margin"
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'groupOverride', this.checked)">
            </div>
        </div>
        <input type="text" class="field-input compact-input" value="${entry.group || ''}" 
            placeholder="${t('groupPlaceholder')}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'group', this.value)">
    </div>
    <div class="field-group no-bottom-margin">
        <div class="wb-height-24-flex">
            <label class="field-label wb-label-tiny">${t('automationId')}</label>
        </div>
        <input type="text" class="field-input compact-input" value="${entry.automationId || ''}" 
            placeholder="${t('automationIdPlaceholder')}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'automationId', this.value)">
    </div>
</div>

 <!-- Triggers 觸發時機設定 -->
<div class="wb-triggers-container">
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-label-small">${t('filterToGenerationTriggers')}</label>
        <div class="triggers-input-container" style="position: relative;">
            <div class="field-input compact-input triggers-display wb-triggers-display" 
                 onclick="toggleTriggersDropdown('${worldBookId}', '${versionId}', '${entry.id}')"
                 id="triggers-display-${entry.id}">
                ${(entry.triggers || []).map(trigger => `
                    <span class="tag-base tag-sm">
                        ${t('trigger_' + trigger)}
                        <button onclick="event.stopPropagation(); removeWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', '${trigger}')" class="tag-remove-btn">×</button>
                    </span>
                `).join('')}
                ${(!entry.triggers || entry.triggers.length === 0) ? `<span class="wb-triggers-empty">${t('clickToSelectTriggers')}</span>` : ''}
            </div>
            <div class="triggers-dropdown wb-triggers-dropdown" id="triggers-dropdown-${entry.id}">
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('normal') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'normal', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_normal')}</span>
                </label>
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('continue') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'continue', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_continue')}</span>
                </label>
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('impersonate') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'impersonate', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_impersonate')}</span>
                </label>
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('swipe') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'swipe', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_swipe')}</span>
                </label>
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('regenerate') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'regenerate', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_regenerate')}</span>
                </label>
                <label class="wb-trigger-option">
                    <input type="checkbox" ${(entry.triggers || []).includes('quiet') ? 'checked' : ''} 
                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'quiet', this.checked)">
                    <span class="wb-trigger-text">${t('trigger_quiet')}</span>
                </label>
            </div>
        </div>
    </div>
</div>

 <!-- Three-value dropdown settings -->
<div class="wb-grid-3-equal">
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-label-small">${t('caseSensitive')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'caseSensitive', this.value)">
            <option value="null" ${entry.caseSensitive === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.caseSensitive === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.caseSensitive === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-label-small">${t('matchWholeWords')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'matchWholeWords', this.value)">
            <option value="null" ${entry.matchWholeWords === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.matchWholeWords === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.matchWholeWords === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
    <div class="field-group no-bottom-margin">
        <label class="field-label wb-label-small">${t('useGroupScoring')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'useGroupScoring', this.value)">
            <option value="null" ${entry.useGroupScoring === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.useGroupScoring === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.useGroupScoring === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
</div>

<!-- Recursion control area -->
<div class="wb-grid-recursion">
    <!-- Left: Recursion control options -->
    <div>
        <div class="wb-recursion-title">${t('recursionControl')}</div>
        <div class="wb-recursion-options">
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.excludeRecursion ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'excludeRecursion', this.checked)">
                <span class="wb-trigger-text">${t('noRecursion')}</span>
            </label>
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.preventRecursion ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'preventRecursion', this.checked)">
                <span class="wb-trigger-text">${t('preventRecursion')}</span>
            </label>
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? 'checked' : ''} 
                    id="delay-checkbox-${entry.id}"
                    onchange="toggleDelayUntilRecursion('${worldBookId}', '${versionId}', '${entry.id}', this.checked)">
                <span class="wb-trigger-text">${t('delayRecursion')}</span>
            </label>
        </div>
    </div>
    
 <!-- Right: Value settings -->
<div class="wb-values-right">
    <div class="wb-grid-3x150-mb">
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('stickyValue')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" value="${entry.sticky || 0}" 
                onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'sticky', parseInt(this.value))">
        </div>
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('cooldownValue')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" value="${entry.cooldown || 0}" 
                onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'cooldown', parseInt(this.value))">
        </div>
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('groupWeight')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" value="${entry.groupWeight || 100}" min="1" max="100"
                onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'groupWeight', parseInt(this.value))">
        </div>
    </div>
    <div class="wb-grid-3x150">
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('recursionLevel')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" 
                id="delay-value-${entry.id}"
                value="${entry.delayUntilRecursion || 1}" 
                min="1" max="999" 
                style="${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? '' : 'opacity: 0.5;'}"
                ${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? '' : 'disabled'}
                onchange="updateDelayUntilRecursionValue('${worldBookId}', '${versionId}', '${entry.id}', parseInt(this.value))">
        </div>
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('delayValue')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" value="${entry.delay || 0}" 
                onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'delay', parseInt(this.value))">
        </div>
        <div class="field-group no-bottom-margin">
            <label class="field-label wb-label-tiny">${t('scanDepth')}</label>
            <input type="number" class="field-input compact-input wb-input-width-150" value="${entry.scanDepth || ''}" 
                placeholder="${t('scanDepthplaceholder')}"
                onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'scanDepth', this.value ? parseInt(this.value) : null)">
        </div>
    </div>
</div>
</div>

 <!-- 額外匹配來源區域 -->
<details class="wb-details-margin-top">
    <summary class="wb-summary-advanced">
        <span class="wb-chevron-transition">${IconManager.chevronRight({width: 12, height: 12})}</span>
        ${t('additionalMatchSources')}
    </summary>
    <div class="wb-advanced-content">
        <div class="wb-grid-2-equal">
            <!-- 左邊3項 -->
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchCharacterDescription ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterDescription', this.checked)">
                <span class="wb-trigger-text">${t('matchCharacterDescription')}</span>
            </label>
            <!-- 右邊3項 -->
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchPersonaDescription ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchPersonaDescription', this.checked)">
                <span class="wb-trigger-text">${t('matchPersonaDescription')}</span>
            </label>
            
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchCharacterPersonality ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterPersonality', this.checked)">
                <span class="wb-trigger-text">${t('matchCharacterPersonality')}</span>
            </label>
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchCharacterDepthPrompt ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterDepthPrompt', this.checked)">
                <span class="wb-trigger-text">${t('matchCharacterDepthPrompt')}</span>
            </label>
            
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchScenario ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchScenario', this.checked)">
                <span class="wb-trigger-text">${t('matchScenario')}</span>
            </label>
            <label class="wb-recursion-option">
                <input type="checkbox" ${entry.matchCreatorNotes ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCreatorNotes', this.checked)">
                <span class="wb-trigger-text">${t('matchCreatorNotes')}</span>
            </label>
        </div>
    </div>
</details>
</details>
    `;
}

function toggleEntryContentLazy(worldBookId, versionId, entryId, event = null) {
    const content = document.getElementById(`entry-content-${entryId}`);
    const toggleBtn = event ? event.target : 
        document.querySelector(`[onclick*="toggleEntryContentLazy('${worldBookId}', '${versionId}', '${entryId}'"]`);
    
    if (!content || !toggleBtn) {
        console.warn(`找不到元素: content=${!!content}, btn=${!!toggleBtn}`);
        return;
    }
    
    // 🔥 關鍵修復：使用 getComputedStyle 來正確判斷顯示狀態
    const computedStyle = window.getComputedStyle(content);
    const isExpanded = computedStyle.display !== 'none';
    
    if (isExpanded) {
        // 摺疊：隱藏內容
        content.style.display = 'none';
        toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
    } else {
        // 展開：檢查是否需要載入內容
        if (content.innerHTML.trim() === '' || content.innerHTML.includes('<!-- Content will be loaded lazily')) {
            // 第一次展開，需要載入內容
            loadEntryContent(worldBookId, versionId, entryId);
        }
        
        // 顯示內容
        content.style.display = 'block';
        toggleBtn.innerHTML = '<span class="arrow-icon arrow-down"></span>';
    }
    
    // 保存摺疊狀態
    saveCollapseStates();
}

// 載入條目詳細內容
function loadEntryContent(worldBookId, versionId, entryId) {
    // 找到對應的條目資料
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (!worldBook) return;
    
    const version = worldBook.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const entry = version.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    // 生成詳細內容HTML
    const detailHTML = generateEntryDetailContent(worldBookId, versionId, entry);
    
    // 插入到對應的內容區域
    const contentDiv = document.getElementById(`entry-content-${entryId}`);
    if (contentDiv) {
        contentDiv.innerHTML = detailHTML;
        
        // 重新初始化相關功能
        setTimeout(() => {
            // 更新統計數據
            updateAllPageStats();
            // 重新初始化自動調整大小
            initAutoResize();
            // 重新初始化滾動條
            if (typeof ScrollbarManager !== 'undefined') {
                ScrollbarManager.initializeAll();
            }
        }, 50);
    }
}

function updateWorldBookEntryValue(worldBookId, versionId, entryId, field, value) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                if (field === 'key' || field === 'keysecondary') {
                    entry[field] = value.split(',').map(k => k.trim()).filter(k => k);
                } else {
                    entry[field] = value;
                }
                
                // 輕量級更新（不重算統計）
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
                
                if (field === 'content') {
                    setTimeout(() => {
                        updateVersionStats('worldbook', worldBookId, versionId);
                    }, 250); 
                }
            }
        }
    }
}

function updateWorldBookEntryPosition(worldBookId, versionId, entryId, newPosition) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                // 取得選中的 option 元素來獲取 data-role
                const selectElement = event.target;
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const dataRole = selectedOption.getAttribute('data-role');
                
                // 更新 position
                entry.position = newPosition;
                
                // 根據 position 自動計算 role
                if (newPosition === 4) {
                    // @D 模式，根據選項設定 role
                    entry.role = dataRole ? parseInt(dataRole) : 0; // 預設為系統深度
                } else {
                    // 非 @D 模式，role 設為 null
                    entry.role = null;
                }
                
                // 更新 depth 欄位的顯示狀態
                updateDepthFieldState(entryId, newPosition);
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

function updateDepthFieldState(entryId, position) {
    const depthField = document.getElementById(`depth-${entryId}`);
    if (depthField) {
        if (position === 4) {
            depthField.disabled = false;
            depthField.style.opacity = '1';
        } else {
            depthField.disabled = true;
            depthField.style.opacity = '0';
        }
    }
}

function toggleDelayUntilRecursion(worldBookId, versionId, entryId, isChecked) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                const valueInput = document.getElementById(`delay-value-${entryId}`);
                
                if (isChecked) {
                    // 勾選：啟用遞迴層級欄位
                    entry.delayUntilRecursion = parseInt(valueInput.value) || 1;
                    valueInput.disabled = false;
                    valueInput.style.opacity = '1';
                } else {
                    // 取消勾選：禁用遞迴層級欄位，設定為 0
                    entry.delayUntilRecursion = 0;
                    valueInput.disabled = true;
                    valueInput.style.opacity = '0.5';
                }
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

function updateDelayUntilRecursionValue(worldBookId, versionId, entryId, newValue) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                // 確保值在有效範圍內
                const validValue = Math.max(1, Math.min(999, newValue || 1));
                entry.delayUntilRecursion = validValue;
                
                // 同步更新輸入框顯示值
                const valueInput = document.getElementById(`delay-value-${entryId}`);
                if (valueInput && valueInput.value != validValue) {
                    valueInput.value = validValue;
                }
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

// ===== Triggers 觸發時機管理函數 =====

function toggleTriggersDropdown(worldBookId, versionId, entryId) {
    const dropdown = document.getElementById(`triggers-dropdown-${entryId}`);
    
    // 關閉其他已開啟的下拉選單
    document.querySelectorAll('.triggers-dropdown').forEach(d => {
        if (d.id !== `triggers-dropdown-${entryId}`) {
            d.style.display = 'none';
        }
    });
    
    // 切換當前下拉選單
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleWorldBookTrigger(worldBookId, versionId, entryId, triggerType, isChecked) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                // 確保 triggers 是陣列
                if (!Array.isArray(entry.triggers)) {
                    entry.triggers = [];
                }
                
                if (isChecked) {
                    // 新增觸發條件（如果不存在）
                    if (!entry.triggers.includes(triggerType)) {
                        entry.triggers.push(triggerType);
                    }
                } else {
                    // 移除觸發條件
                    entry.triggers = entry.triggers.filter(t => t !== triggerType);
                }
                
                // 更新顯示
                updateTriggersDisplay(entryId, entry.triggers);
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

function removeWorldBookTrigger(worldBookId, versionId, entryId, triggerType) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry && Array.isArray(entry.triggers)) {
                // 移除觸發條件
                entry.triggers = entry.triggers.filter(t => t !== triggerType);
                
                // 更新顯示和下拉選單勾選狀態
                updateTriggersDisplay(entryId, entry.triggers);
                updateTriggersDropdownState(entryId, entry.triggers);
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

function updateTriggersDisplay(entryId, triggers) {
    const displayElement = document.getElementById(`triggers-display-${entryId}`);
    if (displayElement) {
        if (!triggers || triggers.length === 0) {
            displayElement.innerHTML = `<span class="wb-triggers-empty">${t('clickToSelectTriggers')}</span>`;
        } else {
            displayElement.innerHTML = triggers.map(trigger => `
                <span class="tag-base tag-sm">
                    ${t('trigger_' + trigger)}
                    <button onclick="event.stopPropagation(); removeWorldBookTriggerSimple('${entryId}', '${trigger}')" class="tag-remove-btn">×</button>
                </span>
            `).join('');
        }
    }
}

function removeWorldBookTriggerSimple(entryId, triggerType) {
    // 遍歷所有世界書找到對應的條目
    for (const worldBook of worldBooks) {
        for (const version of worldBook.versions) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry && Array.isArray(entry.triggers)) {
                // 移除觸發條件
                entry.triggers = entry.triggers.filter(t => t !== triggerType);
                
                // 更新顯示和下拉選單勾選狀態
                updateTriggersDisplay(entryId, entry.triggers);
                updateTriggersDropdownState(entryId, entry.triggers);
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBook.id, version.id);
                markAsChanged();
                return;
            }
        }
    }
}

function updateTriggersDropdownState(entryId, triggers) {
    const dropdown = document.getElementById(`triggers-dropdown-${entryId}`);
    if (dropdown) {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const triggerType = checkbox.getAttribute('onchange').match(/'([^']+)', this\.checked/)[1];
            checkbox.checked = triggers.includes(triggerType);
        });
    }
}

// 點擊外部關閉下拉選單
document.addEventListener('click', function(event) {
    if (!event.target.closest('.triggers-input-container')) {
        document.querySelectorAll('.triggers-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

// ===== 世界書條目拖曳排序功能 =====

// 啟用世界書條目拖曳排序（重寫版）
function enableWorldBookEntriesDragSort(worldBookId, versionId) {
    let containers;
    
    if (viewMode === 'compare') {
        // 對比模式：獲取所有容器，為每個都啟用拖曳
        containers = document.querySelectorAll('.entries-container');
    } else {
        // 單版本模式：只有一個容器
        const container = document.querySelector('.entries-container');
        containers = container ? [container] : [];
    }
    
    if (containers.length === 0 || typeof Sortable === 'undefined') {
        console.warn('無法啟用世界書條目拖曳排序：容器不存在或 Sortable 未載入');
        return;
    }
    
    
    
    // 為每個容器都啟用拖曳
    containers.forEach((container, index) => {
        // 檢查是否已經啟用
        if (container._sortable) {
            container._sortable.destroy();
        }
        
        let savedStates = {}; // 保存折疊狀態
        
        container._sortable = Sortable.create(container, {
            handle: '.drag-handle',
            animation: 150,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            
            draggable: '.entry-panel',
            
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen', 
            dragClass: 'sortable-drag',
            
            // 排除新增條目按鈕
            filter: function(evt, item, container) {
                return item.classList.contains('loveydovey-add-btn') || 
                       item.tagName === 'BUTTON';
            },
            
            onStart: function(evt) {
                
                document.body.style.cursor = 'grabbing';
                
                // 記錄當前折疊狀態
                savedStates = getCurrentWorldBookEntryCollapseStates();
            },
            
            onEnd: function(evt) {
                document.body.style.cursor = '';
                
                if (evt.oldIndex !== evt.newIndex) {
                    // 從容器的 data 屬性獲取版本信息
                    const containerWorldBookId = container.dataset.worldBookId;
                    const containerVersionId = container.dataset.versionId;
                    
                    if (containerWorldBookId && containerVersionId) {
                        // 使用容器自己的版本信息
                        reorderWorldBookEntriesFromContainer(container, containerWorldBookId, containerVersionId);
                    } else {
                        // 備援：使用傳入的參數（向後兼容單版本模式）
                        reorderWorldBookEntriesFromContainer(container, worldBookId, versionId);
                    }
                    
                    // 立即恢復摺疊狀態
                    setTimeout(() => {
                        restoreWorldBookEntryCollapseStates(savedStates);
                    }, 10);
                }
            }
        });
        
        
    });
    
    return containers.length;
}

// 基於特定容器重新排序（新函數）
function reorderWorldBookEntriesFromContainer(container, worldBookId, versionId) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (!worldBook) return;
    
    const version = worldBook.versions.find(v => v.id === versionId);
    if (!version || !version.entries) return;
    
    const entryPanels = Array.from(container.querySelectorAll('.entry-panel'));
    
    const newEntriesOrder = [];
    entryPanels.forEach(panel => {
        const entryId = panel.dataset.entryId;
        const entry = version.entries.find(e => e.id === entryId);
        if (entry) {
            newEntriesOrder.push(entry);
        }
    });
    
    if (newEntriesOrder.length !== version.entries.length) {
        console.warn('⚠️ 條目數量不匹配，使用原順序');
        return;
    }
    
    version.entries = newEntriesOrder;
    // 🔧 確保 displayIndex 和 uid 連續且唯一
    version.entries.forEach((entry, index) => {
        entry.displayIndex = index;
        // 保持 uid 不變，只更新 displayIndex
    });
    
    TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
    markAsChanged();
}

// 重新排序世界書條目（基於DOM順序重建）
function reorderWorldBookEntries(worldBookId, versionId, oldIndex, newIndex) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (!worldBook) return;
    
    const version = worldBook.versions.find(v => v.id === versionId);
    if (!version || !version.entries) return;
    
    // 從DOM獲取新的條目順序
    const container = document.querySelector('.entries-container');
    const entryPanels = Array.from(container.querySelectorAll('.entry-panel'));
    
    // 根據DOM順序重建陣列
    const newEntriesOrder = [];
    entryPanels.forEach(panel => {
        const entryId = panel.dataset.entryId;
        const entry = version.entries.find(e => e.id === entryId);
        if (entry) {
            newEntriesOrder.push(entry);
        }
    });
    
    // 確保沒有遺失條目
    if (newEntriesOrder.length !== version.entries.length) {
        console.warn('⚠️ 條目數量不匹配，使用原順序');
        return;
    }
    
    // 更新陣列和 displayIndex
    version.entries = newEntriesOrder;
    version.entries.forEach((entry, index) => {
        entry.displayIndex = index + 1;
    });
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
    markAsChanged();

}
// 更新世界書條目的編號顯示（支援對比模式）
function updateWorldBookEntryNumbers(version, worldBookId, versionId) {
    if (!version.entries) return;
    
    // 如果有 versionId，先找到對應的版本容器
    let searchContainer = document;
    if (versionId && viewMode === 'compare') {
        const versionContainer = document.querySelector(`#worldbook-entries-${worldBookId}-${versionId}`)?.closest('.version-content');
        if (versionContainer) {
            searchContainer = versionContainer;
        }
    }
    
    version.entries.forEach((entry, index) => {
        // 更新 data-display-index 屬性
        const entryPanel = searchContainer.querySelector(`[data-entry-id="${entry.id}"]`);
        if (entryPanel) {
            entryPanel.setAttribute('data-display-index', entry.displayIndex || (index + 1));
        }
    });
    
    
}

function updateWorldBookEntryAdvanced(worldBookId, versionId, entryId, field, value) {
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            const entry = version.entries.find(e => e.id === entryId);
            if (entry) {
                // 處理三值邏輯：null, true, false
                if (value === 'null') {
                    entry[field] = null;
                } else if (value === 'true') {
                    entry[field] = true;
                } else if (value === 'false') {
                    entry[field] = false;
                }
                
                TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
                markAsChanged();
            }
        }
    }
}

// ===== 條目移動功能 =====

// 開啟移動條目對話框
function openMoveEntryDialog(sourceWorldBookId, sourceVersionId, entryId) {
    // 獲取來源條目資訊
    const sourceWorldBook = worldBooks.find(wb => wb.id === sourceWorldBookId);
    if (!sourceWorldBook) return;
    
    const sourceVersion = sourceWorldBook.versions.find(v => v.id === sourceVersionId);
    if (!sourceVersion) return;
    
    const entry = sourceVersion.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    // 生成世界書-版本選項列表
    let optionsHTML = '';
    worldBooks.forEach(wb => {
        wb.versions.forEach(v => {
            // 排除來源本身
            if (wb.id === sourceWorldBookId && v.id === sourceVersionId) {
                return;
            }
            optionsHTML += `
                <div class="tag-detail-item tag-item-hover move-option" 
                    data-worldbook-id="${wb.id}" 
                    data-version-id="${v.id}"
                    data-worldbook-name="${wb.name}"
                    data-version-name="${v.name}"
                    style="padding: 12px 16px; margin-bottom: 4px; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 6px; transition: all 0.2s ease;">
                    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">
                        ${wb.name}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 2px;">
                        ${v.name}
                    </div>
                </div>
            `;
        });
    });
    
    const content = `
        <div class="compact-modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.move({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('moveEntryTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
                <p class="compact-modal-desc" style="text-align: left; margin-bottom: 16px;">
                    ${t('moveEntryDescription').replace('$1', `<strong>${entry.comment || t('untitledEntry')}</strong>`)}
                </p>
                
                <!-- 搜尋框 -->
                <input type="text" 
                       id="move-search-input" 
                       class="field-input msize-input"
                       placeholder="${t('searchWorldBooks')}"
                       style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                       oninput="filterMoveOptions(this.value)">
                
                <!-- 目標列表 -->
                <div id="move-options-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); padding: 8px;">
                    ${optionsHTML || `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">${t('noOtherWorldBooks')}</div>`}
                </div>
                
                <!-- 已選擇提示 -->
                <div id="move-selected-display" style="margin-top: 12px; padding: 12px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.9em; min-height: 48px; display: flex; align-items: center;">
                    ${t('pleaseSelectTarget')}
                </div>
            </div>

            <div class="compact-modal-footer" style="justify-content: center; margin-top: 16px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">
                    ${t('cancel')}
                </button>
                <button id="confirm-move-btn" 
                        class="overview-btn btn-primary" 
                        disabled>
                    ${t('confirmMove')}
                </button>
            </div>
        </div>
    `;
    
ModalManager.create({
    title: '',
    content: content,
    footer: '',
    maxWidth: '600px'
});


window.moveEntryTarget = null;

// 🎯 綁定移動選項的點擊事件
setTimeout(() => {
    document.querySelectorAll('.move-option').forEach(option => {
        option.addEventListener('click', function() {
            const worldBookId = this.dataset.worldbookId;
            const versionId = this.dataset.versionId;
            const worldBookName = this.dataset.worldbookName;
            const versionName = this.dataset.versionName;
            selectMoveTarget(worldBookId, versionId, worldBookName, versionName);
        });
    });
    
    // 🎯 綁定確認按鈕的點擊事件
    const confirmBtn = document.getElementById('confirm-move-btn');
    if (confirmBtn) {
        // 🔑 使用 setAttribute 安全地設置包含特殊字符的數據
        confirmBtn.setAttribute('data-source-worldbook-id', sourceWorldBookId);
        confirmBtn.setAttribute('data-source-version-id', sourceVersionId);
        confirmBtn.setAttribute('data-entry-id', entryId);
        
        confirmBtn.addEventListener('click', function() {
            const sourceWorldBookId = this.dataset.sourceWorldbookId;
            const sourceVersionId = this.dataset.sourceVersionId;
            const entryId = this.dataset.entryId;
            
            // 從實際數據中獲取 entryName
            const sourceWorldBook = worldBooks.find(wb => wb.id === sourceWorldBookId);
            const sourceVersion = sourceWorldBook?.versions.find(v => v.id === sourceVersionId);
            const entry = sourceVersion?.entries.find(e => e.id === entryId);
            const entryName = entry?.comment || t('untitledEntry');
            
            confirmMoveEntry(sourceWorldBookId, sourceVersionId, entryId, entryName);
        });
    }
}, 50);
}

// 選擇移動目標
function selectMoveTarget(worldBookId, versionId, worldBookName, versionName) {
    // 更新選擇狀態
    window.moveEntryTarget = {
        worldBookId: worldBookId,
        versionId: versionId,
        worldBookName: worldBookName,
        versionName: versionName
    };
    
    // 更新 UI 選中狀態
    document.querySelectorAll('.move-option').forEach(option => {
        if (option.dataset.worldbookId === worldBookId && option.dataset.versionId === versionId) {
            option.style.background = 'var(--primary-color)';
            option.style.borderColor = 'var(--primary-color)';
            option.style.color = 'white';
            option.querySelectorAll('div').forEach(div => {
                div.style.color = 'white';
            });
        } else {
            option.style.background = 'transparent';
            option.style.borderColor = 'transparent';
            option.style.color = 'var(--text-color)';
            option.querySelector('div:first-child').style.color = 'var(--text-color)';
            option.querySelector('div:last-child').style.color = 'var(--text-muted)';
        }
    });
    
    // 更新已選擇提示
    const display = document.getElementById('move-selected-display');
    if (display) {
        display.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                ${IconManager.check({width: 16, height: 16, style: 'color: var(--primary-color);'})}
                <span style="color: var(--text-color); font-weight: 500;">
                    ${t('selectedTarget')}: ${worldBookName} - ${versionName}
                </span>
            </div>
        `;
    }
    
    // 啟用確認按鈕
    const confirmBtn = document.getElementById('confirm-move-btn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

// 篩選移動選項
function filterMoveOptions(searchText) {
    const searchLower = searchText.toLowerCase();
    const options = document.querySelectorAll('.move-option');
    
    let hasVisible = false;
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchLower)) {
            option.style.display = 'block';
            hasVisible = true;
        } else {
            option.style.display = 'none';
        }
    });
    
    // 如果沒有符合的結果
    const container = document.getElementById('move-options-container');
    if (!hasVisible && searchText.trim()) {
        if (!container.querySelector('.no-results')) {
            container.insertAdjacentHTML('beforeend', `
                <div class="no-results" style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
                    ${t('noMatchingWorldBooks')}
                </div>
            `);
        }
    } else {
        const noResults = container.querySelector('.no-results');
        if (noResults) noResults.remove();
    }
}

// 確認移動條目
function confirmMoveEntry(sourceWorldBookId, sourceVersionId, entryId, entryName) {
    if (!window.moveEntryTarget) {
        NotificationManager.warning(t('pleaseSelectTarget'));
        return;
    }
    
    const { worldBookId: targetWorldBookId, versionId: targetVersionId, worldBookName, versionName } = window.moveEntryTarget;
    
    // 執行移動
    const success = moveWorldBookEntry(sourceWorldBookId, sourceVersionId, targetWorldBookId, targetVersionId, entryId);
    
    if (success) {
        // 關閉模態框
        document.querySelector('.modal')?.remove();
        
        // 顯示成功提示
        NotificationManager.success(
            t('moveSuccess')
                .replace('$1', entryName)
                .replace('$2', `${worldBookName} - ${versionName}`)
        );
        
        // 清理全域變數
        window.moveEntryTarget = null;
    } else {
        alert(t('moveFailed'));
    }
}

// 移動世界書條目
function moveWorldBookEntry(sourceWorldBookId, sourceVersionId, targetWorldBookId, targetVersionId, entryId) {
    // 獲取來源資料
    const sourceWorldBook = worldBooks.find(wb => wb.id === sourceWorldBookId);
    if (!sourceWorldBook) return false;
    
    const sourceVersion = sourceWorldBook.versions.find(v => v.id === sourceVersionId);
    if (!sourceVersion) return false;
    
    const entryIndex = sourceVersion.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return false;
    
    const entry = sourceVersion.entries[entryIndex];
    
    // 獲取目標資料
    const targetWorldBook = worldBooks.find(wb => wb.id === targetWorldBookId);
    if (!targetWorldBook) return false;
    
    const targetVersion = targetWorldBook.versions.find(v => v.id === targetVersionId);
    if (!targetVersion) return false;
    
    // 計算新的 uid（目標版本的最大 uid + 1）
    const maxUid = Math.max(-1, ...targetVersion.entries.map(e => e.uid || 0));
    const newUid = maxUid + 1;
    
    // 創建新條目（深拷貝並更新 id 和 uid）
    const newEntry = {
        ...entry,
        id: generateId(),
        uid: newUid,
        displayIndex: targetVersion.entries.length
    };
    
    // 加入目標版本
    targetVersion.entries.push(newEntry);
    
    // 從來源版本移除
    sourceVersion.entries.splice(entryIndex, 1);
    
    // 重新計算來源版本的 displayIndex
    sourceVersion.entries.forEach((e, index) => {
        e.displayIndex = index;
    });
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('worldbook', sourceWorldBookId, sourceVersionId);
    TimestampManager.updateVersionTimestamp('worldbook', targetWorldBookId, targetVersionId);
    
    // 標記為已變更
    markAsChanged();
    
    // 重新渲染當前頁面
    if (crossTypeCompareMode) {
        // 雙屏模式下，必須刷新整個對比介面，才能同時更新來源和目標
        CrossTypeCompareManager.renderCrossTypeInterface();
    } else {
        // 單版本模式，只需刷新當前內容
        renderWorldBookContent();
    }
    
    return true;
}

// ===== 批量編輯功能 =====

// 切換批量模式
function toggleWorldBookBatchMode(worldBookId, versionId) {
    const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
    if (!container) return;
    
    const isActive = container.classList.toggle('batch-mode-active');
    const button = document.getElementById(`batch-mode-toggle-${worldBookId}-${versionId}`);
    
    // 顯示/隱藏所有勾選框
    const checkboxes = container.querySelectorAll('.batch-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.style.display = isActive ? 'flex' : 'none';
    });
    
    // 更新按鈕樣式
    if (button) {
        if (isActive) {
            button.style.background = 'var(--primary-color)';
            button.style.color = 'white';
            button.title = t('worldbookExitBatchMode');
        } else {
            button.style.background = '';
            button.style.color = '';
            button.title = t('worldbookBatchMode');
            // 取消所有選擇
            container.querySelectorAll('.batch-checkbox-input').forEach(cb => cb.checked = false);
        }
    }
    
    // 顯示/隱藏批量操作欄
    if (isActive) {
        showBatchToolbar(worldBookId, versionId);
    } else {
        hideBatchToolbar(worldBookId, versionId);
    }
}

// 更新批量選擇狀態
function updateBatchSelection(worldBookId, versionId) {
    const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
    if (!container) return;
    
    const selectedCheckboxes = container.querySelectorAll('.batch-checkbox-input:checked');
    const selectedCount = selectedCheckboxes.length;
    
    // 更新工具欄顯示
    const toolbar = document.getElementById(`batch-toolbar-${worldBookId}-${versionId}`);
    if (toolbar) {
        const countDisplay = toolbar.querySelector('.batch-count');
        if (countDisplay) {
            countDisplay.textContent = t('worldbookSelectedCount').replace('$1', selectedCount);
        }
        
        // 啟用/禁用批量操作按鈕
        const actionButtons = toolbar.querySelectorAll('.batch-action-btn');
        actionButtons.forEach(btn => {
            btn.disabled = selectedCount === 0;
        });
    }
}

// 顯示批量操作工具欄
function showBatchToolbar(worldBookId, versionId) {
    // 移除舊的工具欄（如果存在）
    hideBatchToolbar(worldBookId, versionId);
    
    const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
    if (!container) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = `batch-toolbar-${worldBookId}-${versionId}`;
    toolbar.className = 'batch-toolbar';
    toolbar.innerHTML = `
        <div class="batch-toolbar-content">
            <div class="batch-info">
                <span class="batch-count">${t('worldbookSelectedCount').replace('$1', '0')}</span>
            </div>
            <div class="batch-actions">
                <button class="overview-btn hover-primary batch-action-btn" 
                        disabled
                        onclick="batchCopyEntries('${worldBookId}', '${versionId}')"
                        title="${t('worldbookBatchCopy')}">
                    ${IconManager.copy({width: 14, height: 14})}
                    ${t('copyEntry')}
                </button>
                <button class="overview-btn hover-primary batch-action-btn" 
                        disabled
                        onclick="batchMoveEntries('${worldBookId}', '${versionId}')"
                        title="${t('worldbookBatchMove')}">
                    ${IconManager.move({width: 14, height: 14})}
                    ${t('moveEntry')}
                </button>
                <button class="overview-btn overview-danger-btn batch-action-btn" 
                        disabled
                        onclick="batchDeleteEntries('${worldBookId}', '${versionId}')"
                        title="${t('worldbookBatchDelete')}">
                    ${IconManager.delete({width: 14, height: 14})}
                    ${t('deleteEntry')}
                </button>
            </div>
        </div>
    `;
    
    // 插入到版本面板底部
    const versionPanel = container.closest('.version-panel');
    if (versionPanel) {
        versionPanel.appendChild(toolbar);
    }
}

// 隱藏批量操作工具欄
function hideBatchToolbar(worldBookId, versionId) {
    const toolbar = document.getElementById(`batch-toolbar-${worldBookId}-${versionId}`);
    if (toolbar) {
        toolbar.remove();
    }
}

// 獲取選中的條目 ID
function getSelectedEntryIds(worldBookId, versionId) {
    const container = document.querySelector(`.entries-container[data-world-book-id="${worldBookId}"][data-version-id="${versionId}"]`);
    if (!container) return [];
    
    const selectedCheckboxes = container.querySelectorAll('.batch-checkbox-input:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.dataset.entryId);
}

// 批量複製條目
function batchCopyEntries(worldBookId, versionId) {
    const entryIds = getSelectedEntryIds(worldBookId, versionId);
    if (entryIds.length === 0) {
        NotificationManager.warning(t('worldbookNoEntriesSelected'));
        return;
    }
    
    let successCount = 0;
    entryIds.forEach(entryId => {
        const worldBook = worldBooks.find(wb => wb.id === worldBookId);
        if (worldBook) {
            const version = worldBook.versions.find(v => v.id === versionId);
            if (version) {
                const originalEntry = version.entries.find(e => e.id === entryId);
                if (originalEntry) {
                    const maxUid = Math.max(-1, ...version.entries.map(e => e.uid || 0));
                    const newUid = maxUid + 1;
                    
                    const newEntry = {
                        ...originalEntry,
                        id: generateId(),
                        uid: newUid,
                        displayIndex: version.entries.length,
                        comment: (originalEntry.comment || '') + t('copyPrefix')
                    };
                    
                    version.entries.push(newEntry);
                    successCount++;
                }
            }
        }
    });
    
    if (successCount > 0) {
        TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
        markAsChanged();
        
        // 重新渲染
        if (crossTypeCompareMode) {
            // 雙屏模式下，直接刷新整個對比介面，確保兩側狀態都更新
            CrossTypeCompareManager.renderCrossTypeInterface();
        } else {
            // 單版本模式，重新渲染內容並恢復批量模式
            renderWorldBookContent();
            setTimeout(() => {
                toggleWorldBookBatchMode(worldBookId, versionId);
                toggleWorldBookBatchMode(worldBookId, versionId); // 刷新批量模式UI
            }, 100);
        }
        
        NotificationManager.success(t('worldbookBatchCopySuccess').replace('$1', successCount));
    }
}

// 批量移動條目
function batchMoveEntries(worldBookId, versionId) {
    const entryIds = getSelectedEntryIds(worldBookId, versionId);
    if (entryIds.length === 0) {
        NotificationManager.warning(t('worldbookNoEntriesSelected'));
        return;
    }
    
    // 開啟移動對話框（複用單個移動的 UI，但改成批量）
    openBatchMoveDialog(worldBookId, versionId, entryIds);
}

// 批量刪除條目
function batchDeleteEntries(worldBookId, versionId) {
    const entryIds = getSelectedEntryIds(worldBookId, versionId);
    if (entryIds.length === 0) {
        NotificationManager.warning(t('worldbookNoEntriesSelected'));
        return;
    }
    
    if (!NotificationManager.confirmWithOptions(
        t('worldbookBatchDeleteConfirm').replace('$1', entryIds.length),
        t('confirm'),
        t('cancel')
    )) {
        return;
    }
    
    const worldBook = worldBooks.find(wb => wb.id === worldBookId);
    if (worldBook) {
        const version = worldBook.versions.find(v => v.id === versionId);
        if (version) {
            // 過濾掉選中的條目
            version.entries = version.entries.filter(e => !entryIds.includes(e.id));
            
            // 重新計算 displayIndex
            version.entries.forEach((e, index) => {
                e.displayIndex = index;
            });
            
            TimestampManager.updateVersionTimestamp('worldbook', worldBookId, versionId);
            markAsChanged();
            
            // 重新渲染
            if (crossTypeCompareMode) {
                // 雙屏模式下，直接刷新整個對比介面，確保兩側狀態都更新
                CrossTypeCompareManager.renderCrossTypeInterface();
            } else {
                // 單版本模式，重新渲染內容並恢復批量模式
                renderWorldBookContent();
                setTimeout(() => {
                    toggleWorldBookBatchMode(worldBookId, versionId);
                    toggleWorldBookBatchMode(worldBookId, versionId); // 刷新批量模式UI
                }, 100);
            }
            
            NotificationManager.success(t('worldbookBatchDeleteSuccess').replace('$1', entryIds.length));
        }
    }
}

// 開啟批量移動對話框
function openBatchMoveDialog(sourceWorldBookId, sourceVersionId, entryIds) {
    // 生成世界書-版本選項列表
    let optionsHTML = '';
    worldBooks.forEach(wb => {
        wb.versions.forEach(v => {
            // 排除來源本身
            if (wb.id === sourceWorldBookId && v.id === sourceVersionId) {
                return;
            }
            optionsHTML += `
                <div class="tag-detail-item tag-item-hover move-option" 
                    data-worldbook-id="${wb.id}" 
                    data-version-id="${v.id}"
                    data-worldbook-name="${wb.name}"
                    data-version-name="${v.name}"
                    style="padding: 12px 16px; margin-bottom: 4px; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 6px; transition: all 0.2s ease;">
                    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">
                        ${wb.name}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 2px;">
                        ${v.name}
                    </div>
                </div>
            `;
        });
    });
    
    const content = `
        <div class="compact-modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.move({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('worldbookBatchMoveTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
                <p class="compact-modal-desc" style="text-align: left; margin-bottom: 16px;">
                    ${t('worldbookBatchMoveDescription').replace('$1', `<strong>${entryIds.length}</strong>`)}
                </p>
                
                <!-- 搜尋框 -->
                <input type="text" 
                       id="move-search-input" 
                       class="field-input msize-input"
                       placeholder="${t('searchWorldBooks')}"
                       style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                       oninput="filterMoveOptions(this.value)">
                
                <!-- 目標列表 -->
                <div id="move-options-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); padding: 8px;">
                    ${optionsHTML || `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">${t('noOtherWorldBooks')}</div>`}
                </div>
                
                <!-- 已選擇提示 -->
                <div id="move-selected-display" style="margin-top: 12px; padding: 12px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.9em; min-height: 48px; display: flex; align-items: center;">
                    ${t('pleaseSelectTarget')}
                </div>
            </div>

            <div class="compact-modal-footer" style="justify-content: center; margin-top: 16px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">
                    ${t('cancel')}
                </button>
                <button id="confirm-move-btn" 
                        class="overview-btn btn-primary" 
                        disabled>
                    ${t('confirmMove')}
                </button>
            </div>
        </div>
    `;
    
ModalManager.create({
    title: '',
    content: content,
    footer: '',
    maxWidth: '600px'
});

window.moveEntryTarget = null;

// 🎯 綁定移動選項的點擊事件
setTimeout(() => {
    document.querySelectorAll('.move-option').forEach(option => {
        option.addEventListener('click', function() {
            const worldBookId = this.dataset.worldbookId;
            const versionId = this.dataset.versionId;
            const worldBookName = this.dataset.worldbookName;
            const versionName = this.dataset.versionName;
            selectMoveTarget(worldBookId, versionId, worldBookName, versionName);
        });
    });
    
    // 🎯 綁定確認按鈕的點擊事件
    const confirmBtn = document.getElementById('confirm-move-btn');
    if (confirmBtn) {
        // 🔑 使用 setAttribute 安全地設置包含特殊字符的數據
        confirmBtn.setAttribute('data-source-worldbook-id', sourceWorldBookId);
        confirmBtn.setAttribute('data-source-version-id', sourceVersionId);
        confirmBtn.setAttribute('data-entry-ids', entryIds.join(','));
        
        confirmBtn.addEventListener('click', function() {
            const sourceWorldBookId = this.dataset.sourceWorldbookId;
            const sourceVersionId = this.dataset.sourceVersionId;
            const entryIdsStr = this.dataset.entryIds;
            confirmBatchMoveEntries(sourceWorldBookId, sourceVersionId, entryIdsStr);
        });
    }
}, 50);
}

// 確認批量移動
function confirmBatchMoveEntries(sourceWorldBookId, sourceVersionId, entryIdsStr) {
    if (!window.moveEntryTarget) {
        NotificationManager.warning(t('pleaseSelectTarget'));
        return;
    }
    
    // 將逗號分隔的字串轉回陣列
    const entryIds = entryIdsStr.split(',');
    
    const { worldBookId: targetWorldBookId, versionId: targetVersionId, worldBookName, versionName } = window.moveEntryTarget;
    
    let successCount = 0;
    entryIds.forEach(entryId => {
        const success = moveWorldBookEntry(sourceWorldBookId, sourceVersionId, targetWorldBookId, targetVersionId, entryId);
        if (success) successCount++;
    });
    
    if (successCount > 0) {
        // 關閉模態框
        document.querySelector('.modal')?.remove();
        
        NotificationManager.success(
            t('worldbookBatchMoveSuccess')
                .replace('$1', successCount)
                .replace('$2', `${worldBookName} - ${versionName}`)
        );
        
        // 清理全域變數
        window.moveEntryTarget = null;
    } else {
        NotificationManager.error(t('moveFailed'));
    }
}