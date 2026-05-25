import { redirect } from 'next/navigation'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions'

/**
 * Call at the top of any admin page server component.
 * Verifies the user is an admin and has the required permission.
 * Redirects to /admin/dashboard if not, or /admin if not logged in.
 *
 * Returns the admin's permissions array for optional further use.
 */
export async function requireAdminPermission(key: AdminPermissionKey): Promise<string[]> {
  const { user } = await getAuthUser()
  if (!user) redirect('/admin')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, admin_permissions')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin')

  const permissions = (profile?.admin_permissions as string[]) ?? []
  if (!hasPermission(permissions, key)) redirect('/admin/dashboard')

  return permissions
}
