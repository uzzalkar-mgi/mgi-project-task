/**
 * Due-date countdown badge. Shows time left, "Due today", or overdue.
 * Completed tasks show a done state instead.
 */
const DAY = 86400000;

export function countdownInfo(dueDate, status, completedAt) {
    if (status === 'done') {
        return { label: completedAt ? 'Completed' : 'Done', cls: 'bg-emerald-100 text-emerald-700' };
    }
    if (!dueDate) return { label: 'No due date', cls: 'bg-slate-100 text-slate-500' };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    const days = Math.round((due - today) / DAY);

    if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-rose-100 text-rose-700' };
    if (days === 0) return { label: 'Due today', cls: 'bg-amber-100 text-amber-700' };
    if (days === 1) return { label: '1 day left', cls: 'bg-amber-100 text-amber-700' };
    if (days <= 3) return { label: `${days} days left`, cls: 'bg-amber-100 text-amber-700' };
    return { label: `${days} days left`, cls: 'bg-emerald-100 text-emerald-700' };
}

export function Countdown({ dueDate, status, completedAt, className = '' }) {
    const { label, cls } = countdownInfo(dueDate, status, completedAt);
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls} ${className}`}>⏱ {label}</span>;
}
