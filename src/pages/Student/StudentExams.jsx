import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
    HiOutlineSearch, HiOutlineClock, HiOutlineLibrary, HiOutlineCheck,
    HiOutlineArrowRight, HiOutlineChartBar, HiOutlineInbox,
    HiOutlineInformationCircle, HiOutlineDocumentText, HiOutlineUserGroup,
    HiOutlineRefresh, HiOutlineAcademicCap, HiOutlineExclamation,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { fmtDate } from '../../utils/date';

// ───────────────────────────────────────────────────────────────────────────
// Subject palette (deterministic per subject name)
// ───────────────────────────────────────────────────────────────────────────

const SUBJECT_PALETTES = [
    { color: '#2563EB', soft: '#EFF4FF' },
    { color: '#16A34A', soft: '#ECFDF3' },
    { color: '#0891B2', soft: '#ECFEFF' },
    { color: '#0D9488', soft: '#F0FDFA' },
    { color: '#C2410C', soft: '#FFF7ED' },
    { color: '#0EA5E9', soft: '#F0F9FF' },
    { color: '#DC2626', soft: '#FEF2F2' },
    { color: '#059669', soft: '#ECFDF5' },
    { color: '#475569', soft: '#F1F5F9' },
];
const hashIdx = (s, n) => { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) % n; };
const paletteFor = (name) => SUBJECT_PALETTES[hashIdx(name || '', SUBJECT_PALETTES.length)];
const initialOf = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

const initialsOf = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
};

const pctColor = (p) => p >= 80 ? 'var(--brand-green-600)' : p >= 50 ? '#F59E0B' : '#EF4444';

// ───────────────────────────────────────────────────────────────────────────
// Score ring (compact)
// ───────────────────────────────────────────────────────────────────────────

const ScoreRing = ({ pct, size = 56 }) => {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const color = pctColor(pct);
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-150)" strokeWidth="5" />
                <circle
                    cx={size/2} cy={size/2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c - (pct / 100) * c}
                    style={{ transition: 'stroke-dashoffset 700ms ease' }}
                />
            </svg>
            <span
                className="absolute inset-0 flex items-center justify-center font-extrabold text-[13.5px] tabular-nums"
                style={{ color }}
            >
                {pct}%
            </span>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Received card (bookmarked / purchased / ongoing)
// ───────────────────────────────────────────────────────────────────────────

const ReceivedCard = ({ exam, navigate }) => {
    const subj = exam.subject || exam.subjects?.[0] || 'İmtahan';
    const palette = paletteFor(subj);
    const isOngoing = exam.status === 'ONGOING';
    const isExpired = exam.status === 'EXPIRED';
    const isPurchased = exam.kind === 'PURCHASED';

    const handleStart = () => {
        if (exam.ongoingSessionId) navigate(`/test/take/${exam.ongoingSessionId}`);
        else if (exam.shareLink) navigate(`/imtahan/${exam.shareLink}`);
    };

    const handleInfo = () => {
        if (exam.shareLink) navigate(`/imtahanlar/melumat/${exam.shareLink}`);
    };

    return (
        <article
            className="bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex flex-col gap-3 hover:border-[var(--primary)] hover:shadow-[var(--sh-md)] transition-all"
        >
            {/* Top: subject pill + status */}
            <div className="flex items-center justify-between gap-2">
                <span
                    className="inline-flex items-center gap-2 text-[12px] font-bold"
                    style={{ color: palette.color }}
                >
                    <span
                        className="w-5 h-5 rounded text-white text-[10.5px] font-extrabold flex items-center justify-center"
                        style={{ background: palette.color }}
                    >
                        {initialOf(subj)}
                    </span>
                    {subj}
                </span>
                <StatusPill status={exam.status} kind={exam.kind} />
            </div>

            {/* Title */}
            <h3 className="text-[15.5px] font-bold text-[var(--ink-900)] leading-snug line-clamp-2">
                {exam.title}
            </h3>

            {/* Teacher row */}
            {exam.teacherName && (
                <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink-500)]">
                    <span className="w-6 h-6 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] inline-flex items-center justify-center text-[10px] font-bold shrink-0">
                        {initialsOf(exam.teacherName)}
                    </span>
                    <span className="truncate">
                        <strong className="text-[var(--ink-800)]">{exam.teacherName}</strong>
                        {exam.receivedAt && <> · {fmtDate(exam.receivedAt)}</>}
                    </span>
                </div>
            )}

            {/* Ongoing progress strip */}
            {isOngoing && exam.progressPct != null && (
                <div className="bg-[var(--primary-soft)] rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between text-[12px] font-bold text-[var(--primary)] mb-1.5">
                        <span>Davam edən imtahan</span>
                        <span>{exam.progressPct}%</span>
                    </div>
                    <div className="h-1 bg-white rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--primary)] rounded-full transition-all duration-700"
                            style={{ width: `${exam.progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Price strip (for purchased) */}
            {isPurchased && exam.amountPaid != null && (
                <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2.5 py-1 rounded-full self-start">
                    <HiOutlineCheck className="w-3.5 h-3.5" />
                    Alınıb · {Number(exam.amountPaid).toFixed(2)} ₼
                </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--ink-500)]">
                <span className="inline-flex items-center gap-1">
                    <HiOutlineLibrary className="w-3.5 h-3.5" /> <strong className="text-[var(--ink-800)]">{exam.questionCount || 0}</strong> sual
                </span>
                {exam.durationMinutes > 0 && (
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineClock className="w-3.5 h-3.5" /> <strong className="text-[var(--ink-800)]">{exam.durationMinutes}</strong> dəq
                    </span>
                )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 mt-1">
                {isExpired ? (
                    <button
                        disabled
                        className="flex-1 h-10 inline-flex items-center justify-center rounded-full text-[13px] font-bold text-[var(--ink-400)] bg-[var(--ink-100)] cursor-not-allowed"
                    >
                        Vaxt başa çatıb
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleStart}
                            className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                        >
                            {isOngoing ? <>Davam et <HiOutlineArrowRight className="w-3.5 h-3.5" /></> : <>İmtahana başla <HiOutlineArrowRight className="w-3.5 h-3.5" /></>}
                        </button>
                        <button
                            onClick={handleInfo}
                            title="Ətraflı bax"
                            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-[var(--ink-500)] bg-white border border-[var(--ink-200)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
                        >
                            <HiOutlineInformationCircle className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </article>
    );
};

const StatusPill = ({ status, kind }) => {
    const map = {
        NEW:       { label: 'Yeni',         cls: 'bg-[var(--primary-soft)] text-[var(--primary-hover)] border-[var(--brand-blue-100)]', dot: 'bg-[var(--primary)]' },
        ONGOING:   { label: 'Yarımçıq',     cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
        EXPIRED:   { label: 'Vaxt bitib',   cls: 'bg-[var(--ink-100)] text-[var(--ink-500)] border-[var(--ink-200)]', dot: 'bg-[var(--ink-400)]' },
        PURCHASED: { label: 'Alınıb',       cls: 'bg-[var(--accent-soft)] text-[var(--brand-green-600)] border-[var(--brand-green-100)]', dot: 'bg-[var(--brand-green-600)]' },
        SAVED:     { label: 'Saxlanılıb',   cls: 'bg-[var(--primary-soft)] text-[var(--primary-hover)] border-[var(--brand-blue-100)]', dot: 'bg-[var(--primary)]' },
    };
    const meta = map[status] || map.NEW;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Completed card
// ───────────────────────────────────────────────────────────────────────────

const CompletedCard = ({ result, navigate }) => {
    const subj = result.subjects?.[0] || result.examSubject || 'İmtahan';
    const palette = paletteFor(subj);
    const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
    const isPending = !result.isFullyGraded;
    const totalQ = (result.correctCount ?? 0) + (result.wrongCount ?? 0) + (result.skippedCount ?? 0) + (result.pendingManualCount ?? 0);
    const duration = (() => {
        if (!result.startedAt || !result.submittedAt) return null;
        const diffSec = Math.round((new Date(result.submittedAt) - new Date(result.startedAt)) / 1000);
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        if (m === 0) return `${s} san`;
        return s > 0 ? `${m} dəq ${s} san` : `${m} dəq`;
    })();

    return (
        <article
            className="bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex flex-col gap-3 hover:border-[var(--primary)] hover:shadow-[var(--sh-md)] transition-all"
        >
            {/* Top: subject pill + status */}
            <div className="flex items-center justify-between gap-2">
                <span
                    className="inline-flex items-center gap-2 text-[12px] font-bold"
                    style={{ color: palette.color }}
                >
                    <span
                        className="w-5 h-5 rounded text-white text-[10.5px] font-extrabold flex items-center justify-center"
                        style={{ background: palette.color }}
                    >
                        {initialOf(subj)}
                    </span>
                    {subj}
                </span>
                {isPending ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <HiOutlineClock className="w-3 h-3" />
                        Gözləyir
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)] border border-[var(--brand-green-100)]">
                        <HiOutlineCheck className="w-3 h-3" />
                        Yoxlanılıb
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-[15.5px] font-bold text-[var(--ink-900)] leading-snug line-clamp-2">
                {result.examTitle}
            </h3>

            {/* Teacher row */}
            {result.teacherName && (
                <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink-500)]">
                    <span className="w-6 h-6 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] inline-flex items-center justify-center text-[10px] font-bold shrink-0">
                        {initialsOf(result.teacherName)}
                    </span>
                    <span className="truncate">Müəllim: <strong className="text-[var(--ink-800)]">{result.teacherName}</strong></span>
                </div>
            )}

            {/* Score row */}
            <div className="flex items-center gap-3 py-2">
                <ScoreRing pct={pct} />
                <div className="min-w-0">
                    <div className="text-[14px] font-bold text-[var(--ink-900)]">
                        {result.correctCount ?? 0} / {totalQ || result.correctCount || 0} düz cavab
                    </div>
                    <div className="text-[11.5px] text-[var(--ink-500)]">
                        {fmtDate(result.submittedAt)}{duration ? ` · ${duration}` : ''}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 mt-1">
                <button
                    onClick={() => navigate(`/test/result/${result.id}`)}
                    className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-white bg-[var(--ink-900)] hover:bg-[var(--ink-800)] transition-all"
                >
                    Nəticəyə bax <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => navigate(`/test/review/${result.id}`, { state: { fromResult: true } })}
                    title="Cavabları yenidən nəzərdən keçir"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-full text-[var(--ink-500)] bg-white border border-[var(--ink-200)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
                >
                    <HiOutlineRefresh className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Subject filter chips
// ───────────────────────────────────────────────────────────────────────────

const SubjectFilter = ({ active, onChange, subjects }) => {
    const list = ['all', ...subjects];
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {list.map(s => {
                const isActive = active === s;
                return (
                    <button
                        key={s}
                        onClick={() => onChange(s)}
                        className={`h-9 px-3.5 inline-flex items-center rounded-full text-[12.5px] font-semibold border transition-all ${
                            isActive
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                                : 'bg-white text-[var(--ink-700)] border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)]'
                        }`}
                    >
                        {s === 'all' ? 'Bütün fənlər' : s}
                    </button>
                );
            })}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const StudentExams = () => {
    const navigate = useNavigate();

    const [purchasedExams, setPurchasedExams] = useState([]);
    const [savedExams, setSavedExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState('received'); // 'received' | 'completed'
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');

    useEffect(() => {
        let cancelled = false;
        // Each request swallows its own error to an empty payload so a
        // single failing endpoint doesn't blank the whole page — but we
        // still want to surface it. Track failures here and toast once
        // (chained toasts spam the corner when the API is fully down).
        const failures = [];
        Promise.all([
            api.get('/exams/my-purchased-exam-details').catch(() => { failures.push('alınmış imtahanlar'); return { data: [] }; }),
            api.get('/depot').catch(() => { failures.push('saxlanılmışlar'); return { data: [] }; }),
            api.get('/submissions/my-results').catch(() => { failures.push('nəticələr'); return { data: [] }; }),
        ]).then(([purchasedRes, depotRes, resultsRes]) => {
            if (cancelled) return;
            setPurchasedExams(purchasedRes.data || []);
            setSavedExams(depotRes.data || []);
            setResults(resultsRes.data || []);
            if (failures.length) {
                toast.error(`Yüklənmədi: ${failures.join(', ')}`);
            }
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Build "received" items list — purchased + depot, with status
    const receivedItems = useMemo(() => {
        const completedShareLinks = new Set(
            results.filter(r => r.submittedAt).map(r => r.shareLink)
        );
        const ongoingByShareLink = {};
        results.forEach(r => {
            if (!r.submittedAt && r.shareLink) ongoingByShareLink[r.shareLink] = r;
        });

        const items = [];
        // Purchased
        purchasedExams.forEach(e => {
            if (completedShareLinks.has(e.shareLink)) return; // already done
            const ongoing = ongoingByShareLink[e.shareLink];
            items.push({
                id: `p-${e.orderId || e.shareLink}`,
                kind: 'PURCHASED',
                shareLink: e.shareLink,
                title: e.title,
                subject: (e.subjects || [])[0] || null,
                subjects: e.subjects || [],
                teacherName: e.teacherName,
                receivedAt: e.purchasedAt,
                durationMinutes: e.durationMinutes,
                questionCount: e.questionCount || 0,
                amountPaid: e.amountPaid,
                status: ongoing ? 'ONGOING' : 'PURCHASED',
                ongoingSessionId: ongoing?.id,
                progressPct: ongoing ? Math.round(((ongoing.answeredCount || 0) / (ongoing.totalQuestions || 1)) * 100) : null,
            });
        });
        // Depot (saved)
        savedExams.forEach(e => {
            if (completedShareLinks.has(e.shareLink)) return;
            // Skip if already in purchased
            if (purchasedExams.some(p => p.shareLink === e.shareLink)) return;
            const ongoing = ongoingByShareLink[e.shareLink];
            items.push({
                id: `s-${e.shareLink}`,
                kind: 'SAVED',
                shareLink: e.shareLink,
                title: e.title,
                subject: (e.subjects || [])[0] || null,
                subjects: e.subjects || [],
                teacherName: e.teacherName,
                receivedAt: e.savedAt || e.createdAt,
                durationMinutes: e.durationMinutes,
                questionCount: e.questionCount || 0,
                status: ongoing ? 'ONGOING' : 'NEW',
                ongoingSessionId: ongoing?.id,
                progressPct: ongoing ? Math.round(((ongoing.answeredCount || 0) / (ongoing.totalQuestions || 1)) * 100) : null,
            });
        });
        return items;
    }, [purchasedExams, savedExams, results]);

    // Completed = submitted results
    const completedItems = useMemo(() => results.filter(r => r.submittedAt), [results]);

    // Filter logic
    const filteredReceived = useMemo(() => {
        let out = receivedItems;
        if (subjectFilter !== 'all') {
            out = out.filter(e => (e.subjects || []).includes(subjectFilter));
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(e =>
                (e.title || '').toLowerCase().includes(q) ||
                (e.teacherName || '').toLowerCase().includes(q) ||
                (e.subjects || []).some(s => s.toLowerCase().includes(q))
            );
        }
        return out;
    }, [receivedItems, subjectFilter, search]);

    const filteredCompleted = useMemo(() => {
        let out = completedItems;
        if (subjectFilter !== 'all') {
            out = out.filter(r => (r.subjects || []).includes(subjectFilter));
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(r =>
                (r.examTitle || '').toLowerCase().includes(q) ||
                (r.teacherName || '').toLowerCase().includes(q) ||
                (r.subjects || []).some(s => s.toLowerCase().includes(q))
            );
        }
        return out;
    }, [completedItems, subjectFilter, search]);

    // Aggregate stats
    const newCount = receivedItems.filter(r => r.status === 'NEW' || r.status === 'PURCHASED').length;
    const ongoingCount = receivedItems.filter(r => r.status === 'ONGOING').length;
    const completedCount = completedItems.length;
    // Compute on the *scoreable* subset only — ungraded submissions and
    // exams with maxScore == 0 would otherwise inflate the denominator or
    // produce a NaN (divide by zero / null totalScore). When nothing
    // qualifies, fall back to 0 rather than rendering "NaN%" on the page.
    const avgScore = (() => {
        const scoreable = completedItems.filter(r => r.maxScore > 0 && r.totalScore != null);
        if (scoreable.length === 0) return 0;
        const total = scoreable.reduce((s, r) => s + (r.totalScore / r.maxScore) * 100, 0);
        return Math.round(total / scoreable.length);
    })();

    // Subjects for filter
    const subjectsInTab = useMemo(() => {
        const set = new Set();
        const items = tab === 'received' ? receivedItems : completedItems;
        items.forEach(it => {
            const subs = it.subjects || (it.subject ? [it.subject] : []);
            subs.forEach(s => set.add(s));
        });
        return [...set].sort((a, b) => a.localeCompare(b, 'az'));
    }, [tab, receivedItems, completedItems]);

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>İmtahanlarım — testup.az</title>
            </Helmet>

            {/* ── Hero ── */}
            <section
                className="relative pt-12 md:pt-14 pb-10 overflow-hidden border-b border-[var(--ink-150)]"
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
                        <span className="text-[var(--ink-800)] font-semibold">İmtahanlarım</span>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.025em] text-[var(--ink-900)]">
                                İmtahanlarım
                            </h1>
                            <p className="text-[14.5px] text-[var(--ink-500)] mt-1">
                                Aldığınız və işlədiyiniz bütün imtahanlar bir yerdə
                            </p>
                        </div>

                        {/* Summary chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            <SummaryChip
                                Icon={HiOutlineInbox}
                                label="yeni gözləyir"
                                value={newCount}
                                tone="blue"
                            />
                            {ongoingCount > 0 && (
                                <SummaryChip
                                    Icon={HiOutlineExclamation}
                                    label="yarımçıq"
                                    value={ongoingCount}
                                    tone="amber"
                                />
                            )}
                            <SummaryChip
                                Icon={HiOutlineCheck}
                                label="tamamlanıb"
                                value={completedCount}
                                tone="green"
                            />
                            <SummaryChip
                                Icon={HiOutlineChartBar}
                                label="orta"
                                value={`${avgScore}%`}
                                tone="amber"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-main py-7">
                {/* ── Toolbar: tabs + search + subject filter ── */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-[var(--ink-100)] rounded-full p-1">
                        <TabBtn
                            active={tab === 'received'}
                            onClick={() => { setTab('received'); setSubjectFilter('all'); }}
                            Icon={HiOutlineInbox}
                            count={receivedItems.length}
                            highlight={newCount > 0}
                        >
                            Aldığım
                        </TabBtn>
                        <TabBtn
                            active={tab === 'completed'}
                            onClick={() => { setTab('completed'); setSubjectFilter('all'); }}
                            Icon={HiOutlineCheck}
                            count={completedItems.length}
                        >
                            İşlədiyim
                        </TabBtn>
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[220px] max-w-md flex items-center gap-2 px-3 py-2 bg-white border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] transition-all">
                        <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                        <input
                            type="text"
                            placeholder="Ad, fənn, müəllim ilə axtar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-[13.5px] text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                        />
                    </div>

                    {/* Subjects */}
                    {subjectsInTab.length > 0 && (
                        <SubjectFilter
                            active={subjectFilter}
                            onChange={setSubjectFilter}
                            subjects={subjectsInTab}
                        />
                    )}
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tab === 'received' ? (
                    filteredReceived.length === 0 ? (
                        <EmptyState
                            Icon={HiOutlineInbox}
                            title={receivedItems.length === 0 ? 'Hələ heç bir imtahan yoxdur' : 'Axtarışa uyğun imtahan tapılmadı'}
                            subtitle={
                                receivedItems.length === 0
                                    ? 'İmtahanlar səhifəsindən imtahanlara qoşula və ya satın ala bilərsiniz.'
                                    : 'Filtrləri yumşaldın və ya başqa açar söz cəhd edin.'
                            }
                            cta={receivedItems.length === 0 ? { label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') } : null}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredReceived.map(e => <ReceivedCard key={e.id} exam={e} navigate={navigate} />)}
                        </div>
                    )
                ) : (
                    filteredCompleted.length === 0 ? (
                        <EmptyState
                            Icon={HiOutlineCheck}
                            title={completedItems.length === 0 ? 'Hələ heç bir nəticə yoxdur' : 'Axtarışa uyğun nəticə tapılmadı'}
                            subtitle={
                                completedItems.length === 0
                                    ? 'İmtahanları tamamladıqdan sonra nəticələriniz burada görünəcək.'
                                    : 'Filtrləri yumşaldın və ya başqa açar söz cəhd edin.'
                            }
                            cta={completedItems.length === 0 ? { label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') } : null}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredCompleted.map(r => <CompletedCard key={r.id} result={r} navigate={navigate} />)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Small helpers
// ───────────────────────────────────────────────────────────────────────────

const SummaryChip = ({ Icon, label, value, tone }) => {
    const tones = {
        blue:  { bg: 'bg-[var(--primary-soft)]', text: 'text-[var(--primary-hover)]', border: 'border-[var(--brand-blue-100)]' },
        green: { bg: 'bg-[var(--accent-soft)]',  text: 'text-[var(--brand-green-600)]', border: 'border-[var(--brand-green-100)]' },
        amber: { bg: 'bg-amber-50',              text: 'text-amber-700',                border: 'border-amber-200' },
    };
    const t = tones[tone] || tones.blue;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border ${t.bg} ${t.text} ${t.border}`}>
            <Icon className="w-3.5 h-3.5" />
            <strong className="font-extrabold">{value}</strong>
            <span className="opacity-80">{label}</span>
        </span>
    );
};

const TabBtn = ({ active, onClick, Icon, count, highlight, children }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all ${
            active
                ? 'bg-white text-[var(--ink-900)] shadow-[var(--sh-sm)]'
                : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
        }`}
    >
        <Icon className="w-3.5 h-3.5" />
        {children}
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            active
                ? (highlight ? 'bg-[var(--primary)] text-white' : 'bg-[var(--ink-100)] text-[var(--ink-700)]')
                : (highlight ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--ink-500)]')
        }`}>
            {count}
        </span>
    </button>
);

const EmptyState = ({ Icon, title, subtitle, cta }) => (
    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[var(--ink-200)]">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--ink-100)] text-[var(--ink-400)] flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-[17px] font-bold text-[var(--ink-900)]">{title}</h3>
        <p className="text-[13.5px] text-[var(--ink-500)] mt-1.5 max-w-md mx-auto">{subtitle}</p>
        {cta && (
            <button
                onClick={cta.onClick}
                className="mt-5 h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                {cta.label} <HiOutlineArrowRight className="w-4 h-4" />
            </button>
        )}
    </div>
);

export default StudentExams;
