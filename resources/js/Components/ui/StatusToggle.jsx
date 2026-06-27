import { router } from '@inertiajs/react';

/**
 * Clickable Active/Inactive pill. PATCHes `url` to flip status (HasStatus::toggleStatus).
 * Read-only badge when `canToggle` is false.
 */
export function StatusToggle({ active, url, canToggle = true }) {
    const cls = active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500';
    const label = active ? 'Active' : 'Inactive';

    if (!canToggle || !url) {
        return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
    }

    const onClick = (e) => {
        e.stopPropagation();
        const next = active ? 'Inactive' : 'Active';
        if (confirm(`Change status to ${next}?`)) {
            router.patch(url, {}, { preserveScroll: true, preserveState: true });
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${cls}`}
            title="Click to toggle"
        >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {label}
        </button>
    );
}
