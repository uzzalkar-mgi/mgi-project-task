import { Link } from '@inertiajs/react';

/**
 * Renders a Laravel paginator's links. `paginator` = the object from ->paginate()
 * ({ links, from, to, total, ... }). Hidden when only one page.
 */
export function Pagination({ paginator }) {
    const links = paginator?.links ?? [];
    if (links.length <= 3) return null; // prev + 1 page + next => nothing to page

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-xs text-slate-500">
                Showing <span className="font-medium">{paginator.from ?? 0}</span>–<span className="font-medium">{paginator.to ?? 0}</span> of <span className="font-medium">{paginator.total}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1">
                {links.map((l, i) => {
                    const label = l.label.replace('&laquo;', '‹').replace('&raquo;', '›');
                    if (!l.url) {
                        return <span key={i} className="rounded-md px-3 py-1.5 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: label }} />;
                    }
                    return (
                        <Link
                            key={i}
                            href={l.url}
                            preserveScroll
                            preserveState
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${l.active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
