import { useState, useEffect } from 'react';
import { validateLatexSyntax, getLatexErrorMessage, autoWrapBareLatex } from '../../utils/latexValidator';
import {
    HiOutlineSparkles, HiOutlineRefresh, HiOutlineCheck, HiOutlineX,
    HiOutlineChevronDown, HiOutlineExclamation, HiOutlineLightningBolt,
    HiOutlinePencil, HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineSwitchHorizontal
} from 'react-icons/hi';
import Modal from './Modal';
import { LatexPreview } from './index';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import getErrorMessage from '../../utils/getErrorMessage';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/enumLabels';

const DIFFICULTY_OPTIONS = [
    { value: 'EASY',   label: DIFFICULTY_LABELS.EASY,   color: 'text-green-600 bg-green-50' },
    { value: 'MEDIUM', label: DIFFICULTY_LABELS.MEDIUM, color: 'text-yellow-600 bg-yellow-50' },
    { value: 'HARD',   label: DIFFICULTY_LABELS.HARD,   color: 'text-red-600 bg-red-50' },
];

const TYPE_OPTIONS = [
    { value: 'MCQ',               label: QUESTION_TYPE_LABELS.MCQ               },
    { value: 'TRUE_FALSE',        label: QUESTION_TYPE_LABELS.TRUE_FALSE        },
    { value: 'MULTI_SELECT',      label: QUESTION_TYPE_LABELS.MULTI_SELECT      },
    { value: 'MATCHING',          label: QUESTION_TYPE_LABELS.MATCHING          },
    { value: 'OPEN_AUTO',         label: QUESTION_TYPE_LABELS.OPEN_AUTO         },
    { value: 'FILL_IN_THE_BLANK', label: QUESTION_TYPE_LABELS.FILL_IN_THE_BLANK },
];

const TYPE_COLORS = {
    MCQ:               'bg-blue-50 text-blue-700',
    TRUE_FALSE:        'bg-indigo-50 text-indigo-700',
    MULTI_SELECT:      'bg-emerald-50 text-emerald-700',
    MATCHING:          'bg-purple-50 text-purple-700',
    OPEN_AUTO:         'bg-green-50 text-green-700',
    FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
};

const DIFF_COLORS = {
    EASY:   'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HARD:   'bg-red-50 text-red-700',
};

// Per-card refine actions (BUG-22): each replaces ONLY this card's question.
const REFINE_ACTIONS = [
    { key: 'REGENERATE', label: 'Yenidən yarat', icon: HiOutlineRefresh },
    { key: 'EASIER',     label: 'Asanlaşdır',    icon: HiOutlineArrowDown },
    { key: 'HARDER',     label: 'Çətinləşdir',   icon: HiOutlineArrowUp },
    { key: 'REWORD',     label: 'Yenidən söz et', icon: HiOutlineSwitchHorizontal },
];

// ─── Inline editor for one generated question (BUG-22) ───────────────────────
const InlineEditForm = ({ q, onSaveEdit, onCancel }) => {
    const [content, setContent] = useState(q.content || '');
    const [options, setOptions] = useState((q.options || []).map(o => ({
        content: o.content ?? o.text ?? '',
        isCorrect: !!o.isCorrect,
    })));
    const [pairs, setPairs] = useState((q.matchingPairs || []).map(p => ({
        leftItem: p.leftItem || '',
        rightItem: p.rightItem || '',
    })));
    const [correctAnswer, setCorrectAnswer] = useState(q.correctAnswer || '');
    // MCQ and TRUE_FALSE both keep exactly one correct option.
    const isSingleCorrect = q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE';
    const isMatching = q.questionType === 'MATCHING';

    const toggleCorrect = (idx) => {
        setOptions(prev => prev.map((o, i) => {
            if (isSingleCorrect) return { ...o, isCorrect: i === idx };
            return i === idx ? { ...o, isCorrect: !o.isCorrect } : o;
        }));
    };

    const handleSave = () => {
        if (!content.trim()) { toast.error('Sual mətni boş ola bilməz'); return; }
        const cleanPairs = pairs
            .filter(p => p.leftItem.trim() && p.rightItem.trim())
            .map((p, i) => ({ leftItem: p.leftItem.trim(), rightItem: p.rightItem.trim(), orderIndex: i }));
        if (isMatching && cleanPairs.length < 2) {
            toast.error('Uyğunlaşdırma üçün ən azı 2 tam cüt lazımdır');
            return;
        }
        onSaveEdit({
            ...q,
            content: content.trim(),
            correctAnswer: correctAnswer.trim() || null,
            options: options
                .filter(o => o.content.trim())
                .map((o, i) => ({ content: o.content.trim(), isCorrect: o.isCorrect, orderIndex: i })),
            matchingPairs: cleanPairs,
        });
    };

    return (
        <div className="space-y-2.5">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={2}
                className="w-full text-sm px-2.5 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                placeholder="Sual mətni"
            />
            {options.length > 0 && (
                <div className="space-y-1.5">
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => toggleCorrect(i)}
                                title={opt.isCorrect ? 'Düzgün cavab' : 'Düzgün kimi işarələ'}
                                className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold border transition-colors ${
                                    opt.isCorrect
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-white border-gray-300 text-gray-400 hover:border-green-400'
                                }`}
                            >
                                {opt.isCorrect ? '✓' : String.fromCharCode(65 + i)}
                            </button>
                            <input
                                type="text"
                                value={opt.content}
                                onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, content: e.target.value } : o))}
                                className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                        </div>
                    ))}
                </div>
            )}
            {isMatching && (
                <div className="space-y-1.5">
                    {pairs.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={p.leftItem}
                                onChange={e => setPairs(prev => prev.map((x, j) => j === i ? { ...x, leftItem: e.target.value } : x))}
                                placeholder="Sol element"
                                className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                            <span className="text-gray-400 text-xs shrink-0">→</span>
                            <input
                                type="text"
                                value={p.rightItem}
                                onChange={e => setPairs(prev => prev.map((x, j) => j === i ? { ...x, rightItem: e.target.value } : x))}
                                placeholder="Sağ element"
                                className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                            <button
                                type="button"
                                onClick={() => setPairs(prev => prev.filter((_, j) => j !== i))}
                                className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                                title="Cütü sil"
                            >
                                <HiOutlineX className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setPairs(prev => [...prev, { leftItem: '', rightItem: '' }])}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        + Cüt əlavə et
                    </button>
                </div>
            )}
            {!isMatching && (q.questionType === 'OPEN_AUTO' || q.questionType === 'FILL_IN_THE_BLANK' || !options.length) && (
                <input
                    type="text"
                    value={correctAnswer}
                    onChange={e => setCorrectAnswer(e.target.value)}
                    placeholder="Düzgün cavab"
                    className="w-full text-xs px-2.5 py-1.5 border border-green-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
                />
            )}
            <div className="flex items-center gap-2 justify-end">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                >
                    Ləğv et
                </button>
                <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Tətbiq et
                </button>
            </div>
        </div>
    );
};

// ─── Preview card for a single generated question ────────────────────────────
const PreviewQuestion = ({ q, index, onRemove, onRefine, onEdit, isEditing, onSaveEdit, onCancelEdit, refining, refineDisabled }) => {
    const errors = [];
    const contentVal = validateLatexSyntax(q.content);
    if (!contentVal.valid) errors.push(...contentVal.errors);
    (q.options || []).forEach((opt) => {
        const v = validateLatexSyntax(opt.content || opt.text);
        if (!v.valid) errors.push(...v.errors);
    });
    (q.matchingPairs || []).forEach((p) => {
        const vl = validateLatexSyntax(p.leftItem);
        if (!vl.valid) errors.push(...vl.errors);
        const vr = validateLatexSyntax(p.rightItem);
        if (!vr.valid) errors.push(...vr.errors);
    });
    if (q.correctAnswer) {
        const v = validateLatexSyntax(q.correctAnswer);
        if (!v.valid) errors.push(...v.errors);
    }
    const hasError = errors.length > 0;
    const isRefining = refining?.index === index;

    return (
    <div className={`relative p-4 bg-white border rounded-xl shadow-sm group ${hasError ? 'border-red-300 bg-red-50/30' : 'border-gray-100'} ${isRefining ? 'opacity-70' : ''}`}>
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
                    ⚠ LaTeX xətalı — silin və ya yenidən yaradın
                </span>
            )}
        </div>

        {isEditing ? (
            <InlineEditForm q={q} onSaveEdit={onSaveEdit} onCancel={onCancelEdit} />
        ) : (
            <>
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

                {/* MATCHING pairs: left → right rows */}
                {q.matchingPairs && q.matchingPairs.length > 0 && (
                    <ul className="mt-3 space-y-1">
                        {q.matchingPairs.map((p, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-purple-50/60 text-gray-700">
                                <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                    {i + 1}
                                </span>
                                <span className="font-semibold"><LatexPreview content={p.leftItem} /></span>
                                <span className="text-purple-400 shrink-0">→</span>
                                <span><LatexPreview content={p.rightItem} /></span>
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

                {/* Refine action bar (BUG-22): polish THIS question only */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-50">
                    {REFINE_ACTIONS.map(a => {
                        const Icon = a.icon;
                        const active = isRefining && refining?.action === a.key;
                        return (
                            <button
                                key={a.key}
                                onClick={() => onRefine(index, a.key)}
                                disabled={!!refining || refineDisabled}
                                title={refineDisabled ? 'Aylıq AI limiti bitib' : a.label}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {active
                                    ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    : <Icon className="w-3 h-3" />}
                                {a.label}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => onEdit(index)}
                        disabled={!!refining}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-amber-50 hover:text-amber-600 border border-gray-100 transition-colors disabled:opacity-40"
                    >
                        <HiOutlinePencil className="w-3 h-3" />
                        Redaktə
                    </button>
                </div>
            </>
        )}
    </div>
    );
};

// ─── Main modal ──────────────────────────────────────────────────────────────
// saveToBank=false skips the bank POSTs entirely and just hands the prepared
// questions to onSave — used when the modal is opened from the exam editor so
// the questions go straight into the exam. seedQuestion (optional) asks the AI
// for variations similar to an existing question. lockedType (optional) pins
// the question type (template slots dictate it) and disables the selector.
const AiGenerateModal = ({ isOpen, onClose, subjectId, subjectName, topics = [], onSave, saveToBank = true, seedQuestion = null, lockedType = null }) => {
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [questionType, setQuestionType] = useState('MCQ');
    const [topicName, setTopicName] = useState('');
    const [count, setCount] = useState(5);
    const [instructions, setInstructions] = useState('');
    // Append by default — regenerating used to wipe the whole set (BUG-22).
    const [replaceMode, setReplaceMode] = useState(false);

    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generated, setGenerated] = useState(null); // null | []
    const [refining, setRefining] = useState(null);   // null | { index, action }
    const [editingIndex, setEditingIndex] = useState(null);
    const [error, setError] = useState('');
    const [aiUsage, setAiUsage] = useState(null); // { limit, used, remaining }

    useEffect(() => {
        if (!isOpen) {
            setGenerated(null);
            setError('');
            setRefining(null);
            setEditingIndex(null);
        } else {
            api.get('/ai/usage').then(res => setAiUsage(res.data)).catch(() => {});
            if (lockedType) setQuestionType(lockedType);
        }
    }, [isOpen, lockedType]);

    const refreshAiUsage = () => {
        api.get('/ai/usage').then(res => setAiUsage(res.data)).catch(() => {});
    };

    // Auto-wrap bare LaTeX immediately so refined/new cards preview cleanly.
    const cleanupQuestion = (q) => {
        const c = { ...q };
        if (c.content) c.content = autoWrapBareLatex(c.content);
        if (c.correctAnswer) c.correctAnswer = autoWrapBareLatex(c.correctAnswer);
        if (Array.isArray(c.options)) {
            c.options = c.options.map(o => ({ ...o, content: o.content ? autoWrapBareLatex(o.content) : o.content }));
        }
        if (Array.isArray(c.matchingPairs)) {
            c.matchingPairs = c.matchingPairs.map(p => ({
                ...p,
                leftItem: p.leftItem ? autoWrapBareLatex(p.leftItem) : p.leftItem,
                rightItem: p.rightItem ? autoWrapBareLatex(p.rightItem) : p.rightItem,
            }));
        }
        return c;
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const { data } = await api.post('/ai/generate-questions', {
                subjectId,
                subjectName,
                topicName: topicName || null,
                difficulty,
                questionType,
                count,
                instructions: instructions.trim() || null,
                seedQuestion: seedQuestion || null,
            });
            if (data.error) {
                setError(data.error);
            } else {
                // Default: append to what's already on screen; "replace" wipes.
                setGenerated(prev => (replaceMode || !prev) ? data : [...prev, ...data]);
            }
        } catch (e) {
            const msg = e.response?.data?.error || 'Sual generasiyası zamanı xəta baş verdi.';
            setError(msg);
        } finally {
            setGenerating(false);
            refreshAiUsage();
        }
    };

    // Per-question refine (BUG-22): replaces ONLY the card at `index`.
    const handleRefine = async (index, action) => {
        const q = generated?.[index];
        if (!q || refining) return;
        setRefining({ index, action });
        try {
            const { data } = await api.post('/ai/refine-question', {
                question: q,
                action,
                subjectId,
                subjectName,
                topicName: topicName || null,
                instructions: instructions.trim() || null,
            });
            // Guard against a stale response: if the modal was closed/reset
            // (generated → null) while this refine was in flight, do nothing
            // instead of calling .map() on null and crashing the whole app.
            setGenerated(prev => (prev ? prev.map((x, i) => (i === index ? cleanupQuestion(data) : x)) : prev));
            toast.success('Sual yeniləndi');
        } catch (e) {
            if (!e._handled) {
                toast.error(e.response?.data?.error || getErrorMessage(e, 'Sual yenilənə bilmədi'));
            }
        } finally {
            setRefining(null);
            refreshAiUsage();
        }
    };

    const handleSaveEdit = (index, updated) => {
        setGenerated(prev => (prev ? prev.map((x, i) => (i === index ? cleanupQuestion(updated) : x)) : prev));
        setEditingIndex(null);
    };

    const handleRemoveQuestion = (index) => {
        setGenerated(prev => (prev ? prev.filter((_, i) => i !== index) : prev));
        setEditingIndex(prev => (prev === index ? null : prev));
    };

    const handleSave = async () => {
        // Don't let the user commit while a per-question refine is still
        // running — the unfinished card would be saved and the in-flight
        // response would land on already-reset state.
        if (refining) {
            toast.error('Sual hələ də yenilənir, bir az gözləyin');
            return;
        }
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
            if (Array.isArray(q.matchingPairs)) {
                q.matchingPairs.forEach(p => {
                    if (p.leftItem) p.leftItem = autoWrapBareLatex(p.leftItem);
                    if (p.rightItem) p.rightItem = autoWrapBareLatex(p.rightItem);
                });
                for (const p of q.matchingPairs) {
                    const vl = validateLatexSyntax(p.leftItem);
                    const vr = validateLatexSyntax(p.rightItem);
                    if (!vl.valid || !vr.valid) {
                        toast.error(`Sual ${i + 1} uyğunlaşdırma cütündə LaTeX xətası:\n${getLatexErrorMessage([...(vl.errors || []), ...(vr.errors || [])])}`);
                        return;
                    }
                }
            }
        }

        // FILL_IN_THE_BLANK: editor and grader expect correctAnswer as a
        // JSON-stringified array (one entry per `___`) and want the
        // correct answers mirrored into `options` with isCorrect=true so
        // they show up in the student-facing chip pool.
        const toPayload = (q) => {
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
                return {
                    ...q,
                    correctAnswer: JSON.stringify(answers),
                    options: [...correctOpts, ...(q.options || [])],
                };
            }
            return q;
        };

        // Exam-editor context: skip the bank entirely — hand the prepared
        // questions to the caller, which inserts them into the exam.
        if (!saveToBank) {
            onSave?.(generated.map(toPayload));
            onClose();
            return;
        }

        setSaving(true);
        let failed = 0;
        const savedPayloads = [];
        for (let i = 0; i < generated.length; i++) {
            const payload = toPayload(generated[i]);
            try {
                await api.post('/bank/questions', payload);
                savedPayloads.push(payload);
            } catch (e) {
                // Use the loop index so the toast points to the actually-failed
                // question. The previous `saved + 1` reported a misleading
                // number whenever multiple saves failed.
                failed++;
                toast.error(`Sual ${i + 1} saxlanıla bilmədi`);
            }
        }
        setSaving(false);
        if (savedPayloads.length > 0) {
            toast.success(`${savedPayloads.length} sual bazaya əlavə edildi${failed > 0 ? ` (${failed} uğursuz)` : ''}`);
            onSave?.(savedPayloads);
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
                    <p className="text-xs text-gray-400">Gemini · {subjectName}</p>
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

            {/* Seed indicator: variations of an existing question are being generated */}
            {seedQuestion && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">
                    <HiOutlineSparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="min-w-0">
                        <span className="font-bold">Toxum sual:</span> seçilmiş suala bənzər (eyni konsept, kopya yox) variasiyalar yaradılacaq.
                    </p>
                </div>
            )}

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
                                        return <option key={value} value={value} />;
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
                            disabled={!!lockedType}
                            title={lockedType ? 'Sual tipi şablon tərəfindən müəyyən edilib' : undefined}
                            className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 pr-8 disabled:bg-gray-50 disabled:text-gray-500"
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

            {/* Free-form teacher guidance woven into the AI prompt (BUG-22) */}
            <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Əlavə təlimat <span className="text-gray-400 normal-case font-medium">(istəyə bağlı)</span>
                </label>
                <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Məs: real həyat nümunələri ver, DİM üslubu, törəmələrə toxunma"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
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
                                <PreviewQuestion
                                    key={i}
                                    q={q}
                                    index={i}
                                    onRemove={handleRemoveQuestion}
                                    onRefine={handleRefine}
                                    onEdit={setEditingIndex}
                                    isEditing={editingIndex === i}
                                    onSaveEdit={(updated) => handleSaveEdit(i, updated)}
                                    onCancelEdit={() => setEditingIndex(null)}
                                    refining={refining}
                                    refineDisabled={aiUsage && aiUsage.remaining === 0}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                    <button
                        onClick={handleGenerate}
                        disabled={generating || (aiUsage && aiUsage.remaining === 0) || (aiUsage && aiUsage.remaining !== -1 && count > aiUsage.remaining)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
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
                                {generated === null
                                    ? 'Sual Yarat'
                                    : replaceMode ? 'Tam yenidən yarat' : `Daha ${count} əlavə et`}
                            </>
                        )}
                    </button>
                    {/* Append (default) vs full replace — regenerating used to
                        always wipe the existing set (BUG-22). */}
                    {generated !== null && generated.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={replaceMode}
                                onChange={e => setReplaceMode(e.target.checked)}
                                className="w-3.5 h-3.5 accent-blue-600"
                            />
                            Mövcudları əvəz et
                        </label>
                    )}
                </div>

                {generated && generated.length > 0 && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !!refining}
                        title={refining ? 'Sual yenilənir, gözləyin' : undefined}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                        )}
                        {saving
                            ? 'Saxlanılır...'
                            : refining
                                ? 'Sual yenilənir...'
                                : saveToBank
                                    ? `${generated.length} sualı saxla`
                                    : `${generated.length} sualı imtahana əlavə et`}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default AiGenerateModal;
