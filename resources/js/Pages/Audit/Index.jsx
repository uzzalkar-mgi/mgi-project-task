import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const ACTION_TONE = { created: 'green', updated: 'slate', status: 'blue', commented: 'slate', answered: 'blue', logged: 'amber' };
const inputCls = 'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function Index({ logs, filters, users, projects, actions }) {
    const [f, setF] = useState({
        q: filters.q ?? '', user_id: filters.user_id ?? '', action: filters.action ?? '',
        project_id: filters.project_id ?? '', from: filters.from ?? '', to: filters.to ?? '',
    });

    const apply = () => {
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v != null));
        router.get(route('audit.index'), params, { preserveState: true, preserveScroll: true });
    };
    const reset = () => { setF({ q: '', user_id: '', action: '', project_id: '', from: '', to: '' }); router.get(route('audit.index')); };

    return (
        <AuthenticatedLayout header={<PageHeader title="Audit Log" subtitle="Every recorded action across the system." />}>
            <Head title="Audit Log" />

            {/* Filters */}
            <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[160px]">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Search</label>
                        <input className={`${inputCls} w-full`} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="Description…" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">User</label>
                        <select className={inputCls} value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })}>
                            <option value="">Anyone</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Action</label>
                        <select className={inputCls} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
                            <option value="">Any</option>
                            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Project</label>
                        <select className={inputCls} value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })}>
                            <option value="">Any</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</label>
                        <input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">To</label>
                        <input type="date" className={inputCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
                    </div>
                    <button onClick={apply} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Icon name="search" className="h-4 w-4" /> Filter</button>
                    <button onClick={reset} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">Reset</button>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">When</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.data.map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500" title={l.ago}>{l.at}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{l.user}</td>
                                    <td className="px-4 py-3"><Badge tone={ACTION_TONE[l.action] ?? 'slate'}>{l.action}</Badge></td>
                                    <td className="px-4 py-3 text-slate-600">{l.description}</td>
                                    <td className="px-4 py-3">
                                        {l.task_uuid
                                            ? <Link href={route('tasks.show', l.task_uuid)} className="font-medium text-brand-600 hover:underline">Task{l.project ? ` · ${l.project}` : ''}</Link>
                                            : l.project_uuid
                                                ? <Link href={route('projects.show', l.project_uuid)} className="font-medium text-brand-600 hover:underline">{l.project}</Link>
                                                : <span className="text-slate-400">{l.subject}</span>}
                                    </td>
                                </tr>
                            ))}
                            {logs.data.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No activity matches these filters.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
                        <span className="text-slate-400">Page {logs.current_page} of {logs.last_page} · {logs.total} entries</span>
                        <div className="flex flex-wrap gap-1">
                            {logs.links.map((lnk, i) => (
                                lnk.url
                                    ? <Link key={i} href={lnk.url} preserveScroll className={`rounded-md px-3 py-1 ${lnk.active ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`} dangerouslySetInnerHTML={{ __html: lnk.label }} />
                                    : <span key={i} className="rounded-md px-3 py-1 text-slate-300" dangerouslySetInnerHTML={{ __html: lnk.label }} />
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
