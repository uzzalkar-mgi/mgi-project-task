import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import { StatusToggle } from '@/Components/ui/StatusToggle';
import { StatusActionButton } from '@/Components/ui/StatusActionButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function Index({ departments }) {
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const [editing, setEditing] = useState(null); // null = closed, {} = new, {id..} = edit
    const { data, setData, post, patch, processing, errors, reset } = useForm({ name: '', status: 1 });

    const open = (d) => { setEditing(d ?? {}); reset(); setData({ name: d?.name ?? '', status: d?.status ?? 1 }); };
    const close = () => setEditing(null);
    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: close, preserveScroll: true };
        editing?.id ? patch(route('departments.update', editing.id), opts) : post(route('departments.store'), opts);
    };
    const remove = (d) => { if (confirm(`Delete "${d.name}"?`)) router.delete(route('departments.destroy', d.id), { preserveScroll: true }); };

    const filtered = departments.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Departments"
                    subtitle={`${departments.length} departments.`}
                    actions={can('departments.create') && (
                        <button onClick={() => open(null)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                            <Icon name="projects" className="h-4 w-4" /> New Department
                        </button>
                    )}
                />
            }
        >
            <Head title="Departments" />

            <Card className="overflow-hidden">
                <div className="flex justify-end p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Search departments…" />
                </div>
                <table className="w-full text-sm">
                    <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                                <td className="px-4 py-3 text-slate-500">{d.users_count}</td>
                                <td className="px-4 py-3"><StatusToggle active={d.status === 1} url={route('departments.status', d.id)} canToggle={can('departments.update')} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        {can('departments.update') && <button onClick={() => open(d)} className="flex items-center gap-1 rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"><Icon name="edit" className="h-3.5 w-3.5" /> Edit</button>}
                                        {can('departments.update') && <StatusActionButton active={d.status === 1} url={route('departments.status', d.id)} name={d.name} />}
                                        {can('departments.delete') && <button onClick={() => remove(d)} className="flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"><Icon name="trash" className="h-3.5 w-3.5" /> Delete</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">No departments.</td></tr>}
                    </tbody>
                </table>
            </Card>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={close} />
                    <form onSubmit={submit} className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">{editing.id ? 'Edit Department' : 'New Department'}</h3>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name <span className="text-rose-500">*</span></label>
                        <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                        {errors.name && <p className="mt-1.5 text-sm text-rose-500">{errors.name}</p>}
                        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={data.status === 1} onChange={(e) => setData('status', e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /> Active
                        </label>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={close} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
                                <Icon name="x" className="h-4 w-4" /> Cancel
                            </button>
                            <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
                                <Icon name={editing.id ? 'check' : 'plus'} className="h-4 w-4" /> {editing.id ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
