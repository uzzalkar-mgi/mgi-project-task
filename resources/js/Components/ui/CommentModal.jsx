import { Icon } from '@/Components/ui/Icon';
import { AttachmentViewer } from '@/Components/ui/AttachmentViewer';
import { useEffect, useRef, useState } from 'react';

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function CommentNode({ c, isReply, onReply }) {
    return (
        <div className={`flex gap-3 ${isReply ? 'mt-3' : 'py-3'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(c.author)}</span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.author}</span>
                    <span className="text-xs text-slate-400">{c.created_at}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                {c.attachments?.length > 0 && <div className="mt-2"><AttachmentViewer items={c.attachments} size="sm" /></div>}
                {!isReply && <button onClick={() => onReply(c)} className="mt-1.5 text-xs font-medium text-brand-600 hover:underline">Reply</button>}
                {c.replies?.length > 0 && (
                    <div className="mt-2 border-l-2 border-slate-100 pl-3">
                        {c.replies.map((r) => <CommentNode key={r.id} c={r} isReply />)}
                    </div>
                )}
            </div>
        </div>
    );
}

export function CommentModal({ taskUuid, taskTitle, onClose, onPosted }) {
    const fileRef = useRef();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);

    const load = () => {
        setLoading(true);
        window.axios.get(`/tasks/${taskUuid}/comments`)
            .then((r) => setComments(r.data.comments))
            .catch(() => setError('Failed to load comments.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [taskUuid]);

    const submit = (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setPosting(true);
        setError(null);
        const fd = new FormData();
        fd.append('body', body);
        if (replyTo) fd.append('parent_id', replyTo.id);
        files.forEach((f) => fd.append('files[]', f));

        window.axios.post(`/tasks/${taskUuid}/comments`, fd, { headers: { Accept: 'application/json' } })
            .then(() => {
                setBody(''); setFiles([]); setReplyTo(null);
                load();
                onPosted?.();
            })
            .catch((err) => setError(err.response?.data?.message ?? 'Failed to post.'))
            .finally(() => setPosting(false));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900" title={taskTitle}>{taskTitle}</h3>
                        <p className="text-xs text-slate-400">Comments & replies</p>
                    </div>
                    <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="x" className="h-5 w-5" /></button>
                </div>

                {/* Thread */}
                <div className="scroll-thin flex-1 overflow-y-auto px-5">
                    {loading ? (
                        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
                    ) : comments.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-400">No comments yet. Start the discussion.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {comments.map((c) => <CommentNode key={c.id} c={c} onReply={setReplyTo} />)}
                        </div>
                    )}
                </div>

                {/* Composer */}
                <form onSubmit={submit} className="border-t border-slate-100 p-4">
                    {replyTo && (
                        <div className="mb-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                            <span>Replying to <b>{replyTo.author}</b></span>
                            <button type="button" onClick={() => setReplyTo(null)} className="hover:text-rose-500">Cancel</button>
                        </div>
                    )}
                    {error && <p className="mb-2 text-sm text-rose-500">{error}</p>}
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={2}
                        placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    {files.length > 0 && <p className="mt-1 text-xs text-slate-500">{files.length} file(s) attached</p>}
                    <div className="mt-2 flex items-center gap-2">
                        <button type="submit" disabled={posting || !body.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                            <Icon name="check" className="h-4 w-4" /> {replyTo ? 'Reply' : 'Comment'}
                        </button>
                        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <Icon name="projects" className="h-4 w-4" /> Attach
                        </button>
                        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                    </div>
                </form>
            </div>
        </div>
    );
}
