class PresetRenderer {
    // 主要版本內容渲染函數
static renderPresetVersionContent(preset, version) {
    const content = `
        <div class="preset-version-content">
            <div class="preset-header">
                <h3 class="section-title">${t('editablePrompts')}</h3>
            </div>
            
            <!-- 匯入匯出按鈕 -->
            <div class="preset-controls">
                <button class="loveydovey-add-btn" onclick="PresetRenderer.importJSON('${preset.id}', '${version.id}')">
                    ${IconManager.import({width: 16, height: 16})}
                    ${t('importPreset')}
                </button>
                <button class="loveydovey-add-btn" onclick="PresetRenderer.exportJSON('${preset.id}', '${version.id}')">
                    ${IconManager.download({width: 16, height: 16})}
                    ${t('exportPreset')}
                </button>
                
                <!-- 保存按鈕 -->
                <button class="loveydovey-add-btn" onclick="PresetRenderer.savePreset('${preset.id}', '${version.id}')">
                    ${IconManager.save({width: 16, height: 16})}
                    ${t('savePreset')}
                </button>
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
        <!-- 表格標題 -->
        ${UIUtils.createTableHeader([
            { width: '24px', title: '' },
            { width: '40px', title: '' },
            { width: '1fr', title: t('promptName') },
            { width: '100px', title: t('role'), style: 'text-align: center;' },
            { width: '120px', title: t('type'), style: 'text-align: center;' },
            { width: '80px', title: t('injection'), style: 'text-align: center;' },
            { width: '40px', title: '' }
        ])}
        
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
            <div class="entry-panel sortable-item preset-entry-panel" data-prompt-identifier="${prompt.identifier}">
                <!-- 條目標題列 -->
                <div class="entry-header preset-entry-header">
                    <!-- 拖拽控制 -->
                    <div class="drag-handle custom-field-drag-handle">
                        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
                    </div>
                    
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
                            ${!canEditContent ? 'disabled' : ''}
                            onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'role', this.value)">
                            <option value="">${t('noRole')}</option>
                            <option value="system" ${prompt.role === 'system' ? 'selected' : ''}>${t('system')}</option>
                            <option value="user" ${prompt.role === 'user' ? 'selected' : ''}>${t('user')}</option>
                            <option value="assistant" ${prompt.role === 'assistant' ? 'selected' : ''}>${t('assistant')}</option>
                        </select>
                    </div>
                    
                    <!-- 類型標示 -->
                    <div class="preset-prompt-type">
                        <span class="tag-base tag-sm ${isMarker ? 'tag-marker' : 'tag-editable'}">
                            ${isMarker ? t('marker') : t('editable')}
                        </span>
                    </div>
                    
                    <!-- 注入位置 -->
                    <div class="preset-prompt-injection">
                        <input type="number" class="field-input compact-input" 
                            value="${prompt.injection_position || 0}" 
                            min="0" max="999"
                            ${!canEditContent ? 'disabled' : ''}
                            onchange="PresetRenderer.updatePromptField('${presetId}', '${versionId}', '${prompt.identifier}', 'injection_position', parseInt(this.value))">
                    </div>
                    
                    <!-- 展開按鈕 -->
                    <button class="entry-toggle-btn wb-toggle-btn" onclick="PresetRenderer.togglePromptContent('${prompt.identifier}')">
                        <span class="arrow-icon arrow-right"></span>
                    </button>
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

// 匯入JSON
static importJSON(presetId, versionId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);
            
            // 驗證必要欄位
            if (!importedData.prompts || !Array.isArray(importedData.prompts)) {
                throw new Error(t('invalidJSONFormat') + ': prompts ' + t('arrayRequired'));
            }
            
            if (!importedData.prompt_order || !Array.isArray(importedData.prompt_order)) {
                throw new Error(t('invalidJSONFormat') + ': prompt_order ' + t('arrayRequired'));
            }
            
            // 檢查 identifier 衝突
            const identifiers = importedData.prompts.map(p => p.identifier);
            const duplicates = identifiers.filter((id, index) => identifiers.indexOf(id) !== index);
            
            if (duplicates.length > 0) {
                throw new Error(t('duplicateIdentifiers') + ': ' + duplicates.join(', '));
            }
            
            // 匯入成功，更新資料
            const preset = presets.find(p => p.id === presetId);
            if (preset) {
                const version = preset.versions.find(v => v.id === versionId);
                if (version) {
                    // 保留其他欄位，只更新 prompts 和 prompt_order
                    version.prompts = importedData.prompts;
                    version.prompt_order = importedData.prompt_order;
                    
                    // 更新其他相關設定（如果存在）
                    const fieldsToImport = [
                        'temperature', 'frequency_penalty', 'presence_penalty', 'top_p', 'top_k',
                        'openai_max_context', 'openai_max_tokens', 'wi_format', 'scenario_format',
                        'personality_format', 'send_if_empty', 'impersonation_prompt'
                    ];
                    
                    fieldsToImport.forEach(field => {
                        if (importedData.hasOwnProperty(field)) {
                            version[field] = importedData[field];
                        }
                    });
                    
                    TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
                    markAsChanged();
                    
                    // 重新渲染頁面
                    renderAll();
                    
                    NotificationManager.success(t('importSuccess'));
                }
            }
            
        } catch (error) {
            console.error('Import error:', error);
            alert(t('importError') + ': ' + error.message);
        }
    };
    
    input.click();
}

// 匯出JSON
static exportJSON(presetId, versionId) {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const version = preset.versions.find(v => v.id === versionId);
    if (!version) return;
    
    try {
        // 建立匯出物件，包含完整的 SillyTavern 格式
        const exportData = {
            // 核心陣列
            prompts: version.prompts || [],
            prompt_order: version.prompt_order || [],
            
            // 基本參數
            temperature: version.temperature || 1,
            frequency_penalty: version.frequency_penalty || 0,
            presence_penalty: version.presence_penalty || 0,
            top_p: version.top_p || 1,
            top_k: version.top_k || 0,
            top_a: version.top_a || 0,
            min_p: version.min_p || 0,
            repetition_penalty: version.repetition_penalty || 1,
            
            // OpenAI 設定
            openai_max_context: version.openai_max_context || 100000,
            openai_max_tokens: version.openai_max_tokens || 4000,
            wrap_in_quotes: version.wrap_in_quotes || false,
            names_behavior: version.names_behavior || 0,
            
            // 格式設定
            wi_format: version.wi_format || "{0}",
            scenario_format: version.scenario_format || "{{scenario}}",
            personality_format: version.personality_format || "{{personality}}",
            
            // 提示詞模板
            send_if_empty: version.send_if_empty || "",
            impersonation_prompt: version.impersonation_prompt || "",
            new_chat_prompt: version.new_chat_prompt || "",
            new_group_chat_prompt: version.new_group_chat_prompt || "",
            new_example_chat_prompt: version.new_example_chat_prompt || "",
            continue_nudge_prompt: version.continue_nudge_prompt || "",
            group_nudge_prompt: version.group_nudge_prompt || "",
            
            // 其他設定
            bias_preset_selected: version.bias_preset_selected || "Default (none)",
            max_context_unlocked: version.max_context_unlocked !== false,
            stream_openai: version.stream_openai !== false,
            
            // 進階設定
            assistant_prefill: version.assistant_prefill || "",
            claude_use_sysprompt: version.claude_use_sysprompt || false,
            squash_system_messages: version.squash_system_messages || false,
            show_thoughts: version.show_thoughts || false,
            reasoning_effort: version.reasoning_effort || "medium",
            enable_web_search: version.enable_web_search || false,
            
            // 擴展
            extensions: version.extensions || {}
        };
        
        // 建立下載
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${preset.name}_${version.name}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        NotificationManager.success(t('exportSuccess'));
        
    } catch (error) {
        console.error('Export error:', error);
        alert(t('exportError') + ': ' + error.message);
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

// 保存預設
static savePreset(presetId, versionId) {
    try {
        TimestampManager.updateVersionTimestamp('preset', presetId, versionId);
        saveData();
        NotificationManager.success(t('saveSuccess'));
    } catch (error) {
        console.error('Save error:', error);
        NotificationManager.error(t('saveError') + ': ' + error.message);
    }
}

}


