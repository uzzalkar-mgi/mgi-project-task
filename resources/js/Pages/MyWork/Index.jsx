import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };
const TASK_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const PRIORITY_TONE = { urgent: 'red', high: 'amber', normal: 'blue', low: 'slate' };
const inputCls = 'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

const PRESETS = [
    { key: 'open', label: 'Open' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'week', label: 'Due this week' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'all', label: 'All' },
];

export default function Index({ tasks, filters }) {
    const [preset, setPreset] = useState('open');
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [project, setProject] = useState('');

    const today = new Date().setHours(0, 0, 0, 0);
    const weekEnd = today + 7 * 864e5;
    const dueMs = (d) => (d ? new Date(d).setHours(0, 0, 0, 0) : null);

    const projectOpts = useMemo(() => {
        const seen = new Set(); const out = [];
        tasks.forEach((t) => { if (t.project_uuid && !seen.has(t.project_uuid)) { seen.add(t.project_uuid); out.push({ uuid: t.project_uuid, name: t.project }); } });
        return out;
    }, [tasks]);

    const count = (key) => tasks.filter((t) => byPreset(t, key)).length;
    function byPreset(t, key) {
        const d = dueMs(t.due_date);
        switch (key) {
            case 'overdue': return t.status !== 'done' && d != null && d < today;
            case 'week': return t.status !== 'done' && d != null && d >= today && d <= weekEnd;
            case 'blocked': return t.status === 'blocked';
            case 'open': return t.status !== 'done';
            default: return true;
        }
    }

    const term = q.trim().toLowerCase();
    const rows = tasks
        .filter((t) => byPreset(t, preset))
        .filter((t) => !status || t.status === status)
        .filter((t) => !project || t.project_uuid === project)
        .filter((t) => !term || [t.title, t.project, t.task_no].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));

    const saveFilter = () => {
        const name = prompt('Save this filter as:');
        if (!name) return;
        router.post(route('mywork.filters.store'), { name, criteria: { preset, status, project, q } }, { preserveScroll: true, preserveState: false });
    };
    const applyFilter = (f) => {
        const c = f.criteria ?? {};
        setPreset(c.preset ?? 'all'); setStatus(c.status ?? ''); setProject(c.project ?? ''); setQ(c.q ?? '');
    };
    const removeFilter = (f) => { if (confirm(`Delete filter “${f.name}”?`)) router.delete(route('mywork.filters.destroy', f.id), { preserveScroll: true }); };

    return (
        <AuthenticatedLayout header={<PageHeader title="My Work" subtitle="Everything assigned to you, across projects." />}>
            <Head title="My Work" />

            {/* Presets */}
            <div className="mb-4 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                    <button key={p.key} onClick={() => setPreset(p.key)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${preset === p.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {p.label} <span className={preset === p.key ? 'text-white/70' : 'text-slate-400'}>{count(p.key)}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={q} onChange={setQ} placeholder="Search…" />
                    <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Any status</option>
                        {Object.entries(TASK_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <select className={inputCls} value={project} onChange={(e) => setProject(e.target.value)}>
                        <option value="">Any project</option>
                        {projectOpts.map((p) => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                    </select>
                    <button onClick={saveFilter} className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                        <Icon name="plus" className="h-4 w-4" /> Save filter
                    </button>
                </div>
                {filters.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved</span>
                        {filters.map((f) => (
                            <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-600">
                                <button onClick={() => applyFilter(f)} className="font-medium hover:text-brand-700">{f.name}</button>
                                <button onClick={() => removeFilter(f)} className="rounded-full px-1.5 text-slate-400 hover:bg-slate-200 hover:text-rose-500">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </Card>

            {/* List */}
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-800">{rows.length} task{rows.length === 1 ? '' : 's'}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.map((t) => {
                                const overdue = t.status !== 'done' && dueMs(t.due_date) != null && dueMs(t.due_date) < today;
                                return (
                                    <tr key={t.uuid} onClick={() => router.visit(route('tasks.show', t.uuid))} className="cursor-pointer hover:bg-slate-50">
                                        <td className="px-4 py-3"><span className="font-medium text-slate-800">{t.title}</span><span className="ml-2 text-xs text-slate-400">#{t.task_no}</span></td>
                                        <td className="px-4 py-3 text-slate-500">{t.project}</td>
                                        <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[t.priority] ?? 'slate'}>{t.priority}</Badge></td>
                                        <td className="px-4 py-3"><Badge tone={TASK_TONE[t.status] ?? 'slate'}>{TASK_LABEL[t.status] ?? t.status}</Badge></td>
                                        <td className={`px-4 py-3 ${overdue ? 'font-semibold text-rose-500' : 'text-slate-500'}`}>{fmt(t.due_date)}</td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">Nothing here. 🎉</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
