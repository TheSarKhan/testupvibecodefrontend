import { useState, useEffect } from 'react';
import {
    HiOutlineSparkles, HiOutlineRefresh, HiOutlineCheck, HiOutlineX,
    HiOutlineChevronDown, HiOutlineExclamation, HiOutlineLightningBolt
} from 'react-icons/hi';
import Modal from './Modal';
import { LatexPreview } from './index';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DIFFICULTY_OPTIONS = [
    { value: 'EASY',   label: 'Asan',  color: 'text-green-600 bg-green-50' },
    { value: 'MEDIUM', label: 'Orta',  color: 'text-yellow-600 bg-yellow-50' },
    { value: 'HARD',   label: 'Çətin', color: 'text-red-600 bg-red-50' },
];

const TYPE_OPTIONS = [
    { value: 'MCQ',              label: 'Test (MCQ)'        },
    { value: 'MULTI_SELECT',     label: 'Çox seçimli'       },
    { value: 'OPEN_AUTO',        label: 'Açıq (avtomatik)'  },
    { value: 'FILL_IN_THE_BLANK',label: 'Boşluq doldurma'   },
];

const TYPE_COLORS = {
    MCQ:               'bg-indigo-50 text-indigo-700',
    MULTI_SELECT:      'bg-violet-50 text-violet-700',
    OPEN_AUTO:         'bg-green-50 text-green-700',
    FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
};

const DIFF_COLORS = {
    EASY:   'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HARD:   'bg-red-50 text-red-700',
};

// ─── Preview card for a single generated question ────────────────────────────
const PreviewQuestion = ({ q, index, onRemove }) => (
    <div className="relative p-4 bg-white border border-gray-100 rounded-xl shadow-sm group">
        <button
            onClick={() => onRemove(index)}
            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
            <HiOutlineX className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-400 font-semibold mb-1.5">Sual {index + 1}</p>
        <div className="text-sm font-medium text-gray-800 leading-relaxed pr-6">
            <LatexPreview content={q.content} />
        </div>

        {/* MCQ / MULTI_SELECT options */}
        {q.options && q.options.length > 0 && (
            <ul className="mt-3 space-y-1">
                {q.options.map((opt, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                        opt.isCorrect
                            ? 'bg-green-50 text-green-800 font-semibold'
                            : 'bg-gray-50 text-gray-600'
                    }`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {opt.isCorrect ? '✓' : String.fromCharCode(65 + i)}
                        </span>
                        <LatexPreview content={opt.content || opt.text} />
                    </li>
                ))}
            </ul>
        )}

        {/* Open / Fill-in-blank answer */}
        {q.correctAnswer && !q.options?.length && (
            <p className="mt-2.5 text-xs px-2.5 py-1.5 bg-green-50 text-green-800 rounded-lg font-medium">
                ✓ {q.correctAnswer}
            </p>
        )}
    </div>
);

// ─── Main modal ──────────────────────────────────────────────────────────────
const AiGenerateModal = ({ isOpen, onClose, subjectId, subjectName, topics = [], onSave }) => {
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [questionType, setQuestionType] = useState('MCQ');
    const [topicName, setTopicName] = useState('');
    const [count, setCount] = useState(5);

    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generated, setGenerated] = useState(null); // null | []
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setGenerated(null);
            setError('');
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        setGenerated(null);
        try {
            const { data } = await api.post('/ai/generate-questions', {
                subjectId,
                subjectName,
                topicName: topicName || null,
                difficulty,
                questionType,
                count,
            });
            if (data.error) {
                setError(data.error);
            } else {
                setGenerated(data);
            }
        } catch (e) {
            const msg = e.response?.data?.error || 'Sual generasiyası zamanı xəta baş verdi.';
            setError(msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleRemoveQuestion = (index) => {
        setGenerated(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!generated || generated.length === 0) return;
        setSaving(true);
        let saved = 0;
        for (const q of generated) {
            try {
                await api.post('/bank/questions', q);
                saved++;
            } catch (e) {
                toast.error(`Sual ${saved + 1} saxlanıla bilmədi`);
            }
        }
        setSaving(false);
        toast.success(`${saved} sual sual bazasına əlavə edildi`);
        onSave?.();
        onClose();
    };

    const diffObj = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <HiOutlineSparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">AI ilə Sual Yarat</h2>
                    <p className="text-xs text-gray-400">Gemini 2.0 Flash · {subjectName}</p>
                </div>
            </div>

            {/* Config row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Topic */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mövzu</label>
                    {topics.length > 0 ? (
                        <div className="relative">
                            <select
                                value={topicName}
                                onChange={e => setTopicName(e.target.value)}
                                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
                            >
                                <option value="">Bütün mövzular</option>
                                {topics.map(t => (
                                    <option key={typeof t === 'object' ? t.id : t} value={typeof t === 'object' ? t.name : t}>
                                        {typeof t === 'object' ? t.name : t}
                                    </option>
                                ))}
                            </select>
                            <HiOutlineChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Mövzu adı (istəyə bağlı)"
                            value={topicName}
                            onChange={e => setTopicName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    )}
                </div>

                {/* Question type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sual tipi</label>
                    <div className="relative">
                        <select
                            value={questionType}
                            onChange={e => setQuestionType(e.target.value)}
                            className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
                        >
                            {TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <HiOutlineChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Difficulty pills + count */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Çətinlik:</span>
                    {DIFFICULTY_OPTIONS.map(d => (
                        <button
                            key={d.value}
                            onClick={() => setDifficulty(d.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                difficulty === d.value
                                    ? `${d.color} ring-2 ring-offset-1 ring-current`
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>

                {/* Count slider */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Say:</span>
                    <input
                        type="range" min="1" max="10" value={count}
                        onChange={e => setCount(Number(e.target.value))}
                        className="w-24 accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-indigo-600 w-5 text-center">{count}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <HiOutlineExclamation className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Generated preview */}
            {generated !== null && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">
                            {generated.length} sual generasiya edildi
                        </p>
                        <div className="flex gap-1.5">
                            {generated.length > 0 && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLORS[difficulty]}`}>
                                    {diffObj?.label}
                                </span>
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[questionType]}`}>
                                {TYPE_OPTIONS.find(t => t.value === questionType)?.label}
                            </span>
                        </div>
                    </div>
                    {generated.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Bütün suallar silindi</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {generated.map((q, i) => (
                                <PreviewQuestion key={i} q={q} index={i} onRemove={handleRemoveQuestion} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generasiya olunur...
                        </>
                    ) : (
                        <>
                            {generated !== null ? <HiOutlineRefresh className="w-4 h-4" /> : <HiOutlineLightningBolt className="w-4 h-4" />}
                            {generated !== null ? 'Yenidən yarat' : 'Sual Yarat'}
                        </>
                    )}
                </button>

                {generated && generated.length > 0 && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                        )}
                        {saving ? 'Saxlanılır...' : `${generated.length} sualı saxla`}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default AiGenerateModal;
