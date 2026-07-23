import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Countdown } from '@/Components/ui/Countdown';
import { AttachmentViewer } from '@/Components/ui/AttachmentViewer';
import { RichTextEditor } from '@/Components/ui/RichTextEditor';
import { MultiCombobox } from '@/Components/ui/Combobox';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const STATUS_OPTS = [['todo', 'To Do'], ['in_progress', 'In Progress'], ['under_review', 'Under Review'], ['done', 'Done'], ['blocked', 'Blocked']];
const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };

// Solid pill colors for the hero band (readable on the blue gradient).
const HERO_STATUS = { todo: 'bg-emerald-500', in_progress: 'bg-sky-500', under_review: 'bg-amber-500', done: 'bg-green-600', blocked: 'bg-rose-500' };
const HERO_PRIORITY = { urgent: 'bg-red-600', high: 'bg-rose-500', normal: 'bg-blue-500', low: 'bg-slate-500' };
const HERO_PLATFORM = { web: 'bg-violet-500', android: 'bg-teal-500', both: 'bg-fuchsia-500' };
const PLATFORM_LABEL = { web: 'Web', android: 'Android', both: 'Web+Android' };

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function isImage(ft) {
    return (ft ?? '').startsWith('image/');
}

function Attachments({ items }) {
    if (!items?.length) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {items.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                    {isImage(a.file_type) ? (
                        <img src={a.url} alt={a.title} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                            <Icon name="projects" className="h-4 w-4 text-slate-400" /> {a.title}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
}

/** Empty check for rich-text HTML (ignores empty tags / &nbsp;). */
function richEmpty(html = '') {
    return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** Copy text — clipboard API on secure contexts, execCommand fallback for http:// (production). */
function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            ok ? resolve() : reject();
        } catch (e) {
            reject(e);
        }
    });
}

function CommentForm({ taskUuid, parentId = null, onDone, compact }) {
    const fileRef = useRef();
    const { data, setData, post, processing, reset, errors } = useForm({ body: '', parent_id: parentId, files: [] });

    const submit = (e) => {
        e.preventDefault();
        if (richEmpty(data.body)) return;
        post(route('comments.store', taskUuid), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { reset(); onDone?.(); },
        });
    };

    return (
        <form onSubmit={submit} className="mt-2">
            <RichTextEditor value={data.body} onChange={(html) => setData('body', html)} placeholder={parentId ? 'Write a reply…' : 'Write a comment…'} />
            {errors.body && <p className="mt-1 text-sm text-rose-500">{errors.body}</p>}
            {data.files.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{data.files.length} file(s) attached</p>
            )}
            <div className="mt-2 flex items-center gap-2">
                <button type="submit" disabled={processing || richEmpty(data.body)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                    <Icon name="check" className="h-4 w-4" /> {parentId ? 'Reply' : 'Comment'}
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <Icon name="projects" className="h-4 w-4" /> Attach
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setData('files', Array.from(e.target.files ?? []))} />
                {parentId && <button type="button" onClick={onDone} className="text-sm text-slate-400 hover:text-slate-700">Cancel</button>}
            </div>
        </form>
    );
}

function CommentItem({ c, taskUuid, depth = 0 }) {
    const [replying, setReplying] = useState(false);

    return (
        <div className={`flex gap-3 ${depth > 0 ? 'mt-3' : 'py-3'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(c.author)}</span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.author}</span>
                    <span className="text-xs text-slate-400">{c.created_at}</span>
                </div>
                <div className="rich mt-0.5 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: c.body }} />
                <Attachments items={c.attachments} />
                <div className="mt-1.5 flex items-center gap-3">
                    <button onClick={() => setReplying((v) => !v)} className="text-xs font-medium text-brand-600 hover:underline">Reply</button>
                    {c.can_delete && <button onClick={() => { if (confirm('Delete this comment?')) router.delete(route('comments.destroy', c.id), { preserveScroll: true }); }} className="text-xs font-medium text-rose-500 hover:underline">Delete</button>}
                </div>
                {replying && <CommentForm taskUuid={taskUuid} parentId={c.id} compact onDone={() => setReplying(false)} />}

                {c.replies?.length > 0 && (
                    <div className="mt-2 border-l-2 border-slate-100 pl-3">
                        {c.replies.map((r) => <CommentItem key={r.id} c={r} taskUuid={taskUuid} depth={depth + 1} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function AnswerForm({ taskUuid }) {
    const fileRef = useRef();
    const { data, setData, post, processing, reset, errors } = useForm({ body: '', files: [] });
    const submit = (e) => {
        e.preventDefault();
        post(route('answers.store', taskUuid), { forceFormData: true, preserveScroll: true, onSuccess: () => reset() });
    };
    return (
        <form onSubmit={submit} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <RichTextEditor value={data.body} onChange={(html) => setData('body', html)} placeholder="Write your answer / deliverable…" />
            {errors.body && <p className="mt-1 text-sm text-rose-500">{errors.body}</p>}
            {data.files.length > 0 && <p className="mt-1 text-xs text-slate-500">{data.files.length} file(s) attached</p>}
            <div className="mt-2 flex items-center gap-2">
                <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                    <Icon name="check" className="h-4 w-4" /> Post Answer
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <Icon name="projects" className="h-4 w-4" /> Attach
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setData('files', Array.from(e.target.files ?? []))} />
            </div>
        </form>
    );
}

function AnswerItem({ a, canAccept }) {
    return (
        <div className={`rounded-xl border p-4 ${a.is_accepted ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(a.author)}</span>
                    <span className="text-sm font-semibold text-slate-800">{a.author}</span>
                    <span className="text-xs text-slate-400">{a.created_at}</span>
                    {a.is_accepted && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white"><Icon name="check" className="h-3 w-3" /> Accepted</span>}
                </div>
                <div className="flex items-center gap-2">
                    {canAccept && (
                        <button onClick={() => router.patch(route('answers.accept', a.id), {}, { preserveScroll: true })} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${a.is_accepted ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}>
                            {a.is_accepted ? 'Unaccept' : 'Accept'}
                        </button>
                    )}
                    {a.can_delete && <button onClick={() => { if (confirm('Delete this answer?')) router.delete(route('answers.destroy', a.id), { preserveScroll: true }); }} className="text-xs font-medium text-rose-500 hover:underline">Delete</button>}
                </div>
            </div>
            <div className="rich mt-2 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: a.body }} />
            <Attachments items={a.attachments} />
        </div>
    );
}

function AvatarStack({ names = [], tone = 'bg-brand-500' }) {
    if (!names.length) return <span className="text-sm text-slate-400">—</span>;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {names.slice(0, 4).map((n, i) => (
                    <span key={i} title={n} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${tone}`}>{initials(n)}</span>
                ))}
                {names.length > 4 && <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[10px] font-bold text-slate-700">+{names.length - 4}</span>}
            </div>
        </div>
    );
}

function WatchersEditor({ task, users }) {
    const [ids, setIds] = useState(task.watcher_ids ?? []);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const userOpts = users.map((u) => ({ value: u.id, label: u.employee_id ? `${u.name} (${u.employee_id})` : u.name, hint: u.employee_id }));

    const save = () => {
        setSaving(true);
        router.patch(route('tasks.watchers', task.uuid), { watcher_ids: ids }, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tag / Watchers ({task.watchers?.length ?? 0})</span>
                {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"><Icon name="edit" className="h-3.5 w-3.5" /> Edit</button>}
            </div>

            {editing ? (
                <>
                    <MultiCombobox options={userOpts} values={ids} onChange={setIds} placeholder="Tag members to notify…" />
                    <p className="mt-1.5 text-xs text-slate-400">Watchers get reminder &amp; overdue notifications, but aren't responsible.</p>
                    <div className="mt-2 flex items-center gap-2">
                        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                            <Icon name="check" className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => { setIds(task.watcher_ids ?? []); setEditing(false); }} className="text-xs font-medium text-slate-400 hover:text-slate-700">Cancel</button>
                    </div>
                </>
            ) : task.watchers?.length ? (
                <div className="flex flex-wrap gap-1.5">
                    {task.watchers.map((w) => (
                        <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">{initials(w.name)}</span>
                            {w.name}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-400">No one tagged yet.</p>
            )}
        </div>
    );
}

export default function Show({ task, comments, users = [], canChangeStatus, canModify, canAnswer, canAccept }) {
    const fileRef = useRef();
    const [shareCopied, setShareCopied] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [tab, setTab] = useState('answers');
    const answered = task.answers.some((a) => a.is_accepted);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/tasks/${task.task_no}`;
    const changeStatus = (status) => {
        if (status !== task.status) router.patch(route('tasks.status', task.uuid), { status }, { preserveScroll: true });
    };
    const uploadFile = (file) => {
        if (file) router.post(route('tasks.attachments.store', task.uuid), { file }, { forceFormData: true, preserveScroll: true, onError: (e) => alert(e.file ?? 'Upload failed.') });
    };
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={task.title}
                    subtitle={<>#{task.task_no} · in <Link href={route('projects.show', task.project_uuid)} className="text-brand-600 hover:underline">{task.project}</Link></>}
                    actions={
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShareOpen((v) => !v)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                                    Share
                                </button>
                                {shareOpen && (
                                    <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                                        <p className="mb-1.5 text-xs font-semibold text-slate-700">Public read-only link</p>
                                        <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 outline-none" />
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    copyText(shareUrl).then(() => setShareCopied(true), () => {});
                                                    setTimeout(() => setShareCopied(false), 2000);
                                                }}
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                                            >
                                                <Icon name="check" className="h-3.5 w-3.5" /> {shareCopied ? 'Copied!' : 'Copy link'}
                                            </button>
                                            <a href={shareUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                                <Icon name="eye" className="h-3.5 w-3.5" /> Open
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Link href={route('tasks.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Back
                            </Link>
                            {canModify && (
                                <Link href={route('tasks.edit', task.uuid)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                                    <Icon name="edit" className="h-4 w-4" /> Edit
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={task.title} />

            {/* Hero band */}
            <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500 px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-medium text-brand-100">
                                <span className="rounded-full bg-white/15 px-2 py-0.5">#{task.task_no}</span>
                                <span>·</span>
                                <Link href={route('projects.show', task.project_uuid)} className="hover:text-white hover:underline">{task.project}</Link>
                            </div>
                            <h1 className="mt-1.5 text-xl font-bold text-white">{task.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${HERO_STATUS[task.status] ?? 'bg-white/20'}`}>{TASK_LABEL[task.status] ?? task.status}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-sm ${HERO_PRIORITY[task.priority] ?? 'bg-white/20'}`}>{task.priority}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${HERO_PLATFORM[task.platform] ?? 'bg-white/20'}`}>{PLATFORM_LABEL[task.platform] ?? task.platform}</span>
                            </div>
                        </div>
                        <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
                            <Countdown dueDate={task.due_date} status={task.status} completedAt={task.completed_at} />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid items-start gap-6 lg:grid-cols-3">
                {/* Task detail — sticky sidebar */}
                <Card className="p-5 lg:col-span-1 lg:sticky lg:top-6">
                    {/* Status */}
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</label>
                    {canChangeStatus ? (
                        <select
                            value={task.status}
                            onChange={(e) => changeStatus(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        >
                            {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ) : (
                        <Badge tone={TASK_TONE[task.status] ?? 'slate'}>{TASK_LABEL[task.status] ?? task.status}</Badge>
                    )}

                    {/* Description */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                        {task.description
                            ? <div className="rich text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: task.description }} />
                            : <p className="text-sm text-slate-400">No description.</p>}
                    </div>

                    {/* People */}
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assignees</span>
                            <AvatarStack names={task.assignees} />
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reporter</span>
                            <span className="font-medium text-slate-700">{task.reporter ?? '—'}</span>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                        <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-slate-400">Start</p><p className="text-sm font-semibold text-slate-800">{fmt(task.start_date)}</p></div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-slate-400">Due</p><p className="text-sm font-semibold text-slate-800">{fmt(task.due_date)}</p></div>
                        {task.completed_at && <div className="col-span-2 rounded-lg bg-emerald-50 px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-emerald-500">Completed</p><p className="text-sm font-semibold text-emerald-700">{fmt(task.completed_at)}</p></div>}
                        {task.parent && (
                            <div className="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <span className="text-[11px] uppercase tracking-wide text-slate-400">Parent</span>
                                <Link href={route('tasks.show', task.parent.uuid)} className="truncate text-sm font-medium text-brand-600 hover:underline">{task.parent.title}</Link>
                            </div>
                        )}
                    </div>

                    {canModify ? (
                        <WatchersEditor task={task} users={users} />
                    ) : (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tag / Watchers ({task.watchers?.length ?? 0})</span>
                            {task.watchers?.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {task.watchers.map((w) => (
                                        <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">{initials(w.name)}</span>
                                            {w.name}
                                        </span>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-400">No one tagged yet.</p>}
                        </div>
                    )}

                    {task.subtasks?.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sub-tasks ({task.subtasks.length})</p>
                            <ul className="space-y-1">
                                {task.subtasks.map((s) => (
                                    <li key={s.uuid} className="flex items-center justify-between gap-2 text-sm">
                                        <Link href={route('tasks.show', s.uuid)} className="min-w-0 truncate text-slate-700 hover:text-brand-700">{s.title}</Link>
                                        <Badge tone={TASK_TONE[s.status] ?? 'slate'}>{TASK_LABEL[s.status] ?? s.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Attachments */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments ({task.attachments.length})</span>
                            {canModify && (
                                <>
                                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                                        <Icon name="plus" className="h-3.5 w-3.5" /> Add
                                    </button>
                                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; uploadFile(f); }} />
                                </>
                            )}
                        </div>
                        {task.attachments.length === 0
                            ? <p className="text-xs text-slate-400">No attachments yet.</p>
                            : <AttachmentViewer items={task.attachments} />}
                    </div>
                </Card>

                {/* Right: tabbed Answers / Discussion */}
                <Card className="overflow-hidden lg:col-span-2">
                    <div className="flex items-center gap-1 border-b border-slate-100 px-3 pt-3">
                        <button
                            onClick={() => setTab('answers')}
                            className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${tab === 'answers' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Icon name="check" className="h-4 w-4" /> Answers
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-100 px-1.5 text-xs font-bold text-brand-700">{task.answers.length}</span>
                            {answered
                                ? <span className="ml-1 hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white sm:inline">Answered</span>
                                : <span className="ml-1 hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 sm:inline">Pending</span>}
                        </button>
                        <button
                            onClick={() => setTab('discussion')}
                            className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${tab === 'discussion' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            Discussion
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-bold text-slate-600">{comments.length}</span>
                        </button>
                    </div>

                    {/* Answers tab */}
                    <div className={`p-5 ${tab === 'answers' ? '' : 'hidden'}`}>
                        {canAnswer && <div className="mb-4"><AnswerForm taskUuid={task.uuid} /></div>}
                        {task.answers.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><Icon name="check" className="h-6 w-6" /></span>
                                <p className="mt-3 text-sm text-slate-400">{canAnswer ? 'No answers yet — post the first one above.' : 'No answers submitted yet.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {task.answers.map((a) => <AnswerItem key={a.id} a={a} canAccept={canAccept} />)}
                            </div>
                        )}
                    </div>

                    {/* Discussion tab */}
                    <div className={`p-5 ${tab === 'discussion' ? '' : 'hidden'}`}>
                        <CommentForm taskUuid={task.uuid} />
                        <div className="mt-4 divide-y divide-slate-100">
                            {comments.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></span>
                                    <p className="mt-3 text-sm text-slate-400">No comments yet. Start the discussion.</p>
                                </div>
                            ) : (
                                comments.map((c) => <CommentItem key={c.id} c={c} taskUuid={task.uuid} />)
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
