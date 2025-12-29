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

// ===== Google 雲端同步管理器（使用 Cloudflare Worker OAuth 後端）=====
class GoogleCloudSync {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
        this._tokenRefreshPromise = null;

        // Cloudflare Worker URL
        this.WORKER_URL = 'https://chronicler-oauth.chronicler.workers.dev';

        this.FOLDER_NAME = 'ChroniclerBackups';
        this.folderId = null;
        this.maxBackups = 5;
    }

    async init() {
        try {
            // 檢查 URL 是否有 OAuth 回調資料
            await this._handleOAuthCallback();

            // 從 localStorage 載入已儲存的 token
            const storedToken = localStorage.getItem('google_auth_token');
            if (storedToken) {
                const tokenData = JSON.parse(storedToken);
                this.accessToken = tokenData.accessToken;
                this.refreshToken = tokenData.refreshToken;
                this.currentUser = tokenData.userProfile || null;
                this.tokenExpiresAt = tokenData.expiresAt;

                // 檢查 access token 是否過期，如果過期就嘗試使用 refresh token 續期
                if (this.refreshToken && Date.now() >= this.tokenExpiresAt) {
                    try {
                        await this._refreshAccessToken();
                    } catch (error) {
                        console.warn('Token 續期失敗，需要重新登入:', error);
                        this._clearAuthData();
                    }
                }

                // 確認登入狀態
                if (this.accessToken && this.refreshToken) {
                    this.isSignedIn = true;
                }
            }

            this.updateAuthStatus();

        } catch (error) {
            console.error('Google OAuth 初始化失敗:', error);
            this.showError(t('googleServicesInitFailed'));
        }
    }

    /**
     * 處理 OAuth 回調（從 URL fragment 解析 token）
     */
    async _handleOAuthCallback() {
        const hash = window.location.hash;

        if (hash.includes('auth_success=')) {
            try {
                const authDataStr = decodeURIComponent(hash.split('auth_success=')[1]);
                const authData = JSON.parse(authDataStr);

                // 儲存 token 資料
                this.accessToken = authData.access_token;
                this.refreshToken = authData.refresh_token;
                this.currentUser = authData.user;
                this.tokenExpiresAt = Date.now() + (authData.expires_in * 1000);
                this.isSignedIn = true;

                // 儲存到 localStorage
                this._saveTokenData();

                // 清除 URL 中的 token（安全考量）
                history.replaceState(null, '', window.location.pathname + window.location.search);

                NotificationManager.success(t('googleLoginSuccess'));

                // 登入成功後自動打開雲端同步頁面（如果還沒有打開的話）
                const openCloudSync = () => {
                    // 檢查是否已經有雲端同步視窗
                    const existingModal = document.querySelector('.modal .compact-modal-title');
                    const hasCloudSyncModal = existingModal && existingModal.textContent.includes(t('cloudSync'));

                    if (!hasCloudSyncModal && typeof showCloudSync === 'function') {
                        showCloudSync();
                    }
                };

                // 確保頁面完全載入後再打開
                if (document.readyState === 'complete') {
                    setTimeout(openCloudSync, 300);
                } else {
                    window.addEventListener('load', () => setTimeout(openCloudSync, 300));
                }

            } catch (error) {
                console.error('解析 OAuth 回調資料失敗:', error);
            }
        }

        // 處理錯誤回調
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        if (authError) {
            this.showError(t('authFailed') + ': ' + authError);
            // 清除 URL 中的錯誤參數
            urlParams.delete('auth_error');
            const newUrl = urlParams.toString()
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
            history.replaceState(null, '', newUrl);
        }
    }

    /**
     * 儲存 token 資料到 localStorage
     */
    _saveTokenData() {
        const tokenData = {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresAt: this.tokenExpiresAt,
            userProfile: this.currentUser
        };
        localStorage.setItem('google_auth_token', JSON.stringify(tokenData));
    }

    /**
     * 清除認證資料
     */
    _clearAuthData() {
        localStorage.removeItem('google_auth_token');
        this.isSignedIn = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        this.tokenExpiresAt = null;
        this.folderId = null;
    }

    /**
     * 使用 Refresh Token 取得新的 Access Token
     */
    async _refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.WORKER_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh_token: this.refreshToken
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            // Refresh token 已失效，需要重新登入
            if (response.status === 401 || data.error === 'invalid_grant') {
                this._clearAuthData();
                throw new Error('Refresh token expired');
            }
            throw new Error(data.error || 'Token refresh failed');
        }

        // 更新 token
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

        // 如果返回了新的 refresh token，也更新它
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token;
        }

        // 儲存更新後的 token
        this._saveTokenData();

        return this.accessToken;
    }

    /**
     * 登入 - 重定向到 Worker OAuth 端點
     */
    async signIn() {
        try {
            // 取得目前頁面 URL 作為回調目標
            const currentUrl = window.location.origin + window.location.pathname;
            const loginUrl = `${this.WORKER_URL}/auth/login?redirect=${encodeURIComponent(currentUrl)}`;

            // 重定向到 Google 登入
            window.location.href = loginUrl;

        } catch (error) {
            console.error('Google 登入失敗:', error);
            this.showError(t('loginFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    /**
     * 登出
     */
    async signOut() {
        try {
            // 嘗試撤銷 token（即使失敗也繼續登出流程）
            if (this.refreshToken) {
                try {
                    await fetch(`${this.WORKER_URL}/auth/revoke`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            token: this.refreshToken
                        })
                    });
                    console.log('Token 已撤銷');
                } catch (revokeError) {
                    console.warn('Token 撤銷失敗:', revokeError);
                }
            }

            this._clearAuthData();
            this.updateAuthStatus();
            NotificationManager.success(t('googleLogoutSuccess'));

        } catch (error) {
            console.error('登出失敗:', error);
            this.showError(t('logoutFailed'));
        }
    }

    /**
     * 確保 token 有效，過期時自動使用 refresh token 續期
     */
    async ensureValidToken() {
        if (!this.accessToken) {
            throw new Error(t('notLoggedInGoogle'));
        }

        // 檢查是否快過期（提前 5 分鐘）
        const isExpired = Date.now() >= (this.tokenExpiresAt - 5 * 60 * 1000);

        if (!isExpired) {
            return this.accessToken;
        }

        // 如果沒有 refresh token，無法續期
        if (!this.refreshToken) {
            this._clearAuthData();
            this.updateAuthStatus();
            throw new Error(t('googleSessionExpired'));
        }

        // 防止並發續期請求
        if (this._tokenRefreshPromise) {
            return await this._tokenRefreshPromise;
        }

        // 開始續期流程
        console.log('Access token 即將過期，使用 refresh token 續期...');

        this._tokenRefreshPromise = this._refreshAccessToken()
            .then(token => {
                console.log('Token 續期成功！');
                NotificationManager.success(t('googleAuthSuccess'));
                return token;
            })
            .catch(error => {
                console.error('Token 續期失敗:', error);
                NotificationManager.warning(t('googleSessionExpired'), 6000);
                this.updateAuthStatus();
                throw error;
            })
            .finally(() => {
                this._tokenRefreshPromise = null;
            });

        return await this._tokenRefreshPromise;
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

// 頁面載入時自動初始化（處理 OAuth 回調和恢復登入狀態）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => googleCloudSync.init());
} else {
    googleCloudSync.init();
}