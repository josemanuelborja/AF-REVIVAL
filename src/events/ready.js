// Runs once when the bot comes online
const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,

  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} slash command(s).`);
  },
};
