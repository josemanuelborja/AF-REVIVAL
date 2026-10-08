// Check if user has authorized admin/staff role
function hasAdminRole(member) {
  if (!member) return false;
  const adminRoleIds = process.env.ADMIN_ROLE_IDS;
  if (!adminRoleIds || adminRoleIds.trim() === '') return false;

  const allowed = adminRoleIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (allowed.length === 0) return false;

  const memberRoles = member.roles.cache;
  for (const id of allowed) {
    if (memberRoles.has(id)) return true;
  }
  return false;
}

module.exports = {
  hasAdminRole,
};
