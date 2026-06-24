export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export const INVENTORY_ADMIN_ROLES = ['super_admin', 'warehouse_manager', 'inventory_controller'] as const;
export const TRANSFER_CREATOR_ROLES = ['super_admin', 'warehouse_manager', 'warehouse_staff'] as const;

export function formatRoleLabel(role?: string) {
  if (!role) {
    return 'User';
  }

  return role
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function hasInventoryAdminAccess(role?: string | null) {
  return INVENTORY_ADMIN_ROLES.includes((role ?? '') as (typeof INVENTORY_ADMIN_ROLES)[number]);
}

export function hasTransferCreateAccess(role?: string | null) {
  return TRANSFER_CREATOR_ROLES.includes((role ?? '') as (typeof TRANSFER_CREATOR_ROLES)[number]);
}

export function buildLoginRedirectPath(pathname = '/login', search = '') {
  const target = `${pathname}${search}`;

  if (pathname.startsWith('/login')) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(target)}`;
}
