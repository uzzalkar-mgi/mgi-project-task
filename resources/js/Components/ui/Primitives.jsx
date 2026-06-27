// MGI Connect design-system primitives, ported to Inertia/React (JSX).
// Mirrors mgi-connect-frontend/src/components/ui/primitives.tsx.

export function Card({ children, className = '' }) {
    return (
        <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
            {children}
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="mb-6 flex items-start justify-between animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

const BADGE_TONES = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-brand-100 text-brand-700',
    slate: 'bg-slate-100 text-slate-600',
};

export function Badge({ children, tone = 'slate' }) {
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone] ?? BADGE_TONES.slate}`}>
            {children}
        </span>
    );
}

const STAT_TONES = {
    blue: 'text-brand-600 bg-brand-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
};

export function StatCard({ label, value, hint, icon, tone = 'blue' }) {
    return (
        <Card className="p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                    {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
                </div>
                {icon && (
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${STAT_TONES[tone] ?? STAT_TONES.blue}`}>
                        {icon}
                    </span>
                )}
            </div>
        </Card>
    );
}

export function SectionTitle({ children }) {
    return <h2 className="mb-3 text-base font-semibold text-slate-900">{children}</h2>;
}

export function ProgressBar({ value, tone = 'bg-brand-600' }) {
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
                className={`h-full rounded-full ${tone}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}
