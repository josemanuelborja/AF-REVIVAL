// Slash command: /announcement
const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { hasAdminRole } = require('../utils/admin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Send an announcement to the configured announcement channel.')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('The title of the announcement.')
        .setRequired(true)
        .setMaxLength(256),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message of the announcement.')
        .setRequired(true)
        .setMaxLength(4096),
    )
    .addStringOption((option) =>
      option
        .setName('footer')
        .setDescription('Optional footer text.')
        .setRequired(false)
        .setMaxLength(2048),
    )
    .addAttachmentOption((option) =>
      option
        .setName('attachment')
        .setDescription('Optional image or file to include.')
        .setRequired(false),
    ),

  async execute(interaction) {
    // Only allow the command inside a server
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the user has an authorized admin/staff role
    if (!hasAdminRole(interaction.member)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Read and validate the announcement information
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const footer = interaction.options.getString('footer');
    const attachment = interaction.options.getAttachment('attachment');

    if (!title || !message) {
      await interaction.reply({
        content: 'Please provide the required announcement information.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Read the announcement channel from the environment
    const channelId = process.env.ANNOUNCEMENT_CHANNEL_ID;

    if (!channelId) {
      await interaction.reply({
        content: 'The announcement channel is not configured. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Build the announcement embed
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title)
      .setDescription(message)
      .setTimestamp();

    if (footer) embed.setFooter({ text: footer });

    const isImage = Boolean(
      attachment && attachment.contentType && attachment.contentType.startsWith('image/'),
    );

    if (attachment && isImage) embed.setImage(attachment.url);

    const payload = { embeds: [embed] };
    if (attachment && !isImage) payload.files = [attachment];

    // Send the announcement to the configured channel
    try {
      const channel = await interaction.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased()) {
        throw new Error('Announcement channel is missing or is not a text channel.');
      }

      await channel.send(payload);

      await interaction.reply({
        content: `Announcement successfully sent to <#${channelId}>.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      // Log the real error locally, never show it to Discord users
      console.error('Failed to send announcement:', error.message);

      const reply = {
        content: 'Something went wrong while sending the announcement. Please try again later.',
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
