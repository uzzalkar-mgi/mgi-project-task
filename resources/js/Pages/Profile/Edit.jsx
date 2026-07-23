import { Card, SectionTitle, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
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
const CHIP_COLORS = {
    todo:         { active: 'border-slate-500 bg-slate-500 text-white',       idle: 'border-slate-200 text-slate-600 hover:bg-slate-50' },
    in_progress:  { active: 'border-sky-500 bg-sky-500 text-white',           idle: 'border-sky-200 text-sky-600 hover:bg-sky-50' },
    under_review: { active: 'border-amber-500 bg-amber-500 text-white',       idle: 'border-amber-200 text-amber-600 hover:bg-amber-50' },
    done:         { active: 'border-emerald-500 bg-emerald-500 text-white',   idle: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' },
    blocked:      { active: 'border-rose-500 bg-rose-500 text-white',         idle: 'border-rose-200 text-rose-600 hover:bg-rose-50' },
};
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

function NotificationPrefsForm({ prefs }) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm({ ...prefs });
    const submit = (e) => { e.preventDefault(); patch(route('profile.notifications'), { preserveScroll: true }); };

    const Toggle = ({ k, label }) => (
        <label className="flex cursor-pointer items-center gap-2.5">
            <button type="button" onClick={() => setData(k, !data[k])} className={`relative h-6 w-11 shrink-0 rounded-full transition ${data[k] ? 'bg-brand-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${data[k] ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-slate-700">{label}</span>
        </label>
    );

    const Row = ({ title, mailKey, appKey }) => (
        <div className="rounded-xl border border-slate-100 p-4">
            <p className="mb-2.5 text-sm font-semibold text-slate-800">{title}</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
                <Toggle k={mailKey} label="Email me" />
                <Toggle k={appKey} label="In-app notification" />
            </div>
        </div>
    );

    return (
        <form onSubmit={submit} className="max-w-3xl">
            <SectionTitle>Notification Preferences</SectionTitle>
            <p className="mb-3 text-xs text-slate-400">Choose how you're alerted. (Admins can disable a channel globally, which overrides these.)</p>
            <div className="space-y-3">
                <Row title="When a task is created for me" mailKey="notify_task_create_mail" appKey="notify_task_create_app" />
                <Row title="When my task's status changes" mailKey="notify_task_status_mail" appKey="notify_task_status_app" />
                <Row title="Meeting reminders" mailKey="notify_meeting_mail" appKey="notify_meeting_app" />
            </div>
            <div className="mt-4 flex items-center gap-3">
                <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
                    <Icon name="check" className="h-4 w-4" /> Save Preferences
                </button>
                {recentlySuccessful && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
        </form>
    );
}

export default function Edit({
    mustVerifyEmail, status, department, designation, departments, designations, notifyPrefs = {},
    ledProjects = [], memberProjects = [], tasks = [], createdTasks = [],
}) {
    const user = usePage().props.auth.user;
    const { roles } = usePermissions();
    const role = roles?.[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : 'Member';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const [tab, setTab] = useState('personal');
    const [q, setQ] = useState('');
    const [assignStatus, setAssignStatus] = useState('all');
    const term = q.trim().toLowerCase();
    const match = (...vals) => !term || vals.filter(Boolean).some((v) => String(v).toLowerCase().includes(term));

    // Merged project list (led + member, deduped).
    const projectList = [
        ...ledProjects.map((p) => ({ ...p, role: 'Lead', tone: 'blue' })),
        ...memberProjects.filter((m) => !ledProjects.some((l) => l.uuid === m.uuid)).map((p) => ({ ...p, role: 'Member', tone: 'slate' })),
    ];
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const dueList = tasks
        .filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) < todayMs)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    const createdCount = createdTasks.reduce((n, g) => n + g.tasks.length, 0);

    const switchTab = (t) => { setTab(t); setQ(''); setAssignStatus('all'); };
    const STATUS_KEYS = ['todo', 'in_progress', 'under_review', 'done', 'blocked'];
    const statusCount = (s) => tasks.filter((t) => t.status === s).length;
    const today = new Date().setHours(0, 0, 0, 0);

    const tabs = [
        { key: 'personal', label: 'Personal Information' },
        { key: 'password', label: 'Password' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'project', label: `Project (${projectList.length})` },
        { key: 'tasks', label: `Assign Task (${tasks.length})` },
        { key: 'taskdue', label: `Task Due (${dueList.length})` },
        { key: 'created', label: `Created Task (${createdCount})` },
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
                                onClick={() => switchTab(t.key)}
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

                    {/* Notifications tab */}
                    <div className={tab === 'notifications' ? '' : 'hidden'}>
                        <NotificationPrefsForm prefs={notifyPrefs} />
                    </div>

                    {/* Project tab */}
                    <div className={tab === 'project' ? '' : 'hidden'}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <SectionTitle>My Projects ({projectList.length})</SectionTitle>
                            <SearchInput value={q} onChange={setQ} placeholder="Search projects…" />
                        </div>
                        {(() => {
                            const rows = projectList.filter((p) => match(p.name, p.status, p.role));
                            if (projectList.length === 0) return <p className="text-sm text-slate-400">Not part of any project.</p>;
                            if (rows.length === 0) return <p className="text-sm text-slate-400">No projects match “{q}”.</p>;
                            return (
                                <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                                    <div className="min-w-[400px] space-y-2">
                                        {rows.map((p) => (
                                            <Link key={`${p.role}${p.uuid}`} href={route('projects.show', p.uuid)} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                                                <span className="text-sm font-medium text-slate-800">{p.name}</span>
                                                <span className="flex items-center gap-2"><Badge tone={p.tone}>{p.role}</Badge><Badge tone={PROJ_TONE[p.status] ?? 'slate'}>{p.status}</Badge></span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Task Due tab */}
                    <div className={tab === 'taskdue' ? '' : 'hidden'}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <SectionTitle>Task Due ({dueList.length})</SectionTitle>
                            <SearchInput value={q} onChange={setQ} placeholder="Search due tasks…" />
                        </div>
                        {(() => {
                            const rows = dueList.filter((t) => match(t.title, t.project, t.status));
                            if (dueList.length === 0) return <p className="text-sm text-slate-400">No pending due tasks.</p>;
                            if (rows.length === 0) return <p className="text-sm text-slate-400">No due tasks match “{q}”.</p>;
                            return (
                                <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                                    <ul className="min-w-[500px] divide-y divide-slate-100">
                                        {rows.map((t) => {
                                            const overdue = new Date(t.due_date).setHours(0, 0, 0, 0) < today;
                                            return (
                                                <li key={t.uuid} className="flex items-center justify-between gap-3 py-2.5">
                                                    <div className="min-w-0">
                                                        <Link href={route('tasks.show', t.uuid)} className="truncate text-sm font-medium text-slate-800 hover:text-brand-700">{t.title}</Link>
                                                        <p className="truncate text-xs text-slate-400">{t.project} · due <span className={overdue ? 'font-semibold text-rose-500' : ''}>{fmt(t.due_date)}</span></p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {overdue && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600">Overdue</span>}
                                                        <Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Assign Task tab */}
                    <div className={tab === 'tasks' ? '' : 'hidden'}>
                        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                            {assignStatus === 'all' ? 'All Assigned Tasks' : TASK_LABEL[assignStatus]}
                            {assignStatus !== 'all' && <Badge tone={TASK_TONE[assignStatus] ?? 'slate'}>{statusCount(assignStatus)}</Badge>}
                        </h2>

                        {/* Status filters + search — same row */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setAssignStatus('all')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${assignStatus === 'all' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    All <span className={`ml-1 ${assignStatus === 'all' ? 'text-white/70' : 'text-slate-400'}`}>{tasks.length}</span>
                                </button>
                                {STATUS_KEYS.map((s) => {
                                    const c = CHIP_COLORS[s];
                                    const on = assignStatus === s;
                                    return (
                                        <button key={s} onClick={() => setAssignStatus(s)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? c.active : c.idle}`}>
                                            {TASK_LABEL[s]} <span className={`ml-1 ${on ? 'text-white/70' : 'opacity-60'}`}>{statusCount(s)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <SearchInput value={q} onChange={setQ} placeholder="Search assigned tasks…" />
                        </div>
                        {(() => {
                            const rows = tasks
                                .filter((t) => assignStatus === 'all' || t.status === assignStatus)
                                .filter((t) => match(t.title, t.project, t.status, t.created_by));
                            if (tasks.length === 0) return <p className="text-sm text-slate-400">No tasks assigned.</p>;
                            if (rows.length === 0) return <p className="text-sm text-slate-400">No tasks match this filter.</p>;
                            return (
                                <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                                    <ul className="min-w-[500px] divide-y divide-slate-100">
                                        {rows.map((t) => (
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
                            );
                        })()}
                    </div>

                    {/* Created Task tab */}
                    <div className={tab === 'created' ? '' : 'hidden'}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <SectionTitle>Created Tasks ({createdCount})</SectionTitle>
                            <SearchInput value={q} onChange={setQ} placeholder="Search created tasks…" />
                        </div>
                        {(() => {
                            const groups = createdTasks
                                .map((g) => ({ ...g, tasks: g.tasks.filter((t) => match(t.title, g.project, t.status)) }))
                                .filter((g) => g.tasks.length > 0);
                            if (createdCount === 0) return <p className="text-sm text-slate-400">You haven't created any tasks.</p>;
                            if (groups.length === 0) return <p className="text-sm text-slate-400">No created tasks match “{q}”.</p>;
                            return (
                                <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                                    <div className="min-w-[500px] space-y-4">
                                        {groups.map((g) => (
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
                            );
                        })()}
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
