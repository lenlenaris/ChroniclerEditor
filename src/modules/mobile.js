// 手機版側邊欄不自動展開列表
function toggleMobileSidebar() {
    if (window.innerWidth > 768) return;
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-sidebar-overlay');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-icon');
    const collapsedIcons = document.getElementById('sidebar-collapsed-icons');
    
    if (sidebar.style.display === 'flex' && sidebar.style.position === 'fixed') {
        // 隱藏動畫
        sidebar.style.transform = 'translateX(-100%)';
        
        // 恢復電腦版按鈕行為
        if (sidebarToggleBtn) {
            sidebarToggleBtn.onclick = toggleSidebar;
        }
        
        setTimeout(() => {
            sidebar.style.display = 'none';
            sidebar.style.position = '';
            sidebar.style.top = '';
            sidebar.style.left = '';
            sidebar.style.zIndex = '';
            sidebar.style.height = '';
            sidebar.style.width = '';
            sidebar.style.transform = '';
            sidebar.style.transition = '';
            
            // 恢復收合圖示的原始顯示狀態
            if (collapsedIcons) {
                collapsedIcons.style.display = '';
            }
        }, 300);
        
        if (overlay) overlay.remove();
    } else {
        // 🔧 修復：只移除側邊欄的收合狀態，不展開內部列表
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            
            // 更新按鈕圖示為展開狀態
            if (sidebarToggleBtn) {
                sidebarToggleBtn.innerHTML = IconManager.panelLeft({width: 16, height: 16, style: 'color: var(--text-muted);'});
            }
        }
        
        // 手機版強制隱藏收合圖示列表
        if (collapsedIcons) {
            collapsedIcons.style.display = 'none';
        }
        
        // 顯示動畫
        sidebar.style.display = 'flex';
        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.left = '0';
        sidebar.style.zIndex = '1002';
        sidebar.style.height = '100vh';
        sidebar.style.width = '280px';
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.transition = 'transform 0.3s ease';
        
        // 修改側邊欄內按鈕行為為關閉側邊欄
        if (sidebarToggleBtn) {
            sidebarToggleBtn.onclick = toggleMobileSidebar;
        }
        
        // 添加遮罩
        const overlayNew = document.createElement('div');
        overlayNew.className = 'mobile-sidebar-overlay';
        overlayNew.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0);
            z-index: 1001;
            transition: background 0.3s ease;
        `;
        overlayNew.onclick = () => toggleMobileSidebar();
        document.body.appendChild(overlayNew);
        
        // 觸發滑入動畫
        setTimeout(() => {
            sidebar.style.transform = 'translateX(0)';
            overlayNew.style.background = 'rgba(0,0,0,0.5)';
        }, 10);
    }
}

// 正確控制收合圖示顯示邏輯
function handleResponsiveChanges() {
    const sidebar = document.getElementById('sidebar');
    const mobileHeader = document.querySelector('.mobile-header');
    const mainContent = document.querySelector('.main-content');
    const overlay = document.querySelector('.mobile-sidebar-overlay');
    const collapsedIcons = document.getElementById('sidebar-collapsed-icons');
    
    // 檢查當前視窗寬度
    if (window.innerWidth <= 768) {
        // 手機版：隱藏側邊欄，顯示手機版頭部
        if (sidebar) {
            sidebar.style.display = 'none';
            sidebar.style.position = '';
            sidebar.style.top = '';
            sidebar.style.left = '';
            sidebar.style.zIndex = '';
            sidebar.style.height = '';
            sidebar.style.width = '';
            sidebar.style.transform = '';
            sidebar.style.transition = '';
        }
        if (mobileHeader) {
            mobileHeader.style.display = 'flex';
        }
        if (mainContent) {
            mainContent.style.marginTop = '0';
        }
    } else if (window.innerWidth <= 992) {
        // 中等寬度 - 電腦版自動收合側邊欄
        if (sidebar) {
            // 移除手機版樣式
            sidebar.style.position = '';
            sidebar.style.top = '';
            sidebar.style.left = '';
            sidebar.style.zIndex = '';
            sidebar.style.height = '';
            sidebar.style.transform = '';
            sidebar.style.transition = '';
            sidebar.style.display = 'flex';
            sidebar.style.width = '';
            
            // 強制收合側邊欄（如果還沒收合的話）
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                
                // 同時更新收合圖示和展開狀態
                const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');
                if (sidebarToggleIcon) {
                    sidebarToggleIcon.innerHTML = IconManager.panelLeft({width: 16, height: 16, style: 'color: var(--text-muted);'});
                }
                
                // 收合所有展開的區塊
                const expandedSections = document.querySelectorAll('.sidebar-section-content:not(.collapsed)');
                expandedSections.forEach(section => {
                    section.classList.add('collapsed');
                });
            }
            
            // 🔧 關鍵：根據收合狀態控制圖示顯示
            if (collapsedIcons) {
                if (sidebar.classList.contains('collapsed')) {
                    collapsedIcons.style.display = 'flex';
                } else {
                    collapsedIcons.style.display = 'none';
                }
            }
        }
        if (mobileHeader) {
            mobileHeader.style.display = 'none';
        }
        if (mainContent) {
            mainContent.style.marginTop = '0';
        }
    } else {
        // 大螢幕
        if (sidebar) {
            // 移除手機版樣式
            sidebar.style.position = '';
            sidebar.style.top = '';
            sidebar.style.left = '';
            sidebar.style.zIndex = '';
            sidebar.style.height = '';
            sidebar.style.transform = '';
            sidebar.style.transition = '';
            sidebar.style.display = 'flex';
            sidebar.style.width = '';
            
            // 🔧 關鍵：根據收合狀態控制圖示顯示
            if (collapsedIcons) {
                if (sidebar.classList.contains('collapsed')) {
                    collapsedIcons.style.display = 'flex';
                } else {
                    collapsedIcons.style.display = 'none';
                }
            }
        }
        if (mobileHeader) {
            mobileHeader.style.display = 'none';
        }
        if (mainContent) {
            mainContent.style.marginTop = '0';
        }
    }
    
    // 移除手機版遮罩
    if (overlay) {
        overlay.remove();
    }
    // 更新手機版麵包屑
    if (window.innerWidth <= 768) {
        updateMobileBreadcrumb();
    }
}

// 手機版模態框輔助函數
function openModalOnMobile(modalFunction) {
    // 檢查是否為手機版且側邊欄已展開
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.style.position === 'fixed' && sidebar.style.display === 'flex') {
            // 先關閉側邊欄
            toggleMobileSidebar();
            // 稍微延遲後再開啟模態框，等收起動畫完成
            setTimeout(() => {
                modalFunction();
            }, 320); // 比動畫時間稍長一點
            return;
        }
    }
    // 桌面版或側邊欄未展開時直接開啟模態框
    modalFunction();
}

function updateMobileBreadcrumb() {
    // 只在手機版且元素存在時才執行
    if (window.innerWidth > 768) return;
    
    const breadcrumbElement = document.getElementById('mobile-nav-breadcrumb');
    if (!breadcrumbElement) return;
    
    let breadcrumbText = '';
    let isClickable = false;
    let clickAction = null;
    
    // 判斷是否為編輯模式
    const currentItemId = ItemManager && ItemManager.getCurrentItemId ? ItemManager.getCurrentItemId() : null;
    
    if (currentItemId) {
        // 編輯模式 - 讓麵包屑可點擊回到對應的總覽頁面
        breadcrumbText = getMobileBreadcrumbForEdit();
        isClickable = true;
        clickAction = () => {
            // 根據當前模式回到對應的總覽頁面
            if (currentMode === 'character') {
                goToHomePage(); // 角色卡回到首頁
            } else {
                enterListPage(currentMode); // 其他類型回到對應列表頁
            }
        };
    } else {
        // 總覽模式 - 復用電腦版邏輯
        try {
            const currentPageInfo = OverviewManager.getCurrentPageInfo();
            const breadcrumbs = NavigationManager.getBreadcrumbs();
            const isInFolder = NavigationManager.isInFolder();
            
            if (isInFolder && breadcrumbs.length > 1) {
                breadcrumbText = `${currentPageInfo.name} / ${breadcrumbs[1]}`;
                isClickable = true; // 在資料夾內時可以點擊返回
                clickAction = () => {
                    NavigationManager.exitFolder();
                };
            } else {
                breadcrumbText = currentPageInfo.name;
                isClickable = false; // 在根目錄時不可點擊
            }
        } catch (error) {
            console.warn('取得總覽頁麵包屑時發生錯誤:', error);
            breadcrumbText = '總覽';
            isClickable = false;
        }
    }
    
    // 更新內容和樣式
    if (breadcrumbElement.textContent !== breadcrumbText) {
        breadcrumbElement.textContent = breadcrumbText;
    }
    
    // 設定點擊行為和樣式
    if (isClickable && clickAction) {
        breadcrumbElement.style.cursor = 'pointer';
        breadcrumbElement.style.color = 'var(--text-color)';
        breadcrumbElement.onclick = clickAction;
        
        // hover效果
        breadcrumbElement.onmouseover = () => {
            breadcrumbElement.style.color = 'var(--accent-color)';
        };
        breadcrumbElement.onmouseout = () => {
            breadcrumbElement.style.color = 'var(--text-color)';
        };
    } else {
        breadcrumbElement.style.cursor = 'default';
        breadcrumbElement.style.color = 'var(--text-color)';
        breadcrumbElement.onclick = null;
        breadcrumbElement.onmouseover = null;
        breadcrumbElement.onmouseout = null;
    }
}

// 取得總覽頁的麵包屑文字
function getMobileBreadcrumbForOverview(type, typeName) {
    // 檢查是否在資料夾內
    const currentFolderId = NavigationManager.getCurrentFolderId();
    if (currentFolderId) {
        const breadcrumbs = NavigationManager.getBreadcrumbs();
        if (breadcrumbs.length > 1) {
            return `${typeName} / ${breadcrumbs[1]}`;
        }
    }
    
    return typeName;
}

// 取得編輯頁的麵包屑文字
function getMobileBreadcrumbForEdit() {
    const currentItemId = ItemManager.getCurrentItemId();
    if (!currentItemId) return '';
    
    let itemName = '';
    let versionName = '';
    let typeName = '';
    
    try {
        // 根據不同類型取得項目名稱和版本
        if (currentMode === 'character') {
            typeName = t('character'); // 改為 character
            const character = characters.find(c => c.id === currentItemId);
            if (character) {
                itemName = character.name;
                const currentVersion = character.versions.find(v => v.id === currentVersionId);
                if (currentVersion) {
                    versionName = currentVersion.name;
                }
            }
        } else if (currentMode === 'worldbook') {
            typeName = t('worldBook'); // 改為 worldBook
            const worldbook = worldBooks.find(w => w.id === currentItemId);
            if (worldbook) {
                itemName = worldbook.name;
                const currentVersion = worldbook.versions.find(v => v.id === currentWorldBookVersionId);
                if (currentVersion) {
                    versionName = currentVersion.name;
                }
            }
        } else if (currentMode === 'custom') {
            typeName = t('customFields'); // 改為 customFields
            const customSection = customSections.find(c => c.id === currentItemId);
            if (customSection) {
                itemName = customSection.name;
                const currentVersion = customSection.versions.find(v => v.id === currentCustomVersionId);
                if (currentVersion) {
                    versionName = currentVersion.name;
                }
            }
        } else if (currentMode === 'userpersona') {
            typeName = t('userPersona'); // 改為 userPersona
            const persona = userPersonas.find(p => p.id === currentItemId);
            if (persona) {
                itemName = persona.name;
                const currentVersion = persona.versions.find(v => v.id === currentUserPersonaVersionId);
                if (currentVersion) {
                    versionName = currentVersion.name;
                }
            }
        } else if (currentMode === 'loveydovey') {
            typeName = t('loveydovey'); // 改為 loveydovey
            const loveyDovey = loveyDoveyCharacters.find(l => l.id === currentItemId);
            if (loveyDovey) {
                itemName = loveyDovey.name;
                const currentVersion = loveyDovey.versions.find(v => v.id === currentLoveyDoveyVersionId);
                if (currentVersion) {
                    versionName = currentVersion.name;
                }
            }
        }
        
        // 組合麵包屑文字
        if (itemName && versionName) {
            return `${typeName} / ${itemName} / ${versionName}`;
        } else if (itemName) {
            return `${typeName} / ${itemName}`;
        }
        
    } catch (error) {
        console.warn('取得手機版編輯麵包屑時發生錯誤:', error);
    }
    
    return typeName || t('edit') || '編輯';
}

window.addEventListener('resize', handleResponsiveChanges);
document.addEventListener('DOMContentLoaded', function() {
    handleResponsiveChanges();
    // 延遲更新麵包屑，確保翻譯系統載入完成
    setTimeout(() => {
        updateMobileBreadcrumb();
    }, 50);
});