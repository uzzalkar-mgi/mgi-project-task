import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { RichTextEditor } from '@/Components/ui/RichTextEditor';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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

const inputCls = 'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function AgendaSection({ meeting, canManage, users }) {
    const f = useForm({ title: '', owner_id: '', minutes: '' });
    const add = (e) => { e.preventDefault(); f.post(route('meetings.agenda.add', meeting.uuid), { preserveScroll: true, onSuccess: () => f.reset() }); };
    return (
        <Card className="p-5">
            <SectionTitle>Agenda ({meeting.agenda.length})</SectionTitle>
            {meeting.agenda.length === 0 ? <p className="text-sm text-slate-400">No agenda items.</p> : (
                <ul className="mb-3 space-y-1.5">
                    {meeting.agenda.map((a) => (
                        <li key={a.id} className={`flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 ${a.done ? 'bg-emerald-50/60' : ''}`}>
                            {canManage && <input type="checkbox" checked={a.done} onChange={() => router.patch(route('meetings.agenda.toggle', a.id), {}, { preserveScroll: true })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />}
                            <span className={`flex-1 text-sm ${a.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{a.title}</span>
                            {a.owner && <span className="text-xs text-slate-400">{a.owner}</span>}
                            {a.minutes ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{a.minutes}m</span> : null}
                            {canManage && <button onClick={() => router.delete(route('meetings.agenda.delete', a.id), { preserveScroll: true })} className="text-xs text-rose-400 hover:text-rose-600">✕</button>}
                        </li>
                    ))}
                </ul>
            )}
            {canManage && (
                <form onSubmit={add} className="flex flex-wrap items-center gap-2">
                    <input className={`${inputCls} flex-1 min-w-[160px]`} placeholder="Topic…" value={f.data.title} onChange={(e) => f.setData('title', e.target.value)} />
                    <select className={inputCls} value={f.data.owner_id} onChange={(e) => f.setData('owner_id', e.target.value)}>
                        <option value="">Owner…</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input type="number" min="0" className={`${inputCls} w-20`} placeholder="min" value={f.data.minutes} onChange={(e) => f.setData('minutes', e.target.value)} />
                    <button type="submit" disabled={f.processing || !f.data.title.trim()} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Add</button>
                </form>
            )}
        </Card>
    );
}

function ActionItemsSection({ meeting, canManage, users, projects }) {
    const f = useForm({ title: '', assignee_id: '', due_date: '' });
    const add = (e) => { e.preventDefault(); f.post(route('meetings.actions.add', meeting.uuid), { preserveScroll: true, onSuccess: () => f.reset() }); };
    const convert = (a) => {
        const project_id = prompt('Convert to task — enter project name exactly:\n' + projects.map((p) => p.name).join('\n'));
        const proj = projects.find((p) => p.name.toLowerCase() === (project_id ?? '').toLowerCase());
        if (!proj) return alert('Project not found.');
        const assignee_id = a.assignee ? users.find((u) => u.name === a.assignee)?.id : null;
        const due = a.due_date || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
        router.post(route('meetings.actions.convert', a.id), { project_id: proj.id, assignee_id: assignee_id ?? users[0]?.id, due_date: due }, { preserveScroll: true });
    };
    const openCount = meeting.actions.filter((a) => a.status === 'open').length;
    return (
        <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Action Items ({meeting.actions.length})</SectionTitle>
                {canManage && openCount > 0 && <button onClick={() => router.post(route('meetings.actions.carry', meeting.uuid), {}, { preserveScroll: true })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Carry {openCount} open → next meeting</button>}
            </div>
            {meeting.actions.length === 0 ? <p className="text-sm text-slate-400">No action items.</p> : (
                <ul className="mb-3 space-y-1.5">
                    {meeting.actions.map((a) => (
                        <li key={a.id} className={`flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 ${a.status === 'done' ? 'bg-emerald-50/60' : ''}`}>
                            <input type="checkbox" checked={a.status === 'done'} onChange={() => router.patch(route('meetings.actions.toggle', a.id), {}, { preserveScroll: true })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            <span className={`flex-1 text-sm ${a.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{a.title}{a.carried && <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-600">carried</span>}</span>
                            {a.assignee && <span className="text-xs text-slate-400">{a.assignee}</span>}
                            {a.due_date && <span className="text-xs text-slate-400">{a.due_date}</span>}
                            {a.task_uuid
                                ? <Link href={route('tasks.show', a.task_uuid)} className="text-xs font-medium text-brand-600 hover:underline">task ↗</Link>
                                : canManage && <button onClick={() => convert(a)} className="text-xs font-medium text-brand-600 hover:underline">→ task</button>}
                            {canManage && <button onClick={() => router.delete(route('meetings.actions.delete', a.id), { preserveScroll: true })} className="text-xs text-rose-400 hover:text-rose-600">✕</button>}
                        </li>
                    ))}
                </ul>
            )}
            {canManage && (
                <form onSubmit={add} className="flex flex-wrap items-center gap-2">
                    <input className={`${inputCls} flex-1 min-w-[160px]`} placeholder="Action item…" value={f.data.title} onChange={(e) => f.setData('title', e.target.value)} />
                    <select className={inputCls} value={f.data.assignee_id} onChange={(e) => f.setData('assignee_id', e.target.value)}>
                        <option value="">Assignee…</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input type="date" className={inputCls} value={f.data.due_date} onChange={(e) => f.setData('due_date', e.target.value)} />
                    <button type="submit" disabled={f.processing || !f.data.title.trim()} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Add</button>
                </form>
            )}
        </Card>
    );
}

function SubmissionsSection({ meeting, canManage, currentUserId }) {
    const f = useForm({ body: '' });
    const add = (e) => { e.preventDefault(); f.post(route('meetings.submissions.add', meeting.uuid), { preserveScroll: true, onSuccess: () => f.reset() }); };
    return (
        <Card className="p-5">
            <SectionTitle>Pre-meeting Notes ({meeting.submissions.length})</SectionTitle>
            <p className="mb-3 text-xs text-slate-400">Points invitees want to raise, submitted ahead of time.</p>
            <form onSubmit={add} className="mb-3 flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Add a discussion point…" value={f.data.body} onChange={(e) => f.setData('body', e.target.value)} />
                <button type="submit" disabled={f.processing || !f.data.body.trim()} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Submit</button>
            </form>
            {meeting.submissions.length === 0 ? <p className="text-sm text-slate-400">No submissions yet.</p> : (
                <ul className="space-y-2">
                    {meeting.submissions.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                            <div className="min-w-0">
                                <p className="text-sm text-slate-700">{s.body}</p>
                                <p className="text-xs text-slate-400">{s.author} · {s.at}</p>
                            </div>
                            {(canManage || s.user_id === currentUserId) && <button onClick={() => router.delete(route('meetings.submissions.delete', s.id), { preserveScroll: true })} className="text-xs text-rose-400 hover:text-rose-600">✕</button>}
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function AttachmentsSection({ meeting, canManage }) {
    const upload = (file) => { if (file) router.post(route('meetings.attachments.add', meeting.uuid), { file }, { forceFormData: true, preserveScroll: true, onError: (e) => alert(e.file ?? 'Upload failed.') }); };
    return (
        <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Files ({meeting.attachments.length})</SectionTitle>
                {canManage && (
                    <label className="cursor-pointer rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                        + Attach
                        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(f); }} />
                    </label>
                )}
            </div>
            {meeting.attachments.length === 0 ? <p className="text-sm text-slate-400">No files.</p> : (
                <div className="flex flex-wrap gap-2">
                    {meeting.attachments.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600">
                            <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-brand-700">📎 {a.title}</a>
                            {canManage && <button onClick={() => router.delete(route('meetings.attachments.delete', [meeting.uuid, a.id]), { preserveScroll: true })} className="text-rose-400 hover:text-rose-600">✕</button>}
                        </span>
                    ))}
                </div>
            )}
        </Card>
    );
}

export default function Show({ meeting, canManage, canAttendance, users = [], projects = [] }) {
    const currentUserId = usePage().props.auth.user?.id;
    const locked = meeting.status === 'completed';
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
                            {canManage && meeting.status !== 'completed' && <Link href={route('meetings.edit', meeting.uuid)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Icon name="edit" className="h-4 w-4" /> Edit</Link>}
                            {meeting.status === 'completed' && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600"><Icon name="check" className="h-4 w-4" /> Completed · locked</span>}
                            <a href={route('meetings.ics', meeting.uuid)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Icon name="calendar" className="h-4 w-4" /> Add to calendar</a>
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
                        {canAttendance && !locked && meeting.invitees.length > 0 && (
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
                                        {canAttendance && !locked && <input type="checkbox" checked={on} onChange={() => toggle(u.id)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {canAttendance && !locked && meeting.invitees.length > 0 && (
                        <button onClick={saveAttendance} disabled={savingAtt} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
                            <Icon name="check" className="h-4 w-4" /> {savingAtt ? 'Saving…' : 'Save Attendance'}
                        </button>
                    )}
                    {locked && <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600"><Icon name="check" className="h-3.5 w-3.5" /> Meeting completed — attendance locked.</p>}
                </Card>

                {/* Discussion */}
                <Card className="p-5 lg:col-span-2">
                    <SectionTitle>Discussion / Minutes</SectionTitle>
                    {canManage && !locked ? (
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

            {/* Agenda + Action Items */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <AgendaSection meeting={meeting} canManage={canManage} users={users} />
                <ActionItemsSection meeting={meeting} canManage={canManage} users={users} projects={projects} />
            </div>

            {/* Pre-meeting notes + Files */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <SubmissionsSection meeting={meeting} canManage={canManage} currentUserId={currentUserId} />
                <AttachmentsSection meeting={meeting} canManage={canManage} />
            </div>
        </AuthenticatedLayout>
    );
}
