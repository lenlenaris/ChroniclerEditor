// 繁體中文翻譯檔
// Chronicler Editor - Traditional Chinese Translations

window.ChroniclerTranslations = window.ChroniclerTranslations || {};
window.ChroniclerTranslations['zh-TW'] = {
    
    // ========================================
    // 1. 應用程式基礎
    // ========================================
    appTitle: 'Chronicler Editor',
    appSubtitle: '所有資料僅儲存在你的瀏覽器中，請定期備份以防遺失。',
    footerDataNotice: '本工具資料儲存在你的本機瀏覽器中，請定期備份以免資料丟失。',
    
    // 語言切換
    languageChinese: '繁體中文',
    languageEnglish: 'English',
    langToggleZh: '切換語言 (繁體中文)',
    langToggleEn: '切換語言 (English)',
    
    // 通用狀態
    comingSoon: '即將推出...',
    
    // ========================================
    // 2. 導航與側邊欄
    // ========================================
    character: '角色卡',
    worldBook: '世界書',
    userPersona: '玩家角色',
    loveydovey: '卿卿我我',
    customFields: '筆記本',
    item: '項目',
    selectAll: '全選',
    tagFilter: '標籤篩選',
    selectedCount: '已選擇：',
    deleteSelected: '刪除已選項目',
    
    // 側邊欄按鈕
    addCharacter: '創建角色',
    addWorldBook: '新增世界書',
    addUserPersona: '新增玩家角色',
    createLoveydovey: '創建卿卿我我角色',
    newNotebook: '新筆記',
    addCustomField: '新筆記',
    searchContent: '搜尋內容',
    tagManagement: '標籤管理',
    dualScreenEdit: '雙屏編輯',

    //控制列
    searchPlaceholder: '搜尋名稱...',
    sortNewestFirst: '建立順序（新→舊）',
    sortOldestFirst: '建立順序（舊→新）',
    sortNameAsc: '名稱 A-Z', 
    sortNameDesc: '名稱 Z-A',
    sortTimeDesc: '最新編輯',
    sortTimeAsc: '最舊編輯',
    sortTokensDesc: 'Token量（多→少）',
    sortTokensAsc: 'Token量（少→多）',
    customSort: '自定義排序',
    tooltipAddCharacter: '新增角色',
    tooltipAddUserPersona: '新增玩家角色', 
    tooltipAddLoveydovey: '新增卿卿我我角色',
    tooltipAddWorldbook: '新增世界書',
    tooltipAddCustom: '新增筆記本',
    tooltipImportCharacter: '匯入角色卡',
    tooltipImportWorldbook: '匯入世界書',
    tooltipBatchEdit: '批量刪除',
    tooltipTagFilter: '以標籤篩選顯示項目',
    tooltipSortDropdown: '項目排序方式\n拖曳卡片可自定義排序',
    
    // 雙屏編輯
    dualScreenSelector: '雙屏編輯選擇器',
    dualScreenDescription: '選擇要同時編輯的兩個項目，支援跨類型對比編輯。',
    startDualScreen: '開始雙屏編輯',

    // ========================================
    // 3. 角色卡管理
    // ========================================
    // 基本資訊
    characterName: '角色名稱',
    creator: '創作者',
    charVersion: '角色版本',
    creatorNotes: '創作者備註',
    tags: '嵌入標籤',
    
    // 角色內容欄位
    description: '角色描述',
    personality: '個性摘要',
    scenario: '場景設想',
    dialogue: '對話範例',
    firstMessage: '初始訊息',
    
    // 額外問候語
    alternateGreetings: '額外問候語',
    alternateGreeting: '額外問候語',
    manageAlternateGreetings: '管理額外問候語',
    addAlternateGreeting: '新增額外問候語',
    alternateGreetingPlaceholder: '輸入額外的初始問候語...',
    noAlternateGreetings: '目前沒有額外問候語',
    maxAlternateGreetingsReached: '最多只能添加10個額外問候語',
    deleteAlternateGreetingConfirm: '確定要刪除此額外問候語嗎？\n\n⚠️ 刪除後無法復原！',

    // 角色操作
    deleteCharacter: '刪除角色',
    copyCharacter: '複製角色',
    exportCharacter: '匯出角色卡',
    importCharacter: '匯入角色',
    selectCharacter: '請點擊側邊欄標題回到頁首',
    selectImage: '選擇圖片',
    createOrImport: '點擊創建<br>or<br>拖曳匯入',
    
    // 角色欄位佔位符
    creatorPlaceholder: '創作者名稱',
    versionPlaceholder: '版本號碼或描述',
    notesPlaceholder: '創作備註或說明',
    tagsPlaceholder: '標籤，用逗號分隔',
    descPlaceholder: '角色定義主要欄位',
    personalityPlaceholder: '角色性格的簡要描述',
    scenarioPlaceholder: '互動情形與聊天背景',
    dialoguePlaceholder: '{{user}}: 你好！\n{{char}}: 你好呀！很高興見到你～',
    firstMsgPlaceholder: '聊天開始時角色的第一則訊息',
    
    // ========================================
    // 4. 世界書管理
    // ========================================
    // 世界書基本資訊
    worldBookName: '世界書名稱',
    characterWorldBookName: '$1 的世界書',
    worldBookDesc: '世界書描述',
    lorebookEntries: '條目',
    entriesCount: '個條目',
    unknownWorldBook: '未知世界書',
    
    // 世界書操作
    deleteWorldBook: '刪除世界書',
    copyWorldBook: '複製世界書',
    exportWorldBook: '匯出世界書',
    importWorldBook: '匯入世界書',
    unknownVersion: '未知版本',
    worldBookBound: '已綁定世界書「$1 - $2」',
    worldBookBindingCleared: '已清除世界書綁定',
    noWorldBookBinding: '無綁定世界書',
    
    // 條目管理
    addEntry: '新增條目',
    deleteEntry: '刪除條目',
    copyEntry: '複製條目',
    entryName: '條目名稱',
    entryTitle: '條目標題／備註',
    entryTitleComment: '標題／備註',
    entryUID: 'UID',
    entryEnabled: '啟用條目',
    
    // 關鍵字設定
    keywords: '關鍵字',
    primaryKeywords: '主要關鍵字',
    secondaryKeys: '次要關鍵字',
    secondaryFilters: '選填過濾器',
    keywordLogic: '邏輯',
    logicContainsAny: '包含任一',
    logicNotFullyContains: '未完全包含', 
    logicContainsNone: '完全不含',
    logicContainsAll: '包含全部',
    
    // 條目內容
    entryContent: '條目內容',
    entryContentLabel: '內容',
    entryComment: '條目註釋',
    
    // 觸發設定
    triggerMode: '策略',
    triggerStrategy: '策略',
    triggerPercent: '觸發％',
    selectiveMode: '選擇模式',
    constantMode: '常駐模式',
    beforeCharDefs: '角色定義之前',
    afterCharDefs: '角色定義之後',
    topAuthorNote: "作者備註之前", 
    bottomAuthorNote: "作者備註之後",
    atDepth: '@D ⚙️ 在系統深度', //備份
    beforeExampleMsg: '範例訊息之前',
    afterExampleMsg: '範例訊息之後', 
    atSystemDepth: '@D 在 ⚙️ 系統深度',
    atUserDepth: '@D 在 👤 使用者深度', 
    atAiDepth: '@D 在 🤖 AI深度',
    
    // 插入設定
    insertPosition: '位置',
    insertOrder: '順序',
    insertionOrder: '插入順序',
    insertDepth: '深度',
    
    // 高級設定
    advancedSettings: '高級設定',
    includeGroups: '包含的群組',
    automationId: '自動化 ID',
    groupPriority: '優先處理群組',
    groupWeight: '群組權重',

    // 三值邏輯選項
    useGlobalSetting: '使用全域設定',
    yes: '是',
    no: '否',

    // 額外匹配來源區域
    additionalMatchSources: '額外匹配來源',
    matchPersonaDescription: '使用者角色描述',
    matchCharacterDescription: '角色描述', 
    matchCharacterPersonality: '角色個性',
    matchCharacterDepthPrompt: '角色備註',
    matchScenario: '場景設想',
    matchCreatorNotes: '創作者備註',

    // Triggers 觸發時機
    filterToGenerationTriggers: 'Filter to Generation Triggers',
    clickToSelectTriggers: 'All types (default)',
    trigger_normal: '正常',
    trigger_continue: '繼續', 
    trigger_impersonate: 'AI 扮演使用者',
    trigger_swipe: 'Swipe',
    trigger_regenerate: '重新生成',
    trigger_quiet: 'Quiet',
    
    // 觸發控制
    enableProbability: '啟用觸發機率',
    probabilityValue: '觸發%',
    caseSensitive: '區分大小寫',
    matchWholeWords: '匹配完整單字',
    useGroupScoring: '使用群組評分',
    
    // 遞迴控制
    recursionControl: '遞迴控制',
    noRecursion: '不可遞迴（不會被其他條目啟用）',
    preventRecursion: '防止進一步遞迴（此條目不會啟用其他條目）',
    delayRecursion: '遞迴掃描延遲（僅在啟用遞迴掃描時可用）',
    
    // 數值設定
    stickyValue: '黏性',
    cooldownValue: '冷卻時間',
    delayValue: '延遲',
    scanDepth: '掃描深度',
    scanDepthplaceholder: '使用全域設定',
    scanDepthValue: '掃描深度',
    recursionLevel: '遞迴層級',
    
    // 世界書欄位佔位符
    keywordsPlaceholder: '關鍵字，用逗號分隔...',
    secondaryKeysPlaceholder: '次要關鍵字，用逗號分隔...',
    entryContentPlaceholder: '當觸發關鍵字時要插入的內容...',
    entryCommentPlaceholder: '條目的註釋或說明...',
    groupPlaceholder: '不建議在編輯器中更改，如需調整請返回 SillyTavern',
    automationIdPlaceholder: '(無)',
    noEntries: '暫無條目',
    
    // ========================================
    // 5. 筆記本管理
    // ========================================
    // 筆記本基本
    customSection: '自定義區塊',
    sectionName: '筆記本名稱',
    clickToAddNotebook: '點擊新增筆記本',
    
    // 筆記本操作
    copySection: '複製筆記本',
    deleteSection: '刪除筆記本',
    
    // 格子管理
    addField: '新格子',
    fieldName: '格子名稱',
    fieldContent: '格子內容',
    deleteField: '刪除格子',
    
    // 筆記本佔位符
    fieldNamePlaceholder: '格子名稱...',
    customFieldPlaceholder: '輸入內容...',
    
    // ========================================
    // 6. 玩家角色管理
    // ========================================
    userPersonaName: '玩家角色名稱',
    userPersonaDesc: '角色描述',
    copyUserPersona: '複製玩家角色',
    deleteUserPersona: '刪除玩家角色',
    importUserPersona: '匯入玩家角色',
    exportUserPersona: '匯出玩家角色',
    clickToCreatePersona: '點擊創建玩家角色', 
    
    // 玩家角色佔位符
    userPersonaDescPlaceholder: '描述你的玩家角色的外貌、背景、性格等...',
    
    // ========================================
    // 7. 卿卿我我管理
    // ========================================
    loveydoveyCharacter: '卿卿我我角色',
    clickToCreateLoveydovey: '點擊創建卿卿我我角色',
    
    // 卿卿我我區塊標題
    profileSection: '個人資料',
    basicSettingsSection: '角色基本設定',
    firstChatScenario: '第一次聊天場景',
    detailSettingsSection: '角色詳細設定',
    creatorEventsSection: '創作者事件',
    
    // 個人資料欄位
    age: '年齡',
    occupation: '職業',
    characterQuote: '來自角色的一句話',
    publicDescription: '敘述',
    gender: '性別',
    profileImage: '個人頭像',
    characterLinkUrl: '角色網址',
    
    // 性別選項
    male: '男性',
    female: '女性',
    unset: '未設置',
    
    // 基本設定欄位
    basicInfo: '基本資訊',
    speakingStyle: '說話風格與習慣',
    
    // 第一次聊天場景
    scenarioScript: '情境腳本',
    characterDialogue: '角色對話',
    
    // 詳細設定
    detailedSettings: '角色詳細設定',
    likes: '喜歡',
    dislikes: '不喜歡',
    additionalInfo: '附加資訊',
    additionalTitle: '標題',
    additionalContent: '內容',
    addAdditionalInfo: '新增附加資訊',
    deleteAdditionalInfo: '刪除此項',
    
    // 創作者事件
    creatorEvents: '創作者事件',
    creatorEvent: '創作者事件',
    timeAndPlace: '時間和地點',
    eventTitle: '標題',
    eventContent: '內容',
    isSecret: '秘密敘事設置',
    secretNarrativeSetting: '秘密敘事設置',
    addCreatorEvent: '創建事件',
    addCreatorEvents: '新增創作者事件',
    deleteCreatorEvent: '刪除事件',
    expandEvent: '展開事件',
    collapseEvent: '折疊事件',
    noTitle: '（無標題）',
    unnamedEvent: '未命名事件',
    
    // 卿卿我我佔位符
    characterNamePlaceholder: '請輸入角色姓名',
    agePlaceholder: '請輸入年齡',
    occupationPlaceholder: '請輸入職業',
    characterQuotePlaceholder: '請輸入角色的經典台詞或座右銘',
    publicDescriptionPlaceholder: '請輸入角色的公開描述，這是其他用戶看到的介紹',
    characterLinkUrlPlaceholder: '貼上卿卿我我的角色連結網址',
    basicInfoPlaceholder: '描述角色的基本背景、出身、特徵等...',
    speakingStylePlaceholder: '角色的說話方式、口頭禪、語氣特色等...',
    scenarioScriptPlaceholder: '描述第一次聊天的場景設定、環境背景、當時情況等...',
    characterDialoguePlaceholder: '角色在第一次聊天時的對話範例、開場白、互動方式等...',
    likesPlaceholder: '角色喜歡的事物、活動、類型等...',
    dislikesPlaceholder: '角色不喜歡或討厭的事物、情況等...',
    additionalTitlePlaceholder: '附加資訊的標題...',
    additionalContentPlaceholder: '詳細描述這項附加資訊...',
    timeAndPlacePlaceholder: '事件發生的時間、地點...',
    eventTitlePlaceholder: '事件的標題或名稱...',
    eventContentPlaceholder: '詳細描述這個創作者事件的內容、背景、影響等...',
    
    // ========================================
    // 8. 版本控制
    // ========================================
    // 檢視模式
    singleView: '單頁',
    compareView: '對比',
    
    // 版本操作
    addVersion: '建立新版本',
    copy: '複製版本',
    delete: '刪除版本',
    unnamedVersion: '未命名版本',

    // 對比功能
    selectVersionsToCompare: '選擇要對比的頁面',
    selectTwoVersions: '選擇2個頁面進行對比',
    currentSelected: '目前已選',
    startCompare: '開始對比',
    needOneMore: '還需選擇1個版本',
    
    // 版本狀態
    unsavedChanges: `變更尚未儲存`,
    saveChanged: '已儲存變更',
    currentVersion: ' (當前)',
    
    // ========================================
    // 9. 匯出入功能
    // ========================================
    // 通用匯出入
    export: '匯出',
    exportData: '匯出完整備份',
    importData: '匯入備份檔案',
    exportLoveydovey: '匯出卿卿我我角色',
    exportNotebook: '匯出筆記',
    exportItem: '匯出$1',
    selectVersionsToExport: '選擇版本',
    selectExportFormat: '匯出格式',
    
    // 檔名設定
    filenameSettings: '檔名設定',
    includeVersionInFilename: '包含版本名稱',
    batchExportNote: '批量匯出時將強制包含版本名稱',
    
    // 世界書綁定
    worldBookBindingConfirm: '世界書綁定確認',
    followingVersionsHaveWorldBook: '以下版本有綁定世界書，是否要一併匯出？',
    exportCharacterOnly: '否，只匯出角色卡',
    exportWithWorldBook: '是，一併匯出世界書',
    worldBookBindingExplanation: '選擇「是」將在角色卡中包含世界書資料。<br>選擇「否」將只匯出角色卡資料。',
    
    // 格式選項
    exportJSON: '匯出 JSON',
    exportPNG: '匯出 PNG',
    exportTXT: '匯出 TXT',
    exportMarkdown: '匯出 Markdown',
    exportAll: '匯出所有版本',
    
    // 匯出對話框
    selectVersion: '選擇要匯出的版本 (1-$1):',
    exportAllTitle: '匯出所有版本',
    exportAllDesc: '角色「$1」共有 $2 個版本，請選擇匯出格式：',
    jsonFormat: 'JSON 格式',
    jsonDesc: '純文字格式，適合匯入其他工具或備份',
    pngFormat: 'PNG 圖片格式',
    pngDesc: '包含圖片的角色卡，適合分享或在 SillyTavern 中使用',
    startExport: '開始匯出',
    exporting: '正在匯出 $1 個版本...',
    preparing: '準備中...',
    noImage: '無圖片',
    
    // 完整備份相關
    itemsCharacterCards: '$1 個角色卡',
    itemsNotebooks: '$1 個筆記本', 
    itemsWorldBooks: '$1 個世界書',
    itemsUserPersonas: '$1 個玩家角色',
    itemsLoveyDoveyCharacters: '$1 個卿卿我我角色',
    noItems: '無',
    customThemes: '自定義主題',
    personalSettings: '個人偏好設定',
    sortPreferences: '排序偏好',
    dataLabel: '資料：',
    settingsLabel: '設定：',
    
    // ========================================
    // 10. 介面與主題設定
    // ========================================
    // 介面設定
    customInterface: '介面主題',
    interfaceThemeSettings: '介面主題設定',
    languageSelection: '語言選擇',
    otherSettings: '其他設定',
    featureDisplay: '功能區塊顯示',
    showLoveyDoveySection: '顯示卿卿我我區塊',
    loveyDoveyDescription: '在側邊欄中顯示卿卿我我角色功能',
    
    // 主題管理
    themeManagement: '主題管理',
    customColor: '自訂主題',
    customTheme: '自訂主題顏色',
    themeName: '主題名稱',
    themeSelectionAndOperations: '主題選擇與操作',
    saveTheme: '儲存',
    saveAsNewTheme: '另存新主題', 
    renameTheme: '重新命名',
    deleteTheme: '刪除主題',
    enterThemeName: '請輸入主題名稱：',
    enterNewThemeName: '請輸入新的主題名稱：',
    restoreDefault: '日間',
    eyeCareMode: '夜間',
    blueMoonTheme: '藍月',
    lightPurpleTheme: '淺紫',
    exportColorTheme: '匯出主題',
    importColorTheme: '匯入主題',

    // 顏色自訂
    colorCustomization: '顏色自訂',
    primaryColor: '選取顏色',
    secondaryColor: '選項背景',
    accentColor: '強調顏色',
    bgColor: '鼠標移動',
    surfaceColor: '文字輸入框',
    textColor: '主要文字',
    textMutedColor: '次要文字',
    borderColor: '邊框顏色',
    headerBgColor: '次要背景',
    sidebarBgColor: '側邊欄背景',
    mainContentBgColor: '主頁背景',
    contentBgColor: '編輯欄背景',
    successColor: '成功提示',
    warningColor: '警告提示', 
    dangerColor: '危險提示',
    
    // ========================================
    // 11. 系統訊息
    // ========================================
    // 成功訊息
    saved: '已儲存到瀏覽器',
    importSuccess: '角色匯入成功！',
    versionAddedSuccess: '成功將新分支「$1」加入角色「$2」！',
    importRenamedSuccess: '角色匯入成功！由於名稱重複，已重命名為「$1」',
    batchDeleteSuccess: '成功刪除 $1 個項目',
    worldBookImportSuccess: '世界書「$1」匯入成功！包含 $2 個條目',
    worldBookRenamedImportSuccess: '世界書重命名為「$1」並匯入成功！包含 $2 個條目',
    versionAddedToWorldBook: '版本「$1」已添加到世界書「$2」！包含 $3 個條目',
    fullDataImportSuccess: '完整資料與設定匯入成功！',
    tagRenameSuccess: '標籤重命名成功！已更新 $1 個項目',
    tagRemoveSuccess: '已從 $1 個項目中移除標籤「$2」',
    tagDeleteSuccess: '已刪除 $1 個含有標籤「$2」的版本',
    themeSaved: '主題「$1」已儲存',
    newThemeCreated: '新主題「$1」已建立',
    themeRenamed: '主題已重新命名為「$1」',
    themeDeleted: '主題「$1」已刪除',
    themeExported: '主題「$1」已匯出',
    themeImportSuccess: '主題「$1」匯入成功',

    // 錯誤訊息
    fileReadError: '檔案讀取失敗',
    unsupportedFileFormat: '不支援的讀取格式: $1',
    invalidPNGFile: '無效的 PNG 檔案，找不到 IEND chunk',
    pleaseSelectAtLeastOneVersion: '請至少選擇一個版本',
    pleaseSelectJSONOrPNG: '請選擇JSON或PNG格式的檔案',
    importFailed: '匯入失敗：$1',
    worldBookImportFailed: '世界書匯入失敗：$1',
    deleteFailed: '刪除失敗：$1',
    worldBookNotCharacterCard: '這似乎是世界書檔案，不是角色卡檔案！請到世界書頁面進行匯入。',
    invalidCharacterCardFile: '檔案格式不正確，請確認這是有效的角色卡檔案。',
    noPNGCharacterData: 'PNG檔案中未找到角色資料，請確認這是有效的角色卡PNG檔案',
    characterFileParseError: '角色檔案解析失敗：$1',
    worldBookOnlySupportsJSON: '世界書只支援JSON格式',
    invalidWorldBookFile: '檔案格式不正確，請選擇有效的世界書檔案',
    worldBookParseError: '世界書檔案解析失敗：$1',
    fullBackupOnlySupportsJSON: '完整備份只支援JSON格式',
    invalidBackupFile: '檔案格式不正確，請選擇有效的備份檔案',
    backupParseError: '備份檔案解析失敗：$1',
    invalidThemeFile: '無效的主題檔案格式',
    themeFileReadError: '主題檔案讀取失敗',
    pleaseEnterThemeName: '請輸入主題名稱',

    // 確認對話框
    deleteConfirm: '確定要刪除角色「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteWorldBookConfirm: '確定要刪除世界書「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteNotebookConfirm: '確定要刪除筆記「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteUserPersonaConfirm: '確定要刪除玩家角色「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteLoveydoveyConfirm: '確定要刪除卿卿我我角色「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteVersionConfirm: '確定要刪除分頁「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteFieldConfirm: '確定要刪除格子「$1」嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    deleteEntryConfirm: '確定要刪除此條目嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    batchDeleteConfirm: '確定要刪除選中的 $1 個項目嗎？\n\n警告：刪除後無法復原，請確保已備份重要資料！',
    unsavedWarning: '你有未儲存的變更，確定要離開嗎？',
    detectWorldBookImport: '檢測到角色「$1」包含內建世界書「$2」\n包含 $3 個條目，是否要同時匯入？',
    importWithWorldBook: '同時匯入世界書',
    importCharacterOnly: '只匯出角色',
    characterAlreadyExists: '已存在角色「$1」！',
    worldBookAlreadyExists: '已存在世界書「$1」！',
    addAsNewVersion: '新增為該角色的新版本',
    createAsNewCharacter: '創建為新的獨立角色',
    addAsNewWorldBookVersion: '新增為該世界書的新版本',
    createAsNewWorldBook: '創建為新的獨立世界書',
    confirmFullBackupImport: '確定要匯入完整備份檔案嗎？\n\n將匯入以下內容：\n資料：$1\n設定：$2\n\n警告：這將完全覆蓋現有的所有資料和設定！',
    confirmDeleteTheme: '確認刪除主題',
    deleteThemeConfirm: '確定要刪除主題「$1」嗎？',
    operationCannotUndo: '此操作無法復原！',
    cannotRenameBuiltin: '內建主題無法重新命名',
    cannotDeleteBuiltin: '內建主題無法刪除',

    // 清空資料
    clearAllData: '清空資料',
    clearDataTitle: '清空所有資料',
    clearDataWarning: '危險操作警告',
    clearDataMessage: '你即將清空所有資料，包括：\n• 所有角色卡及其版本\n• 所有世界書及其條目\n• 所有筆記本\n• 所有個人設定\n\n此操作無法復原！\n\n建議先使用「匯出完整備份」功能備份資料。',
    clearDataDesc: '此操作將永久刪除所有儲存在瀏覽器中的資料，包括角色、世界書、筆記本等。',
    clearDataCompleteDesc: '此操作將徹底清空所有內容，回到全新的初始狀態。',
    itemsToBeCleared: '將被清空的項目',
    allCharacterAndWorldBookData: '所有角色卡、世界書、筆記本資料',
    allPersonaAndLoveyDoveyData: '所有玩家角色、卿卿我我角色',
    interfaceAndSettingsData: '介面主題、語言設定、個人偏好設定',
    localCacheData: '本地儲存的所有緩存',
    suggestBackupFirst: '建議先備份資料',
    clickToExportBackup: '點擊下方按鈕匯出完整備份',
    backupExportComplete: '備份匯出完成',
    nowSafeToClearData: '現在可以安全地清空資料了',
    finalClearConfirm: '最終確認',
    finalClearWarning: '⚠️ 最後警告 ⚠️\n\n你即將永久刪除所有資料！\n\n• 所有角色卡和版本\n• 所有世界書和條目\n• 所有筆記本\n• 所有個人設定和主題\n\n此操作無法復原！\n\n確定要繼續嗎？',
    yesDeleteEverything: '是，刪除所有資料',
    confirmClearData: '我了解風險並確定清空',
    cancelClear: '取消',
    cancelOperation: '取消操作',
    exportBeforeClear: '先匯出備份',
    dataCleared: '所有資料已清空',
    pageResetToInitial: '頁面已重置為初始狀態',
    clearDataError: '清空資料時發生錯誤，請重新整理頁面後再試',
    
    // 限制訊息
    needTwoVersions: '需要至少2個分頁才能進行對比',
    keepOneVersion: '至少需要保留一個版本',
    keepOneField: '至少需要保留一個格子',
    maxTwoVersions: '最多只能選擇2個分頁',
    pleaseSelectItemsFirst: '請先選擇要刪除的項目', 
    
    // 其他
    loadingCharacters: '',
    pleaseWait: '載入中...',
    clickToUploadImage: '點擊上傳圖片',
    clickToUploadAvatar: '點擊上傳頭像',
    enterTagName: '輸入標籤名稱...',
    unknownItemType: '未知的項目類型',
    dataLoadError: '資料載入錯誤，請重新選擇',
    pleaseSelectBothSides: '請確保左右兩側都已選擇完整的項目和版本',
    notSelectedYet: '尚未選擇項目',
    selectVersion: '請選擇版本',
    selectedPrefix: '已選擇：',

    // ========================================
    // 12. 統計與狀態
    // ========================================
    statisticsInfo: '統計資訊',
    charCount: '字數', 
    tokenCount: 'Token數',
    exportTime: '匯出時間',
    editText: 'Edit Text',
    chars: '字',
    tokens: 'tokens',
    total: '總計',
    versionStats: '$1字 / $2tokens',
    highest: '最高',
    showMore: 'Show More',
    showing: 'Showing',
    
    // ========================================
    // 13. 通用按鈕與操作
    // ========================================
    fullscreenEdit: '全螢幕編輯',
    clickToAdd: '點擊新增',
    clickToUpload: '點擊上傳',
    clickToAddWorldBookOrImport: '點擊新增世界書 or 拖曳匯入',
    save: `${IconManager.save({style: 'margin-right: 0px;'})}`,
    saveData: '儲存',
    cancel: '取消',
    close: '關閉',
    apply: '套用',
    addTag: '新增標籤',
    name: '名稱',
    confirm: '確定',
    clickConfirm: '點擊「確定」：',
    clickCancel: '點擊「取消」：',
    searchItems: '搜尋項目...',
    noItemsOfType: '此類型暫無項目',
    noMatchingItems: '找不到匹配的項目',
    
    // ========================================
    // 14. 搜尋功能
    // ========================================
    searchContent: '搜尋內容',
    searchPlaceholderContent: '輸入要搜尋的內容...',
    searchEmptyState: '請輸入要搜尋的內容',
    searchMinChars: '請輸入至少 2 個字元',
    searchNotFound: '找不到包含「$1」的內容',
    searchResultsCount: '「$1」(找到 $2 個結果)',

    // 搜尋欄位名稱 
    personalityTraits: '性格特點',
    plotSetting: '劇情設定',
    firstMessageField: '初始訊息',
    unsetValue: '未設定',
    fieldPrefix: '第',
    fieldSuffix: '格',

    // ========================================
    // 15. 標籤管理
    // ========================================
    tagManagement: '標籤管理',
    searchTagsPlaceholder: '搜尋標籤...',
    noTagsFound: '目前沒有任何標籤',
    tagList: '標籤列表',
    itemCount: '個',
    itemCharacterCards: '個角色卡',
    itemLoveyDoveyCharacters: '個卿卿我我角色', 
    itemUserPersonas: '個玩家角色',
    itemWorldBooks: '個世界書',
    itemNotebooks: '個筆記',

    // 重命名標籤
    renameTag: '重命名標籤',
    renameTagTo: '將標籤「$1」重命名為：',
    confirmRename: '確認重命名',
    tagNameCannotEmpty: '標籤名稱不能為空',
    tagAlreadyExists: '標籤「$1」已存在，請使用其他名稱',

    // 刪除標籤  
    deleteTag: '刪除標籤',
    selectDeleteMethod: '你要刪除標籤 $1 ，請選擇操作方式：',
    removeTagOnly: '僅移除標籤',
    removeTagOnlyDesc: '從所有項目中移除 $1 標籤，但保留所有內容',
    deleteAllContent: '刪除所有相關內容',
    deleteAllContentDesc: '永久刪除所有含有 $1 標籤的版本和完整內容',
    affectedItemsCount: '將影響以下 $1 個項目：',
    willDeleteVersionsCount: '將刪除以下 $1 個版本：',
    continue: '繼續',

    // 確認操作
    confirmRemoveTag: '確認移除標籤',
    confirmRemoveTagMessage: '確定要從 $1 個項目中移除標籤 $2 嗎？',
    contentWillBeKept: '所有內容都會保留，只是失去此標籤。',
    confirmRemove: '確認移除',
    dangerousOperation: '危險操作：刪除內容',
    permanentDeleteWarning: '這將永久刪除所有相關內容！',
    confirmInputPrompt: '確認操作請輸入：$1',
    confirmInputPlaceholder: '刪除$1',
    confirmExecute: '確認執行',
    deleteConfirmPrefix: '',
    confirmDeleteContent: '確認刪除內容',
    confirmDeleteContentMessage: '確定要刪除 $1 個項目中包含標籤 $2 的所有版本嗎？',
    thisActionCannotBeUndone: '此操作無法撤銷。',
    confirmDelete: '確認刪除',

    // 分類標題
    categoryCharacterCards: '角色卡:',
    categoryLoveyDoveyCharacters: '卿卿我我:',
    categoryUserPersonas: '玩家角色:',
    categoryWorldBooks: '世界書:',
    categoryNotebooks: '筆記本:',

    // ========================================
    // 16. 圖片處理功能
    // ========================================
    cropImage: '裁切圖片',
    cropTitle: '裁切圖片 ($1 - $2)',
    confirmCrop: '確認裁切',
    outputQuality: '輸出品質',
    standardVersion: '標準版',
    hdVersion: '高清版',
    squareRatio: '正方形',
    verticalRatio: '豎直矩形',
    cropFailed: '裁切失敗：裁切區域無效。',
    imageLoadFailed: '圖片載入失敗',

    // ========================================
    // 17. 預設名稱與字串
    // ========================================
    defaultCharacterName: '角色',
    defaultLorebookName: '世界書',
    defaultNotebookName: '筆記本', 
    defaultUserPersonaName: '玩家角色',
    defaultVersionName: '版本',
    defaultField: '格子',
    copyPrefix: ' - 副本',
    defaultVersionNumber: '版本 $1',
    defaultImportedVersion: '匯入版本',
    importedFromFile: '從檔案匯入的世界書',
    importedVersion: '匯入版本',
    importedFromBook: '從「$1」匯入',
    importedTheme: '匯入的主題',
    unnamedItem: '未命名項目',
    secretMark: ' [秘密]',
    modifiedSuffix: '_已修改',


    // 說明
    helpTitle: '使用說明',
    helpUsageTitle: '重要必讀',
    helpUsageContent: '目前為beta測試版，有資料丟失、匯出匯入失敗、欄位缺漏等風險，請另行備份內容以防遺失！<br><br>所有資料僅儲存在瀏覽器中，備份請點擊側邊欄底下的齒輪選單：<br>• 點選「匯出完整備份」保存整個網站資料。<br>• 在編輯頁面匯出單獨檔案。',
    helpFeaturesTitle: '雙頁面同步編輯',
    helpFeaturesContent: '• 同項目：進入編輯頁面後點擊右上角的「對比」選擇項目。<br>• 跨類別／跨項目同步編輯：點擊側邊欄的「雙屏編輯」按鈕。',
    helpTipsTitle: '其他',
    helpTipsContent: '• 齒輪選單中的「其他設定」可以隱藏「卿卿我我」類別。<br>• 世界書只有「自訂排序」模式。<br>• 沒有自動儲存功能，請愛用Crtl+S或側邊欄的儲存按鈕儲存進度。<br>• 沒有手機版，請用ipad或電腦瀏覽。<br>• 英文版全靠Gemini翻譯，可能會很怪。',

    //聯絡
    contactTitle: 'Feedback',
    contactMethodsTitle: '準備中',
    contactMethodsContent: '準備中'

};