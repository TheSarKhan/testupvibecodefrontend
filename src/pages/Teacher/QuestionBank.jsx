import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineSearch,
    HiOutlineCheck, HiOutlineEye, HiOutlineStar, HiStar,
    HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineLibrary,
    HiOutlineSortDescending, HiOutlineX, HiOutlineBookOpen,
    HiOutlinePencil, HiOutlineTrash,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';

// ───────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
    MCQ: 'Çoxseçimli',
    MULTIPLE_CHOICE: 'Çoxseçimli',
    MULTI_SELECT: 'Çoxlu cavab',
    TRUE_FALSE: 'Doğru / Yalan',
    OPEN_AUTO: 'Açıq cavab',
    OPEN_MANUAL: 'Açıq cavab',
    FILL_IN_THE_BLANK: 'Boşluq doldurma',
    MATCHING: 'Uyğunluq',
};

const DIFFICULTY_LABELS = { EASY: 'Asan', MEDIUM: 'Orta', HARD: 'Çətin' };
const DIFFICULTY_TONE = {
    EASY:   'bg-[var(--brand-green-50)] text-[var(--brand-green-700)] border-[var(--brand-green-200)]',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HARD:   'bg-red-50 text-red-700 border-red-200',
};

const SORT_OPTIONS = [
    { value: 'recent',  label: 'Ən yeni' },
    { value: 'order',   label: 'Sırası üzrə' },
    { value: 'name',    label: 'Mövzu A-Z' },
];

// Deterministic subject color from name hash — consistent across page loads.
// Foreground colors are pushed into the *-900 / *-950 range and backgrounds
// kept light-but-present so the pill text reads as strong, near-black ink
// rather than the washed-out tint the earlier *-600/-700 values produced.
const SUBJECT_COLORS = [
    { bg: '#CFE0FF', fg: '#172554' }, // blue
    { bg: '#E0CFFB', fg: '#3B0764' }, // violet
    { bg: '#BBF1D6', fg: '#022C22' }, // green
    { bg: '#FFDCB8', fg: '#431407' }, // orange
    { bg: '#FBCFE1', fg: '#500724' }, // pink
    { bg: '#BFE9F3', fg: '#083344' }, // cyan
    { bg: '#FDC9C9', fg: '#450A0A' }, // red
    { bg: '#B6EBE0', fg: '#042F2E' }, // teal
    { bg: '#D6DEE7', fg: '#020617' }, // slate
];

// A fixed near-black ink — used as the text colour when the subject ships its
// own colour from the backend. Using the backend hex directly as foreground
// often renders washed-out (it's tuned for a vibrant accent, not body text);
// we always pair the tinted background with this dark ink for legibility.
const SUBJECT_INK = '#0F172A'; // slate-900

const colorForSubject = (s) => {
    if (s.color) {
        const hex = s.color.startsWith('#') ? s.color : '#2563EB';
        return { bg: hex + '33', fg: SUBJECT_INK };
    }
    const hash = [...(s.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
};

const shortFor = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, Math.min(2, name.length)).toUpperCase();
};

// ───────────────────────────────────────────────────────────────────────────
// Sidebar — subject tree + type/difficulty filters
// ───────────────────────────────────────────────────────────────────────────

const Sidebar = ({
    subjects, activeSubjectId, onSelectSubject,
    typeFilter, onToggleType, difficultyFilter, onToggleDifficulty,
    typeCounts, difficultyCounts, totalCount,
    onAddSubject, onRenameSubject, onDeleteSubject, suggestions,
    addingExternalKey,
}) => {
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const inputRef = useRef(null);
    const renameRef = useRef(null);

    useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);
    useEffect(() => { if (renamingId) renameRef.current?.focus(); }, [renamingId]);

    // Parent can request the add-subject form to open by incrementing
    // `addingExternalKey` (e.g. from the empty-state CTA when there are no
    // subjects yet so the regular "Yeni sual" navigation is meaningless).
    useEffect(() => {
        if (addingExternalKey) {
            setAdding(true);
            // Scroll the sidebar into view so the focused input is visible.
            setTimeout(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
        }
    }, [addingExternalKey]);

    const submit = async () => {
        const name = newName.trim();
        if (!name || submitting) return;
        setSubmitting(true);
        try {
            await onAddSubject(name);
            setNewName('');
            setAdding(false);
        } finally {
            setSubmitting(false);
        }
    };

    const cancel = () => { setNewName(''); setAdding(false); };

    const startRename = (s) => {
        setRenamingId(s.id);
        setRenameValue(s.name);
    };
    const submitRename = async (s) => {
        const next = renameValue.trim();
        if (!next || next === s.name) { setRenamingId(null); return; }
        try {
            await onRenameSubject(s.id, next);
        } finally {
            setRenamingId(null);
        }
    };
    const cancelRename = () => { setRenamingId(null); setRenameValue(''); };

    return (
        <aside className="lg:sticky lg:top-6 self-start space-y-7">
            {/* Subject tree */}
            <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)]">
                        Fənnlərim
                    </h4>
                    {!adding && (
                        <button
                            onClick={() => setAdding(true)}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--brand-blue-100)] transition-colors"
                            title="Yeni fənn əlavə et"
                            aria-label="Yeni fənn əlavə et"
                        >
                            <HiOutlinePlus className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <nav className="space-y-0.5">
                    <button
                        onClick={() => onSelectSubject(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors ${
                            activeSubjectId === null
                                ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)] font-bold'
                                : 'text-[var(--ink-700)] hover:bg-white'
                        }`}
                    >
                        <HiOutlineLibrary className={`w-3.5 h-3.5 ${activeSubjectId === null ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`} />
                        <span className="flex-1 text-left">Bütün fənnlərim</span>
                        <span className={`text-[11px] font-mono ${activeSubjectId === null ? 'text-[var(--primary)]/70' : 'text-[var(--ink-400)]'}`}>{totalCount}</span>
                    </button>

                    {subjects.map(s => {
                        const c = colorForSubject(s);
                        const active = activeSubjectId === s.id;
                        const isRenaming = renamingId === s.id;
                        const canEdit = !s.isGlobal;

                        if (isRenaming) {
                            return (
                                <div key={s.id} className="px-3 py-1.5 rounded-xl bg-white border border-[var(--brand-blue-200)]">
                                    <input
                                        ref={renameRef}
                                        type="text"
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') { e.preventDefault(); submitRename(s); }
                                            else if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                                        }}
                                        onBlur={() => submitRename(s)}
                                        className="w-full px-2 py-1 text-[13px] border border-[var(--ink-200)] rounded-md outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                            );
                        }

                        return (
                            <div
                                key={s.id}
                                className={`group/sub w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer ${
                                    active
                                        ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)] font-bold'
                                        : 'text-[var(--ink-700)] hover:bg-white'
                                }`}
                                onClick={() => onSelectSubject(s.id)}
                            >
                                <HiOutlineChevronRight className="w-3 h-3 text-[var(--ink-300)] shrink-0" />
                                <span
                                    className="w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-bold shrink-0"
                                    style={{ background: c.bg, color: c.fg }}
                                >
                                    {shortFor(s.name)}
                                </span>
                                <span className="flex-1 text-left truncate">{s.name}</span>

                                {canEdit && (
                                    <span className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); startRename(s); }}
                                            title="Adını dəyiş"
                                            className="w-5 h-5 inline-flex items-center justify-center rounded text-[var(--ink-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                                        >
                                            <HiOutlinePencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDeleteSubject(s); }}
                                            title="Sil"
                                            className="w-5 h-5 inline-flex items-center justify-center rounded text-[var(--ink-400)] hover:text-red-600 hover:bg-red-50"
                                        >
                                            <HiOutlineTrash className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}

                                <span className={`text-[11px] font-mono group-hover/sub:hidden ${active ? 'text-[var(--primary)]/70' : 'text-[var(--ink-400)]'}`}>
                                    {s.questionCount ?? 0}
                                </span>
                            </div>
                        );
                    })}

                    {/* Inline add form */}
                    {adding && (
                        <div className="mt-2 p-2 rounded-xl bg-white border border-[var(--brand-blue-200)]">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newName}
                                list="qb-subject-suggestions"
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); submit(); }
                                    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
                                }}
                                placeholder="Fənn adı"
                                disabled={submitting}
                                className="w-full px-3 py-2 text-[13px] border border-[var(--ink-200)] rounded-lg outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                            {suggestions && suggestions.length > 0 && (
                                <datalist id="qb-subject-suggestions">
                                    {suggestions.map(name => <option key={name} value={name} />)}
                                </datalist>
                            )}
                            <div className="flex gap-1.5 mt-2">
                                <button
                                    onClick={submit}
                                    disabled={!newName.trim() || submitting}
                                    className="flex-1 h-8 inline-flex items-center justify-center text-[12px] font-bold rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--brand-blue-300)] disabled:cursor-not-allowed text-white transition-colors"
                                >
                                    {submitting ? '…' : 'Əlavə et'}
                                </button>
                                <button
                                    onClick={cancel}
                                    disabled={submitting}
                                    className="h-8 px-3 inline-flex items-center justify-center text-[12px] font-semibold rounded-full text-[var(--ink-600)] hover:bg-[var(--ink-100)] transition-colors"
                                >
                                    Ləğv
                                </button>
                            </div>
                        </div>
                    )}

                    {!adding && subjects.length === 0 && (
                        <div className="mt-2 px-3 py-4 text-center bg-white border border-dashed border-[var(--ink-200)] rounded-xl">
                            <p className="text-[12.5px] text-[var(--ink-500)] mb-2">Hələ fənn yoxdur</p>
                            <button
                                onClick={() => setAdding(true)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                            >
                                <HiOutlinePlus className="w-3.5 h-3.5" />
                                İlk fənni əlavə et
                            </button>
                        </div>
                    )}
                </nav>
            </div>

            {/* Question type filters */}
            <FilterBlock title="Sual növü">
                {Object.entries(TYPE_LABELS)
                    .filter(([k]) => ['MCQ', 'MULTI_SELECT', 'TRUE_FALSE', 'OPEN_AUTO', 'FILL_IN_THE_BLANK', 'MATCHING'].includes(k))
                    .map(([key, label]) => (
                        <CheckRow
                            key={key}
                            label={label}
                            count={typeCounts[key] || 0}
                            checked={typeFilter.includes(key)}
                            onToggle={() => onToggleType(key)}
                        />
                    ))}
            </FilterBlock>

            {/* Difficulty filters */}
            <FilterBlock title="Çətinlik">
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                    <CheckRow
                        key={key}
                        label={label}
                        count={difficultyCounts[key] || 0}
                        checked={difficultyFilter.includes(key)}
                        onToggle={() => onToggleDifficulty(key)}
                    />
                ))}
            </FilterBlock>
        </aside>
    );
};

const FilterBlock = ({ title, children }) => (
    <div>
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)] mb-2.5 px-2">
            {title}
        </h4>
        <div className="space-y-0.5">{children}</div>
    </div>
);

const CheckRow = ({ label, count, checked, onToggle }) => (
    <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-white transition-colors">
        <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="w-3.5 h-3.5 accent-[var(--primary)] rounded"
        />
        <span className="flex-1 text-[13px] text-[var(--ink-700)]">{label}</span>
        <span className="text-[11px] font-mono text-[var(--ink-400)]">{count}</span>
    </label>
);

// ───────────────────────────────────────────────────────────────────────────
// Question row
// ───────────────────────────────────────────────────────────────────────────

const QuestionRow = ({ q, subject, selected, onToggleSelect, expanded, onToggleExpand, favorited, onToggleFavorite, onAddToExam }) => {
    const c = colorForSubject(subject || { name: q.subjectName });
    const diffLabel = q.difficulty ? DIFFICULTY_LABELS[q.difficulty] : null;
    const diffTone = q.difficulty ? DIFFICULTY_TONE[q.difficulty] : null;
    const typeLabel = TYPE_LABELS[q.questionType] || q.questionType || '—';

    const options = q.options || [];
    const correctIdx = options.findIndex(o => o.isCorrect);

    return (
        <div className={`group bg-white rounded-2xl border transition-all ${selected ? 'border-[var(--primary)] ring-2 ring-[var(--primary-soft)]' : 'border-[var(--ink-200)] hover:border-[var(--ink-300)]'}`}>
            <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={onToggleExpand}>
                {/* Checkbox */}
                <div className="flex items-center shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                    />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                    {/* Tag row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: c.bg, color: c.fg }}
                        >
                            <HiOutlineBookOpen className="w-3 h-3" />
                            {subject?.name || q.subjectName}
                        </span>
                        {q.gradeLevel && (
                            <span className="text-[10.5px] font-bold bg-[var(--ink-100)] text-[var(--ink-700)] px-2 py-0.5 rounded-full">
                                {q.gradeLevel}
                            </span>
                        )}
                        {q.topic && (
                            <span className="text-[10.5px] font-bold bg-[var(--ink-100)] text-[var(--ink-700)] px-2 py-0.5 rounded-full">
                                #{q.topic}
                            </span>
                        )}
                        {diffLabel && (
                            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${diffTone}`}>
                                {diffLabel}
                            </span>
                        )}
                        {(q.tags || []).slice(0, 2).map(t => (
                            <span key={t} className="text-[10.5px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">
                                #{t}
                            </span>
                        ))}
                    </div>

                    {/* Text — LaTeX-aware, clamped to 2 lines. Only render
                        the container when there's actual content; otherwise
                        the empty `leading-snug` div leaves a visible gap
                        above the image for image-only questions. */}
                    {q.content?.trim() && (
                        <div className="text-[14px] text-[var(--ink-800)] line-clamp-2 leading-snug">
                            <LatexPreview content={q.content} placeholder={null} />
                        </div>
                    )}

                    {/* Image thumbnail — collapsed view (small preview) */}
                    {q.attachedImage && (
                        <div className="mt-2">
                            <img
                                src={q.attachedImage}
                                alt="Sual şəkli"
                                className="max-h-20 rounded-lg border border-[var(--ink-200)] object-contain bg-white"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* Foot */}
                    <div className="mt-2 flex items-center gap-2 text-[11.5px] text-[var(--ink-500)]">
                        <span>{typeLabel}</span>
                        <span className="text-[var(--ink-300)]">·</span>
                        <span>{(q.points ?? 1)} bal</span>
                        <span className="text-[var(--ink-300)]">·</span>
                        <span>ID: <span className="font-mono text-[var(--ink-400)]">#{q.id}</span></span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onToggleExpand}
                        title="Önizləmə"
                        className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
                    >
                        <HiOutlineEye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onToggleFavorite}
                        title="Sevimli"
                        className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                        {favorited ? <HiStar className="w-4 h-4 text-amber-500" /> : <HiOutlineStar className="w-4 h-4" />}
                    </button>
                    <HiOutlineChevronDown
                        className={`w-4 h-4 text-[var(--ink-400)] transition-transform ml-1 ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Expanded preview */}
            {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[var(--ink-150)]">
                    <div className="text-[14px] text-[var(--ink-900)] mt-3 mb-3 leading-relaxed">
                        <LatexPreview content={q.content || ''} placeholder={null} />
                    </div>
                    {q.attachedImage && (
                        <div className="mb-3">
                            <img
                                src={q.attachedImage}
                                alt="Sual şəkli"
                                className="max-h-72 rounded-xl border border-[var(--ink-200)] object-contain bg-white"
                            />
                        </div>
                    )}
                    {options.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {options.map((opt, i) => {
                                const isCorrect = !!opt.isCorrect;
                                return (
                                    <div
                                        key={opt.id || i}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-[13.5px] ${
                                            isCorrect
                                                ? 'border-[var(--brand-green-600)] bg-[var(--brand-green-50)]'
                                                : 'border-[var(--ink-200)] bg-white'
                                        }`}
                                    >
                                        <span
                                            className={`w-7 h-7 rounded-md inline-flex items-center justify-center text-[12.5px] font-bold shrink-0 ${
                                                isCorrect
                                                    ? 'bg-[var(--brand-green-600)] text-white'
                                                    : 'bg-[var(--ink-100)] text-[var(--ink-600)]'
                                            }`}
                                        >
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className={`flex-1 ${isCorrect ? 'text-[var(--ink-900)] font-semibold' : 'text-[var(--ink-700)]'}`}>
                                            <LatexPreview content={opt.content || opt.text || '—'} placeholder={null} />
                                        </span>
                                        {isCorrect && (
                                            <span className="text-[11px] font-bold text-[var(--brand-green-700)] inline-flex items-center gap-1">
                                                <HiOutlineCheck className="w-3.5 h-3.5" />
                                                Düzgün cavab
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {q.correctAnswer && options.length === 0 && (
                        <div className="bg-[var(--brand-green-50)] border border-[var(--brand-green-200)] rounded-xl px-3 py-2.5 text-[13.5px] text-[var(--ink-800)] mb-3">
                            <span className="font-bold text-[var(--brand-green-700)]">Düz cavab:</span>{' '}
                            <LatexPreview content={q.correctAnswer} placeholder={null} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Floating cart
// ───────────────────────────────────────────────────────────────────────────

const SelectionBar = ({ count, onClear, onCreateExam }) => {
    if (count === 0) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--ink-900)] text-white rounded-full shadow-[var(--sh-lg)] pl-5 pr-1.5 py-1.5 flex items-center gap-3">
            <span className="text-[13px]">
                <strong className="font-extrabold">{count}</strong> sual seçilib
            </span>
            <button
                onClick={onClear}
                className="text-[12px] text-white/70 hover:text-white px-3 py-1 rounded-full transition-colors"
            >
                Seçimi sil
            </button>
            <button
                onClick={onCreateExam}
                className="h-9 px-4 inline-flex items-center gap-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-full text-[12.5px] font-bold transition-colors"
            >
                <HiOutlinePlus className="w-3.5 h-3.5" />
                İmtahan yarat
            </button>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────────────────

const QuestionBank = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // Filters
    const [activeSubjectId, setActiveSubjectId] = useState(null); // null = all
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [typeFilter, setTypeFilter] = useState([]);
    const [difficultyFilter, setDifficultyFilter] = useState([]);
    const [sort, setSort] = useState('recent');

    // Per-row state
    const [selected, setSelected] = useState(() => new Set());
    const [expanded, setExpanded] = useState(() => new Set());
    const [favorited, setFavorited] = useState(() => new Set());

    // System-wide subject names (for new-subject autocomplete suggestions)
    const [systemSubjects, setSystemSubjects] = useState([]);
    // Bumped to ask the sidebar to open its add-subject form (no-subjects flow).
    const [addingTrigger, setAddingTrigger] = useState(0);
    // "Yeni sual" was previously jumping straight to the first subject in
    // the list when the user was in the "Bütün fənnlər" view — confusing
    // because the destination subject was arbitrary. Show this picker
    // modal instead so the teacher explicitly chooses where the new
    // question belongs.
    const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

    const searchRef = useRef(null);

    // ── Initial fetch ──────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/bank/subjects')
            .then(res => {
                // Teachers see only their own (non-global) bank subjects.
                // Admins see everything. Global "site" subjects are hidden in
                // the teacher's personal bank — the user runs their own bank.
                const all = res.data || [];
                setSubjects(isAdmin ? all : all.filter(s => !s.isGlobal));
            })
            .catch(() => toast.error('Fənnlər yüklənmədi'))
            .finally(() => setLoadingSubjects(false));

        // Suggestions for the "new subject" inline form — pull from the
        // system-wide subjects metadata API so the teacher can pick a
        // standard name (Riyaziyyat, Fizika, ...) instead of typing.
        api.get('/subjects/meta')
            .then(res => setSystemSubjects((res.data || []).map(s => s.name)))
            .catch(() => {});
    }, [isAdmin]);

    const handleAddSubject = async (name) => {
        try {
            const { data } = await api.post('/bank/subjects', { name });
            setSubjects(prev => [data, ...prev]);
            setActiveSubjectId(data.id);
            toast.success(`"${data.name}" fənni əlavə edildi`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Fənn əlavə edilmədi';
            toast.error(msg);
            throw err;
        }
    };

    const handleRenameSubject = async (id, name) => {
        try {
            const { data } = await api.put(`/bank/subjects/${id}`, { name });
            setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
            toast.success('Fənn adı dəyişdirildi');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Fənn adı dəyişdirilmədi');
        }
    };

    const handleDeleteSubject = async (subject) => {
        const msg = subject.questionCount > 0
            ? `"${subject.name}" fənni və içindəki ${subject.questionCount} sual tamamilə silinəcək. Davam edilsin?`
            : `"${subject.name}" fənni silinəcək. Davam edilsin?`;
        if (!window.confirm(msg)) return;
        try {
            await api.delete(`/bank/subjects/${subject.id}`);
            setSubjects(prev => prev.filter(s => s.id !== subject.id));
            if (activeSubjectId === subject.id) setActiveSubjectId(null);
            toast.success('Fənn silindi');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Fənn silinmədi');
        }
    };

    // Debounce search input
    useEffect(() => {
        const id = setTimeout(() => setSearchDebounced(search.trim()), 300);
        return () => clearTimeout(id);
    }, [search]);

    // Keyboard shortcut: "/" focuses search
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            const inField = tag === 'input' || tag === 'textarea';
            if (e.key === '/' && !inField) { e.preventDefault(); searchRef.current?.focus(); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // ── Question fetch ─────────────────────────────────────────────────────
    // Two-pronged search:
    //   1) The backend `search` param matches against question content/topic.
    //   2) If the search query also matches a subject name, we additionally
    //      fetch ALL questions in that subject (no text filter), so typing
    //      "Riyaziyyat" lists everything in that subject even if no question
    //      contains the word in its text. This is what users expect when the
    //      sidebar offers subjects as a navigation axis.
    useEffect(() => {
        if (loadingSubjects) return;
        if (subjects.length === 0) { setQuestions([]); return; }

        let cancelled = false;
        setLoadingQuestions(true);

        const loadOne = (subjectId, search) =>
            api.get(`/bank/subjects/${subjectId}/questions/paged`, {
                params: {
                    search: search || undefined,
                    sort,
                    page: 0,
                    size: 50,
                },
            }).then(r => (r.data?.content || []));

        const targets = activeSubjectId
            ? [activeSubjectId]
            : subjects.map(s => s.id);

        // Identify subjects whose names match the search query. When the
        // user has already drilled into a single subject (activeSubjectId),
        // we keep the conventional text search there.
        const q = searchDebounced.trim().toLowerCase();
        const matchedBySubjectName = (!activeSubjectId && q)
            ? subjects.filter(s => (s.name || '').toLowerCase().includes(q)).map(s => s.id)
            : [];

        const baseFetches = targets.map(id => loadOne(id, searchDebounced));
        const subjectNameFetches = matchedBySubjectName.map(id => loadOne(id, ''));

        Promise.all([...baseFetches, ...subjectNameFetches])
            .then(results => {
                if (cancelled) return;
                // Dedupe by question id (a question can appear from both prongs).
                const seen = new Set();
                let merged = [];
                for (const q of results.flat()) {
                    if (!seen.has(q.id)) { seen.add(q.id); merged.push(q); }
                }
                // Client-side type + difficulty filters (sidebar checkboxes are inclusive OR)
                if (typeFilter.length > 0) {
                    merged = merged.filter(q => typeFilter.includes(q.questionType));
                }
                if (difficultyFilter.length > 0) {
                    merged = merged.filter(q => difficultyFilter.includes(q.difficulty));
                }
                setQuestions(merged);
            })
            .catch(() => { if (!cancelled) toast.error('Suallar yüklənmədi'); })
            .finally(() => { if (!cancelled) setLoadingQuestions(false); });

        return () => { cancelled = true; };
    }, [activeSubjectId, searchDebounced, sort, subjects, loadingSubjects, typeFilter, difficultyFilter]);

    // ── Counts for sidebar (computed across visible questions) ────────────
    const typeCounts = useMemo(() => {
        const map = {};
        questions.forEach(q => { map[q.questionType] = (map[q.questionType] || 0) + 1; });
        return map;
    }, [questions]);

    const difficultyCounts = useMemo(() => {
        const map = {};
        questions.forEach(q => { if (q.difficulty) map[q.difficulty] = (map[q.difficulty] || 0) + 1; });
        return map;
    }, [questions]);

    const totalCount = subjects.reduce((s, x) => s + (x.questionCount || 0), 0);

    // ── Handlers ───────────────────────────────────────────────────────────
    const toggleType = (k) => setTypeFilter(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
    const toggleDifficulty = (k) => setDifficultyFilter(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);

    const toggleSelect = (id) => setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const toggleExpand = (id) => setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const toggleFavorite = (id) => setFavorited(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const allSelected = questions.length > 0 && questions.every(q => selected.has(q.id));
    const toggleSelectAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(questions.map(q => q.id)));
    };

    const subjectById = useMemo(() => {
        const m = {};
        subjects.forEach(s => { m[s.id] = s; });
        return m;
    }, [subjects]);

    const newQuestionHref = activeSubjectId
        ? `/sual-bazasi/${activeSubjectId}`
        : '/sual-bazasi';

    // Stat chips for hero
    const heroStats = useMemo(() => {
        const totalQs = totalCount;
        const subjCount = subjects.length;
        const lastAddedAt = subjects
            .map(s => s.lastAddedAt)
            .filter(Boolean)
            .sort()
            .reverse()[0];
        return { totalQs, subjCount, lastAddedAt };
    }, [subjects, totalCount]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pb-28" style={{ background: 'var(--paper-cream)' }}>
            {/* Hero */}
            <section className="bg-white border-b border-[var(--ink-150)]">
                <div className="container-main py-10 md:py-14">
                    <div className="flex items-end justify-between flex-wrap gap-5">
                        <div className="max-w-2xl">
                            <h1 className="text-[34px] sm:text-[42px] md:text-[48px] font-extrabold text-[var(--ink-900)] tracking-tight leading-[1.05]">
                                Sual Bazası
                            </h1>
                            <p className="mt-3 text-[15px] text-[var(--ink-500)] leading-relaxed max-w-xl">
                                Öz fənnlərinizi və suallarınızı bir yerdə idarə edin. Fənn, sual növü və çətinlik üzrə filtrlə, sualları imtahanlarınıza əlavə edin.
                            </p>

                            {!loadingSubjects && subjects.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                        <HiOutlineLibrary className="w-3.5 h-3.5 text-[var(--primary)]" />
                                        <strong className="text-[var(--ink-900)]">{heroStats.totalQs.toLocaleString()}</strong> sual
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                                        <HiOutlineBookOpen className="w-3.5 h-3.5 text-[var(--brand-green-600)]" />
                                        <strong className="text-[var(--ink-900)]">{heroStats.subjCount}</strong> fənn
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* Body — two columns */}
            <div className="container-main py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                <Sidebar
                    subjects={subjects}
                    activeSubjectId={activeSubjectId}
                    onSelectSubject={(id) => {
                        // null means "Bütün fənnlərim" — just resets the filter
                        // so the right pane shows every question. Picking a
                        // specific subject opens its dedicated page where
                        // creation actions (Yeni sual / AI / İdxal) live.
                        if (id == null) setActiveSubjectId(null);
                        else navigate(`/sual-bazasi/${id}`);
                    }}
                    typeFilter={typeFilter}
                    onToggleType={toggleType}
                    difficultyFilter={difficultyFilter}
                    onToggleDifficulty={toggleDifficulty}
                    typeCounts={typeCounts}
                    difficultyCounts={difficultyCounts}
                    totalCount={totalCount}
                    onAddSubject={handleAddSubject}
                    onRenameSubject={handleRenameSubject}
                    onDeleteSubject={handleDeleteSubject}
                    suggestions={systemSubjects.filter(n => !subjects.some(s => s.name === n))}
                    addingExternalKey={addingTrigger}
                />

                <main>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="relative flex-1 min-w-[240px]">
                            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Sual, mövzu və ya fənn adında axtar..."
                                className="w-full h-10 pl-10 pr-14 text-[13px] bg-white border border-[var(--ink-200)] rounded-full focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--ink-400)] bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-md px-1.5 py-0.5">⌘ K</kbd>
                        </div>

                        <div className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 border border-[var(--ink-200)] rounded-full bg-white">
                            <HiOutlineSortDescending className="w-3.5 h-3.5 text-[var(--ink-400)]" />
                            <select
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                                className="text-[12px] font-bold bg-transparent focus:outline-none text-[var(--ink-700)] pr-2"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={toggleSelectAll}
                            disabled={questions.length === 0}
                            className="h-10 px-4 inline-flex items-center gap-1.5 bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-50)] hover:border-[var(--ink-300)] text-[var(--ink-700)] text-[12.5px] font-semibold rounded-full transition-colors disabled:opacity-50"
                        >
                            <HiOutlineCheck className="w-3.5 h-3.5" />
                            {allSelected && questions.length > 0 ? 'Seçimi sil' : 'Hamısını seç'}
                        </button>
                    </div>

                    {/* Results meta + active filter chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <p className="text-[13px] text-[var(--ink-500)] mr-auto">
                            <strong className="text-[var(--ink-900)]">{questions.length.toLocaleString()}</strong> sual tapıldı
                        </p>
                        {(typeFilter.length > 0 || difficultyFilter.length > 0 || activeSubjectId) && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {activeSubjectId && (
                                    <FilterChip
                                        label={subjectById[activeSubjectId]?.name || 'Fənn'}
                                        onClear={() => setActiveSubjectId(null)}
                                    />
                                )}
                                {typeFilter.map(t => (
                                    <FilterChip key={t} label={TYPE_LABELS[t]} onClear={() => toggleType(t)} />
                                ))}
                                {difficultyFilter.map(d => (
                                    <FilterChip key={d} label={DIFFICULTY_LABELS[d]} onClear={() => toggleDifficulty(d)} />
                                ))}
                                <button
                                    onClick={() => { setActiveSubjectId(null); setTypeFilter([]); setDifficultyFilter([]); }}
                                    className="text-[11.5px] text-[var(--ink-500)] hover:text-[var(--primary)] font-semibold underline"
                                >
                                    Hamısını sil
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Question list */}
                    {loadingSubjects || loadingQuestions ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-[var(--ink-200)] p-4 animate-pulse">
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 rounded-md bg-[var(--ink-100)]" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-[var(--ink-100)] rounded w-1/3" />
                                            <div className="h-4 bg-[var(--ink-100)] rounded w-3/4" />
                                            <div className="h-3 bg-[var(--ink-100)] rounded w-1/4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <EmptyState
                            isAdmin={isAdmin}
                            hasFilters={Boolean(activeSubjectId || typeFilter.length || difficultyFilter.length || searchDebounced)}
                            hasSubjects={subjects.length > 0}
                            onCreate={() => {
                                if (subjects.length === 0) {
                                    // No subjects yet — trigger the sidebar's
                                    // "add subject" inline form.
                                    setAddingTrigger(t => t + 1);
                                    return;
                                }
                                if (activeSubjectId) {
                                    // A specific subject is already active —
                                    // go straight to its page.
                                    navigate(`/sual-bazasi/${activeSubjectId}`);
                                    return;
                                }
                                // "Bütün fənnlər" view: ask the teacher
                                // which subject the new question belongs
                                // to instead of dumping them onto an
                                // arbitrary (last-created) subject page.
                                setSubjectPickerOpen(true);
                            }}
                        />
                    ) : (
                        <div className="space-y-3">
                            {questions.map(q => (
                                <QuestionRow
                                    key={q.id}
                                    q={q}
                                    subject={subjectById[q.subjectId]}
                                    selected={selected.has(q.id)}
                                    onToggleSelect={() => toggleSelect(q.id)}
                                    expanded={expanded.has(q.id)}
                                    onToggleExpand={() => toggleExpand(q.id)}
                                    favorited={favorited.has(q.id)}
                                    onToggleFavorite={() => toggleFavorite(q.id)}
                                    onAddToExam={() => {
                                        toast.success('Sual seçildi — imtahan redaktorundan əlavə edə bilərsiniz');
                                        setSelected(prev => new Set(prev).add(q.id));
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <SelectionBar
                count={selected.size}
                onClear={() => setSelected(new Set())}
                onCreateExam={() => {
                    // Send the full bank-question payloads through router state so the
                    // exam editor can prefill itself without a second backend round-trip.
                    const bankQuestions = questions.filter(q => selected.has(q.id));
                    if (bankQuestions.length === 0) return;
                    navigate('/imtahanlar/yarat', {
                        state: {
                            type: 'free',
                            subject: subjectById[bankQuestions[0].subjectId]?.name || 'Seçilməyib',
                            bankQuestions,
                        },
                    });
                }}
            />

            {subjectPickerOpen && (
                <SubjectPickerModal
                    subjects={subjects}
                    onCancel={() => setSubjectPickerOpen(false)}
                    onPick={(id) => {
                        setSubjectPickerOpen(false);
                        navigate(`/sual-bazasi/${id}`);
                    }}
                />
            )}
        </div>
    );
};

const SubjectPickerModal = ({ subjects, onCancel, onPick }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onCancel}
    >
        <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <div className="px-5 py-4 border-b border-[var(--ink-150)]">
                <h3 className="text-[16px] font-bold text-[var(--ink-900)]">Hansı fənnə əlavə olunsun?</h3>
                <p className="text-[12.5px] text-[var(--ink-500)] mt-1">Sual yaratdığınız fənni seçin.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {subjects.map(s => {
                    const c = colorForSubject(s);
                    return (
                        <button
                            key={s.id}
                            onClick={() => onPick(s.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--ink-50)] transition-colors text-left"
                        >
                            <span
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[11px] font-bold shrink-0"
                                style={{ background: c.bg, color: c.fg }}
                            >
                                {shortFor(s.name)}
                            </span>
                            <span className="flex-1 text-[14px] font-semibold text-[var(--ink-800)] truncate">{s.name}</span>
                            <span className="text-[11.5px] text-[var(--ink-400)] font-mono shrink-0">{s.questionCount ?? 0}</span>
                        </button>
                    );
                })}
            </div>
            <div className="px-4 py-3 border-t border-[var(--ink-150)] flex justify-end">
                <button
                    onClick={onCancel}
                    className="h-9 px-4 rounded-full text-[13px] font-semibold text-[var(--ink-600)] hover:bg-[var(--ink-100)] transition-colors"
                >
                    Ləğv et
                </button>
            </div>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Auxiliary
// ───────────────────────────────────────────────────────────────────────────

const FilterChip = ({ label, onClear }) => (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold bg-white border border-[var(--ink-200)] text-[var(--ink-700)] rounded-full pl-2.5 pr-1 py-0.5">
        {label}
        <button
            onClick={onClear}
            className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-[var(--ink-100)] text-[var(--ink-400)]"
        >
            <HiOutlineX className="w-3 h-3" />
        </button>
    </span>
);

const EmptyState = ({ isAdmin, hasFilters, onCreate }) => (
    <div className="bg-white rounded-3xl border border-[var(--ink-200)] py-16 text-center">
        <span className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--ink-50)] inline-flex items-center justify-center">
            <HiOutlineSearch className="w-7 h-7 text-[var(--ink-300)]" />
        </span>
        <p className="text-[15px] font-bold text-[var(--ink-800)] tracking-tight">
            {hasFilters ? 'Filtrlərə uyğun sual tapılmadı' : 'Hələ sual yoxdur'}
        </p>
        <p className="text-[12.5px] text-[var(--ink-500)] mt-1">
            {hasFilters ? 'Filtrləri sıfırlayın və ya başqa açar sözə keçin' : 'İlk fənninizi və sualınızı əlavə edin'}
        </p>
        <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full font-bold text-[13px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors"
        >
            <HiOutlinePlus className="w-4 h-4" /> {isAdmin ? 'Yeni fənn / sual' : 'İlk sualı yarat'}
        </button>
    </div>
);

export default QuestionBank;
