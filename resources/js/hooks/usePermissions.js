import { usePage } from '@inertiajs/react';

/**
 * Frontend permission gating, mirrors User::hasPermission().
 * Super-admin shares ['*'] which grants everything.
 *
 *   const { can, hasRole } = usePermissions();
 *   {can('projects.create') && <CreateButton />}
 */
export function usePermissions() {
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];
    const roles = auth?.roles ?? [];

    const can = (name) => permissions.includes('*') || permissions.includes(name);
    const hasRole = (code) => roles.includes(code);

    return { can, hasRole, permissions, roles };
}
