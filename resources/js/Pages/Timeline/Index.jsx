import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

const STATUS_BAR = {
    todo: 'bg-slate-400',
    in_progress: 'bg-brand-500',
    under_review: 'bg-amber-500',
    done: 'bg-emerald-500',
    blocked: 'bg-rose-500',
};

const DAY = 86400000;
const d = (s) => (s ? new Date(s + 'T00:00:00').getTime() : null);

function fmt(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function Index({ projects }) {
    // Global date range across every task + project span.
    const dates = [];
    projects.forEach((p) => {
        if (p.start_date) dates.push(d(p.start_date));
        if (p.end_date) dates.push(d(p.end_date));
        p.tasks.forEach((t) => { if (t.start_date) dates.push(d(t.start_date)); if (t.due_date) dates.push(d(t.due_date)); });
        p.milestones.forEach((m) => { if (m.date) dates.push(d(m.date)); });
    });
    const min = dates.length ? Math.min(...dates) : Date.now();
    const max = dates.length ? Math.max(...dates) : Date.now() + 30 * DAY;
    const span = Math.max(max - min, DAY);

    const pct = (ts) => ((ts - min) / span) * 100;
    const today = Date.now();

    // Month tick marks.
    const ticks = [];
    const cur = new Date(min);
    cur.setDate(1);
    while (cur.getTime() <= max) {
        ticks.push({ ts: cur.getTime(), label: cur.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) });
        cur.setMonth(cur.getMonth() + 1);
    }

    return (
        <AuthenticatedLayout header={<PageHeader title="Timeline" subtitle="Project & task timeline (start → due)." />}>
            <Head title="Timeline" />

            {projects.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name="timeline" className="h-7 w-7" /></span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">Nothing to show</h2>
                    <p className="mt-1 text-sm text-slate-500">No projects with dates yet.</p>
                </Card>
            ) : (
                <Card className="p-5">
                    <div className="overflow-x-auto">
                        <div className="min-w-[720px]">
                            {/* Month header */}
                            <div className="relative mb-3 ml-56 h-5 border-b border-slate-100">
                                {ticks.map((t) => (
                                    <span key={t.ts} className="absolute -translate-x-1/2 text-[10px] font-medium uppercase text-slate-400" style={{ left: `${pct(t.ts)}%` }}>{t.label}</span>
                                ))}
                            </div>

                            {projects.map((p) => (
                                <div key={p.uuid} className="mb-5">
                                    <div className="mb-1 flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                                        <Badge tone="slate">{p.status}</Badge>
                                    </div>

                                    {p.tasks.length === 0 && <p className="ml-56 text-xs text-slate-400">No tasks.</p>}

                                    {p.tasks.map((t) => {
                                        const s = d(t.start_date) ?? d(t.due_date) ?? min;
                                        const e = d(t.due_date) ?? s;
                                        const left = pct(s);
                                        const width = Math.max(((e - s) / span) * 100, 1.5);
                                        return (
                                            <div key={t.uuid} className="flex items-center gap-2 py-1">
                                                <span className="w-56 shrink-0 truncate pr-2 text-xs text-slate-600" title={t.title}>{t.title}</span>
                                                <div className="relative h-5 flex-1 rounded bg-slate-50">
                                                    {/* today line */}
                                                    {today >= min && today <= max && (
                                                        <span className="absolute top-0 h-full w-px bg-rose-300" style={{ left: `${pct(today)}%` }} />
                                                    )}
                                                    <span
                                                        className={`absolute top-0.5 flex h-4 items-center rounded px-1.5 text-[10px] font-medium text-white ${STATUS_BAR[t.status] ?? 'bg-slate-400'}`}
                                                        style={{ left: `${left}%`, width: `${width}%` }}
                                                        title={`${fmt(s)} → ${fmt(e)}`}
                                                    >
                                                        <span className="truncate">{fmt(e)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Legend */}
                            <div className="ml-56 mt-2 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                {Object.entries({ todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' }).map(([k, l]) => (
                                    <span key={k} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${STATUS_BAR[k]}`} /> {l}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
