// Slash command: /reg - admin/staff posts the AF-REVIVAL registration panel
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { hasAdminRole } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reg")
    .setDescription("Post the AF-REVIVAL registration panel (admin/staff only)."),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!hasAdminRole(interaction.member)) {
      await interaction.reply({
        content: "You do not have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const siteUrl = (process.env.SITE_URL || "").replace(/\/+$/, "");
    if (!siteUrl) {
      await interaction.reply({
        content:
          "The registration website is not configured yet. Please set SITE_URL in the .env file.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const title = process.env.REG_EMBED_TITLE || "AF-REVIVAL Registration";
    const description =
      process.env.REG_EMBED_DESCRIPTION ||
      "Click the button below to open the AF-REVIVAL registration gateway. Access is limited to whitelisted members of the official server.";
    const image = process.env.REG_EMBED_IMAGE_URL;
    const extraText = process.env.REG_EMBED_EXTRA_TEXT;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title)
      .setDescription(extraText ? `${description}\n\n${extraText}` : description)
      .setTimestamp();

    if (image) embed.setImage(image);

    const registerButton = new ButtonBuilder()
      .setLabel("Register Now")
      .setStyle(ButtonStyle.Link)
      .setURL(`${siteUrl}/register`);

    const row = new ActionRowBuilder().addComponents(registerButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
