// Slash command: /invites - show user's invite progress
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/database');

const QUEST_GOAL = 3;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Show your current AF-REVIVAL Invite Quest progress.'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userId = interaction.user.id;
    db.ensureUser(userId);
    const count = db.getInviteCount(userId);
    const completed = count >= QUEST_GOAL || db.hasRedeemed(userId);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Your AF-REVIVAL Invite Quest')
      .addFields({ name: 'Valid Invites', value: `${count}/${QUEST_GOAL}` });

    if (completed) {
      embed.setDescription('Quest completed!\nYou are now eligible to redeem your AF-REVIVAL reward.');
    } else {
      embed.setDescription(`Invite ${QUEST_GOAL - count} more person(s) to unlock your game reward.`);
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
