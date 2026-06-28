import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Combobox } from '@/Components/ui/Combobox';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label} {required && <span className="text-rose-500">*</span>}</label>
            {children}
            {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
        </div>
    );
}

export default function Form({ user, roles, departments, designations, assigned }) {
    const editing = Boolean(user);
    const { data, setData, post, patch, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        employee_id: user?.employee_id ?? '',
        office_contact: user?.office_contact ?? '',
        department_id: user?.department_id ?? '',
        designation_id: user?.designation_id ?? '',
        password: '',
        password_confirmation: '',
        status: user?.status ?? 1,
        role_ids: assigned ?? [],
    });

    const deptOpts = departments.map((d) => ({ value: d.id, label: d.name }));
    // Designations filtered to the chosen department (or all if none chosen / unscoped).
    const desigOpts = designations
        .filter((d) => !data.department_id || !d.department_id || String(d.department_id) === String(data.department_id))
        .map((d) => ({ value: d.id, label: d.name }));

    const submit = (e) => {
        e.preventDefault();
        editing ? patch(route('users.update', user.uuid)) : post(route('users.store'));
    };

    const toggleRole = (id) => setData('role_ids', data.role_ids.includes(id) ? data.role_ids.filter((x) => x !== id) : [...data.role_ids, id]);

    return (
        <AuthenticatedLayout header={<PageHeader title={editing ? `Edit User: ${user.name}` : 'New User'} subtitle="Create an account and assign one or more roles." />}>
            <Head title={editing ? 'Edit User' : 'New User'} />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Account</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" required error={errors.name}>
                            <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                        </Field>
                        <Field label="Email" required error={errors.email}>
                            <input type="email" className={inputCls} value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        </Field>
                        <Field label="Employee ID" required error={errors.employee_id}>
                            <input className={inputCls} value={data.employee_id} onChange={(e) => setData('employee_id', e.target.value)} />
                        </Field>
                        <Field label="Office Contact" error={errors.office_contact}>
                            <input className={inputCls} value={data.office_contact} onChange={(e) => setData('office_contact', e.target.value)} />
                        </Field>
                        <Field label="Department" error={errors.department_id}>
                            <Combobox options={deptOpts} value={data.department_id} onChange={(v) => { setData('department_id', v); setData('designation_id', ''); }} placeholder="Select department…" />
                        </Field>
                        <Field label="Designation" error={errors.designation_id}>
                            <Combobox options={desigOpts} value={data.designation_id} onChange={(v) => setData('designation_id', v)} placeholder="Select designation…" />
                        </Field>
                        <Field label={editing ? 'New Password' : 'Password'} required={!editing} error={errors.password}>
                            <input type="password" className={inputCls} value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder={editing ? 'Leave blank to keep current' : ''} autoComplete="new-password" />
                        </Field>
                        <Field label="Confirm Password" error={errors.password_confirmation}>
                            <input type="password" className={inputCls} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" />
                        </Field>
                    </div>
                    <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={data.status === 1} onChange={(e) => setData('status', e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        Active
                    </label>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Roles</SectionTitle>
                    <p className="mb-2 text-xs text-slate-500">A user can hold multiple roles — permissions are the union of all assigned roles.</p>
                    <div className="flex flex-wrap gap-2">
                        {roles.map((r) => (
                            <label key={r.id} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${data.role_ids.includes(r.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={data.role_ids.includes(r.id)} onChange={() => toggleRole(r.id)} className="hidden" />
                                {r.name}
                            </label>
                        ))}
                    </div>
                    {errors.role_ids && <p className="mt-1.5 text-sm text-rose-500">{errors.role_ids}</p>}
                </Card>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70">
                        <Icon name={editing ? 'check' : 'plus'} className="h-4 w-4" /> {editing ? 'Save User' : 'Create User'}
                    </button>
                    <Link href={route('users.index')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                        <Icon name="x" className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
