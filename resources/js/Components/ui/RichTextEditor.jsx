import { useEffect, useRef, useState } from 'react';

const TOOLS = [
    { cmd: 'bold', label: 'B', cls: 'font-bold' },
    { cmd: 'italic', label: 'I', cls: 'italic' },
    { cmd: 'underline', label: 'U', cls: 'underline' },
    { cmd: 'insertUnorderedList', label: '• List' },
    { cmd: 'insertOrderedList', label: '1. List' },
];

/** Collect mentioned user ids from mention spans in the editor DOM. */
function collectMentions(root) {
    if (!root) return [];
    return [...root.querySelectorAll('span[data-uid]')].map((el) => Number(el.getAttribute('data-uid'))).filter(Boolean);
}

/**
 * Minimal rich-text editor (contentEditable). Emits HTML via onChange.
 * Optional @mention autocomplete when `mentionUsers` [{id,name}] is provided;
 * emits mentioned user ids via onMentions. Renders output with the `.rich` class.
 */
export function RichTextEditor({ value, onChange, placeholder = 'Write a description…', mentionUsers = null, onMentions }) {
    const ref = useRef();
    const [pop, setPop] = useState(null); // { query, items } | null
    const [hi, setHi] = useState(0);

    // Seed initial HTML once (uncontrolled thereafter to keep the caret stable).
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== (value ?? '')) {
            ref.current.innerHTML = value ?? '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = () => {
        onChange(ref.current?.innerHTML ?? '');
        if (mentionUsers && onMentions) onMentions(collectMentions(ref.current));
    };

    const exec = (cmd) => {
        document.execCommand(cmd, false, null);
        ref.current?.focus();
        emit();
    };

    const link = () => {
        const url = prompt('Link URL:');
        if (url) { document.execCommand('createLink', false, url); emit(); }
    };

    // --- @mention detection ------------------------------------------------
    const mentionsOn = Array.isArray(mentionUsers) && mentionUsers.length > 0;

    const currentWord = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return null;
        const node = sel.anchorNode;
        if (!node || node.nodeType !== 3) return null; // text node only
        const text = node.textContent.slice(0, sel.anchorOffset);
        const m = text.match(/@([\w.\-]*)$/);
        return m ? { node, start: sel.anchorOffset - m[0].length, query: m[1] } : null;
    };

    const onInput = () => {
        emit();
        if (!mentionsOn) return;
        const w = currentWord();
        if (!w) { setPop(null); return; }
        const q = w.query.toLowerCase();
        const items = mentionUsers.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6);
        setHi(0);
        setPop(items.length ? { query: w.query, items } : null);
    };

    const insertMention = (u) => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const node = sel.anchorNode;
        const off = sel.anchorOffset;
        const text = node.textContent.slice(0, off);
        const m = text.match(/@([\w.\-]*)$/);
        if (!m) { setPop(null); return; }
        const range = document.createRange();
        range.setStart(node, off - m[0].length);
        range.setEnd(node, off);
        range.deleteContents();
        const span = document.createElement('span');
        span.setAttribute('data-uid', String(u.id));
        span.className = 'mention';
        span.contentEditable = 'false';
        span.textContent = '@' + u.name;
        range.insertNode(span);
        const space = document.createTextNode(' ');
        span.after(space);
        // caret after the space
        const r2 = document.createRange();
        r2.setStartAfter(space);
        r2.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r2);
        setPop(null);
        ref.current?.focus();
        emit();
    };

    const onKeyDown = (e) => {
        if (!pop) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, pop.items.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
        else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(pop.items[hi]); }
        else if (e.key === 'Escape') { setPop(null); }
    };

    return (
        <div className="relative rounded-lg border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 py-1.5">
                {TOOLS.map((t) => (
                    <button key={t.cmd} type="button" onClick={() => exec(t.cmd)} className={`rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 ${t.cls ?? ''}`}>
                        {t.label}
                    </button>
                ))}
                <button type="button" onClick={link} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">🔗 Link</button>
                {mentionsOn && <span className="ml-auto px-2 text-[11px] text-slate-400">Type @ to mention</span>}
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                onKeyDown={onKeyDown}
                data-placeholder={placeholder}
                className="rich min-h-[120px] px-3 py-2 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
            />
            {pop && (
                <div className="absolute left-3 z-30 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    {pop.items.map((u, i) => (
                        <button
                            key={u.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === hi ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{u.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
                            {u.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
