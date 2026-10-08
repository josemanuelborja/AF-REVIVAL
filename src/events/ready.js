// Runs once when the bot comes online
const { Events } = require('discord.js');
const { fetchInvites } = require('../utils/invites');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} command(s).`);

    // Cache invites for all guilds
    try {
      const guilds = await client.guilds.fetch();
      for (const [guildId, guild] of guilds) {
        try {
          const fullGuild = await guild.fetch();
          const invites = await fetchInvites(fullGuild);
          // Store in a simple cache on the client for access
          if (!client.guildInvites) client.guildInvites = new Map();
          client.guildInvites.set(guildId, invites);
        } catch (error) {
          console.error(`Failed to cache invites for guild ${guildId}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to cache invites:', error.message);
    }
  },
};
