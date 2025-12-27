// ===== 1. 全域變數初始化 =====
let currentLang = localStorage.getItem('characterCreatorLang') || 'en';
let translationsReady = false;

// 資料變數
let characters = [];
let customSections = [];
let worldBooks = [];
let userPersonas = [];
let loveyDoveyCharacters = [];
let presets = [];


// 狀態變數
let isHomePage = true;
let currentCharacterId = null;
let currentVersionId = null;
let currentCustomSectionId = null;
let currentCustomVersionId = null;
let currentWorldBookId = null;
let currentWorldBookVersionId = null;
let currentUserPersonaId = null;
let currentUserPersonaVersionId = null;
let currentLoveyDoveyId = null;
let currentLoveyDoveyVersionId = null;
let currentPresetId = null;
let currentPresetVersionId = null;
let currentMode = 'character';
let viewMode = 'single';
let compareVersions = [];
let hasUnsavedChanges = false;
let lastSavedData = null;
let sidebarCollapsed = false;
let favoriteEditMode = false;
let currentFolderId = null; 
let folderBreadcrumbs = [];

// 列表頁面狀態變數
let isListPage = false;
let listPageType = null;
let batchEditMode = false;
let selectedItems = [];
let currentPage = 1;
let itemsPerPage = 100;
let searchText = '';

// 雙屏編輯狀態變數
let crossTypeCompareMode = false;
let crossTypeItems = {
    left: { type: 'character', itemId: null, versionId: null },
    right: { type: 'worldbook', itemId: null, versionId: null }
};

// ===== 2. 核心工具函數 =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function adjustBrightness(hex, factor) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
    const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
    const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));
    
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}



// ===== 翻譯系統 =====
function t(key, ...args) {
    if (!window.translationManager) {
        console.warn('⚠️ 翻譯管理器尚未初始化，使用鍵值:', key);
        return key;
    }
    
    const locale = currentLang === 'zh' ? 'zh-TW' : 'en-US';
    const result = window.translationManager.getTranslation(locale, key, ...args);
    
    if (result === key && key.length > 2) {
        
    }
    
    return result;
}

async function initTranslations() {
    if (!window.translationManager) {
        console.error('❌ 翻譯管理器未找到，請確保已載入 translations/index.js');
        return false;
    }
    
    const locale = currentLang === 'zh' ? 'zh-TW' : 'en-US';
    
    try {
        const success = await window.translationManager.loadLanguage(locale);
        if (success) {
            translationsReady = true;
            const testTranslation = window.translationManager.getTranslation(locale, 'appTitle');
            return true;
        } else {
            console.warn(`⚠️ 翻譯載入失敗，使用備援翻譯 (${locale})`);
            translationsReady = true;
            return false;
        }
    } catch (error) {
        console.error('❌ 翻譯系統初始化失敗:', error);
        translationsReady = true;
        return false;
    }
}

async function switchLanguage(newLang) {
    if (newLang === currentLang) return;
    
    currentLang = newLang;
    localStorage.setItem('characterCreatorLang', newLang);
    
    const locale = newLang === 'zh' ? 'zh-TW' : 'en-US';
    
    if (window.translationManager) {
        await window.translationManager.loadLanguage(locale);
    }
    
    if (typeof renderAll === 'function') {
        renderAll();
    }
}

function selectLanguage(lang) {
    switchLanguage(lang);
    
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.title = lang === 'zh' ? t('langToggleZh') : t('langToggleEn');
    }
}

function toggleLanguageMenu() {
    const menu = document.getElementById('lang-menu');
    const isVisible = menu.style.display !== 'none';
    
    if (isVisible) {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
        updateLanguageMenu();
    }
}

function updateLanguageMenu() {
    const options = document.querySelectorAll('.language-option');
    options.forEach(option => {
        const lang = option.getAttribute('onclick').match(/'(.+)'/)[1];
        if (lang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function updateLanguageUI() {
    const sidebarTitle = document.querySelector('.sidebar-app-title');
    if (sidebarTitle) sidebarTitle.textContent = t('appTitle');
    
    const sidebarFooterText = document.querySelector('.sidebar-footer-text');
    if (sidebarFooterText) sidebarFooterText.textContent = t('appSubtitle');
    
    const controlButtons = document.querySelectorAll('.control-btn');
    if (controlButtons[0]) controlButtons[0].textContent = t('customInterface');
    if (controlButtons[1]) controlButtons[1].textContent = t('exportData');
    if (controlButtons[2]) controlButtons[2].textContent = t('importData');
    if (controlButtons[3]) controlButtons[3].textContent = t('clearAllData');
    if (controlButtons[4]) controlButtons[4].textContent = t('saveData');
    
    updateSaveButtonStates();
    setupKeyboardShortcuts();
}

// 點擊選單項目後自動關閉選單
function closeFunctionMenu() {
    const menu = document.getElementById('function-menu');
    if (menu) {
        menu.style.display = 'none';
    }
}

// ===== 5. 項目管理器類別 =====
class ItemManager {
    static getCurrentItem() {
        const itemId = this.getCurrentItemId();
        const items = this.getItemsArray(currentMode);
        return items.find(item => item.id === itemId);
    }
    
    static getCurrentItemId() {
        // 雙屏模式特殊處理
        if (currentMode === 'crosstype' && crossTypeCompareMode) {
            return crossTypeItems.left.itemId;
        }
        
        switch (currentMode) {
            case 'character': return currentCharacterId;
            case 'custom': return currentCustomSectionId;
            case 'worldbook': return currentWorldBookId;
            case 'userpersona': return currentUserPersonaId;
            case 'loveydovey': return currentLoveyDoveyId;
            case 'preset': return currentPresetId;
            default: return null;
        }
    }
    
    static getCurrentVersionId() {
        // 雙屏模式特殊處理
        if (currentMode === 'crosstype' && crossTypeCompareMode) {
            return crossTypeItems.left.versionId;
        }
        
        switch (currentMode) {
            case 'character': return currentVersionId;
            case 'custom': return currentCustomVersionId;
            case 'worldbook': return currentWorldBookVersionId;
            case 'userpersona': return currentUserPersonaVersionId;
            case 'loveydovey': return currentLoveyDoveyVersionId;
            case 'preset': return currentPresetVersionId;
            default: return null;
        }
    }

    static getCrossTypeItemDetails(itemId, versionId) {
        // 判斷是左側還是右側
        if (crossTypeItems.left.itemId === itemId && crossTypeItems.left.versionId === versionId) {
            return { side: 'left', type: crossTypeItems.left.type };
        } else if (crossTypeItems.right.itemId === itemId && crossTypeItems.right.versionId === versionId) {
            return { side: 'right', type: crossTypeItems.right.type };
        }
        return null;
    }
    
    static getItemsArray(type) {
        switch (type) {
            case 'character': return characters;
            case 'custom': return customSections;
            case 'worldbook': return worldBooks;
            case 'userpersona': return userPersonas;
            case 'loveydovey': return loveyDoveyCharacters;
            case 'preset': return presets;
            default: return [];
        }
    }
    
    static getCurrentVersion() {
        const item = this.getCurrentItem();
        const versionId = this.getCurrentVersionId();
        return item?.versions.find(v => v.id === versionId);
    }
    
    static setCurrentItem(type, itemId, versionId = null) {
        currentMode = type;
        
        switch (type) {
            case 'character':
                currentCharacterId = itemId;
                if (versionId) currentVersionId = versionId;
                break;
            case 'custom':
                currentCustomSectionId = itemId;
                if (versionId) currentCustomVersionId = versionId;
                break;
            case 'worldbook':
                currentWorldBookId = itemId;
                if (versionId) currentWorldBookVersionId = versionId;
                break;
            case 'userpersona':
                currentUserPersonaId = itemId;
                if (versionId) currentUserPersonaVersionId = versionId;
                break;
            case 'loveydovey':
                currentLoveyDoveyId = itemId;
                if (versionId) currentLoveyDoveyVersionId = versionId;
                break;
            case 'preset':
                currentPresetId = itemId;
                if (versionId) currentPresetVersionId = versionId;
                break;
        }
    }
}

class DataOperations {
    static getItems(type) {
        switch (type) {
            case 'character': return characters;
            case 'custom': return customSections;
            case 'worldbook': return worldBooks;
            case 'userpersona': return userPersonas;
            case 'loveydovey': return loveyDoveyCharacters;
            case 'preset': return presets;
            default: return [];
        }
    }

    static createNewItem(type, index = 0) {
        const baseId = generateId();
        const baseVersionId = generateId();
        
        const baseStructure = {
            id: baseId,
            versions: [{
                id: baseVersionId,
                name: 'Version 1'
            }]
        };

        switch (type) {
            case 'character':
                return {
                    ...baseStructure,
                    name: `${t('defaultCharacterName')} ${index + 1}`,
                    isFavorite: false,
                    createdAt: TimestampManager.createTimestamp(), 
                    updatedAt: TimestampManager.createTimestamp(),
                    versions: [{
                        ...baseStructure.versions[0],
                        avatar: '',
                        description: '',
                        personality: '',
                        scenario: '',
                        dialogue: '',
                        firstMessage: '',
                        creator: '',
                        charVersion: '',
                        creatorNotes: '',
                        tags: '',
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }]
                };

                case 'loveydovey':
                return {
                    ...baseStructure,
                    name: `${t('defaultCharacterName')} ${index + 1}`,
                    isFavorite: false,
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp(),
                    versions: [{
                        ...baseStructure.versions[0],
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp(),
                        
                        // 第一大區：個人資料
                        profileImage: '',
                        characterName: '',
                        age: '',
                        occupation: '',
                        characterQuote: '',
                        publicDescription: '',
                        characterLinkUrl: '',
                        tags: '',
                        
                        // 第二大區：角色基本設定
                        gender: 'unset',
                        basicInfo: '',
                        personality: '',
                        speakingStyle: '',
                        
                        // 第三大區：第一次聊天場景
                        scenarioScript: '',
                        characterDialogue: '',
                        
                        // 第四大區：角色詳細設定
                        likes: '',
                        dislikes: '',
                        additionalInfo: [],
                        
                        // 第五大區：創作者事件
                        creatorEvents: [],
                        privateStories: []
                    }]
                };
                
            case 'worldbook':
                return {
                    ...baseStructure,
                    name: `${t('defaultLorebookName')} ${index + 1}`,
                    isFavorite: false,
                    description: '',
                    versions: [{
                        ...baseStructure.versions[0],
                        entries: [],
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }]
                };
                
            case 'custom':
                return {
                    ...baseStructure,
                    name: `${t('defaultNotebookName')} ${index + 1}`,
                    isFavorite: false,
                    versions: [{
                        ...baseStructure.versions[0],
                        fields: [{
                            id: generateId(),
                            name: 'Field 1',
                            content: '',
                            createdAt: TimestampManager.createTimestamp(),
                            updatedAt: TimestampManager.createTimestamp()
                        }]
                    }]
                };

            case 'userpersona':
                return {
                    ...baseStructure,
                    name: `${t('defaultUserPersonaName')} ${index + 1}`,
                    isFavorite: false,
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp(),
                    versions: [{
                        ...baseStructure.versions[0],
                        avatar: '',
                        description: '',
                        tags: '',
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }]
                };

            case 'preset':
                return {
                    ...baseStructure,
                    name: `${t('defaultPresetName')} ${index + 1}`,
                    type: 'openai',
                    isFavorite: false,
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp(),
                    versions: [{
                        ...baseStructure.versions[0],
                        
                        // 🔥 直接使用完整的SillyTavern JSON結構
                        temperature: 1,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                        top_p: 1,
                        top_k: 0,
                        top_a: 0,
                        min_p: 0,
                        repetition_penalty: 1,
                        openai_max_context: 100000,
                        openai_max_tokens: 4000,
                        wrap_in_quotes: false,
                        names_behavior: 0,
                        
                        send_if_empty: "",
                        impersonation_prompt: "[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Write 1 reply only in internet RP style. Don't write as {{char}} or system. Don't describe actions of {{char}}.]",
                        new_chat_prompt: "[Start a new Chat]",
                        new_group_chat_prompt: "[Start a new group chat. Group members: {{group}}]",
                        new_example_chat_prompt: "[Example Chat]",
                        continue_nudge_prompt: "[Continue your last message without repeating its original content.]",
                        group_nudge_prompt: "[Write the next reply only as {{char}}.]",
                        
                        wi_format: "{0}",
                        scenario_format: "{{scenario}}",
                        personality_format: "{{personality}}",
                        bias_preset_selected: "Default (none)",
                        max_context_unlocked: true,
                        stream_openai: true,
                        
                        // 🔑 核心：SillyTavern 的 prompts 和 prompt_order 結構
                        prompts: [
                            {
                                name: "Main Prompt",
                                system_prompt: true,
                                role: "system",
                                content: "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
                                identifier: "main"
                            },
                            {
                                name: "Auxiliary Prompt",
                                system_prompt: true,
                                role: "system",
                                content: "",
                                identifier: "nsfw"
                            },
                            {
                                identifier: "dialogueExamples",
                                name: "Chat Examples",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                name: "Post-History Instructions",
                                system_prompt: true,
                                role: "system",
                                content: "",
                                identifier: "jailbreak"
                            },
                            {
                                identifier: "chatHistory",
                                name: "Chat History",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "worldInfoAfter",
                                name: "World Info (after)",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "worldInfoBefore",
                                name: "World Info (before)",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "enhanceDefinitions",
                                role: "system",
                                name: "Enhance Definitions",
                                content: "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
                                system_prompt: true,
                                marker: false
                            },
                            {
                                identifier: "charDescription",
                                name: "Char Description",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "charPersonality",
                                name: "Char Personality",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "scenario",
                                name: "Scenario",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "personaDescription",
                                name: "Persona Description",
                                system_prompt: true,
                                marker: true
                            }
                        ],
                        
                        prompt_order: [
                            {
                                character_id: 100000,
                                order: [
                                    { identifier: "main", enabled: true },
                                    { identifier: "worldInfoBefore", enabled: true },
                                    { identifier: "charDescription", enabled: true },
                                    { identifier: "charPersonality", enabled: true },
                                    { identifier: "scenario", enabled: true },
                                    { identifier: "enhanceDefinitions", enabled: false },
                                    { identifier: "nsfw", enabled: true },
                                    { identifier: "worldInfoAfter", enabled: true },
                                    { identifier: "dialogueExamples", enabled: true },
                                    { identifier: "chatHistory", enabled: true },
                                    { identifier: "jailbreak", enabled: true }
                                ]
                            },
                            {
                                character_id: 100001,
                                order: [
                                    { identifier: "main", enabled: true },
                                    { identifier: "worldInfoBefore", enabled: true },
                                    { identifier: "personaDescription", enabled: true },
                                    { identifier: "charDescription", enabled: true },
                                    { identifier: "charPersonality", enabled: true },
                                    { identifier: "scenario", enabled: true },
                                    { identifier: "enhanceDefinitions", enabled: false },
                                    { identifier: "nsfw", enabled: true },
                                    { identifier: "worldInfoAfter", enabled: true },
                                    { identifier: "dialogueExamples", enabled: true },
                                    { identifier: "chatHistory", enabled: true },
                                    { identifier: "jailbreak", enabled: true }
                                ]
                            }
                        ],
                        
                        assistant_prefill: "",
                        claude_use_sysprompt: false,
                        squash_system_messages: false,
                        show_thoughts: false,
                        reasoning_effort: "medium",
                        enable_web_search: false,
                        extensions: {},
                        
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }]
                };
        }
    }

    static createNewVersion(type, versionNumber) {
        const baseVersion = {
            id: generateId(),
            name: `${t('defaultVersionName')} ${versionNumber}`
        };

        switch (type) {
            case 'character':
                return {
                    ...baseVersion,
                    avatar: '',
                    description: '',
                    personality: '',
                    scenario: '',
                    dialogue: '',
                    firstMessage: '',
                    creator: '',
                    charVersion: '',
                    creatorNotes: '',
                    tags: '',
                    boundWorldBookId: null,
                    boundWorldBookVersionId: null, 
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp()
                };

                case 'loveydovey':
                return {
                    ...baseVersion,
                    // 第一大區：個人資料
                    profileImage: '',
                    characterName: '',
                    age: '',
                    occupation: '',
                    characterQuote: '',
                    publicDescription: '',
                    tags: '',
                    
                    // 第二大區：角色基本設定
                    gender: 'unset',
                    basicInfo: '',
                    personality: '',
                    speakingStyle: '',
                    
                    // 第三大區：第一次聊天場景
                    scenarioScript: '',
                    characterDialogue: '',
                    
                    // 第四大區：角色詳細設定
                    likes: '',
                    dislikes: '',
                    additionalInfo: [],
                    
                    // 第五大區：創作者事件
                    creatorEvents: [],
                    privateStories: []
                };
                
            case 'worldbook':
                return {
                    ...baseVersion,
                    entries: [],
                    tags: '',
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp()
                };
                
            case 'custom':
                return {
                    ...baseVersion,
                    fields: [{
                        id: generateId(),
                        name: t('defaultField'),
                        content: '',
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }],
                    tags: ''
                };

            case 'userpersona':
                return {
                    ...baseVersion,
                    avatar: '',
                    description: '',
                    tags: '',
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp()
                };

            case 'preset':
                return {
                    ...baseStructure,
                    name: `${t('defaultPresetName')} ${index + 1}`,
                    type: 'openai',
                    isFavorite: false,
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp(),
                    versions: [{
                        ...baseStructure.versions[0],
                        
                        // 🔥 直接使用完整的SillyTavern JSON結構
                        temperature: 1,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                        top_p: 1,
                        top_k: 0,
                        top_a: 0,
                        min_p: 0,
                        repetition_penalty: 1,
                        openai_max_context: 100000,
                        openai_max_tokens: 4000,
                        wrap_in_quotes: false,
                        names_behavior: 0,
                        
                        send_if_empty: "",
                        impersonation_prompt: "[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Write 1 reply only in internet RP style. Don't write as {{char}} or system. Don't describe actions of {{char}}.]",
                        new_chat_prompt: "[Start a new Chat]",
                        new_group_chat_prompt: "[Start a new group chat. Group members: {{group}}]",
                        new_example_chat_prompt: "[Example Chat]",
                        continue_nudge_prompt: "[Continue your last message without repeating its original content.]",
                        group_nudge_prompt: "[Write the next reply only as {{char}}.]",
                        
                        wi_format: "{0}",
                        scenario_format: "{{scenario}}",
                        personality_format: "{{personality}}",
                        bias_preset_selected: "Default (none)",
                        max_context_unlocked: true,
                        stream_openai: true,
                        
                        // 🔑 核心：SillyTavern 的 prompts 和 prompt_order 結構
                        prompts: [
                            {
                                name: "Main Prompt",
                                system_prompt: true,
                                role: "system",
                                content: "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
                                identifier: "main"
                            },
                            {
                                name: "Auxiliary Prompt",
                                system_prompt: true,
                                role: "system",
                                content: "",
                                identifier: "nsfw"
                            },
                            {
                                identifier: "dialogueExamples",
                                name: "Chat Examples",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                name: "Post-History Instructions",
                                system_prompt: true,
                                role: "system",
                                content: "",
                                identifier: "jailbreak"
                            },
                            {
                                identifier: "chatHistory",
                                name: "Chat History",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "worldInfoAfter",
                                name: "World Info (after)",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "worldInfoBefore",
                                name: "World Info (before)",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "enhanceDefinitions",
                                role: "system",
                                name: "Enhance Definitions",
                                content: "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
                                system_prompt: true,
                                marker: false
                            },
                            {
                                identifier: "charDescription",
                                name: "Char Description",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "charPersonality",
                                name: "Char Personality",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "scenario",
                                name: "Scenario",
                                system_prompt: true,
                                marker: true
                            },
                            {
                                identifier: "personaDescription",
                                name: "Persona Description",
                                system_prompt: true,
                                marker: true
                            }
                        ],
                        
                        prompt_order: [
                            {
                                character_id: 100000,
                                order: [
                                    { identifier: "main", enabled: true },
                                    { identifier: "worldInfoBefore", enabled: true },
                                    { identifier: "charDescription", enabled: true },
                                    { identifier: "charPersonality", enabled: true },
                                    { identifier: "scenario", enabled: true },
                                    { identifier: "enhanceDefinitions", enabled: false },
                                    { identifier: "nsfw", enabled: true },
                                    { identifier: "worldInfoAfter", enabled: true },
                                    { identifier: "dialogueExamples", enabled: true },
                                    { identifier: "chatHistory", enabled: true },
                                    { identifier: "jailbreak", enabled: true }
                                ]
                            },
                            {
                                character_id: 100001,
                                order: [
                                    { identifier: "main", enabled: true },
                                    { identifier: "worldInfoBefore", enabled: true },
                                    { identifier: "personaDescription", enabled: true },
                                    { identifier: "charDescription", enabled: true },
                                    { identifier: "charPersonality", enabled: true },
                                    { identifier: "scenario", enabled: true },
                                    { identifier: "enhanceDefinitions", enabled: false },
                                    { identifier: "nsfw", enabled: true },
                                    { identifier: "worldInfoAfter", enabled: true },
                                    { identifier: "dialogueExamples", enabled: true },
                                    { identifier: "chatHistory", enabled: true },
                                    { identifier: "jailbreak", enabled: true }
                                ]
                            }
                        ],
                        
                        assistant_prefill: "",
                        claude_use_sysprompt: false,
                        squash_system_messages: false,
                        show_thoughts: false,
                        reasoning_effort: "medium",
                        enable_web_search: false,
                        extensions: {},
                        
                        createdAt: TimestampManager.createTimestamp(),
                        updatedAt: TimestampManager.createTimestamp()
                    }]
                };
        }
    }

    static cloneVersion(originalVersion, type) {
        const baseClone = {
            id: generateId(),
            name: originalVersion.name
        };
        
        switch (type) {
            case 'character':
                return {
                    ...baseClone,
                    avatar: originalVersion.avatar || '',
                    description: originalVersion.description || '',
                    personality: originalVersion.personality || '',
                    scenario: originalVersion.scenario || '',
                    dialogue: originalVersion.dialogue || '',
                    firstMessage: originalVersion.firstMessage || '',
                    creator: originalVersion.creator || '',
                    charVersion: originalVersion.charVersion || '',
                    creatorNotes: originalVersion.creatorNotes || '',
                    tags: originalVersion.tags || '',
                    alternateGreetings: originalVersion.alternateGreetings ? [...originalVersion.alternateGreetings] : []

                };

            case 'loveydovey':
                return {
                    ...baseClone,
                    // 第一大區：個人資料
                    profileImage: originalVersion.profileImage || '',
                    characterName: originalVersion.characterName || '',
                    age: originalVersion.age || '',
                    occupation: originalVersion.occupation || '',
                    characterQuote: originalVersion.characterQuote || '',
                    publicDescription: originalVersion.publicDescription || '',
                    tags: originalVersion.tags || '',
                    
                    // 第二大區：角色基本設定
                    gender: originalVersion.gender || 'unset',
                    basicInfo: originalVersion.basicInfo || '',
                    personality: originalVersion.personality || '',
                    speakingStyle: originalVersion.speakingStyle || '',
                    
                    // 第三大區：第一次聊天場景
                    scenarioScript: originalVersion.scenarioScript || '',
                    characterDialogue: originalVersion.characterDialogue || '',
                    
                    // 第四大區：角色詳細設定
                    likes: originalVersion.likes || '',
                    dislikes: originalVersion.dislikes || '',
                    additionalInfo: JSON.parse(JSON.stringify(originalVersion.additionalInfo || [])),
                    
                    // 第五大區：創作者事件
                    creatorEvents: JSON.parse(JSON.stringify(originalVersion.creatorEvents || [])),
                    privateStories: JSON.parse(JSON.stringify(originalVersion.privateStories || []))
                };
                
            case 'worldbook':
                return {
                    ...baseClone,
                    entries: originalVersion.entries.map(entry => ({
                        ...entry,
                        id: generateId()
                    })),
                    tags: originalVersion.tags || ''
                };
                
            case 'custom':
                return {
                    ...baseClone,
                    fields: originalVersion.fields.map(field => ({
                        id: generateId(),
                        name: field.name,
                        content: field.content
                    })),
                    tags: originalVersion.tags || ''
                };

            case 'userpersona':
                return {
                    ...baseClone,
                    avatar: originalVersion.avatar || '',
                    description: originalVersion.description || '',
                    tags: originalVersion.tags || ''
                };

            case 'preset':
                return {
                    ...baseClone,
                    
                    // 🔥 深拷貝所有預設欄位
                    temperature: originalVersion.temperature || 1,
                    frequency_penalty: originalVersion.frequency_penalty || 0,
                    presence_penalty: originalVersion.presence_penalty || 0,
                    top_p: originalVersion.top_p || 1,
                    top_k: originalVersion.top_k || 0,
                    top_a: originalVersion.top_a || 0,
                    min_p: originalVersion.min_p || 0,
                    repetition_penalty: originalVersion.repetition_penalty || 1,
                    
                    openai_max_context: originalVersion.openai_max_context || 100000,
                    openai_max_tokens: originalVersion.openai_max_tokens || 4000,
                    wrap_in_quotes: originalVersion.wrap_in_quotes || false,
                    names_behavior: originalVersion.names_behavior || 0,
                    
                    send_if_empty: originalVersion.send_if_empty || "",
                    impersonation_prompt: originalVersion.impersonation_prompt || "",
                    new_chat_prompt: originalVersion.new_chat_prompt || "",
                    new_group_chat_prompt: originalVersion.new_group_chat_prompt || "",
                    new_example_chat_prompt: originalVersion.new_example_chat_prompt || "",
                    continue_nudge_prompt: originalVersion.continue_nudge_prompt || "",
                    group_nudge_prompt: originalVersion.group_nudge_prompt || "",
                    
                    wi_format: originalVersion.wi_format || "{0}",
                    scenario_format: originalVersion.scenario_format || "{{scenario}}",
                    personality_format: originalVersion.personality_format || "{{personality}}",
                    
                    bias_preset_selected: originalVersion.bias_preset_selected || "Default (none)",
                    max_context_unlocked: originalVersion.max_context_unlocked !== false,
                    stream_openai: originalVersion.stream_openai !== false,
                    
                    // 🔑 深拷貝核心陣列
                    prompts: JSON.parse(JSON.stringify(originalVersion.prompts || [])),
                    prompt_order: JSON.parse(JSON.stringify(originalVersion.prompt_order || [])),
                    
                    // 進階設定
                    assistant_prefill: originalVersion.assistant_prefill || "",
                    claude_use_sysprompt: originalVersion.claude_use_sysprompt || false,
                    squash_system_messages: originalVersion.squash_system_messages || false,
                    show_thoughts: originalVersion.show_thoughts || false,
                    reasoning_effort: originalVersion.reasoning_effort || "medium",
                    enable_web_search: originalVersion.enable_web_search || false,
                    
                    // 深拷貝擴展
                    extensions: JSON.parse(JSON.stringify(originalVersion.extensions || {})),
                    
                    createdAt: TimestampManager.createTimestamp(),
                    updatedAt: TimestampManager.createTimestamp()
                };
        }
    }

    static getTypeDisplayName(type) {
        const keyMap = {
            character: 'character',
            worldbook: 'worldBook', 
            custom: 'customFields',
            userpersona: 'userPersona',
            loveydovey: 'loveydovey',
            preset: 'preset'
        };
        
        const key = keyMap[type] || 'item';
        return t(key);
    }

    static getDeleteConfirmMessage(type, itemName) {
        const keyMap = {
            character: 'deleteConfirm',
            worldbook: 'deleteWorldBookConfirm', 
            custom: 'deleteNotebookConfirm',
            userpersona: 'deleteUserPersonaConfirm',
            loveydovey: 'deleteLoveydoveyConfirm',
            preset: 'deletePresetConfirm'
        };
        
        const key = keyMap[type] || 'deleteConfirm';
        return t(key, itemName);
    }
}

class ItemCRUD {
static add(type) {
    const itemsArray = DataOperations.getItems(type);
    const newItem = DataOperations.createNewItem(type, itemsArray.length);
    const currentFolderId = NavigationManager.getCurrentFolderId();
    if (currentFolderId) {
        newItem.folderId = currentFolderId;
    }
    
    itemsArray.push(newItem);
    
    OverviewManager.invalidateCache();
    
    isHomePage = false;
    isListPage = false;
    ItemManager.setCurrentItem(type, newItem.id, newItem.versions[0].id);
    
    renderAll();
    updateMobileBreadcrumb();
    markAsChanged();
    return newItem;
}
    
static remove(type, itemId, silent = false) {
    const itemsArray = DataOperations.getItems(type);
    const item = itemsArray.find(i => i.id === itemId);
    
    if (!item) return false;

    const confirmDelete = silent || confirm(DataOperations.getDeleteConfirmMessage(type, item.name));
    
    if (confirmDelete) {
        const index = itemsArray.findIndex(i => i.id === itemId);
        if (index > -1) {
            itemsArray.splice(index, 1);
        }
        
        this.updateCurrentAfterDelete(type, itemId);
        
        if (!silent) {
            // 🔑 關鍵：檢查是否需要頁面導航
            const needsPageNavigation = this.checkIfNeedsPageNavigation(type, itemId);
            
            if (needsPageNavigation) {
                // 需要跳轉頁面時才進行導航
                this.navigateAfterDelete(type);
            } else {
                // 在總覽頁面時保持原有邏輯
                OverviewManager.onDataChange();
            }
            
            saveData();
        }
        return true;
    }
    
    return false;
}

// 🆕 新增：檢查是否需要頁面導航
static checkIfNeedsPageNavigation(type, itemId) {
    // 檢查當前是否在被刪除項目的詳細編輯頁面
    switch (type) {
        case 'character':
            return !isHomePage && !isListPage && currentMode === 'character' && currentCharacterId === itemId;
        case 'userpersona':
            return !isHomePage && !isListPage && currentMode === 'userpersona' && currentUserPersonaId === itemId;
        case 'loveydovey':
            return !isHomePage && !isListPage && currentMode === 'loveydovey' && currentLoveyDoveyId === itemId;
        case 'worldbook':
            return !isHomePage && !isListPage && currentMode === 'worldbook' && currentWorldBookId === itemId;
        case 'custom':
            return !isHomePage && !isListPage && currentMode === 'custom' && currentCustomSectionId === itemId;
        default:
            return false;
    }
}

// 🆕 新增：導航邏輯（與之前相同）
static navigateAfterDelete(type) {
    this.clearCurrentItemIds();
    
    switch (type) {
        case 'character':
            isHomePage = true;
            isListPage = false;
            currentMode = 'character';
            break;
        case 'userpersona':
            isHomePage = false;
            isListPage = false;
            currentMode = 'userpersona';
            break;
        case 'loveydovey':
            isHomePage = false;
            isListPage = false;
            currentMode = 'loveydovey';
            break;
        case 'worldbook':
        case 'custom':
            isHomePage = false;
            isListPage = true;
            listPageType = type;
            currentMode = type;
            break;
    }
    
    renderAll();
}

static clearCurrentItemIds() {
    currentCharacterId = null;
    currentVersionId = null;
    currentWorldBookId = null;
    currentWorldBookVersionId = null;
    currentCustomSectionId = null;
    currentCustomVersionId = null;
    currentUserPersonaId = null;
    currentUserPersonaVersionId = null;
    currentLoveyDoveyId = null;
    currentLoveyDoveyVersionId = null;
}
    
    static copy(type, itemId) {
        const itemsArray = DataOperations.getItems(type);
        const originalItem = itemsArray.find(i => i.id === itemId);
        
        if (!originalItem) return null;
        
        const newItem = this.cloneItem(originalItem, type);
        itemsArray.push(newItem);
        
        ItemManager.setCurrentItem(type, newItem.id, newItem.versions[0].id);
        
        renderAll();
        updateMobileBreadcrumb();
        markAsChanged();
        return newItem;
    }
    
    static cloneItem(originalItem, type) {
        const newItem = {
            id: generateId(),
            name: originalItem.name + t('copyPrefix'),
            isFavorite: false,
            folderId: originalItem.folderId || null,
            versions: originalItem.versions.map(version => {
                const clonedVersion = DataOperations.cloneVersion(version, type);
                clonedVersion.createdAt = TimestampManager.createTimestamp();
                clonedVersion.updatedAt = TimestampManager.createTimestamp();
                return clonedVersion;
            })
        };
        
        if (type === 'worldbook' && originalItem.description) {
            newItem.description = originalItem.description;
        }
        
        if (type === 'character' || type === 'loveydovey' || type === 'userpersona') {
            newItem.createdAt = TimestampManager.createTimestamp();
            newItem.updatedAt = TimestampManager.createTimestamp();
        }
        
        return newItem;
    }
    
static updateCurrentAfterDelete(type, deletedItemId) {
    const currentItemId = ItemManager.getCurrentItemId();
    
    if (currentItemId === deletedItemId) {
        this.resetToHomePage(type);
    }
}
    
static resetToHomePage(type) {
    switch (type) {
        case 'character':
            isHomePage = true;
            isListPage = false;
            currentMode = 'character';
            currentCharacterId = null;
            currentVersionId = null;
            break;
            
        case 'userpersona':
            isHomePage = false;
            isListPage = false;
            currentMode = 'userpersona';
            currentUserPersonaId = null;
            currentUserPersonaVersionId = null;
            break;
            
        case 'loveydovey':
            isHomePage = false;
            isListPage = false;
            currentMode = 'loveydovey';
            currentLoveyDoveyId = null;
            currentLoveyDoveyVersionId = null;
            break;
            
        case 'worldbook':
            isHomePage = false;
            isListPage = true;
            listPageType = 'worldbook';
            currentMode = 'worldbook';
            currentWorldBookId = null;
            currentWorldBookVersionId = null;
            break;
            
        case 'custom':
            isHomePage = false;
            isListPage = true;
            listPageType = 'custom';
            currentMode = 'custom';
            currentCustomSectionId = null;
            currentCustomVersionId = null;
            break;
    }
    
    renderAll();
}
}

class VersionCRUD {
    static add(type, itemId) {
        const item = DataOperations.getItems(type).find(i => i.id === itemId);
        if (!item) return null;
        
        const newVersion = DataOperations.createNewVersion(type, item.versions.length + 1);
        item.versions.push(newVersion);
        
        ItemManager.setCurrentItem(type, itemId, newVersion.id);
        
        renderAll();
        updateMobileBreadcrumb();
        markAsChanged();
        return newVersion;
    }
    
    static copy(type, itemId, versionId) {
        const item = DataOperations.getItems(type).find(i => i.id === itemId);
        if (!item) return null;
        
        const originalVersion = item.versions.find(v => v.id === versionId);
        if (!originalVersion) return null;
        
        const newVersion = DataOperations.cloneVersion(originalVersion, type);
        newVersion.name = originalVersion.name + t('copyPrefix');
        
        item.versions.push(newVersion);
        ItemManager.setCurrentItem(type, itemId, newVersion.id);
        
        renderAll();
        updateMobileBreadcrumb();
        markAsChanged();
        return newVersion;
    }
    
    static remove(type, itemId, versionId) {
        const item = DataOperations.getItems(type).find(i => i.id === itemId);
        if (!item || item.versions.length <= 1) {
            alert(t('keepOneVersion'));
            return false;
        }
        
        const version = item.versions.find(v => v.id === versionId);
        const confirmDelete = confirm(t('deleteVersionConfirm', version?.name || t('unnamedVersion')));
        
        if (confirmDelete) {
            const index = item.versions.findIndex(v => v.id === versionId);
            if (index > -1) {
                item.versions.splice(index, 1);
            }
            
            const currentVersionId = ItemManager.getCurrentVersionId();
            if (currentVersionId === versionId) {
                ItemManager.setCurrentItem(type, itemId, item.versions[0].id);
            }
            
            renderAll();
            saveData();
            return true;
        }
        
        return false;
    }
}


// ===== 7. 模態框管理器 =====
class ModalManager {
   static create(config) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'block';
    
    // 如果沒有 title 且有自定義內容，直接使用內容
    if (!config.title && config.content.includes('compact-modal-content')) {
        const content = `
            <div class="compact-modal-wrapper">
                ${config.content}
                ${config.footer ? config.footer : ''}
            </div>
        `;
        modal.innerHTML = content;
    } else {
        // 原有的樣式邏輯保持不變
        const content = `
            <div class="modal-content" style="max-width: ${config.maxWidth || '520px'};">
                <div class="modal-header">
                    <h3 class="modal-title">${config.title}</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                ${config.content}
                ${config.footer ? `<div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">${config.footer}</div>` : ''}
            </div>
        `;
        modal.innerHTML = content;
    }
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

 static clearDataConfirm() {
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: center;">
                ${IconManager.warning({width: 18, height: 18})}
                <h3 class="compact-modal-title">${t('clearDataWarning')}</h3>
            </div>
            
            <p class="compact-modal-desc" style="text-align: center;">
                ${t('clearDataCompleteDesc')}
            </p>

            <div class="compact-section list-style" style="text-align: center;">
                <div class="compact-section-title">${t('itemsToBeCleared')}</div>
                <div class="compact-list-items" style="text-align: left;">
                    <div class="compact-list-item">${t('allCharacterAndWorldBookData')}</div>
                    <div class="compact-list-item">${t('allPersonaAndLoveyDoveyData')}</div>
                    <div class="compact-list-item">${t('interfaceAndSettingsData')}</div>
                    <div class="compact-list-item">${t('localCacheData')}</div>
                </div>
            </div>

            <div class="compact-section backup-style" style="text-align: center;">
                <div class="compact-section-title">${t('suggestBackupFirst')}</div>
                <div class="compact-section-desc">${t('clickToExportBackup')}</div>
                <div style="display: flex; justify-content: center;">
                    <button class="overview-btn hover-primary" onclick="DataManager.exportAllFromModal()">
                        ${t('exportBeforeClear')}
                    </button>
                </div>
            </div>

            <div class="compact-modal-footer" style="justify-content: center;">
    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">
        ${t('cancelClear')}
    </button>
    <button class="overview-danger-btn" onclick="DataManager.showFinalConfirmation()">
        ${t('confirmClearData')}
    </button>
</div>
        </div>
    `;

    return this.create({
        title: '',
        content: content,
        footer: '',
        maxWidth: '480px'
    });
}

    static custom(config) {
        return this.create({
            title: config.title,
            content: config.content,
            footer: config.footer,
            maxWidth: config.maxWidth || '520px',
            className: config.className || ''
        });
    }
}


// ===== 11. 全螢幕編輯器 =====
class FullscreenEditor {
    static currentEditor = null;
    
    static open(textareaId, title = t('editText')) {
        const originalTextarea = document.getElementById(textareaId);
        if (!originalTextarea) return;
        
        if (this.currentEditor) {
            this.close();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-editor-overlay';
        
        const container = document.createElement('div');
        container.className = 'fullscreen-editor-container';
        
        const header = document.createElement('div');
        header.className = 'fullscreen-editor-header';
        header.innerHTML = `
            <h3 class="fullscreen-editor-title">${title}</h3>
            <div class="fullscreen-editor-stats" id="fullscreen-stats">
                0 ${t('chars')} / 0 tokens
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'fullscreen-editor-content';

        // 編輯器工具列
        const editorToolbar = document.createElement('div');
        editorToolbar.className = 'fullscreen-editor-toolbar';
        editorToolbar.innerHTML = `
            <div class="editor-toolbar-left">
                <button class="editor-toolbar-btn" onclick="FullscreenEditor.toggleSearchPanel()" title="${t('searchAndReplace')}" id="search-toggle-btn">
                    ${IconManager.search({ width: 16, height: 16 })}
                </button>
                <span class="toolbar-separator"></span>
                <button class="editor-toolbar-btn" onclick="FullscreenEditor.insertText('{{char}}')" title="${t('insertChar')}">
                    {{char}}
                </button>
                <button class="editor-toolbar-btn" onclick="FullscreenEditor.insertText('{{user}}')" title="${t('insertUser')}">
                    {{user}}
                </button>
            </div>
        `;

        // 搜尋取代面板（預設隱藏）
        const searchPanel = document.createElement('div');
        searchPanel.className = 'fullscreen-search-panel';
        searchPanel.id = 'fullscreen-search-panel';
        searchPanel.style.display = 'none';
        searchPanel.innerHTML = `
            <div class="search-panel-row">
                <div class="search-input-wrapper">
                    <input type="text" class="search-panel-input" id="fullscreen-search-input" placeholder="${t('searchTextPlaceholder')}">
                </div>
                <span class="search-match-count" id="search-match-count"></span>
                <button class="search-panel-btn" onclick="FullscreenEditor.findPrev()" title="${t('previousMatch')}">▲</button>
                <button class="search-panel-btn" onclick="FullscreenEditor.findNext()" title="${t('nextMatch')}">▼</button>
            </div>
            <div class="search-panel-row">
                <div class="search-input-wrapper">
                    <input type="text" class="search-panel-input" id="fullscreen-replace-input" placeholder="${t('replacePlaceholder')}">
                </div>
                <button class="search-panel-btn replace-btn" onclick="FullscreenEditor.replaceCurrent()">${t('replace')}</button>
                <button class="search-panel-btn replace-btn" onclick="FullscreenEditor.replaceAll()">${t('replaceAll')}</button>
            </div>
            <div class="search-panel-options">
                <label class="search-option-label">
                    <input type="checkbox" id="search-whole-word" onchange="FullscreenEditor.performSearch()">
                    <span>${t('wholeWord')}</span>
                </label>
            </div>
        `;

        const textarea = document.createElement('textarea');
        textarea.className = 'fullscreen-editor-textarea';
        textarea.id = 'fullscreen-textarea';
        textarea.placeholder = originalTextarea.placeholder;
        textarea.value = originalTextarea.value;

        content.appendChild(editorToolbar);
        content.appendChild(searchPanel);
        content.appendChild(textarea);

        const footer = document.createElement('div');
        footer.className = 'fullscreen-editor-footer';
        footer.innerHTML = `
            <button class="btn btn-secondary" onclick="FullscreenEditor.close()" style="padding: 6px 16px; font-size: 0.85em; min-height: auto;">${t('close')}</button>
        `;

        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(footer);
        overlay.appendChild(container);

        document.body.appendChild(overlay);

        // 設定搜尋工具列事件
        this.setupSearchEvents();

        // 檢測並緩存卿卿我我欄位的字數限制
        const loveyDoveyInfo = this.detectLoveyDoveyField(originalTextarea);

        this.currentEditor = {
            overlay: overlay,
            originalTextarea: originalTextarea,
            fullscreenTextarea: textarea,
            //  緩存卿卿我我欄位資訊
            isLoveyDoveyField: loveyDoveyInfo.isLoveyDovey,
            maxLength: loveyDoveyInfo.maxLength,
            fieldType: loveyDoveyInfo.isLoveyDovey ? 'loveydovey' : 'normal',
            // 搜尋取代狀態
            searchMatches: [],
            currentMatchIndex: -1
        };
        
        setTimeout(() => {
            this.currentEditor.fullscreenTextarea.focus();
            const textLength = this.currentEditor.fullscreenTextarea.value.length;
            this.currentEditor.fullscreenTextarea.setSelectionRange(textLength, textLength);
        }, 100);
        
        this.setupEventListeners();
        this.updateStats();
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        document.addEventListener('keydown', this.handleKeydown);
    }
    
    static setupEventListeners() {
        if (!this.currentEditor) return;
        
        const textarea = this.currentEditor.fullscreenTextarea;
        
textarea.addEventListener('input', () => {
    this.syncToOriginal();
    this.updateStats();
    // 如果有搜尋關鍵字，重新搜尋
    const searchInput = document.getElementById('fullscreen-search-input');
    if (searchInput?.value) {
        this.performSearch();
    }
    // 同時觸發主頁面統計更新（延遲，避免卡頓）
    setTimeout(() => {
        updateAllPageStats();
    }, 100);
});
    }
    
    static syncToOriginal() {
        if (!this.currentEditor) return;
        
        const newValue = this.currentEditor.fullscreenTextarea.value;
        const originalTextarea = this.currentEditor.originalTextarea;
        
        originalTextarea.value = newValue;
        
        const inputEvent = new Event('input', { bubbles: true });
        originalTextarea.dispatchEvent(inputEvent);
        
        if (originalTextarea.oninput) {
            originalTextarea.oninput.call(originalTextarea);
        }

    }
    
    static updateStats() {
    if (!this.currentEditor) return;
    
    const textarea = this.currentEditor.fullscreenTextarea;
    const statsElement = document.getElementById('fullscreen-stats');
    
    if (textarea && statsElement) {
        const text = textarea.value;
        const originalTextarea = this.currentEditor.originalTextarea;
        
        //  使用緩存的卿卿我我欄位資訊
if (this.currentEditor.isLoveyDoveyField) {
    const currentLength = text.length;
    const maxLength = this.currentEditor.maxLength;
    const isOverLimit = maxLength > 0 && currentLength > maxLength;
    
    // 更新統計文字
    if (maxLength > 0) {
        statsElement.textContent = `${currentLength} / ${maxLength} ${t('chars')}`;
    } else {
        statsElement.textContent = `${currentLength} ${t('chars')}`;
    }
    
    // 更新樣式（紅色警告）
    if (isOverLimit) {
        statsElement.style.color = '#e74c3c';
        statsElement.style.fontWeight = 'bold';
        textarea.style.borderColor = '#e74c3c';
        textarea.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
    } else {
        statsElement.style.color = 'var(--text-muted)';
        statsElement.style.fontWeight = 'normal';
        textarea.style.borderColor = 'var(--border-color)';
        textarea.style.boxShadow = 'none';
    }
    
} else {
    // 使用新的智能統計系統
    const stats = StatsManager.calculateTextStats(text);
    const { chars, tokens, isCalculating } = stats;
    
    const tokenDisplay = isCalculating ? `${tokens}* tokens` : `${tokens} tokens`;
    statsElement.textContent = `${chars} ${t('chars')} / ${tokenDisplay}`;
    
    // 重置樣式
    statsElement.style.color = 'var(--text-muted)';
    statsElement.style.fontWeight = 'normal';
    textarea.style.borderColor = 'var(--border-color)';
    textarea.style.boxShadow = 'none';
}
    }
}
    
    static close() {
        if (!this.currentEditor) return;
        
        this.syncToOriginal();
        document.removeEventListener('keydown', this.handleKeydown);
        this.currentEditor.overlay.remove();
        this.currentEditor = null;
    }
    
    static handleKeydown = (e) => {
        if (e.key === 'Escape') {
            // 如果搜尋框有內容，清除它；否則關閉全螢幕編輯器
            const searchInput = document.getElementById('fullscreen-search-input');
            if (searchInput && searchInput.value) {
                FullscreenEditor.clearSearch();
                FullscreenEditor.currentEditor?.fullscreenTextarea.focus();
            } else {
                FullscreenEditor.close();
            }
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();

            if (FullscreenEditor.currentEditor) {
                FullscreenEditor.syncToOriginal();
            }

            saveData();
        } else if (e.ctrlKey && (e.key === 'f' || e.key === 'h')) {
            // Ctrl+F 或 Ctrl+H 切換搜尋面板
            e.preventDefault();
            const searchPanel = document.getElementById('fullscreen-search-panel');
            if (searchPanel && searchPanel.style.display === 'none') {
                FullscreenEditor.toggleSearchPanel();
            } else {
                // 如果已開啟，聚焦到搜尋框
                const searchInput = document.getElementById('fullscreen-search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        }
    }

    // 檢測卿卿我我欄位並獲取字數限制
static detectLoveyDoveyField(originalTextarea) {
    // 檢查是否為卿卿我我欄位
    const isLoveyDoveyMode = currentMode === 'loveydovey' || 
                            originalTextarea.closest('.loveydovey-mode');
    
    if (!isLoveyDoveyMode) {
        return { isLoveyDovey: false, maxLength: 0 };
    }
    
    let maxLength = 0;
    let countElement = null;
    
    // 🔧 特殊處理：附加資訊欄位
    if (originalTextarea.id.includes('additionalContent-') || originalTextarea.id.includes('additionalTitle-')) {
        // 附加資訊欄位：查找 .char-count-display
        countElement = document.querySelector(`[data-target="${originalTextarea.id}"]`);
        
        if (countElement) {
            const countText = countElement.textContent;
            // 解析 "0/500" 格式
            const match = countText.match(/(\d+)\/(\d+)/);
            if (match) {
                maxLength = parseInt(match[2]);
            }
        }
    } else {
    // 普通卿卿我我欄位：查找 .loveydovey-char-count
    const labelElement = originalTextarea.previousElementSibling;
    countElement = labelElement?.querySelector('.loveydovey-char-count');
    
    if (countElement) {
        const countText = countElement.textContent;
        let match = countText.match(/\/\s*(\d+)\s*字/);
        if (match) {
            maxLength = parseInt(match[1]);
        } else {
            // 嘗試 "0/500" 格式
            match = countText.match(/(\d+)\/(\d+)/);
            if (match) {
                maxLength = parseInt(match[2]);
            }
        }
    }
}
    
    // 備援策略：使用 data-target 通用查找
    if (!countElement) {
        countElement = document.querySelector(`[data-target="${originalTextarea.id}"]`);
        if (countElement) {
            const countText = countElement.textContent;
            // 嘗試兩種格式
            let match = countText.match(/\/\s*(\d+)\s*字/);
            if (!match) {
                match = countText.match(/(\d+)\/(\d+)/); 
                if (match) {
                    maxLength = parseInt(match[2]);
                }
            } else {
                maxLength = parseInt(match[1]);
            }
        }
    }

    return { isLoveyDovey: true, maxLength: maxLength };
}

    // ===== 搜尋取代功能 =====
    static setupSearchEvents() {
        const searchInput = document.getElementById('fullscreen-search-input');
        const replaceInput = document.getElementById('fullscreen-replace-input');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.performSearch());
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.findPrev();
                    } else {
                        this.findNext();
                    }
                } else if (e.key === 'Escape') {
                    e.stopPropagation(); // 防止觸發全域 Escape
                    this.clearSearch();
                    this.currentEditor?.fullscreenTextarea.focus();
                }
            });
        }

        if (replaceInput) {
            replaceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.replaceCurrent();
                } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    this.clearSearch();
                    this.currentEditor?.fullscreenTextarea.focus();
                }
            });
        }
    }

    static clearSearch() {
        const searchInput = document.getElementById('fullscreen-search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        if (this.currentEditor) {
            this.currentEditor.searchMatches = [];
            this.currentEditor.currentMatchIndex = -1;
        }

        this.updateMatchCount();
    }

    static performSearch() {
        if (!this.currentEditor) return;

        const searchInput = document.getElementById('fullscreen-search-input');
        const wholeWordCheckbox = document.getElementById('search-whole-word');
        const searchText = searchInput?.value || '';
        const wholeWord = wholeWordCheckbox?.checked || false;
        const textarea = this.currentEditor.fullscreenTextarea;
        const content = textarea.value;

        this.currentEditor.searchMatches = [];
        this.currentEditor.currentMatchIndex = -1;

        if (searchText.length === 0) {
            this.updateMatchCount();
            return;
        }

        // 找出所有匹配位置（不區分大小寫）
        const searchLower = searchText.toLowerCase();
        const contentLower = content.toLowerCase();
        let pos = 0;

        // 判斷字元是否為單字邊界（非字母數字）
        const isWordBoundary = (char) => {
            if (!char) return true; // 字串開頭或結尾
            return !/[a-zA-Z0-9\u4e00-\u9fff]/.test(char);
        };

        while (pos < contentLower.length) {
            const index = contentLower.indexOf(searchLower, pos);
            if (index === -1) break;

            // 如果啟用全字匹配，檢查前後是否為單字邊界
            if (wholeWord) {
                const charBefore = content[index - 1];
                const charAfter = content[index + searchText.length];

                if (!isWordBoundary(charBefore) || !isWordBoundary(charAfter)) {
                    pos = index + 1;
                    continue; // 跳過非完整單字的匹配
                }
            }

            this.currentEditor.searchMatches.push({
                start: index,
                end: index + searchText.length
            });
            pos = index + 1;
        }

        // 設定索引到第一個匹配（但不跳轉，讓用戶繼續輸入）
        if (this.currentEditor.searchMatches.length > 0) {
            this.currentEditor.currentMatchIndex = 0;
        }

        this.updateMatchCount();
    }

    static findNext() {
        if (!this.currentEditor || this.currentEditor.searchMatches.length === 0) return;

        let nextIndex = this.currentEditor.currentMatchIndex + 1;
        if (nextIndex >= this.currentEditor.searchMatches.length) {
            nextIndex = 0; // 循環到開頭
        }

        this.currentEditor.currentMatchIndex = nextIndex;
        this.highlightMatch(nextIndex);
        this.updateMatchCount();
    }

    static findPrev() {
        if (!this.currentEditor || this.currentEditor.searchMatches.length === 0) return;

        let prevIndex = this.currentEditor.currentMatchIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.currentEditor.searchMatches.length - 1; // 循環到結尾
        }

        this.currentEditor.currentMatchIndex = prevIndex;
        this.highlightMatch(prevIndex);
        this.updateMatchCount();
    }

    static highlightMatch(index) {
        if (!this.currentEditor || index < 0 || index >= this.currentEditor.searchMatches.length) return;

        const match = this.currentEditor.searchMatches[index];
        const textarea = this.currentEditor.fullscreenTextarea;

        // 先設定選取範圍，再 focus（這樣選取會被保留）
        textarea.setSelectionRange(match.start, match.end);
        textarea.focus();

        // 捲動到選取位置
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const textBeforeMatch = textarea.value.substring(0, match.start);
        const lineNumber = textBeforeMatch.split('\n').length;
        const scrollPosition = (lineNumber - 3) * lineHeight;
        textarea.scrollTop = Math.max(0, scrollPosition);
    }

    static toggleSearchPanel() {
        const searchPanel = document.getElementById('fullscreen-search-panel');
        const searchBtn = document.getElementById('search-toggle-btn');
        if (searchPanel) {
            const isVisible = searchPanel.style.display !== 'none';
            searchPanel.style.display = isVisible ? 'none' : 'block';

            // 更新按鈕狀態
            if (searchBtn) {
                searchBtn.classList.toggle('active', !isVisible);
            }

            // 如果展開，自動聚焦到搜尋框
            if (!isVisible) {
                setTimeout(() => {
                    const searchInput = document.getElementById('fullscreen-search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 50);
            } else {
                // 收起時清除搜尋
                this.clearSearch();
            }
        }
    }

    static insertText(text) {
        if (!this.currentEditor) return;

        const textarea = this.currentEditor.fullscreenTextarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        textarea.value = before + text + after;

        // 設定游標位置到插入文字之後
        const newCursorPos = start + text.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();

        // 同步到原始欄位
        this.syncToOriginal();
        this.updateStats();
    }

    static updateMatchCount() {
        const countElement = document.getElementById('search-match-count');
        if (!countElement) return;

        if (!this.currentEditor || this.currentEditor.searchMatches.length === 0) {
            const searchInput = document.getElementById('fullscreen-search-input');
            if (searchInput?.value) {
                countElement.textContent = t('noMatches');
                countElement.style.color = 'var(--danger-color)';
            } else {
                countElement.textContent = '';
            }
        } else {
            const current = this.currentEditor.currentMatchIndex + 1;
            const total = this.currentEditor.searchMatches.length;
            countElement.textContent = `${current} / ${total}`;
            countElement.style.color = 'var(--text-muted)';
        }
    }

    static replaceCurrent() {
        if (!this.currentEditor || this.currentEditor.searchMatches.length === 0) return;
        if (this.currentEditor.currentMatchIndex < 0) return;

        const replaceInput = document.getElementById('fullscreen-replace-input');
        const replaceText = replaceInput?.value || '';
        const textarea = this.currentEditor.fullscreenTextarea;
        const match = this.currentEditor.searchMatches[this.currentEditor.currentMatchIndex];

        const before = textarea.value.substring(0, match.start);
        const after = textarea.value.substring(match.end);
        textarea.value = before + replaceText + after;

        // 同步到原始欄位
        this.syncToOriginal();
        this.updateStats();

        // 重新搜尋並定位到下一個
        this.performSearch();

        // 如果還有匹配，跳到當前位置（因為索引可能變了）
        if (this.currentEditor.searchMatches.length > 0) {
            const newIndex = Math.min(this.currentEditor.currentMatchIndex, this.currentEditor.searchMatches.length - 1);
            this.currentEditor.currentMatchIndex = newIndex;
            this.highlightMatch(newIndex);
        }
    }

    static replaceAll() {
        if (!this.currentEditor) return;

        const searchInput = document.getElementById('fullscreen-search-input');
        const replaceInput = document.getElementById('fullscreen-replace-input');
        const wholeWordCheckbox = document.getElementById('search-whole-word');
        const searchText = searchInput?.value || '';
        const replaceText = replaceInput?.value || '';
        const wholeWord = wholeWordCheckbox?.checked || false;

        if (!searchText) return;

        const textarea = this.currentEditor.fullscreenTextarea;
        const originalLength = this.currentEditor.searchMatches.length;

        // 使用正則表達式進行全部取代（不區分大小寫）
        const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 如果啟用全字匹配，使用單字邊界
        const pattern = wholeWord ? `\\b${escapedSearch}\\b` : escapedSearch;
        const regex = new RegExp(pattern, 'gi');
        textarea.value = textarea.value.replace(regex, replaceText);

        // 同步到原始欄位
        this.syncToOriginal();
        this.updateStats();

        // 重新搜尋（應該沒有匹配了）
        this.performSearch();

        // 顯示取代結果
        if (originalLength > 0) {
            const countElement = document.getElementById('search-match-count');
            if (countElement) {
                countElement.textContent = t('replacedCount', originalLength);
                countElement.style.color = 'var(--success-color)';
            }
        }
    }
}

// ===== 12. 通知管理器 =====
class NotificationManager {
    static show(config) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.type === 'success' ? 'var(--success-color)' : 
                        config.type === 'warning' ? 'var(--warning-color)' :
                        config.type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
            color: white;
            padding: ${config.large ? '16px 24px' : '12px 20px'};
            border-radius: ${config.large ? '8px' : '6px'};
            font-size: 0.9em;
            font-weight: 500;
            z-index: 99999;
            box-shadow: var(--shadow-medium);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: ${config.maxWidth || '300px'};
        `;
        
        notification.innerHTML = config.content;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, config.duration || 2000);
        
        return notification;
    }
    
    static success(message, duration = 2000) {
            return this.show({
                content: `${IconManager.success({ width: 16, height: 16, style: 'margin-right: 8px; vertical-align: text-bottom;' })} ${message}`,
                type: 'success',
                duration
            });
    }
    
    static warning(message, duration = 4000) {
            return this.show({
                content: `${IconManager.warning({ width: 16, height: 16, style: 'margin-right: 8px; vertical-align: text-bottom;' })} ${message}`,
                type: 'warning',
                duration
            });
        }
    
    static error(message, duration = 4000) {
            return this.show({
                content: `${IconManager.error({ width: 16, height: 16, style: 'margin-right: 8px; vertical-align: text-bottom;' })} ${message}`,
                type: 'error',
                duration
            });
        }

    static info(message, duration = 2000) {
            return this.show({
                content: `${IconManager.info({ width: 16, height: 16, style: 'margin-right: 8px; vertical-align: text-bottom;' })} ${message}`,
                type: 'info',
                duration
            });
        }

    static confirm(message) {
            return confirm(`❓ ${message}`);
        }
        
    static confirmWithOptions(message, confirmText = t('confirm'), cancelText = t('cancel')) {
             return confirm(`❓ ${message}\n\n${t('clickConfirm')}${confirmText}\n${t('clickCancel')}${cancelText}`);
        }
}

// ===== 13. 滾動條管理器 =====
class ScrollbarManager {
    static applyTo(element, type = 'custom') {
        if (!element) return;
        
        element.classList.remove('custom-scrollbar', 'hidden-scrollbar', 'thin-scrollbar', 'main-scrollbar');
        
        switch (type) {
            case 'hidden':
                element.classList.add('hidden-scrollbar');
                break;
            case 'thin':
                element.classList.add('thin-scrollbar');
                break;
            case 'main':
                element.classList.add('main-scrollbar');
                break;
            case 'custom':
            default:
                element.classList.add('custom-scrollbar');
                break;
        }
    }
    
    static applyToAll(selector, type = 'custom') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => this.applyTo(element, type));
    }
    
    static initializeAll() {
        this.applyTo(document.getElementById('sidebar'), 'hidden');
        this.applyTo(document.getElementById('contentArea'), 'main');
        this.applyToAll('textarea.field-input', 'thin');
        this.applyToAll('.scrollable', 'custom');
    }
    
    static updateColors(colors) {
        const root = document.documentElement;
        if (colors.scrollbarThumb) {
            root.style.setProperty('--scrollbar-thumb-color', colors.scrollbarThumb);
        }
        if (colors.scrollbarThumbHover) {
            root.style.setProperty('--scrollbar-thumb-hover-color', colors.scrollbarThumbHover);
        }
    }
}

// 列表項目選擇（與角色卡使用相同邏輯）
function toggleListItemSelection(itemId) {
    toggleItemSelection(itemId);
}

// 更新列表項目視覺狀態
function updateListItemVisualState(itemId) {
    let listItem;
    if (itemId.startsWith('folder-')) {
        const realFolderId = itemId.replace('folder-', '');
        // 🔧 使用多重查詢確保找到元素
        listItem = document.querySelector(`[data-folder-id="${realFolderId}"]`) ||
                   document.getElementById(`folder-list-item-${realFolderId}`) ||
                   document.getElementById(`list-item-folder-${realFolderId}`);
    } else {
        listItem = document.getElementById(`list-item-${itemId}`);
    }
    
    if (!listItem) {
        console.warn('找不到列表項目:', itemId);
        return;
    }
    
    const isSelected = selectedItems.includes(itemId);
    const checkbox = listItem.querySelector('.list-selection-checkbox');
    const nameElement = listItem.querySelector('.list-item-name');
    
    if (checkbox) {
        checkbox.checked = isSelected;
    }
    
    if (nameElement) {
        if (isSelected) {
            nameElement.style.color = '#66b3ff';
            nameElement.style.fontWeight = '600';
        } else {
            nameElement.style.color = 'var(--text-color)';
            nameElement.style.fontWeight = nameElement.classList.contains('folder-name') ? '600' : '500';
        }
    }
    
    const overlay = listItem.querySelector('.selection-overlay');
    if (overlay) {
        overlay.style.display = isSelected ? 'block' : 'none';
    }
    
    // 更新邊框和背景
    if (isSelected) {
        listItem.style.borderColor = '#66b3ff';
        listItem.style.backgroundColor = 'rgba(92, 193, 255, 0.15)';
    } else {
        listItem.style.borderColor = 'var(--border-color)';
        listItem.style.backgroundColor = 'var(--surface-color)';
    }
}

// ===== 15. 版本選擇器 =====
class VersionSelector {
    static selectedVersions = [];
    static currentModal = null;
    static maxSelections = 2;
    
    static create(config) {
        const { title, description, versions, onConfirm, maxSelections = 2 } = config;
        
        this.selectedVersions = [];
        this.maxSelections = maxSelections;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const versionCheckboxes = versions.map(version => `
            <div class="version-checkbox" data-version-id="${version.id}" onclick="VersionSelector.toggleSelection('${version.id}')">
                <input type="checkbox" id="check-${version.id}" style="pointer-events: none;">
                <label for="check-${version.id}" style="pointer-events: none; cursor: pointer;">${version.name}</label>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="close-modal" onclick="VersionSelector.close()">×</button>
                </div>
                
                <p style="margin-bottom: 16px; color: var(--text-muted); font-size: 0.9em;">
                    ${description}
                    (<span style="color: var(--text-color); font-weight: 500;">${t('currentSelected')}: <span id="selected-count">0</span>/${maxSelections}</span>)
                </p>
                
                <div class="version-checkboxes">
                    ${versionCheckboxes}
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                    <button class="btn btn-secondary" onclick="VersionSelector.close()">${t('cancel')}</button>
                    <button class="btn btn-primary" onclick="VersionSelector.confirm()" id="apply-compare" disabled>${t('startCompare')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = modal;
        this.onConfirm = onConfirm;
        
        this.updateUI();
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        
        return modal;
    }
    
    static toggleSelection(versionId) {
        const checkbox = document.getElementById(`check-${versionId}`);
        const container = document.querySelector(`[data-version-id="${versionId}"]`);
        
        if (!checkbox || !container) return;
        
        if (this.selectedVersions.includes(versionId)) {
            checkbox.checked = false;
            container.classList.remove('selected');
            this.selectedVersions = this.selectedVersions.filter(id => id !== versionId);
        } else {
            if (this.selectedVersions.length < this.maxSelections) {
                checkbox.checked = true;
                container.classList.add('selected');
                this.selectedVersions.push(versionId);
            } else {
                return;
            }
        }
        
        this.updateUI();
    }
    
    static updateUI() {
        const countElement = document.getElementById('selected-count');
        const applyButton = document.getElementById('apply-compare');
        
        if (countElement) {
            countElement.textContent = this.selectedVersions.length;
        }
        
        if (applyButton) {
            const shouldEnable = this.selectedVersions.length === this.maxSelections;
            applyButton.disabled = !shouldEnable;
            
            if (this.selectedVersions.length === 0) {
                applyButton.textContent = t('startCompare');
            } else if (this.selectedVersions.length < this.maxSelections) {
                applyButton.textContent = t('needOneMore');
            } else {
                applyButton.textContent = t('startCompare');
            }
        }
        
        const allVersionBoxes = document.querySelectorAll('.version-checkbox');
        allVersionBoxes.forEach(box => {
            const versionId = box.dataset.versionId;
            const isSelected = this.selectedVersions.includes(versionId);
            const checkbox = box.querySelector('input[type="checkbox"]');
            const label = box.querySelector('label');
            
            if (checkbox) {
                checkbox.checked = isSelected;
            }
            
            if (isSelected) {
                box.classList.add('selected');
            } else {
                box.classList.remove('selected');
            }
            
            if (this.selectedVersions.length >= this.maxSelections && !isSelected) {
                box.style.opacity = '0.4';
                box.style.pointerEvents = 'none';
                if (checkbox) checkbox.disabled = true;
                if (label) label.style.color = 'var(--text-muted)';
            } else {
                box.style.opacity = '1';
                box.style.pointerEvents = 'auto';
                if (checkbox) checkbox.disabled = false;
                if (label) label.style.color = '';
            }
        });
    }
    
    static confirm() {
        if (this.selectedVersions.length >= this.maxSelections && this.onConfirm) {
            this.onConfirm(this.selectedVersions);
            this.close();
        }
    }
    
    static close() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
        this.selectedVersions = [];
        this.onConfirm = null;
    }

    static showForCurrentMode() {
    let currentItem, versionsArray;
    
    if (currentMode === 'character') {
        currentItem = characters.find(c => c.id === currentCharacterId);
    } else if (currentMode === 'userpersona') { 
        currentItem = userPersonas.find(up => up.id === currentUserPersonaId);
    } else if (currentMode === 'worldbook') {
        currentItem = worldBooks.find(wb => wb.id === currentWorldBookId);
    } else if (currentMode === 'custom') {
        currentItem = customSections.find(s => s.id === currentCustomSectionId);
    } else if (currentMode === 'loveydovey') {
        currentItem = loveyDoveyCharacters.find(c => c.id === currentLoveyDoveyId);
    }
    
    if (!currentItem) return false;
    
    versionsArray = currentItem.versions || [];
    
    if (versionsArray.length <= 1) {
        alert(t('needTwoVersions'));
        return false;
    }
    
    compareVersions = [];
    
    this.create({
        title: t('selectVersionsToCompare'),
        description: t('selectTwoVersions'),
        versions: versionsArray,
        maxSelections: 2,
        onConfirm: (selectedVersions) => {
            compareVersions = selectedVersions;
            viewMode = 'compare';
            renderAll();
        }
    });
    
    return true;
}
}

// ===== 16. UI 工具管理器 =====
class UIUtils {
    static createFieldGroup(config) {
        const hasStats = config.showStats !== false;
        const hasFullscreen = config.showFullscreen !== false;
        
        return `
            <div class="field-group" style="margin-bottom: ${config.marginBottom || '12px'};">
                <label class="field-label">
                    ${config.label}
                    ${hasStats ? `<span class="field-stats" data-target="${config.id}" style="margin-left: 12px; font-size: 0.85em; color: var(--text-muted);">0 ${t('chars')} / 0 ${t('tokens')}</span>` : ''}
                    ${hasFullscreen && config.type === 'textarea' ? `<button class="fullscreen-btn" onclick="openFullscreenEditor('${config.id}', '${config.label}')" title="${t('fullscreenEdit')}" style="margin-left: 8px;">⛶</button>` : ''}
                </label>
                ${this.createInput(config)}
            </div>
        `;
    }
    
static createInput(config) {
    if (config.type === 'textarea') {
        return `<textarea class="field-input ${config.scrollable ? 'scrollable' : ''}" 
                         id="${config.id}" 
                         placeholder="${config.placeholder || ''}"
                         style="${config.style || 'min-height: 200px; max-height: 70vh; resize: vertical;'}"
                         ${config.onChange ? `oninput="${config.onChange}"` : ''}>${config.value || ''}</textarea>`;
    } else {
        return `<input type="${config.type || 'text'}" 
                       class="field-input ${config.compact ? 'compact-input' : ''}" 
                       id="${config.id}"
                       placeholder="${config.placeholder || ''}"
                       value="${config.value || ''}"
                       ${config.min !== undefined ? `min="${config.min}"` : ''}
                       ${config.max !== undefined ? `max="${config.max}"` : ''}
                       ${config.onChange ? `onchange="${config.onChange}"` : ''}
                       ${config.style ? `style="${config.style}"` : ''}>`;
    }
}
    
    static createButtonGroup(buttons, options = {}) {
        const { gap = '8px', justify = 'flex-end', wrap = false } = options;
        
        const buttonHTML = buttons.map(btn => {
            const classes = ['btn', btn.type || 'btn-secondary', btn.size || ''].filter(Boolean).join(' ');
            return `<button class="${classes}" 
                            onclick="${btn.onClick}" 
                            ${btn.title ? `title="${btn.title}"` : ''}
                            ${btn.disabled ? 'disabled' : ''}
                            ${btn.style ? `style="${btn.style}"` : ''}>
                        ${btn.text}
                    </button>`;
        }).join('');
        
        return `
            <div style="display: flex; gap: ${gap}; justify-content: ${justify}; ${wrap ? 'flex-wrap: wrap;' : ''}">
                ${buttonHTML}
            </div>
        `;
    }

    static createTableHeader(columns) {
        const columnHTML = columns.map(col => 
            `<div style="${col.style || ''}">${col.title}</div>`
        ).join('');
        
        return `
            <div class="entry-header-labels" style="display: grid; grid-template-columns: ${columns.map(c => c.width).join(' ')}; gap: 8px; margin-bottom: 8px; padding: 0 12px; font-size: 0.75em; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; align-items: center;">
                ${columnHTML}
            </div>
        `;
    }
}

// ===== 17. 版本管理工具 =====
class VersionUtils {
    static getVersionIcon(version, type) {
        switch (type) {
            case 'character':
                return version.avatar ? 
                    `<img src="${BlobManager.getBlobUrl(version.avatar)}" alt="Avatar" style="width: 25px; height: 25px; border-radius: 3px; object-fit: cover; object-position: center;">` : 
                    '';
            case 'worldbook':
            case 'custom':
            default:
                return '';
        }
    }
    
    static generateUniqueVersionName(item, baseName) {
        const existingNames = item.versions.map(v => v.name);
        let counter = 1;
        let finalName = baseName;
        
        while (existingNames.includes(finalName)) {
            finalName = `${baseName} (${counter})`;
            counter++;
        }
        
        return finalName;
    }
}

// ===== 18. 事件處理和狀態管理函數 =====
function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButtonStates();
}

function markAsSaved() {
    hasUnsavedChanges = false;
    lastSavedData = JSON.stringify(characters);
    updateSaveButtonStates();
}


function updateSaveButtonStates() {
    setTimeout(() => {
        // 原有的按鈕選擇器
        const saveButtons = document.querySelectorAll('button[onclick*="saveData()"]');
        // 側邊欄展開時的儲存區域選擇器
        const sidebarSaveAreas = document.querySelectorAll('.sidebar-section-header[onclick*="saveData()"]');
        
        // 遍歷所有找到的儲存按鈕
        saveButtons.forEach(btn => {
            // 【關鍵修正】檢查這個按鈕是否為側邊欄收合時的圖示按鈕
            if (btn.classList.contains('collapsed-icon-btn')) {
                // 如果是，我們只更新它的狀態 class，並確保內容永遠是 SVG 圖示
                if (hasUnsavedChanges) {
                    btn.classList.add('unsaved-changes');
                    btn.classList.remove('saved-state');
                } else {
                    btn.classList.remove('unsaved-changes');
                    btn.classList.add('saved-state');
                }
                // 無論如何都重新繪製 SVG 圖示，防止它被意外清除
                btn.innerHTML = IconManager.save({width: 16, height: 16});
            } else {
                // 如果是其他的儲存按鈕（非收合圖示），則維持原有的文字替換邏輯
                if (hasUnsavedChanges) {
                    btn.classList.add('unsaved-changes');
                    btn.classList.remove('saved-state');
                    btn.innerHTML = t('unsavedChanges');
                } else {
                    btn.classList.remove('unsaved-changes');
                    btn.classList.add('saved-state');
                    btn.innerHTML = t('saveData');
                }
            }
        });
        
        // 這部分處理側邊欄展開時的按鈕，邏輯原本就是正確的，予以保留
        sidebarSaveAreas.forEach(area => {
            if (hasUnsavedChanges) {
                area.classList.add('unsaved-changes');
                area.classList.remove('saved-state');
                area.innerHTML = `
                    ${IconManager.save({width: 14, height: 14, style: 'color: var(--text-muted); flex-shrink: 0;'})}
                    <span class="sidebar-section-title" style="margin-left: 0;">${t('unsavedChanges')}</span>
                `;
            } else {
                area.classList.remove('unsaved-changes');
                area.classList.add('saved-state');
                area.innerHTML = `
                    ${IconManager.save({width: 14, height: 14, style: 'color: var(--text-muted); flex-shrink: 0;'})}
                    <span class="sidebar-section-title" style="margin-left: 0;">${t('saveData')}</span>
                `;
            }
        });
    }, 50);
}


function autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    // 恢復儲存的高度
    const fieldName = textarea.id.split('-')[0];
    const currentItem = ItemManager.getCurrentItem();
    const currentVersionId = ItemManager.getCurrentVersionId();
    
    if (currentItem && currentVersionId) {
        const storageKey = `textarea-height-${currentItem.id}-${currentVersionId}-${fieldName}`;
        const savedHeight = localStorage.getItem(storageKey);
        
        if (savedHeight) {
            textarea.style.height = savedHeight + 'px';
        } else {
            // 沒有儲存高度時，使用統一的初始高度 200px
            textarea.style.height = '200px';
        }
    } else {
        // 如果無法確定項目信息，使用初始高度
        textarea.style.height = '200px';
    }
    
    // 確保樣式正確
    textarea.style.maxHeight = '70vh';
    textarea.style.resize = 'vertical';
    textarea.style.overflowY = 'auto';
}

function initAutoResize() {
    //  新邏輯：直接調用 OtherSettings 的統一管理
    if (typeof OtherSettings !== 'undefined') {
        OtherSettings.initializeTextareaHeights();
    } else {
        // 降級方案：手動處理
        const textareas = document.querySelectorAll('textarea.field-input');
        textareas.forEach(textarea => {
            autoResizeTextarea(textarea);
            
            // 綁定高度變化事件
            let startHeight = null;

            textarea._mousedownHandler = function() {
                startHeight = this.offsetHeight;
            };
            textarea.addEventListener('mousedown', textarea._mousedownHandler);

            textarea._mouseupHandler = function() {
                const height = this.offsetHeight;
                
                if (startHeight !== null && Math.abs(height - startHeight) > 5) {
                    const fieldName = this.id.split('-')[0];
                    const currentItem = ItemManager.getCurrentItem();
                    const currentVersionId = ItemManager.getCurrentVersionId();
                    
                    if (currentItem && currentVersionId) {
                        const storageKey = `textarea-height-${currentItem.id}-${currentVersionId}-${fieldName}`;
                        localStorage.setItem(storageKey, height);
                    }
                }
                
                startHeight = null;
            };
            textarea.addEventListener('mouseup', textarea._mouseupHandler);
        });
    }
}



// ===== 事件監聽器設置 =====
// 防止重複綁定的標記
let keyboardShortcutsInitialized = false;

function setupKeyboardShortcuts() {
    if (keyboardShortcutsInitialized) {
        return;
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveButton = document.querySelector('button[onclick*="saveData()"]') || 
                             document.querySelector('.sidebar-section-header[onclick*="saveData()"]');
            
            if (saveButton) {
                saveButton.click();
            } else {
                saveData();
            }
        }
    });
    
    keyboardShortcutsInitialized = true;
    
}

// 瀏覽器關閉警告
function setupBrowserCloseWarning() {
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            // 現代瀏覽器會顯示預設的警告訊息
            e.preventDefault();
            e.returnValue = t('unsavedWarning');
            return t('unsavedWarning');
        }
    });
}

// ===== 19. 側邊欄和導航函數 =====
// 側邊欄篩選邏輯
function getFilteredItemsForSidebar(items, type, currentItemId) {
    return items.filter(item => {
        // 向後兼容處理
        if (item.isFavorite === undefined) {
            item.isFavorite = false;
        }
        
        // 顯示最愛項目 或 當前編輯的項目
        return item.isFavorite || item.id === currentItemId;
    });
}

function toggleSection(sectionName) {
    const content = document.getElementById(`${sectionName}-content`);
    const icon = document.getElementById(`${sectionName}-icon`);
    const header = icon?.closest('.sidebar-section-header');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        if (header) header.classList.add('expanded');
    } else {
        content.classList.add('collapsed');
        if (header) header.classList.remove('expanded');
    }
}

function toggleItemVersions(type, itemId) {
    const isCurrentItem = (currentMode === type && ItemManager.getCurrentItemId() === itemId);

    if (!isCurrentItem) {
        // ✨ 新增：在切換到新角色前，先摺疊所有其他角色的版本列表
        collapseAllOtherItemVersions(type, itemId);
        
        const itemsArray = DataOperations.getItems(type);
        const item = itemsArray.find(i => i.id === itemId);
        const firstVersionId = item?.versions?.[0]?.id;
        
        selectSidebarItem(type, itemId, firstVersionId);
        
        setTimeout(() => {
            const versionsList = document.getElementById(`${type}-versions-${itemId}`);
            
            if (versionsList) {
                versionsList.classList.add('expanded');
                
                setTimeout(() => {
                    // 🚫 手機版不啟用版本拖曳
                    if (window.innerWidth > 768) {
                        DragSortManager.enableVersionDragSort(type, itemId);
                    }
                }, 50);
            }
        }, 100);
        
        return;
    }
    
    const versionsList = document.getElementById(`${type}-versions-${itemId}`);
    
    if (!versionsList) return;
    
    const isCurrentlyExpanded = versionsList.classList.contains('expanded');
    
    if (isCurrentlyExpanded) {
        versionsList.classList.remove('expanded');
    
        const containerSelector = `#${type}-versions-${itemId}`;
        DragSortManager.destroySortable(containerSelector);
    } else {
        collapseAllOtherItemVersions(type, itemId);
        versionsList.classList.add('expanded');
        
        setTimeout(() => {
            // 🚫 手機版不啟用版本拖曳
            if (window.innerWidth > 768) {
                DragSortManager.enableVersionDragSort(type, itemId);
            }
        }, 50);
    }
}

// 摺疊所有其他角色的版本列表
function collapseAllOtherItemVersions(excludeType, excludeItemId) {
    const allTypes = ['character', 'loveydovey', 'userpersona', 'worldbook', 'custom'];
    
    allTypes.forEach(type => {
        const itemsArray = DataOperations.getItems(type);
        
        itemsArray.forEach(item => {
            // 跳過當前要展開的項目
            if (type === excludeType && item.id === excludeItemId) {
                return;
            }
            
            const versionsList = document.getElementById(`${type}-versions-${item.id}`);
            if (versionsList && versionsList.classList.contains('expanded')) {
                versionsList.classList.remove('expanded');
                
                // 同時移除拖曳功能
                const containerSelector = `#${type}-versions-${item.id}`;
                if (typeof DragSortManager !== 'undefined') {
                    DragSortManager.destroySortable(containerSelector);
                }
            }
        });
    });
}

// 滾動到選中的版本項目
function scrollToSelectedVersion(type, itemId, versionId) {
    if (!versionId) return;
    
    
    
    // 找到選中的版本元素
    const selectedVersion = document.querySelector(
        `[data-action="selectSidebarItem"][data-type="${type}"][data-item-id="${itemId}"][data-version-id="${versionId}"]`
    );
    
    if (!selectedVersion) {
        console.warn('❌ 找不到選中的版本元素');
        return;
    }
    
    
    
    // 🎯 使用正確的滾動容器：sidebar-content
    const sidebarContent = document.querySelector('.sidebar-content');
    if (!sidebarContent) {
        console.warn('❌ 找不到 sidebar-content 容器');
        return;
    }
    
    
    
    // 確保版本列表已展開
    const versionsList = document.getElementById(`${type}-versions-${itemId}`);
    if (versionsList && !versionsList.classList.contains('expanded')) {
        
        versionsList.classList.add('expanded');
        
        setTimeout(() => scrollToSelectedVersion(type, itemId, versionId), 300);
        return;
    }
    
    // 計算元素相對於 sidebar-content 的位置
    const contentRect = sidebarContent.getBoundingClientRect();
    const elementRect = selectedVersion.getBoundingClientRect();
    
    // 計算元素相對於滾動容器頂部的位置
    const elementTopInContainer = elementRect.top - contentRect.top + sidebarContent.scrollTop;
    const containerHeight = contentRect.height;
    const elementHeight = elementRect.height;
    
    // 將選中項目滾動到容器中央位置
    const targetScrollTop = elementTopInContainer - (containerHeight / 2) + (elementHeight / 2);
    const finalScrollTop = Math.max(0, Math.min(targetScrollTop, sidebarContent.scrollHeight - containerHeight));
    
    // 平滑滾動
    sidebarContent.scrollTo({
        top: finalScrollTop,
        behavior: 'smooth'
    });
    
    // 檢查滾動結果
    setTimeout(() => {
        const actualPosition = sidebarContent.scrollTop;
        const success = Math.abs(actualPosition - finalScrollTop) < 20;
        
        if (!success) {
            
            sidebarContent.scrollTop = finalScrollTop;
        }
    }, 500);
}

function switchToItem(type, itemId) {
    currentMode = type;
    viewMode = 'single';
    compareVersions = [];
    
    switch (type) {
        case 'character':
            currentCharacterId = itemId;
            const character = characters.find(c => c.id === itemId);
            if (character) {
                currentVersionId = character.versions[0].id;
            }
            break;

        case 'loveydovey':
            currentLoveyDoveyId = itemId;
            const loveyDoveyCharacter = loveyDoveyCharacters.find(ld => ld.id === itemId);
            if (loveyDoveyCharacter) {
                currentLoveyDoveyVersionId = loveyDoveyCharacter.versions[0].id;
            }
            break;
            
        case 'custom':
            currentCustomSectionId = itemId;
            const section = customSections.find(s => s.id === itemId);
            if (section) {
                currentCustomVersionId = section.versions[0].id;
            }
            break;
            
        case 'worldbook':
            currentWorldBookId = itemId;
            const worldBook = worldBooks.find(wb => wb.id === itemId);
            if (worldBook) {
                currentWorldBookVersionId = worldBook.versions[0].id;
            }
            break;

        case 'userpersona':
            currentUserPersonaId = itemId;
            const userPersona = userPersonas.find(up => up.id === itemId);
            if (userPersona) {
                currentUserPersonaVersionId = userPersona.versions[0].id;
            }
            break;

        case 'preset':
            currentPresetId = itemId;
            const preset = presets.find(p => p.id === itemId);
            if (preset && preset.versions.length > 0) {
                currentPresetVersionId = preset.versions[0].id;
            }
            break;
    }

    const versionsList = document.getElementById(`${type}-versions-${itemId}`);
    if (versionsList) {
        versionsList.style.transition = 'none';
        setTimeout(() => {
            if (versionsList) {
                versionsList.style.transition = '';
            }
        }, 100);
    }
}

function selectSidebarItem(type, id, subId = null) {
        // 智能記憶體清理
    if (currentMode && ItemManager.getCurrentItemId() && 
        (currentMode !== type || ItemManager.getCurrentItemId() !== id)) {
        
        // 收集舊角色的圖片進行清理（延遲執行，確保不影響切換速度）
        setTimeout(() => {
            BlobManager.performCleanup();
            
        }, 1000);
    }
   // 🚀 立即視覺反饋 - 讓用戶瞬間看到點擊效果
requestAnimationFrame(() => {
    // 移除所有active狀態
    document.querySelectorAll('.character-header.active, .version-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // ✅ 修改：使用 data 屬性尋找元素
    const clickedHeader = document.querySelector(`[data-action="toggleItemVersions"][data-type="${type}"][data-item-id="${id}"]`);
    if (clickedHeader) {
        clickedHeader.classList.add('active');
    }
    
    // 如果有指定版本，也立即高亮
    if (subId) {
        const clickedVersion = document.querySelector(`[data-action="selectSidebarItem"][data-type="${type}"][data-item-id="${id}"][data-version-id="${subId}"]`);
        if (clickedVersion) {
            clickedVersion.classList.add('active');
        }
    }
});
    // 記錄切換前的狀態
    const previousType = currentMode;
    const previousItemId = ItemManager.getCurrentItemId();
    const wasHomePage = isHomePage;
    
    isHomePage = false;
    viewMode = 'single';
    compareVersions = [];
    
    if (type === 'worldbook' || type === 'custom') {
        isListPage = false;
        listPageType = null;
    } else {
        isListPage = false;
        listPageType = null;
    }
    
    switchToItem(type, id);
    
    if (subId) {
        switch (type) {
            case 'character':
                currentVersionId = subId;
                break;
            case 'loveydovey':
                currentLoveyDoveyVersionId = subId;
                break;
            case 'userpersona':
                currentUserPersonaVersionId = subId;
                break;
            case 'custom':
                currentCustomVersionId = subId;
                break;
            case 'worldbook':
                currentWorldBookVersionId = subId;
                break;
            case 'preset':
                currentPresetVersionId = subId;
                break;
        }
    }
    
    // 🎯 智能渲染：只在必要時重新渲染側邊欄
    const needFullSidebarRender = (
        wasHomePage || 
        previousType !== type  
    );
    
    if (needFullSidebarRender) {
        renderAll(); // 需要完整渲染
        autoConvertNewImages();
    } else {
        // 只更新必要部分
        updateSidebarSelectionOnly(previousItemId, id, subId, type);
        renderContent(); // 只渲染內容區
        autoConvertNewImages();
        updateLanguageUI();
        updateSaveButtonStates();
    }
    

updateAllPageStats();
    setTimeout(() => {
        scrollToSelectedVersion(type, id, subId);
    }, 150);
    updateMobileBreadcrumb();
}

function updateSidebarSelectionOnly(oldItemId, newItemId, newVersionId, type) {

    document.querySelectorAll('.character-header.active, .version-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    const newItemElement = document.querySelector(`[data-action="toggleItemVersions"][data-type="${type}"][data-item-id="${newItemId}"]`);
    if (newItemElement) {
        newItemElement.classList.add('active');
    }
    
    if (newVersionId) {
        const newVersionElement = document.querySelector(`[data-action="selectSidebarItem"][data-type="${type}"][data-item-id="${newItemId}"][data-version-id="${newVersionId}"]`);
        if (newVersionElement) {
            newVersionElement.classList.add('active');
        }
    }
    
    const versionsList = document.getElementById(`${type}-versions-${newItemId}`);
    if (versionsList && !versionsList.classList.contains('expanded')) {
        versionsList.classList.add('expanded');

        setTimeout(() => {
            if (typeof DragSortManager !== 'undefined') {
                DragSortManager.enableVersionDragSort(type, newItemId);
            }
        }, 50);
    }
    
    // 🎯 更新統計（呼叫 stats-system.js 的函數）
    setTimeout(() => {
        updateSingleItemStats(type, newItemId, newVersionId);
    }, 0);
}

function selectItem(type, itemId, versionId = null, searchOptions = null) {
    clearStatsUpdateTimer();
    isHomePage = false;
    isListPage = false; 
    listPageType = null; 
    batchEditMode = false; 
    selectedItems = [];  

    currentMode = type;
    viewMode = 'single';
    compareVersions = [];
    
    switch (type) {
        case 'character':
            currentCharacterId = itemId;
            if (versionId) {
                currentVersionId = versionId;
            } else {
                const character = characters.find(c => c.id === itemId);
                if (character) {
                    currentVersionId = character.versions[0].id;
                }
            }
            break;

        case 'loveydovey':
            currentLoveyDoveyId = itemId;
            if (versionId) {
                currentLoveyDoveyVersionId = versionId;
            } else {
                const loveyDoveyCharacter = loveyDoveyCharacters.find(ld => ld.id === itemId);
                if (loveyDoveyCharacter) {
                    currentLoveyDoveyVersionId = loveyDoveyCharacter.versions[0].id;
                }
            }
            break;
            
        case 'custom':
            currentCustomSectionId = itemId;
            if (versionId) {
                currentCustomVersionId = versionId;
            } else {
                const section = customSections.find(s => s.id === itemId);
                if (section) {
                    currentCustomVersionId = section.versions[0].id;
                }
            }
            break;

        case 'userpersona':
            currentUserPersonaId = itemId;
            if (versionId) {
                currentUserPersonaVersionId = versionId;
            } else {
                const userPersona = userPersonas.find(up => up.id === itemId);
                if (userPersona) {
                    currentUserPersonaVersionId = userPersona.versions[0].id;
                }
            }
            break;
            
        case 'worldbook':
            currentWorldBookId = itemId;
            if (versionId) {
                currentWorldBookVersionId = versionId;
            } else {
                const worldBook = worldBooks.find(wb => wb.id === itemId);
                if (worldBook) {
                    currentWorldBookVersionId = worldBook.versions[0].id;
                }
            }
            break;

        case 'preset':
            currentPresetId = itemId;
            if (versionId) {
                currentPresetVersionId = versionId;
            } else {
                const preset = presets.find(p => p.id === itemId);
                if (preset) {
                    currentPresetVersionId = preset.versions[0].id;
                }
            }
            break;
    }
    
    renderAll();
    
    // 統一使用延遲更新，避免重複調用
    setTimeout(() => {
        updateAllPageStats();
        
        if (searchOptions) {
            // 處理一般欄位的滾動
            if (searchOptions.scrollToField) {
                scrollToSearchResult(type, searchOptions.scrollToField, searchOptions.highlightText);
            }
            
        if (searchOptions.scrollToPrompt) {
            scrollToPresetPrompt(searchOptions.scrollToPrompt, searchOptions.highlightText);
        }
        }
        
        updateMobileBreadcrumb();
    }, 300);
}

function goToHomePage() {
    currentFolderId = null;
    folderBreadcrumbs = [];
    clearStatsUpdateTimer();
    setTimeout(() => {
        BlobManager.performCleanup();
        
    }, 500);
    isHomePage = true;
    isListPage = false;   
    listPageType = null;  
    batchEditMode = false;    
    selectedItems = [];
    viewMode = 'single';
    compareVersions = [];
    
    // 🔧 重要：清除當前選中的項目ID
    currentCharacterId = null;
    currentVersionId = null;
    currentUserPersonaId = null;
    currentUserPersonaVersionId = null;
    currentWorldBookId = null;
    currentWorldBookVersionId = null;
    currentCustomSectionId = null;
    currentCustomVersionId = null;
    
    collapseAllSidebarSections();
    renderAll();
    
    // 回到首頁時恢復標籤篩選顯示
    setTimeout(() => {
        if (typeof OverviewManager !== 'undefined') {
            OverviewManager.updateTagDisplay();
        }
    }, 50);
    updateMobileBreadcrumb();
}

// 進入列表頁面
function enterListPage(type) {
    currentFolderId = null;
    folderBreadcrumbs = [];
    if (type === 'character') {
        // 角色卡使用現有的首頁
        goToHomePage();
        // 只展開角色區塊
        expandSidebarSection('character');
        updateMobileBreadcrumb();
        return;
    }
    if (type === 'loveydovey') {
        // 重置到卿卿我我總覽頁面
        isHomePage = false;
        isListPage = false;
        listPageType = 'loveydovey';
        currentMode = type;
        viewMode = 'single';
        compareVersions = [];
        batchEditMode = false;
        selectedItems = [];
        currentPage = 1;
        searchText = '';
        
        // 🔧 清除當前選中的卿卿我我角色，回到總覽
        currentLoveyDoveyId = null;
        currentLoveyDoveyVersionId = null;
        
        // 展開卿卿我我區塊
        expandSidebarSection('loveydovey');
        
        renderAll();
        updateMobileBreadcrumb();
        return;
    }
    
    if (type === 'userpersona') {
        // 重置到玩家角色總覽頁面
        isHomePage = false;
        isListPage = false;
        listPageType = 'userpersona';
        currentMode = type;
        viewMode = 'single';
        compareVersions = [];
        batchEditMode = false;
        selectedItems = [];
        currentPage = 1;
        searchText = '';
        
        // 🔧 清除當前選中的玩家角色，回到總覽
        currentUserPersonaId = null;
        currentUserPersonaVersionId = null;
        
        // 展開玩家角色區塊
        expandSidebarSection('userpersona');
        
        renderAll();
        updateMobileBreadcrumb();
        return;
    }

    if (type === 'preset') {
        isHomePage = false;
        isListPage = true;
        listPageType = 'preset';
        currentMode = type;
        viewMode = 'single';
        compareVersions = [];
        batchEditMode = false;
        selectedItems = [];
        currentPage = 1;
        searchText = '';

        // 清除當前選中的預設
        currentPresetId = null;
        currentPresetVersionId = null;
        
        // 展開預設區塊
        expandSidebarSection('preset');
        OverviewManager.renderOverview('preset', { showImport: true });
        updateMobileBreadcrumb();
        return;
    }
    
    // 其他類型使用列表頁面
    isHomePage = false;
    isListPage = true;
    listPageType = type;
    currentMode = type;
    viewMode = 'single';
    compareVersions = [];
    batchEditMode = false;
    selectedItems = [];
    currentPage = 1;
    searchText = '';

    if (type === 'worldbook') {
    currentWorldBookId = null;
    currentWorldBookVersionId = null;
    } else if (type === 'custom') {
        currentCustomSectionId = null;
        currentCustomVersionId = null;
    }
    
    // 展開對應的側邊欄區塊，收起其他
    expandSidebarSection(type);
    
    renderAll();
    updateMobileBreadcrumb();
}

//  批量編輯功能
function toggleBatchEditMode() {
    if (FavoriteManager.isInEditMode()) {
        FavoriteManager.cancelEdit();
    }
    batchEditMode = !batchEditMode;
    selectedItems = [];
    
    const batchBar = document.getElementById('batch-operations-bar');
    if (batchBar) {
        batchBar.style.display = batchEditMode ? 'block' : 'none';
    }
    
    updateSelectedCount();

    if (batchEditMode) {
        updateSelectAllButtonText();
        updateBatchButtonStates();
    }
    // 重新渲染列表以顯示/隱藏選擇框
    if (isHomePage) {
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        OverviewManager.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

function cancelBatchEdit() {
    batchEditMode = false;
    selectedItems = [];
    
    const batchBar = document.getElementById('batch-operations-bar');
    if (batchBar) {
        batchBar.style.display = 'none';
    }
    const dissolveFoldersBtn = document.getElementById('dissolve-folders-btn');
    if (dissolveFoldersBtn) {
        dissolveFoldersBtn.disabled = false;
        dissolveFoldersBtn.style.opacity = '1';
        dissolveFoldersBtn.style.cursor = 'pointer';
    }
    // 重新渲染列表以隱藏選擇框
    if (isHomePage) {
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        OverviewManager.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

function selectAllItems() {
    // 獲取當前頁面的所有項目（限制100個）
    let allItems = [];
    
    if (isHomePage) {
        allItems = characters.slice(0, itemsPerPage);
    } else if (isListPage) {
        const itemsArray = OverviewManager.getItemsArray(listPageType);
        allItems = itemsArray.slice(0, itemsPerPage);
    } else if (!isHomePage && !isListPage && currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        allItems = userPersonas.slice(0, itemsPerPage);
    } else if (!isHomePage && !isListPage && currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        allItems = loveyDoveyCharacters.slice(0, itemsPerPage);
    }
    
    const currentFolderId = NavigationManager.getCurrentFolderId();
    
    if (currentFolderId) {
        allItems = allItems.filter(item => item.folderId === currentFolderId);
    } else {
        allItems = allItems.filter(item => !item.folderId);
    }
    
    allItems = allItems.filter(item => !item.isFolder);
    
    // 🆕 清空之前的選擇（確保互斥）
    if (selectedItems.length > 0) {
        // 清除之前選中項目的視覺狀態
        selectedItems.forEach(itemId => {
            if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
                // 卡片模式
                clearCardVisualState(itemId);
            } else if (isListPage) {
                // 列表模式
                clearListItemVisualState(itemId);
            }
        });
    }
    
    selectedItems = allItems.map(item => item.id);
    updateSelectedCount();
    
    // 更新視覺狀態
    if (isHomePage) {
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        selectedItems.forEach(itemId => {
            updateListItemVisualState(itemId);
        });
    } else if (currentMode === 'userpersona') {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey') {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

// 清除卡片視覺狀態
function clearCardVisualState(itemId) {
    const card = document.getElementById(`card-${itemId}`) || 
                 document.querySelector(`[data-character-id="${itemId}"]`) ||
                 document.querySelector(`[data-persona-id="${itemId}"]`) ||
                 document.getElementById(`folder-card-${itemId.replace('folder-', '')}`); 
    
    if (!card) return;
    
    const overlay = card.querySelector('.selection-overlay');
    const checkbox = card.querySelector('.selection-checkbox');
    const nameElement = card.querySelector('.character-name, .persona-name, .folder-name'); 
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    if (checkbox) {
        checkbox.checked = false;
    }
    
    if (nameElement) {
        nameElement.style.color = 'var(--text-color)';
        nameElement.style.fontWeight = nameElement.classList.contains('folder-name') ? '600' : '500'; 
    }
}

// 清除列表項目視覺狀態
function clearListItemVisualState(itemId) {
    let listItem;
    if (itemId.startsWith('folder-')) {
        const realFolderId = itemId.replace('folder-', '');
        // 🔧 使用多重查詢確保找到元素
        listItem = document.querySelector(`[data-folder-id="${realFolderId}"]`) ||
                   document.getElementById(`folder-list-item-${realFolderId}`) ||
                   document.getElementById(`list-item-folder-${realFolderId}`);
    } else {
        listItem = document.getElementById(`list-item-${itemId}`);
    }
    
    if (!listItem) {
        console.warn('找不到列表項目:', itemId);
        return;
    }
    
    const checkbox = listItem.querySelector('.list-selection-checkbox');
    const nameElement = listItem.querySelector('.list-item-name');
    const overlay = listItem.querySelector('.selection-overlay');
    
    if (checkbox) {
        checkbox.checked = false;
    }
    
    if (nameElement) {
        nameElement.style.color = 'var(--text-color)';
        nameElement.style.fontWeight = nameElement.classList.contains('folder-name') ? '600' : '500';
    }
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // 恢復預設邊框和背景
    listItem.style.borderColor = 'var(--border-color)';
    listItem.style.backgroundColor = 'var(--surface-color)';
}

function toggleItemSelection(itemId) {
    const isFolder = itemId.startsWith('folder-');
    if (FavoriteManager.isInEditMode() && isFolder) {
        alert(t('foldersCannotBeAddedToFavorites'));
        return;
    }
    const hasItems = selectedItems.some(id => !id.startsWith('folder-'));
    const hasFolders = selectedItems.some(id => id.startsWith('folder-'));
    
    if (isFolder && hasItems) {
        alert(t('cannotMixSelectTypes'));
        return;
    }
    
    if (!isFolder && hasFolders) {
        alert(t('cannotMixSelectTypes'));
        return;
    }
    
    const index = selectedItems.indexOf(itemId);
    if (index > -1) {
        selectedItems.splice(index, 1);
    } else {
        selectedItems.push(itemId);
    }
    
    updateSelectedCount();
    
    if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
        updateCardVisualState(itemId);
    } else if (isListPage) {
        updateListItemVisualState(itemId);
    }
}

// 更新卡片視覺狀態
function updateCardVisualState(itemId) {
    const card = document.getElementById(`card-${itemId}`) || 
                 document.querySelector(`[data-character-id="${itemId}"]`) ||
                 document.querySelector(`[data-persona-id="${itemId}"]`) ||
                 document.getElementById(`folder-card-${itemId.replace('folder-', '')}`); 
    
    if (!card) return;
    
    const isSelected = selectedItems.includes(itemId);
    const overlay = card.querySelector('.selection-overlay');
    const checkbox = card.querySelector('.selection-checkbox');
    const nameElement = card.querySelector('.character-name, .persona-name, .folder-name'); 
    
    if (overlay) {
        overlay.style.display = isSelected ? 'block' : 'none';
    }
    
    if (checkbox) {
        checkbox.checked = isSelected;
    }
    
    if (nameElement) {
        if (isSelected) {
            nameElement.style.color = '#66b3ff';
            nameElement.style.fontWeight = '600';
        } else {
            nameElement.style.color = 'var(--text-color)';
            nameElement.style.fontWeight = nameElement.classList.contains('folder-name') ? '600' : '500'; 
        }
    }
}

function updateSelectedCount() {
    if (batchEditMode) {
        OverviewManager.updateBatchOperationsBar();

        updateSelectAllButtonText();
        updateBatchButtonStates();
    }
    const favoriteCountElement = document.getElementById('selected-favorite-count');
    if (favoriteCountElement) {
        favoriteCountElement.textContent = selectedItems.length;
    }
}

function deleteSelectedItems() {
    if (selectedItems.length === 0) {
        alert(t('pleaseSelectItemsFirst'));
        return;
    }
    
    const isSelectingFolders = selectedItems[0].startsWith('folder-');
    const itemType = isSelectingFolders ? 'character' : (isHomePage ? 'character' : listPageType);
    
    let confirmMessage;
    if (isSelectingFolders) {
        confirmMessage = t('deleteFoldersConfirm', selectedItems.length);
    } else {
        confirmMessage = t('batchDeleteConfirm', selectedItems.length);
    }
    
    if (confirm(confirmMessage)) {
        let deletedCount = 0;
        
        if (isSelectingFolders) {
            // 刪除資料夾及其內容
            selectedItems.forEach(selectedId => {
                const realFolderId = selectedId.replace('folder-', '');
                const folderItems = FolderManager.getFolderItems(itemType, realFolderId);
                deletedCount += folderItems.length;
                FolderManager.deleteFolder(itemType, realFolderId);
            });
        } else {
            // 刪除一般項目
            selectedItems.forEach(itemId => {
                ItemCRUD.remove(itemType, itemId, true);
                deletedCount++;
            });
        }
        
        selectedItems = [];
        batchEditMode = false;
        
        const batchBar = document.getElementById('batch-operations-bar');
        if (batchBar) {
            batchBar.style.display = 'none';
        }
        
        OverviewManager.onDataChange();
        saveData();
        
        const successMessage = isSelectingFolders ? 
            t('foldersDeletedSuccess', selectedItems.length) : 
            t('batchDeleteSuccess', deletedCount);
        
        NotificationManager.success(successMessage);
    }
}

// 展開指定側邊欄區塊
function expandSidebarSection(targetType) {
    const sections = [
        { type: 'character', id: 'characters' },
        { type: 'loveydovey', id: 'loveydovey' }, 
        { type: 'userpersona', id: 'userpersona' },
        { type: 'worldbook', id: 'worldbook' },
        { type: 'custom', id: 'custom' },
        { type: 'preset', id: 'preset' }
    ];
    
    sections.forEach(({ type, id }) => {
        const content = document.getElementById(`${id}-content`);
        const icon = document.getElementById(`${id}-icon`);
        const header = icon?.closest('.sidebar-section-header');
        
        if (type === targetType) {
            // 展開目標區塊
            if (content) content.classList.remove('collapsed');
            if (header) header.classList.add('expanded');
        } else {
            // 收起其他區塊
            if (content) content.classList.add('collapsed');
            if (header) header.classList.remove('expanded');
        }
    });
}

function collapseAllSidebarSections() {
    const sections = ['characters', 'loveydovey', 'userpersona', 'worldbook', 'custom', 'preset'];
    
    sections.forEach(sectionId => {
        const sectionContent = document.getElementById(`${sectionId}-content`);
        
        if (sectionContent) {
            sectionContent.classList.add('collapsed');
        }
        
        const itemsArray = DataOperations.getItems(
    sectionId === 'characters' ? 'character' : 
    sectionId === 'worldbook' ? 'worldbook' : 
    sectionId === 'loveydovey' ? 'loveydovey' :
    'custom'
);
        itemsArray.forEach(item => {
            const versionsList = document.getElementById(`${
            sectionId === 'characters' ? 'character' : 
            sectionId === 'worldbook' ? 'worldbook' : 
            sectionId === 'loveydovey' ? 'loveydovey' :
            'custom'
        }-versions-${item.id}`);
            if (versionsList) {
                versionsList.classList.remove('expanded');
            }
            
            const itemIcon = document.querySelector(`[onclick="toggleItemVersions('${
    sectionId === 'characters' ? 'character' : 
    sectionId === 'worldbook' ? 'worldbook' : 
    sectionId === 'loveydovey' ? 'loveydovey' : 
    'custom'
}', '${item.id}')"] .expand-icon`);
            if (itemIcon) {
                itemIcon.innerHTML = '<span class="arrow-icon arrow-right"></span>';
            }
        });
    });
}

function selectCharacterFromHome(characterId) {
    isHomePage = false;
    currentMode = 'character';
    currentCharacterId = characterId;
    const character = characters.find(c => c.id === characterId);
    if (character) {
        currentVersionId = character.versions[0].id;
    }
    viewMode = 'single';
    compareVersions = [];
    renderAll();
    
    setTimeout(() => {
        const charactersContent = document.getElementById('characters-content');
        const charactersIcon = document.getElementById('characters-icon');
        if (charactersContent && charactersIcon) {
            charactersContent.classList.remove('collapsed');
            
            // 處理 header 狀態
            const header = charactersIcon.closest('.sidebar-section-header');
            if (header) {
                header.classList.add('expanded');
            }
        }
        
        // ✨ 新增：觸發滾動定位
        scrollToSelectedVersion('character', characterId, character?.versions[0]?.id);
        updateMobileBreadcrumb();
    }, 200); // 增加等待時間，確保渲染完成
}

function addCharacterFromHome() {
    isHomePage = false;
    ItemCRUD.add('character');
}

function startCreating() {
    isHomePage = false;
    
    if (characters.length === 0) {
        ItemCRUD.add('character');
    } else {
        currentMode = 'character';
        currentCharacterId = characters[0].id;
        currentVersionId = characters[0].versions[0].id;
    }
    
    viewMode = 'single';
    compareVersions = [];
    renderAll();
}

function switchToCharacterMode() {
    currentMode = 'character';
    viewMode = 'single';
    compareVersions = [];
    renderAll();
}

function switchToCustomMode() {
    currentMode = 'custom';
    viewMode = 'single';
    compareVersions = [];
    renderAll();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    const collapsedIcons = document.getElementById('sidebar-collapsed-icons');
    
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        // 收合狀態
        icon.innerHTML = IconManager.panelLeft({width: 16, height: 16, style: 'color: var(--text-muted);'});
        if (collapsedIcons) {
            collapsedIcons.style.display = 'flex';
        }
    } else {
        // 展開狀態
        icon.innerHTML = IconManager.panelLeft({width: 16, height: 16, style: 'color: var(--text-muted);'});
        if (collapsedIcons) {
            collapsedIcons.style.display = 'none';
        }
    }
}

function expandSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    
    sidebar.classList.remove('collapsed');
    icon.style.display = 'flex';
    icon.textContent = '⇤';
    
    sidebar.removeEventListener('click', expandSidebar);
}

function expandCurrentItemVersions() {
    if (isHomePage) return;
    
    const expansions = [
    { mode: 'character', id: currentCharacterId, sectionId: 'characters' },
    { mode: 'loveydovey', id: currentLoveyDoveyId, sectionId: 'loveydovey' },
    { mode: 'userpersona', id: currentUserPersonaId, sectionId: 'userpersona' },
    { mode: 'custom', id: currentCustomSectionId, sectionId: 'custom' },
    { mode: 'worldbook', id: currentWorldBookId, sectionId: 'worldbook' },
    { mode: 'preset', id: currentPresetId, sectionId: 'preset' }
];
    
    expansions.forEach(({ mode, id, sectionId }) => {
        if (currentMode === mode && id) {
            const sectionContent = document.getElementById(`${sectionId}-content`);
            const sectionIcon = document.getElementById(`${sectionId}-icon`);
            if (sectionContent && sectionIcon) {
                sectionContent.classList.remove('collapsed');

                const sectionHeader = sectionIcon.closest('.sidebar-section-header');
                if (sectionHeader) {
                    sectionHeader.classList.add('expanded');
                }
            }
            
            const versionsList = document.getElementById(`${mode}-versions-${id}`);
            if (versionsList) {
                versionsList.classList.add('expanded');
                const itemIcon = document.querySelector(`[onclick="toggleItemVersions('${mode}', '${id}')"] .expand-icon`);
                if (itemIcon) {
                    itemIcon.innerHTML = '<span class="arrow-icon arrow-down"></span>';
                }
            }
        } else {
            const sectionContent = document.getElementById(`${sectionId}-content`);
            if (sectionContent && currentMode !== mode) {
                sectionContent.classList.add('collapsed');
            }
        }
    });
}

// ===== 20. 模式切換和對比功能 =====
function toggleCompareMode() {
    if (viewMode === 'single') {
        let currentItem, versionsArray;
        
        if (currentMode === 'character') {
            currentItem = characters.find(c => c.id === currentCharacterId);
            versionsArray = currentItem?.versions || [];
        } else if (currentMode === 'userpersona') {
            currentItem = userPersonas.find(up => up.id === currentUserPersonaId);
            versionsArray = currentItem?.versions || [];
        } else if (currentMode === 'loveydovey') {
            currentItem = loveyDoveyCharacters.find(ld => ld.id === currentLoveyDoveyId);
            versionsArray = currentItem?.versions || [];
        } else if (currentMode === 'worldbook') {
            currentItem = worldBooks.find(wb => wb.id === currentWorldBookId);
            versionsArray = currentItem?.versions || [];
        } else if (currentMode === 'custom') {
            currentItem = customSections.find(s => s.id === currentCustomSectionId);
            versionsArray = currentItem?.versions || [];
        } else if (currentMode === 'preset') {
            currentItem = presets.find(p => p.id === currentPresetId);
            versionsArray = currentItem?.versions || [];
        }
        
        if (currentItem && versionsArray.length > 1) {
            compareVersions = [];
            VersionSelector.create({
                title: t('selectVersionsToCompare'),
                description: t('selectTwoVersions'),
                versions: versionsArray,
                maxSelections: 2,
                onConfirm: (selectedVersions) => {
                    compareVersions = selectedVersions;
                    viewMode = 'compare';
                    renderAll();
                }
            });
        } else {
            alert(t('needTwoVersions'));
        }
    } else {
        viewMode = 'single';
        compareVersions = [];
        renderAll();
    }
}

function setViewMode(mode) {
    viewMode = mode;
    
    const headerBar = document.querySelector('.character-header-bar');
    if (headerBar) {
        headerBar.classList.remove('single-mode', 'compare-mode');
        headerBar.classList.add(mode === 'compare' ? 'compare-mode' : 'single-mode');
    }
    
    renderAll();
}

function showVersionSelector() {
    let currentItem, versionsArray;
    
    if (currentMode === 'character') {
        currentItem = characters.find(c => c.id === currentCharacterId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'userpersona') {
        currentItem = userPersonas.find(up => up.id === currentUserPersonaId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'loveydovey') {
        currentItem = loveyDoveyCharacters.find(ld => ld.id === currentLoveyDoveyId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'worldbook') {
        currentItem = worldBooks.find(wb => wb.id === currentWorldBookId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'custom') {
        currentItem = customSections.find(s => s.id === currentCustomSectionId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'preset') {
        currentItem = presets.find(p => p.id === currentPresetId);
        versionsArray = currentItem?.versions || [];
    }
    
    if (!currentItem) return;

    compareVersions = [];

    VersionSelector.create({
        title: t('selectVersionsToCompare'),
        description: t('selectTwoVersions'),
        versions: versionsArray,
        maxSelections: 2,
        onConfirm: (selectedVersions) => {
            compareVersions = selectedVersions;
            viewMode = 'compare';
            renderAll();
        }
    });
}

function updateHeaderBarStyles() {
    const headerBar = document.querySelector('.character-header-bar');
    if (headerBar) {
        headerBar.classList.remove('single-mode', 'compare-mode');
        
        if (viewMode === 'compare') {
            headerBar.classList.add('compare-mode');
        } else {
            headerBar.classList.add('single-mode');
        }
    }
}

// ===== 21. 欄位更新和處理函數 =====
function updateField(itemType, itemId, versionId, field, value, source = 'input') {
    // 雙屏模式特殊處理
    let actualItemType = itemType;
    
    if (currentMode === 'crosstype' && crossTypeCompareMode) {
        const crossTypeDetails = ItemManager.getCrossTypeItemDetails(itemId, versionId);
        if (crossTypeDetails) {
            actualItemType = crossTypeDetails.type;
        }
    }
    
    const item = ItemManager.getItemsArray(actualItemType).find(i => i.id === itemId);
    if (!item) {
        console.warn(`找不到項目: ${actualItemType}-${itemId}`);
        return;
    }
    
    const version = item.versions.find(v => v.id === versionId);
    if (!version) {
        console.warn(`找不到版本: ${versionId}`);
        return;
    }

    if (field === 'tags') {
        const normalizedTags = TagManager.normalizeToArray(value);
        version[field] = TagManager.normalizeToString(normalizedTags);
    } else if (field === 'key' || field === 'keysecondary') {
        version[field] = value.split(',').map(k => k.trim()).filter(k => k);
    } else if (field.startsWith('customField-')) {
    // 處理筆記本自定義欄位
    const fieldId = field.replace('customField-', '');
    const customField = version.fields?.find(f => f.id === fieldId);
    if (customField) {
        customField.content = value;
    }
    } else {
        version[field] = value;
    }
    
    TimestampManager.updateVersionTimestamp(actualItemType, itemId, versionId);

    if (source === 'input') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id) {
            updateFieldStats(activeElement.id);
            updateVersionStats(actualItemType, itemId, versionId);
        }
    }
    
    markAsChanged();
    
    // 如果是頭像更新，在雙屏模式下觸發局部重渲染
    if (field === 'avatar' && crossTypeCompareMode) {
        console.log(`✅ 雙屏模式頭像已更新到數據: ${actualItemType}-${itemId}-${versionId}`);
    }
}

function updateCharacterField(characterId, versionId, field, value) {
    updateField('character', characterId, versionId, field, value);
}

function updateItemName(type, itemId, name) {
    const item = ItemManager.getItemsArray(type).find(i => i.id === itemId);
    if (item) {
        item.name = name;
        renderSidebar();
        markAsChanged();
    }
}

function updateVersionName(type, itemId, versionId, name) {
    const item = ItemManager.getItemsArray(type).find(i => i.id === itemId);
    if (item) {
        const version = item.versions.find(v => v.id === versionId);
        if (version) {
            version.name = name;
            renderSidebar();
            markAsChanged();
        }
    }
}



function triggerImageUpload(characterId, versionId) {
    document.getElementById(`avatar-upload-${versionId}`).click();
}






function updateSidebarTranslations() { 
    const searchContentTitle = document.querySelector('.search-content-title');
    if (searchContentTitle) searchContentTitle.textContent = t('searchContent');
    
    const dualScreenTitle = document.querySelector('.dual-screen-title');
    if (dualScreenTitle) dualScreenTitle.textContent = t('dualScreenEdit');
    
    const tagManagementTitle = document.querySelector('.tag-management-title');
    if (tagManagementTitle) tagManagementTitle.textContent = t('tagManagement');
    
    // 角色卡區塊
    const charactersSection = document.querySelector('#characters-icon').closest('.sidebar-section');
    const charactersTitle = charactersSection?.querySelector('.sidebar-section-title');
    if (charactersTitle) charactersTitle.textContent = t('character');
    
    // 角色相關按鈕
    const addButtons = document.querySelectorAll('.sidebar-add-btn');
    if (addButtons[0]) addButtons[0].textContent = t('addCharacter');
    if (addButtons[1]) addButtons[1].textContent = t('importCharacter');
    
    // 玩家角色區塊
    const userPersonaSection = document.querySelector('#userpersona-icon').closest('.sidebar-section');
    const userPersonaTitle = userPersonaSection?.querySelector('.sidebar-section-title');
    if (userPersonaTitle) userPersonaTitle.textContent = t('userPersona');
    
    // 世界書區塊
    const worldBookSection = document.querySelector('#worldbook-icon').closest('.sidebar-section');
    const worldBookTitle = worldBookSection?.querySelector('.sidebar-section-title');
    if (worldBookTitle) worldBookTitle.textContent = t('worldBook');
    
    // 世界書相關按鈕
    const worldBookButtons = document.querySelectorAll('#worldbook-content .sidebar-add-btn');
    if (worldBookButtons[0]) worldBookButtons[0].textContent = t('addWorldBook');
    if (worldBookButtons[1]) worldBookButtons[1].textContent = t('importWorldBook');
    
    // 筆記本區塊
    const customSection = document.querySelector('#custom-icon').closest('.sidebar-section');
    const customTitle = customSection?.querySelector('.sidebar-section-title');
    if (customTitle) customTitle.textContent = t('customFields');
    
    // 筆記本相關按鈕
    const addCustomBtn = document.querySelector('button[onclick="addCustomSection()"]');
    if (addCustomBtn) addCustomBtn.textContent = t('addCustomField');
    
    // 預設區塊
    const presetSection = document.querySelector('#preset-icon').closest('.sidebar-section');
    const presetTitle = presetSection?.querySelector('.sidebar-section-title');
    if (presetTitle) presetTitle.textContent = t('preset');

    // 卿卿我我區塊
    const loveyDoveySection = document.querySelector('#loveydovey-icon').closest('.sidebar-section');
    const loveyDoveyTitle = loveyDoveySection?.querySelector('.sidebar-section-title');
    if (loveyDoveyTitle) loveyDoveyTitle.textContent = t('loveydovey');
}

// ===== 23. 自定義欄位處理函數 =====
function addCustomField(sectionId, versionId) {
    const section = customSections.find(s => s.id === sectionId);
    if (section) {
        const version = section.versions.find(v => v.id === versionId);
        if (version) {
            const newField = {
                id: generateId(),
                name: `${t('defaultField')} ${version.fields.length + 1}`,
                content: ''
            };
            version.fields.push(newField);
            
            // 🎯 找到正確的容器（支援單版本和對比模式）
            const container = document.querySelector(`#custom-fields-${versionId}[data-section-id="${sectionId}"]`);
            
            if (container) {
                // 在容器末尾直接插入新欄位 HTML
                const newFieldHTML = ContentRenderer.renderCustomField(sectionId, versionId, newField);
                container.insertAdjacentHTML('beforeend', newFieldHTML);
                
                markAsChanged();
                
                // 🎯 初始化新欄位的功能
                requestAnimationFrame(() => {
                    // 初始化自動調整大小
                    if (typeof initAutoResize === 'function') {
                        initAutoResize();
                    }
                    
                    // 更新統計
                    if (typeof updateAllPageStats === 'function') {
                        updateAllPageStats();
                    }
                    
                    // 🎯 重新初始化拖曳排序
                    setTimeout(() => {
                        if (typeof DragSortManager !== 'undefined' && DragSortManager.enableCustomFieldsDragSort) {
                            DragSortManager.enableCustomFieldsDragSort(sectionId, versionId);
                        }
                    }, 50);
                });
            } else {
                // 🛡️ 找不到容器時的備用方案
                console.warn('找不到筆記本容器，使用完整重新渲染');
                if ((crossTypeCompareMode || viewMode === 'compare') && typeof ContentRenderer.renderCustomFieldsList === 'function') {
                    ContentRenderer.renderCustomFieldsList(sectionId, versionId);
                } else {
                    renderCustomContent();
                }
                markAsChanged();
            }
        }
    }
}

function updateCustomFieldName(sectionId, versionId, fieldId, name) {
    const section = customSections.find(s => s.id === sectionId);
    if (section) {
        const version = section.versions.find(v => v.id === versionId);
        if (version) {
            const field = version.fields.find(f => f.id === fieldId);
            if (field) {
                field.name = name;
                markAsChanged();
            }
        }
    }
}

function updateCustomFieldContent(sectionId, versionId, fieldId, content) {
    const section = customSections.find(s => s.id === sectionId);
    if (section) {
        const version = section.versions.find(v => v.id === versionId);
        if (version) {
            const field = version.fields.find(f => f.id === fieldId);
            if (field) {
                field.content = content;
                TimestampManager.updateVersionTimestamp('custom', sectionId, versionId);
                handleFieldUpdateComplete('custom', sectionId, versionId);
            }
        }
    }
}

function removeCustomField(sectionId, versionId, fieldId) {
    const section = customSections.find(s => s.id === sectionId);
    if (section) {
        const version = section.versions.find(v => v.id === versionId);
        if (version && version.fields.length > 1) {
            version.fields = version.fields.filter(f => f.id !== fieldId);
            
            // 🎯 找到要刪除的欄位元素
            const fieldElement = document.getElementById(`field-${fieldId}`);
            
            if (fieldElement) {
                // 淡出動畫
                fieldElement.style.transition = 'opacity 0.15s ease';
                fieldElement.style.opacity = '0';
                
                setTimeout(() => {
                    fieldElement.remove();
                    markAsChanged();
                    
                    // 🎯 重新初始化拖曳排序
                    requestAnimationFrame(() => {
                        if (typeof updateAllPageStats === 'function') {
                            updateAllPageStats();
                        }
                        
                        setTimeout(() => {
                            if (typeof DragSortManager !== 'undefined' && DragSortManager.enableCustomFieldsDragSort) {
                                DragSortManager.enableCustomFieldsDragSort(sectionId, versionId);
                            }
                        }, 50);
                    });
                }, 150);
            } else {
                // 🛡️ 找不到元素時的備用方案
                console.warn('找不到欄位元素，使用完整重新渲染');
                if ((crossTypeCompareMode || viewMode === 'compare') && typeof ContentRenderer.renderCustomFieldsList === 'function') {
                    ContentRenderer.renderCustomFieldsList(sectionId, versionId);
                } else {
                    renderCustomContent();
                }
                markAsChanged();
            }
        } else {
            alert(t('keepOneField'));
        }
    }
}

function confirmRemoveCustomField(sectionId, versionId, fieldId) {
    const section = customSections.find(s => s.id === sectionId);
    if (section) {
        const version = section.versions.find(v => v.id === versionId);
        if (version) {
            const field = version.fields.find(f => f.id === fieldId);
            if (field) {
                const confirmDelete = confirm(t('deleteFieldConfirm', field.name));
                
                if (confirmDelete) {
                    removeCustomField(sectionId, versionId, fieldId);
                }
            }
        }
    }
}


// ===== 27. 資料清空和管理函數 =====
function showClearDataConfirm() {
    ModalManager.clearDataConfirm();
}

function exportAllDataFromModal() {
    DataManager.exportAllFromModal();
}


// ===== 28. 全螢幕編輯器相關函數 =====
function openFullscreenEditor(textareaId, title) {
    FullscreenEditor.open(textareaId, title);
}

// ===== 29. 事件監聽器設置 =====
document.addEventListener('click', function(e) {
    // 處理語言選單
    const langContainer = document.querySelector('.language-menu-container');
    const langMenu = document.getElementById('lang-menu');
    
    if (langContainer && !langContainer.contains(e.target) && langMenu) {
        langMenu.style.display = 'none';
    }
    
    // 處理功能選單
    const funcContainer = document.querySelector('.function-menu-container');
    const funcMenu = document.getElementById('function-menu');
    
    if (funcContainer && !funcContainer.contains(e.target) && funcMenu) {
        funcMenu.style.display = 'none';
    }
});

// ===== 30. URL 參數處理 =====
// 支援透過 URL 參數預設語言和卿卿我我功能
// 範例: ?lang=zh&loveydovey=on 或 ?lang=en&loveydovey=off
function applyUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    let applied = { lang: false, loveydovey: false };

    // 處理語言參數 (lang=zh 或 lang=en)
    const langParam = urlParams.get('lang');
    if (langParam) {
        const normalizedLang = langParam.toLowerCase();
        if (normalizedLang === 'zh' || normalizedLang === 'zh-tw' || normalizedLang === 'chinese') {
            currentLang = 'zh';
            localStorage.setItem('characterCreatorLang', 'zh');
            applied.lang = 'zh';
        } else if (normalizedLang === 'en' || normalizedLang === 'en-us' || normalizedLang === 'english') {
            currentLang = 'en';
            localStorage.setItem('characterCreatorLang', 'en');
            applied.lang = 'en';
        }
    }

    // 處理卿卿我我功能參數 (loveydovey=on/off 或 loveydovey=true/false 或 loveydovey=1/0)
    const loveyDoveyParam = urlParams.get('loveydovey');
    if (loveyDoveyParam !== null) {
        const normalizedValue = loveyDoveyParam.toLowerCase();
        const showLoveyDovey = ['on', 'true', '1', 'yes', 'show'].includes(normalizedValue);
        const hideLoveyDovey = ['off', 'false', '0', 'no', 'hide'].includes(normalizedValue);

        if (showLoveyDovey || hideLoveyDovey) {
            // 直接更新 OtherSettings 的設定值
            OtherSettings.settings.showLoveyDovey = showLoveyDovey;
            OtherSettings.saveSettings();
            applied.loveydovey = showLoveyDovey;
        }
    }

    return applied;
}

// ===== 31. 應用程式初始化 =====
async function initApp() {
    const startTime = performance.now();
    OtherSettings.initialize();

    // 應用 URL 參數（會覆蓋 localStorage 的設定）
    applyUrlParameters();

    OtherSettings.applyLoveyDoveyVisibility(OtherSettings.settings.showLoveyDovey);
    await initTranslations();
    await loadData();
    
    renderBasicUI();
    setupBrowserCloseWarning();
    
    setTimeout(() => {
        loadAdvancedFeatures(startTime);
    }, 100);
    
}

// ===== 32. 應用程式啟動 =====
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
});

function updateWorldBookBinding(value) {
    const currentItem = ItemManager.getCurrentItem();
    const currentVersionId = ItemManager.getCurrentVersionId();
    
    if (!currentItem || !currentVersionId) return;
    
    const version = currentItem.versions.find(v => v.id === currentVersionId);
    if (!version) return;
    
    if (value === '') {
        // 清除綁定
        version.boundWorldBookId = null;
        version.boundWorldBookVersionId = null;
    } else {
        // 解析選擇的值 "worldBookId:versionId"
        const [worldBookId, versionId] = value.split(':');
        version.boundWorldBookId = worldBookId;
        version.boundWorldBookVersionId = versionId;
    }
    
    // 更新時間戳和標記更改
    TimestampManager.updateVersionTimestamp('character', currentItem.id, currentVersionId);
    markAsChanged();
    
    // 顯示綁定狀態
    const worldBook = worldBooks.find(wb => wb.id === version.boundWorldBookId);
    if (worldBook) {
        const worldBookVersion = worldBook.versions.find(v => v.id === version.boundWorldBookVersionId);
        const versionName = worldBookVersion ? worldBookVersion.name : t('unknownVersion');
        NotificationManager.success(t('worldBookBound', worldBook.name, versionName));
    } else {
        NotificationManager.info(t('worldBookBindingCleared'));
    }
}


// ===== 其他設定管理器 =====
class OtherSettings {
    static settings = {
        showLoveyDovey: true  // 卿卿我我區塊顯示設定，預設關閉
    };
    
    static initialize() {
        this.loadSettings();
        this.initializeTextareaHeights();
    }
    
    static loadSettings() {
        try {
            const saved = localStorage.getItem('characterCreator_otherSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('載入其他設定失敗:', error);
        }
    }
    
    static saveSettings() {
        try {
            localStorage.setItem('characterCreator_otherSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('儲存其他設定失敗:', error);
        }
    }
    
    static updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        if (key === 'showLoveyDovey') {
            // 處理卿卿我我區塊顯示/隱藏
            this.applyLoveyDoveyVisibility(value);
        }
    }

static updateUI() {
    const loveyDoveyCheckbox = document.querySelector('input[name="showLoveyDovey"]');
    if (loveyDoveyCheckbox) {
        loveyDoveyCheckbox.checked = this.settings.showLoveyDovey;
    }
     // 更新拉霸開關視覺狀態
    if (typeof updateToggleSwitch === 'function') {
        updateToggleSwitch('showLoveyDovey', this.settings.showLoveyDovey);
    }
}

//  新的統一高度管理方法
static initializeTextareaHeights() {
    // 使用 setTimeout 確保 DOM 完全渲染
    setTimeout(() => {
        const textareas = document.querySelectorAll('textarea.field-input');
        textareas.forEach(textarea => {
            // 清理舊的事件監聽器（避免重複綁定）
            this.cleanupTextareaEvents(textarea);
            
            // 設定初始高度為 200px
            if (!textarea.style.height) {
                textarea.style.height = '200px';
            }
            
            // 恢復儲存的高度（如果有的話）
            this.restoreTextareaHeight(textarea);
            
            // 綁定高度變化事件
            this.bindHeightChangeEvent(textarea);
        });
        
    }, 100); // 增加延遲確保 DOM 就緒
}

static cleanupTextareaEvents(textarea) {
    // 移除滑鼠事件
    if (textarea._mousedownHandler) {
        textarea.removeEventListener('mousedown', textarea._mousedownHandler);
        textarea._mousedownHandler = null;
    }
    
    // 移除全域滑鼠事件
    if (textarea._globalMouseUpHandler) {
        document.removeEventListener('mouseup', textarea._globalMouseUpHandler);
        textarea._globalMouseUpHandler = null;
    }
    
    if (textarea._mouseupHandler) {
        textarea.removeEventListener('mouseup', textarea._mouseupHandler);
        textarea._mouseupHandler = null;
    }
    if (textarea._autoResizeHandler) {
        textarea.removeEventListener('input', textarea._autoResizeHandler);
        textarea._autoResizeHandler = null;
    }
    if (textarea._pasteHandler) {
        textarea.removeEventListener('paste', textarea._pasteHandler);
        textarea._pasteHandler = null;
    }
    if (textarea._resizeObserver) {
        textarea._resizeObserver.disconnect();
        textarea._resizeObserver = null;
    }
}

//  恢復 textarea 高度
static restoreTextareaHeight(textarea) {
    const fieldName = textarea.id.split('-')[0];
    const currentItem = ItemManager.getCurrentItem();
    const currentVersionId = ItemManager.getCurrentVersionId();
    
    if (currentItem && currentVersionId) {
        const storageKey = `textarea-height-${currentItem.id}-${currentVersionId}-${fieldName}`;
        const savedHeight = localStorage.getItem(storageKey);
        
        if (savedHeight) {
            textarea.style.height = savedHeight + 'px';
        }
    }
}

static bindHeightChangeEvent(textarea) {
    let startHeight = null;
    let resizeTimeout = null;

    // 監聽拖拽開始
    textarea._mousedownHandler = function(e) {
        // 只有點擊右下角resize handle才記錄
        const rect = this.getBoundingClientRect();
        const isResizeHandle = (
            e.clientX > rect.right - 20 && 
            e.clientY > rect.bottom - 20
        );
        
        if (isResizeHandle) {
            startHeight = this.offsetHeight;
        }
    };
    textarea.addEventListener('mousedown', textarea._mousedownHandler);

    // 監聽全域滑鼠放開
    textarea._globalMouseUpHandler = function() {
        if (startHeight !== null) {
            const height = textarea.offsetHeight;
            
            // 清除之前的延遲儲存
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            
            // 延遲儲存，確保使用正確的當前項目資訊
            resizeTimeout = setTimeout(() => {
                if (Math.abs(height - startHeight) > 5) {
                    const fieldName = textarea.id.split('-')[0];
                    const currentItem = ItemManager.getCurrentItem();
                    const currentVersionId = ItemManager.getCurrentVersionId();
                    
                    if (currentItem && currentVersionId) {
                        const storageKey = `textarea-height-${currentItem.id}-${currentVersionId}-${fieldName}`;
                        localStorage.setItem(storageKey, height);
                        
                    } else {
                        console.warn('⚠️ 無法儲存：項目資訊不完整');
                    }
                }
                startHeight = null;
            }, 100);
        }
    };
    
    // 綁定到 document
    document.addEventListener('mouseup', textarea._globalMouseUpHandler);
    
    // 🚫 完全移除 ResizeObserver 邏輯，避免跨角色衝突
}

    static applyLoveyDoveyVisibility(show) {
        // 1. 處理側邊欄中的卿卿我我區塊（使用正確的選擇器）
        const loveyDoveySection = document.querySelector('#loveydovey-icon').closest('.sidebar-section');
        if (loveyDoveySection) {
            loveyDoveySection.style.display = show ? 'block' : 'none';
            
        }
        
        // 2. 處理收合側邊欄中的卿卿我我圖示按鈕
        const collapsedLoveyDoveyBtn = document.querySelector('.sidebar-collapsed-icons .collapsed-icon-btn[title="LoveyDovey"]');
        if (collapsedLoveyDoveyBtn) {
            collapsedLoveyDoveyBtn.style.display = show ? 'block' : 'none';
            
        }
        
        // 3. 如果當前正在檢視卿卿我我模式且被隱藏，則跳轉到首頁
        if (!show && currentMode === 'loveydovey') {
            goToHomePage();
        }
        
        // 4. 重新渲染側邊欄以確保變更生效
        if (typeof renderSidebar === 'function') {
            renderSidebar();
        }
        
        // 5. 如果標籤管理器開著，重新渲染以隱藏卿卿我我相關內容
        if (typeof TagAdminManager !== 'undefined' && TagAdminManager.isTagManagerOpen) {
            if (TagAdminManager.currentView === 'list') {
                TagAdminManager.renderTagList();
            } else if (TagAdminManager.currentView === 'detail') {
                TagAdminManager.renderTagDetail(TagAdminManager.currentTag);
            }
        }
        
        
    }

}

// ===== 最愛功能管理器 =====
class FavoriteManager {
    static favoriteEditMode = false;
    
    // 🎨 顯示邏輯：處理名稱顯示
    static getDisplayName(item) {
        // 向後兼容：如果舊數據沒有 isFavorite 欄位，預設為 false
        if (item.isFavorite === undefined) {
            item.isFavorite = false;
        }
        return item.isFavorite ? `♥ ${item.name}` : item.name;
    }
    
    // ⚙️ 操作邏輯：切換最愛狀態
    static toggleItemFavorite(type, itemId) {
        const itemsArray = DataOperations.getItems(type);
        const item = itemsArray.find(i => i.id === itemId);
        
        if (item) {
            // 向後兼容
            if (item.isFavorite === undefined) {
                item.isFavorite = false;
            }
            
            item.isFavorite = !item.isFavorite;
            markAsChanged();
            return item.isFavorite;
        }
        
        return false;
    }
    
    // 🎯 批量操作：獲取所有最愛項目的ID
    static getAllFavoriteItemIds(type) {
        const itemsArray = DataOperations.getItems(type);
        return itemsArray
            .filter(item => {
                if (item.isFavorite === undefined) item.isFavorite = false;
                return item.isFavorite;
            })
            .map(item => item.id);
    }
    
    // 🚀 模式切換：進入/退出愛心編輯模式
    static toggleMode() {
        this.favoriteEditMode = !this.favoriteEditMode;
        
        // 如果同時開啟批量刪除模式，先關閉它
        if (batchEditMode) {
            batchEditMode = false;
            const batchBar = document.getElementById('batch-operations-bar');
            if (batchBar) {
                batchBar.style.display = 'none';
            }
        }
        
        // 重置選擇項目
        selectedItems = [];
        
        if (this.favoriteEditMode) {
            // 進入愛心模式：自動選擇所有已最愛的項目
            const currentType = this.getCurrentPageType();
            selectedItems = this.getAllFavoriteItemIds(currentType);
            this.showOperationsBar();
        } else {
            // 退出愛心模式
            this.hideOperationsBar();
        }
        
        updateSelectedCount();
        this.rerenderCurrentPage();
        
        // 👈 新增：重新渲染後更新視覺選擇狀態
        if (this.favoriteEditMode && selectedItems.length > 0) {
            setTimeout(() => {
                selectedItems.forEach(itemId => {
                    if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
                        updateCardVisualState(itemId);
                    } else if (isListPage) {
                        updateListItemVisualState(itemId);
                    }
                });
            }, 100); // 等待DOM更新完成
        }
    }
    
    // 🚫 取消編輯模式
    static cancelEdit() {
        this.favoriteEditMode = false;
        selectedItems = [];
        this.hideOperationsBar();
        this.rerenderCurrentPage();
    }
    
    // 💾 套用變更：批量更新最愛狀態
    static applyChanges() {
        const currentType = this.getCurrentPageType();
        const itemsArray = DataOperations.getItems(currentType);
        
        // 更新所有項目的最愛狀態
        itemsArray.forEach(item => {
            if (item.isFavorite === undefined) item.isFavorite = false;
            item.isFavorite = selectedItems.includes(item.id);
        });
        
        markAsChanged();
        saveData();
        
        // 退出編輯模式
        this.cancelEdit();
        
        NotificationManager.success(t('favoriteChangesApplied'));
    }
    
    // 🔍 獲取當前頁面類型
    static getCurrentPageType() {
        if (isHomePage) return 'character';
        if (isListPage) return listPageType;
        if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) return 'userpersona';
        if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) return 'loveydovey';
        return 'character'; // 預設
    }
    
    // 📺 顯示操作欄
    static showOperationsBar() {
        const favoriteBar = document.getElementById('favorite-operations-bar');
        if (favoriteBar) {
            favoriteBar.style.display = 'block';
        }
    }
    
    // 📺 隱藏操作欄
    static hideOperationsBar() {
        const favoriteBar = document.getElementById('favorite-operations-bar');
        if (favoriteBar) {
            favoriteBar.style.display = 'none';
        }
    }
    
    // 🔄 重新渲染當前頁面
    static rerenderCurrentPage() {
        if (isHomePage) {
            OverviewManager.renderCharacters();
        } else if (isListPage) {
            OverviewManager.renderItems(listPageType, `${listPageType}-list`);
        } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderUserPersonaCards();
        } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            ContentRenderer.renderLoveyDoveyCards();
        }
    }
    
    // 📊 檢查是否在愛心編輯模式
    static isInEditMode() {
        return this.favoriteEditMode;
    }
}