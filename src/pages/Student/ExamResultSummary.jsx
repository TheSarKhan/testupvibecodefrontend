import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineEye, HiOutlineClock } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import QuestionNav from '../../components/ui/QuestionNav';

const MOTIVATION = {
    excellent: {
        emojis: ['🏆', '🌟', '🎯'],
        headline: ['Möhtəşəm nəticə!', 'Üstadsan!', 'Fantastik!'],
        gradient: 'from-emerald-500 to-teal-600',
    },
    good: {
        emojis: ['👏', '💪', '⭐'],
        headline: ['Yaxşı iş çıxartdın!', 'Əla gedişat!', 'Gözəl nəticə!'],
        gradient: 'from-blue-500 to-indigo-600',
    },
    pass: {
        emojis: ['📈', '🔥', '💡'],
        headline: ['Keçid balını aldın!', 'İrəliləyirsən!', 'Yaxşı başlanğıc!'],
        messages: [
            'Bəzi mövzularda boşluqlar var, amma bunları bağlamaq sənin əlindədir. Hər sual bir fürsətdir.',
            'Bu nəticə hazırlığına dair bir siqnaldır. Zəif olduğun yerləri tap, üzərində işlə — fərq böyük olacaq.',
            'Bu nəticə bir başlanğıcdır. Özünə inan, çalışmağa davam et — daha yaxşısını etmək sənin əlindədir.',
        ],
        gradient: 'from-amber-500 to-orange-500',
    },
    fail: {
        emojis: ['📚', '🌱', '🎯'],
        headline: ['Təslim olma!', 'Hər uğursuzluq dərsdir.', 'Başlanğıc buradan keçir.'],
        gradient: 'from-rose-500 to-red-600',
    },
};

const getLevel = (pct) => {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'good';
    if (pct >= 50) return 'pass';
    return 'fail';
};

const pick = (arr, seed) => arr[seed % arr.length];

const StarRating = ({ value, onChange, disabled = false, small = false }) => {
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
                    className={`${small ? 'text-2xl' : 'text-3xl'} transition-transform focus:outline-none ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110'}`}
                >
                    <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                </button>
            ))}
        </div>
    );
};

const MultiDonutChart = ({ correct, wrong, skipped, pending, total, percent }) => {
    const r = 70;
    const circ = 2 * Math.PI * r;
    const safeTotal = total || 1;
    const segments = [
        { value: correct, color: '#22c55e' },
        { value: wrong,   color: '#ef4444' },
        { value: pending, color: '#f59e0b' },
        { value: skipped, color: '#9ca3af' },
    ];
    let cumulative = 0;
    const arcs = segments.map(seg => {
        const pct = seg.value / safeTotal;
        const dash = circ * pct;
        const gap  = circ - dash;
        const offset = circ * (1 - cumulative);
        cumulative += pct;
        return { ...seg, dash, gap, offset };
    });
    const textColor = percent >= 90 ? 'text-emerald-600' : percent >= 75 ? 'text-indigo-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600';
    return (
        <div className="relative inline-flex shrink-0">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={r} stroke="#f3f4f6" strokeWidth="14" fill="transparent" />
                {arcs.map((arc, i) => arc.value > 0 && (
                    <circle key={i} cx="80" cy="80" r={r}
                        stroke={arc.color} strokeWidth="14" fill="transparent"
                        strokeDasharray={`${arc.dash} ${arc.gap}`}
                        strokeDashoffset={arc.offset}
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${textColor}`}>{percent}%</span>
                <span className="text-[10px] text-gray-400 font-medium">nəticə</span>
            </div>
        </div>
    );
};

const DonutChart = ({ percent, color }) => {
    const r = 70;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (circumference * percent) / 100;
    const colorMap = {
        green:  { stroke: '#22c55e', text: 'text-green-600' },
        blue:   { stroke: '#6366f1', text: 'text-indigo-600' },
        yellow: { stroke: '#f59e0b', text: 'text-amber-600' },
        red:    { stroke: '#ef4444', text: 'text-red-600' },
    };
    const c = colorMap[color] || colorMap.green;
    return (
        <div className="relative inline-flex shrink-0">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={r} stroke="#f3f4f6" strokeWidth="14" fill="transparent" />
                <circle cx="80" cy="80" r={r} stroke={c.stroke} strokeWidth="14" fill="transparent"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${c.text}`}>{percent}%</span>
                <span className="text-[10px] text-gray-400 font-medium">nəticə</span>
            </div>
        </div>
    );
};

const SUBJECT_PALETTE = [
    { stroke: '#6366f1', text: 'text-indigo-600',  label: 'text-indigo-500'  },
    { stroke: '#10b981', text: 'text-emerald-600', label: 'text-emerald-500' },
    { stroke: '#f59e0b', text: 'text-amber-600',   label: 'text-amber-500'   },
    { stroke: '#f43f5e', text: 'text-rose-600',    label: 'text-rose-500'    },
];

const SubjectDonut = ({ stat, colorIndex }) => {
    const c = SUBJECT_PALETTE[colorIndex % SUBJECT_PALETTE.length];
    const pct = stat.formulaPercent != null
        ? Math.round(stat.formulaPercent)
        : stat.maxScore > 0 ? Math.round((stat.totalScore / stat.maxScore) * 100) : 0;
    const r = 52;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (circumference * pct) / 100;
    const total = stat.questionCount;

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-bold text-gray-600 text-center leading-tight max-w-[90px] truncate">
                {stat.subjectName || 'Digər'}
            </span>
            <div className="relative inline-flex">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={r} stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                    <circle cx="60" cy="60" r={r} stroke={c.stroke} strokeWidth="12" fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-black ${c.text}`}>{pct}%</span>
                    <span className="text-[9px] text-gray-400 font-medium">nəticə</span>
                </div>
            </div>
            {/* Mini breakdown row */}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                {[
                    { count: stat.correctCount,      color: 'bg-green-500', label: 'D' },
                    { count: stat.wrongCount,        color: 'bg-red-400',   label: 'Y' },
                    { count: stat.pendingManualCount,color: 'bg-amber-400', label: 'G' },
                    { count: stat.skippedCount,      color: 'bg-gray-300',  label: 'B' },
                ].filter(x => x.count > 0).map(x => (
                    <span key={x.label} className="flex items-center gap-0.5 text-[10px] text-gray-500 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${x.color}`} />
                        {x.count}
                    </span>
                ))}
            </div>
            {stat.sectionMaxScore != null ? (
                <p className="text-[11px] font-bold text-gray-600">
                    {stat.sectionScore != null ? stat.sectionScore.toFixed(1) : '–'} / {stat.sectionMaxScore} bal
                </p>
            ) : null}
            <p className="text-[10px] text-gray-400">{total} sual</p>
        </div>
    );
};

const ExamResultSummary = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const submission = location.state?.submission || null;

    const [rating, setRating] = useState(() => submission?.rating || 0);
    const [rated, setRated] = useState(() => submission?.rating != null);
    const [isRating, setIsRating] = useState(false);
    const [submissionData, setSubmissionData] = useState(submission || null);
    const [loading, setLoading] = useState(!submission);
    const [reviewQuestions, setReviewQuestions] = useState(null);
    const [reviewExamSubject, setReviewExamSubject] = useState(null);

    useEffect(() => {
        if (!sessionId) return;

        const fetchData = (isInitial = false) => {
            if (isInitial) setLoading(true);
            return api.get(`/submissions/${sessionId}`)
                .then(res => {
                    setSubmissionData(res.data);
                    setRating(r => r || res.data.rating || 0);
                    setRated(res.data.rating != null);
                    return res.data;
                })
                .catch(err => {
                    if (isInitial) {
                        console.error('Failed to fetch submission:', err);
                        toast.error('Nəticə yüklənə bilmədi');
                    }
                    return null;
                })
                .finally(() => { if (isInitial) setLoading(false); });
        };

        // Only do the initial load if not passed via location.state
        const initialPromise = submission ? Promise.resolve(submission) : fetchData(true);

        let interval = null;
        initialPromise.then(data => {
            const isFullyGraded = data?.isFullyGraded;
            if (!isFullyGraded) {
                interval = setInterval(() => {
                    fetchData(false).then(updated => {
                        if (updated?.isFullyGraded) {
                            clearInterval(interval);
                        }
                    });
                }, 20000);
            }
        });

        return () => { if (interval) clearInterval(interval); };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        api.get(`/submissions/${sessionId}/review`)
            .then(res => {
                const sorted = [...res.data.questions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                setReviewQuestions(sorted);
                setReviewExamSubject(res.data.examSubject);
            })
            .catch(() => {});
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

    const isTemplateExam = false;
    const scorePercent = displaySubmission?.maxScore > 0
        ? Math.round((displaySubmission.totalScore / displaySubmission.maxScore) * 100)
        : displaySubmission?.templateScorePercent != null
            ? Math.round(displaySubmission.templateScorePercent)
            : null;

    const seed = useMemo(() => parseInt(sessionId || '0', 10) || 0, [sessionId]);
    const level = scorePercent !== null ? getLevel(scorePercent) : null;
    const motiv = level ? MOTIVATION[level] : null;
    const emoji    = motiv ? pick(motiv.emojis, seed) : '🎉';
    const headline = motiv ? pick(motiv.headline, seed) : 'İmtahan bitdi!';
    const gradient = motiv ? motiv.gradient : 'from-indigo-500 to-purple-600';

    const getDonutColor = (pct) => {
        if (pct >= 90) return 'green';
        if (pct >= 75) return 'blue';
        if (pct >= 50) return 'yellow';
        return 'red';
    };

    const getBadge = (pct) => {
        if (pct >= 90) return { label: 'Əla',   bg: 'bg-white/25 text-white' };
        if (pct >= 75) return { label: 'Yaxşı', bg: 'bg-white/25 text-white' };
        if (pct >= 50) return { label: 'Kafi',  bg: 'bg-white/25 text-white' };
        return              { label: 'Zəif',    bg: 'bg-white/25 text-white' };
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds <= 0) return null;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s} san`;
        return s > 0 ? `${m}d ${s}s` : `${m} dəq`;
    };

    const timeTaken = (() => {
        if (!displaySubmission?.startedAt || !displaySubmission?.submittedAt) return null;
        const diffSec = Math.round(
            (new Date(displaySubmission.submittedAt) - new Date(displaySubmission.startedAt)) / 1000
        );
        return formatDuration(diffSec);
    })();

    const badge = scorePercent !== null ? getBadge(scorePercent) : null;
    const hasMultiSubject = displaySubmission?.subjectStats?.length >= 2;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Nəticə yüklənir...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center py-4 px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                {/* ── Compact header ── */}
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4 text-white flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                        {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-sm font-bold leading-tight">{headline}</h1>
                        <p className="text-white/65 text-xs truncate mt-0.5">
                            {displaySubmission?.examTitle || 'İmtahan'} tamamlandı
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {badge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.bg}`}>
                                {badge.label}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/90">
                            {displaySubmission?.isFullyGraded ? '✓ Tam' : '⏳ Gözləyir'}
                        </span>
                    </div>
                </div>

                {/* ── Score row ── */}
                {scorePercent !== null ? (
                    hasMultiSubject ? (
                        /* Multi-subject: one donut per subject */
                        <div className="px-5 py-4 border-b border-gray-100">
                            <div className="flex justify-around gap-2 mb-3">
                                {displaySubmission.subjectStats.map((stat, i) => (
                                    <SubjectDonut key={stat.subjectName} stat={stat} colorIndex={i} />
                                ))}
                            </div>
                            {/* Combined breakdown + time */}
                            {displaySubmission?.correctCount != null && (
                                <div className="grid grid-cols-4 gap-1 mt-1">
                                    {[
                                        { label: 'Doğru',    count: displaySubmission.correctCount,      color: 'bg-green-500' },
                                        { label: 'Yanlış',   count: displaySubmission.wrongCount,        color: 'bg-red-500'   },
                                        { label: 'Gözləyir',count: displaySubmission.pendingManualCount, color: 'bg-amber-400' },
                                        { label: 'Boş',      count: displaySubmission.skippedCount,      color: 'bg-gray-300'  },
                                    ].map(item => (
                                        <div key={item.label} className="flex flex-col items-center bg-gray-50 rounded-lg px-1 py-1.5 gap-0.5">
                                            <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                            <span className="text-[11px] font-bold text-gray-800">{item.count}</span>
                                            <span className="text-[9px] text-gray-400">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {displaySubmission?.templateTotalMaxScore != null && (
                                <p className="text-center text-sm font-bold text-indigo-600 mt-2">
                                    Ümumi: {displaySubmission.templateTotalScore?.toFixed(1)} / {displaySubmission.templateTotalMaxScore} bal
                                </p>
                            )}
                            {(timeTaken || displaySubmission?.durationMinutes) && (
                                <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1 mt-2">
                                    <HiOutlineClock className="w-3 h-3" />
                                    {timeTaken && <span>{timeTaken}</span>}
                                    {timeTaken && displaySubmission?.durationMinutes && <span className="text-gray-300">·</span>}
                                    {displaySubmission?.durationMinutes && <span>Limit: {displaySubmission.durationMinutes} dəq</span>}
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Single subject: donut left + breakdown right */
                        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100">
                            {displaySubmission?.correctCount != null ? (
                                <MultiDonutChart
                                    correct={displaySubmission.correctCount}
                                    wrong={displaySubmission.wrongCount}
                                    skipped={displaySubmission.skippedCount}
                                    pending={displaySubmission.pendingManualCount}
                                    total={(displaySubmission.correctCount || 0) + (displaySubmission.wrongCount || 0) + (displaySubmission.skippedCount || 0) + (displaySubmission.pendingManualCount || 0)}
                                    percent={scorePercent}
                                />
                            ) : (
                                <DonutChart percent={scorePercent} color={getDonutColor(scorePercent)} />
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="mb-2">
                                    {isTemplateExam ? (
                                        <>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Uğur faizi</p>
                                            <p className="text-xl font-black text-gray-900 leading-tight">
                                                {displaySubmission.templateScorePercent?.toFixed(1)}
                                                <span className="text-gray-400 text-base">%</span>
                                            </p>
                                            {displaySubmission.templateTotalMaxScore != null && (
                                                <p className="text-sm font-semibold text-indigo-500 mt-0.5">
                                                    {displaySubmission.templateTotalScore?.toFixed(1)} / {displaySubmission.templateTotalMaxScore} bal
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xl font-black text-gray-900 leading-tight">
                                            {displaySubmission.totalScore?.toFixed(1)}
                                            <span className="text-gray-400 text-sm font-medium"> / {displaySubmission.maxScore} bal</span>
                                        </p>
                                    )}
                                    {(timeTaken || displaySubmission?.durationMinutes) && (
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <HiOutlineClock className="w-3 h-3" />
                                            {timeTaken && <span>{timeTaken}</span>}
                                            {timeTaken && displaySubmission?.durationMinutes && <span className="text-gray-300">·</span>}
                                            {displaySubmission?.durationMinutes && <span>Limit: {displaySubmission.durationMinutes} dəq</span>}
                                        </p>
                                    )}
                                </div>
                                {displaySubmission?.correctCount != null && (
                                    <div className="grid grid-cols-2 gap-1">
                                        {[
                                            { label: 'Doğru',    count: displaySubmission.correctCount,      color: 'bg-green-500' },
                                            { label: 'Yanlış',   count: displaySubmission.wrongCount,        color: 'bg-red-500'   },
                                            { label: 'Gözləyir',count: displaySubmission.pendingManualCount, color: 'bg-amber-400' },
                                            { label: 'Boş',      count: displaySubmission.skippedCount,      color: 'bg-gray-300'  },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                                                <span className="text-[11px] text-gray-500 flex-1 truncate">{item.label}</span>
                                                <span className="text-[11px] font-bold text-gray-800">{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="px-5 py-5 text-center border-b border-gray-100">
                        <p className="text-4xl mb-2">📋</p>
                        <p className="text-gray-600 font-medium text-sm">
                            Nəticəniz müəllim tərəfindən yoxlandıqdan sonra profilinizə əlavə olunacaq.
                        </p>
                    </div>
                )}

                {/* ── Question Nav ── */}
                {reviewQuestions && reviewQuestions.length > 0 && (
                    <div className="px-5 pb-2">
                        <QuestionNav
                            questions={reviewQuestions}
                            examSubject={reviewExamSubject}
                            onClickQ={(q) => navigate(`/test/review/${sessionId}`, {
                                state: { fromResult: true, scrollToQuestionId: q.id }
                            })}
                        />
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="px-5 py-4 space-y-2.5">
                    {/* View answers */}
                    <button
                        onClick={() => navigate(`/test/review/${sessionId}`, { state: { fromResult: true } })}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-semibold text-sm transition-colors"
                    >
                        <HiOutlineEye className="w-4 h-4" />
                        Cavablarıma Bax
                    </button>


                    {/* Rating inline */}
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                        <span className="text-xs text-gray-500 font-medium shrink-0">
                            {rated ? 'Reytinqiniz' : 'Reytinq verin'}
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                            {rated ? (
                                <>
                                    <span className="text-yellow-400 text-lg leading-none">
                                        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                                    </span>
                                    <span className="text-xs text-green-600 font-medium">Qeydə alındı!</span>
                                </>
                            ) : (
                                <>
                                    <StarRating value={rating} onChange={handleRate} disabled={false} small />
                                    {isRating && <span className="text-xs text-gray-400">Göndərilir...</span>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Nav buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="py-2.5 px-4 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Ana Səhifə
                        </button>
                        <button
                            onClick={() => navigate('/profil')}
                            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            Profilimə Bax
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamResultSummary;
