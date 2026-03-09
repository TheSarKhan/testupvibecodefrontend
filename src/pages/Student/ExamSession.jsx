import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineClock, HiOutlineChevronRight, HiOutlineChevronLeft, HiExclamation } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';

const ExamSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState([]); // Array of { questionId, optionIds, textAnswer, matchingPairs }
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSessionDetails();
    }, [sessionId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft]);

    const fetchSessionDetails = async () => {
        try {
            const { data } = await api.get(`/submissions/${sessionId}/session`);
            setSessionData(data);
            
            // Initialize answers array
            const initialAnswers = data.questions.map(q => ({
                questionId: q.id,
                optionIds: [],
                textAnswer: '',
                matchingPairs: []
            }));
            setAnswers(initialAnswers);

            if (data.durationMinutes) {
                // Calculate time left
                const startTime = new Date(data.startedAt).getTime();
                const now = new Date().getTime();
                const diffSeconds = Math.floor((now - startTime) / 1000);
                const durationSeconds = data.durationMinutes * 60;
                const remaining = durationSeconds - diffSeconds;

                if (remaining <= 0) {
                    toast.error("İmtahan vaxtı bitib!");
                    navigate('/imtahanlar');
                } else {
                    setTimeLeft(remaining);
                }
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Sessiya tapılmadı");
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, newAnswerData) => {
        setAnswers(prev => prev.map(ans => 
            ans.questionId === questionId ? { ...ans, ...newAnswerData } : ans
        ));
    };

    const handleAutoSubmit = () => {
        toast.error("Vaxt bitdi! İmtahan avtomatik təhvil verilir.");
        submitExam(answers);
    };

    const handleManualSubmit = () => {
        if (window.confirm("İmtahanı bitirmək istədiyinizə əminsiniz?")) {
            submitExam(answers);
        }
    };

    const submitExam = async (currentAnswers) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(`/submissions/${sessionId}/submit`, {
                answers: currentAnswers
            });
            toast.success("İmtahan uğurla təhvil verildi!");
            navigate(`/test/result/${sessionId}`, { state: { submission: data } });
        } catch (error) {
            toast.error(error.response?.data?.message || "Təhvil verərkən xəta baş verdi");
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentQuestion = sessionData?.questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!sessionData || !currentQuestion) return null;

    // Determine Question Component Handlers based on questionType...
    // (A more thorough implementation would split these into small components)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Timer block */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{sessionData.examTitle}</h1>
                        <p className="text-sm text-gray-500">Sual {currentQuestionIndex + 1} / {sessionData.questions.length}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {timeLeft !== null && (
                            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-800'}`}>
                                <HiOutlineClock className="w-6 h-6" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        <button
                            onClick={handleManualSubmit}
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-70"
                        >
                            {isSubmitting ? 'Göndərilir...' : 'İmtahanı Bitir'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main flex-1 py-8 max-w-4xl mx-auto w-full">
                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                                {currentQuestion.points} Bal
                            </span>
                            <span className="text-sm text-gray-400 font-mono">{currentQuestion.questionType}</span>
                        </div>

                        <div className="prose max-w-none text-xl text-gray-800 mb-8">
                            <LatexPreview content={currentQuestion.content} />
                        </div>

                        {currentQuestion.attachedImage && (
                            <div className="mb-8 rounded-lg overflow-hidden border border-gray-200 inline-block">
                                <img
                                    src={currentQuestion.attachedImage}
                                    alt="Sual"
                                    className="max-w-full h-auto max-h-96"
                                />
                            </div>
                        )}

                        {/* Options / Input based on question type */}
                        <div className="mt-8">
                            
                            {(currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'TRUE_FALSE') && (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((opt, oIdx) => {
                                        const isSelected = currentAnswer.optionIds.includes(opt.id);
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => handleAnswerChange(currentQuestion.id, { optionIds: [opt.id] })}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                                                } flex items-center gap-4`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    isSelected ? 'border-indigo-600' : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
                                                </div>
                                                <div className="flex-1 text-lg">
                                                    <LatexPreview content={opt.content} />
                                                    {opt.attachedImage && (
                                                        <img src={opt.attachedImage} className="mt-2 max-h-32 rounded border" alt="Varyant" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {(currentQuestion.questionType === 'OPEN_AUTO' || currentQuestion.questionType === 'OPEN_MANUAL') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cavabınızı daxil edin:</label>
                                    <textarea
                                        rows={4}
                                        value={currentAnswer.textAnswer || ''}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg"
                                        placeholder="Bura yazın..."
                                    />
                                </div>
                            )}

                            {currentQuestion.questionType === 'MATCHING' && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-3">
                                    <HiExclamation className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-yellow-800 text-sm">
                                        Uyğunlaşdırma suallarının interfeysi bu versiyada tam dəstəklənmir. (Gələcək yeniləmələrdə əlavə ediləcək)
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                    
                    {/* Navigation Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            <HiOutlineChevronLeft className="w-5 h-5" />
                            Əvvəlki
                        </button>
                        
                        <div className="hidden sm:flex items-center gap-2">
                            {sessionData.questions.map((q, idx) => {
                                const hasAnswer = answers[idx]?.optionIds?.length > 0 || answers[idx]?.textAnswer?.trim();
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                                            currentQuestionIndex === idx 
                                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1' 
                                                : hasAnswer 
                                                    ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
                                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(sessionData.questions.length - 1, prev + 1))}
                            disabled={currentQuestionIndex === sessionData.questions.length - 1}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            Növbəti
                            <HiOutlineChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamSession;
