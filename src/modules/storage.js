
async function saveData() {
    try {
        const results = await Promise.all([
            characterDB.saveCharacters(characters),
            characterDB.saveCustomSections(customSections),
            characterDB.saveWorldBooks(worldBooks),
            characterDB.saveLoveyDoveyCharacters(loveyDoveyCharacters),
            characterDB.saveUserPersonas(userPersonas),
            characterDB.savePresets(presets)
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
        
        showStorageInfo();
        
    } catch (error) {
        try {
            localStorage.setItem('characterCreatorData', JSON.stringify(characters));
            localStorage.setItem('characterCreatorCustomData', JSON.stringify(customSections));
            localStorage.setItem('characterCreatorWorldBooks', JSON.stringify(worldBooks));
            localStorage.setItem('characterCreatorUserPersonas', JSON.stringify(userPersonas));
            localStorage.setItem('characterCreatorLoveyDoveyCharacters', JSON.stringify(loveyDoveyCharacters));
            localStorage.setItem('characterCreatorPresets', JSON.stringify(presets));

            
        } catch (fallbackError) {
            if (fallbackError.name === 'QuotaExceededError') {
                showStorageExceededDialog();
            } else {
                alert('å„²å­˜å¤±æ•—ï¼Œè«‹æª¢æŸ¥ç€è¦½å™¨å­˜å„²ç©ºé–“');
            }
        }
    }
}

async function saveDataSilent() {
    try {
        const results = await Promise.all([
            characterDB.saveCharacters(characters),
            characterDB.saveCustomSections(customSections),
            characterDB.saveUserPersonas(userPersonas),
            characterDB.saveWorldBooks(worldBooks),
            characterDB.saveLoveyDoveyCharacters(loveyDoveyCharacters),
            characterDB.savePresets(presets)
        ]);

        const allSaved = results.every(result => result === true);
        
        if (allSaved) {
            markAsSaved();

        } else {
            console.warn('âš ï¸ éƒ¨åˆ†è³‡æ–™å„²å­˜å¤±æ•—ï¼Œå·²é™ç´šåˆ° localStorage');
            markAsSaved(); 
        }
        
        return true;
        
    } catch (error) {
        console.error('éœé»˜å„²å­˜è³‡æ–™å¤±æ•—ï¼š', error);

        try {
            localStorage.setItem('characterCreatorData', JSON.stringify(characters));
            localStorage.setItem('characterCreatorCustomData', JSON.stringify(customSections));
            localStorage.setItem('characterCreatorUserPersonas', JSON.stringify(userPersonas));
            localStorage.setItem('characterCreatorWorldBooks', JSON.stringify(worldBooks));
            localStorage.setItem('characterCreatorLoveyDoveyCharacters', JSON.stringify(loveyDoveyCharacters));
            localStorage.setItem('characterCreatorPresets', JSON.stringify(presets));
            markAsSaved();
            
            return true;
        } catch (fallbackError) {
            return false;
        }
    }
}

async function loadData() {
    try {
        const dbInitialized = await characterDB.init();
        
        if (dbInitialized) {
            const isMigrated = await characterDB.checkMigrationStatus();
            if (!isMigrated) {
                await characterDB.migrateFromLocalStorage();
            }
            characters = await characterDB.loadCharacters();
            customSections = await characterDB.loadCustomSections();
            worldBooks = await characterDB.loadWorldBooks();
            userPersonas = await characterDB.loadUserPersonas();
            loveyDoveyCharacters = await characterDB.loadLoveyDoveyCharacters();
            normalizeLoveyDoveyData(); // 向後相容：為舊數據補充版本欄位
            presets = await characterDB.loadPresets();      
            
        } else {
            const saved = localStorage.getItem('characterCreatorData');
            if (saved) {
                characters = JSON.parse(saved);
            }

            const savedLoveyDoveyCharacters = localStorage.getItem('characterCreatorLoveyDoveyCharacters');
            if (savedLoveyDoveyCharacters) {
                loveyDoveyCharacters = JSON.parse(savedLoveyDoveyCharacters);
                normalizeLoveyDoveyData(); // 向後相容：為舊數據補充版本欄位
            }

            const savedCustom = localStorage.getItem('characterCreatorCustomData');
            if (savedCustom) {
                customSections = JSON.parse(savedCustom);
            }

            const savedWorldBooks = localStorage.getItem('characterCreatorWorldBooks');
            if (savedWorldBooks) {
                worldBooks = JSON.parse(savedWorldBooks);
            }

            const savedUserPersonas = localStorage.getItem('characterCreatorUserPersonas'); 
            if (savedUserPersonas) {
                userPersonas = JSON.parse(savedUserPersonas);
            }

            const savedPresets = localStorage.getItem('characterCreatorPresets');
            if (savedPresets) {
                presets = JSON.parse(savedPresets);
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
        currentPresetId = null;
        currentPresetVersionId = null;
        
        markAsSaved();

        // 遷移舊資料的時間戳
        TimestampManager.migrateOldData();

// 恢復所有項目的版本排序 
        try {          
            [
                { type: 'character', items: characters },
                { type: 'userpersona', items: userPersonas },
                { type: 'worldbook', items: worldBooks },
                { type: 'custom', items: customSections },
                { type: 'loveydovey', items: loveyDoveyCharacters },
                { type: 'preset', items: presets }
            ].forEach(({ type, items }) => {
                if (!items || items.length === 0) return;
                
                items.forEach(item => {
                    const savedVersionOrder = DragSortManager.loadVersionOrder(type, item.id);
                    if (savedVersionOrder && savedVersionOrder.length > 0) {
                        DragSortManager.applyVersionOrder(type, item.id, savedVersionOrder);
                    }
                });
            });
        } catch (error) {
        }

        // 恢復所有類型的自定義【項目】排序
        try {
            ['character', 'userpersona', 'loveydovey', 'worldbook', 'custom'].forEach(type => {
                DragSortManager.applySavedOrder(type);
            });
        } catch(error) {
        }

        // 顯示儲存空間資訊
        showStorageInfo();
        
    } catch (error) {
        characters = characters || [];
        customSections = customSections || [];
        worldBooks = worldBooks || [];
        loveyDoveyCharacters = loveyDoveyCharacters || [];
        userPersonas = userPersonas || [];
        presets = presets || [];
    }

    TokenCacheManager.init();
    TokenCacheManager.cleanup(); 
    
}

    class CharacterDB {
    constructor() {
        this.db = null;
        this.dbName = 'CharacterCreatorDB';
        this.version = 10;
        this.isSupported = 'indexedDB' in window;
    }

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
                
                if (!db.objectStoreNames.contains('characters')) {
                    const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
                    characterStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('loveyDoveyCharacters')) {
                    const loveyDoveyStore = db.createObjectStore('loveyDoveyCharacters', { keyPath: 'id' });
                    loveyDoveyStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('customSections')) {
                    const customStore = db.createObjectStore('customSections', { keyPath: 'id' });
                    customStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('worldBooks')) {
                    const worldBookStore = db.createObjectStore('worldBooks', { keyPath: 'id' });
                    worldBookStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('userPersonas')) {
                    const userPersonaStore = db.createObjectStore('userPersonas', { keyPath: 'id' });
                    userPersonaStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('presets')) {
                    const presetStore = db.createObjectStore('presets', { keyPath: 'id' });
                    presetStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains('imageLibrary')) {
                    const imageLibraryStore = db.createObjectStore('imageLibrary', { keyPath: 'id' });
                    imageLibraryStore.createIndex('hash', 'hash', { unique: false });
                    imageLibraryStore.createIndex('createdAt', 'createdAt', { unique: false });
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

    async savePresets(presetsData) {
        if (!this.db) return this.fallbackSave('characterCreatorPresets', presetsData);

        try {
            const transaction = this.db.transaction(['presets'], 'readwrite');
            const store = transaction.objectStore('presets');
            
            await this.clearStore(store);
            for (const preset of presetsData) {
                await this.addToStore(store, preset);
            }
            return true;
        } catch (error) {
            console.error('IndexedDB 儲存預設失敗:', error);
            return this.fallbackSave('characterCreatorPresets', presetsData);
        }
    }

    async loadPresets() {
        if (!this.db) return this.fallbackLoad('characterCreatorPresets');

        try {
            const transaction = this.db.transaction(['presets'], 'readonly');
            const store = transaction.objectStore('presets');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('IndexedDB 載入預設失敗:', error);
            return this.fallbackLoad('characterCreatorPresets');
        }
    }

    // 圖片庫 CRUD
    async saveImageToLibrary(imageData) {
        if (!this.db) return false;
        try {
            const transaction = this.db.transaction(['imageLibrary'], 'readwrite');
            const store = transaction.objectStore('imageLibrary');
            await this.addToStore(store, imageData);
            return true;
        } catch (error) {
            console.error('儲存圖片到圖片庫失敗:', error);
            return false;
        }
    }

    async loadImageLibrary() {
        if (!this.db) return [];
        try {
            const transaction = this.db.transaction(['imageLibrary'], 'readonly');
            const store = transaction.objectStore('imageLibrary');
            return await this.getAllFromStore(store) || [];
        } catch (error) {
            console.error('載入圖片庫失敗:', error);
            return [];
        }
    }

    async deleteImageFromLibrary(id) {
        if (!this.db) return false;
        try {
            const transaction = this.db.transaction(['imageLibrary'], 'readwrite');
            const store = transaction.objectStore('imageLibrary');
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('刪除圖片庫圖片失敗:', error);
            return false;
        }
    }

    async saveImageLibrary(imagesData) {
        if (!this.db) return false;
        try {
            const transaction = this.db.transaction(['imageLibrary'], 'readwrite');
            const store = transaction.objectStore('imageLibrary');
            await this.clearStore(store);
            for (const image of imagesData) {
                await this.addToStore(store, image);
            }
            return true;
        } catch (error) {
            console.error('批量儲存圖片庫失敗:', error);
            return false;
        }
    }

    async updateImageInLibrary(imageData) {
        if (!this.db) return false;
        try {
            const transaction = this.db.transaction(['imageLibrary'], 'readwrite');
            const store = transaction.objectStore('imageLibrary');
            await this.addToStore(store, imageData);
            return true;
        } catch (error) {
            console.error('更新圖片庫圖片失敗:', error);
            return false;
        }
    }

    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    addToStore(store, data) {
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

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

    async migrateFromLocalStorage() {
        if (!this.db) return false;

        try {
                  
            const oldCharacters = this.fallbackLoad('characterCreatorData');
            if (oldCharacters.length > 0) {
                await this.saveCharacters(oldCharacters);
                
            }

            const oldCustom = this.fallbackLoad('characterCreatorCustomData');
            if (oldCustom.length > 0) {
                await this.saveCustomSections(oldCustom);
                
            }

            const oldWorldBooks = this.fallbackLoad('characterCreatorWorldBooks');
            if (oldWorldBooks.length > 0) {
                await this.saveWorldBooks(oldWorldBooks);
                
            }

            const oldUserPersonas = this.fallbackLoad('characterCreatorUserPersonas');
            if (oldUserPersonas.length > 0) {
                await this.saveUserPersonas(oldUserPersonas);
                
            }

            const oldLoveyDoveyCharacters = this.fallbackLoad('characterCreatorLoveyDoveyCharacters');
            if (oldLoveyDoveyCharacters.length > 0) {
                await this.saveLoveyDoveyCharacters(oldLoveyDoveyCharacters);
                
            }

            const oldPresets = this.fallbackLoad('characterCreatorPresets');
            if (oldPresets.length > 0) {
                await this.savePresets(oldPresets);
            }

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            await this.addToStore(store, { key: 'migrated', value: true, date: new Date().toISOString() });

            
            return true;
        } catch (error) {
            console.error('è³‡æ–™é·ç§»å¤±æ•—:', error);
            return false;
        }
    }

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
        
        if (usagePercent > 80) {
            showStorageWarning(estimate.used * 1024);
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
        z-index: 99999;
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

// 卿卿我我數據規範化函數（向後相容）
function normalizeLoveyDoveyData() {
    if (!loveyDoveyCharacters || loveyDoveyCharacters.length === 0) return;

    // 需要版本管理的固定欄位
    const versionedFields = [
        'publicDescription', 'basicInfo', 'personality', 'speakingStyle',
        'scenarioScript', 'characterDialogue', 'likes', 'dislikes'
    ];

    loveyDoveyCharacters.forEach(character => {
        if (!character.versions) return;

        character.versions.forEach(version => {
            // 規範化固定欄位的版本
            versionedFields.forEach(field => {
                const versionsKey = `${field}Versions`;
                const noteKey = `${field}Note`;
                if (!version[versionsKey]) {
                    version[versionsKey] = [];
                }
                if (version[noteKey] === undefined) {
                    version[noteKey] = '';
                }
            });

            // 規範化動態數組項目
            ['additionalInfo', 'creatorEvents', 'privateStories'].forEach(arrayName => {
                if (version[arrayName] && Array.isArray(version[arrayName])) {
                    version[arrayName].forEach(item => {
                        if (!item.contentVersions) {
                            item.contentVersions = [];
                        }
                        if (item.contentNote === undefined) {
                            item.contentNote = '';
                        }
                    });
                }
            });
        });
    });
}

const characterDB = new CharacterDB();
