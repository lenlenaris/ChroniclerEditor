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
            }
        }
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
        <div style="width: 98%; margin: 0 auto;">
            <!-- 條目列表 -->
            <div class="entries-container">
                ${version.entries.length > 0 ? `
                    <!-- 條目標題標籤（只顯示一次） -->
                  ${UIUtils.createTableHeader([
    { width: '24px', title: '' },
    { width: '40px', title: '' },
    { width: '40px', title: '' },
    { width: '1fr', title: t('entryTitleComment') },
    { width: '35px', title: t('triggerStrategy'), style: 'text-align: center; margin-left: -25px;' },
    { width: '150px', title: t('insertPosition'), style: 'text-align: center; margin-left: -25px;' },
    { width: '60px', title: t('insertDepth'), style: 'text-align: center; margin-left: -25px;' },
    { width: '60px', title: t('insertOrder'), style: 'text-align: center; margin-left: -25px;' },
    { width: '60px', title: t('probabilityValue'), style: 'text-align: center; margin-left: -25px;' },
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

        // 渲染世界書條目
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
        <div class="entry-panel sortable-item" data-entry-id="${entry.id}" data-display-index="${entry.displayIndex || 0}" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 16px; background: var(--header-bg);">
          <!-- Entry header -->
<div class="entry-header" style="display: grid; grid-template-columns: 24px 24px 36px 1fr 52px 150px 60px 60px 60px 40px 40px; gap: 8px; margin: 10px; align-items: center;">
    <!-- Drag handle -->
    <div class="drag-handle" style="
        cursor: grab;
        color: var(--text-muted);
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    " onmouseover="this.style.color='var(--text-color)'; this.style.backgroundColor='var(--border-color)'"
       onmouseout="this.style.color='var(--text-muted)'; this.style.backgroundColor='transparent'">
        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
    </div>
    
    <!-- Toggle button -->
    <button class="entry-toggle-btn" onclick="toggleEntryContentLazy('${worldBookId}', '${versionId}', '${entry.id}')"
                        style="background: none; border: none; cursor: pointer; font-size: 14px; color: var(--text-muted); padding: 4px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <span class="arrow-icon arrow-right"></span>
                </button>
                
                <!-- Enable entry toggle -->
                <label style="display: flex; align-items: center; cursor: pointer; margin-right: 8px;">
                    <input type="checkbox" ${!entry.disable ? 'checked' : ''} 
                        onchange="toggleEntryEnabled('${worldBookId}', '${versionId}', '${entry.id}')"
                        style="width: 0; height: 0; opacity: 0; margin: 0;">
                    <div class="toggle-switch" style="width: 36px; height: 16px; background: ${!entry.disable ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: 10px; position: relative; transition: all 0.2s ease;">
                        <div style="width: 10px; height: 10px; background: white; border-radius: 50%; position: absolute; top: 3px; left: ${!entry.disable ? '14px' : '4px'}; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    </div>
                </label>
                
                <!-- Comment -->
                <div class="field-group" style="margin-bottom: 0; flex: 1; margin-right: 8px;">
                    <input type="text" class="field-input compact-input" 
                        placeholder="${t('entryTitle')}"
                        value="${entry.comment || ''}"
                        style="font-weight: 500;"
                        onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'comment', this.value)">
                </div>
                
                <!-- Trigger mode -->
                <div class="field-group" style="margin-bottom: 0; margin-right: 8px;">
                    <select class="field-input compact-input" style="width: 55px;" onchange="updateEntryModeFromSelect('${worldBookId}', '${versionId}', '${entry.id}', this.value)">
                        <option value="selective" ${entry.selective && !entry.constant && !entry.vectorized ? 'selected' : ''}>🟢</option>
                        <option value="constant" ${entry.constant ? 'selected' : ''}>🔵</option>
                        <option value="vectorized" ${entry.vectorized ? 'selected' : ''}>🔗</option>
                    </select>
                </div>
                
              <!-- Insertion position -->
                <div class="field-group" style="margin-bottom: 0; margin-right: 8px;">
                    <select class="field-input compact-input" style="width: 150px;" onchange="updateWorldBookEntryPosition('${worldBookId}', '${versionId}', '${entry.id}', parseInt(this.value))">
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
<div class="field-group" style="margin-bottom: 0; margin-right: 8px;">
    <input type="number" class="field-input compact-input" value="${entry.depth || 4}" min="0" max="999" style="width: 60px; ${entry.position !== 4 ? 'opacity: 0;' : ''}" 
        id="depth-${entry.id}"
        ${entry.position !== 4 ? 'disabled' : ''}
        onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'depth', parseInt(this.value))">
</div>

                <!-- Order -->
                <div class="field-group" style="margin-bottom: 0; margin-right: 8px;">
                    <input type="number" class="field-input compact-input" value="${entry.order || 100}" min="0" max="999" style="width: 60px;"
                        onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'order', parseInt(this.value))">
                </div>

                <!-- Probability -->
                <div class="field-group" style="margin-bottom: 0; margin-right: 8px;">
                    <input type="number" class="field-input compact-input" value="${entry.probability !== undefined ? entry.probability : 100}" min="0" max="100" style="width: 60px;"
                        onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'probability', this.value === '' ? 0 : parseInt(this.value))">
                </div>
                
                <!-- Copy entry button -->
                <button class="copy-btn" onclick="copyWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}')" 
                        title="${t('copyEntry')}">
                    ${IconManager.copy({width: 14, height: 14})}
                </button>

                <!-- Delete entry button -->
                <button class="delete-btn" onclick="confirmRemoveWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}')" 
                        title="${t('deleteEntry')}">
                    ${IconManager.delete({width: 14, height: 14})}
                </button>
            </div>

            <!-- Entry content area (initially empty) -->
            <div class="entry-content" id="entry-content-${entry.id}" style="padding: 0 10px; display: none;">
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
                <button class="loveydovey-add-btn" onclick="addWorldBookEntry('${worldBook.id}', '${version.id}')" style="margin-top: 16px;">
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
<div style="display: grid; grid-template-columns: 1fr 120px; gap: 8px; margin-bottom: 8px;">
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('primaryKeywords')}</label>
        <input type="text" class="field-input compact-input" 
            placeholder="${t('keywordsPlaceholder')}"
            value="${entry.key.join(', ')}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'key', this.value)">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('keywordLogic')}</label>
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
            <div class="field-group" style="margin-bottom: 8px;">
                <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('secondaryFilters')}</label>
                <input type="text" class="field-input compact-input" 
                    placeholder="${t('secondaryKeysPlaceholder')}"
                    value="${entry.keysecondary.join(', ')}"
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'keysecondary', this.value)">
            </div>
            
            <!-- Content -->
            <div class="field-group" style="margin-bottom: 8px;">
                <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em; display: flex; justify-content: space-between; align-items: center;">
                    <span>
                        ${t('entryContentLabel')}
                        <span class="field-stats" data-target="worldbook-${worldBookId}-${versionId}-${entry.id}" style="margin-left: 8px; font-size: 0.8em; color: var(--text-muted);">${entry.content ? entry.content.length : 0} ${t('chars')} / ${entry.content ? countTokens(entry.content) : 0} ${t('tokens')}</span>

                        <button class="fullscreen-btn" onclick="openFullscreenEditor('worldbook-${worldBookId}-${versionId}-${entry.id}', '${t('entryContent')}')" 
                                title="${t('fullscreenEditor')}" style="margin-left: 6px;">⛶</button>
                    </span>
                    <span style="font-size: 0.8em; color: var(--text-muted);">(UID: ${entry.uid || 0})</span>
                </label>
               <textarea class="field-input scrollable" id="worldbook-${worldBookId}-${versionId}-${entry.id}" 
    placeholder="${t('entryContentPlaceholder')}"
    style="min-height: 200px; resize: vertical;"
    oninput="updateFieldStats('worldbook-${worldBookId}-${versionId}-${entry.id}'); updateWorldBookEntryValue('${worldBookId}', '${versionId}', '${entry.id}', 'content', this.value);">${entry.content}</textarea>
            </div>
        </div>
        
<!-- Advanced settings -->
<details style="margin-bottom: 0;">
    <summary style="cursor: pointer; color: var(--text-color); font-weight: 500; margin-bottom: 8px; font-size: 0.9em; display: flex; align-items: center; gap: 6px; list-style: none;">
        ${IconManager.chevronRight({width: 12, height: 12, style: 'transition: transform 0.2s ease;'})}
        ${t('advancedSettings')}
    </summary>
            <div style="padding: 8px 0; border-top: 1px solid var(--border-color);">
                
<!-- Group and automation settings -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px; align-items: end;">
    <div class="field-group" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label class="field-label" style="margin-bottom: 0; font-size: 0.85em;">${t('includeGroups')}</label>
            <div style="display: flex; align-items: center; gap: 6px; background: var(--header-bg); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="font-size: 0.75em; color: var(--text-muted); white-space: nowrap;">${t('groupPriority')}</span>
                <input type="checkbox" ${entry.groupOverride ? 'checked' : ''} 
                    id="group-override-${entry.id}"
                    style="margin: 0;"
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'groupOverride', this.checked)">
            </div>
        </div>
        <input type="text" class="field-input compact-input" value="${entry.group || ''}" 
            placeholder="${t('groupPlaceholder')}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'group', this.value)">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <div style="height: 24px; display: flex; align-items: center; margin-bottom: 4px;">
            <label class="field-label" style="margin-bottom: 0; font-size: 0.8em;">${t('automationId')}</label>
        </div>
        <input type="text" class="field-input compact-input" value="${entry.automationId || ''}" 
            placeholder="${t('automationIdPlaceholder')}"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'automationId', this.value)">
    </div>
</div>

                <!-- Triggers 觸發時機設定 -->
                <div style="margin-bottom: 12px;">
                    <div class="field-group" style="margin-bottom: 0;">
                        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('filterToGenerationTriggers')}</label>
                        <div class="triggers-input-container" style="position: relative;">
                            <div class="field-input compact-input triggers-display" 
                                 style="min-height: 32px; cursor: pointer; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 4px 8px;"
                                 onclick="toggleTriggersDropdown('${worldBookId}', '${versionId}', '${entry.id}')"
                                 id="triggers-display-${entry.id}">
                                ${(entry.triggers || []).map(trigger => `
                                    <span class="tag-base tag-sm">
                                        ${t('trigger_' + trigger)}
                                        <button onclick="event.stopPropagation(); removeWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', '${trigger}')" class="tag-remove-btn">×</button>
                                    </span>
                                `).join('')}
                                ${(!entry.triggers || entry.triggers.length === 0) ? `<span style="color: var(--text-muted); font-size: 0.9em;">${t('clickToSelectTriggers')}</span>` : ''}
                            </div>
                            <div class="triggers-dropdown" id="triggers-dropdown-${entry.id}" 
                                 style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; padding: 8px;">
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('normal') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'normal', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_normal')}</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('continue') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'continue', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_continue')}</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('impersonate') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'impersonate', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_impersonate')}</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('swipe') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'swipe', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_swipe')}</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('regenerate') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'regenerate', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_regenerate')}</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; font-size: 0.85em;">
                                    <input type="checkbox" ${(entry.triggers || []).includes('quiet') ? 'checked' : ''} 
                                           onchange="toggleWorldBookTrigger('${worldBookId}', '${versionId}', '${entry.id}', 'quiet', this.checked)">
                                    <span style="margin-left: 6px;">${t('trigger_quiet')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

               <!-- Three-value dropdown settings -->
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('caseSensitive')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'caseSensitive', this.value)">
            <option value="null" ${entry.caseSensitive === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.caseSensitive === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.caseSensitive === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('matchWholeWords')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'matchWholeWords', this.value)">
            <option value="null" ${entry.matchWholeWords === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.matchWholeWords === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.matchWholeWords === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.85em;">${t('useGroupScoring')}</label>
        <select class="field-input compact-input" 
            onchange="updateWorldBookEntryAdvanced('${worldBookId}', '${versionId}', '${entry.id}', 'useGroupScoring', this.value)">
            <option value="null" ${entry.useGroupScoring === null ? 'selected' : ''}>${t('useGlobalSetting')}</option>
            <option value="true" ${entry.useGroupScoring === true ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${entry.useGroupScoring === false ? 'selected' : ''}>${t('no')}</option>
        </select>
    </div>
</div>

                <!-- Recursion control area -->
<div style="display: grid; grid-template-columns: 1fr 300px; gap: 12px; margin-bottom: 12px; align-items: start;">
    <!-- Left: Recursion control options -->
    <div>
        <div style="font-size: 0.85em; font-weight: 500; color: var(--text-color); margin-bottom: 8px;">${t('recursionControl')}</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                <input type="checkbox" ${entry.excludeRecursion ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'excludeRecursion', this.checked)">
                <span style="margin-left: 6px;">${t('noRecursion')}</span>
            </label>
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                <input type="checkbox" ${entry.preventRecursion ? 'checked' : ''} 
                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'preventRecursion', this.checked)">
                <span style="margin-left: 6px;">${t('preventRecursion')}</span>
            </label>
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                <input type="checkbox" ${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? 'checked' : ''} 
                    id="delay-checkbox-${entry.id}"
                    onchange="toggleDelayUntilRecursion('${worldBookId}', '${versionId}', '${entry.id}', this.checked)">
                <span style="margin-left: 6px;">${t('delayRecursion')}</span>
            </label>
        </div>
    </div>
    
    <!-- Right: Value settings -->
    <div style="justify-self: end;">
<div style="display: grid; grid-template-columns: 150px 150px 150px; gap: 8px; margin-bottom: 8px;">
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('stickyValue')}</label>
        <input type="number" class="field-input compact-input" value="${entry.sticky || 0}" 
            style="width: 150px;"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'sticky', parseInt(this.value))">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('cooldownValue')}</label>
        <input type="number" class="field-input compact-input" value="${entry.cooldown || 0}" 
            style="width: 150px;"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'cooldown', parseInt(this.value))">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('groupWeight')}</label>
        <input type="number" class="field-input compact-input" value="${entry.groupWeight || 100}" min="1" max="100"
            style="width: 150px;"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'groupWeight', parseInt(this.value))">
    </div>
</div>
<div style="display: grid; grid-template-columns: 150px 150px 150px; gap: 8px;">
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('recursionLevel')}</label>
        <input type="number" class="field-input compact-input" 
            id="delay-value-${entry.id}"
            value="${entry.delayUntilRecursion || 1}" 
            min="1" max="999" 
            style="width: 150px; ${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? '' : 'opacity: 0.5;'}"
            ${entry.delayUntilRecursion && entry.delayUntilRecursion > 0 ? '' : 'disabled'}
            onchange="updateDelayUntilRecursionValue('${worldBookId}', '${versionId}', '${entry.id}', parseInt(this.value))">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('delayValue')}</label>
        <input type="number" class="field-input compact-input" value="${entry.delay || 0}" 
            style="width: 150px;"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'delay', parseInt(this.value))">
    </div>
    <div class="field-group" style="margin-bottom: 0;">
        <label class="field-label" style="margin-bottom: 4px; font-size: 0.8em;">${t('scanDepth')}</label>
        <input type="number" class="field-input compact-input" value="${entry.scanDepth || ''}" 
            placeholder="${t('scanDepthplaceholder')}"
            style="width: 150px;"
            onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'scanDepth', this.value ? parseInt(this.value) : null)">
    </div>
</div>
    </div>
</div>

                <!-- 額外匹配來源區域 -->
                <details style="margin-top: 12px;">
                    <summary style="cursor: pointer; color: var(--text-color); font-weight: 500; margin-bottom: 8px; font-size: 0.9em; display: flex; align-items: center; gap: 6px; list-style: none;">
                        ${IconManager.chevronRight({width: 12, height: 12, style: 'transition: transform 0.2s ease;'})}
                        ${t('additionalMatchSources')}
                    </summary>
                    <div style="padding: 8px 0; border-top: 1px solid var(--border-color);">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            <!-- 左邊3項 -->
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchCharacterDescription ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterDescription', this.checked)">
                                <span style="margin-left: 6px;">${t('matchCharacterDescription')}</span>
                            </label>
                            <!-- 右邊3項 -->
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchPersonaDescription ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchPersonaDescription', this.checked)">
                                <span style="margin-left: 6px;">${t('matchPersonaDescription')}</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchCharacterPersonality ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterPersonality', this.checked)">
                                <span style="margin-left: 6px;">${t('matchCharacterPersonality')}</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchCharacterDepthPrompt ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCharacterDepthPrompt', this.checked)">
                                <span style="margin-left: 6px;">${t('matchCharacterDepthPrompt')}</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchScenario ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchScenario', this.checked)">
                                <span style="margin-left: 6px;">${t('matchScenario')}</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" ${entry.matchCreatorNotes ? 'checked' : ''} 
                                    onchange="updateWorldBookEntry('${worldBookId}', '${versionId}', '${entry.id}', 'matchCreatorNotes', this.checked)">
                                <span style="margin-left: 6px;">${t('matchCreatorNotes')}</span>
                            </label>
                        </div>
                    </div>
                </details>
        </details>
    `;
}

// 延遲載入的條目內容切換函數
function toggleEntryContentLazy(worldBookId, versionId, entryId, event = null) {
    let content, toggleBtn;
    
    if (event) {
        // 智慧查找：在點擊元素的版本容器內查找
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#entry-content-${entryId}`);
            toggleBtn = versionContainer.querySelector(`[onclick*="toggleEntryContentLazy('${worldBookId}', '${versionId}', '${entryId}')"]`);
        }
    }
    
    // 如果智慧查找失敗，使用原邏輯
    if (!content || !toggleBtn) {
        content = document.getElementById(`entry-content-${entryId}`);
        toggleBtn = document.querySelector(`[onclick*="toggleEntryContentLazy('${worldBookId}', '${versionId}', '${entryId}')"]`);
    }
    
    if (!content || !toggleBtn) return;
    
    const isExpanded = content.style.display !== 'none';
    
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
            displayElement.innerHTML = `<span style="color: var(--text-muted); font-size: 0.9em;">${t('clickToSelectTriggers')}</span>`;
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
                    // 使用當前容器重新排序
                    reorderWorldBookEntriesFromContainer(container, worldBookId, versionId);
                    
                    // 立即恢復折疊狀態
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