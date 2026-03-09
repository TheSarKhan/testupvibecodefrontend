import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';

const ExamReview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const { data } = await api.get(`/submissions/${sessionId}/review`);
                setReview(data);
            } catch (error) {
                console.error("Error fetching review:", error);
                toast.error("İmtahan nəticələrini yükləyərkən xəta baş verdi");
                navigate('/profil');
            } finally {
                setLoading(false);
            }
        };

        fetchReview();
    }, [sessionId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!review) return null;

    const scorePercent = Math.round((review.totalScore / review.maxScore) * 100);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30">
                <div className="container-main py-4 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/profil')}
                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                    >
                        <HiOutlineArrowLeft /> Profilə Qayıt
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-gray-900">{review.examTitle}</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-0.5">İmtahan Baxışı</p>
                    </div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </div>

            <div className="container-main max-w-4xl mt-8">
                {/* Summary Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-gray-100"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
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
                            <p className="text-2xl font-black text-indigo-700">{review.totalScore} / {review.maxScore}</p>
                        </div>
                        <div className="bg-purple-50/50 p-4 rounded-2xl">
                            <p className="text-xs text-purple-400 font-bold uppercase mb-1">Tarix</p>
                            <p className="text-lg font-bold text-purple-700">
                                {new Date(review.submittedAt).toLocaleDateString('az-AZ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {review.questions.sort((a,b) => a.orderIndex - b.orderIndex).map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                        Sual {idx + 1} • {q.points} Bal
                                    </span>
                                    {q.isGraded ? (
                                        q.awardedScore === q.points ? (
                                            <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                                                <HiOutlineCheckCircle className="w-5 h-5" /> Düzdür
                                            </span>
                                        ) : q.awardedScore > 0 ? (
                                            <span className="flex items-center gap-1.5 text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full">
                                                Yarımçıq Düz
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                                                <HiOutlineXCircle className="w-5 h-5" /> Səhvdir
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full">
                                            Yoxlanılır...
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

                                {/* Options (MCQ / True-False) */}
                                {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE') && (
                                    <div className="grid gap-3">
                                        {q.options.map(opt => {
                                            const isSelected = q.studentSelectedOptionId === opt.id;
                                            const isCorrect = opt.isCorrect;
                                            
                                            let borderClass = "border-gray-100";
                                            let bgClass = "bg-gray-50/30";
                                            let icon = null;

                                            if (isCorrect) {
                                                borderClass = "border-green-500 ring-1 ring-green-500";
                                                bgClass = "bg-green-50";
                                                icon = <HiOutlineCheckCircle className="text-green-500 w-5 h-5" />;
                                            } else if (isSelected && !isCorrect) {
                                                borderClass = "border-red-500 ring-1 ring-red-500";
                                                bgClass = "bg-red-50";
                                                icon = <HiOutlineXCircle className="text-red-500 w-5 h-5" />;
                                            }

                                            return (
                                                <div 
                                                    key={opt.id} 
                                                    className={`p-4 rounded-2xl border ${borderClass} ${bgClass} flex items-center justify-between gap-4 transition-all`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                                                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-400'
                                                        }`}>
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
                                            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Sizin Cavabınız:</p>
                                            <p className="text-gray-800 font-medium whitespace-pre-wrap">{q.studentAnswerText || '[Cavab verilməyib]'}</p>
                                        </div>
                                        {q.isGraded && q.correctAnswer && (
                                            <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                                                <p className="text-xs font-bold text-green-500 uppercase mb-2">Düzgün Cavab:</p>
                                                <p className="text-gray-800 font-medium whitespace-pre-wrap">{q.correctAnswer}</p>
                                            </div>
                                        )}
                                        {q.feedback && (
                                            <div className="p-5 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                                                <p className="text-xs font-bold text-yellow-600 uppercase mb-2">Müəllim Rəyi:</p>
                                                <p className="text-gray-800 italic">{q.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Matching Questions - Simplification for now, showing awarded score */}
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
                                                    
                                                    return leftNodes.map((pair) => {
                                                        let studentMatches = [];
                                                        try { if (q.studentMatchingAnswerJson) studentMatches = JSON.parse(q.studentMatchingAnswerJson); } catch(e) {}
                                                        
                                                        // A node is "active" if it has any student matches
                                                        const selection = studentMatches.some(m => m.leftItemId === pair.id || (pair.leftVisualId && studentMatches.some(sm => {
                                                            const pDetail = q.matchingPairs.find(pp => pp.id === sm.leftItemId);
                                                            return pDetail && pDetail.leftVisualId === pair.leftVisualId;
                                                        })));

                                                        return (
                                                            <div
                                                                key={`review-left-${pair.id}`}
                                                                id={`review-left-${pair.leftVisualId || pair.id}`}
                                                                className={`p-3 rounded-xl border-2 text-sm font-medium border-gray-100 bg-gray-50`}
                                                            >
                                                                <LatexPreview content={pair.leftItem} />
                                                                {pair.attachedImageLeft && (
                                                                    <div className="mt-2">
                                                                        <img src={pair.attachedImageLeft} alt="" className="max-h-32 rounded-lg mx-auto" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>

                                            {/* Right Column */}
                                            <div className="flex-1 space-y-12 z-10">
                                                {(() => {
                                                    const rightNodes = [];
                                                    [...q.matchingPairs]
                                                        .filter(p => p.rightItem !== null)
                                                        .sort((a, b) => (a.rightItem || '').localeCompare(b.rightItem || ''))
                                                        .forEach(p => {
                                                            if (!p.rightVisualId || !rightNodes.some(n => n.rightVisualId === p.rightVisualId)) {
                                                                rightNodes.push(p);
                                                            }
                                                        });
                                                    
                                                    return rightNodes.map((pair) => {
                                                        return (
                                                            <div
                                                                key={`review-right-${pair.id}`}
                                                                id={`review-right-${pair.rightVisualId || pair.id}`}
                                                                className={`p-3 rounded-xl border-2 text-sm font-medium border-gray-100 bg-gray-50`}
                                                            >
                                                                <LatexPreview content={pair.rightItem} />
                                                                {pair.attachedImageRight && (
                                                                    <div className="mt-2">
                                                                        <img src={pair.attachedImageRight} alt="" className="max-h-32 rounded-lg mx-auto" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>

                                            {/* SVG Arrows Layer for Review */}
                                            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible" style={{ zIndex: 5 }}>
                                                <defs>
                                                    <marker id="arrowhead-correct" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                                                    </marker>
                                                    <marker id="arrowhead-incorrect" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                                                    </marker>
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
                                                        
                                                        const x1 = lRect.right - rect.left;
                                                        const y1 = lRect.top + lRect.height / 2 - rect.top;
                                                        const x2 = rRect.left - rect.left;
                                                        const y2 = rRect.top + rRect.height / 2 - rect.top;
                                                        
                                                        // Correctness check: Does this exact link (by content/visual identity) exist in q.matchingPairs?
                                                        const isCorrectLink = q.matchingPairs.some(pp => 
                                                            pp.leftItem === pairL.leftItem && 
                                                            pp.rightItem === pairR.rightItem &&
                                                            (pp.attachedImageLeft === pairL.attachedImageLeft) &&
                                                            (pp.attachedImageRight === pairR.attachedImageRight)
                                                        );

                                                        return (
                                                            <path
                                                                key={`review-path-${idx}`}
                                                                d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                                                                stroke={isCorrectLink ? '#10b981' : '#ef4444'}
                                                                strokeWidth="3"
                                                                fill="none"
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExamReview;
