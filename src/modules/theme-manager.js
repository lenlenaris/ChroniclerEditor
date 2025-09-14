// theme-manager.js - 完整主題管理系統

// 🎨 ThemeManager - 主題管理核心類別
class ThemeManager {
    static themes = new Map();
    static currentThemeId = 'default';
    static nextId = 1;
    static isModified = false;
    static currentInputCallback = null;
    
    // 初始化主題系統
    static initialize() {
        this.loadThemes();
        this.loadCurrentTheme();
    }

    
// 建立內建主題 - 引用 themes.css 的設定
static createBuiltinThemes() {
    // 預設主題 - 使用 :root 中的預設值
    this.themes.set('default', {
        name: 'Light',
        colors: {
            primary: '#4E5E79',
            secondary: '#fafafa',
            accent: '#8b7355',
            bg: '#ebf2fa',
            surface: '#ffffff',
            textColor: '#2d3748',
            textMuted: '#718096',
            borderColor: '#CEDAE9',
            headerBg: '#f1f5f9',
            sidebarBg: '#f8fafc',
            mainContentBg: '#fafbfc',
            contentBg: '#ffffff',
            successColor: '#4b9b9a',
            warningColor: '#7e98b9',
            dangerColor: '#c07272'
        },
        builtin: true
    });
    
    // 夜間主題
    this.themes.set('night', {
        name: 'Dark',
        colors: {
            primary: '#487e99',
            secondary: '#2b2b29',
            accent: '#86734b',
            bg: '#121417',
            surface: '#262624',
            textColor: '#dedede',
            textMuted: '#5d7e89',
            borderColor: '#4d4d4c',
            headerBg: '#2b2b29',
            sidebarBg: '#262624',
            mainContentBg: '#292929',
            contentBg: '#212121',
            successColor: '#4a9b93',
            warningColor: '#86734b',
            dangerColor: '#c07272'
        },
        builtin: true
    });
    
    // 藍月主題
    this.themes.set('bluemoon', {
        name: 'Blue Moon',
        colors: {
            primary: '#775343',
            secondary: '#1b2841',
            accent: '#c89967',
            bg: '#143b8b',
            surface: '#1e2533',
            textColor: '#d2cec6',
            textMuted: '#7e93b0',
            borderColor: '#5b4f48',
            headerBg: '#0c1e3c',
            sidebarBg: '#071226',
            mainContentBg: '#0c1e3c',
            contentBg: '#071226',
            successColor: '#557f53',
            warningColor: '#7e98b9',
            dangerColor: '#9f5e5e'
        },
        builtin: true
    });
    
    // 淺紫主題
    this.themes.set('purple', {
        name: 'Purple',
        colors: {
            primary: '#835d98',
            secondary: '#dce0ea',
            accent: '#7f68a1',
            bg: '#ececf4',
            surface: '#f2f2f2',
            textColor: '#475366',
            textMuted: '#85849f',
            borderColor: '#b9b5c5',
            headerBg: '#e9e7ee',
            sidebarBg: '#e8e1ea',
            mainContentBg: '#ececf4',
            contentBg: '#f2f2f2',
            successColor: '#52906c',
            warningColor: '#167eb7',
            dangerColor: '#c07272'
        },
        builtin: true
    });
    
    this.currentThemeId = 'default';
    this.saveThemes();
}
    
    // 儲存主題到 localStorage
    static saveThemes() {
        try {
            const data = {
                customThemes: Object.fromEntries(this.themes),
                currentTheme: this.currentThemeId,
                nextId: this.nextId
            };
            localStorage.setItem('characterCreator_customThemes', JSON.stringify(data));
        } catch (error) {
            console.error('儲存主題失敗:', error);
        }
    }
    
    // 載入當前主題並應用
    static loadCurrentTheme() {
        const theme = this.themes.get(this.currentThemeId);
        if (theme) {
            this.applyThemeColors(theme.colors);
            this.isModified = false;
        }
    }
    
    // 應用主題顏色到 CSS
    static applyThemeColors(colors) {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = this.getCSSVarName(key);
            root.style.setProperty(cssVar, value);
        });
    }
    
// 取得當前顯示的顏色值
static getCurrentColors() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    return {
        primary: style.getPropertyValue('--primary-color').trim(),
        secondary: style.getPropertyValue('--secondary-color').trim(),
        accent: style.getPropertyValue('--accent-color').trim(),
        bg: style.getPropertyValue('--bg-color').trim(),
        surface: style.getPropertyValue('--surface-color').trim(),
        textColor: style.getPropertyValue('--text-color').trim(),
        textMuted: style.getPropertyValue('--text-muted').trim(),
        borderColor: style.getPropertyValue('--border-color').trim(),
        headerBg: style.getPropertyValue('--header-bg').trim(),
        sidebarBg: style.getPropertyValue('--sidebar-bg').trim(),
        mainContentBg: style.getPropertyValue('--main-content-bg').trim(),
        contentBg: style.getPropertyValue('--content-bg').trim(),
        successColor: style.getPropertyValue('--success-color').trim(),
        warningColor: style.getPropertyValue('--warning-color').trim(),
        dangerColor: style.getPropertyValue('--danger-color').trim()
    };
}
    
    // 切換主題 - 增加內建主題重置邏輯
    static switchTheme(themeId) {
        const theme = this.themes.get(themeId);
        if (theme) {
            // 如果是內建主題，重新從 CSS 讀取原始顏色
            if (theme.builtin) {
                this.resetBuiltinTheme(themeId);
            }
            
            this.currentThemeId = themeId;
            this.applyThemeColors(this.themes.get(themeId).colors);
            this.isModified = false;
            this.saveThemes();
            this.updateThemeInterface();
            console.log(`已切換到主題: ${theme.name}`);
        }
    }
    
    // 重置內建主題為 CSS 原始值
    static resetBuiltinTheme(themeId) {
        if (themeId === 'default') {
            // 預設主題
            this.themes.get('default').colors = {
                primary: '#4E5E79',
                secondary: '#fafafa',
                accent: '#8b7355',
                bg: '#ebf2fa',
                surface: '#ffffff',
                textColor: '#2d3748',
                textMuted: '#718096',
                borderColor: '#CEDAE9',
                headerBg: '#f1f5f9',
                sidebarBg: '#f8fafc',
                mainContentBg: '#fafbfc',
                contentBg: '#ffffff',
                successColor: '#4b9b9a',
                warningColor: '#7e98b9',
                dangerColor: '#c07272'
            };
        } else if (themeId === 'night') {
            // 夜間主題
            this.themes.get('night').colors = {
                primary: '#487e99',
                secondary: '#2b2b29',
                accent: '#86734b',
                bg: '#121417',
                surface: '#262624',
                textColor: '#dedede',
                textMuted: '#5d7e89',
                borderColor: '#4d4d4c',
                headerBg: '#2b2b29',
                sidebarBg: '#262624',
                mainContentBg: '#292929',
                contentBg: '#212121',
                successColor: '#4a9b93',
                warningColor: '#86734b',
                dangerColor: '#c07272'
            };
        } else if (themeId === 'bluemoon') {
            // 藍月主題
            this.themes.get('bluemoon').colors = {
                primary: '#775343',
                secondary: '#1b2841',
                accent: '#c89967',
                bg: '#143b8b',
                surface: '#1e2533',
                textColor: '#d2cec6',
                textMuted: '#7e93b0',
                borderColor: '#5b4f48',
                headerBg: '#0c1e3c',
                sidebarBg: '#071226',
                mainContentBg: '#0c1e3c',
                contentBg: '#071226',
                successColor: '#557f53',
                warningColor: '#7e98b9',
                dangerColor: '#9f5e5e'
            };
        } else if (themeId === 'purple') {
            // 淺紫主題
            this.themes.get('purple').colors = {
                primary: '#835d98',
                secondary: '#dce0ea',
                accent: '#7f68a1',
                bg: '#ececf4',
                surface: '#f2f2f2',
                textColor: '#475366',
                textMuted: '#85849f',
                borderColor: '#b9b5c5',
                headerBg: '#e9e7ee',
                sidebarBg: '#e8e1ea',
                mainContentBg: '#ececf4',
                contentBg: '#f2f2f2',
                successColor: '#52906c',
                warningColor: '#167eb7',
                dangerColor: '#c07272'
            };
        }
    }
    
    // 儲存當前主題的修改 - 修正邏輯
    static saveCurrentTheme() {
        const theme = this.themes.get(this.currentThemeId);
        if (!theme) return false;
        
        const currentColors = this.getCurrentColors();
        
        // 如果是內建主題且有修改，自動另存為新主題
        if (theme.builtin && this.isModified) {
            const newName = `${theme.name}${t('modifiedSuffix')}`;
            return this.createNewTheme(newName);
        }
        
        // 更新現有主題 - 不要觸發重新載入
        theme.colors = currentColors;
        this.saveThemes();
        this.isModified = false;
        this.updateThemeSelector(); // 只更新選擇器，不重新載入顏色
        
        NotificationManager.success(t('themeSaved').replace('$1', theme.name)); 
        return true;
    }
    
    // 另存為新主題
    static saveAsNewTheme(name = null) {
        if (name) {
            return this.createNewTheme(name);
        } else {
            this.showThemeNameInput(t('saveAsNewTheme'), t('enterThemeName'), (inputName) => {
                if (inputName) {
                    this.createNewTheme(inputName);
                }
            });
        }
    }
    
    // 建立新主題
    static createNewTheme(name) {
        const newId = `theme_${this.nextId}`;
        this.nextId++;
        
        const newTheme = {
            name: name,
            colors: this.getCurrentColors(),
            builtin: false
        };
        
        this.themes.set(newId, newTheme);
        this.currentThemeId = newId;
        this.isModified = false;
        this.saveThemes();
        this.updateThemeInterface();
        
        NotificationManager.success(t('newThemeCreated').replace('$1', name));
        return true;
    }
    
    // 重新命名主題
    static renameTheme() {
        const theme = this.themes.get(this.currentThemeId);
        if (!theme) return;
        
        if (theme.builtin) {
            NotificationManager.warning(t('cannotRenameBuiltin'));
            return;
        }
        
        this.showThemeNameInput('重新命名主題', '請輸入新的主題名稱：', (newName) => {
            if (newName && newName !== theme.name) {
                theme.name = newName;
                this.saveThemes();
                this.updateThemeInterface();
                NotificationManager.success(t('themeRenamed').replace('$1', newName));
            }
        }, theme.name);
    }
    
    // 刪除主題
    static deleteTheme() {
    const theme = this.themes.get(this.currentThemeId);
    if (!theme) return;
    
    if (theme.builtin) {
        NotificationManager.warning(t('cannotDeleteBuiltin'));
        return;
    }
    
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${IconManager.delete({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('confirmDeleteTheme')}</h3>
                </div>
            </div>
            
            <p class="compact-modal-desc" style="text-align: center; margin-top: 30px;">
                ${t('deleteThemeConfirm').replace('$1', theme.name)}
            </p>

            <div class="compact-section" style="text-align: center; padding: 0;">
                <div style="color: var(--text-muted); font-size: 0.9em;">
                    ${t('operationCannotUndo')}
                </div>
            </div>

            <div class="compact-modal-footer" style="justify-content: center; margin-top: 25px;">
                <button class="overview-btn hover-primary" onclick="ThemeManager.cancelDelete()">${t('cancel')}</button>
                <button class="overview-btn btn-primary" onclick="ThemeManager.confirmDelete()">${t('confirmDeleteTheme')}</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'delete-theme-modal';
    modal.style.display = 'block';
    modal.innerHTML = content;
    
    document.body.appendChild(modal);
    
    // 點擊遮罩關閉
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        e.stopPropagation(); // 🔧 阻止事件冒泡
        this.cancelDelete();
    }
});
    
    // ESC 鍵關閉
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            this.cancelDelete();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// 取消刪除
static cancelDelete() {
    const modal = document.getElementById('delete-theme-modal');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

// 確認刪除
static confirmDelete() {
    const modal = document.getElementById('delete-theme-modal');
    const theme = this.themes.get(this.currentThemeId);
    
    if (theme) {
        this.themes.delete(this.currentThemeId);
        
        // 切換到預設主題
        this.currentThemeId = 'default';
        this.loadCurrentTheme();
        this.saveThemes();
        this.updateThemeInterface();
        
        NotificationManager.success(t('themeDeleted').replace('$1', theme.name));
    }
    
    // 關閉模態框
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}
    
    // 匯出主題
    static exportTheme() {
        const theme = this.themes.get(this.currentThemeId);
        if (!theme) return;
        
        const exportData = {
            name: theme.name,
            colors: this.isModified ? this.getCurrentColors() : theme.colors,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${theme.name}_主題.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        NotificationManager.success(t('themeExported').replace('$1', theme.name));
    }
    
    // 匯入主題 - 修正關閉問題
    static importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const themeData = JSON.parse(event.target.result);
                    
                    if (themeData.colors) {
                        this.showThemeNameInput(t('importColorTheme'), t('enterThemeName'), (name) => {
                            if (name) {
                                // 建立新主題並應用顏色
                                const newId = `theme_${this.nextId}`;
                                this.nextId++;
                                
                                const newTheme = {
                                    name: name,
                                    colors: themeData.colors,
                                    builtin: false
                                };
                                
                                this.themes.set(newId, newTheme);
                                this.currentThemeId = newId;
                                this.saveThemes();
                                
                                // 應用匯入的顏色
                                this.applyThemeColors(themeData.colors);
                                this.isModified = false;
                                this.updateThemeInterface();
                                
                                NotificationManager.success(t('themeImportSuccess').replace('$1', name));
                            }
                        }, themeData.name || t('importedTheme'));
                    } else {
                        NotificationManager.error(t('invalidThemeFile'));
                    }
                } catch (error) {
                    NotificationManager.error(t('themeFileReadError'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    // 標記顏色已修改
    static markAsModified() {
        this.isModified = true;
        this.updateThemeSelector();
    }
    
    // 更新主題介面
    static updateThemeInterface() {
        this.updateThemeSelector();
        this.updateControlButtons();
        this.updateColorInputs();
    }
    
    // 更新主題選擇器
    static updateThemeSelector() {
        const selector = document.getElementById('theme-selector');
        if (!selector) return;
        
        const currentTheme = this.themes.get(this.currentThemeId);
        
        // 重新生成選項
        selector.innerHTML = '';
        for (const [id, theme] of this.themes) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = theme.name;
            if (id === this.currentThemeId) {
                option.selected = true;
            }
            selector.appendChild(option);
        }
        
        // 更新顯示狀態（修改標記）
        if (currentTheme && this.isModified) {
            selector.style.fontStyle = 'italic';
            selector.style.color = 'var(--warning-color)';
        } else {
            selector.style.fontStyle = 'normal';
            selector.style.color = 'var(--text-color)';
        }
    }
    
    // 更新控制按鈕狀態
    static updateControlButtons() {
        const theme = this.themes.get(this.currentThemeId);
        const isBuiltin = theme?.builtin || false;
        
        const renameBtn = document.getElementById('theme-rename-btn');
        const deleteBtn = document.getElementById('theme-delete-btn');
        
        if (renameBtn) {
            renameBtn.disabled = isBuiltin;
            renameBtn.style.opacity = isBuiltin ? '0.5' : '1';
            renameBtn.style.cursor = isBuiltin ? 'not-allowed' : 'pointer';
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = isBuiltin;
            deleteBtn.style.opacity = isBuiltin ? '0.5' : '1';
            deleteBtn.style.cursor = isBuiltin ? 'not-allowed' : 'pointer';
        }
    }
    
    // 更新顏色輸入框的值
    static updateColorInputs(colors = null) {
        const colorsToUse = colors || this.getCurrentColors();
        
        Object.entries(colorsToUse).forEach(([key, value]) => {
            const input = document.getElementById(this.getInputId(key));
            if (input) {
                input.value = value;
            }
        });
    }
    
   // 顯示主題名稱輸入框
static showThemeNameInput(title, message, onConfirm, defaultValue = '') {
    // 🔧 找到背景視窗並暫時移除其點擊事件監聽器
    const backgroundModal = document.querySelector('.modal.show');
    let originalHandler = null;
    
    if (backgroundModal) {
        // 克隆節點來移除所有事件監聽器，然後替換回去
        const clonedModal = backgroundModal.cloneNode(true);
        backgroundModal.parentNode.replaceChild(clonedModal, backgroundModal);
        
        // 儲存引用以便稍後恢復
        originalHandler = clonedModal;
    }
    const content = `
        <div class="compact-modal-content">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.edit({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${title}</h3>
                </div>
                <button class="close-modal" onclick="ThemeManager.cancelThemeInput()">×</button>
            </div>
            
            <p class="compact-modal-desc" style="text-align: left;">
                ${message}
            </p>

            <div class="compact-section" style="text-align: left; padding: 0;">
                <input type="text" 
                       class="field-input msize-input"
                       id="theme-name-input" 
                       placeholder="${t('themeName')}"
                       value="${defaultValue}" 
                       style="width: 100%; font-size: 1em; padding: 12px 16px; margin-bottom: 0;"
                       onkeydown="if(event.key==='Enter') ThemeManager.confirmThemeName()">
            </div>

            <div class="compact-modal-footer">
                <button class="overview-btn hover-primary" onclick="ThemeManager.cancelThemeInput()">${t('cancel')}</button>
                <button class="overview-btn btn-primary" onclick="ThemeManager.confirmThemeName()">${t('confirm')}</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '1001';
    modal.innerHTML = content;
    
    document.body.appendChild(modal);
    
    this.currentInputCallback = onConfirm;
    this._backgroundModal = originalHandler; // 儲存背景視窗引用
    
    // 前景視窗的點擊事件（正常）
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.cancelThemeInput();
        }
    });
    
    setTimeout(() => {
        const input = document.getElementById('theme-name-input');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}
    
    // 取消主題輸入
   static cancelThemeInput() {
    this.currentInputCallback = null;
    const modal = document.querySelector('.modal:not(.show)');
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
    
    // 🔧 恢復背景視窗的事件監聽器
    if (this._backgroundModal) {
        // 重新添加背景視窗的點擊事件
        this._backgroundModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
        this._backgroundModal = null;
    }
}
    
    // 確認主題名稱輸入 - 修正重複點擊問題
static confirmThemeName() {
    const input = document.getElementById('theme-name-input');
    const modal = input ? input.closest('.modal') : document.querySelector('.modal');
    
    if (input) {
        const name = input.value.trim();
        
        if (name) {
            const callback = this.currentInputCallback;
            this.currentInputCallback = null;
            
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            if (callback) {
                callback(name);
            }
        } else {
            NotificationManager.warning(t('pleaseEnterThemeName'));
            input.focus();
        }
    }
}
    
// 載入儲存的主題
static loadThemes() {
    try {
        const saved = localStorage.getItem('characterCreator_customThemes');
        if (saved) {
            const data = JSON.parse(saved);
            
            // 載入主題資料
            for (const [id, theme] of Object.entries(data.customThemes || {})) {
                this.themes.set(id, theme);
            }
            
            this.currentThemeId = data.currentTheme || 'default';
            this.nextId = data.nextId || 1;
        } else {
            // 首次載入，建立預設主題
            this.createBuiltinThemes();
        }
        
        // 確保內建主題始終存在
        if (!this.themes.has('default') || !this.themes.has('night')) {
            this.createBuiltinThemes();
        }
    } catch (error) {
        console.error('載入主題失敗:', error);
        this.createBuiltinThemes();
    }
}
    
// 工具函數 - 使用舊版邏輯
static getCSSVarName(key) {
    const mapping = {
        primary: '--primary-color',
        secondary: '--secondary-color', 
        accent: '--accent-color',
        bg: '--bg-color',
        surface: '--surface-color',
        textColor: '--text-color',
        textMuted: '--text-muted',
        borderColor: '--border-color',
        headerBg: '--header-bg',
        sidebarBg: '--sidebar-bg',
        mainContentBg: '--main-content-bg',
        contentBg: '--content-bg',
        successColor: '--success-color',
        warningColor: '--warning-color',
        dangerColor: '--danger-color'
    };
    return mapping[key] || `--${key}`;
}
    
static getInputId(key) {
    const mapping = {
        primary: 'primary-color',
        secondary: 'secondary-color',
        accent: 'accent-color', 
        bg: 'bg-color',
        surface: 'surface-color',
        textColor: 'text-color',
        textMuted: 'text-muted',
        borderColor: 'border-color',
        headerBg: 'header-bg',
        sidebarBg: 'sidebar-bg',
        mainContentBg: 'main-content-bg',
        contentBg: 'content-bg',
        successColor: 'success-color',
        warningColor: 'warning-color',
        dangerColor: 'danger-color'
    };
    return mapping[key] || key;
}
}

// 🎨 ColorManager - 整合後的顏色管理器
class ColorManager {
    // 顯示主題設定介面
    static show() {
        const modal = this.createThemeModal();
        
        // 初始化主題控制
        setTimeout(() => {
            ThemeManager.updateThemeInterface();
            this.setupColorInputListeners();
        }, 100);
        
        return modal;
    }
    
    // 建立主題設定模態框
    static createThemeModal() {
    const colorInputsHTML = this.generateColorInputs();
    
    const content = `
        <div class="compact-modal-content" style="max-width: 600px; padding: 30px;">
            <div class="compact-modal-header" style="justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${IconManager.palette({width: 18, height: 18})}
                    <h3 class="compact-modal-title">${t('interfaceThemeSettings')}</h3>
                </div>
                <button class="close-modal" onclick="ColorManager.closeModal()">×</button>
            </div>
            
            <!-- 主題控制區 -->
            <div class="compact-section" style="text-align: left; margin-top:25px; padding: 0px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    ${IconManager.folder({width: 14, height: 14})}
                    ${t('themeSelectionAndOperations')}
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; padding: 0px;">
                    <select id="theme-selector" 
                            class="overview-sort-dropdown hover-primary"
                            onchange="ThemeManager.switchTheme(this.value)" 
                            style="flex: 1;">
                        <!-- 選項由 ThemeManager 動態生成 -->
                    </select>
                    
                    <!-- 控制按鈕組 -->
                    ${this.createCompactControlButton('save', t('saveTheme'), 'ThemeManager.saveCurrentTheme()')}
                    ${this.createCompactControlButton('save-as', t('saveAsNewTheme'), 'ThemeManager.saveAsNewTheme()')}
                    ${this.createCompactControlButton('rename', t('renameTheme'), 'ThemeManager.renameTheme()', 'theme-rename-btn')}
                    ${this.createCompactControlButton('export', t('exportColorTheme'), 'ThemeManager.exportTheme()')}
                    ${this.createCompactControlButton('import', t('importColorTheme'), 'ThemeManager.importTheme()')}
                    ${this.createCompactControlButton('delete', t('deleteTheme'), 'ThemeManager.deleteTheme()', 'theme-delete-btn')}
                </div>
            </div>
            
            <!-- 顏色設定區域 -->
            <div class="compact-section" style="text-align: left; padding: 0px; margin-top:30px;">
                <div class="compact-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    ${IconManager.palette({width: 14, height: 14})}
                    ${t('colorCustomization')}
                </div>
                
                <div class="color-inputs-grid" style="
                    display: grid; 
                    grid-template-columns: repeat(4, 1fr); 
                    gap: 0px;
                    margin-top: 25px;
                ">
                    ${colorInputsHTML}
                </div>
            </div>
        </div>
    `;

    return ModalManager.create({
        title: '',
        content: content,
        footer: '',
        maxWidth: '750px'
    });
}


static createCompactControlButton(type, title, onclick, id = '') {
    const getIcon = (iconType) => {
        switch(iconType) {
            case 'save':
                return IconManager.save({width: 17, height: 17});
            case 'save-as': 
                return IconManager.file({width: 17, height: 17});
            case 'rename':
                return IconManager.edit({width: 17, height: 17});
            case 'export':
                return IconManager.download({width: 17, height: 17});
            case 'import':
                return IconManager.import({width: 17, height: 17});
            case 'delete':
                return IconManager.delete({width: 17, height: 17});
            default:
                return '';
        }
    };
    
    return `
        <button ${id ? `id="${id}"` : ''} 
                onclick="${onclick}" 
                title="${title}" 
                class="overview-btn hover-primary">
            ${getIcon(type)}
        </button>
    `;
}

    
// 生成顏色輸入框
static generateColorInputs() {
    const colorMappings = {
        primary: t('primaryColor'),
        secondary: t('secondaryColor'),
        accent: t('accentColor'),
        bg: t('bgColor'),
        surface: t('surfaceColor'),
        textColor: t('textColor'),
        textMuted: t('textMutedColor'),
        borderColor: t('borderColor'),
        headerBg: t('headerBgColor'),
        sidebarBg: t('sidebarBgColor'),
        mainContentBg: t('mainContentBgColor'),
        contentBg: t('contentBgColor'),
        successColor: t('successColor'),
        warningColor: t('warningColor'),
        dangerColor: t('dangerColor')
    };
    
    return Object.entries(colorMappings).map(([key, label]) => {
        const inputId = ThemeManager.getInputId(key);
        return `
            <div class="color-input-group" style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                margin-bottom: 16px;
            ">
                <input type="color" class="color-input" id="${inputId}" 
                       style="
                           width: 55px; 
                           height: 55px; 
                           border: none; 
                           border-radius: 8px; 
                           cursor: pointer;
                           background: none;
                           padding: 0;
                           margin-bottom: 8px;
                       ">
                <label style="
                    font-size: 0.8em; 
                    color: var(--text-color); 
                    text-align: center;
                    line-height: 1.3;
                    max-width: 80px;
                ">
                    ${label}
                </label>
            </div>
        `;
    }).join('');
}
    
    // 設定顏色輸入監聽器
    static setupColorInputListeners() {
        const colorInputs = document.querySelectorAll('.color-input');
        
        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleColorChange(e.target.id, e.target.value);
            });
        });
    }
    
    // 處理顏色變更
    static handleColorChange(inputId, value) {
        // 將 input ID 轉換為 CSS 變數名稱
        const cssVar = `--${inputId}`;
        
        // 立即應用顏色
        document.documentElement.style.setProperty(cssVar, value);
        
        // 標記為已修改
        ThemeManager.markAsModified();
    }
    
    // 關閉模態框
    static closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    }
}

// 🎨 舊版相容函數 - 保持與現有代碼的相容性
function showColorPicker() {
    ColorManager.show();
}

function handleColorImportFromModal(event) {
    // 這個函數現在由 ThemeManager.importTheme() 處理
    ThemeManager.importTheme();
}

function applyImportedColors(colors) {
    ThemeManager.applyThemeColors(colors);
    ThemeManager.markAsModified();
}

// 🚀 初始化主題系統
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.initialize();
});