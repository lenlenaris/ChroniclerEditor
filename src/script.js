// ===== 1. 全域變數初始化 =====
let currentLang = localStorage.getItem('characterCreatorLang') || 'zh';
let translationsReady = false;

// 資料變數
let characters = [];
let customSections = [];
let worldBooks = [];
let userPersonas = [];
let loveyDoveyCharacters = [];


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
let currentMode = 'character';
let viewMode = 'single';
let compareVersions = [];
let hasUnsavedChanges = false;
let lastSavedData = null;
let sidebarCollapsed = false;
let favoriteEditMode = false;

// 列表頁面狀態變數
let isListPage = false;
let listPageType = null;
let batchEditMode = false;
let selectedItems = [];
let currentPage = 1;
let itemsPerPage = 100;
let searchText = '';

// 卿卿我我當前項目ID
let currentLoveyDoveyId = null;
let currentLoveyDoveyVersionId = null;

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
                        creatorEvents: []
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
                    creatorEvents: []
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
                    creatorEvents: JSON.parse(JSON.stringify(originalVersion.creatorEvents || []))
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
        }
    }

    static getTypeDisplayName(type) {
        const keyMap = {
            character: 'character',
            worldbook: 'worldBook', 
            custom: 'customFields',
            userpersona: 'userPersona',
            loveydovey: 'loveydovey'
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
            loveydovey: 'deleteLoveydoveyConfirm'
        };
        
        const key = keyMap[type] || 'deleteConfirm';
        return t(key, itemName);
    }
}

class ItemCRUD {
static add(type) {
    const itemsArray = DataOperations.getItems(type);
    const newItem = DataOperations.createNewItem(type, itemsArray.length);
    
    itemsArray.push(newItem);
    
    OverviewManager.invalidateCache();
    
    isHomePage = false;
    isListPage = false;
    ItemManager.setCurrentItem(type, newItem.id, newItem.versions[0].id);
    
    renderAll();
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
        markAsChanged();
        return newItem;
    }
    
    static cloneItem(originalItem, type) {
        const newItem = {
            id: generateId(),
            name: originalItem.name + t('copyPrefix'),
            isFavorite: false,
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
        
        const textarea = document.createElement('textarea');
        textarea.className = 'fullscreen-editor-textarea';
        textarea.id = 'fullscreen-textarea';
        textarea.placeholder = originalTextarea.placeholder;
        textarea.value = originalTextarea.value;
        
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
        // 檢測並緩存卿卿我我欄位的字數限制
        const loveyDoveyInfo = this.detectLoveyDoveyField(originalTextarea);

        this.currentEditor = {
            overlay: overlay,
            originalTextarea: originalTextarea,
            fullscreenTextarea: textarea,
            //  緩存卿卿我我欄位資訊
            isLoveyDoveyField: loveyDoveyInfo.isLoveyDovey,
            maxLength: loveyDoveyInfo.maxLength,
            fieldType: loveyDoveyInfo.isLoveyDovey ? 'loveydovey' : 'normal'
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
            FullscreenEditor.close();
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            
            if (FullscreenEditor.currentEditor) {
                FullscreenEditor.syncToOriginal();
            }
            
            saveData();
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
        // 🔧 支援兩種格式：「0 / 500 字」和「0/500」
        let match = countText.match(/\/\s*(\d+)\s*字/);  // "0 / 500 字" 格式
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
            let match = countText.match(/\/\s*(\d+)\s*字/);  // "/ 500 字" 格式
            if (!match) {
                match = countText.match(/(\d+)\/(\d+)/);      // "0/500" 格式
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
            z-index: 9999;
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

// ===== 總覽管理 =====
class OverviewManager {
    static currentSort = 'created-desc';
    static selectedTags = [];
        // 分頁相關屬性
    static itemsPerPage = 50;
    static currentlyShown = 50;
    static processedItems = []; 
    static isShowingAll = false; 
    static lastProcessParams = null;

   static initialize() {
    const savedSort = localStorage.getItem('characterCreator-sortPreference');
    if (savedSort) {
        this.currentSort = savedSort;
    }
    
    const savedTags = localStorage.getItem('characterCreator-selectedTags');
    if (savedTags) {
        try {
            this.selectedTags = JSON.parse(savedTags);
        } catch (error) {
            console.warn('載入儲存的標籤篩選失敗:', error);
            this.selectedTags = [];
        }
    }
    
    // 如果是自定義排序，確保載入保存的順序
    if (this.currentSort === 'custom') {
        DragSortManager.applySavedOrder('character');
    }
    
    // 同步下拉選單顯示值
    this.syncDropdownValue();
}


static syncDropdownValue() {
    const possibleSelectors = [
        '.sort-dropdown',
        '.overview-sort-dropdown', 
        'select[class*="sort"]',
        '.sort-select'
    ];
    
    let dropdown = null;
    for (const selector of possibleSelectors) {
        dropdown = document.querySelector(selector);
        if (dropdown) break;
    }
    
    if (dropdown && this.currentSort) {
        dropdown.value = this.currentSort;
        
    }
}

    // 儲存排序設定
    static saveSortPreference(sortValue) {
        localStorage.setItem('characterCreator-sortPreference', sortValue);
    }

    // 儲存標籤篩選設定
    static saveTagsPreference() {
        localStorage.setItem('characterCreator-selectedTags', JSON.stringify(this.selectedTags));
    }

    static getCurrentSort() {
        return this.currentSort;
    }

    static renderCharacters() {
    const container = document.getElementById('character-grid');
    if (!container) return;
    
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '', // 確保搜尋文字變化時會重新處理
        dataLength: characters.length // 新增：檢查數據長度變化
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    if (needReprocess) {
        // 重新處理數據
        let filteredCharacters = this.filterCharacters();
        this.processedItems = this.sortCharacters(filteredCharacters);
        this.currentlyShown = this.itemsPerPage;
        this.lastProcessParams = currentParams;
    }
    
    // 計算要顯示的項目
    const itemsToShow = this.processedItems.slice(0, this.currentlyShown);
    this.isShowingAll = this.currentlyShown >= this.processedItems.length;
    
    container.innerHTML = this.generateCharacterCards(itemsToShow);
    
    if (!this.isShowingAll) {
        container.innerHTML += this.generateShowMoreButton('characters');
    }
    
    // 重新啟用拖曳功能
    setTimeout(() => {
        DragSortManager.enableDragSort({
            containerSelector: '#character-grid',
            itemSelector: '.home-card[onclick*="selectCharacterFromHome"]',
            type: 'character',
            mode: 'grid',
            onReorder: () => {
                OverviewManager.enableCustomSort();
                const dropdown = document.querySelector('.sort-dropdown');
                if (dropdown) dropdown.value = 'custom';
            }
        });
        
        ContentRenderer.bindCardHoverEffects();
        
        if (batchEditMode && selectedItems.length > 0) {
            selectedItems.forEach(itemId => {
                updateCardVisualState(itemId);
            });
        }
        
    }, 100);
    
    OverviewManager.syncDropdownValue();
}
    
    static filterCharacters() {
    return characters.filter(character => {
        // 標籤篩選
        const tagMatch = TagManager.itemHasTags(character, this.selectedTags);
        
        // 搜尋篩選
        const searchMatch = !searchText || 
            character.name.toLowerCase().includes(searchText);
        
        return tagMatch && searchMatch;
    });
}

// 最愛項目優先排序
static applyFavoritePriority(itemList) {
    const favorites = [];
    const nonFavorites = [];
    
    itemList.forEach(item => {
        // 向後兼容處理
        if (item.isFavorite === undefined) {
            item.isFavorite = false;
        }
        
        if (item.isFavorite) {
            favorites.push(item);
        } else {
            nonFavorites.push(item);
        }
    });
    
    // 最愛項目排在前面，非最愛項目排在後面
    return [...favorites, ...nonFavorites];
}
    
   
static sortCharacters(characterList) {
    if (this.currentSort === 'custom') {
        //  使用自定義排序
        const savedOrder = DragSortManager.loadCustomOrder('character');
        if (savedOrder && savedOrder.length > 0) {
            const ordered = [];
            savedOrder.forEach(id => {
                const character = characterList.find(c => c.id === id);
                if (character) ordered.push(character);
            });
            
            // 添加不在排序列表中的新角色
            characterList.forEach(character => {
                if (!savedOrder.includes(character.id)) {
                    ordered.push(character);
                }
            });
            
            return ordered;
        }
    }
    
    const sorted = characterList.sort((a, b) => {
        switch (this.currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'time-desc': 
            const bLatestTime = Math.max(...b.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            const aLatestTime = Math.max(...a.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            return bLatestTime - aLatestTime;
        case 'time-asc': 
            const aLatestTimeAsc = Math.max(...a.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            const bLatestTimeAsc = Math.max(...b.versions.map(v => new Date(v.updatedAt || 0).getTime()));
            return aLatestTimeAsc - bLatestTimeAsc;
            case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'created-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'tokens-desc': 
                return this.calculateItemTotalTokens(b) - this.calculateItemTotalTokens(a);
            case 'tokens-asc': 
                return this.calculateItemTotalTokens(a) - this.calculateItemTotalTokens(b);
                
            default: return 0;
        }
    });
    
    // 其他排序才套用最愛優先
    return this.applyFavoritePriority(sorted);
}

// 計算單個項目的總 token 數
static calculateItemTotalTokens(item) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    const itemType = this.getItemTypeFromItem(item);
    
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, itemType);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}

// 從項目推斷類型（用於統計計算）
static getItemTypeFromItem(item) {
    // 根據項目結構判斷類型
    if (item.versions && item.versions[0]) {
        const firstVersion = item.versions[0];
        
        //  卿卿我我特徵：有 profileImage, characterName 等欄位
        if (firstVersion.hasOwnProperty('profileImage') || 
            firstVersion.hasOwnProperty('characterName') ||
            firstVersion.hasOwnProperty('publicDescription')) {
            return 'loveydovey';
        }
        
        // 角色卡特徵：有 description, personality 等欄位
        if (firstVersion.hasOwnProperty('description') || 
            firstVersion.hasOwnProperty('personality')) {
            return 'character';
        }
        
        // 玩家角色特徵：只有 avatar, description 等基本欄位
        if (firstVersion.hasOwnProperty('avatar') && 
            !firstVersion.hasOwnProperty('scenario')) {
            return 'userpersona';
        }
        
        // 世界書特徵：有 entries 陣列
        if (firstVersion.hasOwnProperty('entries')) {
            return 'worldbook';
        }
        
        // 筆記特徵：有 fields 陣列
        if (firstVersion.hasOwnProperty('fields')) {
            return 'custom';
        }
    }
    
    // 預設為角色
    return 'character';
}


// 添加帶類型的 token 計算方法
static calculateItemTotalTokensWithType(item, type) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, type);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}
    
    static generateCharacterCards(characterList) {
    const cards = characterList.map((character, index) => {
        const firstVersion = character.versions[0];
        
        return `
            <div class="home-card" 
                 onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('${character.id}')` : `selectCharacterFromHome('${character.id}')`}"
                 data-character-id="${character.id}"
                 id="card-${character.id}"
                 style="aspect-ratio: 2 / 3; width: 180px; transition: all 0.2s ease; position: relative; cursor: pointer;">
                
                <!-- 角色卡片主體 -->
                <div style="
                    flex: 1 1 auto; 
                    width: 100%; 
                    height: 280px; 
                    aspect-ratio: 2 / 3; 
                    border-radius: 5px; 
                    overflow: hidden; 
                    background: transparent; 
                    border: 1px solid var(--border-color); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 12px; 
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    position: relative;
                ">
                    ${firstVersion.avatar ? 
                        `<img src="${BlobManager.getBlobUrl(firstVersion.avatar)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${character.name}">` :
                        ``
                    }
                    
                    <!-- 選中覆蓋層 -->
                    <div class="selection-overlay" style="
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        right: 0; 
                        bottom: 0; 
                        background: rgba(92, 193, 255, 0.4); 
                        border: 3px solid #66b3ff; 
                        border-radius: 5px; 
                        z-index: 5;
                        pointer-events: none;
                        box-sizing: border-box;
                        display: none;
                    "></div>
                    
                    <!-- 選擇框（批量編輯模式下顯示） -->
                    ${batchEditMode || FavoriteManager.isInEditMode() ? `
                        <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                            <input type="checkbox" class="selection-checkbox"
                                   style="
                                       width: 20px; 
                                       height: 20px; 
                                       cursor: pointer; 
                                       pointer-events: none;
                                       background: white;
                                       border: 2px solid #666;
                                       border-radius: 3px;
                                   ">
                        </div>
                    ` : ''}
                </div>
                
                <!-- 角色名稱 -->
                <div style="text-align: center; padding: 0 8px;">
                    <span class="character-name" style="
                        font-size: 1em; 
                        color: var(--text-color); 
                        font-weight: 500; 
                        line-height: 1.3; 
                        display: block;
                    ">
                        ${FavoriteManager.getDisplayName(character)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    return cards + `
<div class="home-card create-character-card" onclick="addCharacterFromHome()" 
     style="cursor: pointer; width: 180px; transition: all 0.2s ease;">
            <div style="width: 100%; height: 280px; border: 2px dashed var(--border-color); border-radius: 8px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 12px;"
                 onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                 onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                <div style="color: var(--text-muted); font-size: 3em; margin-bottom: 8px; opacity: 0.7;">+</div>
                <span style="font-size: 0.9em; color: var(--text-muted); font-weight: 500; text-align: center; line-height: 2.0; opacity: 0.7;">
                    ${t('createOrImport')}
                </span>
            </div>
        </div>
`;
}
    
static applySorting(sortValue) {
    this.currentSort = sortValue;
    this.saveSortPreference(sortValue);
    
    // 🆕 重置分頁狀態，因為排序改變了
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null; // 強制重新處理
    
    // 如果切換到非自定義排序，清除自定義排序
    if (sortValue !== 'custom') {
        if (isHomePage) {
            DragSortManager.clearCustomOrder('character');
        } else if (isListPage) {
            DragSortManager.clearCustomOrder(listPageType);
        }
        else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
            DragSortManager.clearCustomOrder('loveydovey');
        }
    }
    
    this.syncDropdownValue();
    
    // 根據當前頁面類型重新渲染
    if (isHomePage) {
        this.renderCharacters();
        renderSidebar();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
        renderSidebar();
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
        renderSidebar();
    }
    else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
        renderSidebar();
    }
}
    // 添加自定義排序方法
    static enableCustomSort() {
        this.currentSort = 'custom';
        this.saveSortPreference('custom');
    }
    
    static showTagSelector(event) {
        const existingDropdown = document.getElementById('tag-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
            return;
        }
        
        const allTags = TagManager.getAllTags();
        const availableTags = allTags.filter(tag => !this.selectedTags.includes(tag));
        
        if (availableTags.length === 0) {
            return;
        }
        
        const button = event.target;
        const dropdown = document.createElement('div');
        dropdown.id = 'tag-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 120px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        dropdown.innerHTML = availableTags.map(tag => `
            <div onclick="OverviewManager.selectTag('${tag}')" 
                 style="padding: 8px 12px; cursor: pointer; font-size: 0.9em; transition: background 0.2s ease;"
                 onmouseover="this.style.background='var(--bg-color)'"
                 onmouseout="this.style.background='transparent'">
                ${tag}
            </div>
        `).join('');
        
        button.style.position = 'relative';
        button.appendChild(dropdown);
        
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    }

static selectTag(tag) {
    this.selectedTags.push(tag);
    this.saveTagsPreference();
    this.updateTagDisplay();
    
    // 🆕 重置分頁狀態
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null;
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
    
    const dropdown = document.getElementById('tag-dropdown');
    if (dropdown) dropdown.remove();
}
    
    static updateTagDisplay() {
        const container = document.getElementById('selected-tags');
        if (!container) return;
        
        container.innerHTML = this.selectedTags.map(tag => `
                <span class="tag-base tag-md" onclick="OverviewManager.removeTag('${tag}')">
                    ${tag}
                    <button class="tag-remove-btn">×</button>
                </span>
            `).join('');
    }
    
static removeTag(tag) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.saveTagsPreference();
    this.updateTagDisplay();
    
    // 🆕 重置分頁狀態
    this.currentlyShown = this.itemsPerPage;
    this.lastProcessParams = null;
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

static renderItems(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 🆕 檢查是否需要重新處理數據
    const currentParams = {
        sort: this.currentSort,
        tags: [...this.selectedTags],
        search: searchText || '',
        type: type
    };
    
    const needReprocess = !this.lastProcessParams || 
        JSON.stringify(currentParams) !== JSON.stringify(this.lastProcessParams);
    
    container.style.display = 'none';
    
    if (needReprocess) {
        // 重新處理數據
        let items = this.getItemsArray(type);
        let filteredItems = this.filterItems(items, type);
        this.processedItems = this.sortItems(filteredItems, type);
        this.currentlyShown = this.itemsPerPage;
        this.lastProcessParams = currentParams;
    }
    
    // 計算要顯示的項目
    const itemsToShow = this.processedItems.slice(0, this.currentlyShown);
    this.isShowingAll = this.currentlyShown >= this.processedItems.length;
    
    // 使用批量字符串拼接
    const htmlParts = [];
    
    itemsToShow.forEach(item => {
        htmlParts.push(this.generateListItem(item, type));
    });
    
    htmlParts.push(this.generateAddButton(type));
    
    // 🆕 添加 Show More 按鈕（如果需要）
    if (!this.isShowingAll) {
        htmlParts.push(this.generateShowMoreButton(type));
    }
    
    container.innerHTML = htmlParts.join('');
    container.style.display = '';
    
    OverviewManager.syncDropdownValue();
}


static invalidateCache() {
    this.processedItems = [];
    this.lastProcessParams = null;
    this.currentlyShown = this.itemsPerPage;
    this.isShowingAll = false;
}


static onDataChange() {
    this.invalidateCache();
    
    // 根據當前頁面重新渲染
    if (isHomePage) {
        this.renderCharacters();
        renderSidebar();
    } else if (isListPage) {
        this.renderItems(listPageType, `${listPageType}-list`);
        renderSidebar();
    } else if (currentMode === 'userpersona' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderUserPersonaCards();
        renderSidebar();
    } else if (currentMode === 'loveydovey' && !ItemManager.getCurrentItemId()) {
        ContentRenderer.renderLoveyDoveyCards();
        renderSidebar();
    }
}

static generateShowMoreButton(type) {
    const remainingCount = this.processedItems.length - this.currentlyShown;
    const showCount = Math.min(remainingCount, this.itemsPerPage);
    
    if (type === 'characters' || type === 'userpersona' || type === 'loveydovey') {
        // 卡片樣式的 Show More 按鈕
        const cardWidth = type === 'loveydovey' ? '220px' : '180px';
        const cardHeight = type === 'loveydovey' ? '220px' : '280px';
        
        return `
            <div class="home-card show-more-card" 
                 onclick="OverviewManager.showMoreItems('${type}')" 
                 style="cursor: pointer; width: ${cardWidth}; transition: all 0.2s ease;">
                <div style="
                    width: 100%; 
                    height: ${cardHeight}; 
                    border: 2px dashed var(--accent-color); 
                    border-radius: 8px; 
                    background: transparent; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    margin-bottom: 12px;
                    opacity: 0.8;
                "
                onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'; this.style.opacity='1'"
                onmouseout="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='transparent'; this.style.opacity='0.8'">
                    <div style="color: var(--accent-color); font-size: 2.5em; margin-bottom: 8px;">↓</div>
                    <span style="
                        font-size: 0.9em; 
                        color: var(--accent-color); 
                        font-weight: 500; 
                        text-align: center; 
                        line-height: 1.4;
                    ">
                        ${t('showMore')}<br>
                        <small>(+${showCount})</small>
                    </span>
                </div>
            </div>
        `;
    } else {
        // 列表樣式的 Show More 按鈕（其他類型）
        return `
            <div class="show-more-button" 
                 onclick="OverviewManager.showMoreItems('${type}')" 
                 style="
                     border: 2px dashed var(--accent-color);
                     border-radius: 8px;
                     padding: 20px;
                     text-align: center;
                     cursor: pointer;
                     transition: all 0.2s ease;
                     background: transparent;
                     margin-bottom: 16px;
                     opacity: 0.8;
                 "
                 onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'; this.style.opacity='1'"
                 onmouseout="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='transparent'; this.style.opacity='0.8'">
                <div style="color: var(--accent-color); font-size: 2em; margin-bottom: 8px;">↓</div>
                <div style="color: var(--accent-color); font-size: 1em; font-weight: 500;">
                    ${t('showMore')} (+${showCount})
                </div>
                <div style="color: var(--text-muted); font-size: 0.85em; margin-top: 4px;">
                    ${t('showing')} ${this.currentlyShown} / ${this.processedItems.length}
                </div>
            </div>
        `;
    }
}

static showMoreItems(type) {
    this.currentlyShown = Math.min(
        this.currentlyShown + this.itemsPerPage,
        this.processedItems.length
    );
    
    // 根據類型重新渲染
    if (type === 'characters') {
        this.renderCharacters();
    } else if (isListPage && type === listPageType) {
        this.renderItems(type, `${type}-list`);
    } else if (currentMode === 'userpersona' && type === 'userpersona') {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey' && type === 'loveydovey') {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

    // 獲取項目陣列
    static getItemsArray(type) {
        switch (type) {
            case 'character': return characters;
            case 'loveydovey': return loveyDoveyCharacters;
            case 'userpersona': return userPersonas;
            case 'worldbook': return worldBooks;
            case 'custom': return customSections;
            default: return [];
        }
    }

    // 通用篩選邏輯
    static filterItems(items, type) {
    return items.filter(item => {
        // 標籤篩選
        const tagMatch = TagManager.itemHasTags(item, this.selectedTags);
        
        // 搜尋篩選
        const searchMatch = !searchText || 
            item.name.toLowerCase().includes(searchText);
        
        return tagMatch && searchMatch;
    });
}

static sortItems(itemList, type) {
    if (this.currentSort === 'custom') {
        const savedOrder = DragSortManager.loadCustomOrder(type);
        if (savedOrder && savedOrder.length > 0) {
            const ordered = [];
            savedOrder.forEach(id => {
                const item = itemList.find(i => i.id === id);
                if (item) ordered.push(item);
            });
            
            itemList.forEach(item => {
                if (!savedOrder.includes(item.id)) {
                    ordered.push(item);
                }
            });
            
            return ordered;
        }
    }
    
    const sorted = itemList.sort((a, b) => {
        switch (this.currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'time-desc': return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            case 'time-asc': return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
            case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'created-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'tokens-desc': 
                return this.calculateItemMaxTokens(b, type) - this.calculateItemMaxTokens(a, type);
            case 'tokens-asc': 
                return this.calculateItemMaxTokens(a, type) - this.calculateItemMaxTokens(b, type);
            default: return 0;
        }
    });
    
    // 其他排序才套用最愛優先
    return this.applyFavoritePriority(sorted);
}

static calculateItemMaxTokens(item, type) {
    if (!item || !item.versions || item.versions.length === 0) return 0;
    
    let maxTokens = 0;
    
    item.versions.forEach(version => {
        // 直接使用 StatsManager，它會自動使用 TokenCacheManager 緩存
        const stats = StatsManager.calculateVersionStats(version, type);
        maxTokens = Math.max(maxTokens, stats.tokens);
    });
    
    return maxTokens;
}

    // 生成項目列表HTML
    static generateItemList(items, type) {
        return items.map(item => this.generateListItem(item, type)).join('') + 
            this.generateAddButton(type);
    }

  // 生成單個列表項目
static generateListItem(item, type) {
    const stats = this.getItemStats(item, type);
    const latestVersion = item.versions.reduce((latest, version) => {
    const latestTime = new Date(latest.updatedAt || 0).getTime();
    const versionTime = new Date(version.updatedAt || 0).getTime();
    return versionTime > latestTime ? version : latest;
}, item.versions[0]);

const timestamp = TimestampManager.formatTimestamp(latestVersion?.updatedAt);
    
    return `
        <div class="list-item" 
             onclick="${batchEditMode || FavoriteManager.isInEditMode() ? `toggleItemSelection('${item.id}')` : `selectItem('${type}', '${item.id}')`}"
             data-item-id="${item.id}"
             id="list-item-${item.id}"
             style="
                 background: var(--surface-color);
                 border: 1px solid var(--border-color);
                 border-radius: 8px;
                 padding: 20px;
                 margin-bottom: 16px;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 position: relative;
             "
             onmouseover="if (!batchEditMode) { this.style.borderColor='var(--accent-color)'; const deleteBtn = this.querySelector('.delete-btn'); if(deleteBtn) deleteBtn.style.display='block' }"
             onmouseout="if (!batchEditMode) { this.style.borderColor='var(--border-color)'; const deleteBtn = this.querySelector('.delete-btn'); if(deleteBtn) deleteBtn.style.display='none' }">

            <!-- 選擇框（批量編輯模式下顯示） -->
            ${batchEditMode || FavoriteManager.isInEditMode() ? `
                <div style="position: absolute; top: 16px; left: 16px; z-index: 10;">
                    <input type="checkbox" class="list-selection-checkbox"
                           style="width: 18px; height: 18px; cursor: pointer; pointer-events: none;">
                </div>
                <div style="margin-left: 40px;">
            ` : '<div>'}
            
                <!--  標題行（包含標籤） -->
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 8px;
                    margin-right: ${!batchEditMode ? '50px' : '0px'};
                ">
                    <div class="list-item-name" style="
                        font-size: 1.1em; 
                        font-weight: 600; 
                        color: var(--text-color);
                        flex: 1;
                    ">
                        ${FavoriteManager.getDisplayName(item)}
                    </div>
                    

                </div>
                
                <!-- 統計行 -->
                <div style="font-size: 0.9em; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
                    <span>${timestamp}</span>
                    <span>${stats}</span>
                </div>
            
            </div>
            
            <!-- 刪除按鈕 -->
${!batchEditMode ? `
    <button class="delete-btn" onclick="event.stopPropagation(); ItemCRUD.remove('${type}', '${item.id}')"
        style="position: absolute; top: 12px; right: 12px; display: none;"
        title="${t('delete')}">
    ${IconManager.delete({style: 'vertical-align: middle;'})}
</button>
` : ''}
        </div>
    `;
}

// 生成項目標籤顯示
static generateItemTags(item) {
    if (!item.versions || item.versions.length === 0) return '';
    
    // 收集所有版本的標籤
    const allTags = new Set();
    item.versions.forEach(version => {
        if (version.tags) {
            const tags = TagManager.normalizeToArray(version.tags);
            tags.forEach(tag => allTags.add(tag));
        }
    });
    
    const tagsArray = Array.from(allTags);
    
    if (tagsArray.length === 0) return '';
    
    return tagsArray.map(tag => `
        <span style="
            background: var(--border-color); 
            color: var(--text-muted); 
            padding: 2px 6px; 
            border-radius: 8px; 
            font-size: 0.75em; 
            white-space: nowrap;
            opacity: 0.8;
        ">${tag}</span>
    `).join('');
}

    
// 更明確的統計顯示
static getItemStats(item, type) {
    let maxChars = 0;
    let maxTokens = 0;
    let maxVersionName = '';
    let extraInfo = '';
    
    // 找出各版本中的最高值，並記錄版本名稱
    item.versions.forEach(version => {
        const stats = StatsManager.calculateVersionStats(version, type);
        if (stats.tokens > maxTokens) {
            maxChars = stats.chars;
            maxTokens = stats.tokens;
            maxVersionName = version.name;
        }
    });
    
    if (type === 'worldbook') {
        const maxEntries = Math.max(...item.versions.map(v => v.entries.length));
        extraInfo = `${maxEntries} ${t('entriesCount')} / `;
    }
    
    // 如果有多個版本，顯示最高版本的提示
    const versionHint = item.versions.length > 1 ? ` (${t('highest')}: ${maxVersionName})` : '';
    
    return `${extraInfo}${maxChars} ${t('chars')} / ${maxTokens} ${t('tokens')}${versionHint}`;
}

    // 生成新增按鈕
    static generateAddButton(type) {
        const typeKeyMap = {
            'userpersona': 'userPersona',
            'worldbook': 'worldBook', 
            'custom': 'customFields'
        };
        
        return `
            <div class="add-item-card" onclick="ItemCRUD.add('${type}')" 
                style="
                    border: 2px dashed var(--border-color);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: transparent;
                    margin-bottom: 16px;
                "
                onmouseover="this.style.borderColor='var(--accent-color)'; this.style.backgroundColor='var(--bg-color)'"
                onmouseout="this.style.borderColor='var(--border-color)'; this.style.backgroundColor='transparent'">
                <div style="color: var(--text-muted); font-size: 2em; margin-bottom: 4px;">+</div>
                <div style="color: var(--text-muted); font-size: 0.9em; margin-bottom: 8px;">
     ${type === 'worldbook' ? t('clickToAddWorldBookOrImport') : 
  type === 'custom' ? t('clickToAddNotebook') : 
  `${t('clickToAdd')} ${t(typeKeyMap[type] || 'item')}`}
</div>
            </div>
        `;
    }
}

// 列表項目選擇（與角色卡使用相同邏輯）
function toggleListItemSelection(itemId) {
    toggleItemSelection(itemId);
}

// 更新列表項目視覺狀態
function updateListItemVisualState(itemId) {
    const listItem = document.getElementById(`list-item-${itemId}`);
    if (!listItem) return;
    
    const isSelected = selectedItems.includes(itemId);
    const checkbox = listItem.querySelector('.list-selection-checkbox');
    const nameElement = listItem.querySelector('.list-item-name');
    
    if (checkbox) {
        checkbox.checked = isSelected;
    }
    
    if (nameElement) {
        if (isSelected) {
            nameElement.style.color = '#66b3ff';
        } else {
            nameElement.style.color = 'var(--text-color)';
        }
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
                    DragSortManager.enableVersionDragSort(type, itemId);
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
        // ✨ 新增：展開前先摺疊其他角色
        collapseAllOtherItemVersions(type, itemId);
        
        versionsList.classList.add('expanded');
        
        setTimeout(() => {
            DragSortManager.enableVersionDragSort(type, itemId);
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
        // ✨ 新增：智能記憶體清理
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
        }
    }
    
    // 🎯 智能渲染：只在必要時重新渲染側邊欄
    const needFullSidebarRender = (
        wasHomePage ||                    // 從首頁切換過來
        previousType !== type             // 切換了類型
        // 🗑️ 移除 !previousItemId 條件
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
    // ✨ 新增：滾動定位到選中的版本
    setTimeout(() => {
        scrollToSelectedVersion(type, id, subId);
    }, 150); // 等待渲染和展開動畫完成
}

function updateSidebarSelectionOnly(oldItemId, newItemId, newVersionId, type) {
    // 移除所有 active 狀態
    document.querySelectorAll('.character-header.active, .version-item.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // ✅ 修改：設置新的 item active 狀態
    const newItemElement = document.querySelector(`[data-action="toggleItemVersions"][data-type="${type}"][data-item-id="${newItemId}"]`);
    if (newItemElement) {
        newItemElement.classList.add('active');
    }
    
    // ✅ 修改：設置新的 version active 狀態
    if (newVersionId) {
        const newVersionElement = document.querySelector(`[data-action="selectSidebarItem"][data-type="${type}"][data-item-id="${newItemId}"][data-version-id="${newVersionId}"]`);
        if (newVersionElement) {
            newVersionElement.classList.add('active');
        }
    }
    
    // 確保新選中項目的版本列表是展開的
    const versionsList = document.getElementById(`${type}-versions-${newItemId}`);
    if (versionsList && !versionsList.classList.contains('expanded')) {
        versionsList.classList.add('expanded');
        
        // 啟用版本拖曳排序
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
    }
    
    renderAll();
    // 統一使用延遲更新，避免重複調用
    setTimeout(() => {
        updateAllPageStats();
        
        // ✨ 新增：只在搜尋時執行滾動定位
        if (searchOptions && searchOptions.scrollToField) {
            const finalVersionId = versionId || (() => {
                switch (type) {
                    case 'character': return currentVersionId;
                    case 'loveydovey': return currentLoveyDoveyVersionId;
                    case 'userpersona': return currentUserPersonaVersionId;
                    case 'custom': return currentCustomVersionId;
                    case 'worldbook': return currentWorldBookVersionId;
                    default: return null;
                }
            })();
            
            if (finalVersionId) {
                scrollToSearchResult(type, searchOptions.scrollToField, searchOptions.highlightText);
            }
        }
    }, 300); // 延長等待時間，確保渲染完成
}

function goToHomePage() {
    clearStatsUpdateTimer();
        // ✨ 新增：返回首頁時清理記憶體
    
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
}

// 進入列表頁面
function enterListPage(type) {
    if (type === 'character') {
        // 角色卡使用現有的首頁
        goToHomePage();
        // 只展開角色區塊
        expandSidebarSection('character');
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
    
    // 展開對應的側邊欄區塊，收起其他
    expandSidebarSection(type);
    
    renderAll();
}

//  批量編輯功能
function toggleBatchEditMode() {
    batchEditMode = !batchEditMode;
    selectedItems = [];
    
    const batchBar = document.getElementById('batch-operations-bar');
    if (batchBar) {
        batchBar.style.display = batchEditMode ? 'block' : 'none';
    }
    
    updateSelectedCount();
    
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
    // 獲取當前頁面的所有項目ID（限制100個）
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
    
    selectedItems = allItems.map(item => item.id);
    updateSelectedCount();
    
    // 🔧 關鍵修改：列表頁面不要重新渲染，只更新視覺狀態
    if (isHomePage) {
        // 首頁重新渲染（因為渲染時會考慮 batchEditMode 和 selectedItems）
        OverviewManager.renderCharacters();
    } else if (isListPage) {
        // 🔧 列表頁面不重新渲染，直接更新視覺狀態
        selectedItems.forEach(itemId => {
            updateListItemVisualState(itemId);
        });
    } else if (currentMode === 'userpersona') {
        ContentRenderer.renderUserPersonaCards();
    } else if (currentMode === 'loveydovey') {
        ContentRenderer.renderLoveyDoveyCards();
    }
}

function toggleItemSelection(itemId) {
    const index = selectedItems.indexOf(itemId);
    if (index > -1) {
        selectedItems.splice(index, 1);
    } else {
        selectedItems.push(itemId);
    }
    
    updateSelectedCount();
    
    // 根據當前頁面類型選擇正確的視覺更新函數
    if (isHomePage || currentMode === 'userpersona' || currentMode === 'loveydovey') {
        updateCardVisualState(itemId);
    } else if (isListPage) {
        updateListItemVisualState(itemId);
    }
}

// 更新卡片視覺狀態
function updateCardVisualState(itemId) {
    //  支援角色卡和玩家角色卡
    const card = document.getElementById(`card-${itemId}`) || 
                 document.querySelector(`[data-character-id="${itemId}"]`) ||
                 document.querySelector(`[data-persona-id="${itemId}"]`);
    
    if (!card) return;
    
    const isSelected = selectedItems.includes(itemId);
    const overlay = card.querySelector('.selection-overlay');
    const checkbox = card.querySelector('.selection-checkbox');
    const nameElement = card.querySelector('.character-name, .persona-name');
    
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
            nameElement.style.fontWeight = '500';
        }
    }
}

function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
        countElement.textContent = selectedItems.length;
    }
}

function deleteSelectedItems() {
    if (selectedItems.length === 0) {
        alert(t('pleaseSelectItemsFirst'));
        return;
    }
    
    const itemType = isHomePage ? 'character' : listPageType;
    const confirmMessage = t('batchDeleteConfirm', selectedItems.length);
    
    if (confirm(confirmMessage)) {
        const deletedCount = selectedItems.length;
        
        selectedItems.forEach(itemId => {
            ItemCRUD.remove(itemType, itemId, true);
        });
        
        selectedItems = [];
        batchEditMode = false;
        
        const batchBar = document.getElementById('batch-operations-bar');
        if (batchBar) {
            batchBar.style.display = 'none';
        }
        
        OverviewManager.onDataChange();
        saveData();
        
        NotificationManager.success(t('batchDeleteSuccess', deletedCount));
    }
}

// 展開指定側邊欄區塊
function expandSidebarSection(targetType) {
    const sections = [
        { type: 'character', id: 'characters' },
        { type: 'loveydovey', id: 'loveydovey' }, 
        { type: 'userpersona', id: 'userpersona' },
        { type: 'worldbook', id: 'worldbook' },
        { type: 'custom', id: 'custom' }
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
    const sections = ['characters', 'loveydovey', 'userpersona', 'worldbook', 'custom'];
    
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
    { mode: 'worldbook', id: currentWorldBookId, sectionId: 'worldbook' }
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
    } else if (currentMode === 'worldbook') {
        currentItem = worldBooks.find(wb => wb.id === currentWorldBookId);
        versionsArray = currentItem?.versions || [];
    } else if (currentMode === 'custom') {
        currentItem = customSections.find(s => s.id === currentCustomSectionId);
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
            
            if ((crossTypeCompareMode || viewMode === 'compare') && typeof ContentRenderer.renderCustomFieldsList === 'function') {
                // 如果在雙屏模式或對比模式且新函數存在，使用局部渲染
                ContentRenderer.renderCustomFieldsList(sectionId, versionId);
            } else {
                // 否則使用原有的全量渲染（確保向後相容）
                renderCustomContent();
            }
            
            markAsChanged();
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
            
            if ((crossTypeCompareMode || viewMode === 'compare') && typeof ContentRenderer.renderCustomFieldsList === 'function') {
                // 如果在雙屏模式或對比模式且新函數存在，使用局部渲染
                ContentRenderer.renderCustomFieldsList(sectionId, versionId);
            } else {
                // 否則使用原有的全量渲染（確保向後相容）
                renderCustomContent();
            }
            
            markAsChanged();
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

// ===== 30. 應用程式初始化 =====
async function initApp() {
    const startTime = performance.now();
    OtherSettings.initialize();
    OtherSettings.applyLoveyDoveyVisibility(OtherSettings.settings.showLoveyDovey);
    await initTranslations();
    await loadData();
    
    renderBasicUI();
    setupBrowserCloseWarning();
    
    setTimeout(() => {
        loadAdvancedFeatures(startTime);
    }, 100);
    
}

// ===== 31. 應用程式啟動 =====
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
        showLoveyDovey: true  // 卿卿我我區塊顯示設定，預設開啟
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

// ===== 記憶體監控工具（開發完刪除） =====
function showMemoryStats() {
    
    
    if (typeof characters !== 'undefined') {
        
    }
    
    const base64Count = document.querySelectorAll('img[src^="data:"]').length;
    const blobCount = document.querySelectorAll('img[src^="blob:"]').length;
    
    if ('memory' in performance) {
        const memInfo = performance.memory;
        console.log('💾 瀏覽器記憶體:', {
            使用中: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(1) + 'MB',
            總分配: (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(1) + 'MB'
        });
    }
}

// 全域可用
window.showMemoryStats = showMemoryStats;