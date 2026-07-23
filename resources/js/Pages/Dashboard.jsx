import { Card, PageHeader, StatCard, SectionTitle, ProgressBar, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Deferred, Head, Link, usePage } from '@inertiajs/react';

function Loading({ label = 'Loading…' }) {
    return (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
            {label}
        </div>
    );
}

const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const RAG_TONE = { red: 'red', amber: 'amber', green: 'green' };
const RAG_BAR = { red: 'bg-rose-500', amber: 'bg-amber-500', green: 'bg-emerald-500' };

const STATUS_BARS = [
    { key: 'todo', label: 'To Do', bar: 'bg-slate-400' },
    { key: 'in_progress', label: 'In Progress', bar: 'bg-brand-500' },
    { key: 'under_review', label: 'Under Review', bar: 'bg-amber-500' },
    { key: 'done', label: 'Done', bar: 'bg-emerald-500' },
    { key: 'blocked', label: 'Blocked', bar: 'bg-rose-500' },
];

function StatusBarChart({ projects }) {
    const max = Math.max(1, ...projects.flatMap((p) => STATUS_BARS.map((s) => p.counts[s.key])));
    return (
        <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <SectionTitle>Tasks by Status — per Project</SectionTitle>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {STATUS_BARS.map((s) => <span key={s.key} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${s.bar}`} /> {s.label}</span>)}
                </div>
            </div>
            {projects.length === 0 ? (
                <p className="text-sm text-slate-400">No projects to chart.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((p) => (
                        <div key={p.uuid} className="rounded-lg border border-slate-100 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <Link href={`/projects/${p.uuid}`} className="truncate text-sm font-semibold text-slate-800 hover:text-brand-700">{p.name}</Link>
                                <span className="text-xs text-slate-400">{p.total} task{p.total === 1 ? '' : 's'}</span>
                            </div>
                            <div className="flex h-32 items-end justify-between gap-2">
                                {STATUS_BARS.map((s) => {
                                    const c = p.counts[s.key];
                                    return (
                                        <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                                            <span className="text-xs font-semibold text-slate-600">{c}</span>
                                            <div className="flex w-full items-end" style={{ height: '100%' }}>
                                                <div className={`w-full rounded-t ${s.bar}`} style={{ height: `${(c / max) * 100}%`, minHeight: c > 0 ? '4px' : '0' }} title={`${s.label}: ${c}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

function fmt(d) {
    if (!d) return 'No due date';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function Dashboard({ stats, myTasks, health, projectStatus = [] }) {
    const user = usePage().props.auth.user;
    const { roles } = usePermissions();
    const role = roles?.[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : 'Member';

    return (
        <AuthenticatedLayout
            header={<PageHeader title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`} subtitle={`Signed in as ${role} · here's your project overview.`} />}
        >
            <Head title="Dashboard" />

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href={route('projects.index')} className="block transition hover:-translate-y-0.5">
                    <StatCard label="My Projects" value={String(stats.active_projects)} hint="Created & assigned" tone="blue" icon={<Icon name="projects" className="h-5 w-5" />} />
                </Link>
                <Link href={route('tasks.index')} className="block transition hover:-translate-y-0.5">
                    <StatCard label="My Open Tasks" value={String(stats.my_tasks)} hint="Assigned to you · view all" tone="green" icon={<Icon name="tasks" className="h-5 w-5" />} />
                </Link>
                <StatCard label="Overdue" value={String(stats.overdue)} hint="Needs attention" tone="amber" icon={<Icon name="bell" className="h-5 w-5" />} />
                <StatCard label="Completed" value={String(stats.completed_month)} hint="This month" tone="purple" icon={<Icon name="milestones" className="h-5 w-5" />} />
            </div>

            {/* Project-wise task status bar chart (deferred) */}
            <div className="mt-6">
                <Deferred data="projectStatus" fallback={<Card className="p-5"><Loading label="Loading chart…" /></Card>}>
                    <StatusBarChart projects={projectStatus ?? []} />
                </Deferred>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* My tasks */}
                <Card className="p-5 lg:col-span-2">
                    <SectionTitle>My Tasks</SectionTitle>
                    <Deferred data="myTasks" fallback={<Loading />}>
                    {(myTasks ?? []).length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                            No open tasks assigned to you. 🎉
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {(myTasks ?? []).map((t) => (
                                <li key={t.uuid} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                                        <p className="truncate text-xs text-slate-400">{t.project} · {STATUS_LABEL[t.status] ?? t.status}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge>
                                        <span className={`text-xs ${t.overdue ? 'font-semibold text-rose-500' : 'text-slate-400'}`}>{fmt(t.due_date)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    </Deferred>
                </Card>

                {/* Project health */}
                <Card className="p-5">
                    <SectionTitle>Project Health</SectionTitle>
                    <Deferred data="health" fallback={<Loading />}>
                    {(health ?? []).length === 0 ? (
                        <p className="text-xs text-slate-400">No active projects to report on.</p>
                    ) : (
                        <div className="space-y-4">
                            {(health ?? []).map((h) => (
                                <div key={h.uuid}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <Link href={`/projects/${h.uuid}`} className="truncate text-slate-600 hover:text-brand-700">{h.name}</Link>
                                        <Badge tone={RAG_TONE[h.rag]}>{h.progress}%</Badge>
                                    </div>
                                    <ProgressBar value={h.progress} tone={RAG_BAR[h.rag]} />
                                    {h.overdue > 0 && <p className="mt-1 text-xs text-rose-500">{h.overdue} overdue task{h.overdue === 1 ? '' : 's'}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    </Deferred>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
