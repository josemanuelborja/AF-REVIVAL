# AF-REVIVAL Discord Bot

Discord bot for the AF-REVIVAL project using Discord.js, MongoDB, Mongoose, and dotenv. All commands are Discord slash commands.

## Features

- `/announcement` - Send announcements (admin/staff only)
- `/update` - Send updates with text/images/files/videos (admin/staff only)
- `/whitelist` - Create the whitelist panel (admin/staff only). Members click the Whitelist button to be approved and receive the installation link through DM.

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

This registers `/announcement`, `/update`, and `/whitelist` on the server in `DISCORD_GUILD_ID`. Run it again after changing any command.

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

## Admin/Staff Authorization

Administrative commands (`/announcement`, `/update`, `/whitelist`) require a role listed in `ADMIN_ROLE_IDS` (comma-separated role IDs). Ordinary Discord members cannot use them. This does not rely on the Discord Administrator permission.

## Game API Integration

`src/utils/gameApi.js` is a configurable placeholder for talking to the AF-REVIVAL game backend. The endpoint, authentication, and response format must be adapted to the real backend API. No fake codes are generated - the game backend remains the source of truth for redeem codes. The whitelist flow does not call the game API.

## Security

- No secrets committed. `.env` is ignored.
- The installation link is only delivered by DM after whitelist approval.
- Ephemeral responses used for sensitive info.
- No `/addtoken` command. No fake code generation.

## Branch

Changes made on `feature/af-revival-whitelist` branch. Do not push automatically.
