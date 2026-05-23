import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlinePlusCircle, HiOutlineSearch, HiOutlineDocumentText,
    HiOutlineLockClosed, HiOutlineBookmark, HiBookmark,
    HiOutlineClock, HiOutlineQuestionMarkCircle, HiOutlineArrowRight,
    HiOutlineX, HiOutlineChevronDown, HiOutlineUserGroup,
    HiOutlinePaperAirplane, HiOutlineTag, HiOutlineSparkles,
    HiOutlineViewGrid, HiOutlineViewList, HiOutlineLibrary,
    HiOutlineFire, HiOutlineCheck,
} from 'react-icons/hi';
import { useNavigate, Link } from 'react-router-dom';
import { ExamCard, CreateExamModal } from '../../components/ui';
import AiExamModal from '../../components/ui/AiExamModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ───────────────────────────────────────────────────────────────────────────
// Subject palette (deterministic by name hash so the same subject keeps its colour)
// ───────────────────────────────────────────────────────────────────────────

const SUBJECT_PALETTES = [
    { color: '#2563EB', soft: '#EFF4FF' },  // blue
    { color: '#16A34A', soft: '#ECFDF3' },  // green
    { color: '#0891B2', soft: '#ECFEFF' },  // cyan
    { color: '#0D9488', soft: '#F0FDFA' },  // teal
    { color: '#C2410C', soft: '#FFF7ED' },  // orange
    { color: '#0EA5E9', soft: '#F0F9FF' },  // sky
    { color: '#DC2626', soft: '#FEF2F2' },  // red
    { color: '#475569', soft: '#F1F5F9' },  // slate
    { color: '#059669', soft: '#ECFDF5' },  // emerald
    { color: '#0369A1', soft: '#F0F9FF' },  // sky-darker
];

const hashIndex = (s, n) => {
    let h = 0;
    for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % n;
};

const paletteFor = (name) => SUBJECT_PALETTES[hashIndex(name || '', SUBJECT_PALETTES.length)];

const subjectInitial = (name) => {
    if (!name) return '?';
    const cleaned = name.trim();
    return cleaned.charAt(0).toUpperCase();
};

// ───────────────────────────────────────────────────────────────────────────
// Filter block (sidebar)
// ───────────────────────────────────────────────────────────────────────────

const FilterBlock = ({ title, children }) => (
    <div className="border-b border-[var(--ink-150)] last:border-0 pb-5 mb-5 last:mb-0 last:pb-0">
        <h4 className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-700)] mb-3">{title}</h4>
        {children}
    </div>
);

const FilterRow = ({ active, onClick, children, count }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] text-left transition-colors ${
            active
                ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)] font-semibold'
                : 'text-[var(--ink-600)] hover:bg-[var(--ink-100)]'
        }`}
    >
        <span className="truncate">{children}</span>
        {count != null && (
            <span className={`text-[11px] font-semibold shrink-0 ${active ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`}>{count}</span>
        )}
    </button>
);

const FilterCheck = ({ checked, onChange, children, count, radio = false }) => (
    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--ink-100)] transition-colors text-[13px] text-[var(--ink-700)]">
        <input
            type={radio ? 'radio' : 'checkbox'}
            checked={checked}
            onChange={onChange}
            className="w-4 h-4 rounded accent-[var(--primary)] shrink-0"
        />
        <span className="flex-1 truncate">{children}</span>
        {count != null && <span className="text-[11px] font-semibold text-[var(--ink-400)] shrink-0">{count}</span>}
    </label>
);

// ───────────────────────────────────────────────────────────────────────────
// Category tiles (subjects)
// ───────────────────────────────────────────────────────────────────────────

const CategoryTiles = ({ subjects, activeSubject, onChange, totalCount, examsBySubject }) => {
    const tiles = [
        { value: '', name: 'Hamısı', count: totalCount, color: '#2563EB', soft: '#EFF4FF', initial: <HiOutlineLibrary className="w-4 h-4" /> },
        ...subjects.map(s => {
            const p = paletteFor(s);
            return { value: s, name: s, count: examsBySubject[s] || 0, color: p.color, soft: p.soft, initial: subjectInitial(s) };
        }),
    ];
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {tiles.map(t => {
                const active = activeSubject === t.value;
                return (
                    <button
                        key={t.value || '__all'}
                        onClick={() => onChange(t.value)}
                        className={`shrink-0 inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
                            active
                                ? 'bg-white shadow-[var(--sh-sm)]'
                                : 'bg-white/60 border-transparent hover:bg-white hover:border-[var(--ink-200)]'
                        }`}
                        style={active ? { borderColor: t.color } : {}}
                    >
                        <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold"
                            style={{ background: t.soft, color: t.color }}
                        >
                            {t.initial}
                        </span>
                        <span className="text-left">
                            <span className={`block text-[13px] font-bold leading-tight ${active ? 'text-[var(--ink-900)]' : 'text-[var(--ink-800)]'}`}>{t.name}</span>
                            <span className="block text-[11px] text-[var(--ink-500)] leading-tight">{t.count} imtahan</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Subscription usage strip (teacher only)
// ───────────────────────────────────────────────────────────────────────────

const UsageBar = ({ label, used, limit, color }) => {
    if (limit === -1) {
        return (
            <div className="flex-1 min-w-[120px]">
                <div className="flex justify-between text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-400)] mb-1">
                    <span>{label}</span>
                    <span className="text-[var(--primary)]">Limitsiz</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--ink-150)] rounded-full overflow-hidden">
                    <div className="h-full w-full" style={{ background: color, opacity: 0.2 }} />
                </div>
            </div>
        );
    }
    if (limit == null) return null;
    const percent = Math.min(100, Math.round((used / limit) * 100));
    const isFull = used >= limit;
    return (
        <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">
                <span>{label}</span>
                <span className={isFull ? 'text-red-500' : 'text-[var(--ink-900)]'}>{used} / {limit}</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--ink-150)] rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${percent}%`, background: isFull ? '#EF4444' : color }}
                />
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Student exam card — testup style
// ───────────────────────────────────────────────────────────────────────────

const StudentExamCard = ({ exam, view = 'grid', isSaved, savingLink, isPurchased, onView, onToggleDepot }) => {
    const subjects = exam.subjects?.length ? exam.subjects : (exam.subject ? [exam.subject] : []);
    const tags = exam.tags || [];
    const questionCount = (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);
    const avgRating = exam.averageRating ? Math.round(exam.averageRating * 10) / 10 : null;
    const ratingCount = exam.ratingCount || 0;
    const isPaid = exam.price != null && Number(exam.price) > 0;
    const isPrivate = exam.visibility === 'PRIVATE';

    const primarySubject = subjects[0] || 'İmtahan';
    const palette = paletteFor(primarySubject);

    const isNew = exam.createdAt && (Date.now() - new Date(exam.createdAt).getTime()) < 7 * 86400000;
    const isPopular = (exam.participantCount || 0) >= 50 || (avgRating && avgRating >= 4.7);

    if (view === 'list') {
        return (
            <article
                onClick={() => onView(exam)}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-[var(--ink-200)] hover:border-[var(--primary)] p-4 cursor-pointer transition-all"
            >
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0"
                    style={{ background: palette.soft, color: palette.color }}
                >
                    {subjectInitial(primarySubject)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: palette.color }}>{primarySubject}</span>
                        {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)]">Yeni</span>}
                        {isPopular && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 inline-flex items-center gap-0.5"><HiOutlineFire className="w-2.5 h-2.5" /> Populyar</span>}
                    </div>
                    <h3 className="font-bold text-[var(--ink-900)] text-[15px] truncate group-hover:text-[var(--primary)] transition-colors">{exam.title}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-[var(--ink-500)] mt-1">
                        <span className="inline-flex items-center gap-1"><HiOutlineQuestionMarkCircle className="w-3.5 h-3.5" />{questionCount}</span>
                        {exam.durationMinutes > 0 && <span className="inline-flex items-center gap-1"><HiOutlineClock className="w-3.5 h-3.5" />{exam.durationMinutes} dəq</span>}
                        {avgRating != null && <span className="inline-flex items-center gap-0.5"><span className="text-amber-400">★</span>{avgRating.toFixed(1)}</span>}
                        {exam.teacherName && <span className="truncate">· {exam.teacherName}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {isPaid && !isPurchased ? (
                        <span className="text-[16px] font-bold text-[var(--ink-900)]">{Number(exam.price).toFixed(2)} <span className="text-[12px] text-[var(--ink-500)]">₼</span></span>
                    ) : (
                        <span className="text-[12px] font-bold text-[var(--brand-green-600)] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green-600)]" /> {isPurchased ? 'Alınıb' : 'Pulsuz'}
                        </span>
                    )}
                    <button
                        onClick={e => { e.stopPropagation(); onToggleDepot(exam); }}
                        className={`p-2 rounded-lg transition-all ${isSaved ? 'text-[var(--primary)] bg-[var(--primary-soft)]' : 'text-[var(--ink-400)] hover:text-[var(--primary)] hover:bg-[var(--ink-100)]'}`}
                    >
                        {isSaved ? <HiBookmark className="w-4 h-4" /> : <HiOutlineBookmark className="w-4 h-4" />}
                    </button>
                    <HiOutlineArrowRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                </div>
            </article>
        );
    }

    return (
        <article
            onClick={() => onView(exam)}
            className="group flex flex-col bg-white rounded-2xl border border-[var(--ink-200)] hover:border-[var(--primary)] hover:shadow-[var(--sh-md)] cursor-pointer overflow-hidden transition-all"
        >
            {/* Header — subject color block */}
            <div className="relative px-5 pt-5 pb-4" style={{ background: palette.soft }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-50" style={{ background: palette.color, filter: 'blur(40px)' }} />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[16px] shrink-0 shadow-sm"
                            style={{ background: palette.color }}
                        >
                            {subjectInitial(primarySubject)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {subjects.slice(0, 2).map((s, i) => (
                                    <span key={i} className="text-[11px] font-bold uppercase tracking-wider truncate max-w-[140px]" style={{ color: palette.color }}>
                                        {s}
                                    </span>
                                ))}
                                {subjects.length > 2 && (
                                    <span className="text-[11px] font-semibold opacity-70" style={{ color: palette.color }}>+{subjects.length - 2}</span>
                                )}
                            </div>
                            {exam.teacherName && (
                                <p className="text-[11.5px] text-[var(--ink-600)] truncate mt-0.5">{exam.teacherName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); onToggleDepot(exam); }}
                        disabled={savingLink === exam.shareLink}
                        title={isSaved ? 'Depodan çıxar' : 'Depoya əlavə et'}
                        className={`p-2 rounded-lg transition-all disabled:opacity-50 shrink-0 ${
                            isSaved ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--ink-500)] hover:text-[var(--primary)] hover:bg-white/70'
                        }`}
                    >
                        {savingLink === exam.shareLink
                            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : isSaved ? <HiBookmark className="w-4 h-4" /> : <HiOutlineBookmark className="w-4 h-4" />
                        }
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)]">Yeni</span>}
                    {isPopular && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 inline-flex items-center gap-0.5"><HiOutlineFire className="w-2.5 h-2.5" /> Populyar</span>}
                    {!isPaid && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Pulsuz</span>}
                    {isPrivate && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-600)] inline-flex items-center gap-0.5">
                            <HiOutlineLockClosed className="w-2.5 h-2.5" /> Gizli
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-[var(--ink-900)] text-[16px] leading-snug mb-3 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {exam.title}
                </h3>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-4 min-h-[18px]">
                        {tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[11.5px] text-[var(--ink-500)] font-medium truncate max-w-[130px]">
                                #{tag}
                            </span>
                        ))}
                        {tags.length > 3 && <span className="text-[11.5px] text-[var(--ink-400)] font-medium">+{tags.length - 3}</span>}
                    </div>
                )}

                {/* Stat grid */}
                <div className="grid grid-cols-4 gap-2 mt-auto mb-4 pt-3 border-t border-dashed border-[var(--ink-200)]">
                    <Stat Icon={HiOutlineQuestionMarkCircle} value={questionCount} label="Sual" />
                    <Stat Icon={HiOutlineClock}              value={exam.durationMinutes || '—'} label="Dəq" />
                    <Stat Icon={HiOutlineUserGroup}          value={exam.participantCount || 0} label="Cəhd" />
                    <Stat star value={avgRating != null ? avgRating.toFixed(1) : '—'} label="Reyt" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3">
                    {isPurchased ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--brand-green-600)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green-600)]" />
                            Alınıb
                        </span>
                    ) : isPaid ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-[20px] font-extrabold text-[var(--ink-900)] tabular-nums">{Number(exam.price).toFixed(2)}</span>
                            <span className="text-[12px] font-bold text-[var(--ink-500)]">AZN</span>
                            {ratingCount > 0 && <span className="text-[11px] text-[var(--ink-400)] ml-1">({ratingCount} rəy)</span>}
                        </div>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--brand-green-600)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green-600)]" />
                            Pulsuz
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full bg-[var(--ink-900)] text-white group-hover:bg-[var(--primary)] transition-colors">
                        İmtahana bax
                        <HiOutlineArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </article>
    );
};

const Stat = ({ Icon, value, label, star }) => (
    <div className="text-center">
        <div className="text-[13.5px] font-bold text-[var(--ink-800)] inline-flex items-center gap-0.5 justify-center">
            {star ? <span className="text-amber-400">★</span> : Icon && <Icon className="w-3.5 h-3.5 text-[var(--ink-400)]" />}
            {value}
        </div>
        <div className="text-[10px] text-[var(--ink-400)] mt-0.5 uppercase tracking-wider font-semibold">{label}</div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const normalizeExam = (exam) => ({
    ...exam,
    subjects: exam.subjects || [],
    tags: exam.tags || [],
    duration: exam.durationMinutes,
    questionCount: (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0),
});

const ExamList = () => {
    const { user, isTeacher, isAdmin, isStudent, isAuthenticated, hasPermission, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin) navigate('/admin/oz-imtahanlar', { replace: true });
    }, [isAdmin, navigate]);

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showAiExamModal, setShowAiExamModal] = useState(false);
    const [savedExamLinks, setSavedExamLinks] = useState(new Set());
    const [savingLink, setSavingLink] = useState(null);
    const [purchasedExams, setPurchasedExams] = useState(new Set());
    const [collaborativeAssignments, setCollaborativeAssignments] = useState([]);

    // View state
    const [view, setView] = useState('grid'); // grid | list

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [visibilityFilter, setVisibilityFilter] = useState('ALL');
    const [priceFilter, setPriceFilter] = useState('ALL');
    const [durationFilter, setDurationFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');
    const [selectedTags, setSelectedTags] = useState([]);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [ratingFilter, setRatingFilter] = useState(0);
    const [featureFilters, setFeatureFilters] = useState([]); // [new, popular]

    // Pagination
    const [page, setPage] = useState(0);
    const pageSize = 12;

    // ── Load data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const endpoint = (isTeacher || isAdmin) ? '/exams' : '/exams/public';
                const data = (await api.get(endpoint)).data;
                if (!cancelled) setExams(data);
            } catch {
                if (!cancelled) toast.error('İmtahanları yükləyərkən xəta baş verdi');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        if (isTeacher) {
            refreshSubscription();
            api.get('/collaborative-exams/my-assignments')
                .then(r => { if (!cancelled) setCollaborativeAssignments(r.data); })
                .catch(() => {});
        }
        return () => { cancelled = true; };
    }, [user?.id, isStudent, isTeacher, isAdmin]);

    useEffect(() => {
        if (isStudent && isAuthenticated) {
            api.get('/depot').then(res => {
                setSavedExamLinks(new Set(res.data.map(e => e.shareLink)));
            }).catch(() => {});
            api.get('/exams/my-purchased-exams').then(res => {
                setPurchasedExams(new Set(res.data));
            }).catch(() => {});
        }
    }, [isStudent, isAuthenticated]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const allTags = useMemo(() => {
        const map = {};
        exams.forEach(e => (e.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; }));
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [exams]);

    const allSubjects = useMemo(() => {
        const set = new Set();
        exams.forEach(e => (e.subjects || []).forEach(s => set.add(s)));
        return [...set].sort();
    }, [exams]);

    const examsBySubject = useMemo(() => {
        const m = {};
        exams.forEach(e => (e.subjects || []).forEach(s => { m[s] = (m[s] || 0) + 1; }));
        return m;
    }, [exams]);

    const filteredExams = useMemo(() => {
        let list = [...exams];

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (e.subjects || []).some(s => s.toLowerCase().includes(q)) ||
                (e.subject || '').toLowerCase().includes(q) ||
                (e.teacherName || '').toLowerCase().includes(q)
            );
        }

        if (isTeacher) {
            if (statusFilter === 'DRAFT') list = list.filter(e => e.status === 'DRAFT');
            else if (statusFilter === 'PUBLISHED') list = list.filter(e => e.status === 'PUBLISHED');
            if (visibilityFilter === 'PUBLIC') list = list.filter(e => e.visibility === 'PUBLIC');
            else if (visibilityFilter === 'PRIVATE') list = list.filter(e => e.visibility === 'PRIVATE');
            if (typeFilter !== 'ALL') list = list.filter(e => e.examType === typeFilter);
        } else {
            if (priceFilter === 'FREE') list = list.filter(e => !e.price || Number(e.price) === 0);
            else if (priceFilter === 'PAID') list = list.filter(e => e.price && Number(e.price) > 0);

            if (durationFilter === 'SHORT')  list = list.filter(e => e.durationMinutes && e.durationMinutes < 30);
            else if (durationFilter === 'MEDIUM') list = list.filter(e => e.durationMinutes && e.durationMinutes >= 30 && e.durationMinutes <= 60);
            else if (durationFilter === 'LONG')   list = list.filter(e => e.durationMinutes && e.durationMinutes > 60);

            if (ratingFilter > 0) list = list.filter(e => (e.averageRating || 0) >= ratingFilter);

            if (featureFilters.includes('new')) {
                list = list.filter(e => e.createdAt && (Date.now() - new Date(e.createdAt).getTime()) < 7 * 86400000);
            }
            if (featureFilters.includes('popular')) {
                list = list.filter(e => (e.participantCount || 0) >= 50 || (e.averageRating && e.averageRating >= 4.7));
            }
        }

        if (selectedTags.length > 0) list = list.filter(e => selectedTags.some(t => (e.tags || []).includes(t)));
        if (subjectFilter)            list = list.filter(e => (e.subjects || []).includes(subjectFilter));

        if (sortBy === 'NEWEST')         list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        else if (sortBy === 'OLDEST')    list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        else if (sortBy === 'TITLE')     list.sort((a, b) => a.title.localeCompare(b.title, 'az'));
        else if (sortBy === 'POPULAR')   list.sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0));
        else if (sortBy === 'RATING')    list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        else if (sortBy === 'PRICE_ASC') list.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sortBy === 'PRICE_DESC')list.sort((a, b) => (b.price || 0) - (a.price || 0));

        return list;
    }, [exams, search, statusFilter, visibilityFilter, priceFilter, durationFilter, sortBy, selectedTags, subjectFilter, typeFilter, ratingFilter, featureFilters, isTeacher]);

    // Reset to first page when filters change
    useEffect(() => { setPage(0); }, [search, statusFilter, visibilityFilter, priceFilter, durationFilter, sortBy, selectedTags, subjectFilter, typeFilter, ratingFilter, featureFilters]);

    const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
    const pagedExams = filteredExams.slice(page * pageSize, (page + 1) * pageSize);

    // ── Active filter chips ───────────────────────────────────────────────────
    const activeChips = useMemo(() => {
        const chips = [];
        if (subjectFilter) chips.push({ label: subjectFilter, clear: () => setSubjectFilter('') });
        if (isTeacher) {
            if (statusFilter !== 'ALL') chips.push({ label: statusFilter === 'DRAFT' ? 'Qaralama' : 'Yayımlanmış', clear: () => setStatusFilter('ALL') });
            if (visibilityFilter !== 'ALL') chips.push({ label: visibilityFilter === 'PUBLIC' ? 'Açıq' : 'Gizli', clear: () => setVisibilityFilter('ALL') });
            if (typeFilter !== 'ALL') chips.push({ label: typeFilter === 'TEMPLATE' ? 'Şablon' : 'Sərbəst', clear: () => setTypeFilter('ALL') });
        } else {
            if (priceFilter !== 'ALL') chips.push({ label: priceFilter === 'FREE' ? 'Pulsuz' : 'Ödənişli', clear: () => setPriceFilter('ALL') });
            if (durationFilter !== 'ALL') chips.push({
                label: { SHORT: '<30 dəq', MEDIUM: '30–60 dəq', LONG: '>60 dəq' }[durationFilter],
                clear: () => setDurationFilter('ALL'),
            });
            if (ratingFilter > 0) chips.push({ label: `${ratingFilter}★ +`, clear: () => setRatingFilter(0) });
            featureFilters.forEach(f => chips.push({
                label: f === 'new' ? 'Yeni' : 'Populyar',
                clear: () => setFeatureFilters(prev => prev.filter(x => x !== f)),
            }));
        }
        selectedTags.forEach(t => chips.push({ label: `#${t}`, clear: () => setSelectedTags(prev => prev.filter(x => x !== t)) }));
        return chips;
    }, [subjectFilter, statusFilter, visibilityFilter, typeFilter, priceFilter, durationFilter, ratingFilter, featureFilters, selectedTags, isTeacher]);

    const clearAllFilters = () => {
        setSearch('');
        setStatusFilter('ALL'); setVisibilityFilter('ALL'); setTypeFilter('ALL');
        setPriceFilter('ALL'); setDurationFilter('ALL'); setRatingFilter(0); setFeatureFilters([]);
        setSelectedTags([]); setSubjectFilter('');
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Bu imtahanı silmək istədiyinizə əminsiniz?')) return;
        try {
            await api.delete(`/exams/${id}`);
            toast.success('İmtahan silindi');
            setExams(exams.filter(e => e.id !== id));
        } catch {
            toast.error('İmtahanı silmək mümkün olmadı');
        }
    };

    const handleClone = async (id) => {
        try {
            const { data } = await api.post(`/exams/${id}/clone`);
            setExams(prev => [data, ...prev]);
            toast.success('İmtahan kopyalandı');
            navigate(`/imtahanlar/duzenle/${data.id}`);
        } catch {
            toast.error('Kopyalama mümkün olmadı');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const { data } = await api.patch(`/exams/${id}/toggle-status`);
            setExams(prev => prev.map(e => e.id === id ? { ...e, status: data.status } : e));
            toast.success(data.status === 'PUBLISHED' ? 'İmtahan açıldı' : 'İmtahan bağlandı');
        } catch (err) {
            if (!err._handled) toast.error(err.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDownloadPdf = async (examId) => {
        const loadingToast = toast.loading('PDF hazırlanır...');
        try {
            const response = await api.get(`/exams/${examId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `exam_${examId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF uğurla yükləndi', { id: loadingToast });
        } catch {
            toast.error('PDF yükləyərkən xəta baş verdi', { id: loadingToast });
        }
    };

    const handleShare = (id) => {
        const exam = exams.find(e => e.id === id);
        if (!exam) return;
        const link = `${window.location.origin}/imtahan/${exam.shareLink}`;
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link);
        toast.success('Paylaşım linki kopyalandı');
    };

    const handleViewExam = (exam) => navigate(`/imtahanlar/melumat/${exam.shareLink}`);

    const handleAiExamGenerate = (questions, subjectName) => {
        setShowAiExamModal(false);
        navigate('/imtahanlar/yarat', {
            state: { type: 'free', subject: subjectName, aiQuestions: questions },
        });
    };

    const handleToggleDepot = async (exam) => {
        if (!isAuthenticated) { toast.error('Depoya əlavə etmək üçün hesabınıza daxil olun'); return; }
        const isSaved = savedExamLinks.has(exam.shareLink);
        setSavingLink(exam.shareLink);
        try {
            if (isSaved) {
                await api.delete(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => { const n = new Set(prev); n.delete(exam.shareLink); return n; });
                toast.success('Depodan silindi');
            } else {
                await api.post(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => new Set([...prev, exam.shareLink]));
                toast.success('Depoya əlavə edildi');
            }
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        } finally {
            setSavingLink(null);
        }
    };

    const handleTagClick = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    };

    const handleCreateExam = () => {
        if (isAdmin) { setIsCreateModalOpen(true); return; }
        if (!subscription?.plan) { toast.error('İmtahan yaratmaq üçün aktiv abunəliyiniz olmalıdır.'); return; }
        const mLimit = subscription?.plan?.monthlyExamLimit;
        const mUsed = subscription?.usedMonthlyExams || 0;
        if (mLimit !== -1 && mUsed >= mLimit) { toast.error(`Aylıq imtahan limitiniz (${mLimit}) dolub.`); return; }
        const tLimit = subscription?.plan?.maxSavedExamsLimit;
        const tUsed = subscription?.totalExamsCount || 0;
        if (tLimit !== -1 && tUsed >= tLimit) { toast.error(`Maksimum imtahan limitini (${tLimit}) aşmısınız.`); return; }
        setIsCreateModalOpen(true);
    };

    // Computed counts for sidebar
    const counts = useMemo(() => {
        if (isTeacher) {
            return {
                draftCount: exams.filter(e => e.status === 'DRAFT').length,
                publishedCount: exams.filter(e => e.status === 'PUBLISHED').length,
                publicCount: exams.filter(e => e.visibility === 'PUBLIC').length,
                privateCount: exams.filter(e => e.visibility === 'PRIVATE').length,
            };
        }
        return {
            freeCount: exams.filter(e => !e.price || Number(e.price) === 0).length,
            paidCount: exams.filter(e => e.price && Number(e.price) > 0).length,
            shortCount: exams.filter(e => e.durationMinutes && e.durationMinutes < 30).length,
            mediumCount: exams.filter(e => e.durationMinutes && e.durationMinutes >= 30 && e.durationMinutes <= 60).length,
            longCount: exams.filter(e => e.durationMinutes && e.durationMinutes > 60).length,
            newCount: exams.filter(e => e.createdAt && (Date.now() - new Date(e.createdAt).getTime()) < 7 * 86400000).length,
            popularCount: exams.filter(e => (e.participantCount || 0) >= 50 || (e.averageRating && e.averageRating >= 4.7)).length,
        };
    }, [exams, isTeacher]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>İmtahanlar — testup.az</title>
                <meta name="description" content="testup.az platformasındakı imtahanları nəzərdən keçirin, filtrlə süzgəcdən keçirin və bir kliklə başlayın." />
                <link rel="canonical" href="https://testup.az/imtahanlar" />
            </Helmet>

            {/* ── Hero ── */}
            <section
                className="relative pt-14 md:pt-18 pb-10 overflow-hidden border-b border-[var(--ink-150)]"
                style={{ background: 'linear-gradient(180deg, var(--brand-blue-50) 0%, transparent 100%)' }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                    }}
                />
                <div className="container-main relative">
                    <div className="flex items-center gap-2 text-[13.5px] text-[var(--ink-500)] mb-4">
                        <Link to="/" className="hover:text-[var(--primary)]">Ana Səhifə</Link>
                        <span className="text-[var(--ink-300)]">/</span>
                        <span className="text-[var(--ink-800)] font-semibold">İmtahanlar</span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-[720px]">
                            <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--ink-900)] text-balance">
                                {isTeacher ? 'İmtahanlarınızı idarə edin' : 'Mövcud imtahanları kəşf edin'}
                            </h1>
                            <p className="mt-3 text-[17px] text-[var(--ink-500)] max-w-[580px] leading-relaxed">
                                {isTeacher
                                    ? 'Yaratdığınız imtahanlar — yayımlayın, paylaşın və nəticələri izləyin.'
                                    : 'Müəlliflərin paylaşdığı imtahanlar. Filtrlə süzgəcdən keçirin, sevimlilərinizi qeyd edin və bir kliklə başlayın.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {isStudent && (
                                <Link
                                    to="/profil"
                                    state={{ tab: 'depot' }}
                                    className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                                >
                                    <HiBookmark className="w-4 h-4" /> Sevimlilərim
                                </Link>
                            )}
                            {(isTeacher || isAdmin) && (
                                <>
                                    <button
                                        onClick={() => setShowAiExamModal(true)}
                                        className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] hover:bg-[var(--brand-green-100)] transition-all"
                                    >
                                        <HiOutlineSparkles className="w-4 h-4" /> AI ilə Yarat
                                    </button>
                                    <button
                                        onClick={handleCreateExam}
                                        className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                    >
                                        <HiOutlinePlusCircle className="w-4 h-4" /> Yeni İmtahan
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Subscription bars */}
                    {(isTeacher || isAdmin) && subscription && (
                        <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-[var(--ink-200)] p-4 flex flex-wrap items-center gap-5 max-w-2xl">
                            <UsageBar
                                label="Aylıq limit"
                                used={subscription.usedMonthlyExams}
                                limit={subscription.plan?.monthlyExamLimit}
                                color="var(--primary)"
                            />
                            <div className="w-px h-9 bg-[var(--ink-200)] hidden sm:block" />
                            <UsageBar
                                label="Ümumi limit"
                                used={subscription.totalExamsCount}
                                limit={subscription.plan?.maxSavedExamsLimit}
                                color="var(--accent)"
                            />
                            {subscription.endDate && (() => {
                                const days = Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000));
                                return (
                                    <div className="shrink-0">
                                        <p className="text-[10.5px] text-[var(--ink-400)] font-bold uppercase tracking-wider mb-0.5">{subscription.plan?.name}</p>
                                        <p className={`text-[12.5px] font-bold ${days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-[var(--ink-700)]'}`}>
                                            {days === 0 ? 'Bu gün bitir' : `${days} gün qalır`}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Collaborative banner */}
                    {isTeacher && collaborativeAssignments.filter(a => a.status !== 'APPROVED').length > 0 && (() => {
                        const active = collaborativeAssignments.filter(a => a.status !== 'APPROVED');
                        const rejected = active.filter(a => a.status === 'REJECTED').length;
                        const submitted = active.filter(a => a.status === 'SUBMITTED').length;
                        return (
                            <Link
                                to="/birge-imtahanlari"
                                className="mt-4 flex items-center justify-between gap-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-4 rounded-2xl shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all max-w-2xl"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                                        <HiOutlineUserGroup className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[14px]">Birgə imtahanlarım</p>
                                        <p className="text-[12px] text-white/75 mt-0.5">
                                            {active.length} aktiv tapşırıq
                                            {rejected > 0 && <span className="ml-2 text-red-200 font-semibold">· {rejected} geri qaytarıldı</span>}
                                            {submitted > 0 && <span className="ml-2 text-amber-200 font-semibold">· {submitted} admin yoxlayır</span>}
                                        </p>
                                    </div>
                                </div>
                                <HiOutlinePaperAirplane className="w-5 h-5 shrink-0 opacity-70 rotate-90" />
                            </Link>
                        );
                    })()}
                </div>
            </section>

            {/* ── Main body ── */}
            <div className="container-main py-8 md:py-10">
                <div className="grid lg:grid-cols-[260px_1fr] gap-7">
                    {/* ── Sidebar ── */}
                    <aside className="lg:sticky lg:top-6 lg:self-start bg-white border border-[var(--ink-200)] rounded-2xl p-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
                        {isTeacher ? (
                            <>
                                <FilterBlock title="Status">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterRow active={statusFilter === 'ALL'}       onClick={() => setStatusFilter('ALL')}       count={exams.length}>Hamısı</FilterRow>
                                        <FilterRow active={statusFilter === 'DRAFT'}     onClick={() => setStatusFilter('DRAFT')}     count={counts.draftCount}>Qaralama</FilterRow>
                                        <FilterRow active={statusFilter === 'PUBLISHED'} onClick={() => setStatusFilter('PUBLISHED')} count={counts.publishedCount}>Yayımlanmış</FilterRow>
                                    </div>
                                </FilterBlock>

                                <FilterBlock title="Görünürlük">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterRow active={visibilityFilter === 'ALL'}     onClick={() => setVisibilityFilter('ALL')}>Hamısı</FilterRow>
                                        <FilterRow active={visibilityFilter === 'PUBLIC'}  onClick={() => setVisibilityFilter('PUBLIC')}  count={counts.publicCount}>Açıq</FilterRow>
                                        <FilterRow active={visibilityFilter === 'PRIVATE'} onClick={() => setVisibilityFilter('PRIVATE')} count={counts.privateCount}>Gizli</FilterRow>
                                    </div>
                                </FilterBlock>

                                <FilterBlock title="İmtahan tipi">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterRow active={typeFilter === 'ALL'}      onClick={() => setTypeFilter('ALL')}>Hamısı</FilterRow>
                                        <FilterRow active={typeFilter === 'FREE'}     onClick={() => setTypeFilter('FREE')}>Sərbəst</FilterRow>
                                        <FilterRow active={typeFilter === 'TEMPLATE'} onClick={() => setTypeFilter('TEMPLATE')}>Şablon</FilterRow>
                                    </div>
                                </FilterBlock>
                            </>
                        ) : (
                            <>
                                <FilterBlock title="Qiymət">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterCheck radio checked={priceFilter === 'ALL'}  onChange={() => setPriceFilter('ALL')}>Hamısı</FilterCheck>
                                        <FilterCheck radio checked={priceFilter === 'FREE'} onChange={() => setPriceFilter('FREE')} count={counts.freeCount}>Pulsuz</FilterCheck>
                                        <FilterCheck radio checked={priceFilter === 'PAID'} onChange={() => setPriceFilter('PAID')} count={counts.paidCount}>Ödənişli</FilterCheck>
                                    </div>
                                </FilterBlock>

                                <FilterBlock title="Müddət">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterCheck radio checked={durationFilter === 'ALL'}    onChange={() => setDurationFilter('ALL')}>İstənilən vaxt</FilterCheck>
                                        <FilterCheck radio checked={durationFilter === 'SHORT'}  onChange={() => setDurationFilter('SHORT')}  count={counts.shortCount}>&lt;30 dəq</FilterCheck>
                                        <FilterCheck radio checked={durationFilter === 'MEDIUM'} onChange={() => setDurationFilter('MEDIUM')} count={counts.mediumCount}>30–60 dəq</FilterCheck>
                                        <FilterCheck radio checked={durationFilter === 'LONG'}   onChange={() => setDurationFilter('LONG')}   count={counts.longCount}>&gt;60 dəq</FilterCheck>
                                    </div>
                                </FilterBlock>

                                <FilterBlock title="Xüsusiyyətlər">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterCheck
                                            checked={featureFilters.includes('new')}
                                            onChange={() => setFeatureFilters(prev => prev.includes('new') ? prev.filter(x => x !== 'new') : [...prev, 'new'])}
                                            count={counts.newCount}
                                        >Yeni</FilterCheck>
                                        <FilterCheck
                                            checked={featureFilters.includes('popular')}
                                            onChange={() => setFeatureFilters(prev => prev.includes('popular') ? prev.filter(x => x !== 'popular') : [...prev, 'popular'])}
                                            count={counts.popularCount}
                                        >Populyar</FilterCheck>
                                    </div>
                                </FilterBlock>

                                <FilterBlock title="Reytinq">
                                    <div className="flex flex-col gap-0.5">
                                        <FilterCheck radio checked={ratingFilter === 0}   onChange={() => setRatingFilter(0)}>Hər hansı</FilterCheck>
                                        <FilterCheck radio checked={ratingFilter === 4.5} onChange={() => setRatingFilter(4.5)}>4.5 ★ və üzəri</FilterCheck>
                                        <FilterCheck radio checked={ratingFilter === 4}   onChange={() => setRatingFilter(4)}>4.0 ★ və üzəri</FilterCheck>
                                    </div>
                                </FilterBlock>
                            </>
                        )}

                        {/* Tags filter (shared) */}
                        {allTags.length > 0 && (
                            <FilterBlock title="Teqlər">
                                <div className="flex flex-wrap gap-1.5">
                                    {allTags.slice(0, 15).map(([tag, count]) => {
                                        const active = selectedTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTags(prev =>
                                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                                )}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-all ${
                                                    active
                                                        ? 'bg-[var(--primary)] text-white'
                                                        : 'bg-[var(--ink-100)] text-[var(--ink-600)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]'
                                                }`}
                                            >
                                                #{tag}
                                                <span className={active ? 'text-white/70' : 'text-[var(--ink-400)]'}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterBlock>
                        )}

                        {activeChips.length > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                <HiOutlineX className="w-3.5 h-3.5" /> Filtrləri təmizlə ({activeChips.length})
                            </button>
                        )}
                    </aside>

                    {/* ── Right column ── */}
                    <div className="min-w-0">
                        {/* Category tiles (subjects) */}
                        {allSubjects.length > 0 && (
                            <div className="mb-5">
                                <CategoryTiles
                                    subjects={allSubjects}
                                    activeSubject={subjectFilter}
                                    onChange={setSubjectFilter}
                                    totalCount={exams.length}
                                    examsBySubject={examsBySubject}
                                />
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-3 mb-5 flex flex-wrap items-center gap-3">
                            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-all">
                                <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                                <input
                                    type="text"
                                    placeholder="İmtahan adı, fənn, müəllim, tag..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-[14px] outline-none text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="text-[var(--ink-400)] hover:text-[var(--ink-700)]">
                                        <HiOutlineX className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[var(--ink-200)] text-[var(--ink-500)]">⌘K</kbd>
                            </div>

                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-[var(--ink-200)] rounded-xl text-[13px] font-semibold text-[var(--ink-700)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                                >
                                    <option value="NEWEST">Ən yeni</option>
                                    <option value="OLDEST">Ən köhnə</option>
                                    <option value="POPULAR">Ən populyar</option>
                                    <option value="RATING">Ən yüksək reytinq</option>
                                    <option value="TITLE">Ad (A-Z)</option>
                                    <option value="PRICE_ASC">Qiymət: aşağıdan</option>
                                    <option value="PRICE_DESC">Qiymət: yuxarıdan</option>
                                </select>
                                <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-400)] pointer-events-none" />
                            </div>

                            <div className="hidden md:flex items-center bg-[var(--ink-100)] rounded-xl p-1">
                                <button
                                    onClick={() => setView('grid')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'grid' ? 'bg-white text-[var(--ink-900)] shadow-sm' : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'}`}
                                >
                                    <HiOutlineViewGrid className="w-3.5 h-3.5" /> Şəbəkə
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'list' ? 'bg-white text-[var(--ink-900)] shadow-sm' : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'}`}
                                >
                                    <HiOutlineViewList className="w-3.5 h-3.5" /> Siyahı
                                </button>
                            </div>
                        </div>

                        {/* Results meta + active chips */}
                        <div className="flex items-center gap-3 flex-wrap mb-5">
                            <p className="text-[14px] text-[var(--ink-600)]">
                                <strong className="text-[var(--ink-900)]">{filteredExams.length}</strong> imtahan tapıldı
                            </p>
                            {activeChips.length > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-[var(--ink-300)]" />
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {activeChips.map((c, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] text-[11.5px] font-semibold border border-[var(--brand-blue-100)]"
                                            >
                                                {c.label}
                                                <button onClick={c.clear} className="p-0.5 rounded-full hover:bg-white/60">
                                                    <HiOutlineX className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-[11.5px] font-semibold text-red-600 hover:text-red-700 underline underline-offset-2"
                                        >
                                            Hamısını sil
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredExams.length === 0 ? (
                            <EmptyState activeChips={activeChips} onClear={clearAllFilters} isStudent={isStudent} />
                        ) : isStudent || (!isTeacher && !isAdmin) ? (
                            // Student view
                            <>
                                <div className={view === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                                    : 'flex flex-col gap-3'
                                }>
                                    {pagedExams.map(exam => (
                                        <StudentExamCard
                                            key={exam.id}
                                            exam={exam}
                                            view={view}
                                            isSaved={savedExamLinks.has(exam.shareLink)}
                                            savingLink={savingLink}
                                            isPurchased={exam.price != null && Number(exam.price) > 0 && purchasedExams.has(exam.shareLink)}
                                            onView={handleViewExam}
                                            onToggleDepot={handleToggleDepot}
                                        />
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                                )}
                            </>
                        ) : (
                            // Teacher view — keep existing ExamCard with all actions
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {pagedExams.map(exam => (
                                        <ExamCard
                                            key={exam.id}
                                            exam={normalizeExam(exam)}
                                            onDelete={handleDelete}
                                            onClone={handleClone}
                                            onShare={exam.status !== 'DRAFT' ? handleShare : undefined}
                                            onToggleStatus={exam.status !== 'DRAFT' ? handleToggleStatus : undefined}
                                            onDownloadPdf={exam.status !== 'DRAFT' ? handleDownloadPdf : undefined}
                                            canDownloadPdf={hasPermission('downloadAsPdf')}
                                            canEdit={hasPermission('examEditing')}
                                            onTagClick={handleTagClick}
                                        />
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            {showAiExamModal && (
                <AiExamModal
                    onClose={() => setShowAiExamModal(false)}
                    onGenerate={handleAiExamGenerate}
                />
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Pagination
// ───────────────────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onChange }) => {
    const pages = [];
    const max = Math.min(totalPages, 6);
    for (let i = 0; i < max; i++) pages.push(i);
    return (
        <div className="mt-8 flex items-center justify-center gap-1.5">
            <button
                onClick={() => onChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[var(--ink-200)] bg-white text-[var(--ink-600)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
                <HiOutlineChevronDown className="w-4 h-4 rotate-90" />
            </button>
            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`min-w-[36px] h-9 px-2 inline-flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                        p === page
                            ? 'bg-[var(--primary)] text-white border border-[var(--primary)]'
                            : 'bg-white text-[var(--ink-700)] border border-[var(--ink-200)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                    }`}
                >
                    {p + 1}
                </button>
            ))}
            {totalPages > 6 && (
                <>
                    <span className="text-[var(--ink-400)]">…</span>
                    <button
                        onClick={() => onChange(totalPages - 1)}
                        className={`min-w-[36px] h-9 px-2 inline-flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                            page === totalPages - 1
                                ? 'bg-[var(--primary)] text-white border border-[var(--primary)]'
                                : 'bg-white text-[var(--ink-700)] border border-[var(--ink-200)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                        }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}
            <button
                onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[var(--ink-200)] bg-white text-[var(--ink-600)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
                <HiOutlineChevronDown className="w-4 h-4 -rotate-90" />
            </button>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Empty state
// ───────────────────────────────────────────────────────────────────────────

const EmptyState = ({ activeChips, onClear, isStudent }) => (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[var(--ink-200)]">
        <div className="w-16 h-16 bg-[var(--primary-soft)] text-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiOutlineSearch className="w-8 h-8" />
        </div>
        <h3 className="text-[18px] font-bold text-[var(--ink-900)]">
            {activeChips.length > 0 ? 'Filtrlərə uyğun imtahan tapılmadı' : 'Hələ imtahan yoxdur'}
        </h3>
        <p className="text-[14px] text-[var(--ink-500)] mt-2 max-w-md mx-auto">
            {activeChips.length > 0
                ? 'Filtrlərinizi yumşaltın və ya başqa açar söz cəhd edin.'
                : isStudent ? 'Admin hələ heç bir imtahan yerləşdirməyib.' : 'İlk imtahanınızı yaratmaqla başlayın.'}
        </p>
        {activeChips.length > 0 && (
            <button
                onClick={onClear}
                className="mt-5 h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
            >
                <HiOutlineX className="w-4 h-4" /> Filtrləri təmizlə
            </button>
        )}
    </div>
);

export default ExamList;
