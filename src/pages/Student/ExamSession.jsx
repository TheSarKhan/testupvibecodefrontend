import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineClock, HiOutlineChevronRight, HiOutlineChevronLeft, HiOutlineVolumeUp, HiOutlineDocumentText, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';
import MathTextEditor from '../../components/ui/MathTextEditor';
import MathFormulaModal from '../../components/ui/MathFormulaModal';

const ExamSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeLeftId, setActiveLeftId] = useState(null);
    // listenCounts: { [passageId]: number }
    const [listenCounts, setListenCounts] = useState({});

    useEffect(() => { fetchSessionDetails(); }, [sessionId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timerId); handleAutoSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    useEffect(() => { setActiveLeftId(null); }, [currentSectionIndex]);

    const fetchSessionDetails = async () => {
        try {
            const { data } = await api.get(`/submissions/${sessionId}/session`);
            setSessionData(data);

            // Collect all questions (standalone + passage)
            const allQuestions = [
                ...(data.questions || []),
                ...(data.passages || []).flatMap(p => p.questions || [])
            ];

            const initialAnswers = allQuestions.map(q => {
                const saved = data.savedAnswers?.find(s => s.questionId === q.id);
                return {
                    questionId: q.id,
                    optionIds: saved?.optionIds || [],
                    textAnswer: saved?.textAnswer || '',
                    answerImage: saved?.answerImage || null,
                    matchingPairs: saved?.matchingPairs || []
                };
            });
            setAnswers(initialAnswers);

            if (data.durationMinutes) {
                const startTime = new Date(data.startedAt).getTime();
                const now = new Date().getTime();
                const diffSeconds = Math.floor((now - startTime) / 1000);
                const remaining = data.durationMinutes * 60 - diffSeconds;
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

    // Build sections: interleave standalone questions and passages by orderIndex
    const buildSections = (data) => {
        if (!data) return [];
        const sectionList = [
            ...(data.questions || []).map(q => ({ kind: 'question', data: q, orderIndex: q.orderIndex ?? 0 })),
            ...(data.passages || []).map(p => ({ kind: 'passage', data: p, orderIndex: p.orderIndex ?? 0 }))
        ];
        sectionList.sort((a, b) => a.orderIndex - b.orderIndex);
        return sectionList;
    };

    const sections = buildSections(sessionData);
    const currentSection = sections[currentSectionIndex];

    const syncAnswer = async (questionId, answerData) => {
        try {
            await api.post(`/submissions/${sessionId}/save-answer`, { questionId, ...answerData });
        } catch (error) {
            console.error("Failed to sync answer:", error);
        }
    };

    const handleAnswerChange = (questionId, newAnswerData) => {
        setAnswers(prev => prev.map(ans => {
            if (ans.questionId === questionId) {
                const updated = { ...ans, ...newAnswerData };
                if (!newAnswerData.hasOwnProperty('textAnswer')) {
                    syncAnswer(questionId, updated);
                }
                return updated;
            }
            return ans;
        }));
    };

    useEffect(() => {
        const timers = answers.map(ans => {
            const timer = setTimeout(() => {
                const allQuestions = [
                    ...(sessionData?.questions || []),
                    ...(sessionData?.passages || []).flatMap(p => p.questions || [])
                ];
                const q = allQuestions.find(q => q.id === ans.questionId);
                if (q && (q.questionType === 'OPEN_AUTO' || q.questionType === 'OPEN_MANUAL')) {
                    syncAnswer(ans.questionId, ans);
                }
            }, 1000);
            return { id: ans.questionId, timer };
        });
        return () => timers.forEach(t => clearTimeout(t.timer));
    }, [answers.map(a => a.textAnswer).join('|')]);

    const handleAutoSubmit = () => {
        toast.error("Vaxt bitdi! İmtahan avtomatik təhvil verilir.");
        submitExam(answers);
    };

    const handleManualSubmit = () => {
        if (window.confirm("İmtahanı bitirmək istədiyinizə əminsiniz?")) submitExam(answers);
    };

    const submitExam = async (currentAnswers) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(`/submissions/${sessionId}/submit`, { answers: currentAnswers });
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

    const answerHasContent = (ans) =>
        ans && (ans.optionIds?.length > 0 || ans.textAnswer?.trim() || ans.answerImage || ans.matchingPairs?.length > 0);

    const sectionHasAnswer = (section) => {
        if (section.kind === 'question') {
            return answerHasContent(answers.find(a => a.questionId === section.data.id));
        }
        const passageQs = section.data.questions || [];
        if (passageQs.length === 0) return false;
        return passageQs.every(q => answerHasContent(answers.find(a => a.questionId === q.id)));
    };

    const sectionPartialAnswer = (section) => {
        if (section.kind === 'question') return false;
        const passageQs = section.data.questions || [];
        return passageQs.some(q => answerHasContent(answers.find(a => a.questionId === q.id)));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!sessionData || sections.length === 0) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{sessionData.examTitle}</h1>
                        <p className="text-sm text-gray-500">
                            Bölmə {currentSectionIndex + 1} / {sections.length}
                        </p>
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
                {/* Current Section */}
                {currentSection?.kind === 'question' && (
                    <QuestionCard
                        question={currentSection.data}
                        answer={answers.find(a => a.questionId === currentSection.data.id)}
                        onAnswerChange={handleAnswerChange}
                        activeLeftId={activeLeftId}
                        setActiveLeftId={setActiveLeftId}
                    />
                )}

                {currentSection?.kind === 'passage' && (
                    <PassageSection
                        passage={currentSection.data}
                        answers={answers}
                        onAnswerChange={handleAnswerChange}
                        activeLeftId={activeLeftId}
                        setActiveLeftId={setActiveLeftId}
                        listenCounts={listenCounts}
                        setListenCounts={setListenCounts}
                    />
                )}

                {/* Navigation Footer */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-4 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentSectionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        <HiOutlineChevronLeft className="w-5 h-5" />
                        Əvvəlki
                    </button>

                    <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center">
                        {sections.map((section, idx) => {
                            const hasAnswer = sectionHasAnswer(section);
                            const partialAnswer = sectionPartialAnswer(section);
                            const isPassage = section.kind === 'passage';
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSectionIndex(idx)}
                                    title={isPassage ? (section.data.title || (section.data.passageType === 'TEXT' ? 'Mətn' : 'Dinləmə')) : `Sual ${idx + 1}`}
                                    className={`flex items-center justify-center font-bold text-sm transition-colors rounded-lg ${
                                        isPassage ? 'w-12 h-10 px-1' : 'w-10 h-10'
                                    } ${
                                        currentSectionIndex === idx
                                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
                                            : hasAnswer
                                                ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                                                : partialAnswer
                                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {isPassage
                                        ? (section.data.passageType === 'TEXT'
                                            ? <HiOutlineDocumentText className="w-4 h-4" />
                                            : <HiOutlineVolumeUp className="w-4 h-4" />)
                                        : idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1))}
                        disabled={currentSectionIndex === sections.length - 1}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        Növbəti
                        <HiOutlineChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ---- PassageSection ----
const PassageSection = ({ passage, answers, onAnswerChange, activeLeftId, setActiveLeftId, listenCounts, setListenCounts }) => {
    const audioRef = useRef(null);
    const listenCount = listenCounts[passage.id] || 0;
    const isLimited = passage.listenLimit !== null && passage.listenLimit !== undefined;
    const limitReached = isLimited && listenCount >= passage.listenLimit;

    const handleAudioEnded = () => {
        if (isLimited) {
            setListenCounts(prev => ({ ...prev, [passage.id]: (prev[passage.id] || 0) + 1 }));
        }
    };

    const handleAudioPlay = () => {
        if (limitReached && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            toast.error(`Dinləmə limiti dolub (${passage.listenLimit} dəfə)`);
        }
    };

    return (
        <div className="space-y-4">
            {/* Passage content card */}
            <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${passage.passageType === 'TEXT' ? 'border-teal-200' : 'border-purple-200'}`}>
                <div className={`px-6 py-3 flex items-center gap-3 ${passage.passageType === 'TEXT' ? 'bg-teal-50' : 'bg-purple-50'}`}>
                    {passage.passageType === 'TEXT'
                        ? <HiOutlineDocumentText className="w-5 h-5 text-teal-600" />
                        : <HiOutlineVolumeUp className="w-5 h-5 text-purple-600" />}
                    <span className={`font-bold text-sm ${passage.passageType === 'TEXT' ? 'text-teal-700' : 'text-purple-700'}`}>
                        {passage.title || (passage.passageType === 'TEXT' ? 'Mətn Parçası' : 'Dinləmə')}
                    </span>
                    {isLimited && (
                        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${limitReached ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-700'}`}>
                            {limitReached ? 'Limit dolub' : `${listenCount} / ${passage.listenLimit} dinləmə`}
                        </span>
                    )}
                </div>

                <div className="p-6">
                    {passage.passageType === 'TEXT' ? (
                        <>
                            {passage.textContent && (
                                <div className="prose max-w-none text-gray-800 leading-relaxed mb-4 text-base">
                                    <LatexPreview content={passage.textContent} />
                                </div>
                            )}
                            {passage.attachedImage && (
                                <img src={passage.attachedImage} alt="Mətn" className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200" />
                            )}
                        </>
                    ) : (
                        <>
                            {passage.audioContent ? (
                                <audio
                                    ref={audioRef}
                                    controls={!limitReached}
                                    src={passage.audioContent}
                                    className={`w-full rounded-lg ${limitReached ? 'opacity-50 pointer-events-none' : ''}`}
                                    onEnded={handleAudioEnded}
                                    onPlay={handleAudioPlay}
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-xl">Audio fayl mövcud deyil</div>
                            )}
                            {limitReached && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium text-center">
                                    Dinləmə limiti ({passage.listenLimit} dəfə) dolub. Audio artıq əlçatan deyil.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Questions for this passage */}
            {(passage.questions || []).map((q, idx) => (
                <QuestionCard
                    key={q.id}
                    question={q}
                    answer={answers.find(a => a.questionId === q.id)}
                    onAnswerChange={onAnswerChange}
                    activeLeftId={activeLeftId}
                    setActiveLeftId={setActiveLeftId}
                    subIndex={idx + 1}
                />
            ))}
        </div>
    );
};

// ---- QuestionCard ----
const QuestionCard = ({ question, answer, onAnswerChange, activeLeftId, setActiveLeftId, subIndex }) => {
    if (!answer) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                        {subIndex ? `${subIndex}. sual • ` : ''}{question.points} Bal
                    </span>
                    <span className="text-sm text-gray-400 font-mono">{question.questionType}</span>
                </div>

                <div className="prose max-w-none text-xl text-gray-800 mb-8">
                    <LatexPreview content={question.content} />
                </div>

                {question.attachedImage && (
                    <div className="mb-8 rounded-lg overflow-hidden border border-gray-200 inline-block">
                        <img src={question.attachedImage} alt="Sual" className="max-w-full h-auto max-h-96" />
                    </div>
                )}

                <div className="mt-8">
                    {(question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE' || question.questionType === 'MULTI_SELECT') && (
                        <div className="space-y-3">
                            {question.options?.map((opt) => {
                                const isSelected = answer.optionIds?.includes(opt.id);
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => {
                                            if (question.questionType === 'MULTI_SELECT') {
                                                const currentIds = answer.optionIds || [];
                                                const newIds = currentIds.includes(opt.id)
                                                    ? currentIds.filter(id => id !== opt.id)
                                                    : [...currentIds, opt.id];
                                                onAnswerChange(question.id, { optionIds: newIds });
                                            } else {
                                                onAnswerChange(question.id, { optionIds: [opt.id] });
                                            }
                                        }}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'} flex items-center gap-4`}
                                    >
                                        <div className={`${question.questionType === 'MULTI_SELECT' ? 'w-6 h-6 rounded-md' : 'w-6 h-6 rounded-full'} border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                                            {isSelected && (
                                                question.questionType === 'MULTI_SELECT'
                                                    ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    : <div className="w-3 h-3 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-lg">
                                            <LatexPreview content={opt.content} />
                                            {opt.attachedImage && <img src={opt.attachedImage} className="mt-2 max-h-32 rounded border" alt="Varyant" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {(question.questionType === 'OPEN_AUTO' || question.questionType === 'OPEN_MANUAL') && (
                        <OpenAnswerInput
                            answer={answer}
                            questionType={question.questionType}
                            onAnswerChange={(data) => onAnswerChange(question.id, data)}
                        />
                    )}

                    {question.questionType === 'MATCHING' && (
                        <MatchingQuestion
                            question={question}
                            answer={answer}
                            onAnswerChange={onAnswerChange}
                            activeLeftId={activeLeftId}
                            setActiveLeftId={setActiveLeftId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- MatchingQuestion ----
const MatchingQuestion = ({ question, answer, onAnswerChange, activeLeftId, setActiveLeftId }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500 italic">Sol tərəfdəki maddədən başlayaraq sağ tərəfə xətt çəkin:</p>
            <button
                onClick={() => onAnswerChange(question.id, { matchingPairs: [] })}
                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded transition-colors"
            >
                Təmizlə
            </button>
        </div>

        <div className="relative flex justify-between gap-40 py-8">
            <div className="flex-1 space-y-12 z-10">
                {question.matchingPairs.filter(p => p.leftItem !== null).map((pair) => {
                    const isConnected = answer.matchingPairs?.some(m => m.leftItemId === pair.id);
                    const isActive = activeLeftId === pair.id;
                    return (
                        <div
                            key={`left-${pair.id}`}
                            id={`left-${pair.id}`}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                isActive ? 'border-yellow-400 bg-yellow-50 shadow-md scale-105 ring-4 ring-yellow-200 ring-opacity-50' :
                                isConnected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-200'
                            }`}
                            onClick={() => {
                                setActiveLeftId(pair.id);
                                toast.success('İndi sağdan uyğun olanı seçin', { id: 'matching-hint', duration: 2000 });
                            }}
                        >
                            <LatexPreview content={pair.leftItem} />
                            {pair.attachedImageLeft && <div className="mt-2"><img src={pair.attachedImageLeft} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 space-y-12 z-10">
                {[...question.matchingPairs]
                    .filter(p => p.rightItem !== null)
                    .sort((a, b) => (a.rightItem || '').localeCompare(b.rightItem || ''))
                    .map((pair) => {
                        const isConnected = answer.matchingPairs?.some(m => m.rightItemId === pair.id);
                        return (
                            <div
                                key={`right-${pair.id}`}
                                id={`right-${pair.id}`}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isConnected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-200'}`}
                                onClick={() => {
                                    if (activeLeftId) {
                                        const existingPairs = answer.matchingPairs || [];
                                        const alreadyExists = existingPairs.some(m => m.leftItemId === activeLeftId && m.rightItemId === pair.id);
                                        if (alreadyExists) {
                                            toast.error('Bu birləşmə artıq mövcuddur');
                                        } else {
                                            onAnswerChange(question.id, { matchingPairs: [...existingPairs, { leftItemId: activeLeftId, rightItemId: pair.id }] });
                                        }
                                        setActiveLeftId(null);
                                    } else {
                                        toast.error('Əvvəlcə soldan bir bənd seçin');
                                    }
                                }}
                            >
                                <LatexPreview content={pair.rightItem} />
                                {pair.attachedImageRight && <div className="mt-2"><img src={pair.attachedImageRight} alt="" className="max-h-32 rounded-lg mx-auto" /></div>}
                            </div>
                        );
                    })}
            </div>

            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible" style={{ zIndex: 5 }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#4f46e5" />
                    </marker>
                </defs>
                {answer.matchingPairs?.map((m, idx) => {
                    const leftEl = document.getElementById(`left-${m.leftItemId}`);
                    const rightEl = document.getElementById(`right-${m.rightItemId}`);
                    const container = leftEl?.closest('.relative');
                    if (!leftEl || !rightEl || !container) return null;
                    const rect = container.getBoundingClientRect();
                    const lRect = leftEl.getBoundingClientRect();
                    const rRect = rightEl.getBoundingClientRect();
                    const x1 = lRect.right - rect.left, y1 = lRect.top + lRect.height / 2 - rect.top;
                    const x2 = rRect.left - rect.left, y2 = rRect.top + rRect.height / 2 - rect.top;
                    const colors = ['#4f46e5', '#7c3aed', '#db2777', '#2563eb'];
                    const color = colors[idx % colors.length];
                    return (
                        <g key={`path-group-${m.leftItemId}-${m.rightItemId}`} className="group cursor-pointer pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAnswerChange(question.id, { matchingPairs: answer.matchingPairs.filter((_, i) => i !== idx) });
                                toast.success('Əlaqə silindi');
                            }}>
                            <path d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`} stroke="transparent" strokeWidth="15" fill="none" />
                            <path d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`} stroke={color} strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" className="transition-all group-hover:stroke-red-400 group-hover:stroke-[4px]" />
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <circle cx={(x1+x2)/2} cy={(y1+y2)/2} r="10" fill="white" stroke="#fee2e2" strokeWidth="1" />
                                <text x={(x1+x2)/2} y={(y1+y2)/2+4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444">×</text>
                            </g>
                        </g>
                    );
                })}
            </svg>
        </div>
    </div>
);

// ---- OpenAnswerInput ----
const OpenAnswerInput = ({ answer, questionType, onAnswerChange }) => {
    const [mathOpen, setMathOpen] = useState(false);
    const editorRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onAnswerChange({ answerImage: ev.target.result });
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const handleMathInsert = (latex) => {
        editorRef.current?.insertMath(latex);
        setMathOpen(false);
    };

    return (
        <div className="space-y-3">
            {questionType === 'OPEN_MANUAL' && (
                <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                    Bu sual müəllim tərəfindən yoxlanılacaq. Cavabınızı mətn və/və ya şəkil ilə göndərə bilərsiniz.
                </p>
            )}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Cavabınızı daxil edin:</label>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setMathOpen(true)}
                        className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        title="Riyaziyyat formulu əlavə et"
                    >
                        fx Riyaziyyat
                    </button>
                </div>
                <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
                    <MathTextEditor
                        ref={editorRef}
                        value={answer.textAnswer || ''}
                        onChange={(val) => onAnswerChange({ textAnswer: val })}
                        placeholder="Cavabınızı bura yazın... Riyaziyyat üçün $$...$$ istifadə edin və ya fx düyməsini basın"
                        className="w-full px-4 py-3 border-none focus:ring-0 text-base min-h-[120px] bg-transparent"
                    />
                </div>
            </div>
            {questionType === 'OPEN_MANUAL' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cavab şəkli (İstəyə bağlı):</label>
                    {answer.answerImage ? (
                        <div className="relative inline-block">
                            <img src={answer.answerImage} alt="Cavab şəkli" className="max-h-48 rounded-xl border border-gray-200 shadow-sm" />
                            <button
                                type="button"
                                onClick={() => onAnswerChange({ answerImage: null })}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                            >
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors w-fit">
                            <HiOutlinePlus className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-600">Şəkil yüklə</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    )}
                </div>
            )}
            <MathFormulaModal
                isOpen={mathOpen}
                onClose={() => setMathOpen(false)}
                onInsert={handleMathInsert}
            />
        </div>
    );
};

export default ExamSession;
