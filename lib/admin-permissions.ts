/**
 * Admin permission helpers.
 *
 * Permissions are stored as a string[] on profiles.admin_permissions.
 * The special value 'super_admin' inside that array grants access to everything.
 */

export const ADMIN_PERMISSION_KEYS = [
  'dashboard',
  'transactions',
  'payment_review',
  'settlement',
  'disputes',
  'corridors',
  'users',
  'sellers',
  'risk',
  'alerts',
  'analytics',
  'activity',
  'settings',
  'reset',
] as const

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number]

/**
 * Returns true if the permissions array grants access to `key`.
 *
 * Empty array = no explicit restrictions = full access (owner/primary admin).
 * Non-empty array = restricted to listed keys only, unless 'super_admin' is present.
 */
export function hasPermission(permissions: string[] | null | undefined, key: AdminPermissionKey): boolean {
  if (!permissions || permissions.length === 0) return true          // owner: unrestricted
  return permissions.includes('super_admin') || permissions.includes(key)
}

/**
 * Returns true if the admin has unrestricted access:
 * either their permissions array is empty (primary admin/owner)
 * or it explicitly contains 'super_admin'.
 */
export function isSuperAdmin(permissions: string[] | null | undefined): boolean {
  if (!permissions || permissions.length === 0) return true
  return permissions.includes('super_admin')
}
