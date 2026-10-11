// Discord OAuth2 helpers for the registration gateway
const DISCORD_API = 'https://discord.com/api';

// Build the Discord authorize URL with a state value
function buildAuthorizeUrl(state, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

// Exchange the OAuth2 code for an access token
async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) throw new Error(`Token exchange failed (${response.status})`);
  return response.json();
}

// Fetch the logged-in Discord user
async function fetchUser(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch user (${response.status})`);
  return response.json();
}

// Fetch the guilds the user belongs to
async function fetchUserGuilds(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch guilds (${response.status})`);
  return response.json();
}

module.exports = { buildAuthorizeUrl, exchangeCode, fetchUser, fetchUserGuilds };
