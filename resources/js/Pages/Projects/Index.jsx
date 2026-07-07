import { Card, PageHeader, Badge, ProgressBar } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import { SearchInput } from '@/Components/ui/SearchInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_TONE = {
    active: 'green',
    on_hold: 'amber',
    completed: 'blue',
    cancelled: 'red',
};
const STATUS_LABEL = {
    active: 'Active',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
};
const PRIORITY_TONE = {
    critical: 'red',
    high: 'amber',
    medium: 'blue',
    low: 'slate',
};

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Strip HTML tags → plain text for list previews.
function plain(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function ProjectCard({ p }) {
    return (
        <Card className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                <Badge tone={STATUS_TONE[p.status] ?? 'slate'}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
            </div>

            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{plain(p.description) || 'No description.'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge tone={PRIORITY_TONE[p.priority] ?? 'slate'}>{p.priority}</Badge>
                {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">#{t}</span>
                ))}
            </div>

            <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.tasks_done}/{p.tasks_total} tasks done</span>
                    <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Icon name="user" className="h-4 w-4 text-slate-400" /> {p.lead ?? '—'}</span>
                <span className="flex items-center gap-1.5"><Icon name="timeline" className="h-4 w-4 text-slate-400" /> {fmt(p.end_date)}</span>
            </div>
        </Card>
    );
}

export default function Index({ projects }) {
    const { can } = usePermissions();
    const [q, setQ] = useState('');
    const term = q.trim().toLowerCase();
    const filtered = term
        ? projects.filter((p) =>
              [p.name, plain(p.description), p.status, p.priority, ...(p.tags ?? [])]
                  .filter(Boolean)
                  .some((v) => v.toLowerCase().includes(term))
          )
        : projects;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Projects"
                    subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'} you can see.`}
                    actions={
                        <div className="flex items-center gap-2">
                            <SearchInput value={q} onChange={setQ} placeholder="Search projects…" />
                            {can('projects.create') && (
                                <Link
                                    href={route('projects.create')}
                                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                                >
                                    <Icon name="projects" className="h-4 w-4" /> New Project
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title="Projects" />

            {projects.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon name="projects" className="h-7 w-7" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">No projects yet</h2>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                        {can('projects.create') ? 'Create your first project to get started.' : 'No projects have been assigned to you yet.'}
                    </p>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Icon name="search" className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-sm text-slate-500">No projects match “{q}”.</p>
                </Card>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((p) => (
                        <Link key={p.uuid} href={route('projects.show', p.uuid)} className="block transition hover:-translate-y-0.5">
                            <ProjectCard p={p} />
                        </Link>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
