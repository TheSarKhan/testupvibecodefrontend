import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineBookOpen, HiOutlineGlobe, HiOutlineUser,
    HiOutlineX, HiOutlineCheck, HiOutlineSearch,
    HiOutlineSortDescending, HiOutlineChevronRight,
    HiOutlineDocumentText, HiOutlineTag, HiOutlineClock,
    HiOutlineDownload, HiOutlineSparkles
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
    { value: 'recent',  label: 'Son aktivlik' },
    { value: 'name',    label: 'Ad: A-Z' },
    { value: 'count_desc', label: 'Sual sayı: çox → az' },
    { value: 'count_asc',  label: 'Sual sayı: az → çox' },
];

const fmtAgo = (iso) => {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    const diff = (Date.now() - t) / 1000;
    if (diff < 60) return 'indi';
    if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} gün əvvəl`;
    if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)} ay əvvəl`;
    return `${Math.floor(diff / 86400 / 365)} il əvvəl`;
};

// Difficulty distribution bar — visual breakdown
const DifficultyBar = ({ easy = 0, medium = 0, hard = 0 }) => {
    const total = easy + medium + hard;
    if (total === 0) return null;
    const e = (easy / total) * 100;
    const m = (medium / total) * 100;
    const h = (hard / total) * 100;
    return (
        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
            {easy > 0 && <div style={{ width: `${e}%` }} className="bg-green-400" title={`${easy} asan`} />}
            {medium > 0 && <div style={{ width: `${m}%` }} className="bg-yellow-400" title={`${medium} orta`} />}
            {hard > 0 && <div style={{ width: `${h}%` }} className="bg-red-400" title={`${hard} çətin`} />}
        </div>
    );
};

const QuestionBank = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [examSubjects, setExamSubjects] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all'); // all | mine | global
    const [sort, setSort] = useState('recent');
    const searchRef = useRef(null);

    useEffect(() => {
        fetchSubjects();
        api.get('/subjects').then(r => setExamSubjects(r.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            const inField = tag === 'input' || tag === 'textarea';
            if (e.key === '/' && !inField) { e.preventDefault(); searchRef.current?.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/bank/subjects');
            setSubjects(data);
        } catch {
            toast.error('Fənnlər yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            const { data } = await api.post('/bank/subjects', { name: newName.trim() });
            setSubjects(prev => [data, ...prev]);
            setNewName('');
            setAdding(false);
            toast.success('Fənn əlavə edildi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        try {
            const { data } = await api.put(`/bank/subjects/${id}`, { name: editName.trim() });
            setSubjects(prev => prev.map(s => s.id === id ? data : s));
            setEditId(null);
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (id) => {
        const subject = subjects.find(s => s.id === id);
        if (subject?.questionCount > 0) {
            toast.error(`Bu fənndə ${subject.questionCount} sual var. Əvvəlcə sualları silin.`);
            return;
        }
        if (!window.confirm('Bu fənni silmək istədiyinizdən əminsiniz?')) return;
        try {
            await api.delete(`/bank/subjects/${id}`);
            setSubjects(prev => prev.filter(s => s.id !== id));
            toast.success('Fənn silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleExport = async (e, id, name) => {
        e.stopPropagation();
        try {
            const res = await api.get(`/bank/subjects/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = `${name || 'sual-bazasi'}.xlsx`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Yükləmə uğursuz oldu');
        }
    };

    // ── Derived UI data ──────────────────────────────────────────────────────
    const ownSubjects = useMemo(
        () => subjects.filter(s => !s.isGlobal || isAdmin),
        [subjects, isAdmin]
    );
    const globalSubjects = useMemo(
        () => subjects.filter(s => s.isGlobal && !isAdmin),
        [subjects, isAdmin]
    );

    const visibleSubjects = useMemo(() => {
        let list = subjects;
        if (tab === 'mine')   list = list.filter(s => !s.isGlobal);
        if (tab === 'global') list = list.filter(s => s.isGlobal);
        const q = search.trim().toLowerCase();
        if (q) list = list.filter(s => s.name.toLowerCase().includes(q));

        const sorted = [...list];
        sorted.sort((a, b) => {
            switch (sort) {
                case 'name': return a.name.localeCompare(b.name);
                case 'count_desc': return (b.questionCount || 0) - (a.questionCount || 0);
                case 'count_asc':  return (a.questionCount || 0) - (b.questionCount || 0);
                case 'recent':
                default: {
                    const ta = a.lastAddedAt ? new Date(a.lastAddedAt).getTime() : 0;
                    const tb = b.lastAddedAt ? new Date(b.lastAddedAt).getTime() : 0;
                    return tb - ta;
                }
            }
        });
        return sorted;
    }, [subjects, search, tab, sort]);

    // Global stats across user-visible subjects
    const globalStats = useMemo(() => {
        const total = subjects.reduce((s, x) => s + (x.questionCount || 0), 0);
        const topics = subjects.reduce((s, x) => s + (x.topicCount || 0), 0);
        const easy = subjects.reduce((s, x) => s + (x.easyCount || 0), 0);
        const medium = subjects.reduce((s, x) => s + (x.mediumCount || 0), 0);
        const hard = subjects.reduce((s, x) => s + (x.hardCount || 0), 0);
        const lastIso = subjects
            .map(s => s.lastAddedAt)
            .filter(Boolean)
            .sort()
            .reverse()[0] || null;
        return { total, topics, easy, medium, hard, subjects: subjects.length, lastAddedAt: lastIso };
    }, [subjects]);

    // ── Subject Card ─────────────────────────────────────────────────────────
    const SubjectCard = ({ subject }) => {
        const isOwn = !subject.isGlobal || isAdmin;
        const color = subject.color || (subject.isGlobal ? '#a855f7' : '#6366f1');
        const tintBg = `${color}14`; // 8% alpha hex
        return (
            <div
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(`/sual-bazasi/${subject.id}`)}
            >
                {/* Subtle color accent */}
                <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: color }}
                />

                <div className="flex items-start gap-3 mb-3">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                        style={{ background: tintBg, color }}
                    >
                        {subject.iconEmoji
                            ? <span>{subject.iconEmoji}</span>
                            : subject.isGlobal
                                ? <HiOutlineGlobe className="w-6 h-6" />
                                : <HiOutlineBookOpen className="w-6 h-6" />
                        }
                    </div>
                    <div className="min-w-0 flex-1">
                        {editId === subject.id ? (
                            <input
                                autoFocus
                                className="text-base font-bold border border-indigo-300 rounded-lg px-2 py-1 w-full"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => { if (e.key === 'Enter') handleRename(subject.id); if (e.key === 'Escape') setEditId(null); }}
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-900 truncate leading-tight">{subject.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {subject.isGlobal && (
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Ümumi</span>
                            )}
                            {!subject.isGlobal && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wide">
                                    <HiOutlineUser className="w-3 h-3" /> Mənim
                                </span>
                            )}
                            {subject.topicCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">
                                    <HiOutlineTag className="w-3 h-3" />{subject.topicCount} mövzu
                                </span>
                            )}
                        </div>
                    </div>

                    {isOwn && editId !== subject.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={(e) => handleExport(e, subject.id, subject.name)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                title="Excel olaraq ixrac et"
                            >
                                <HiOutlineDownload className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setEditId(subject.id); setEditName(subject.name); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Adı dəyiş"
                            >
                                <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(subject.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Sil"
                            >
                                <HiOutlineTrash className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {editId === subject.id && (
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleRename(subject.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><HiOutlineCheck className="w-4 h-4" /></button>
                            <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><HiOutlineX className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                {/* Big question count + bar */}
                <div className="flex items-baseline justify-between mb-2">
                    <div>
                        <span className="text-3xl font-bold text-gray-900">{subject.questionCount}</span>
                        <span className="text-xs text-gray-400 ml-1.5 font-medium">sual</span>
                    </div>
                    {subject.lastAddedAt && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            <HiOutlineClock className="w-3 h-3" />
                            {fmtAgo(subject.lastAddedAt)}
                        </span>
                    )}
                </div>

                <DifficultyBar
                    easy={subject.easyCount || 0}
                    medium={subject.mediumCount || 0}
                    hard={subject.hardCount || 0}
                />

                {/* Difficulty pills mini-legend */}
                {(subject.easyCount || subject.mediumCount || subject.hardCount) ? (
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] text-gray-500">
                        {subject.easyCount > 0  && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> {subject.easyCount} asan</span>}
                        {subject.mediumCount > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" /> {subject.mediumCount} orta</span>}
                        {subject.hardCount > 0  && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> {subject.hardCount} çətin</span>}
                    </div>
                ) : (
                    subject.questionCount > 0 && (
                        <p className="text-[11px] text-gray-300 mt-2.5 italic">Çətinlik təyin edilməyib</p>
                    )
                )}

                <div className="absolute right-3 bottom-3 text-gray-300 group-hover:text-indigo-500 transition-colors">
                    <HiOutlineChevronRight className="w-4 h-4" />
                </div>
            </div>
        );
    };

    const Tab = ({ value, label, count }) => (
        <button
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === value
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
            }`}
        >
            {label} <span className={`ml-1 text-xs ${tab === value ? 'text-indigo-400' : 'text-gray-400'}`}>{count}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Sual Bazası</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Fənnlər üzrə suallarınızı idarə edin</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-72">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Fənn axtar... ( / )"
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                            />
                        </div>
                        <button
                            onClick={() => setAdding(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <HiOutlinePlus className="w-4 h-4" /> Fənn əlavə et
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main mt-6 space-y-6">
                {/* Hero stats card */}
                {!loading && subjects.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -left-8 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <HiOutlineDocumentText className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold leading-none">{globalStats.total}</p>
                                    <p className="text-xs uppercase tracking-wide opacity-80 mt-1">sual</p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/20 hidden md:block" />
                            <div>
                                <p className="text-2xl font-bold leading-none">{globalStats.subjects}</p>
                                <p className="text-xs uppercase tracking-wide opacity-80 mt-1">fənn</p>
                            </div>
                            <div className="w-px h-12 bg-white/20 hidden md:block" />
                            <div>
                                <p className="text-2xl font-bold leading-none">{globalStats.topics}</p>
                                <p className="text-xs uppercase tracking-wide opacity-80 mt-1">mövzu</p>
                            </div>

                            {(globalStats.easy + globalStats.medium + globalStats.hard) > 0 && (
                                <>
                                    <div className="w-px h-12 bg-white/20 hidden md:block" />
                                    <div className="flex-1 min-w-[200px] max-w-md">
                                        <p className="text-xs uppercase tracking-wide opacity-80 mb-1.5">Çətinlik bölgüsü</p>
                                        <DifficultyBar easy={globalStats.easy} medium={globalStats.medium} hard={globalStats.hard} />
                                        <div className="flex gap-3 mt-1.5 text-[10px] opacity-90">
                                            <span>● {globalStats.easy} asan</span>
                                            <span>● {globalStats.medium} orta</span>
                                            <span>● {globalStats.hard} çətin</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {globalStats.lastAddedAt && (
                                <div className="ml-auto text-right text-xs opacity-90">
                                    <p className="opacity-70 uppercase tracking-wide text-[10px]">Son aktivlik</p>
                                    <p className="font-semibold mt-0.5">{fmtAgo(globalStats.lastAddedAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs + sort */}
                {!loading && subjects.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-2xl">
                            <Tab value="all"    label="Hamısı" count={subjects.length} />
                            <Tab value="mine"   label="Mənim" count={subjects.filter(s => !s.isGlobal).length} />
                            <Tab value="global" label="Ümumi" count={subjects.filter(s => s.isGlobal).length} />
                        </div>
                        <div className="flex-1" />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full bg-white">
                            <HiOutlineSortDescending className="w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={sort} onChange={e => setSort(e.target.value)}
                                className="text-xs font-semibold bg-transparent focus:outline-none"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Add new subject form */}
                {adding && (
                    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Yeni fənn</p>
                        <SubjectAdder
                            value={newName}
                            onChange={setNewName}
                            onSubmit={handleAdd}
                            onCancel={() => { setAdding(false); setNewName(''); }}
                            suggestions={examSubjects.filter(name => !subjects.some(s => s.name === name))}
                        />
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    </div>
                                </div>
                                <div className="h-8 bg-gray-100 rounded mt-4 w-1/2" />
                                <div className="h-1.5 bg-gray-100 rounded mt-3" />
                            </div>
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <EmptyState onAdd={() => setAdding(true)} />
                ) : visibleSubjects.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <HiOutlineSearch className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Filtrlərə uyğun fənn tapılmadı</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visibleSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Subject Adder: combobox with "+ yeni fənn yarat" ────────────────────────
const SubjectAdder = ({ value, onChange, onSubmit, onCancel, suggestions }) => {
    const [query, setQuery] = useState(value || '');
    const [open, setOpen] = useState(true);
    const rootRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => { setQuery(value || ''); }, [value]);
    useEffect(() => {
        const handler = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const q = query.trim();
    const lower = q.toLowerCase();
    const filtered = suggestions.filter(n => !lower || n.toLowerCase().includes(lower));
    const exact = suggestions.some(n => n.toLowerCase() === lower);
    const showCreate = q.length > 0 && !exact;

    const commit = (name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        onChange(trimmed);
        setQuery(trimmed);
        setOpen(false);
        // Defer submit to next tick so onChange's state propagates first.
        setTimeout(() => onSubmit(), 0);
    };

    const handleSubmit = () => {
        if (!q) return;
        onChange(q);
        setTimeout(() => onSubmit(), 0);
    };

    return (
        <div className="flex gap-3 items-start">
            <div ref={rootRef} className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (showCreate) commit(q);
                            else if (filtered.length > 0) commit(filtered[0]);
                            else if (q) commit(q);
                        } else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                    }}
                    placeholder="Fənn adı yaz və ya siyahıdan seç..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
                {open && (filtered.length > 0 || showCreate) && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                        {filtered.length > 0 && (
                            <div className="py-1">
                                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                    Sistem fənləri
                                </p>
                                {filtered.map(name => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => commit(name)}
                                        className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-indigo-50 text-gray-700"
                                    >
                                        <HiOutlineBookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="truncate">{name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showCreate && (
                            <button
                                type="button"
                                onClick={() => commit(q)}
                                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-indigo-50 border-t border-gray-100 text-indigo-700 font-semibold"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                "{q}" adlı yeni fənn yarat
                            </button>
                        )}
                    </div>
                )}
            </div>
            <button
                onClick={handleSubmit}
                disabled={!q}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl"
            >
                Əlavə et
            </button>
            <button
                onClick={onCancel}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm"
            >
                Ləğv et
            </button>
        </div>
    );
};

// ── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 px-8 text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <HiOutlineBookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sual bazanız hələ boşdur</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Sual bazası — istifadə etdiyiniz suallar üçün şəxsi kitabxanadır.
            İmtahan yaradanda bir kliklə oradan sual götürə bilərsiniz.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-7 text-left">
            <div className="p-3 bg-indigo-50/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                    <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">AI ilə tez yarat</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Mövzu yazın — suallar avtomatik gəlsin</p>
            </div>
            <div className="p-3 bg-teal-50/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center mb-2">
                    <HiOutlineTag className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">Mövzu və etiketlə</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Sonra asan tapın və filtrlə</p>
            </div>
            <div className="p-3 bg-violet-50/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-violet-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">İmtahanlarda istifadə</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Eyni sualı dəfələrlə yazmayın</p>
            </div>
        </div>

        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm"
        >
            <HiOutlinePlus className="w-4 h-4" /> İlk fənni əlavə et
        </button>
    </div>
);

export default QuestionBank;
