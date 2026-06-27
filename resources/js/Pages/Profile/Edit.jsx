import { Card, SectionTitle, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

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

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const { roles } = usePermissions();
    const role = roles?.[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : 'Member';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const [tab, setTab] = useState('personal'); // 'personal' | 'password'

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
                    </div>
                </Card>

                {/* Tabs: Personal Information | Password */}
                <Card className="p-5">
                    <div className="mb-5 flex gap-1 border-b border-slate-100">
                        {[
                            { key: 'personal', label: 'Personal Information' },
                            { key: 'password', label: 'Password' },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                                    tab === t.key
                                        ? 'border-brand-600 text-brand-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className={tab === 'personal' ? '' : 'hidden'}>
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} className="max-w-xl" />
                    </div>
                    <div className={tab === 'password' ? '' : 'hidden'}>
                        <UpdatePasswordForm className="max-w-xl" />
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
