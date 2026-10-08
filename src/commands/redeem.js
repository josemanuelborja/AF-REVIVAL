// Slash command: /redeem (fallback/info)
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../database/database');

const QUEST_GOAL = 3;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem your AF-REVIVAL game reward after completing the invite quest.'),

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

    if (db.hasRedeemed(userId)) {
      const code = db.getRedeemedCode(userId);
      const embed = new EmbedBuilder()
        .setColor(0xff5555)
        .setTitle('AF-REVIVAL Redeem')
        .setDescription('You have already redeemed your AF-REVIVAL reward.');
      if (code) embed.addFields({ name: 'Code', value: `\`\`\`${code}\`\`\`` });
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const count = db.getInviteCount(userId);
    if (count < QUEST_GOAL) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('AF-REVIVAL Invite Quest')
        .setDescription('You have not completed the Invite Quest yet.')
        .addFields({ name: 'Progress', value: `${count}/${QUEST_GOAL}` })
        .addFields({ name: 'Next Step', value: 'Invite more people to unlock your reward.' });
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const code = db.claimNextCode(userId);
    if (!code) {
      await interaction.reply({
        content: 'No unused redeem codes are available at this time. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle('AF-REVIVAL Redeem Code')
      .setDescription('Congratulations!\nYou completed the Invite Quest.')
      .addFields({ name: 'Your one-time redeem code', value: `\`\`\`${code}\`\`\`` });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
