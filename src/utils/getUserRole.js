export function getUserRole(user) {
  const role = user?.publicMetadata?.role;

  return {
    role,
    isAdmin: role === "admin" || role === "super_admin",
    isClient: role === "client",
    isStaff: role === "staff",
    isSuperAdmin: role === "super_admin",
  };
}
