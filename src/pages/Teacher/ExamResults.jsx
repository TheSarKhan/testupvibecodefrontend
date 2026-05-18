import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    HiOutlineArrowLeft, HiOutlineClock, HiOutlineUsers, HiOutlineTrendingUp,
    HiOutlineCheckCircle, HiOutlineDownload, HiOutlineTrash, HiOutlineSparkles,
    HiOutlineSearch, HiOutlinePencilAlt, HiOutlineShare, HiOutlineEye,
    HiOutlineChevronDown,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useSmartBack } from '../../hooks/useSmartBack';
import { fmtDateTime } from '../../utils/date';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const StarRow = ({ value }) => {
    const v = Math.round(value || 0);
    return (
        <span className="text-amber-400 text-[14px] tracking-tight whitespace-nowrap">
            {'★'.repeat(v)}<span className="text-[var(--ink-200)]">{'★'.repeat(5 - v)}</span>
        </span>
    );
};

const formatDuration = (startedAt, submittedAt) => {
    if (!startedAt || !submittedAt) return '–';
    const diffSec = Math.abs(new Date(submittedAt) - new Date(startedAt)) / 1000;
    const m = Math.floor(diffSec / 60);
    const s = Math.floor(diffSec % 60);
    return `${m} dəq ${s.toString().padStart(2, '0')} san`;
};

const initialsOf = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
};

// ───────────────────────────────────────────────────────────────────────────
// Stat cards (5 cards top of page)
// ───────────────────────────────────────────────────────────────────────────

const StatCard = ({ Icon, label, value, sub, tone = 'blue' }) => {
    const tones = {
        blue:   'bg-[var(--primary-soft)]   text-[var(--primary)]',
        green:  'bg-[var(--accent-soft)]    text-[var(--brand-green-600)]',
        amber:  'bg-amber-50                text-amber-600',
        slate:  'bg-[var(--ink-100)]        text-[var(--ink-700)]',
        teal:   'bg-teal-50                 text-teal-600',
    };
    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--ink-400)]">{label}</p>
                <p className="text-[24px] font-extrabold text-[var(--ink-900)] leading-none mt-1 truncate">
                    {value}
                </p>
                {sub && <p className="text-[11.5px] text-[var(--ink-500)] mt-1">{sub}</p>}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Top 5 leaderboard
// ───────────────────────────────────────────────────────────────────────────

const Top5 = ({ students, maxScore }) => {
    if (!students?.length) return null;
    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                    <HiOutlineSparkles className="w-4 h-4" />
                </div>
                <h4 className="text-[15px] font-bold text-[var(--ink-900)]">Top 5 Şagird</h4>
            </div>
            <div className="flex flex-col divide-y divide-[var(--ink-150)]">
                {students.slice(0, 5).map((s, i) => {
                    const rankClass =
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-100 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-[var(--ink-100)] text-[var(--ink-500)]';
                    return (
                        <div key={i} className="flex items-center gap-3 py-2.5">
                            <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[12px] font-bold shrink-0 ${rankClass}`}>
                                {i + 1}
                            </span>
                            <span className="w-8 h-8 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] flex items-center justify-center text-[11px] font-bold shrink-0">
                                {initialsOf(s.name)}
                            </span>
                            <span className="flex-1 text-[14px] font-semibold text-[var(--ink-800)] truncate">{s.name}</span>
                            {s.timeSpent && <span className="text-[12px] text-[var(--ink-400)] font-mono shrink-0">{s.timeSpent}</span>}
                            {s.rating && (
                                <span className="text-[12px] text-amber-500 shrink-0 inline-flex items-center gap-0.5">
                                    <span>★</span>{s.rating}
                                </span>
                            )}
                            <span className="text-[14px] font-extrabold text-[var(--primary)] shrink-0">
                                {s.score}{maxScore ? ` / ${maxScore}` : ''} <span className="text-[11px] font-semibold text-[var(--ink-400)]">bal</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Score distribution — derived from submissions
// ───────────────────────────────────────────────────────────────────────────

const ScoreDistribution = ({ submissions, maxScore }) => {
    const buckets = useMemo(() => {
        const ranges = [
            { range: '0-25%',   min: 0,    max: 25  },
            { range: '25-50%',  min: 25,   max: 50  },
            { range: '50-65%',  min: 50,   max: 65  },
            { range: '65-75%',  min: 65,   max: 75  },
            { range: '75-85%',  min: 75,   max: 85  },
            { range: '85-95%',  min: 85,   max: 95  },
            { range: '95-100%', min: 95,   max: 101 },
        ].map(r => ({ ...r, count: 0 }));
        submissions.forEach(s => {
            if (!s.submittedAt || maxScore <= 0) return;
            const pct = ((s.totalScore || 0) / maxScore) * 100;
            const b = ranges.find(r => pct >= r.min && pct < r.max);
            if (b) b.count++;
        });
        return ranges;
    }, [submissions, maxScore]);

    const total = buckets.reduce((s, b) => s + b.count, 0);
    const max = Math.max(...buckets.map(b => b.count), 1);

    if (total === 0) return null;

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <h4 className="text-[15px] font-bold text-[var(--ink-900)]">Bal paylanması</h4>
            <p className="text-[13px] text-[var(--ink-500)] mt-1 mb-5">İştirakçıların hansı bal aralığında olduğunu göstərir</p>
            <div className="flex items-end justify-between gap-2 h-[180px] pt-4">
                {buckets.map((b, i) => {
                    const heightPct = (b.count / max) * 100;
                    const isHi = b.min >= 75;
                    const isMd = b.min >= 50 && b.min < 75;
                    const cls = isHi ? 'bg-[var(--brand-green-600)]' : isMd ? 'bg-amber-400' : 'bg-red-400';
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full flex-1 flex items-end">
                                <div
                                    className={`w-full rounded-t-lg ${cls} relative transition-all duration-500`}
                                    style={{ height: `${Math.max(heightPct, b.count > 0 ? 8 : 2)}%` }}
                                >
                                    {b.count > 0 && (
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[var(--ink-700)]">
                                            {b.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-[10.5px] text-[var(--ink-500)] font-semibold whitespace-nowrap">{b.range}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Participants table
// ───────────────────────────────────────────────────────────────────────────

const ParticipantsTable = ({
    submissions, maxScore, examPrice, isPaid,
    onView, onConfirmDelete, onCancelDelete, onDelete,
    confirmId, deletingId,
}) => {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'totalScore', dir: 'desc' });
    const [pageSize, setPageSize] = useState(20);
    const [page, setPage] = useState(0);

    const sorted = useMemo(() => {
        let out = submissions.slice();
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(s => (s.studentName || '').toLowerCase().includes(q));
        }
        out.sort((a, b) => {
            let av = a[sort.key], bv = b[sort.key];
            if (sort.key === 'time') {
                av = a.startedAt && a.submittedAt ? new Date(a.submittedAt) - new Date(a.startedAt) : 0;
                bv = b.startedAt && b.submittedAt ? new Date(b.submittedAt) - new Date(b.startedAt) : 0;
            }
            if (av == null) return 1;
            if (bv == null) return -1;
            const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sort.dir === 'asc' ? cmp : -cmp;
        });
        return out;
    }, [submissions, search, sort]);

    useEffect(() => { setPage(0); }, [search, sort, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

    const setSortKey = (key) => {
        if (sort.key === key) setSort({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
        else setSort({ key, dir: key === 'studentName' ? 'asc' : 'desc' });
    };

    const Th = ({ k, label, align = 'left' }) => (
        <th
            onClick={k ? () => setSortKey(k) : undefined}
            className={`px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider text-[var(--ink-500)] ${k ? 'cursor-pointer hover:text-[var(--ink-800)] select-none' : ''} text-${align}`}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {k && (
                    <span className="text-[10px]">
                        {sort.key === k ? (sort.dir === 'asc' ? '▲' : '▼') : <span className="text-[var(--ink-300)]">↕</span>}
                    </span>
                )}
            </span>
        </th>
    );

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl overflow-hidden">
            {/* Head */}
            <div className="px-5 py-4 border-b border-[var(--ink-150)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-bold text-[var(--ink-900)]">Bütün iştirakçılar</h4>
                    <span className="text-[11px] font-bold text-[var(--ink-500)] bg-[var(--ink-100)] px-2 py-0.5 rounded-full">{submissions.length}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-colors min-w-[200px]">
                    <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                    <input
                        type="text"
                        placeholder="Ad ilə axtar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-[13px] text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                    <thead className="bg-[var(--ink-50)] border-b border-[var(--ink-150)]">
                        <tr>
                            <Th k="studentName" label="İştirakçı" />
                            <Th k="startedAt"   label="Başlayıb" />
                            <Th k="time"        label="Vaxt" />
                            <Th k="totalScore"  label="Bal" />
                            <Th k="rating"      label="Reytinq" />
                            {isPaid && <Th label="Ödəniş" />}
                            <Th k="isFullyGraded" label="Status" />
                            <Th label="Əməliyyat" align="right" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ink-150)]">
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={isPaid ? 8 : 7} className="text-center py-14 text-[14px] text-[var(--ink-400)]">
                                    {search ? 'Axtarışa uyğun nəticə tapılmadı' : 'Hələ heç bir iştirakçı bu imtahanı verməyib'}
                                </td>
                            </tr>
                        ) : paged.map(r => (
                            <tr key={r.id} className="hover:bg-[var(--ink-100)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] flex items-center justify-center text-[10.5px] font-bold shrink-0">
                                            {initialsOf(r.studentName)}
                                        </span>
                                        <span className="font-semibold text-[var(--ink-900)] text-[13.5px]">{r.studentName || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[12px] font-mono text-[var(--ink-500)] whitespace-nowrap">
                                    {r.startedAt ? fmtDateTime(r.startedAt) : '–'}
                                </td>
                                <td className="px-4 py-3 text-[12.5px] text-[var(--ink-700)] whitespace-nowrap">
                                    {formatDuration(r.startedAt, r.submittedAt)}
                                </td>
                                <td className="px-4 py-3">
                                    {r.submittedAt ? (
                                        <span className="inline-flex items-baseline gap-1">
                                            <span className="text-[14px] font-extrabold text-[var(--primary)]">{r.totalScore ?? 0}</span>
                                            <span className="text-[11px] text-[var(--ink-400)] font-semibold">/ {r.maxScore ?? maxScore ?? '—'}</span>
                                        </span>
                                    ) : <span className="text-[var(--ink-300)]">–</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {r.rating ? <StarRow value={r.rating} /> : <span className="text-[var(--ink-300)]">–</span>}
                                </td>
                                {isPaid && (
                                    <td className="px-4 py-3">
                                        {r.hasPaid === true ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2 py-0.5 rounded-full">
                                                <HiOutlineCheckCircle className="w-3 h-3" />
                                                {r.amountPaid != null ? `${Number(r.amountPaid).toFixed(2)} ₼` : 'Ödənib'}
                                            </span>
                                        ) : r.hasPaid === false ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                                Ödənilməyib
                                            </span>
                                        ) : <span className="text-[var(--ink-300)]">–</span>}
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    {!r.submittedAt ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary-hover)]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                            Davam edir
                                        </span>
                                    ) : r.isFullyGraded ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--brand-green-600)]">
                                            <HiOutlineCheckCircle className="w-3 h-3" />
                                            Tam yoxlanılıb
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            Yoxlanılır
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-1 justify-end">
                                        {r.submittedAt && (
                                            <button
                                                onClick={() => onView(r.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
                                            >
                                                <HiOutlineEye className="w-3.5 h-3.5" /> Bax
                                            </button>
                                        )}
                                        {confirmId === r.id ? (
                                            <span className="inline-flex items-center gap-1 ml-1">
                                                <button
                                                    onClick={() => onDelete(r.id)}
                                                    disabled={deletingId === r.id}
                                                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {deletingId === r.id ? '...' : 'Sil'}
                                                </button>
                                                <button
                                                    onClick={onCancelDelete}
                                                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--ink-100)] text-[var(--ink-600)] hover:bg-[var(--ink-150)] transition-colors"
                                                >
                                                    Ləğv
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => onConfirmDelete(r.id)}
                                                className="ml-1 p-1.5 rounded-md text-[var(--ink-300)] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Statistikadan sil"
                                            >
                                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--ink-150)] flex items-center justify-between gap-3 flex-wrap bg-[var(--ink-50)]/50">
                <div className="text-[12px] text-[var(--ink-500)] flex items-center gap-2">
                    <span>Sətir sayı:</span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="appearance-none pl-2.5 pr-7 py-1 bg-white border border-[var(--ink-200)] rounded-md text-[12px] font-semibold text-[var(--ink-700)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <HiOutlineChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--ink-400)] pointer-events-none" />
                    </div>
                </div>
                <div className="text-[12px] text-[var(--ink-500)]">
                    {sorted.length === 0 ? '0' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)}`} / {sorted.length}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-[12px] text-[var(--ink-500)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >⏮</button>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-[12px] text-[var(--ink-500)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >◀</button>
                    <span className="px-2 text-[12px] text-[var(--ink-700)] font-semibold">{page + 1} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-[12px] text-[var(--ink-500)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >▶</button>
                    <button
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page === totalPages - 1}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-[12px] text-[var(--ink-500)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >⏭</button>
                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const ExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const goBack = useSmartBack(isAdmin ? '/admin/muellim-imtahanlar' : '/imtahanlar');

    const [submissions, setSubmissions] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [subsRes, statsRes] = await Promise.all([
                    api.get(`/submissions/exam/${examId}`),
                    api.get(`/submissions/exam/${examId}/statistics`),
                ]);
                setSubmissions(subsRes.data);
                setStatistics(statsRes.data);
            } catch (error) {
                const msg = error.response?.status === 404
                    ? 'Belə bir imtahan tapılmadı'
                    : (error.response?.data?.message || 'Nəticələr yüklənmədi');
                toast.error(msg);
                navigate('/imtahanlar');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [examId]);

    const handleHide = async (id) => {
        setDeletingId(id);
        try {
            await api.delete(`/submissions/${id}/teacher-hide`);
            setSubmissions(prev => prev.filter(s => s.id !== id));
            setStatistics(prev => prev ? {
                ...prev,
                totalParticipants: Math.max(0, (prev.totalParticipants || 1) - 1),
            } : prev);
            toast.success('Nəticə statistikadan silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        } finally {
            setDeletingId(null);
            setConfirmId(null);
        }
    };

    const exportToExcel = async () => {
        try {
            const response = await api.get(`/submissions/exam/${examId}/export`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `imtahan_${examId}_neticeler.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Excel faylı yüklənmədi');
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/imtahanlar/${examId}/statistika`;
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url);
        toast.success('Link kopyalandı');
    };

    const isPaid = isAdmin && statistics?.examPrice != null && statistics.examPrice > 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            {/* ── Top bar (sticky) ── */}
            <div className="sticky top-0 z-20 border-b border-[var(--ink-150)] bg-[color-mix(in_srgb,var(--paper-cream),white_30%)]/90 backdrop-blur">
                <div className="container-main py-4 flex items-center gap-4 flex-wrap">
                    <button
                        onClick={goBack}
                        className="p-2 rounded-lg text-[var(--ink-600)] hover:bg-[var(--ink-100)] transition-colors"
                        title="Geri qayıt"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[18px] md:text-[20px] font-extrabold text-[var(--ink-900)] truncate tracking-tight">
                            {statistics?.examTitle || 'İmtahan Nəticələri'}
                        </h1>
                        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-500)] mt-0.5 flex-wrap">
                            <span>İmtahan ID: <strong className="text-[var(--ink-700)]">{examId}</strong></span>
                            {isAdmin && statistics?.examPrice != null && (
                                statistics.examPrice > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        Ödənişli · {Number(statistics.examPrice).toFixed(2)} ₼
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2 py-0.5 rounded-full">
                                        Pulsuz
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Link
                            to={`/imtahanlar/duzenle/${examId}`}
                            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            <HiOutlinePencilAlt className="w-4 h-4" /> Redaktə et
                        </Link>
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            <HiOutlineShare className="w-4 h-4" /> Paylaş
                        </button>
                        {submissions.length > 0 && (
                            <button
                                onClick={exportToExcel}
                                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-bold text-white bg-[var(--brand-green-600)] hover:bg-[var(--brand-green-600)]/90 shadow-[0_8px_24px_-10px_rgba(34,197,94,0.6)] transition-all"
                            >
                                <HiOutlineDownload className="w-4 h-4" /> Excel ixracı
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container-main py-8 space-y-6">
                {/* ── Stat cards ── */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            Icon={HiOutlineUsers}
                            label="İştirakçılar"
                            value={statistics.totalParticipants ?? 0}
                            tone="blue"
                        />
                        <StatCard
                            Icon={HiOutlineTrendingUp}
                            label="Ort. Bal"
                            value={
                                <>
                                    {statistics.averageScore?.toFixed(1) ?? '0.0'}
                                    <span className="text-[14px] text-[var(--ink-400)] font-semibold ml-1">/ {statistics.maximumScore ?? 0}</span>
                                </>
                            }
                            tone="green"
                        />
                        <StatCard
                            Icon={HiOutlineClock}
                            label="Ort. Vaxt"
                            value={`${statistics.averageDurationMinutes ?? 0} dəq`}
                            tone="slate"
                        />
                        <StatCard
                            Icon={() => <span className="text-amber-500 text-xl leading-none">★</span>}
                            label="Ort. Reytinq"
                            value={statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : '—'}
                            sub={statistics.averageRating > 0 ? <StarRow value={statistics.averageRating} /> : null}
                            tone="amber"
                        />
                    </div>
                )}

                {/* ── Top 5 + Score distribution side-by-side on large screens ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Top5 students={statistics?.topStudents} maxScore={statistics?.maximumScore} />
                    <ScoreDistribution submissions={submissions} maxScore={statistics?.maximumScore || 1} />
                </div>

                {/* ── Participants table ── */}
                <ParticipantsTable
                    submissions={submissions}
                    maxScore={statistics?.maximumScore}
                    examPrice={statistics?.examPrice}
                    isPaid={isPaid}
                    onView={(id) => navigate(`/test/review/${id}`)}
                    onConfirmDelete={setConfirmId}
                    onCancelDelete={() => setConfirmId(null)}
                    onDelete={handleHide}
                    confirmId={confirmId}
                    deletingId={deletingId}
                />
            </div>
        </div>
    );
};

export default ExamResults;
