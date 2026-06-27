import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const FEATURES = [
    'Project timelines & milestones',
    'Task assignment & tracking',
    'Real-time status dashboards',
];

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPwd, setShowPwd] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative min-h-screen w-full" style={{ backgroundColor: '#84C4E7' }}>
            <Head title="Sign in" />

            <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
                <div className="grid w-full max-w-4xl animate-fade-in overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[540px] md:grid-cols-2">
                    {/* Left — gradient visual */}
                    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 p-12 text-white md:flex">
                        <span className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-white/10" />
                        <span className="pointer-events-none absolute -bottom-12 -left-16 h-48 w-48 rounded-full bg-white/10" />

                        <div className="relative z-10">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                                    PTS
                                </span>
                                <span className="text-sm font-bold text-brand-700">MGI · Project Tracking</span>
                            </div>
                            <h2 className="mb-3 text-3xl font-bold leading-tight">Welcome back.</h2>
                            <p className="max-w-xs text-sm leading-relaxed text-white/90">
                                Sign in to plan projects, assign tasks and track every timeline — all in one place.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 grid gap-3">
                            {FEATURES.map((f) => (
                                <div key={f} className="flex items-center gap-3 text-sm">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m5 12 5 5L20 7" />
                                        </svg>
                                    </span>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — form */}
                    <div className="flex flex-col justify-center gap-4 p-8 sm:p-12">
                        {/* Mobile logo */}
                        <div className="mb-2 flex flex-col items-center text-center md:hidden">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                                PTS
                            </span>
                            <span className="mt-2 text-sm font-bold text-slate-700">MGI · Project Tracking</span>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h3>
                            <p className="mt-1 text-sm text-slate-500">Use your email and password.</p>
                        </div>

                        {status && (
                            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Email <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path d="m3 7 9 6 9-6" />
                                    </svg>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="you@mgi.org"
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-sm text-rose-500">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="11" width="16" height="10" rx="2" />
                                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                    </svg>
                                    <input
                                        id="password"
                                        type={showPwd ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-16 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                                    >
                                        {showPwd ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-rose-500">{errors.password}</p>}
                            </div>

                            {/* Remember + forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    Remember me
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {processing ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Signing in
                                        <span className="animate-[loader-dots_1.2s_infinite]">.</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-slate-400">
                            Accounts are created by your administrator.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
