// Slash command: /whitelist - admin/staff creates whitelist panel
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const Whitelist = require("../models/Whitelist");
const { hasAdminRole } = require("../utils/permissions");

const INSTALL_URL =
  process.env.AF_REVIVAL_INSTALL_URL || "https://mega.nz/file/GaBzTJjT";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Create AF-REVIVAL whitelist panel (admin/staff only)."),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the user has allowed admin/staff role
    if (!hasAdminRole(interaction.member)) {
      await interaction.reply({
        content: "You do not have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("AF-REVIVAL Whitelist")
      .setDescription(
        "Welcome to AF-REVIVAL.\n\nClick the button below to request whitelist access.\n\nAfter you are whitelisted, the bot will send you the installation link through DM.",
      );

    const whitelistButton = new ButtonBuilder()
      .setCustomId("whitelist_request")
      .setLabel("Whitelist")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(whitelistButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};

// Handles the Whitelist button on the whitelist panel
module.exports.handleButton = async (interaction) => {
  if (!interaction.isButton() || interaction.customId !== "whitelist_request")
    return false;

  const userId = interaction.user.id;
  const username = interaction.user.tag || interaction.user.username;

  // Build the private DM containing the installation link
  const footerCode = process.env.FOOTER_CODE;
  const footerText = [
    "Please download and install the game using the provided file. Keep this link private.",
    footerCode ? `Code: ${footerCode}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const dmEmbed = new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle("AF-REVIVAL Whitelist Approved")
    .setDescription("You have been successfully whitelisted for AF-REVIVAL.")
    .addFields({ name: "Download", value: INSTALL_URL })
    .setFooter({ text: footerText });

  try {
    const existing = await Whitelist.findOne({ discordUserId: userId });

    if (existing) {
      // Already whitelisted - no new record, just confirm and resend the DM
      await interaction.reply({
        content:
          "You are already whitelisted.\n\nThe installation link has already been sent to your DM.",
        flags: MessageFlags.Ephemeral,
      });
      await interaction.user.send({ embeds: [dmEmbed] }).catch(() => {});
      return true;
    }

    // Create the whitelist record (unique index prevents duplicates)
    await Whitelist.create({
      discordUserId: userId,
      discordUsername: username,
    });

    await interaction.reply({
      content:
        "You have been successfully whitelisted!\n\nCheck your DM for the installation link.",
      flags: MessageFlags.Ephemeral,
    });

    try {
      await interaction.user.send({ embeds: [dmEmbed] });
    } catch (err) {
      // DMs are disabled - keep the whitelist record and explain
      console.error("Failed to send whitelist DM:", err.message);
      await interaction
        .followUp({
          content:
            "You have been successfully whitelisted, but I could not send you a DM.\n\nPlease enable your Discord direct messages and contact an administrator.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
    return true;
  } catch (error) {
    console.error("Whitelist button error:", error.message);
    await interaction
      .reply({
        content:
          "The service is temporarily unavailable. Please try again later.",
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {});
    return true;
  }
};
