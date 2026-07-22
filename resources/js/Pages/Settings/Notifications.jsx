import { Card, PageHeader, SectionTitle } from '@/Components/ui/Primitives';
import { Icon } from '@/Components/ui/Icon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center gap-2.5">
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-slate-700">{label}</span>
        </label>
    );
}

function Group({ title, subtitle, children }) {
    return (
        <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {subtitle && <p className="mb-3 mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">{children}</div>
        </div>
    );
}

export default function Notifications({ settings }) {
    const { data, setData, patch, processing } = useForm({
        task_create_mail: settings.task_create_mail,
        task_status_mail: settings.task_status_mail,
        task_create_notify: settings.task_create_notify,
        task_status_notify: settings.task_status_notify,
        meeting_mail: settings.meeting_mail,
        meeting_notify: settings.meeting_notify,
    });
    const submit = (e) => { e.preventDefault(); patch(route('notifications.settings.update')); };

    return (
        <AuthenticatedLayout header={<PageHeader title="Mail & Notifications" subtitle="Global master switches for task & meeting alerts." />}>
            <Head title="Mail & Notifications" />

            <form onSubmit={submit} className="max-w-3xl space-y-5">
                <Card className="p-5">
                    <SectionTitle>Tasks</SectionTitle>
                    <p className="mb-3 text-xs text-slate-400">Recipients = assignees, watchers &amp; reporter. Each user can still mute these in their profile.</p>
                    <div className="space-y-3">
                        <Group title="Task created">
                            <Toggle label="Send email" checked={data.task_create_mail} onChange={(v) => setData('task_create_mail', v)} />
                            <Toggle label="In-app notification" checked={data.task_create_notify} onChange={(v) => setData('task_create_notify', v)} />
                        </Group>
                        <Group title="Task status updated">
                            <Toggle label="Send email" checked={data.task_status_mail} onChange={(v) => setData('task_status_mail', v)} />
                            <Toggle label="In-app notification" checked={data.task_status_notify} onChange={(v) => setData('task_status_notify', v)} />
                        </Group>
                    </div>
                </Card>

                <Card className="p-5">
                    <SectionTitle>Meetings</SectionTitle>
                    <div className="mt-2">
                        <Group title="Meeting reminder" subtitle="Sent to invitees on the configured reminder days.">
                            <Toggle label="Send email" checked={data.meeting_mail} onChange={(v) => setData('meeting_mail', v)} />
                            <Toggle label="In-app notification" checked={data.meeting_notify} onChange={(v) => setData('meeting_notify', v)} />
                        </Group>
                    </div>
                </Card>

                <button type="submit" disabled={processing} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-70">
                    <Icon name="check" className="h-4 w-4" /> Save Settings
                </button>
            </form>
        </AuthenticatedLayout>
    );
}
