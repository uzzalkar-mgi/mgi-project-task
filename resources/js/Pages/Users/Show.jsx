import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link } from '@inertiajs/react';

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const PROJ_TONE = { active: 'green', on_hold: 'amber', completed: 'blue', cancelled: 'red' };
const ROLE_TONE = { Admin: 'blue', Manager: 'green', Member: 'amber' };

function Info({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400"><Icon name={icon} className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="truncate text-sm font-medium text-slate-800">{value || '—'}</p></div>
        </div>
    );
}

export default function Show({ user, ledProjects, memberProjects, tasks }) {
    const { can } = usePermissions();
    const role = user.roles[0] ?? 'Member';

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={user.name}
                    subtitle={user.designation || 'Team member'}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('users.index')} className="text-sm font-medium text-slate-500 hover:text-slate-800">← Back</Link>
                            {can('users.update') && <Link href={route('users.edit', user.uuid)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Edit</Link>}
                        </div>
                    }
                />
            }
        >
            <Head title={user.name} />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile card */}
                <Card className="p-5 lg:col-span-1">
                    <div className="flex flex-col items-center text-center">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">{initials(user.name)}</span>
                        )}
                        <h2 className="mt-3 text-lg font-bold text-slate-900">{user.name}</h2>
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                            {user.roles.map((r) => <Badge key={r} tone={ROLE_TONE[r] ?? 'slate'}>{r}</Badge>)}
                            <Badge tone={user.status === 1 ? 'green' : 'slate'}>{user.status === 1 ? 'Active' : 'Inactive'}</Badge>
                        </div>
                    </div>
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <Info icon="user" label="Employee ID" value={user.employee_id} />
                        <Info icon="bell" label="Email" value={user.email} />
                        <Info icon="projects" label="Office Contact" value={user.contact} />
                        <Info icon="team" label="Department" value={user.department} />
                        <Info icon="milestones" label="Designation" value={user.designation} />
                    </div>
                </Card>

                <div className="space-y-6 lg:col-span-2">
                    {/* Projects */}
                    <Card className="p-5">
                        <SectionTitle>Projects ({ledProjects.length + memberProjects.length})</SectionTitle>
                        {ledProjects.length === 0 && memberProjects.length === 0 ? (
                            <p className="text-sm text-slate-400">Not part of any project.</p>
                        ) : (
                            <div className="space-y-2">
                                {ledProjects.map((p) => (
                                    <Link key={`l${p.uuid}`} href={route('projects.show', p.uuid)} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                                        <span className="flex items-center gap-2"><Badge tone="blue">Lead</Badge><Badge tone={PROJ_TONE[p.status] ?? 'slate'}>{p.status}</Badge></span>
                                    </Link>
                                ))}
                                {memberProjects.filter((m) => !ledProjects.some((l) => l.uuid === m.uuid)).map((p) => (
                                    <Link key={`m${p.uuid}`} href={route('projects.show', p.uuid)} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                                        <span className="flex items-center gap-2"><Badge tone="slate">Member</Badge><Badge tone={PROJ_TONE[p.status] ?? 'slate'}>{p.status}</Badge></span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Assigned tasks */}
                    <Card className="p-5">
                        <SectionTitle>Assigned Tasks ({tasks.length})</SectionTitle>
                        {tasks.length === 0 ? (
                            <p className="text-sm text-slate-400">No tasks assigned.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {tasks.map((t) => (
                                    <li key={t.uuid} className="flex items-center justify-between gap-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                                            <p className="truncate text-xs text-slate-400">{t.project} · due {fmt(t.due_date)}</p>
                                        </div>
                                        <Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
