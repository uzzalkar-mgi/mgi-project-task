import { Head, Link } from '@inertiajs/react';

const FEATURES = [
    {
        title: 'Projects & Timelines',
        desc: 'Plan projects with start/end dates, priority, milestones and a Gantt-style timeline.',
        icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 4h6m-6 4h10',
    },
    {
        title: 'Task Assignment',
        desc: 'Break work into tasks, assign one or many members, set due dates, priorities and dependencies.',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
        title: 'Status Workflow',
        desc: 'To Do → In Progress → Under Review → Done, plus Blocked — clear status at every step.',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
        title: 'Dashboards & Alerts',
        desc: 'Real-time project health (RAG), overdue alerts, workload charts and deadline reminders.',
        icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
    },
];

const ROLES = [
    { name: 'Admin', desc: 'Full access. Manages users, roles and every project.', tone: 'bg-brand-100 text-brand-700' },
    { name: 'Manager', desc: 'Creates projects, assigns tasks, views analytics.', tone: 'bg-emerald-100 text-emerald-700' },
    { name: 'Member', desc: 'Works assigned tasks, updates status, collaborates.', tone: 'bg-amber-100 text-amber-700' },
];

function Logo() {
    return (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            PTS
        </span>
    );
}

export default function Welcome({ canLogin }) {
    return (
        <>
            <Head title="Project Tracking System" />

            <div className="min-h-screen bg-slate-50 text-slate-800">
                {/* Top bar */}
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <Logo />
                            <div>
                                <p className="text-sm font-bold text-slate-900">MGI · Project Tracking System</p>
                                <p className="text-xs text-slate-500">Manage projects · Assign tasks · Track timelines</p>
                            </div>
                        </div>
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </header>

                {/* Hero */}
                <section className="mx-auto max-w-6xl px-6 py-16 text-center animate-fade-in">
                    <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                        Centralised project & task tracking for MGI teams
                    </span>
                    <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                        Plan, assign and track every project in one place.
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                        A focused project management system — project timelines, task assignment with clear
                        accountability, status visibility and real-time dashboards. One source of truth, no more
                        scattered spreadsheets.
                    </p>
                    {canLogin && (
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <Link
                                href={route('login')}
                                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                            >
                                Get started
                            </Link>
                            <a
                                href="#features"
                                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                            >
                                Learn more
                            </a>
                        </div>
                    )}
                    <p className="mt-4 text-xs text-slate-400">
                        Accounts are created by your administrator. Contact your Admin for access.
                    </p>
                </section>

                {/* Features */}
                <section id="features" className="mx-auto max-w-6xl px-6 pb-16">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                                    </svg>
                                </span>
                                <h3 className="mt-3 text-sm font-semibold text-slate-900">{f.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Roles */}
                <section className="border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-6 py-14">
                        <h2 className="text-center text-2xl font-bold text-slate-900">Built around clear roles</h2>
                        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
                            Role-based access keeps responsibility and visibility clear across the team.
                        </p>
                        <div className="mt-8 grid gap-5 sm:grid-cols-3">
                            {ROLES.map((r) => (
                                <div key={r.name} className="rounded-xl border border-slate-200 p-5">
                                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${r.tone}`}>
                                        {r.name}
                                    </span>
                                    <p className="mt-3 text-sm text-slate-600">{r.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-slate-50">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
                        <span>© {new Date().getFullYear()} MGI · Project Tracking System</span>
                        <span>Manage Projects · Assign Tasks · Track Timelines · Monitor Status</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
