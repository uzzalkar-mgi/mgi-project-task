import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
// Fixed column order for the permission matrix.
const ACTION_COLUMNS = [
    { key: 'menu', label: 'Menu' },
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' },
    { key: 'assign', label: 'Assign' },
    { key: 'manage', label: 'Manage' },
];

export default function Form({ role, modules, assigned }) {
    const editing = Boolean(role);
    const { data, setData, post, patch, processing, errors } = useForm({
        name: role?.name ?? '',
        code: role?.code ?? '',
        is_super: role?.is_super ?? false,
        status: role?.status ?? 1,
        permission_ids: assigned ?? [],
    });

    const submit = (e) => {
        e.preventDefault();
        editing ? patch(route('roles.update', role.id)) : post(route('roles.store'));
    };

    const has = (id) => data.permission_ids.includes(id);
    const setMany = (ids, on) => setData('permission_ids', on
        ? [...new Set([...data.permission_ids, ...ids])]
        : data.permission_ids.filter((x) => !ids.includes(x)));
    const toggle = (id) => setMany([id], !has(id));

    // action -> permission id, per module (null when the module lacks that action).
    const cellId = (mod, action) => mod.permissions.find((p) => p.action === action)?.id ?? null;

    const toggleRow = (mod) => {
        const ids = mod.permissions.map((p) => p.id);
        setMany(ids, !ids.every((id) => has(id)));
    };
    const toggleColumn = (action) => {
        const ids = modules.map((m) => cellId(m, action)).filter(Boolean);
        setMany(ids, !ids.every((id) => has(id)));
    };
    // Visible columns = only actions that exist in at least one module.
    const columns = ACTION_COLUMNS.filter((c) => modules.some((m) => cellId(m, c.key)));

    return (
        <AuthenticatedLayout header={<PageHeader title={editing ? `Edit Role: ${role.name}` : 'New Role'} subtitle="Define a role and its menu + action permissions." />}>
            <Head title={editing ? 'Edit Role' : 'New Role'} />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Role</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name <span className="text-rose-500">*</span></label>
                            <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                            {errors.name && <p className="mt-1.5 text-sm text-rose-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Code</label>
                            <input className={inputCls} value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="auto from name" />
                            {errors.code && <p className="mt-1.5 text-sm text-rose-500">{errors.code}</p>}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={data.is_super} onChange={(e) => setData('is_super', e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            Super-admin (grants everything)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={data.status === 1} onChange={(e) => setData('status', e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            Active
                        </label>
                    </div>
                </Card>

                <Card className={`overflow-hidden ${data.is_super ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between p-5 pb-3">
                        <SectionTitle>Backend Modules</SectionTitle>
                    </div>
                    {data.is_super && <p className="px-5 pb-3 text-sm text-amber-600">Super-admin holds all permissions implicitly.</p>}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="border-y border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Module</th>
                                    {columns.map((c) => (
                                        <th key={c.key} className="px-3 py-3 text-center">
                                            <button type="button" onClick={() => toggleColumn(c.key)} disabled={data.is_super} className="hover:text-brand-600" title={`Toggle all ${c.label}`}>
                                                {c.label}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {modules.map((mod) => (
                                    <tr key={mod.module} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-2.5">
                                            <button type="button" onClick={() => toggleRow(mod)} disabled={data.is_super} className="font-medium text-slate-700 hover:text-brand-600" title="Toggle whole row">
                                                {mod.label}
                                            </button>
                                        </td>
                                        {columns.map((c) => {
                                            const id = cellId(mod, c.key);
                                            return (
                                                <td key={c.key} className="px-3 py-2.5 text-center">
                                                    {id ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={has(id)}
                                                            onChange={() => toggle(id)}
                                                            disabled={data.is_super}
                                                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70">
                        <Icon name={editing ? 'check' : 'plus'} className="h-4 w-4" /> {editing ? 'Save Role' : 'Create Role'}
                    </button>
                    <Link href={route('roles.index')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                        <Icon name="x" className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
