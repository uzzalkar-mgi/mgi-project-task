import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Combobox, MultiCombobox } from '@/Components/ui/Combobox';
import { TagInput } from '@/Components/ui/TagInput';
import { RichTextEditor } from '@/Components/ui/RichTextEditor';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
        </div>
    );
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function Edit({ project, users, tags }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: project.name ?? '',
        description: project.description ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        priority: project.priority ?? 'medium',
        status: project.status ?? 'active',
        lead_user_id: project.lead_user_id ?? '',
        primary_responsible_id: project.primary_responsible_id ?? '',
        secondary_responsible_id: project.secondary_responsible_id ?? '',
        member_ids: project.member_ids ?? [],
        tags: project.tags ?? [],
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('projects.update', project.uuid));
    };

    const userOpts = users.map((u) => ({ value: u.id, label: u.employee_id ? u.name + ' (' + u.employee_id + ')' : u.name, hint: u.employee_id }));
    const tagNames = tags.map((t) => t.name);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Edit Project"
                    subtitle={project.name}
                    actions={
                        <Link href={route('projects.show', project.uuid)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back
                        </Link>
                    }
                />
            }
        >
            <Head title="Edit Project" />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Details</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Project Name" required error={errors.name}>
                                <input className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                            </Field>
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="Description" error={errors.description}>
                                <RichTextEditor value={data.description} onChange={(html) => setData('description', html)} />
                            </Field>
                        </div>
                        <Field label="Start Date" required error={errors.start_date}>
                            <input type="date" className={inputCls} value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                        </Field>
                        <Field label="End Date" required error={errors.end_date}>
                            <input type="date" className={inputCls} value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                        </Field>
                        <Field label="Priority" required error={errors.priority}>
                            <select className={inputCls} value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                                {[['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Field>
                        <Field label="Status" required error={errors.status}>
                            <select className={inputCls} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {[['active', 'Active'], ['on_hold', 'On Hold'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Field>
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Accountability</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Project Lead" required error={errors.lead_user_id}>
                            <Combobox options={userOpts} value={data.lead_user_id} onChange={(v) => setData('lead_user_id', v)} />
                        </Field>
                        <Field label="Primary Responsible" required error={errors.primary_responsible_id}>
                            <Combobox options={userOpts} value={data.primary_responsible_id} onChange={(v) => setData('primary_responsible_id', v)} />
                        </Field>
                        <Field label="Secondary Responsible" error={errors.secondary_responsible_id}>
                            <Combobox options={userOpts} value={data.secondary_responsible_id} onChange={(v) => setData('secondary_responsible_id', v)} placeholder="None" />
                        </Field>
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Team & Tags</SectionTitle>
                    <Field label="Team Members" error={errors.member_ids}>
                        <MultiCombobox options={userOpts} values={data.member_ids} onChange={(v) => setData('member_ids', v)} placeholder="Search to add members…" />
                    </Field>
                    <div className="mt-4">
                        <Field label="Tags" error={errors.tags}>
                            <TagInput value={data.tags} onChange={(v) => setData('tags', v)} suggestions={tagNames} />
                        </Field>
                    </div>
                </Card>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70"
                    >
                        <Icon name="check" className="h-4 w-4" /> Save Changes
                    </button>
                    <Link href={route('projects.show', project.uuid)} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                        <Icon name="x" className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
