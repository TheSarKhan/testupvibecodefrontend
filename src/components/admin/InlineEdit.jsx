import { useEffect, useRef, useState } from 'react';
import { HiOutlineCheck, HiOutlineX, HiOutlinePencil } from 'react-icons/hi';

/**
 * Click-to-edit text. Saves on Enter / blur, cancels on Escape.
 *
 * Props:
 *   value: current value
 *   onSave: async (newValue) => void   — called when user commits
 *   placeholder: input placeholder when empty
 *   className: applied to the display span
 *   inputClassName: applied to the input
 *   readOnly: disables editing
 */
const InlineEdit = ({
    value,
    onSave,
    placeholder = '—',
    className = '',
    inputClassName = '',
    readOnly = false,
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { if (!editing) setDraft(value ?? ''); }, [value, editing]);
    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const commit = async () => {
        if (saving) return;
        const next = draft.trim();
        if (next === (value ?? '').trim()) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(next);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setDraft(value ?? '');
        setEditing(false);
    };

    if (!editing) {
        return (
            <span
                onClick={() => !readOnly && setEditing(true)}
                className={`group inline-flex items-center gap-1.5 ${readOnly ? '' : 'cursor-pointer hover:bg-indigo-50 -mx-1 px-1 rounded'} ${className}`}
            >
                <span className={value ? '' : 'text-gray-400 italic'}>{value || placeholder}</span>
                {!readOnly && (
                    <HiOutlinePencil className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1">
            <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); commit(); }
                    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
                }}
                onBlur={commit}
                disabled={saving}
                className={`px-2 py-0.5 border border-indigo-400 rounded outline-none text-sm bg-white ${inputClassName}`}
            />
            <button onMouseDown={e => e.preventDefault()} onClick={commit} disabled={saving}
                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                <HiOutlineCheck className="w-4 h-4" />
            </button>
            <button onMouseDown={e => e.preventDefault()} onClick={cancel} disabled={saving}
                className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
                <HiOutlineX className="w-4 h-4" />
            </button>
        </span>
    );
};

export default InlineEdit;
