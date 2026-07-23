import { Icon } from '@/Components/ui/Icon';
import { SearchBar } from '@/Components/ui/SearchBar';
import { Toast } from '@/Components/ui/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { MENU, hrefFor, isActive } from '@/menu';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function Brand() {
    return (
        <Link href={hrefFor('dashboard')} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-brand-700">
                PTS
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:block">MGI · Project Tracking</span>
        </Link>
    );
}

function NavLeaf({ item, onNavigate }) {
    const active = isActive(item.match);
    return (
        <Link
            href={hrefFor(item.route)}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <Icon name={item.icon} className={`h-5 w-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

function NavGroup({ item, onNavigate }) {
    const { can } = usePermissions();
    const children = item.children.filter((c) => can(c.permission));
    if (children.length === 0) return null;

    const groupActive = isActive(item.match);
    const [open, setOpen] = useState(groupActive);

    return (
        <li>
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${groupActive ? 'text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
                <Icon name={item.icon} className={`h-5 w-5 ${groupActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className="flex-1 truncate text-left font-medium">{item.label}</span>
                <svg className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {open && (
                <ul className="mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
                    {children.map((c) => <li key={c.route}><NavLeaf item={c} onNavigate={onNavigate} /></li>)}
                </ul>
            )}
        </li>
    );
}

function SidebarNav({ onNavigate }) {
    const { can } = usePermissions();
    const items = MENU.filter((m) => (m.children ? true : can(m.permission)));

    return (
        <nav className="flex h-full flex-col">
            <ul className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                {items.map((item) =>
                    item.children
                        ? <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
                        : <li key={item.route}><NavLeaf item={item} onNavigate={onNavigate} /></li>
                )}
            </ul>

            <div className="border-t border-slate-100 px-3 py-3 text-sm">
                <div className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-rose-500">
                    <span>Notifications</span>
                    <span className="rounded bg-rose-50 px-1.5 text-xs">00</span>
                </div>
            </div>
        </nav>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const notifications = page.props.notifications ?? { unread: 0, items: [] };
    const { roles } = usePermissions();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [panel, setPanel] = useState(null); // 'bell' | 'profile' | null

    const toggle = (p) => setPanel((cur) => (cur === p ? null : p));
    const close = () => setPanel(null);
    const roleLabel = roles?.[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : 'Member';

    // Open bell -> mark all read (so the counter clears once viewed).
    const openBell = () => {
        const opening = panel !== 'bell';
        toggle('bell');
        if (opening && notifications.unread > 0) {
            router.patch(route('notifications.readAll'), {}, { preserveScroll: true, preserveState: false, only: ['notifications'] });
        }
    };
    const openNotification = (n) => {
        close();
        if (!n.is_read) router.patch(route('notifications.read', n.id), {}, { preserveScroll: true, only: ['notifications'] });
        if (n.link) router.visit(n.link);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Topbar */}
            <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-brand-600 px-4 text-white shadow">
                <button onClick={() => setMobileOpen((v) => !v)} className="rounded p-1.5 hover:bg-white/10 lg:hidden" aria-label="Toggle menu">
                    <Icon name="menu" className="h-5 w-5" />
                </button>

                <Brand />

                {/* Global search */}
                <div className="ml-auto mr-3 hidden w-full max-w-[460px] md:block">
                    <SearchBar />
                </div>

                {/* Outside-click backdrop for panels */}
                {panel && <div className="fixed inset-0 z-30" onClick={close} />}

                <div className="relative z-40 flex items-center gap-1 md:ml-0 ml-auto">
                    {/* Notifications */}
                    <div className="relative">
                        <button onClick={openBell} className="relative rounded p-2 hover:bg-white/10">
                            <Icon name="bell" className="h-5 w-5" />
                            {notifications.unread > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                    {notifications.unread > 9 ? '9+' : notifications.unread}
                                </span>
                            )}
                        </button>
                        {panel === 'bell' && (
                            <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg bg-white text-slate-700 shadow-xl ring-1 ring-black/5">
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                    {notifications.unread > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">{notifications.unread} new</span>}
                                </div>
                                <div className="max-h-96 divide-y divide-slate-50 overflow-y-auto">
                                    {notifications.items.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications.</p>
                                    ) : (
                                        notifications.items.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => openNotification(n)}
                                                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${n.is_read ? '' : 'bg-brand-50/50'}`}
                                            >
                                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.is_read ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-700'}`}>
                                                    <Icon name="bell" className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{n.message}</p>
                                                    <p className="text-xs text-slate-400">{n.created_at}</p>
                                                </div>
                                                {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button onClick={() => toggle('profile')} className="ml-1 flex items-center gap-2 rounded-full">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xs font-semibold">
                                {initials(user?.name)}
                            </span>
                        </button>
                        {panel === 'profile' && (
                            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-white py-2 text-slate-700 shadow-xl ring-1 ring-black/5">
                                <div className="border-b border-slate-100 px-4 pb-2">
                                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500">{roleLabel}</p>
                                    {user?.employee_id && <p className="text-xs text-slate-400">ID: {user.employee_id}</p>}
                                </div>
                                <Link href={route('profile.edit')} onClick={close} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                                    <Icon name="user" className="h-4 w-4 text-slate-400" /> My Profile
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                    <Icon name="logout" className="h-4 w-4" /> Logout
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar — desktop */}
                <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-slate-200 bg-white lg:block">
                    <SidebarNav />
                </aside>

                {/* Sidebar — mobile drawer */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                        <aside className="absolute left-0 top-0 h-full w-56 bg-white shadow-xl">
                            <SidebarNav onNavigate={() => setMobileOpen(false)} />
                        </aside>
                    </div>
                )}

                {/* Main */}
                <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 flex-col">
                    <main className="flex-1 p-4 md:p-6">
                        {header && <div className="mb-4">{header}</div>}
                        <div className="animate-fade-in">{children}</div>
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-400">
                        <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
                            <span>© {new Date().getFullYear()} MGI · Project Tracking System</span>
                            <span>Manage Projects · Assign Tasks · Track Timelines · Monitor Status</span>
                        </div>
                    </footer>
                </div>
            </div>

            <Toast />
        </div>
    );
}
