// Track invites when a member joins
const { Events } = require('discord.js');
const db = require('../database/database');
const { fetchInvites } = require('../utils/invites');

const QUEST_GOAL = 3;

// Cache last invites per guild
const guildInvites = new Map();

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const guild = member.guild;
    if (!guild) return;

    // Store inviter info
    let inviter = null;
    let inviteCode = null;

    try {
      // Get current invites
      const newInvites = await fetchInvites(guild);
      const oldInvites = guildInvites.get(guild.id);

      // Find which invite increased
      if (oldInvites) {
        for (const [code, invite] of newInvites) {
          const oldInvite = oldInvites.get(code);
          if (oldInvite) {
            if (invite.uses > oldInvite.uses) {
              inviter = invite.inviter;
              inviteCode = code;
              break;
            }
          } else if (invite.uses > 0) {
            // New invite
            inviter = invite.inviter;
            inviteCode = code;
            break;
          }
        }
      }

      // Update cache
      guildInvites.set(guild.id, newInvites);
    } catch (error) {
      console.error('Error tracking invites on join:', error.message);
      try {
        guildInvites.set(guild.id, await fetchInvites(guild));
      } catch (e) {
        console.error('Failed to refresh invite cache:', e.message);
      }
    }

    // If we found who invited, record it
    if (inviter && inviter.id !== member.id) {
      const invitedUserId = member.id;
      const inviterId = inviter.id;

      // Prevent duplicate counting of the same member
      if (!db.hasBeenInvited(invitedUserId)) {
        const recorded = db.recordInvite(inviterId, invitedUserId, inviteCode);
        if (recorded) {
          const oldCount = db.getInviteCount(inviterId);
          db.incrementInviteCount(inviterId);
          const newCount = db.getInviteCount(inviterId);

          // Mark quest as completed if reached goal
          if (newCount >= QUEST_GOAL) {
            db.setQuestCompleted(inviterId);
          }

          console.log(`Invite recorded: ${inviter.tag} (${inviterId}) invited ${member.user.tag} (${invitedUserId}). Count: ${oldCount} -> ${newCount}`);
        }
      }
    } else {
      // If we can't determine inviter, still refresh cache
      try {
        guildInvites.set(guild.id, await fetchInvites(guild));
      } catch (error) {
        console.error('Failed to refresh invite cache:', error.message);
      }
    }
  },
};
