# Chronicler OAuth Worker 部署指南

這個 Cloudflare Worker 負責處理 Google OAuth 2.0 授權流程，讓使用者可以長期保持 Google 登入狀態。

## 前置需求

1. [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)（免費）
2. [Node.js](https://nodejs.org/) 18+
3. Google Cloud Console 專案（已有）

## 步驟一：設定 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案（或建立新專案）
3. 前往 **APIs & Services** > **Credentials**
4. 編輯現有的 OAuth 2.0 Client ID，或建立新的：
   - **Application type**: Web application
   - **Authorized redirect URIs**: 新增 `https://chronicler-oauth.YOUR_SUBDOMAIN.workers.dev/auth/callback`
     （稍後部署時會取得實際的 URL）

5. 記下 **Client ID** 和 **Client Secret**

## 步驟二：安裝 Wrangler CLI

```bash
npm install -g wrangler
```

## 步驟三：登入 Cloudflare

```bash
wrangler login
```

這會開啟瀏覽器讓你授權 Wrangler 存取你的 Cloudflare 帳號。

## 步驟四：修改設定檔

編輯 `wrangler.toml`：

```toml
name = "chronicler-oauth"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
FRONTEND_URL = "https://你的用戶名.github.io/你的專案路徑"
GOOGLE_CLIENT_ID = "你的-client-id.apps.googleusercontent.com"
```

## 步驟五：設定 Secret（Client Secret）

**重要**：Client Secret 必須使用 `wrangler secret` 設定，不要放在設定檔中！

```bash
cd cloudflare-worker
wrangler secret put GOOGLE_CLIENT_SECRET
```

系統會提示你輸入 secret 值，貼上你的 Google Client Secret。

## 步驟六：部署 Worker

```bash
npm install
npm run deploy
```

部署成功後，會顯示 Worker 的 URL，例如：
```
https://chronicler-oauth.你的subdomain.workers.dev
```

## 步驟七：更新 Google Cloud Console

回到 Google Cloud Console，將實際的 Worker URL 加入 **Authorized redirect URIs**：
```
https://chronicler-oauth.你的subdomain.workers.dev/auth/callback
```

## 步驟八：更新前端程式碼

編輯 `src/modules/cloudSync.js`，更新 `WORKER_URL`：

```javascript
this.WORKER_URL = 'https://chronicler-oauth.你的subdomain.workers.dev';
```

## 測試

1. 部署前端到 GitHub Pages
2. 開啟網站，進入設定 > 雲端同步
3. 點擊「連接到 Google」
4. 完成 Google 登入授權
5. 確認登入成功，並可以上傳/下載備份

## 常見問題

### Q: 出現 CORS 錯誤
確認 `wrangler.toml` 中的 `FRONTEND_URL` 設定正確，包含完整的 URL（含 https://）。

### Q: 出現 redirect_uri_mismatch 錯誤
確認 Google Cloud Console 中的 **Authorized redirect URIs** 設定正確，必須完全匹配 Worker 的 callback URL。

### Q: 出現 invalid_client 錯誤
確認 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 設定正確。

### Q: 登入後沒有收到 refresh_token
確認 Google OAuth 設定中有 `access_type: 'offline'` 和 `prompt: 'consent'`。如果之前已經授權過，可能需要在 [Google 帳號安全設定](https://myaccount.google.com/permissions) 中撤銷應用程式權限，然後重新授權。

## 本地開發

```bash
npm run dev
```

這會在 `http://localhost:8787` 啟動本地開發伺服器。

## 監控日誌

```bash
npm run tail
```

即時查看 Worker 的執行日誌。

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/auth/login` | GET | 重定向到 Google OAuth 登入頁面 |
| `/auth/callback` | GET | Google OAuth 回調處理 |
| `/auth/refresh` | POST | 使用 refresh token 取得新的 access token |
| `/auth/revoke` | POST | 撤銷 token |
| `/auth/userinfo` | GET | 取得使用者資訊 |
| `/health` | GET | 健康檢查 |

## 費用

Cloudflare Workers 免費方案包含：
- 每日 100,000 次請求
- 無冷啟動延遲

對於個人專案來說完全夠用。
