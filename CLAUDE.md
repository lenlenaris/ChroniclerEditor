# Chronicler Editor - Claude Code 專案指南

## 專案概述

這是一個專為 **SillyTavern** 設計的網頁版角色編輯器，部署於 GitHub Pages。
整個網站是 vibe coding 產出，可能存在潛在漏洞，修改時需謹慎。

### 主要功能

| 功能模組 | 說明 | 匯出格式 |
|----------|------|----------|
| 角色卡管理 | 多版本角色卡編輯 | JSON / PNG |
| 世界書管理 | Lorebook 條目編輯 | SillyTavern 格式 |
| 筆記管理 | 自定義欄位的筆記系統 | - |
| 玩家角色管理 | User Persona 管理 | TXT / MD |
| 卿卿我我角色管理 | LoveyDovey 角色 | TXT / MD |
| 預設提示詞管理 | Preset 管理 | SillyTavern 格式 |

所有類型都支援**多版本管理**和**版本對比**功能。

## 技術架構

```
/editing/
├── index.html              # 主入口
├── manifest.json           # PWA 配置
├── css/                    # 樣式表（CSS 變數系統）
├── src/
│   ├── script.js           # 主邏輯（4000+ 行）
│   └── modules/            # 功能模組（22 個）
└── translations/           # 多語言翻譯檔
    ├── index.js            # TranslationManager
    ├── zh-TW.js            # 繁體中文
    └── en-US.js            # 英文
```

### 核心技術

- **前端**：純 HTML / CSS / JavaScript，無框架
- **儲存**：IndexedDB（主要）+ localStorage（備援/設定）
- **國際化**：中英雙語，使用 `t()` 函數
- **Token 計算**：整合 tiktoken

### 關鍵類別

| 類別 | 檔案 | 用途 |
|------|------|------|
| `TranslationManager` | translations/index.js | 多語言管理 |
| `OtherSettings` | script.js | 使用者設定（含卿卿我我顯示開關） |
| `ThemeManager` | modules/theme-manager.js | 主題管理 |
| `ItemManager` | script.js | 項目 CRUD 操作 |
| `FavoriteManager` | script.js | 最愛功能 |

### 資料儲存 Key

| localStorage Key | 用途 |
|------------------|------|
| `characterCreatorLang` | 語言設定（en/zh） |
| `characterCreator_otherSettings` | 功能開關設定 |
| `characterCreatorCustomColors` | 自訂主題顏色 |

## 開發規範

### 必須遵守

1. **不破壞現有功能**：修改前先理解原有邏輯
2. **保持架構一致**：遵循現有的模組化類別設計
3. **注意變數呼叫**：確認是否影響其他模組的變數引用
4. **多語言支援**：所有 UI 文字必須使用 `t('key')` 函數
5. **效能優先**：避免不必要的 DOM 操作、事件綁定、重複計算

### 禁止事項

- 不要破壞現有 CSS 設計風格
- 不要引入新的框架或大型依賴
- 不要在不理解的情況下重構核心邏輯
- 不要忽略 IndexedDB 的非同步特性

### 新增翻譯

在 `translations/zh-TW.js` 和 `translations/en-US.js` 中同步新增：

```javascript
// zh-TW.js
newFeature: '新功能',

// en-US.js
newFeature: 'New Feature',
```

使用時：
```javascript
const text = t('newFeature');
```

## URL 參數支援

網站支援透過 URL 參數預設語言和卿卿我我功能：

```
?lang=zh&loveydovey=on   # 中文 + 開啟卿卿我我
?lang=en&loveydovey=off  # 英文 + 關閉卿卿我我
```

## 常見開發任務

### 新增設定選項

1. 在 `OtherSettings.settings` 新增屬性
2. 在設定 UI 新增控制項
3. 在 `updateSetting()` 處理變更邏輯

### 新增側邊欄區塊

1. 在 `renderSidebar()` 新增 HTML
2. 新增對應的事件處理
3. 新增翻譯 key

### 新增資料類型

1. 宣告全域陣列（如 `let newItems = []`）
2. 在 `storage.js` 新增載入/儲存邏輯
3. 建立對應的 renderer 模組
4. 在側邊欄新增入口

## 注意事項

- 目前版本：0.3.3 beta
- 初始化流程在 `initApp()` 函數
- 全域狀態變數在 script.js 開頭宣告
- DOM 操作建議使用 `setTimeout` 確保渲染完成
