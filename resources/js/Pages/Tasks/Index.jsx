import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const COLUMNS = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'done', label: 'Done' },
    { key: 'blocked', label: 'Blocked' },
];
const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const COL_ACCENT = { todo: 'border-t-slate-300', in_progress: 'border-t-brand-500', under_review: 'border-t-amber-500', done: 'border-t-emerald-500', blocked: 'border-t-rose-500' };
const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };
const PLATFORM_LABEL = { web: 'Web', android: 'Android', both: 'Web+Android' };

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/** First two words of the title; append "..." when truncated. */
function shortTitle(title = '') {
    const words = title.trim().split(/\s+/);
    return words.length <= 2 ? title : words.slice(0, 2).join(' ') + ' .........';
}

function uploadAttachment(uuid, file) {
    router.post(route('tasks.attachments.store', uuid), { file }, { forceFormData: true, preserveScroll: true });
}

function CommentMeta({ t }) {
    return (
        <span className="flex items-center gap-1 text-xs text-slate-400" title={`${t.comments} comment(s)`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {t.comments}
            {t.new_comments > 0 && (
                <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{t.new_comments} new</span>
            )}
        </span>
    );
}

function TaskCard({ t, draggable, onDragStart }) {
    const fileRef = useRef();
    const go = () => router.visit(route('tasks.show', t.uuid));
    return (
        <div
            draggable={draggable}
            onDragStart={(e) => onDragStart(e, t)}
            onClick={go}
            className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition hover:border-brand-300 ${draggable ? 'active:cursor-grabbing' : ''} ${t.new_comments > 0 ? 'border-rose-200' : 'border-slate-200'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-800" title={t.title}>{shortTitle(t.title)}</span>
                <Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">{t.project}</p>
            <div className="mt-1"><Badge tone="slate">{PLATFORM_LABEL[t.platform] ?? t.platform}</Badge></div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{t.assignees.join(', ') || 'Unassigned'}</span>
                <span>{fmt(t.due_date)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Icon name="projects" className="h-3.5 w-3.5" /> {t.attachments}
                    </span>
                    <CommentMeta t={t} />
                </div>
                {t.can_modify && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} className="text-xs font-medium text-brand-600 hover:underline">+ Attach</button>
                        <input ref={fileRef} type="file" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadAttachment(t.uuid, f); }} />
                    </>
                )}
            </div>
        </div>
    );
}

function Board({ tasks }) {
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);

    const onDragStart = (e, t) => { setDragId(t.uuid); e.dataTransfer.effectAllowed = 'move'; };
    const onDrop = (status) => {
        const t = tasks.find((x) => x.uuid === dragId);
        setOverCol(null);
        setDragId(null);
        if (t && t.status !== status && t.can_change_status) {
            router.patch(route('tasks.status', t.uuid), { status }, { preserveScroll: true });
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {COLUMNS.map((col) => {
                const items = tasks.filter((t) => t.status === col.key);
                return (
                    <div
                        key={col.key}
                        onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
                        onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                        onDrop={() => onDrop(col.key)}
                        className={`rounded-xl border border-t-4 bg-slate-50/60 p-2 ${COL_ACCENT[col.key]} ${overCol === col.key ? 'ring-2 ring-brand-200' : 'border-slate-200'}`}
                    >
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.label}</span>
                            <Badge tone={TASK_TONE[col.key]}>{items.length}</Badge>
                        </div>
                        <div className="space-y-2">
                            {items.map((t) => <TaskCard key={t.uuid} t={t} draggable={t.can_change_status} onDragStart={onDragStart} />)}
                            {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-slate-300">Drop here</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function List({ tasks }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Task</th>
                            <th className="px-4 py-3">Project</th>
                            <th className="px-4 py-3">Platform</th>
                            <th className="px-4 py-3">Assignees</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Comments</th>
                            <th className="px-4 py-3">Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tasks.map((t) => (
                            <tr key={t.uuid} onClick={() => router.visit(route('tasks.show', t.uuid))} className="cursor-pointer hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800 hover:text-brand-700" title={t.title}>{shortTitle(t.title)}</td>
                                <td className="px-4 py-3 text-slate-500">{t.project}</td>
                                <td className="px-4 py-3"><Badge tone="slate">{PLATFORM_LABEL[t.platform] ?? t.platform}</Badge></td>
                                <td className="px-4 py-3 text-slate-500">{t.assignees.join(', ') || '—'}</td>
                                <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge></td>
                                <td className="px-4 py-3"><Badge tone={TASK_TONE[t.status] ?? 'slate'}>{COLUMNS.find((c) => c.key === t.status)?.label ?? t.status}</Badge></td>
                                <td className="px-4 py-3"><CommentMeta t={t} /></td>
                                <td className="px-4 py-3 text-slate-500">{fmt(t.due_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

export default function Index({ tasks, canCreate }) {
    const [view, setView] = useState('board');
    const [q, setQ] = useState('');
    const shown = tasks.filter((t) => `${t.title} ${t.project} ${t.assignees.join(' ')}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Tasks"
                    subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'} · drag a card to change status.`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <SearchInput value={q} onChange={setQ} placeholder="Search tasks…" />
                            <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                {['board', 'list'].map((v) => (
                                    <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm font-medium capitalize ${view === v ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{v}</button>
                                ))}
                            </div>
                            {canCreate && (
                                <Link href={route('tasks.create')} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                                    <Icon name="tasks" className="h-4 w-4" /> New Task
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title="Tasks" />

            {tasks.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name="tasks" className="h-7 w-7" /></span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">No tasks yet</h2>
                    <p className="mt-1 text-sm text-slate-500">{canCreate ? 'Create your first task to get started.' : 'No tasks in your projects yet.'}</p>
                </Card>
            ) : view === 'board' ? (
                <Board tasks={shown} />
            ) : (
                <List tasks={shown} />
            )}
        </AuthenticatedLayout>
    );
}
