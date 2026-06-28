import { useEffect, useRef } from 'react';

const TOOLS = [
    { cmd: 'bold', label: 'B', cls: 'font-bold' },
    { cmd: 'italic', label: 'I', cls: 'italic' },
    { cmd: 'underline', label: 'U', cls: 'underline' },
    { cmd: 'insertUnorderedList', label: '• List' },
    { cmd: 'insertOrderedList', label: '1. List' },
];

/**
 * Minimal rich-text editor (contentEditable). Emits HTML via onChange.
 * Output renders with the `.rich` class.
 */
export function RichTextEditor({ value, onChange, placeholder = 'Write a description…' }) {
    const ref = useRef();

    // Seed initial HTML once (uncontrolled thereafter to keep the caret stable).
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== (value ?? '')) {
            ref.current.innerHTML = value ?? '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exec = (cmd) => {
        document.execCommand(cmd, false, null);
        ref.current?.focus();
        onChange(ref.current?.innerHTML ?? '');
    };

    const link = () => {
        const url = prompt('Link URL:');
        if (url) exec('createLink', url);
    };

    return (
        <div className="rounded-lg border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-1.5">
                {TOOLS.map((t) => (
                    <button key={t.cmd} type="button" onClick={() => exec(t.cmd)} className={`rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 ${t.cls ?? ''}`}>
                        {t.label}
                    </button>
                ))}
                <button type="button" onClick={link} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">🔗 Link</button>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                data-placeholder={placeholder}
                className="rich min-h-[120px] px-3 py-2 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
            />
        </div>
    );
}
