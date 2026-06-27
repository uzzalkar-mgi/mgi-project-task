import { Card, PageHeader, StatCard, SectionTitle, ProgressBar, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link, usePage } from '@inertiajs/react';

const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const RAG_TONE = { red: 'red', amber: 'amber', green: 'green' };
const RAG_BAR = { red: 'bg-rose-500', amber: 'bg-amber-500', green: 'bg-emerald-500' };

function fmt(d) {
    if (!d) return 'No due date';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function Dashboard({ stats, myTasks, health }) {
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
                <StatCard label="Active Projects" value={String(stats.active_projects)} hint="Visible to you" tone="blue" icon={<Icon name="projects" className="h-5 w-5" />} />
                <StatCard label="My Open Tasks" value={String(stats.my_tasks)} hint="Assigned to you" tone="green" icon={<Icon name="tasks" className="h-5 w-5" />} />
                <StatCard label="Overdue" value={String(stats.overdue)} hint="Needs attention" tone="amber" icon={<Icon name="bell" className="h-5 w-5" />} />
                <StatCard label="Completed" value={String(stats.completed_month)} hint="This month" tone="purple" icon={<Icon name="milestones" className="h-5 w-5" />} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* My tasks */}
                <Card className="p-5 lg:col-span-2">
                    <SectionTitle>My Tasks</SectionTitle>
                    {myTasks.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                            No open tasks assigned to you. 🎉
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {myTasks.map((t) => (
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
                </Card>

                {/* Project health */}
                <Card className="p-5">
                    <SectionTitle>Project Health</SectionTitle>
                    {health.length === 0 ? (
                        <p className="text-xs text-slate-400">No active projects to report on.</p>
                    ) : (
                        <div className="space-y-4">
                            {health.map((h) => (
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
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
