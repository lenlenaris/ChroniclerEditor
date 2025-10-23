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

                        <button class="version-panel-btn hover-primary" 
            id="batch-mode-toggle-${preset.id}-${version.id}"
            onclick="PresetRenderer.togglePresetBatchMode('${preset.id}', '${version.id}')" 
            title="${t('presetBatchMode')}"
            style="display: flex; align-items: center; gap: 6px;">
        ${IconManager.selectAll({width: 14, height: 14})}
        <span>${t('presetBatchMode')}</span>
    </button>
                </div>

                <div class="controls-description" style="color: var(--text-muted); font-size: 0.85em; margin-top: 8px; padding-left: 2px;">
                    ${t('presetControlsDescription')}
                </div>
                <!-- 添加隱藏條目選單 -->
<div class="hidden-prompts-controls" style="display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 8px 0px; background: var(--bg-secondary); border-radius: 6px; flex-wrap: wrap;">
    <label style="font-size: 0.9em; color: var(--text-color); white-space: nowrap;">
        ${t('hiddenPrompts')}:
    </label>
    <select id="hidden-prompts-select-${version.id}" class="field-input compact-input" style="flex: 1; min-width: 200px;">
        <option value="">${t('selectPromptToAdd')}</option>
    </select>
    <button class="version-panel-btn hover-primary" 
            onclick="PresetRenderer.addHiddenPrompt('${preset.id}', '${version.id}')" 
            style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        ${IconManager.link({width: 14, height: 14})}
        <span>${t('addPrompt')}</span>
    </button>
    <!-- 刪除條目按鈕 -->
<button class="version-panel-btn hover-primary" 
        onclick="PresetRenderer.deletePromptPermanently('${preset.id}', '${version.id}')" 
        style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
    ${IconManager.trash({width: 14, height: 14})}
    <span>${t('deletePrompt')}</span>
</button>
<!-- 新增條目按鈕 -->
<button class="version-panel-btn hover-primary" 
        onclick="PresetRenderer.createNewPrompt('${preset.id}', '${version.id}')" 
        style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
    ${IconManager.plus({width: 14, height: 14})}
    <span>${t('createPrompt')}</span>
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
        this.updateHiddenPromptsSelect(preset.id, version.id);
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
    const isCorePrompt = ['main', 'nsfw', 'jailbreak', 'enhanceDefinitions'].includes(prompt.identifier);
    const cannotRemove = isMarker || isCorePrompt;
        
        return `
<div class="entry-panel sortable-item preset-entry-panel ${!prompt.enabled ? 'preset-entry-disabled' : ''}" data-prompt-identifier="${prompt.identifier}">
<!-- 條目標題列 - 展開前顯示：拖曳、展開按鈕、開關、名字、role、@深度 -->
<div class="entry-header preset-entry-header">
${!cannotRemove ? `
    <!-- Batch checkbox (hidden by default) -->
    <label class="batch-checkbox" 
           id="batch-checkbox-${prompt.identifier}"
           style="display: none; cursor: pointer; margin-right: 8px;">
        <input type="checkbox" 
               class="batch-checkbox-input"
               data-prompt-identifier="${prompt.identifier}"
               onchange="PresetRenderer.updateBatchSelection('${presetId}', '${versionId}')">
    </label>
` : `
    <!-- Placeholder for alignment (also hidden by default) -->
    <div class="batch-placeholder" style="display: none; width: 28px; flex-shrink: 0;"></div>
`}
<!-- [添加] 結束 -->

<!-- 拖曳控制 -->
<div class="drag-handle custom-field-drag-handle">
    ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
</div>
    
    <!-- 展開按鈕 -->
    <button class="entry-toggle-btn wb-toggle-btn" onclick="PresetRenderer.togglePromptContent('${prompt.identifier}', event)">
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

    
<!-- 複製提示詞按鈕 (marker 和核心條目顯示但禁用) -->
<button class="copy-btn ${cannotRemove ? 'hover-disabled' : ''}" 
        onclick="${cannotRemove ? 'return false;' : `PresetRenderer.copyPrompt('${presetId}', '${versionId}', '${prompt.identifier}', ${characterId})`}"
        title="${cannotRemove ? t('cannotCopyCorePrompt') : t('copyPrompt')}"
        style="${cannotRemove ? 'opacity: 0.4; cursor: not-allowed;' : ''}"
        ${cannotRemove ? 'disabled' : ''}>
    ${IconManager.copy({width: 14, height: 14})}
</button>

<!-- 移動提示詞按鈕 (marker 和核心條目顯示但禁用) -->
<button class="copy-btn ${cannotRemove ? 'hover-disabled' : ''}" 
        onclick="${cannotRemove ? 'return false;' : `PresetRenderer.openMovePromptDialog('${presetId}', '${versionId}', '${prompt.identifier}', ${characterId})`}"
        title="${cannotRemove ? t('cannotMoveCorePrompt') : t('movePrompt')}"
        style="${cannotRemove ? 'opacity: 0.4; cursor: not-allowed;' : ''}"
        ${cannotRemove ? 'disabled' : ''}>
    ${IconManager.move({width: 14, height: 14})}
</button>

<!-- 從列表移除按鈕 (marker 和核心條目顯示但禁用) -->
<button class="copy-btn ${cannotRemove ? 'hover-disabled' : 'hover-danger'}" 
        onclick="${cannotRemove ? 'return false;' : `PresetRenderer.removePromptFromOrder('${presetId}', '${versionId}', '${prompt.identifier}', ${characterId})`}"
        title="${cannotRemove ? t('cannotRemoveCorePrompt') : t('removeFromList')}"
        style="${cannotRemove ? 'opacity: 0.4; cursor: not-allowed;' : ''}"
        ${cannotRemove ? 'disabled' : ''}>
    ${IconManager.linkOff({width: 14, height: 14})}
</button>

<!-- 刪除提示詞按鈕 (marker 和核心條目顯示但禁用) -->
<button class="delete-btn ${cannotRemove ? 'hover-disabled' : ''}" 
        onclick="${cannotRemove ? 'return false;' : `PresetRenderer.deletePromptPermanentlyFromEntry('${presetId}', '${versionId}', '${prompt.identifier}')`}"
        title="${cannotRemove ? t('cannotDeleteCorePrompt') : t('deletePrompt')}"
        style="${cannotRemove ? 'opacity: 0.4; cursor: not-allowed;' : ''}"
        ${cannotRemove ? 'disabled' : ''}>
    ${IconManager.delete({width: 14, height: 14})}
</button>
    

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
        style="max-width: 180px; ${!canEditPosition ? 'background: var(--bg-secondary); color: var(--text-muted);' : ''}"
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
    static togglePromptContent(identifier, event) {
        // 🎯 從點擊事件獲取當前按鈕，確保操作正確的面板
        const toggleBtn = event ? event.currentTarget : 
                        document.querySelector(`.entry-toggle-btn[onclick*="togglePromptContent('${identifier}')"]`);
        
        if (!toggleBtn) {
            console.warn(`togglePromptContent: 找不到ID為 ${identifier} 的按鈕`);
            return;
        }
        
        // 🎯 從按鈕向上查找最近的 entry-panel，確保操作同一個面板內的內容
        const entryPanel = toggleBtn.closest('.entry-panel');
        if (!entryPanel) {
            console.warn(`togglePromptContent: 找不到ID為 ${identifier} 的條目面板`);
            return;
        }
        
        // 🎯 在當前面板內查找對應的內容區域
        const content = entryPanel.querySelector(`#prompt-content-${identifier}`);
        
        if (!content) {
            console.warn(`togglePromptContent: 找不到ID為 ${identifier} 的內容區域`);
            return;
        }
        
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
    
    // 🎯 修正：找到所有匹配的容器（對比模式下可能有多個）
    const containers = document.querySelectorAll(`.prompts-entries-container[data-version-id="${versionId}"]`);
    
    if (containers.length === 0) {
        console.warn('⌛ 找不到容器，versionId:', versionId);
        return;
    }
    
    // 🎯 對每個容器都執行展開操作
    containers.forEach(container => {
        const entryPanels = container.querySelectorAll('.preset-entry-panel');
        
        entryPanels.forEach(panel => {
            const identifier = panel.dataset.promptIdentifier;
            const content = panel.querySelector(`#prompt-content-${identifier}`);
            const toggleBtn = panel.querySelector('.entry-toggle-btn');
            
            if (content && toggleBtn) {
                content.style.display = 'block';
                toggleBtn.innerHTML = '<span class="arrow-icon arrow-down"></span>';
            }
        });
    });
}

// 摺疊所有提示詞條目
static collapseAllPrompts(versionId) {
    // 🎯 修正：找到所有匹配的容器（對比模式下可能有多個）
    const containers = document.querySelectorAll(`.prompts-entries-container[data-version-id="${versionId}"]`);
    
    if (containers.length === 0) {
        console.warn('⌛ 找不到容器，versionId:', versionId);
        return;
    }
    
    // 🎯 對每個容器都執行摺疊操作
    containers.forEach(container => {
        const entryPanels = container.querySelectorAll('.preset-entry-panel');
        
        entryPanels.forEach(panel => {
            const identifier = panel.dataset.promptIdentifier;
            const content = panel.querySelector(`#prompt-content-${identifier}`);
            const toggleBtn = panel.querySelector('.entry-toggle-btn');
            
            if (content && toggleBtn) {
                content.style.display = 'none';
                toggleBtn.innerHTML = '<span class="arrow-icon arrow-right"></span>';
            }
        });
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
        
        // 只計算非 marker 條目的內容和數量
        if (!prompt.marker && prompt.content && prompt.content.trim()) {
            enabledCount++;
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

// 取得所有隱藏的條目（在 prompts 中但不在 order 陣列的）
static getHiddenPrompts(presetId, versionId, characterId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return [];
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return [];
    
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (!orderConfig) return [];
    
    // 取得所有在 order 中的 identifier
    const visibleIdentifiers = new Set(orderConfig.order.map(item => item.identifier));
    
    // 過濾出隱藏的條目（排除核心系統條目）
    const corePrompts = ['main', 'nsfw', 'jailbreak', 'enhanceDefinitions'];
    const hiddenPrompts = version.prompts.filter(prompt => 
        !visibleIdentifiers.has(prompt.identifier) && 
        !corePrompts.includes(prompt.identifier)
    );
    
    // 按 name 排序
    hiddenPrompts.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });
    
    return hiddenPrompts;
}

// 將隱藏條目添加到 order 陣列的最上方
static addHiddenPrompt(presetId, versionId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 取得選中的 identifier
    const selectElement = document.getElementById(`hidden-prompts-select-${versionId}`);
    const identifier = selectElement?.value;
    
    if (!identifier) {
        NotificationManager.warning(t('pleaseSelectPrompt'));
        return;
    }
    
    // 找到對應的 prompt
    const prompt = version.prompts.find(p => p.identifier === identifier);
    if (!prompt) return;
    
    // 找到可編輯條目的配置（character_id: 100001）
    const orderConfig = version.prompt_order?.find(config => config.character_id === 100001);
    if (!orderConfig) return;
    
    // 檢查是否已經在列表中
    if (orderConfig.order.some(item => item.identifier === identifier)) {
        NotificationManager.warning(t('promptAlreadyInList'));
        return;
    }
    
    // 添加到最上方
    orderConfig.order.unshift({
        identifier: identifier,
        enabled: true
    });
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptAdded'));
}

// 從 order 陣列移除條目（資料保留在 prompts 中）
static removePromptFromOrder(presetId, versionId, identifier, characterId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (!orderConfig) return;
    
    // 找到條目的索引
    const index = orderConfig.order.findIndex(item => item.identifier === identifier);
    if (index === -1) return;
    
    // 移除條目
    orderConfig.order.splice(index, 1);
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptRemoved'));
}

// 重新渲染 preset 內容（保持折疊狀態）
static refreshPresetContent(presetId, versionId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 保存當前折疊狀態
    const savedStates = this.getCurrentPromptCollapseStates();
    
    // 重新渲染列表
    const listContainer = document.getElementById(`editable-prompts-list-${versionId}`);
    if (listContainer) {
        listContainer.innerHTML = this.renderPromptsList(preset, version, 100001);
    }
    
    // 更新隱藏條目下拉選單
    this.updateHiddenPromptsSelect(presetId, versionId);
    
    // 重新啟用拖曳排序
    setTimeout(() => {
        this.enablePromptsDragSort();
        this.restorePromptCollapseStates(savedStates);
        updateAllPageStats();
        updateVersionStats('preset', presetId, versionId);
    }, 100);
}

// 更新隱藏條目下拉選單
static updateHiddenPromptsSelect(presetId, versionId) {
    const selectElement = document.getElementById(`hidden-prompts-select-${versionId}`);
    if (!selectElement) return;
    
    const hiddenPrompts = this.getHiddenPrompts(presetId, versionId, 100001);
    
    // 清空並重建選項
    selectElement.innerHTML = `<option value="">${t('selectPromptToAdd')}</option>`;
    
    hiddenPrompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.identifier;
        option.textContent = prompt.name || prompt.identifier;
        selectElement.appendChild(option);
    });
    
    // 如果沒有隱藏條目，禁用選單和按鈕
    const addButton = selectElement.parentElement.querySelector('button');
    if (hiddenPrompts.length === 0) {
        selectElement.disabled = true;
        if (addButton) addButton.disabled = true;
    } else {
        selectElement.disabled = false;
        if (addButton) addButton.disabled = false;
    }
}

// 永久刪除條目（從 prompts 陣列中完全移除）
static deletePromptPermanently(presetId, versionId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 取得選中的 identifier
    const selectElement = document.getElementById(`hidden-prompts-select-${versionId}`);
    const identifier = selectElement?.value;
    
    if (!identifier) {
        NotificationManager.warning(t('pleaseSelectPrompt'));
        return;
    }
    
    // 找到對應的 prompt
    const promptIndex = version.prompts.findIndex(p => p.identifier === identifier);
    if (promptIndex === -1) return;
    
    const prompt = version.prompts[promptIndex];
    
    // 檢查是否為 marker 條目或核心系統條目（不允許刪除）
    const isCorePrompt = ['main', 'nsfw', 'jailbreak', 'enhanceDefinitions'].includes(identifier);
    if (prompt.marker === true || isCorePrompt) {
        NotificationManager.error(t('cannotDeleteCorePrompt'));
        return;
    }
    
    // 顯示確認對話框
    const confirmMessage = t('confirmDeletePrompt', prompt.name || identifier);
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 從 prompts 陣列中完全刪除
    version.prompts.splice(promptIndex, 1);
    
    // 同時確保它不在任何 order 陣列中
    version.prompt_order?.forEach(orderConfig => {
        const orderIndex = orderConfig.order.findIndex(item => item.identifier === identifier);
        if (orderIndex !== -1) {
            orderConfig.order.splice(orderIndex, 1);
        }
    });
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptDeleted'));
}

// 從條目直接刪除提示詞（包裝函數）
static deletePromptPermanentlyFromEntry(presetId, versionId, identifier) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const promptIndex = version.prompts.findIndex(p => p.identifier === identifier);
    if (promptIndex === -1) return;
    
    const prompt = version.prompts[promptIndex];
    
    // 檢查是否為 marker 條目或核心系統條目（不允許刪除）
    const isCorePrompt = ['main', 'nsfw', 'jailbreak', 'enhanceDefinitions'].includes(identifier);
    if (prompt.marker === true || isCorePrompt) {
        NotificationManager.error(t('cannotDeleteCorePrompt'));
        return;
    }
    
    // 顯示確認對話框
    const confirmMessage = t('confirmDeletePrompt').replace('$1', prompt.name || identifier);
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 從 prompts 陣列中完全刪除
    version.prompts.splice(promptIndex, 1);
    
    // 同時確保它不在任何 order 陣列中
    version.prompt_order?.forEach(orderConfig => {
        const orderIndex = orderConfig.order.findIndex(item => item.identifier === identifier);
        if (orderIndex !== -1) {
            orderConfig.order.splice(orderIndex, 1);
        }
    });
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptDeleted'));
}

// 複製提示詞
static copyPrompt(presetId, versionId, identifier, characterId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 找到原始提示詞
    const originalPrompt = version.prompts.find(p => p.identifier === identifier);
    if (!originalPrompt) return;
    
    // 生成新的 UUID identifier
    const newIdentifier = this.generateUUID();
    
    // 深拷貝並修改屬性
    const newPrompt = {
        ...originalPrompt,
        identifier: newIdentifier,
        name: (originalPrompt.name || '') + t('copyPrefix')
    };
    
    // 添加到 prompts 陣列
    version.prompts.push(newPrompt);
    
    // 找到可編輯條目的配置（character_id: 100001）
    const orderConfig = version.prompt_order?.find(config => config.character_id === characterId);
    if (orderConfig) {
        // 找到原條目在 order 中的位置
        const originalIndex = orderConfig.order.findIndex(item => item.identifier === identifier);
        
        // 在原條目後面插入新條目
        const insertIndex = originalIndex !== -1 ? originalIndex + 1 : orderConfig.order.length;
        orderConfig.order.splice(insertIndex, 0, {
            identifier: newIdentifier,
            enabled: true
        });
    }
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptCopied'));
}

// 開啟移動提示詞對話框
static openMovePromptDialog(presetId, versionId, identifier, characterId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const prompt = version.prompts.find(p => p.identifier === identifier);
    if (!prompt) return;
    
    // 生成目標選項列表
    let optionsHTML = '';
    presets.forEach(p => {
        p.versions.forEach(v => {
            // 排除來源本身
            if (p.id === presetId && v.id === versionId) {
                return;
            }
        optionsHTML += `
            <div class="tag-detail-item tag-item-hover move-option" 
                data-preset-id="${p.id}" 
                data-version-id="${v.id}"
                data-preset-name="${p.name.replace(/"/g, '&quot;')}"
                data-version-name="${v.name.replace(/"/g, '&quot;')}"
                onclick="PresetRenderer.selectMoveTargetFromData(this)"
                     style="padding: 12px 16px; margin-bottom: 4px; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 6px; transition: all 0.2s ease;">
                    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">
                        ${p.name}
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
                    <h3 class="compact-modal-title">${t('movePromptTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
                <p class="compact-modal-desc" style="text-align: left; margin-bottom: 16px;">
                    ${t('movePromptDescription').replace('$1', `<strong>${prompt.name || t('untitledPrompt')}</strong>`)}
                </p>
                
                <!-- 搜尋框 -->
                <input type="text" 
                       id="move-search-input" 
                       class="field-input msize-input"
                       placeholder="${t('searchPresets')}"
                       style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                       oninput="PresetRenderer.filterMoveOptions(this.value)">
                
                <!-- 目標列表 -->
                <div id="move-options-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); padding: 8px;">
                    ${optionsHTML || `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">${t('noOtherPresets')}</div>`}
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
                <button id="confirm-move-btn" class="overview-btn btn-primary" disabled 
                        onclick="PresetRenderer.confirmMovePrompt('${presetId}', '${versionId}', '${identifier}', ${characterId}, '${prompt.name || t('untitledPrompt')}')">
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
    
    // 儲存選擇狀態到全域變數
    window.movePromptTarget = null;
}

// 從 data 屬性選擇移動目標（避免名稱中的特殊字元問題）
static selectMoveTargetFromData(element) {
    const presetId = element.dataset.presetId;
    const versionId = element.dataset.versionId;
    const presetName = element.dataset.presetName;
    const versionName = element.dataset.versionName;
    
    this.selectMoveTarget(presetId, versionId, presetName, versionName);
}

// 選擇移動目標
static selectMoveTarget(presetId, versionId, presetName, versionName) {
    // 更新選擇狀態
    window.movePromptTarget = {
        presetId: presetId,
        versionId: versionId,
        presetName: presetName,
        versionName: versionName
    };
    
    // 更新 UI 選中狀態
    document.querySelectorAll('.move-option').forEach(option => {
        if (option.dataset.presetId === presetId && option.dataset.versionId === versionId) {
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
                    ${t('selectedTarget')}: ${presetName} - ${versionName}
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
static filterMoveOptions(searchText) {
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
                    ${t('noMatchingPresets')}
                </div>
            `);
        }
    } else {
        const noResults = container.querySelector('.no-results');
        if (noResults) noResults.remove();
    }
}

// 確認移動提示詞
static confirmMovePrompt(sourcePresetId, sourceVersionId, identifier, characterId, promptName) {
    if (!window.movePromptTarget) {
        NotificationManager.warning(t('pleaseSelectTarget'));
        return;
    }
    
    const { presetId: targetPresetId, versionId: targetVersionId, presetName, versionName } = window.movePromptTarget;
    
    // 執行移動
    const success = this.moveSinglePrompt(sourcePresetId, sourceVersionId, targetPresetId, targetVersionId, identifier, characterId);
    
    if (success) {
        // 關閉模態框
        document.querySelector('.modal')?.remove();
        
        // 顯示成功提示
        NotificationManager.success(
            t('movePromptSuccess')
                .replace('$1', promptName)
                .replace('$2', `${presetName} - ${versionName}`)
        );
        
        // 清理全域變數
        window.movePromptTarget = null;
    } else {
        NotificationManager.error(t('movePromptFailed'));
    }
}

// 移動單個提示詞
static moveSinglePrompt(sourcePresetId, sourceVersionId, targetPresetId, targetVersionId, identifier, characterId) {
    // 獲取來源資料
    const sourcePreset = presets.find(p => p.id === sourcePresetId);
    if (!sourcePreset) return false;
    
    const sourceVersion = sourcePreset.versions.find(v => v.id === sourceVersionId);
    if (!sourceVersion) return false;
    
    const promptIndex = sourceVersion.prompts.findIndex(p => p.identifier === identifier);
    if (promptIndex === -1) return false;
    
    const prompt = sourceVersion.prompts[promptIndex];
    
    // 獲取目標資料
    const targetPreset = presets.find(p => p.id === targetPresetId);
    if (!targetPreset) return false;
    
    const targetVersion = targetPreset.versions.find(v => v.id === targetVersionId);
    if (!targetVersion) return false;
    
    // 檢查目標中是否已存在同 identifier 的 prompt
    if (targetVersion.prompts.some(p => p.identifier === identifier)) {
        console.warn(`Prompt with identifier ${identifier} already exists in target. Skipping move.`);
        NotificationManager.warning(t('promptAlreadyExistsInTarget'));
        return false;
    }
    
    // 創建新條目（深拷貝）
    const newPrompt = { ...prompt };
    
    // 從來源的 order 中移除
    const sourceOrderConfig = sourceVersion.prompt_order?.find(config => config.character_id === characterId);
    if (sourceOrderConfig) {
        const orderIndex = sourceOrderConfig.order.findIndex(item => item.identifier === identifier);
        if (orderIndex !== -1) {
            sourceOrderConfig.order.splice(orderIndex, 1);
        }
    }
    
    // 從來源的 prompts 陣列中移除
    sourceVersion.prompts.splice(promptIndex, 1);
    
    // 加入目標的 prompts 列表
    if (!targetVersion.prompts) targetVersion.prompts = [];
    targetVersion.prompts.push(newPrompt);
    
    // 加入目標的 order 列表（添加到最上方）
    let targetOrderConfig = targetVersion.prompt_order?.find(config => config.character_id === characterId);
    if (!targetOrderConfig) {
        // 如果目標沒有可編輯的 order 配置，則創建一個
        if (!targetVersion.prompt_order) targetVersion.prompt_order = [];
        targetOrderConfig = { character_id: characterId, order: [] };
        targetVersion.prompt_order.push(targetOrderConfig);
    }
    targetOrderConfig.order.unshift({
        identifier: identifier,
        enabled: true
    });
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('preset', sourcePresetId, sourceVersionId);
    TimestampManager.updateVersionTimestamp('preset', targetPresetId, targetVersionId);
    
    // 標記為已變更
    markAsChanged();
    
    // 重新渲染當前頁面
    this.refreshPresetContent(sourcePresetId, sourceVersionId);
    
    return true;
}

// 創建新的條目
static createNewPrompt(presetId, versionId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 生成新的 UUID identifier
    const newIdentifier = this.generateUUID();
    
    // 創建新條目
    const newPrompt = {
        identifier: newIdentifier,
        name: '',
        system_prompt: false,
        enabled: false,
        marker: false,
        role: 'system',
        content: '',
        injection_position: 0,
        injection_depth: 4,
        forbid_overrides: false,
        injection_order: 100,
        injection_trigger: []
    };
    
    // 添加到 prompts 陣列
    version.prompts.push(newPrompt);
    
    // 找到可編輯條目的配置（character_id: 100001）
    const orderConfig = version.prompt_order?.find(config => config.character_id === 100001);
    if (!orderConfig) return;
    
    // 添加到 order 陣列的最上方，並設為啟用
    orderConfig.order.unshift({
        identifier: newIdentifier,
        enabled: true
    });
    
    // 更新時間戳
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // 重新渲染
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('promptCreated'));
}

// 生成 UUID v4 格式的 identifier
static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ===== 批量編輯功能 =====

// 切換批量模式
static togglePresetBatchMode(presetId, versionId) {
    const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
    if (!container) return;

    const isActive = container.classList.toggle('batch-mode-active');
    const button = document.getElementById(`batch-mode-toggle-${presetId}-${versionId}`);

// 顯示/隱藏所有勾選框和佔位符
const checkboxes = container.querySelectorAll('.batch-checkbox');
checkboxes.forEach(checkbox => {
    checkbox.style.display = isActive ? 'flex' : 'none';
});

const placeholders = container.querySelectorAll('.batch-placeholder');
placeholders.forEach(placeholder => {
    placeholder.style.display = isActive ? 'block' : 'none';
});

    // 更新按鈕樣式
    if (button) {
        const iconSpan = button.querySelector('span');
        if (isActive) {
            button.style.background = 'var(--primary-color)';
            button.style.color = 'white';
            button.title = t('presetExitBatchMode');
            if(iconSpan) iconSpan.textContent = t('presetExitBatchMode'); // 使用一個簡短的詞
        } else {
            button.style.background = '';
            button.style.color = '';
            button.title = t('presetBatchMode');
            if(iconSpan) iconSpan.textContent = t('presetBatchMode');
            // 取消所有選擇
            container.querySelectorAll('.batch-checkbox-input').forEach(cb => cb.checked = false);
        }
    }

    // 顯示/隱藏批量操作欄
    if (isActive) {
        this.showBatchToolbar(presetId, versionId);
    } else {
        this.hideBatchToolbar(presetId, versionId);
    }
}

// 顯示批量操作工具列
static showBatchToolbar(presetId, versionId) {
    this.hideBatchToolbar(presetId, versionId); // 確保移除舊的

    const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
    if (!container) return;

    const toolbar = document.createElement('div');
    toolbar.id = `batch-toolbar-${presetId}-${versionId}`;
    toolbar.className = 'batch-toolbar'; // 沿用世界書的CSS
    toolbar.innerHTML = `
        <div class="batch-toolbar-content">
            <div class="batch-info">
                <span class="batch-count">${t('presetSelectedCount').replace('$1', '0')}</span>
            </div>
<div class="batch-actions">
    <button class="overview-btn hover-primary batch-action-btn" 
            disabled
            onclick="PresetRenderer.batchCopyPrompts('${presetId}', '${versionId}')"
            title="${t('presetBatchCopy')}">
        ${IconManager.copy({width: 14, height: 14})}
        ${t('copyPrompt')}
    </button>
    <button class="overview-btn hover-primary batch-action-btn" 
            disabled
            onclick="PresetRenderer.batchMovePrompts('${presetId}', '${versionId}')"
            title="${t('presetBatchMove')}">
        ${IconManager.move({width: 14, height: 14})}
        ${t('movePrompt')}
    </button>
    <button class="overview-btn overview-danger-btn batch-action-btn" 
            disabled
            onclick="PresetRenderer.batchDeletePrompts('${presetId}', '${versionId}')"
            title="${t('presetBatchDelete')}">
        ${IconManager.delete({width: 14, height: 14})}
        ${t('deletePrompt')}
    </button>
</div>
        </div>
    `;

    const versionPanel = container.closest('.version-panel');
    if (versionPanel) {
        versionPanel.appendChild(toolbar);
    }
}

// 批量複製提示詞
static batchCopyPrompts(presetId, versionId) {
    const identifiers = this.getSelectedPromptIdentifiers(presetId, versionId);
    if (identifiers.length === 0) {
        NotificationManager.warning(t('presetNoPromptsSelected'));
        return;
    }
    
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const orderConfig = version.prompt_order?.find(config => config.character_id === 100001);
    if (!orderConfig) return;
    
    let successCount = 0;
    
    // 從後往前遍歷，確保插入位置正確
    for (let i = identifiers.length - 1; i >= 0; i--) {
        const identifier = identifiers[i];
        const originalPrompt = version.prompts.find(p => p.identifier === identifier);
        if (!originalPrompt) continue;
        
        // 生成新的 UUID identifier
        const newIdentifier = this.generateUUID();
        
        // 深拷貝並修改屬性
        const newPrompt = {
            ...originalPrompt,
            identifier: newIdentifier,
            name: (originalPrompt.name || '') + t('copyPrefix')
        };
        
        // 添加到 prompts 陣列
        version.prompts.push(newPrompt);
        
        // 找到原條目在 order 中的位置
        const originalIndex = orderConfig.order.findIndex(item => item.identifier === identifier);
        
        // 在原條目後面插入新條目
        const insertIndex = originalIndex !== -1 ? originalIndex + 1 : orderConfig.order.length;
        orderConfig.order.splice(insertIndex, 0, {
            identifier: newIdentifier,
            enabled: true
        });
        
        successCount++;
    }
    
if (successCount > 0) {
    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
    markAsChanged();
    
    // ✅ 先關閉批量模式再重新渲染
    const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
    if (container?.classList.contains('batch-mode-active')) {
        this.togglePresetBatchMode(presetId, versionId);
    }
    
    // é‡æ–°æ¸²æŸ"
    this.refreshPresetContent(presetId, versionId);
    
    NotificationManager.success(t('presetBatchCopySuccess').replace('$1', successCount));
}
}

// 批量刪除提示詞（永久刪除）
static batchDeletePrompts(presetId, versionId) {
    const identifiers = this.getSelectedPromptIdentifiers(presetId, versionId);
    if (identifiers.length === 0) {
        NotificationManager.warning(t('presetNoPromptsSelected'));
        return;
    }

    if (!confirm(t('presetBatchDeleteConfirm').replace('$1', identifiers.length))) {
        return;
    }
    
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
        const version = preset.versions.find(v => v.id === versionId);
        if (version) {
            // 從 prompts 陣列中完全刪除
            version.prompts = version.prompts.filter(p => !identifiers.includes(p.identifier));
            
            // 同時從所有 order 陣列中移除
            version.prompt_order?.forEach(orderConfig => {
                orderConfig.order = orderConfig.order.filter(item => !identifiers.includes(item.identifier));
            });
            
            TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
            markAsChanged();
            
const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
if (container?.classList.contains('batch-mode-active')) {
    this.togglePresetBatchMode(presetId, versionId);
}

// é‡æ–°æ¸²æŸ"
this.refreshPresetContent(presetId, versionId);

NotificationManager.success(t('presetBatchDeleteSuccess').replace('$1', identifiers.length));
        }
    }
}

// 批量移動提示詞（已存在，需要修改）
static batchMovePrompts(presetId, versionId) {
    const identifiers = this.getSelectedPromptIdentifiers(presetId, versionId);
    if (identifiers.length === 0) {
        NotificationManager.warning(t('presetNoPromptsSelected'));
        return;
    }
    this.openBatchMovePromptsDialog(presetId, versionId, identifiers);
}

// 開啟批量移動對話框
static openBatchMovePromptsDialog(sourcePresetId, sourceVersionId, identifiers) {
    let optionsHTML = '';
    presets.forEach(p => {
        p.versions.forEach(v => {
            if (p.id === sourcePresetId && v.id === sourceVersionId) return;
 optionsHTML += `
    <div class="tag-detail-item tag-item-hover move-option" 
         data-preset-id="${p.id}" 
         data-version-id="${v.id}"
         data-preset-name="${p.name.replace(/"/g, '&quot;')}"
         data-version-name="${v.name.replace(/"/g, '&quot;')}"
         onclick="PresetRenderer.selectMoveTargetFromData(this)"
                     style="padding: 12px 16px; margin-bottom: 4px; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 6px; transition: all 0.2s ease;">
                    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">${p.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 2px;">${v.name}</div>
                </div>`;
        });
    });

    const content = `
        <div class="compact-modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.move({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('presetBatchMoveTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
                <p class="compact-modal-desc" style="text-align: left; margin-bottom: 16px;">
                    ${t('presetBatchMoveDescription').replace('$1', `<strong>${identifiers.length}</strong>`)}
                </p>
                <input type="text" id="move-search-input" class="field-input msize-input"
                       placeholder="${t('searchPresets')}"
                       style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                       oninput="PresetRenderer.filterMoveOptions(this.value)">
                <div id="move-options-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); padding: 8px;">
                    ${optionsHTML || `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">${t('noOtherPresets')}</div>`}
                </div>
                <div id="move-selected-display" style="margin-top: 12px; padding: 12px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.9em; min-height: 48px; display: flex; align-items: center;">
                    ${t('pleaseSelectTarget')}
                </div>
            </div>
            <div class="compact-modal-footer" style="justify-content: center; margin-top: 16px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                <button id="confirm-move-btn" class="overview-btn btn-primary" disabled 
                        onclick="PresetRenderer.confirmBatchMovePrompts('${sourcePresetId}', '${sourceVersionId}', '${identifiers.join(',')}')">
                    ${t('confirmMove')}
                </button>
            </div>
        </div>`;
    
    ModalManager.create({ content: content, maxWidth: '600px' });
    window.movePromptTarget = null;
}

// 確認批量移動
static confirmBatchMovePrompts(sourcePresetId, sourceVersionId, identifiersStr) {
    if (!window.movePromptTarget) {
        NotificationManager.warning(t('pleaseSelectTarget'));
        return;
    }
    
    // 將逗號分隔的字串轉回陣列
    const identifiers = identifiersStr.split(',');
    
    const { presetId: targetPresetId, versionId: targetVersionId, presetName, versionName } = window.movePromptTarget;
    
    let successCount = 0;
    identifiers.forEach(identifier => {
        const success = this.moveSinglePrompt(sourcePresetId, sourceVersionId, targetPresetId, targetVersionId, identifier, 100001);
        if (success) successCount++;
    });
    
if (successCount > 0) {
    document.querySelector('.modal')?.remove();
    
    NotificationManager.success(
        t('presetBatchMoveSuccess')
            .replace('$1', successCount)
            .replace('$2', `${presetName} - ${versionName}`)
    );
    
    window.movePromptTarget = null;
    
    // ✅ 強制退出批量模式
    setTimeout(() => {
        const container = document.querySelector(`.prompts-entries-container[data-preset-id="${sourcePresetId}"][data-version-id="${sourceVersionId}"]`);
        const button = document.getElementById(`batch-mode-toggle-${sourcePresetId}-${sourceVersionId}`);
        
        if (container) {
            // 移除批量模式標記
            container.classList.remove('batch-mode-active');
            
            // 隱藏所有勾選框和占位符
            container.querySelectorAll('.batch-checkbox').forEach(cb => cb.style.display = 'none');
            container.querySelectorAll('.batch-placeholder').forEach(ph => ph.style.display = 'none');
        }
        
        if (button) {
            // 重置按鈕樣式
            button.style.background = '';
            button.style.color = '';
            button.title = t('presetBatchMode');
            const span = button.querySelector('span');
            if (span) span.textContent = t('presetBatchMode');
        }
        
        // 隱藏工具列
        this.hideBatchToolbar(sourcePresetId, sourceVersionId);
    }, 200);
} else {
    NotificationManager.error(t('movePromptFailed'));
}
}

// 隱藏批量操作工具列
static hideBatchToolbar(presetId, versionId) {
    const toolbar = document.getElementById(`batch-toolbar-${presetId}-${versionId}`);
    if (toolbar) {
        toolbar.remove();
    }
}

// 更新批量選擇狀態
static updateBatchSelection(presetId, versionId) {
    const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
    if (!container) return;

    const selectedCheckboxes = container.querySelectorAll('.batch-checkbox-input:checked');
    const selectedCount = selectedCheckboxes.length;

    const toolbar = document.getElementById(`batch-toolbar-${presetId}-${versionId}`);
    if (toolbar) {
        const countDisplay = toolbar.querySelector('.batch-count');
        if (countDisplay) {
            countDisplay.textContent = t('presetSelectedCount').replace('$1', selectedCount);
        }

        const actionButtons = toolbar.querySelectorAll('.batch-action-btn');
        actionButtons.forEach(btn => {
            btn.disabled = selectedCount === 0;
        });
    }
}

// 獲取選中的條目 Identifier
static getSelectedPromptIdentifiers(presetId, versionId) {
    const container = document.querySelector(`.prompts-entries-container[data-preset-id="${presetId}"][data-version-id="${versionId}"]`);
    if (!container) return [];

    const selectedCheckboxes = container.querySelectorAll('.batch-checkbox-input:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.dataset.promptIdentifier);
}

// 批量移動提示詞
static batchMovePrompts(presetId, versionId) {
    const identifiers = this.getSelectedPromptIdentifiers(presetId, versionId);
    if (identifiers.length === 0) {
        NotificationManager.warning(t('presetNoPromptsSelected'));
        return;
    }
    this.openBatchMoveDialog(presetId, versionId, identifiers);
}

// ===== 條目移動功能 (Adapted from WorldBook) =====

// 開啟批量移動對話框
static openBatchMoveDialog(sourcePresetId, sourceVersionId, identifiers) {
    let optionsHTML = '';
    presets.forEach(p => {
        p.versions.forEach(v => {
            if (p.id === sourcePresetId && v.id === sourceVersionId) return;
            optionsHTML += `
                <div class="tag-detail-item tag-item-hover move-option" 
                     data-preset-id="${p.id}" 
                     data-version-id="${v.id}"
                     onclick="PresetRenderer.selectMoveTarget('${p.id}', '${v.id}', '${p.name}', '${v.name}')"
                     style="padding: 12px 16px; margin-bottom: 4px; cursor: pointer; background: transparent; border: 1px solid transparent; border-radius: 6px; transition: all 0.2s ease;">
                    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">${p.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 2px;">${v.name}</div>
                </div>`;
        });
    });

    const content = `
        <div class="compact-modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div class="custom-field-right-controls">
                    ${IconManager.move({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('presetBatchMoveTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
                <p class="compact-modal-desc" style="text-align: left; margin-bottom: 16px;">
                    ${t('presetBatchMoveDescription').replace('$1', `<strong>${identifiers.length}</strong>`)}
                </p>
                <input type="text" id="move-search-input" class="field-input msize-input"
                       placeholder="${t('searchPresets')}"
                       style="margin-bottom: 12px; font-size: 0.9em; padding: 12px 16px;"
                       oninput="PresetRenderer.filterMoveOptions(this.value)">
                <div id="move-options-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); padding: 8px;">
                    ${optionsHTML || `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">${t('noOtherPresets')}</div>`}
                </div>
                <div id="move-selected-display" style="margin-top: 12px; padding: 12px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.9em; min-height: 48px; display: flex; align-items: center;">
                    ${t('pleaseSelectTarget')}
                </div>
            </div>
            <div class="compact-modal-footer" style="justify-content: center; margin-top: 16px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                <button id="confirm-move-btn" class="overview-btn btn-primary" disabled 
                        onclick="PresetRenderer.confirmBatchMovePrompts('${sourcePresetId}', '${sourceVersionId}', '${identifiers.join(',')}')">
                    ${t('confirmMove')}
                </button>
            </div>
        </div>`;
    
    ModalManager.create({ content: content, maxWidth: '600px' });
    window.movePromptTarget = null;
}


static movePrompt(sourcePresetId, sourceVersionId, targetPresetId, targetVersionId, identifier) {
    const sourcePreset = presets.find(p => p.id === sourcePresetId);
    const targetPreset = presets.find(p => p.id === targetPresetId);
    if (!sourcePreset || !targetPreset) return false;

    const sourceVersion = sourcePreset.versions.find(v => v.id === sourceVersionId);
    const targetVersion = targetPreset.versions.find(v => v.id === targetVersionId);
    if (!sourceVersion || !targetVersion) return false;

    const promptIndex = sourceVersion.prompts.findIndex(p => p.identifier === identifier);
    if (promptIndex === -1) return false;

    const promptToMove = { ...sourceVersion.prompts[promptIndex] };

    // 檢查目標中是否已存在同名 prompt
    if (targetVersion.prompts.some(p => p.identifier === identifier)) {
        console.warn(`Prompt with identifier ${identifier} already exists in target. Skipping move.`);
        return false; // Or handle merging/renaming
    }

    // 從來源的 order 中移除
    const sourceOrderConfig = sourceVersion.prompt_order?.find(c => c.character_id === 100001);
    if (sourceOrderConfig) {
        sourceOrderConfig.order = sourceOrderConfig.order.filter(item => item.identifier !== identifier);
    }
    
    // (可選) 決定是否從來源的 prompts 列表中移除，目前邏輯是保留，僅移動 order
    // sourceVersion.prompts.splice(promptIndex, 1);

    // 加入目標的 prompts 列表
    if (!targetVersion.prompts) targetVersion.prompts = [];
    targetVersion.prompts.push(promptToMove);
    
    // 加入目標的 order 列表
    let targetOrderConfig = targetVersion.prompt_order?.find(c => c.character_id === 100001);
    if (!targetOrderConfig) {
        // 如果目標沒有可編輯的 order 配置，則創建一個
        if (!targetVersion.prompt_order) targetVersion.prompt_order = [];
        targetOrderConfig = { character_id: 100001, order: [] };
        targetVersion.prompt_order.push(targetOrderConfig);
    }
    targetOrderConfig.order.push({ identifier: identifier, enabled: true });

    TimestampManager.updateVersionTimestamp('preset', sourcePresetId, sourceVersionId);
    TimestampManager.updateVersionTimestamp('preset', targetPresetId, targetVersionId);
    markAsChanged();

    // 重新渲染當前頁面
    this.refreshPresetContent(sourcePresetId, sourceVersionId);
    return true;
}


}


