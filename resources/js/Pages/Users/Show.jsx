import { Card, PageHeader, Badge, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const PAGE_SIZE = 6;

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Client-side pager: returns the current slice + controls. */
function usePaged(items, size = PAGE_SIZE) {
    const [page, setPage] = useState(1);
    const pages = Math.max(1, Math.ceil(items.length / size));
    const cur = Math.min(page, pages);
    return { slice: items.slice((cur - 1) * size, cur * size), page: cur, pages, setPage };
}

function Pager({ page, pages, setPage }) {
    if (pages <= 1) return null;
    return (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
            <span className="text-slate-400">Page {page} of {pages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= pages} className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
        </div>
    );
}
const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const PROJ_TONE = { active: 'green', on_hold: 'amber', completed: 'blue', cancelled: 'red' };
const ROLE_TONE = { 'Super Admin': 'red', Admin: 'blue', Manager: 'green', Employee: 'amber', Member: 'amber' };

function Info({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400"><Icon name={icon} className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="truncate text-sm font-medium text-slate-800">{value || '—'}</p></div>
        </div>
    );
}

export default function Show({ user, ledProjects, memberProjects, tasks, createdTasks = [] }) {
    const { can } = usePermissions();

    // Merge led + member projects (dedupe), tag role-in-project.
    const projects = [
        ...ledProjects.map((p) => ({ ...p, role: 'Lead', tone: 'blue' })),
        ...memberProjects.filter((m) => !ledProjects.some((l) => l.uuid === m.uuid)).map((p) => ({ ...p, role: 'Member', tone: 'slate' })),
    ];
    const createdCount = createdTasks.reduce((n, g) => n + g.tasks.length, 0);

    const projPage = usePaged(projects);
    const taskPage = usePaged(tasks);
    const createdPage = usePaged(createdTasks, 3); // paginate by project group

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={user.name}
                    subtitle={user.designation || 'Team member'}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('users.index')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Back
                            </Link>
                            {can('users.update') && <Link href={route('users.edit', user.uuid)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Edit</Link>}
                        </div>
                    }
                />
            }
        >
            <Head title={user.name} />

            <div className="grid items-start gap-6 lg:grid-cols-3">
                {/* Profile card — sticky */}
                <Card className="p-5 lg:col-span-1 lg:sticky lg:top-6">
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
                        <SectionTitle>Projects ({projects.length})</SectionTitle>
                        {projects.length === 0 ? (
                            <p className="text-sm text-slate-400">Not part of any project.</p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {projPage.slice.map((p) => (
                                        <Link key={`${p.role}${p.uuid}`} href={route('projects.show', p.uuid)} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                                            <span className="text-sm font-medium text-slate-800">{p.name}</span>
                                            <span className="flex items-center gap-2"><Badge tone={p.tone}>{p.role}</Badge><Badge tone={PROJ_TONE[p.status] ?? 'slate'}>{p.status}</Badge></span>
                                        </Link>
                                    ))}
                                </div>
                                <Pager {...projPage} />
                            </>
                        )}
                    </Card>

                    {/* Assigned tasks */}
                    <Card className="p-5">
                        <SectionTitle>Assigned Tasks ({tasks.length})</SectionTitle>
                        {tasks.length === 0 ? (
                            <p className="text-sm text-slate-400">No tasks assigned.</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <ul className="min-w-[500px] divide-y divide-slate-100">
                                        {taskPage.slice.map((t) => (
                                            <li key={t.uuid} className="flex items-center justify-between gap-3 py-2.5">
                                                <div className="min-w-0">
                                                    <Link href={route('tasks.show', t.uuid)} className="truncate text-sm font-medium text-slate-800 hover:text-brand-700">{t.title}</Link>
                                                    <p className="truncate text-xs text-slate-400">
                                                        {t.project} · due {fmt(t.due_date)}
                                                        {t.created_by && (
                                                            <> · created by {t.created_by_uuid
                                                                ? <Link href={route('users.show', t.created_by_uuid)} className="font-medium text-slate-500 hover:text-brand-600">{t.created_by}</Link>
                                                                : <span className="font-medium text-slate-500">{t.created_by}</span>
                                                            }</>
                                                        )}
                                                    </p>
                                                </div>
                                                <Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Pager {...taskPage} />
                            </>
                        )}
                    </Card>

                    {/* Tasks created by this user (project-wise) */}
                    <Card className="p-5">
                        <SectionTitle>Created Tasks ({createdCount})</SectionTitle>
                        {createdTasks.length === 0 ? (
                            <p className="text-sm text-slate-400">This user hasn't created any tasks.</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[500px] space-y-4">
                                        {createdPage.slice.map((g) => (
                                            <div key={g.project}>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <Icon name="projects" className="h-4 w-4 text-slate-400" />
                                                    {g.project_uuid
                                                        ? <Link href={route('projects.show', g.project_uuid)} className="text-sm font-semibold text-slate-800 hover:text-brand-700">{g.project}</Link>
                                                        : <span className="text-sm font-semibold text-slate-800">{g.project}</span>}
                                                    <Badge tone="slate">{g.tasks.length}</Badge>
                                                </div>
                                                <ul className="divide-y divide-slate-50 border-l-2 border-slate-100 pl-3">
                                                    {g.tasks.map((t) => (
                                                        <li key={t.uuid} className="flex items-center justify-between gap-3 py-2">
                                                            <Link href={route('tasks.show', t.uuid)} className="min-w-0 truncate text-sm text-slate-700 hover:text-brand-700">{t.title}</Link>
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                <span className="text-xs text-slate-400">{fmt(t.due_date)}</span>
                                                                <Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Pager {...createdPage} />
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
