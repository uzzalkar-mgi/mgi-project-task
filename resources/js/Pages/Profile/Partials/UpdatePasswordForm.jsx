import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

function PasswordField({ id, label, value, onChange, error, inputRef, autoComplete, visible, onToggle }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
                {label} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                </span>
                <input
                    id={id}
                    ref={inputRef}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className={`w-full rounded-lg border py-2.5 pl-11 pr-16 text-sm outline-none transition focus:ring-2 focus:ring-brand-100 ${
                        error ? 'border-rose-400' : 'border-slate-300 focus:border-brand-500'
                    }`}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
            {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
        </div>
    );
}

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const [show, setShow] = useState({ current: false, password: false, confirm: false });
    const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-semibold text-slate-900">Update Password</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Use a long, random password to keep your account secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-5 space-y-4">
                <PasswordField
                    id="current_password"
                    label="Current Password"
                    value={data.current_password}
                    onChange={(e) => setData('current_password', e.target.value)}
                    error={errors.current_password}
                    inputRef={currentPasswordInput}
                    autoComplete="current-password"
                    visible={show.current}
                    onToggle={() => toggle('current')}
                />
                <PasswordField
                    id="password"
                    label="New Password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    inputRef={passwordInput}
                    autoComplete="new-password"
                    visible={show.password}
                    onToggle={() => toggle('password')}
                />
                <PasswordField
                    id="password_confirmation"
                    label="Confirm Password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    visible={show.confirm}
                    onToggle={() => toggle('confirm')}
                />

                <div className="flex items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        Update Password
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
