// Prefix command: !update (text, images, files, videos)
const { hasAdminRole } = require('../utils/admin');

module.exports = {
  name: 'update',

  async execute(message) {
    if (!message.guild) return;

    // Check if the user has an authorized admin/staff role
    if (!hasAdminRole(message.member)) {
      try {
        await message.reply('You do not have permission to use this command.');
      } catch (error) {
        console.error('Failed to reply to !update:', error.message);
      }
      return;
    }

    // Extract content after the command name/trigger
    const content = message.content.slice('!update'.length).trim();
    const channelId = process.env.UPDATE_CHANNEL_ID;

    if (!channelId) {
      try {
        await message.reply('Update channel is not configured. Please contact an administrator.');
      } catch (error) {
        console.error('Failed to reply to !update:', error.message);
      }
      return;
    }

    try {
      const channel = await message.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error('Update channel is missing or is not a text channel.');
      }

      const payload = {};
      if (content) payload.content = content;
      if (message.attachments.size > 0) {
        payload.files = Array.from(message.attachments.values()).map((a) => ({
          attachment: a.url,
          name: a.name,
          description: a.description || undefined,
        }));
      }

      // If nothing to send, inform the user
      if (!payload.content && (!payload.files || payload.files.length === 0)) {
        await message.reply('Please provide text, images, files, or videos for the update.');
        return;
      }

      await channel.send(payload);
      try {
        await message.reply('Update successfully sent.');
      } catch (error) {
        console.error('Failed to send confirmation for !update:', error.message);
      }
    } catch (error) {
      console.error('Failed to send update:', error.message);
      try {
        await message.reply('Something went wrong while sending the update. Please try again later.');
      } catch (err) {
        console.error('Failed to reply to !update:', err.message);
      }
    }
  },
};
