// icons.js - SVG圖示管理器
class IconManager {

    // 通用SVG創建輔助方法
    static createSVG(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = '',
            paths = [],
            lines = [],
            circles = [],
            polylines = [],
            rects = []
        } = options;
        
        let content = '';
        
        // 添加路徑
        paths.forEach(path => {
            content += `<path d="${path}"/>`;
        });
        
        // 添加線條
        lines.forEach(line => {
            const coords = line.split(' ');
            content += `<line x1="${coords[0]}" y1="${coords[1]}" x2="${coords[2]}" y2="${coords[3]}"/>`;
        });
        
        // 添加圓形
        circles.forEach(circle => {
            const coords = circle.split(' ');
            content += `<circle cx="${coords[0]}" cy="${coords[1]}" r="${coords[2]}"/>`;
        });
        
        // 添加多邊形線條
        polylines.forEach(polyline => {
            content += `<polyline points="${polyline}"/>`;
        });
        
        // 添加矩形
        rects.forEach(rect => {
            const coords = rect.split(' ');
            content += `<rect x="${coords[0]}" y="${coords[1]}" width="${coords[2]}" height="${coords[3]}"${coords[4] ? ` rx="${coords[4]}"` : ''}${coords[5] ? ` ry="${coords[5]}"` : ''}/>`;
        });
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            ${content}
        </svg>`;
    }
    
    // 新增/加號圖示
    static plus(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>`;
    }

    // 編輯/批量編輯圖示
    static edit(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
    }

    // 搜尋圖示
    static search(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
        </svg>`;
    }

    // 匯入/上傳圖示
    static upload(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <polyline points="9,14 12,11 15,14"/>
        </svg>`;
    }

    // 匯入圖示
    static import(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>`;
    }

        // 複製圖示
    static copy(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>`;
    }

    // 刪除/垃圾桶圖示
    static delete(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <polyline points="3,6 5,6 21,6"/>
            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>`;
    }

    // 垃圾桶圖示的別名
    static trash(options = {}) {
        return this.delete(options);
    }

    // 書籤/標籤圖示
    static bookmark(options = {}) {
        const { width = 16, height = 16, className = '', style = '' } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>`;
    }

    // 鎖頭/秘密圖示
    static lock(options = {}) {
        const { width = 16, height = 16, className = '', style = '' } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="7" r="4"></circle>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
    }

    // 下載圖示
    static download(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>`;
    }

    // 更多選單圖示（三個點）
    static menu(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
        </svg>`;
    }

    // 更多選單圖示的別名
    static more(options = {}) {
        return this.menu(options);
    }

    // 圖片圖示
    static image(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
        </svg>`;
    }

    // 設定齒輪圖示
    static settings(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>`;
    }

    // 地球/語言圖示
    static globe(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`;
    }

    // 語言圖示的別名
    static language(options = {}) {
        return this.globe(options);
    }

    // 匯出圖示的別名
    static export(options = {}) {
        return this.download(options);
    }

    // 資料夾圖示
    static folder(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
        </svg>`;
    }

    // 全選圖示
    static selectAll(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M3 17l2 2 4-4"/>
            <path d="M3 7l2 2 4-4"/>
            <path d="M13 6h8"/>
            <path d="M13 12h8"/>
            <path d="M13 18h8"/>
        </svg>`;
    }


    // 文件圖示
    static file(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
        </svg>`;
    }

    // 單用戶圖示
    static user(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>`;
    }

    // 愛心圖示
    static heart(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>`;
    }

    // 書本圖示
    static book(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>`;
    }

    // 左箭頭圖示
    static arrowLeft(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="m15 18-6-6 6-6"/>
        </svg>`;
    }

    // 刷新/重新載入圖示
    static refresh(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M3 3v5h5"/>
            <path d="M6 17a9 9 0 1 0-3-3"/>
        </svg>`;
    }

    // 齒輪圖示
    static gear(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`;
    }

    // 訊息方框圖示
    static messageSquare(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`;
    }

    // 垂直拖曳控制柄圖示
    static gripVertical(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="4 4 20 16" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>`;
    }

    // 郵件圖示
    static mail(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </svg>`;
    }

    // 郵件圖示的別名
    static email(options = {}) {
        return this.mail(options);
    }

    // 儲存圖示
    static save(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17,21 17,13 7,13 7,21"></polyline>
            <polyline points="7,3 7,8 15,8"></polyline>
        </svg>`;
    }

    // 右箭頭/展開圖示
    static chevronRight(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <polyline points="9,6 15,12 9,18"/>
        </svg>`;
    }

    // 警告圖示
    static warning(options = {}) {
        const { width = 16, height = 16, className = '', style = '' } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
        </svg>`;
    }

    // 感嘆號圖示
    static exclamation(options = {}) {
        const { width = 16, height = 16, className = '', style = '' } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>`;
    }

    // 調色盤圖示
    static palette(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>`;
    }

    // 成功/打勾圖示
    static success(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <path d="M20 6L9 17l-5-5"/>
        </svg>`;
    }

    // 錯誤/X圖示
    static error(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`;
    }

    // 資訊/i圖示
    static info(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>`;
    }

    // 問號/確認圖示
    static question(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`;
    }

        // 面板收合圖示
    static panelLeft(options = {}) {
        const { width = 16, height = 16, strokeWidth = 2, className = '', style = '' } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>`;
    }

    // 笑臉圖示（用於玩家角色）
    static smile(options = {}) {
        const {
            width = 16,
            height = 16,
            strokeWidth = 2,
            className = '',
            style = ''
        } = options;
        
        return `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="${style}">
            <circle cx="12" cy="12" r="10"/>
            <path d="m8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>`;
    }
    
}