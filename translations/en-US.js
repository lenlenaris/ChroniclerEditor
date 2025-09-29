// English Translation File
// Chronicler Editor - English Translations (Localized & Polished)

window.ChroniclerTranslations = window.ChroniclerTranslations || {};
window.ChroniclerTranslations['en-US'] = {
    
    // ========================================
    // 1. Application Base
    // ========================================
    appTitle: 'Chronicler Editor',
    appSubtitle: 'All data is stored locally in your browser. Please back up your data regularly to prevent loss.',
    footerDataNotice: 'All data is stored locally in your browser. Please back up your data regularly to prevent loss.',
    
    // Language Toggle
    languageChinese: '繁體中文',
    languageEnglish: 'English',
    langToggleZh: 'Switch Language (Traditional Chinese)',
    langToggleEn: 'Switch Language (English)',
    
    // Common Status
    comingSoon: 'Coming Soon...',
    
    // ========================================
    // 2. Navigation & Sidebar
    // ========================================
    character: 'Character',
    worldBook: 'Lorebook',
    userPersona: 'Persona',
    loveydovey: 'LoveyDovey',
    customFields: 'Notebook',
    item: 'Item',
    selectAll: 'Select All',
    tagFilter: 'Tag Filter',
    selectedCount: 'Selected: ',
    deleteSelected: 'Delete Selected',
    
    // Sidebar Buttons
    addCharacter: 'Create Character',
    addWorldBook: 'Create Lorebook',
    addUserPersona: 'Create Persona',
    createLoveydovey: 'Create Lovey-Dovey Character',
    newNotebook: 'New Notebook',
    addCustomField: 'New Notebook', // Kept as is, assuming it performs the same action as newNotebook
    searchContent: 'Search',
    dualScreenEdit: 'Dual Screen',

    // Control Bar
    searchPlaceholder: 'Search by name...',
    sortNewestFirst: 'Date Created (Newest First)',
    sortOldestFirst: 'Date Created (Oldest First)',
    sortNameAsc: 'Name (A-Z)', 
    sortNameDesc: 'Name (Z-A)',
    sortTimeDesc: 'Last Edited (Recent)',
    sortTimeAsc: 'Last Edited (Oldest)',
    sortTokensDesc: 'Tokens (High to Low)',
    sortTokensAsc: 'Tokens (Low to High)',
    customSort: 'Custom Sort',
    tooltipAddCharacter: 'New Character',
    tooltipAddUserPersona: 'New Persona',
    tooltipAddLoveydovey: 'New LoveyDovey Character', 
    tooltipAddWorldbook: 'New Lorebook',
    tooltipAddCustom: 'New Notebook',
    tooltipImportCharacter: 'Import Character Card',
    tooltipImportWorldbook: 'Import Lorebook', 
    tooltipBatchEdit: 'Batch Edit',
    tooltipTagFilter: 'Tag Filter',
    tooltipSortDropdown: 'Item Sorting Method\nDrag to customize order',
    
    // Dual Screen Editing
    dualScreenSelector: 'Dual Screen Selector', 
    dualScreenDescription: 'Select two items for side-by-side editing. Compare different types too!',
    startDualScreen: 'Start Dual Screen',
    recentCombinations: 'Recently Used',
    clear: 'Clear',


    // Favorite functionality
    tooltipManageFavorites: 'Manage Favorites',
    applyFavoriteChanges: 'Apply Changes', 
    favoriteChangesApplied: 'Favorite settings updated',
    selectedFavoriteCount: 'Selected for favorites: ',
    toggleFavorite: 'Set Favorite',
    foldersCannotBeAddedToFavorites: 'Folders can\'t be added to favorites.',

    // Folder related
    moveToFolder: 'Move',
    selectTargetFolder: 'Select Target Folder',
    createNewFolder: 'Create New Folder',
    moveToRoot: 'Move to Root',
    enterFolderName: 'Enter folder name',
    moveToRootComplete: 'Items moved to main page',
    moveToFolderComplete: 'Items moved to folder',
    folder: 'Folder',
    folders: 'Folders',
    files: 'Files',
    pleaseSelectItemsFirst: 'Please select items first',
    renameFolder: 'Rename',
    dissolveFolder: 'Dissolve Folder',
    deleteFolder: 'Delete Folder',
    enterNewFolderName: 'Enter new folder name',
    folderRenamedSuccess: 'Folder renamed successfully',
    folderRenameError: 'Failed to rename folder',
    dissolveFolderConfirm: 'Dissolve this folder? Items will return to root directory.',
    folderDissolvedSuccess: 'Folder dissolved, items returned to root',
    folderDissolveError: 'Failed to dissolve folder',
    deleteFolderConfirm: 'Delete this folder? All items inside will also be deleted!',
    deleteFolderDoubleConfirm: '⚠️ This action cannot be undone! Delete folder and all contents?',
    folderDeletedSuccess: 'Folder and contents deleted',
    folderDeleteError: 'Failed to delete folder',
    cannotMixSelectTypes: 'Cannot select both characters and folders',
    dissolveFolders: 'Dissolve Folders',
    deleteFolders: 'Delete Folders',
    dissolveFoldersConfirm: 'Dissolve selected folders?',
    foldersDeletedSuccess: 'Folders deleted successfully',
    foldersDissolvedAndMovedComplete: 'Folders dissolved and contents moved',
    foldersDissolvedToRootComplete: 'Folders dissolved, contents returned to root',
    moveSelectedFolders: 'Move folder contents to:',
    moveSelectedItems: 'Move selected items to:',
    folderCreatedSuccess: 'Folder created successfully',
    folderContentsMovedComplete: 'Folder contents moved successfully',
    folderContentsMovedToRootComplete: 'Folder contents moved to main page',
    deselectToCreateFolder: 'Deselect items to create new folder',
    organise: 'Organise',

    // New batch edit buttons
    selectAllCharacters: 'Select All Characters',
    selectAllWorldBooks: 'Select All Lorebooks',
    selectAllNotebooks: 'Select All Notebooks', 
    selectAllFolders: 'Select All Folders',
    newFolder: 'New Folder',
    noFoldersInSubfolder: 'No folders to select in subfolder',
    noFoldersToSelect: 'No folders to select',
    folderOpen: 'Open Folder',
    rightClickCopy: 'Copy',
    rightClickDelete: 'Delete',

    // ========================================
    // 3. Character Management
    // ========================================
    // Basic Information
    characterName: 'Character Name',
    creator: 'Creator',
    charVersion: 'Version',
    creatorNotes: 'Creator\'s Notes',
    tags: 'Tags',
    
    // Character Content Fields
    description: 'Description',
    personality: 'Personality Summary',
    scenario: 'Scenario',
    dialogue: 'Examples of Dialogue',
    firstMessage: 'First Message',
    
    // Alternate Greetings
    alternateGreetings: 'Alternate Greetings',
    alternateGreeting: 'Alternate Greeting',
    manageAlternateGreetings: 'Manage Alternate Greetings',
    addAlternateGreeting: 'Add Alternate Greeting',
    alternateGreetingPlaceholder: 'Enter an alternate first message...',
    noAlternateGreetings: 'No alternate greetings have been added.',
    maxAlternateGreetingsReached: 'You can add a maximum of 10 alternate greetings.',
    deleteAlternateGreetingConfirm: 'Are you sure you want to delete this alternate greeting?\n\n⚠️ This action cannot be undone!',

    // Character Operations
    deleteCharacter: 'Delete Character',
    copyCharacter: 'Duplicate Character',
    exportCharacter: 'Export Character',
    importCharacter: 'Import Character',
    selectCharacter: 'Please select a character',
    selectImage: 'Select Image',
    createOrImport: 'Click to Create<br>or<br>Drag & Drop to Import',
    
    // Character Field Placeholders
    creatorPlaceholder: 'Botmaker\'s name / Contact info (optional)',
    versionPlaceholder: 'Version name or number (e.g., v1.2)',
    notesPlaceholder: 'Describe the character, give use tips, or list the chat models it works best with...',
    tagsPlaceholder: 'Write a comma-separated list of tags...',
    descPlaceholder: 'Describe the character\'s appearance, backstory, setting, etc...',
    personalityPlaceholder: 'Describe the character\'s traits, speech patterns, behaviors, etc...',
    scenarioPlaceholder: 'Describe the context, environment, or situation the character is in...',
    dialoguePlaceholder: 'Examples of how the character speaks and interacts...',
    firstMsgPlaceholder: 'The very first message the character will send...',
    
    // ========================================
    // 4. Lorebook Management
    // ========================================
    // Lorebook Basic Information
    worldBookName: 'Lorebook Name',
    characterWorldBookName: "$1's Lorebook",
    worldBookDesc: 'Lorebook Description',
    lorebookEntries: 'Entries',
    entriesCount: 'Entries',
    unknownWorldBook: 'Unknown Lorebook',

    // Lorebook Operations
    deleteWorldBook: 'Delete Lorebook',
    copyWorldBook: 'Duplicate Lorebook',
    exportWorldBook: 'Export Lorebook',
    importWorldBook: 'Import Lorebook',
    unknownVersion: 'Unknown Version',
    worldBookBound: 'Linked to Lorebook: "$1 - $2"',
    worldBookBindingCleared: 'Lorebook link removed',
    noWorldBookBinding: 'No Lorebook Linked',

    // Entry Management
    addEntry: 'New Entry',
    deleteEntry: 'Delete Entry',
    copyEntry: 'Duplicate Entry',
    entryName: 'Entry Name',
    entryTitle: 'Entry Title/Memo',
    entryTitleComment: 'Title / Note',
    entryUID: 'UID',
    entryEnabled: 'Enabled',

    // Keywords Settings
    keywords: 'Keywords',
    primaryKeywords: 'Primary Keywords',
    secondaryKeys: 'Secondary Keywords',
    secondaryFilters: 'Optional Filter',
    keywordLogic: 'Logic',
    logicContainsAny: 'AND ANY',
    logicNotFullyContains: 'NOT ALL', 
    logicContainsNone: 'NOT ANY',
    logicContainsAll: 'AND ALL',

    // Entry Content
    entryContent: 'Content',
    entryContentLabel: 'Content',
    entryComment: 'Comment',

    // Trigger Settings
    triggerMode: 'Mode',
    triggerStrategy: 'Strategy',
    triggerPercent: 'Trigger %',
    selectiveMode: 'Selective',
    constantMode: 'Constant',
    beforeCharDefs: '↑ Character Definitions',
    afterCharDefs: '↓ Character Definitions',
    topAuthorNote: "↑ Author's Note", 
    bottomAuthorNote: "↓ Author's Note",
    atDepth: '@D ⚙️ At System Depth', // 備份
    beforeExampleMsg: '↑ Example Messages',
    afterExampleMsg: '↓ Example Messages', 
    atSystemDepth: '@D ⚙️ at System Depth',
    atUserDepth: '@D 👤 at User Depth', 
    atAiDepth: '@D 🤖 at Assistant Depth',

    // Insertion Settings
    insertPosition: 'Position',
    insertOrder: 'Order',
    insertionOrder: 'Insertion Order',
    insertDepth: 'Depth',

    // Advanced Settings
    advancedSettings: 'Advanced Settings',
    includeGroups: 'Inclusion Group',
    automationId: 'Automation ID',
    groupPriority: 'Prioritize',
    groupWeight: 'Group Weight',

    // Three-value logic options
    useGlobalSetting: 'Use Global Setting',
    yes: 'Yes',
    no: 'No',

    // Additional Match Sources
    additionalMatchSources: 'Additional Matching Sources',
    matchPersonaDescription: 'Persona Description',
    matchCharacterDescription: 'Character Description', 
    matchCharacterPersonality: 'Character Personality',
    matchCharacterDepthPrompt: 'Character Note',
    matchScenario: 'Scenario',
    matchCreatorNotes: 'Creator Notes',

    // Triggers
    filterToGenerationTriggers: 'Filter to Generation Triggers',
    clickToSelectTriggers: 'All types (default)',
    trigger_normal: 'Normal',
    trigger_continue: 'Continue', 
    trigger_impersonate: 'AI Impersonate User',
    trigger_swipe: 'Swipe',
    trigger_regenerate: 'Regenerate',
    trigger_quiet: 'Quiet',

    // Trigger Control
    enableProbability: 'Enable Trigger Probability',
    probabilityValue: 'Trigger %',
    caseSensitive: 'Case-Sensitive',
    matchWholeWords: 'Whole Words',
    useGroupScoring: 'Group Scoring',

    // Recursion Control
    recursionControl: 'Recursion Control',
    noRecursion: 'Non-recursable (will not be activated by another)',
    preventRecursion: 'Prevent further recursion (will not activate others)',
    delayRecursion: 'Delay until recursion (can only be activated on recursive checking)',

    // Value Settings
    stickyValue: 'Sticky',
    cooldownValue: 'Cooldown',
    delayValue: 'Delay',
    scanDepth: 'Scan Depth',
    scanDepthplaceholder: 'Use Global Setting',
    scanDepthValue: 'Scan Depth',
    recursionLevel: 'Recursion Level',

    // Lorebook Field Placeholders
    keywordsPlaceholder: 'Comma separated list',
    secondaryKeysPlaceholder: 'Comma separated list (ignored if empty)',
    entryContentPlaceholder: 'What this keyword should mean to the AI, sent verbatim',
    entryCommentPlaceholder: 'Add a comment or note for this entry...', //?
    groupPlaceholder: 'Only one entry with the same label',
    automationIdPlaceholder: '(None)',
    noEntries: 'No entries available',
    
    // ========================================
    // 5. Notebook Management
    // ========================================
    // Notebook Basic
    customSection: 'Custom Section',
    sectionName: 'Notebook Name',
    clickToAddNotebook: 'Click to add Notebook',
    
    // Notebook Operations
    copySection: 'Duplicate Notebook',
    deleteSection: 'Delete Notebook',
    
    // Field Management
    addField: 'Add Field',
    fieldName: 'Field Name',
    fieldContent: 'Field Content',
    deleteField: 'Delete Field',
    
    // Notebook Placeholders
    fieldNamePlaceholder: 'Enter a name for this field...',
    customFieldPlaceholder: 'Enter your content here...',
    
    // ========================================
    // 6. User Persona Management
    // ========================================
    userPersonaName: 'Persona Name',
    userPersonaDesc: 'Persona Description',
    copyUserPersona: 'Duplicate Persona',
    deleteUserPersona: 'Delete Persona',
    importUserPersona: 'Import Persona',
    exportUserPersona: 'Export Persona',
    clickToCreatePersona: 'Click to Create a Persona', 
    
    // User Persona Placeholders
    userPersonaDescPlaceholder: 'Describe your persona\'s appearance, background, personality, etc...',
    
    // ========================================
    // 7. Lovey-Dovey Management
    // ========================================
    loveydoveyCharacter: 'LoveyDovey Character',
    clickToCreateLoveydovey: 'Click to Create a LoveyDovey Character',
    
    // Lovey-Dovey Section Titles
    profileSection: 'Profile',
    basicSettingsSection: 'Basic Settings',
    firstChatScenario: 'First Chat Scene',
    detailSettingsSection: 'Detailed Settings',
    creatorEventsSection: 'Creator Events',
    
    // Profile Fields
    age: 'Age',
    occupation: 'Job',
    characterQuote: 'Character\'s Comment',
    publicDescription: 'Narrative',
    gender: 'Gender',
    profileImage: 'Profile Image',
    characterLinkUrl: 'Character Profile URL',
    
    // Gender Options
    male: 'Male',
    female: 'Female',
    unset: 'Not Set',
    
    // Basic Settings Fields
    basicInfo: 'Basic Information',
    speakingStyle: 'Speaking Style and Habit',
    
    // First Chat Scenario
    scenarioScript: 'Situation Script',
    characterDialogue: 'Character\'s Dialogue',
    
    // Detail Settings
    detailedSettings: 'Detailed Settings',
    likes: 'Likes',
    dislikes: 'Dislikes',
    additionalInfo: 'Additional Information',
    additionalTitle: 'Title',
    additionalContent: 'Content',
    addAdditionalInfo: 'Add Additional Information',
    deleteAdditionalInfo: 'Delete',
    
    // Creator Events
    creatorEvents: 'Creator Events',
    creatorEvent: 'Creator Event',
    timeAndPlace: 'Time & Place',
    eventTitle: 'Title',
    eventContent: 'Content',
    isSecret: 'Secret Event',
    secretNarrativeSetting: 'Secret Settings',
    addCreatorEvent: 'Add Event',
    addCreatorEvents: 'Add Creator Event',
    deleteCreatorEvent: 'Delete Event',
    expandEvent: 'Expand',
    collapseEvent: 'Collapse',
    noTitle: '(No Title)',
    unnamedEvent: 'Unnamed Event',
    
    // Lovey-Dovey Placeholders
    characterNamePlaceholder: 'Enter character\'s name',
    agePlaceholder: 'Enter age',
    occupationPlaceholder: 'Enter occupation',
    characterQuotePlaceholder: 'Enter a memorable quote or motto from the character',
    publicDescriptionPlaceholder: 'This public description will be visible to other users',
    characterLinkUrlPlaceholder: 'Paste the character\'s profile URL from LoveyDovey or another site...',
    basicInfoPlaceholder: 'Describe the character\'s basic background, origin, traits, etc...',
    speakingStylePlaceholder: 'Describe the character\'s speech patterns, catchphrases, tone, etc...',
    scenarioScriptPlaceholder: 'Describe the setting and context for the first chat...',
    characterDialoguePlaceholder: 'Provide dialogue examples for the character\'s first interaction...',
    likesPlaceholder: 'List things, activities, or topics the character enjoys...',
    dislikesPlaceholder: 'List things, situations, or topics the character dislikes...',
    additionalTitlePlaceholder: 'Title for this information block...',
    additionalContentPlaceholder: 'Enter the detailed content for this block...',
    timeAndPlacePlaceholder: 'When and where the event takes place...',
    eventTitlePlaceholder: 'Title or name of the event...',
    eventContentPlaceholder: 'Describe the content, background, and impact of this event...',

    // ========================================
    // preset
    // ========================================
    preset: 'Preset',
    presets: 'Presets', 
    tooltipAddPreset: 'Add Preset',
    tooltipImportPreset: 'Import Preset',
    clickToAddPreset: 'Click to Add Preset',
    newPreset: 'New Preset', 
    defaultPresetName: 'New Preset',
    systemPrompts: 'System Prompts',
    editablePrompts: 'Editable Prompts',
    importPreset: 'Import Preset',
    exportPreset: 'Export Preset',
    promptName: 'Prompt Name',
    role: 'Role',
    type: 'Type',
    injection: 'Injection',
    promptContent: 'Prompt Content',
    promptContentPlaceholder: 'Enter prompt content...',
    noPromptsConfigured: 'No prompts configured',
    noPromptsFound: 'No prompts found',
    noRole: 'No Role',
    system: 'System',
    user: 'User',
    assistant: 'Assistant',
    marker: 'Marker',
    editable: 'Editable',
    invalidJSONFormat: 'Invalid JSON format',
    arrayRequired: 'must be an array',
    duplicateIdentifiers: 'Duplicate identifiers found',
    importSuccess: 'Import successful!',
    importError: 'Import failed',
    exportSuccess: 'Export successful!',
    exportError: 'Export failed',
    savePreset: 'Save Preset',
    saveSuccess: 'Save successful!',
    saveError: 'Save failed',
    presetOnlySupportsJSON: 'Preset only supports JSON format',
    invalidPresetFile: 'Invalid preset file format',
    presetParseError: 'Preset file parse error',
    presetAlreadyExists: 'Preset already exists',
    addAsNewPresetVersion: 'Add as new version',
    createAsNewPreset: 'Create as new preset',
    presetImportSuccess: 'Successfully imported preset',
    presetRenamedImportSuccess: 'Successfully imported preset',
    importedFromPreset: 'Imported from preset',
    versionAddedToPreset: 'Version added to preset',
    markdownFormatComingSoon: 'Markdown format coming soon',
    comingSoon: 'Coming Soon',
    relativePosition: 'Relative Position',
    chatPromptManagement: 'Chat Prompt Management', 
    depth: 'Depth',
    order: 'Order',
    position: 'Position',
    markerContentNotEditable: 'This prompt content is extracted from elsewhere and cannot be edited. ',
    source: 'Source',
    promptsCount: 'prompts',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    previewMode: 'Preview Mode',
    exitPreview: 'Exit Preview',
    promptPreview: 'Prompt Preview',
    refresh: 'Refresh',
    noDataAvailable: 'No data available',
    noEnabledPrompts: 'No enabled prompts',
    source: 'Source',
    monospaceFont: 'Monospace Font',
    serifFont: 'Serif Font',
    calculating: 'Calculating...',
    enabledPrompts: 'enabled prompts',
    previewDisabledInCompare: 'Preview is disabled in compare mode',
    itemsPresets: '$1 Presets',

    
    // ========================================
    // 8. Version Control
    // ========================================
    // View Modes
    singleView: 'Solo',
    compareView: 'Dual',
    
    // Version Operations
    addVersion: 'New Version',
    copy: 'Duplicate Version',
    delete: 'Delete',
    unnamedVersion: 'Unnamed Version',
    
    // Compare Functionality
    selectVersionsToCompare: 'Select Versions to Compare',
    selectTwoVersions: 'Please select 2 versions to compare',
    currentSelected: 'Selected',
    startCompare: 'Start Comparison',
    needOneMore: 'Please select 1 more version',
    
    // Version Status
    unsavedChanges: `Unsaved Changes`,
    saveChanged: 'Changes Saved',
    currentVersion: ' (Current)',
    
    // ========================================
    // 9. Import/Export Functions
    // ========================================
    // General Import/Export
    export: 'Export',
    exportData: 'Export Full Backup',
    importData: 'Import from Backup',
    exportLoveydovey: 'Export Lovey-Dovey Character',
    exportNotebook: 'Export Notebook', 
    exportItem: 'Export $1',
    selectVersionsToExport: 'Select Versions to Export',
    selectExportFormat: 'Select Export Format',
    
    // Filename Settings
    filenameSettings: 'Filename Setting', 
    includeVersionInFilename: 'Include version name in filename',
    batchExportNote: 'When batch exporting, the version name will be automatically included in filenames.',

    // World Book Binding
    worldBookBindingConfirm: 'Lorebook Link Confirmation',
    followingVersionsHaveWorldBook: 'Some selected versions are linked to a Lorebook. Export the linked Lorebook as well?',
    exportCharacterOnly: 'No, Export Character Only',
    exportWithWorldBook: 'Yes, Export with Lorebook',
    worldBookBindingExplanation: 'Select "Yes" to embed full Lorebook in the character card.<br>Select "No" to export character card only.',
    
    // Format Options
    exportJSON: 'Export as JSON',
    exportPNG: 'Export as PNG',
    exportTXT: 'Export as TXT',
    exportMarkdown: 'Export as Markdown',
    exportAll: 'Export All Versions',
    
    // Export Dialogs
    selectVersion: 'Select a version to export (1-$1):',
    exportAllTitle: 'Export All Versions',
    exportAllDesc: 'The character "$1" has $2 versions. Please select an export format:',
    jsonFormat: 'JSON Format',
    jsonDesc: 'A plain text format for backups or for use with other compatible tools.',
    pngFormat: 'PNG Card Format',
    pngDesc: 'A character card image that can be directly imported into SillyTavern and other frontends.',
    startExport: 'Start Export',
    exporting: 'Exporting $1 versions...',
    preparing: 'Preparing export...',
    noImage: 'No Image',

    // Full Backup Related
    itemsCharacterCards: '$1 Characters',
    itemsNotebooks: '$1 Notebooks',
    itemsWorldBooks: '$1 Lorebooks', 
    itemsUserPersonas: '$1 Personas',
    itemsLoveyDoveyCharacters: '$1 Lovey-Dovey Characters',
    noItems: 'None',
    customThemes: 'Custom Themes',
    personalSettings: 'Personal Preferences',
    sortPreferences: 'Sorting Preferences',
    dataLabel: 'Data:',
    settingsLabel: 'Settings:',
    
    // ========================================
    // 10. Interface & Theme Settings
    // ========================================
    // Interface Settings
    customInterface: 'Interface',
    interfaceThemeSettings: 'Interface & Theme',
    languageSelection: 'Language',
    otherSettings: 'Other Settings',
    featureDisplay: 'Feature Visibility',
    showLoveyDoveySection: 'Show LoveyDovey Section', 
    loveyDoveyDescription: 'Toggles the visibility of the LoveyDovey section in the sidebar.',
    
    // Theme Management
    themeManagement: 'Theme Management',
    customColor: 'Custom Theme',
    customTheme: 'Theme Colors',
    themeName: 'Theme Name',
    themeSelectionAndOperations: 'Theme Selection',
    saveTheme: 'Save Theme',
    saveAsNewTheme: 'Save as New Theme',
    renameTheme: 'Rename', 
    deleteTheme: 'Delete',
    enterThemeName: 'Enter a name for the new theme:',
    enterNewThemeName: 'Enter the new theme name:',
    restoreDefault: 'Light (Default)',
    eyeCareMode: 'Dark',
    blueMoonTheme: 'Blue Moon',
    lightPurpleTheme: 'Light Purple',
    exportColorTheme: 'Export Theme',
    importColorTheme: 'Import Theme',

    // Color Customization
    colorCustomization: 'Color Customization',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    accentColor: 'Accent Color',
    bgColor: 'Background Color',
    surfaceColor: 'Surface Color (Buttons, Inputs)',
    textColor: 'Text Color',
    textMutedColor: 'Muted Text Color',
    borderColor: 'Border Color',
    headerBgColor: 'Header Background',
    sidebarBgColor: 'Sidebar Background',
    mainContentBgColor: 'Main Content Background',
    contentBgColor: 'Editor Panel Background',
    successColor: 'Success Color',
    warningColor: 'Warning Color',
    dangerColor: 'Danger Color',
    
    // ========================================
    // 11. System Messages
    // ========================================
    // Success Messages
    saved: 'Saved successfully!',
    importSuccess: 'Character imported successfully!',
    versionAddedSuccess: 'New version "$1" was added to character "$2"!',
    importRenamedSuccess: 'Character imported successfully! Renamed to "$1" to avoid a conflict.',
    batchDeleteSuccess: 'Successfully deleted $1 items.',
    worldBookImportSuccess: 'Lorebook "$1" with $2 entries imported successfully!',
    worldBookRenamedImportSuccess: 'Lorebook imported and renamed to "$1"! Contains $2 entries.',
    versionAddedToWorldBook: 'New version "$1" with $3 entries added to Lorebook "$2"!',
    fullDataImportSuccess: 'Full backup of data and settings imported successfully!',
    tagRenameSuccess: 'Tag renamed! $1 items were updated.',
    tagRemoveSuccess: 'Tag "$2" was removed from $1 items.',
    tagDeleteSuccess: 'Deleted $1 items associated with tag "$2".',
    themeSaved: 'Theme "$1" has been saved.',
    newThemeCreated: 'New theme "$1" has been created.',
    themeRenamed: 'Theme has been renamed to "$1".',
    themeDeleted: 'Theme "$1" has been deleted.',
    themeExported: 'Theme "$1" has been exported.',
    themeImportSuccess: 'Theme "$1" imported successfully.',

    // Error Messages
    fileReadError: 'Failed to read the file.',
    unsupportedFileFormat: 'Unsupported file format: $1.',
    invalidPNGFile: 'Invalid PNG file. Could not find the IEND chunk.',
    pleaseSelectAtLeastOneVersion: 'Please select at least one version.',
    pleaseSelectJSONOrPNG: 'Please select a JSON or PNG file.',
    importFailed: 'Import failed: $1',
    worldBookImportFailed: 'Lorebook import failed: $1',
    deleteFailed: 'Deletion failed: $1',
    worldBookNotCharacterCard: 'This appears to be a Lorebook file, not a Character card. Please use the Lorebook tab to import it.',
    invalidCharacterCardFile: 'Invalid file format. Please ensure this is a valid character card.',
    noPNGCharacterData: 'No character data was found in this PNG file.',
    characterFileParseError: 'Failed to parse character file: $1',
    worldBookOnlySupportsJSON: 'Lorebooks only support the JSON format.',
    invalidWorldBookFile: 'Invalid file format. Please select a valid Lorebook file.',
    worldBookParseError: 'Failed to parse Lorebook file: $1',
    fullBackupOnlySupportsJSON: 'Full backups only support the JSON format.',
    invalidBackupFile: 'Invalid file format. Please select a valid backup file.',
    backupParseError: 'Failed to parse backup file: $1',
    invalidThemeFile: 'Invalid theme file format.',
    themeFileReadError: 'Failed to read theme file.',
    pleaseEnterThemeName: 'Please enter a theme name.',

    // Confirmation Dialogs
    deleteConfirm: 'Are you sure you want to delete the character "$1"?\n\n⚠️ This action cannot be undone!',
    deleteWorldBookConfirm: 'Are you sure you want to delete the Lorebook "$1"?\n\n⚠️ This action cannot be undone!',
    deleteNotebookConfirm: 'Are you sure you want to delete the notebook "$1"?\n\n⚠️ This action cannot be undone!',
    deleteUserPersonaConfirm: 'Are you sure you want to delete the persona "$1"?\n\n⚠️ This action cannot be undone!',
    deleteLoveydoveyConfirm: 'Are you sure you want to delete the Lovey-Dovey character "$1"?\n\n⚠️ This action cannot be undone!',
    deleteVersionConfirm: 'Are you sure you want to delete the version "$1"?\n\n⚠️ This action cannot be undone!',
    deleteFieldConfirm: 'Are you sure you want to delete the field "$1"?\n\n⚠️ This action cannot be undone!',
    deleteEntryConfirm: 'Are you sure you want to delete this entry?\n\n⚠️ This action cannot be undone!',
    batchDeleteConfirm: 'Are you sure you want to delete the $1 selected items?\n\n⚠️ This action cannot be undone!',
    unsavedWarning: 'You have unsaved changes. Are you sure you want to leave?',
    detectWorldBookImport: 'The character "$1" contains an embedded Lorebook ("$2") with $3 entries. Would you like to import the Lorebook as well?',
    importWithWorldBook: 'Yes, Import with Lorebook',
    importCharacterOnly: 'No, Import Character Only',
    characterAlreadyExists: 'A character named "$1" already exists.',
    worldBookAlreadyExists: 'A Lorebook named "$1" already exists.',
    addAsNewVersion: 'Add as a new version',
    createAsNewCharacter: 'Create a new, separate character',
    addAsNewWorldBookVersion: 'Add as a new version',
    createAsNewWorldBook: 'Create a new, separate Lorebook',
    confirmFullBackupImport: 'Are you sure you want to import this backup file?\n\nThis will import:\nData: $1\nSettings: $2\n\n⚠️ Warning: This will overwrite ALL current data and settings!',
    confirmDeleteTheme: 'Confirm Delete Theme',
    deleteThemeConfirm: 'Are you sure you want to delete the theme "$1"?',
    operationCannotUndo: 'This action cannot be undone!',
    cannotRenameBuiltin: 'Built-in themes cannot be renamed.',
    cannotDeleteBuiltin: 'Built-in themes cannot be deleted.',

    // Clear Data
    clearAllData: 'Clear All Data',
    clearDataTitle: 'Clear All Data & Settings',
    clearDataWarning: 'DANGEROUS OPERATION',
    clearDataMessage: 'You\'re about to permanently delete all data, including:\n\n• All characters and versions\n• All lorebooks and entries\n• All notebooks\n• All settings and themes\n\nThis can\'t be undone!\n\nWe recommend exporting a backup first.',
    clearDataDesc: 'This will permanently delete all data stored in the browser.',
    clearDataCompleteDesc: 'This operation will reset the application to its initial, empty state.',
    itemsToBeCleared: 'The following will be permanently deleted:',
    allCharacterAndWorldBookData: 'All Characters, Lorebooks, and Notebooks',
    allPersonaAndLoveyDoveyData: 'All Personas and Lovey-Dovey Characters',
    interfaceAndSettingsData: 'All Interface Themes, Settings, and Preferences',
    localCacheData: 'All locally stored application cache',
    suggestBackupFirst: 'It is strongly recommended to back up your data first.',
    clickToExportBackup: 'Click the button below to export a full backup.',
    backupExportComplete: 'Backup Exported Successfully',
    nowSafeToClearData: 'It is now safe to clear your data.',
    finalClearConfirm: 'Final Confirmation',
    finalClearWarning: '⚠️ Final Warning ⚠️\n\nYou\'re about to delete all your data, including characters, lorebooks, notebooks, and settings.\n\nThis can\'t be undone. Proceed?',
    yesDeleteEverything: 'Yes, Delete Everything',
    confirmClearData: 'I understand the risk, clear all data',
    cancelClear: 'Cancel',
    cancelOperation: 'Cancel Operation',
    exportBeforeClear: 'Export Full Backup',
    dataCleared: 'All data has been cleared.',
    pageResetToInitial: 'The application has been reset.',
    clearDataError: 'An error occurred while clearing data. Please refresh the page and try again.',
    
    // Limitation Messages
    needTwoVersions: 'You need at least 2 versions to use the compare feature.',
    keepOneVersion: 'You must keep at least one version.',
    keepOneField: 'You must keep at least one field.',
    maxTwoVersions: 'You can only select a maximum of 2 versions to compare.',
    pleaseSelectItemsFirst: 'Please select one or more items first.', 
    
    // Other
    loadingCharacters: '',
    pleaseWait: 'Loading...',
    clickToUploadImage: 'Click or drag to Upload Image',
    clickToUploadAvatar: 'Click or drag to Upload Avatar',
    enterTagName: 'Enter a tag name...',
    unknownItemType: 'Unknown item type',
    dataLoadError: 'Data failed to load. Please make your selection again.',
    pleaseSelectBothSides: 'Please select an item and version for both the left and right panels.',
    notSelectedYet: 'Not selected',
    selectVersion: 'Select version',
    selectedPrefix: 'Selected: ',

    // ========================================
    // 12. Statistics & Status
    // ========================================
    statisticsInfo: 'Statistics',
    charCount: 'Character Count',
    tokenCount: 'Token Count',
    exportTime: 'Export Time',
    chars: 'chars',
    tokens: 'tokens',
    total: 'Total',
    versionStats: '$1 chars / $2 tokens',
    highest: 'Highest',
    showMore: 'Show More',
    showing: 'Showing',
    
    // ========================================
    // 13. Common Buttons & Actions
    // ========================================
    fullscreenEdit: 'Fullscreen Edit',
    clickToAdd: 'Click to add',
    clickToUpload: 'Click to Upload',
    clickToAddWorldBookOrImport: 'Click to Create a Lorebook or Drag & Drop to Import',
    save: `${IconManager.save({style: 'margin-right: 0px;'})}`, // This contains code, left as is.
    saveData: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    apply: 'Apply',
    addTag: 'New Tag',
    name: 'Name',
    confirm: 'Confirm',
    clickConfirm: 'Click "Confirm" to proceed.', 
    clickCancel: 'Click "Cancel" to abort.',
    searchItems: 'Search items...',
    noItemsOfType: 'There are no items of this type.',
    noMatchingItems: 'No items match your search.',

    // ========================================
    // 14. Search Function
    // ========================================
    searchContent: 'Search',
    searchPlaceholderContent: 'Enter text to search for...',
    searchEmptyState: 'Please enter text to start a search.',
    searchMinChars: 'Please enter at least 2 characters.',
    searchNotFound: 'No results found for "$1".',
    searchResultsCount: 'Found $2 results for "$1"',

    // Search field names
    personalityTraits: 'Personality Traits', 
    plotSetting: 'Plot Setting',
    firstMessageField: 'First Message',
    unsetValue: 'Not Set',
    fieldPrefix: 'Field ',
    fieldSuffix: '',

    // ========================================
    // 15. Tag Management  
    // ========================================
    tagManagement: 'Tag List',
    searchTagsPlaceholder: 'Search tags...',
    noTagsFound: 'No tags have been created yet.',
    tagList: 'Tag List',
    itemCount: '', // Suffix is handled in the strings below
    itemCharacterCards: 'Characters',
    itemLoveyDoveyCharacters: 'LoveyDovey Characters',
    itemUserPersonas: 'Personas', 
    itemWorldBooks: 'Lorebooks',
    itemNotebooks: 'Notebooks',

    // Rename Tag
    renameTag: 'Rename Tag',
    renameTagTo: 'Rename the tag "$1" to:',
    confirmRename: 'Rename',
    tagNameCannotEmpty: 'Tag name cannot be empty.',
    tagAlreadyExists: 'The tag "$1" already exists.',

    // Delete Tag
    deleteTag: 'Delete Tag', 
    selectDeleteMethod: 'You are deleting the tag "$1". Please choose what you want to do:',
    removeTagOnly: 'Remove Tag Only',
    removeTagOnlyDesc: 'Removes the "$1" tag from all associated items. The items themselves will NOT be deleted.',
    deleteAllContent: 'Delete All Items With This Tag',
    deleteAllContentDesc: 'Permanently deletes all items (and their versions) that have the "$1" tag.',
    affectedItemsCount: 'This will affect the following $1 items:',
    willDeleteVersionsCount: 'This will delete the following $1 versions:',
    continue: 'Continue',

    // Confirm Operations
    confirmRemoveTag: 'Confirm Tag Removal',
    confirmRemoveTagMessage: 'Are you sure you want to remove the tag "$2" from $1 items?',
    contentWillBeKept: 'The items themselves will be kept.',
    confirmRemove: 'Confirm Removal',
    dangerousOperation: 'Dangerous Operation: Deleting Content',
    permanentDeleteWarning: 'This will permanently delete all associated content!',
    confirmInputPrompt: 'To confirm, please type "$1" in the box below:',
    confirmInputPlaceholder: 'Delete $1',
    confirmExecute: 'Confirm & Execute',
    deleteConfirmPrefix: '',
    confirmDeleteContent: 'Confirm Delete Content',
    confirmDeleteContentMessage: 'Are you sure you want to delete all versions containing tag $2 from $1 items?',
    thisActionCannotBeUndone: 'This action cannot be undone.',
    confirmDelete: 'Confirm Delete',

    // Category Titles
    categoryCharacterCards: 'Characters:',
    categoryLoveyDoveyCharacters: 'Lovey-Dovey Characters:',
    categoryUserPersonas: 'Personas:',
    categoryWorldBooks: 'Lorebooks:',
    categoryNotebooks: 'Notebooks:',

    // ========================================
    // 16. Image Processing
    // ========================================
    cropImage: 'Crop Image',
    cropTitle: 'Crop Image ($1 - $2)',
    confirmCrop: 'Confirm Crop',
    outputQuality: 'Output Quality',
    standardVersion: 'Standard',
    hdVersion: 'HD',
    squareRatio: 'Square',
    verticalRatio: 'Portrait',
    cropFailed: 'Crop failed: The selected crop area is invalid.',
    imageLoadFailed: 'Failed to load the image.',
    pleaseDropImageFiles: 'Please drop image files',
    pleaseDropSingleImage: 'Please drop only one image at a time',
    dropImageHere: 'Drop image here',

    // ========================================
    // 17. Default Names & Strings
    // ========================================
    defaultCharacterName: 'New Character',
    defaultLorebookName: 'New Lorebook', 
    defaultNotebookName: 'New Notebook',
    defaultUserPersonaName: 'New Persona',
    defaultVersionName: 'New Version',
    defaultField: 'New Field',
    copyPrefix: ' - Copy',
    defaultVersionNumber: 'Version $1',
    defaultImportedVersion: 'Imported Version',
    importedFromFile: 'Imported from File',
    importedVersion: 'Imported Version',
    importedFromBook: 'Imported from "$1"',
    importedTheme: 'Imported Theme',
    unnamedItem: 'Unnamed Item',
    secretMark: ' [Secret]',
    modifiedSuffix: ' (modified)',

    // ========================================
    // 18. Cloud Sync
    // ========================================
    cloudSync: 'Cloud Sync',
    accountStatus: 'Account Status',
    notConnectedToGoogle: 'Not connected to Google account', 
    connectToGoogle: 'Connect to Google',
    cloudOperations: 'Cloud Operations',
    uploadBackup: 'Upload Backup',
    downloadBackup: 'Download Backup',
    cloudSyncDescription: 'Manual operation required: Click buttons to backup to Google Drive, no automatic sync. Automatically keeps latest 5 versions, old files will be cleaned up.',
    connectedToGoogle: 'Connected to Google',
    disconnectFromGoogle: 'Disconnect',
    googleSignInSuccess: 'Google sign in successful',
    googleSignInFailed: 'Google sign in failed',
    googleSignOutSuccess: 'Google sign out successful',
    googleSignOutFailed: 'Google sign out failed',
    googleApiInitFailed: 'Google API initialization failed',
    uploadBackupSuccess: 'Backup uploaded successfully',
    uploadBackupFailed: 'Failed to upload backup',
    downloadBackupFailed: 'Failed to download backup',
    restoreBackupSuccess: 'Backup restored successfully',
    restoreBackupFailed: 'Failed to restore backup',
    selectBackupFile: 'Select backup file to restore',
    noBackupFilesFound: 'No backup files found',
    pleaseSignInAgain: 'Please sign in to Google again',
    oauthError: 'OAuth Error',
    authFailed: 'Authorization Failed',
    googleLoginSuccess: 'Google login successful!',
    googleServicesInitFailed: 'Google services initialization failed, please try again later',
    loginFailed: 'Login Failed',
    unknownError: 'Unknown Error',
    googleLogoutSuccess: 'Logged out from Google account',
    logoutFailed: 'Logout Failed',
    notLoggedInGoogle: 'Not logged in. Please connect your Google account first',
    backupUploadSuccess: 'Backup uploaded successfully!',
    uploadFailed: 'Upload Failed',
    backupNotFound: 'No backup files found',
    backupListFailed: 'Failed to retrieve backup list',
    backupGenerationFailed: 'Failed to generate backup data',
    searchFolderFailed: 'Search folder failed',
    createFolderFailed: 'Create folder failed',
    fileUploadFailed: 'File upload failed',
    fileListFailed: 'Failed to list files',
    fileDownloadFailed: 'File download failed',
    selectBackupFile: 'Select a backup file to restore',
    backupRestoreSuccess: 'Backup restored successfully! The page will now reload...',
    restoreFailed: 'Restore Failed',
    connectedToGoogleDrive: 'Connected to Google Drive',
    canPerformCloudOperations: 'You can perform cloud backup and restore operations',
    disconnect: 'Disconnect',
    processing: 'Processing...',
    restoringBackup: 'Restoring Backup...',
    pleaseLoginFirst: 'Please log in to Google first',
    refreshingGoogleToken: 'Refreshing Google session...',
    tokenRefreshFailed: 'Failed to refresh Google session. Please sign in again.',
    googleAuthSuccess: 'Google authentication successful!',
    googleSessionExpired: 'Your Google session has expired. Please sign in again to continue.',


    helpTitle: 'User Guide',
    helpContent: '<h3 style="color: var(--text-color); margin: 0 0 12px 0; font-size: 1.1em;">Main Features</h3>' +
    'This is a character card editor specifically designed for SillyTavern, supporting version iteration management and dual-pane synchronous editing for any combination such as <strong>Character+Lorebook</strong>／<strong>Character A+Character B</strong>／<strong>Character A+Notebook</strong>.<br><br>' +
    'This tool supports exporting character cards (with optional lorebook binding) to SillyTavern, and importing SillyTavern format character cards and lorebook files for seamless editing and management.<br><br>' +
    '<h3 style="color: var(--text-color); margin: 20px 0 12px 0; font-size: 1.1em;">Disclaimer & Important Notes</h3>' +
    '<h4 style="color: var(--text-color); margin: 0 0 8px 0; font-size: 1em;">🚧 This tool is currently in Beta version. Please note:</h4>' +
    '• <strong>Please backup important content yourself. This site assumes no responsibility for any data loss.</strong><br>' +
    '• Feel free to report issues, but please understand that the beta version may contain unstable elements.<br>' +
    '• All data is stored in your local browser. Clearing browser data will result in content loss.<br>' +
    '• This tool uses a manual saving mechanism with no auto-save function. Please remember to use Ctrl+S or click the 💾 button to save.<br>' +
    '• The interface is primarily designed for desktop use. Mobile devices may experience performance or layout issues.<br><br>' +
    '<h3 style="color: var(--text-color); margin: 20px 0 12px 0; font-size: 1.1em;">Basic Operation Guide</h3>' +
    '<h4 style="color: var(--text-color); margin: 0 0 8px 0; font-size: 1em;">Data Backup Methods</h4>' +
    '• Full backup: Sidebar ⚙️ → "Cloud Sync" or "Export Full Backup"<br>' +
    '• Individual backup: Click "Export" button on the editing page<br><br>' +
    '<h4 style="color: var(--text-color); margin: 0 0 8px 0; font-size: 1em;">Dual-Pane Synchronous Editing</h4>' +
    '• Same item comparison: Enter edit page and click "Dual" button in the top-right corner to select versions.<br>' +
    '• Cross-category item editing: Click "Dual Screen" button in sidebar to configure.<br><br>' +
    '<h4 style="color: var(--text-color); margin: 0 0 8px 0; font-size: 1em;">Tag Function Description</h4>' +
    '• Character card tags remain synchronized with SillyTavern tags. Tags for other types are used only for filtering within this site and do not sync with SillyTavern.<br><br>' +
    '<h4 style="color: var(--text-color); margin: 0 0 8px 0; font-size: 1em;">Other Function Descriptions</h4>' +
    '• Folders currently do not support custom drag sorting functionality.<br>' +
    '• Lorebooks default to "Custom Sort" mode. Entry order will be recorded in JSON files and synchronized when imported to SillyTavern.<br>' +
    '• The "LoveyDovey" AI platform character editing feature can be enabled in "Other Settings" under the gear menu at the bottom of the sidebar.',

    // ========================================
    // 19. Contact & Feedback
    // ========================================
    contactTitle: 'Feedback',
    contactMethodsContent: 'Found a bug or have suggestions? Please report via:<br><br>📋 <a href="https://github.com/lenlenaris/ChroniclerEditor/issues" target="_blank" style="color: var(--accent-color);">GitHub Issues</a><br>🍭 <a href="https://marshmallow-qa.com/wofpdrozz47jwkz?t=bTwcNR&utm_medium=url_text&utm_source=promotion" target="_blank" style="color: var(--accent-color);">Marshmallow</a><br><br><small style="color: var(--text-muted-color); opacity: 0.7;">Created by @lenlenaris with AI assistance (YES I LOVE Claude)</small>'

};