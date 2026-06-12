# Google 登入 + 雲端同步 + Cloudflare Worker 完整複製指引

本文件記錄 Chronicler Editor 專案使用的 Google OAuth 2.0 + Google Drive 備份架構,供其他專案複製使用。

---

## 一、架構總覽

```
┌────────────┐      ①登入重定向     ┌──────────────────┐
│  前端      │ ───────────────────▶│ Cloudflare Worker│
│ (靜態網頁) │                     │ (OAuth 中介後端) │
│            │◀─────②回調+token────│                  │
└─────┬──────┘                     └────────┬─────────┘
      │                                     │ 交換 code / refresh
      │                                     ▼
      │                             ┌───────────────┐
      │ ③直接呼叫 Drive API         │ Google OAuth  │
      └────────────────────────────▶│ + Drive API   │
                                    └───────────────┘
```

### 為什麼要 Worker?

Google OAuth 的 `client_secret` 不能放前端;而 refresh token 流程必須有後端代換。Cloudflare Worker 是免費、零冷啟動、零維運的最佳中介。

### 職責分工

- **Worker**:只做 OAuth(login / callback / refresh / revoke / userinfo),不碰使用者資料
- **前端**:拿到 access_token 後**直接**呼叫 Google Drive API 上傳/下載備份檔
- **儲存**:token 存在 `localStorage`,備份檔存在使用者自己的 Google Drive(`drive.file` scope,App 只能看到自己建立的檔案)

### 權限(Scopes)

```
https://www.googleapis.com/auth/drive.file        // 只能存取 App 建立的檔案
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

`drive.file` 是關鍵 — 比 `drive` 安全得多,Google 審查也較寬鬆。

---

## 二、Worker 端(後端)

### 2.1 目錄結構

```
cloudflare-worker/
├── src/index.js        # 全部邏輯在這一個檔
├── wrangler.toml       # 部署設定
└── package.json        # 只需 wrangler devDependency
```

### 2.2 `package.json`

```json
{
  "name": "your-app-oauth",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "devDependencies": { "wrangler": "^4.54.0" }
}
```

### 2.3 `wrangler.toml`

```toml
name = "your-app-oauth"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
FRONTEND_URL = "https://你的用戶.github.io/你的專案"
GOOGLE_CLIENT_ID = "xxx.apps.googleusercontent.com"
# GOOGLE_CLIENT_SECRET 用 `wrangler secret put` 設定,不放這裡
```

### 2.4 `src/index.js` — 完整 Worker 程式碼

```js
const GOOGLE_AUTH_URL     = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL    = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REVOKE_URL   = 'https://oauth2.googleapis.com/revoke';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

function corsHeaders(env, origin) {
  const allowed = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];
  const ok = allowed.some(a => origin?.startsWith(a));
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status, env, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env, origin) },
  });
}

function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    try {
      switch (url.pathname) {
        case '/auth/login':    return handleLogin(env, url);
        case '/auth/callback': return handleCallback(request, env);
        case '/auth/refresh':  return handleRefresh(request, env, origin);
        case '/auth/revoke':   return handleRevoke(request, env, origin);
        case '/auth/userinfo': return handleUserInfo(request, env, origin);
        case '/health':        return jsonResponse({ status: 'ok' }, 200, env, origin);
        default:               return jsonResponse({ error: 'Not Found' }, 404, env, origin);
      }
    } catch (error) {
      return jsonResponse({ error: 'Internal Server Error', message: error.message }, 500, env, origin);
    }
  },
};

// ───────────────────────── /auth/login ─────────────────────────
function handleLogin(env, url) {
  const state = generateState();
  const redirectUri = `${url.origin}/auth/callback`;
  const frontendUrl = url.searchParams.get('redirect') || env.FRONTEND_URL;

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');  // 拿 refresh_token
  authUrl.searchParams.set('prompt', 'consent');        // 強制同意畫面,確保拿到 refresh_token
  authUrl.searchParams.set('state', `${state}|${frontendUrl}`);
  return Response.redirect(authUrl.toString(), 302);
}

// ─────────────────────── /auth/callback ───────────────────────
async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  let frontendUrl = env.FRONTEND_URL;
  if (state && state.includes('|')) frontendUrl = state.split('|')[1];

  if (error || !code) {
    const errUrl = new URL(frontendUrl);
    errUrl.searchParams.set('auth_error', error || 'missing_code');
    return Response.redirect(errUrl.toString(), 302);
  }

  try {
    const redirectUri = `${url.origin}/auth/callback`;
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();

    if (tokens.error) {
      const errUrl = new URL(frontendUrl);
      errUrl.searchParams.set('auth_error',
        tokens.error_description ? `${tokens.error}: ${tokens.error_description}` : tokens.error);
      return Response.redirect(errUrl.toString(), 302);
    }

    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    const authData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user: { name: userInfo.name, email: userInfo.email, picture: userInfo.picture },
    };

    // 使用 URL fragment (#) 傳 token,避免伺服器日誌記錄
    const successUrl = new URL(frontendUrl);
    successUrl.hash = `auth_success=${encodeURIComponent(JSON.stringify(authData))}`;
    return Response.redirect(successUrl.toString(), 302);
  } catch (err) {
    const errUrl = new URL(frontendUrl);
    errUrl.searchParams.set('auth_error', 'token_exchange_failed');
    return Response.redirect(errUrl.toString(), 302);
  }
}

// ─────────────────────── /auth/refresh ───────────────────────
async function handleRefresh(request, env, origin) {
  if (request.method !== 'POST')
    return jsonResponse({ error: 'Method Not Allowed' }, 405, env, origin);

  try {
    const { refresh_token } = await request.json();
    if (!refresh_token)
      return jsonResponse({ error: 'Missing refresh_token' }, 400, env, origin);

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await res.json();

    if (tokens.error)
      return jsonResponse({ error: tokens.error, error_description: tokens.error_description }, 401, env, origin);

    return jsonResponse({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      refresh_token: tokens.refresh_token || null,
    }, 200, env, origin);
  } catch (err) {
    return jsonResponse({ error: 'Refresh failed', message: err.message }, 500, env, origin);
  }
}

// ─────────────────────── /auth/revoke ───────────────────────
async function handleRevoke(request, env, origin) {
  if (request.method !== 'POST')
    return jsonResponse({ error: 'Method Not Allowed' }, 405, env, origin);

  try {
    const { token } = await request.json();
    if (!token) return jsonResponse({ error: 'Missing token' }, 400, env, origin);

    const res = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.ok
      ? jsonResponse({ success: true }, 200, env, origin)
      : jsonResponse({ error: 'Revoke failed' }, 400, env, origin);
  } catch (err) {
    return jsonResponse({ error: 'Revoke failed', message: err.message }, 500, env, origin);
  }
}

// ─────────────────────── /auth/userinfo ───────────────────────
async function handleUserInfo(request, env, origin) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    return jsonResponse({ error: 'Missing Authorization' }, 401, env, origin);

  const accessToken = authHeader.substring(7);
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return jsonResponse({ error: 'Failed to fetch user info' }, res.status, env, origin);
    const userInfo = await res.json();
    return jsonResponse({
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
    }, 200, env, origin);
  } catch (err) {
    return jsonResponse({ error: 'Failed to fetch user info', message: err.message }, 500, env, origin);
  }
}
```

### 2.5 部署流程

```bash
npm install -g wrangler
wrangler login
cd cloudflare-worker
npm install
wrangler secret put GOOGLE_CLIENT_SECRET   # 貼上 secret
npm run deploy
# → 取得 https://your-app-oauth.<你>.workers.dev
```

部署後,到 **Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs** 加入:

```
https://your-app-oauth.<你>.workers.dev/auth/callback
```

---

## 三、Google Cloud Console 設定

1. 建立專案 → **APIs & Services → Library** 啟用 **Google Drive API**
2. **OAuth consent screen**
   - User type: External
   - Scopes: 加入 `drive.file`、`userinfo.email`、`userinfo.profile`
   - Test users: 加入要測試的 Google 帳號(未審查前只有 test users 可用)
3. **Credentials → Create OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Worker 的 `/auth/callback` URL
4. 複製 **Client ID**(放 `wrangler.toml`)與 **Client Secret**(用 `wrangler secret put`)

---

## 四、前端整合

### 4.1 GoogleCloudSync Class — 完整可複製版本

```js
class GoogleCloudSync {
  constructor() {
    this.WORKER_URL  = 'https://your-app-oauth.<你>.workers.dev';
    this.FOLDER_NAME = 'YourAppBackups';
    this.maxBackups  = 5;

    this.isSignedIn = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.currentUser = null;
    this.folderId = null;
    this._tokenRefreshPromise = null;
  }

  async init() {
    await this._handleOAuthCallback();

    const stored = localStorage.getItem('google_auth_token');
    if (stored) {
      const t = JSON.parse(stored);
      this.accessToken    = t.accessToken;
      this.refreshToken   = t.refreshToken;
      this.currentUser    = t.userProfile;
      this.tokenExpiresAt = t.expiresAt;

      if (this.refreshToken && Date.now() >= this.tokenExpiresAt) {
        try { await this._refreshAccessToken(); }
        catch { this._clearAuthData(); }
      }
      if (this.accessToken && this.refreshToken) this.isSignedIn = true;
    }
    this.updateAuthStatus();
  }

  async _handleOAuthCallback() {
    const hash = window.location.hash;
    if (hash.includes('auth_success=')) {
      try {
        const data = JSON.parse(decodeURIComponent(hash.split('auth_success=')[1]));
        this.accessToken    = data.access_token;
        this.refreshToken   = data.refresh_token;
        this.currentUser    = data.user;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
        this.isSignedIn = true;
        this._saveTokenData();
        history.replaceState(null, '', location.pathname + location.search);
      } catch {}
    }

    const params = new URLSearchParams(location.search);
    const authError = params.get('auth_error');
    if (authError) {
      this.showError('Auth failed: ' + authError);
      params.delete('auth_error');
      history.replaceState(null, '',
        params.toString() ? `${location.pathname}?${params}` : location.pathname);
    }
  }

  _saveTokenData() {
    localStorage.setItem('google_auth_token', JSON.stringify({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiresAt,
      userProfile: this.currentUser,
    }));
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

  signIn() {
    const current = location.origin + location.pathname;
    location.href = `${this.WORKER_URL}/auth/login?redirect=${encodeURIComponent(current)}`;
  }

  async signOut() {
    if (this.refreshToken) {
      await fetch(`${this.WORKER_URL}/auth/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.refreshToken }),
      }).catch(() => {});
    }
    this._clearAuthData();
    this.updateAuthStatus();
  }

  async ensureValidToken() {
    if (!this.accessToken) throw new Error('Not logged in');

    // 提早 5 分鐘判定過期
    const expired = Date.now() >= (this.tokenExpiresAt - 5 * 60 * 1000);
    if (!expired) return this.accessToken;
    if (!this.refreshToken) {
      this._clearAuthData();
      this.updateAuthStatus();
      throw new Error('Session expired');
    }

    // 合併併發 refresh
    if (this._tokenRefreshPromise) return this._tokenRefreshPromise;
    this._tokenRefreshPromise = this._refreshAccessToken()
      .finally(() => { this._tokenRefreshPromise = null; });
    return this._tokenRefreshPromise;
  }

  async _refreshAccessToken() {
    const res = await fetch(`${this.WORKER_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      if (res.status === 401 || data.error === 'invalid_grant') this._clearAuthData();
      throw new Error(data.error || 'Refresh failed');
    }
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    if (data.refresh_token) this.refreshToken = data.refresh_token;
    this._saveTokenData();
    return this.accessToken;
  }

  // ───────── Google Drive API(前端直呼) ─────────

  async ensureBackupFolder() {
    if (this.folderId) return this.folderId;
    const token = await this.ensureValidToken();

    const q = `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const search = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(r => r.json());

    if (search.files?.length) {
      this.folderId = search.files[0].id;
      return this.folderId;
    }

    const created = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }).then(r => r.json());
    this.folderId = created.id;
    return this.folderId;
  }

  async uploadFile(fileName, content, token) {
    const metadata = { name: fileName, parents: [this.folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return (await res.json()).id;
  }

  async listBackupFiles(token) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    return (await res.json()).files || [];
  }

  async downloadFile(fileId, token) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.text();
  }

  async deleteFile(fileId, token) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async cleanupOldBackups() {
    try {
      const token = await this.ensureValidToken();
      const files = await this.listBackupFiles(token);
      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        await Promise.all(toDelete.map(f => this.deleteFile(f.id, token)));
      }
    } catch {}
  }

  // ───────── 高階 API ─────────

  async uploadBackup() {
    try {
      const token = await this.ensureValidToken();
      const backupData = this.createBackupData();   // 自行實作
      const fileName = this.generateFileName();
      await this.ensureBackupFolder();
      const fileId = await this.uploadFile(fileName, backupData, token);
      await this.cleanupOldBackups();
      return fileId;
    } catch (error) {
      this.showError('Upload failed: ' + error.message);
    }
  }

  async downloadBackup() {
    try {
      const token = await this.ensureValidToken();
      await this.ensureBackupFolder();
      const files = await this.listBackupFiles(token);
      if (files.length === 0) {
        this.showError('No backups found');
        return;
      }
      this.showBackupSelector(files);  // 自行實作 UI
    } catch (error) {
      this.showError('List failed: ' + error.message);
    }
  }

  generateFileName() {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const time = `${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}`;
    return `yourapp_backup_${date}_${time}.json`;
  }

  createBackupData() {
    // TODO: 依專案需要序列化資料
    return JSON.stringify({ exportDate: new Date().toISOString(), /* ... */ }, null, 2);
  }

  updateAuthStatus() { /* TODO: 更新 UI */ }
  showBackupSelector(files) { /* TODO: 彈窗選擇要還原的備份 */ }
  showError(msg) { alert(msg); }
}

const googleCloudSync = new GoogleCloudSync();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => googleCloudSync.init());
} else {
  googleCloudSync.init();
}
```

### 4.2 關鍵設計點

**URL Fragment 傳 Token**
Worker callback 把 token 放在 URL 的 `#` 後面而非 `?`,瀏覽器不會把 fragment 傳到伺服器端,也不會記錄在 HTTP 日誌中。

**Token 自動續期**
`ensureValidToken()` 提早 5 分鐘判定過期,並用 `_tokenRefreshPromise` 合併併發的 refresh 請求,避免多次 API call 同時觸發多次 refresh。

**drive.file Scope**
只能存取 App 自己建立的檔案,使用者 Drive 中其他內容完全看不到。這是比 `drive` scope 安全且審查更寬鬆的關鍵。

---

## 五、複製到新專案的 Checklist

1. ☐ 複製整個 `cloudflare-worker/` 目錄,改 `name`(wrangler.toml)與 `FRONTEND_URL`
2. ☐ Google Cloud Console 新建(或沿用)OAuth Client,拿 Client ID / Secret
3. ☐ `wrangler login` → `wrangler secret put GOOGLE_CLIENT_SECRET` → `npm run deploy`
4. ☐ Google Console 把 Worker callback URL 加到 Authorized redirect URIs
5. ☐ 前端複製 `GoogleCloudSync` class(改 `WORKER_URL`、`FOLDER_NAME`、`createBackupData()` 內容)
6. ☐ 在設定頁放 3 個按鈕:連線/斷開、上傳、下載,綁到 `signIn()` / `uploadBackup()` / `downloadBackup()`
7. ☐ `localStorage` key 如 `google_auth_token` 建議換成專案前綴,避免跨站衝突

---

## 六、常見坑

| 問題 | 原因 / 解法 |
|---|---|
| 登入後沒收到 `refresh_token` | 必須同時有 `access_type=offline` **且** `prompt=consent`;已授權過的帳號要先到 [Google 權限頁](https://myaccount.google.com/permissions) 撤銷再重試 |
| `redirect_uri_mismatch` | Google Console 的 redirect URI 必須跟 Worker callback URL **完全一致**(含 https、結尾無斜線) |
| CORS 錯誤 | `wrangler.toml` 的 `FRONTEND_URL` 要含 `https://`;本機測試的 origin 也要加進 `allowedOrigins` |
| Token 被記錄到日誌 | 一律用 URL **fragment (`#`)** 回傳,不用 `?` |
| 同時多處 API 觸發重複 refresh | 用 `_tokenRefreshPromise` 合併併發請求 |
| Drive 搜不到/列不到舊檔 | `drive.file` scope 只看得到 **App 自己建立的檔案**;使用者手動上傳的看不到。這是 feature,不是 bug |
| 測試階段只有特定帳號能登入 | OAuth consent screen 尚未通過驗證時,僅 Test Users 可用;個人備份用途通常不需要送審 |

---

## 七、費用

- **Cloudflare Workers 免費方案**:每日 10 萬次請求、無冷啟動
- **Google Drive API**:對 `drive.file` 無特別配額限制
- **個人備份用途永遠零成本**

---

## 八、API 端點參考

| 端點 | 方法 | 說明 |
|------|------|------|
| `/auth/login` | GET | 重定向到 Google OAuth 登入頁面 |
| `/auth/callback` | GET | Google OAuth 回調處理 |
| `/auth/refresh` | POST | 使用 refresh token 取得新 access token |
| `/auth/revoke` | POST | 撤銷 token |
| `/auth/userinfo` | GET | 取得使用者資訊 |
| `/health` | GET | 健康檢查 |
