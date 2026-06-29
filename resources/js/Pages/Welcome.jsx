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
    { name: 'Employee', desc: 'Works assigned tasks, updates status, collaborates.', tone: 'bg-amber-100 text-amber-700' },
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
                        <nav className="flex items-center gap-1">
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                                >
                                    Sign in
                                </Link>
                            )}
                        </nav>
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

                {/* About */}
                <section id="about" className="border-t border-slate-200 bg-slate-50">
                    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-2">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">About the System</h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                The Project Tracking System (PTS) is an in-house platform built for
                                <span className="font-semibold text-slate-800"> Meghna Group of Industries</span> to plan,
                                assign and monitor projects and tasks across teams. It replaces scattered spreadsheets with a
                                single source of truth — clear ownership, live status, timelines and accountability from start
                                to delivery.
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                {['Centralised projects, tasks and milestones',
                                  'Role-based access (Admin · Manager · Employee)',
                                  'Kanban board, Gantt timeline and dashboards',
                                  'Comments, attachments and deadline alerts'].map((t) => (
                                    <li key={t} className="flex items-start gap-2">
                                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-500 p-8 text-white">
                            <h3 className="text-lg font-bold">Meghna Group of Industries</h3>
                            <p className="mt-3 text-sm leading-relaxed text-white/90">
                                Meghna Group of Industries (MGI) is one of the largest and fastest-growing conglomerates in
                                Bangladesh, operating across FMCG, cement, food &amp; beverage, chemicals, power, shipping and
                                more — with a nationwide network and tens of thousands of employees.
                            </p>
                            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/20 pt-5 text-center">
                                <div><p className="text-2xl font-bold">50+</p><p className="text-xs text-white/80">Years</p></div>
                                <div><p className="text-2xl font-bold">50+</p><p className="text-xs text-white/80">Concerns</p></div>
                                <div><p className="text-2xl font-bold">50k+</p><p className="text-xs text-white/80">Employees</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section id="contact" className="border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-6 py-14">
                        <h2 className="text-center text-2xl font-bold text-slate-900">Contact Us</h2>
                        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
                            For access or support, reach the Meghna Group of Industries IT team.
                        </p>
                        <div className="mt-8 grid gap-5 sm:grid-cols-3">
                            {[
                                { icon: 'M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z', label: 'Address', value: 'Fresh House, House # 23, Road # 24, Gulshan # 2, Dhaka-1212' },
                                { icon: 'M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z', label: 'Phone', value: '+880 9666777055' },
                                { icon: 'M4 4h16v16H4z M22 6l-10 7L2 6', label: 'Email', value: 'info@mgi.org' },
                            ].map((c) => (
                                <div key={c.label} className="rounded-xl border border-slate-200 p-5 text-center">
                                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                                    </span>
                                    <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.label}</h3>
                                    <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{c.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center">
                            <a href="https://www.mgi.org" target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 hover:underline">www.mgi.org</a>
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
