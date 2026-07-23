import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Combobox, MultiCombobox } from '@/Components/ui/Combobox';
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

const PRIORITIES = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
];
const STATUSES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'done', label: 'Done' },
    { value: 'blocked', label: 'Blocked' },
];

export default function Create({ projects, users, parentTasks = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '',
        parent_task_id: '',
        title: '',
        description: '',
        start_date: '',
        due_date: '',
        priority: 'normal',
        status: 'todo',
        platform: 'web',
        estimated_hours: '',
        assignee_ids: [],
        watcher_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tasks.store'));
    };

    const projectOpts = projects.map((p) => ({ value: p.id, label: p.name }));
    const userOpts = users.map((u) => ({ value: u.id, label: u.employee_id ? u.name + ' (' + u.employee_id + ')' : u.name, hint: u.employee_id }));
    const projName = (id) => projects.find((p) => String(p.id) === String(id))?.name;
    const parentOpts = parentTasks.map((t) => ({ value: t.id, label: t.title, hint: projName(t.project_id) }));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="New Task"
                    subtitle="Create a task and assign it."
                    actions={
                        <Link href={route('tasks.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back
                        </Link>
                    }
                />
            }
        >
            <Head title="New Task" />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Details</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Project" required error={errors.project_id}>
                            <Combobox options={projectOpts} value={data.project_id} onChange={(v) => setData('project_id', v)} placeholder="Select project…" />
                        </Field>
                        <Field label="Task Name" required error={errors.title}>
                            <input className={inputCls} value={data.title} onChange={(e) => setData('title', e.target.value)} autoFocus />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Parent Task (optional)" error={errors.parent_task_id}>
                                <Combobox options={parentOpts} value={data.parent_task_id} onChange={(v) => setData('parent_task_id', v)} placeholder="Search a parent task…" />
                            </Field>
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="Description / Notes" error={errors.description}>
                                <RichTextEditor value={data.description} onChange={(html) => setData('description', html)} />
                            </Field>
                        </div>
                        <Field label="Start Date" required error={errors.start_date}>
                            <input type="date" className={inputCls} value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                        </Field>
                        <Field label="End Date" required error={errors.due_date}>
                            <input type="date" className={inputCls} value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                        </Field>
                        <Field label="Priority" required error={errors.priority}>
                            <select className={inputCls} value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                                {PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Status" required error={errors.status}>
                            <select className={inputCls} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Platform" required error={errors.platform}>
                            <select className={inputCls} value={data.platform} onChange={(e) => setData('platform', e.target.value)}>
                                {[['web', 'Web'], ['android', 'Android'], ['ios', 'iOS']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Field>
                        <Field label="Estimated Hours" error={errors.estimated_hours}>
                            <input type="number" step="0.5" min="0" className={inputCls} value={data.estimated_hours} onChange={(e) => setData('estimated_hours', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>People</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Assigned To" required error={errors.assignee_ids}>
                            <MultiCombobox options={userOpts} values={data.assignee_ids} onChange={(v) => setData('assignee_ids', v)} placeholder="Search to assign…" />
                        </Field>
                        <Field label="Tag / Watchers (optional)" error={errors.watcher_ids}>
                            <MultiCombobox options={userOpts} values={data.watcher_ids} onChange={(v) => setData('watcher_ids', v)} placeholder="Tag members to notify…" />
                        </Field>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Watchers get task reminder &amp; overdue notifications but aren't responsible for it.</p>
                </Card>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70"
                    >
                        <Icon name="plus" className="h-4 w-4" /> Create Task
                    </button>
                    <Link href={route('tasks.index')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                        <Icon name="x" className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
