// Redemption model - records successful redemptions
const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    discordUserId: { type: String, required: true, unique: true, index: true },
    gameTokenId: { type: String, required: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
