import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { RichTextEditor } from '@/Components/ui/RichTextEditor';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_TONE = { scheduled: 'blue', completed: 'green', cancelled: 'red' };

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDT(d) {
    if (!d) return '';
    return new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function MetaTile({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm"><Icon name={icon} className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p><p className="truncate text-sm font-semibold text-slate-800">{value}</p></div>
        </div>
    );
}

export default function Show({ meeting, canManage, canAttendance }) {
    const [present, setPresent] = useState(() => new Set(meeting.invitees.filter((i) => i.attended).map((i) => i.id)));
    const [savingAtt, setSavingAtt] = useState(false);
    const attendedCount = meeting.invitees.filter((i) => i.attended).length;

    const toggle = (id) => setPresent((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const allOn = present.size === meeting.invitees.length && meeting.invitees.length > 0;
    const toggleAll = () => setPresent(allOn ? new Set() : new Set(meeting.invitees.map((i) => i.id)));
    const saveAttendance = () => {
        setSavingAtt(true);
        router.patch(route('meetings.attendance', meeting.uuid), { attendee_ids: [...present] }, { preserveScroll: true, onFinish: () => setSavingAtt(false) });
    };

    const disc = useForm({ discussion: meeting.discussion ?? '', status: meeting.status });
    const saveDiscussion = (e) => { e.preventDefault(); disc.patch(route('meetings.discussion', meeting.uuid), { preserveScroll: true }); };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={meeting.title}
                    subtitle="Meeting details, attendance & minutes"
                    actions={
                        <div className="flex items-center gap-2">
                            {canManage && <Link href={route('meetings.edit', meeting.uuid)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Icon name="edit" className="h-4 w-4" /> Edit</Link>}
                            <Link href={route('meetings.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back</Link>
                        </div>
                    }
                />
            }
        >
            <Head title={meeting.title} />

            {/* Meta strip */}
            <Card className="mb-6 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[meeting.status] ?? 'slate'}>{meeting.status}</Badge>
                    <Badge tone={meeting.reminder_sent ? 'green' : 'slate'}>{meeting.reminder_sent ? 'Reminder sent' : 'Reminder pending'}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetaTile icon="calendar" label="Date" value={fmt(meeting.meeting_date)} />
                    <MetaTile icon="timeline" label="Time" value={meeting.meeting_time ? meeting.meeting_time.slice(0, 5) : '—'} />
                    <MetaTile icon="team" label="Attendance" value={`${attendedCount} / ${meeting.invitees.length}`} />
                    <MetaTile icon="user" label="Created by" value={meeting.created_by ?? '—'} />
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Attendance */}
                <Card className="p-5 lg:col-span-1">
                    <div className="mb-3 flex items-center justify-between">
                        <SectionTitle>Attendance</SectionTitle>
                        {canAttendance && meeting.invitees.length > 0 && (
                            <button onClick={toggleAll} className="text-xs font-medium text-brand-600 hover:underline">{allOn ? 'Clear all' : 'Select all'}</button>
                        )}
                    </div>
                    {meeting.invitees.length === 0 ? (
                        <p className="text-sm text-slate-400">No invitees.</p>
                    ) : (
                        <ul className="space-y-1">
                            {meeting.invitees.map((u) => {
                                const on = present.has(u.id);
                                return (
                                    <li key={u.id} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition ${on ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                        <label className="flex min-w-0 items-center gap-2.5">
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${on ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700'}`}>{on ? '✓' : initials(u.name)}</span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm text-slate-800">{u.name}</span>
                                                <span className="block text-xs text-slate-400">{u.employee_id ?? ''}{u.attended && u.attended_at ? ` · ${fmtDT(u.attended_at)}` : ''}</span>
                                            </span>
                                        </label>
                                        {canAttendance && <input type="checkbox" checked={on} onChange={() => toggle(u.id)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {canAttendance && meeting.invitees.length > 0 && (
                        <button onClick={saveAttendance} disabled={savingAtt} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
                            <Icon name="check" className="h-4 w-4" /> {savingAtt ? 'Saving…' : 'Save Attendance'}
                        </button>
                    )}
                </Card>

                {/* Discussion */}
                <Card className="p-5 lg:col-span-2">
                    <SectionTitle>Discussion / Minutes</SectionTitle>
                    {canManage ? (
                        <form onSubmit={saveDiscussion}>
                            <RichTextEditor value={disc.data.discussion} onChange={(html) => disc.setData('discussion', html)} placeholder="Record the meeting discussion…" />
                            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
                                    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                                        {[['scheduled', 'Scheduled'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([v, l]) => (
                                            <button key={v} type="button" onClick={() => disc.setData('status', v)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${disc.data.status === v ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={disc.processing} className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70">
                                    <Icon name="check" className="h-4 w-4" /> {disc.processing ? 'Saving…' : 'Save Discussion'}
                                </button>
                            </div>
                        </form>
                    ) : meeting.discussion ? (
                        <div className="rich" dangerouslySetInnerHTML={{ __html: meeting.discussion }} />
                    ) : (
                        <p className="text-sm text-slate-400">No discussion recorded yet.</p>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
