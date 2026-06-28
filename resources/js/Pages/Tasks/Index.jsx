import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import { CommentModal } from '@/Components/ui/CommentModal';
import { Countdown } from '@/Components/ui/Countdown';
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
const PLATFORM_TONE = { web: 'blue', android: 'green', both: 'amber' };

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/** First two words of the title; append "..." when truncated. */
function shortTitle(title = '') {
    const words = title.trim().split(/\s+/);
    return words.length <= 2 ? title : words.slice(0, 2).join(' ') + ' ....';
}

function uploadAttachment(uuid, file) {
    // Inertia handles the back()/302 redirect natively and reloads props.
    router.post(route('tasks.attachments.store', uuid), { file }, {
        forceFormData: true,
        preserveScroll: true,
        onError: (e) => alert(e.file ?? 'Upload failed.'),
    });
}

function CommentMeta({ t, onOpen }) {
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(t); }}
            className="flex items-center gap-1 rounded text-xs text-slate-400 hover:text-brand-600"
            title="View / add comments"
        >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {t.comments}
            {t.new_comments > 0 && (
                <span className="ml-0.5 h-2 w-2 rounded-full bg-rose-500" title={`${t.new_comments} new`} />
            )}
        </button>
    );
}

function TaskCard({ t, draggable, onDragStart, onOpenComments }) {
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
            <div className="mt-1"><Badge tone={PLATFORM_TONE[t.platform] ?? 'slate'}>{PLATFORM_LABEL[t.platform] ?? t.platform}</Badge></div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">{t.assignees.join(', ') || 'Unassigned'}</span>
                <span>{fmt(t.due_date)}</span>
            </div>
            <div className="mt-1.5"><Countdown dueDate={t.due_date} status={t.status} completedAt={t.completed_at} /></div>
            <div className="mt-2 flex items-center gap-3 border-t border-slate-50 pt-2">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Icon name="projects" className="h-3.5 w-3.5" /> {t.attachments}
                </span>
                <CommentMeta t={t} onOpen={onOpenComments} />
                {t.can_modify && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} title="Attach file" className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                            <Icon name="plus" className="h-3.5 w-3.5" /> Attach
                        </button>
                        <input ref={fileRef} type="file" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadAttachment(t.uuid, f); }} />
                    </>
                )}
            </div>
        </div>
    );
}

function Board({ tasks, onOpenComments }) {
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);

    const onDragStart = (e, t) => {
        setDragId(t.uuid);
        e.dataTransfer.effectAllowed = 'move';
        // Required for the drag to actually start in Firefox/some browsers.
        try { e.dataTransfer.setData('text/plain', t.uuid); } catch { /* ignore */ }
    };
    const onDrop = (e, status) => {
        e.preventDefault();
        const id = dragId || e.dataTransfer.getData('text/plain');
        const t = tasks.find((x) => x.uuid === id);
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
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col.key); }}
                        onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                        onDrop={(e) => onDrop(e, col.key)}
                        className={`rounded-xl border border-t-4 bg-slate-50/60 p-2 ${COL_ACCENT[col.key]} ${overCol === col.key ? 'ring-2 ring-brand-200' : 'border-slate-200'}`}
                    >
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.label}</span>
                            <Badge tone={TASK_TONE[col.key]}>{items.length}</Badge>
                        </div>
                        <div className="scroll-thin max-h-[calc(100vh-16rem)] space-y-2 overflow-y-auto pr-1">
                            {items.map((t) => <TaskCard key={t.uuid} t={t} draggable={t.can_change_status} onDragStart={onDragStart} onOpenComments={onOpenComments} />)}
                            {items.length === 0 && <p className="px-1 py-8 text-center text-xs text-slate-300">Drop here</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TaskTable({ tasks, onOpenComments, showProject = true }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-4 py-3">Task</th>
                        {showProject && <th className="px-4 py-3">Project</th>}
                        <th className="px-4 py-3">Platform</th>
                        <th className="px-4 py-3">Assignees</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Countdown</th>
                        <th className="px-4 py-3">Comments</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {tasks.map((t) => (
                        <tr key={t.uuid} onClick={() => router.visit(route('tasks.show', t.uuid))} className="cursor-pointer hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800 hover:text-brand-700" title={t.title}>
                                {shortTitle(t.title)} {t.is_new && <span className="ml-1 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">NEW</span>}
                            </td>
                            {showProject && <td className="px-4 py-3 text-slate-500">{t.project}</td>}
                            <td className="px-4 py-3"><Badge tone={PLATFORM_TONE[t.platform] ?? 'slate'}>{PLATFORM_LABEL[t.platform] ?? t.platform}</Badge></td>
                            <td className="px-4 py-3 text-slate-500">{t.assignees.join(', ') || '—'}</td>
                            <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge></td>
                            <td className="px-4 py-3"><Badge tone={TASK_TONE[t.status] ?? 'slate'}>{COLUMNS.find((c) => c.key === t.status)?.label ?? t.status}</Badge></td>
                            <td className="px-4 py-3"><Countdown dueDate={t.due_date} status={t.status} completedAt={t.completed_at} /></td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CommentMeta t={t} onOpen={onOpenComments} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function List({ tasks, onOpenComments }) {
    // Latest tasks across all projects (newest first), shown in one block at top.
    const latest = [...tasks]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);

    // Group all tasks by project (preserve first-seen order).
    const groups = [];
    const idx = {};
    tasks.forEach((t) => {
        const key = t.project_uuid ?? '—';
        if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ name: t.project ?? 'No project', tasks: [] }); }
        groups[idx[key]].tasks.push(t);
    });

    const CardGrid = ({ items }) => (
        <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((t) => (
                <TaskCard key={t.uuid} t={t} draggable={false} onDragStart={() => {}} onOpenComments={onOpenComments} />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top: latest tasks across all projects (mixed). */}
            {latest.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-4">
                        <Icon name="tasks" className="h-4 w-4 text-brand-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Latest Tasks</h3>
                        <Badge tone="blue">{latest.length}</Badge>
                        <span className="text-xs text-slate-400">· most recently created across all projects</span>
                    </div>
                    <CardGrid items={latest} />
                </Card>
            )}

            {/* Project-wise sections (card-wise). */}
            {groups.map((g) => (
                <Card key={g.name} className="overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-4">
                        <Icon name="projects" className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-900">{g.name}</h3>
                        <Badge tone="slate">{g.tasks.length}</Badge>
                    </div>
                    <CardGrid items={g.tasks} />
                </Card>
            ))}
        </div>
    );
}

export default function Index({ tasks, canCreate }) {
    const [view, setView] = useState('list');
    const [q, setQ] = useState('');
    const [proj, setProj] = useState('all');
    const [activeTask, setActiveTask] = useState(null); // task whose comments modal is open

    // Unique projects for the board filter dropdown.
    const projectOpts = [];
    const seen = new Set();
    tasks.forEach((t) => { if (t.project_uuid && !seen.has(t.project_uuid)) { seen.add(t.project_uuid); projectOpts.push({ uuid: t.project_uuid, name: t.project }); } });

    let shown = tasks.filter((t) => `${t.title} ${t.project} ${t.assignees.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
    if (view === 'board' && proj !== 'all') shown = shown.filter((t) => t.project_uuid === proj);

    const closeModal = () => { setActiveTask(null); router.reload({ only: ['tasks'] }); };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Tasks"
                    subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'} · drag a card to change status.`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <SearchInput value={q} onChange={setQ} placeholder="Search tasks…" />
                            {view === 'board' && (
                                <select
                                    value={proj}
                                    onChange={(e) => setProj(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                >
                                    <option value="all">All Projects</option>
                                    {projectOpts.map((p) => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                                </select>
                            )}
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
                <Board tasks={shown} onOpenComments={setActiveTask} />
            ) : (
                <List tasks={shown} onOpenComments={setActiveTask} />
            )}

            {activeTask && (
                <CommentModal
                    taskUuid={activeTask.uuid}
                    taskTitle={activeTask.title}
                    onClose={closeModal}
                    onPosted={() => router.reload({ only: ['tasks'] })}
                />
            )}
        </AuthenticatedLayout>
    );
}
