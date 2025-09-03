// 卿卿我我專用渲染器
class LoveyDoveyRenderer {
    
    // 主要版本內容渲染
static renderVersionContent(character, version) {
    
    return `
        <div class="version-content loveydovey-mode">
            <!--  外層容器增加邊距 -->
            <div class="loveydovey-content-section" style="width: 95%; margin: 0 auto;">
                <div class="field-sections">
                    
                   <!-- 第一大區：個人資料（可折疊） -->
<div class="field-section collapsible-section" data-section="personal-profile" style="margin-top: -10px;">
    <div class="section-header collapsible-header ld-section-header" onclick="LoveyDoveyRenderer.toggleSection('personal-profile', event)">
                            <span class="collapse-icon">
                                <span class="arrow-icon arrow-down" style="width: 8px; height: 8px; color: var(--accent-color);"></span>
                            </span>
                            <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: var(--text-color);">
                                ${t('profileSection')}
                            </h3>
                        </div>
                        <div class="section-content collapsible-content">
                            ${this.renderPersonalProfileFields(character, version)}
                        </div>
                    </div>
                    
                    <!-- 第二大區：角色基本設定（可折疊） -->
                    <div class="field-section collapsible-section" data-section="basic-settings">
                        <div class="section-header collapsible-header ld-section-header" onclick="LoveyDoveyRenderer.toggleSection('basic-settings', event)">
                            <span class="collapse-icon">
                                <span class="arrow-icon arrow-down" style="width: 8px; height: 8px; color: var(--accent-color);"></span>
                            </span>
                            <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: var(--text-color);">
                                ${t('basicSettingsSection')}
                            </h3>
                        </div>
                        <div class="section-content collapsible-content">
                            ${this.renderBasicSettingsFields(character, version)}
                        </div>
                    </div>
                    
                    <!-- 第三大區：第一次聊天場景（可折疊） -->
                    <div class="field-section collapsible-section" data-section="first-chat">
                            <div class="section-header collapsible-header ld-section-header"
                                onclick="LoveyDoveyRenderer.toggleSection('first-chat', event)">
                                <span class="collapse-icon">
                                <span class="arrow-icon arrow-down" style="width: 8px; height: 8px; color: var(--accent-color);"></span>
                                </span>
                                <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: var(--text-color);">
                                ${t('firstChatScenario')}
                                </h3>
                        </div>
                        <div class="section-content collapsible-content">
                            ${this.renderFirstChatFields(character, version)}
                        </div>
                    </div>
                    
                    <!-- 第四大區：角色詳細設定（可折疊） -->
                    <div class="field-section collapsible-section" data-section="detailed-settings">
                        <div class="section-header collapsible-header ld-section-header" onclick="LoveyDoveyRenderer.toggleSection('detailed-settings', event)">
                            <span class="collapse-icon">
                                <span class="arrow-icon arrow-down" style="width: 8px; height: 8px; color: var(--accent-color);"></span>
                            </span>
                            <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: var(--text-color);">
                                ${t('detailedSettings')}
                            </h3>
                        </div>
                        <div class="section-content collapsible-content">
                            ${this.renderDetailedSettingsFields(character, version)}
                        </div>
                    </div>
                    
                    <!-- 第五大區：創作者事件（可折疊） -->
                    <div class="field-section collapsible-section" data-section="creator-events">
                        <div class="section-header collapsible-header ld-section-header" onclick="LoveyDoveyRenderer.toggleSection('creator-events', event)">
                            <span class="collapse-icon">
                                <span class="arrow-icon arrow-down" style="width: 8px; height: 8px; color: var(--accent-color);"></span>
                            </span>
                            <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: var(--text-color);">
                                ${t('creatorEvents')}
                            </h3>
                        </div>
                        <div class="section-content collapsible-content">
                            ${this.renderCreatorEventsFields(character, version)}
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    `;
}



     static renderPersonalProfileFields(character, version) {
    return `
        <!-- 📌 第一區：頭像 + 基本資訊橫向排列 -->
        <div style="display: flex; gap: 24px; align-items: flex-start; margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
            <!-- 頭像 -->
            <div class="avatar-section">
                <div class="avatar-preview loveydovey-avatar ${version.profileImage ? '' : 'avatar-upload-placeholder'}" 
     onclick="triggerLoveyDoveyImageUpload('${character.id}', '${version.id}')"
     ondragenter="showAvatarDragOverlay(event, this)"
     ondragover="event.preventDefault(); event.stopPropagation();"
     ondragleave="handleAvatarDragLeave(event, this)"
     ondrop="handleAvatarDrop(event, '${character.id}', '${version.id}', 'loveydovey'); hideAvatarDragOverlay(this);"
     style="
         ${version.profileImage ? 'border: 1px solid var(--border-color);' : 'border: 2px dashed var(--border-color);'}
     "
     onmouseover="this.style.opacity='0.8'${version.profileImage ? '; this.style.transform=\'scale(1.02)\'' : '; this.style.borderColor=\'var(--primary-color)\''}"
     onmouseout="this.style.opacity='1'${version.profileImage ? '; this.style.transform=\'scale(1)\'' : '; this.style.borderColor=\'var(--border-color)\''}">
                    ${version.profileImage ? 
                        `<img src="${BlobManager.getBlobUrl(version.profileImage)}" alt="Profile">` : 
                        `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.9em; text-align: center;">
                            <div>
                                <div style="color: var(--text-muted); font-size: 3em; margin-bottom: 12px;">+</div>
                                ${t('clickToUploadAvatar')}
                            </div>
                        </div>`
                    }
                </div>
                <input type="file" class="file-input" id="profileImage-upload-${version.id}" accept="image/*" 
                       onchange="handleLoveyDoveyImageUpload('${character.id}', '${version.id}', this.files[0])">
            </div>

            <!-- 基本欄位 -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
                ${LoveyDoveyRenderer.createLoveyDoveyField({
                    id: `characterName-${version.id}`,
                    label: t('characterName'),
                    placeholder: t('characterNamePlaceholder'),
                    value: version.characterName || '',
                    itemType: 'loveydovey',
                    itemId: character.id,
                    versionId: version.id,
                    fieldName: 'characterName',
                    isTextarea: false,
                    maxLength: 15
                })}
                ${LoveyDoveyRenderer.createLoveyDoveyField({
                    id: `age-${version.id}`,
                    label: t('age'),
                    placeholder: t('agePlaceholder'),
                    value: version.age || '',
                    itemType: 'loveydovey',
                    itemId: character.id,
                    versionId: version.id,
                    fieldName: 'age',
                    isTextarea: false,
                    maxLength: 15
                })}
                ${LoveyDoveyRenderer.createLoveyDoveyField({
                    id: `occupation-${version.id}`,
                    label: t('occupation'),
                    placeholder: t('occupationPlaceholder'),
                    value: version.occupation || '',
                    itemType: 'loveydovey',
                    itemId: character.id,
                    versionId: version.id,
                    fieldName: 'occupation',
                    isTextarea: false,
                    maxLength: 15
                })}
                ${LoveyDoveyRenderer.createLoveyDoveyField({
                    id: `characterQuote-${version.id}`,
                    label: t('characterQuote'),
                    placeholder: t('characterQuotePlaceholder'),
                    value: version.characterQuote || '',
                    itemType: 'loveydovey',
                    itemId: character.id,
                    versionId: version.id,
                    fieldName: 'characterQuote',
                    isTextarea: true,
                    maxLength: 80,
                    customStyle: 'height: 80px; resize: none;'
                })}
            </div>
        </div>

        <!-- 📌 第二區：公開描述 -->
        <div style="margin-top: -20px;">
            ${LoveyDoveyRenderer.createLoveyDoveyField({
                id: `publicDescription-${version.id}`,
                label: t('publicDescription'),
                placeholder: t('publicDescriptionPlaceholder'),
                value: version.publicDescription || '',
                itemType: 'loveydovey',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'publicDescription',
                isTextarea: true,
                maxLength: 700,
                customStyle: 'height: 120px; resize: vertical;'
            })}
        </div>

         <!-- 📌 第三區：角色連結網址 -->
        <div style="margin-top: -10px; margin-bottom: 30px;">
             ${LoveyDoveyRenderer.createLoveyDoveyField({
                id: `characterLinkUrl-${version.id}`,
                label: t('characterLinkUrl'), 
                placeholder: t('characterLinkUrlPlaceholder'),
                value: version.characterLinkUrl || '',
                itemType: 'loveydovey',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'characterLinkUrl',
                isTextarea: false,
            })}
        </div>

        <!-- 📌 第四區：標籤 -->
        <div class="field-group" style="margin-top: -10px;">
            <label class="field-label">${t('tags')}</label>
            ${TagInputManager.createTagInput({
                id: `tags-${version.id}`,
                value: version.tags || '',
                itemType: 'loveydovey',
                itemId: character.id,
                versionId: version.id,
                fieldName: 'tags',
                placeholder: t('tagsPlaceholder')
            })}
        </div>
    `;
}


    // 第二大區：渲染角色基本設定欄位
    static renderBasicSettingsFields(character, version) {
    return `
        <!-- 性別欄位 -->
        <div class="field-group">
            <label class="field-label">${t('gender')}</label>
            <div style="display: flex; gap: 16px; margin-top: 8px;">
                <label class="radio-option" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="radio" name="gender-${version.id}" value="male" 
                        ${version.gender === 'male' ? 'checked' : ''}
                        onchange="updateField('loveydovey', '${character.id}', '${version.id}', 'gender', this.value);"
                        style="margin: 0;">
                    <span style="font-size: var(--font-lg); color: var(--text-color);">${t('male')}</span>
                </label>
                <label class="radio-option" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="radio" name="gender-${version.id}" value="female" 
                        ${version.gender === 'female' ? 'checked' : ''}
                        onchange="updateField('loveydovey', '${character.id}', '${version.id}', 'gender', this.value);"
                        style="margin: 0;">
                    <span style="font-size: var(--font-lg); color: var(--text-color);">${t('female')}</span>
                </label>
                <label class="radio-option" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="radio" name="gender-${version.id}" value="unset" 
                        ${version.gender === 'unset' || !version.gender ? 'checked' : ''}
                        onchange="updateField('loveydovey', '${character.id}', '${version.id}', 'gender', this.value);"
                        style="margin: 0;">
                    <span style="font-size: var(--font-lg); color: var(--text-color);">${t('unset')}</span>
                </label>
            </div>
        </div>

        <!-- 基本資訊 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `basicInfo-${version.id}`,
            label: t('basicInfo'),
            placeholder: t('basicInfoPlaceholder'),
            value: version.basicInfo || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'basicInfo',
            isTextarea: true,
            maxLength: 700,
            customStyle: 'height: 120px; resize: vertical;'
        })}

        <!-- 個性摘要 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `personality-${version.id}`,
            label: t('personality'),
            placeholder: t('personalityPlaceholder'),
            value: version.personality || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'personality',
            isTextarea: true,
            maxLength: 700,
            customStyle: 'height: 120px; resize: vertical;'
        })}

        <!-- 說話風格與習慣 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `speakingStyle-${version.id}`,
            label: t('speakingStyle'),
            placeholder: t('speakingStylePlaceholder'),
            value: version.speakingStyle || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'speakingStyle',
            isTextarea: true,
            maxLength: 700,
            customStyle: 'height: 120px; resize: vertical;'
        })}
    `;
}

    // 渲染第一次聊天場景欄位
    static renderFirstChatFields(character, version) {
    return `
        <!-- 情境腳本 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `scenarioScript-${version.id}`,
            label: t('scenarioScript'),
            placeholder: t('scenarioScriptPlaceholder'),
            value: version.scenarioScript || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'scenarioScript',
            isTextarea: true,
            maxLength: 800,
            customStyle: 'height: 120px; resize: vertical;'
        })}

        <!-- 角色對話 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `characterDialogue-${version.id}`,
            label: t('characterDialogue'),
            placeholder: t('characterDialoguePlaceholder'),
            value: version.characterDialogue || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'characterDialogue',
            isTextarea: true,
            maxLength: 800,
            customStyle: 'height: 120px; resize: vertical;'
        })}
    `;
}

    // 渲染角色詳細設定欄位
static renderDetailedSettingsFields(character, version) {
    return `
        <!-- 喜歡 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `likes-${version.id}`,
            label: t('likes'),
            placeholder: t('likesPlaceholder'),
            value: version.likes || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'likes',
            isTextarea: false,
            maxLength: 50
        })}

        <!-- 不喜歡 -->
        ${LoveyDoveyRenderer.createLoveyDoveyField({
            id: `dislikes-${version.id}`,
            label: t('dislikes'),
            placeholder: t('dislikesPlaceholder'),
            value: version.dislikes || '',
            itemType: 'loveydovey',
            itemId: character.id,
            versionId: version.id,
            fieldName: 'dislikes',
            isTextarea: false,
            maxLength: 50
        })}

        <!-- 附加資訊動態區域 -->
        <div id="additional-info-container-${version.id}">
            ${this.renderAdditionalInfoContainer(character, version)}
        </div>
    `;
}

       // 渲染附加資訊容器（包含列表和按鈕）
    static renderAdditionalInfoContainer(character, version) {
        const additionalInfo = version.additionalInfo || [];
        const count = additionalInfo.length;
        const isOverRecommended = count > 10;
        
        return `
            <!-- 附加資訊列表 -->
            <div id="additional-info-list-${version.id}" class="additional-info-sortable">
    ${this.renderAdditionalInfoList(character, version)}
</div>
            
            <!-- 添加按鈕 -->
            <div style="margin-bottom: 16px;">
   <button class="loveydovey-add-btn" onclick="addAdditionalInfo('${character.id}', '${version.id}')">
    ${IconManager.plus({width: 16, height: 16})}
    ${t('addAdditionalInfo')} (${count}/10)
</button>
            </div>
        `;
    }
// 渲染附加資訊列表
static renderAdditionalInfoList(character, version) {
    if (!version.additionalInfo || version.additionalInfo.length === 0) {
        return '';
    }

    return version.additionalInfo.map((info, index) => `
        <div class="additional-info-item sortable-item" data-info-id="${info.id}" 
             style="
                 background: var(--header-bg);
                 border: 1px solid var(--border-color);
                 border-radius: 8px;
                 padding: 12px 16px;
                 margin-bottom: 16px;
                 position: relative;
                 transition: all 0.2s ease;
             ">
             
            <!-- 可點擊的標題列（用於折疊） -->
            <div class="additional-info-header" 
                 onclick="toggleAdditionalInfoCollapseLazy('${character.id}', '${version.id}', '${info.id}', ${index}, event)"
                 style="
                     display: flex; 
                     justify-content: space-between; 
                     align-items: flex-start; 
                     cursor: pointer;
                     padding: 4px 0;
                     margin-bottom: 0px;
                     border-radius: 4px;
                     transition: all 0.2s ease;
                 "
                 onmouseover="this.style.backgroundColor='var(--bg-color)'"
                 onmouseout="this.style.backgroundColor='transparent'">
                
                <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1;">
                    <!-- 拖曳控制柄 -->
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
                        margin-top: 2px;
                        flex-shrink: 0;
                    " onmouseover="this.style.color='var(--text-color)'; this.style.backgroundColor='var(--border-color)'"
                       onmouseout="this.style.color='var(--text-muted)'; this.style.backgroundColor='transparent'">
                        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
                    </div>
                    
                    <!-- 展開時：顯示「附加資訊 N」-->
                    <div class="info-title-expanded" id="title-expanded-${info.id}" style="display: none;">

                        <h4 style="margin: 0; font-size: 0.95em; font-weight: 600; color: var(--text-color);">
                            ${t('additionalInfo')} ${index + 1}
                        </h4>
                    </div>
                    
                    <!-- 折疊時：顯示「附加資訊 N - 標題」 -->
<div class="info-title-collapsed" id="title-collapsed-${info.id}" style="display: flex; flex: 1;">
    <div style="font-weight: 500; color: var(--text-color); font-size: 0.9em;">
        ${t('additionalInfo')} ${index + 1} － ${info.title || t('noTitle')}
    </div>
</div>
                </div>
                
                <!-- 刪除按鈕（使用 SVG 圖示） -->
                <button class="delete-btn" 
        onclick="event.stopPropagation(); deleteAdditionalInfo('${character.id}', '${version.id}', '${info.id}')"
        style="flex-shrink: 0;">
    ${IconManager.delete()}
</button>
            </div>

            <!-- 可折疊的內容區域 -->
<div class="additional-info-content" id="content-${info.id}" style="display: none;">
    <!-- Content will be loaded lazily when expanded -->
            </div>
        </div>
    `).join('');
}
// 渲染創作者事件欄位（第五大區）
static renderCreatorEventsFields(character, version) {
    const creatorEvents = version.creatorEvents || [];
    const count = creatorEvents.length;
    
    return `
        <!-- 創作者事件動態區域 -->
        <div id="creator-events-container-${version.id}">
            <!-- 創作者事件列表 -->
            <div id="creator-events-list-${version.id}" class="creator-events-sortable">
                ${creatorEvents.length === 0 ? `
                    
                ` : creatorEvents.map((event, index) => `
                    <div class="creator-event-item sortable-item" data-event-id="${event.id}" 
                    style="
                        background: var(--header-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 12px 16px;
                        margin-bottom: 16px;
                        position: relative;
                        transition: all 0.2s ease;
                    ">
                        
                       <!-- 可點擊的標題列（用於折疊） -->
<div class="creator-event-header" 
     onclick="toggleCreatorEventCollapseLazy('${character.id}', '${version.id}', '${event.id}', ${index}, event)"
     style="
         display: flex; 
         justify-content: space-between; 
         align-items: flex-start; 
         cursor: pointer;
         padding: 4px 0;
         margin-bottom: 0px;
         border-radius: 4px;
         transition: all 0.2s ease;
     "
     onmouseover="this.style.backgroundColor='var(--bg-color)'"
     onmouseout="this.style.backgroundColor='transparent'">
    
    <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1;">
    <!-- 拖曳控制柄 -->
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
        margin-top: 2px;
        flex-shrink: 0;
    " onmouseover="this.style.color='var(--text-color)'; this.style.backgroundColor='var(--border-color)'"
       onmouseout="this.style.color='var(--text-muted)'; this.style.backgroundColor='transparent'">
        ${IconManager.gripVertical({width: 12, height: 12, style: 'display: block;'})}
    </div>
        
        <!-- 展開時：顯示「創作者事件 N」-->
<div class="event-title-expanded" id="title-expanded-${event.id}" style="display: none;">
            <h4 style="margin: 0; font-size: 0.95em; font-weight: 600; color: var(--text-color);">
                ${t('creatorEvent')} ${index + 1}
                ${event.isSecret ? IconManager.lock({width: 12, height: 12}) : ''}
            </h4>
        </div>
        
        <!-- 折疊時：顯示標題+時間地點 -->
        <div class="event-title-collapsed" id="title-collapsed-${event.id}" style="display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            line-height: 1.3;
        ">
            <!-- 主標題 -->
            <div style="
                font-weight: 600; 
                color: var(--text-color); 
                font-size: 0.95em;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                padding: 0;
            ">
                <span id="collapsed-title-text-${event.id}">${event.title || t('unnamedEvent')}</span>
                ${event.isSecret ? IconManager.lock({width: 12, height: 12}) : ''}
            </div>
            <!-- 時間地點 -->
            <div id="collapsed-timeplace-text-${event.id}" style="
                font-size: 0.8em; 
                color: var(--text-muted); 
                font-style: italic;
                margin: 0;
                padding: 0;
                line-height: 1.2;
                ${!event.timeAndPlace ? 'display: none;' : ''}
            ">
                ${event.timeAndPlace}
            </div>
        </div>
    </div>
    
    <!-- 刪除按鈕（使用 SVG 圖示） -->
<button class="delete-btn" 
        onclick="event.stopPropagation(); deleteCreatorEvent('${character.id}', '${version.id}', '${event.id}')"
        style="flex-shrink: 0;">
    ${IconManager.delete()}
</button>
</div>

                        <!-- 可折疊的內容區域 -->
<div class="creator-event-content" id="content-${event.id}" style="display: none;">
    <!-- Content will be loaded lazily when expanded -->
</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- 添加按鈕 -->
            <div style="margin-bottom: 16px;">
   <button class="loveydovey-add-btn" onclick="addCreatorEvent('${character.id}', '${version.id}')" ${count >= 20 ? 'disabled' : ''}>
    ${IconManager.plus({width: 16, height: 16})}
    ${t('addCreatorEvents')} (${count}/20)
</button>
</div>
        </div>
    `;
}

// 自動啟用拖曳
static initializeCreatorEventsDragSort(characterId, versionId) {
    setTimeout(() => {
        if (typeof enableCreatorEventsDragSort === 'function') {
            enableCreatorEventsDragSort(characterId, versionId);
        }
    }, 100);
}

// 生成事件預覽文字
static generateEventPreview(event) {
    const timePlace = event.timeAndPlace || '';
    const title = event.title || '';
    
    if (timePlace && title) {
        return `${timePlace} - ${title}`;
    } else if (timePlace) {
        return timePlace;
    } else if (title) {
        return title;
    } else {
        return '（尚無內容）';
    }
}

    
    // 折疊展開功能  
static toggleSection(sectionName, event = null) {
    let section;
    
    if (event) {
        // 智慧查找：在點擊元素的版本容器內查找
        const versionContainer = event.target.closest('.version-content');
        section = versionContainer ? 
            versionContainer.querySelector(`[data-section="${sectionName}"]`) :
            document.querySelector(`[data-section="${sectionName}"]`);
    } else {
        // 向後相容：沒有event時使用原邏輯
        section = document.querySelector(`[data-section="${sectionName}"]`);
    }
    
    if (!section) return;
    
    const content = section.querySelector('.collapsible-content');
    const arrowIcon = section.querySelector('.arrow-icon');
    
    if (content.style.display === 'none') {
        // 展開
        content.style.display = 'block';
        if (arrowIcon) {
            arrowIcon.classList.remove('arrow-right');
            arrowIcon.classList.add('arrow-down');
        }
    } else {
        // 折疊
        content.style.display = 'none';
        if (arrowIcon) {
            arrowIcon.classList.remove('arrow-down');
            arrowIcon.classList.add('arrow-right');
        }
    }
}

// 卿卿我我專用欄位創建函數
static createLoveyDoveyField(config) {
    const {
        id, label, placeholder, value = '', 
        itemType, itemId, versionId, fieldName,
        isTextarea = false, maxLength = 0,
        customStyle = '', rows = 3
    } = config;

    const currentLength = (value || '').length;
    const isOverLimit = maxLength > 0 && currentLength > maxLength;
    const showStats = maxLength > 0;
    const isQuoteField = fieldName === 'characterQuote';

    // 統計文字樣式
    const statsStyle = isOverLimit ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);';

    // 輸入框樣式
    const inputBorderStyle = isOverLimit ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : '';

    // === 主輸入欄位 ===
    const inputElement = isTextarea ? 
        `<textarea 
    class="field-input"
    id="${id}" 
    placeholder="${placeholder}"
    style="${isQuoteField 
    ? 'height: 92px; min-height: 92px; max-height: 92px; resize: none; overflow-y: hidden; padding: 12px 16px; line-height: 1.5; scrollbar-width: none; -ms-overflow-style: none;' 
    : (customStyle || 'min-height: 200px; max-height: 70vh; resize: vertical;')} ${inputBorderStyle}"
    oninput="updateLoveyDoveyFieldWithPath('${itemType}', '${itemId}', '${versionId}', '${fieldName}', this.value, ${maxLength});">${value}</textarea>`
        :
        `<input 
        type="text" 
        class="field-input" 
        id="${id}" 
        placeholder="${placeholder}"
        style="${inputBorderStyle}"
        oninput="updateLoveyDoveyFieldWithPath('${itemType}', '${itemId}', '${versionId}', '${fieldName}', this.value, ${maxLength})"
        value="${value}"
    >`;
    
    // === 全螢幕按鈕（只有 textarea 才顯示）===
    const fullscreenBtn = (isTextarea && fieldName !== 'characterQuote') ? 
        `<button 
            class="fullscreen-btn" 
            onclick="openFullscreenEditor('${id}', '${label}')" 
            title="${t('fullscreenEdit')}" 
            style="margin-left: 8px;"
        >⛶</button>` 
        : '';

    // === 輸出整體 ===
    return `
        <div class="field-group">
            <label class="field-label">
                ${label}
                ${showStats ? `<span class="loveydovey-char-count" data-target="${id}" style="margin-left: 12px; font-size: 0.85em; ${statsStyle}">${currentLength} / ${maxLength} ${t('chars')}</span>` : ''}
                ${fullscreenBtn}
            </label>
            ${inputElement}
        </div>
    `;
}
    
}


function hideEventFullscreenBtn(textarea) {
    setTimeout(() => {
        const container = textarea.parentElement;
        const btn = container.querySelector('.event-fullscreen-btn');
        if (btn) {
            btn.style.opacity = '0';
            btn.style.visibility = 'hidden';
            btn.style.transform = 'translateX(-8px)';
        }
    }, 150);
}


// 卿卿我我圖片上傳觸發函數
function triggerLoveyDoveyImageUpload(itemId, versionId) {
    const fileInput = document.getElementById(`profileImage-upload-${versionId}`);
    if (fileInput) {
        fileInput.click();
    }
}

// 卿卿我我專用圖片上傳函數
async function handleLoveyDoveyImageUpload(itemId, versionId, file = null) {
    if (!file) {
        const fileInput = document.getElementById(`profileImage-upload-${versionId}`);
        if (fileInput) {
            fileInput.click();
        }
        return;
    }
    
// 使用裁切器
ImageCropper.show(file, '1:1', async (croppedDataUrl) => {
    updateField('loveydovey', itemId, versionId, 'profileImage', croppedDataUrl);
    
    // 🌟 雙屏模式下避免整頁重渲染
    if (crossTypeCompareMode && currentMode === 'crosstype') {
        console.log('雙屏模式卿卿我我圖片更新 - 避免整頁重渲染');
        
        // 重新渲染雙屏界面
        CrossTypeCompareManager.renderCrossTypeInterface();
        
    } else {
        // 普通模式使用原有邏輯
        renderContent();
    }
});
}

function updateLoveyDoveyField(itemType, itemId, versionId, fieldName, value, maxLength = 0) {
    updateField(itemType, itemId, versionId, fieldName, value, 'programmatic');

    if (maxLength > 0) {
        updateLoveyDoveyCharCount(itemId, versionId, fieldName, value, maxLength);
    }
}

    function updateLoveyDoveyCharCount(itemId, versionId, fieldName, value, maxLength) {
    let inputId;
    
    // 處理附加資訊欄位的 ID
    if (fieldName.startsWith('additionalInfo.')) {
        const pathParts = fieldName.split('.');
        const index = pathParts[1];
        const field = pathParts[2];
        
        // 找到對應的 info ID
        const character = loveyDoveyCharacters.find(c => c.id === itemId);
        if (character) {
            const version = character.versions.find(v => v.id === versionId);
            if (version && version.additionalInfo && version.additionalInfo[index]) {
                const infoId = version.additionalInfo[index].id;
                inputId = `additional${field.charAt(0).toUpperCase() + field.slice(1)}-${infoId}`;
            }
        }
    } 
    // 處理創作者事件欄位的 ID
    else if (fieldName.startsWith('creatorEvents.')) {
        const pathParts = fieldName.split('.');
        const index = pathParts[1];
        const field = pathParts[2];
        
        // 找到對應的 event ID
        const character = loveyDoveyCharacters.find(c => c.id === itemId);
        if (character) {
            const version = character.versions.find(v => v.id === versionId);
            if (version && version.creatorEvents && version.creatorEvents[index]) {
                const eventId = version.creatorEvents[index].id;
                switch (field) {
                    case 'timeAndPlace':
                        inputId = `eventTimeAndPlace-${eventId}`;
                        break;
                    case 'title':
                        inputId = `eventTitle-${eventId}`;
                        break;
                    case 'content':
                        inputId = `eventContent-${eventId}`;
                        break;
                }
            }
        }
    } 
    else {
        // 普通欄位
        inputId = `${fieldName}-${versionId}`;
    }
        
    if (!inputId) {
        console.warn('無法生成inputId:', { itemId, versionId, fieldName });
        return;
    }
        
    // 查找統計元素（框外面的顯示）
    const countElement = document.querySelector(`[data-target="${inputId}"]`);
    const inputElement = document.getElementById(inputId);
    
    if (!countElement) {
        console.warn('找不到字數統計元素:', inputId);
        return;
    }
    
    if (!inputElement) {
        console.warn('找不到輸入元素:', inputId);
        return;
    }
    
    const currentLength = (value || '').length;
    const isOverLimit = currentLength > maxLength;
    
    // 更新統計文字
    countElement.textContent = `${currentLength} / ${maxLength} ${t('chars')}`;
    
    // 更新統計文字顏色
    if (isOverLimit) {
        countElement.style.color = '#e74c3c';
        countElement.style.fontWeight = 'bold';
    } else {
        countElement.style.color = 'var(--text-muted)';
        countElement.style.fontWeight = 'normal';
    }
    
    // 更新輸入框邊框
    if (isOverLimit) {
        inputElement.style.borderColor = '#e74c3c';
        inputElement.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
        inputElement.classList.add('loveydovey-error');
    } else {
        inputElement.style.borderColor = '';
        inputElement.style.boxShadow = '';
        inputElement.classList.remove('loveydovey-error');
    }
    
    
}


// ===== 卿卿我我附加資訊管理函數 =====

// 新增附加資訊
let isAdding = false;
let isAddingEvent = false;
function addAdditionalInfo(characterId, versionId) {
    if (isAdding) return; // 防止重複觸發
    isAdding = true;
    
    // 保存當前狀態
    const currentStates = getCurrentAdditionalInfoCollapseStates();
    
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) {
        isAdding = false;
        return;
    }
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version) {
        isAdding = false;
        return;
    }
    
    // 初始化 additionalInfo 陣列（如果不存在）
    if (!version.additionalInfo) {
        version.additionalInfo = [];
    }
    
    // 創建新的附加資訊
    const newInfo = {
        id: generateId(),
        title: '',
        content: ''
    };
    
    version.additionalInfo.push(newInfo);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    //  使用 requestAnimationFrame 減少閃現
    requestAnimationFrame(() => {
        renderAdditionalInfoList(characterId, versionId);
        
        setTimeout(() => {
            restoreAdditionalInfoCollapseStates(currentStates);
            // 重新啟用拖曳功能
            if (typeof DragSortManager !== 'undefined') {
                DragSortManager.enableAdditionalInfoDragSort(characterId, versionId);
            }
            
            // 解除鎖定
            isAdding = false;
        }, 16); // 一個frame的時間
    });
}

// 刪除附加資訊
function deleteAdditionalInfo(characterId, versionId, infoId) {
    const confirmDelete = confirm('確定要刪除此附加資訊嗎？\n\n⚠️ 刪除後無法復原！');
    
    if (!confirmDelete) return;
    
    //  在刪除前先保存其他項目的折疊狀態
    const currentStates = getCurrentAdditionalInfoCollapseStates();
    // 移除即將被刪除的項目狀態
    delete currentStates[infoId];
    
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.additionalInfo) return;
    
    // 移除指定的附加資訊
    version.additionalInfo = version.additionalInfo.filter(info => info.id !== infoId);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    //  重新渲染附加資訊列表
    renderAdditionalInfoList(characterId, versionId);
    
    //  恢復其他項目的折疊狀態
    setTimeout(() => {
        restoreAdditionalInfoCollapseStates(currentStates);
        // 重新啟用拖曳功能
        if (typeof DragSortManager !== 'undefined') {
            DragSortManager.enableAdditionalInfoDragSort(characterId, versionId);
        }
    }, 50);
}

// 更新附加資訊欄位
function updateAdditionalInfoField(characterId, versionId, fieldPath, value, maxLength = 0) {
    // 臨時調試
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.additionalInfo) return;
    
    // 解析欄位路徑 "additionalInfo.0.title" -> [0, 'title']
    const pathParts = fieldPath.split('.');
    if (pathParts.length !== 3 || pathParts[0] !== 'additionalInfo') return;
    
    const index = parseInt(pathParts[1]);
    const field = pathParts[2];
    
    if (index < 0 || index >= version.additionalInfo.length) return;
    
    // 更新欄位值
    version.additionalInfo[index][field] = value;
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    updateAllPageStats();
}

function renderAdditionalInfoList(characterId, versionId) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const container = document.getElementById(`additional-info-container-${versionId}`);
    if (!container) return;
    
    // 重新渲染整個容器（包含按鈕）
    container.innerHTML = LoveyDoveyRenderer.renderAdditionalInfoContainer(character, version);
    
    // 重新初始化功能
    setTimeout(() => {
        initAutoResize();
        updateAllPageStats();
        // 啟用附加資訊拖曳排序
        if (typeof DragSortManager !== 'undefined') {
            DragSortManager.enableAdditionalInfoDragSort(characterId, versionId);
        }
        
    }, 50);
}

function updateLoveyDoveyFieldWithPath(itemType, itemId, versionId, fieldPath, value, maxLength = 0) {
    // 如果是附加資訊欄位，使用專門的函數
    if (fieldPath.startsWith('additionalInfo.')) {
        updateAdditionalInfoField(itemId, versionId, fieldPath, value, maxLength);
        
        // 更新字數統計
        if (maxLength > 0) {
            updateLoveyDoveyCharCount(itemId, versionId, fieldPath, value, maxLength);
        }
    } 
    //  如果是創作者事件欄位，使用專門的函數
    else if (fieldPath.startsWith('creatorEvents.')) {
        updateCreatorEventField(itemId, versionId, fieldPath, value);
        
        // 更新字數統計
        if (maxLength > 0) {
            updateLoveyDoveyCharCount(itemId, versionId, fieldPath, value, maxLength);
        }
    } 
    else {
        // 普通欄位使用原有函數
        updateLoveyDoveyField(itemType, itemId, versionId, fieldPath, value, maxLength);
    }
}

// 顯示附加資訊的全螢幕按鈕
function showAdditionalFullscreenBtn(textarea) {
    const container = textarea.parentElement;
    const btn = container.querySelector('.fullscreen-btn-toolbar');
    if (btn) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.transform = 'translateX(0)';
    }
}

// 隱藏附加資訊的全螢幕按鈕
function hideAdditionalFullscreenBtn(textarea) {
    setTimeout(() => {
        const container = textarea.parentElement;
        const btn = container.querySelector('.fullscreen-btn-toolbar');
        if (btn) {
            btn.style.opacity = '0';
            btn.style.visibility = 'hidden';
            btn.style.transform = 'translateX(-8px)';
        }
    }, 150);
}
// ===== 創作者事件管理函數 =====

// 新增創作者事件
function addCreatorEvent(characterId, versionId) {
    // 保存當前狀態
    const currentStates = getCurrentCreatorEventCollapseStates();
    
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 初始化 creatorEvents 陣列
    if (!version.creatorEvents) {
        version.creatorEvents = [];
    }
    
    // 檢查數量限制
    if (version.creatorEvents.length >= 20) {
        alert('最多只能添加20個創作者事件');
        return;
    }
    
    // 創建新的創作者事件
    const newEvent = {
        id: generateId(),
        timeAndPlace: '',
        title: '',
        content: '',
        isSecret: false
    };
    
    version.creatorEvents.push(newEvent);
    
    // 更新時間戳記和標記變更
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    const container = document.getElementById(`creator-events-container-${versionId}`);
    if (container) {
        container.innerHTML = LoveyDoveyRenderer.renderCreatorEventsFields(character, version);
    }
    
    // 恢復之前的折疊狀態並重新啟用拖曳
    setTimeout(() => {
        restoreCreatorEventCollapseStates(currentStates);
        if (typeof enableCreatorEventsDragSort === 'function') {
            enableCreatorEventsDragSort(characterId, versionId);
        }
    }, 50);
}

// 刪除創作者事件
function deleteCreatorEvent(characterId, versionId, eventId) {
    const confirmDelete = confirm('確定要刪除此創作者事件嗎？\n\n⚠️ 刪除後無法復原！');
    
    if (!confirmDelete) return;
    
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.creatorEvents) return;
    
    // 移除指定的創作者事件
    version.creatorEvents = version.creatorEvents.filter(event => event.id !== eventId);
    
    // 更新時間戳記和標記變更
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    // 重新渲染
    renderAll();
}

// 更新創作者事件欄位
function updateCreatorEventField(characterId, versionId, fieldPath, value) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.creatorEvents) return;
    
    // 解析欄位路徑 "creatorEvents.0.title" -> [0, 'title']
    const pathParts = fieldPath.split('.');
    if (pathParts.length !== 3 || pathParts[0] !== 'creatorEvents') return;
    
    const index = parseInt(pathParts[1]);
    const field = pathParts[2];
    
    if (index < 0 || index >= version.creatorEvents.length) return;
    
    // 更新欄位值
    version.creatorEvents[index][field] = value;
    
    // 更新時間戳記和標記變更
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    updateAllPageStats();
}

// 切換創作者事件的秘密設置
function toggleCreatorEventSecret(characterId, versionId, eventId) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.creatorEvents) return;
    
    const event = version.creatorEvents.find(e => e.id === eventId);
    if (!event) return;
    
    // 切換秘密設置
    event.isSecret = !event.isSecret;
    
    // 更新時間戳記和標記變更
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    // 直接更新 DOM，不重新渲染
    updateSecretIconsForEvent(eventId, event.isSecret);
}

// 直接更新指定事件的秘密圖示
function updateSecretIconsForEvent(eventId, isSecret) {
    const lockSvg = IconManager.lock({width: 12, height: 12});
    const settingLockSvg = IconManager.lock({width: 14, height: 14});
    
    // 1. 更新展開狀態標題中的圖示
    const titleExpanded = document.getElementById(`title-expanded-${eventId}`);
    if (titleExpanded) {
        const h4 = titleExpanded.querySelector('h4');
        if (h4) {
            // 移除現有的 SVG
            const existingSvg = h4.querySelector('svg');
            if (existingSvg) {
                existingSvg.remove();
            }
            
            // 如果是秘密，添加 SVG
            if (isSecret) {
                h4.insertAdjacentHTML('beforeend', lockSvg);
            }
        }
    }
    
    // 2. 更新折疊狀態標題中的圖示
    const titleCollapsed = document.getElementById(`title-collapsed-${eventId}`);
    if (titleCollapsed) {
        const titleDiv = titleCollapsed.querySelector('div:first-child');
        if (titleDiv) {
            // 移除現有的 SVG
            const existingSvg = titleDiv.querySelector('svg');
            if (existingSvg) {
                existingSvg.remove();
            }
            
            // 如果是秘密，添加 SVG
            if (isSecret) {
                titleDiv.insertAdjacentHTML('beforeend', lockSvg);
            }
        }
    }
    
    // 3. 更新設置區域的圖示
    const container = document.querySelector(`[data-event-id="${eventId}"]`);
    if (container) {
        const settingLabel = container.querySelector('input[type="checkbox"] + span');
        if (settingLabel) {
            // 移除現有的 SVG
            const existingSvg = settingLabel.querySelector('svg');
            if (existingSvg) {
                existingSvg.remove();
            }
            
            // 如果是秘密，添加 SVG
            if (isSecret) {
                settingLabel.insertAdjacentHTML('beforeend', settingLockSvg);
            }
        }
    }
    
    
}

// ===== 創作者事件折疊功能 =====

// 存儲折疊狀態
let creatorEventCollapseStates = {};

// 切換創作者事件的折疊狀態
function toggleCreatorEventCollapse(eventId, event = null) {
    let content, titleExpanded, titleCollapsed;
    
    if (event) {
        // 智慧查找：在點擊元素的版本容器內查找
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#content-${eventId}`);
            titleExpanded = versionContainer.querySelector(`#title-expanded-${eventId}`);
            titleCollapsed = versionContainer.querySelector(`#title-collapsed-${eventId}`);
        }
    }
    
    // 如果智慧查找失敗，使用原邏輯
    if (!content) {
        content = document.getElementById(`content-${eventId}`);
        titleExpanded = document.getElementById(`title-expanded-${eventId}`);
        titleCollapsed = document.getElementById(`title-collapsed-${eventId}`);
    }
    
    if (!content || !titleExpanded || !titleCollapsed) return;
    
    const isCollapsed = content.style.display === 'none';
    
    if (isCollapsed) {
        // 展開
        content.style.display = 'block';
        titleExpanded.style.display = 'block';
        titleCollapsed.style.display = 'none';
    } else {
        // 折疊
        content.style.display = 'none';
        titleExpanded.style.display = 'none';
        titleCollapsed.style.display = 'flex';
    }
    
    //  保存狀態
    saveCollapseStates();
}

//  獲取當前所有事件的折疊狀態
function getCurrentCollapseStates() {
    const states = {};
    document.querySelectorAll('.creator-event-item').forEach(item => {
        const eventId = item.dataset.eventId;
        const content = document.getElementById(`content-${eventId}`);
        if (content) {
            states[eventId] = content.style.display === 'none';
        }
    });
    return states;
}

//  恢復所有事件的折疊狀態
function restoreCollapseStates(states) {
    Object.keys(states).forEach(eventId => {
        if (states[eventId]) {
            // 需要折疊
            const content = document.getElementById(`content-${eventId}`);
            const titleExpanded = document.getElementById(`title-expanded-${eventId}`);
            const titleCollapsed = document.getElementById(`title-collapsed-${eventId}`);
            
            if (content && titleExpanded && titleCollapsed) {
                content.style.display = 'none';
                titleExpanded.style.display = 'none';
                titleCollapsed.style.display = 'flex';
            }
        }
    });
}

// 更新折疊時的標題顯示
function updateEventCollapsedTitle(eventId) {
    const titleCollapsed = document.getElementById(`title-collapsed-${eventId}`);
    if (!titleCollapsed) return;
    
    // 從對應的輸入框獲取最新值
    const container = document.querySelector(`[data-event-id="${eventId}"]`);
    if (!container) return;
    
    const timePlace = container.querySelector('input[id^="eventTimeAndPlace-"]')?.value || '';
    const title = container.querySelector('input[id^="eventTitle-"]')?.value || '';
    
    // 更新標題顯示
    const titleElement = titleCollapsed.querySelector('div:first-child');
    if (titleElement) {
        const secretIcon = titleElement.querySelector('span[style*="warning-color"]');
        const secretHtml = secretIcon ? secretIcon.outerHTML : '';
        titleElement.innerHTML = `${title || t('unnamedEvent')} ${secretHtml}`;
    }
    
    // 更新時間地點顯示
    const timePlaceElement = titleCollapsed.querySelector('div:last-child');
    if (timePlaceElement) {
        if (timePlace) {
            timePlaceElement.style.display = 'block';
            timePlaceElement.textContent = timePlace;
        } else {
            timePlaceElement.style.display = 'none';
        }
    }
}

// ===== 創作者事件拖曳排序功能 =====
// 啟用創作者事件的拖曳排序
function enableCreatorEventsDragSort(characterId, versionId) {
    const container = document.getElementById(`creator-events-list-${versionId}`);
    if (!container || typeof Sortable === 'undefined') {
        console.warn('無法啟用創作者事件拖曳排序：容器不存在或 Sortable 未載入');
        return;
    }
    
    // 檢查是否已經啟用
    if (container._sortable) {
        container._sortable.destroy();
    }
    
    let savedStates = {}; //  保存折疊狀態
    
    container._sortable = Sortable.create(container, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        
        onStart: function(evt) {
            
            document.body.style.cursor = 'grabbing';
            
            //  記錄當前折疊狀態
            savedStates = getCurrentCollapseStates();
            
        },
        
        onEnd: function(evt) {
            
            document.body.style.cursor = '';
            
            if (evt.oldIndex !== evt.newIndex) {
                // 更新資料順序
                reorderCreatorEvents(characterId, versionId, evt.oldIndex, evt.newIndex);
                
                //  立即恢復折疊狀態
                setTimeout(() => {
                    restoreCollapseStates(savedStates);
                    
                }, 10);
            }
        }
    });
    
    
}
// 重新排序創作者事件
function reorderCreatorEvents(characterId, versionId, oldIndex, newIndex) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.creatorEvents) return;
    
    // 執行陣列重排
    const movedEvent = version.creatorEvents.splice(oldIndex, 1)[0];
    version.creatorEvents.splice(newIndex, 0, movedEvent);
    
    // 更新時間戳記
    TimestampManager.updateVersionTimestamp('loveydovey', characterId, versionId);
    markAsChanged();
    
    
    
    // 更新編號，不重新渲染
    updateCreatorEventNumbers(version, versionId);
}

// 只更新創作者事件的編號顯示（支援對比模式）
function updateCreatorEventNumbers(version, versionId = null) {
    if (!version.creatorEvents) return;
    
    // 如果有 versionId，先找到對應的版本容器
    let searchContainer = document;
    if (versionId) {
        const versionContainer = document.querySelector(`#creator-events-list-${versionId}`)?.closest('.version-content');
        if (versionContainer) {
            searchContainer = versionContainer;
        }
    }
    
    version.creatorEvents.forEach((event, index) => {
        // 在指定容器內查找元素
        const titleExpanded = searchContainer.querySelector(`#title-expanded-${event.id}`);
        if (titleExpanded) {
            const h4 = titleExpanded.querySelector('h4');
            if (h4) {
                const secretIcon = h4.querySelector('svg');
                const secretHtml = secretIcon ? secretIcon.outerHTML : '';
                h4.innerHTML = `創作者事件 ${index + 1} ${secretHtml}`;
            }
        }
    });
    
    
}


// 存儲附加資訊折疊狀態
let additionalInfoCollapseStates = {};

// 切換附加資訊的折疊狀態
function toggleAdditionalInfoCollapse(infoId, event = null) {
    let content, titleExpanded, titleCollapsed;
    
    if (event) {
        // 智慧查找：在點擊元素的版本容器內查找
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#content-${infoId}`);
            titleExpanded = versionContainer.querySelector(`#title-expanded-${infoId}`);
            titleCollapsed = versionContainer.querySelector(`#title-collapsed-${infoId}`);
        }
    }
    
    // 如果智慧查找失敗，使用原邏輯
    if (!content) {
        content = document.getElementById(`content-${infoId}`);
        titleExpanded = document.getElementById(`title-expanded-${infoId}`);
        titleCollapsed = document.getElementById(`title-collapsed-${infoId}`);
    }
    
    if (!content || !titleExpanded || !titleCollapsed) return;
    
    const isCollapsed = content.style.display === 'none';
    
    if (isCollapsed) {
        // 展開
        content.style.display = 'block';
        titleExpanded.style.display = 'block';
        titleCollapsed.style.display = 'none';
    } else {
        // 折疊
        content.style.display = 'none';
        titleExpanded.style.display = 'none';
        titleCollapsed.style.display = 'flex';
    }
    
    //  保存狀態
    saveCollapseStates();
}

// 更新摺疊時的標題顯示
function updateAdditionalInfoCollapsedTitle(infoId) {
    const titleCollapsed = document.getElementById(`title-collapsed-${infoId}`);
    if (!titleCollapsed) return;
    
    // 直接通過ID查找標題輸入框
    const titleInput = document.getElementById(`additionalTitle-${infoId}`);
    if (!titleInput) return;
    
    const title = titleInput.value || '';
    
    // 更新標題顯示
    const titleElement = titleCollapsed.querySelector('div:first-child');
    if (titleElement) {
        // 找到當前附加資訊的索引
        const allInfoItems = Array.from(document.querySelectorAll('.additional-info-item'));
        const currentIndex = allInfoItems.findIndex(item => item.dataset.infoId === infoId) + 1;
        
        titleElement.textContent = `${t('additionalInfo')} ${currentIndex} ： ${title || t('noTitle')}`;
    }
}

//  只更新附加資訊的編號顯示（支援對比模式）
function updateAdditionalInfoNumbers(version, versionId = null) {
    if (!version.additionalInfo) return;
    
    //  如果有 versionId，先找到對應的版本容器
    let searchContainer = document;
    if (versionId) {
        const versionContainer = document.querySelector(`#additional-info-list-${versionId}`)?.closest('.version-content');
        if (versionContainer) {
            searchContainer = versionContainer;
        }
    }
    
    version.additionalInfo.forEach((info, index) => {
        //  在指定容器內查找元素
        const titleExpanded = searchContainer.querySelector(`#title-expanded-${info.id}`);
        if (titleExpanded) {
            const h4 = titleExpanded.querySelector('h4');
            if (h4) {
                h4.textContent = `附加資訊 ${index + 1}`;
            }
        }
        
        // 更新折疊狀態的編號
        const titleCollapsed = searchContainer.querySelector(`#title-collapsed-${info.id}`);
        if (titleCollapsed) {
            const titleDiv = titleCollapsed.querySelector('div:first-child');
            if (titleDiv) {
                const currentTitle = titleDiv.textContent.split('－')[1] || '（無標題）';
                titleDiv.textContent = `附加資訊 ${index + 1} － ${currentTitle}`;
            }
        }
    });
    
}


// ===== 折疊狀態管理 =====
function saveCollapseStates() {
    try {
        //  先讀取現有的狀態
        const existingStates = loadCollapseStates();
        
        //  合併策略：保留現有狀態，只更新當前頁面的狀態
        const newStates = {
            additionalInfo: { ...existingStates.additionalInfo, ...getCurrentAdditionalInfoCollapseStates() },
            creatorEvents: { ...existingStates.creatorEvents, ...getCurrentCreatorEventCollapseStates() },
            worldBookEntries: { ...existingStates.worldBookEntries, ...getCurrentWorldBookEntryCollapseStates() },
            timestamp: Date.now()
        };
        
        localStorage.setItem('loveydovey-collapse-states', JSON.stringify(newStates));
        
    } catch (error) {
        console.warn('保存折疊狀態失敗:', error);
    }
}

// 載入折疊狀態
function loadCollapseStates() {
    try {
        const saved = localStorage.getItem('loveydovey-collapse-states');
        if (saved) {
            const states = JSON.parse(saved);
            // 檢查是否為當日數據（避免過期狀態）
            const oneDay = 24 * 60 * 60 * 1000;
            if (states.timestamp && (Date.now() - states.timestamp) < oneDay) {
                return states;
            }
        }
    } catch (error) {
        console.warn('載入折疊狀態失敗:', error);
    }
    return { additionalInfo: {}, creatorEvents: {} };
}

// 獲取當前附加資訊折疊狀態
function getCurrentAdditionalInfoCollapseStates() {
    const states = {};
    document.querySelectorAll('.additional-info-item').forEach(item => {
        const infoId = item.dataset.infoId;
        const content = document.getElementById(`content-${infoId}`);
        if (content) {
            states[infoId] = content.style.display === 'none';
        }
    });
    return states;
}

// 獲取當前創作者事件折疊狀態  
function getCurrentCreatorEventCollapseStates() {
    const states = {};
    document.querySelectorAll('.creator-event-item').forEach(item => {
        const eventId = item.dataset.eventId;
        const content = document.getElementById(`content-${eventId}`);
        if (content) {
            states[eventId] = content.style.display === 'none';
        }
    });
    return states;
}

// 恢復附加資訊折疊狀態
function restoreAdditionalInfoCollapseStates(states) {
    if (!states) return;
    
    Object.keys(states).forEach(infoId => {
        if (states[infoId]) {
            //  查找所有匹配的元素（對比模式下可能有多個）
            const allContentElements = document.querySelectorAll(`#content-${infoId}`);
            const allTitleExpanded = document.querySelectorAll(`#title-expanded-${infoId}`);
            const allTitleCollapsed = document.querySelectorAll(`#title-collapsed-${infoId}`);
            
            //  對每個匹配的元素都應用折疊狀態
            allContentElements.forEach(content => {
                if (content) content.style.display = 'none';
            });
            
            allTitleExpanded.forEach(titleExpanded => {
                if (titleExpanded) titleExpanded.style.display = 'none';
            });
            
            allTitleCollapsed.forEach(titleCollapsed => {
                if (titleCollapsed) titleCollapsed.style.display = 'flex';
            });
        }
    });
}

// 恢復創作者事件折疊狀態
function restoreCreatorEventCollapseStates(states) {
    if (!states) return;
    
    Object.keys(states).forEach(eventId => {
        if (states[eventId]) {
            //  查找所有匹配的元素（對比模式下可能有多個）
            const allContentElements = document.querySelectorAll(`#content-${eventId}`);
            const allTitleExpanded = document.querySelectorAll(`#title-expanded-${eventId}`);
            const allTitleCollapsed = document.querySelectorAll(`#title-collapsed-${eventId}`);
            
            //  對每個匹配的元素都應用折疊狀態
            allContentElements.forEach(content => {
                if (content) content.style.display = 'none';
            });
            
            allTitleExpanded.forEach(titleExpanded => {
                if (titleExpanded) titleExpanded.style.display = 'none';
            });
            
            allTitleCollapsed.forEach(titleCollapsed => {
                if (titleCollapsed) titleCollapsed.style.display = 'flex';
            });
        }
    });
}

// 🔧 添加：附加資料延遲載入函數
function toggleAdditionalInfoCollapseLazy(characterId, versionId, infoId, index, event = null) {
    let content, titleExpanded, titleCollapsed;
    
    if (event) {
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#content-${infoId}`);
            titleExpanded = versionContainer.querySelector(`#title-expanded-${infoId}`);
            titleCollapsed = versionContainer.querySelector(`#title-collapsed-${infoId}`);
        }
    }
    
    if (!content) {
        content = document.getElementById(`content-${infoId}`);
        titleExpanded = document.getElementById(`title-expanded-${infoId}`);
        titleCollapsed = document.getElementById(`title-collapsed-${infoId}`);
    }
    
    if (!content || !titleExpanded || !titleCollapsed) return;
    
    const isExpanded = content.style.display !== 'none';
    
   if (isExpanded) {
    // 摺疊：隱藏內容
    content.style.display = 'none';
    titleExpanded.style.display = 'none';
    titleCollapsed.style.display = 'flex';
    
    // 立即更新摺疊標題以反映最新內容
    updateAdditionalInfoCollapsedTitle(infoId);
} else {
    // 展開：檢查是否需要載入內容
    if (content.innerHTML.trim() === '' || content.innerHTML.includes('<!-- Content will be loaded lazily')) {
        // 第一次展開，需要載入內容
        loadAdditionalInfoContent(characterId, versionId, infoId, index);
    }
    
    // 顯示內容
    content.style.display = 'block';
    titleExpanded.style.display = 'block';
    titleCollapsed.style.display = 'none';
}
}

// 載入附加資料詳細內容
function loadAdditionalInfoContent(characterId, versionId, infoId, index) {
    // 找到對應的附加資料
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.additionalInfo) return;
    
    const info = version.additionalInfo.find(i => i.id === infoId);
    if (!info) return;
    
    // 生成詳細內容HTML
    const detailHTML = generateAdditionalInfoDetailContent(characterId, versionId, info, index);
    
    // 插入到對應的內容區域
    const contentDiv = document.getElementById(`content-${infoId}`);
    if (contentDiv) {
        contentDiv.innerHTML = detailHTML;
        
        // 重新初始化相關功能
setTimeout(() => {
    updateAllPageStats();
    initAutoResize();
    
    const container = document.getElementById(`content-${infoId}`);
    if (container) {
        const inputs = container.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.id && input.oninput) {
                // 觸發一次 oninput 來初始化字數統計
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    }
    
    if (typeof ScrollbarManager !== 'undefined') {
        ScrollbarManager.initializeAll();
    }
}, 50);
    }
}

// 生成附加資料詳細內容
function generateAdditionalInfoDetailContent(characterId, versionId, info, index) {
    return `
        <!-- 標題欄位 -->
        <div style="margin-bottom: 12px; margin-top: 16px;">
            <label style="display: block; margin-bottom: 4px; font-size: 0.85em; color: var(--text-color);">${t('additionalTitle')}</label>
            <input type="text" 
                   class="field-input" 
                   id="additionalTitle-${info.id}" 
                   placeholder="${t('additionalTitlePlaceholder')}"
                   style="width: 100%; ${(info.title || '').length > 30 ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : ''}"
                   value="${info.title || ''}"
                   oninput="updateLoveyDoveyFieldWithPath('loveydovey', '${characterId}', '${versionId}', 'additionalInfo.${index}.title', this.value, 30); updateAdditionalInfoCollapsedTitle('${info.id}')">
            <div class="char-count-display" data-target="additionalTitle-${info.id}" 
                 style="text-align: right; font-size: 0.75em; ${(info.title || '').length > 30 ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);'} margin-top: 4px;">
                ${(info.title || '').length}/30 ${t('chars')}
            </div>
        </div>

        <!-- 內容欄位 -->
        <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-size: 0.85em; color: var(--text-color);">${t('additionalContent')}</label>
            <textarea class="field-input" 
                      id="additionalContent-${info.id}" 
                      placeholder="${t('additionalContentPlaceholder')}"
                      style="width: 100%; height: 100px; resize: vertical; ${(info.content || '').length > 500 ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : ''}"
                      oninput="updateLoveyDoveyFieldWithPath('loveydovey', '${characterId}', '${versionId}', 'additionalInfo.${index}.content', this.value, 500); autoResizeTextarea(this);"
                      onfocus="showAdditionalFullscreenBtn(this);"
                      onblur="hideAdditionalFullscreenBtn(this);">${info.content || ''}</textarea>
            
            <!-- 底部工具列：全螢幕按鈕 + 字數統計 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <button class="fullscreen-btn-base fullscreen-btn-toolbar" 
                        onclick="openFullscreenEditor('additionalContent-${info.id}', '${t('additionalInfo')} ${index + 1}')"
                        title="${t('fullscreenEdit')}">
                    ⛶
                </button>
                
                <div class="char-count-display" data-target="additionalContent-${info.id}" 
                     style="font-size: 0.75em; ${(info.content || '').length > 500 ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);'}">
                    ${(info.content || '').length}/500 ${t('chars')}
                </div>
            </div>
        </div>
    `;
}

// 🔧 添加：創作者事件延遲載入函數
function toggleCreatorEventCollapseLazy(characterId, versionId, eventId, index, event = null) {
    let content, titleExpanded, titleCollapsed;
    
    if (event) {
        const versionContainer = event.target.closest('.version-content');
        if (versionContainer) {
            content = versionContainer.querySelector(`#content-${eventId}`);
            titleExpanded = versionContainer.querySelector(`#title-expanded-${eventId}`);
            titleCollapsed = versionContainer.querySelector(`#title-collapsed-${eventId}`);
        }
    }
    
    if (!content) {
        content = document.getElementById(`content-${eventId}`);
        titleExpanded = document.getElementById(`title-expanded-${eventId}`);
        titleCollapsed = document.getElementById(`title-collapsed-${eventId}`);
    }
    
    if (!content || !titleExpanded || !titleCollapsed) return;
    
    const isExpanded = content.style.display !== 'none';
    
    if (isExpanded) {
        // 摺疊：隱藏內容
        content.style.display = 'none';
        titleExpanded.style.display = 'none';
        titleCollapsed.style.display = 'flex';
    } else {
        // 展開：檢查是否需要載入內容
        if (content.innerHTML.trim() === '' || content.innerHTML.includes('<!-- Content will be loaded lazily')) {
            // 第一次展開，需要載入內容
            loadCreatorEventContent(characterId, versionId, eventId, index);
        }
        
        // 顯示內容
        content.style.display = 'block';
        titleExpanded.style.display = 'block';
        titleCollapsed.style.display = 'none';
    }
}

// 載入創作者事件詳細內容
function loadCreatorEventContent(characterId, versionId, eventId, index) {
    const character = loveyDoveyCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    const version = character.versions.find(v => v.id === versionId);
    if (!version || !version.creatorEvents) return;
    
    const event = version.creatorEvents.find(e => e.id === eventId);
    if (!event) return;
    
    // 生成詳細內容HTML
    const detailHTML = generateCreatorEventDetailContent(characterId, versionId, event, index);
    
    // 插入到對應的內容區域
    const contentDiv = document.getElementById(`content-${eventId}`);
    if (contentDiv) {
        contentDiv.innerHTML = detailHTML;
        
        // 重新初始化相關功能
setTimeout(() => {
    updateAllPageStats();
    initAutoResize();
    
    const container = document.getElementById(`content-${eventId}`);
    if (container) {
        const inputs = container.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.id && input.oninput) {
                // 觸發一次 oninput 來初始化字數統計
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    }
    
    if (typeof ScrollbarManager !== 'undefined') {
        ScrollbarManager.initializeAll();
    }
}, 50);
    }
}

// 生成創作者事件詳細內容
function generateCreatorEventDetailContent(characterId, versionId, event, index) {
    return `
        <!-- 時間地點欄位 -->
        <div style="margin-bottom: 0px;">
            <label style="display: block; margin-bottom: 4px; margin-top: 5px; font-size: 0.85em; color: var(--text-color);">${t('timeAndPlace')}</label>
            <input type="text" 
                   class="field-input" 
                   id="eventTimeAndPlace-${event.id}"
                   placeholder="${t('timeAndPlacePlaceholder')}"
                   style="width: 100%; ${(event.timeAndPlace || '').length > 30 ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : ''}"
                   value="${event.timeAndPlace || ''}"
                   oninput="updateLoveyDoveyFieldWithPath('loveydovey', '${characterId}', '${versionId}', 'creatorEvents.${index}.timeAndPlace', this.value, 30); updateEventCollapsedTitle('${event.id}')">
            <div class="char-count-display" data-target="eventTimeAndPlace-${event.id}" 
                 style="text-align: right; font-size: 0.75em; ${(event.timeAndPlace || '').length > 30 ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);'} margin-top: 4px;">
                ${(event.timeAndPlace || '').length} / 30 ${t('chars')}
            </div>
        </div>

        <!-- 標題欄位 -->
        <div style="margin-bottom: 0px;">
            <label style="display: block; margin-bottom: 4px; font-size: 0.85em; color: var(--text-color);">${t('additionalContent')}</label>
            <input type="text" 
                   class="field-input" 
                   id="eventTitle-${event.id}"
                   placeholder="${t('eventTitlePlaceholder')}"
                   style="width: 100%; ${(event.title || '').length > 30 ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : ''}"
                   value="${event.title || ''}"
                   oninput="updateLoveyDoveyFieldWithPath('loveydovey', '${characterId}', '${versionId}', 'creatorEvents.${index}.title', this.value, 30); updateEventCollapsedTitle('${event.id}')">
            <div class="char-count-display" data-target="eventTitle-${event.id}" 
                 style="text-align: right; font-size: 0.75em; ${(event.title || '').length > 30 ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);'} margin-top: 4px;">
                ${(event.title || '').length} / 30 ${t('chars')}
            </div>
        </div>

        <!-- 內容欄位 -->
        <div style="margin-bottom: 0px;">
            <label style="display: block; margin-bottom: 4px; font-size: 0.85em; color: var(--text-color);">${t('additionalContent')}</label>
            <textarea class="field-input" 
                      id="eventContent-${event.id}"
                      placeholder="${t('eventContentPlaceholder')}"
                      style="width: 100%; height: 120px; resize: vertical; ${(event.content || '').length > 2000 ? 'border-color: #e74c3c; box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);' : ''}"
                      oninput="updateLoveyDoveyFieldWithPath('loveydovey', '${characterId}', '${versionId}', 'creatorEvents.${index}.content', this.value, 2000); autoResizeTextarea(this);"
                      onfocus="showAdditionalFullscreenBtn(this);"
                      onblur="hideAdditionalFullscreenBtn(this);">${event.content || ''}</textarea>
            
            <!-- 底部工具列：全螢幕按鈕 + 字數統計 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <button class="fullscreen-btn-base fullscreen-btn-toolbar" 
                        onclick="openFullscreenEditor('eventContent-${event.id}', 'Creator Event Content')" 
                        title="${t('fullscreenEdit')}">
                    ⛶
                </button>
                
                <div class="char-count-display" data-target="eventContent-${event.id}" 
                     style="font-size: 0.75em; ${(event.content || '').length > 2000 ? 'color: #e74c3c; font-weight: bold;' : 'color: var(--text-muted);'}">
                    ${(event.content || '').length} / 2000 ${t('chars')}
                </div>
            </div>
        </div>

        <!-- 秘密設置欄位 -->
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9em;">
                <input type="checkbox" 
                    ${event.isSecret ? 'checked' : ''}
                    onchange="toggleCreatorEventSecret('${characterId}', '${versionId}', '${event.id}')"
                    style="margin: 0;">
                <span style="color: var(--text-color); display: flex; align-items: center; gap: 6px;">
                    ${t('secretNarrativeSetting')}
                    ${event.isSecret ? IconManager.lock({width: 14, height: 14}) : ''}
                </span>
            </label>
        </div>
    `;
}