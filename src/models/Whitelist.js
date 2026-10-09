// Whitelist model - stores approved whitelisted users
const mongoose = require('mongoose');

const whitelistSchema = new mongoose.Schema(
  {
    discordUserId: { type: String, required: true, unique: true, index: true },
    discordUsername: { type: String, default: null },
    whitelistedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Whitelist', whitelistSchema);
