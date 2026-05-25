import { useState, useEffect } from 'react';
import { validateLatexSyntax, getLatexErrorMessage, autoWrapBareLatex } from '../../utils/latexValidator';
import {
    HiOutlineSparkles, HiOutlineRefresh, HiOutlineCheck, HiOutlineX,
    HiOutlineChevronDown, HiOutlineExclamation, HiOutlineLightningBolt
} from 'react-icons/hi';
import Modal from './Modal';
import { LatexPreview } from './index';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/enumLabels';

const DIFFICULTY_OPTIONS = [
    { value: 'EASY',   label: DIFFICULTY_LABELS.EASY,   color: 'text-green-600 bg-green-50' },
    { value: 'MEDIUM', label: DIFFICULTY_LABELS.MEDIUM, color: 'text-yellow-600 bg-yellow-50' },
    { value: 'HARD',   label: DIFFICULTY_LABELS.HARD,   color: 'text-red-600 bg-red-50' },
];

const TYPE_OPTIONS = [
    { value: 'MCQ',               label: QUESTION_TYPE_LABELS.MCQ               },
    { value: 'MULTI_SELECT',      label: QUESTION_TYPE_LABELS.MULTI_SELECT      },
    { value: 'OPEN_AUTO',         label: QUESTION_TYPE_LABELS.OPEN_AUTO         },
    { value: 'FILL_IN_THE_BLANK', label: QUESTION_TYPE_LABELS.FILL_IN_THE_BLANK },
];

const TYPE_COLORS = {
    MCQ:               'bg-blue-50 text-blue-700',
    MULTI_SELECT:      'bg-emerald-50 text-emerald-700',
    OPEN_AUTO:         'bg-green-50 text-green-700',
    FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
};

const DIFF_COLORS = {
    EASY:   'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HARD:   'bg-red-50 text-red-700',
};

// ─── Preview card for a single generated question ────────────────────────────
const PreviewQuestion = ({ q, index, onRemove }) => {
    const errors = [];
    const contentVal = validateLatexSyntax(q.content);
    if (!contentVal.valid) errors.push(...contentVal.errors);
    (q.options || []).forEach((opt) => {
        const v = validateLatexSyntax(opt.content || opt.text);
        if (!v.valid) errors.push(...v.errors);
    });
    if (q.correctAnswer) {
        const v = validateLatexSyntax(q.correctAnswer);
        if (!v.valid) errors.push(...v.errors);
    }
    const hasError = errors.length > 0;

    return (
    <div className={`relative p-4 bg-white border rounded-xl shadow-sm group ${hasError ? 'border-red-300 bg-red-50/30' : 'border-gray-100'}`}>
        <button
            onClick={() => onRemove(index)}
            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
            <HiOutlineX className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs text-gray-400 font-semibold">Sual {index + 1}</p>
            {hasError && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                    ⚠ LaTeX xətalı — silin
                </span>
            )}
        </div>
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

        {/* Open / Fill-in-blank answer. The AI emits `$5$` / `$\frac{1}{2}$`
            etc., so we have to render through LatexPreview rather than
            printing the raw string (which leaves the literal dollar
            markers showing in the preview card). For fill-in-blank we
            also show the correct answer above the distractor options. */}
        {q.correctAnswer && (!q.options?.length || !q.options.some(o => o.isCorrect)) && (
            <div className="mt-2.5 text-xs px-2.5 py-1.5 bg-green-50 text-green-800 rounded-lg font-medium flex items-center gap-1.5">
                <span>✓</span>
                <span className="flex-1"><LatexPreview content={q.correctAnswer} placeholder={null} /></span>
            </div>
        )}
    </div>
    );
};

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
    const [aiUsage, setAiUsage] = useState(null); // { limit, used, remaining }

    useEffect(() => {
        if (!isOpen) {
            setGenerated(null);
            setError('');
        } else {
            api.get('/ai/usage').then(res => setAiUsage(res.data)).catch(() => {});
        }
    }, [isOpen]);

    const refreshAiUsage = () => {
        api.get('/ai/usage').then(res => setAiUsage(res.data)).catch(() => {});
    };

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
            refreshAiUsage();
        }
    };

    const handleRemoveQuestion = (index) => {
        setGenerated(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!generated || generated.length === 0) return;

        // Validate LaTeX syntax in all generated questions.
        // The AI sometimes forgets to wrap math in `$...$` (especially in
        // FILL_IN_THE_BLANK correctAnswer / OPEN_AUTO answer fields, e.g.
        // `\frac{x^2}{2}+C` for an integral question). autoWrapBareLatex
        // fixes that silently so the teacher doesn't have to manually edit
        // every AI-generated answer to make it pass validation.
        for (let i = 0; i < generated.length; i++) {
            const q = generated[i];
            if (q.content) q.content = autoWrapBareLatex(q.content);
            if (q.correctAnswer) q.correctAnswer = autoWrapBareLatex(q.correctAnswer);
            if (Array.isArray(q.options)) {
                q.options.forEach(opt => {
                    if (opt.content) opt.content = autoWrapBareLatex(opt.content);
                });
            }
            const contentValidation = validateLatexSyntax(q.content);
            if (!contentValidation.valid) {
                toast.error(`Sual ${i + 1}-də LaTeX xətası:\n${getLatexErrorMessage(contentValidation.errors)}`);
                return;
            }
            if (q.options) {
                for (const opt of q.options) {
                    const optValidation = validateLatexSyntax(opt.content);
                    if (!optValidation.valid) {
                        toast.error(`Sual ${i + 1} variantda LaTeX xətası:\n${getLatexErrorMessage(optValidation.errors)}`);
                        return;
                    }
                }
            }
            if (q.correctAnswer) {
                const answerValidation = validateLatexSyntax(q.correctAnswer);
                if (!answerValidation.valid) {
                    toast.error(`Sual ${i + 1} cavabda LaTeX xətası:\n${getLatexErrorMessage(answerValidation.errors)}`);
                    return;
                }
            }
        }

        setSaving(true);
        let saved = 0;
        let failed = 0;
        for (let i = 0; i < generated.length; i++) {
            const q = generated[i];
            // FILL_IN_THE_BLANK: editor and grader expect correctAnswer as a
            // JSON-stringified array (one entry per `___`) and want the
            // correct answers mirrored into `options` with isCorrect=true so
            // they show up in the student-facing chip pool.
            let payload = q;
            if (q.questionType === 'FILL_IN_THE_BLANK' && q.correctAnswer) {
                let answers;
                try {
                    const parsed = JSON.parse(q.correctAnswer);
                    answers = Array.isArray(parsed) ? parsed : [q.correctAnswer];
                } catch {
                    answers = [q.correctAnswer];
                }
                const correctOpts = answers.map((a, idx) => ({
                    content: a,
                    isCorrect: true,
                    orderIndex: idx,
                }));
                payload = {
                    ...q,
                    correctAnswer: JSON.stringify(answers),
                    options: [...correctOpts, ...(q.options || [])],
                };
            }
            try {
                await api.post('/bank/questions', payload);
                saved++;
            } catch (e) {
                // Use the loop index so the toast points to the actually-failed
                // question. The previous `saved + 1` reported a misleading
                // number whenever multiple saves failed.
                failed++;
                toast.error(`Sual ${i + 1} saxlanıla bilmədi`);
            }
        }
        setSaving(false);
        if (saved > 0) {
            toast.success(`${saved} sual bazaya əlavə edildi${failed > 0 ? ` (${failed} uğursuz)` : ''}`);
            onSave?.();
            onClose();
        } else {
            toast.error('Heç bir sual saxlanıla bilmədi');
        }
    };

    const diffObj = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-md">
                    <HiOutlineSparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">AI ilə Sual Yarat</h2>
                    <p className="text-xs text-gray-400">Gemini 2.0 Flash · {subjectName}</p>
                </div>
                {aiUsage && (
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        aiUsage.remaining === -1
                            ? 'bg-green-100 text-green-700'
                            : aiUsage.remaining > 5
                                ? 'bg-emerald-100 text-emerald-700'
                                : aiUsage.remaining > 0
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                    }`}>
                        {aiUsage.remaining === -1 ? '∞ limitsiz' : `${aiUsage.remaining}/${aiUsage.limit} qaldı`}
                    </div>
                )}
            </div>

            {/* Config row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Topic — combobox: pick from preset list OR type your own.
                    `<datalist>` keeps it native: clicking the chevron shows
                    suggestions, but the input also accepts free text so subjects
                    like music/PE/art (which have no fixed curriculum topics) and
                    every other subject behave the same way. */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mövzu</label>
                    <div className="relative">
                        <input
                            type="text"
                            list="ai-topic-suggestions"
                            placeholder={topics.length > 0 ? 'Siyahıdan seç və ya öz mövzunu yaz' : 'Mövzu adı (istəyə bağlı)'}
                            value={topicName}
                            onChange={e => setTopicName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 pr-8"
                        />
                        {topics.length > 0 && (
                            <>
                                <datalist id="ai-topic-suggestions">
                                    {topics.map(t => {
                                        const value = typeof t === 'object' ? t.name : t;
                                        return <option key={typeof t === 'object' ? t.id : t} value={value} />;
                                    })}
                                </datalist>
                                <HiOutlineChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </>
                        )}
                    </div>
                </div>

                {/* Question type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sual tipi</label>
                    <div className="relative">
                        <select
                            value={questionType}
                            onChange={e => setQuestionType(e.target.value)}
                            className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 pr-8"
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
                        className="w-24 accent-blue-600"
                    />
                    <span className="text-sm font-bold text-blue-600 w-5 text-center">{count}</span>
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
                    disabled={generating || (aiUsage && aiUsage.remaining === 0) || (aiUsage && aiUsage.remaining !== -1 && count > aiUsage.remaining)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {aiUsage && aiUsage.remaining === 0 ? (
                        <>Aylıq limit bitdi</>
                    ) : aiUsage && aiUsage.remaining !== -1 && count > aiUsage.remaining ? (
                        <>{aiUsage.remaining} sual qaldı</>
                    ) : generating ? (
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
