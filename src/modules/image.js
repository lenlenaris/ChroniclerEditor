// ===== Blob URL 記憶體管理系統 =====
class BlobManager {
    static blobUrls = new Map();           // base64 -> blobUrl 的映射
    static usageCount = new Map();         // 追蹤使用次數
    static maxCacheSize = 100;             // 最大快取數量
    static cleanupThreshold = 150;         // 清理觸發閾值
    
    /**
     * 將 Base64 轉換為 Blob URL
     * @param {string} base64 - Base64 圖片資料
     * @returns {string} Blob URL
     */
    static getBlobUrl(base64) {
        if (!base64 || !base64.startsWith('data:')) {
            return base64; // 如果不是 Base64，直接返回
        }
        
        // 檢查快取
        if (this.blobUrls.has(base64)) {
            this.incrementUsage(base64);
            return this.blobUrls.get(base64);
        }
        
        try {
            // 轉換為 Blob
            const blob = this.base64ToBlob(base64);
            const blobUrl = URL.createObjectURL(blob);
            
            // 存入快取
            this.blobUrls.set(base64, blobUrl);
            this.usageCount.set(base64, 1);
            
            
            
            // 檢查是否需要清理
            if (this.blobUrls.size > this.cleanupThreshold) {
                this.performCleanup();
            }
            
            return blobUrl;
            
        } catch (error) {
            console.warn('Blob URL 轉換失敗:', error);
            return base64; // 失敗時返回原始 Base64
        }
    }
    
    /**
     * Base64 轉 Blob
     */
    static base64ToBlob(base64) {
        const parts = base64.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const binaryString = atob(parts[1]);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Blob([bytes], { type: mime });
    }
    
    /**
     * 增加使用計數
     */
    static incrementUsage(base64) {
        const count = this.usageCount.get(base64) || 0;
        this.usageCount.set(base64, count + 1);
    }
    
    /**
     * 智能清理：保留使用頻率高的圖片
     */
    static performCleanup() {
        
        
        // 按使用次數排序，移除使用次數最少的
        const entries = Array.from(this.usageCount.entries())
            .sort((a, b) => a[1] - b[1]); // 升序排列
        
        const toRemove = entries.slice(0, this.blobUrls.size - this.maxCacheSize);
        
        toRemove.forEach(([base64, count]) => {
            const blobUrl = this.blobUrls.get(base64);
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
                this.blobUrls.delete(base64);
                this.usageCount.delete(base64);
            }
        });
        
        
    }
    
    /**
     * 手動清理特定圖片（用於角色切換時）
     */
    static releaseImages(base64Array) {
        if (!Array.isArray(base64Array)) return;
        
        base64Array.forEach(base64 => {
            if (this.blobUrls.has(base64)) {
                const blobUrl = this.blobUrls.get(base64);
                URL.revokeObjectURL(blobUrl);
                this.blobUrls.delete(base64);
                this.usageCount.delete(base64);
            }
        });
        
        
    }
    
    /**
     * 清理所有 Blob URL（用於應用關閉時）
     */
    static cleanupAll() {
        this.blobUrls.forEach(blobUrl => {
            URL.revokeObjectURL(blobUrl);
        });
        this.blobUrls.clear();
        this.usageCount.clear();
        
    }
    
    /**
     * 獲取快取統計
     */
    static getStats() {
        return {
            cachedImages: this.blobUrls.size,
            maxCacheSize: this.maxCacheSize,
            memoryEstimate: `${Math.round(this.blobUrls.size * 0.5)}MB` // 粗略估算
        };
    }
}

// ===== 圖片裁切器 =====
class ImageCropper {
    static currentCropper = null;
    
    /**
     * 顯示圖片裁切器
     * @param {File} file - 圖片檔案
     * @param {string} aspectRatio - 裁切比例 ('1:1' 或 '2:3')
     * @param {Function} onConfirm - 確認回調函數
     */
    static show(file, aspectRatio, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const ratioInfo = this.getAspectRatioInfo(aspectRatio);
        
        modal.innerHTML = `
            <div class="compact-modal-content" style="width: 80vw; max-width: 1200px; height: 90vh; display: flex; flex-direction: column;">
                <div class="compact-modal-header" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        ✂️
                        <h3 class="compact-modal-title">${t('cropTitle', ratioInfo.name, aspectRatio)}</h3>
                    </div>
                    <button class="close-modal" onclick="ImageCropper.close()">×</button>
                </div>
                
                <!-- 🌟 預覽區域: 使用 flex-grow 佔據剩餘空間 -->
                    <div id="cropper-container" style="
                        flex-grow: 1;
                        position: relative;
                        background-color: var(--bg-secondary);
                        background-image: 
                            linear-gradient(45deg, var(--border-color) 25%, transparent 25%), 
                            linear-gradient(-45deg, var(--border-color) 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, var(--border-color) 75%), 
                            linear-gradient(-45deg, transparent 75%, var(--border-color) 75%);
                        background-size: 16px 16px;
                        background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                        overflow: hidden;
                        cursor: grab;
                    ">
                    <!-- 🌟 Canvas 將由 JS 控制大小與位置 -->
                    <canvas id="cropper-canvas" style="
                        position: absolute; /* 使用絕對定位，由 transform 控制 */
                        display: block;
                    "></canvas>
                    
                    <!-- 🌟 可操作的裁切框 -->
                    <div id="crop-overlay" style="
                        position: absolute;
                        border: 1px solid rgba(255, 255, 255, 0.8);
                        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
                        cursor: move;
                    ">
                        <!-- 四角調整點 (樣式優化) -->
                        <div class="resize-handle resize-nw" style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; background: white; border: 1px solid #777; cursor: nwse-resize; border-radius: 50%;"></div>
                        <div class="resize-handle resize-ne" style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background: white; border: 1px solid #777; cursor: nesw-resize; border-radius: 50%;"></div>
                        <div class="resize-handle resize-sw" style="position: absolute; bottom: -5px; left: -5px; width: 10px; height: 10px; background: white; border: 1px solid #777; cursor: nesw-resize; border-radius: 50%;"></div>
                        <div class="resize-handle resize-se" style="position: absolute; bottom: -5px; right: -5px; width: 10px; height: 10px; background: white; border: 1px solid #777; cursor: nwse-resize; border-radius: 50%;"></div>
                    </div>
                </div>
                
                <!-- 🌟 整合後的 Footer -->
                <div class="compact-modal-footer" style="flex-direction: column; align-items: stretch; gap: 1rem; padding-top: 1rem;">
                    ${this.renderQualityOptions(ratioInfo)}
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                        <button class="overview-btn hover-primary" onclick="ImageCropper.close()">${t('cancel')}</button>
                        <button class="overview-btn btn-primary" onclick="ImageCropper.confirm()">${t('confirmCrop')}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initializeCropper(file, aspectRatio, onConfirm);
    }


    /**
     * 獲取裁切比例資訊
     */
    static getAspectRatioInfo(aspectRatio) {
        if (aspectRatio === '1:1') {
            return {
                ratio: 1,
                standardSize: { width: 512, height: 512 },
                hdSize: { width: 800, height: 800 },
                name: t('squareRatio')
            };
        } else if (aspectRatio === '2:3') {
            return {
                ratio: 2/3,
                standardSize: { width: 400, height: 600 },
                hdSize: { width: 800, height: 1200 },
                name: t('verticalRatio')
            };
        }
    }
    
    /**
     * 渲染品質選擇選項 (樣式優化)
     */
    static renderQualityOptions(ratioInfo) {
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    ${IconManager.settings ? IconManager.settings({width: 14, height: 14}) : '⚙️'}
                    <h4 style="font-size: 0.95em; font-weight: 600; color: var(--text-color); margin: 0;">${t('outputQuality')}</h4>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <label id="quality-standard" class="version-checkbox selected" style="flex: 1;">
                        <input type="radio" name="crop-quality" value="standard" checked onchange="ImageCropper.updateQualitySelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.image ? IconManager.image({width: 16, height: 16}) : '🖼️'}
                            
                            <div>
                                ${t('standardVersion')} <span style="color: var(--text-muted); font-size: 0.9em;">(${ratioInfo.standardSize.width}×${ratioInfo.standardSize.height})</span>
                            </div>

                        </div>
                    </label>
                    
                    <label id="quality-hd" class="version-checkbox" style="flex: 1;">
                        <input type="radio" name="crop-quality" value="hd" onchange="ImageCropper.updateQualitySelection(this)" style="margin: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9em;">
                            ${IconManager.image ? IconManager.image({width: 16, height: 16}) : '🖼️'}
                            
                            <div>
                                ${t('hdVersion')} <span style="color: var(--text-muted); font-size: 0.9em;">(${ratioInfo.hdSize.width}×${ratioInfo.hdSize.height})</span>
                            </div>

                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    
    /**
     * 更新品質選擇樣式
     */
    static updateQualitySelection(selectedInput) {
        // 移除所有選中狀態
        document.querySelectorAll('#quality-standard, #quality-hd').forEach(label => {
            label.classList.remove('selected');
        });
        
        // 添加選中狀態
        const selectedLabel = selectedInput.closest('.version-checkbox');
        if (selectedLabel) {
            selectedLabel.classList.add('selected');
        }
    }
    
    /**
     * 初始化裁切器
     */
    static initializeCropper(file, aspectRatio, onConfirm) {
        this.currentCropper = {
            file,
            aspectRatio,
            onConfirm,
            image: new Image(),
            canvas: document.getElementById('cropper-canvas'),
            ctx: null,
            cropOverlay: document.getElementById('crop-overlay'),
            scale: 1,
            initialScale: 1,
            imageOffset: { x: 0, y: 0 },
            isPanning: false, 
            isDragging: false,
            isResizing: false,
            dragStart: { x: 0, y: 0 },
            cropArea: { x: 0, y: 0, width: 0, height: 0 }
        };
        
        const cropper = this.currentCropper;
        cropper.ctx = cropper.canvas.getContext('2d');
        
        // 載入圖片
        const reader = new FileReader();
        reader.onload = (e) => {
            cropper.image.onload = () => {
                this.setupCanvas();
                this.setupEventListeners();
            };
            cropper.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * 設置畫布 (全新邏輯)
     * 使用 CSS Transform 進行高效縮放與平移
     */
    static setupCanvas() {
        const cropper = this.currentCropper;
        const { image, canvas } = cropper;
        const container = document.getElementById('cropper-container');
        const containerRect = container.getBoundingClientRect();

        // 1. 設置畫布的繪圖尺寸為圖片原始尺寸，以保證清晰度
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        // 2. 將原始圖片繪製到 canvas 上 (只繪製一次)
        cropper.ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

        // 3. 計算初始縮放比例，讓圖片能完整顯示在容器內
        const scaleX = containerRect.width / image.naturalWidth;
        const scaleY = containerRect.height / image.naturalHeight;
        const initialScale = Math.min(scaleX, scaleY, 1); // 如果圖片本身就很小，則不放大
        cropper.scale = initialScale;
        cropper.initialScale = initialScale; // 保存初始比例，用於重置

        // 4. 計算初始偏移量，使圖片在容器中居中
        const initialWidth = image.naturalWidth * initialScale;
        const initialHeight = image.naturalHeight * initialScale;
        cropper.imageOffset.x = (containerRect.width - initialWidth) / 2;
        cropper.imageOffset.y = (containerRect.height - initialHeight) / 2;

        // 5. 應用初始變換並設置初始裁切框
        this.applyCanvasTransform();
        this.setupInitialCropArea();
    }
    
    /**
     * 應用畫布變換 (新方法)
     * 根據 scale 和 imageOffset 更新 canvas 的 CSS transform
     */
    static applyCanvasTransform() {
        const { canvas, scale, imageOffset } = this.currentCropper;
        canvas.style.transform = `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${scale})`;
        canvas.style.transformOrigin = 'top left'; // 確保縮放和位移基點正確
    }

/**
 * 設置初始裁切區域 (修改版 - 自動適配到圖片最大尺寸)
 */
static setupInitialCropArea() {
    const cropper = this.currentCropper;
    const ratioInfo = this.getAspectRatioInfo(cropper.aspectRatio);
    const targetAspectRatio = ratioInfo.ratio;
    const container = document.getElementById('cropper-container');
    const containerRect = container.getBoundingClientRect();

    // 🌟 關鍵計算：基於圖片在容器中的實際顯示尺寸
    const imageDisplayWidth = cropper.image.naturalWidth * cropper.scale;
    const imageDisplayHeight = cropper.image.naturalHeight * cropper.scale;
    
    // 🌟 計算圖片在容器中的位置和邊界
    const imageLeft = cropper.imageOffset.x;
    const imageTop = cropper.imageOffset.y;
    const imageRight = imageLeft + imageDisplayWidth;
    const imageBottom = imageTop + imageDisplayHeight;
    
    // 🌟 計算可用的圖片區域（與容器的交集）
    const availableLeft = Math.max(0, imageLeft);
    const availableTop = Math.max(0, imageTop);
    const availableRight = Math.min(containerRect.width, imageRight);
    const availableBottom = Math.min(containerRect.height, imageBottom);
    const availableWidth = availableRight - availableLeft;
    const availableHeight = availableBottom - availableTop;

    
    

    // 🌟 根據目標比例，計算最大可能的裁切框尺寸
    let cropWidth, cropHeight;
    
    if (availableWidth / availableHeight > targetAspectRatio) {
        // 高度受限，以高度為基準
        cropHeight = availableHeight;
        cropWidth = cropHeight * targetAspectRatio;
    } else {
        // 寬度受限，以寬度為基準
        cropWidth = availableWidth;
        cropHeight = cropWidth / targetAspectRatio;
    }
    
    // 🌟 確保裁切框在可用區域內居中
    const cropX = availableLeft + (availableWidth - cropWidth) / 2;
    const cropY = availableTop + (availableHeight - cropHeight) / 2;
    
    cropper.cropArea = {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
    };
    
    this.updateCropOverlay();
}

    /**
     * 更新裁切框顯示
     */
    static updateCropOverlay() {
        const { cropArea, cropOverlay, canvas } = this.currentCropper;
        const canvasRect = canvas.getBoundingClientRect();
        
        Object.assign(cropOverlay.style, {
            left: cropArea.x + 'px',
            top: cropArea.y + 'px',
            width: cropArea.width + 'px',
            height: cropArea.height + 'px'
        });
    }
    
    
    /**
     * 確認裁切
     */
    static async confirm() {
        const cropper = this.currentCropper;
        const quality = document.querySelector('input[name="crop-quality"]:checked').value;
        const ratioInfo = this.getAspectRatioInfo(cropper.aspectRatio);
        const targetSize = quality === 'hd' ? ratioInfo.hdSize : ratioInfo.standardSize;
        
        // 執行裁切
        const croppedBlob = await this.cropImage(targetSize);
        
        // 直接轉為 DataURL，不經過 ImageOptimizer
        const reader = new FileReader();
        reader.onload = (e) => {
            cropper.onConfirm(e.target.result);
        };
        reader.readAsDataURL(croppedBlob);
        
        this.close();
    }

 /**
 * 設置事件監聽 (重構版 - 解決事件衝突)
 */
static setupEventListeners() {
    const cropper = this.currentCropper;
    const container = document.getElementById('cropper-container');
    const canvas = cropper.canvas;
    const cropOverlay = cropper.cropOverlay;

    // 清理函數集合
    const cleanupFunctions = [];

    // 1. 圖片平移 (僅在點擊 Canvas 時觸發)
    const canvasMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cropper.isPanning = true;
        cropper.dragStart = {
            x: e.clientX - cropper.imageOffset.x,
            y: e.clientY - cropper.imageOffset.y,
        };
        canvas.style.cursor = 'grabbing';
    };
    canvas.addEventListener('mousedown', canvasMouseDown);
    cleanupFunctions.push(() => canvas.removeEventListener('mousedown', canvasMouseDown));
    
    // 2. 圖片滾輪縮放
    const wheelHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imageX = (mouseX - cropper.imageOffset.x) / cropper.scale;
        const imageY = (mouseY - cropper.imageOffset.y) / cropper.scale;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(cropper.initialScale * 0.5, Math.min(cropper.initialScale * 5, cropper.scale * delta));
        cropper.imageOffset.x = mouseX - imageX * newScale;
        cropper.imageOffset.y = mouseY - imageY * newScale;
        cropper.scale = newScale;
        this.applyCanvasTransform();
    };
    container.addEventListener('wheel', wheelHandler, { passive: false });
    cleanupFunctions.push(() => container.removeEventListener('wheel', wheelHandler));

    // 3. 裁切框拖曳
    const cropOverlayMouseDown = (e) => {
        // 確保不是點擊控制點
        if (e.target.classList.contains('resize-handle')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        cropper.isDragging = true;
        cropper.dragStart = {
            x: e.clientX - cropper.cropArea.x,
            y: e.clientY - cropper.cropArea.y
        };
    };
    cropOverlay.addEventListener('mousedown', cropOverlayMouseDown);
    cleanupFunctions.push(() => cropOverlay.removeEventListener('mousedown', cropOverlayMouseDown));

// 4. 控制點縮放 - 最終修復版
cropOverlay.querySelectorAll('.resize-handle').forEach(handle => {
    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // 正確的方向識別邏輯
        let direction = null;
        if (handle.classList.contains('resize-nw')) {
            direction = 'nw';
        } else if (handle.classList.contains('resize-ne')) {
            direction = 'ne';
        } else if (handle.classList.contains('resize-sw')) {
            direction = 'sw';
        } else if (handle.classList.contains('resize-se')) {
            direction = 'se';
        }

        
        

        if (!direction) {
            console.error('❌ 無法識別控制點方向:', Array.from(handle.classList));
            return;
        }

        // 立即停止所有其他事件處理
        cropper.isPanning = false;
        cropper.isDragging = false;
        cropper.isResizing = direction;  // 現在這裡應該是正確的方向了
        cropper.dragStart = { x: e.clientX, y: e.clientY };
        cropper.originalCropArea = { ...cropper.cropArea };

        // 創建專用的高優先級事件處理器
        let isActive = true;
        
        const resizeMouseMove = (moveEvent) => {
            if (!isActive || !cropper.isResizing) return;
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            moveEvent.stopImmediatePropagation();
            
            this.handleResize(moveEvent);
        };
        
        const resizeMouseUp = (upEvent) => {
            if (!isActive) return;
            isActive = false;
            upEvent.preventDefault();
            upEvent.stopPropagation();
            upEvent.stopImmediatePropagation();
            
            cropper.isResizing = false;
            document.removeEventListener('mousemove', resizeMouseMove, true);
            document.removeEventListener('mouseup', resizeMouseUp, true);
        };
        
        // 使用 capture 模式，並立即添加
        document.addEventListener('mousemove', resizeMouseMove, true);
        document.addEventListener('mouseup', resizeMouseUp, true);
    };
    
    handle.addEventListener('mousedown', handleMouseDown);
    cleanupFunctions.push(() => handle.removeEventListener('mousedown', handleMouseDown));
});

    // 5. 全域事件處理 (低優先級)
    const globalMouseMove = (e) => {
        // 只有在沒有縮放操作時才處理
        if (cropper.isResizing) {
            return;
        }
        
        if (cropper.isPanning) {
            cropper.imageOffset.x = e.clientX - cropper.dragStart.x;
            cropper.imageOffset.y = e.clientY - cropper.dragStart.y;
            this.applyCanvasTransform();
        } else if (cropper.isDragging) {
            this.handleDrag(e);
        }
    };

    const globalMouseUp = () => {
        // 只有在沒有縮放操作時才處理
        if (cropper.isResizing) {
            return;
        }
        
        if (cropper.isPanning) {
            canvas.style.cursor = 'grab';
        }
        cropper.isPanning = false;
        cropper.isDragging = false;
    };
    
    document.addEventListener('mousemove', globalMouseMove);
    document.addEventListener('mouseup', globalMouseUp);
    cleanupFunctions.push(() => document.removeEventListener('mousemove', globalMouseMove));
    cleanupFunctions.push(() => document.removeEventListener('mouseup', globalMouseUp));

    // 保存清理函數
    cropper.cleanup = () => {
        cleanupFunctions.forEach(fn => fn());
    };
}

    
/**
 * 處理拖曳 (修改版 - 限制在圖片區域內)
 */
static handleDrag(e) {
    const cropper = this.currentCropper;
    
    // 新的 cropArea 左上角位置
    const newX = e.clientX - cropper.dragStart.x;
    const newY = e.clientY - cropper.dragStart.y;
    
    // 🌟 計算圖片在容器中的實際顯示區域
    const imageDisplayWidth = cropper.image.naturalWidth * cropper.scale;
    const imageDisplayHeight = cropper.image.naturalHeight * cropper.scale;
    const imageLeft = cropper.imageOffset.x;
    const imageTop = cropper.imageOffset.y;
    const imageRight = imageLeft + imageDisplayWidth;
    const imageBottom = imageTop + imageDisplayHeight;
    
    // 🌟 獲取容器尺寸
    const container = document.getElementById('cropper-container');
    const containerRect = container.getBoundingClientRect();
    
    // 🌟 計算有效的圖片區域（與容器的交集）
    const effectiveLeft = Math.max(0, imageLeft);
    const effectiveTop = Math.max(0, imageTop);
    const effectiveRight = Math.min(containerRect.width, imageRight);
    const effectiveBottom = Math.min(containerRect.height, imageBottom);
    
    // 🌟 限制裁切框在有效圖片區域內
    cropper.cropArea.x = Math.max(
        effectiveLeft, 
        Math.min(newX, effectiveRight - cropper.cropArea.width)
    );
    cropper.cropArea.y = Math.max(
        effectiveTop, 
        Math.min(newY, effectiveBottom - cropper.cropArea.height)
    );
    
    this.updateCropOverlay();
}

    static handleResize(e) {
    const cropper = this.currentCropper;
    const direction = cropper.isResizing;
    
    if (!direction || typeof direction !== 'string') {
        console.error('❌ 無效的調整方向:', direction);
        return;
    }
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // 獲取容器尺寸用於邊界限制
    const container = document.getElementById('cropper-container');
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // 獲取寬高比
    const aspectRatio = this.getAspectRatioInfo(cropper.aspectRatio).ratio;
    
    // 計算滑鼠移動距離
    const deltaX = currentX - cropper.dragStart.x;
    const deltaY = currentY - cropper.dragStart.y;
    
    // 從原始裁切區域開始計算
    let newX = cropper.originalCropArea.x;
    let newY = cropper.originalCropArea.y;
    let newWidth = cropper.originalCropArea.width;
    let newHeight = cropper.originalCropArea.height;
    
    // 根據拖拽方向調整裁切區域
    switch (direction) {
        case 'nw': // 左上角：右下角固定
            newX = cropper.originalCropArea.x + deltaX;
            newY = cropper.originalCropArea.y + deltaY;
            newWidth = cropper.originalCropArea.width - deltaX;
            newHeight = cropper.originalCropArea.height - deltaY;
            
            // 根據寬高比調整（以較小的變化為準）
            if (newWidth / aspectRatio < newHeight) {
                newHeight = newWidth / aspectRatio;
                newY = cropper.originalCropArea.y + cropper.originalCropArea.height - newHeight;
            } else {
                newWidth = newHeight * aspectRatio;
                newX = cropper.originalCropArea.x + cropper.originalCropArea.width - newWidth;
            }
            break;
            
        case 'ne': // 右上角：左下角固定
            newY = cropper.originalCropArea.y + deltaY;
            newWidth = cropper.originalCropArea.width + deltaX;
            newHeight = cropper.originalCropArea.height - deltaY;
            
            // 根據寬高比調整
            if (newWidth / aspectRatio < newHeight) {
                newHeight = newWidth / aspectRatio;
                newY = cropper.originalCropArea.y + cropper.originalCropArea.height - newHeight;
            } else {
                newWidth = newHeight * aspectRatio;
            }
            break;
            
        case 'sw': // 左下角：右上角固定
            newX = cropper.originalCropArea.x + deltaX;
            newWidth = cropper.originalCropArea.width - deltaX;
            newHeight = cropper.originalCropArea.height + deltaY;
            
            // 根據寬高比調整
            if (newWidth / aspectRatio < newHeight) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
                newX = cropper.originalCropArea.x + cropper.originalCropArea.width - newWidth;
            }
            break;
            
        case 'se': // 右下角：左上角固定
            newWidth = cropper.originalCropArea.width + deltaX;
            newHeight = cropper.originalCropArea.height + deltaY;
            
            // 根據寬高比調整
            if (newWidth / aspectRatio < newHeight) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
            break;
            
        default:
            console.error('❌ 未知的調整方向:', direction);
            return;
    }
    
    // 設定最小尺寸
    const minSize = 50;
    if (newWidth < minSize || newHeight < minSize) {
        
        return; // 太小時不更新
    }

    // 🌟 新的邊界限制：基於圖片實際顯示區域
    const imageDisplayWidth = cropper.image.naturalWidth * cropper.scale;
    const imageDisplayHeight = cropper.image.naturalHeight * cropper.scale;
    const imageLeft = cropper.imageOffset.x;
    const imageTop = cropper.imageOffset.y;
    const imageRight = imageLeft + imageDisplayWidth;
    const imageBottom = imageTop + imageDisplayHeight;

    // 🌟 計算有效的圖片區域（與容器的交集）
    const effectiveLeft = Math.max(0, imageLeft);
    const effectiveTop = Math.max(0, imageTop);
    const effectiveRight = Math.min(containerWidth, imageRight);
    const effectiveBottom = Math.min(containerHeight, imageBottom);

    // 🌟 限制裁切框不超出有效圖片區域
    newX = Math.max(effectiveLeft, Math.min(newX, effectiveRight - newWidth));
    newY = Math.max(effectiveTop, Math.min(newY, effectiveBottom - newHeight));

    // 🌟 如果調整後還是超出邊界，重新計算尺寸
    if (newX + newWidth > effectiveRight) {
        newWidth = effectiveRight - newX;
        newHeight = newWidth / aspectRatio;
    }
    if (newY + newHeight > effectiveBottom) {
        newHeight = effectiveBottom - newY;
        newWidth = newHeight * aspectRatio;
    }

    
    
    // 更新裁切區域
    cropper.cropArea = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
    };
    
    this.updateCropOverlay();
}

    
    /**
     * 執行裁切 (全新計算邏輯)
     */
    static async cropImage(targetSize) {
        const cropper = this.currentCropper;
        const { image, cropArea, scale, imageOffset } = cropper;
        
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCanvas.width = targetSize.width;
        cropCanvas.height = targetSize.height;
        
        // 🌟 關鍵計算：將裁切框在 viewport 上的座標，
        // 轉換為在原始圖片上的座標。
        const sourceX = (cropArea.x - imageOffset.x) / scale;
        const sourceY = (cropArea.y - imageOffset.y) / scale;
        const sourceWidth = cropArea.width / scale;
        const sourceHeight = cropArea.height / scale;

        // 檢查計算結果是否有效
        if (sourceWidth <= 0 || sourceHeight <= 0 || sourceX > image.naturalWidth || sourceY > image.naturalHeight) {
            console.error("無效的裁切區域", { sourceX, sourceY, sourceWidth, sourceHeight });
            this.close();
            // 可以加入一個錯誤提示給用戶
            alert(t('cropFailed'));
            return;
        }
        
        cropCtx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, targetSize.width, targetSize.height
        );
        
        return new Promise(resolve => {
            cropCanvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }

    
    /**
     * 關閉裁切器
     */
    static close() {
        if (this.currentCropper && this.currentCropper.cleanup) {
            this.currentCropper.cleanup();
        }
        
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
        this.currentCropper = null;
    }


}


// ===== 圖片優化與去重系統 =====

class ImageOptimizer {
    static maxWidth = 512;      
    static maxHeight = 768;     
    static quality = 0.85;      
    
    // 🌟 新的記憶體管理系統
    static hashCache = new Map();
    static cacheMaxSize = 50;           // 最多快取50張圖片
    static cacheAccessOrder = [];       // LRU 追蹤順序
    static memoryCheckInterval = 10;     // 每10次操作檢查一次記憶體
    static operationCount = 0;
    
    // 🎯 主要優化入口（保持不變）
    static async optimizeImage(file, options = {}) {
        const {
            maxWidth = this.maxWidth,
            maxHeight = this.maxHeight,
            quality = this.quality
        } = options;
        
        try {
            
            
            // 1. 計算圖片雜湊（檢查是否重複）
            const imageHash = await this.calculateImageHash(file);
            
            
            // 2. 🌟 智能快取檢查（新增記憶體管理）
            const existingImage = await this.findExistingImageSmart(imageHash);
            if (existingImage) {
                
                return {
                    dataUrl: existingImage.dataUrl,
                    blobUrl: BlobManager.getBlobUrl(existingImage.dataUrl),
                    hash: imageHash,
                    reused: true,
                    originalSize: file.size,
                    optimizedSize: existingImage.size
                };
            }
            
            // 3. 優化新圖片
            const optimizedDataUrl = await this.compressImage(file, maxWidth, maxHeight, quality);
            const optimizedSize = this.getDataUrlSize(optimizedDataUrl);
            
            // 4. 🌟 智能快取儲存（新增記憶體管理）
            await this.cacheImageSmart(imageHash, optimizedDataUrl, optimizedSize);
            
            
            return {
                dataUrl: optimizedDataUrl,
                blobUrl: BlobManager.getBlobUrl(optimizedDataUrl), 
                hash: imageHash,
                reused: false,
                originalSize: file.size,
                optimizedSize: optimizedSize
            };
            
        } catch (error) {
            console.error('圖片優化失敗:', error);
            return {
                dataUrl: await this.fileToDataUrl(file),
                hash: null,
                reused: false,
                originalSize: file.size,
                optimizedSize: file.size,
                error: error.message
            };
        }
    }

    // 🔐 計算圖片雜湊（保持不變）
    static async calculateImageHash(file) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // 🔍 🌟 智能尋找現有圖片（新方法）
    static async findExistingImageSmart(hash) {
        // 🌟 定期記憶體檢查
        this.operationCount++;
        if (this.operationCount % this.memoryCheckInterval === 0) {
            this.performMemoryMaintenance();
        }
        
        // 1. 先檢查記憶體快取（並更新使用順序）
        if (this.hashCache.has(hash)) {
            this.updateCacheAccess(hash);
            return this.hashCache.get(hash);
        }
        
        // 2. 檢查 localStorage（有大小限制的快取）
        const cached = localStorage.getItem(`img_${hash}`);
        if (cached) {
            try {
                const imageData = JSON.parse(cached);
                // 🌟 載入到記憶體快取（智能管理）
                this.addToCacheSmart(hash, imageData);
                return imageData;
            } catch (error) {
                console.warn('圖片快取資料損壞:', error);
                localStorage.removeItem(`img_${hash}`);
            }
        }
        
        // 3. 檢查現有角色是否使用相同圖片
        return this.searchInExistingCharacters(hash);
    }
    
    // 🌟 智能快取儲存（新方法）
    static async cacheImageSmart(hash, dataUrl, size) {
        const imageData = { dataUrl, size, timestamp: Date.now() };
        
        // 🌟 智能記憶體快取管理
        this.addToCacheSmart(hash, imageData);
        
        // localStorage 快取（有大小限制）
        try {
            if (size < 300 * 1024) { // 只快取小於 300KB 的圖片
                localStorage.setItem(`img_${hash}`, JSON.stringify(imageData));
            }
        } catch (error) {
            console.warn('localStorage 空間不足，跳過圖片快取');
            // 🌟 清理一些 localStorage 空間
            this.cleanupLocalStorageCache();
        }
    }
    
    // 🌟 智能記憶體快取管理（新方法）
    static addToCacheSmart(hash, imageData) {
        // 如果已存在，更新使用順序
        if (this.hashCache.has(hash)) {
            this.updateCacheAccess(hash);
            this.hashCache.set(hash, imageData);
            return;
        }
        
        // 檢查是否需要清理空間
        if (this.hashCache.size >= this.cacheMaxSize) {
            this.evictOldestCache();
        }
        
        // 添加新項目
        this.hashCache.set(hash, imageData);
        this.cacheAccessOrder.push(hash);
        
        
    }
    
    // 🌟 更新快取使用順序（LRU）
    static updateCacheAccess(hash) {
        // 移除舊位置
        const index = this.cacheAccessOrder.indexOf(hash);
        if (index > -1) {
            this.cacheAccessOrder.splice(index, 1);
        }
        // 添加到最後（最新使用）
        this.cacheAccessOrder.push(hash);
    }
    
    // 🌟 清理最舊的快取項目
    static evictOldestCache() {
        if (this.cacheAccessOrder.length === 0) return;
        
        const oldestHash = this.cacheAccessOrder.shift();
        this.hashCache.delete(oldestHash);
        
        
    }
    
    // 🌟 定期記憶體維護
    static performMemoryMaintenance() {
        const cacheSize = this.hashCache.size;
        const memoryUsage = this.estimateMemoryUsage();
        
        
        
        // 如果記憶體使用過多，主動清理
        if (memoryUsage > 50 * 1024 * 1024) { // 超過 50MB
            const targetSize = Math.floor(this.cacheMaxSize * 0.7); // 清理到70%
            while (this.hashCache.size > targetSize) {
                this.evictOldestCache();
            }
            
        }
    }
    
    // 🌟 估算記憶體使用量
    static estimateMemoryUsage() {
        let totalSize = 0;
        for (const imageData of this.hashCache.values()) {
            totalSize += imageData.size || 0;
        }
        return totalSize;
    }
    
    // 🌟 清理 localStorage 快取
    static cleanupLocalStorageCache() {
        const imageCacheKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('img_')) {
                imageCacheKeys.push(key);
            }
        }
        
        // 移除最舊的一半
        imageCacheKeys.slice(0, Math.floor(imageCacheKeys.length / 2)).forEach(key => {
            localStorage.removeItem(key);
        });
        
        
    }

    // 🔎 在現有角色中搜尋相同圖片（保持不變）
    static async searchInExistingCharacters(targetHash) {
        for (const character of characters) {
            for (const version of character.versions) {
                if (version.avatar && version.avatarHash === targetHash) {
                    
                    return {
                        dataUrl: version.avatar,
                        size: this.getDataUrlSize(version.avatar),
                        source: 'character'
                    };
                }
            }
        }
        return null;
    }

    // 🗜️ 壓縮圖片（保持不變）
    static async compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                try {
                    const { width, height } = this.calculateNewDimensions(
                        img.width, img.height, maxWidth, maxHeight
                    );
                    
                    
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error(t('imageLoadFailed')));
            img.src = URL.createObjectURL(file);
        });
    }
    
    // 📏 計算新尺寸（保持不變）
    static calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }
    
    // 📊 計算 DataURL 大小（保持不變）
    static getDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;
        
        const base64Data = dataUrl.split(',')[1];
        if (!base64Data) return 0;
        
        return Math.round((base64Data.length * 3) / 4);
    }
    
    // 📄 檔案轉 DataURL（保持不變）
    static async fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // 🧹 清理過期快取（保持不變，但增強）
    static cleanExpiredCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
        const now = Date.now();
        
        // 清理 localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('img_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (now - data.timestamp > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
        
        // 清理記憶體快取中的過期項目
        for (const [hash, data] of this.hashCache.entries()) {
            if (now - data.timestamp > maxAge) {
                this.hashCache.delete(hash);
                const index = this.cacheAccessOrder.indexOf(hash);
                if (index > -1) {
                    this.cacheAccessOrder.splice(index, 1);
                }
            }
        }
        
        
    }
    
    // ⚙️ 設定優化參數（保持不變）
    static setOptimizationSettings(settings) {
        if (settings.maxWidth) this.maxWidth = settings.maxWidth;
        if (settings.maxHeight) this.maxHeight = settings.maxHeight;
        if (settings.quality !== undefined) this.quality = settings.quality;
        if (settings.cacheMaxSize) this.cacheMaxSize = settings.cacheMaxSize;
        
    }
    
    // 📈 取得快取統計（增強版）
    static getCacheStats() {
        const memoryCount = this.hashCache.size;
        const memoryUsage = this.estimateMemoryUsage();
        let localStorageCount = 0;
        let totalCacheSize = 0;
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('img_')) {
                localStorageCount++;
                totalCacheSize += localStorage.getItem(key).length;
            }
        });
        
        return {
            memoryCache: memoryCount,
            memoryUsageMB: Math.round(memoryUsage / 1024 / 1024 * 100) / 100,
            localStorage: localStorageCount,
            totalCacheSize: Math.round(totalCacheSize / 1024) + 'KB',
            cacheHitRate: this.operationCount > 0 ? '統計中...' : '0%'
        };
    }
}

async function handleImageUpload(itemId, versionId, file) {
    if (!file) return;
    
    // 根據當前模式確定類型和裁切比例
    const itemType = currentMode || 'character';
    const aspectRatio = '2:3'; // 統一使用2:3比例
    
    // 使用裁切器
    ImageCropper.show(file, aspectRatio, async (croppedDataUrl) => {
        
        
        // ✨ 立即轉換為 Blob URL
        const blobUrl = BlobManager.getBlobUrl(croppedDataUrl);
        
        
        // 更新數據
        updateField(itemType, itemId, versionId, 'avatar', croppedDataUrl);
        
        
        
        // 🎯 優化：使用單一的延遲渲染，避免多次 setTimeout
        setTimeout(() => {
            // 1. 統一重新渲染（一次性完成所有渲染）
            renderAll();
            
            // 2. 立即處理所有圖片的 Blob URL 轉換
            requestAnimationFrame(() => {
                const newBase64Images = document.querySelectorAll('img[src^="data:"]');
                
                
                newBase64Images.forEach(img => {
                    const blobUrl = BlobManager.getBlobUrl(img.src);
                    img.src = blobUrl;
                });
                
                
            });
        }, 50); // 單一的最小延遲
    });
}

// ===== 自動 Blob 轉換輔助函數 =====
function autoConvertNewImages() {
    // 延遲執行，確保 DOM 已更新
    setTimeout(() => {
        const newBase64Images = document.querySelectorAll('img[src^="data:"]');
        
        if (newBase64Images.length > 0) {
            
            
            newBase64Images.forEach(img => {
                try {
                    const blobUrl = BlobManager.getBlobUrl(img.src);
                    img.src = blobUrl;
                } catch (error) {
                    console.warn('圖片轉換失敗:', error);
                }
            });
            
            
        }
    }, 100);
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 定期清理過期快取
    ImageOptimizer.cleanExpiredCache();
    
    
});

// ===== 應用生命週期管理 =====
document.addEventListener('DOMContentLoaded', () => {
    // 定期清理過期快取
    ImageOptimizer.cleanExpiredCache();
    
    
});

// 應用關閉時清理所有 Blob URL
window.addEventListener('beforeunload', () => {
    BlobManager.cleanupAll();
});

// 記憶體壓力時自動清理（如果瀏覽器支援）
if ('memory' in performance) {
    setInterval(() => {
        const memInfo = performance.memory;
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
        
        // 如果記憶體使用超過 200MB，進行清理
        if (usedMB > 200 && BlobManager.blobUrls.size > 50) {
            
            BlobManager.performCleanup();
        }
    }, 30000); // 每30秒檢查一次
}


// ===== 頭像拖拽上傳函數 =====

/**
 * 處理頭像拖拽上傳
 * @param {Event} e - 拖拽事件
 * @param {string} itemId - 項目ID  
 * @param {string} versionId - 版本ID
 * @param {string} type - 類型 ('character', 'userpersona', 'loveydovey')
 */
function handleAvatarDrop(e, itemId, versionId, type = 'character') {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        NotificationManager.warning(t('pleaseDropImageFiles'));
        return;
    }
    
    if (imageFiles.length > 1) {
        NotificationManager.warning(t('pleaseDropSingleImage'));
        return;
    }
    
    // 根據類型調用對應的上傳函數
    switch (type) {
        case 'loveydovey':
            if (typeof handleLoveyDoveyImageUpload === 'function') {
                handleLoveyDoveyImageUpload(itemId, versionId, imageFiles[0]);
            } else {
                console.warn('handleLoveyDoveyImageUpload 函數不存在');
                handleImageUpload(itemId, versionId, imageFiles[0]);
            }
            break;
        case 'userpersona':
        case 'character':
        default:
            handleImageUpload(itemId, versionId, imageFiles[0]);
            break;
    }
}

/**
 * 顯示拖拽覆蓋層
 * @param {Event} e - 拖拽事件
 * @param {HTMLElement} target - 目標元素
 */
function showAvatarDragOverlay(e, target) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.dataTransfer.types.includes('Files')) return;
    
    // 檢查是否已有覆蓋層
    if (target.querySelector('.avatar-drag-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'avatar-drag-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(92, 193, 255, 0.3);
        color: #66b3ff;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        font-size: 1.2em;
        font-weight: 600;
        backdrop-filter: blur(3px);
        border: 0px dashed #66b3ff;
        border-radius: inherit;
        box-sizing: border-box;
        pointer-events: none;
    `;
    
    overlay.innerHTML = `<div>${t('dropImageHere')}</div>`;
    
    target.style.position = 'relative';
    target.appendChild(overlay);
}

/**
 * 隱藏拖拽覆蓋層
 * @param {HTMLElement} target - 目標元素
 */
function hideAvatarDragOverlay(target) {
    const overlay = target.querySelector('.avatar-drag-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * 處理拖拽離開
 * @param {Event} e - 拖拽事件
 * @param {HTMLElement} target - 目標元素
 */
function handleAvatarDragLeave(e, target) {
    // 檢查是否真的離開了元素（不是移動到子元素）
    if (!target.contains(e.relatedTarget)) {
        hideAvatarDragOverlay(target);
    }
}