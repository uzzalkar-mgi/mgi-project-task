import { Card, SectionTitle, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

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

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Icon name={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="truncate text-sm font-medium text-slate-800">{value || '—'}</p>
            </div>
        </div>
    );
}

function AvatarUpload({ user, name }) {
    const fileRef = useRef();
    const { setData, post, processing } = useForm({ image: null });

    function onPick(e) {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-picking same file
        if (!file) return;
        setData('image', file);
        post(route('profile.image'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <label
            className="group absolute left-6 top-3 z-10 h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-brand-100 shadow-md"
            title="Change profile photo"
        >
            {user?.avatar_url ? (
                <img src={user.avatar_url} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-700">
                    {initials(name)}
                </span>
            )}

            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                <Icon name="user" className="h-4 w-4" />
                {processing ? 'Uploading…' : 'Change'}
            </span>

            {processing && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={processing} onChange={onPick} />
        </label>
    );
}

export default function Edit({
    mustVerifyEmail, status, department, designation, departments, designations,
    ledProjects = [], memberProjects = [], tasks = [], createdTasks = [],
}) {
    const user = usePage().props.auth.user;
    const { roles } = usePermissions();
    const role = roles?.[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : 'Member';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const [tab, setTab] = useState('personal'); // 'personal' | 'password' | 'project' | 'tasks'

    const tabs = [
        { key: 'personal', label: 'Personal Information' },
        { key: 'password', label: 'Password' },
        { key: 'project', label: 'Project' },
        { key: 'tasks', label: 'Tasks' },
    ];

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-slate-900">My Profile</h2>}>
            <Head title="Profile" />

            <div className="space-y-5">
                {/* Header card */}
                <Card className="relative overflow-hidden">
                    <AvatarUpload user={user} name={user?.name} />
                    <div className="flex h-20 items-end bg-gradient-to-r from-brand-800 to-brand-500 px-6 pb-2 pl-32">
                        <h1 className="text-2xl font-bold leading-none text-white">{user?.name}</h1>
                    </div>
                    <div className="flex flex-col gap-2 px-6 py-2.5 pl-32 sm:flex-row sm:items-center">
                        <div>
                            <div className="-mt-2.5 flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{role}</p>
                                <Badge tone="blue">{user?.status === 1 ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 pt-[5px] text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Icon name="user" className="h-4 w-4 text-slate-400" /> {user?.employee_id ?? '—'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon name="bell" className="h-4 w-4 text-slate-400" /> {user?.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon name="timeline" className="h-4 w-4 text-slate-400" /> Member since {memberSince}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Account info (read-only) */}
                <Card className="p-5">
                    <SectionTitle>Account Information</SectionTitle>
                    <div className="grid gap-x-8 sm:grid-cols-2">
                        <InfoRow icon="user" label="Employee ID" value={user?.employee_id} />
                        <InfoRow icon="team" label="Role" value={role} />
                        <InfoRow icon="bell" label="Email" value={user?.email} />
                        <InfoRow icon="projects" label="Office Contact" value={user?.office_contact} />
                        <InfoRow icon="team" label="Department" value={department} />
                        <InfoRow icon="milestones" label="Designation" value={designation} />
                    </div>
                </Card>

                {/* Tabs: Personal Information | Password | Project | Tasks */}
                <Card className="p-5">
                    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-100">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
                                    tab === t.key
                                        ? 'border-brand-600 text-brand-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Personal Information tab */}
                    <div className={tab === 'personal' ? '' : 'hidden'}>
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} departments={departments} designations={designations} className="max-w-3xl" />
                    </div>

                    {/* Password tab */}
                    <div className={tab === 'password' ? '' : 'hidden'}>
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {/* Project tab */}
                    <div className={tab === 'project' ? '' : 'hidden'}>
                        <SectionTitle>My Projects ({ledProjects.length + memberProjects.filter((m) => !ledProjects.some((l) => l.uuid === m.uuid)).length})</SectionTitle>
                        {ledProjects.length === 0 && memberProjects.length === 0 ? (
                            <p className="text-sm text-slate-400">Not part of any project.</p>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                                <div className="space-y-2 min-w-[400px]">
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
                            </div>
                        )}
                    </div>

                    {/* Tasks tab */}
                    <div className={tab === 'tasks' ? '' : 'hidden'}>
                        {/* Assigned Tasks */}
                        <div className="mb-6">
                            <SectionTitle>Assigned Tasks ({tasks.length})</SectionTitle>
                            {tasks.length === 0 ? (
                                <p className="text-sm text-slate-400">No tasks assigned.</p>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                                    <ul className="divide-y divide-slate-100 min-w-[500px]">
                                        {tasks.map((t) => (
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
                            )}
                        </div>

                        {/* Created Tasks (grouped by project) */}
                        <div>
                            <SectionTitle>Created Tasks ({createdTasks.reduce((n, g) => n + g.tasks.length, 0)})</SectionTitle>
                            {createdTasks.length === 0 ? (
                                <p className="text-sm text-slate-400">You haven't created any tasks.</p>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                                    <div className="space-y-4 min-w-[500px]">
                                        {createdTasks.map((g) => (
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
                            )}
                        </div>
                    </div>
                </Card>

                {/* Danger zone */}
                <Card className="border-rose-100 p-5">
                    <DeleteUserForm className="max-w-xl" />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
