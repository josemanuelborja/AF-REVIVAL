// Optional helper to load redeem codes from a file if needed
const fs = require('node:fs');
const path = require('node:path');

function loadRedeemCodesFromFile(filename) {
  try {
    const filePath = path.join(__dirname, '..', '..', filename || 'redeem-codes.txt');
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    console.error('Failed to load redeem codes:', error.message);
    return [];
  }
}

module.exports = {
  loadRedeemCodesFromFile,
};
