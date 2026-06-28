import { Icon } from '@/Components/ui/Icon';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * App-wide toaster driven by Inertia flash messages (flash.status / flash.error).
 * Auto-dismisses after 3s. Mount once in the authenticated layout.
 */
export function Toast() {
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null); // { type, message }

    useEffect(() => {
        const message = flash?.status || flash?.error;
        if (!message) return;
        setToast({ type: flash?.error ? 'error' : 'success', message });
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [flash?.status, flash?.error]);

    if (!toast) return null;

    const ok = toast.type === 'success';
    return (
        <div className="fixed bottom-5 right-5 z-[70] animate-fade-in">
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                <Icon name={ok ? 'check' : 'x'} className="h-4 w-4" />
                {toast.message}
                <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white"><Icon name="x" className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
