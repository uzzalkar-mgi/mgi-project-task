import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_TONE = { scheduled: 'blue', completed: 'green', cancelled: 'red' };

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Index({ meetings, canManage }) {
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const filtered = meetings.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));
    const remove = (m) => { if (confirm(`Delete "${m.title}"?`)) router.delete(route('meetings.destroy', m.uuid), { preserveScroll: true }); };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Monthly Meetings"
                    subtitle={`${meetings.length} meeting${meetings.length === 1 ? '' : 's'}.`}
                    actions={canManage && (
                        <div className="flex items-center gap-2">
                            <Link href={route('meetings.settings')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                <Icon name="gear" className="h-4 w-4" /> Schedule
                            </Link>
                            <Link href={route('meetings.create')} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                                <Icon name="calendar" className="h-4 w-4" /> New Meeting
                            </Link>
                        </div>
                    )}
                />
            }
        >
            <Head title="Meetings" />

            <Card className="overflow-hidden">
                <div className="flex justify-end p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Search meetings…" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Meeting</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Attendance</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((m) => (
                                <tr key={m.uuid} onClick={() => router.visit(route('meetings.show', m.uuid))} className="cursor-pointer hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800 hover:text-brand-700">{m.title}</td>
                                    <td className="px-4 py-3 text-slate-500">{fmt(m.meeting_date)}</td>
                                    <td className="px-4 py-3 text-slate-500">{m.meeting_time ? m.meeting_time.slice(0, 5) : '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{m.attendees}/{m.invitees}</td>
                                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[m.status] ?? 'slate'}>{m.status}</Badge></td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('meetings.show', m.uuid)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><Icon name="eye" className="h-3.5 w-3.5" /></Link>
                                            {can('meetings.update') && m.status !== 'completed' && <Link href={route('meetings.edit', m.uuid)} className="rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"><Icon name="edit" className="h-3.5 w-3.5" /></Link>}
                                            {can('meetings.delete') && m.status !== 'completed' && <button onClick={() => remove(m)} className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"><Icon name="trash" className="h-3.5 w-3.5" /></button>}
                                            {m.status === 'completed' && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">Locked</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No meetings.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
