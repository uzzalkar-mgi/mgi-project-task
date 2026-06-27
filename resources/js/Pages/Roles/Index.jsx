import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import { StatusToggle } from '@/Components/ui/StatusToggle';
import { StatusActionButton } from '@/Components/ui/StatusActionButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const CORE = ['admin', 'manager', 'member'];

export default function Index({ roles }) {
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const filtered = roles.filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase()));

    const remove = (r) => {
        if (confirm(`Delete role "${r.name}"?`)) router.delete(route('roles.destroy', r.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Roles & Permissions"
                    subtitle={`${roles.length} roles.`}
                    actions={
                        can('roles.create') && (
                            <Link href={route('roles.create')} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                                <Icon name="gear" className="h-4 w-4" /> New Role
                            </Link>
                        )
                    }
                />
            }
        >
            <Head title="Roles" />

            <Card className="overflow-hidden">
                <div className="flex justify-end p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Search roles…" />
                </div>
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Permissions</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    {r.name} {r.is_super && <Badge tone="blue">Super</Badge>}
                                </td>
                                <td className="px-4 py-3 text-slate-500">{r.code}</td>
                                <td className="px-4 py-3 text-slate-500">{r.users_count}</td>
                                <td className="px-4 py-3 text-slate-500">{r.is_super ? 'All' : r.permissions_count}</td>
                                <td className="px-4 py-3"><StatusToggle active={r.status === 1} url={route('roles.status', r.id)} canToggle={can('roles.update')} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        {can('roles.update') && (
                                            <Link href={route('roles.edit', r.id)} className="flex items-center gap-1 rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
                                                <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                                            </Link>
                                        )}
                                        {can('roles.update') && <StatusActionButton active={r.status === 1} url={route('roles.status', r.id)} name={r.name} />}
                                        {can('roles.delete') && !CORE.includes(r.code) && (
                                            <button onClick={() => remove(r)} className="flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50">
                                                <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </AuthenticatedLayout>
    );
}
