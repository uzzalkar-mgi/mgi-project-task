import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { Countdown } from '@/Components/ui/Countdown';
import { AttachmentViewer } from '@/Components/ui/AttachmentViewer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const STATUS_OPTS = [['todo', 'To Do'], ['in_progress', 'In Progress'], ['under_review', 'Under Review'], ['done', 'Done'], ['blocked', 'Blocked']];
const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };

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

function CommentForm({ taskUuid, parentId = null, onDone, compact }) {
    const fileRef = useRef();
    const { data, setData, post, processing, reset, errors } = useForm({ body: '', parent_id: parentId, files: [] });

    const submit = (e) => {
        e.preventDefault();
        post(route('comments.store', taskUuid), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { reset(); onDone?.(); },
        });
    };

    return (
        <form onSubmit={submit} className="mt-2">
            <textarea
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                rows={compact ? 2 : 3}
                placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {errors.body && <p className="mt-1 text-sm text-rose-500">{errors.body}</p>}
            {data.files.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{data.files.length} file(s) attached</p>
            )}
            <div className="mt-2 flex items-center gap-2">
                <button type="submit" disabled={processing || !data.body.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
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

function CommentItem({ c, taskUuid, isReply }) {
    const { auth } = usePage().props;
    const [replying, setReplying] = useState(false);

    return (
        <div className={`flex gap-3 ${isReply ? 'mt-3' : 'py-3'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(c.author)}</span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.author}</span>
                    <span className="text-xs text-slate-400">{c.created_at}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                <Attachments items={c.attachments} />
                {!isReply && (
                    <button onClick={() => setReplying((v) => !v)} className="mt-1.5 text-xs font-medium text-brand-600 hover:underline">Reply</button>
                )}
                {replying && <CommentForm taskUuid={taskUuid} parentId={c.id} compact onDone={() => setReplying(false)} />}

                {c.replies?.length > 0 && (
                    <div className="mt-2 border-l-2 border-slate-100 pl-3">
                        {c.replies.map((r) => <CommentItem key={r.id} c={r} taskUuid={taskUuid} isReply />)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Show({ task, comments, canChangeStatus, canModify }) {
    const fileRef = useRef();
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
                    subtitle={<>in <Link href={route('projects.show', task.project_uuid)} className="text-brand-600 hover:underline">{task.project}</Link></>}
                    actions={
                        <Link href={route('tasks.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back
                        </Link>
                    }
                />
            }
        >
            <Head title={task.title} />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Task detail */}
                <Card className="p-5 lg:col-span-1">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Badge tone={TASK_TONE[task.status] ?? 'slate'}>{TASK_LABEL[task.status] ?? task.status}</Badge>
                        <Badge tone={PRIORITY_TONE[task.priority] ?? 'slate'}>{task.priority}</Badge>
                        <Badge tone={{ web: 'blue', android: 'green', both: 'amber' }[task.platform] ?? 'slate'}>{{ web: 'Web', android: 'Android', both: 'Web+Android' }[task.platform] ?? task.platform}</Badge>
                    </div>
                    <div className="mb-4"><Countdown dueDate={task.due_date} status={task.status} completedAt={task.completed_at} /></div>
                    {task.description
                        ? <div className="rich text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: task.description }} />
                        : <p className="text-sm text-slate-400">No description.</p>}

                    {/* Status update */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Update Status</label>
                        {canChangeStatus ? (
                            <select
                                value={task.status}
                                onChange={(e) => changeStatus(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                            >
                                {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        ) : (
                            <p className="text-xs text-slate-400">Only assignees can change the status.</p>
                        )}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">End Date</span><span className="font-medium text-slate-700">{fmt(task.due_date)}</span></div>
                        {task.completed_at && <div className="flex justify-between"><span className="text-slate-400">Completed</span><span className="font-medium text-emerald-600">{fmt(task.completed_at)}</span></div>}
                        <div className="flex justify-between"><span className="text-slate-400">Reporter</span><span className="font-medium text-slate-700">{task.reporter ?? '—'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Assignees</span><span className="font-medium text-slate-700">{task.assignees.join(', ') || '—'}</span></div>
                    </div>

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

                {/* Comments */}
                <Card className="p-5 lg:col-span-2">
                    <SectionTitle>Comments ({comments.length})</SectionTitle>
                    <CommentForm taskUuid={task.uuid} />

                    <div className="mt-4 divide-y divide-slate-100">
                        {comments.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-400">No comments yet. Start the discussion.</p>
                        ) : (
                            comments.map((c) => <CommentItem key={c.id} c={c} taskUuid={task.uuid} />)
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
