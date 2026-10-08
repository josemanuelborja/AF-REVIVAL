// Invite tracking helpers
const { Collection } = require('discord.js');
const db = require('../database/database');

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

function getInviteCount(userId) {
  return db.getInviteCount(userId);
}

module.exports = {
  fetchInvites,
  getInviteCount,
};
