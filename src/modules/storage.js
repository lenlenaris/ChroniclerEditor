//å„²å­˜è³‡æ–™

async function saveData() {
    try {
        // ä½¿ç”¨ IndexedDB å„²å­˜
        const results = await Promise.all([
            characterDB.saveCharacters(characters),
            characterDB.saveCustomSections(customSections),
            characterDB.saveWorldBooks(worldBooks),
            characterDB.saveLoveyDoveyCharacters(loveyDoveyCharacters),
            characterDB.saveUserPersonas(userPersonas)
        ]);

        const allSaved = results.every(result => result === true);
        
        if (allSaved) {
            markAsSaved();
            
            showSaveNotification();
        } else {
            console.warn('âš ï¸ éƒ¨åˆ†è³‡æ–™å„²å­˜å¤±æ•—ï¼Œå·²é™ç´šåˆ° localStorage');
            markAsSaved(); 
            showSaveNotification();
        }
        
        // æ›´æ–°å„²å­˜ç©ºé–“è³‡è¨Š
        showStorageInfo();
        
    } catch (error) {
        console.error('å„²å­˜è³‡æ–™å¤±æ•—ï¼š', error);
        
        // å®Œå…¨é™ç´šåˆ°èˆŠæ–¹æ¡ˆ
        try {
            localStorage.setItem('characterCreatorData', JSON.stringify(characters));
            localStorage.setItem('characterCreatorCustomData', JSON.stringify(customSections));
            localStorage.setItem('characterCreatorWorldBooks', JSON.stringify(worldBooks));
            localStorage.setItem('characterCreatorUserPersonas', JSON.stringify(userPersonas));
            localStorage.setItem('characterCreatorLoveyDoveyCharacters', JSON.stringify(loveyDoveyCharacters));

            
        } catch (fallbackError) {
            console.error('é€£ localStorage éƒ½å„²å­˜å¤±æ•—:', fallbackError);
            if (fallbackError.name === 'QuotaExceededError') {
                showStorageExceededDialog();
            } else {
                alert('å„²å­˜å¤±æ•—ï¼Œè«‹æª¢æŸ¥ç€è¦½å™¨å­˜å„²ç©ºé–“');
            }
        }
    }
}

// éœé»˜ä¿å­˜ï¼ˆä¸é¡¯ç¤ºé€šçŸ¥ï¼‰
async function saveDataSilent() {
    try {
        // ä½¿ç”¨ IndexedDB å„²å­˜
        const results = await Promise.all([
            characterDB.saveCharacters(characters),
            characterDB.saveCustomSections(customSections),
            characterDB.saveUserPersonas(userPersonas),
            characterDB.saveWorldBooks(worldBooks),
            characterDB.saveLoveyDoveyCharacters(loveyDoveyCharacters)
        ]);

        const allSaved = results.every(result => result === true);
        
        if (allSaved) {
            markAsSaved();
            
            // ðŸš« ä¸èª¿ç”¨ showSaveNotification()
        } else {
            console.warn('âš ï¸ éƒ¨åˆ†è³‡æ–™å„²å­˜å¤±æ•—ï¼Œå·²é™ç´šåˆ° localStorage');
            markAsSaved(); 
            // ðŸš« ä¸èª¿ç”¨ showSaveNotification()
        }
        
        // æ›´æ–°å„²å­˜ç©ºé–“è³‡è¨Šï¼ˆä½†ä¸é¡¯ç¤ºé€šçŸ¥ï¼‰
        // showStorageInfo(); // é€™å€‹ä¹Ÿå¯èƒ½æœ‰é€šçŸ¥ï¼Œå…ˆè¨»è§£æŽ‰
        
        return true; // è¿”å›žæˆåŠŸç‹€æ…‹
        
    } catch (error) {
        console.error('éœé»˜å„²å­˜è³‡æ–™å¤±æ•—ï¼š', error);
        
        // å®Œå…¨é™ç´šåˆ°èˆŠæ–¹æ¡ˆ
        try {
            localStorage.setItem('characterCreatorData', JSON.stringify(characters));
            localStorage.setItem('characterCreatorCustomData', JSON.stringify(customSections));
            localStorage.setItem('characterCreatorUserPersonas', JSON.stringify(userPersonas));
            localStorage.setItem('characterCreatorWorldBooks', JSON.stringify(worldBooks));
            localStorage.setItem('characterCreatorLoveyDoveyCharacters', JSON.stringify(loveyDoveyCharacters));
            markAsSaved();
            
            return true;
        } catch (fallbackError) {
            console.error('é€£ localStorage éƒ½å„²å­˜å¤±æ•—:', fallbackError);
            // éœé»˜æ¨¡å¼ä¸‹ä¹Ÿä¸é¡¯ç¤ºéŒ¯èª¤å°è©±æ¡†ï¼Œåªåœ¨æŽ§åˆ¶å°è¨˜éŒ„
            return false;
        }
    }
}

async function loadData() {
    try {
        // åˆå§‹åŒ– IndexedDB
        const dbInitialized = await characterDB.init();
        
        if (dbInitialized) {
            // æª¢æŸ¥æ˜¯å¦éœ€è¦é·ç§» localStorage è³‡æ–™
            const isMigrated = await characterDB.checkMigrationStatus();
            if (!isMigrated) {
                await characterDB.migrateFromLocalStorage();
            }

            // å¾ž IndexedDB è¼‰å…¥è³‡æ–™
            characters = await characterDB.loadCharacters();
            customSections = await characterDB.loadCustomSections();
            worldBooks = await characterDB.loadWorldBooks();
            userPersonas = await characterDB.loadUserPersonas();
            loveyDoveyCharacters = await characterDB.loadLoveyDoveyCharacters();
            
            
        } else {
            // é™ç´šåˆ° localStorage
            const saved = localStorage.getItem('characterCreatorData');
            if (saved) {
                characters = JSON.parse(saved);
            }

            const savedLoveyDoveyCharacters = localStorage.getItem('characterCreatorLoveyDoveyCharacters');
            if (savedLoveyDoveyCharacters) {
                loveyDoveyCharacters = JSON.parse(savedLoveyDoveyCharacters);
            }

            const savedCustom = localStorage.getItem('characterCreatorCustomData');
            if (savedCustom) {
                customSections = JSON.parse(savedCustom);
            }

            const savedWorldBooks = localStorage.getItem('characterCreatorWorldBooks');
            if (savedWorldBooks) {
                worldBooks = JSON.parse(savedWorldBooks);
            }

            const savedUserPersonas = localStorage.getItem('characterCreatorUserPersonas');  //  æ–°å¢ž
            if (savedUserPersonas) {
                userPersonas = JSON.parse(savedUserPersonas);
            }
            
            
        }

        characters.forEach(character => {
            if (character.versions) {
                character.versions.forEach(version => {
                    if (!version.alternateGreetings) {
                        version.alternateGreetings = [];
                    }
                });
            }
        });

        // è¨­å®šåˆå§‹ç‹€æ…‹ - ä¿æŒé¦–é ç‹€æ…‹ï¼Œä¸è‡ªå‹•é¸æ“‡ä»»ä½•é …ç›®
        isHomePage = true;
        currentCharacterId = null;
        currentVersionId = null;
        currentCustomSectionId = null;
        currentCustomVersionId = null;
        currentWorldBookId = null;
        currentWorldBookVersionId = null;
        currentUserPersonaId = null;
        currentUserPersonaVersionId = null;
        currentLoveyDoveyId = null;
        currentLoveyDoveyVersionId = null;
        
        markAsSaved();
        // é·ç§»èˆŠè³‡æ–™çš„æ™‚é–“æˆ³
        TimestampManager.migrateOldData();

        // æ¢å¾©æ‰€æœ‰é …ç›®çš„ç‰ˆæœ¬æŽ’åº
try {
    [
        { type: 'character', items: characters },
        { type: 'worldbook', items: worldBooks },
        { type: 'custom', items: customSections },
        { type: 'loveydovey', items: loveyDoveyCharacters } 
    ].forEach(({ type, items }) => {
        items.forEach(item => {
            const savedVersionOrder = DragSortManager.loadVersionOrder(type, item.id);
            if (savedVersionOrder) {
                DragSortManager.applyVersionOrder(type, item.id, savedVersionOrder);
            }
        });
    });
    
} catch (error) {
    console.warn('æ¢å¾©ç‰ˆæœ¬æŽ’åºå¤±æ•—:', error);
}
        
        // é¡¯ç¤ºå„²å­˜ç©ºé–“è³‡è¨Š
        showStorageInfo();
        
    } catch (error) {
        console.error('è¼‰å…¥è³‡æ–™å¤±æ•—ï¼š', error);
        // ç¢ºä¿æœ‰åŸºæœ¬è³‡æ–™çµæ§‹
        characters = characters || [];
        customSections = customSections || [];
        worldBooks = worldBooks || [];
        loveyDoveyCharacters = loveyDoveyCharacters || [];
    }

      //  åˆå§‹åŒ– Token ç·©å­˜ç®¡ç†å™¨
    TokenCacheManager.init();
    
    //  å®šæœŸæ¸…ç†éŽæœŸç·©å­˜
    TokenCacheManager.cleanup();
    
    
}

 // IndexedDB ç®¡ç†å™¨
    class CharacterDB {
    constructor() {
        this.db = null;
        this.dbName = 'CharacterCreatorDB';
        this.version = 7;
        this.isSupported = 'indexedDB' in window;
    }

    // åˆå§‹åŒ–è³‡æ–™åº«
    async init() {
        if (!this.isSupported) {
            
            return false;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
    const error = event.target.error;
    console.error('IndexedDB é–‹å•Ÿå¤±æ•—è©³æƒ…:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        userAgent: navigator.userAgent,
        // ðŸš« ç§»é™¤ awaitï¼Œç›´æŽ¥é¡¯ç¤ºç€è¦½å™¨ä¿¡æ¯
        isLikelyPrivateMode: this.isLikelyPrivateMode()
    });
    console.error('é™ç´šåˆ° localStorage');
    resolve(false);
};

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // å‰µå»ºè§’è‰²è¡¨æ ¼
                if (!db.objectStoreNames.contains('characters')) {
                    const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
                    characterStore.createIndex('name', 'name', { unique: false });
                }

                // å‰µå»ºå¿å¿æˆ‘æˆ‘è¡¨æ ¼
                if (!db.objectStoreNames.contains('loveyDoveyCharacters')) {
                    const loveyDoveyStore = db.createObjectStore('loveyDoveyCharacters', { keyPath: 'id' });
                    loveyDoveyStore.createIndex('name', 'name', { unique: false });
                }
                
                // å‰µå»ºè‡ªå®šç¾©å€å¡Šè¡¨æ ¼
                if (!db.objectStoreNames.contains('customSections')) {
                    const customStore = db.createObjectStore('customSections', { keyPath: 'id' });
                    customStore.createIndex('name', 'name', { unique: false });
                }
                
                // å‰µå»ºä¸–ç•Œæ›¸è¡¨æ ¼
                if (!db.objectStoreNames.contains('worldBooks')) {
                    const worldBookStore = db.createObjectStore('worldBooks', { keyPath: 'id' });
                    worldBookStore.createIndex('name', 'name', { unique: false });
                }

                //  å‰µå»ºçŽ©å®¶è§’è‰²è¡¨æ ¼
                if (!db.objectStoreNames.contains('userPersonas')) {
                    const userPersonaStore = db.createObjectStore('userPersonas', { keyPath: 'id' });
                    userPersonaStore.createIndex('name', 'name', { unique: false });
                }

                // å‰µå»ºè¨­å®šè¡¨æ ¼
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    //  æ·»åŠ åˆ° CharacterDB é¡žåˆ¥ä¸­ï¼ˆåŒæ­¥ç‰ˆæœ¬ï¼‰
isLikelyPrivateMode() {
    // ç°¡å–®çš„ç§äººæ¨¡å¼æª¢æ¸¬ï¼ˆåŒæ­¥ï¼‰
    try {
        // æª¢æŸ¥ localStorage æ˜¯å¦å¯ç”¨
        localStorage.setItem('test-private', 'test');
        localStorage.removeItem('test-private');
        
        // æª¢æŸ¥ sessionStorage æ˜¯å¦å¯ç”¨
        sessionStorage.setItem('test-private', 'test');
        sessionStorage.removeItem('test-private');
        
        // å¦‚æžœéƒ½å¯ç”¨ä½† IndexedDB å¤±æ•—ï¼Œå¯èƒ½ä¸æ˜¯ç§äººæ¨¡å¼
        return false;
    } catch {
        // å¦‚æžœé€£ localStorage éƒ½ä¸èƒ½ç”¨ï¼Œå¾ˆå¯èƒ½æ˜¯ç§äººæ¨¡å¼
        return true;
    }
}

    //  æ·»åŠ åˆ° CharacterDB é¡žåˆ¥ä¸­
async detectPrivateMode() {
    try {
        // å˜—è©¦å‰µå»ºä¸€å€‹æ¸¬è©¦è³‡æ–™åº«
        const testDB = indexedDB.open('test-private-mode');
        return new Promise((resolve) => {
            testDB.onsuccess = () => {
                indexedDB.deleteDatabase('test-private-mode');
                resolve(false); // ä¸æ˜¯ç§äººæ¨¡å¼
            };
            testDB.onerror = () => resolve(true); // å¯èƒ½æ˜¯ç§äººæ¨¡å¼
        });
    } catch {
        return true;
    }
}

    // å„²å­˜è§’è‰²è³‡æ–™
    async saveCharacters(charactersData) {
        if (!this.db) return this.fallbackSave('characterCreatorData', charactersData);

        try {
            const transaction = this.db.transaction(['characters'], 'readwrite');
            const store = transaction.objectStore('characters');
            
            // æ¸…ç©ºç¾æœ‰è³‡æ–™
            await this.clearStore(store);
            
            // å­˜å…¥æ–°è³‡æ–™
            for (const character of charactersData) {
                await this.addToStore(store, character);
            }
            
            return true;
        } catch (error) {
            console.error('IndexedDB å„²å­˜å¤±æ•—ï¼Œä½¿ç”¨ localStorage:', error);
            return this.fallbackSave('characterCreatorData', charactersData);
        }
    }

    // è¼‰å…¥è§’è‰²è³‡æ–™
    async loadCharacters() {
        if (!this.db) return this.fallbackLoad('characterCreatorData');

        try {
            const transaction = this.db.transaction(['characters'], 'readonly');
            const store = transaction.objectStore('characters');
            const result = await this.getAllFromStore(store);
            return result || [];
        } catch (error) {
            console.error('IndexedDB è¼‰å…¥å¤±æ•—ï¼Œä½¿ç”¨ localStorage:', error);
            return this.fallbackLoad('characterCreatorData');
        }
    }

    // å„²å­˜è‡ªå®šç¾©å€å¡Š
    async saveCustomSections(customData) {
        if (!this.db) return this.fallbackSave('characterCreatorCustomData', customData);

        try {
            const transaction = this.db.transaction(['customSections'], 'readwrite');
            const store = transaction.objectStore('customSections');
            
            await this.clearStore(store);
            for (const section of customData) {
                await this.addToStore(store, section);
            }
            return true;
        } catch (error) {
            console.error('IndexedDB å„²å­˜è‡ªå®šç¾©è³‡æ–™å¤±æ•—:', error);
            return this.fallbackSave('characterCreatorCustomData', customData);
        }
    }

    // è¼‰å…¥è‡ªå®šç¾©å€å¡Š
    async loadCustomSections() {
        if (!this.db) return this.fallbackLoad('characterCreatorCustomData');

        try {
            const transaction = this.db.transaction(['customSections'], 'readonly');
            const store = transaction.objectStore('customSections');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('IndexedDB è¼‰å…¥è‡ªå®šç¾©è³‡æ–™å¤±æ•—:', error);
            return this.fallbackLoad('characterCreatorCustomData');
        }
    }

    // å„²å­˜çŽ©å®¶è§’è‰²
    async saveUserPersonas(userPersonasData) {
        if (!this.db) return this.fallbackSave('characterCreatorUserPersonas', userPersonasData);

        try {
            const transaction = this.db.transaction(['userPersonas'], 'readwrite');
            const store = transaction.objectStore('userPersonas');
            
            await this.clearStore(store);
            for (const userPersona of userPersonasData) {
                await this.addToStore(store, userPersona);
            }
            return true;
        } catch (error) {
            console.error('IndexedDB å„²å­˜çŽ©å®¶è§’è‰²å¤±æ•—:', error);
            return this.fallbackSave('characterCreatorUserPersonas', userPersonasData);
        }
    }

    // è¼‰å…¥çŽ©å®¶è§’è‰²
    async loadUserPersonas() {
        if (!this.db) return this.fallbackLoad('characterCreatorUserPersonas');

        try {
            const transaction = this.db.transaction(['userPersonas'], 'readonly');
            const store = transaction.objectStore('userPersonas');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('IndexedDB è¼‰å…¥çŽ©å®¶è§’è‰²å¤±æ•—:', error);
            return this.fallbackLoad('characterCreatorUserPersonas');
        }
    }

    // å„²å­˜å¿å¿æˆ‘æˆ‘è§’è‰²
    async saveLoveyDoveyCharacters(loveyDoveyData) {
        if (!this.db) return this.fallbackSave('characterCreatorLoveyDoveyCharacters', loveyDoveyData);

        try {
            const transaction = this.db.transaction(['loveyDoveyCharacters'], 'readwrite');
            const store = transaction.objectStore('loveyDoveyCharacters');
            
            await this.clearStore(store);
            for (const character of loveyDoveyData) {
                await this.addToStore(store, character);
            }
            return true;
        } catch (error) {
            console.error('IndexedDB å„²å­˜å¿å¿æˆ‘æˆ‘è§’è‰²å¤±æ•—:', error);
            return this.fallbackSave('characterCreatorLoveyDoveyCharacters', loveyDoveyData);
        }
    }

    // è¼‰å…¥å¿å¿æˆ‘æˆ‘è§’è‰²
    async loadLoveyDoveyCharacters() {
        if (!this.db) return this.fallbackLoad('characterCreatorLoveyDoveyCharacters');

        try {
            const transaction = this.db.transaction(['loveyDoveyCharacters'], 'readonly');
            const store = transaction.objectStore('loveyDoveyCharacters');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('IndexedDB è¼‰å…¥å¿å¿æˆ‘æˆ‘è§’è‰²å¤±æ•—:', error);
            return this.fallbackLoad('characterCreatorLoveyDoveyCharacters');
        }
    }

    // å„²å­˜ä¸–ç•Œæ›¸
    async saveWorldBooks(worldBooksData) {
        if (!this.db) return this.fallbackSave('characterCreatorWorldBooks', worldBooksData);

        try {
            const transaction = this.db.transaction(['worldBooks'], 'readwrite');
            const store = transaction.objectStore('worldBooks');
            
            await this.clearStore(store);
            for (const worldBook of worldBooksData) {
                await this.addToStore(store, worldBook);
            }
            return true;
        } catch (error) {
            console.error('IndexedDB å„²å­˜ä¸–ç•Œæ›¸å¤±æ•—:', error);
            return this.fallbackSave('characterCreatorWorldBooks', worldBooksData);
        }
    }

    // è¼‰å…¥ä¸–ç•Œæ›¸
    async loadWorldBooks() {
        if (!this.db) return this.fallbackLoad('characterCreatorWorldBooks');

        try {
            const transaction = this.db.transaction(['worldBooks'], 'readonly');
            const store = transaction.objectStore('worldBooks');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('IndexedDB è¼‰å…¥ä¸–ç•Œæ›¸å¤±æ•—:', error);
            return this.fallbackLoad('characterCreatorWorldBooks');
        }
    }

    // å·¥å…·å‡½æ•¸ï¼šæ¸…ç©ºè¡¨æ ¼
    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // å·¥å…·å‡½æ•¸ï¼šæ·»åŠ åˆ°è¡¨æ ¼
    addToStore(store, data) {
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // å·¥å…·å‡½æ•¸ï¼šå–å¾—æ‰€æœ‰è³‡æ–™
    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // é™ç´šåˆ° localStorage
    fallbackSave(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('localStorage ä¹Ÿå„²å­˜å¤±æ•—:', error);
            return false;
        }
    }

    fallbackLoad(key) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('localStorage è¼‰å…¥å¤±æ•—:', error);
            return [];
        }
    }

    // è¨ˆç®— IndexedDB ä½¿ç”¨é‡
    async getStorageEstimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: Math.round(estimate.usage / 1024 / 1024), // MB
                    total: Math.round(estimate.quota / 1024 / 1024), // MB
                    available: Math.round((estimate.quota - estimate.usage) / 1024 / 1024) // MB
                };
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    // é·ç§» localStorage è³‡æ–™åˆ° IndexedDB
    async migrateFromLocalStorage() {
        if (!this.db) return false;

        try {
            
            
            // é·ç§»è§’è‰²è³‡æ–™
            const oldCharacters = this.fallbackLoad('characterCreatorData');
            if (oldCharacters.length > 0) {
                await this.saveCharacters(oldCharacters);
                
            }

            // é·ç§»è‡ªå®šç¾©å€å¡Š
            const oldCustom = this.fallbackLoad('characterCreatorCustomData');
            if (oldCustom.length > 0) {
                await this.saveCustomSections(oldCustom);
                
            }

            // é·ç§»ä¸–ç•Œæ›¸
            const oldWorldBooks = this.fallbackLoad('characterCreatorWorldBooks');
            if (oldWorldBooks.length > 0) {
                await this.saveWorldBooks(oldWorldBooks);
                
            }

            // é·ç§»çŽ©å®¶è§’è‰²
            const oldUserPersonas = this.fallbackLoad('characterCreatorUserPersonas');
            if (oldUserPersonas.length > 0) {
                await this.saveUserPersonas(oldUserPersonas);
                
            }

            // é·ç§»å¿å¿æˆ‘æˆ‘è§’è‰²
            const oldLoveyDoveyCharacters = this.fallbackLoad('characterCreatorLoveyDoveyCharacters');
            if (oldLoveyDoveyCharacters.length > 0) {
                await this.saveLoveyDoveyCharacters(oldLoveyDoveyCharacters);
                
            }

            // æ¨™è¨˜å·²é·ç§»
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            await this.addToStore(store, { key: 'migrated', value: true, date: new Date().toISOString() });

            
            return true;
        } catch (error) {
            console.error('è³‡æ–™é·ç§»å¤±æ•—:', error);
            return false;
        }
    }

    // æª¢æŸ¥æ˜¯å¦å·²é·ç§»
    async checkMigrationStatus() {
        if (!this.db) return false;

        try {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get('migrated');
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    resolve(!!request.result);
                };
                request.onerror = () => resolve(false);
            });
        } catch (error) {
            return false;
        }
    }
}

async function showStorageInfo() {
    const estimate = await characterDB.getStorageEstimate();
    if (estimate) {
        const usagePercent = Math.round((estimate.used / estimate.total) * 100);
        
        
        // å¦‚æžœä½¿ç”¨è¶…éŽ 80%ï¼Œé¡¯ç¤ºè­¦å‘Š
        if (usagePercent > 80) {
            showStorageWarning(estimate.used * 1024); // è½‰æ›ç‚º KB
        }
    }
}

function showStorageWarning(sizeKB) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--warning-color);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 0.9em;
        z-index: 9999;
        box-shadow: var(--shadow-large);
        max-width: 300px;
    `;
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">âš ï¸ å„²å­˜ç©ºé–“è­¦å‘Š</div>
        <div style="font-size: 0.85em;">
            ç›®å‰ä½¿ç”¨ ${Math.round(sizeKB/1024)}MBï¼ŒæŽ¥è¿‘ç€è¦½å™¨é™åˆ¶ã€‚<br>
            å»ºè­°å®šæœŸåŒ¯å‡ºå‚™ä»½è³‡æ–™ã€‚
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 8000);
}

// å‰µå»ºå…¨åŸŸ DB å¯¦ä¾‹
const characterDB = new CharacterDB();
