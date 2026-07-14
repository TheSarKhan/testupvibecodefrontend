import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineXCircle,
    HiOutlineDocumentText, HiOutlinePencil, HiOutlineFilter, HiOutlineX,
    HiOutlineChevronUp, HiOutlineClock, HiOutlineDownload, HiOutlineLockClosed,
    HiOutlineVolumeUp,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';
import QuestionNav from '../../components/ui/QuestionNav';
import { fmtDate } from '../../utils/date';
import ChipContent from '../../utils/chipContent';
import { leftNodeKey, rightNodeKey, hasLeftSide, hasRightSide } from '../../utils/matchingPairs';
import { useSmartBack } from '../../hooks/useSmartBack';

const fmtScore = (v) => {
    if (v === null || v === undefined) return '0';
    const n = Math.round(v * 100) / 100;
    return n % 1 === 0 ? n.toString() : n.toFixed(2);
};

// ---- PassageReviewCard ----
// Shows a text/listening passage's content above the group of questions that
// belong to it, so the review makes clear which passage each question refers to.
// Read-only (the exam is over): plain audio player, no listen-limit tracking.
export const PassageReviewCard = ({ passage, onZoomImage }) => {
    if (!passage) return null;
    const isText = passage.passageType === 'TEXT';
    return (
        <div className={`rounded-3xl border-2 overflow-hidden mb-3 ${isText ? 'border-teal-200' : 'border-emerald-200'}`}>
            <div className={`px-6 py-3 flex items-center gap-3 ${isText ? 'bg-teal-50' : 'bg-emerald-50'}`}>
                {isText
                    ? <HiOutlineDocumentText className="w-5 h-5 text-teal-600 shrink-0" />
                    : <HiOutlineVolumeUp className="w-5 h-5 text-emerald-600 shrink-0" />}
                <span className={`font-bold text-sm ${isText ? 'text-teal-700' : 'text-emerald-700'}`}>
                    {passage.title || (isText ? 'Mətn Parçası' : 'Dinləmə')}
                </span>
                <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-400)]">
                    {isText ? 'Mətn' : 'Dinləmə'}
                </span>
            </div>
            <div className="p-6">
                {isText ? (
                    <>
                        {passage.textContent && (
                            <div className="prose max-w-none text-gray-800 leading-relaxed mb-4 text-base">
                                <LatexPreview content={passage.textContent} />
                            </div>
                        )}
                        {passage.attachedImage && (
                            <img src={passage.attachedImage} alt="Mətn"
                                 className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 cursor-zoom-in"
                                 onClick={() => onZoomImage?.(passage.attachedImage)} />
                        )}
                        {!passage.textContent && !passage.attachedImage && (
                            <p className="text-gray-400 italic text-sm">Mətn məzmunu yoxdur</p>
                        )}
                    </>
                ) : (
                    passage.audioContent
                        ? <audio controls controlsList="nodownload" src={passage.audioContent} className="w-full" />
                        : <div className="p-6 text-center text-gray-400 border-2 border-dashed rounded-xl">Audio fayl mövcud deyil</div>
                )}
            </div>
        </div>
    );
};

// ---- MatchingReview ----
export const MatchingReview = ({ q }) => {
    const containerRef = useRef(null);
    const [arrows, setArrows] = useState([]);

    let studentMatches = [];
    try { if (q.studentMatchingAnswerJson) studentMatches = JSON.parse(q.studentMatchingAnswerJson); } catch (e) {}

    // Content-based correctness (text + image — backend qiymətləndirmə ilə eyni
    // açar): pairId → pair, sonra (sol tərəf ↔ sağ tərəf) bağlantısı yoxlanır.
    const pairById = {};
    q.matchingPairs.forEach(p => { pairById[p.id] = p; });
    const sideKey = (text, img) => {
        const t = (text || '').trim(), i = img || '';
        return (t || i) ? `${t}|${i}` : null;
    };
    const correctConnectionSet = new Set(
        q.matchingPairs
            .map(p => {
                const lk = sideKey(p.leftItem, p.attachedImageLeft);
                const rk = sideKey(p.rightItem, p.attachedImageRight);
                return lk && rk ? `${lk}>>${rk}` : null;
            })
            .filter(Boolean)
    );
    const isMatchCorrect = (m) => {
        const lp = pairById[m.leftItemId];
        const rp = pairById[m.rightItemId];
        if (!lp || !rp) return false;
        const lk = sideKey(lp.leftItem, lp.attachedImageLeft);
        const rk = sideKey(rp.rightItem, rp.attachedImageRight);
        return !!(lk && rk) && correctConnectionSet.has(`${lk}>>${rk}`);
    };

    // Node-deduped left groups, keyed by the shared node key (persisted
    // visualId, content fallback for legacy rows). Distinct items that share
    // text/image stay separate; image-only nodes are kept.
    const leftGroupMap = {};
    q.matchingPairs.forEach(p => {
        if (!hasLeftSide(p)) return;
        const k = leftNodeKey(p);
        if (!leftGroupMap[k]) leftGroupMap[k] = { pair: p, allIds: [] };
        if (!leftGroupMap[k].allIds.includes(p.id)) leftGroupMap[k].allIds.push(p.id);
    });
    const leftNodes = Object.values(leftGroupMap);

    // Node-deduped right groups, sorted alphabetically
    const rightGroupMap = {};
    q.matchingPairs.forEach(p => {
        if (!hasRightSide(p)) return;
        const k = rightNodeKey(p);
        if (!rightGroupMap[k]) rightGroupMap[k] = { pair: p, allIds: [] };
        if (!rightGroupMap[k].allIds.includes(p.id)) rightGroupMap[k].allIds.push(p.id);
    });
    const rightNodes = Object.values(rightGroupMap).sort((a, b) => (a.pair.rightItem || '').localeCompare(b.pair.rightItem || ''));

    // Reverse maps: any pairId → canonical (representative) pair id
    const leftIdToCanon = {};
    leftNodes.forEach(g => g.allIds.forEach(id => { leftIdToCanon[id] = g.pair.id; }));
    const rightIdToCanon = {};
    rightNodes.forEach(g => g.allIds.forEach(id => { rightIdToCanon[id] = g.pair.id; }));

    // Aggregate matches by canonical pair id
    const matchesByLeft = {};
    const matchesByRight = {};
    studentMatches.forEach(m => {
        const lc = leftIdToCanon[m.leftItemId] ?? m.leftItemId;
        const rc = rightIdToCanon[m.rightItemId] ?? m.rightItemId;
        if (!matchesByLeft[lc]) matchesByLeft[lc] = [];
        matchesByLeft[lc].push(m);
        if (!matchesByRight[rc]) matchesByRight[rc] = [];
        matchesByRight[rc].push(m);
    });

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const computed = [];
        const seenArrows = new Set();
        studentMatches.forEach((m, idx) => {
            const lc = leftIdToCanon[m.leftItemId] ?? m.leftItemId;
            const rc = rightIdToCanon[m.rightItemId] ?? m.rightItemId;
            const key = `${lc}-${rc}`;
            if (seenArrows.has(key)) return;
            seenArrows.add(key);
            const leftEl = containerRef.current.querySelector(`[data-left-id="${lc}"]`);
            const rightEl = containerRef.current.querySelector(`[data-right-id="${rc}"]`);
            if (!leftEl || !rightEl) return;
            const lRect = leftEl.getBoundingClientRect();
            const rRect = rightEl.getBoundingClientRect();
            computed.push({
                idx,
                x1: lRect.right - rect.left,
                y1: lRect.top + lRect.height / 2 - rect.top,
                x2: rRect.left - rect.left,
                y2: rRect.top + rRect.height / 2 - rect.top,
                isCorrect: isMatchCorrect(m),
            });
        });
        setArrows(computed);
    }, [q.id, q.studentMatchingAnswerJson]);

    return (
        <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Uyğunluq Nəticələri:</p>
            <div ref={containerRef} className="relative flex justify-between py-6" style={{ zIndex: 0 }}>
                {/* Left column */}
                <div className="w-[40%] space-y-6" style={{ zIndex: 10, position: 'relative' }}>
                    {leftNodes.map(({ pair, allIds }) => {
                        const matches = matchesByLeft[pair.id] || [];
                        const isLinked = allIds.some(id => {
                            const p = q.matchingPairs.find(mp => mp.id === id);
                            return p && !!(p.rightItem || p.attachedImageRight);
                        });
                        const hasAnyCorrect = matches.some(m => isMatchCorrect(m));
                        const hasMatch = matches.length > 0;
                        const missed = isLinked && !hasMatch;
                        const cls = missed
                            ? 'border-orange-300 bg-orange-50 text-orange-900'
                            : !hasMatch
                            ? 'border-gray-200 bg-gray-50 text-gray-600'
                            : hasAnyCorrect
                            ? 'border-green-400 bg-green-50 text-green-900'
                            : 'border-red-400 bg-red-50 text-red-900';
                        return (
                            <div key={pair.id} data-left-id={pair.id} className={`p-4 rounded-2xl border-2 text-sm font-medium min-h-[52px] flex flex-col justify-center ${cls}`}>
                                {pair.leftItem && <div className="break-words"><ChipContent text={pair.leftItem} /></div>}
                                {pair.attachedImageLeft && <div className="mt-2"><img src={pair.attachedImageLeft} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                                {missed && <p className="text-[10px] font-bold text-orange-500 mt-1">Birləşdirilməyib</p>}
                            </div>
                        );
                    })}
                </div>
                {/* Right column */}
                <div className="w-[40%] space-y-6" style={{ zIndex: 10, position: 'relative' }}>
                    {rightNodes.map(({ pair, allIds }) => {
                        const matches = matchesByRight[pair.id] || [];
                        const isLinked = allIds.some(id => {
                            const p = q.matchingPairs.find(mp => mp.id === id);
                            return p && !!(p.leftItem || p.attachedImageLeft);
                        });
                        const hasAnyCorrect = matches.some(m => isMatchCorrect(m));
                        const hasMatch = matches.length > 0;
                        const missed = isLinked && !hasMatch;
                        const cls = missed
                            ? 'border-orange-300 bg-orange-50 text-orange-900'
                            : !hasMatch
                            ? 'border-gray-200 bg-gray-50 text-gray-600'
                            : hasAnyCorrect
                            ? 'border-green-400 bg-green-50 text-green-900'
                            : 'border-red-400 bg-red-50 text-red-900';
                        return (
                            <div key={pair.id} data-right-id={pair.id} className={`p-4 rounded-2xl border-2 text-sm font-medium min-h-[52px] flex flex-col justify-center ${cls}`}>
                                {pair.rightItem && <div className="break-words"><ChipContent text={pair.rightItem} /></div>}
                                {pair.attachedImageRight && <div className="mt-2"><img src={pair.attachedImageRight} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                                {missed && <p className="text-[10px] font-bold text-orange-500 mt-1">Birləşdirilməyib</p>}
                            </div>
                        );
                    })}
                </div>
                {/* SVG arrows */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%', zIndex: 5 }}>
                    <defs>
                        {arrows.map(({ idx, isCorrect }) => (
                            <marker key={idx} id={`rarr-${q.id}-${idx}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={isCorrect ? '#10b981' : '#ef4444'} />
                            </marker>
                        ))}
                    </defs>
                    {arrows.map(({ idx, x1, y1, x2, y2, isCorrect }) => {
                        const color = isCorrect ? '#10b981' : '#ef4444';
                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                        const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                        return (
                            <g key={idx}>
                                <path d={d} stroke={color} strokeWidth="2.5" fill="none"
                                    markerEnd={`url(#rarr-${q.id}-${idx})`} opacity={0.85} />
                                <circle cx={mx} cy={my} r="10" fill="white" stroke={color} strokeWidth="1.5" />
                                {isCorrect
                                    ? <text x={mx} y={my + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={color}>✓</text>
                                    : <g>
                                        <line x1={mx-4} y1={my-4} x2={mx+4} y2={my+4} stroke={color} strokeWidth="2" strokeLinecap="round" />
                                        <line x1={mx+4} y1={my-4} x2={mx-4} y2={my+4} stroke={color} strokeWidth="2" strokeLinecap="round" />
                                      </g>
                                }
                            </g>
                        );
                    })}
                </svg>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 bg-green-500 rounded"></span> Düzgün cavab
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 bg-red-500 rounded"></span> Səhv cavab
                </span>
            </div>
        </div>
    );
};

// ---- GradingPanel ----
const GradingPanel = ({ question, submissionId, onGraded, initialFraction = null, initialFeedback = '' }) => {
    const [fraction, setFraction] = useState(initialFraction);
    const [feedback, setFeedback] = useState(initialFeedback);
    const [saving, setSaving] = useState(false);
    const isRegrading = initialFraction !== null;

    const fractions = [
        { value: 0, label: '0 bal' },
        { value: 1 / 3, label: '1/3 bal' },
        { value: 1 / 2, label: '1/2 bal' },
        { value: 2 / 3, label: '2/3 bal' },
        { value: 1, label: 'Tam bal' },
    ];

    const handleSave = async () => {
        if (fraction === null) { toast.error('Bal seçin'); return; }
        setSaving(true);
        try {
            const { data } = await api.post(`/submissions/${submissionId}/grade-answer`, {
                questionId: question.id,
                fraction,
                feedback: feedback.trim() || null
            });
            toast.success('Bal qeydə alındı');
            onGraded(question.id, fraction * question.points, feedback.trim(), data);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Bal qeydə alınmadı');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`mt-5 p-5 rounded-2xl border space-y-3.5 ${isRegrading ? 'bg-amber-50 border-amber-200' : 'bg-[var(--primary-soft)] border-[var(--brand-blue-100)]'}`}>
            <p className={`text-[11.5px] font-bold uppercase tracking-[0.08em] flex items-center gap-1.5 ${isRegrading ? 'text-amber-600' : 'text-[var(--primary)]'}`}>
                <HiOutlinePencil className="w-3.5 h-3.5" />
                {isRegrading ? `Balı dəyişdir (${question.points} bal)` : `Bal ver (${question.points} bal)`}
            </p>
            <div className="flex flex-wrap gap-2">
                {fractions.map(f => (
                    <button
                        key={f.value}
                        type="button"
                        onClick={() => setFraction(f.value)}
                        className={`px-4 py-2 rounded-xl text-[13px] font-bold border-2 transition-all ${
                            fraction === f.value
                                ? isRegrading
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                    : 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                                : isRegrading
                                    ? 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
                                    : 'bg-white text-[var(--primary-hover)] border-[var(--brand-blue-100)] hover:border-[var(--primary)]'
                        }`}
                    >
                        {f.label}
                        {fraction === f.value && (
                            <span className="ml-1 text-[11px] opacity-75">({fmtScore(f.value * question.points)})</span>
                        )}
                    </button>
                ))}
            </div>
            <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Şagirdə rəy (istəyə bağlı)..."
                className={`w-full px-3 py-2 border rounded-xl text-[13.5px] resize-none bg-white focus:outline-none ${
                    isRegrading
                        ? 'border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
                        : 'border-[var(--brand-blue-100)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]'
                }`}
                rows={2}
            />
            <button
                onClick={handleSave}
                disabled={saving || fraction === null}
                className={`inline-flex items-center justify-center h-10 px-5 rounded-full text-[13px] font-bold text-white transition-all disabled:opacity-50 ${
                    isRegrading
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.6)]'
                        : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)]'
                }`}
            >
                {saving ? 'Saxlanılır...' : isRegrading ? 'Balı Yenilə' : 'Balı Qeydə Al'}
            </button>
        </div>
    );
};

// ---- Main ExamReview ----
const ExamReview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromResult = location.state?.fromResult === true;
    const scrollToQuestionId = location.state?.scrollToQuestionId ?? null;
    const { isTeacher, isAdmin } = useAuth();
    const canGrade = isTeacher || isAdmin;
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnlyUngraded, setShowOnlyUngraded] = useState(false);
    const [zoomImage, setZoomImage] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [submissionList, setSubmissionList] = useState([]);
    const questionRefs = useRef({});
    // Teacher "back to statistics": go back in history when we actually came from
    // the statistics page (so viewing many students in a row doesn't stack
    // duplicate statistics entries and break back → My Exams), otherwise land on
    // the statistics page directly.
    const backToStats = useSmartBack(review?.examId ? `/imtahanlar/${review.examId}/statistika` : '/imtahanlar');

    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const { data } = await api.get(`/submissions/${sessionId}/review`);
                setReview(data);
                // Default: teacher/admin sees only ungraded if there are any; students always see all
                if (data.ungradedCount > 0 && canGrade) setShowOnlyUngraded(true);
            } catch (error) {
                const msg = error.response?.status === 404
                    ? 'Belə bir imtahan nəticəsi tapılmadı'
                    : (error.response?.data?.message || 'Nəticələr yüklənmədi');
                toast.error(msg);
                navigate(isTeacher ? '/imtahanlar' : '/profil');
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [sessionId, navigate]);

    // Teachers/admins also load the full submission list for "next student" nav.
    useEffect(() => {
        if (!canGrade || !review?.examId) return;
        let cancelled = false;
        api.get(`/submissions/exam/${review.examId}`)
            .then(res => {
                if (cancelled) return;
                const submitted = (res.data || []).filter(s => s.submittedAt);
                setSubmissionList(submitted);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [canGrade, review?.examId]);

    const nextSessionId = (() => {
        if (!canGrade || !submissionList.length) return null;
        const currentIdx = submissionList.findIndex(s => String(s.id) === String(sessionId));
        if (currentIdx === -1 || currentIdx >= submissionList.length - 1) return null;
        return submissionList[currentIdx + 1].id;
    })();

    useEffect(() => {
        if (!scrollToQuestionId || loading) return;
        const el = questionRefs.current[scrollToQuestionId];
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }, [scrollToQuestionId, loading]);

    const handleGraded = (questionId, awardedScore, feedbackText, submissionResp) => {
        setReview(prev => {
            const updatedQuestions = prev.questions.map(q =>
                q.id === questionId
                    ? { ...q, isGraded: true, awardedScore, feedback: feedbackText || q.feedback, points: q.points }
                    : q
            );
            const newUngradedCount = updatedQuestions.filter(q => !q.isGraded).length;
            if (newUngradedCount === 0) setShowOnlyUngraded(false);
            return {
                ...prev,
                questions: updatedQuestions,
                ungradedCount: newUngradedCount,
                isFullyGraded: newUngradedCount === 0,
                totalScore: submissionResp?.totalScore ?? prev.totalScore,
                templateScorePercent: submissionResp?.templateScorePercent ?? prev.templateScorePercent,
            };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!review) return null;

    const scorePercent = review.maxScore > 0 ? Math.round((review.totalScore / review.maxScore) * 100) : 0;

    // Passage lookup + passage-aware ordering. Passage questions carry a
    // passageId and their orderIndex is LOCAL to the passage, so a naive global
    // sort scattered them among standalone questions. Group each passage's
    // questions together and place the group at its passage's orderIndex, so the
    // review shows passage questions contiguously under their passage content.
    const passageById = new Map((review.passages || []).map(p => [p.id, p]));
    const sortedQuestions = (() => {
        const qs = review.questions || [];
        const passages = review.passages || [];
        const secs = [];
        // Standalone questions (no passage, or a passage the server didn't send).
        qs.filter(q => !q.passageId || !passageById.has(q.passageId))
          .forEach(q => secs.push({ oi: q.orderIndex ?? 0, items: [q] }));
        // One section per passage, its questions sorted by their local order.
        passages.forEach(p => {
            const items = qs.filter(q => q.passageId === p.id)
                             .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            if (items.length) secs.push({ oi: p.orderIndex ?? 0, items });
        });
        return secs.sort((a, b) => a.oi - b.oi).flatMap(s => s.items);
    })();

    const displayedQuestions = showOnlyUngraded
        ? sortedQuestions.filter(q => !q.isGraded)
        : sortedQuestions;

    // Build subject group info: firstQuestionId → { label, start, end }
    const subjectHeaderMap = (() => {
        const map = new Map();
        const groups = [];
        let cur = null;
        sortedQuestions.forEach((q, i) => {
            const key = q.subjectGroup ?? '__main__';
            if (!cur || cur.key !== key) {
                cur = { key, label: q.subjectGroup || review.examSubject || null, start: i + 1, end: i + 1, firstId: q.id };
                groups.push(cur);
            } else {
                cur.end = i + 1;
            }
        });
        if (groups.length >= 2) {
            groups.forEach(g => map.set(g.firstId, { label: g.label, range: `${g.start}–${g.end}` }));
        }
        return map;
    })();

    // Track which subject group we've shown a header for in displayedQuestions
    const shownSubjectGroups = new Set();

    // Track which passageIds we've already shown a separator for
    const shownPassageIds = new Set();
    let questionNumber = 0;

    const ringPct = scorePercent;
    const ringColor = ringPct >= 80 ? 'var(--brand-green-600)' : ringPct >= 50 ? '#F59E0B' : '#EF4444';
    const submittedDate = review.submittedAt ? new Date(review.submittedAt) : null;
    const studentName = review.studentName || review.studentFullName || review.studentEmail || '—';
    const studentInit = studentName && studentName !== '—'
        ? studentName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    const studentRole = review.isGuest ? 'Qonaq' : 'Şagird';
    const duration = (() => {
        if (!review.startedAt || !review.submittedAt) return null;
        const diffSec = Math.abs(new Date(review.submittedAt) - new Date(review.startedAt)) / 1000;
        const m = Math.floor(diffSec / 60);
        const s = Math.floor(diffSec % 60);
        return `${m} dəq ${s.toString().padStart(2, '0')} san`;
    })();

    return (
        <div className="min-h-screen pb-20" style={{ background: 'var(--paper-cream)' }}>
            {/* Scroll to top */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-[0_12px_30px_-10px_rgba(37,99,235,0.7)] flex items-center justify-center transition-all"
                    title="Yuxarı qayıt"
                >
                    <HiOutlineChevronUp className="w-5 h-5" />
                </button>
            )}

            {/* Image Zoom Overlay */}
            {zoomImage && (
                <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setZoomImage(null)}>
                    <img src={zoomImage} alt="Böyüdülmüş şəkil"
                        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-2 border-white/10 object-contain" />
                    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                        onClick={() => setZoomImage(null)}>
                        <HiOutlineX className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* ── Sticky top bar — back / title / student chip ── */}
            <div className="sticky top-0 z-30 border-b border-[var(--ink-150)] bg-[color-mix(in_srgb,var(--paper-cream),white_30%)]/90 backdrop-blur">
                <div className="container-main py-4 flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            if (canGrade) backToStats();
                            else if (fromResult) navigate(`/test/result/${sessionId}`);
                            else navigate('/profil');
                        }}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold text-[var(--ink-700)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all shrink-0"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        {canGrade ? 'Statistikaya qayıt' : fromResult ? 'Nəticəyə qayıt' : 'Profilə qayıt'}
                    </button>
                    <div className="flex-1 text-center min-w-0 px-2">
                        <h1 className="text-[18px] md:text-[20px] font-extrabold text-[var(--ink-900)] tracking-tight truncate">{review.examTitle}</h1>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)] mt-0.5">İmtahan baxışı</p>
                    </div>
                    <div className="inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 bg-white border border-[var(--ink-200)] rounded-full shrink-0">
                        <span className="w-8 h-8 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] inline-flex items-center justify-center font-bold text-[11.5px]">
                            {studentInit || '?'}
                        </span>
                        <div className="leading-tight">
                            <div className="text-[13px] font-bold text-[var(--ink-900)] truncate max-w-[150px]">{studentName}</div>
                            <div className="text-[11px] text-[var(--ink-500)]">{studentRole}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-main max-w-4xl mt-7">
                {/* ── Summary card: ring + 3 columns ── */}
                <div className="bg-white rounded-3xl border border-[var(--ink-200)] mb-5 overflow-hidden">
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr] gap-6 sm:gap-0 items-center">
                        {/* Score ring */}
                        <div className="relative w-[120px] h-[120px] mx-auto sm:mx-0">
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ink-150)" strokeWidth="9" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={ringColor}
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 50}
                                    strokeDashoffset={(2 * Math.PI * 50) * (1 - ringPct / 100)}
                                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[24px] font-extrabold text-[var(--ink-900)]">
                                {ringPct}%
                            </div>
                        </div>

                        {/* Toplanan Bal */}
                        <div className="sm:pl-6 sm:pr-6 sm:border-l border-[var(--ink-150)] text-center sm:text-left">
                            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-400)]">Toplanan bal</div>
                            <div className="text-[28px] font-extrabold text-[var(--primary)] mt-1 leading-none">
                                {fmtScore(review.totalScore)}
                                <span className="text-[18px] text-[var(--ink-400)] font-bold ml-1">/ {review.maxScore}</span>
                            </div>
                        </div>

                        {/* Tarix */}
                        <div className="sm:pl-6 sm:pr-6 sm:border-l border-[var(--ink-150)] text-center sm:text-left">
                            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-400)]">Tarix</div>
                            <div className="text-[20px] font-bold text-[var(--ink-900)] mt-1 leading-tight">
                                {submittedDate ? fmtDate(submittedDate) : '—'}
                            </div>
                            <div className="text-[12px] text-[var(--ink-500)] mt-1">
                                {submittedDate ? submittedDate.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                                {duration && <> · {duration}</>}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="sm:pl-6 sm:border-l border-[var(--ink-150)] text-center sm:text-left">
                            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-400)]">Status</div>
                            <div className="mt-2">
                                {review.isFullyGraded ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)] font-bold text-[13px]">
                                        <HiOutlineCheckCircle className="w-4 h-4" /> Tam yoxlanılıb
                                    </span>
                                ) : review.ungradedCount > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[13px]">
                                        <HiOutlineClock className="w-4 h-4" /> {review.ungradedCount} gözləyir
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-600)] font-bold text-[13px]">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Navigation */}
                <QuestionNav
                    questions={sortedQuestions}
                    examSubject={review.examSubject}
                    onClickQ={(q) => {
                        const el = questionRefs.current[q.id];
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="mb-6"
                />

                {/* Ungraded count banner (student) */}
                {!canGrade && review.ungradedCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 mb-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <HiOutlineClock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800 text-[15px]">{review.ungradedCount} sual hələ yoxlanılmayıb</p>
                            <p className="text-[13px] text-amber-700 mt-0.5">Müəllim yoxladıqdan sonra balınız yenilənəcək.</p>
                        </div>
                    </div>
                )}

                {/* Teacher/Admin filter toggle */}
                {canGrade && (review.ungradedCount > 0 || review.isFullyGraded) && (
                    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            {review.ungradedCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[13px] font-bold px-3 py-1.5 rounded-full border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {review.ungradedCount} yoxlanılmamış
                                </span>
                            )}
                            {review.isFullyGraded && (
                                <span className="inline-flex items-center gap-1.5 bg-[var(--accent-soft)] text-[var(--brand-green-600)] text-[13px] font-bold px-3 py-1.5 rounded-full border border-[var(--brand-green-100)]">
                                    <HiOutlineCheckCircle className="w-4 h-4" /> Tam yoxlanılıb
                                </span>
                            )}
                        </div>
                        {review.ungradedCount > 0 && (
                            <button
                                onClick={() => setShowOnlyUngraded(v => !v)}
                                className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold border transition-all ${
                                    showOnlyUngraded
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.6)]'
                                        : 'bg-white text-[var(--ink-700)] border-[var(--ink-200)] hover:border-amber-400 hover:text-amber-600'
                                }`}
                            >
                                <HiOutlineFilter className="w-3.5 h-3.5" />
                                {showOnlyUngraded ? 'Bütün sualları göstər' : 'Yalnız yoxlanılmayanlar'}
                            </button>
                        )}
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-4">
                    {displayedQuestions.map((q) => {
                        questionNumber++;
                        const isPassageQuestion = !!q.passageId;
                        const showPassageSeparator = isPassageQuestion && !shownPassageIds.has(q.passageId);
                        if (showPassageSeparator) shownPassageIds.add(q.passageId);

                        const subjectKey = q.subjectGroup ?? '__main__';
                        const showSubjectHeader = subjectHeaderMap.has(q.id) && !shownSubjectGroups.has(subjectKey);
                        if (showSubjectHeader) shownSubjectGroups.add(subjectKey);

                        return (
                            <div key={q.id} ref={el => { questionRefs.current[q.id] = el; }}>
                                {/* Subject group header */}
                                {showSubjectHeader && (() => {
                                    const { label, range } = subjectHeaderMap.get(q.id);
                                    return (
                                        <div className="flex items-center gap-3 mt-5 mb-2 px-1">
                                            <div className="flex-1 h-px bg-[var(--brand-blue-100)]" />
                                            <span className="text-[11.5px] font-bold text-[var(--primary)] uppercase tracking-[0.1em] whitespace-nowrap">
                                                {label} · {range}
                                            </span>
                                            <div className="flex-1 h-px bg-[var(--brand-blue-100)]" />
                                        </div>
                                    );
                                })()}

                                {/* Passage content — shown once above the group of
                                    questions that belong to this text / listening passage. */}
                                {showPassageSeparator && (
                                    <div className="mt-7">
                                        <PassageReviewCard passage={passageById.get(q.passageId)} onZoomImage={setZoomImage} />
                                    </div>
                                )}

                                <div className={`bg-white rounded-3xl border overflow-hidden ${isPassageQuestion ? 'border-teal-100 border-l-4 border-l-teal-300 ml-0 md:ml-4' : 'border-[var(--ink-200)]'}`}>
                                    <div className="p-6 md:p-7">
                                        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.08em] bg-[var(--ink-100)] text-[var(--ink-700)]">
                                                SUAL {questionNumber} <span className="text-[var(--ink-300)]">•</span> {q.points} BAL
                                            </span>
                                            {(() => {
                                                const hasAnswer = (
                                                    q.studentSelectedOptionId != null ||
                                                    (q.studentSelectedOptionIds && q.studentSelectedOptionIds.length > 0) ||
                                                    q.studentAnswerText?.trim() ||
                                                    q.studentAnswerImage ||
                                                    q.studentMatchingAnswerJson
                                                );
                                                if (!q.isGraded) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                            <HiOutlineClock className="w-3.5 h-3.5" /> Yoxlanılır
                                                        </span>
                                                    );
                                                }
                                                if (!hasAnswer) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-500)]">
                                                            Boş buraxıldı
                                                        </span>
                                                    );
                                                }
                                                if (q.awardedScore === q.points) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)] border border-[var(--brand-green-100)]">
                                                            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Düzdür
                                                        </span>
                                                    );
                                                }
                                                if (q.awardedScore > 0) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                            Qismən · {fmtScore(q.awardedScore)} / {q.points}
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                                        <HiOutlineXCircle className="w-3.5 h-3.5" /> Səhvdir
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        <div className="text-[17px] text-[var(--ink-900)] font-semibold mb-5 leading-[1.55]">
                                            <LatexPreview content={q.content} placeholder={null} />
                                        </div>

                                        {q.attachedImage && (
                                            <div className="mb-5 rounded-2xl overflow-hidden border border-[var(--ink-150)] bg-[var(--ink-50)] max-h-96 flex justify-center cursor-zoom-in"
                                                onClick={() => setZoomImage(q.attachedImage)}>
                                                <img src={q.attachedImage} alt="Question" className="object-contain" />
                                            </div>
                                        )}

                                        {/* Options (MCQ / True-False / Multi-Select) */}
                                        {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MULTI_SELECT') && (
                                            <div className="flex flex-col gap-2.5">
                                                {q.options.map(opt => {
                                                    const isSelected = q.questionType === 'MULTI_SELECT'
                                                        ? (q.studentSelectedOptionIds || []).includes(opt.id)
                                                        : q.studentSelectedOptionId === opt.id;
                                                    const isCorrect = opt.isCorrect;
                                                    const isWrongUser = isSelected && !isCorrect;

                                                    let borderClass = 'border-[var(--ink-200)]';
                                                    let bgClass = 'bg-white';
                                                    let textClass = 'text-[var(--ink-800)]';
                                                    let badge = null;

                                                    if (isCorrect) {
                                                        borderClass = 'border-[var(--brand-green-600)]';
                                                        bgClass = 'bg-[var(--accent-soft)]';
                                                        textClass = 'text-[var(--ink-900)]';
                                                        badge = (
                                                            <span className="w-6 h-6 rounded-full bg-[var(--brand-green-600)] text-white inline-flex items-center justify-center shrink-0">
                                                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                                            </span>
                                                        );
                                                    } else if (isWrongUser) {
                                                        borderClass = 'border-red-400';
                                                        bgClass = 'bg-red-50';
                                                        textClass = 'text-[var(--ink-900)]';
                                                        badge = (
                                                            <span className="w-6 h-6 rounded-full bg-red-500 text-white inline-flex items-center justify-center shrink-0 font-bold text-[12px]">
                                                                ✕
                                                            </span>
                                                        );
                                                    }

                                                    const letterShape = q.questionType === 'MULTI_SELECT' ? 'rounded-md' : 'rounded-full';
                                                    const letterClass = isCorrect
                                                        ? 'bg-[var(--primary)] text-white border-transparent'
                                                        : isSelected
                                                            ? 'bg-[var(--primary)] text-white border-transparent'
                                                            : 'bg-white text-[var(--ink-500)] border-[var(--ink-200)]';

                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${borderClass} ${bgClass}`}
                                                        >
                                                            <span className={`w-7 h-7 inline-flex items-center justify-center text-[12.5px] font-bold border ${letterShape} ${letterClass} shrink-0`}>
                                                                {String.fromCharCode(65 + (opt.orderIndex ?? 0))}
                                                            </span>
                                                            <div className={`flex-1 font-medium ${textClass}`}>
                                                                <LatexPreview content={opt.content} placeholder={null} />
                                                            </div>
                                                            {badge}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Open Questions */}
                                        {(q.questionType === 'OPEN_AUTO' || q.questionType === 'OPEN_MANUAL') && (
                                            <div className="flex flex-col gap-3.5">
                                                <div className="p-5 bg-[var(--primary-soft)]/60 rounded-2xl border border-[var(--brand-blue-100)]">
                                                    <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-[0.1em] mb-2">Şagirdin cavabı</p>
                                                    {q.studentAnswerText ? (
                                                        <div className="text-[var(--ink-900)] font-medium leading-relaxed">
                                                            <LatexPreview content={q.studentAnswerText} placeholder={null} />
                                                        </div>
                                                    ) : (
                                                        <p className="text-[var(--ink-400)] italic">[Mətn cavabı yoxdur]</p>
                                                    )}
                                                    {q.studentAnswerImage && (
                                                        <div className="mt-3">
                                                            <img
                                                                src={q.studentAnswerImage}
                                                                alt="Şagird cavab şəkli"
                                                                className="max-h-64 rounded-xl border border-[var(--brand-blue-100)] cursor-zoom-in"
                                                                onClick={() => setZoomImage(q.studentAnswerImage)}
                                                            />
                                                        </div>
                                                    )}
                                                    {!q.studentAnswerText && !q.studentAnswerImage && (
                                                        <p className="text-[var(--ink-400)] italic mt-1">[Cavab verilməyib]</p>
                                                    )}
                                                </div>
                                                {/* OPEN_AUTO: show correct answer after grading; OPEN_MANUAL: always show to teacher */}
                                                {q.correctAnswer && (q.isGraded || (canGrade && q.questionType === 'OPEN_MANUAL')) && (
                                                    <div className="p-5 bg-[var(--accent-soft)]/70 rounded-2xl border border-[var(--brand-green-100)]">
                                                        <p className="text-[11px] font-bold text-[var(--brand-green-600)] uppercase tracking-[0.1em] mb-2">
                                                            {q.questionType === 'OPEN_AUTO' ? 'Düzgün cavab' : 'İstinad cavab (müəllim)'}
                                                        </p>
                                                        <div className="text-[var(--ink-900)] font-medium leading-relaxed">
                                                            <LatexPreview content={q.correctAnswer} placeholder={null} />
                                                        </div>
                                                    </div>
                                                )}
                                                {q.feedback && (
                                                    <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200">
                                                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-[0.1em] mb-2">Müəllim rəyi</p>
                                                        <p className="text-[var(--ink-800)] italic leading-relaxed">{q.feedback}</p>
                                                    </div>
                                                )}

                                                {/* Teacher/Admin grading panel for OPEN_MANUAL.
                                                   For a collab section teacher, backend returns
                                                   gradableQuestionIds: only ids inside their
                                                   subject assignment. Falling back to "true"
                                                   for non-collab exams (legacy responses without
                                                   the field) keeps the regular teacher flow. */}
                                                {canGrade && q.questionType === 'OPEN_MANUAL'
                                                    && (!review.gradableQuestionIds || review.gradableQuestionIds.includes(q.id))
                                                    && (() => {
                                                    const currentFraction = q.isGraded && q.points > 0
                                                        ? Math.round((q.awardedScore / q.points) * 6) / 6 // snap to nearest 1/6
                                                        : null;
                                                    // Find the closest fraction option
                                                    const fracOptions = [0, 1/3, 1/2, 2/3, 1];
                                                    const snappedFraction = currentFraction !== null
                                                        ? fracOptions.reduce((best, f) => Math.abs(f - currentFraction) < Math.abs(best - currentFraction) ? f : best, fracOptions[0])
                                                        : null;
                                                    return (
                                                        <>
                                                            {q.isGraded && (
                                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-soft)] border border-[var(--brand-green-100)] rounded-2xl">
                                                                    <HiOutlineCheckCircle className="w-4 h-4 text-[var(--brand-green-600)] shrink-0" />
                                                                    <span className="text-[13.5px] text-[var(--brand-green-600)] font-bold">
                                                                        Verilmiş bal: {fmtScore(q.awardedScore)} / {q.points}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <GradingPanel
                                                                key={`${q.id}-${q.awardedScore}`}
                                                                question={q}
                                                                submissionId={sessionId}
                                                                onGraded={handleGraded}
                                                                initialFraction={snappedFraction}
                                                                initialFeedback={q.feedback || ''}
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Fill In The Blank */}
                                        {q.questionType === 'FILL_IN_THE_BLANK' && (() => {
                                            let correctAnswers = [];
                                            let studentAnswers = [];
                                            try {
                                                const p = JSON.parse(q.correctAnswer || '[]');
                                                if (Array.isArray(p)) correctAnswers = p;
                                            } catch (e) {}
                                            try {
                                                const p = JSON.parse(q.studentAnswerText || '[]');
                                                if (Array.isArray(p)) studentAnswers = p;
                                            } catch (e) {}
                                            return (
                                                <div className="flex flex-col gap-2.5">
                                                    <p className="text-[11px] font-bold text-[var(--ink-400)] uppercase tracking-[0.1em] mb-1">Boşluq nəticələri</p>
                                                    {correctAnswers.map((correct, i) => {
                                                        const student = studentAnswers[i] || '';
                                                        const isCorrect = correct.trim().toLowerCase() === student.trim().toLowerCase();
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${
                                                                    isCorrect ? 'bg-[var(--accent-soft)] border-[var(--brand-green-600)]' : 'bg-red-50 border-red-400'
                                                                }`}
                                                            >
                                                                <span className="text-[12px] font-bold text-[var(--ink-500)] w-20 shrink-0 uppercase tracking-wider">Boşluq {i + 1}</span>
                                                                <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                                                                    <div className="min-w-0 break-words">
                                                                        <p className="text-[10.5px] text-[var(--ink-400)] mb-1 font-bold uppercase tracking-wider">Şagird</p>
                                                                        <div className={`font-semibold ${student ? 'text-[var(--ink-900)]' : 'text-[var(--ink-400)] italic'}`}>
                                                                            {student ? <ChipContent text={student} /> : '[boş]'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="min-w-0 break-words">
                                                                        <p className="text-[10.5px] text-[var(--ink-400)] mb-1 font-bold uppercase tracking-wider">Düzgün</p>
                                                                        <div className="font-semibold text-[var(--brand-green-600)]"><ChipContent text={correct} /></div>
                                                                    </div>
                                                                </div>
                                                                {isCorrect ? (
                                                                    <span className="w-7 h-7 rounded-full bg-[var(--brand-green-600)] text-white inline-flex items-center justify-center shrink-0">
                                                                        <HiOutlineCheckCircle className="w-4 h-4" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="w-7 h-7 rounded-full bg-red-500 text-white inline-flex items-center justify-center shrink-0 font-bold text-[13px]">
                                                                        ✕
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* Matching */}
                                        {q.questionType === 'MATCHING' && <MatchingReview q={q} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* All graded message */}
                {canGrade && showOnlyUngraded && displayedQuestions.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[var(--ink-200)] mt-5">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent-soft)] text-[var(--brand-green-600)] flex items-center justify-center mb-4">
                            <HiOutlineCheckCircle className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-[var(--ink-900)] text-[16px]">Bütün açıq suallar yoxlanılıb!</p>
                        <p className="text-[13.5px] text-[var(--ink-500)] mt-1 mb-5">Filteri söndürərək bütün sualları görə bilərsiniz.</p>
                        <button
                            onClick={() => setShowOnlyUngraded(false)}
                            className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                        >
                            Bütün sualları göstər
                        </button>
                    </div>
                )}

                {/* Bottom action bar */}
                {displayedQuestions.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <button
                            disabled
                            aria-disabled="true"
                            title="Tezliklə əlavə ediləcək"
                            className="relative h-12 px-5 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-400)] bg-white border border-[var(--ink-200)] cursor-not-allowed opacity-70"
                        >
                            <HiOutlineDownload className="w-4 h-4" />
                            PDF olaraq yüklə
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--ink-100)] text-[var(--ink-500)]">
                                <HiOutlineLockClosed className="w-3 h-3" />
                            </span>
                        </button>
                        {canGrade && (
                            nextSessionId ? (
                                <button
                                    onClick={() => navigate(`/test/review/${nextSessionId}`, { replace: true })}
                                    className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    Növbəti şagird
                                    <HiOutlineArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    disabled
                                    title="Bu, son şagirddir"
                                    className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-bold text-[var(--ink-400)] bg-[var(--ink-100)] border border-[var(--ink-200)] cursor-not-allowed"
                                >
                                    Növbəti şagird
                                    <HiOutlineArrowRight className="w-4 h-4" />
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamReview;
