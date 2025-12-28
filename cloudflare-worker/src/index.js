/**
 * Chronicler OAuth Worker
 * 處理 Google OAuth 2.0 授權碼流程，支援 Refresh Token
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

/**
 * 處理 CORS
 */
function corsHeaders(env, origin) {
    const allowedOrigins = [
        env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ];

    const isAllowed = allowedOrigins.some(allowed => origin?.startsWith(allowed));

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * 處理 OPTIONS 預檢請求
 */
function handleOptions(env, origin) {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(env, origin)
    });
}

/**
 * JSON 回應輔助函數
 */
function jsonResponse(data, status, env, origin) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env, origin)
        }
    });
}

/**
 * 產生隨機 state 用於 CSRF 防護
 */
function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 主要路由處理
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin');

        // 處理 CORS 預檢
        if (request.method === 'OPTIONS') {
            return handleOptions(env, origin);
        }

        try {
            switch (url.pathname) {
                case '/auth/login':
                    return handleLogin(env, url);

                case '/auth/callback':
                    return handleCallback(request, env);

                case '/auth/refresh':
                    return handleRefresh(request, env, origin);

                case '/auth/revoke':
                    return handleRevoke(request, env, origin);

                case '/auth/userinfo':
                    return handleUserInfo(request, env, origin);

                case '/health':
                    return jsonResponse({ status: 'ok', timestamp: Date.now() }, 200, env, origin);

                default:
                    return jsonResponse({ error: 'Not Found' }, 404, env, origin);
            }
        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({
                error: 'Internal Server Error',
                message: error.message
            }, 500, env, origin);
        }
    }
};

/**
 * 處理登入請求 - 重定向到 Google OAuth
 */
function handleLogin(env, url) {
    const state = generateState();
    const redirectUri = `${url.origin}/auth/callback`;

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('access_type', 'offline');  // 重要：取得 refresh token
    authUrl.searchParams.set('prompt', 'consent');        // 強制顯示同意畫面以獲取 refresh token
    authUrl.searchParams.set('state', state);

    // 可選：從 query string 取得前端 URL
    const frontendUrl = url.searchParams.get('redirect') || env.FRONTEND_URL;
    authUrl.searchParams.set('state', `${state}|${frontendUrl}`);

    return Response.redirect(authUrl.toString(), 302);
}

/**
 * 處理 Google OAuth 回調
 */
async function handleCallback(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // 從 state 解析前端 URL
    let frontendUrl = env.FRONTEND_URL;
    if (state && state.includes('|')) {
        frontendUrl = state.split('|')[1];
    }

    // 處理錯誤
    if (error) {
        const errorUrl = new URL(frontendUrl);
        errorUrl.searchParams.set('auth_error', error);
        return Response.redirect(errorUrl.toString(), 302);
    }

    if (!code) {
        const errorUrl = new URL(frontendUrl);
        errorUrl.searchParams.set('auth_error', 'missing_code');
        return Response.redirect(errorUrl.toString(), 302);
    }

    try {
        // 交換授權碼取得 tokens
        const redirectUri = `${url.origin}/auth/callback`;
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            const errorUrl = new URL(frontendUrl);
            errorUrl.searchParams.set('auth_error', tokens.error);
            return Response.redirect(errorUrl.toString(), 302);
        }

        // 取得使用者資訊
        const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        const userInfo = await userInfoResponse.json();

        // 準備回傳資料（URL 編碼）
        const authData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            user: {
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            }
        };

        // 使用 fragment (#) 傳遞 token，避免伺服器日誌記錄
        const successUrl = new URL(frontendUrl);
        successUrl.hash = `auth_success=${encodeURIComponent(JSON.stringify(authData))}`;

        return Response.redirect(successUrl.toString(), 302);

    } catch (err) {
        console.error('Callback error:', err);
        const errorUrl = new URL(frontendUrl);
        errorUrl.searchParams.set('auth_error', 'token_exchange_failed');
        return Response.redirect(errorUrl.toString(), 302);
    }
}

/**
 * 處理 Token 續期
 */
async function handleRefresh(request, env, origin) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405, env, origin);
    }

    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return jsonResponse({ error: 'Missing refresh_token' }, 400, env, origin);
        }

        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                refresh_token,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                grant_type: 'refresh_token'
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            return jsonResponse({
                error: tokens.error,
                error_description: tokens.error_description
            }, 401, env, origin);
        }

        return jsonResponse({
            access_token: tokens.access_token,
            expires_in: tokens.expires_in,
            // Google 通常不會在 refresh 時返回新的 refresh_token
            // 但如果有，也一併返回
            refresh_token: tokens.refresh_token || null
        }, 200, env, origin);

    } catch (err) {
        console.error('Refresh error:', err);
        return jsonResponse({ error: 'Refresh failed', message: err.message }, 500, env, origin);
    }
}

/**
 * 處理 Token 撤銷
 */
async function handleRevoke(request, env, origin) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405, env, origin);
    }

    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return jsonResponse({ error: 'Missing token' }, 400, env, origin);
        }

        const revokeResponse = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (revokeResponse.ok) {
            return jsonResponse({ success: true }, 200, env, origin);
        } else {
            const error = await revokeResponse.text();
            return jsonResponse({ error: 'Revoke failed', details: error }, 400, env, origin);
        }

    } catch (err) {
        console.error('Revoke error:', err);
        return jsonResponse({ error: 'Revoke failed', message: err.message }, 500, env, origin);
    }
}

/**
 * 取得使用者資訊
 */
async function handleUserInfo(request, env, origin) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401, env, origin);
    }

    const accessToken = authHeader.substring(7);

    try {
        const response = await fetch(GOOGLE_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return jsonResponse({ error: 'Failed to fetch user info' }, response.status, env, origin);
        }

        const userInfo = await response.json();

        return jsonResponse({
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        }, 200, env, origin);

    } catch (err) {
        console.error('UserInfo error:', err);
        return jsonResponse({ error: 'Failed to fetch user info', message: err.message }, 500, env, origin);
    }
}
