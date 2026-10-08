// Invite model - records who invited whom (prevents duplicate counting)
const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    inviterId: { type: String, required: true, index: true },
    invitedUserId: { type: String, required: true, unique: true, index: true },
    inviteCode: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('Invite', inviteSchema);
