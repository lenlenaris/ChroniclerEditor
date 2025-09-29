class PresetRenderer {
    // 主要版本內容渲染函數
static renderPresetVersionContent(preset, version) {
    const content = `
        <div class="preset-version-content">
            <div class="preset-header">
                <div class="preset-controls-bar" style="display: flex; gap: 10px; justify-content: flex-start; align-items: center;">
                    <button class="version-panel-btn hover-primary ${viewMode === 'compare' ? 'disabled' : ''}" 
                            onclick="${viewMode === 'compare' ? 'return false;' : `PresetRenderer.togglePreviewMode('${version.id}')`}" 
                            title="${viewMode === 'compare' ? t('previewDisabledInCompare') : ''}"
                            style="display: flex; align-items: center; gap: 6px; ${viewMode === 'compare' ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        ${IconManager.eye({width: 14, height: 14})}
                        <span id="preview-btn-text-${version.id}">${t('previewMode')}</span>
                    </button>
                    <button class="version-panel-btn hover-primary" onclick="PresetRenderer.expandAllPrompts('${version.id}')" style="display: flex; align-items: center; gap: 6px;">
                        ${IconManager.expandAll({width: 14, height: 14})}
                        <span>${t('expandAll')}</span>
                    </button>
                    <button class="version-panel-btn hover-primary" onclick="PresetRenderer.collapseAllPrompts('${version.id}')" style="display: flex; align-items: center; gap: 6px;">
                        ${IconManager.collapseAll({width: 14, height: 14})}
                        <span>${t('collapseAll')}</span>
                    </button>
                </div>
            </div>
            
            <!-- 只顯示可編輯條目列表 (character_id: 100001) -->
            <div class="preset-prompts-container">
                <div id="editable-prompts-list-${version.id}" class="prompts-list">
                    ${this.renderPromptsList(preset, version, 100001)}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        this.enablePromptsDragSort(); // 👈 不再傳遞參數
        console.log(`🎯 已觸發 preset 的可編輯條目拖曳排序初始化`);

        updateAllPageStats();
        updateVersionStats('preset', preset.id, version.id);
    }, 200);
    
    return content;
}
    
static renderPromptsList(preset, version, characterId) {
    // 從 prompt_order 中找到對應 character_id 的配置
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (!orderConfig) {
        return `<div class="empty-state">${t('noPromptsConfigured')}</div>`;
    }
    
    // 按照 order 順序顯示條目
    const orderedPrompts = orderConfig.order.map(orderItem => {
        const prompt = version.prompts?.find(p => p.identifier === orderItem.identifier);
        if (!prompt) return null;
        
        return {
            ...prompt,
            enabled: orderItem.enabled
        };
    }).filter(Boolean);
    
    if (orderedPrompts.length === 0) {
        return `<div class="empty-state">${t('noPromptsFound')}</div>`;
    }
    
    return `

        <!-- 條目列表容器 - 確保有正確的 data 屬性和類別 -->
        <div class="prompts-entries-container" data-character-id="${characterId}" data-preset-id="${preset.id}" data-version-id="${version.id}">
            ${orderedPrompts.map(prompt => this.renderPromptEntry(preset.id, version.id, prompt, characterId)).join('')}
        </div>
    `;
}
    
    // 渲染單個提示詞條目
    static renderPromptEntry(presetId, versionId, prompt, characterId) {
    const isMarker = prompt.marker === true;
    const canEditContent = !isMarker;
    
    // 特殊標記條目：Chat Examples 和 Chat History 只能編輯 enabled
    const isSpecialMarker = prompt.identifier === 'dialogueExamples' || prompt.identifier === 'chatHistory';
    const canEditName = !isSpecialMarker;
    const canEditRole = !isSpecialMarker;
    const canEditPosition = !isSpecialMarker;
        
        return `
<div class="entry-panel sortable-item preset-entry-panel ${!prompt.enabled ? 'preset-entry-disabled' : ''}" data-prompt-identifier="${prompt.identifier}">
<!-- 條目標題列 - 展開前顯示：拖曳、展開按鈕、開關、名字、role、@深度 -->
<div class="entry-header preset-entry-header">
    <!-- 拖曳控制 -->
    <div class="drag-handle custom-field-drag-handle">
        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
    </div>
    
    <!-- 展開按鈕 -->
    <button class="entry-toggle-btn wb-toggle-btn" onclick="PresetRenderer.togglePromptContent('${prompt.identifier}')">
        <span class="arrow-icon arrow-right"></span>
    </button>
    
    <!-- 開關 -->
    <label class="wb-toggle-wrapper">
        <input type="checkbox" ${prompt.enabled ? 'checked' : ''} 
            onchange="PresetRenderer.togglePromptEnabled('${presetId}', '${versionId}', '${prompt.identifier}', ${characterId}, this.checked)"
            class="wb-toggle-hidden-input">
        <div class="toggle-switch wb-toggle-switch ${prompt.enabled ? 'wb-toggle-switch-enabled' : 'wb-toggle-switch-disabled'}">
            <div class="wb-toggle-circle ${prompt.enabled ? 'wb-toggle-circle-enabled' : 'wb-toggle-circle-disabled'}"></div>
        </div>
    </label>
    
    <!-- 名稱 -->
    <div class="preset-prompt-name" style="flex: 1;">
        <input type="text" class="field-input compact-input" 
            placeholder="${t('promptName')}"
            value="${prompt.name || ''}"
            ${!canEditName ? 'readonly' : ''}
            style="${!canEditName ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
            onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'name', this.value)">
    </div>

<!-- 深度顯示（預留空間，沒有設定時顯示空白） -->
<div class="preset-prompt-depth-indicator" id="depth-indicator-${prompt.identifier}" 
    style="min-width: 40px; text-align: center; color: var(--text-muted); font-size: 0.9em;">
    ${prompt.injection_position === 1 && prompt.injection_depth ? `@${prompt.injection_depth}` : ''}
</div>
    
    <!-- 角色類型 -->
    <div class="preset-prompt-role" style="min-width: 80px;">
        <select class="field-input compact-input" 
            ${!canEditRole ? 'disabled' : ''}
            style="${!canEditRole ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
            onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'role', this.value)">
            <option value="system" ${prompt.role === 'system' ? 'selected' : ''}>${t('system')}</option>
            <option value="user" ${prompt.role === 'user' ? 'selected' : ''}>${t('user')}</option>
            <option value="assistant" ${prompt.role === 'assistant' ? 'selected' : ''}>${t('assistant')}</option>
        </select>
    </div>
    

</div>
    
<!-- 條目內容區域 -->
<div class="entry-content preset-entry-content" id="prompt-content-${prompt.identifier}" style="display: none;">
<!-- 進階設定區域 -->
<div class="preset-advanced-settings" style="margin-bottom: 15px; padding: 0px; background: var(--bg-secondary); border-radius: 6px;">
    <div style="display: flex; gap: 15px; align-items: end; flex-wrap: wrap;">
<!-- 位置類型 -->
<div>
    <label class="field-label" style="margin-bottom: 5px; display: block;">${t('position')}</label>
    <select class="field-input compact-input" 
        style="max-width: 120px; ${!canEditPosition ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
        ${!canEditPosition ? 'disabled' : ''}
        onchange="PresetRenderer.updatePromptPosition('${presetId}', '${versionId}', '${prompt.identifier}', parseInt(this.value))"
        id="position-select-${prompt.identifier}">
        <option value="0" ${(prompt.injection_position || 0) === 0 ? 'selected' : ''}>${t('relativePosition')}</option>
        <option value="1" ${prompt.injection_position === 1 ? 'selected' : ''}>${t('chatPromptManagement')}</option>
    </select>
</div>
        
<!-- 深度（僅在絕對位置時顯示） -->
<div id="absolute-controls-${prompt.identifier}" style="${prompt.injection_position === 1 ? '' : 'display: none;'}">
    <label class="field-label" style="margin-bottom: 5px; display: block;">${t('depth')}</label>
    <input type="number" class="field-input compact-input" 
        style="width: 80px; ${!canEditPosition ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
        value="${prompt.injection_depth || 4}" 
        min="0" max="999"
        ${!canEditPosition ? 'readonly' : ''}
        placeholder="${t('depth')}"
        onchange="PresetRenderer.updatePromptDepth('${presetId}', '${versionId}', '${prompt.identifier}', parseInt(this.value))">
</div>

<!-- 順序（僅在絕對位置時顯示） -->
<div id="order-field-${prompt.identifier}" style="${prompt.injection_position === 1 ? '' : 'display: none;'}">
    <label class="field-label" style="margin-bottom: 5px; display: block;">${t('order')}</label>
    <input type="number" class="field-input compact-input" 
        style="width: 80px; ${!canEditPosition ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
        value="${prompt.injection_order || 100}" 
        min="1" max="999"
        ${!canEditPosition ? 'readonly' : ''}
        placeholder="${t('order')}"
        onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'injection_order', parseInt(this.value))">
</div>
    </div>
</div>
    
<!-- 內容區域 -->
<div class="field-group">
    ${canEditContent ? `
        <label class="field-label wb-detail-label-flex">
            <span>
                ${t('promptContent')}
                <span class="field-stats wb-detail-stats" data-target="preset-content-${presetId}-${versionId}-${prompt.identifier}">${prompt.content ? prompt.content.length : 0} ${t('chars')} / ${prompt.content ? countTokens(prompt.content) : 0} ${t('tokens')}</span>
            </span>
        </label>
        <textarea class="field-input scrollable" 
            id="preset-content-${presetId}-${versionId}-${prompt.identifier}"
            placeholder="${t('promptContentPlaceholder')}"
            style="min-height: 120px;"
            oninput="updateFieldStats('preset-content-${presetId}-${versionId}-${prompt.identifier}'); PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'content', this.value)">${prompt.content || ''}</textarea>
    ` : `
        <div style="padding: 15px; background: var(--bg-secondary); border-radius: 6px; color: var(--text-muted); font-style: italic; font-size: 0.9em;">
            ${t('markerContentNotEditable')}${t('source')}：${prompt.identifier}
        </div>
    `}
</div>
</div>
</div>
        `;
    }
    
    
    // 展開/收合條目內容
    static togglePromptContent(identifier) {
        const content = document.getElementById(`prompt-content-${identifier}`);
        const toggleBtn = event.target.closest('.entry-toggle-btn');
        
        if (!content || !toggleBtn) return;
        
        const isExpanded = content.style.display !== 'none';
        
        if (isExpanded) {
            content.style.display = 'none';
            toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
        } else {
            content.style.display = 'block';
            toggleBtn.innerHTML = '<span class="arrow-icon arrow-down"></span>';
        }
    }
    
// 切換條目啟用狀態
static togglePromptEnabled(presetId, versionId, identifier, characterId, enabled) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 更新 prompt_order 中的 enabled 狀態
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (orderConfig) {
        const orderItem = orderConfig.order.find(item => item.identifier === identifier);
        if (orderItem) {
            orderItem.enabled = enabled;
            
            // 更新切換開關的視覺狀態
            const toggleSwitch = event.target.closest('.wb-toggle-wrapper').querySelector('.wb-toggle-switch');
            const toggleCircle = toggleSwitch.querySelector('.wb-toggle-circle');
            
            if (enabled) {
                toggleSwitch.classList.add('wb-toggle-switch-enabled');
                toggleSwitch.classList.remove('wb-toggle-switch-disabled');
                toggleCircle.classList.add('wb-toggle-circle-enabled');
                toggleCircle.classList.remove('wb-toggle-circle-disabled');
            } else {
                toggleSwitch.classList.remove('wb-toggle-switch-enabled');
                toggleSwitch.classList.add('wb-toggle-switch-disabled');
                toggleCircle.classList.remove('wb-toggle-circle-enabled');
                toggleCircle.classList.add('wb-toggle-circle-disabled');
            }
            
            // 【新增】更新條目面板的 disabled 樣式
            const entryPanel = event.target.closest('.preset-entry-panel');
            if (entryPanel) {
                if (enabled) {
                    entryPanel.classList.remove('preset-entry-disabled');
                } else {
                    entryPanel.classList.add('preset-entry-disabled');
                }
            }
            
            TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
            markAsChanged();
        }
    }
}

// 更新條目欄位
static updatePromptField(presetId, versionId, identifier, field, value) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 找到對應的 prompt
    const prompt = version.prompts?.find(p => p.identifier === identifier);
    if (prompt) {
        // 更新欄位值
        if (field === 'injection_position') {
            prompt[field] = isNaN(value) ? 0 : value;
        } else {
            prompt[field] = value;
        }
        
        TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
        markAsChanged();

        if (field === 'content') {
            // 立即更新欄位統計
            const textareaId = `preset-content-${presetId}-${versionId}-${identifier}`;
            setTimeout(() => {
                updateFieldStats(textareaId);
            }, 50);
            
            // 更新版本統計
            setTimeout(() => {
                updateVersionStats('preset', presetId, versionId);
                updateAllPageStats();
            }, 250);
        }
    }
}

// 更新位置類型並控制欄位顯示
static updatePromptPosition(presetId, versionId, identifier, position) {
    // 更新 injection_position
    this.updatePromptField(presetId, versionId, identifier, 'injection_position', position);
    
    // 控制深度和順序欄位的顯示/隱藏
    const absoluteControls = document.getElementById(`absolute-controls-${identifier}`);
    const orderField = document.getElementById(`order-field-${identifier}`);
    const depthIndicator = document.getElementById(`depth-indicator-${identifier}`);
    
    if (absoluteControls && orderField && depthIndicator) {
        if (position === 1) {
            // 聊天中的提示詞管理：顯示深度和順序
            absoluteControls.style.display = '';
            orderField.style.display = 'block';
            orderField.style.marginTop = '10px';
            // 更新深度顯示
            const preset = presets.find(p => p.id === presetId);
            const version = preset?.versions.find(v => v.id === versionId);
            const prompt = version?.prompts?.find(p => p.identifier === identifier);
            if (prompt && prompt.injection_depth) {
                depthIndicator.textContent = `@${prompt.injection_depth}`;
                depthIndicator.style.display = '';
            }
        } else {
            // 相對位置：隱藏深度和順序
            absoluteControls.style.display = 'none';
            orderField.style.display = 'none';
            depthIndicator.style.display = 'none';
        }
    }
}

// 更新深度並即時更新顯示
static updatePromptDepth(presetId, versionId, identifier, depth) {
    // 更新深度值
    this.updatePromptField(presetId, versionId, identifier, 'injection_depth', depth);
    
    // 即時更新右側的深度顯示
    const depthIndicator = document.getElementById(`depth-indicator-${identifier}`);
    if (depthIndicator) {
        depthIndicator.textContent = `@${depth}`;
    }
}

// 啟用條目拖拽排序 - 參考 WorldBook 做法
static enablePromptsDragSort() {
    // 找到所有可編輯條目的容器（對比模式下可能有多個）
    const containers = document.querySelectorAll('.prompts-entries-container[data-character-id="100001"]');

    if (containers.length === 0 || typeof Sortable === 'undefined') {
        // console.warn('無法啟用預設提示詞拖拽排序：容器不存在或 Sortable 未載入');
        return;
    }

    // 為每個容器都啟用拖曳
    containers.forEach(container => {
        // 檢查是否已經啟用，有的話先銷毀
        if (container._sortable) {
            container._sortable.destroy();
        }
        
        let savedStates = {}; // 用於保存折疊狀態

        container._sortable = Sortable.create(container, {
            handle: '.drag-handle',
            animation: 150,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            
            draggable: '.preset-entry-panel',
            
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen', 
            dragClass: 'sortable-drag',
            
            onStart: function(evt) {
                document.body.style.cursor = 'grabbing';
                // 記錄當前折疊狀態
                savedStates = PresetRenderer.getCurrentPromptCollapseStates();
            },
            
            onEnd: function(evt) {
                document.body.style.cursor = '';
                
                if (evt.oldIndex !== evt.newIndex) {
                    // 關鍵！從容器的 data 屬性獲取正確的版本信息
                    const presetId = container.dataset.presetId;
                    const versionId = container.dataset.versionId;
                    const characterId = parseInt(container.dataset.characterId);
                    
                    if (presetId && versionId && !isNaN(characterId)) {
                        // ✨ 呼叫既有的重新排序函數，確保 order 陣列會被更新
                        PresetRenderer.reorderPromptsFromContainer(container, presetId, versionId, characterId);
                    }
                    
                    // 立即恢復折疊狀態
                    setTimeout(() => {
                        PresetRenderer.restorePromptCollapseStates(savedStates);
                    }, 10);
                }
            }
        });
    });
}

// 基於特定容器重新排序 - 參考 WorldBook 的 reorderWorldBookEntriesFromContainer
static reorderPromptsFromContainer(container, presetId, versionId, characterId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (!orderConfig) return;
    
    // 從 DOM 獲取新的排序
    const entryPanels = Array.from(container.querySelectorAll('.preset-entry-panel'));
    
    const newOrderItems = [];
    entryPanels.forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const existingOrderItem = orderConfig.order.find(item => item.identifier === identifier);
        if (existingOrderItem) {
            newOrderItems.push(existingOrderItem);
        }
    });
    
    // 確保沒有遺失條目
    if (newOrderItems.length !== orderConfig.order.length) {
        console.warn('⚠️ 條目數量不匹配，使用原順序');
        return;
    }
    
    // 更新順序
    orderConfig.order = newOrderItems;
    
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    console.log(`✅ 已更新 character_id ${characterId} 的提示詞順序`);
}

// 獲取當前提示詞折疊狀態
static getCurrentPromptCollapseStates() {
    const states = {};
    document.querySelectorAll('.preset-entry-panel').forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const content = document.getElementById(`prompt-content-${identifier}`);
        if (content) {
            states[identifier] = content.style.display === 'none';
        }
    });
    return states;
}

// 恢復提示詞折疊狀態
static restorePromptCollapseStates(states) {
    if (!states) return;
    
    Object.keys(states).forEach(identifier => {
        if (states[identifier]) {
            // 查找所有匹配的元素（對比模式下可能有多個）
            const allContentElements = document.querySelectorAll(`#prompt-content-${identifier}`);
            const allToggleBtns = document.querySelectorAll(`[onclick*="togglePromptContent('${identifier}')"]`);
            
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

// 自動初始化拖拽排序（只針對可編輯條目）
static initializeDragSort(presetId, versionId) {
    setTimeout(() => {
        // 只為可編輯條目啟用拖拽
        this.enablePromptsDragSort(presetId, versionId, 100001);
        console.log(`🎯 已初始化 preset ${presetId} version ${versionId} 的拖拽排序`);
    }, 200);
}

// 銷毀拖拽實例（只需要處理可編輯條目）
static destroyDragSort(versionId) {
    const selector = `[data-character-id="100001"]`;
    DragSortManager.destroySortable(selector);
}

// 重新排序提示詞
static reorderPrompts(presetId, versionId, characterId, container) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (!orderConfig) return;
    
    // 從DOM獲取新的排序
    const entryPanels = Array.from(container.querySelectorAll('.preset-entry-panel'));
    const newOrder = [];
    
    entryPanels.forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const existingOrderItem = orderConfig.order.find(item => item.identifier === identifier);
        
        if (existingOrderItem) {
            newOrder.push(existingOrderItem);
        }
    });
    
    // 確保沒有遺失條目
    if (newOrder.length !== orderConfig.order.length) {
        console.warn('⚠️ 條目數量不匹配，使用原順序');
        return;
    }
    
    // 更新順序
    orderConfig.order = newOrder;
    
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
}

// 獲取當前提示詞折疊狀態
static getCurrentPromptCollapseStates() {
    const states = {};
    document.querySelectorAll('.preset-entry-panel').forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const content = document.getElementById(`prompt-content-${identifier}`);
        if (content) {
            states[identifier] = content.style.display === 'none';
        }
    });
    return states;
}

// 恢復提示詞折疊狀態
static restorePromptCollapseStates(states) {
    if (!states) return;
    
    Object.keys(states).forEach(identifier => {
        if (states[identifier]) {
            // 查找所有匹配的元素（對比模式下可能有多個）
            const allContentElements = document.querySelectorAll(`#prompt-content-${identifier}`);
            const allToggleBtns = document.querySelectorAll(`[onclick*="togglePromptContent('${identifier}')"]`);
            
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

// 展開所有提示詞條目
static expandAllPrompts(versionId) {
    console.log('🔍 展開全部被觸發，versionId:', versionId);
    
    // 修正選擇器：直接查找有該 versionId 的容器
    const container = document.querySelector(`.prompts-entries-container[data-version-id="${versionId}"]`);
    if (!container) {
        console.warn('❌ 找不到容器，versionId:', versionId);
    }
    
    const entryPanels = container.querySelectorAll('.preset-entry-panel');
    
    entryPanels.forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const content = document.getElementById(`prompt-content-${identifier}`);
        const toggleBtn = panel.querySelector('.entry-toggle-btn');
        
        if (content && toggleBtn) {
            content.style.display = 'block';
            toggleBtn.innerHTML = '<span class="arrow-icon arrow-down"></span>';
        }
    });
}

// 摺疊所有提示詞條目
static collapseAllPrompts(versionId) {
    // 修正選擇器：直接查找有該 versionId 的容器
    const container = document.querySelector(`.prompts-entries-container[data-version-id="${versionId}"]`);
    if (!container) {
        console.warn('❌ 找不到容器，versionId:', versionId);
        return;
    }
    const entryPanels = container.querySelectorAll('.preset-entry-panel');
    entryPanels.forEach(panel => {
        const identifier = panel.dataset.promptIdentifier;
        const content = document.getElementById(`prompt-content-${identifier}`);
        const toggleBtn = panel.querySelector('.entry-toggle-btn');
        
        if (content && toggleBtn) {
            content.style.display = 'none';
            toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
        }
    });
}

// 切換預覽模式
static togglePreviewMode(versionId) {
    // 檢查是否已經在預覽模式
    const headerBar = document.querySelector('.character-header-bar');
    const isPreviewMode = headerBar && headerBar.classList.contains('preview-mode');
    
    if (isPreviewMode) {
        // 退出預覽模式
        this.exitPreviewMode();
    } else {
        // 進入預覽模式
        this.enterPreviewMode(versionId);
    }
}

// 進入預覽模式
static enterPreviewMode(versionId) {
    const presetData = this.getCurrentPresetData(versionId);
    if (!presetData) return;
    
    const { preset, version } = presetData;
    
    // 找到主要容器
    const versionsContainer = document.querySelector('.versions-container');
    const headerBar = document.querySelector('.character-header-bar');
    
    if (!versionsContainer || !headerBar) return;
    
    // 標記為預覽模式
    headerBar.classList.remove('single-mode', 'compare-mode');
    headerBar.classList.add('preview-mode');
    versionsContainer.classList.remove('single-view', 'compare-view');
    versionsContainer.classList.add('preview-view');
    
    // 創建預覽面板和編輯面板（獨立容器）
    const previewPanel = this.renderPreviewPanel(preset, version);
    const editPanel = ContentRenderer.renderVersionPanel(preset, version, 'preset');
    
    // 替換為並排的獨立容器
    versionsContainer.innerHTML = `
        ${previewPanel}
        ${editPanel}
    `;
    
    // 更新所有預覽按鈕的狀態
    this.updateAllPreviewButtons(true);
    
// 重新初始化編輯功能，並確保預覽內容正確渲染
setTimeout(() => {
    this.enablePromptsDragSort(preset.id, version.id, 100001);
    updateAllPageStats();
    updateVersionStats('preset', preset.id, version.id);
    
// 強制重新整理預覽內容，確保首次顯示正確
this.refreshPreview(version.id);

// 初始化字體設置
this.initPreviewFont(version.id);

// 更新統計
this.updatePreviewStats(version.id);
}, 200);
}

// 退出預覽模式
static exitPreviewMode() {
    const versionsContainer = document.querySelector('.versions-container');
    const headerBar = document.querySelector('.character-header-bar');
    
    if (!versionsContainer || !headerBar) return;
    
    // 恢復為單一模式
    headerBar.classList.remove('preview-mode', 'compare-mode');
    headerBar.classList.add('single-mode');
    versionsContainer.classList.remove('preview-view', 'compare-view');
    versionsContainer.classList.add('single-view');
    
    // 恢復原始的單版本布局
    const currentItem = ItemManager.getCurrentItem();
    const currentVersionId = ItemManager.getCurrentVersionId();
    
    if (currentItem && currentVersionId) {
        const version = currentItem.versions.find(v => v.id === currentVersionId);
        if (version) {
            const versionHTML = ContentRenderer.renderVersionPanel(currentItem, version, 'preset');
            versionsContainer.innerHTML = versionHTML;
        }
    }
    
    // 更新所有預覽按鈕的狀態
    this.updateAllPreviewButtons(false);
    
    // 重新初始化功能
    setTimeout(() => {
        if (currentItem && currentVersionId) {
            this.enablePromptsDragSort(currentItem.id, currentVersionId, 100001);
            updateAllPageStats();
            updateVersionStats('preset', currentItem.id, currentVersionId);
        }
    }, 200);
}

// 渲染預覽面板（獨立的 version-panel）
static renderPreviewPanel(preset, version) {
    const previewContent = this.generatePreviewContent(version.id);
    
return `
    <div class="version-panel preset-preview-panel">
        <div class="version-header-container">
            <div class="version-header">
                <input type="text" class="version-title title-font" value="${t('promptPreview')} - ${version.name}" readonly 
                    style="background: var(--bg-secondary); color: var(--text-muted);">
                <div class="version-controls">
                    <button class="version-panel-btn hover-primary" onclick="PresetRenderer.togglePreviewFont('${version.id}', 'monospace')" 
                            id="font-mono-btn-${version.id}" title="${t('monospaceFont')}" style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-family: monospace; font-weight: bold;">Aa</span>
                    </button>
                    <button class="version-panel-btn hover-primary" onclick="PresetRenderer.togglePreviewFont('${version.id}', 'serif')" 
                            id="font-serif-btn-${version.id}" title="${t('serifFont')}" style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-family: serif; font-weight: bold;">Aa</span>
                    </button>
                    <button class="version-panel-btn hover-primary" onclick="PresetRenderer.refreshPreview('${version.id}')" style="display: flex; align-items: center; gap: 6px;">
                        ${IconManager.refresh({width: 14, height: 14})}
                        <span>${t('refresh')}</span>
                    </button>
                </div>
            </div>
            <div class="version-stats preset-preview-stats" id="preview-stats-${version.id}">
                <span class="stats-text">${t('calculating')}</span>
            </div>
            <div class="version-divider"></div>
        </div>
        
        <div class="preset-preview-content-wrapper">
            <div class="preset-preview-content" id="preview-content-${version.id}">
                ${previewContent}
            </div>
        </div>
    </div>
`;
}

// 計算並更新預覽統計
static updatePreviewStats(versionId) {
    const presetData = this.getCurrentPresetData(versionId);
    if (!presetData) return;
    
    const { preset, version } = presetData;
    
    // 找到可編輯條目的配置
    const orderConfig = version.prompt_order?.find(config => config.character_id === 100001);
    if (!orderConfig || !orderConfig.order) return;
    
    // 收集所有啟用的內容
    let allContent = '';
    let enabledCount = 0;
    
    orderConfig.order.forEach(orderItem => {
        if (!orderItem.enabled) return;
        
        const prompt = version.prompts?.find(p => p.identifier === orderItem.identifier);
        if (!prompt) return;
        
        enabledCount++;
        
        // 只計算非 marker 條目的內容
        if (!prompt.marker && prompt.content && prompt.content.trim()) {
            allContent += prompt.content.trim() + '\n\n';
        }
    });
    
    // 計算統計
    const chars = allContent.length;
    const tokens = countTokens(allContent);
    
    // 更新顯示
    const statsElement = document.getElementById(`preview-stats-${versionId}`);
    if (statsElement) {
        const statsText = statsElement.querySelector('.stats-text');
        if (statsText) {
            statsText.textContent = `${enabledCount} ${t('enabledPrompts')} / ${chars} ${t('chars')} / ${tokens} ${t('tokens')}`;
        }
    }
}

// 切換預覽字體
static togglePreviewFont(versionId, fontType) {
    const previewContent = document.getElementById(`preview-content-${versionId}`);
    if (!previewContent) return;
    
    // 移除所有字體 class
    previewContent.classList.remove('font-monospace', 'font-serif');
    
    // 移除所有按鈕的激活狀態
    const monoBtn = document.getElementById(`font-mono-btn-${versionId}`);
    const serifBtn = document.getElementById(`font-serif-btn-${versionId}`);
    
    if (monoBtn) monoBtn.classList.remove('active');
    if (serifBtn) serifBtn.classList.remove('active');
    
    // 應用選擇的字體
    if (fontType === 'monospace') {
        previewContent.classList.add('font-monospace');
        if (monoBtn) monoBtn.classList.add('active');
    } else if (fontType === 'serif') {
        previewContent.classList.add('font-serif');  
        if (serifBtn) serifBtn.classList.add('active');
    }
    
    // 儲存用戶偏好
    localStorage.setItem('previewFontType', fontType);
}

// 初始化字體設置
static initPreviewFont(versionId) {
    const savedFont = localStorage.getItem('previewFontType') || 'monospace';
    this.togglePreviewFont(versionId, savedFont);
}

// 更新所有預覽按鈕狀態
static updateAllPreviewButtons(isPreviewMode) {
    const buttons = document.querySelectorAll('[id^="preview-btn-text-"]');
    buttons.forEach(btn => {
        btn.textContent = isPreviewMode ? t('exitPreview') : t('previewMode');
    });
}

// 輔助方法：獲取當前 preset ID  
static getCurrentPresetId() {
    const currentItem = ItemManager.getCurrentItem();
    return currentItem ? currentItem.id : 'current';
}

// 生成預覽內容
static generatePreviewContent(versionId) {
    // 獲取當前的 preset 和 version 數據
    const presetData = this.getCurrentPresetData(versionId);
    if (!presetData) {
        return `<div class="preset-preview-source">${t('noDataAvailable')}</div>`;
    }
    
    const { preset, version } = presetData;
    
    // 找到可編輯條目的配置 (character_id: 100001)
    const orderConfig = version.prompt_order?.find(config => config.character_id === 100001);
    if (!orderConfig || !orderConfig.order) {
        return `<div class="preset-preview-source">${t('noPromptsConfigured')}</div>`;
    }
    
    // 按順序處理每個條目
    const contentParts = [];
    
    orderConfig.order.forEach(orderItem => {
        // 只處理啟用的條目
        if (!orderItem.enabled) return;
        
        const prompt = version.prompts?.find(p => p.identifier === orderItem.identifier);
        if (!prompt) return;
        
        const isMarker = prompt.marker === true;
        
        if (isMarker) {
            // Marker 條目顯示來源標記
            contentParts.push(`<div class="preset-preview-source">*${t('source')}：${prompt.name}*</div>`);
        } else {
            // 一般條目顯示內容
            if (prompt.content && prompt.content.trim()) {
                // HTML 轉義，讓 XML 標籤能正確顯示
                const escapedContent = this.escapeHtml(prompt.content.trim());
                contentParts.push(escapedContent);
            }
        }
    });
    
    if (contentParts.length === 0) {
        return `<div class="preset-preview-source">${t('noEnabledPrompts')}</div>`;
    }
    
    // 將所有內容用雙換行連接（形成段落分隔）
    return contentParts.join('\n\n');
}

// 獲取當前 preset 數據的輔助方法
static getCurrentPresetData(versionId) {
    // 方法1: 從 DOM 中的 data 屬性獲取
    const promptsContainer = document.querySelector(`[data-version-id="${versionId}"].prompts-entries-container`);
    if (promptsContainer) {
        const presetId = promptsContainer.dataset.presetId;
        const foundVersionId = promptsContainer.dataset.versionId;
        
        // 從全局變數中找到對應的數據
        if (typeof presets !== 'undefined' && presets.length > 0) {
            const preset = presets.find(p => p.id === presetId);
            if (preset) {
                const version = preset.versions.find(v => v.id === foundVersionId);
                if (version) {
                    return { preset, version };
                }
            }
        }
    }
    
    // 方法2: 如果方法1失敗，嘗試從所有 presets 中搜尋
    if (typeof presets !== 'undefined' && presets.length > 0) {
        for (const preset of presets) {
            const version = preset.versions.find(v => v.id === versionId);
            if (version) {
                return { preset, version };
            }
        }
    }
    
    // 方法3: 檢查全局變數（可能的命名方式）
    const globalVars = ['presets', 'currentPresets', 'presetData'];
    for (const varName of globalVars) {
        if (typeof window[varName] !== 'undefined') {
            const data = window[varName];
            if (Array.isArray(data)) {
                for (const preset of data) {
                    const version = preset.versions?.find(v => v.id === versionId);
                    if (version) {
                        return { preset, version };
                    }
                }
            }
        }
    }
    
    console.warn('無法找到 preset 數據，versionId:', versionId);
    return null;
}

// HTML 轉義方法
static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 重新整理預覽內容
static refreshPreview(versionId) {
    const previewContent = document.getElementById(`preview-content-${versionId}`);
    if (!previewContent) return;
    
    const newContent = this.generatePreviewContent(versionId);
    previewContent.innerHTML = newContent;
    
    // 更新統計
    this.updatePreviewStats(versionId);
}

// HTML 轉義方法
static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

}


