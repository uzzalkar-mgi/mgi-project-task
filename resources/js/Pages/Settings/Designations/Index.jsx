import { Card, PageHeader } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Combobox } from '@/Components/ui/Combobox';
import { SearchInput } from '@/Components/ui/SearchInput';
import { StatusToggle } from '@/Components/ui/StatusToggle';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function Index({ designations, departments }) {
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const [editing, setEditing] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({ name: '', department_id: '', status: 1 });

    const deptOpts = departments.map((d) => ({ value: d.id, label: d.name }));
    const open = (d) => { setEditing(d ?? {}); reset(); setData({ name: d?.name ?? '', department_id: d?.department_id ?? '', status: d?.status ?? 1 }); };
    const close = () => setEditing(null);
    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: close, preserveScroll: true };
        editing?.id ? patch(route('designations.update', editing.id), opts) : post(route('designations.store'), opts);
    };
    const remove = (d) => { if (confirm(`Delete "${d.name}"?`)) router.delete(route('designations.destroy', d.id), { preserveScroll: true }); };

    const filtered = designations.filter((d) => `${d.name} ${d.department ?? ''}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Designations"
                    subtitle={`${designations.length} designations.`}
                    actions={can('designations.create') && (
                        <button onClick={() => open(null)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                            <Icon name="milestones" className="h-4 w-4" /> New Designation
                        </button>
                    )}
                />
            }
        >
            <Head title="Designations" />

            <Card className="overflow-hidden">
                <div className="flex justify-end p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Search designations…" />
                </div>
                <table className="w-full text-sm">
                    <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                                <td className="px-4 py-3 text-slate-500">{d.department ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-500">{d.users_count}</td>
                                <td className="px-4 py-3"><StatusToggle active={d.status === 1} url={route('designations.status', d.id)} canToggle={can('designations.update')} /></td>
                                <td className="px-4 py-3 text-right">
                                    {can('designations.update') && <button onClick={() => open(d)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>}
                                    {can('designations.delete') && <button onClick={() => remove(d)} className="ml-3 text-sm font-medium text-rose-500 hover:underline">Delete</button>}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No designations.</td></tr>}
                    </tbody>
                </table>
            </Card>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={close} />
                    <form onSubmit={submit} className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">{editing.id ? 'Edit Designation' : 'New Designation'}</h3>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name <span className="text-rose-500">*</span></label>
                        <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                        {errors.name && <p className="mt-1.5 text-sm text-rose-500">{errors.name}</p>}
                        <label className="mb-1.5 mt-4 block text-sm font-semibold text-slate-700">Department</label>
                        <Combobox options={deptOpts} value={data.department_id} onChange={(v) => setData('department_id', v)} placeholder="Select department…" />
                        {errors.department_id && <p className="mt-1.5 text-sm text-rose-500">{errors.department_id}</p>}
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
