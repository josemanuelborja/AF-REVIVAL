// Simple SQLite database for invite tracking and redeem codes
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'data.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency (simple use case)
db.pragma('journal_mode = WAL');

// Users / Invite tracking
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    invite_count INTEGER NOT NULL DEFAULT 0,
    quest_completed INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run();

// Invite records (track who invited whom and via which invite code)
db.prepare(
  `CREATE TABLE IF NOT EXISTS invite_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter_id TEXT NOT NULL,
    invited_user_id TEXT NOT NULL UNIQUE,
    invite_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run();

// Redeem codes
db.prepare(
  `CREATE TABLE IF NOT EXISTS redeem_codes (
    code TEXT PRIMARY KEY,
    used INTEGER NOT NULL DEFAULT 0,
    used_by TEXT,
    used_at DATETIME
  )`
).run();

const statements = {
  // Users
  getUser: db.prepare('SELECT * FROM users WHERE user_id = ?'),
  createUser: db.prepare(
    'INSERT OR IGNORE INTO users (user_id, invite_count, quest_completed) VALUES (?, 0, 0)'
  ),
  incrementInvite: db.prepare(
    'UPDATE users SET invite_count = invite_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
  ),
  completeQuest: db.prepare(
    'UPDATE users SET quest_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
  ),
  updateInviteCount: db.prepare(
    'UPDATE users SET invite_count = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
  ),

  // Invite records
  recordInvite: db.prepare(
    'INSERT OR IGNORE INTO invite_records (inviter_id, invited_user_id, invite_code) VALUES (?, ?, ?)'
  ),
  hasBeenInvited: db.prepare('SELECT 1 FROM invite_records WHERE invited_user_id = ?'),

  // Redeem codes
  getUnusedCode: db.prepare('SELECT code FROM redeem_codes WHERE used = 0 LIMIT 1'),
  claimCode: db.prepare(
    'UPDATE redeem_codes SET used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ? AND used = 0'
  ),
  hasRedeemed: db.prepare('SELECT 1 FROM redeem_codes WHERE used_by = ?'),
  getUserRedeemedCode: db.prepare('SELECT code FROM redeem_codes WHERE used_by = ?'),
};

function ensureUser(userId) {
  if (!userId) return;
  statements.createUser.run(userId);
}

function getUser(userId) {
  ensureUser(userId);
  return statements.getUser.get(userId);
}

function recordInvite(inviterId, invitedUserId, inviteCode) {
  if (!inviterId || !invitedUserId) return false;
  ensureUser(inviterId);
  const result = statements.recordInvite.run(inviterId, invitedUserId, inviteCode || null);
  return result.changes > 0;
}

function incrementInviteCount(inviterId) {
  if (!inviterId) return;
  ensureUser(inviterId);
  statements.incrementInvite.run(inviterId);
}

function hasQuestCompleted(userId) {
  const user = getUser(userId);
  return user && user.quest_completed === 1;
}

function setQuestCompleted(userId) {
  ensureUser(userId);
  statements.completeQuest.run(userId);
}

function getInviteCount(userId) {
  const user = getUser(userId);
  return user ? user.invite_count : 0;
}

function setInviteCount(userId, count) {
  ensureUser(userId);
  statements.updateInviteCount.run(userId, count);
}

function hasBeenInvited(invitedUserId) {
  if (!invitedUserId) return true;
  return Boolean(statements.hasBeenInvited.get(invitedUserId));
}

function hasRedeemed(userId) {
  if (!userId) return true;
  return Boolean(statements.hasRedeemed.get(userId));
}

function getRedeemedCode(userId) {
  if (!userId) return null;
  const row = statements.getUserRedeemedCode.get(userId);
  return row ? row.code : null;
}

function claimNextCode(userId) {
  if (!userId) return null;
  // Try to claim an unused code atomically
  const codeRow = statements.getUnusedCode.get();
  if (!codeRow) return null;
  const code = codeRow.code;
  const result = statements.claimCode.run(userId, code);
  if (result.changes === 0) {
    // Another process claimed it; try once more
    const codeRow2 = statements.getUnusedCode.get();
    if (!codeRow2) return null;
    const code2 = codeRow2.code;
    const result2 = statements.claimCode.run(userId, code2);
    if (result2.changes === 0) return null;
    return code2;
  }
  return code;
}

function addRedeemCode(code) {
  if (!code) return;
  db.prepare(
    'INSERT OR IGNORE INTO redeem_codes (code, used, used_by, used_at) VALUES (?, 0, NULL, NULL)'
  ).run(code.trim());
}

function addRedeemCodes(codes) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO redeem_codes (code, used, used_by, used_at) VALUES (?, 0, NULL, NULL)'
  );
  const transaction = db.transaction((list) => {
    for (const c of list) insert.run(c.trim());
  });
  transaction(codes.filter((c) => c && c.trim()));
}

function getRedeemStats() {
  const total = db.prepare('SELECT COUNT(*) as c FROM redeem_codes').get().c;
  const used = db.prepare('SELECT COUNT(*) as c FROM redeem_codes WHERE used = 1').get().c;
  const unused = total - used;
  return { total, used, unused };
}

module.exports = {
  db,
  ensureUser,
  getUser,
  recordInvite,
  incrementInviteCount,
  hasQuestCompleted,
  setQuestCompleted,
  getInviteCount,
  setInviteCount,
  hasBeenInvited,
  hasRedeemed,
  getRedeemedCode,
  claimNextCode,
  addRedeemCode,
  addRedeemCodes,
  getRedeemStats,
};
