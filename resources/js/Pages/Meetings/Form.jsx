import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { MultiCombobox } from '@/Components/ui/Combobox';
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

export default function Form({ meeting, users, invited }) {
    const editing = Boolean(meeting);
    const { data, setData, post, patch, processing, errors } = useForm({
        title: meeting?.title ?? '',
        meeting_date: meeting?.meeting_date ?? '',
        meeting_time: meeting?.meeting_time ? meeting.meeting_time.slice(0, 5) : '',
        status: meeting?.status ?? 'scheduled',
        invitee_ids: invited ?? [],
    });

    const submit = (e) => {
        e.preventDefault();
        editing ? patch(route('meetings.update', meeting.uuid)) : post(route('meetings.store'));
    };

    const userOpts = users.map((u) => ({ value: u.id, label: u.employee_id ? u.name + ' (' + u.employee_id + ')' : u.name, hint: u.employee_id }));

    return (
        <AuthenticatedLayout header={<PageHeader title={editing ? 'Edit Meeting' : 'New Meeting'} subtitle="Schedule a meeting and invite members." />}>
            <Head title={editing ? 'Edit Meeting' : 'New Meeting'} />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Details</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Title" required error={errors.title}>
                                <input className={inputCls} value={data.title} onChange={(e) => setData('title', e.target.value)} autoFocus />
                            </Field>
                        </div>
                        <Field label="Date" required error={errors.meeting_date}>
                            <input type="date" className={inputCls} value={data.meeting_date} onChange={(e) => setData('meeting_date', e.target.value)} />
                        </Field>
                        <Field label="Time" error={errors.meeting_time}>
                            <input type="time" className={inputCls} value={data.meeting_time} onChange={(e) => setData('meeting_time', e.target.value)} />
                        </Field>
                        <Field label="Status" error={errors.status}>
                            <select className={inputCls} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {[['scheduled', 'Scheduled'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Field>
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Invitees</SectionTitle>
                    <Field label="Invite members (they get the reminder email)" error={errors.invitee_ids}>
                        <MultiCombobox options={userOpts} values={data.invitee_ids} onChange={(v) => setData('invitee_ids', v)} placeholder="Search to invite…" />
                    </Field>
                </Card>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70">
                        <Icon name={editing ? 'check' : 'plus'} className="h-4 w-4" /> {editing ? 'Save Meeting' : 'Create Meeting'}
                    </button>
                    <Link href={route('meetings.index')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                        <Icon name="x" className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
