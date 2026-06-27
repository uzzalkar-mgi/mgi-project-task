/** Styled search box (controlled). Parent decides client- vs server-side filtering. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
            {value && (
                <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-slate-400 hover:text-rose-500">×</button>
            )}
        </div>
    );
}
