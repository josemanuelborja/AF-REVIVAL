// Track invites when a member joins
const { Events } = require('discord.js');
const { fetchInvites } = require('../utils/invites');
const User = require('../models/User');
const Invite = require('../models/Invite');

const QUEST_GOAL = 3;
const guildInvites = new Map();

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const guild = member.guild;
    if (!guild) return;

    let inviter = null;
    let inviteCode = null;

    try {
      const newInvites = await fetchInvites(guild);
      const oldInvites = guildInvites.get(guild.id);

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
            inviter = invite.inviter;
            inviteCode = code;
            break;
          }
        }
      }
      guildInvites.set(guild.id, newInvites);
    } catch (error) {
      console.error('Error tracking invites on join:', error.message);
      try {
        guildInvites.set(guild.id, await fetchInvites(guild));
      } catch (e) {
        console.error('Failed to refresh invite cache:', e.message);
      }
    }

    if (inviter && inviter.id !== member.id) {
      const invitedUserId = member.id;
      const inviterId = inviter.id;

      const existing = await Invite.findOne({ invitedUserId });
      if (!existing) {
        try {
          await Invite.create({ inviterId, invitedUserId, inviteCode: inviteCode || null });
        } catch (error) {
          // Duplicate or other error - skip
          return;
        }

        let inviterUser = await User.findOne({ discordUserId: inviterId });
        if (!inviterUser) {
          inviterUser = await User.create({ discordUserId: inviterId, inviteCount: 0 });
        }
        inviterUser.inviteCount = (inviterUser.inviteCount || 0) + 1;
        if (inviterUser.inviteCount >= QUEST_GOAL) {
          inviterUser.questCompleted = true;
        }
        await inviterUser.save();
        console.log(`Invite recorded: ${inviterId} invited ${invitedUserId}, count=${inviterUser.inviteCount}`);
      }
    } else {
      try {
        guildInvites.set(guild.id, await fetchInvites(guild));
      } catch (error) {
        console.error('Failed to refresh invite cache:', error.message);
      }
    }
  },
};
