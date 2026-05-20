import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
    // Persisted to localStorage under `examListenCounts:<sessionId>` so a
    // page refresh can't reset the counter and let the student start over.
    // The state is hydrated lazily from storage and mirrored back on every
    // update.
    const listenCountsStorageKey = sessionId ? `examListenCounts:${sessionId}` : null;
    const [listenCounts, setListenCounts] = useState(() => {
        if (!listenCountsStorageKey) return {};
        try {
            const raw = localStorage.getItem(listenCountsStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    });
    useEffect(() => {
        if (!listenCountsStorageKey) return;
        try { localStorage.setItem(listenCountsStorageKey, JSON.stringify(listenCounts)); }
        catch { /* localStorage full / disabled — best-effort */ }
    }, [listenCounts, listenCountsStorageKey]);
    const [zoomImage, setZoomImage] = useState(null);
    const autoSubmitRef = useRef(false);
    const navScrollRef = useRef(null);

    const navScrollCallbackRef = useCallback((el) => {
        if (!el) return;
        navScrollRef.current = el;

        const onWheel = (e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        let startX = 0, startLeft = 0;
        const onMouseMove = (e) => { el.scrollLeft = startLeft - (e.clientX - startX); };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            startX = e.clientX;
            startLeft = el.scrollLeft;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        el.addEventListener('mousedown', onMouseDown);
    }, []);

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

    useEffect(() => {
        const el = navScrollRef.current;
        if (!el) return;
        const active = el.querySelector('[data-nav-active="true"]');
        if (!active) return;
        const containerLeft = el.scrollLeft;
        const containerRight = containerLeft + el.clientWidth;
        const btnLeft = active.offsetLeft;
        const btnRight = btnLeft + active.offsetWidth;
        if (btnLeft < containerLeft + 8) {
            el.scrollTo({ left: btnLeft - 8, behavior: 'smooth' });
        } else if (btnRight > containerRight - 8) {
            el.scrollTo({ left: btnRight - el.clientWidth + 8, behavior: 'smooth' });
        }
    }, [currentSectionIndex]);

    const fetchSessionDetails = async () => {
        try {
            const { data } = await api.get(`/submissions/${sessionId}/session`);

            if (data.submittedAt) {
                localStorage.removeItem('guestOngoingExam');
                navigate(`/test/result/${sessionId}`, { replace: true });
                return;
            }

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

            if (data.durationMinutes && data.durationMinutes > 0) {
                // Use server-calculated remainingSeconds to avoid client timezone issues
                const remaining = data.remainingSeconds != null
                    ? data.remainingSeconds
                    : data.durationMinutes * 60;
                if (remaining <= 0) {
                    toast.error("İmtahan vaxtı bitib!");
                    navigate('/imtahanlar');
                } else {
                    setTimeLeft(remaining);
                }
            }
        } catch (error) {
            localStorage.removeItem('guestOngoingExam');
            if (!error._handled) toast.error(error.response?.data?.message || "Sessiya tapılmadı");
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    // Build sections: standalone questions are individual items, each passage is one item.
    const buildSections = (data) => {
        if (!data) return [];
        const items = [
            ...(data.questions || []).map(q => ({
                kind: 'question', data: q,
                orderIndex: q.orderIndex ?? 0,
                subjectGroup: q.subjectGroup || null,
            })),
            ...(data.passages || []).map(p => ({
                kind: 'passage', data: p,
                orderIndex: p.orderIndex ?? 0,
                subjectGroup: p.subjectGroup || null,
            })),
        ];
        items.sort((a, b) => a.orderIndex - b.orderIndex);
        return items;
    };

    // Resolve display label for a subjectGroup (null = main section = subjects[0])
    const resolveSubjectLabel = (subjectGroup) => {
        if (subjectGroup) return subjectGroup;
        return sessionData?.subjects?.[0] || null;
    };

    // Flatten sections into nav items with global sequential numbers.
    // Each passage emits: a passage-icon item + one passage-sub item per sub-question.
    const computeNavItems = (sectionList) => {
        let qNum = 0;
        const result = [];
        sectionList.forEach((section, sectionIdx) => {
            const sg = section.subjectGroup;
            if (section.kind === 'question') {
                qNum++;
                result.push({ type: 'question', section, sectionIdx, subjectGroup: sg, displayNum: qNum });
            } else {
                result.push({ type: 'passage-icon', section, sectionIdx, subjectGroup: sg });
                (section.data.questions || []).forEach((q) => {
                    qNum++;
                    result.push({ type: 'passage-sub', section, sectionIdx, subjectGroup: sg, questionId: q.id, displayNum: qNum });
                });
            }
        });
        return result;
    };

    // Group nav items by subjectGroup
    const buildNavGroups = (navItemList) => {
        const groups = [];
        let currentGroup = null;
        navItemList.forEach((item) => {
            const sg = item.subjectGroup;
            if (!currentGroup || currentGroup.subjectGroup !== sg) {
                currentGroup = { subjectGroup: sg, label: resolveSubjectLabel(sg), items: [] };
                groups.push(currentGroup);
            }
            currentGroup.items.push(item);
        });
        return groups;
    };

    const sections = buildSections(sessionData);
    const currentSection = sections[currentSectionIndex];
    const navItems = computeNavItems(sections);
    // Map questionId → global display number (for passage sub-questions)
    const questionNumMap = Object.fromEntries(
        navItems
            .filter(i => i.type === 'passage-sub' || i.type === 'question')
            .map(i => [i.type === 'passage-sub' ? i.questionId : i.section.data.id, i.displayNum])
    );
    // Only icon + question items shown in nav (no passage-sub rows)
    const navGroups = buildNavGroups(navItems.filter(i => i.type !== 'passage-sub'));

    const syncAnswer = async (questionId, answerData) => {
        try {
            await api.post(`/submissions/${sessionId}/save-answer`, { questionId, ...answerData });
        } catch {
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
                if (q && (q.questionType === 'OPEN_AUTO' || q.questionType === 'OPEN_MANUAL' || q.questionType === 'FILL_IN_THE_BLANK')) {
                    syncAnswer(ans.questionId, ans);
                }
            }, 1000);
            return { id: ans.questionId, timer };
        });
        return () => timers.forEach(t => clearTimeout(t.timer));
    }, [answers.map(a => a.textAnswer).join('|')]);

    const handleAutoSubmit = () => {
        if (autoSubmitRef.current) return;
        autoSubmitRef.current = true;
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
            localStorage.removeItem('guestOngoingExam');
            toast.success("İmtahan uğurla təhvil verildi!");
            navigate(`/test/result/${sessionId}`, { replace: true, state: { submission: data } });
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || '';
            if (status === 400 && message.includes('artıq təhvil')) {
                localStorage.removeItem('guestOngoingExam');
                toast.success("İmtahan artıq təhvil verilib. Nəticələrə yönləndirilirsiniz...");
                navigate(`/test/result/${sessionId}`, { replace: true });
                return;
            }
            if (!error._handled) toast.error(message || 'İmtahan təhvil verilmədi');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const answerHasContent = (ans) =>
        ans && (ans.optionIds?.length > 0 || ans.textAnswer?.trim() || ans.answerImage || ans.matchingPairs?.length > 0);

    const sectionHasAnswer = (section) => {
        if (section.kind === 'question')
            return answerHasContent(answers.find(a => a.questionId === section.data.id));
        const qs = section.data.questions || [];
        return qs.length > 0 && qs.every(q => answerHasContent(answers.find(a => a.questionId === q.id)));
    };

    const sectionPartialAnswer = (section) => {
        if (section.kind === 'question') return false;
        const qs = section.data.questions || [];
        return qs.some(q => answerHasContent(answers.find(a => a.questionId === q.id)));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!sessionData || sections.length === 0) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
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

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{sessionData.examTitle}</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            {resolveSubjectLabel(currentSection?.subjectGroup) && (
                                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{resolveSubjectLabel(currentSection?.subjectGroup)}</span>
                            )}
                            Sual {currentSectionIndex + 1} / {sections.length}
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
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-70"
                        >
                            {isSubmitting ? 'Göndərilir...' : 'İmtahanı Bitir'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main flex-1 py-8 pb-28 max-w-4xl mx-auto w-full">
                {/* Subject section header */}
                {resolveSubjectLabel(currentSection?.subjectGroup) && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                            {resolveSubjectLabel(currentSection?.subjectGroup)}
                        </span>
                        <div className="h-px flex-1 bg-blue-100" />
                    </div>
                )}

                {/* Current Section */}
                {currentSection?.kind === 'question' && (
                    <QuestionCard
                        key={currentSection.data.id}
                        question={currentSection.data}
                        questionNumber={questionNumMap[currentSection.data.id]}
                        answer={answers.find(a => a.questionId === currentSection.data.id)}
                        onAnswerChange={handleAnswerChange}
                        activeLeftId={activeLeftId}
                        setActiveLeftId={setActiveLeftId}
                        onZoomImage={setZoomImage}
                    />
                )}
                {currentSection?.kind === 'passage' && (
                    <div className="space-y-4">
                        <PassageContentCard
                            passage={currentSection.data}
                            listenCounts={listenCounts}
                            setListenCounts={setListenCounts}
                            onZoomImage={setZoomImage}
                        />
                        {(currentSection.data.questions || []).map((q) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                questionNumber={questionNumMap[q.id]}
                                answer={answers.find(a => a.questionId === q.id)}
                                onAnswerChange={handleAnswerChange}
                                activeLeftId={activeLeftId}
                                setActiveLeftId={setActiveLeftId}
                                onZoomImage={setZoomImage}
                            />
                        ))}
                    </div>
                )}

            </div>

            {/* Navigation Footer - fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
                <div className="max-w-4xl mx-auto px-2 sm:px-4">
                    {/* Question navigation — scrollable on mobile */}
                    <div
                        ref={navScrollCallbackRef}
                        className="overflow-x-auto py-2 flex items-center gap-x-1 scrollbar-none select-none"
                    >
                        {navGroups.map((group, gi) => (
                            <div key={gi} className="flex items-center gap-1 flex-shrink-0">
                                {group.label && (
                                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap flex-shrink-0">
                                        {group.label}
                                    </span>
                                )}
                                {group.items.map((item) => {
                                    const isActive = currentSectionIndex === item.sectionIdx;

                                    if (item.type === 'passage-icon') {
                                        const hasAll = sectionHasAnswer(item.section);
                                        const hasPartial = sectionPartialAnswer(item.section);
                                        const isText = item.section.data.passageType === 'TEXT';
                                        return (
                                            <button
                                                key={`pi-${item.sectionIdx}`}
                                                data-nav-active={isActive}
                                                onClick={() => setCurrentSectionIndex(item.sectionIdx)}
                                                title={isText ? 'Mətn' : 'Dinləmə'}
                                                className={`flex-shrink-0 flex items-center justify-center rounded-lg w-8 h-9 transition-colors ${
                                                    isActive ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                                                    : hasAll ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                                                    : hasPartial ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isText ? <HiOutlineDocumentText className="w-4 h-4" /> : <HiOutlineVolumeUp className="w-4 h-4" />}
                                            </button>
                                        );
                                    }

                                    // type === 'question'
                                    const hasAnswer = sectionHasAnswer(item.section);
                                    return (
                                        <button
                                            key={`q-${item.sectionIdx}`}
                                            data-nav-active={isActive}
                                            onClick={() => setCurrentSectionIndex(item.sectionIdx)}
                                            title={`Sual ${item.displayNum}`}
                                            className={`flex-shrink-0 flex items-center justify-center font-bold text-sm rounded-lg w-9 h-9 transition-colors ${
                                                isActive ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                                                : hasAnswer ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {item.displayNum}
                                        </button>
                                    );
                                })}
                                {gi < navGroups.length - 1 && (
                                    <div className="w-px h-7 bg-gray-300 mx-1 self-center flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Prev / Next */}
                    <div className="flex justify-between items-center border-t border-gray-100 py-2">
                        <button
                            onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentSectionIndex === 0}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
                        >
                            <HiOutlineChevronLeft className="w-5 h-5" />
                            Əvvəlki
                        </button>
                        <span className="text-xs text-gray-400 font-medium">
                            {currentSectionIndex + 1} / {sections.length}
                        </span>

                        <button
                            onClick={() => setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1))}
                            disabled={currentSectionIndex === sections.length - 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
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

// Minimal, locked-down audio player used inside the exam. The native
// `<audio controls>` element exposes a seek bar, a speed-rate menu, and (on
// Chromium) a download button — all of which let a student rewind, slow
// the speaker down, or save the file. For a fair listening exam we ship a
// custom UI: only Play/Pause, the elapsed time, and the listen count.
// Seeking is also blocked at the media-element level (any `seeking` event
// snaps `currentTime` back to the last allowed position) so even keyboard
// shortcuts can't bypass the UI.
const SecureAudioPlayer = ({ src, disabled, onStart }) => {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    // Once a play session has started this stays true until the audio
    // reaches its natural end. We use it to (a) auto-resume on any pause
    // attempt and (b) disable the Play button so the student can't stop
    // mid-track. Combined with the seek block and rate lock, the listening
    // exam is effectively one-shot: hit play, listen straight through.
    const [hasStarted, setHasStarted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const lastAllowedTimeRef = useRef(0);
    const hasStartedRef = useRef(false);

    const fmt = (s) => {
        if (!Number.isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        el.playbackRate = 1.0;
        const lockRate = () => { el.playbackRate = 1.0; };
        el.addEventListener('ratechange', lockRate);
        return () => el.removeEventListener('ratechange', lockRate);
    }, []);

    const onTimeUpdate = (e) => {
        const t = e.currentTarget.currentTime;
        setCurrentTime(t);
        if (t + 0.5 < lastAllowedTimeRef.current) {
            e.currentTarget.currentTime = lastAllowedTimeRef.current;
            return;
        }
        lastAllowedTimeRef.current = t;
    };

    const onSeeking = (e) => {
        if (e.currentTarget.currentTime + 0.5 < lastAllowedTimeRef.current) {
            e.currentTarget.currentTime = lastAllowedTimeRef.current;
        }
    };

    const startPlayback = () => {
        const el = audioRef.current;
        if (!el || disabled || hasStartedRef.current) return;
        // Fire onStart BEFORE play() resolves — that increments the listen
        // count in the parent, which immediately persists to localStorage.
        // Even if the page reloads a second later, the play has been
        // counted.
        onStart?.();
        el.play().then(() => {
            hasStartedRef.current = true;
            setHasStarted(true);
            setPlaying(true);
        }).catch(() => {});
    };

    return (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
                type="button"
                onClick={startPlayback}
                disabled={disabled || hasStarted}
                className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center transition-colors shadow disabled:cursor-not-allowed disabled:bg-emerald-500"
                aria-label="Oynat"
                title={hasStarted ? 'Dinləmə başlayıb — dayandırıla bilməz' : 'Oynat'}
            >
                {hasStarted ? (
                    // Animated "playing" indicator (3 vertical bars). Tells
                    // the student playback is locked in.
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <rect x="5"  y="6" width="3" height="12" rx="1" fill="currentColor"><animate attributeName="height" values="12;4;12" dur="0.9s" repeatCount="indefinite" /><animate attributeName="y" values="6;10;6" dur="0.9s" repeatCount="indefinite" /></rect>
                        <rect x="10.5" y="4" width="3" height="16" rx="1" fill="currentColor"><animate attributeName="height" values="16;6;16" dur="0.9s" begin="0.15s" repeatCount="indefinite" /><animate attributeName="y" values="4;9;4" dur="0.9s" begin="0.15s" repeatCount="indefinite" /></rect>
                        <rect x="16" y="6" width="3" height="12" rx="1" fill="currentColor"><animate attributeName="height" values="12;4;12" dur="0.9s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="y" values="6;10;6" dur="0.9s" begin="0.3s" repeatCount="indefinite" /></rect>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M8 5v14l11-7z" /></svg>
                )}
            </button>
            <div className="flex-1 font-mono text-sm text-emerald-800 tabular-nums">
                {fmt(currentTime)} <span className="text-emerald-400">/</span> {fmt(duration)}
            </div>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                className="hidden"
                controlsList="nodownload noplaybackrate noremoteplayback"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={onTimeUpdate}
                onSeeking={onSeeking}
                onEnded={() => {
                    // Reset UI so the button can re-arm if the listen limit
                    // hasn't been reached yet. We deliberately don't fire
                    // onStart again here — the count was already incremented
                    // at play time.
                    setPlaying(false);
                    setHasStarted(false);
                    hasStartedRef.current = false;
                    lastAllowedTimeRef.current = 0;
                }}
                onPause={(e) => {
                    // The student (or an OS-level media key) tried to pause
                    // a playback in progress. Force-resume — listening is
                    // strictly one-shot until the track ends naturally.
                    if (hasStartedRef.current && !e.currentTarget.ended) {
                        e.currentTarget.play().catch(() => {});
                    } else {
                        setPlaying(false);
                    }
                }}
                onPlay={() => setPlaying(true)}
                onContextMenu={(e) => e.preventDefault()}
            />
        </div>
    );
};

// ---- PassageContentCard — shown above each passage question ----
const PassageContentCard = ({ passage, listenCounts, setListenCounts, onZoomImage }) => {
    const isText = passage.passageType === 'TEXT';
    const listenCount = listenCounts[passage.id] || 0;
    const isLimited = passage.listenLimit !== null && passage.listenLimit !== undefined;
    const limitReached = isLimited && listenCount >= passage.listenLimit;

    // Count a listen the moment the student clicks Play — not when the
    // audio reaches its end. Otherwise refreshing mid-track or simply
    // navigating away wipes the in-progress play and the limit is never
    // hit. Together with the localStorage persistence of `listenCounts`
    // this makes the cap actually enforceable.
    const handleAudioStarted = () => {
        if (isLimited) setListenCounts(prev => ({ ...prev, [passage.id]: (prev[passage.id] || 0) + 1 }));
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${isText ? 'border-teal-200' : 'border-emerald-200'}`}>
            <div className={`px-6 py-3 flex items-center gap-3 ${isText ? 'bg-teal-50' : 'bg-emerald-50'}`}>
                {isText
                    ? <HiOutlineDocumentText className="w-5 h-5 text-teal-600" />
                    : <HiOutlineVolumeUp className="w-5 h-5 text-emerald-600" />}
                <span className={`font-bold text-sm ${isText ? 'text-teal-700' : 'text-emerald-700'}`}>
                    {passage.title || (isText ? 'Mətn Parçası' : 'Dinləmə')}
                </span>
                {isLimited && (
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${limitReached ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {limitReached ? 'Limit dolub' : `${listenCount} / ${passage.listenLimit} dinləmə`}
                    </span>
                )}
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
                            <img src={passage.attachedImage} alt="Mətn" className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 cursor-zoom-in"
                                onClick={() => onZoomImage?.(passage.attachedImage)} />
                        )}
                    </>
                ) : (
                    <>
                        {passage.audioContent ? (
                            <SecureAudioPlayer
                                src={passage.audioContent}
                                disabled={limitReached}
                                onStart={handleAudioStarted}
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
    );
};

// ---- QuestionCard ----
const QuestionCard = ({ question, questionNumber, answer, onAnswerChange, activeLeftId, setActiveLeftId, onZoomImage }) => {
    if (!answer) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        {questionNumber != null && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">
                                {questionNumber}
                            </span>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                            {question.points} Bal
                        </span>
                    </div>
                </div>

                {/* Only render the question content block when there's
                    actual text. Image-only questions used to show the editor
                    placeholder ("Önbaxış burada görünəcək…") here because
                    LatexPreview's default placeholder fires on empty content;
                    we now gate the whole div on real content + pass
                    placeholder={null} as a belt-and-braces guard. */}
                {question.questionType !== 'FILL_IN_THE_BLANK' && question.content?.trim() && (
                    <div className="prose max-w-none text-xl text-gray-800 mb-8">
                        <LatexPreview content={question.content} placeholder={null} />
                    </div>
                )}

                {question.attachedImage && (
                    <div className="mb-8 rounded-lg overflow-hidden border border-gray-200 inline-block cursor-zoom-in"
                        onClick={() => onZoomImage?.(question.attachedImage)}>
                        <img src={question.attachedImage} alt="Sual" className="max-w-full h-auto max-h-96" />
                    </div>
                )}

                <div className="mt-8">
                    {(question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE' || question.questionType === 'MULTI_SELECT') && (
                        <div className="space-y-3">
                            {question.options?.map((opt, optIdx) => {
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
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'} flex items-center gap-4`}
                                    >
                                        <div className={`${question.questionType === 'MULTI_SELECT' ? 'w-6 h-6 rounded-md' : 'w-6 h-6 rounded-full'} border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                            {isSelected && (
                                                question.questionType === 'MULTI_SELECT'
                                                    ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    : <div className="w-3 h-3 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-lg">
                                            <LatexPreview content={opt.content} placeholder="Variant boşdur" />
                                            {opt.attachedImage && <img src={opt.attachedImage} className="mt-2 max-h-32 rounded border cursor-zoom-in" alt="Varyant" onClick={e => { e.stopPropagation(); onZoomImage?.(opt.attachedImage); }} />}
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

                    {question.questionType === 'FILL_IN_THE_BLANK' && (
                        <FillInTheBlankInput
                            key={question.id}
                            question={question}
                            answer={answer}
                            onAnswerChange={onAnswerChange}
                        />
                    )}

                    {question.questionType === 'MATCHING' && (
                        <MatchingQuestion
                            question={question}
                            answer={answer}
                            onAnswerChange={onAnswerChange}
                            activeLeftId={activeLeftId}
                            setActiveLeftId={setActiveLeftId}
                            onZoomImage={onZoomImage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- FillInTheBlankInput ----
const FillInTheBlankInput = ({ question, answer, onAnswerChange }) => {
    const parts = (question.content || '').split('___');
    const blankCount = parts.length - 1;

    const [chipPool, setChipPool] = useState([]);
    const [dragOver, setDragOver] = useState(null);
    const [selectedBlankIdx, setSelectedBlankIdx] = useState(null);

    useEffect(() => {
        const chips = (question.options || []).map(o => ({ id: String(o.id), text: o.content }));
        for (let i = chips.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chips[i], chips[j]] = [chips[j], chips[i]];
        }
        setChipPool(chips);
        setSelectedBlankIdx(null);
        setDragOver(null);
    }, [question.id]);

    let blanks = [];
    try { blanks = JSON.parse(answer.textAnswer || '[]'); } catch (e) {}
    blanks = Array.from({ length: blankCount }, (_, i) => blanks[i] || null);

    const usedTexts = new Set(blanks.filter(Boolean));

    const placeChip = (blankIdx, chipText) => {
        const next = [...blanks];
        for (let i = 0; i < next.length; i++) if (next[i] === chipText) next[i] = null;
        next[blankIdx] = chipText;
        onAnswerChange(question.id, { textAnswer: JSON.stringify(next) });
    };

    const removeFromBlank = (blankIdx) => {
        const next = [...blanks];
        next[blankIdx] = null;
        onAnswerChange(question.id, { textAnswer: JSON.stringify(next) });
    };

    const handleChipClick = (chipText) => {
        if (usedTexts.has(chipText)) return;
        // Əgər seçilmiş blank varsa, ora yerləşdir
        if (selectedBlankIdx !== null) {
            placeChip(selectedBlankIdx, chipText);
            setSelectedBlankIdx(null);
        } else {
            // Heç bir blank seçilməmişsə, ilk boş blanka yerləşdir
            const firstEmpty = blanks.findIndex(b => !b);
            if (firstEmpty !== -1) placeChip(firstEmpty, chipText);
        }
    };

    return (
        <div className="space-y-8">
            {/* Question text with inline drop zones */}
            <div className="text-xl text-gray-800 leading-[3.5rem]">
                {parts.map((part, i) => (
                    <span key={i}>
                        {/* Render the surrounding text ONLY when it has
                            non-whitespace content. A bare space (e.g. the
                            empty span before a leading `___`) used to slip
                            past the `&&` guard and triggered LatexPreview's
                            editor placeholder ("Önbaxış burada görünəcək…"),
                            which leaked into the live exam UI. */}
                        {part && part.trim() && <LatexPreview content={part} placeholder={null} />}
                        {i < blankCount && (
                            <span
                                onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={e => {
                                    e.preventDefault();
                                    setDragOver(null);
                                    const chipText = e.dataTransfer.getData('chipText');
                                    if (chipText) placeChip(i, chipText);
                                }}
                                onClick={() => {
                                    if (blanks[i]) {
                                        removeFromBlank(i);
                                        setSelectedBlankIdx(null);
                                    } else {
                                        setSelectedBlankIdx(selectedBlankIdx === i ? null : i);
                                    }
                                }}
                                className={`inline-flex items-center justify-center mx-2 min-w-[110px] h-9 px-3 rounded-xl border-2 align-middle transition-all cursor-pointer
                                    ${blanks[i]
                                        ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold'
                                        : selectedBlankIdx === i
                                            ? 'bg-yellow-100 border-yellow-500 border-solid ring-2 ring-yellow-300'
                                            : dragOver === i
                                                ? 'bg-blue-100 border-blue-400 border-solid scale-105'
                                                : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'
                                    }`}
                            >
                                {blanks[i]
                                    ? <span className="flex items-center gap-1.5 text-base">{blanks[i]} <span className="text-xs text-blue-400">✕</span></span>
                                    : <span className="text-sm font-semibold">{i + 1}</span>
                                }
                            </span>
                        )}
                    </span>
                ))}
            </div>

            {/* Chip pool */}
            {chipPool.length > 0 && (
                <div>
                    <p className="text-sm text-gray-500 mb-3 font-medium">Seçimləri boşluqlara sürükləyin və ya üzərinə klikləyin:</p>
                    <div className="flex flex-wrap gap-3">
                        {chipPool.map(chip => {
                            const isUsed = usedTexts.has(chip.text);
                            return (
                                <div
                                    key={chip.id}
                                    draggable={!isUsed}
                                    onDragStart={e => e.dataTransfer.setData('chipText', chip.text)}
                                    onClick={() => handleChipClick(chip.text)}
                                    className={`px-4 py-2.5 rounded-xl border-2 font-medium text-base select-none transition-all
                                        ${isUsed
                                            ? 'opacity-30 cursor-default border-gray-200 bg-gray-100 text-gray-400'
                                            : 'cursor-grab border-blue-200 bg-white text-blue-700 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md active:scale-95'
                                        }`}
                                >
                                    {chip.text}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ---- MatchingQuestion ----
const MATCH_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'];

const MatchingQuestion = ({ question, answer, onAnswerChange, activeLeftId, setActiveLeftId, onZoomImage }) => {
    const containerRef = useRef(null);
    const [, forceUpdate] = useState(0);
    const [hoveredArrow, setHoveredArrow] = useState(null);

    const existingPairs = answer.matchingPairs || [];

    // Build canonical maps: pairId → canonical pairId (first with same content text)
    const leftCanonMap = {}, rightCanonMap = {};
    const seenLText = {}, seenRText = {};
    question.matchingPairs.forEach(p => {
        if (p.leftItem) {
            if (seenLText[p.leftItem] === undefined) seenLText[p.leftItem] = p.id;
            leftCanonMap[p.id] = seenLText[p.leftItem];
        }
        if (p.rightItem) {
            if (seenRText[p.rightItem] === undefined) seenRText[p.rightItem] = p.id;
            rightCanonMap[p.id] = seenRText[p.rightItem];
        }
    });

    // Deduplicate by content — one card per unique text
    const seenLeft = new Set();
    const leftPairs = question.matchingPairs.filter(p => {
        if (!p.leftItem || seenLeft.has(p.leftItem)) return false;
        seenLeft.add(p.leftItem); return true;
    });
    const seenRight = new Set();
    const rightPairs = [...question.matchingPairs]
        .filter(p => {
            if (!p.rightItem || seenRight.has(p.rightItem)) return false;
            seenRight.add(p.rightItem); return true;
        })
        .sort((a, b) => (a.rightItem || '').localeCompare(b.rightItem || ''));

    // Force re-render after mount and after pair count changes so SVG arrows read correct DOM positions
    useLayoutEffect(() => { forceUpdate(v => v + 1); }, []);
    useLayoutEffect(() => { forceUpdate(v => v + 1); }, [existingPairs.length]);

    // Compute arrow paths from DOM (resolve to canonical IDs, deduplicate by canonical pair)
    const arrowPaths = (() => {
        if (!containerRef.current) return [];
        const rect = containerRef.current.getBoundingClientRect();
        const seenArrows = new Set();
        return existingPairs.map((m, idx) => {
            const lc = leftCanonMap[m.leftItemId] ?? m.leftItemId;
            const rc = rightCanonMap[m.rightItemId] ?? m.rightItemId;
            const key = `${lc}-${rc}`;
            if (seenArrows.has(key)) return null;
            seenArrows.add(key);
            const leftEl = containerRef.current.querySelector(`[data-left="${lc}"]`);
            const rightEl = containerRef.current.querySelector(`[data-right="${rc}"]`);
            if (!leftEl || !rightEl) return null;
            const lRect = leftEl.getBoundingClientRect();
            const rRect = rightEl.getBoundingClientRect();
            const x1 = lRect.right - rect.left, y1 = lRect.top + lRect.height / 2 - rect.top;
            const x2 = rRect.left - rect.left, y2 = rRect.top + rRect.height / 2 - rect.top;
            return { idx, x1, y1, x2, y2, color: MATCH_COLORS[idx % MATCH_COLORS.length] };
        }).filter(Boolean);
    })();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500 italic">Sol tərəfdəki maddədən başlayaraq sağ tərəfə xətt çəkin:</p>
                <button
                    onClick={() => { onAnswerChange(question.id, { matchingPairs: [] }); setActiveLeftId(null); }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded transition-colors"
                >
                    Təmizlə
                </button>
            </div>

            <div ref={containerRef} className="relative flex justify-between py-6">
                {/* Left column */}
                <div className="w-[40%] space-y-3" style={{ zIndex: 10, position: 'relative' }}>
                    {leftPairs.map((pair) => {
                        const isConnected = existingPairs.some(m => (leftCanonMap[m.leftItemId] ?? m.leftItemId) === pair.id);
                        const isActive = activeLeftId === pair.id;
                        return (
                            <div
                                key={pair.id}
                                data-left={pair.id}
                                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer min-h-[38px] flex flex-col justify-center ${
                                    isActive ? 'border-yellow-400 bg-yellow-50 shadow-md ring-2 ring-yellow-200' :
                                    isConnected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                }`}
                                onClick={() => {
                                    setActiveLeftId(isActive ? null : pair.id);
                                    if (!isActive) toast.success('İndi sağdan uyğun olanı seçin', { id: 'matching-hint', duration: 2000 });
                                }}
                            >
                                <LatexPreview content={pair.leftItem} />
                                {pair.attachedImageLeft && <div className="mt-2"><img src={pair.attachedImageLeft} alt="" className="max-h-32 rounded-lg mx-auto cursor-zoom-in" onClick={e => { e.stopPropagation(); onZoomImage?.(pair.attachedImageLeft); }} /></div>}
                            </div>
                        );
                    })}
                </div>

                {/* Right column */}
                <div className="w-[40%] space-y-3" style={{ zIndex: 10, position: 'relative' }}>
                    {rightPairs.map((pair) => {
                        const isConnected = existingPairs.some(m => (rightCanonMap[m.rightItemId] ?? m.rightItemId) === pair.id);
                        return (
                            <div
                                key={pair.id}
                                data-right={pair.id}
                                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer min-h-[38px] flex flex-col justify-center ${isConnected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}
                                onClick={() => {
                                    if (!activeLeftId) { toast.error('Əvvəlcə soldan bir bənd seçin'); return; }
                                    const alreadyExists = existingPairs.some(m => m.leftItemId === activeLeftId && m.rightItemId === pair.id);
                                    if (alreadyExists) {
                                        toast.error('Bu birləşmə artıq mövcuddur');
                                    } else {
                                        onAnswerChange(question.id, { matchingPairs: [...existingPairs, { leftItemId: activeLeftId, rightItemId: pair.id }] });
                                    }
                                    setActiveLeftId(null);
                                }}
                            >
                                <LatexPreview content={pair.rightItem} />
                                {pair.attachedImageRight && <div className="mt-2"><img src={pair.attachedImageRight} alt="" className="max-h-32 rounded-lg mx-auto cursor-zoom-in" onClick={e => { e.stopPropagation(); onZoomImage?.(pair.attachedImageRight); }} /></div>}
                            </div>
                        );
                    })}
                </div>

                {/* SVG arrows */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%', zIndex: 5 }}>
                    <defs>
                        {arrowPaths.map(({ idx, color }) => (
                            <marker key={idx} id={`sarr-${question.id}-${idx}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={hoveredArrow === idx ? '#ef4444' : color} />
                            </marker>
                        ))}
                    </defs>
                    {arrowPaths.map(({ idx, x1, y1, x2, y2, color }) => {
                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                        const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                        const isHov = hoveredArrow === idx;
                        return (
                            <g key={idx} style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                onMouseEnter={() => setHoveredArrow(idx)}
                                onMouseLeave={() => setHoveredArrow(null)}
                                onClick={() => {
                                    setHoveredArrow(null);
                                    onAnswerChange(question.id, { matchingPairs: existingPairs.filter((_, i) => i !== idx) });
                                    toast.success('Əlaqə silindi');
                                }}>
                                {/* invisible wide hit zone */}
                                <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
                                {/* visible curve */}
                                <path d={d} stroke={isHov ? '#ef4444' : color} strokeWidth={isHov ? 3.5 : 2.5}
                                    strokeDasharray={isHov ? '6 3' : 'none'}
                                    fill="none" markerEnd={`url(#sarr-${question.id}-${idx})`} />
                                {/* midpoint badge */}
                                <circle cx={mx} cy={my} r="10" fill="white" stroke={isHov ? '#ef4444' : color} strokeWidth="1.5" />
                                {isHov ? (
                                    <g>
                                        <line x1={mx-5} y1={my-5} x2={mx+5} y2={my+5} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                        <line x1={mx+5} y1={my-5} x2={mx-5} y2={my+5} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                    </g>
                                ) : (
                                    <text x={mx} y={my + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={color}>✓</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

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
                        className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Riyaziyyat formulu əlavə et"
                    >
                        fx Riyaziyyat
                    </button>
                </div>
                <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <MathTextEditor
                        ref={editorRef}
                        value={answer.textAnswer || ''}
                        onChange={(val) => onAnswerChange({ textAnswer: val })}
                        placeholder="Cavabınızı bura yazın... Riyaziyyat simvolları üçün fx düyməsini basın"
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
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-colors w-fit">
                            <HiOutlinePlus className="w-5 h-5 text-blue-500" />
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
