// ===== Google 雲端同步管理器（僅使用 OAuth2.0）=====
class GoogleCloudSync {
    constructor() {
        this.isSignedIn = false;
        this.gapi = null;
        this.currentUser = null;
        this.accessToken = null;
        
        // 🛡️ 只需要 Client ID（公開安全）
        this.CLIENT_ID = '601592669531-36o2ec8fbb8b103sc9agio8239dm33ll.apps.googleusercontent.com'; // 🔧 記得替換
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.FOLDER_NAME = 'ChroniclerBackups';
        this.folderId = null;
        this.maxBackups = 5;
    }

    // 初始化 Google API
    async init() {
        try {
            await this.loadGoogleAPI();
            
            // 初始化 OAuth2
            await new Promise((resolve) => {
                gapi.load('auth2', () => {
                    gapi.auth2.init({
                        client_id: this.CLIENT_ID,
                    }).then(resolve);
                });
            });

            const authInstance = gapi.auth2.getAuthInstance();
            this.isSignedIn = authInstance.isSignedIn.get();
            
            if (this.isSignedIn) {
                this.currentUser = authInstance.currentUser.get();
                this.accessToken = this.currentUser.getAuthResponse().access_token;
                
                // 檢查 token 是否需要更新
                await this.refreshTokenIfNeeded();
            }

            this.updateAuthStatus();
            
        } catch (error) {
            console.error('Google API 初始化失敗:', error);
            this.showError(t('googleApiInitFailed'));
        }
    }

    // 載入 Google API 腳本
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 登入 Google
    async signIn() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            this.currentUser = user;
            this.isSignedIn = true;
            this.accessToken = user.getAuthResponse().access_token;
            
            // 建立備份資料夾
            await this.ensureBackupFolder();
            
            this.updateAuthStatus();
            NotificationManager.success(t('googleSignInSuccess'));
            
        } catch (error) {
            console.error('Google 登入失敗:', error);
            this.showError(t('googleSignInFailed'));
        }
    }

    // 登出 Google
    async signOut() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            this.currentUser = null;
            this.isSignedIn = false;
            this.accessToken = null;
            this.folderId = null;
            
            this.updateAuthStatus();
            NotificationManager.success(t('googleSignOutSuccess'));
            
        } catch (error) {
            console.error('Google 登出失敗:', error);
            this.showError(t('googleSignOutFailed'));
        }
    }

    // 檢查並更新 token
    async refreshTokenIfNeeded() {
        if (!this.currentUser) return;
        
        const authResponse = this.currentUser.getAuthResponse();
        const expiresAt = authResponse.expires_at;
        const now = Date.now();
        
        // 如果 token 在 5 分鐘內過期，就更新
        if (expiresAt - now < 5 * 60 * 1000) {
            try {
                const newAuthResponse = await this.currentUser.reloadAuthResponse();
                this.accessToken = newAuthResponse.access_token;
            } catch (error) {
                console.error('Token 更新失敗:', error);
                // Token 更新失敗，要求重新登入
                await this.signOut();
                throw new Error(t('pleaseSignInAgain'));
            }
        }
    }

    // 確保備份資料夾存在
    async ensureBackupFolder() {
        if (this.folderId) return this.folderId;
        
        try {
            // 搜尋是否已有備份資料夾
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            
            const searchResult = await searchResponse.json();
            
            if (searchResult.files && searchResult.files.length > 0) {
                this.folderId = searchResult.files[0].id;
                return this.folderId;
            }
            
            // 建立新資料夾
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: this.FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            
            const folder = await createResponse.json();
            this.folderId = folder.id;
            return this.folderId;
            
        } catch (error) {
            console.error('建立備份資料夾失敗:', error);
            throw error;
        }
    }

    // 上傳備份到雲端
    async uploadBackup() {
        try {
            await this.refreshTokenIfNeeded();
            await this.ensureBackupFolder();
            
            // 產生備份資料
            const backupData = this.createBackupData();
            const fileName = this.generateFileName();
            
            // 上傳檔案
            const fileId = await this.uploadFile(fileName, backupData);
            
            // 清理舊備份
            await this.cleanupOldBackups();
            
            NotificationManager.success(t('uploadBackupSuccess'));
            return fileId;
            
        } catch (error) {
            console.error('上傳備份失敗:', error);
            this.showError(t('uploadBackupFailed'));
            throw error;
        }
    }

    // 下載備份從雲端
    async downloadBackup() {
        try {
            await this.refreshTokenIfNeeded();
            await this.ensureBackupFolder();
            
            // 列出備份檔案
            const backupFiles = await this.listBackupFiles();
            
            if (backupFiles.length === 0) {
                NotificationManager.warning(t('noBackupFilesFound'));
                return;
            }
            
            // 顯示備份檔案選擇器
            this.showBackupSelector(backupFiles);
            
        } catch (error) {
            console.error('下載備份失敗:', error);
            this.showError(t('downloadBackupFailed'));
            throw error;
        }
    }

    // 產生備份資料
    createBackupData() {
        // 🎯 復用現有的匯出功能
        const folders = ExportManager.collectAllFolderData();
        
        const exportData = {
            characters: characters,
            customSections: customSections,
            worldBooks: worldBooks,
            userPersonas: userPersonas,
            loveyDoveyCharacters: loveyDoveyCharacters,
            folders: folders,
            settings: {
                customThemes: localStorage.getItem('characterCreator_customThemes'),
                currentTheme: ThemeManager.currentThemeId,
                customColors: localStorage.getItem('characterCreatorCustomColors'),
                otherSettings: localStorage.getItem('characterCreator_otherSettings'),
                sortPreference: localStorage.getItem('characterCreator-sortPreference'),
                selectedTags: localStorage.getItem('characterCreator-selectedTags')
            },
            exportDate: new Date().toISOString(),
            version: '2.1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // 產生檔案名稱
    generateFileName() {
        const now = new Date();
        const dateStr = now.getFullYear() + '-' +
                       String(now.getMonth() + 1).padStart(2, '0') + '-' +
                       String(now.getDate()).padStart(2, '0');
        const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
                       String(now.getMinutes()).padStart(2, '0');
        
        return `chronicler_backup_${dateStr}_${timeStr}.json`;
    }

    // 上傳檔案到 Drive
    async uploadFile(fileName, content) {
        const metadata = {
            name: fileName,
            parents: [this.folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: form
        });

        const result = await response.json();
        return result.id;
    }

    // 列出備份檔案
    async listBackupFiles() {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and name contains 'chronicler_backup' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        const result = await response.json();
        return result.files || [];
    }

    // 下載檔案內容
    async downloadFile(fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.text();
    }

    // 刪除檔案
    async deleteFile(fileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
    }

    // 清理舊備份（保留最新 5 個）
    async cleanupOldBackups() {
        try {
            const backupFiles = await this.listBackupFiles();
            
            if (backupFiles.length > this.maxBackups) {
                const filesToDelete = backupFiles.slice(this.maxBackups);
                
                for (const file of filesToDelete) {
                    await this.deleteFile(file.id);
                }
            }
        } catch (error) {
            console.warn('清理舊備份失敗:', error);
        }
    }

    // 顯示備份檔案選擇器
    showBackupSelector(backupFiles) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const fileListHTML = backupFiles.map(file => {
            const date = new Date(file.createdTime);
            const dateStr = date.toLocaleString();
            const sizeStr = file.size ? `${Math.round(file.size / 1024)}KB` : '';
            
            return `
                <div class="backup-file-item" style="
                    padding: 12px 16px; 
                    margin-bottom: 8px; 
                    background: var(--surface-color); 
                    border: 1px solid var(--border-color); 
                    border-radius: 6px; 
                    cursor: pointer; 
                    transition: all 0.2s ease;
                " onclick="googleCloudSync.restoreBackup('${file.id}'); this.closest('.modal').remove();"
                   onmouseover="this.style.background='var(--bg-color)'" 
                   onmouseout="this.style.background='var(--surface-color)'">
                    
                    <div style="font-weight: 500; color: var(--text-color); margin-bottom: 4px;">
                        ${file.name}
                    </div>
                    <div style="font-size: 0.85em; color: var(--text-muted);">
                        ${dateStr} ${sizeStr ? `• ${sizeStr}` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="compact-modal-content" style="max-width: 500px;">
                <div class="compact-modal-header">
                    <h3 class="compact-modal-title">${t('selectBackupFile')}</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
                    ${fileListHTML}
                </div>
                
                <div class="compact-modal-footer">
                    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // 恢復備份
    async restoreBackup(fileId) {
        try {
            const backupContent = await this.downloadFile(fileId);
            
            // 🎯 復用現有的匯入功能
            const data = JSON.parse(backupContent);
            
            // 使用 ImportManager 的邏輯
            const success = await this.restoreBackupData(data);
            
            if (success) {
                NotificationManager.success(t('restoreBackupSuccess'));
                
                // 重新載入頁面以確保狀態正確
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
            
        } catch (error) {
            console.error('恢復備份失敗:', error);
            this.showError(t('restoreBackupFailed'));
        }
    }

    // 恢復備份資料
    async restoreBackupData(data) {
        try {
            // 🎯 復用 ImportManager 的邏輯
            characters = data.characters || [];
            customSections = data.customSections || [];
            worldBooks = data.worldBooks || [];
            userPersonas = data.userPersonas || [];
            loveyDoveyCharacters = data.loveyDoveyCharacters || [];
            
            // 恢復設定
            if (data.settings) {
                if (data.settings.customThemes) {
                    localStorage.setItem('characterCreator_customThemes', data.settings.customThemes);
                    ThemeManager.loadThemes();
                }
                if (data.settings.currentTheme) {
                    ThemeManager.switchTheme(data.settings.currentTheme);
                }
                if (data.settings.customColors) {
                    localStorage.setItem('characterCreatorCustomColors', data.settings.customColors);
                }
                if (data.settings.otherSettings) {
                    localStorage.setItem('characterCreator_otherSettings', data.settings.otherSettings);
                    OtherSettings.loadSettings();
                    const settings = JSON.parse(data.settings.otherSettings);
                    OtherSettings.applyLoveyDoveyVisibility(settings.showLoveyDovey);
                }
                if (data.settings.sortPreference) {
                    localStorage.setItem('characterCreator-sortPreference', data.settings.sortPreference);
                }
                if (data.settings.selectedTags) {
                    localStorage.setItem('characterCreator-selectedTags', data.settings.selectedTags);
                }
            }

            // 恢復資料夾結構
            if (data.folders) {
                ImportManager.restoreAllFolders(data.folders);
            }
            
            // 重置狀態變數
            currentCharacterId = characters[0]?.id || null;
            currentVersionId = characters[0]?.versions[0]?.id || null;
            currentCustomSectionId = customSections[0]?.id || null;
            currentCustomVersionId = customSections[0]?.versions[0]?.id || null;
            currentWorldBookId = worldBooks[0]?.id || null;
            currentWorldBookVersionId = worldBooks[0]?.versions[0]?.id || null;
            currentUserPersonaId = userPersonas[0]?.id || null;
            currentUserPersonaVersionId = userPersonas[0]?.versions[0]?.id || null;
            currentLoveyDoveyId = loveyDoveyCharacters[0]?.id || null;
            currentLoveyDoveyVersionId = loveyDoveyCharacters[0]?.versions[0]?.id || null;
            currentMode = 'character';
            compareVersions = [];
            
            // 保存資料
            await saveDataSilent();
            
            return true;
            
        } catch (error) {
            console.error('恢復備份資料失敗:', error);
            throw error;
        }
    }

    // 更新認證狀態顯示
    updateAuthStatus() {
        const statusElement = document.getElementById('google-account-status');
        const authButton = document.getElementById('google-auth-btn');
        const uploadButton = document.getElementById('upload-backup-btn');
        const downloadButton = document.getElementById('download-backup-btn');

        if (!statusElement) return;

        if (this.isSignedIn && this.currentUser) {
            const profile = this.currentUser.getBasicProfile();
            const userName = profile.getName();
            const userEmail = profile.getEmail();

            statusElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="color: var(--success-color); font-weight: 500;">
                        ${IconManager.check({width: 16, height: 16})} ${t('connectedToGoogle')}
                    </div>
                </div>
                <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 4px;">
                    ${userName} (${userEmail})
                </div>
            `;

            authButton.textContent = t('disconnectFromGoogle');
            authButton.onclick = () => this.signOut();
            
            if (uploadButton) uploadButton.disabled = false;
            if (downloadButton) downloadButton.disabled = false;

        } else {
            statusElement.innerHTML = `
                <div style="color: var(--text-muted); font-size: 0.9em;">
                    ${t('notConnectedToGoogle')}
                </div>
            `;

            authButton.textContent = t('connectToGoogle');
            authButton.onclick = () => this.signIn();
            
            if (uploadButton) uploadButton.disabled = true;
            if (downloadButton) downloadButton.disabled = true;
        }
    }

    // 顯示錯誤訊息
    showError(message) {
        NotificationManager.error(message);
    }
}

function handleGoogleAuth() {
    if (googleCloudSync.isSignedIn) {
        googleCloudSync.signOut();
    } else {
        googleCloudSync.signIn();
    }
}

function uploadBackupToCloud() {
    googleCloudSync.uploadBackup();
}

function downloadBackupFromCloud() {
    googleCloudSync.downloadBackup();
}

function checkGoogleAuthStatus() {
    if (!googleCloudSync.gapi) {
        googleCloudSync.init();
    } else {
        googleCloudSync.updateAuthStatus();
    }
}

// 建立全域實例
const googleCloudSync = new GoogleCloudSync();