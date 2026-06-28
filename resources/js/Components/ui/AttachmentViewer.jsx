import { Icon } from '@/Components/ui/Icon';
import { useState } from 'react';

const isImage = (ft) => (ft ?? '').startsWith('image/');
const isPdf = (ft) => (ft ?? '').includes('pdf');

function fileLabel(ft) {
    if (isPdf(ft)) return 'PDF';
    if ((ft ?? '').includes('word') || (ft ?? '').includes('doc')) return 'DOC';
    if ((ft ?? '').includes('sheet') || (ft ?? '').includes('excel') || (ft ?? '').includes('csv')) return 'XLS';
    if ((ft ?? '').includes('zip')) return 'ZIP';
    return 'FILE';
}

/**
 * Renders attachment thumbnails (images) + file chips (docs).
 * Click image/pdf -> big lightbox; other docs -> open in new tab.
 */
export function AttachmentViewer({ items, size = 'md' }) {
    const [active, setActive] = useState(null); // attachment being previewed
    if (!items?.length) return null;

    const thumb = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';

    const onClick = (a) => {
        if (isImage(a.file_type) || isPdf(a.file_type)) setActive(a);
        else window.open(a.url, '_blank', 'noopener');
    };

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {items.map((a, i) => (
                    <button key={i} type="button" onClick={() => onClick(a)} title={a.title} className="group block">
                        {isImage(a.file_type) ? (
                            <img src={a.url} alt={a.title} className={`${thumb} rounded-lg border border-slate-200 object-cover transition group-hover:opacity-80`} />
                        ) : (
                            <span className={`flex ${thumb} flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:bg-slate-100`}>
                                <Icon name="projects" className="h-5 w-5" />
                                <span className="text-[9px] font-bold">{fileLabel(a.file_type)}</span>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {active && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setActive(null)}>
                    <button onClick={() => setActive(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                        <Icon name="x" className="h-5 w-5" />
                    </button>
                    <div className="max-h-[90vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        {isImage(active.file_type) ? (
                            <img src={active.url} alt={active.title} className="mx-auto max-h-[90vh] rounded-lg object-contain" />
                        ) : (
                            <iframe src={active.url} title={active.title} className="h-[85vh] w-full rounded-lg bg-white" />
                        )}
                        <div className="mt-2 flex items-center justify-between text-sm text-white/90">
                            <span className="truncate">{active.title}</span>
                            <a href={active.url} target="_blank" rel="noreferrer" className="ml-3 shrink-0 rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25">Open / Download</a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
