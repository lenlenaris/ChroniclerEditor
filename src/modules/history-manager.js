// ===== History Manager - 瀏覽器返回鍵支援 =====
class HistoryManager {
    static currentState = null;
    static isRestoring = false;

    static init() {
        // 替換初始狀態（不產生新的歷史記錄）
        const initialState = this.captureCurrentState();
        this.currentState = initialState;
        history.replaceState(initialState, '');

        // 監聽 popstate 事件
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.restoreState(event.state);
            } else {
                // state 為 null 時回到首頁
                this.isRestoring = true;
                goToHomePage();
                this.isRestoring = false;
            }
        });
    }

    static pushState(state) {
        if (this.isRestoring) return;

        // 去重：避免連續推入相同狀態
        if (this.currentState && this._statesEqual(this.currentState, state)) {
            return;
        }

        this.currentState = state;
        history.pushState(state, '');
    }

    static captureCurrentState() {
        return {
            isHomePage,
            isListPage,
            listPageType,
            currentMode,
            viewMode,
            currentFolderId,
            folderBreadcrumbs: [...folderBreadcrumbs],
            currentCharacterId,
            currentVersionId,
            currentCustomSectionId,
            currentCustomVersionId,
            currentWorldBookId,
            currentWorldBookVersionId,
            currentUserPersonaId,
            currentUserPersonaVersionId,
            currentLoveyDoveyId,
            currentLoveyDoveyVersionId,
            currentPresetId,
            currentPresetVersionId,
            compareVersions: [...compareVersions],
            timestamp: Date.now()
        };
    }

    static restoreState(state) {
        this.isRestoring = true;

        // 還原所有全域變數
        isHomePage = state.isHomePage;
        isListPage = state.isListPage;
        listPageType = state.listPageType;
        currentMode = state.currentMode;
        viewMode = state.viewMode;
        currentFolderId = state.currentFolderId;
        folderBreadcrumbs = state.folderBreadcrumbs ? [...state.folderBreadcrumbs] : [];
        currentCharacterId = state.currentCharacterId;
        currentVersionId = state.currentVersionId;
        currentCustomSectionId = state.currentCustomSectionId;
        currentCustomVersionId = state.currentCustomVersionId;
        currentWorldBookId = state.currentWorldBookId;
        currentWorldBookVersionId = state.currentWorldBookVersionId;
        currentUserPersonaId = state.currentUserPersonaId;
        currentUserPersonaVersionId = state.currentUserPersonaVersionId;
        currentLoveyDoveyId = state.currentLoveyDoveyId;
        currentLoveyDoveyVersionId = state.currentLoveyDoveyVersionId;
        currentPresetId = state.currentPresetId;
        currentPresetVersionId = state.currentPresetVersionId;
        compareVersions = state.compareVersions ? [...state.compareVersions] : [];

        // 重置批量編輯狀態
        batchEditMode = false;
        selectedItems = [];

        this.currentState = state;

        // 重新渲染
        renderAll();
        updateMobileBreadcrumb();

        this.isRestoring = false;
    }

    static _statesEqual(a, b) {
        return a.isHomePage === b.isHomePage &&
            a.isListPage === b.isListPage &&
            a.listPageType === b.listPageType &&
            a.currentMode === b.currentMode &&
            a.viewMode === b.viewMode &&
            a.currentFolderId === b.currentFolderId &&
            a.currentCharacterId === b.currentCharacterId &&
            a.currentVersionId === b.currentVersionId &&
            a.currentCustomSectionId === b.currentCustomSectionId &&
            a.currentCustomVersionId === b.currentCustomVersionId &&
            a.currentWorldBookId === b.currentWorldBookId &&
            a.currentWorldBookVersionId === b.currentWorldBookVersionId &&
            a.currentUserPersonaId === b.currentUserPersonaId &&
            a.currentUserPersonaVersionId === b.currentUserPersonaVersionId &&
            a.currentLoveyDoveyId === b.currentLoveyDoveyId &&
            a.currentLoveyDoveyVersionId === b.currentLoveyDoveyVersionId &&
            a.currentPresetId === b.currentPresetId &&
            a.currentPresetVersionId === b.currentPresetVersionId;
    }
}
