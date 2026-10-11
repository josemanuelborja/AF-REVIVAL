# AF-REVIVAL Discord Bot

Discord bot for the AF-REVIVAL project using Discord.js, MongoDB, Mongoose, and dotenv. All commands are Discord slash commands.

## Features

- `/announcement` - Send announcements (admin/staff only)
- `/update` - Send updates with text/images/files/videos (admin/staff only)
- `/whitelist` - Create the whitelist panel (admin/staff only). Members click the Whitelist button to be approved and receive the installation link through DM.
- `/reg` - Post the registration panel with a **Register Now** button (admin/staff only). The button opens the whitelist-protected registration website.

## Tech Stack

- Node.js + JavaScript
- Discord.js v14
- MongoDB + Mongoose
- dotenv

## Installation

```bash
git clone https://github.com/josemanuelborja/AF-REVIVAL.git
cd AF-REVIVAL
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | Development server ID |
| `MONGODB_URI` | MongoDB connection string |
| `ANNOUNCEMENT_CHANNEL_ID` | Channel for announcements |
| `UPDATE_CHANNEL_ID` | Channel for updates |
| `ADMIN_ROLE_IDS` | Comma-separated role IDs for admins/staff |
| `AF_REVIVAL_INSTALL_URL` | AF-REVIVAL installation link sent by DM |
| `GAME_API_BASE_URL` | AF-REVIVAL game backend base URL (optional) |
| `GAME_API_KEY` | API key for game backend (optional) |
| `FOOTER_CODE` | Footer code shown in the whitelist DM |
| `SITE_URL` | Public URL of the registration gateway (no trailing slash) |
| `WEB_PORT` | Port the registration gateway listens on (default `3000`) |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret (Discord Developer Portal, keep secret) |
| `SESSION_SECRET` | Random secret used to sign website session cookies |
| `REGISTRATION_BACKEND_URL` | The game registration backend the gateway forwards to |
| `REG_EMBED_TITLE` / `REG_EMBED_DESCRIPTION` / `REG_EMBED_IMAGE_URL` / `REG_EMBED_EXTRA_TEXT` | Content of the `/reg` embed (change anytime) |
| `REG_PAGE_TITLE` / `REG_PAGE_IMAGE_URL` / `REG_PAGE_INSTRUCTIONS` / `REG_PAGE_EXTRA_TEXT` | Branding/instructions shown above the registration form |

## MongoDB Setup

1. Create a MongoDB database (local or MongoDB Atlas).
2. Put the connection string in `MONGODB_URI`.
3. The bot creates its collections automatically on first use (`users`, `redemptions`, `whitelists`).

## Discord Bot Setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a bot and copy the token into `DISCORD_TOKEN`.
3. Copy the Application ID into `DISCORD_CLIENT_ID`.
4. Invite the bot to your server with the `bot` and `applications.commands` scopes.
5. Copy your server ID into `DISCORD_GUILD_ID` (enable Developer Mode in Discord settings).

## Register Slash Commands

```bash
npm run deploy
```

This registers `/announcement`, `/update`, `/whitelist`, and `/reg` on the server in `DISCORD_GUILD_ID`. Run it again after changing any command.

## Run the Bot

```bash
npm start
```

Development (watch mode):

```bash
npm run dev
```

## How the Whitelist System Works

1. An admin/staff member runs `/whitelist`.
2. The bot posts a whitelist panel embed with a **Whitelist** button.
3. A member clicks the button.
4. The bot checks MongoDB:
   - Not whitelisted yet: creates a whitelist record (`discordUserId`, `discordUsername`, `whitelistedAt`), replies with an ephemeral confirmation, and sends the installation link by DM.
   - Already whitelisted: shows "You are already whitelisted" and does not create a duplicate record.
5. If the member has DMs disabled, the whitelist record is kept and an ephemeral message asks them to enable DMs.

The installation link is **never posted publicly** - it is only sent through DM after approval.

If `SITE_URL` is set, the whitelist DM also includes the private registration link.

## Registration Website (`/reg`) and Whitelist Protection

`/reg` posts a registration panel with a **Register Now** button. That button opens the registration **gateway website** (`src/website`), which is protected by Discord OAuth2 and the MongoDB whitelist.

### How it works

1. An admin/staff member runs `/reg` and the bot posts the registration panel.
2. A member clicks **Register Now** and opens the gateway website.
3. The gateway sends them to Discord to log in (OAuth2, scopes `identify` + `guilds`).
4. Discord redirects back to the gateway, which verifies:
   - the OAuth2 `state` matches (protects against login request forgery),
   - the user is a member of `DISCORD_GUILD_ID`,
   - the user has a whitelist record in MongoDB.
5. Only then does the gateway show the registration page and forward requests to `REGISTRATION_BACKEND_URL`.
6. The whitelist record is re-checked on **every** request, so a member who is removed from the whitelist loses access immediately.
7. Anyone else sees an **Access Denied** page explaining they must join the official Discord server and complete the whitelist process.

The browser only ever talks to the gateway. Secrets (`DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `MONGODB_URI`) stay on the backend and are never sent to the page.

### Discord OAuth2 setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), open your application → **OAuth2**.
2. Add a redirect URL: `{SITE_URL}/auth/discord/callback` (for example `http://100.88.149.123:3000/auth/discord/callback`).
3. Copy the **Client Secret** into `DISCORD_CLIENT_SECRET`.
4. Set `SITE_URL` to the address members will actually use (must match the redirect URL host).

The registration website starts together with the bot (`npm start`). It only starts when `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `SITE_URL`, and `REGISTRATION_BACKEND_URL` are set; otherwise the bot logs a warning and keeps running.

### Important: Block direct access to Port 8080

To prevent bypass, the actual registration app on Port 8080 must NOT be publicly exposed. The gateway on Port 3000 (SITE_URL) is public-facing and reverse-proxies to 8080 only after successful Discord OAuth + guild + whitelist verification. If 8080 is currently reachable from the internet, firewall it (allow only the gateway host to reach it) or bind it to localhost. With this setup, all users access via `http://100.88.149.123:3000` (they stay on 3000 URLs). The denied page shows the exact message and your image.

### Changing the text and images

All registration content is configured in `.env` and can be changed without touching code: `REG_EMBED_*` (Discord panel) and `REG_PAGE_*` (website banner). Leave a value empty to hide it.

## Admin/Staff Authorization

Administrative commands (`/announcement`, `/update`, `/whitelist`, `/reg`) require a role listed in `ADMIN_ROLE_IDS` (comma-separated role IDs). Ordinary Discord members cannot use them. This does not rely on the Discord Administrator permission.

## Game API Integration

`src/utils/gameApi.js` is a configurable placeholder for talking to the AF-REVIVAL game backend. The endpoint, authentication, and response format must be adapted to the real backend API. No fake codes are generated - the game backend remains the source of truth for redeem codes. The whitelist flow does not call the game API.

## Security

- No secrets committed. `.env` is ignored.
- The installation link is only delivered by DM after whitelist approval.
- Ephemeral responses used for sensitive info.
- No `/addtoken` command. No fake code generation.
- The registration gateway verifies every visitor with Discord OAuth2 + guild membership + MongoDB whitelist; the browser never receives secrets and cannot grant itself access.
- OAuth2 `state` is validated and the session is regenerated after login.
- The gateway never forwards its own session cookie to the game backend.

## Branch

Changes made on `feature/af-revival-registration-guard` branch. Do not push automatically.
