import { router } from '@inertiajs/react';
import { Icon } from '@/Components/ui/Icon';

/**
 * Labeled Activate/Deactivate action button (confirms first).
 * active: bool, url: PATCH route, name: optional label used in the confirm text.
 */
export function StatusActionButton({ active, url, name = 'this item', canToggle = true }) {
    if (!canToggle || !url) return null;

    const onClick = () => {
        const next = active ? 'Inactive' : 'Active';
        if (confirm(`Change ${name}'s status to ${next}?`)) {
            router.patch(url, {}, { preserveScroll: true, preserveState: true });
        }
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
        >
            <Icon name="power" className="h-3.5 w-3.5" /> {active ? 'Deactivate' : 'Activate'}
        </button>
    );
}
