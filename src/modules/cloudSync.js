// 元素鎖定器（提供載入中狀態）
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
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.7';
        element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%;">${this.loadingSpinner} ${t('processing')}</div>`;
    }

    static unlock(element) {
        if (!element || !this.lockedElements.has(element)) return;

        const originalContent = this.lockedElements.get(element);
        element.innerHTML = originalContent;
        if (element.tagName === 'BUTTON') {
            element.disabled = false;
        }
        element.style.pointerEvents = 'auto';
        element.style.opacity = '1';

        this.lockedElements.delete(element);
    }
}

// Google 雲端同步管理器（使用 Cloudflare Worker OAuth 後端）
class GoogleCloudSync {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
        this._tokenRefreshPromise = null;
        this.WORKER_URL = 'https://chronicler-oauth.chronicler.workers.dev';
        this.FOLDER_NAME = 'ChroniclerBackups';
        this.folderId = null;
        this.maxBackups = 5;
    }

    async init() {
        try {
            await this._handleOAuthCallback();

            const storedToken = localStorage.getItem('google_auth_token');
            if (storedToken) {
                const tokenData = JSON.parse(storedToken);
                this.accessToken = tokenData.accessToken;
                this.refreshToken = tokenData.refreshToken;
                this.currentUser = tokenData.userProfile || null;
                this.tokenExpiresAt = tokenData.expiresAt;

                if (this.refreshToken && Date.now() >= this.tokenExpiresAt) {
                    try {
                        await this._refreshAccessToken();
                    } catch (error) {
                        this._clearAuthData();
                    }
                }

                if (this.accessToken && this.refreshToken) {
                    this.isSignedIn = true;
                }
            }

            this.updateAuthStatus();
        } catch (error) {
            this.showError(t('googleServicesInitFailed'));
        }
    }

    async _handleOAuthCallback() {
        const hash = window.location.hash;

        if (hash.includes('auth_success=')) {
            try {
                const authDataStr = decodeURIComponent(hash.split('auth_success=')[1]);
                const authData = JSON.parse(authDataStr);

                this.accessToken = authData.access_token;
                this.refreshToken = authData.refresh_token;
                this.currentUser = authData.user;
                this.tokenExpiresAt = Date.now() + (authData.expires_in * 1000);
                this.isSignedIn = true;

                this._saveTokenData();
                history.replaceState(null, '', window.location.pathname + window.location.search);
                NotificationManager.success(t('googleLoginSuccess'));

                // 登入成功後自動打開雲端同步頁面
                const openCloudSync = () => {
                    const existingModal = document.querySelector('.modal .compact-modal-title');
                    const hasCloudSyncModal = existingModal && existingModal.textContent.includes(t('cloudSync'));
                    if (!hasCloudSyncModal && typeof showCloudSync === 'function') {
                        showCloudSync();
                    }
                };

                if (document.readyState === 'complete') {
                    setTimeout(openCloudSync, 300);
                } else {
                    window.addEventListener('load', () => setTimeout(openCloudSync, 300));
                }
            } catch (error) {
                // 解析失敗，忽略
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        if (authError) {
            this.showError(t('authFailed') + ': ' + authError);
            urlParams.delete('auth_error');
            const newUrl = urlParams.toString()
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
            history.replaceState(null, '', newUrl);
        }
    }

    _saveTokenData() {
        const tokenData = {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            expiresAt: this.tokenExpiresAt,
            userProfile: this.currentUser
        };
        localStorage.setItem('google_auth_token', JSON.stringify(tokenData));
    }

    _clearAuthData() {
        localStorage.removeItem('google_auth_token');
        this.isSignedIn = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        this.tokenExpiresAt = null;
        this.folderId = null;
    }

    async _refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.WORKER_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.refreshToken })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            if (response.status === 401 || data.error === 'invalid_grant') {
                this._clearAuthData();
                throw new Error('Refresh token expired');
            }
            throw new Error(data.error || 'Token refresh failed');
        }

        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token;
        }
        this._saveTokenData();

        return this.accessToken;
    }

    async signIn() {
        try {
            const currentUrl = window.location.origin + window.location.pathname;
            const loginUrl = `${this.WORKER_URL}/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
            window.location.href = loginUrl;
        } catch (error) {
            this.showError(t('loginFailed') + ': ' + (error.message || t('unknownError')));
        }
    }

    async signOut() {
        try {
            if (this.refreshToken) {
                try {
                    await fetch(`${this.WORKER_URL}/auth/revoke`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: this.refreshToken })
                    });
                } catch (revokeError) {
                    // 撤銷失敗不影響登出流程
                }
            }

            this._clearAuthData();
            this.updateAuthStatus();
            NotificationManager.success(t('googleLogoutSuccess'));
        } catch (error) {
            this.showError(t('logoutFailed'));
        }
    }

    async ensureValidToken() {
        if (!this.accessToken) {
            throw new Error(t('notLoggedInGoogle'));
        }

        const isExpired = Date.now() >= (this.tokenExpiresAt - 5 * 60 * 1000);

        if (!isExpired) {
            return this.accessToken;
        }

        if (!this.refreshToken) {
            this._clearAuthData();
            this.updateAuthStatus();
            throw new Error(t('googleSessionExpired'));
        }

        if (this._tokenRefreshPromise) {
            return await this._tokenRefreshPromise;
        }

        this._tokenRefreshPromise = this._refreshAccessToken()
            .then(token => {
                NotificationManager.success(t('googleAuthSuccess'));
                return token;
            })
            .catch(error => {
                NotificationManager.warning(t('googleSessionExpired'), 6000);
                this.updateAuthStatus();
                throw error;
            })
            .finally(() => {
                this._tokenRefreshPromise = null;
            });

        return await this._tokenRefreshPromise;
    }

    async uploadBackup() {
        const uploadButton = document.getElementById('upload-backup-btn');
        ButtonLocker.lock(uploadButton);

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
            this.showError(t('uploadFailed') + ': ' + (error.message || t('unknownError')));
        } finally {
            ButtonLocker.unlock(uploadButton);
        }
    }

    async downloadBackup() {
        const downloadButton = document.getElementById('download-backup-btn');
        ButtonLocker.lock(downloadButton);

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
            this.showError(t('backupListFailed') + ': ' + (error.message || t('unknownError')));
        } finally {
            ButtonLocker.unlock(downloadButton);
        }
    }

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
            throw new Error(t('backupGenerationFailed'));
        }
    }

    generateFileName() {
        const now = new Date();
        const dateStr = now.getFullYear() + '-' +
                       String(now.getMonth() + 1).padStart(2, '0') + '-' +
                       String(now.getDate()).padStart(2, '0');
        const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
                       String(now.getMinutes()).padStart(2, '0');

        return `chronicler_backup_${dateStr}_${timeStr}.json`;
    }

    async ensureBackupFolder() {
        if (this.folderId) return this.folderId;

        try {
            const token = await this.ensureValidToken();

            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!searchResponse.ok) {
                throw new Error(`${t('searchFolderFailed')}: ${searchResponse.status}`);
            }

            const searchResult = await searchResponse.json();

            if (searchResult.files && searchResult.files.length > 0) {
                this.folderId = searchResult.files[0].id;
                return this.folderId;
            }

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
            throw error;
        }
    }

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
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });

        if (!response.ok) {
            throw new Error(`${t('fileUploadFailed')}: ${response.status}`);
        }

        const result = await response.json();
        return result.id;
    }

    async listBackupFiles(token) {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and name contains 'chronicler_backup' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) {
            throw new Error(`${t('fileListFailed')}: ${response.status}`);
        }

        const result = await response.json();
        return result.files || [];
    }

    async downloadFile(fileId, token) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`${t('fileDownloadFailed')}: ${response.status}`);
        }

        return response.text();
    }

    async deleteFile(fileId, token) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }

    async cleanupOldBackups() {
        try {
            const token = await this.ensureValidToken();
            const files = await this.listBackupFiles(token);

            if (files.length > this.maxBackups) {
                const filesToDelete = files.slice(this.maxBackups);
                await Promise.all(filesToDelete.map(file => this.deleteFile(file.id, token)));
            }
        } catch (error) {
            // 清理失敗不影響主流程
        }
    }

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
        ButtonLocker.lock(element);

        try {
            const token = await this.ensureValidToken();
            const backupContent = await this.downloadFile(fileId, token);
            const data = JSON.parse(backupContent);

            element.closest('.modal').remove();

            const success = await ImportManager.importFromDataObject(data);

            if (success) {
                NotificationManager.success(t('backupRestoreSuccess'));
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            this.showError(t('restoreFailed') + ': ' + (error.message || t('unknownError')));
            ButtonLocker.unlock(element);
        }
    }

    async restoreBackupData(data) {
        try {
            characters = data.characters || [];
            customSections = data.customSections || [];
            worldBooks = data.worldBooks || [];
            userPersonas = data.userPersonas || [];
            loveyDoveyCharacters = data.loveyDoveyCharacters || [];
            presets = data.presets || [];

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

            if (data.folders) {
                ImportManager.restoreAllFolders(data.folders);
            }

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

            await saveDataSilent();

            return true;
        } catch (error) {
            throw error;
        }
    }

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
                uploadButton.disabled = false;
                uploadButton.style.opacity = '0.6';
                uploadButton.style.cursor = 'pointer';
            }
            if (downloadButton) {
                downloadButton.disabled = false;
                downloadButton.style.opacity = '0.6';
                downloadButton.style.cursor = 'pointer';
            }
        }
    }

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
    if (!googleCloudSync.isSignedIn) {
        NotificationManager.warning(t('pleaseLoginFirst'));
        return;
    }
    googleCloudSync.uploadBackup();
}

function downloadBackupFromCloud() {
    if (!googleCloudSync.isSignedIn) {
        NotificationManager.warning(t('pleaseLoginFirst'));
        return;
    }
    googleCloudSync.downloadBackup();
}

function checkGoogleAuthStatus() {
    googleCloudSync.init();
}

const googleCloudSync = new GoogleCloudSync();

// 頁面載入時自動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => googleCloudSync.init());
} else {
    googleCloudSync.init();
}
