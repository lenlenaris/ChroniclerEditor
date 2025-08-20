// ===== å…¨åŸŸè®Šæ•¸å®£å‘Š =====
let tiktokenEncoding = null;
let updateFieldStatsTimer = null;
let updateVersionStatsTimer = null;

// ===== Tiktoken ç·¨ç¢¼å™¨ï¼ˆä¿æŒåŽŸæ¨£ï¼‰=====
function initTiktoken() {
    if (!tiktokenEncoding) {
        try {
            tiktokenEncoding = getEncoding('o200k_base');
        } catch (error) {
            console.error('tiktoken ç·¨ç¢¼å™¨åˆå§‹åŒ–å¤±æ•—:', error);
        }
    }
    return tiktokenEncoding;
}

// åŽŸå§‹Tokenè¨ˆç®—ï¼ˆä¿æŒåŽŸæ¨£ï¼‰
const originalCountTokens = function(text) {
    if (!text) return 0;
    
    const encoding = initTiktoken();
    if (encoding) {
        try {
            return encoding.encode(text).length;
        } catch (error) {
            console.warn('purejs-tiktoken è¨ˆç®—å¤±æ•—:', error);
        }
    }
    
    return countTokensBasic(text);
};

// åŸºæœ¬Tokenä¼°ç®—ï¼ˆä¿æŒåŽŸæ¨£ï¼‰
function countTokensBasic(text) {
    if (!text) return 0;
    
    text = text.trim().replace(/\s+/g, ' ');
    let tokenCount = 0;
    let i = 0;
    
    while (i < text.length) {
        const char = text[i];
        
        if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(char)) {
            tokenCount += 1;
            i++;
        }
        else if (/[a-zA-Z]/.test(char)) {
            let wordStart = i;
            while (i < text.length && /[a-zA-Z]/.test(text[i])) {
                i++;
            }
            const word = text.slice(wordStart, i);
            
            if (word.length <= 3) {
                tokenCount += 1;
            } else if (word.length <= 6) {
                tokenCount += 1.5;
            } else if (word.length <= 10) {
                tokenCount += 2;
            } else {
                tokenCount += Math.ceil(word.length / 4);
            }
        }
        else if (/[0-9]/.test(char)) {
            let numStart = i;
            while (i < text.length && /[0-9.,]/.test(text[i])) {
                i++;
            }
            const num = text.slice(numStart, i);
            tokenCount += Math.ceil(num.replace(/[.,]/g, '').length / 3);
        }
        else if (/[^\s]/.test(char)) {
            if (i < text.length - 1) {
                const twoChar = text.slice(i, i + 2);
                if (['--', '...', '!!', '??', '::'].includes(twoChar)) {
                    tokenCount += 1;
                    i += 2;
                    continue;
                }
            }
            
            if (/[.!?,:;()[\]{}"'`~@#$%^&*+=<>|\\/-]/.test(char)) {
                tokenCount += 0.5;
            } else {
                tokenCount += 1;
            }
            i++;
        }
        else {
            i++;
        }
    }
    
    const specialTokens = text.match(/\{\{(user|char|random|pick|roll)\}\}/g);
    if (specialTokens) {
        tokenCount += specialTokens.length * 0.5;
    }
    
    return Math.ceil(tokenCount);
}

function countTokens(text) {
    if (!text) return 0;
    
    if (text.length > 20000) {
        const estimated = Math.ceil(text.length * 0.75);
        

        setTimeout(() => {
            const realTokens = originalCountTokens(text);
            updateLargeTextTokenDisplay(text, realTokens);
        }, 100);
        
        return estimated;
    }
    
    // å°æ–‡æœ¬ï¼šç›´æŽ¥è¨ˆç®—
    return originalCountTokens(text);
}

// æ›´æ–°å¤§æ–‡æœ¬çš„Tokené¡¯ç¤º
function updateLargeTextTokenDisplay(originalText, realTokens) {
    // æ‰¾åˆ°æ‰€æœ‰å¯èƒ½é¡¯ç¤ºé€™å€‹æ–‡æœ¬çµ±è¨ˆçš„å…ƒç´ 
    document.querySelectorAll('.field-stats, .stats-text').forEach(element => {
        const textContent = element.textContent;
        if (textContent.includes('/ ')) {
            // æª¢æŸ¥æ˜¯å¦ç‚ºåŒä¸€æ–‡æœ¬çš„çµ±è¨ˆï¼ˆç°¡å–®æ¯”å°å­—ç¬¦æ•¸ï¼‰
            const charMatch = textContent.match(/(\d+)\s+chars/);
            if (charMatch && Math.abs(parseInt(charMatch[1]) - originalText.length) < 10) {
                // æ›´æ–°Tokenæ•¸
                element.textContent = textContent.replace(/\d+(?=\s*tokens?)/, realTokens);
            }
        }
    });
}

// ===== Tokenç·©å­˜ç®¡ç†å™¨ï¼ˆç°¡åŒ–ç‰ˆï¼‰=====
class TokenCacheManager {
    static cacheKey = 'characterCreator_tokenCache';
    static cache = null;
    
    static init() {
        try {
            const saved = localStorage.getItem(this.cacheKey);
            this.cache = saved ? JSON.parse(saved) : {};
            
        } catch (error) {
            console.warn('Token ç·©å­˜è¼‰å…¥å¤±æ•—:', error);
            this.cache = {};
        }
    }
    
    static get(versionId, lastUpdated) {
        if (!this.cache) this.init();
        
        const cached = this.cache[versionId];
        if (cached && cached.timestamp >= new Date(lastUpdated || 0).getTime()) {
            return cached.stats;
        }
        return null;
    }
    
static set(versionId, stats, lastUpdated) {
    if (!this.cache) this.init();
    
    this.cache[versionId] = {
        stats: stats,
        timestamp: new Date(lastUpdated || Date.now()).getTime()
    };
    
    // 檢查緩存大小，超出限制時清理
    this.checkAndCleanCache();
    
    try {
        localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
        console.warn('Token 緩存保存失敗:', error);
        // 如果還是失敗，強制清理並重試
        this.forceCleanCache();
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (retryError) {
            console.error('緩存保存完全失敗:', retryError);
        }
    }
}
    
    static cleanup() {
        if (!this.cache) return;
        
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        
        Object.keys(this.cache).forEach(key => {
            if (now - this.cache[key].timestamp > oneWeek) {
                delete this.cache[key];
            }
        });
        
        localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    }

    // 檢查並清理緩存
static checkAndCleanCache() {
    if (!this.cache) return;
    
    const keys = Object.keys(this.cache);
    const maxEntries = 300; // 最大條目數
    
    // 如果超出條目限制，清理最舊的 50%
    if (keys.length > maxEntries) {
        const sortedKeys = keys.sort((a, b) => 
            this.cache[a].timestamp - this.cache[b].timestamp
        );
        
        const keysToDelete = sortedKeys.slice(0, Math.floor(keys.length * 0.5));
        keysToDelete.forEach(key => delete this.cache[key]);
        
        
    }
}

// 強制清理緩存（錯誤處理用）
static forceCleanCache() {
    if (!this.cache) return;
    
    const keys = Object.keys(this.cache);
    if (keys.length === 0) return;
    
    // 清理 70% 的條目
    const sortedKeys = keys.sort((a, b) => 
        this.cache[a].timestamp - this.cache[b].timestamp
    );
    
    const keysToDelete = sortedKeys.slice(0, Math.floor(keys.length * 0.7));
    keysToDelete.forEach(key => delete this.cache[key]);
    
    
}
    
}

// ===== æ ¸å¿ƒçµ±è¨ˆç®¡ç†å™¨ =====
class StatsManager {
    static calculateTextStats(text) {
        if (!text) return { chars: 0, tokens: 0 };
        
        const chars = text.length;
        const tokens = countTokens(text);
        
        return { chars, tokens };
    }
    
    static calculateVersionStats(version, type) {
        const versionId = version.id || `${type}_${Date.now()}`;
        const lastUpdated = version.updatedAt;
        
        // æª¢æŸ¥æŒä¹…åŒ–ç·©å­˜
        const cached = TokenCacheManager.get(versionId, lastUpdated);
        if (cached) {
            return cached;
        }
        
        
        
        let allText = '';
        let extraInfo = '';
        
        switch (type) {
            case 'character':
                allText = [
                    version.description, 
                    version.personality, 
                    version.scenario, 
                    version.dialogue, 
                    version.firstMessage
                ].filter(Boolean).join('');
                break;

            case 'loveydovey':
                const textParts = [
                    version.characterName,
                    version.age,
                    version.occupation,
                    version.characterQuote,
                    version.publicDescription,
                    version.basicInfo,
                    version.personality,
                    version.speakingStyle,
                    version.scenarioScript,
                    version.characterDialogue,
                    version.likes,
                    version.dislikes
                ].filter(Boolean);
                
                // æ·»åŠ é™„åŠ è³‡è¨Šå…§å®¹
                if (version.additionalInfo && Array.isArray(version.additionalInfo)) {
                    version.additionalInfo.forEach(info => {
                        if (info.content) textParts.push(info.content);
                    });
                }
                
                // æ·»åŠ å‰µä½œè€…äº‹ä»¶å…§å®¹
                if (version.creatorEvents && Array.isArray(version.creatorEvents)) {
                    version.creatorEvents.forEach(event => {
                        if (event.content) textParts.push(event.content);
                    });
                }
                
                allText = textParts.join('');
                break;

            case 'userpersona':
                allText = [
                    version.description
                ].filter(Boolean).join('');
                break;
                
            case 'custom':
                if (version.fields && Array.isArray(version.fields)) {
                    allText = version.fields.map(field => field.content || '').filter(Boolean).join('');
                }
                break;
                
            case 'worldbook':
                if (version.entries && Array.isArray(version.entries)) {
                    const entryCount = version.entries.length;
                    allText = version.entries.map(entry => entry.content || '').filter(Boolean).join('');
                    extraInfo = `${entryCount} ${t('entriesCount')} / `;
                }
                break;
        }
        
        const { chars, tokens } = this.calculateTextStats(allText);
        
        const stats = {
            chars,
            tokens,
            extraInfo,
            formatted: `${extraInfo}${chars} ${t('chars')} / ${tokens} ${t('tokens')}`
        };
        
        TokenCacheManager.set(versionId, stats, lastUpdated);
        
        return stats;
    }
}

// ===== æ¥µç°¡çµ±è¨ˆæ›´æ–°å‡½æ•¸ =====

// ðŸŽ¯ æ ¸å¿ƒå‡½æ•¸1ï¼šæ›´æ–°æ¬„ä½çµ±è¨ˆï¼ˆå¸¶é˜²æŠ–ï¼‰
function updateFieldStats(textareaId) {
    if (isLoveyDoveyField(textareaId)) {
        updateLoveyDoveyFieldStats(textareaId);
        return;
    }
    if (updateFieldStatsTimer) {
        clearTimeout(updateFieldStatsTimer);
    }
    
    updateFieldStatsTimer = setTimeout(() => {
        const textarea = document.getElementById(textareaId);
        const statsElement = document.querySelector(`[data-target="${textareaId}"]`);
        
        if (!textarea || !statsElement) return;
        
        const text = textarea.value;
        const chars = text.length;
        const tokens = countTokens(text);
        
        // æ±ºå®šæ˜¯å¦é¡¯ç¤º tokensï¼ˆæŽ’é™¤æŸäº›æ¬„ä½ï¼‰
        const excludeTokenFields = ['creator-', 'charVersion-', 'creatorNotes-', 'tags-'];
        const shouldShowTokens = !excludeTokenFields.some(prefix => textareaId.includes(prefix));
        
        const displayText = shouldShowTokens ? 
            `${chars} ${t('chars')} / ${tokens} ${t('tokens')}` : 
            `${chars} ${t('chars')}`;
            
        statsElement.textContent = displayText;
        updateFieldStatsTimer = null;
    }, 200);
}

// ðŸŽ¯ æ ¸å¿ƒå‡½æ•¸2ï¼šæ›´æ–°ç‰ˆæœ¬çµ±è¨ˆï¼ˆå¸¶è¼•é‡é˜²æŠ–ï¼‰
function updateVersionStats(itemType, itemId, versionId) {
    if (updateVersionStatsTimer) {
        clearTimeout(updateVersionStatsTimer);
    }
    
    updateVersionStatsTimer = setTimeout(() => {
        const statsElement = document.getElementById(`${itemType}-version-stats-${versionId}`);
        if (!statsElement) return;
        
        const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
        if (!item) return;
        
        const version = item.versions.find(v => v.id === versionId);
        if (!version) return;
        
        const stats = StatsManager.calculateVersionStats(version, itemType);
        const timestamp = TimestampManager.formatTimestamp(version.updatedAt);
        
        const statsText = statsElement.querySelector('.stats-text');
        const timestampText = statsElement.querySelector('.timestamp-text');
        
        if (statsText) {
            statsText.textContent = stats.formatted;
        } else {
            statsElement.innerHTML = `
                <span class="stats-text" style="flex: 1;">${stats.formatted}</span>
                <span class="timestamp-text" style="font-size: 0.75em; color: var(--text-muted); opacity: 0.8; margin-left: auto;">${timestamp}</span>
            `;
        }
        
        if (timestampText) {
            timestampText.textContent = timestamp;
        }
        
        updateVersionStatsTimer = null;
    }, 100);
}

function updateAllPageStats() {
    updateTotalStats();
    updateSidebarStats();
}

function updateTotalStats() {
    const statsBar = document.querySelector('.stats-bar .total-stats');
    if (!statsBar) return;
    
    if (viewMode === 'compare') {
        const currentItem = ItemManager.getCurrentItem();
        if (!currentItem) return;
        
        const versionsToCount = currentItem.versions.filter(v => compareVersions.includes(v.id));
        let statsHTML = '';
        
        versionsToCount.forEach(version => {
            const stats = StatsManager.calculateVersionStats(version, currentMode);
            statsHTML += `<div>${version.name} - ${stats.chars} ${t('chars')} / ${stats.tokens} ${t('tokens')}</div>`;
        });
        
        statsBar.innerHTML = `
            <div style="font-weight: 600; font-size: 1.1em; color: var(--text-color); margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">${t('total')}</div>
            ${statsHTML}
        `;
    } else {
        const currentItem = ItemManager.getCurrentItem();
        const currentVersionId = ItemManager.getCurrentVersionId();
        
        if (!currentItem) return;
        
        const version = currentItem.versions.find(v => v.id === currentVersionId);
        if (!version) return;
        
        const stats = StatsManager.calculateVersionStats(version, currentMode);
        statsBar.innerHTML = `${t('total')} - <span id="total-chars">${stats.chars}</span> ${t('chars')} / <span id="total-tokens">${stats.tokens}</span> ${t('tokens')}`;
    }
}

function updateSidebarStats() {
    const allTypes = [
        { type: 'character', items: characters },
        { type: 'custom', items: customSections },
        { type: 'worldbook', items: worldBooks },
        { type: 'userpersona', items: userPersonas },
        { type: 'loveydovey', items: loveyDoveyCharacters }
    ];
    
    allTypes.forEach(({ type, items }) => {
        items.forEach(item => {
            item.versions.forEach(version => {
                const versionElement = document.querySelector(
                    `[onclick*="selectItem('${type}', '${item.id}', '${version.id}')"] span[style*="italic"]`
                );
                if (versionElement) {
                    const stats = StatsManager.calculateVersionStats(version, type);
                    versionElement.textContent = stats.formatted;
                }
            });
        });
    });
}

// ===== æ¸…ç†å‡½æ•¸ =====
function clearStatsUpdateTimer() {
    if (updateFieldStatsTimer) {
        clearTimeout(updateFieldStatsTimer);
        updateFieldStatsTimer = null;
    }
    if (updateVersionStatsTimer) {
        clearTimeout(updateVersionStatsTimer);
        updateVersionStatsTimer = null;
    }
}

// ===== å…¼å®¹æ€§å‡½æ•¸ï¼ˆè™•ç†å­—æ®µæ›´æ–°å®Œæˆï¼‰=====
function handleFieldUpdateComplete(itemType, itemId, versionId) {
    updateAllPageStats();
    markAsChanged();
    
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA' && activeElement.id) {
        updateFieldStats(activeElement.id);
    }
    
    setTimeout(() => {
        updateVersionStats(itemType, itemId, versionId);
        
        // ðŸŽ¯ åŒæ™‚æ›´æ–°å´é‚Šæ¬„çµ±è¨ˆï¼ˆåªæ›´æ–°ç•¶å‰é …ç›®ï¼‰
        if (itemId === ItemManager.getCurrentItemId()) {
            updateSingleItemStats(itemType, itemId, versionId);
        }
    }, 10);
}


function isLoveyDoveyField(textareaId) {
    const statsElement = document.querySelector(`[data-target="${textareaId}"]`);
    if (!statsElement) return false;
    
    return statsElement.textContent.match(/^\d+\s*\/\s*\d+\s*å­—$/);
}

function updateLoveyDoveyFieldStats(textareaId) {
    const textarea = document.getElementById(textareaId);
    const statsElement = document.querySelector(`[data-target="${textareaId}"]`);
    
    if (!textarea || !statsElement) return;
    
    const currentText = statsElement.textContent;
    const maxLengthMatch = currentText.match(/\/\s*(\d+)\s*å­—$/);
    
    if (maxLengthMatch) {
        const maxLength = parseInt(maxLengthMatch[1]);
        const currentLength = textarea.value.length;
        const isOverLimit = currentLength > maxLength;
        
        statsElement.textContent = `${currentLength} / ${maxLength} ${t('chars')}`;

        if (isOverLimit) {
            statsElement.style.color = '#e74c3c';
            statsElement.style.fontWeight = 'bold';
            textarea.style.borderColor = '#e74c3c';
            textarea.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
        } else {
            statsElement.style.color = 'var(--text-muted)';
            statsElement.style.fontWeight = 'normal';
            textarea.style.borderColor = '';
            textarea.style.boxShadow = '';
        }
    }
}


function updateSingleItemStats(type, itemId, versionId = null) {
    const item = ItemManager.getItemsArray(type).find(i => i.id === itemId);
    if (!item) return;
    
    item.versions.forEach(version => {
        updateSingleVersionSidebarStats(type, itemId, version.id);
    });
}

function updateSingleVersionSidebarStats(itemType, itemId, versionId) {
    const versionElement = document.querySelector(
        `[data-action="selectSidebarItem"][data-type="${itemType}"][data-item-id="${itemId}"][data-version-id="${versionId}"] [style*="italic"]`
    );
    
    if (!versionElement) {
        const fallbackElement = document.querySelector(`[data-version-id="${versionId}"] [style*="italic"]`);
        if (!fallbackElement) {
            
            return;
        }
        
        updateVersionElementStats(fallbackElement, itemType, itemId, versionId);
        return;
    }
    
    updateVersionElementStats(versionElement, itemType, itemId, versionId);
}

function updateVersionElementStats(element, itemType, itemId, versionId) {
    // ç²å–ç‰ˆæœ¬æ•¸æ“š
    const item = ItemManager.getItemsArray(itemType).find(i => i.id === itemId);
    if (!item) return;
    
    const version = item.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // ä½¿ç”¨å¿«å–å„ªå…ˆçš„çµ±è¨ˆè¨ˆç®—
    const stats = getCachedStatsForSidebar(version, itemType);
    
    // æ›´æ–°é¡¯ç¤º
    element.textContent = stats.formatted;
    
}

function getCachedStatsForSidebar(version, itemType) {
    const cached = TokenCacheManager.get(version.id, version.updatedAt);
    if (cached) {
        return cached;
    }
    
    const realStats = StatsManager.calculateVersionStats(version, itemType);
    TokenCacheManager.set(version.id, realStats, version.updatedAt);
    
    return realStats;
}

// ðŸ“Š å¿«é€Ÿçµ±è¨ˆé ä¼°ï¼ˆé¿å…é¡¯ç¤º0ï¼‰
function getQuickStatsEstimate(version, itemType) {
    let allText = '';
    let extraInfo = '';
    
    // å¿«é€Ÿæ”¶é›†æ–‡æœ¬ï¼ˆä¸é€²è¡Œtokenè¨ˆç®—ï¼‰
    switch (itemType) {
        case 'character':
            allText = [
                version.description, 
                version.personality, 
                version.scenario, 
                version.dialogue, 
                version.firstMessage
            ].filter(Boolean).join('');
            break;
        case 'worldbook':
            if (version.entries && Array.isArray(version.entries)) {
                const entryCount = version.entries.length;
                allText = version.entries.map(entry => entry.content || '').filter(Boolean).join('');
                extraInfo = `${entryCount} ${t('entriesCount')} / `;
            }
            break;
        case 'userpersona':
            allText = version.description || '';
            break;
        case 'custom':
            if (version.fields && Array.isArray(version.fields)) {
                allText = version.fields.map(field => field.content || '').filter(Boolean).join('');
            }
            break;
        case 'loveydovey':
            // å¿«é€Ÿæ”¶é›†å¿™å¿™æˆ‘æˆ‘çš„æ–‡æœ¬
            const textParts = [
                version.characterName,
                version.publicDescription,
                version.personality,
                version.scenarioScript
            ].filter(Boolean);
            allText = textParts.join('');
            break;
    }
    
    const chars = allText.length;
    const estimatedTokens = Math.ceil(chars * 0.75); // å¿«é€Ÿé ä¼°tokenæ•¸
    
    return {
        chars,
        tokens: estimatedTokens,
        extraInfo,
        formatted: `${extraInfo}${chars} ${t('chars')} / ${estimatedTokens} ${t('tokens')}`
    };
}

function updateSidebarVersionStats(versionId, realStats) {
    const versionElement = document.querySelector(`#sidebar [onclick*="'${versionId}'"] div[style*="text-align: right"]`);
    
    if (versionElement) {
        versionElement.textContent = realStats.formatted;
    }
}

function updateAllFieldStatsOnLoad() {
    
    
    const textareas = document.querySelectorAll('textarea[id]');
    let updatedCount = 0;
    
    textareas.forEach(textarea => {
        const textareaId = textarea.id;
        const statsElement = document.querySelector(`[data-target="${textareaId}"]`);
        
        // åªæ›´æ–°æœ‰å…§å®¹ä¸”æœ‰å°æ‡‰çµ±è¨ˆå…ƒç´ çš„æ¬„ä½
        if (statsElement && textarea.value.length > 0) {
            const text = textarea.value;
            const chars = text.length;
            const tokens = countTokens(text);
            
            // æª¢æŸ¥æ˜¯å¦ç‚ºæ„›æƒ…æ¬„ä½
            if (!isLoveyDoveyField(textareaId)) {
                const excludeTokenFields = ['creator-', 'charVersion-', 'creatorNotes-', 'tags-'];
                const shouldShowTokens = !excludeTokenFields.some(prefix => textareaId.includes(prefix));
                
                const displayText = shouldShowTokens ? 
                    `${chars} ${t('chars')} / ${tokens} ${t('tokens')}` : 
                    `${chars} ${t('chars')}`;
                
                statsElement.textContent = displayText;
                updatedCount++;
            } else {
                updateLoveyDoveyFieldStats(textareaId);
                updatedCount++;
            }
        }
    });
    
}