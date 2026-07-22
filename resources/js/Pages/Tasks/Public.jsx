import { Head } from '@inertiajs/react';

const TASK_TONE = { todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700', done: 'bg-emerald-100 text-emerald-700', blocked: 'bg-rose-100 text-rose-700' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const PRIORITY_TONE = { urgent: 'bg-rose-100 text-rose-700', high: 'bg-amber-100 text-amber-700', normal: 'bg-blue-100 text-blue-700', low: 'bg-slate-100 text-slate-600' };
const PLATFORM_LABEL = { web: 'Web', android: 'Android', both: 'Web + Android' };

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

function Pill({ className, children }) {
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function Attachments({ items }) {
    if (!items?.length) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {items.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                    {isImage(a.file_type)
                        ? <img src={a.url} alt={a.title} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                        : <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">📎 {a.title}</span>}
                </a>
            ))}
        </div>
    );
}

function CommentNode({ c, depth = 0 }) {
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
                {c.replies?.length > 0 && (
                    <div className="mt-2 border-l-2 border-slate-100 pl-3">
                        {c.replies.map((r) => <CommentNode key={r.id} c={r} depth={depth + 1} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Public({ task, comments }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={task.title} />

            {/* Brand header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</span>
                    <span className="text-sm font-semibold text-slate-800">MGI · Project Tracking</span>
                    <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Shared · read-only</span>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-8">
                {/* Title + meta */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{task.project ?? 'Task'} · #{task.task_no}</p>
                    <h1 className="mt-1 text-xl font-bold text-slate-900">{task.title}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill className={TASK_TONE[task.status]}>{TASK_LABEL[task.status] ?? task.status}</Pill>
                        <Pill className={PRIORITY_TONE[task.priority]}>{task.priority}</Pill>
                        <Pill className="bg-slate-100 text-slate-600">{PLATFORM_LABEL[task.platform] ?? task.platform}</Pill>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {[
                            ['Start Date', fmt(task.start_date)],
                            ['End Date', fmt(task.due_date)],
                            ['Reporter', task.reporter ?? '—'],
                            ['Assignees', task.assignees.join(', ') || '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">{k}</p>
                                <p className="text-sm font-medium text-slate-800">{v}</p>
                            </div>
                        ))}
                    </div>

                    {task.description && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                            <div className="rich text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: task.description }} />
                        </div>
                    )}

                    {task.attachments.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments</p>
                            <Attachments items={task.attachments} />
                        </div>
                    )}
                </div>

                {/* Answers */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900">Answers ({task.answers.length})</h2>
                    {task.answers.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-400">No answers submitted yet.</p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {task.answers.map((a) => (
                                <div key={a.id} className={`rounded-xl border p-4 ${a.is_accepted ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(a.author)}</span>
                                        <span className="text-sm font-semibold text-slate-800">{a.author}</span>
                                        <span className="text-xs text-slate-400">{a.created_at}</span>
                                        {a.is_accepted && <Pill className="bg-emerald-500 text-white">✓ Accepted</Pill>}
                                    </div>
                                    <div className="rich mt-2 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: a.body }} />
                                    <Attachments items={a.attachments} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Discussion */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900">Discussion ({comments.length})</h2>
                    <div className="mt-2 divide-y divide-slate-100">
                        {comments.length === 0
                            ? <p className="py-6 text-sm text-slate-400">No comments yet.</p>
                            : comments.map((c) => <CommentNode key={c.id} c={c} />)}
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">This is a read-only shared view. © MGI Project Tracking</p>
            </main>
        </div>
    );
}
