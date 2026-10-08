// Slash command: /invite - shows Invite Quest embed with buttons
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');
const db = require('../database/database');

const QUEST_GOAL = 3;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Show the AF-REVIVAL Invite Quest and official server invite link.'),

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
    const inviteCount = db.getInviteCount(userId);
    const hasRedeemed = db.hasRedeemed(userId);
    const questCompleted = inviteCount >= QUEST_GOAL || hasRedeemed;

    if (questCompleted && !db.hasQuestCompleted(userId)) {
      db.setQuestCompleted(userId);
    }

    const inviteUrl = process.env.DISCORD_INVITE_URL || '';

    function buildEmbed(count) {
      const completed = count >= QUEST_GOAL || hasRedeemed;
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('AF-REVIVAL INVITE QUEST');

      if (completed) {
        embed
          .setDescription(
            'Invite 3 people to the official AF-REVIVAL Discord server to unlock your game redeem code.',
          )
          .addFields({
            name: 'QUEST COMPLETED',
            value: 'Congratulations!\nYou can now redeem your AF-REVIVAL game code.',
          })
          .addFields({ name: 'Progress', value: `${Math.min(count, QUEST_GOAL)}/${QUEST_GOAL}` });
      } else {
        embed
          .setDescription(
            'Invite 3 people to the official AF-REVIVAL Discord server to unlock your game redeem code.',
          )
          .addFields({ name: 'Progress', value: `${count}/${QUEST_GOAL}` })
          .addFields({ name: 'Next Step', value: 'Invite more players to complete the quest.' });
      }

      if (inviteUrl) {
        embed.addFields({
          name: 'Official Server Invite',
          value: `[Click here to invite others](${inviteUrl})`,
        });
      }

      return embed;
    }

    const canRedeem = (inviteCount >= QUEST_GOAL || questCompleted) && !hasRedeemed;

    const redeemButton = new ButtonBuilder()
      .setCustomId('invite_redeem')
      .setLabel('Redeem')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canRedeem);

    const cancelButton = new ButtonBuilder()
      .setCustomId('invite_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancelButton, redeemButton);

    const reply = await interaction.reply({
      embeds: [buildEmbed(inviteCount)],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000, // 5 minutes
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        await btnInteraction.reply({
          content: 'This interaction is only for the person who used /invite.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (btnInteraction.customId === 'invite_cancel') {
        collector.stop('cancelled');
        await btnInteraction.update({
          content: 'Invite Quest panel closed.',
          embeds: [],
          components: [],
        });
        return;
      }

      if (btnInteraction.customId === 'invite_redeem') {
        // Re-check eligibility
        const currentCount = db.getInviteCount(userId);
        const alreadyRedeemed = db.hasRedeemed(userId);

        if (alreadyRedeemed) {
          await btnInteraction.reply({
            content: 'You have already redeemed your AF-REVIVAL code.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (currentCount < QUEST_GOAL) {
          await btnInteraction.reply({
            content: `You have not completed the Invite Quest yet. Progress: ${currentCount}/${QUEST_GOAL}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Claim a code
        const code = db.claimNextCode(userId);
        if (!code) {
          await btnInteraction.reply({
            content: 'No unused redeem codes are available at this time. Please contact an administrator.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const redeemedEmbed = new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle('AF-REVIVAL Redeem Code')
          .setDescription('Congratulations!\nYou completed the Invite Quest.')
          .addFields({ name: 'Your one-time redeem code', value: `\`\`\`${code}\`\`\`` });

        await btnInteraction.reply({
          embeds: [redeemedEmbed],
          flags: MessageFlags.Ephemeral,
        });

        // Update original embed to show redeemed state
        const finalEmbed = buildEmbed(Math.max(currentCount, QUEST_GOAL));
        const finalRow = new ActionRowBuilder().addComponents(
          cancelButton.setDisabled(false),
          redeemButton.setDisabled(true),
        );
        await interaction.editReply({ embeds: [finalEmbed], components: [finalRow] }).catch(() => {});
        collector.stop('redeemed');
        return;
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' || reason === 'cancelled' || reason === 'redeemed') {
        // Already handled
      } else {
        await interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  },
};
