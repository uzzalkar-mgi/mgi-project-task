import { Head, useForm } from '@inertiajs/react';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });
    const submit = (e) => { e.preventDefault(); post(route('two-factor.challenge')); };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center p-4" style={{ backgroundColor: '#84C4E7' }}>
            <Head title="Two-Factor Authentication" />
            <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
                <div className="mb-5 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    </span>
                    <h1 className="mt-3 text-lg font-bold text-slate-900">Two-Factor Authentication</h1>
                    <p className="mt-1 text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>
                </div>
                <form onSubmit={submit}>
                    <input
                        autoFocus
                        inputMode="numeric"
                        maxLength={6}
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    {errors.code && <p className="mt-2 text-center text-sm text-rose-500">{errors.code}</p>}
                    <button type="submit" disabled={processing || data.code.length !== 6} className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                        {processing ? 'Verifying…' : 'Verify'}
                    </button>
                </form>
                <a href={route('login')} className="mt-4 block text-center text-xs text-slate-400 hover:text-slate-600">Back to sign in</a>
            </div>
        </div>
    );
}
