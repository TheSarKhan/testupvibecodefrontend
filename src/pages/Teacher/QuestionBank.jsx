import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineBookOpen, HiOutlineGlobe, HiOutlineUser,
    HiOutlineX, HiOutlineCheck, HiOutlineSearch,
    HiOutlineSortDescending, HiOutlineChevronRight,
    HiOutlineDocumentText, HiOutlineTag, HiOutlineClock,
    HiOutlineDownload, HiOutlineSparkles, HiOutlineLibrary,
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

// ───────────────────────────────────────────────────────────────────────────
// Difficulty distribution bar — visual breakdown
// ───────────────────────────────────────────────────────────────────────────

const DifficultyBar = ({ easy = 0, medium = 0, hard = 0, dark = false }) => {
    const total = easy + medium + hard;
    if (total === 0) return null;
    const e = (easy / total) * 100;
    const m = (medium / total) * 100;
    const h = (hard / total) * 100;
    return (
        <div className={`flex h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/15' : 'bg-[var(--ink-100)]'}`}>
            {easy > 0 && <div style={{ width: `${e}%`, background: 'var(--brand-green-600)' }} title={`${easy} asan`} />}
            {medium > 0 && <div style={{ width: `${m}%`, background: '#F59E0B' }} title={`${medium} orta`} />}
            {hard > 0 && <div style={{ width: `${h}%`, background: '#EF4444' }} title={`${hard} çətin`} />}
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

    // Global stats
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
        const color = subject.color || (subject.isGlobal ? '#22C55E' : '#2563EB');
        const tintBg = `${color}14`;
        return (
            <div
                className="group relative bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-sm)] p-5 hover:shadow-[var(--sh-md)] hover:-translate-y-0.5 hover:border-[var(--ink-300)] transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/sual-bazasi/${subject.id}`)}
            >
                {/* Color accent strip */}
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

                <div className="flex items-start gap-3 mb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-[22px] font-extrabold"
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
                                className="text-[15px] font-extrabold border border-[var(--brand-blue-200)] rounded-xl px-2.5 py-1 w-full focus:border-[var(--primary)] outline-none"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => { if (e.key === 'Enter') handleRename(subject.id); if (e.key === 'Escape') setEditId(null); }}
                            />
                        ) : (
                            <p className="text-[15px] font-extrabold text-[var(--ink-900)] truncate leading-tight tracking-tight">{subject.name}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {subject.isGlobal ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--brand-green-700)] bg-[var(--brand-green-50)] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]">
                                    <HiOutlineGlobe className="w-3 h-3" /> Ümumi
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary-hover)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]">
                                    <HiOutlineUser className="w-3 h-3" /> Mənim
                                </span>
                            )}
                            {subject.topicCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ink-600)] bg-[var(--ink-50)] border border-[var(--ink-150)] px-2 py-0.5 rounded-full">
                                    <HiOutlineTag className="w-3 h-3" />{subject.topicCount} mövzu
                                </span>
                            )}
                        </div>
                    </div>

                    {isOwn && editId !== subject.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={(e) => handleExport(e, subject.id, subject.name)}
                                className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)]"
                                title="Excel olaraq ixrac et"
                            >
                                <HiOutlineDownload className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setEditId(subject.id); setEditName(subject.name); }}
                                className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                                title="Adı dəyiş"
                            >
                                <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(subject.id)}
                                className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-red-500 hover:bg-red-50"
                                title="Sil"
                            >
                                <HiOutlineTrash className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {editId === subject.id && (
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleRename(subject.id)} className="p-1.5 rounded-xl text-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)]"><HiOutlineCheck className="w-4 h-4" /></button>
                            <button onClick={() => setEditId(null)} className="p-1.5 rounded-xl text-[var(--ink-400)] hover:bg-[var(--ink-100)]"><HiOutlineX className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                {/* Big question count + last activity */}
                <div className="flex items-baseline justify-between mb-2.5">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight leading-none">{subject.questionCount}</span>
                        <span className="text-[11.5px] text-[var(--ink-500)] font-semibold uppercase tracking-wider">sual</span>
                    </div>
                    {subject.lastAddedAt && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-[var(--ink-400)]">
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

                {/* Difficulty mini-legend */}
                {(subject.easyCount || subject.mediumCount || subject.hardCount) ? (
                    <div className="flex items-center gap-2.5 mt-2.5 text-[10px] text-[var(--ink-500)]">
                        {subject.easyCount > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-green-600)' }} /> {subject.easyCount} asan</span>}
                        {subject.mediumCount > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {subject.mediumCount} orta</span>}
                        {subject.hardCount > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {subject.hardCount} çətin</span>}
                    </div>
                ) : (
                    subject.questionCount > 0 && (
                        <p className="text-[10.5px] text-[var(--ink-300)] mt-2.5 italic">Çətinlik təyin edilməyib</p>
                    )
                )}

                <div className="absolute right-4 bottom-4 text-[var(--ink-300)] group-hover:text-[var(--primary)] transition-colors">
                    <HiOutlineChevronRight className="w-4 h-4" />
                </div>
            </div>
        );
    };

    const Tab = ({ value, label, count }) => (
        <button
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-full text-[12.5px] font-bold transition-colors ${
                tab === value
                    ? 'bg-white text-[var(--primary)] shadow-[var(--sh-sm)] ring-1 ring-[var(--brand-blue-100)]'
                    : 'text-[var(--ink-500)] hover:bg-white/60 hover:text-[var(--ink-800)]'
            }`}
        >
            {label} <span className={`ml-1 text-[10.5px] font-mono ${tab === value ? 'text-[var(--primary)]/70' : 'text-[var(--ink-400)]'}`}>{count}</span>
        </button>
    );

    return (
        <div className="min-h-screen pb-20" style={{ background: 'var(--paper-cream)' }}>
            {/* Hero — testup style */}
            <section className="bg-white border-b border-[var(--ink-150)]">
                <div className="container-main py-10 md:py-14">
                    <div className="flex items-end justify-between flex-wrap gap-5">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] border border-[var(--brand-blue-100)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                Müəllimlər üçün sual mənbəyi
                            </span>
                            <h1 className="mt-4 text-[34px] sm:text-[42px] md:text-[48px] font-extrabold text-[var(--ink-900)] tracking-tight leading-[1.05]">
                                Sual Bazası
                            </h1>
                            <p className="mt-3 text-[15px] text-[var(--ink-500)] leading-relaxed max-w-xl">
                                Fənn üzrə sualları idarə edin, yenisini əlavə edin və ya AI ilə yaradın. Bütün suallar mövzu, çətinlik və sinif üzrə təsnif olunur.
                            </p>

                            {/* Stat chips */}
                            {!loading && subjects.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                        <HiOutlineLibrary className="w-3.5 h-3.5 text-[var(--primary)]" />
                                        <strong className="text-[var(--ink-900)]">{globalStats.total.toLocaleString()}</strong> sual
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                        <HiOutlineBookOpen className="w-3.5 h-3.5 text-[var(--brand-green-600)]" />
                                        <strong className="text-[var(--ink-900)]">{globalStats.subjects}</strong> fənn
                                    </span>
                                    {globalStats.topics > 0 && (
                                        <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                            <HiOutlineTag className="w-3.5 h-3.5 text-amber-600" />
                                            <strong className="text-[var(--ink-900)]">{globalStats.topics}</strong> mövzu
                                        </span>
                                    )}
                                    {globalStats.lastAddedAt && (
                                        <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                            <HiOutlineSparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                                            Son əlavə: <strong className="text-[var(--ink-900)]">{fmtAgo(globalStats.lastAddedAt)}</strong>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <button
                                onClick={() => setAdding(true)}
                                className="h-11 px-5 inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors"
                            >
                                <HiOutlinePlus className="w-4 h-4" /> Yeni fənn
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-main mt-6 space-y-5">
                {/* Search + tabs row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Fənn axtar..."
                            className="w-full h-10 pl-10 pr-12 text-[13px] bg-white border border-[var(--ink-200)] rounded-full focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                        />
                        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--ink-400)] bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-md px-1.5 py-0.5">/</kbd>
                    </div>
                </div>

                {/* Tabs + sort */}
                {!loading && subjects.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-1 p-1 bg-[var(--ink-100)] rounded-full">
                            <Tab value="all"    label="Hamısı" count={subjects.length} />
                            <Tab value="mine"   label="Mənim" count={subjects.filter(s => !s.isGlobal).length} />
                            <Tab value="global" label="Ümumi" count={subjects.filter(s => s.isGlobal).length} />
                        </div>
                        <div className="flex-1" />
                        <div className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 border border-[var(--ink-200)] rounded-full bg-white">
                            <HiOutlineSortDescending className="w-3.5 h-3.5 text-[var(--ink-400)]" />
                            <select
                                value={sort} onChange={e => setSort(e.target.value)}
                                className="text-[12px] font-semibold bg-transparent focus:outline-none text-[var(--ink-700)] pr-2"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Add new subject form */}
                {adding && (
                    <div className="bg-white rounded-3xl border border-[var(--brand-blue-200)] shadow-[var(--sh-sm)] p-5">
                        <p className="text-[13px] font-bold text-[var(--ink-800)] mb-3 tracking-tight inline-flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center">
                                <HiOutlinePlus className="w-4 h-4" />
                            </span>
                            Yeni fənn əlavə et
                        </p>
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
                            <div key={i} className="bg-white rounded-3xl border border-[var(--ink-200)] p-5 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--ink-100)]" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-[var(--ink-100)] rounded w-2/3" />
                                        <div className="h-3 bg-[var(--ink-100)] rounded w-1/3" />
                                    </div>
                                </div>
                                <div className="h-8 bg-[var(--ink-100)] rounded mt-4 w-1/2" />
                                <div className="h-1.5 bg-[var(--ink-100)] rounded mt-3" />
                            </div>
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <EmptyState onAdd={() => setAdding(true)} />
                ) : visibleSubjects.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[var(--ink-200)] py-16 text-center">
                        <span className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--ink-50)] inline-flex items-center justify-center">
                            <HiOutlineSearch className="w-7 h-7 text-[var(--ink-300)]" />
                        </span>
                        <p className="text-[13.5px] font-semibold text-[var(--ink-600)]">Filtrlərə uyğun fənn tapılmadı</p>
                        <p className="text-[12px] text-[var(--ink-400)] mt-1">Açar sözü dəyişin və ya tabı sıfırlayın</p>
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
        setTimeout(() => onSubmit(), 0);
    };

    const handleSubmit = () => {
        if (!q) return;
        onChange(q);
        setTimeout(() => onSubmit(), 0);
    };

    return (
        <div className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
            <div ref={rootRef} className="relative flex-1 min-w-[200px]">
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
                    className="w-full h-10 px-4 border border-[var(--ink-200)] rounded-full text-[13px] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 outline-none bg-white"
                />
                {open && (filtered.length > 0 || showCreate) && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-[var(--ink-200)] rounded-2xl shadow-[var(--sh-md)] max-h-72 overflow-y-auto">
                        {filtered.length > 0 && (
                            <div className="py-1">
                                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-[0.1em]">
                                    Sistem fənləri
                                </p>
                                {filtered.map(name => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => commit(name)}
                                        className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-[var(--primary-soft)] text-[var(--ink-700)] transition-colors"
                                    >
                                        <HiOutlineBookOpen className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                                        <span className="truncate">{name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showCreate && (
                            <button
                                type="button"
                                onClick={() => commit(q)}
                                className="w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2 hover:bg-[var(--primary-soft)] border-t border-[var(--ink-100)] text-[var(--primary-hover)] font-bold transition-colors"
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
                className="h-10 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full shadow-[0_8px_24px_-10px_rgba(37,99,235,0.5)] transition-colors"
            >
                Əlavə et
            </button>
            <button
                onClick={onCancel}
                className="h-10 px-4 border border-[var(--ink-200)] text-[var(--ink-700)] rounded-full hover:bg-[var(--ink-100)] text-[13px] font-semibold transition-colors"
            >
                Ləğv et
            </button>
        </div>
    );
};

// ── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
    <div className="relative bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-sm)] py-16 px-8 text-center overflow-hidden">
        <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }}
        />
        <div
            className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center text-white shadow-[var(--sh-md)]"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }}
        >
            <HiOutlineLibrary className="w-10 h-10" />
        </div>
        <h2 className="text-[22px] font-extrabold text-[var(--ink-900)] mb-2 tracking-tight">Sual bazanız hələ boşdur</h2>
        <p className="text-[13.5px] text-[var(--ink-500)] max-w-md mx-auto mb-7 leading-relaxed">
            Sual bazası — istifadə etdiyiniz suallar üçün şəxsi kitabxanadır.
            İmtahan yaradanda bir kliklə oradan sual götürə bilərsiniz.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
            <div className="p-4 bg-[var(--primary-soft)]/60 border border-[var(--brand-blue-100)] rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-white text-[var(--primary)] flex items-center justify-center mb-2.5 shadow-[var(--sh-sm)]">
                    <HiOutlineSparkles className="w-4 h-4" />
                </div>
                <p className="text-[12.5px] font-bold text-[var(--ink-900)]">AI ilə tez yarat</p>
                <p className="text-[11px] text-[var(--ink-500)] mt-1 leading-relaxed">Mövzu yazın — suallar avtomatik gəlsin</p>
            </div>
            <div className="p-4 bg-[var(--brand-green-50)]/60 border border-[var(--brand-green-200)] rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-white text-[var(--brand-green-600)] flex items-center justify-center mb-2.5 shadow-[var(--sh-sm)]">
                    <HiOutlineTag className="w-4 h-4" />
                </div>
                <p className="text-[12.5px] font-bold text-[var(--ink-900)]">Mövzu və etiketlə</p>
                <p className="text-[11px] text-[var(--ink-500)] mt-1 leading-relaxed">Sonra asan tapın və filtrlə</p>
            </div>
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-white text-amber-600 flex items-center justify-center mb-2.5 shadow-[var(--sh-sm)]">
                    <HiOutlineDocumentText className="w-4 h-4" />
                </div>
                <p className="text-[12.5px] font-bold text-[var(--ink-900)]">İmtahanlarda istifadə</p>
                <p className="text-[11px] text-[var(--ink-500)] mt-1 leading-relaxed">Eyni sualı dəfələrlə yazmayın</p>
            </div>
        </div>

        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[13.5px] font-bold rounded-full shadow-[0_12px_32px_-10px_rgba(37,99,235,0.65)] transition-colors"
        >
            <HiOutlinePlus className="w-4 h-4" /> İlk fənni əlavə et
        </button>
    </div>
);

export default QuestionBank;
