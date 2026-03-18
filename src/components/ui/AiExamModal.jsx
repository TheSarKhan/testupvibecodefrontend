import { useState, useEffect } from 'react';
import { HiOutlineSparkles, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QUESTION_TYPES = [
    { key: 'MCQ', label: 'Test', sublabel: 'MCQ' },
    { key: 'MULTI_SELECT', label: 'Çox seçimli', sublabel: 'Multi-select' },
    { key: 'OPEN_AUTO', label: 'Açıq', sublabel: 'Open Auto' },
    { key: 'FILL_IN_THE_BLANK', label: 'Boşluq', sublabel: 'Fill in blank' },
];

const DIFFICULTIES = [
    { key: 'EASY', label: 'Asan' },
    { key: 'MEDIUM', label: 'Orta' },
    { key: 'HARD', label: 'Çətin' },
];

const LOADING_MESSAGES = {
    MCQ: 'MCQ sualları yaradılır...',
    MULTI_SELECT: 'Çox seçimli suallar yaradılır...',
    OPEN_AUTO: 'Açıq suallar yaradılır...',
    FILL_IN_THE_BLANK: 'Boşluq sualları yaradılır...',
};

const AiExamModal = ({ onClose, onGenerate }) => {
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [counts, setCounts] = useState({ MCQ: 5, MULTI_SELECT: 0, OPEN_AUTO: 0, FILL_IN_THE_BLANK: 0 });
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    useEffect(() => {
        setLoadingSubjects(true);
        api.get('/subjects')
            .then(res => {
                const names = res.data || [];
                setSubjects(names);
                if (names.length > 0) setSelectedSubject(names[0]);
            })
            .catch(() => toast.error('Fənlər yüklənərkən xəta baş verdi'))
            .finally(() => setLoadingSubjects(false));
    }, []);

    useEffect(() => {
        if (!selectedSubject) { setTopics([]); setSelectedTopic(''); return; }
        api.get(`/subjects/topics?name=${encodeURIComponent(selectedSubject)}`)
            .then(res => { setTopics(res.data || []); setSelectedTopic(''); })
            .catch(() => { setTopics([]); setSelectedTopic(''); });
    }, [selectedSubject]);

    const totalCount = Object.values(counts).reduce((s, v) => s + v, 0);

    const changeCount = (key, delta) => {
        setCounts(prev => ({ ...prev, [key]: Math.max(0, Math.min(15, (prev[key] || 0) + delta)) }));
    };

    const handleGenerate = async () => {
        if (totalCount === 0) { toast.error('Ən azı 1 sual seçin'); return; }
        if (!selectedSubject) { toast.error('Fənn seçin'); return; }

        const typeCounts = {};
        Object.entries(counts).forEach(([k, v]) => { if (v > 0) typeCounts[k] = v; });

        // Show a rolling loading message cycling through active types
        const activeTypes = Object.keys(typeCounts);
        let msgIdx = 0;
        setLoadingMsg(LOADING_MESSAGES[activeTypes[0]] || 'Suallar yaradılır...');
        setLoading(true);

        const interval = setInterval(() => {
            msgIdx = (msgIdx + 1) % activeTypes.length;
            setLoadingMsg(LOADING_MESSAGES[activeTypes[msgIdx]] || 'Suallar yaradılır...');
        }, 2500);

        try {
            const { data } = await api.post('/ai/generate-exam', {
                subjectName: selectedSubject,
                topicName: selectedTopic || null,
                difficulty,
                typeCounts,
            });
            clearInterval(interval);
            toast.success(`${data.length} sual uğurla yaradıldı`);
            onGenerate(data, selectedSubject);
        } catch (err) {
            clearInterval(interval);
            const msg = err?.response?.data?.error || err.message || 'Bilinməyən xəta';
            toast.error('Xəta: ' + msg);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <HiOutlineSparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold leading-tight">AI ilə İmtahan Yarat</h2>
                                <p className="text-xs text-indigo-200 mt-0.5">
                                    Groq LLaMA 3.3{selectedSubject ? ` · ${selectedSubject}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Subject + Topic row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fənn</label>
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                disabled={loading || loadingSubjects}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-60 transition-colors"
                            >
                                {loadingSubjects
                                    ? <option>Yüklənir...</option>
                                    : subjects.map(s => <option key={s} value={s}>{s}</option>)
                                }
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Mövzu <span className="text-gray-300 font-normal">(isteğe bağlı)</span>
                            </label>
                            <select
                                value={selectedTopic}
                                onChange={e => setSelectedTopic(e.target.value)}
                                disabled={loading || topics.length === 0}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-60 transition-colors"
                            >
                                <option value="">Ümumi</option>
                                {topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
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
                                                    : 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
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
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                    Cəmi: {totalCount} sual
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {QUESTION_TYPES.map(qt => (
                                <div key={qt.key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${counts[qt.key] > 0 ? 'border-indigo-200 bg-indigo-50/60' : 'border-gray-100 bg-gray-50'}`}>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{qt.label}</p>
                                        <p className="text-xs text-gray-400">{qt.sublabel}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => changeCount(qt.key, -1)}
                                            disabled={loading || counts[qt.key] === 0}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                        >
                                            −
                                        </button>
                                        <span className={`w-8 text-center text-sm font-extrabold ${counts[qt.key] > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                                            {counts[qt.key]}
                                        </span>
                                        <button
                                            onClick={() => changeCount(qt.key, 1)}
                                            disabled={loading || counts[qt.key] >= 15}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            <p className="text-sm font-medium text-indigo-700">{loadingMsg}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Ləğv et
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || totalCount === 0 || !selectedSubject}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiOutlineSparkles className="w-4 h-4" />
                        )}
                        {loading ? 'Yaradılır...' : 'Yarat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiExamModal;
