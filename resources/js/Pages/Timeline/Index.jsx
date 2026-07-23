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

    const { rows, min, days, taskPos } = useMemo(() => {
        let lo = Infinity, hi = -Infinity;
        const flat = [];
        projects.forEach((p) => {
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
    }, [projects]);

    const depEdges = useMemo(() => {
        const edges = [];
        projects.forEach((p) => (p.deps ?? []).forEach((d) => {
            const a = taskPos[d.from]; const b = taskPos[d.to];
            if (a && b) edges.push({ a, b, key: `${d.from}-${d.to}` });
        }));
        return edges;
    }, [projects, taskPos]);

    const width = days * DAY_W;

    const months = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(min + i * MS);
        if (i === 0 || d.getUTCDate() === 1) months.push({ i, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }) });
    }
    const todayOff = Math.round((Date.now() - min) / MS);

    const findUuid = (id) => projects.flatMap((p) => p.tasks).find((t) => t.id === id)?.uuid;

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
        <AuthenticatedLayout header={<PageHeader title="Timeline" subtitle="Gantt view · drag a bar to reschedule" />}>
            <Head title="Timeline" />

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
        </AuthenticatedLayout>
    );
}
