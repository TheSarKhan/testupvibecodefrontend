import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineX } from 'react-icons/hi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/enumLabels';

const QUESTION_TYPES = [
    { key: 'MCQ',               label: QUESTION_TYPE_LABELS.MCQ,              sublabel: 'Bir düzgün cavab' },
    { key: 'MULTI_SELECT',      label: QUESTION_TYPE_LABELS.MULTI_SELECT,     sublabel: 'Bir neçə düzgün cavab' },
    { key: 'OPEN_AUTO',         label: QUESTION_TYPE_LABELS.OPEN_AUTO,        sublabel: 'Qısa açıq cavab' },
    { key: 'FILL_IN_THE_BLANK', label: QUESTION_TYPE_LABELS.FILL_IN_THE_BLANK, sublabel: 'Boşluğa söz yaz' },
];

const DIFFICULTIES = [
    { key: 'EASY',   label: DIFFICULTY_LABELS.EASY },
    { key: 'MEDIUM', label: DIFFICULTY_LABELS.MEDIUM },
    { key: 'HARD',   label: DIFFICULTY_LABELS.HARD },
];

const AiExamModal = ({ onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    // Multi-topic: user can pick OR type multiple topics. Chips render below input.
    // Sent to backend as `topicNames` (new field); backend also accepts the legacy
    // comma-joined `topicName` for older builds.
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const topicInputRef = useRef(null);
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [counts, setCounts] = useState({ MCQ: 5, MULTI_SELECT: 0, OPEN_AUTO: 0, FILL_IN_THE_BLANK: 0 });
    const [examTitle, setExamTitle] = useState('');
    // `loading` = a background generation is in flight. The modal stays open
    // showing the spinner; when the server finishes it pushes a notification we
    // listen for below (close + open the draft). The teacher may also close the
    // modal early — generation keeps running and they're told so.
    const [loading, setLoading] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [aiUsage, setAiUsage] = useState(null); // { limit, used, remaining }

    useEffect(() => {
        setLoadingSubjects(true);
        Promise.all([
            api.get('/subjects'),
            api.get('/ai/usage'),
        ]).then(([subjectsRes, usageRes]) => {
            const names = subjectsRes.data || [];
            setSubjects(names);
            // Leave selectedSubject empty so the dropdown shows the
            // "Fənn seç" placeholder by default. Auto-selecting the first
            // subject (e.g. "Alman dili") surprised teachers — they
            // would hit Yarat without changing it and end up with a
            // German exam they didn't intend.
            setAiUsage(usageRes.data);
        }).catch(() => toast.error('Fənlər yüklənərkən xəta baş verdi'))
          .finally(() => setLoadingSubjects(false));
    }, []);

    // Keep the latest onClose without re-subscribing the socket every render.
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    // While a background generation is running, listen on the same notification
    // socket the navbar uses. EXAM_CREATED → the draft is ready: stop the
    // spinner, close the modal and open the draft. WARNING → it failed: stop the
    // spinner and surface the error so the teacher can retry.
    useEffect(() => {
        if (!loading || !user?.id) return;
        const client = new Client({
            webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/notifications/${user.id}`, (message) => {
                    let n;
                    try { n = JSON.parse(message.body); } catch { return; }
                    if (n.type === 'EXAM_CREATED') {
                        setLoading(false);
                        onCloseRef.current?.();
                        if (n.actionUrl) navigate(n.actionUrl);
                    } else if (n.type === 'WARNING') {
                        setLoading(false);
                        toast.error(n.message || 'İmtahan yaradıla bilmədi');
                    }
                });
            },
        });
        client.activate();
        return () => { client.deactivate(); };
    }, [loading, user?.id, navigate]);

    useEffect(() => {
        if (!selectedSubject) { setTopics([]); setSelectedTopics([]); setTopicInput(''); return; }
        // Cancel guard — rapid subject switches must not let a slow A-response
        // overwrite topics for the currently-selected subject B.
        let cancelled = false;
        api.get(`/subjects/topics?name=${encodeURIComponent(selectedSubject)}`)
            .then(res => { if (!cancelled) { setTopics(res.data || []); setSelectedTopics([]); setTopicInput(''); } })
            .catch(() => { if (!cancelled) { setTopics([]); setSelectedTopics([]); setTopicInput(''); } });
        return () => { cancelled = true; };
    }, [selectedSubject]);

    const addTopic = (raw) => {
        const t = (raw || '').trim();
        if (!t) return;
        // Case-insensitive dedupe so "Cəbr" and "cəbr" don't both land in the chip row.
        const normalised = t.toLowerCase();
        if (selectedTopics.some(x => x.toLowerCase() === normalised)) {
            setTopicInput('');
            return;
        }
        setSelectedTopics(prev => [...prev, t]);
        setTopicInput('');
    };

    const removeTopic = (t) => {
        setSelectedTopics(prev => prev.filter(x => x !== t));
    };

    // Esc closes the modal. While a generation is in flight, closing is still
    // allowed — it keeps running server-side — so we just flash a reminder that
    // it moved to the background.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (loading) {
                toast('İmtahan arxa fonda yaradılır 🔔 Hazır olanda bildiriş alacaqsınız.', {
                    icon: '⏳', duration: 5000,
                });
            }
            onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [loading, onClose]);

    const totalCount = Object.values(counts).reduce((s, v) => s + v, 0);

    const changeCount = (key, delta) => {
        setCounts(prev => ({ ...prev, [key]: Math.max(0, Math.min(15, (prev[key] || 0) + delta)) }));
    };

    const handleGenerate = async () => {
        if (totalCount === 0) { toast.error('Ən azı 1 sual seçin'); return; }
        if (!selectedSubject) { toast.error('Fənn seçin'); return; }

        const typeCounts = {};
        Object.entries(counts).forEach(([k, v]) => { if (v > 0) typeCounts[k] = v; });

        // Commit any unsubmitted text in the topic input so a teacher who typed
        // "Cəbr" then hit Yarat without pressing Enter doesn't lose the topic.
        const pendingTopic = topicInput.trim();
        const finalTopics = pendingTopic && !selectedTopics.some(x => x.toLowerCase() === pendingTopic.toLowerCase())
            ? [...selectedTopics, pendingTopic]
            : selectedTopics;

        setLoading(true);
        try {
            // Background generation: the request returns immediately (202) and the
            // exam is built off-thread, then saved as a DRAFT. This avoids the
            // ~100s proxy timeout (504) on large 50-60+ question exams. The teacher
            // gets a notification ("İmtahanınız hazırdır") when it's ready.
            await api.post('/ai/generate-exam-async', {
                subjectName: selectedSubject,
                topicNames: finalTopics,
                topicName: finalTopics.length > 0 ? finalTopics.join(', ') : null,
                difficulty,
                typeCounts,
                title: examTitle.trim() || null,
            });
            // Keep `loading` true — the modal stays on its spinner until the
            // completion notification arrives (handled by the socket effect),
            // which then closes the modal and opens the new draft.
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'Bilinməyən xəta';
            toast.error('Xəta: ' + msg);
            setLoading(false);
            api.get('/ai/usage').then(res => setAiUsage(res.data)).catch(() => {});
        }
    };

    // Closing while a generation is in flight is allowed — it keeps running on
    // the server and the teacher gets a notification when the draft is ready.
    const handleClose = () => {
        if (loading) {
            toast('İmtahan arxa fonda yaradılır 🔔 Hazır olanda bildiriş alacaqsınız.', {
                icon: '⏳', duration: 5000,
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <HiOutlineSparkles className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-extrabold leading-tight">AI ilə İmtahan Yarat</h2>
                                <p className="text-xs text-blue-200 mt-0.5">
                                    Gemini{selectedSubject ? ` · ${selectedSubject}` : ''}
                                </p>
                            </div>
                            {aiUsage && (
                                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    aiUsage.remaining === -1
                                        ? 'bg-white/20 text-white'
                                        : aiUsage.remaining > 5
                                            ? 'bg-white/20 text-white'
                                            : aiUsage.remaining > 0
                                                ? 'bg-amber-400/30 text-amber-100'
                                                : 'bg-red-400/30 text-red-100'
                                }`}>
                                    {aiUsage.remaining === -1 ? '∞ limitsiz' : `${aiUsage.remaining}/${aiUsage.limit} qaldı`}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Optional exam title — blank falls back to an auto-generated name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            İmtahan adı <span className="text-gray-400 normal-case font-medium">(istəyə bağlı)</span>
                        </label>
                        <input
                            type="text"
                            value={examTitle}
                            onChange={e => setExamTitle(e.target.value)}
                            disabled={loading}
                            placeholder="Boş qoysanız avtomatik ad veriləcək"
                            maxLength={120}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 transition-colors"
                        />
                    </div>

                    {/* Subject + Topic row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fənn</label>
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                disabled={loading || loadingSubjects}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-60 transition-colors"
                            >
                                {loadingSubjects ? (
                                    <option>Yüklənir...</option>
                                ) : (
                                    <>
                                        <option value="" disabled>Fənn seç</option>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Mövzular
                            </label>
                            {/* Chip-based multi-topic picker: user can pick from preset
                                topics via the datalist OR type their own. Each topic
                                becomes a removable chip. Enter / comma commits the
                                pending text into a chip; Backspace on empty input
                                removes the last chip. */}
                            <div
                                className={`w-full min-h-[40px] px-2 py-1.5 rounded-xl border border-gray-200 bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors flex flex-wrap items-center gap-1.5 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
                                onClick={() => topicInputRef.current?.focus()}
                            >
                                {selectedTopics.map(t => (
                                    <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full pl-2.5 pr-1 py-0.5">
                                        {t}
                                        <button
                                            type="button"
                                            onClick={() => removeTopic(t)}
                                            className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-blue-200/60 text-blue-500"
                                            title="Mövzunu sil"
                                        >
                                            <HiOutlineX className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    ref={topicInputRef}
                                    type="text"
                                    list="ai-exam-topic-suggestions"
                                    value={topicInput}
                                    onChange={e => {
                                        const v = e.target.value;
                                        // datalist click pastes the full value; commit it as a chip immediately.
                                        if (v && topics.some(t => t.name === v)) {
                                            addTopic(v);
                                        } else {
                                            setTopicInput(v);
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ',') {
                                            e.preventDefault();
                                            addTopic(topicInput);
                                        } else if (e.key === 'Backspace' && !topicInput && selectedTopics.length > 0) {
                                            // Quick-delete the last chip when the input is empty.
                                            removeTopic(selectedTopics[selectedTopics.length - 1]);
                                        }
                                    }}
                                    onBlur={() => { if (topicInput.trim()) addTopic(topicInput); }}
                                    disabled={loading}
                                    placeholder={selectedTopics.length === 0
                                        ? (topics.length > 0 ? 'Siyahıdan seç və ya yaz...' : 'Mövzu adı yazıb Enter')
                                        : 'Daha bir mövzu əlavə et...'}
                                    className="flex-1 min-w-[120px] text-sm font-medium text-gray-800 bg-transparent border-none focus:ring-0 focus:outline-none px-1"
                                />
                                {topics.length > 0 && (
                                    <datalist id="ai-exam-topic-suggestions">
                                        {topics.map(t => <option key={t.id} value={t.name} />)}
                                    </datalist>
                                )}
                            </div>
                            {selectedTopics.length > 1 && (
                                <p className="text-[10.5px] text-gray-400 mt-1.5 leading-snug">
                                    {totalCount > 1
                                        ? 'Suallar bu mövzular arasında bərabər paylaşdırılacaq.'
                                        : 'Yalnız 1 sual — AI ya bütün mövzuları bir sualda birləşdirəcək, ya da birini seçəcək.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Çətinlik</label>
                        <div className="flex gap-2">
                            {DIFFICULTIES.map(d => (
                                <button
                                    key={d.key}
                                    onClick={() => setDifficulty(d.key)}
                                    disabled={loading}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border disabled:opacity-60 ${
                                        difficulty === d.key
                                            ? d.key === 'EASY'
                                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                : d.key === 'HARD'
                                                    ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                                    : 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question type counters */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Sual tipləri</label>
                            {totalCount > 0 && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                    Cəmi: {totalCount} sual
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {QUESTION_TYPES.map(qt => (
                                <div key={qt.key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${counts[qt.key] > 0 ? 'border-blue-200 bg-blue-50/60' : 'border-gray-100 bg-gray-50'}`}>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{qt.label}</p>
                                        <p className="text-xs text-gray-400">{qt.sublabel}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => changeCount(qt.key, -1)}
                                            disabled={loading || counts[qt.key] === 0}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 transition-all"
                                        >
                                            −
                                        </button>
                                        <span className={`w-8 text-center text-sm font-extrabold ${counts[qt.key] > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                                            {counts[qt.key]}
                                        </span>
                                        <button
                                            onClick={() => changeCount(qt.key, 1)}
                                            disabled={loading || counts[qt.key] >= 15}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Loading state — the modal stays here on the spinner until the
                        completion notification arrives; the teacher may also close. */}
                    {loading && (
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <div className="w-4 h-4 mt-0.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-700">İmtahan yaradılır...</p>
                                <p className="text-xs text-blue-500 mt-0.5">
                                    Bu pəncərəni bağlasanız belə arxa fonda davam edəcək — hazır olanda bildiriş gələcək.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        {loading ? 'Bağla' : 'Ləğv et'}
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || totalCount === 0 || !selectedSubject || (aiUsage && aiUsage.remaining === 0) || (aiUsage && aiUsage.remaining !== -1 && totalCount > aiUsage.remaining)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {aiUsage && aiUsage.remaining === 0 ? (
                            <>Aylıq limit bitdi</>
                        ) : aiUsage && aiUsage.remaining !== -1 && totalCount > aiUsage.remaining ? (
                            <>{aiUsage.remaining} sual qaldı, azaldın</>
                        ) : loading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yaradılır...</>
                        ) : (
                            <><HiOutlineSparkles className="w-4 h-4" /> Yarat</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiExamModal;
