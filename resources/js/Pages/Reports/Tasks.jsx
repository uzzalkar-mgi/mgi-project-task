import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_OPTS = [['todo', 'To Do'], ['in_progress', 'In Progress'], ['under_review', 'Under Review'], ['done', 'Done'], ['blocked', 'Blocked']];
const STATUS_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const STATUS_LABEL = Object.fromEntries(STATUS_OPTS);
const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };
const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Tasks({ users, filters, rows }) {
    const [employeeId, setEmployeeId] = useState(filters.employee_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const params = () => {
        const p = {};
        if (employeeId) p.employee_id = employeeId;
        if (status) p.status = status;
        return p;
    };

    const view = () => router.get(route('reports.tasks'), params(), { preserveState: true, preserveScroll: true });
    const download = () => {
        const qs = new URLSearchParams(params()).toString();
        window.location.href = route('reports.tasks.export') + (qs ? `?${qs}` : '');
    };

    return (
        <AuthenticatedLayout header={<PageHeader title="Task Report" subtitle="Filter tasks by employee & status, then view or export." />}>
            <Head title="Task Report" />

            <Card className="mb-6 p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Employee <span className="font-normal text-slate-400">(optional)</span></label>
                        <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                            <option value="">All employees</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.employee_id ? `${u.name} (${u.employee_id})` : u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Task Status</label>
                        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">All statuses</option>
                            {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 lg:col-span-2">
                        <button onClick={view} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                            <Icon name="eye" className="h-4 w-4" /> View
                        </button>
                        <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                            <Icon name="download" className="h-4 w-4" /> Download Excel
                        </button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-800">Results</h3>
                    <Badge tone="blue">{rows.length}</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Task No</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Assignees</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.task_no}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.project}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.assignees || '—'}</td>
                                    <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[r.priority] ?? 'slate'}>{r.priority}</Badge></td>
                                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status] ?? 'slate'}>{STATUS_LABEL[r.status] ?? r.status}</Badge></td>
                                    <td className="px-4 py-3 text-slate-500">{fmt(r.due_date)}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No tasks match the filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
