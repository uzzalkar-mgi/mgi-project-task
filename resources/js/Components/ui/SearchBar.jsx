import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', under_review: 'Under Review', done: 'Done', blocked: 'Blocked' };
const EMPTY = { tasks: [], projects: [], users: [], meetings: [] };

export function SearchBar() {
    const [q, setQ] = useState('');
    const [res, setRes] = useState(EMPTY);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef();
    const timer = useRef();

    useEffect(() => {
        const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        clearTimeout(timer.current);
        if (q.trim().length < 2) { setRes(EMPTY); setLoading(false); return; }
        setLoading(true);
        timer.current = setTimeout(() => {
            window.axios.get('/search', { params: { q } })
                .then((r) => { setRes(r.data ?? EMPTY); setOpen(true); })
                .catch(() => setRes(EMPTY))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(timer.current);
    }, [q]);

    const go = (url) => { setOpen(false); setQ(''); router.visit(url); };
    const total = res.tasks.length + res.projects.length + res.users.length + res.meetings.length;

    const Group = ({ label, items, render }) => items.length > 0 && (
        <div className="py-1">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            {items.map(render)}
        </div>
    );

    return (
        <div ref={boxRef} className="relative w-full">
            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-slate-600 shadow-sm ring-1 ring-black/5 transition focus-within:ring-2 focus-within:ring-brand-300">
                <svg className="h-[18px] w-[18px] shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => q.trim().length >= 2 && setOpen(true)}
                    onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                    placeholder="Search tasks, projects, people, meetings…"
                    className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                />
                {q && <button onClick={() => { setQ(''); setRes(EMPTY); }} className="text-lg leading-none text-slate-400 hover:text-slate-600">×</button>}
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white text-slate-700 shadow-xl ring-1 ring-black/5">
                    {loading ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-400">Searching…</p>
                    ) : total === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-400">No results for “{q}”.</p>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            <Group label="Tasks" items={res.tasks} render={(t) => (
                                <button key={t.uuid} onClick={() => go(`/tasks/${t.uuid}`)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50">
                                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{t.title}</span><span className="block text-xs text-slate-400">#{t.task_no}{t.project ? ` · ${t.project}` : ''}</span></span>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{STATUS_LABEL[t.status] ?? t.status}</span>
                                </button>
                            )} />
                            <Group label="Projects" items={res.projects} render={(p) => (
                                <button key={p.uuid} onClick={() => go(`/projects/${p.uuid}`)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50">
                                    <span className="truncate text-sm font-medium text-slate-800">{p.name}</span>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{p.status}</span>
                                </button>
                            )} />
                            <Group label="People" items={res.users} render={(u) => (
                                <button key={u.uuid} onClick={() => go(`/users/${u.uuid}`)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
                                    <span className="text-sm font-medium text-slate-800">{u.name}</span>
                                    <span className="text-xs text-slate-400">{u.employee_id}</span>
                                </button>
                            )} />
                            <Group label="Meetings" items={res.meetings} render={(m) => (
                                <button key={m.uuid} onClick={() => go(`/meetings/${m.uuid}`)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50">
                                    <span className="truncate text-sm font-medium text-slate-800">{m.title}</span>
                                    <span className="shrink-0 text-xs text-slate-400">{m.date}</span>
                                </button>
                            )} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
