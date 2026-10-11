// Registration gateway: Discord OAuth2 + whitelist check in front of the game backend
require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const Whitelist = require('../models/Whitelist');
const {
  buildAuthorizeUrl,
  exchangeCode,
  fetchUser,
  fetchUserGuilds,
} = require('./auth');
const { proxyToBackend } = require('./proxy');
const { landingPage, accessDeniedPage, backendErrorPage } = require('./views');

// Public URL of this gateway, without a trailing slash
function siteUrl() {
  return (process.env.SITE_URL || '').replace(/\/+$/, '');
}

// The URL Discord sends the user back to after login
function redirectUri() {
  return `${siteUrl()}/auth/discord/callback`;
}

// Start the gateway website (skipped with a warning if it is not configured)
function startWebsite() {
  const required = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'SESSION_SECRET',
    'SITE_URL',
    'REGISTRATION_BACKEND_URL',
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.warn(
      `Registration website disabled (missing: ${missing.join(', ')}). The bot will still run.`,
    );
    return null;
  }

  const app = express();
  app.disable('x-powered-by');

  // Server-side session cookie (secret stays on the backend)
  app.use(
    session({
      name: 'af.sid',
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: siteUrl().startsWith('https://'),
        maxAge: 1000 * 60 * 60 * 12,
      },
    }),
  );

  // Step 1: send the user to Discord to log in
  app.get('/auth/discord', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    req.session.save(() => res.redirect(buildAuthorizeUrl(state, redirectUri())));
  });

  // Step 2: Discord sends the user back here
  app.get('/auth/discord/callback', async (req, res) => {
    const { code, state } = req.query;
    const expectedState = req.session.oauthState;
    req.session.oauthState = null;

    // Validate the OAuth2 state to stop login request forgery
    if (!code || !state || !expectedState || state !== expectedState) {
      return res
        .status(400)
        .send(accessDeniedPage('Invalid or expired login request. Please try again.'));
    }

    try {
      const token = await exchangeCode(code, redirectUri());
      const user = await fetchUser(token.access_token);
      const guilds = await fetchUserGuilds(token.access_token);

      // The user must be a member of the official server
      const inGuild = guilds.some((guild) => guild.id === process.env.DISCORD_GUILD_ID);
      if (!inGuild) {
        return res
          .status(403)
          .send(accessDeniedPage('You must join the official AF-REVIVAL Discord server first.'));
      }

      // The user must exist in the whitelist database
      const whitelisted = await Whitelist.findOne({ discordUserId: user.id });
      if (!whitelisted) {
        return res
          .status(403)
          .send(accessDeniedPage('You are not whitelisted yet. Please complete the whitelist process in Discord first.'));
      }

      // Regenerate the session so a fixed session ID cannot be reused
      req.session.regenerate((error) => {
        if (error) {
          console.error('Session error:', error.message);
          return res.status(500).send(accessDeniedPage('Login failed. Please try again later.'));
        }
        req.session.authorized = true;
        req.session.userId = user.id;
        req.session.username = user.username;
        const backend = (process.env.REGISTRATION_BACKEND_URL || '').replace(/\/+$/, '');
        res.redirect(backend || '/register');
      });
    } catch (error) {
      console.error('Discord login failed:', error.message);
      res.status(500).send(accessDeniedPage('Login failed. Please try again later.'));
    }
  });

  // Log out and clear the session
  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('af.sid');
      res.redirect('/');
    });
  });

  // Landing page for visitors who are not logged in yet
  app.get('/', (req, res) => {
    if (req.session.authorized) {
      const backend = (process.env.REGISTRATION_BACKEND_URL || '').replace(/\/+$/, '');
      return res.redirect(backend || '/');
    }
    res.send(landingPage());
  });

  // Every other request must come from an authorized session
  app.use(async (req, res, next) => {
    // Not logged in: never reach the registration page
    if (!req.session.authorized) {
      if (req.method !== 'GET') {
        return res.status(401).json({ error: 'Not authorized. Please log in first.' });
      }
      return res.redirect('/');
    }

    try {
      // Re-check the whitelist database on every request so removed
      // members are blocked immediately, even with an active session
      const record = await Whitelist.findOne({ discordUserId: req.session.userId });
      if (record) return next();
    } catch (error) {
      console.error('Whitelist re-check failed:', error.message);
      return res.status(503).send(backendErrorPage());
    }

    return req.session.destroy(() =>
      res
        .status(403)
        .send(accessDeniedPage('Your registration access is no longer active. Please complete the whitelist process again.')),
    );
  });

  // No proxy - authorized users are redirected to the backend on port 8080
  // Keep a catch-all to avoid leaking unhandled paths; show access denied page
  app.use((req, res) => {
    res.status(403).send(accessDeniedPage('Not authorized'));
  });

  const port = Number(process.env.WEB_PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`Registration website running at ${siteUrl()} (port ${port})`);
  });
  server.on('error', (error) => {
    console.error('Registration website failed to start:', error.message);
  });

  return server;
}

module.exports = { startWebsite };
