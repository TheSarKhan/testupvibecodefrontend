import { useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Wraps a destructive async action with a 5-second undo window.
 *
 * Usage:
 *   const undoable = useUndoableAction();
 *   undoable.run({
 *       label: '"User X" silindi',
 *       successMessage: 'İstifadəçi silindi',
 *       onCommit: () => deleteUser.mutateAsync(id),
 *   });
 *
 * If the user clicks "Geri qaytar" within 5s, onCommit never fires.
 * Otherwise onCommit runs after the delay.
 */
export function useUndoableAction(defaultDelayMs = 5000) {
    const timersRef = useRef(new Map());

    const cancel = (id) => {
        const t = timersRef.current.get(id);
        if (t) {
            clearTimeout(t);
            timersRef.current.delete(id);
        }
    };

    const run = ({ label, successMessage, errorMessage = 'Əməliyyat uğursuz oldu', onCommit, delayMs = defaultDelayMs }) => {
        const id = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        toast(
            (t) => (
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-gray-800 truncate">{label}</span>
                    <button
                        onClick={() => {
                            cancel(id);
                            toast.dismiss(t.id);
                            toast.success('Geri qaytarıldı');
                        }}
                        className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        Geri qaytar
                    </button>
                </div>
            ),
            { id, duration: delayMs, icon: '⏱' }
        );

        const timer = setTimeout(async () => {
            timersRef.current.delete(id);
            try {
                await onCommit();
                if (successMessage) toast.success(successMessage);
            } catch (err) {
                toast.error(err?.message || errorMessage);
            }
        }, delayMs);

        timersRef.current.set(id, timer);
    };

    return { run };
}
