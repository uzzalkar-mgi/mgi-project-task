import { Card, PageHeader } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_TONE = {
    task: 'bg-brand-100 text-brand-700',
    meeting: 'bg-emerald-100 text-emerald-700',
};

export default function Index({ events }) {
    const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

    const byDate = useMemo(() => {
        const map = {};
        events.forEach((e) => { (map[e.date] ??= []).push(e); });
        return map;
    }, [events]);

    const { cells, monthLabel } = useMemo(() => {
        const first = new Date(cursor.y, cursor.m, 1);
        const start = new Date(first);
        start.setDate(1 - first.getDay()); // back to Sunday
        const cells = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            cells.push({ d, key, inMonth: d.getMonth() === cursor.m });
        }
        return { cells, monthLabel: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) };
    }, [cursor]);

    const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const shift = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Calendar"
                    subtitle="Your task due dates & meetings."
                    actions={
                        <a href={route('calendar.ics')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <Icon name="download" className="h-4 w-4" /> Export .ics
                        </a>
                    }
                />
            }
        >
            <Head title="Calendar" />

            <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => shift(-1)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">‹</button>
                        <h2 className="min-w-[160px] text-center text-sm font-bold text-slate-800">{monthLabel}</h2>
                        <button onClick={() => shift(1)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">›</button>
                        <button onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }} className="ml-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Today</button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-400" /> Task due</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-400" /> Meeting</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-l border-t border-slate-100 text-xs">
                    {WD.map((w) => <div key={w} className="border-b border-r border-slate-100 bg-slate-50 px-2 py-1.5 font-semibold uppercase tracking-wide text-slate-400">{w}</div>)}
                    {cells.map((c) => {
                        const evs = byDate[c.key] ?? [];
                        return (
                            <div key={c.key} className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 ${c.inMonth ? '' : 'bg-slate-50/60'}`}>
                                <div className={`mb-1 text-right text-xs ${c.key === todayKey ? 'font-bold text-brand-600' : c.inMonth ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {c.key === todayKey ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">{c.d.getDate()}</span> : c.d.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {evs.slice(0, 3).map((e, i) => (
                                        <button key={i} onClick={() => router.visit(e.link)} title={e.title} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${EVENT_TONE[e.type]}`}>
                                            {e.meta && e.type === 'meeting' ? `${e.meta} · ` : ''}{e.title}
                                        </button>
                                    ))}
                                    {evs.length > 3 && <p className="px-1 text-[10px] text-slate-400">+{evs.length - 3} more</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
