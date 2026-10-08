// Invite helpers
const { Collection } = require('discord.js');

async function fetchInvites(guild) {
  if (!guild) return new Collection();
  try {
    const invites = await guild.invites.fetch();
    return invites;
  } catch (error) {
    console.error('Failed to fetch invites:', error.message);
    return new Collection();
  }
}

module.exports = { fetchInvites };
