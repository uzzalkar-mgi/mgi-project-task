import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Pagination } from '@/Components/ui/Pagination';
import { SearchInput } from '@/Components/ui/SearchInput';
import { StatusToggle } from '@/Components/ui/StatusToggle';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const toggleStatus = (u) => {
    const next = u.status === 1 ? 'Inactive' : 'Active';
    if (confirm(`Change ${u.name}'s status to ${next}?`)) {
        router.patch(route('users.status', u.uuid), {}, { preserveScroll: true, preserveState: true });
    }
};

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

const ROLE_TONE = { 'Super Admin': 'red', Admin: 'blue', Manager: 'green', Employee: 'amber', Member: 'amber' };

export default function Index({ users, filters, canManage, iAmSuper = false }) {
    const { can } = usePermissions();
    const [q, setQ] = useState(filters?.q ?? '');
    const first = useRef(true);

    // Debounced server-side search.
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => {
            router.get(route('users.index'), { q }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Team"
                    subtitle={`${users.total} users · roles and access.`}
                    actions={
                        canManage && (
                            <Link href={route('users.create')} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                                <Icon name="team" className="h-4 w-4" /> New User
                            </Link>
                        )
                    }
                />
            }
        >
            <Head title="Team" />

            <Card className="overflow-hidden">
                <div className="flex justify-end gap-3 p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Search name, email, ID…" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Employee ID</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Designation</th>
                                <th className="px-4 py-3">Roles</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.data.map((u) => (
                                <tr key={u.uuid} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <Link href={route('users.show', u.uuid)} className="flex items-center gap-3">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                                            ) : (
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(u.name)}</span>
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-800 hover:text-brand-700">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{u.employee_id ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{u.department ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{u.designation ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {u.roles.length ? u.roles.map((r) => <Badge key={r} tone={ROLE_TONE[r] ?? 'slate'}>{r}</Badge>) : <span className="text-slate-400">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusToggle active={u.status === 1} url={route('users.status', u.uuid)} canToggle={can('users.update') && (!u.is_super || iAmSuper)} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('users.show', u.uuid)} className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                                <Icon name="eye" className="h-3.5 w-3.5" /> View
                                            </Link>
                                            <Link href={route('users.show', u.uuid)} className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50" title="Created tasks (project-wise)">
                                                <Icon name="tasks" className="h-3.5 w-3.5" /> Tasks
                                            </Link>
                                            {can('users.update') && (!u.is_super || iAmSuper) && (
                                                <Link href={route('users.edit', u.uuid)} className="flex items-center gap-1 rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                                                    <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                                                </Link>
                                            )}
                                            {can('users.update') && (!u.is_super || iAmSuper) && (
                                                <button
                                                    onClick={() => toggleStatus(u)}
                                                    className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${u.status === 1 ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    <Icon name="power" className="h-3.5 w-3.5" /> {u.status === 1 ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No users match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-100">
                    <Pagination paginator={users} />
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
