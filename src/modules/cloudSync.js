// ===== (元素)鎖定器 (提供載入中狀態) =====
class ButtonLocker {
    static lockedElements = new Map();

    static loadingSpinner = `
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite; margin-right: 8px;">
            <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" fill="currentColor"/>
            <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" class="spinner-path" fill="currentColor"/>
        </svg>
    `;

    static lock(element) {
        if (!element || this.lockedElements.has(element)) return;

        const originalContent = element.innerHTML;
        this.lockedElements.set(element, originalContent);

        if (element.tagName === 'BUTTON') {
            element.disabled = true;
        }
        element.style.pointerEvents = 'none'; // 禁用點擊事件
        element.style.opacity = '0.7';

        // 保持內容但顯示載入動畫
        element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%;">${this.loadingSpinner} ${t('processing')}</div>`;
    }

    static unlock(element) {
        if (!element || !this.lockedElements.has(element)) return;

        const originalContent = this.lockedElements.get(element);
        element.innerHTML = originalContent;
        if (element.tagName === 'BUTTON') {
            element.disabled = false;
        }
        element.style.pointerEvents = 'auto'; // 恢復點擊事件
        element.style.opacity = '1';

        this.lockedElements.delete(element);
    }
}

// ===== Google 雲端同步管理器（使用新的 Google Identity Services）=====
class GoogleCloudSync {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this._tokenRefreshPromise = null;
        this.CLIENT_ID = '601592669531-36o2ec8fbb8b103sc9agio8239dm33ll.apps.googleusercontent.com';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
        this.FOLDER_NAME = 'ChroniclerBackups';
        this.folderId = null;
        this.maxBackups = 5;
        this.tokenClient = null;
    }

    async init() {
        try {
            const storedToken = localStorage.getItem('google_auth_token');
            if (storedToken) {
                const tokenData = JSON.parse(storedToken);
                if (tokenData.expiresAt && Date.now() < tokenData.expiresAt) {
                    this.accessToken = tokenData.accessToken;
                    this.isSignedIn = true;
                    this.currentUser = tokenData.userProfile || null;
                    this.tokenExpiresAt = tokenData.expiresAt;
                } else {
                    localStorage.removeItem('google_auth_token');
                }
            }

            await this.loadGoogleIdentityServices();
            
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (tokenResponse) => {
                    this._handleTokenResponse(tokenResponse);
                    if (!tokenResponse.error) {
                         NotificationManager.success(t('googleAuthSuccess'));
                    }
                },
            });
            
            this.updateAuthStatus();
            
        } catch (error) {
            console.error('Google Identity Services 初始化失敗:', error);
            this.showError(t('googleServicesInitFailed'));
        }
    }

    async _handleTokenResponse(tokenResponse) {
        // 如果有正在等待的續期請求，先處理它
        if (this._tokenRefreshPromise) {
            if (tokenResponse.error) {
                // 靜默續期失敗，只拒絕 promise，讓 ensureValidToken 接著處理
                console.error(t('oauthError'), tokenResponse);
                this._tokenRefreshPromise.reject(new Error(tokenResponse.error));
            } else {
                // 續期成功，將新的 token 傳回去
                this._tokenRefreshPromise.resolve(tokenResponse.access_token);
            }
        }

        if (tokenResponse.error) {
            // 如果不是在續期中，或者續期也徹底失敗了，才顯示錯誤並重設狀態
            // 這種情況通常發生在初次手動登入就失敗時
            if (!this._tokenRefreshPromise) { 
                this.showError(t('authFailed') + ': ' + tokenResponse.error);
                localStorage.removeItem('google_auth_token');
                this.isSignedIn = false;
                this.accessToken = null;
                this.currentUser = null;
                this.tokenExpiresAt = null;
                this.updateAuthStatus();
            }
            return;
        }
        
        this.accessToken = tokenResponse.access_token;
        this.isSignedIn = true;

        // 只有在成功獲取 token 後才更新使用者資訊和儲存
        await this.fetchUserProfile(); 
        
        const expiresAt = Date.now() + (parseInt(tokenResponse.expires_in, 10) * 1000);
        this.tokenExpiresAt = expiresAt;

        const tokenData = {
            accessToken: this.accessToken,
            expiresAt: expiresAt,
            userProfile: this.currentUser
        };
        localStorage.setItem('google_auth_token', JSON.stringify(tokenData));
        
        this.updateAuthStatus();
    }

    async fetchUserProfile() {
        try {
            if (!this.accessToken) return;
            
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }
            
            const profile = await response.json();
            this.currentUser = {
                name: profile.name,
                email: profile.email,
                picture: profile.picture
            };
            
        } catch (error) {
            console.error("獲取 Google 使用者資訊失敗:", error);
            this.currentUser = null; // 獲取失敗時清空
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
                google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('Token 已撤銷');
                });
            }
            
            localStorage.removeItem('google_auth_token');
            
            this.currentUser = null;
            this.isSignedIn = false;
            this.accessToken = null;
            this.folderId = null;
            this.tokenExpiresAt = null;
            
            this.updateAuthStatus();
            NotificationManager.success(t('googleLogoutSuccess'));
            
        } catch (error) {
            console.error('登出失敗:', error);
            this.showError(t('logoutFailed'));
        }
    }

    // 檢查 token 有效性，並在過期時自動續期 (帶有備用方案)
    async ensureValidToken() {
        if (!this.accessToken) {
            throw new Error(t('notLoggedInGoogle'));
        }

        const isExpired = Date.now() >= (this.tokenExpiresAt - 5 * 60 * 1000);

        if (!isExpired) {
            return this.accessToken; // Token 仍然有效，直接返回
        }

        // 如果已經有另一個操作正在進行續期，就等待它完成
        if (this._tokenRefreshPromise) {
            return await this._tokenRefreshPromise.promise;
        }

        // --- 開始續期流程 ---
        let resolver, rejecter;
        const promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });
        this._tokenRefreshPromise = { promise, resolve: resolver, reject: rejecter };
        
        try {
            console.log('Token expired. Attempting silent refresh...');
            NotificationManager.info(t('refreshingGoogleToken'));
            
            // 步驟 1: 嘗試靜默續期
            this.tokenClient.requestAccessToken({ prompt: 'none' });
            
            const newAccessToken = await this._tokenRefreshPromise.promise;
            
            console.log('Silent refresh successful!');
            this._tokenRefreshPromise = null; // 清理
            return newAccessToken;

        } catch (silentError) {
            console.warn('Silent refresh failed. Switching to manual consent.', silentError);
            NotificationManager.warning(t('googleSessionExpired'), 6000);

            // 步驟 2: 靜默續期失敗，切換到手動續期 (會跳出 Google 登入視窗)
            try {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
                
                // 再次等待同一個 promise 被新的 callback 完成
                const newAccessToken = await this._tokenRefreshPromise.promise;
                
                console.log('Manual refresh successful!');
                NotificationManager.success(t('googleAuthSuccess'));
                return newAccessToken;

            } catch (manualError) {
                console.error('Manual refresh also failed:', manualError);
                this.showError(t('tokenRefreshFailed'));
                throw new Error(t('tokenRefreshFailed'));
            } finally {
                this._tokenRefreshPromise = null; // 無論成功或失敗，最後都要清理
            }
        }
    }

    // 🚀 上傳備份
    async uploadBackup() {
        const uploadButton = document.getElementById('upload-backup-btn');
        ButtonLocker.lock(uploadButton); // 鎖定按鈕

        try {
            const token = await this.ensureValidToken();
            const backupData = this.createBackupData();
            const fileName = this.generateFileName();
            await this.ensureBackupFolder();
            const fileId = await this.uploadFile(fileName, backupData, token);
            await this.cleanupOldBackups();
            NotificationManager.success(t('backupUploadSuccess'));
            return fileId;
        } catch (error) {
            console.error('上傳失敗:', error);
            this.showError(t('uploadFailed') + ': ' + (error.message || t('unknownError')));
        } finally {
            ButtonLocker.unlock(uploadButton); // 無論成功或失敗都解鎖
        }
    }

    // 🔽 下載備份
    async downloadBackup() {
        const downloadButton = document.getElementById('download-backup-btn');
        ButtonLocker.lock(downloadButton); // 鎖定按鈕

        try {
            const token = await this.ensureValidToken();
            await this.ensureBackupFolder();
            const files = await this.listBackupFiles(token);
            
            if (files.length === 0) {
                NotificationManager.warning(t('backupNotFound'));
                return;
            }
            this.showBackupSelector(files);
        } catch (error) {
            console.error('列出備份失敗:', error);
            this.showError(t('backupListFailed') + ': ' + (error.message || t('unknownError')));
        } finally {
            ButtonLocker.unlock(downloadButton); // 無論成功或失敗都解鎖
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
                presets: presets,
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
            
            // ⭐⭐⭐ 修改 onclick 事件 ⭐⭐⭐
            // 將 this (DOM 元素本身) 傳遞給 restoreBackup
            return `
                <div class="backup-file-item" style="
                    padding: 12px 16px; 
                    margin-bottom: 8px; 
                    background: var(--surface-color); 
                    border: 1px solid var(--border-color); 
                    border-radius: 6px; 
                    cursor: pointer; 
                    transition: all 0.2s ease;
                " onclick="googleCloudSync.restoreBackup('${file.id}', this);" 
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

    async restoreBackup(fileId, element) { 
        ButtonLocker.lock(element); // 鎖定被點擊的列表項目

        try {
            const token = await this.ensureValidToken();
            const backupContent = await this.downloadFile(fileId, token);
            
            const data = JSON.parse(backupContent);
            
            // 關閉選擇器模態框
            element.closest('.modal').remove();

            const success = await ImportManager.importFromDataObject(data);
            
            if (success) {
                NotificationManager.success(t('backupRestoreSuccess'));
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
            // 如果使用者取消 (success === false)，則不需要做任何事
            
        } catch (error) {
            console.error('恢復備份失敗:', error);
            this.showError(t('restoreFailed') + ': ' + (error.message || t('unknownError')));
            ButtonLocker.unlock(element); // 只有在發生嚴重錯誤時才需要手動解鎖
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
            presets = data.presets || [];
            
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
            currentPresetId = presets[0]?.id || null;
            currentPresetVersionId = presets[0]?.versions[0]?.id || null; 
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
            statusElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
                    <img src="${this.currentUser.picture}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%;">
                    <div style="line-height: 1.4;">
                        <div style="font-weight: 600; color: var(--text-color); font-size: 0.95em;">
                            ${this.currentUser.name}
                        </div>
                        <div style="font-size: 0.85em; color: var(--text-muted);">
                            ${this.currentUser.email}
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.85em; color: var(--success-color); margin-top: 8px; font-weight: 500;">
                    ✅ ${t('connectedToGoogleDrive')}
                </div>
            `;

            authButton.textContent = t('disconnect');
            authButton.onclick = () => this.signOut();
            
            if (uploadButton) {
                uploadButton.disabled = false;
                uploadButton.style.opacity = '1';
                uploadButton.style.cursor = 'pointer';
            }
            if (downloadButton) {
                downloadButton.disabled = false;
                downloadButton.style.opacity = '1';
                downloadButton.style.cursor = 'pointer';
            }

        } else {
            statusElement.innerHTML = `
                <div style="color: var(--text-muted); font-size: 0.9em; padding: 20px 0; text-align: center;">
                    ${t('notConnectedToGoogle')}
                </div>
            `;

            authButton.textContent = t('connectToGoogle');
            authButton.onclick = () => this.signIn();
            
            if (uploadButton) {
                uploadButton.disabled = false; // 保持可點擊
                uploadButton.style.opacity = '0.6'; // 視覺上顯示未啟用
                uploadButton.style.cursor = 'pointer';
            }
            if (downloadButton) {
                downloadButton.disabled = false; // 保持可點擊
                downloadButton.style.opacity = '0.6'; // 視覺上顯示未啟用
                downloadButton.style.cursor = 'pointer';
            }
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
    // 🛡️ 添加：未登入時的友善提醒
    if (!googleCloudSync.isSignedIn) {
        NotificationManager.warning(t('pleaseLoginFirst'));
        return;
    }
    
    googleCloudSync.uploadBackup();
}

function downloadBackupFromCloud() {
    // 🛡️ 添加：未登入時的友善提醒
    if (!googleCloudSync.isSignedIn) {
        NotificationManager.warning(t('pleaseLoginFirst'));
        return;
    }
    
    googleCloudSync.downloadBackup();
}

function checkGoogleAuthStatus() {
    googleCloudSync.init();
}

// 建立全域實例
const googleCloudSync = new GoogleCloudSync();