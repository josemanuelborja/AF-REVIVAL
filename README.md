# AF-REVIVAL Discord Bot

Discord bot for the AF-REVIVAL project using Discord.js, MongoDB, Mongoose, and dotenv. All commands are Discord slash commands.

## Features

- `/announcement` - Send announcements (admin/staff only)
- `/update` - Send updates with text/images/files/videos (admin/staff only)
- `/invite` - Invite quest (3 valid invites unlock redeem button). Redeem gives one-time code from game backend via ephemeral response.

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
| `DISCORD_INVITE_URL` | Official invite URL (default provided) |
| `ANNOUNCEMENT_CHANNEL_ID` | Channel for announcements |
| `UPDATE_CHANNEL_ID` | Channel for updates |
| `ADMIN_ROLE_IDS` | Comma-separated role IDs for admins/staff |
| `GAME_API_BASE_URL` | AF-REVIVAL game backend base URL |
| `GAME_API_KEY` | API key for game backend |

## Register Slash Commands

```bash
npm run deploy
```

## Run the Bot

```bash
npm start
```

Development (watch mode):

```bash
npm run dev
```

## How It Works

- **Invite tracking**: Uses Discord invites to detect who invited each new member. Prevents duplicate counting. Progress stored in MongoDB.
- **Quest**: 3 valid invites unlock Redeem button on `/invite` embed.
- **Redemption**: Clicking Redeem calls `GAME_API_BASE_URL/api/redeem/claim` (configurable to match actual AF-REVIVAL backend). The real one-time code is returned by the game backend and shown only to the user via ephemeral response. Redeem is one-time only.
- **Permissions**: Admin/staff checked via `ADMIN_ROLE_IDS` (not just Administrator perm).

## Security

- No secrets committed. `.env` is ignored.
- Redeem codes never logged publicly.
- Ephemeral responses used for sensitive info.
- No fake code generation; game backend is source of truth.
- No `/addtoken` command.

## Branch

Changes made on `feature/af-revival-changes-updates` branch. Do not push automatically.
