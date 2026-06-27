import { Card, PageHeader, Badge } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Index({ milestones }) {
    return (
        <AuthenticatedLayout header={<PageHeader title="Milestones" subtitle={`${milestones.length} key deliverable dates.`} />}>
            <Head title="Milestones" />

            {milestones.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon name="milestones" className="h-7 w-7" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">No milestones yet</h2>
                    <p className="mt-1 text-sm text-slate-500">Milestones for your projects will appear here.</p>
                </Card>
            ) : (
                <Card className="p-6">
                    <ol className="relative border-l-2 border-slate-100">
                        {milestones.map((m) => (
                            <li key={m.id} className="mb-6 ml-6 last:mb-0">
                                <span className={`absolute -left-[9px] flex h-4 w-4 rotate-45 items-center justify-center ${m.past ? 'bg-emerald-500' : 'bg-brand-600'}`} />
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">{m.name}</h3>
                                        <Link href={route('projects.show', m.project_uuid)} className="text-xs text-brand-600 hover:underline">{m.project}</Link>
                                    </div>
                                    <Badge tone={m.past ? 'green' : 'blue'}>{fmt(m.date)}</Badge>
                                </div>
                                {m.description && <p className="mt-1 text-sm text-slate-500">{m.description}</p>}
                            </li>
                        ))}
                    </ol>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
