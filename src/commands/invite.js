// Slash command: /invite - shows Invite Quest with buttons
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');
const User = require('../models/User');
const Redemption = require('../models/Redemption');
const { claimGameToken } = require('../utils/gameApi');

const QUEST_GOAL = 3;
const INVITE_URL = process.env.DISCORD_INVITE_URL || 'https://discord.gg/RZ8C8wnmU';

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
    let user = await User.findOne({ discordUserId: userId });
    if (!user) {
      user = await User.create({ discordUserId: userId, inviteCount: 0, questCompleted: false });
    }

    const inviteCount = user.inviteCount || 0;
    const hasRedeemed = Boolean(user.hasRedeemed);
    if (inviteCount >= QUEST_GOAL && !user.questCompleted) {
      user.questCompleted = true;
      await user.save();
    }

    function buildEmbed(count) {
      const completed = count >= QUEST_GOAL || hasRedeemed;
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('AF-REVIVAL INVITE QUEST')
        .setDescription('Invite 3 people to the official AF-REVIVAL Discord server to unlock your game redeem code.');

      if (completed) {
        embed.addFields({
          name: 'QUEST COMPLETED',
          value: 'Congratulations!\nYou can now redeem your AF-REVIVAL game code.',
        });
      } else {
        embed.addFields({
          name: 'Next Step',
          value: 'Invite more players to complete the quest.',
        });
      }

      embed.addFields({ name: 'Progress', value: `${Math.min(count, QUEST_GOAL)}/${QUEST_GOAL}` });
      embed.addFields({ name: 'Official Server Invite', value: `[Click here to invite others](${INVITE_URL})` });
      return embed;
    }

    const canRedeem = (inviteCount >= QUEST_GOAL || user.questCompleted) && !hasRedeemed;

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
      time: 300_000,
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
        let currentUser = await User.findOne({ discordUserId: userId });
        if (!currentUser) currentUser = await User.create({ discordUserId: userId });

        const alreadyRedeemed = Boolean(currentUser.hasRedeemed);
        if (alreadyRedeemed) {
          await btnInteraction.reply({
            content: 'You have already redeemed your AF-REVIVAL code.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const currentCount = currentUser.inviteCount || 0;
        if (currentCount < QUEST_GOAL && !currentUser.questCompleted) {
          await btnInteraction.reply({
            content: `You have not completed the Invite Quest yet. Progress: ${currentCount}/${QUEST_GOAL}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Check for existing redemption record
        const existingRed = await Redemption.findOne({ discordUserId: userId });
        if (existingRed) {
          await btnInteraction.reply({
            content: 'You have already redeemed your AF-REVIVAL code.',
            flags: MessageFlags.Ephemeral,
          });
          currentUser.hasRedeemed = true;
          await currentUser.save();
          return;
        }

        // Call game API to claim token
        const apiResult = await claimGameToken(userId);
        if (!apiResult.success || !apiResult.token) {
          const errorMsg = apiResult.error || 'The AF-REVIVAL game service is temporarily unavailable. Please try again later.';
          // Generic user message for API issues
          if (errorMsg.toLowerCase().includes('no') && errorMsg.toLowerCase().includes('code')) {
            await btnInteraction.reply({
              content: 'No AF-REVIVAL redeem codes are currently available. Please wait for more codes to be added.',
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await btnInteraction.reply({
              content: 'The AF-REVIVAL game service is temporarily unavailable. Please try again later.',
              flags: MessageFlags.Ephemeral,
            });
          }
          return;
        }

        const token = apiResult.token;
        const tokenId = apiResult.tokenId || token;

        // Save redemption
        try {
          await Redemption.create({ discordUserId: userId, gameTokenId: tokenId });
          currentUser.hasRedeemed = true;
          currentUser.gameTokenId = tokenId;
          currentUser.redeemedAt = new Date();
          currentUser.questCompleted = true;
          await currentUser.save();
        } catch (error) {
          console.error('Failed to save redemption:', error.message);
          await btnInteraction.reply({
            content: 'The service is temporarily unavailable. Please try again later.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // Send code privately
        const embedRedeem = new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle('AF-REVIVAL Redeem Code')
          .setDescription('Congratulations!\nYou completed the Invite Quest.')
          .addFields({ name: 'Your AF-REVIVAL redeem code', value: `\`\`\`${token}\`\`\`` })
          .setFooter({ text: 'This code is for one-time use. Keep it safe.' });

        await btnInteraction.reply({
          embeds: [embedRedeem],
          flags: MessageFlags.Ephemeral,
        });

        // Disable redeem button
        const finalEmbed = buildEmbed(Math.max(currentCount, QUEST_GOAL));
        const finalRow = new ActionRowBuilder().addComponents(
          cancelButton.setDisabled(false),
          redeemButton.setDisabled(true),
        );
        await interaction.editReply({ embeds: [finalEmbed], components: [finalRow] }).catch(() => {});
        collector.stop('redeemed');
      }
    });

    collector.on('end', async () => {
      // Collector ended - no further action needed
    });
  },
};
