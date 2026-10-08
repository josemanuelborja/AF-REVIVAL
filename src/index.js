// Load environment variables
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, MessageFlags } = require('discord.js');

// Make sure the required environment variables exist before starting
const requiredVariables = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.error(`Missing environment variables: ${missingVariables.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Create the Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Load all slash commands from src/commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.js')) continue;
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Load all events from src/events
const eventsPath = path.join(__dirname, 'events');

for (const file of fs.readdirSync(eventsPath)) {
  if (!file.endsWith('.js')) continue;
  const event = require(path.join(eventsPath, file));

  const listener = (...args) => event.execute(...args);
  if (event.once) client.once(event.name, listener);
  else client.on(event.name, listener);
}

// Run the matching command when a slash command is used
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    // Log the real error locally, never show it to Discord users
    console.error(`Error running /${interaction.commandName}:`, error.message);

    const reply = {
      content: 'Something went wrong while running this command.',
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
