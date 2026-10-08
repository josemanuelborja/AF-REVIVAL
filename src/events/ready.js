// Runs once when the bot comes online
const { Events } = require('discord.js');
const { fetchInvites } = require('../utils/invites');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} slash command(s).`);

    // Cache invites for all guilds
    try {
      const guilds = await client.guilds.fetch();
      for (const [, guild] of guilds) {
        try {
          const fullGuild = await guild.fetch();
          const invites = await fetchInvites(fullGuild);
          if (!client.guildInvites) client.guildInvites = new Map();
          client.guildInvites.set(guild.id, invites);
        } catch (error) {
          console.error(`Failed to cache invites for guild ${guild.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to cache invites:', error.message);
    }
  },
};
