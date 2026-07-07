import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { MultiCombobox } from '@/Components/ui/Combobox';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const WEEKDAYS = [[0, 'Sunday'], [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday']];
const WEEKS = [[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [5, '5th']];
const OFFSETS = [[0, 'Same day'], [1, '1 day before'], [2, '2 days before'], [3, '3 days before']];
const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function Chip({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {children}
        </button>
    );
}

export default function Settings({ settings, users }) {
    const { data, setData, patch, processing, errors } = useForm({
        enabled: settings.enabled,
        weekday: settings.weekday,
        weeks: settings.weeks ?? [1, 3],
        meeting_time: settings.meeting_time ? settings.meeting_time.slice(0, 5) : '11:00',
        reminder_offsets: settings.reminder_offsets ?? [2, 1],
        invite_all: settings.invite_all,
        invitee_ids: settings.invitee_ids ?? [],
    });

    const userOpts = users.map((u) => ({ value: u.id, label: u.employee_id ? `${u.name} (${u.employee_id})` : u.name, hint: u.employee_id }));

    const toggle = (key, val) => {
        const cur = data[key];
        setData(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val].sort((a, b) => a - b));
    };
    const submit = (e) => { e.preventDefault(); patch(route('meetings.settings.update')); };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Meeting Schedule"
                    subtitle="Control the recurring meeting schedule and reminders."
                    actions={<Link href={route('meetings.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back</Link>}
                />
            }
        >
            <Head title="Meeting Schedule" />

            <form onSubmit={submit} className="space-y-5">
                <Card className="p-5">
                    <SectionTitle>Recurrence</SectionTitle>

                    <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        Auto-generate meetings each month
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Day of week</label>
                            <select className={inputCls} value={data.weekday} onChange={(e) => setData('weekday', Number(e.target.value))}>
                                {WEEKDAYS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Meeting time</label>
                            <input type="time" className={inputCls} value={data.meeting_time} onChange={(e) => setData('meeting_time', e.target.value)} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Weeks of month</label>
                        <div className="flex flex-wrap gap-2">
                            {WEEKS.map(([v, l]) => <Chip key={v} active={data.weeks.includes(v)} onClick={() => toggle('weeks', v)}>{l} week</Chip>)}
                        </div>
                        {errors.weeks && <p className="mt-1.5 text-sm text-rose-500">{errors.weeks}</p>}
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Reminders</SectionTitle>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Send reminder email…</label>
                    <div className="flex flex-wrap gap-2">
                        {OFFSETS.map(([v, l]) => <Chip key={v} active={data.reminder_offsets.includes(v)} onClick={() => toggle('reminder_offsets', v)}>{l}</Chip>)}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">e.g. for a Monday meeting, "2 days before" = Saturday, "1 day before" = Sunday.</p>

                    <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={data.invite_all} onChange={(e) => setData('invite_all', e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        Auto-invite <span className="font-semibold">all</span> active users to generated meetings
                    </label>

                    {!data.invite_all && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Reminder recipients</label>
                            <p className="mb-2.5 text-xs text-slate-400">Only these members are auto-invited &amp; emailed for generated meetings.</p>
                            <MultiCombobox options={userOpts} values={data.invitee_ids} onChange={(v) => setData('invitee_ids', v)} placeholder="Search members to add…" />
                            {errors.invitee_ids && <p className="mt-1.5 text-sm text-rose-500">{errors.invitee_ids}</p>}
                        </div>
                    )}
                </Card>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-70">
                        <Icon name="check" className="h-4 w-4" /> Save Schedule
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
