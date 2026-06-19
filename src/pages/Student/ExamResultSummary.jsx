import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    HiOutlineEye, HiOutlineClock, HiOutlineVideoCamera, HiOutlineAcademicCap,
    HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineShare,
    HiOutlineArrowRight, HiOutlineSparkles, HiOutlineChartBar, HiOutlineLibrary,
    HiOutlineMinus,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';
import { fmtDate } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const fmtSeconds = (s) => {
    if (!s || s <= 0) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec} san`;
    if (sec === 0) return `${m} dəq`;
    return `${m} dəq ${sec} san`;
};

const ringColorFor = (pct) => {
    if (pct >= 90) return '#22C55E';
    if (pct >= 75) return 'var(--primary)';
    if (pct >= 60) return '#F59E0B';
    return '#EF4444';
};

const headlineFor = (pct) => {
    if (pct == null) return 'Nəticə hələ hazırlanır';
    if (pct >= 90) return 'Möhtəşəm nəticə! Bilik səviyyəniz təsdiqləndi.';
    if (pct >= 75) return 'Yaxşı iş çıxartdınız! İrəliyə doğru.';
    if (pct >= 60) return 'Keçid balını topladınız — daha da yaxşılaşmaq mümkündür.';
    return 'Bir az daha hazırlıq lazımdır. Səhv cavabları nəzərdən keçirin.';
};

// ───────────────────────────────────────────────────────────────────────────
// Score ring with grade badge
// ───────────────────────────────────────────────────────────────────────────

// Compact bal formatter — drop trailing .0 so "12 bal" beats "12.0 bal", but
// keep one decimal when partial credit produced a fractional total.
const fmtBal = (n) => {
    if (n == null || isNaN(n)) return '—';
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const ScoreRing = ({ pct, passed, score, maxScore }) => {
    const r = 96;
    const c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    const color = ringColorFor(pct);
    const hasPoints = score != null && maxScore != null && maxScore > 0;
    return (
        <div className="relative w-[220px] h-[220px] shrink-0">
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r={r} fill="none" stroke="var(--ink-150)" strokeWidth="14" />
                <circle
                    cx="110" cy="110" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {hasPoints ? (
                    <>
                        <div className="flex items-baseline gap-1" style={{ color }}>
                            <span className="text-[44px] font-extrabold leading-none">{fmtBal(score)}</span>
                            <span className="text-[18px] font-bold opacity-70">/ {fmtBal(maxScore)}</span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-500)] mt-1.5 font-bold uppercase tracking-[0.12em]">Topladığınız bal</div>
                    </>
                ) : (
                    <>
                        <div className="text-[44px] font-extrabold leading-none" style={{ color }}>{pct.toFixed(0)}%</div>
                        <div className="text-[11px] text-[var(--ink-500)] mt-1.5 font-bold uppercase tracking-[0.12em]">Ümumi nəticə</div>
                    </>
                )}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Stat cards (4-up)
// ───────────────────────────────────────────────────────────────────────────

const StatCard = ({ Icon, label, value, sub, tone }) => {
    const tones = {
        blue:  'bg-[var(--primary-soft)] text-[var(--primary)]',
        green: 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]',
        red:   'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        slate: 'bg-[var(--ink-100)] text-[var(--ink-700)]',
    };
    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone] || tones.blue}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {sub && (
                    <span className="text-[11px] font-bold text-[var(--ink-500)] bg-[var(--ink-100)] px-2 py-0.5 rounded-full">
                        {sub}
                    </span>
                )}
            </div>
            <div className="text-[26px] font-extrabold text-[var(--ink-900)] leading-none">{value}</div>
            <div className="text-[12.5px] text-[var(--ink-500)] mt-1.5">{label}</div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Section breakdown (subject-level)
// ───────────────────────────────────────────────────────────────────────────

const SectionBreakdown = ({ subjectStats }) => {
    if (!subjectStats?.length) return null;
    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <h3 className="text-[17px] font-bold text-[var(--ink-900)] flex items-center gap-2 mb-1">
                <HiOutlineChartBar className="w-5 h-5 text-[var(--primary)]" />
                Fənn üzrə bölgü
            </h3>
            <p className="text-[13px] text-[var(--ink-500)] mb-5">Hansı fənlərdə güclüsünüz, hansılarda işləmək lazımdır</p>
            <div className="flex flex-col gap-4">
                {subjectStats.map((s, i) => {
                    const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
                    const cls = pct >= 80
                        ? 'bg-[var(--brand-green-600)]'
                        : pct >= 50
                            ? 'bg-amber-400'
                            : 'bg-red-400';
                    return (
                        <div key={s.subjectName || i}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="text-[14px] font-semibold text-[var(--ink-800)]">{s.subjectName || 'Digər'}</div>
                                <div className="text-[12.5px] text-[var(--ink-500)]">
                                    <strong className="text-[var(--ink-900)]">{s.correctCount ?? 0}</strong> / {s.questionCount ?? 0} sual ·{' '}
                                    <strong className="text-[var(--ink-900)]">{fmtBal(s.totalScore ?? 0)}</strong>
                                    {s.maxScore > 0 && <> / {fmtBal(s.maxScore)} bal</>}
                                </div>
                            </div>
                            <div className="h-2 w-full bg-[var(--ink-150)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${cls} rounded-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Star rating
// ───────────────────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange, disabled }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !disabled && onChange(star)}
                    onMouseEnter={() => !disabled && setHovered(star)}
                    onMouseLeave={() => !disabled && setHovered(0)}
                    disabled={disabled}
                    className={`text-2xl transition-transform focus:outline-none ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110'}`}
                >
                    <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-[var(--ink-200)]'}>★</span>
                </button>
            ))}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Question review (filter tabs + expandable list)
// ───────────────────────────────────────────────────────────────────────────

const statusOf = (q) => {
    const hasAnswer = (
        q.studentSelectedOptionId != null ||
        (q.studentSelectedOptionIds && q.studentSelectedOptionIds.length > 0) ||
        q.studentAnswerText?.trim() ||
        q.studentAnswerImage ||
        q.studentMatchingAnswerJson
    );
    if (!q.isGraded) return 'pending';
    if (!hasAnswer) return 'skipped';
    if (q.awardedScore >= q.points) return 'correct';
    if (q.awardedScore > 0) return 'partial';
    return 'wrong';
};

const QuestionReview = ({ questions, sessionId, navigate }) => {
    const [filter, setFilter] = useState('all');

    const items = useMemo(() => (questions || []).map((q, i) => ({ ...q, _status: statusOf(q), _num: i + 1 })), [questions]);
    const counts = useMemo(() => ({
        all:     items.length,
        correct: items.filter(q => q._status === 'correct').length,
        wrong:   items.filter(q => q._status === 'wrong').length,
        partial: items.filter(q => q._status === 'partial').length,
        skipped: items.filter(q => q._status === 'skipped').length,
    }), [items]);

    const filtered = useMemo(() => {
        if (filter === 'all')     return items;
        if (filter === 'wrong')   return items.filter(q => q._status === 'wrong' || q._status === 'partial');
        return items.filter(q => q._status === filter);
    }, [items, filter]);

    if (!items.length) return null;

    const pendingCount = items.filter(q => q._status === 'pending').length;
    const tabs = [
        { k: 'all',     label: 'Hamısı',     count: counts.all },
        { k: 'correct', label: 'Düz',        count: counts.correct },
        { k: 'wrong',   label: 'Səhv',       count: counts.wrong + counts.partial },
        { k: 'skipped', label: 'Boş',        count: counts.skipped },
        ...(pendingCount > 0 ? [{ k: 'pending', label: 'Yoxlanılır', count: pendingCount }] : []),
    ];

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
                <HiOutlineLibrary className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-[17px] font-bold text-[var(--ink-900)]">Sual-sual nəzərdən keçir</h3>
            </div>
            <p className="text-[13px] text-[var(--ink-500)] mb-4">Hər sualı, sizin cavabı və düzgün cavabı görün.</p>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-[var(--ink-150)]">
                {tabs.map(t => {
                    const active = filter === t.k;
                    return (
                        <button
                            key={t.k}
                            onClick={() => setFilter(t.k)}
                            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all ${
                                active
                                    ? 'bg-[var(--primary)] text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.6)]'
                                    : 'bg-[var(--ink-100)] text-[var(--ink-600)] hover:bg-[var(--ink-150)]'
                            }`}
                        >
                            {t.label}
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white text-[var(--ink-500)]'}`}>
                                {t.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Questions list */}
            <div className="flex flex-col gap-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-[var(--ink-400)] text-[14px]">
                        Bu kateqoriyada sual yoxdur.
                    </div>
                ) : filtered.slice(0, 10).map((q) => (
                    <ReviewItem key={q.id} q={q} index={q._num} />
                ))}
            </div>

            {filtered.length > 10 && (
                <div className="text-center mt-5">
                    <button
                        onClick={() => navigate(`/test/review/${sessionId}`, { state: { fromResult: true } })}
                        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[13px] font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
                    >
                        Qalan {filtered.length - 10} sualı tam baxışda gör <HiOutlineArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

const ReviewItem = ({ q, index }) => {
    const status = q._status;
    const statusMeta = {
        correct: { Icon: HiOutlineCheckCircle, label: 'Düzgün',   cls: 'text-[var(--brand-green-600)] bg-[var(--accent-soft)] border-[var(--brand-green-100)]' },
        wrong:   { Icon: HiOutlineXCircle,     label: 'Səhv',     cls: 'text-red-700 bg-red-50 border-red-200' },
        partial: { Icon: HiOutlineXCircle,     label: 'Qismən',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
        skipped: { Icon: HiOutlineMinus,       label: 'Boş',      cls: 'text-[var(--ink-500)] bg-[var(--ink-100)] border-[var(--ink-200)]' },
        pending: { Icon: HiOutlineClock,       label: 'Yoxlanılır', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
    }[status] || { Icon: HiOutlineMinus, label: '—', cls: 'text-[var(--ink-500)] bg-[var(--ink-100)]' };

    const isChoice = q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MULTI_SELECT';

    return (
        <div className="border border-[var(--ink-200)] rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] bg-[var(--ink-100)] px-2.5 py-1 rounded-full">
                    SUAL {index}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.cls}`}>
                    <statusMeta.Icon className="w-3.5 h-3.5" /> {statusMeta.label}
                </span>
            </div>
            <div className="text-[15px] font-semibold text-[var(--ink-900)] leading-relaxed mb-3">
                <LatexPreview content={q.content} placeholder={null} />
            </div>

            {q.attachedImage && (
                <div className="mb-3">
                    <img
                        src={q.attachedImage}
                        alt="Sual şəkli"
                        className="max-h-72 rounded-xl border border-[var(--ink-200)] object-contain bg-white"
                    />
                </div>
            )}

            {isChoice && q.options && (
                <div className="flex flex-col gap-2">
                    {q.options.map((opt) => {
                        const isUserSel = q.questionType === 'MULTI_SELECT'
                            ? (q.studentSelectedOptionIds || []).includes(opt.id)
                            : q.studentSelectedOptionId === opt.id;
                        const isCorrect = opt.isCorrect;

                        let cls = 'border-[var(--ink-200)] bg-white text-[var(--ink-700)]';
                        if (isCorrect) cls = 'border-[var(--brand-green-600)] bg-[var(--accent-soft)] text-[var(--ink-900)]';
                        else if (isUserSel && !isCorrect) cls = 'border-red-400 bg-red-50 text-[var(--ink-900)]';

                        return (
                            <div key={opt.id} className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border ${cls}`}>
                                <span className="w-6 h-6 inline-flex items-center justify-center rounded-md text-[11.5px] font-bold bg-white border border-[var(--ink-200)] text-[var(--ink-600)] shrink-0 mt-0.5">
                                    {String.fromCharCode(65 + (opt.orderIndex ?? 0))}
                                </span>
                                <div className="flex-1 min-w-0 text-[13.5px] font-medium">
                                    {opt.content?.trim() && <LatexPreview content={opt.content} placeholder={null} />}
                                    {opt.attachedImage && (
                                        <img
                                            src={opt.attachedImage}
                                            alt="Variant şəkli"
                                            className="mt-1.5 max-h-40 rounded-lg border border-[var(--ink-200)] object-contain bg-white"
                                        />
                                    )}
                                </div>
                                {isCorrect && (
                                    <span className="text-[11px] font-bold text-[var(--brand-green-600)] shrink-0 mt-1">✓ Düzgün</span>
                                )}
                                {isUserSel && !isCorrect && (
                                    <span className="text-[11px] font-bold text-red-600 shrink-0 mt-1">Sizin cavabınız</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!isChoice && (
                <div className="flex flex-col gap-2.5 mt-1">
                    {/* Student's typed answer (if any). For OPEN_MANUAL / OPEN_AUTO
                        this is what they actually wrote — needs to be visible
                        on the result page, not just the correct answer. */}
                    {(q.studentAnswerText?.trim() || q.studentAnswerImage) && (
                        <div className="bg-white border border-[var(--ink-200)] rounded-xl p-3.5">
                            <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-[0.1em] mb-1.5">Sizin cavab</p>
                            {q.studentAnswerText?.trim() && (
                                <div className="text-[14px] font-medium text-[var(--ink-900)] whitespace-pre-wrap">
                                    <LatexPreview content={q.studentAnswerText} placeholder={null} />
                                </div>
                            )}
                            {q.studentAnswerImage && (
                                <img
                                    src={q.studentAnswerImage}
                                    alt="Cavab şəkli"
                                    className="mt-2 max-h-60 rounded-lg border border-[var(--ink-200)] object-contain bg-white"
                                />
                            )}
                        </div>
                    )}

                    {q.correctAnswer && (
                        <div className="bg-[var(--accent-soft)] border border-[var(--brand-green-100)] rounded-xl p-3.5">
                            <p className="text-[11px] font-bold text-[var(--brand-green-600)] uppercase tracking-[0.1em] mb-1.5">
                                {q.questionType === 'OPEN_MANUAL' ? 'İstinad cavab' : 'Düzgün cavab'}
                            </p>
                            <div className="text-[14px] font-medium text-[var(--ink-900)]">
                                <LatexPreview content={q.correctAnswer} placeholder={null} />
                            </div>
                        </div>
                    )}

                    {/* OPEN_MANUAL feedback shown to the student once a teacher
                        scored / commented on it. */}
                    {q.questionType === 'OPEN_MANUAL' && q.isGraded && q.feedback?.trim() && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-[0.1em] mb-1.5">Müəllim qeydi</p>
                            <p className="text-[13.5px] text-[var(--ink-800)] whitespace-pre-wrap">{q.feedback}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const ExamResultSummary = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    const submission = location.state?.submission || null;

    const [rating, setRating] = useState(() => submission?.rating || 0);
    const [rated, setRated] = useState(() => submission?.rating != null);
    const [isRating, setIsRating] = useState(false);
    const [submissionData, setSubmissionData] = useState(submission || null);
    const [loading, setLoading] = useState(!submission);
    const [reviewQuestions, setReviewQuestions] = useState(null);

    useEffect(() => {
        if (!sessionId) return;

        // `cancelled` covers two races:
        //   1. The setInterval is created INSIDE a .then() that resolves
        //      asynchronously. If the effect cleanup runs before the
        //      promise resolves, the local `interval` is still null and
        //      `clearInterval(null)` is a no-op — then the interval gets
        //      installed and never gets torn down.
        //   2. fetchData callbacks (await api.get) outliving the unmount
        //      and pushing stale state into the new mount.
        let cancelled = false;
        let interval = null;

        const fetchData = (isInitial = false) => {
            if (isInitial) setLoading(true);
            return api.get(`/submissions/${sessionId}`)
                .then(res => {
                    if (cancelled) return null;
                    setSubmissionData(res.data);
                    setRating(r => r || res.data.rating || 0);
                    setRated(res.data.rating != null);
                    return res.data;
                })
                .catch(() => {
                    if (!cancelled && isInitial) {
                        toast.error('Nəticə yüklənə bilmədi');
                    }
                    return null;
                })
                .finally(() => { if (!cancelled && isInitial) setLoading(false); });
        };

        const initialPromise = submission ? Promise.resolve(submission) : fetchData(true);

        initialPromise.then(data => {
            if (cancelled) return;
            if (!data?.isFullyGraded) {
                interval = setInterval(() => {
                    fetchData(false).then(updated => {
                        if (updated?.isFullyGraded && interval) clearInterval(interval);
                    });
                }, 20000);
            }
        });

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        api.get(`/submissions/${sessionId}/review`)
            .then(res => {
                if (cancelled) return;
                const sorted = [...res.data.questions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                setReviewQuestions(sorted);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [sessionId]);

    const displaySubmission = submissionData || submission;

    const handleRate = async (starValue) => {
        setRating(starValue);
        setIsRating(true);
        try {
            await api.post(`/submissions/${sessionId}/rate`, null, { params: { rating: starValue } });
            setRated(true);
            toast.success('Reytinqiniz qeydə alındı!');
        } catch {
            toast.error('Reytinq qeydə alınmadı');
        } finally {
            setIsRating(false);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(url)
                .then(() => toast.success('Nəticə linki kopyalandı'))
                .catch(() => toast.error('Link kopyalanmadı'));
            return;
        }
        // Fallback for very old browsers without async clipboard API.
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); toast.success('Nəticə linki kopyalandı'); }
        catch { toast.error('Link kopyalanmadı'); }
        document.body.removeChild(el);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Template exams use a formula score (e.g. DİM-style: correct - wrong/3
    // mapped through section weights). For those, prefer the formula result.
    // Free exams: fall back to the points-based ratio (totalScore / maxScore)
    // where each question contributes its own point value.
    const isTemplateExam = displaySubmission?.examType === 'TEMPLATE'
        || displaySubmission?.templateScorePercent != null
        || displaySubmission?.templateTotalMaxScore != null;
    const pointsPercent = displaySubmission?.maxScore > 0
        ? Math.round((displaySubmission.totalScore / displaySubmission.maxScore) * 100)
        : null;
    const formulaPercent = displaySubmission?.templateTotalMaxScore > 0
        ? Math.round((displaySubmission.templateTotalScore / displaySubmission.templateTotalMaxScore) * 100)
        : (displaySubmission?.templateScorePercent != null
            ? Math.round(displaySubmission.templateScorePercent)
            : null);
    const scorePercent = isTemplateExam && formulaPercent != null
        ? formulaPercent
        : pointsPercent;

    const timeTaken = (() => {
        if (!displaySubmission?.startedAt || !displaySubmission?.submittedAt) return null;
        const diffSec = Math.round(
            (new Date(displaySubmission.submittedAt) - new Date(displaySubmission.startedAt)) / 1000
        );
        return fmtSeconds(diffSec);
    })();

    const passed = scorePercent != null && scorePercent >= 75;
    const headline = headlineFor(scorePercent);
    const correct = displaySubmission?.correctCount || 0;
    const wrong = displaySubmission?.wrongCount || 0;
    const skipped = displaySubmission?.skippedCount || 0;
    const pending = displaySubmission?.pendingManualCount || 0;
    const totalQuestions = correct + wrong + skipped + pending;

    // "Owner" — the student who actually took this exam. Used to gate
    // personal actions (review my answers, profile shortcuts, rate). Guest
    // submissions have no studentId; the local justSubmitted-via-state hint
    // covers the case where the just-finished guest opens this page directly.
    // NOTE: user.id is a JWT-string, displaySubmission.studentId is a number,
    // so always compare via Number() coercion.
    const justSubmittedLocally = !!submission;
    const isOwner = justSubmittedLocally || (
        isAuthenticated && user?.id != null &&
        displaySubmission?.studentId != null &&
        Number(user.id) === Number(displaySubmission.studentId)
    );

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <div className="container-main max-w-6xl py-8 md:py-10 space-y-6">
                {/* ── Hero ── */}
                <section
                    className="relative overflow-hidden bg-white border border-[var(--ink-200)] rounded-3xl px-6 py-8 md:px-10 md:py-10"
                    style={{
                        backgroundImage: passed
                            ? 'radial-gradient(circle at 0% 100%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(circle at 100% 0%, rgba(37,99,235,0.08), transparent 60%)'
                            : 'radial-gradient(circle at 0% 100%, rgba(239,68,68,0.08), transparent 60%), radial-gradient(circle at 100% 0%, rgba(245,158,11,0.08), transparent 60%)',
                    }}
                >
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        {scorePercent != null ? (() => {
                            // For multi-section template/olimpiyada exams the backend's
                            // templateTotalScore / templateTotalMaxScore only reflects the
                            // FIRST section's DİM-style normalized score — not the sum.
                            // Sum subjectStats when there are >1 sections so the hero ring
                            // shows the total balance across every subject the student took.
                            const stats = displaySubmission?.subjectStats;
                            const multiSection = Array.isArray(stats) && stats.length > 1;
                            const ringScore = multiSection
                                ? stats.reduce((s, x) => s + (x.totalScore || 0), 0)
                                : (isTemplateExam && displaySubmission?.templateTotalMaxScore > 0
                                    ? displaySubmission.templateTotalScore
                                    : displaySubmission?.totalScore);
                            const ringMaxScore = multiSection
                                ? stats.reduce((s, x) => s + (x.maxScore || 0), 0)
                                : (isTemplateExam && displaySubmission?.templateTotalMaxScore > 0
                                    ? displaySubmission.templateTotalMaxScore
                                    : displaySubmission?.maxScore);
                            return (
                                <ScoreRing
                                    pct={scorePercent}
                                    passed={passed}
                                    score={ringScore}
                                    maxScore={ringMaxScore}
                                />
                            );
                        })() : (
                            <div className="w-[220px] h-[220px] rounded-full bg-[var(--ink-50)] border-4 border-[var(--ink-150)] flex items-center justify-center shrink-0">
                                <HiOutlineClock className="w-14 h-14 text-[var(--ink-400)]" />
                            </div>
                        )}

                        <div className="flex-1 text-center lg:text-left min-w-0">
                            <h1 className="text-[26px] md:text-[34px] font-extrabold tracking-tight leading-[1.1] text-[var(--ink-900)] text-balance">
                                {headline}
                            </h1>
                            <p className="text-[15px] text-[var(--ink-500)] mt-3 leading-relaxed max-w-[600px] mx-auto lg:mx-0">
                                <strong className="text-[var(--ink-800)]">{displaySubmission?.examTitle || 'İmtahan'}</strong>
                                {displaySubmission?.examSubject && <> · {displaySubmission.examSubject}</>}
                                {displaySubmission?.submittedAt && <> · {fmtDate(displaySubmission.submittedAt)}</>}
                                {' tarixində tamamlandı. '}
                                {passed
                                    ? 'Aşağıda hər sual üzrə ətraflı analizi görə bilərsiniz.'
                                    : 'Səhv cavablarınızı təkrar nəzərdən keçirin və yenidən cəhd edin.'}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2.5 justify-center lg:justify-start">
                                {/* "Cavablarıma bax" was gated on `isOwner`, which fails when
                                   the student refreshes or opens the link directly — the
                                   navigation-state `submission` is gone and the JWT-vs-row
                                   id comparison silently drops the button. The review
                                   endpoint already enforces ownership server-side, so
                                   gate the CTA on data-loaded instead. */}
                                {displaySubmission && (
                                    <button
                                        onClick={() => navigate(`/test/review/${sessionId}`, { state: { fromResult: true } })}
                                        className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                    >
                                        <HiOutlineEye className="w-4 h-4" /> Cavablarıma bax
                                    </button>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={handleShare}
                                        className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                                        title="Nəticənin linkini kopyala"
                                    >
                                        <HiOutlineShare className="w-4 h-4" /> Nəticəmi paylaş
                                    </button>
                                )}
                                {displaySubmission?.explanationVideoUrl && (
                                    <a
                                        href={displaySubmission.explanationVideoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all"
                                    >
                                        <HiOutlineVideoCamera className="w-4 h-4" /> İzah videosu
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4-Stat strip ──
                   Leftmost: count of questions the student actually answered
                   (correct + wrong + still-being-graded). Skipped questions are
                   excluded — they're already in their own banner below. The
                   detailed bal calculation is in the hero ring + Düzgün/Səhv
                   cards. */}
                {scorePercent != null && (() => {
                    const answered = correct + wrong + pending;
                    return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            Icon={HiOutlineAcademicCap}
                            label="Cavablanan sual"
                            value={
                                <>
                                    {answered}
                                    <span className="text-[14px] text-[var(--ink-400)] font-bold ml-1">/ {totalQuestions}</span>
                                </>
                            }
                            sub={pending > 0 ? `${pending} yoxlanılır` : null}
                            tone="blue"
                        />
                        <StatCard
                            Icon={HiOutlineCheckCircle}
                            label="Düzgün cavab"
                            value={correct}
                            sub={totalQuestions ? `${Math.round((correct / totalQuestions) * 100)}%` : null}
                            tone="green"
                        />
                        <StatCard
                            Icon={HiOutlineXCircle}
                            label="Səhv cavab"
                            value={wrong}
                            sub={totalQuestions && wrong > 0 ? `${Math.round((wrong / totalQuestions) * 100)}%` : null}
                            tone="red"
                        />
                        <StatCard
                            Icon={HiOutlineClock}
                            label="Sərf olunan vaxt"
                            value={timeTaken || '—'}
                            sub={displaySubmission?.durationMinutes ? `Limit: ${displaySubmission.durationMinutes} dəq` : null}
                            tone="amber"
                        />
                    </div>
                    );
                })()}

                {/* ── Skipped / Pending banner ── */}
                {(skipped > 0 || pending > 0) && (
                    <div className="flex flex-wrap gap-3">
                        {pending > 0 && (
                            <div className="flex-1 min-w-[240px] bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <HiOutlineClock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-800 text-[14px]">{pending} sual yoxlanılır</p>
                                    <p className="text-[12.5px] text-amber-700">
                                        {isOwner
                                            ? 'Müəllim yoxladıqdan sonra balınız yenilənəcək'
                                            : 'Müəllim yoxladıqdan sonra bal yenilənəcək'}
                                    </p>
                                </div>
                            </div>
                        )}
                        {skipped > 0 && (
                            <div className="flex-1 min-w-[240px] bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--ink-100)] text-[var(--ink-600)] flex items-center justify-center shrink-0">
                                    <HiOutlineMinus className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--ink-800)] text-[14px]">{skipped} sual boş buraxılıb</p>
                                    {isOwner && (
                                        <p className="text-[12.5px] text-[var(--ink-500)]">Cavablar bölməsində bu sualları görə bilərsiniz</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Section breakdown ── */}
                {displaySubmission?.subjectStats?.length > 1 && (
                    <SectionBreakdown subjectStats={displaySubmission.subjectStats} />
                )}

                {/* ── Rating + Question Review side-by-side on large ── */}
                <div className={`grid gap-5 ${isOwner ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                    <QuestionReview questions={reviewQuestions} sessionId={sessionId} navigate={navigate} />

                    {isOwner && (
                    <aside className="flex flex-col gap-5">
                        {/* Rating card */}
                        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <HiOutlineSparkles className="w-5 h-5 text-amber-500" />
                                <h3 className="text-[16px] font-bold text-[var(--ink-900)]">
                                    {rated ? 'Reytinqiniz' : 'İmtahanı qiymətləndir'}
                                </h3>
                            </div>
                            <p className="text-[13px] text-[var(--ink-500)] mb-4">
                                {rated
                                    ? 'Geribildiriminizə görə təşəkkür edirik.'
                                    : 'Bu imtahanı necə qiymətləndirirsiniz? Müəllimə kömək olacaq.'}
                            </p>
                            {rated ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-3xl leading-none">
                                        {'★'.repeat(rating)}<span className="text-[var(--ink-200)]">{'★'.repeat(5 - rating)}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                                        <HiOutlineCheckCircle className="w-3 h-3" /> Qeydə alındı
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <StarRating value={rating} onChange={handleRate} disabled={isRating} />
                                    {isRating && <span className="text-[12px] text-[var(--ink-400)]">Göndərilir...</span>}
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 flex flex-col gap-2.5">
                            <Link
                                to="/profil"
                                className="h-11 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                            >
                                Profilimə bax <HiOutlineArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                                to="/imtahanlar"
                                className="h-11 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                Yeni imtahan tap
                            </Link>
                            <Link
                                to="/"
                                className="h-11 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-700)] hover:bg-[var(--ink-100)] transition-all"
                            >
                                Ana səhifə
                            </Link>
                        </div>
                    </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamResultSummary;
