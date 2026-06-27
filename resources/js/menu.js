// App navigation. Each item: route name, icon key (Icon.jsx), required permission,
// and `match` (wildcard) so the item stays active on its sub-routes (create/show/edit).
// Items are filtered by the signed-in user's permissions (super-admin sees all).
export const MENU = [
    { label: 'Dashboard', route: 'dashboard', match: 'dashboard', icon: 'dashboard', permission: 'dashboard.menu' },
    { label: 'Projects', route: 'projects.index', match: 'projects.*', icon: 'projects', permission: 'projects.menu' },
    { label: 'Tasks', route: 'tasks.index', match: 'tasks.*', icon: 'tasks', permission: 'tasks.menu' },
    { label: 'Timeline', route: 'timeline.index', match: 'timeline.*', icon: 'timeline', permission: 'timeline.menu' },
    { label: 'Milestones', route: 'milestones.index', match: 'milestones.*', icon: 'milestones', permission: 'milestones.menu' },
    { label: 'Team', route: 'users.index', match: 'users.*', icon: 'team', permission: 'users.menu' },
    {
        label: 'Settings', icon: 'gear', match: ['roles.*', 'departments.*', 'designations.*'],
        children: [
            { label: 'Roles', route: 'roles.index', match: 'roles.*', icon: 'gear', permission: 'roles.menu' },
            { label: 'Departments', route: 'departments.index', match: 'departments.*', icon: 'projects', permission: 'departments.menu' },
            { label: 'Designations', route: 'designations.index', match: 'designations.*', icon: 'milestones', permission: 'designations.menu' },
        ],
    },
];

/** route() URL if the named route exists, else '#'. Lets the full menu render before every page is built. */
export function hrefFor(name) {
    try {
        return route().has(name) ? route(name) : '#';
    } catch {
        return '#';
    }
}

/** Active if the current route matches the item's wildcard(s) (string or array). */
export function isActive(match) {
    try {
        const patterns = Array.isArray(match) ? match : [match];
        return patterns.some((p) => route().current(p));
    } catch {
        return false;
    }
}
