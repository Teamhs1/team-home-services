import { COMPANY_ROLE_PERMISSIONS } from "@/config/companyRolePermissions";

export function hasCompanyPermission(role, permission) {
  if (!role) return false;

  const permissions = COMPANY_ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  if (permissions.includes("*")) return true;

  return permissions.includes(permission);
}
