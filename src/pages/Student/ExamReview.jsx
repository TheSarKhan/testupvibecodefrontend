import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineDocumentText, HiOutlinePencil, HiOutlineFilter } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';

const fmtScore = (v) => {
    if (v === null || v === undefined) return '0';
    const n = Math.round(v * 100) / 100;
    return n % 1 === 0 ? n.toString() : n.toFixed(2);
};

// ---- GradingPanel ----
const GradingPanel = ({ question, submissionId, onGraded }) => {
    const [fraction, setFraction] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    const fractions = [
        { value: 0, label: '0 bal' },
        { value: 1 / 3, label: '1/3 bal' },
        { value: 2 / 3, label: '2/3 bal' },
        { value: 1, label: 'Tam bal' },
    ];

    const handleSave = async () => {
        if (fraction === null) { toast.error('Bal seçin'); return; }
        setSaving(true);
        try {
            await api.post(`/submissions/${submissionId}/grade-answer`, {
                questionId: question.id,
                fraction,
                feedback: feedback.trim() || null
            });
            toast.success('Bal qeydə alındı');
            onGraded(question.id, fraction * question.points, feedback.trim());
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1">
                <HiOutlinePencil className="w-4 h-4" /> Bal ver ({question.points} bal)
            </p>
            <div className="flex flex-wrap gap-2">
                {fractions.map(f => (
                    <button
                        key={f.value}
                        type="button"
                        onClick={() => setFraction(f.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                            fraction === f.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400'
                        }`}
                    >
                        {f.label}
                        {fraction === f.value && <span className="ml-1 text-xs opacity-75">
                            ({fmtScore(f.value * question.points)})
                        </span>}
                    </button>
                ))}
            </div>
            <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Şagirdə rəy (istəyə bağlı)..."
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                rows={2}
            />
            <button
                onClick={handleSave}
                disabled={saving || fraction === null}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
                {saving ? 'Saxlanılır...' : 'Balı Qeydə Al'}
            </button>
        </div>
    );
};

// ---- Main ExamReview ----
const ExamReview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { isTeacher } = useAuth();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnlyUngraded, setShowOnlyUngraded] = useState(false);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const { data } = await api.get(`/submissions/${sessionId}/review`);
                setReview(data);
                // Default: teacher sees only ungraded if there are any
                if (data.ungradedCount > 0) setShowOnlyUngraded(true);
            } catch (error) {
                console.error("Error fetching review:", error);
                toast.error("İmtahan nəticələrini yükləyərkən xəta baş verdi");
                navigate(isTeacher ? '/imtahanlar' : '/profil');
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [sessionId, navigate]);

    const handleGraded = (questionId, awardedScore, feedbackText) => {
        setReview(prev => {
            const updatedQuestions = prev.questions.map(q =>
                q.id === questionId
                    ? { ...q, isGraded: true, awardedScore, feedback: feedbackText || q.feedback }
                    : q
            );
            const newUngradedCount = updatedQuestions.filter(q => !q.isGraded).length;
            const newTotal = updatedQuestions.reduce((sum, q) => sum + (q.awardedScore || 0), 0);
            if (newUngradedCount === 0) setShowOnlyUngraded(false);
            return {
                ...prev,
                questions: updatedQuestions,
                ungradedCount: newUngradedCount,
                isFullyGraded: newUngradedCount === 0,
                totalScore: newTotal
            };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!review) return null;

    const scorePercent = review.maxScore > 0 ? Math.round((review.totalScore / review.maxScore) * 100) : 0;
    const sortedQuestions = [...review.questions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    const displayedQuestions = showOnlyUngraded
        ? sortedQuestions.filter(q => !q.isGraded)
        : sortedQuestions;

    // Track which passageIds we've already shown a separator for
    const shownPassageIds = new Set();
    let questionNumber = 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30">
                <div className="container-main py-4 flex items-center justify-between">
                    <button
                        onClick={() => isTeacher ? navigate(`/imtahanlar/${review.examId}/statistika`) : navigate('/profil')}
                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                    >
                        <HiOutlineArrowLeft /> {isTeacher ? 'Statistikaya Qayıt' : 'Profilə Qayıt'}
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-gray-900">{review.examTitle}</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-0.5">İmtahan Baxışı</p>
                    </div>
                    <div className="w-32"></div>
                </div>
            </div>

            <div className="container-main max-w-4xl mt-8">
                {/* Summary Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * scorePercent) / 100}
                                className={scorePercent >= 80 ? 'text-green-500' : scorePercent >= 50 ? 'text-yellow-500' : 'text-red-500'}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-gray-900">{scorePercent}%</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl">
                            <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Toplanan Bal</p>
                            <p className="text-2xl font-black text-indigo-700">{fmtScore(review.totalScore)} / {review.maxScore}</p>
                        </div>
                        <div className="bg-purple-50/50 p-4 rounded-2xl">
                            <p className="text-xs text-purple-400 font-bold uppercase mb-1">Tarix</p>
                            <p className="text-lg font-bold text-purple-700">
                                {new Date(review.submittedAt).toLocaleDateString('az-AZ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ungraded count banner (student) */}
                {!isTeacher && review.ungradedCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="font-bold text-yellow-800">{review.ungradedCount} sual hələ yoxlanılmayıb</p>
                            <p className="text-sm text-yellow-700">Müəllim yoxladıqdan sonra balınız yenilənəcək.</p>
                        </div>
                    </div>
                )}

                {/* Teacher filter toggle */}
                {isTeacher && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {review.ungradedCount > 0 && (
                                <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full">
                                    {review.ungradedCount} yoxlanılmamış
                                </span>
                            )}
                            {review.isFullyGraded && (
                                <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <HiOutlineCheckCircle className="w-4 h-4" /> Tam yoxlanılıb
                                </span>
                            )}
                        </div>
                        {review.ungradedCount > 0 && (
                            <button
                                onClick={() => setShowOnlyUngraded(v => !v)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                    showOnlyUngraded
                                        ? 'bg-yellow-500 text-white border-yellow-500'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400'
                                }`}
                            >
                                <HiOutlineFilter className="w-4 h-4" />
                                {showOnlyUngraded ? 'Bütün Sualları Göstər' : 'Yalnız Yoxlanılmayanlar'}
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

                        return (
                            <div key={q.id}>
                                {/* Passage group separator */}
                                {showPassageSeparator && (
                                    <div className="flex items-center gap-2 mt-6 mb-2 px-1">
                                        <HiOutlineDocumentText className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                        <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Mətn / Dinləmə Keçidinə Aid Suallar</span>
                                        <div className="flex-1 h-px bg-teal-100"></div>
                                    </div>
                                )}

                                <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${isPassageQuestion ? 'border-teal-100' : 'border-gray-100'}`}>
                                    <div className="p-6 md:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                                Sual {questionNumber} • {q.points} Bal
                                            </span>
                                            {q.isGraded ? (
                                                q.awardedScore === q.points ? (
                                                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                                                        <HiOutlineCheckCircle className="w-5 h-5" /> Düzdür
                                                    </span>
                                                ) : q.awardedScore > 0 ? (
                                                    <span className="flex items-center gap-1.5 text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full">
                                                        Qismən • {fmtScore(q.awardedScore)}/{q.points}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                                                        <HiOutlineXCircle className="w-5 h-5" /> Səhvdir
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full">
                                                    ⏳ Yoxlanılır...
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-lg text-gray-800 font-medium mb-6 leading-relaxed">
                                            <LatexPreview content={q.content} />
                                        </div>

                                        {q.attachedImage && (
                                            <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 max-h-96 flex justify-center">
                                                <img src={q.attachedImage} alt="Question" className="object-contain" />
                                            </div>
                                        )}

                                        {/* Options (MCQ / True-False / Multi-Select) */}
                                        {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MULTI_SELECT') && (
                                            <div className="grid gap-3">
                                                {q.options.map(opt => {
                                                    const isSelected = q.questionType === 'MULTI_SELECT'
                                                        ? (q.studentSelectedOptionIds || []).includes(opt.id)
                                                        : q.studentSelectedOptionId === opt.id;
                                                    const isCorrect = opt.isCorrect;

                                                    let borderClass = "border-gray-100";
                                                    let bgClass = "bg-gray-50/30";
                                                    let icon = null;

                                                    if (isCorrect) {
                                                        borderClass = "border-green-500 ring-1 ring-green-500";
                                                        bgClass = "bg-green-50";
                                                        icon = <HiOutlineCheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />;
                                                    } else if (isSelected && !isCorrect) {
                                                        borderClass = "border-red-500 ring-1 ring-red-500";
                                                        bgClass = "bg-red-50";
                                                        icon = <HiOutlineXCircle className="text-red-500 w-5 h-5 flex-shrink-0" />;
                                                    }

                                                    return (
                                                        <div key={opt.id} className={`p-4 rounded-2xl border ${borderClass} ${bgClass} flex items-center justify-between gap-4 transition-all`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 border flex items-center justify-center text-xs font-bold ${q.questionType === 'MULTI_SELECT' ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                                                                    {String.fromCharCode(65 + opt.orderIndex)}
                                                                </div>
                                                                <div className="text-gray-700 font-medium">
                                                                    <LatexPreview content={opt.content} />
                                                                </div>
                                                            </div>
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Open Questions */}
                                        {(q.questionType === 'OPEN_AUTO' || q.questionType === 'OPEN_MANUAL') && (
                                            <div className="space-y-4">
                                                <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                                    <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Şagirdin Cavabı:</p>
                                                    {q.studentAnswerText ? (
                                                        <div className="text-gray-800 font-medium">
                                                            <LatexPreview content={q.studentAnswerText} />
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-400 italic">[Mətn cavabı yoxdur]</p>
                                                    )}
                                                    {q.studentAnswerImage && (
                                                        <div className="mt-3">
                                                            <img src={q.studentAnswerImage} alt="Şagird cavab şəkli" className="max-h-64 rounded-xl border border-indigo-100" />
                                                        </div>
                                                    )}
                                                    {!q.studentAnswerText && !q.studentAnswerImage && (
                                                        <p className="text-gray-400 italic mt-1">[Cavab verilməyib]</p>
                                                    )}
                                                </div>
                                                {/* OPEN_AUTO: show correct answer after grading; OPEN_MANUAL: always show to teacher */}
                                                {q.correctAnswer && (q.isGraded || (isTeacher && q.questionType === 'OPEN_MANUAL')) && (
                                                    <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                                                        <p className="text-xs font-bold text-green-500 uppercase mb-2">
                                                            {q.questionType === 'OPEN_AUTO' ? 'Düzgün Cavab:' : 'İstinad Cavab (Müəllim):'}
                                                        </p>
                                                        <div className="text-gray-800 font-medium">
                                                            <LatexPreview content={q.correctAnswer} />
                                                        </div>
                                                    </div>
                                                )}
                                                {q.feedback && (
                                                    <div className="p-5 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                                                        <p className="text-xs font-bold text-yellow-600 uppercase mb-2">Müəllim Rəyi:</p>
                                                        <p className="text-gray-800 italic">{q.feedback}</p>
                                                    </div>
                                                )}

                                                {/* Teacher grading panel for ungraded OPEN_MANUAL */}
                                                {isTeacher && q.questionType === 'OPEN_MANUAL' && !q.isGraded && (
                                                    <GradingPanel
                                                        question={q}
                                                        submissionId={sessionId}
                                                        onGraded={handleGraded}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Matching */}
                                        {q.questionType === 'MATCHING' && (
                                            <div className="space-y-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Uyğunluq Nəticələri:</p>
                                                <div className="relative flex justify-between gap-40 py-8">
                                                    <div className="flex-1 space-y-12 z-10">
                                                        {(() => {
                                                            const leftNodes = [];
                                                            q.matchingPairs.forEach(p => {
                                                                if (p.leftItem !== null && (!p.leftVisualId || !leftNodes.some(n => n.leftVisualId === p.leftVisualId))) {
                                                                    leftNodes.push(p);
                                                                }
                                                            });
                                                            return leftNodes.map((pair) => (
                                                                <div key={`review-left-${pair.id}`} id={`review-left-${pair.leftVisualId || pair.id}`} className="p-3 rounded-xl border-2 text-sm font-medium border-gray-100 bg-gray-50">
                                                                    <LatexPreview content={pair.leftItem} />
                                                                    {pair.attachedImageLeft && <div className="mt-2"><img src={pair.attachedImageLeft} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                    <div className="flex-1 space-y-12 z-10">
                                                        {(() => {
                                                            const rightNodes = [];
                                                            [...q.matchingPairs].filter(p => p.rightItem !== null).sort((a, b) => (a.rightItem || '').localeCompare(b.rightItem || '')).forEach(p => {
                                                                if (!p.rightVisualId || !rightNodes.some(n => n.rightVisualId === p.rightVisualId)) rightNodes.push(p);
                                                            });
                                                            return rightNodes.map((pair) => (
                                                                <div key={`review-right-${pair.id}`} id={`review-right-${pair.rightVisualId || pair.id}`} className="p-3 rounded-xl border-2 text-sm font-medium border-gray-100 bg-gray-50">
                                                                    <LatexPreview content={pair.rightItem} />
                                                                    {pair.attachedImageRight && <div className="mt-2"><img src={pair.attachedImageRight} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible" style={{ zIndex: 5 }}>
                                                        <defs>
                                                            <marker id="arrowhead-correct" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#10b981" /></marker>
                                                            <marker id="arrowhead-incorrect" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
                                                        </defs>
                                                        {(() => {
                                                            let studentMatches = [];
                                                            try { if (q.studentMatchingAnswerJson) studentMatches = JSON.parse(q.studentMatchingAnswerJson); } catch(e) {}
                                                            return studentMatches.map((m, idx) => {
                                                                const pairL = q.matchingPairs.find(pp => pp.id === m.leftItemId);
                                                                const pairR = q.matchingPairs.find(pp => pp.id === m.rightItemId);
                                                                if (!pairL || !pairR) return null;
                                                                const leftEl = document.getElementById(`review-left-${pairL.leftVisualId || pairL.id}`);
                                                                const rightEl = document.getElementById(`review-right-${pairR.rightVisualId || pairR.id}`);
                                                                const container = leftEl?.closest('.relative');
                                                                if (!leftEl || !rightEl || !container) return null;
                                                                const rect = container.getBoundingClientRect();
                                                                const lRect = leftEl.getBoundingClientRect();
                                                                const rRect = rightEl.getBoundingClientRect();
                                                                const x1 = lRect.right - rect.left, y1 = lRect.top + lRect.height / 2 - rect.top;
                                                                const x2 = rRect.left - rect.left, y2 = rRect.top + rRect.height / 2 - rect.top;
                                                                const isCorrectLink = q.matchingPairs.some(pp => pp.leftItem === pairL.leftItem && pp.rightItem === pairR.rightItem);
                                                                return (
                                                                    <path key={`review-path-${idx}`}
                                                                        d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`}
                                                                        stroke={isCorrectLink ? '#10b981' : '#ef4444'}
                                                                        strokeWidth="3" fill="none"
                                                                        markerEnd={isCorrectLink ? 'url(#arrowhead-correct)' : 'url(#arrowhead-incorrect)'}
                                                                        className="opacity-70"
                                                                    />
                                                                );
                                                            });
                                                        })()}
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* All graded message */}
                {isTeacher && showOnlyUngraded && displayedQuestions.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <HiOutlineCheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                        <p className="font-semibold text-gray-700">Bütün açıq suallar yoxlanılıb!</p>
                        <button
                            onClick={() => setShowOnlyUngraded(false)}
                            className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                        >
                            Bütün Sualları Göstər
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamReview;
