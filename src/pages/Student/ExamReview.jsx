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
                                    <div className="p-5 bg-gray-50 rounded-full text-center text-gray-500 font-medium">
                                        Uyğunlaşdırma sualı üçün detallı baxış hazırlanır. Toplanan bal: {q.awardedScore}
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
