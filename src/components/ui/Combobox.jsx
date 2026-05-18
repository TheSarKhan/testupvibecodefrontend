import { useState, useRef, useEffect, useMemo } from 'react';
import { HiOutlineChevronDown, HiOutlineSearch, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

/**
 * Searchable input that combines a dropdown of existing values with free-text entry.
 *
 * Props:
 *  - value       — current string value
 *  - onChange    — (newValue: string) => void
 *  - options     — Array<{ value: string, label?: string, hint?: string, color?: string }>
 *                  (also accepts plain strings; they are auto-wrapped)
 *  - placeholder — input placeholder
 *  - allowCreate — if true (default), typed values that don't match options are accepted
 *  - icon        — optional React node rendered at the left of the input
 *  - clearable   — show an "x" to clear (default true)
 *  - emptyHint   — message when no options match and allowCreate=false
 *  - disabled
 */
const Combobox = ({
    value = '',
    onChange,
    options = [],
    placeholder = '',
    allowCreate = true,
    icon = null,
    clearable = true,
    emptyHint = 'Heç bir variant tapılmadı',
    disabled = false,
}) => {
    const normalized = useMemo(() =>
        (options || []).map(o => typeof o === 'string'
            ? { value: o, label: o }
            : { ...o, label: o.label ?? o.value }
        ), [options]);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const wrapRef = useRef(null);
    const listRef = useRef(null);
    const [highlight, setHighlight] = useState(0);

    useEffect(() => { setQuery(value || ''); }, [value]);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                // If user typed something free-form, commit it
                if (allowCreate && query !== value) onChange?.(query);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open, query, value, allowCreate, onChange]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return normalized;
        return normalized.filter(o =>
            o.label.toLowerCase().includes(q) ||
            String(o.value).toLowerCase().includes(q)
        );
    }, [normalized, query]);

    const exactMatch = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        return normalized.find(o => o.label.toLowerCase() === q || String(o.value).toLowerCase() === q);
    }, [normalized, query]);

    const showCreateRow = allowCreate && query.trim() !== '' && !exactMatch;

    const commit = (next) => {
        setQuery(next);
        onChange?.(next);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            setOpen(true);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight(h => Math.min(h + 1, filtered.length - (showCreateRow ? 0 : 1)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlight < filtered.length) {
                commit(filtered[highlight].value);
            } else if (showCreateRow) {
                commit(query.trim());
            } else if (allowCreate) {
                commit(query.trim());
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapRef} className="relative">
            <div className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl transition-colors ${open ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
                {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setHighlight(0); if (!open) setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 min-w-0 text-sm bg-transparent outline-none"
                />
                {clearable && query && (
                    <button
                        type="button"
                        onClick={() => commit('')}
                        className="p-0.5 text-gray-300 hover:text-gray-600 shrink-0"
                        tabIndex={-1}
                    >
                        <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0"
                    tabIndex={-1}
                >
                    <HiOutlineChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {open && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div ref={listRef} className="max-h-60 overflow-y-auto">
                        {filtered.length === 0 && !showCreateRow ? (
                            <div className="px-3 py-4 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
                                <HiOutlineSearch className="w-3.5 h-3.5" />
                                {emptyHint}
                            </div>
                        ) : (
                            filtered.map((o, i) => (
                                <button
                                    key={o.value + '-' + i}
                                    type="button"
                                    onMouseEnter={() => setHighlight(i)}
                                    onClick={() => commit(o.value)}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${highlight === i ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                >
                                    {o.color && (
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: o.color }}
                                        />
                                    )}
                                    <span className="flex-1 truncate">{o.label}</span>
                                    {o.hint && <span className="text-[10px] text-gray-400 shrink-0">{o.hint}</span>}
                                </button>
                            ))
                        )}
                        {showCreateRow && (
                            <button
                                type="button"
                                onClick={() => commit(query.trim())}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 border-t border-gray-100 ${highlight >= filtered.length ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                            >
                                <HiOutlinePlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-blue-700 font-semibold">"{query.trim()}"</span>
                                <span className="text-xs text-gray-400">— yenisini əlavə et</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Combobox;
