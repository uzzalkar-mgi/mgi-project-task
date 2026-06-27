import { useEffect, useRef, useState } from 'react';

const fieldCls = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100';

function useOutsideClose(ref, onClose) {
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [ref, onClose]);
}

/**
 * Searchable single-select. Scales to large option lists (type to filter).
 * options: [{ value, label, hint? }]
 */
export function Combobox({ options, value, onChange, placeholder = 'Select…', allowClear = true }) {
    const box = useRef();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    useOutsideClose(box, () => setOpen(false));

    const selected = options.find((o) => String(o.value) === String(value));
    const filtered = q
        ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()) || (o.hint ?? '').toLowerCase().includes(q.toLowerCase()))
        : options;

    return (
        <div className="relative" ref={box}>
            <div className={`${fieldCls} flex cursor-pointer items-center justify-between`} onClick={() => setOpen((v) => !v)}>
                <span className={selected ? 'text-slate-800' : 'text-slate-400'}>{selected ? selected.label : placeholder}</span>
                <span className="flex items-center gap-1">
                    {allowClear && selected && (
                        <span onClick={(e) => { e.stopPropagation(); onChange(''); }} className="rounded px-1 text-slate-400 hover:text-rose-500">×</span>
                    )}
                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
                </span>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 p-2">
                        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400" />
                    </div>
                    <ul className="scroll-thin max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No matches.</li>}
                        {filtered.map((o) => (
                            <li key={o.value}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${String(o.value) === String(value) ? 'font-semibold text-brand-700' : 'text-slate-700'}`}
                                >
                                    <span>{o.label}</span>
                                    {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/**
 * Searchable multi-select. Selected items show as removable chips.
 * options: [{ value, label, hint? }]; values: array
 */
export function MultiCombobox({ options, values, onChange, placeholder = 'Add…' }) {
    const box = useRef();
    const inputRef = useRef();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    useOutsideClose(box, () => setOpen(false));

    const selectedSet = new Set(values.map(String));
    const selected = options.filter((o) => selectedSet.has(String(o.value)));
    const filtered = (q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options)
        .filter((o) => !selectedSet.has(String(o.value)));

    const toggle = (val) => onChange(selectedSet.has(String(val)) ? values.filter((v) => String(v) !== String(val)) : [...values, val]);

    return (
        <div className="relative" ref={box}>
            <div
                className="flex min-h-[44px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 [&_input]:border-0 [&_input]:p-0 [&_input]:shadow-none [&_input]:outline-none focus-within:[&_input]:ring-0"
                onClick={() => { setOpen(true); inputRef.current?.focus(); }}
            >
                {selected.map((o) => (
                    <span key={o.value} className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {o.label}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggle(o.value); }} className="text-brand-400 hover:text-rose-500">×</button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={selected.length ? '' : placeholder}
                    className="min-w-[80px] flex-1 !border-0 !bg-transparent !p-0 !px-1 text-sm !shadow-none !outline-none !ring-0 focus:!border-0 focus:!ring-0"
                />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <ul className="scroll-thin max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No more options.</li>}
                        {filtered.map((o) => (
                            <li key={o.value}>
                                <button
                                    type="button"
                                    onClick={() => { toggle(o.value); setQ(''); inputRef.current?.focus(); }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <span>{o.label}</span>
                                    {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
