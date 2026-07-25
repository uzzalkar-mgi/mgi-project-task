import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';

const DAY_W = 26;
const ROW_H = 38;
const HEAD_H = 44;
const LABEL_W = 240;

const STATUS_BAR = { todo: 'bg-slate-400', in_progress: 'bg-sky-500', under_review: 'bg-amber-500', done: 'bg-emerald-500', blocked: 'bg-rose-500' };
const TASK_TONE = { todo: 'slate', in_progress: 'blue', under_review: 'amber', done: 'green', blocked: 'red' };

const MS = 864e5;
const parse = (d) => (d ? Date.parse(d + 'T00:00:00Z') : null);
const addDays = (ms, n) => new Date(ms + n * MS).toISOString().slice(0, 10);

export default function Index({ projects }) {
    const [drag, setDrag] = useState(null); // { id, deltaDays }
    const dragRef = useRef(null);

    // One project at a time keeps the chart small & readable.
    const withTasks = useMemo(() => projects.filter((p) => p.tasks.length > 0), [projects]);
    const [sel, setSel] = useState(withTasks[0]?.uuid ?? '');
    const shown = useMemo(() => projects.filter((p) => p.uuid === sel), [projects, sel]);

    const { rows, min, days, taskPos } = useMemo(() => {
        let lo = Infinity, hi = -Infinity;
        const flat = [];
        shown.forEach((p) => {
            flat.push({ type: 'project', key: 'p' + p.uuid, name: p.name, status: p.status });
            p.tasks.forEach((t) => {
                const s = parse(t.start_date) ?? parse(t.due_date);
                const e = parse(t.due_date) ?? parse(t.start_date);
                if (s != null) lo = Math.min(lo, s);
                if (e != null) hi = Math.max(hi, e);
                flat.push({ type: 'task', key: 't' + t.uuid, t, s, e });
            });
        });
        if (!isFinite(lo)) { lo = Date.now(); hi = lo + 14 * MS; }
        lo -= 3 * MS; hi += 3 * MS;
        const min = lo;
        const days = Math.max(1, Math.round((hi - lo) / MS) + 1);
        const taskPos = {};
        flat.forEach((r, i) => {
            if (r.type === 'task' && r.s != null && r.e != null) {
                const o = Math.round((r.s - min) / MS);
                const dur = Math.max(1, Math.round((r.e - r.s) / MS) + 1);
                taskPos[r.t.id] = { x0: o * DAY_W, x1: (o + dur) * DAY_W, y: i * ROW_H + ROW_H / 2, o, dur };
            }
        });
        return { rows: flat, min, days, taskPos };
    }, [shown]);

    const depEdges = useMemo(() => {
        const edges = [];
        shown.forEach((p) => (p.deps ?? []).forEach((d) => {
            const a = taskPos[d.from]; const b = taskPos[d.to];
            if (a && b) edges.push({ a, b, key: `${d.from}-${d.to}` });
        }));
        return edges;
    }, [shown, taskPos]);

    const width = days * DAY_W;

    const months = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(min + i * MS);
        if (i === 0 || d.getUTCDate() === 1) months.push({ i, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }) });
    }
    const todayOff = Math.round((Date.now() - min) / MS);

    const findUuid = (id) => shown.flatMap((p) => p.tasks).find((t) => t.id === id)?.uuid;

    // Status counters for the selected project.
    const allTasks = useMemo(() => shown.flatMap((p) => p.tasks), [shown]);
    const stat = (s) => allTasks.filter((t) => t.status === s).length;
    const STATS = [
        { key: 'total', label: 'Total Tasks', value: allTasks.length, bar: 'bg-brand-500', text: 'text-brand-700' },
        { key: 'in_progress', label: 'In Progress', value: stat('in_progress'), bar: 'bg-sky-500', text: 'text-sky-600' },
        { key: 'under_review', label: 'Under Review', value: stat('under_review'), bar: 'bg-amber-500', text: 'text-amber-600' },
        { key: 'todo', label: 'To Do', value: stat('todo'), bar: 'bg-slate-400', text: 'text-slate-600' },
        { key: 'done', label: 'Done', value: stat('done'), bar: 'bg-emerald-500', text: 'text-emerald-600' },
        { key: 'blocked', label: 'Blocked', value: stat('blocked'), bar: 'bg-rose-500', text: 'text-rose-600' },
    ];

    const onMove = (e) => { const d = dragRef.current; if (d) setDrag({ id: d.id, deltaDays: Math.round((e.clientX - d.startX) / DAY_W) }); };
    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const d = dragRef.current; dragRef.current = null;
        setDrag((cur) => {
            if (d && cur && cur.deltaDays !== 0) {
                const uuid = findUuid(d.id);
                if (uuid) router.patch(route('tasks.dates', uuid), { start_date: addDays(min, d.o + cur.deltaDays), due_date: addDays(min, d.o + cur.deltaDays + d.dur - 1) }, { preserveScroll: true });
            }
            return null;
        });
    };
    const onDown = (e, r) => {
        if (!r.t.can_move) return;
        e.preventDefault();
        dragRef.current = { id: r.t.id, startX: e.clientX, o: taskPos[r.t.id].o, dur: taskPos[r.t.id].dur };
        setDrag({ id: r.t.id, deltaDays: 0 });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Timeline"
                    subtitle="Gantt view · drag a bar to reschedule"
                    actions={
                        withTasks.length > 0 && (
                            <select
                                value={sel}
                                onChange={(e) => setSel(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                            >
                                {withTasks.map((p) => <option key={p.uuid} value={p.uuid}>{p.name} ({p.tasks.length})</option>)}
                            </select>
                        )
                    }
                />
            }
        >
            <Head title="Timeline" />

            {withTasks.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">No scheduled tasks</h2>
                    <p className="mt-1 text-sm text-slate-500">Projects with dated tasks will appear here on the timeline.</p>
                </Card>
            ) : (
            <>
            {/* Status counters */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {STATS.map((s) => (
                    <div key={s.key} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} />
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
                        </div>
                        <p className={`mt-1 text-2xl font-bold ${s.text}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <Card className="overflow-hidden">
                <div className="flex">
                    {/* Label column */}
                    <div className="shrink-0 border-r border-slate-200" style={{ width: LABEL_W }}>
                        <div style={{ height: HEAD_H }} className="flex items-center border-b border-slate-100 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Project / Task</div>
                        {rows.map((r) => (
                            <div key={r.key} style={{ height: ROW_H }} className={`flex items-center border-b border-slate-50 px-4 ${r.type === 'project' ? 'bg-slate-50' : ''}`}>
                                {r.type === 'project'
                                    ? <span className="truncate text-sm font-bold text-slate-800">{r.name}</span>
                                    : <span className="truncate text-sm text-slate-600" title={r.t.title}>{r.t.title}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-x-auto">
                        <div style={{ width }}>
                            <div className="relative border-b border-slate-100" style={{ height: HEAD_H }}>
                                {months.map((m) => <div key={m.i} className="absolute top-1 text-[11px] font-semibold text-slate-500" style={{ left: m.i * DAY_W + 2 }}>{m.label}</div>)}
                                {Array.from({ length: days }).map((_, i) => {
                                    const d = new Date(min + i * MS);
                                    const we = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                                    return <div key={i} className={`absolute bottom-1 text-center text-[9px] ${we ? 'text-rose-300' : 'text-slate-300'}`} style={{ left: i * DAY_W, width: DAY_W }}>{d.getUTCDate()}</div>;
                                })}
                            </div>

                            <div className="relative" style={{ height: rows.length * ROW_H }}>
                                {Array.from({ length: days }).map((_, i) => {
                                    const d = new Date(min + i * MS);
                                    const we = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                                    return we ? <div key={i} className="absolute top-0 bottom-0 bg-slate-50/70" style={{ left: i * DAY_W, width: DAY_W }} /> : null;
                                })}
                                {todayOff >= 0 && todayOff < days && <div className="absolute top-0 bottom-0 z-10 w-px bg-rose-400" style={{ left: todayOff * DAY_W + DAY_W / 2 }} />}
                                {rows.map((r, i) => <div key={r.key} className={`absolute left-0 right-0 border-b border-slate-50 ${r.type === 'project' ? 'bg-slate-50/40' : ''}`} style={{ top: i * ROW_H, height: ROW_H }} />)}

                                <svg className="pointer-events-none absolute inset-0" width={width} height={rows.length * ROW_H}>
                                    <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" /></marker></defs>
                                    {depEdges.map((e) => {
                                        const midX = Math.max(e.a.x1 + 8, e.b.x0 - 8);
                                        return <path key={e.key} d={`M ${e.a.x1} ${e.a.y} H ${midX} V ${e.b.y} H ${e.b.x0}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />;
                                    })}
                                </svg>

                                {rows.map((r, i) => {
                                    if (r.type !== 'task') return null;
                                    const pos = taskPos[r.t.id];
                                    if (!pos) return null;
                                    const isDrag = drag?.id === r.t.id;
                                    const shift = isDrag ? drag.deltaDays * DAY_W : 0;
                                    return (
                                        <div
                                            key={r.key}
                                            onMouseDown={(e) => onDown(e, r)}
                                            onClick={() => { if (!(drag && drag.id === r.t.id && drag.deltaDays !== 0)) router.visit(route('tasks.show', r.t.uuid)); }}
                                            title={`${r.t.title} · ${r.t.start_date ?? '?'} → ${r.t.due_date ?? '?'}`}
                                            className={`absolute z-20 flex items-center rounded px-2 text-[11px] font-medium text-white shadow-sm ${STATUS_BAR[r.t.status] ?? 'bg-slate-400'} ${r.t.can_move ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDrag ? 'opacity-80 ring-2 ring-brand-300' : ''}`}
                                            style={{ left: pos.x0 + shift, top: i * ROW_H + 7, width: pos.x1 - pos.x0, height: ROW_H - 14 }}
                                        >
                                            <span className="truncate">{r.t.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {Object.keys(STATUS_BAR).map((k) => <Badge key={k} tone={TASK_TONE[k]}>{k.replace('_', ' ')}</Badge>)}
                <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-rose-400" /> today</span>
                <span className="text-slate-400">Arrows = dependencies · drag a bar to reschedule</span>
            </div>
            </>
            )}
        </AuthenticatedLayout>
    );
}
