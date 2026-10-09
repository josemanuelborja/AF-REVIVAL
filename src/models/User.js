// User model - Discord user info and redemption state
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    discordUserId: { type: String, required: true, unique: true, index: true },
    hasRedeemed: { type: Boolean, default: false },
    gameTokenId: { type: String, default: null },
    redeemedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
