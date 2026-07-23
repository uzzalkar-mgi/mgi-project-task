import { Head } from '@inertiajs/react';

const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const HERO_STATUS = { todo: 'bg-emerald-500', in_progress: 'bg-sky-500', under_review: 'bg-amber-500', done: 'bg-green-600', blocked: 'bg-rose-500' };
const HERO_PRIORITY = { urgent: 'bg-red-600', high: 'bg-rose-500', normal: 'bg-blue-500', low: 'bg-slate-500' };
const HERO_PLATFORM = { web: 'bg-violet-500', android: 'bg-teal-500', both: 'bg-fuchsia-500' };
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

function Attachments({ items }) {
    if (!items?.length) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {items.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                    {isImage(a.file_type)
                        ? <img src={a.url} alt={a.title} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                        : <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">📎 {a.title}</span>}
                </a>
            ))}
        </div>
    );
}

function MetaTile({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">{icon}</span>
            <div className="min-w-0"><p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p><p className="truncate text-sm font-semibold text-slate-800">{value}</p></div>
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

function SectionCard({ icon, iconBg, title, count, right, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${iconBg}`}>{icon}</span>
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                {count != null && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-bold text-slate-600">{count}</span>}
                {right && <div className="ml-auto">{right}</div>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function Public({ task, comments }) {
    const answered = task.answers.some((a) => a.is_accepted);

    return (
        <div className="min-h-screen bg-slate-100">
            <Head title={task.title} />

            {/* Top bar */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</span>
                    <span className="text-sm font-semibold text-slate-800">MGI · Project Tracking</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                        Read-only
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                {/* Hero */}
                <div className="overflow-hidden rounded-2xl shadow-sm">
                    <div className="bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500 px-6 py-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-brand-100">
                            <span className="rounded-full bg-white/15 px-2 py-0.5">#{task.task_no}</span>
                            <span>·</span>
                            <span>{task.project ?? 'Task'}</span>
                        </div>
                        <h1 className="mt-1.5 text-2xl font-bold text-white">{task.title}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${HERO_STATUS[task.status] ?? 'bg-white/20'}`}>{TASK_LABEL[task.status] ?? task.status}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-sm ${HERO_PRIORITY[task.priority] ?? 'bg-white/20'}`}>{task.priority}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${HERO_PLATFORM[task.platform] ?? 'bg-white/20'}`}>{PLATFORM_LABEL[task.platform] ?? task.platform}</span>
                        </div>
                    </div>

                    {/* Meta tiles */}
                    <div className="grid gap-3 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <MetaTile icon="🚀" label="Start" value={fmt(task.start_date)} />
                        <MetaTile icon="🎯" label="Due" value={fmt(task.due_date)} />
                        <MetaTile icon="📝" label="Reporter" value={task.reporter ?? '—'} />
                        <MetaTile icon="👥" label="Assignees" value={task.assignees.join(', ') || '—'} />
                    </div>
                </div>

                {/* Description */}
                {task.description && (
                    <SectionCard icon={<span>📄</span>} iconBg="bg-slate-500" title="Description">
                        <div className="rich text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: task.description }} />
                    </SectionCard>
                )}

                {/* Attachments */}
                {task.attachments.length > 0 && (
                    <SectionCard icon={<span>📎</span>} iconBg="bg-amber-500" title="Attachments" count={task.attachments.length}>
                        <Attachments items={task.attachments} />
                    </SectionCard>
                )}

                {/* Answers */}
                <SectionCard
                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                    iconBg="bg-brand-600"
                    title="Answers"
                    count={task.answers.length}
                    right={answered
                        ? <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">✓ Answered</span>
                        : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-600">Pending</span>}
                >
                    {task.answers.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">No answers submitted yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {task.answers.map((a) => (
                                <div key={a.id} className={`rounded-xl border p-4 ${a.is_accepted ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(a.author)}</span>
                                        <span className="text-sm font-semibold text-slate-800">{a.author}</span>
                                        <span className="text-xs text-slate-400">{a.created_at}</span>
                                        {a.is_accepted && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">✓ Accepted</span>}
                                    </div>
                                    <div className="rich mt-2 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: a.body }} />
                                    <Attachments items={a.attachments} />
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* Work Log */}
                {task.work_logs?.length > 0 && (
                    <SectionCard
                        icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>}
                        iconBg="bg-indigo-500"
                        title="Daily Work Log"
                        count={task.work_logs.length}
                        right={task.work_hours > 0 ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{task.work_hours}h total</span> : null}
                    >
                        <div className="space-y-3">
                            {task.work_logs.map((l) => (
                                <div key={l.id} className="rounded-xl border border-slate-100 p-3">
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-bold text-slate-800">{fmt(l.work_date)}</span>
                                        <span className="text-slate-400">· {l.author}</span>
                                        {l.hours != null && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{l.hours}h</span>}
                                    </div>
                                    <div className="rich text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: l.body }} />
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Discussion */}
                <SectionCard
                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
                    iconBg="bg-slate-500"
                    title="Discussion"
                    count={comments.length}
                >
                    <div className="divide-y divide-slate-100">
                        {comments.length === 0
                            ? <p className="py-6 text-center text-sm text-slate-400">No comments yet.</p>
                            : comments.map((c) => <CommentNode key={c.id} c={c} />)}
                    </div>
                </SectionCard>

                <p className="pt-2 text-center text-xs text-slate-400">🔒 Read-only shared view · © MGI Project Tracking</p>
            </main>
        </div>
    );
}
