// Slash command: /update (text, images, files, videos)
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasAdminRole } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Send a game update with text, images, files, or videos.')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Update message text.')
        .setRequired(false)
        .setMaxLength(4000),
    )
    .addAttachmentOption((option) =>
      option
        .setName('attachment1')
        .setDescription('Optional attachment.')
        .setRequired(false),
    )
    .addAttachmentOption((option) =>
      option
        .setName('attachment2')
        .setDescription('Optional attachment.')
        .setRequired(false),
    )
    .addAttachmentOption((option) =>
      option
        .setName('attachment3')
        .setDescription('Optional attachment.')
        .setRequired(false),
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the user has an allowed admin/staff role
    if (!hasAdminRole(interaction.member)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const messageText = interaction.options.getString('message');
    const attachments = [
      interaction.options.getAttachment('attachment1'),
      interaction.options.getAttachment('attachment2'),
      interaction.options.getAttachment('attachment3'),
    ].filter(Boolean);

    const channelId = process.env.UPDATE_CHANNEL_ID;
    if (!channelId) {
      await interaction.reply({
        content: 'Update channel is not configured. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!messageText && attachments.length === 0) {
      await interaction.reply({
        content: 'Please provide text, images, files, or videos for the update.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const payload = {};
    if (messageText) payload.content = messageText;
    if (attachments.length > 0) payload.files = attachments;

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error('Update channel is missing or is not a text channel.');
      }
      await channel.send(payload);
      await interaction.reply({
        content: `Update successfully sent to <#${channelId}>.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('Failed to send update:', error.message);
      const reply = {
        content: 'Something went wrong while sending the update. Please try again later.',
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
