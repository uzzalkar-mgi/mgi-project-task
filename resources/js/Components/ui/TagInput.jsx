import { useState } from 'react';

/**
 * Free-text tag input. Type and press Enter or comma to add. Click suggestions
 * to quick-add existing tags. value = array of tag-name strings.
 */
export function TagInput({ value, onChange, suggestions = [], placeholder = 'Type a tag and press Enter…' }) {
    const [q, setQ] = useState('');

    const add = (raw) => {
        const name = raw.trim();
        if (!name) return;
        if (!value.some((v) => v.toLowerCase() === name.toLowerCase())) onChange([...value, name]);
        setQ('');
    };
    const remove = (name) => onChange(value.filter((v) => v !== name));

    const onKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(q);
        } else if (e.key === 'Backspace' && !q && value.length) {
            remove(value[value.length - 1]);
        }
    };

    const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

    return (
        <div>
            <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 [&_input]:border-0 [&_input]:p-0 [&_input]:shadow-none [&_input]:outline-none focus-within:[&_input]:ring-0">
                {value.map((t) => (
                    <span key={t} className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        #{t}
                        <button type="button" onClick={() => remove(t)} className="text-brand-400 hover:text-rose-500">×</button>
                    </span>
                ))}
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKey}
                    onBlur={() => add(q)}
                    placeholder={value.length ? '' : placeholder}
                    className="min-w-[120px] flex-1 !border-0 !bg-transparent !p-0 !px-1 text-sm !shadow-none !outline-none !ring-0 focus:!border-0 focus:!ring-0"
                />
            </div>
            {unused.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {unused.map((s) => (
                        <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50">
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
