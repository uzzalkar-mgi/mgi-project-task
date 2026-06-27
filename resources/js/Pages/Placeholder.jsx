import { Card, PageHeader } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Placeholder({ title, subtitle }) {
    return (
        <AuthenticatedLayout header={<PageHeader title={title} subtitle={subtitle} />}>
            <Head title={title} />

            <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name="projects" className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{title} — coming soon</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                    This section is scaffolded and routed. The full {title.toLowerCase()} experience is being built next.
                </p>
            </Card>
        </AuthenticatedLayout>
    );
}
