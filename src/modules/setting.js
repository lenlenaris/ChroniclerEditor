// ===== ContentSearchManager - 內容搜尋管理器 =====
class ContentSearchManager {
    static isSearchOpen = false;
    static isReplaceMode = false;
    static searchTimeout = null;
    static currentResults = null;

    // 開啟搜尋視窗
    static openSearchModal() {
    if (this.isSearchOpen) return;
    this.isReplaceMode = false;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'content-search-modal';
    modal.style.display = 'block';

    modal.innerHTML = `
    <div class="compact-modal-content" style="max-width: 700px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="compact-modal-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                ${IconManager.search({width: 18, height: 18})}
                <h3 class="compact-modal-title">${t('searchContent')}</h3>
            </div>
            <button class="close-modal" onclick="ContentSearchManager.closeSearchModal()">×</button>
        </div>

        <div class="compact-section" style="padding: 0; background: transparent; margin-bottom: var(--spacing-md);">
            <div style="display: flex; gap: var(--spacing-sm); align-items: stretch;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <input type="text"
                           id="content-search-input"
                           class="field-input msize-input"
                           placeholder="${t('searchPlaceholderContent')}"
                           style="font-size: 0.9em; padding: 12px 16px; width: 100%;"
                           oninput="ContentSearchManager.handleSearchInput(this.value)"
                           autofocus>
                    <div id="replace-row" style="display: none; flex-direction: column; gap: var(--spacing-sm);">
                        <div style="display: flex; gap: var(--spacing-sm); align-items: stretch;">
                            <input type="text"
                                   id="content-replace-input"
                                   class="field-input msize-input"
                                   placeholder="${t('replacePlaceholder')}"
                                   style="font-size: 0.9em; padding: 12px 16px; flex: 1;">
                            <button class="overview-btn hover-primary"
                                    onclick="ContentSearchManager.replaceAll()"
                                    style="white-space: nowrap; padding: 0 16px; height: 40px;">
                                ${t('replaceAll')}
                            </button>
                        </div>
                        <div style="font-size: 0.8em; color: var(--text-muted); line-height: 1.4;">
                            ${t('replaceTip')}
                        </div>
                    </div>
                </div>
                <button id="toggle-replace-btn"
                        onclick="ContentSearchManager.toggleReplaceMode()"
                        style="padding: 0 12px; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: color 0.2s;"
                        onmouseover="this.style.color='var(--accent-color)'"
                        onmouseout="this.style.color='var(--text-muted)'">
                    <span class="arrow-icon arrow-left"></span>
                </button>
            </div>
        </div>

        <div id="search-results-container" style="flex: 1; overflow-y: auto; background: var(--header-bg); border-radius: var(--radius-md); padding: var(--spacing-lg);">
            <div style="font-size: 0.9em; text-align: center; color: var(--text-muted); padding: 40px;">
                ${t('searchEmptyState')}
            </div>
        </div>
    </div>
`;
    
    document.body.appendChild(modal);
    this.isSearchOpen = true;
        
        // 點擊遮罩關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSearchModal();
            }
        });
        
        // ESC 鍵關閉
        document.addEventListener('keydown', this.handleKeydown);
        
        // 聚焦搜尋框
        setTimeout(() => {
            document.getElementById('content-search-input')?.focus();
        }, 100);
    }
    
    // 關閉搜尋視窗
    static closeSearchModal() {
        const modal = document.getElementById('content-search-modal');
        if (modal) {
            modal.remove();
        }
        this.isSearchOpen = false;
        document.removeEventListener('keydown', this.handleKeydown);
    }
    
    // 鍵盤事件處理
    static handleKeydown = (e) => {
        if (e.key === 'Escape') {
            ContentSearchManager.closeSearchModal();
        }
    }

    // 切換取代模式
    static toggleReplaceMode() {
        this.isReplaceMode = !this.isReplaceMode;
        const replaceRow = document.getElementById('replace-row');
        const toggleBtn = document.getElementById('toggle-replace-btn');

        if (replaceRow) {
            replaceRow.style.display = this.isReplaceMode ? 'flex' : 'none';
        }
        if (toggleBtn) {
            const arrow = toggleBtn.querySelector('.arrow-icon');
            if (arrow) {
                arrow.classList.toggle('arrow-left', !this.isReplaceMode);
                arrow.classList.toggle('arrow-down', this.isReplaceMode);
            }
        }

        // 更新搜尋結果中的單筆取代按鈕顯示狀態
        document.querySelectorAll('.single-replace-btn').forEach(btn => {
            btn.style.display = this.isReplaceMode ? 'flex' : 'none';
        });

        // 如果開啟取代模式，聚焦到取代輸入框
        if (this.isReplaceMode) {
            setTimeout(() => {
                document.getElementById('content-replace-input')?.focus();
            }, 100);
        }
    }

    // 全部取代功能
    static replaceAll() {
        const searchInput = document.getElementById('content-search-input');
        const replaceInput = document.getElementById('content-replace-input');
        const searchText = searchInput?.value?.trim() || '';
        const replaceText = replaceInput?.value || '';

        if (searchText.length < 2) {
            alert(t('searchMinChars'));
            return;
        }

        if (!this.currentResults) {
            alert(t('searchNotFound').replace('$1', searchText));
            return;
        }

        // 計算總共有多少筆結果
        const allResults = [
            ...this.currentResults.characters,
            ...this.currentResults.userPersonas,
            ...this.currentResults.worldbooks,
            ...this.currentResults.customs,
            ...this.currentResults.loveydovey,
            ...this.currentResults.presets
        ];

        if (allResults.length === 0) {
            alert(t('searchNotFound').replace('$1', searchText));
            return;
        }

        // 顯示確認對話框
        this.showReplaceConfirmation(searchText, replaceText, allResults);
    }

    // 單筆取代功能
    static replaceSingle(resultJson) {
        const searchInput = document.getElementById('content-search-input');
        const replaceInput = document.getElementById('content-replace-input');
        const searchText = searchInput?.value?.trim() || '';
        const replaceText = replaceInput?.value || '';

        if (searchText.length < 2) {
            alert(t('searchMinChars'));
            return;
        }

        // 解析結果物件
        let result;
        try {
            result = JSON.parse(resultJson);
        } catch (e) {
            return;
        }

        // 執行單筆取代
        const regex = new RegExp(this.escapeRegex(searchText), 'g');
        let replacedCount = 0;

        switch (result.type) {
            case 'character':
                replacedCount = this.replaceInCharacter(result, regex, replaceText);
                break;
            case 'userpersona':
                replacedCount = this.replaceInUserPersona(result, regex, replaceText);
                break;
            case 'worldbook':
                replacedCount = this.replaceInWorldBook(result, regex, replaceText);
                break;
            case 'custom':
                replacedCount = this.replaceInCustomSection(result, regex, replaceText);
                break;
            case 'loveydovey':
                replacedCount = this.replaceInLoveyDovey(result, regex, replaceText);
                break;
            case 'preset':
                replacedCount = this.replaceInPreset(result, regex, replaceText);
                break;
        }

        if (replacedCount > 0) {
            // 標記已變更
            markAsChanged();

            // 重新執行搜尋以更新結果
            if (searchInput?.value) {
                this.performSearch(searchInput.value);
            }

            // 顯示完成訊息
            this.showReplaceResult(replacedCount);
        }
    }

    // 顯示取代確認對話框
    static showReplaceConfirmation(searchText, replaceText, results) {
        // 按類型分組統計
        const typeStats = {};
        results.forEach(r => {
            const typeName = this.getTypeName(r.type);
            typeStats[typeName] = (typeStats[typeName] || 0) + 1;
        });

        const statsList = Object.entries(typeStats).map(([type, count]) =>
            `${type}: ${count} ${t('itemCount')}`
        );

        ConfirmationRenderer.render({
            icon: 'search',
            title: t('replaceAll'),
            description: `${t('replaceConfirmDesc').replace('$1', searchText).replace('$2', replaceText || t('emptyString'))}`,
            listSection: {
                title: t('affectedItems'),
                icon: 'file',
                items: statsList,
                position: 'after-description'
            },
            cancelText: t('cancel'),
            confirmText: t('replaceAll'),
            confirmAction: `ContentSearchManager.executeReplaceAll('${this.escapeForAction(searchText)}', '${this.escapeForAction(replaceText)}')`,
            maxWidth: '450px',
            isDanger: true
        });
    }

    // 執行全部取代
    static executeReplaceAll(searchText, replaceText) {
        // 關閉確認對話框
        document.querySelector('.modal:last-of-type')?.remove();

        if (!this.currentResults) return;

        let replacedCount = 0;
        const regex = new RegExp(this.escapeRegex(searchText), 'g');

        // 取代角色卡
        this.currentResults.characters.forEach(result => {
            replacedCount += this.replaceInCharacter(result, regex, replaceText);
        });

        // 取代玩家角色
        this.currentResults.userPersonas.forEach(result => {
            replacedCount += this.replaceInUserPersona(result, regex, replaceText);
        });

        // 取代世界書
        this.currentResults.worldbooks.forEach(result => {
            replacedCount += this.replaceInWorldBook(result, regex, replaceText);
        });

        // 取代筆記本
        this.currentResults.customs.forEach(result => {
            replacedCount += this.replaceInCustomSection(result, regex, replaceText);
        });

        // 取代卿卿我我
        this.currentResults.loveydovey.forEach(result => {
            replacedCount += this.replaceInLoveyDovey(result, regex, replaceText);
        });

        // 取代預設提示詞
        this.currentResults.presets.forEach(result => {
            replacedCount += this.replaceInPreset(result, regex, replaceText);
        });

        // 標記已變更並儲存
        markAsChanged();

        // 重新執行搜尋以更新結果
        const searchInput = document.getElementById('content-search-input');
        if (searchInput?.value) {
            this.performSearch(searchInput.value);
        }

        // 顯示完成訊息
        this.showReplaceResult(replacedCount);
    }

    // 取代角色卡中的內容
    static replaceInCharacter(result, regex, replaceText) {
        const character = characters.find(c => c.id === result.itemId);
        if (!character) return 0;

        const version = character.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        const fieldMap = {
            [t('description')]: 'description',
            [t('personalityTraits')]: 'personality',
            [t('plotSetting')]: 'scenario',
            [t('dialogue')]: 'dialogue',
            [t('firstMessageField')]: 'firstMessage',
            [t('creatorNotes')]: 'creatorNotes'
        };

        const field = fieldMap[result.fieldName];
        if (field && version[field]) {
            const matches = version[field].match(regex);
            if (matches) {
                version[field] = version[field].replace(regex, replaceText);
                return matches.length;
            }
        }
        return 0;
    }

    // 取代玩家角色中的內容
    static replaceInUserPersona(result, regex, replaceText) {
        const persona = userPersonas.find(p => p.id === result.itemId);
        if (!persona) return 0;

        const version = persona.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        if (version.description) {
            const matches = version.description.match(regex);
            if (matches) {
                version.description = version.description.replace(regex, replaceText);
                return matches.length;
            }
        }
        return 0;
    }

    // 取代世界書中的內容
    static replaceInWorldBook(result, regex, replaceText) {
        const worldbook = worldBooks.find(wb => wb.id === result.itemId);
        if (!worldbook) return 0;

        const version = worldbook.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        const entry = version.entries.find(e => e.id === result.entryId);
        if (!entry) return 0;

        const fieldMap = {
            [t('entryContent')]: 'content',
            [t('entryComment')]: 'comment'
        };

        const field = fieldMap[result.fieldName];
        if (field && entry[field]) {
            const matches = entry[field].match(regex);
            if (matches) {
                entry[field] = entry[field].replace(regex, replaceText);
                return matches.length;
            }
        }
        return 0;
    }

    // 取代筆記本中的內容
    static replaceInCustomSection(result, regex, replaceText) {
        const section = customSections.find(s => s.id === result.itemId);
        if (!section) return 0;

        const version = section.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        const field = version.fields?.find(f => f.name === result.fieldName);
        if (field && field.content) {
            const matches = field.content.match(regex);
            if (matches) {
                field.content = field.content.replace(regex, replaceText);
                return matches.length;
            }
        }
        return 0;
    }

    // 取代卿卿我我中的內容
    static replaceInLoveyDovey(result, regex, replaceText) {
        const character = loveyDoveyCharacters.find(c => c.id === result.itemId);
        if (!character) return 0;

        const version = character.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        // 基本欄位映射
        const fieldMap = {
            [t('characterName')]: 'characterName',
            [t('age')]: 'age',
            [t('occupation')]: 'occupation',
            [t('characterQuote')]: 'characterQuote',
            [t('publicDescription')]: 'publicDescription',
            [t('basicInfo')]: 'basicInfo',
            [t('personality')]: 'personality',
            [t('speakingStyle')]: 'speakingStyle',
            [t('scenarioScript')]: 'scenarioScript',
            [t('characterDialogue')]: 'characterDialogue',
            [t('likes')]: 'likes',
            [t('dislikes')]: 'dislikes',
            [t('tags')]: 'tags'
        };

        const field = fieldMap[result.fieldName];
        if (field && version[field]) {
            const matches = version[field].match(regex);
            if (matches) {
                version[field] = version[field].replace(regex, replaceText);
                return matches.length;
            }
        }

        // 處理附加資訊和創作者事件（如果欄位名稱包含這些關鍵字）
        if (result.fieldName.includes(t('additionalInfo'))) {
            return this.replaceInLoveyDoveyAdditional(version, result.fieldName, regex, replaceText);
        }
        if (result.fieldName.includes(t('creatorEvents'))) {
            return this.replaceInLoveyDoveyEvents(version, result.fieldName, regex, replaceText);
        }

        return 0;
    }

    // 取代卿卿我我附加資訊
    static replaceInLoveyDoveyAdditional(version, fieldName, regex, replaceText) {
        if (!version.additionalInfo) return 0;

        // 解析欄位名稱，例如 "附加資訊 1 標題"
        const match = fieldName.match(/(\d+)/);
        if (!match) return 0;

        const index = parseInt(match[1]) - 1;
        const info = version.additionalInfo[index];
        if (!info) return 0;

        if (fieldName.includes(t('additionalTitle')) && info.title) {
            const matches = info.title.match(regex);
            if (matches) {
                info.title = info.title.replace(regex, replaceText);
                return matches.length;
            }
        }
        if (fieldName.includes(t('additionalContent')) && info.content) {
            const matches = info.content.match(regex);
            if (matches) {
                info.content = info.content.replace(regex, replaceText);
                return matches.length;
            }
        }
        return 0;
    }

    // 取代卿卿我我創作者事件
    static replaceInLoveyDoveyEvents(version, fieldName, regex, replaceText) {
        if (!version.creatorEvents) return 0;

        const match = fieldName.match(/(\d+)/);
        if (!match) return 0;

        const index = parseInt(match[1]) - 1;
        const event = version.creatorEvents[index];
        if (!event) return 0;

        const eventFieldMap = {
            [t('timeAndPlace')]: 'timeAndPlace',
            [t('eventTitle')]: 'title',
            [t('eventContent')]: 'content'
        };

        for (const [key, field] of Object.entries(eventFieldMap)) {
            if (fieldName.includes(key) && event[field]) {
                const matches = event[field].match(regex);
                if (matches) {
                    event[field] = event[field].replace(regex, replaceText);
                    return matches.length;
                }
            }
        }
        return 0;
    }

    // 取代預設提示詞中的內容
    static replaceInPreset(result, regex, replaceText) {
        const preset = presets.find(p => p.id === result.itemId);
        if (!preset) return 0;

        const version = preset.versions.find(v => v.id === result.versionId);
        if (!version) return 0;

        const prompt = version.prompts?.find(p => p.identifier === result.promptIdentifier);
        if (!prompt || !prompt.content) return 0;

        const matches = prompt.content.match(regex);
        if (matches) {
            prompt.content = prompt.content.replace(regex, replaceText);
            return matches.length;
        }
        return 0;
    }

    // 取得類型名稱
    static getTypeName(type) {
        const typeNames = {
            'character': t('character'),
            'userpersona': t('userPersona'),
            'worldbook': t('worldBook'),
            'custom': t('customFields'),
            'loveydovey': t('loveyDovey'),
            'preset': t('preset')
        };
        return typeNames[type] || type;
    }

    // 轉義用於 action 的字串
    static escapeForAction(str) {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    // 顯示取代結果
    static showReplaceResult(count) {
        const container = document.getElementById('search-results-container');
        if (container && count > 0) {
            const resultMsg = document.createElement('div');
            resultMsg.style.cssText = 'background: color-mix(in srgb, var(--success-color) 15%, transparent); color: var(--success-color); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: var(--spacing-md); text-align: center; border: 1px solid color-mix(in srgb, var(--success-color) 30%, transparent);';
            resultMsg.textContent = t('replacedCount').replace('$1', count);
            container.insertBefore(resultMsg, container.firstChild);

            // 3秒後移除訊息
            setTimeout(() => resultMsg.remove(), 3000);
        }
    }

    // 搜尋輸入處理（防抖）
    static handleSearchInput(value) {
        clearTimeout(this.searchTimeout);
        
        if (value.length < 2) {
            this.showEmptyState(t('searchMinChars'));
            return;
        }
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(value);
        }, 300);
    }
    
    // 執行搜尋
    static performSearch(searchText) {
        const results = {
            characters: this.searchInCharacters(searchText),
            userPersonas: this.searchInUserPersonas(searchText),
            worldbooks: this.searchInWorldBooks(searchText),
            customs: this.searchInCustomSections(searchText),
            loveydovey: ContentSearchManager.searchInLoveyDovey(searchText),
            presets: this.searchInPresets(searchText)
        };
        
        this.currentResults = results;
        this.displayResults(results, searchText);
    }
    
    // 計算匹配數量
    static countMatches(content, searchText) {
        if (!content || !searchText) return 0;
        const regex = new RegExp(this.escapeRegex(searchText), 'gi');
        const matches = content.match(regex);
        return matches ? matches.length : 0;
    }

    // 搜尋角色卡
    static searchInCharacters(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        characters.forEach(character => {
            character.versions.forEach(version => {
                const fields = {
                    [t('description')]: version.description,
                    [t('personalityTraits')]: version.personality,
                    [t('plotSetting')]: version.scenario,
                    [t('dialogue')]: version.dialogue,
                    [t('firstMessageField')]: version.firstMessage,
                    [t('creatorNotes')]: version.creatorNotes
                };

                Object.entries(fields).forEach(([fieldName, content]) => {
                    if (content && content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(content, searchText);
                        const matchCount = this.countMatches(content, searchText);
                        results.push({
                            itemName: character.name,
                            versionName: version.name,
                            fieldName: fieldName,
                            snippet: snippet,
                            matchCount: matchCount,
                            itemId: character.id,
                            versionId: version.id,
                            type: 'character'
                        });
                    }
                });
            });
        });

        return results;
    }

    // 搜尋卿卿我我角色
    static searchInLoveyDovey(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        loveyDoveyCharacters.forEach(character => {
            character.versions.forEach(version => {
                const fields = {
                    [t('characterName')]: version.characterName,
                    [t('age')]: version.age,
                    [t('occupation')]: version.occupation,
                    [t('characterQuote')]: version.characterQuote,
                    [t('publicDescription')]: version.publicDescription,
                    [t('basicInfo')]: version.basicInfo,
                    [t('personality')]: version.personality,
                    [t('speakingStyle')]: version.speakingStyle,
                    [t('scenarioScript')]: version.scenarioScript,
                    [t('characterDialogue')]: version.characterDialogue,
                    [t('likes')]: version.likes,
                    [t('dislikes')]: version.dislikes,
                    [t('tags')]: version.tags
                };

                // 搜尋基本欄位
                Object.entries(fields).forEach(([fieldName, content]) => {
                    if (content && content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(content, searchText);
                        const matchCount = this.countMatches(content, searchText);
                        results.push({
                            itemName: character.name,
                            versionName: version.name,
                            fieldName: fieldName,
                            snippet: snippet,
                            matchCount: matchCount,
                            itemId: character.id,
                            versionId: version.id,
                            type: 'loveydovey'
                        });
                    }
                });

                // 搜尋附加資訊
                if (version.additionalInfo && Array.isArray(version.additionalInfo)) {
                    version.additionalInfo.forEach((info, index) => {
                        if (info.title && info.title.toLowerCase().includes(searchLower)) {
                            const snippet = this.createSnippet(info.title, searchText);
                            const matchCount = this.countMatches(info.title, searchText);
                            results.push({
                                itemName: character.name,
                                versionName: version.name,
                                fieldName: `${t('additionalInfo')} ${index + 1} ${t('additionalTitle')}`,
                                snippet: snippet,
                                matchCount: matchCount,
                                itemId: character.id,
                                versionId: version.id,
                                type: 'loveydovey'
                            });
                        }

                        if (info.content && info.content.toLowerCase().includes(searchLower)) {
                            const snippet = this.createSnippet(info.content, searchText);
                            const matchCount = this.countMatches(info.content, searchText);
                            results.push({
                                itemName: character.name,
                                versionName: version.name,
                                fieldName: `${t('additionalInfo')} ${index + 1} ${t('additionalContent')}`,
                                snippet: snippet,
                                matchCount: matchCount,
                                itemId: character.id,
                                versionId: version.id,
                                type: 'loveydovey'
                            });
                        }
                    });
                }

                // 搜尋創作者事件
                if (version.creatorEvents && Array.isArray(version.creatorEvents)) {
                    version.creatorEvents.forEach((event, index) => {
                        const eventFields = {
                            [t('timeAndPlace')]: event.timeAndPlace,
                            [t('eventTitle')]: event.title,
                            [t('eventContent')]: event.content
                        };

                        Object.entries(eventFields).forEach(([fieldName, content]) => {
                            if (content && content.toLowerCase().includes(searchLower)) {
                                const snippet = this.createSnippet(content, searchText);
                                const matchCount = this.countMatches(content, searchText);
                                results.push({
                                    itemName: character.name,
                                    versionName: version.name,
                                    fieldName: `${t('creatorEvents')} ${index + 1} ${fieldName}`,
                                    snippet: snippet,
                                    matchCount: matchCount,
                                    itemId: character.id,
                                    versionId: version.id,
                                    type: 'loveydovey'
                                });
                            }
                        });
                    });
                }
            });
        });
        
        return results;
    }

    // 搜尋玩家角色
    static searchInUserPersonas(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        userPersonas.forEach(persona => {
            persona.versions.forEach(version => {
                if (version.description && version.description.toLowerCase().includes(searchLower)) {
                    const snippet = this.createSnippet(version.description, searchText);
                    const matchCount = this.countMatches(version.description, searchText);
                    results.push({
                        itemName: persona.name,
                        versionName: version.name,
                        fieldName: t('description'),
                        snippet: snippet,
                        matchCount: matchCount,
                        itemId: persona.id,
                        versionId: version.id,
                        type: 'userpersona'
                    });
                }
            });
        });

        return results;
    }

    // 搜尋世界書
    static searchInWorldBooks(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        worldBooks.forEach(worldbook => {
            worldbook.versions.forEach(version => {
                version.entries.forEach(entry => {
                    const fields = {
                        [t('entryContent')]: entry.content,
                        [t('entryComment')]: entry.comment
                    };

                    Object.entries(fields).forEach(([fieldName, content]) => {
                        if (content && content.toLowerCase().includes(searchLower)) {
                            const snippet = this.createSnippet(content, searchText);
                            const matchCount = this.countMatches(content, searchText);
                            results.push({
                                itemName: worldbook.name,
                                versionName: version.name,
                                fieldName: fieldName,
                                snippet: snippet,
                                matchCount: matchCount,
                                itemId: worldbook.id,
                                versionId: version.id,
                                type: 'worldbook',
                                entryId: entry.id
                            });
                        }
                    });
                });
            });
        });

        return results;
    }

    // 搜尋筆記本
    static searchInCustomSections(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        customSections.forEach(section => {
            section.versions.forEach(version => {
                version.fields.forEach(field => {
                    if (field.content && field.content.toLowerCase().includes(searchLower)) {
                        const snippet = this.createSnippet(field.content, searchText);
                        const matchCount = this.countMatches(field.content, searchText);
                        results.push({
                            itemName: section.name,
                            versionName: version.name,
                            fieldName: field.name,
                            snippet: snippet,
                            matchCount: matchCount,
                            itemId: section.id,
                            versionId: version.id,
                            type: 'custom'
                        });
                    }
                });
            });
        });
        
        return results;
    }

    // 搜尋預設
    static searchInPresets(searchText) {
        const results = [];
        const searchLower = searchText.toLowerCase();

        presets.forEach(preset => {
            preset.versions.forEach(version => {
                // 搜尋所有可編輯的 prompts
                if (version.prompts && Array.isArray(version.prompts)) {
                    version.prompts.forEach(prompt => {
                        // 只搜尋有內容且非標記的條目
                        if (prompt.content && !prompt.marker) {
                            if (prompt.content.toLowerCase().includes(searchLower)) {
                                const snippet = this.createSnippet(prompt.content, searchText);
                                const matchCount = this.countMatches(prompt.content, searchText);
                                results.push({
                                    itemName: preset.name,
                                    versionName: version.name,
                                    fieldName: prompt.name || prompt.identifier,
                                    snippet: snippet,
                                    matchCount: matchCount,
                                    itemId: preset.id,
                                    versionId: version.id,
                                    type: 'preset',
                                    promptIdentifier: prompt.identifier
                                });
                            }
                        }
                    });
                }
            });
        });

        return results;
    }
    
    // 創建摘要片段（顯示所有匹配）
    static createSnippet(content, searchText, maxLength = 50) {
        const searchLower = searchText.toLowerCase();
        const contentLower = content.toLowerCase();
        const regex = new RegExp(this.escapeRegex(searchText), 'gi');
        const matches = [];
        let match;

        // 找出所有匹配的位置
        while ((match = regex.exec(contentLower)) !== null) {
            matches.push(match.index);
        }

        if (matches.length === 0) return content.substring(0, maxLength);

        // 為每個匹配創建片段
        const snippets = matches.map((index, i) => {
            const start = Math.max(0, index - 25);
            const end = Math.min(content.length, index + searchText.length + 25);

            let snippet = content.substring(start, end);

            // 添加省略號
            if (start > 0) snippet = '...' + snippet;
            if (end < content.length) snippet = snippet + '...';

            // 高亮關鍵詞
            const highlightRegex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi');
            snippet = snippet.replace(highlightRegex, '<strong style="color: var(--accent-color); background: color-mix(in srgb, var(--accent-color) 20%, transparent); padding: 1px 3px; border-radius: 3px;">$1</strong>');

            return snippet;
        });

        // 用分隔線連接所有片段
        return snippets.join('<div style="border-top: 1px dashed var(--border-color); margin: 6px 0;"></div>');
    }
    
    // 轉義正則表達式特殊字符
    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // 顯示結果
    static displayResults(results, searchText) {
        const container = document.getElementById('search-results-container');
        if (!container) return;
        
        const totalCount = results.characters.length + 
                  results.userPersonas.length + 
                  results.worldbooks.length + 
                  results.customs.length + 
                  results.loveydovey.length + 
                  results.presets.length;
        
        if (totalCount === 0) {
            this.showEmptyState(t('searchNotFound').replace('$1', searchText));
            return;
        }
        
        let html = `
    <div style="margin-bottom: 20px; font-weight: 600; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
        ${IconManager.search()}
        ${t('searchResultsCount').replace('$1', searchText).replace('$2', totalCount)}
    </div>
        `;
        
        // 角色卡結果
        if (results.characters.length > 0) {
            html += this.renderResultSection(t('character'), results.characters, `${IconManager.user()}`, searchText);
        }

        // 卿卿我我結果
        if (results.loveydovey.length > 0) {
            html += this.renderResultSection(t('loveydovey'), results.loveydovey, `${IconManager.heart()}`, searchText);
        }

        // 玩家角色結果
        if (results.userPersonas.length > 0) {
            html += this.renderResultSection(t('userPersona'), results.userPersonas, `${IconManager.smile()}`, searchText);
        }

        // 世界書結果
        if (results.worldbooks.length > 0) {
            html += this.renderResultSection(t('worldBook'), results.worldbooks, `${IconManager.book()}`, searchText);
        }

        // 筆記本結果
        if (results.customs.length > 0) {
            html += this.renderResultSection(t('customFields'), results.customs, `${IconManager.file()}`, searchText);
        }

        // 預設結果
        if (results.presets.length > 0) {
            html += this.renderResultSection(t('preset'), results.presets, `${IconManager.settings()}`, searchText);
        }
        
        container.innerHTML = html;
    }
    // 渲染結果區塊
static renderResultSection(sectionName, results, icon, searchText) {
    let html = `
    <div style="margin-bottom: 24px;">
        <h4 style="color: var(--accent-color); font-size: 1em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
            ${icon}
            <span>${sectionName} (${results.length})</span>
        </h4>
`;

    results.forEach((result, index) => {
        // 根據類型生成詳細的欄位描述
        let fieldDescription = result.fieldName;

        if (result.type === 'worldbook' && result.entryId) {
            // 為世界書條目顯示條目標題而非 UID
            const worldbook = worldBooks.find(wb => wb.id === result.itemId);
            if (worldbook) {
                const version = worldbook.versions.find(v => v.id === result.versionId);
                if (version) {
                    const entry = version.entries.find(e => e.id === result.entryId);
                    if (entry) {
                        // 優先顯示條目標題，如果沒有則顯示 UID
                        const entryTitle = entry.comment || `UID:${entry.uid || t('unsetValue')}`;
                        fieldDescription = `${entryTitle} - ${result.fieldName}`;
                    }
                }
            }
        } else if (result.type === 'custom') {
            // 為筆記本添加欄位位置信息
            const section = customSections.find(s => s.id === result.itemId);
            if (section) {
                const version = section.versions.find(v => v.id === result.versionId);
                if (version) {
                    const fieldIndex = version.fields.findIndex(f => f.name === result.fieldName);
                    if (fieldIndex !== -1) {
                        fieldDescription = `${t('fieldPrefix')}${fieldIndex + 1}${t('fieldSuffix')} ${result.fieldName}`;
                    }
                }
            }
        } else if (result.type === 'preset') {
            // 【新增】為預設結果提供更清晰的描述
            fieldDescription = `${t('prompt')} - ${result.fieldName}`;
        }

        // 🧠 關鍵修改：根據類型傳遞不同的識別參數
        // - preset: 傳遞 promptIdentifier
        // - worldbook: 傳遞 entryId
        // - 其他: 傳遞 fieldName
        let fieldIdentifierParam;
        if (result.type === 'preset') {
            fieldIdentifierParam = result.promptIdentifier;
        } else if (result.type === 'worldbook' && result.entryId) {
            fieldIdentifierParam = result.entryId;
        } else {
            fieldIdentifierParam = result.fieldName;
        }
        const jumpArgs = `'${result.type}', '${result.itemId}', '${result.versionId}', '${fieldIdentifierParam}', '${this.escapeForAttribute(this.escapeRegex(searchText))}', '${result.fieldName || ''}'`;

        // 建構單筆取代的結果物件 JSON
        const resultJson = this.escapeForAttribute(JSON.stringify({
            type: result.type,
            itemId: result.itemId,
            versionId: result.versionId,
            fieldName: result.fieldName,
            entryId: result.entryId || null,
            promptIdentifier: result.promptIdentifier || null
        }));

        html += `
<div class="search-result-item tag-item-hover"
     style="
         padding: 12px 16px;
         margin-bottom: 8px;
         background: var(--surface-color);
         border: 1px solid var(--border-color);
         border-radius: 6px;
         transition: all 0.2s ease;
     ">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div style="flex: 1; cursor: pointer;" onclick="ContentSearchManager.jumpToResult(${jumpArgs})">
            <div style="font-weight: 500; color: var(--text-color); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                ${IconManager.folder({width: 14, height: 14, style: 'color: var(--text-muted);'})}
                ${result.itemName} > ${result.versionName}
            </div>

            <div style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                ${IconManager.file({width: 14, height: 14, style: 'color: var(--text-muted);'})}
                ${fieldDescription}
                ${result.matchCount > 1 ? `<span style="background: color-mix(in srgb, var(--text-muted) 20%, transparent); color: var(--text-muted); padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">${result.matchCount} ${t('matchesFound')}</span>` : ''}
            </div>

            <div style="font-size: 0.9em; color: var(--text-color); line-height: 1.4;">
                ${result.snippet}
            </div>
        </div>
        <button class="transparent-bg-btn hover-primary single-replace-btn"
                onclick="event.stopPropagation(); ContentSearchManager.replaceSingle('${resultJson}')"
                style="white-space: nowrap; display: ${ContentSearchManager.isReplaceMode ? 'flex' : 'none'}; border: 1px solid var(--border-color);">
            ${result.matchCount > 1 ? t('replaceCount').replace('$1', result.matchCount) : t('replace')}
        </button>
    </div>
</div>
`;
    });

    html += '</div>';
    return html;
}
    
    // 顯示空狀態
    static showEmptyState(message) {
        const container = document.getElementById('search-results-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                ${message}
            </div>
        `;
    }
    
// 跳轉到結果
static jumpToResult(type, itemId, versionId, fieldIdentifier, searchText, fieldName = '') { // 增加 fieldName 參數
    this.closeSearchModal();

    // 延遲執行，確保模態框完全關閉
    setTimeout(() => {
        let options = {
            highlightText: searchText
        };

        if (type === 'preset') {
            // 對於 preset，我們傳遞 promptIdentifier 用於後續定位
            options.scrollToPrompt = fieldIdentifier;
        } else if (type === 'worldbook') {
            // 對於 worldbook，fieldIdentifier 是 entryId，fieldName 是欄位名稱
            options.scrollToEntry = fieldIdentifier;
            options.entryFieldName = fieldName;
        } else {
            // 對於其他類型，我們傳遞欄位名稱
            options.scrollToField = fieldIdentifier;
        }

        selectItem(type, itemId, versionId, options);
    }, 100);
}

// 轉義屬性值中的特殊字符
static escapeForAttribute(str) {
    if (!str) return '';
    return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
}

// 滾動到搜尋結果位置
function scrollToSearchResult(type, fieldName, searchText) {
    // 欄位名稱映射到實際的 DOM 元素 ID 或 selector
    const fieldSelectors = {
        // 角色卡欄位
        [t('description')]: 'textarea[placeholder*="' + t('descriptionPlaceholder') + '"]',
        [t('personalityTraits')]: 'textarea[placeholder*="' + t('personalityPlaceholder') + '"]',
        [t('plotSetting')]: 'textarea[placeholder*="' + t('scenarioPlaceholder') + '"]',
        [t('dialogue')]: 'textarea[placeholder*="' + t('dialoguePlaceholder') + '"]',
        [t('firstMessageField')]: 'textarea[placeholder*="' + t('firstMessagePlaceholder') + '"]',
        [t('creatorNotes')]: 'textarea[placeholder*="' + t('creatorNotesPlaceholder') + '"]',
        
        // 玩家角色欄位
        [t('description')]: 'textarea[placeholder*="' + t('userPersonaPlaceholder') + '"]',
        
        // 世界書欄位
        [t('entryContent')]: '.worldbook-entry textarea[placeholder*="' + t('entryContentPlaceholder') + '"]',
        [t('entryComment')]: '.worldbook-entry textarea[placeholder*="' + t('entryCommentPlaceholder') + '"]'
    };
    
    // 先嘗試通過欄位名稱找到對應的輸入框
    let targetElement = null;
    
    // 如果有對應的選擇器，使用它
    if (fieldSelectors[fieldName]) {
        targetElement = document.querySelector(fieldSelectors[fieldName]);
    }
    
    // 如果沒找到，嘗試通過 placeholder 文字模糊匹配
    if (!targetElement) {
        const allTextareas = document.querySelectorAll('textarea, input[type="text"]');
        for (const element of allTextareas) {
            const placeholder = element.placeholder || '';
            const label = element.previousElementSibling?.textContent || '';
            
            if (placeholder.includes(fieldName) || label.includes(fieldName)) {
                targetElement = element;
                break;
            }
        }
    }
    
    if (targetElement) {
        // 滾動到目標元素
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 添加高亮效果
        highlightElement(targetElement);
        
        // 聚焦到元素（可選）
        setTimeout(() => {
            targetElement.focus();
        }, 500);
    } else {
    }
}

// 高亮元素效果
function highlightElement(element) {
    const originalStyle = {
        border: element.style.border,
        boxShadow: element.style.boxShadow
    };
    
    // 添加高亮樣式
    element.style.border = '2px solid var(--accent-color)';
    element.style.boxShadow = '0 0 10px rgba(139, 115, 85, 0.3)';
    
    // 3秒後恢復原樣式
    setTimeout(() => {
        element.style.border = originalStyle.border;
        element.style.boxShadow = originalStyle.boxShadow;
    }, 3000);
}

// 滾動到指定的 Preset 提示詞條目
function scrollToPresetPrompt(promptIdentifier, searchText) {
    if (!promptIdentifier) return;

    // 1. 找到條目面板並展開它
    const entryPanel = document.querySelector(`.preset-entry-panel[data-prompt-identifier="${promptIdentifier}"]`);
    if (!entryPanel) {
        return;
    }

    const content = entryPanel.querySelector('.preset-entry-content');
    const toggleBtn = entryPanel.querySelector('.entry-toggle-btn');
    const arrowIcon = toggleBtn ? toggleBtn.querySelector('.arrow-icon') : null;

    // 如果是收合的，就把它展開
    if (content && content.style.display === 'none') {
        content.style.display = 'block';
        if (arrowIcon) {
            arrowIcon.classList.remove('arrow-right');
            arrowIcon.classList.add('arrow-down');
        }
    }
    
    // 2. 找到目標 textarea
    const targetElement = entryPanel.querySelector('textarea');
    if (targetElement) {
        // 滾動到目標元素
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 添加高亮效果
        highlightElement(targetElement);
        
        // 聚焦到元素
        setTimeout(() => {
            targetElement.focus();
        }, 500);
    } else {
        // 如果是 marker (沒有 textarea)，就只滾動到面板
        entryPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(entryPanel);
    }
}

// 滾動到世界書條目
function scrollToWorldBookEntry(entryId, fieldName, searchText) {
    if (!entryId) return;

    const entryPanel = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (!entryPanel) {
        return;
    }

    // 2. 找到內容區域和展開按鈕
    const content = document.getElementById(`entry-content-${entryId}`);
    const toggleBtn = entryPanel.querySelector('.entry-toggle-btn, .wb-toggle-btn');

    // 3. 如果條目是收合的，先展開它
    if (content) {
        const computedStyle = window.getComputedStyle(content);
        const isCollapsed = computedStyle.display === 'none';

        if (isCollapsed) {
            // 檢查是否需要懶載入內容
            if (content.innerHTML.trim() === '' || content.innerHTML.includes('<!-- Content will be loaded lazily')) {
                // 從 toggle 按鈕的 onclick 屬性取得世界書和版本 ID
                const onclickAttr = toggleBtn?.getAttribute('onclick') || '';
                const matches = onclickAttr.match(/toggleEntryContentLazy\('([^']+)',\s*'([^']+)',\s*'([^']+)'/);
                if (matches) {
                    const [, worldBookId, versionId] = matches;
                    // 呼叫載入內容函數
                    if (typeof loadEntryContent === 'function') {
                        loadEntryContent(worldBookId, versionId, entryId);
                    }
                }
            }

            // 展開內容
            content.style.display = 'block';
            if (toggleBtn) {
                const arrowIcon = toggleBtn.querySelector('.arrow-icon');
                if (arrowIcon) {
                    arrowIcon.classList.remove('arrow-right');
                    arrowIcon.classList.add('arrow-down');
                }
            }
        }
    }

    // 4. 延遲後找到並滾動到目標欄位
    setTimeout(() => {
        let targetElement = null;

        // 根據欄位名稱找到對應的 textarea
        if (fieldName) {
            const textareas = entryPanel.querySelectorAll('textarea');
            for (const textarea of textareas) {
                const placeholder = textarea.placeholder || '';
                // 檢查 placeholder 是否包含欄位名稱的關鍵字
                if (fieldName === t('entryContent') && placeholder.includes(t('entryContentPlaceholder'))) {
                    targetElement = textarea;
                    break;
                } else if (fieldName === t('entryComment') && placeholder.includes(t('entryCommentPlaceholder'))) {
                    targetElement = textarea;
                    break;
                }
            }
        }

        // 如果找不到特定欄位，就用第一個 textarea
        if (!targetElement) {
            targetElement = entryPanel.querySelector('textarea');
        }

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            highlightElement(targetElement);
            setTimeout(() => {
                targetElement.focus();
            }, 500);
        } else {
            // 沒有找到 textarea，直接滾動到面板
            entryPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(entryPanel);
        }
    }, 150); // 延遲等待內容載入
}

// 顯示其他設定介面
function showOtherSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 500px; padding: 25px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.settings({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('otherSettings')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
        
        <!-- 功能區塊顯示設定 -->
        <div class="compact-section" style="margin-top: 24px; padding: 0px;">
            <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                ${IconManager.settings({width: 14, height: 14})}
                ${t('featureDisplay')}
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color);">
                <div style="flex: 1;">
   <div style="font-weight: 500; margin-bottom: 4px; color: var(--text-color); font-size: 0.9em;">${t('showLoveyDoveySection')}</div>
<div style="font-size: 0.8em; color: var(--text-muted); margin: 0; line-height: 1.3;">${t('loveyDoveyDescription')}</div>
</div>
                
                <!-- 拉霸開關 -->
                <label style="position: relative; display: inline-block; width: 40px; height: 20px; cursor: pointer;">
                    <input type="checkbox" name="showLoveyDovey" ${OtherSettings.settings.showLoveyDovey ? 'checked' : ''} 
                        onchange="OtherSettings.updateSetting('showLoveyDovey', this.checked); updateToggleSwitch('showLoveyDovey', this.checked);" 
                        style="opacity: 0; width: 0; height: 0;">
                    <span style="
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${OtherSettings.settings.showLoveyDovey ? 'var(--accent-color)' : 'var(--border-color)'};
    transition: 0.3s;
    border-radius: 20px;
"></span>
                    <span style="
    position: absolute;
    content: '';
    height: 14px;
    width: 14px;
    left: ${OtherSettings.settings.showLoveyDovey ? '23px' : '3px'};
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
"></span>
                </label>
            </div>
       </div>
            
            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" style="margin-top: 8px;"onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


function closeFunctionMenu() {
    const menu = document.getElementById('function-menu');
    if (menu && menu.style.display !== 'none') {
        menu.style.display = 'none';
        document.removeEventListener('click', handleGlobalClickForMenu);
    }
}

/**
 * 全域點擊事件處理器。當點擊發生在選單外部時，關閉選單。
 * @param {MouseEvent} event 
 */
function handleGlobalClickForMenu(event) {
    const menu = document.getElementById('function-menu');
    const toggleButton = document.getElementById('function-toggle');
    const collapsedToggleButton = document.querySelector('.sidebar-collapsed-icons .collapsed-icon-btn[title="Setting"]');

    const isClickInsideMenu = menu && menu.contains(event.target);
    const isClickOnToggleButton = toggleButton && toggleButton.contains(event.target);
    const isClickOnCollapsedButton = collapsedToggleButton && collapsedToggleButton.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggleButton && !isClickOnCollapsedButton) {
        closeFunctionMenu();
    }
}

/**
 * 處理選單項目點擊的核心函式
 * @param {MouseEvent} event 
 */
function handleMenuAction(event) {
    const target = event.target.closest('.function-option');
    if (!target) return;

    const action = target.dataset.action;
    const value = target.dataset.value;

    closeFunctionMenu();

    setTimeout(() => {
        try {
            switch (action) {
                case 'showColorPicker': showColorPicker(); break;
                case 'showOtherSettings': showOtherSettings(); break;
                case 'selectLanguage': selectLanguage(value); break;
                case 'exportAllData': exportAllData(); break;
                case 'importAllData': importAllData(); break;
                case 'showClearDataConfirm': showClearDataConfirm(); break;
                case 'showCloudSync': 
                    showCloudSync(); 
                    break;
                case 'showCloudSyncOnMobile': 
                    openModalOnMobile(() => showCloudSync()); 
                    break;
                
                case 'showColorPickerOnMobile': 
                    openModalOnMobile(() => showColorPicker()); 
                    break;
                case 'showOtherSettingsOnMobile': 
                    openModalOnMobile(() => showOtherSettings()); 
                    break;
                case 'showClearDataConfirmOnMobile': 
                    openModalOnMobile(() => showClearDataConfirm()); 
                    break;
            }
        } catch (error) {
        }
    }, 50); 
}

/**
 * 切換功能選單的顯示與隱藏
 * @param {MouseEvent} event 
 */
function toggleFunctionMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('function-menu');
    const isVisible = menu.style.display !== 'none';

    if (isVisible) {
        closeFunctionMenu();
    } else {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();

        menu.innerHTML = generateFunctionMenu();
        menu.addEventListener('click', handleMenuAction);
        
        menu.style.display = 'block';
        
        setTimeout(() => {
            document.addEventListener('click', handleGlobalClickForMenu);
        }, 0);

        const menuContent = menu.firstElementChild;
        if (!menuContent) return;
        const menuRect = menuContent.getBoundingClientRect();
        
        let top = rect.top - menuRect.height - 8;
        let left = rect.left + (rect.width / 2) - (menuRect.width / 2);

        if (top < 10) top = 10;
        if (left < 10) left = 10;
        if (left + menuRect.width > window.innerWidth) {
            left = window.innerWidth - menuRect.width - 10;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }
}


function generateFunctionMenu() {
    return `
        <div style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: var(--shadow-medium); min-width: 140px; padding: 4px 0;">
            <!-- 介面設定 -->
            <div class="function-option" data-action="showColorPickerOnMobile" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.palette()} ${t('customInterface')}
            </div>
            <div class="function-option" data-action="showOtherSettingsOnMobile" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.settings()} ${t('otherSettings')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <!-- 語言選項 -->
            <div class="function-option" data-action="selectLanguage" data-value="zh" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.globe()} ${t('languageChinese')}
            </div>
            <div class="function-option" data-action="selectLanguage" data-value="en" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.globe()} ${t('languageEnglish')}
            </div>
            
            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>

            <!-- 雲端同步 -->
            <div class="function-option" data-action="showCloudSync" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.cloud()} ${t('cloudSync')}
            </div>

            <div style="height: 1px; background: var(--border-color); margin: 6px 0;"></div>
            
            <!-- 資料管理 -->
            <div class="function-option" data-action="exportAllData" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
               ${IconManager.download()} ${t('exportData')}
            </div>
            <div class="function-option" data-action="importAllData" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.import()} ${t('importData')}
            </div>
            <div class="function-option" data-action="showClearDataConfirmOnMobile" style="padding: 8px 12px; cursor: pointer; font-size: 0.85em; display: flex; align-items: center; gap: 8px; color: var(--danger-color); transition: background 0.2s ease;" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='transparent'">
                ${IconManager.delete()} ${t('clearAllData')}
            </div>
        </div>
    `;
}

// 搜尋功能
function handleSearchInput(searchValue) {
    searchText = searchValue.trim().toLowerCase();
    // 重置分頁狀態
    if (typeof OverviewManager !== 'undefined') {
        OverviewManager.currentlyShown = OverviewManager.itemsPerPage;
        OverviewManager.lastProcessParams = null;
    }
    
    // 重新渲染列表
    if (isHomePage) {
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        OverviewManager.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        // 玩家角色總覽頁面
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        // 卿卿我我總覽頁面
        ContentRenderer.renderLoveyDoveyCards();
    }
}

// 更新拉霸開關樣式
function updateToggleSwitch(checkboxName, isChecked) {
    const checkbox = document.querySelector(`input[name="${checkboxName}"]`);
    if (!checkbox) return;
    
    const container = checkbox.closest('label');
    if (!container) return;
    
    const background = container.querySelector('span:first-of-type');
    const slider = container.querySelector('span:last-of-type');
    
    if (background && slider) {
        // 更新背景顏色
        background.style.backgroundColor = isChecked ? 'var(--accent-color)' : 'var(--border-color)';

        // 更新滑塊位置
slider.style.left = isChecked ? '23px' : '3px';
    }
}

    // 顯示說明功能
    function showHelp() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="compact-modal-content" style="max-width: 800px; padding: 30px; max-height: 90vh; overflow-y: auto;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        ${IconManager.question({width: 18, height: 18})}
                        <h3 class="compact-modal-title">${t('helpTitle')}</h3>
                    </div>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <!-- 使用說明區 -->
                <div class="compact-section" style="text-align: left; margin-top: 25px; padding: 8px;">
                    <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                        ${t('helpContent')}
                    </div>
                </div>

                <div class="compact-modal-footer" style="margin-top: 25px;">
                    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('close')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 點擊遮罩關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

// 顯示聯絡回報功能
function showContact() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 600px; padding: 30px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.email({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('contactTitle')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <!-- 聯絡方式區 -->
            <div class="compact-section" style="text-align: left; margin-top: 25px; padding: 0px;">
                <div style="color: var(--text-color); line-height: 1.6; font-size: 0.9em;">
                    ${t('contactMethodsContent')}
                </div>
            </div>
        
            
            <div class="compact-modal-footer" style="margin-top: 25px;">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


// 雲端同步功能
function showCloudSync() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="compact-modal-content" style="max-width: 500px; padding: 25px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.cloud({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('cloudSync')}</h3>
                </div>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
        
            <!-- Google 帳號狀態 -->
            <div class="compact-section" style="margin-top: 24px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    ${IconManager.user({width: 14, height: 14})}
                    ${t('accountStatus')}
                </div>
                
                <div id="google-account-status" style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); margin-bottom: 16px;">
                    <div style="color: var(--text-muted); font-size: 0.9em;">${t('notConnectedToGoogle')}</div>
                </div>
                
                <button id="google-auth-btn" class="overview-btn btn-primary" style="width: 100%; margin-bottom: 16px;" onclick="handleGoogleAuth()">
                    ${t('connectToGoogle')}
                </button>
            </div>
            
            <!-- 雲端操作 -->
            <div class="compact-section" style="margin-top: 24px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    ${IconManager.cloud({width: 14, height: 14})}
                    ${t('cloudOperations')}
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="upload-backup-btn" class="overview-btn hover-primary" style="flex: 1;" onclick="uploadBackupToCloud()" disabled>
                        ${IconManager.download({width: 16, height: 16})} ${t('uploadBackup')}
                    </button>
                    
                    <button id="download-backup-btn" class="overview-btn hover-primary" style="flex: 1;" onclick="downloadBackupFromCloud()" disabled>
                        ${IconManager.import({width: 16, height: 16})} ${t('downloadBackup')}
                    </button>
                </div>
                
                <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 8px; text-align: left;">
                    ${t('cloudSyncDescription')}
                </div>
            </div>
            
            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 檢查登入狀態
    checkGoogleAuthStatus();
    
    // 點擊遮罩關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function scrollToPresetPrompt(promptIdentifier, searchText) {
    if (!promptIdentifier) return;

    const entryPanel = document.querySelector(`.preset-entry-panel[data-prompt-identifier="${promptIdentifier}"]`);
    if (!entryPanel) {
        return;
    }

    const content = entryPanel.querySelector('.preset-entry-content');
    const toggleBtn = entryPanel.querySelector('.entry-toggle-btn');
    if (content && content.style.display === 'none') {
        // 使用 PresetRenderer 的方法來展開，確保狀態一致
        PresetRenderer.togglePromptContent(promptIdentifier);
    }
    
    // 2. 找到目標 textarea
    const targetElement = entryPanel.querySelector('textarea');
    if (targetElement) {
        // 滾動到目標元素
        targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 添加高亮效果
        highlightElement(targetElement);
        
        // 聚焦到元素
        setTimeout(() => {
            targetElement.focus();
        }, 500);
    } else {
        // 如果是 marker (沒有 textarea)，就只滾動到面板
        entryPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(entryPanel);
    }
}