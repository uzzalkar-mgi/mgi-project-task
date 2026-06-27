import { Icon } from '@/Components/ui/Icon';
import { Combobox } from '@/Components/ui/Combobox';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    departments = [],
    designations = [],
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            office_contact: user.office_contact ?? '',
            department_id: user.department_id ?? '',
            designation_id: user.designation_id ?? '',
        });

    const deptOpts = departments.map((d) => ({ value: d.id, label: d.name }));
    const desigOpts = designations
        .filter((d) => !data.department_id || !d.department_id || String(d.department_id) === String(data.department_id))
        .map((d) => ({ value: d.id, label: d.name }));

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const inputCls = (hasError) =>
        `w-full rounded-lg border py-2.5 pl-11 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-100 ${
            hasError ? 'border-rose-400' : 'border-slate-300 focus:border-brand-500'
        }`;

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-semibold text-slate-900">Profile Information</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Update your account's name and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="user" className="h-4 w-4" />
                        </span>
                        <input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            autoComplete="name"
                            className={inputCls(Boolean(errors.name))}
                        />
                    </div>
                    {errors.name && <p className="mt-1.5 text-sm text-rose-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="bell" className="h-4 w-4" />
                        </span>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            className={inputCls(Boolean(errors.email))}
                        />
                    </div>
                    {errors.email && <p className="mt-1.5 text-sm text-rose-500">{errors.email}</p>}
                </div>

                {/* Office Contact */}
                <div>
                    <label htmlFor="office_contact" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Office Contact
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        </span>
                        <input
                            id="office_contact"
                            value={data.office_contact}
                            onChange={(e) => setData('office_contact', e.target.value)}
                            placeholder="e.g. 01711000000"
                            autoComplete="tel"
                            className={inputCls(Boolean(errors.office_contact))}
                        />
                    </div>
                    {errors.office_contact && <p className="mt-1.5 text-sm text-rose-500">{errors.office_contact}</p>}
                </div>

                {/* Department */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Department</label>
                    <Combobox options={deptOpts} value={data.department_id} onChange={(v) => { setData('department_id', v); setData('designation_id', ''); }} placeholder="Select department…" />
                    {errors.department_id && <p className="mt-1.5 text-sm text-rose-500">{errors.department_id}</p>}
                </div>

                {/* Designation */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Designation</label>
                    <Combobox options={desigOpts} value={data.designation_id} onChange={(v) => setData('designation_id', v)} placeholder="Select designation…" />
                    {errors.designation_id && <p className="mt-1.5 text-sm text-rose-500">{errors.designation_id}</p>}
                </div>
              </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        Your email address is unverified.
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="ml-1 font-medium text-brand-600 underline hover:text-brand-700"
                        >
                            Re-send verification email.
                        </Link>
                        {status === 'verification-link-sent' && (
                            <p className="mt-1 font-medium text-emerald-600">
                                A new verification link has been sent.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        Save Changes
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-medium text-emerald-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
