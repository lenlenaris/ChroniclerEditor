// 翻譯載入器
// Chronicler Editor - Translation Loader

class TranslationManager {
    constructor() {
        this.loadedLanguages = new Set();
        this.fallbackTranslations = this.createFallbackTranslations();
        this.loadingPromises = new Map();
    }

    // 創建備援翻譯
    createFallbackTranslations() {
        return {
            zh: {
                appTitle: 'Chronicler Editor',
                appSubtitle: '本工具資料儲存在你的本機瀏覽器中，請定期備份以免資料丟失。',
                save: '儲存',
                cancel: '取消',
                apply: '套用',
                chars: '字',
                tokens: 'tokens',
                total: '總計'
            },
            en: {
                appTitle: 'Chronicler Editor',
                appSubtitle: 'Data is stored locally in your browser. Please backup regularly to prevent data loss.',
                save: 'Save',
                cancel: 'Cancel',
                apply: 'Apply',
                chars: 'chars',
                tokens: 'tokens',
                total: 'Total'
            }
        };
    }

    // 載入指定語言的翻譯檔案
    async loadLanguage(locale) {
        // 如果已經載入過，直接返回
        if (this.loadedLanguages.has(locale)) {
            return true;
        }

        // 如果正在載入中，返回現有的 Promise
        if (this.loadingPromises.has(locale)) {
            return this.loadingPromises.get(locale);
        }

        // 開始載入翻譯檔案
        const loadingPromise = this.loadTranslationFile(locale);
        this.loadingPromises.set(locale, loadingPromise);

        try {
            const success = await loadingPromise;
            if (success) {
                this.loadedLanguages.add(locale);
            }
            return success;
        } finally {
            this.loadingPromises.delete(locale);
        }
    }

    // 實際載入翻譯檔案的邏輯
    loadTranslationFile(locale) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `translations/${locale}.js`;
            
            script.onload = () => {
                if (window.ChroniclerTranslations && window.ChroniclerTranslations[locale]) {
                    
                    resolve(true);
                } else {
                    console.warn(`⚠️ ${locale} 翻譯檔載入失敗或格式錯誤`);
                    resolve(false);
                }
            };
            
            script.onerror = () => {
                console.warn(`❌ 無法載入 ${locale} 翻譯檔`);
                resolve(false);
            };
            
            // 設定超時
            setTimeout(() => {
                if (!this.loadedLanguages.has(locale)) {
                    console.warn(`⏰ ${locale} 翻譯檔載入超時`);
                    resolve(false);
                }
            }, 5000);
            
            document.head.appendChild(script);
        });
    }

    // 取得翻譯文字
    getTranslation(locale, key, ...args) {
        const langKey = locale.split('-')[0]; // zh-TW -> zh, en-US -> en
        
        // 嘗試從載入的翻譯中取得
        if (window.ChroniclerTranslations && window.ChroniclerTranslations[locale]) {
            const text = window.ChroniclerTranslations[locale][key];
            if (text !== undefined && text !== null) {
                return this.replaceArguments(text, args);
            }
        }
        
        // 備援：使用內建翻譯
        const fallbackText = this.fallbackTranslations[langKey] && this.fallbackTranslations[langKey][key];
        if (fallbackText !== undefined && fallbackText !== null) {
            return this.replaceArguments(fallbackText, args);
        }
        
        // 最後備援：返回鍵值本身並記錄缺失
        console.warn(`❌ 缺少翻譯: ${locale}.${key}`);
        
        // 如果是英文且找不到翻譯，嘗試使用中文版本作為備援
        if (langKey === 'en' && window.ChroniclerTranslations && window.ChroniclerTranslations['zh-TW']) {
            const zhText = window.ChroniclerTranslations['zh-TW'][key];
            if (zhText !== undefined && zhText !== null) {
                console.warn(`🔄 使用中文作為備援: ${key}`);
                return this.replaceArguments(zhText, args);
            }
        }
        
        return key;
    }

    // 替換參數佔位符
    replaceArguments(text, args) {
        if (!args || args.length === 0) return text;
        
        let result = text;
        args.forEach((arg, index) => {
            result = result.replace(`$${index + 1}`, arg);
        });
        return result;
    }

    // 檢查是否已載入指定語言
    isLanguageLoaded(locale) {
        return this.loadedLanguages.has(locale);
    }

    // 取得所有可用語言
    getAvailableLanguages() {
        return ['zh-TW', 'en-US'];
    }

    // 預載入所有語言
    async preloadAllLanguages() {
        const languages = this.getAvailableLanguages();
        const loadPromises = languages.map(lang => this.loadLanguage(lang));
        
        try {
            const results = await Promise.all(loadPromises);
            const successCount = results.filter(Boolean).length;
            
            return successCount === languages.length;
        } catch (error) {
            console.error('預載入翻譯失敗:', error);
            return false;
        }
    }

    // 清理未使用的翻譯（釋放記憶體）
    cleanup() {
        if (window.ChroniclerTranslations) {
            // 保留當前語言，清理其他
            const currentLocale = this.getCurrentLocale();
            Object.keys(window.ChroniclerTranslations).forEach(locale => {
                if (locale !== currentLocale) {
                    delete window.ChroniclerTranslations[locale];
                    this.loadedLanguages.delete(locale);
                }
            });
        }
    }

    // 取得當前語言設定
    getCurrentLocale() {
        return localStorage.getItem('characterCreatorLang') === 'en' ? 'en-US' : 'zh-TW';
    }
}

// 創建全域實例
window.translationManager = new TranslationManager();