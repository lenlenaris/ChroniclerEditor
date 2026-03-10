// ===== 圖片庫管理器 =====
class ImageLibraryManager {
    static images = [];
    static isOpen = false;
    static currentFilter = 'all';
    static selectionMode = false;
    static selectionCallback = null;
    static targetAspectRatio = null;

    // 初始化：從 DB 載入，並掃描既有圖片
    static async init() {
        try {
            this.images = await characterDB.loadImageLibrary();
            // 首次使用時，掃描既有頭像匯入圖片庫
            if (this.images.length === 0) {
                await this.migrateExistingAvatars();
            }
        } catch (error) {
            console.error('載入圖片庫失敗:', error);
            this.images = [];
        }
    }

    // 掃描既有角色頭像並匯入圖片庫
    static async migrateExistingAvatars() {
        const seenHashes = new Set();
        const toAdd = [];

        // 收集所有既有頭像 base64
        const sources = [
            ...(characters || []).flatMap(c => (c.versions || []).map(v => ({ base64: v.avatar, ratio: '2:3', name: c.name }))),
            ...(userPersonas || []).flatMap(p => (p.versions || []).map(v => ({ base64: v.avatar, ratio: '2:3', name: p.name }))),
            ...(loveyDoveyCharacters || []).flatMap(c => (c.versions || []).map(v => ({ base64: v.profileImage, ratio: '1:1', name: c.name }))),
        ];

        for (const src of sources) {
            if (!src.base64 || !src.base64.startsWith('data:')) continue;

            try {
                const hash = await this.calculateHash(src.base64);
                if (hash && seenHashes.has(hash)) continue;
                if (hash) seenHashes.add(hash);

                const thumbnail = await this.generateThumbnail(src.base64);
                const dims = await this.getImageDimensions(src.base64);
                const fileSize = Math.round((src.base64.split(',')[1]?.length || 0) * 3 / 4);

                const imageData = {
                    id: this.generateId(),
                    name: src.name || `Image ${toAdd.length + 1}`,
                    base64: src.base64,
                    thumbnailBase64: thumbnail,
                    hash: hash,
                    aspectRatio: src.ratio,
                    width: dims.width,
                    height: dims.height,
                    fileSize: fileSize,
                    createdAt: new Date().toISOString()
                };

                toAdd.push(imageData);
                // 小延遲避免阻塞 UI
                if (toAdd.length % 5 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            } catch (error) {
                // 單張失敗不影響其他
            }
        }

        // 批次寫入 DB
        for (const img of toAdd) {
            await characterDB.saveImageToLibrary(img);
            this.images.push(img);
        }

        if (toAdd.length > 0) {
            console.log(`圖片庫：已匯入 ${toAdd.length} 張既有頭像`);
        }
    }

    // 生成唯一 ID
    static generateId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 計算圖片 hash
    static async calculateHash(base64) {
        try {
            const blob = BlobManager.base64ToBlob(base64);
            const buffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            return null;
        }
    }

    // 生成縮圖 (150px JPEG)
    static async generateThumbnail(base64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 150;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // 裁切為正方形
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => resolve(base64);
            img.src = base64;
        });
    }

    // 從 base64 推測比例
    static detectAspectRatio(base64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                // 1:1 ratio ~= 1.0, 2:3 ratio ~= 0.667
                if (Math.abs(ratio - 1) < 0.1) {
                    resolve('1:1');
                } else if (Math.abs(ratio - 2 / 3) < 0.1) {
                    resolve('2:3');
                } else {
                    resolve(ratio > 0.9 ? '1:1' : '2:3');
                }
            };
            img.onerror = () => resolve('1:1');
            img.src = base64;
        });
    }

    // 靜默添加圖片（上傳頭像後自動加入，去重）
    static async addImageSilently(base64, aspectRatio) {
        try {
            const hash = await this.calculateHash(base64);
            if (hash) {
                const existing = this.images.find(img => img.hash === hash);
                if (existing) return existing;
            }

            const thumbnail = await this.generateThumbnail(base64);
            const fileSize = Math.round((base64.split(',')[1]?.length || 0) * 3 / 4);

            const imageData = {
                id: this.generateId(),
                name: `Image ${this.images.length + 1}`,
                base64: base64,
                thumbnailBase64: thumbnail,
                hash: hash,
                aspectRatio: aspectRatio || await this.detectAspectRatio(base64),
                width: 0,
                height: 0,
                fileSize: fileSize,
                createdAt: new Date().toISOString()
            };

            // 取得實際尺寸
            const dims = await this.getImageDimensions(base64);
            imageData.width = dims.width;
            imageData.height = dims.height;

            const saved = await characterDB.saveImageToLibrary(imageData);
            if (saved) {
                this.images.push(imageData);
            }
            return imageData;
        } catch (error) {
            console.error('自動儲存圖片到圖片庫失敗:', error);
            return null;
        }
    }

    // 取得圖片尺寸
    static getImageDimensions(base64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = base64;
        });
    }

    // 開啟圖片庫（瀏覽模式）
    static openLibrary() {
        this.selectionMode = false;
        this.selectionCallback = null;
        this.targetAspectRatio = null;
        this._openModal();
    }

    // 開啟圖片庫（選取模式）
    static openForSelection(aspectRatio, callback) {
        this.selectionMode = true;
        this.selectionCallback = callback;
        this.targetAspectRatio = aspectRatio;
        this._openModal();
    }

    // 開啟 modal
    static _openModal() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.currentFilter = 'all';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'image-library-modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="compact-modal-content" style="width: 85vw; max-width: 900px; height: 85vh; display: flex; flex-direction: column;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        ${IconManager.image({width: 18, height: 18})}
                        <h3 class="compact-modal-title">${this.selectionMode ? t('selectImage') : t('imageLibraryTitle')}</h3>
                        <span style="color: var(--text-muted); font-size: 0.85em;" id="image-library-count"></span>
                    </div>
                    <button class="close-modal" onclick="ImageLibraryManager.closeLibrary()">×</button>
                </div>

                <div class="image-library-toolbar">
                    <button class="filter-btn active" data-filter="all" onclick="ImageLibraryManager.setFilter('all')">${t('filterAll')}</button>
                    <button class="filter-btn" data-filter="1:1" onclick="ImageLibraryManager.setFilter('1:1')">${t('filterSquare')}</button>
                    <button class="filter-btn" data-filter="2:3" onclick="ImageLibraryManager.setFilter('2:3')">${t('filterPortrait')}</button>
                    <div style="flex: 1;"></div>
                    <button class="overview-btn btn-primary" onclick="ImageLibraryManager.uploadToLibrary()" style="font-size: 0.85em; padding: 5px 14px;">
                        ${IconManager.plus ? IconManager.plus({width: 14, height: 14}) : '+'} ${t('uploadToLibrary')}
                    </button>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 0 4px;" id="image-library-grid-container">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeLibrary();
            }
        });

        this.renderGrid();
    }

    // 設定篩選
    static setFilter(filter) {
        this.currentFilter = filter;
        const toolbar = document.querySelector('.image-library-toolbar');
        if (toolbar) {
            toolbar.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
        }
        this.renderGrid();
    }

    // 渲染網格
    static renderGrid() {
        const container = document.getElementById('image-library-grid-container');
        if (!container) return;

        let filtered = this.images;
        if (this.currentFilter !== 'all') {
            filtered = this.images.filter(img => img.aspectRatio === this.currentFilter);
        }

        // 更新計數
        const countEl = document.getElementById('image-library-count');
        if (countEl) {
            countEl.textContent = t('imageCount', filtered.length);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="image-library-empty">
                    <div class="image-library-empty-icon">${IconManager.image({width: 48, height: 48, style: 'opacity: 0.3;'})}</div>
                    <div class="image-library-empty-text">${t('noImagesInLibrary')}</div>
                    <div class="image-library-empty-desc">${t('noImagesInLibraryDesc')}</div>
                </div>
            `;
            return;
        }

        // 按建立時間排序（最新在前）
        const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = `
            <div class="image-library-grid">
                ${sorted.map(img => this.renderCard(img)).join('')}
            </div>
        `;

        // 轉換所有縮圖為 blob url
        requestAnimationFrame(() => {
            container.querySelectorAll('img[data-base64]').forEach(imgEl => {
                const base64 = imgEl.dataset.base64;
                if (base64) {
                    imgEl.src = BlobManager.getBlobUrl(base64);
                    delete imgEl.dataset.base64;
                }
            });
        });
    }

    // 渲染單張卡片
    static renderCard(img) {
        const escapedName = (img.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
            <div class="image-library-card" onclick="ImageLibraryManager.handleCardClick('${img.id}')" title="${escapedName}">
                <div class="image-library-thumbnail">
                    <img data-base64="${img.thumbnailBase64 || img.base64}" alt="${escapedName}" loading="lazy">
                    <span class="image-library-ratio-badge">${img.aspectRatio || '?'}</span>
                </div>
                <div class="image-library-card-info">
                    <span class="image-library-card-name">${img.name || 'Unnamed'}</span>
                    <div class="image-library-card-actions">
                        <button onclick="event.stopPropagation(); ImageLibraryManager.renameImage('${img.id}')" title="${t('renameImage')}">
                            ${IconManager.edit({width: 12, height: 12})}
                        </button>
                        <button onclick="event.stopPropagation(); ImageLibraryManager.deleteImage('${img.id}')" title="${t('deleteImage')}">
                            ${IconManager.trash({width: 12, height: 12})}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 卡片點擊
    static handleCardClick(imageId) {
        const img = this.images.find(i => i.id === imageId);
        if (!img) return;

        if (this.selectionMode && this.selectionCallback) {
            // 選取模式
            if (img.aspectRatio === this.targetAspectRatio) {
                // 比例匹配，直接使用
                this.selectionCallback(img.base64);
                this.closeLibrary();
            } else {
                // 比例不同，需要重新裁切
                this.closeLibrary();
                // 將 base64 轉為 File 供 ImageCropper 使用
                const blob = BlobManager.base64ToBlob(img.base64);
                const file = new File([blob], img.name || 'image.jpg', { type: blob.type });
                ImageCropper.show(file, this.targetAspectRatio, (croppedDataUrl) => {
                    this.selectionCallback(croppedDataUrl);
                    // 裁切後也加入圖片庫
                    this.addImageSilently(croppedDataUrl, this.targetAspectRatio);
                });
            }
        }
        // 瀏覽模式下不做額外操作
    }

    // 上傳到圖片庫
    static uploadToLibrary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            this.showRatioChooser(file);
        };
        input.click();
    }

    // 比例選擇器
    static showRatioChooser(file) {
        // 建立一個小 modal 讓使用者選擇比例
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.id = 'ratio-chooser-modal';
        overlay.style.display = 'block';
        overlay.style.zIndex = '10002';

        overlay.innerHTML = `
            <div class="compact-modal-content" style="width: auto; max-width: 400px; padding: 24px;">
                <div class="compact-modal-header" style="justify-content: space-between; margin-bottom: 16px;">
                    <h3 class="compact-modal-title">${t('chooseAspectRatio')}</h3>
                    <button class="close-modal" onclick="document.getElementById('ratio-chooser-modal')?.remove()">×</button>
                </div>
                <div class="ratio-chooser">
                    <div class="ratio-chooser-option" onclick="ImageLibraryManager._handleRatioChoice('1:1')">
                        <div class="ratio-preview" style="width: 60px; height: 60px;"></div>
                        <span class="ratio-label">1:1</span>
                    </div>
                    <div class="ratio-chooser-option" onclick="ImageLibraryManager._handleRatioChoice('2:3')">
                        <div class="ratio-preview" style="width: 48px; height: 72px;"></div>
                        <span class="ratio-label">2:3</span>
                    </div>
                </div>
            </div>
        `;

        // 暫存 file
        this._pendingFile = file;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this._pendingFile = null;
            }
        });
    }

    // 處理比例選擇
    static _handleRatioChoice(ratio) {
        const file = this._pendingFile;
        this._pendingFile = null;
        document.getElementById('ratio-chooser-modal')?.remove();

        if (!file) return;

        // 延遲開啟裁切器，確保 DOM 已完成更新
        setTimeout(() => {
            ImageCropper.show(file, ratio, (croppedDataUrl) => {
                ImageLibraryManager.addImageSilently(croppedDataUrl, ratio).then(() => {
                    ImageLibraryManager.renderGrid();
                }).catch(err => {
                    console.error('儲存圖片到圖片庫失敗:', err);
                });
            });

            // 確保裁切器在圖片庫之上
            const cropperModal = document.getElementById('image-cropper-modal');
            if (cropperModal) {
                cropperModal.style.zIndex = '10003';
            }
        }, 100);
    }

    // 刪除圖片
    static async deleteImage(id) {
        const img = this.images.find(i => i.id === id);
        if (!img) return;

        const usageInfo = this.getImageUsageInfo(img);

        if (usageInfo.total > 0) {
            // 有使用中：彈出詳細視窗
            this._showDeleteConfirmModal(id, img, usageInfo);
        } else {
            // 無使用：簡單確認
            this._showDeleteConfirmModal(id, img, usageInfo);
        }
    }

    // 顯示刪除確認 modal（參考重命名標籤樣式）
    static _showDeleteConfirmModal(id, img, usageInfo) {
        const thumbSrc = img.thumbnailBase64 || img.base64;
        const usageListHtml = usageInfo.total > 0 ? this._renderUsageList(usageInfo) : '';

        const content = `
            <div class="compact-modal-content">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div class="custom-field-right-controls">
                        ${IconManager.trash({width: 18, height: 18})}
                        <h3 class="compact-modal-title">${t('deleteImage')}</h3>
                    </div>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>

                <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
                    <img src="${BlobManager.getBlobUrl(thumbSrc)}"
                         style="width: 64px; height: 64px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-shrink: 0;">
                    <div>
                        <div style="font-weight: 500; margin-bottom: 4px;">${img.name || 'Unnamed'}</div>
                        <div style="font-size: 0.85em; color: var(--text-muted);">${img.aspectRatio} · ${Math.round((img.fileSize || 0) / 1024)}KB</div>
                    </div>
                </div>

                <p class="compact-modal-desc" style="text-align: left;">
                    ${usageInfo.total > 0
                        ? t('confirmDeleteImageInUse', usageInfo.total)
                        : t('confirmDeleteImage')}
                </p>

                ${usageListHtml}

                <div class="compact-modal-footer">
                    <button class="overview-btn hover-primary" onclick="this.closest('.modal').remove()">${t('cancel')}</button>
                    <button class="overview-btn btn-primary" style="background: var(--danger-color); border-color: var(--danger-color);" onclick="ImageLibraryManager._confirmDeleteAndClose('${id}', this)">${t('deleteImage')}</button>
                </div>
            </div>
        `;

        const confirmModal = ModalManager.create({
            title: '',
            content: content,
            footer: '',
            maxWidth: '500px'
        });
        // 確保確認視窗在圖片庫 modal 之上
        confirmModal.style.zIndex = '10003';
    }

    // 渲染使用中項目列表
    static _renderUsageList(usageInfo) {
        let html = '';
        const showLoveyDovey = OtherSettings?.settings?.showLoveyDovey !== false;

        if (usageInfo.characters.length > 0) {
            html += `<div style="margin-bottom: 4px; font-size: 0.75em; color: var(--accent-color);">${t('character')}</div>`;
            usageInfo.characters.forEach(item => {
                html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
            });
        }

        if (showLoveyDovey && usageInfo.loveydoveys.length > 0) {
            html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('loveydovey')}</div>`;
            usageInfo.loveydoveys.forEach(item => {
                html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
            });
        }

        if (usageInfo.personas.length > 0) {
            html += `<div style="margin-bottom: 4px; margin-top: 6px; font-size: 0.75em; color: var(--accent-color);">${t('userPersona')}</div>`;
            usageInfo.personas.forEach(item => {
                html += `<div style="font-size: 0.75em; color: var(--text-muted); margin-left: 8px;">• ${item.itemName} - ${item.versionName}</div>`;
            });
        }

        return ConfirmationRenderer.renderListSection({
            title: t('imageInUse'),
            icon: 'info',
            items: [html],
            maxHeight: '150px'
        });
    }

    // 確認刪除並關閉視窗
    static async _confirmDeleteAndClose(id, btnEl) {
        try {
            const img = this.images.find(i => i.id === id);

            // 清空正在使用此圖片的角色頭像
            if (img) {
                const imgBase64 = img.base64;

                for (const character of (characters || [])) {
                    for (const version of (character.versions || [])) {
                        if (version.avatar && version.avatar === imgBase64) {
                            version.avatar = '';
                        }
                    }
                }

                for (const character of (loveyDoveyCharacters || [])) {
                    for (const version of (character.versions || [])) {
                        if (version.profileImage && version.profileImage === imgBase64) {
                            version.profileImage = '';
                        }
                    }
                }

                for (const persona of (userPersonas || [])) {
                    for (const version of (persona.versions || [])) {
                        if (version.avatar && version.avatar === imgBase64) {
                            version.avatar = '';
                        }
                    }
                }
            }

            await characterDB.deleteImageFromLibrary(id);
            this.images = this.images.filter(i => i.id !== id);

            // 關閉確認視窗
            const modal = btnEl.closest('.modal');
            if (modal) modal.remove();

            // 更新圖片庫網格
            this.renderGrid();

            // 標記資料已變更
            if (typeof markAsChanged === 'function') markAsChanged();

            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success(t('imageDeleteSuccess'));
            }
        } catch (error) {
            console.error('刪除圖片失敗:', error);
        }
    }

    // 檢查圖片使用狀況（返回分類詳細列表）
    static getImageUsageInfo(img) {
        const result = { total: 0, characters: [], loveydoveys: [], personas: [] };

        // 比對方式：base64 直接比較
        const imgBase64 = img.base64;

        // 檢查角色卡
        for (const character of (characters || [])) {
            for (const version of (character.versions || [])) {
                if (version.avatar && version.avatar === imgBase64) {
                    result.total++;
                    result.characters.push({
                        itemName: character.name || character.id,
                        versionName: version.name || version.id
                    });
                }
            }
        }

        // 檢查卿卿我我
        for (const character of (loveyDoveyCharacters || [])) {
            for (const version of (character.versions || [])) {
                if (version.profileImage && version.profileImage === imgBase64) {
                    result.total++;
                    result.loveydoveys.push({
                        itemName: character.name || character.id,
                        versionName: version.name || version.id
                    });
                }
            }
        }

        // 檢查玩家角色
        for (const persona of (userPersonas || [])) {
            for (const version of (persona.versions || [])) {
                if (version.avatar && version.avatar === imgBase64) {
                    result.total++;
                    result.personas.push({
                        itemName: persona.name || persona.id,
                        versionName: version.name || version.id
                    });
                }
            }
        }

        return result;
    }

    // 重新命名
    static async renameImage(id) {
        const img = this.images.find(i => i.id === id);
        if (!img) return;

        const newName = prompt(t('enterImageName'), img.name || '');
        if (newName === null || newName === img.name) return;

        img.name = newName;
        await characterDB.updateImageInLibrary(img);
        this.renderGrid();

        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(t('imageRenameSuccess'));
        }
    }

    // 關閉圖片庫
    static closeLibrary() {
        this.isOpen = false;
        this.selectionMode = false;
        this.selectionCallback = null;
        this.targetAspectRatio = null;
        const modal = document.getElementById('image-library-modal');
        if (modal) modal.remove();
    }
}

// 全域函數：顯示頭像來源選單
function showAvatarSourceMenu(event, itemId, versionId, type, aspectRatio) {
    event.stopPropagation();

    // 移除已存在的選單
    const existing = document.querySelector('.avatar-source-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'avatar-source-menu';

    menu.innerHTML = `
        <div class="menu-item" onclick="handleAvatarFromLibrary('${itemId}', '${versionId}', '${type}', '${aspectRatio}')">
            ${IconManager.image({width: 16, height: 16})}
            <span>${t('fromLibrary')}</span>
        </div>
        <div class="menu-item" onclick="handleAvatarFromDevice('${itemId}', '${versionId}', '${type}')">
            ${IconManager.plus ? IconManager.plus({width: 16, height: 16}) : '+'}
            <span>${t('uploadFromDevice')}</span>
        </div>
    `;

    document.body.appendChild(menu);

    // 定位在點擊位置附近
    const rect = event.currentTarget.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;

    // 確保不超出視窗
    const menuRect = menu.getBoundingClientRect();
    if (top + menuRect.height > window.innerHeight) {
        top = rect.top - menuRect.height - 4;
    }
    if (left + menuRect.width > window.innerWidth) {
        left = window.innerWidth - menuRect.width - 8;
    }

    menu.style.top = top + 'px';
    menu.style.left = left + 'px';

    // 點擊其他地方關閉
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeHandler, true);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeHandler, true);
    }, 0);
}

// 從圖片庫選取
function handleAvatarFromLibrary(itemId, versionId, type, aspectRatio) {
    // 關閉選單
    const menu = document.querySelector('.avatar-source-menu');
    if (menu) menu.remove();

    ImageLibraryManager.openForSelection(aspectRatio, (base64) => {
        if (type === 'loveydovey') {
            updateField('loveydovey', itemId, versionId, 'profileImage', base64);
        } else {
            updateField(type, itemId, versionId, 'avatar', base64);
        }

        // 重新渲染
        setTimeout(() => {
            if (crossTypeCompareMode && currentMode === 'crosstype') {
                CrossTypeCompareManager.renderCrossTypeInterface();
            } else {
                renderAll();
            }
        }, 50);
    });
}

// 從裝置上傳
function handleAvatarFromDevice(itemId, versionId, type) {
    // 關閉選單
    const menu = document.querySelector('.avatar-source-menu');
    if (menu) menu.remove();

    if (type === 'loveydovey') {
        triggerLoveyDoveyImageUpload(itemId, versionId);
    } else {
        triggerImageUpload(itemId, versionId);
    }
}
