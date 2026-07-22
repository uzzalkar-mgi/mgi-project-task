import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { AttachmentViewer } from '@/Components/ui/AttachmentViewer';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const PER_PAGE = 10;

const STATUS_TONE = { active: 'green', on_hold: 'amber', completed: 'blue', cancelled: 'red' };
const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const PRIORITY_TONE = { urgent: 'red', critical: 'red', high: 'amber', normal: 'blue', medium: 'blue', low: 'slate' };

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function Meta({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Icon name={icon} className="h-4 w-4" />
            </span>
            <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
            </div>
        </div>
    );
}

export default function Show({ project, canEdit }) {
    const [tab, setTab] = useState('all');
    const [page, setPage] = useState(1);

    // Due tab: not-done tasks with a due date, soonest first.
    const dueTasks = project.tasks
        .filter((t) => t.status !== 'done' && t.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    const list = tab === 'due' ? dueTasks : project.tasks;
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const cur = Math.min(page, pages);
    const pagedTasks = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

    const switchTab = (t) => { setTab(t); setPage(1); };
    const today = new Date().setHours(0, 0, 0, 0);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={project.name}
                    subtitle="Project details"
                    actions={
                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <Link href={route('projects.edit', project.uuid)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    Edit
                                </Link>
                            )}
                            <Link href={route('projects.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Back
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={project.name} />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Overview */}
                <Card className="p-5 lg:col-span-1">
                    <div className="mb-4 flex items-center gap-2">
                        <Badge tone={STATUS_TONE[project.status] ?? 'slate'}>{project.status}</Badge>
                        <Badge tone={PRIORITY_TONE[project.priority] ?? 'slate'}>{project.priority}</Badge>
                    </div>
                    {project.description
                        ? <div className="rich mb-4 border-b border-slate-100 pb-4" dangerouslySetInnerHTML={{ __html: project.description }} />
                        : <p className="mb-4 border-b border-slate-100 pb-4 text-sm text-slate-400">No description.</p>}
                    <div className="space-y-3">
                        <Meta icon="user" label="Project Lead" value={project.lead} />
                        <Meta icon="team" label="Primary Responsible" value={project.primary} />
                        <Meta icon="team" label="Secondary Responsible" value={project.secondary} />
                        <Meta icon="timeline" label="Start" value={fmt(project.start_date)} />
                        <Meta icon="timeline" label="End" value={fmt(project.end_date)} />
                    </div>
                    {project.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            {project.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">#{t}</span>)}
                        </div>
                    )}
                    {project.members.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="mb-2 text-xs font-medium text-slate-500">Team Members</p>
                            <div className="flex flex-wrap gap-2">
                                {project.members.map((m) => <span key={m} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{m}</span>)}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Tasks */}
                <Card className="p-5 lg:col-span-2">
                    <div className="mb-3 flex items-center gap-1 border-b border-slate-100">
                        <button onClick={() => switchTab('all')} className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold transition ${tab === 'all' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            Tasks <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-bold text-slate-600">{project.tasks.length}</span>
                        </button>
                        <button onClick={() => switchTab('due')} className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold transition ${tab === 'due' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            Task Due <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-600">{dueTasks.length}</span>
                        </button>
                    </div>
                    {list.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">{tab === 'due' ? 'No pending due tasks.' : 'No tasks yet.'}</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {pagedTasks.map((t) => (
                                <li key={t.uuid} className="py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link href={route('tasks.show', t.uuid)} className="truncate text-sm font-medium text-slate-800 hover:text-brand-700">{t.title}</Link>
                                            <p className="truncate text-xs text-slate-400">
                                                {t.assignees.join(', ') || 'Unassigned'} · due{' '}
                                                <span className={t.status !== 'done' && t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) < today ? 'font-semibold text-rose-500' : ''}>{fmt(t.due_date)}</span>
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Badge tone={{ web: 'blue', android: 'green', both: 'amber' }[t.platform] ?? 'slate'}>{{ web: 'Web', android: 'Android', both: 'Web+Android' }[t.platform] ?? t.platform}</Badge>
                                            <Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge>
                                            <Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge>
                                            <Link href={route('tasks.show', t.uuid)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50" title="View task">
                                                <Icon name="eye" className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                    {t.attachments?.length > 0 && (
                                        <div className="mt-2 pl-0.5">
                                            <AttachmentViewer items={t.attachments} size="sm" />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {pages > 1 && (
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                            <button onClick={() => setPage(cur - 1)} disabled={cur <= 1} className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
                            <span className="text-slate-400">Page {cur} of {pages} · {list.length} tasks</span>
                            <button onClick={() => setPage(cur + 1)} disabled={cur >= pages} className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
