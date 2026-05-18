import { useState, useEffect, useRef, useCallback } from 'react';
import { HiOutlineUser, HiOutlineSearch, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';

/**
 * Admin-only teacher autocomplete. Backed by GET /admin/users?search=&role=TEACHER&size=10
 * (already used by AdminUsers page). Typing into the input fetches matches with a 250 ms
 * debounce; clicking a row or pressing Enter on it sets {value} to the teacher's email and
 * closes the dropdown.
 *
 * Props:
 *   value         current selected email (controlled)
 *   onChange(email, teacher?)  fires on selection AND on free-text typing. Teacher object
 *                              is passed only when the user picks from the dropdown.
 *   placeholder, autoFocus, onEnter   passthrough to the underlying input
 *   excludeEmails  string[] of emails to grey out (already assigned)
 */
const TeacherPicker = ({
    value, onChange,
    placeholder = 'Müəllim axtarın və ya emaili yazın',
    autoFocus = false,
    onEnter,
    excludeEmails = [],
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(-1);  // keyboard-highlighted row
    const wrapRef = useRef(null);
    const inputRef = useRef(null);

    // Keep internal query in sync if the parent resets value externally.
    useEffect(() => { setQuery(value || ''); }, [value]);

    // Debounced search.
    useEffect(() => {
        if (!open) return undefined;
        const ctrl = new AbortController();
        const t = setTimeout(() => {
            setLoading(true);
            api.get('/admin/users', {
                params: { search: query.trim() || undefined, role: 'TEACHER', size: 10 },
                signal: ctrl.signal,
            })
                .then(r => setResults(r.data?.content || []))
                .catch(() => { /* silenced — typing fast triggers cancellations */ })
                .finally(() => setLoading(false));
        }, 250);
        return () => { clearTimeout(t); ctrl.abort(); };
    }, [query, open]);

    // Outside-click closes.
    useEffect(() => {
        if (!open) return undefined;
        const off = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', off);
        return () => document.removeEventListener('mousedown', off);
    }, [open]);

    const pick = useCallback((teacher) => {
        if (excludeEmails.includes(teacher.email)) return;
        onChange(teacher.email, teacher);
        setQuery(teacher.email);
        setOpen(false);
        setActive(-1);
    }, [onChange, excludeEmails]);

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            if (open && active >= 0 && results[active]) {
                e.preventDefault();
                pick(results[active]);
            } else if (onEnter) {
                onEnter();
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
            setActive(-1);
        }
    };

    const initials = (name) => (name || '')
        .split(/\s+/).filter(Boolean).slice(0, 2)
        .map(w => w[0]?.toUpperCase()).join('') || '?';

    const clear = () => {
        onChange('', null);
        setQuery('');
        setOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={wrapRef} className="relative w-full">
            <div className="relative">
                <HiOutlineSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => {
                        const v = e.target.value;
                        setQuery(v);
                        onChange(v, null);
                        setOpen(true);
                        setActive(-1);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Təmizlə"
                    >
                        <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {loading && results.length === 0 ? (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-400">
                            {query.trim()
                                ? <>"{query.trim()}" üçün müəllim tapılmadı. Yazdığınız email-i hələ də istifadə edə bilərsiniz.</>
                                : 'Müəllim siyahısı boşdur'}
                        </div>
                    ) : (
                        <ul className="max-h-60 overflow-y-auto">
                            {results.map((t, i) => {
                                const isExcluded = excludeEmails.includes(t.email);
                                const isActive = i === active;
                                return (
                                    <li key={t.id}>
                                        <button
                                            type="button"
                                            disabled={isExcluded}
                                            onClick={() => pick(t)}
                                            onMouseEnter={() => setActive(i)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                                isExcluded
                                                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                    : isActive
                                                        ? 'bg-blue-50'
                                                        : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            {t.profilePicture ? (
                                                <img src={t.profilePicture} alt=""
                                                     className="w-8 h-8 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                    {initials(t.fullName)}
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {t.fullName || <span className="italic text-gray-400">(adsız)</span>}
                                                </p>
                                                <p className="text-[11px] text-gray-500 truncate">{t.email}</p>
                                            </div>
                                            {isExcluded && (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                                    seçili
                                                </span>
                                            )}
                                            {!isExcluded && t.email === value && (
                                                <HiOutlineCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 flex items-center gap-1">
                        <HiOutlineUser className="w-3 h-3" /> ↑↓ keç · Enter seç · Esc bağla
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherPicker;
