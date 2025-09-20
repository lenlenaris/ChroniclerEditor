// ===== Google 雲端同步管理器（使用新的 Google Identity Services）=====
class GoogleCloudSync {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null; // 這個屬性在新版中較少使用，但保留以防萬一
        this.accessToken = null;
        
        // 🛡️ 只需要 Client ID（公開安全）
        this.CLIENT_ID = '601592669531-36o2ec8fbb8b103sc9agio8239dm33ll.apps.googleusercontent.com';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.FOLDER_NAME = 'ChroniclerBackups';
        this.folderId = null;
        this.maxBackups = 5;
        this.tokenClient = null; // 新增：用來儲存 GIS 的 token client
    }

    // 🎯 使用新的 Google Identity Services 初始化
    async init() {
        try {
            // 載入新的 Google Identity Services
            await this.loadGoogleIdentityServices();
            
            // 初始化 token client
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error) {
                        console.error(t('oauthError'), tokenResponse);
                        this.showError(t('authFailed') + ': ' + tokenResponse.error);
                        return;
                    }
                    
                    this.accessToken = tokenResponse.access_token;
                    this.isSignedIn = true;
                    this.updateAuthStatus();
                    NotificationManager.success(t('googleLoginSuccess'));
                },
            });
            
            this.updateAuthStatus();
            
        } catch (error) {
            console.error('Google Identity Services 初始化失敗:', error);
            this.showError(t('googleServicesInitFailed'));
        }
    }

    // 載入新的 Google Identity Services
    async loadGoogleIdentityServices() {
        // 如果已經載入，就直接返回
        if (window.google?.accounts?.oauth2) {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // GIS 載入後，window.google 物件會存在
                if (window.google?.accounts?.oauth2) {
                    resolve();
                } else {
                    // 有時候網路延遲，需要稍微等待
                    setTimeout(() => {
                        if (window.google?.accounts?.oauth2) {
                            resolve();
                        } else {
                            reject(new Error('Google Identity Services object not found after script load.'));
                        }
                    }, 500);
                }
            };
            script.onerror = () => reject(new Error('Google Identity Services script failed to load.'));
            document.head.appendChild(script);
        });
    }

    // 🎯 使用新的授權流程
    async signIn() {
        try {
            if (!this.tokenClient) {
                // 如果 client 還沒準備好，可以嘗試重新初始化
                await this.init();
                if (!this.tokenClient) {
                     throw new Error('Google Identity Services 未就緒');
                }
            }

            // 請求授權 token
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
            
        } catch (error) {
            console.error('Google 登入失敗:', error);
            this.showError(t('loginFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    // 登出
    async signOut() {
        try {
            if (this.accessToken) {
                // 撤銷 access token
                google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('Token 已撤銷');
                });
            }
            
            this.currentUser = null;
            this.isSignedIn = false;
            this.accessToken = null;
            this.folderId = null;
            
            this.updateAuthStatus();
            NotificationManager.success(t('googleLogoutSuccess'));
            
        } catch (error) {
            console.error('登出失敗:', error);
            this.showError(t('logoutFailed'));
        }
    }

    // 檢查 token 有效性
    async ensureValidToken() {
        if (!this.accessToken) {
            throw new Error(t('notLoggedInGoogle'));
        }
        // 注意：這裡沒有處理 token 過期的問題，因為 GIS 的 token 通常是一小時。
        // 對於我們這種手動操作的備份/恢復，使用者不太可能掛著一小時不動。
        // 如果未來有自動同步需求，才需要加上 token 刷新邏輯。
        return this.accessToken;
    }

    // 🚀 上傳備份
    async uploadBackup() {
        try {
            const token = await this.ensureValidToken();
            
            // 產生備份資料
            const backupData = this.createBackupData();
            const fileName = this.generateFileName();
            
            // 確保資料夾存在
            await this.ensureBackupFolder();
            
            // 上傳檔案
            const fileId = await this.uploadFile(fileName, backupData, token);
            
            // 清理舊備份
            await this.cleanupOldBackups();
            
            NotificationManager.success(t('backupUploadSuccess'));
            return fileId;
            
        } catch (error) {
            console.error('上傳失敗:', error);
            this.showError(t('uploadFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    // 🔽 下載備份
    async downloadBackup() {
        try {
            const token = await this.ensureValidToken();
            
            // 確保資料夾存在
            await this.ensureBackupFolder();
            
            // 列出備份檔案
            const files = await this.listBackupFiles(token);
            
            if (files.length === 0) {
                NotificationManager.warning(t('backupNotFound'));
                return;
            }
            
            // 顯示檔案選擇器
            this.showBackupSelector(files);
            
        } catch (error) {
            console.error('列出備份失敗:', error);
            this.showError(t('backupListFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    // 🎯 使用現有的匯出功能產生備份
    createBackupData() {
        try {
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
        } catch (error) {
            console.error('備份資料產生失敗:', error);
            throw new Error(t('backupGenerationFailed'));
        }
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

    // 確保備份資料夾存在
    async ensureBackupFolder() {
        if (this.folderId) return this.folderId;
        
        try {
            const token = await this.ensureValidToken();
            
            // 搜尋現有資料夾
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (!searchResponse.ok) {
                throw new Error(`${t('searchFolderFailed')}: ${searchResponse.status}`);
            }
            
            const searchResult = await searchResponse.json();
            
            if (searchResult.files && searchResult.files.length > 0) {
                this.folderId = searchResult.files[0].id;
                return this.folderId;
            }
            
            // 建立新資料夾
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: this.FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            
            if (!createResponse.ok) {
                throw new Error(`${t('createFolderFailed')}: ${createResponse.status}`);
            }
            
            const folder = await createResponse.json();
            this.folderId = folder.id;
            return this.folderId;
            
        } catch (error) {
            console.error('確保備份資料夾失敗:', error);
            throw error;
        }
    }

    // 上傳檔案
    async uploadFile(fileName, content, token) {
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
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`${t('fileUploadFailed')}: ${response.status}`);
        }

        const result = await response.json();
        return result.id;
    }

    // 列出備份檔案
    async listBackupFiles(token) {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and name contains 'chronicler_backup' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`${t('fileListFailed')}: ${response.status}`);
        }

        const result = await response.json();
        return result.files || [];
    }

    // 下載檔案
    async downloadFile(fileId, token) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`${t('fileDownloadFailed')}: ${response.status}`);
        }

        return response.text();
    }

    // 刪除檔案
    async deleteFile(fileId, token) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // 刪除操作不檢查 response.ok，因為即使失敗也不應中斷清理流程
        if (!response.ok) {
            console.warn(`刪除檔案 ${fileId} 失敗: ${response.status}`);
        }
    }

    // 清理舊備份
    async cleanupOldBackups() {
        try {
            const token = await this.ensureValidToken();
            const files = await this.listBackupFiles(token);
            
            if (files.length > this.maxBackups) {
                const filesToDelete = files.slice(this.maxBackups);
                
                // 使用 Promise.all 來並行刪除，提升效率
                await Promise.all(filesToDelete.map(file => this.deleteFile(file.id, token)));
            }
        } catch (error) {
            console.warn('清理舊備份失敗:', error);
        }
    }

    // 顯示備份選擇器
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
            const token = await this.ensureValidToken();
            const backupContent = await this.downloadFile(fileId, token);
            
            const data = JSON.parse(backupContent);
            
            // 🎯 使用現有的匯入邏輯
            const success = await this.restoreBackupData(data);
            
            if (success) {
                NotificationManager.success(t('backupRestoreSuccess'));
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
            
        } catch (error) {
            console.error('恢復備份失敗:', error);
            this.showError(t('restoreFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    // 恢復備份資料
    async restoreBackupData(data) {
        try {
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

        if (this.isSignedIn && this.accessToken) {
            statusElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="color: var(--success-color); font-weight: 500;">
                        ✅ ${t('connectedToGoogleDrive')}
                    </div>
                </div>
                <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 4px;">
                    ${t('canPerformCloudOperations')}
                </div>
            `;

            authButton.textContent = t('disconnect');
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
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            alert(message);
        }
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
    googleCloudSync.init();
}

// 建立全域實例
const googleCloudSync = new GoogleCloudSync();