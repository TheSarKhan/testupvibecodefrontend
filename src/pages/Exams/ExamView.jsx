import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilAlt, HiOutlineClock, HiOutlineDocumentText, HiOutlineCheckCircle } from 'react-icons/hi';
import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';

const STATUS_LABELS = {
    PUBLISHED: 'Aktiv',
    CANCELLED: 'Bağlı',
    DRAFT: 'Qaralama',
};

const ExamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExamDetails();
    }, [id]);

    const fetchExamDetails = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExam(data);
        } catch (error) {
            const msg = error.response?.status === 404
                ? 'Belə bir imtahan tapılmadı'
                : (error.response?.data?.message || 'İmtahan yüklənmədi');
            toast.error(msg);
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{exam.title}</h1>
                            <p className="text-xs text-gray-500">ID: {exam.id} | {(exam.subjects || []).join(', ') || exam.subject}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            Statistika
                        </button>
                        <button
                            onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                            Düzəliş et
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main mt-8">
                {/* Exam Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineClock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Müddət</p>
                            <p className="text-lg font-bold text-gray-900">{exam.durationMinutes} dəqiqə</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <HiOutlineDocumentText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sual sayı</p>
                            <p className="text-lg font-bold text-gray-900">{(exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0)} ədəd</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <HiOutlineCheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-lg font-bold text-gray-900">{STATUS_LABELS[exam.status] ?? exam.status}</p>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Suallar
                    </h2>

                    {(() => {
                        // Combine all questions: standalone + passage questions, sorted by orderIndex
                        const allQuestions = [
                            ...(exam.questions || []),
                            ...(exam.passages || []).flatMap(p => p.questions || [])
                        ].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

                        return allQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Sual {idx + 1} • {q.points} Bal
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">{q.questionType}</span>
                                    </div>

                                    {q.questionType !== 'FILL_IN_THE_BLANK' && (
                                        <div className="text-lg text-gray-800 mb-6">
                                            <LatexPreview content={q.content} />
                                        </div>
                                    )}

                                    {q.attachedImage && (
                                        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 inline-block">
                                            <img
                                                src={q.attachedImage}
                                                alt="Sual şəkli"
                                                className="max-w-full h-auto max-h-[600px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                                                onClick={() => window.open(q.attachedImage, '_blank')}
                                                title="Şəkli tam ölçüdə açmaq üçün klikləyin"
                                            />
                                        </div>
                                    )}

                                    {/* Options (MCQ / TRUE_FALSE / MULTI_SELECT) */}
                                    {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MULTI_SELECT') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {q.options?.map((opt, oIdx) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-4 rounded-xl border flex items-center gap-3 ${opt.isCorrect ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-100 bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-white border border-inherit flex items-center justify-center font-bold text-xs">
                                                        {String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex flex-col gap-2">
                                                            <LatexPreview content={opt.content} />
                                                            {opt.attachedImage && (
                                                                <div className="mt-1 rounded-lg overflow-hidden border border-gray-100 inline-block w-fit">
                                                                    <img src={opt.attachedImage} alt="Variant şəkli" className="max-h-48 object-contain" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {opt.isCorrect && <HiOutlineCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Fill In The Blank */}
                                    {q.questionType === 'FILL_IN_THE_BLANK' && (() => {
                                        const parts = (q.content || '').split('___');
                                        let correctAnswers = [];
                                        try {
                                            correctAnswers = JSON.parse(q.correctAnswer || '[]');
                                        } catch (e) {}

                                        return (
                                            <div className="space-y-4">
                                                <div className="text-lg text-gray-800 leading-relaxed">
                                                    {parts.map((part, i) => (
                                                        <span key={i}>
                                                            {part && <LatexPreview content={part} />}
                                                            {i < parts.length - 1 && (
                                                                <span className="inline-flex items-center justify-center mx-2 min-w-[100px] h-8 px-3 rounded-lg border-2 border-solid border-green-400 bg-green-50 text-green-700 text-sm font-semibold">
                                                                    {correctAnswers[i] || '___'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>

                                                {correctAnswers.length > 0 && (
                                                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                                        <p className="text-sm text-green-700 font-semibold mb-3">✓ Düzgün Cavablar:</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {correctAnswers.map((answer, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="font-semibold text-gray-800">{answer}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {q.options && q.options.length > 0 && (
                                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                        <p className="text-sm text-blue-700 font-semibold mb-3">Seçimlər:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.options.map(opt => (
                                                                <span key={opt.id} className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                                                                    {opt.content}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Matching */}
                                    {q.questionType === 'MATCHING' && (() => {
                                        const leftItems = [...new Set(q.matchingPairs?.map(p => p.leftItem) || [])];
                                        const rightItems = [...new Set(q.matchingPairs?.map(p => p.rightItem) || [])].sort();
                                        const correctPairs = {};
                                        q.matchingPairs?.forEach(p => {
                                            if (!correctPairs[p.leftItem]) correctPairs[p.leftItem] = [];
                                            correctPairs[p.leftItem].push(p.rightItem);
                                        });

                                        return (
                                            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                                                <p className="text-sm font-semibold text-purple-700 mb-4">Uyğunluq Cütləri:</p>
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Left Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">Sol tərəf</p>
                                                        {leftItems.map((item, idx) => (
                                                            <div
                                                                key={`left-${idx}`}
                                                                className="p-4 bg-white rounded-lg border-2 border-purple-200 text-gray-800 font-medium text-center"
                                                            >
                                                                <LatexPreview content={item} />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Right Column */}
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">Sağ tərəf</p>
                                                        {rightItems.map((item, idx) => (
                                                            <div
                                                                key={`right-${idx}`}
                                                                className="p-4 bg-white rounded-lg border-2 border-purple-200 text-gray-800 font-medium text-center"
                                                            >
                                                                <LatexPreview content={item} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Show Correct Pairs */}
                                                <div className="mt-6 pt-6 border-t border-purple-200">
                                                    <p className="text-sm font-semibold text-green-700 mb-3">✓ Düzgün Uyğunluqlar:</p>
                                                    <div className="space-y-2">
                                                        {Object.entries(correctPairs).map(([left, rights], idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                                                            >
                                                                <span className="font-medium text-gray-800">
                                                                    <LatexPreview content={left} />
                                                                </span>
                                                                <span className="text-green-600 font-bold">↔</span>
                                                                <span className="font-medium text-green-700">
                                                                    <LatexPreview content={rights[0]} />
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Open Ended */}
                                    {q.questionType === 'OPEN_AUTO' && (
                                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <p className="text-sm text-indigo-700 font-semibold mb-2">Nümunəvi Cavab:</p>
                                            <div className="text-gray-800">
                                                <LatexPreview content={q.correctAnswer} />
                                            </div>
                                        </div>
                                    )}
                                    {q.questionType === 'OPEN_MANUAL' && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <p className="text-sm text-amber-700 font-semibold mb-2">Müəllim tərəfindən yoxlanılır</p>
                                            {q.correctAnswer ? (
                                                <div className="text-gray-800">
                                                    <LatexPreview content={q.correctAnswer} />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-amber-600 italic">Nümunəvi cavab göstərilməyib</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default ExamView;
