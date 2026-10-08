// Game API integration utility (bridge to AF-REVIVAL game backend)
// The exact endpoint/request format should match the actual AF-REVIVAL backend API.
// This is a configurable placeholder to avoid hardcoded fake data.
const https = require('node:https');
const http = require('node:http');

function buildUrl(path) {
  const base = process.env.GAME_API_BASE_URL;
  if (!base) return null;
  if (base.endsWith('/') && path.startsWith('/')) return base.slice(0, -1) + path;
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        timeout: options.timeout || 8000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsedBody = null;
          try {
            parsedBody = data ? JSON.parse(data) : null;
          } catch (e) {
            parsedBody = { raw: data };
          }
          resolve({ status: res.statusCode, body: parsedBody });
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });
      if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Attempt to claim/redeem one available game token from backend
// Expected: returns { success: boolean, token?: string, tokenId?: string, message?: string }
async function claimGameToken(discordUserId) {
  const base = process.env.GAME_API_BASE_URL;
  const apiKey = process.env.GAME_API_KEY;
  if (!base) {
    return { success: false, error: 'GAME_API_BASE_URL not configured' };
  }

  const url = buildUrl('/api/redeem/claim');
  if (!url) return { success: false, error: 'Invalid API base URL' };

  try {
    const res = await request(url, {
      method: 'POST',
      headers: {
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        'X-Discord-User-Id': discordUserId,
      },
      body: { discordUserId },
    });

    const body = res.body || {};
    if (res.status === 200 && body.success === true) {
      const token = body.token || body.code || body.gameCode || body.redeemCode || null;
      const tokenId = body.tokenId || body.id || body.codeId || token;
      if (token) {
        return { success: true, token, tokenId: tokenId || token };
      }
      return { success: false, error: body.message || 'No token in response' };
    }

    return {
      success: false,
      error: body?.message || `API returned status ${res.status}`,
    };
  } catch (error) {
    console.error('Game API request failed:', error.message);
    return { success: false, error: 'Game API request failed' };
  }
}

module.exports = {
  claimGameToken,
  buildUrl,
};
