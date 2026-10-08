# AF-REVIVAL Discord Bot

A clean, simple Discord bot for the AF-REVIVAL project.

Built with Node.js and [discord.js](https://discord.js.org/). Configuration lives in a `.env` file that is never committed to Git.

## Development Status

The bot is built in stages. Each stage is tested before the next one starts.

- [x] Phase 1 — `/announcement`
- [ ] Phase 2 — `!update`
- [ ] Phase 3 — `/invite`
- [ ] Phase 4 — Invite tracking (`/invites`)
- [ ] Phase 5 — Invite quest (3 valid invites)
- [ ] Phase 6 — `/redeem`
- [ ] Phase 7 — Final testing

## Requirements

- Node.js 18 or newer
- npm
- A Discord application with a bot (from the [Discord Developer Portal](https://discord.com/developers/applications))

## Installation

```bash
git clone https://github.com/josemanuelborja/AF-REVIVAL.git
cd AF-REVIVAL
npm install
```

## Configuration

Create your local `.env` file from the template:

- **Windows:** `copy .env.example .env`
- **macOS / Linux:** `cp .env.example .env`

Then open `.env` and fill in the values:

| Variable | Where to find it |
| --- | --- |
| `DISCORD_TOKEN` | Developer Portal → your app → **Bot** → **Reset Token / Copy Token** |
| `DISCORD_CLIENT_ID` | Developer Portal → your app → **General Information** → **Application ID** |
| `DISCORD_GUILD_ID` | Discord → your server → right-click the server icon → **Copy Server ID** (enable Developer Mode first in Settings → Advanced) |
| `DISCORD_INVITE_URL` | Your official server invite link (Server Settings → Invites) |
| `ANNOUNCEMENT_CHANNEL_ID` | Right-click the announcement channel → **Copy Channel ID** |
| `UPDATE_CHANNEL_ID` | Right-click the updates channel → **Copy Channel ID** |

> Never share your `.env` file or your bot token. The `.env` file is ignored by Git.

## Registering Slash Commands

Register the commands on your development server (run this once, and again after adding new commands):

```bash
npm run deploy
```

This registers the commands for the server in `DISCORD_GUILD_ID` only. Running it again replaces the same list, so commands are never duplicated.

## Running the Bot

```bash
npm start
```

Or during development (auto-restarts on file changes):

```bash
npm run dev
```

You should see:

```
Logged in as YourBotName#1234
Loaded 1 slash command(s).
```

## Testing /announcement

| Test | Action | Expected result |
| --- | --- | --- |
| 1 — Authorized user | Use `/announcement title:"Server Maintenance" message:"The server will be offline for maintenance at 10 PM."` as an admin | Embed appears in the announcement channel, and you get: `Announcement successfully sent to #channel.` |
| 2 — Unauthorized user | Use `/announcement` as a regular member | `You do not have permission to use this command.` |
| 3 — Missing information | Discord requires `title` and `message`, so the form cannot be sent empty. The bot also double-checks | `Please provide the required announcement information.` |
| 4 — Restart | Stop the bot (`Ctrl + C`) and run `npm start` again | Bot comes online and `/announcement` still works |

Optional options: `footer` (small text at the bottom of the embed) and `attachment` (an image or file).

## Project Structure

```
AF-REVIVAL/
│
├── src/
│   ├── commands/
│   │   └── announcement.js      # /announcement slash command
│   │
│   ├── events/
│   │   └── ready.js             # Runs when the bot is online
│   │
│   ├── deploy-commands.js       # Registers slash commands on the server
│   └── index.js                 # Bot entry point
│
├── .env.example                 # Template for environment variables
├── .gitignore                   # Keeps secrets and local files out of Git
├── package.json
└── README.md
```

## Security Notes

- `.env`, `.env.*` (except `.env.example`) and `node_modules/` are gitignored.
- No token, server ID, channel ID or other secret is hardcoded in the code.
- Errors are logged on the server console only; Discord users only ever see simple, friendly messages.
