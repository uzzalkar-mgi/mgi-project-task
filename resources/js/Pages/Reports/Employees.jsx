import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function Stat({ label, value, tone }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-0.5 text-2xl font-bold ${tone}`}>{value}</p>
        </div>
    );
}

function Bar({ pct }) {
    const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600">{pct}%</span>
        </div>
    );
}

export default function Employees({ rows, totals }) {
    const [q, setQ] = useState('');
    const term = q.trim().toLowerCase();
    const filtered = term
        ? rows.filter((r) => [r.name, r.employee_id, r.designation].filter(Boolean).some((v) => v.toLowerCase().includes(term)))
        : rows;

    return (
        <AuthenticatedLayout header={<PageHeader title="Employee Report" subtitle="Task workload & completion per employee." actions={<SearchInput value={q} onChange={setQ} placeholder="Search employee…" />} />}>
            <Head title="Employee Report" />

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Employees" value={totals.employees} tone="text-slate-800" />
                <Stat label="Total Tasks" value={totals.tasks} tone="text-brand-600" />
                <Stat label="Completed" value={totals.done} tone="text-emerald-600" />
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3 text-center">Created</th>
                                <th className="px-4 py-3 text-center">To Do</th>
                                <th className="px-4 py-3 text-center">In Progress</th>
                                <th className="px-4 py-3 text-center">Under Review</th>
                                <th className="px-4 py-3 text-center">Blocked</th>
                                <th className="px-4 py-3 text-center">Done</th>
                                <th className="px-4 py-3 text-center">Total</th>
                                <th className="px-4 py-3">Completion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(r.name)}</span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-800">{r.name}</p>
                                                <p className="truncate text-xs text-slate-400">{r.employee_id ?? '—'}{r.designation ? ` · ${r.designation}` : ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600">{r.created}</td>
                                    <td className="px-4 py-3 text-center"><Badge tone="slate">{r.todo}</Badge></td>
                                    <td className="px-4 py-3 text-center"><Badge tone="blue">{r.in_progress}</Badge></td>
                                    <td className="px-4 py-3 text-center"><Badge tone="amber">{r.under_review}</Badge></td>
                                    <td className="px-4 py-3 text-center"><Badge tone="red">{r.blocked}</Badge></td>
                                    <td className="px-4 py-3 text-center"><Badge tone="green">{r.done}</Badge></td>
                                    <td className="px-4 py-3 text-center font-semibold text-slate-800">{r.total}</td>
                                    <td className="px-4 py-3"><Bar pct={r.done_pct} /></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No employees.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
