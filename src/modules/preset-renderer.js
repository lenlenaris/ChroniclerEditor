class PresetRenderer {
    // 主要版本內容渲染函數
static renderPresetVersionContent(preset, version) {
    const content = `
        <div class="preset-version-content">
            <div class="preset-header">
                <h3 class="section-title">${t('editablePrompts')}</h3>
            </div>
            
            <!-- 只顯示可編輯條目列表 (character_id: 100001) -->
            <div class="preset-prompts-container">
                <div id="editable-prompts-list-${version.id}" class="prompts-list">
                    ${this.renderPromptsList(preset, version, 100001)}
                </div>
            </div>
        </div>
    `;
    
    // 只初始化可編輯條目的拖拽排序
    setTimeout(() => {
        this.enablePromptsDragSort(preset.id, version.id, 100001);
        console.log(`🎯 已初始化 preset ${preset.id} version ${version.id} 的可編輯條目拖拽排序`);
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
        
        return `
            <div class="entry-panel sortable-item preset-entry-panel ${!prompt.enabled ? 'preset-entry-disabled' : ''}" data-prompt-identifier="${prompt.identifier}">
               <!-- 條目標題列 -->
<div class="entry-header preset-entry-header">
    <!-- 拖曳控制 -->
    <div class="drag-handle custom-field-drag-handle">
        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
    </div>
    
    <!-- 展開按鈕 - 移到拖曳柄右邊 -->
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
    <div class="preset-prompt-name">
        <input type="text" class="field-input compact-input" 
            placeholder="${t('promptName')}"
            value="${prompt.name || ''}"
            onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'name', this.value)">
    </div>
    
<!-- 角色類型 -->
<div class="preset-prompt-role">
    <select class="field-input compact-input" 
        onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'role', this.value)">
        <option value="system" ${prompt.role === 'system' ? 'selected' : ''}>${t('system')}</option>
        <option value="user" ${prompt.role === 'user' ? 'selected' : ''}>${t('user')}</option>
        <option value="assistant" ${prompt.role === 'assistant' ? 'selected' : ''}>${t('assistant')}</option>
    </select>
</div>
    
<!-- 位置類型 -->
<div class="preset-prompt-position">
    <select class="field-input compact-input" 
        onchange="PresetRenderer.updatePromptPosition('${presetId}', '${versionId}', '${prompt.identifier}', parseInt(this.value))"
        id="position-select-${prompt.identifier}">
        <option value="0" ${(prompt.injection_position || 0) === 0 ? 'selected' : ''}>${t('relativePosition')}</option>
        <option value="1" ${prompt.injection_position === 1 ? 'selected' : ''}>${t('chatPromptManagement')}</option>
    </select>
</div>

<!-- 深度（僅在絕對位置時顯示） -->
<div class="preset-prompt-depth" id="depth-field-${prompt.identifier}" 
    style="${prompt.injection_position === 1 ? '' : 'display: none;'}">
    <input type="number" class="field-input compact-input" 
        value="${prompt.injection_depth || 4}" 
        min="0" max="999"
        placeholder="${t('depth')}"
        onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'injection_depth', parseInt(this.value))">
</div>

<!-- 順序（僅在絕對位置時顯示） -->
<div class="preset-prompt-order" id="order-field-${prompt.identifier}"
    style="${prompt.injection_position === 1 ? '' : 'display: none;'}">
    <input type="number" class="field-input compact-input" 
        value="${prompt.injection_order || 100}" 
        min="1" max="999"
        placeholder="${t('order')}"
        onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'injection_order', parseInt(this.value))">
</div>
</div>
                
                <!-- 條目內容區域 -->
                <div class="entry-content preset-entry-content" id="prompt-content-${prompt.identifier}" style="display: none;">
                    <div class="field-group">
                        <label class="field-label">${t('promptContent')}</label>
                        <textarea class="field-input" 
                            placeholder="${t('promptContentPlaceholder')}"
                            ${!canEditContent ? 'readonly' : ''}
                            style="min-height: 120px; ${!canEditContent ? 'background: var(--bg-color); color: var(--text-muted);' : ''}"
                            oninput="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'content', this.value)">${prompt.content || ''}</textarea>
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
    }
}

// 更新位置類型並控制欄位顯示
static updatePromptPosition(presetId, versionId, identifier, position) {
    // 更新 injection_position
    this.updatePromptField(presetId, versionId, identifier, 'injection_position', position);
    
    // 控制深度和順序欄位的顯示/隱藏
    const depthField = document.getElementById(`depth-field-${identifier}`);
    const orderField = document.getElementById(`order-field-${identifier}`);
    
    if (depthField && orderField) {
        if (position === 1) {
            // 聊天中的提示詞管理：顯示深度和順序
            depthField.style.display = '';
            orderField.style.display = '';
        } else {
            // 相對位置：隱藏深度和順序
            depthField.style.display = 'none';
            orderField.style.display = 'none';
        }
    }
}

// 啟用條目拖拽排序 - 參考 WorldBook 做法
static enablePromptsDragSort(presetId, versionId, characterId) {
    const containerSelector = `[data-character-id="${characterId}"]`;
    const container = document.querySelector(containerSelector);
    
    if (!container || typeof DragSortManager === 'undefined') {
        console.warn('無法啟用預設提示詞拖拽排序：容器不存在或 DragSortManager 未載入');
        return;
    }
    
    // 檢查是否已經啟用
    const existingInstance = DragSortManager.sortableInstances.get(containerSelector);
    if (existingInstance) {
        existingInstance.destroy();
    }
    
    let savedStates = {}; // 保存折疊狀態
    const commonConfig = DragSortManager.getCommonSortableConfig();
    
    const sortable = new Sortable(container, {
        handle: '.drag-handle',
        animation: 150,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        
        draggable: '.preset-entry-panel',
        
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen', 
        dragClass: 'sortable-drag',
        
        // 應用通用配置
        forceFallback: commonConfig.forceFallback,
        fallbackOnBody: commonConfig.fallbackOnBody,
        
        // 排除按鈕
        filter: function(evt, item, container) {
            return item.classList.contains('loveydovey-add-btn') || 
                   item.tagName === 'BUTTON';
        },
        
        onStart: function(evt) {
            commonConfig.onStartCommon(evt, container);
            document.body.style.cursor = 'grabbing';
            
            // 記錄當前折疊狀態
            savedStates = PresetRenderer.getCurrentPromptCollapseStates();
        },
        
        onEnd: function(evt) {
            commonConfig.onEndCommon(evt, container);
            document.body.style.cursor = '';
            
            if (evt.oldIndex !== evt.newIndex) {
                // 重新排序 - 參考 WorldBook 的做法
                PresetRenderer.reorderPromptsFromContainer(container, presetId, versionId, characterId);
                
                // 立即恢復折疊狀態
                setTimeout(() => {
                    PresetRenderer.restorePromptCollapseStates(savedStates);
                }, 10);
            }
        }
    });
    
    // 儲存實例到 DragSortManager
    DragSortManager.sortableInstances.set(containerSelector, sortable);
    return sortable;
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

}


