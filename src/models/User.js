// User model - invite progress and redemption state
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    discordUserId: { type: String, required: true, unique: true, index: true },
    inviteCount: { type: Number, default: 0 },
    questCompleted: { type: Boolean, default: false },
    hasRedeemed: { type: Boolean, default: false },
    gameTokenId: { type: String, default: null },
    redeemedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
