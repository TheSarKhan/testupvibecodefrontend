import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlineSave,
    HiOutlineBookOpen, HiOutlineSearch, HiOutlinePencil, HiOutlineEye,
    HiOutlineX, HiOutlineCheckCircle, HiOutlineTag, HiOutlineDuplicate,
    HiOutlineDownload, HiOutlineSortDescending, HiOutlineChevronLeft,
    HiOutlineChevronRight, HiOutlineDocumentDuplicate, HiOutlineMenu,
    HiOutlineExclamation, HiOutlineSparkles, HiOutlineLibrary,
    HiOutlineGlobe, HiOutlineCheck,
} from 'react-icons/hi';
import { QuestionEditor, LatexPreview, AiGenerateModal } from '../../components/ui';
import ChipContent from '../../utils/chipContent';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { validateLatexSyntax, getLatexErrorMessage } from '../../utils/latexValidator';

// ── Type config ──────────────────────────────────────────────────────────────
const BACKEND_TO_FRONTEND = {
    MCQ: 'MULTIPLE_CHOICE', TRUE_FALSE: 'MULTIPLE_CHOICE',
    MULTI_SELECT: 'MULTI_SELECT', OPEN_AUTO: 'OPEN_AUTO',
    OPEN_MANUAL: 'OPEN_MANUAL', FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};
const FRONTEND_TO_BACKEND = {
    MULTIPLE_CHOICE: 'MCQ', MULTI_SELECT: 'MULTI_SELECT',
    OPEN_AUTO: 'OPEN_AUTO', OPEN_MANUAL: 'OPEN_MANUAL',
    FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};
const TYPE_LABELS = {
    MULTIPLE_CHOICE: 'Qapalı', MULTI_SELECT: 'Çox seçimli',
    OPEN_AUTO: 'Açıq (Avto)', OPEN_MANUAL: 'Açıq (Müəllim)',
    FILL_IN_THE_BLANK: 'Boşluq', MATCHING: 'Uyğunlaşdırma',
};
const TYPE_COLORS = {
    MULTIPLE_CHOICE: 'bg-blue-50 text-blue-700',
    MULTI_SELECT: 'bg-emerald-50 text-emerald-700',
    OPEN_AUTO: 'bg-green-50 text-green-700',
    OPEN_MANUAL: 'bg-orange-50 text-orange-700',
    FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
    MATCHING: 'bg-pink-50 text-pink-700',
};

const DIFFICULTY_LABELS = { EASY: 'Asan', MEDIUM: 'Orta', HARD: 'Çətin' };
const DIFFICULTY_COLORS = {
    EASY: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HARD: 'bg-red-50 text-red-700',
};

const GRADE_LEVELS = ['1-4', '5-8', '9-11', 'Buraxılış'];

const SORT_OPTIONS = [
    { value: 'order',           label: 'Sıra üzrə' },
    { value: 'newest',          label: 'Yeni → köhnə' },
    { value: 'oldest',          label: 'Köhnə → yeni' },
    { value: 'difficulty_asc',  label: 'Çətinlik: asan → çətin' },
    { value: 'difficulty_desc', label: 'Çətinlik: çətin → asan' },
    { value: 'topic',           label: 'Mövzuya görə' },
    { value: 'points_desc',     label: 'Bal: çox → az' },
    { value: 'points_asc',      label: 'Bal: az → çox' },
];

// Map BankQuestion (backend) <-> editor model (frontend)
const bankToEditor = (bq) => ({
    id: String(bq.id),
    _bankId: bq.id,
    type: BACKEND_TO_FRONTEND[bq.questionType] || 'MULTIPLE_CHOICE',
    text: bq.content || '',
    attachedImage: bq.attachedImage || null,
    points: bq.points ?? 1,
    orderIndex: bq.orderIndex ?? 0,
    subjectGroup: null,
    topic: bq.topic || null,
    difficulty: bq.difficulty || null,
    gradeLevel: bq.gradeLevel || null,
    tags: Array.isArray(bq.tags) ? bq.tags : (bq.tags ? [...bq.tags] : []),
    createdAt: bq.createdAt || null,
    options: (bq.options || [])
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map(o => ({ id: String(o.id), text: o.content || '', isCorrect: !!o.isCorrect, attachedImage: o.attachedImage || null })),
    // Use the same field names QuestionEditor consumes (leftItem /
    // rightItem / attachedImage*). The earlier `left` / `right` aliases
    // meant matching questions opened from the bank rendered empty in
    // the editor — none of the matching-pair JSX matched.
    matchingPairs: (() => {
        const sorted = (bq.matchingPairs || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        const lvMap = {}, rvMap = {};
        sorted.forEach(p => {
            if (p.leftItem && !lvMap[p.leftItem]) lvMap[p.leftItem] = `lv-${p.id}`;
            if (p.rightItem && !rvMap[p.rightItem]) rvMap[p.rightItem] = `rv-${p.id}`;
        });
        return sorted.map(p => ({
            id: String(p.id),
            leftItem: p.leftItem || null,
            rightItem: p.rightItem || null,
            attachedImageLeft: p.attachedImageLeft || null,
            attachedImageRight: p.attachedImageRight || null,
            leftVisualId: p.leftItem ? lvMap[p.leftItem] : null,
            rightVisualId: p.rightItem ? rvMap[p.rightItem] : null,
        }));
    })(),
    sampleAnswer: bq.correctAnswer || '',
});

const editorToBank = (subjectId, eq) => ({
    subjectId,
    content: eq.text,
    attachedImage: eq.attachedImage || null,
    questionType: FRONTEND_TO_BACKEND[eq.type] || 'MCQ',
    points: eq.points ?? 1,
    orderIndex: eq.orderIndex ?? 0,
    correctAnswer: eq.sampleAnswer || null,
    topic: eq.topic || null,
    difficulty: eq.difficulty || null,
    gradeLevel: eq.gradeLevel || null,
    tags: Array.isArray(eq.tags) ? eq.tags.filter(Boolean) : [],
    options: (eq.options || []).map((o, i) => ({
        content: o.text || '',
        isCorrect: !!o.isCorrect,
        orderIndex: i,
        attachedImage: o.attachedImage || null,
    })),
    // Filter out the synthetic distractor halves (where one side is null)
    // that QuestionEditor creates internally — backend wants real pairs.
    matchingPairs: (eq.matchingPairs || [])
        .filter(mp => mp.leftItem || mp.rightItem)
        .map((mp, i) => ({
            leftItem: mp.leftItem || '',
            rightItem: mp.rightItem || '',
            attachedImageLeft: mp.attachedImageLeft || null,
            attachedImageRight: mp.attachedImageRight || null,
            orderIndex: i,
        })),
});

const newEditorQuestion = (orderIndex) => ({
    id: `new-${Date.now()}`,
    _bankId: null,
    type: 'MULTIPLE_CHOICE',
    text: '',
    attachedImage: null,
    points: 1,
    orderIndex,
    subjectGroup: null,
    topic: null,
    difficulty: null,
    gradeLevel: null,
    tags: [],
    options: [
        { id: `o1-${Date.now()}`, text: 'A', isCorrect: false },
        { id: `o2-${Date.now()}`, text: 'B', isCorrect: false },
        { id: `o3-${Date.now()}`, text: 'C', isCorrect: false },
        { id: `o4-${Date.now()}`, text: 'D', isCorrect: false },
    ],
    matchingPairs: [],
    sampleAnswer: '',
});

// Duplicate hash: normalised question text + sorted option texts + a short
// fingerprint of the attached image. Without the image fingerprint, two
// image-only questions (empty text, empty options, different pictures) used
// to collide on the same hash and the editor kept asking "Eyni mətnli sual
// artıq mövcuddur".
const stripHtml = (s) => (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
const dedupeHash = (q) => {
    const norm = (s) => stripHtml(s).replace(/\s+/g, ' ').trim().toLowerCase();
    const opts = (q.options || []).map(o => norm(o.text)).sort().join('|');
    // Use a stable substring of the data-URL / URL so the hash isn't huge.
    const imgFp = q.attachedImage
        ? '#img:' + q.attachedImage.slice(0, 80) + ':' + q.attachedImage.length
        : '';
    return norm(q.text) + '@@' + opts + imgFp;
};

// ── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ question, onClose }) => {
    if (!question) return null;
    const isChoice = question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTI_SELECT';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[question.type] || 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_LABELS[question.type] || question.type}
                        </span>
                        <span className="text-xs text-gray-400">{question.points} bal</span>
                        {question.difficulty && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[question.difficulty]}`}>
                                {DIFFICULTY_LABELS[question.difficulty]}
                            </span>
                        )}
                        {question.gradeLevel && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                                {question.gradeLevel}
                            </span>
                        )}
                        {question.topic && (
                            <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                <HiOutlineTag className="w-3 h-3" />{question.topic}
                            </span>
                        )}
                        {(question.tags || []).map(t => (
                            <span key={t} className="text-[11px] font-semibold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">
                                #{t}
                            </span>
                        ))}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {question.text?.trim() && (
                        <div className="text-sm font-medium text-gray-900">
                            <LatexPreview content={question.text} placeholder={null} />
                        </div>
                    )}
                    {question.attachedImage && (
                        <img
                            src={question.attachedImage}
                            alt="Sual şəkli"
                            className="max-h-80 rounded-xl border border-gray-200 object-contain bg-white mx-auto"
                        />
                    )}
                    {isChoice && question.options?.length > 0 && (
                        <div className="space-y-2">
                            {question.options.map((o, i) => (
                                <div key={o.id} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-sm ${o.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'}`}>
                                    {o.isCorrect
                                        ? <HiOutlineCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                        : <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0 flex items-center justify-center text-[10px] text-gray-400 font-bold mt-0.5">{String.fromCharCode(65 + i)}</span>
                                    }
                                    <div className="flex-1 min-w-0">
                                        {o.text?.trim() && <LatexPreview content={o.text} placeholder={null} />}
                                        {o.attachedImage && (
                                            <img
                                                src={o.attachedImage}
                                                alt={`Variant ${String.fromCharCode(65 + i)} şəkli`}
                                                className="mt-1.5 max-h-32 rounded-lg border border-gray-200 object-contain bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {question.type === 'MATCHING' && question.matchingPairs?.length > 0 && (
                        <div className="space-y-2">
                            {question.matchingPairs.map((mp) => (
                                <div key={mp.id} className="flex items-center gap-3 text-sm bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                    <span className="font-medium text-blue-700 min-w-0 flex-1 break-words"><ChipContent text={mp.leftItem} /></span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-gray-700 min-w-0 flex-1 text-right break-words"><ChipContent text={mp.rightItem} /></span>
                                </div>
                            ))}
                        </div>
                    )}
                    {(question.type === 'OPEN_AUTO' || question.type === 'OPEN_MANUAL' || question.type === 'FILL_IN_THE_BLANK') && question.sampleAnswer && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                            <p className="text-xs font-semibold text-green-700 mb-1">Düzgün cavab</p>
                            {question.type === 'FILL_IN_THE_BLANK' ? (() => {
                                let answers = [];
                                try { answers = JSON.parse(question.sampleAnswer); } catch {}
                                if (!Array.isArray(answers)) answers = [question.sampleAnswer];
                                return (
                                    <div className="flex flex-wrap gap-1.5 text-sm text-green-800">
                                        {answers.map((a, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-green-200 rounded-md">
                                                <span className="text-[10px] font-bold text-green-600">{i + 1}.</span>
                                                <ChipContent text={a} />
                                            </span>
                                        ))}
                                    </div>
                                );
                            })() : (
                                <p className="text-sm text-green-800"><LatexPreview content={question.sampleAnswer} /></p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Difficulty pill button ───────────────────────────────────────────────────
const DIFFICULTY_PILL_STYLES = {
    EASY: { active: 'bg-green-500 text-white border-green-500', idle: 'bg-white text-green-700 border-green-200 hover:border-green-400 hover:bg-green-50' },
    MEDIUM: { active: 'bg-yellow-500 text-white border-yellow-500', idle: 'bg-white text-yellow-700 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50' },
    HARD: { active: 'bg-red-500 text-white border-red-500', idle: 'bg-white text-red-700 border-red-200 hover:border-red-400 hover:bg-red-50' },
};
const DifficultyPill = ({ level, active, onClick }) => {
    const styles = DIFFICULTY_PILL_STYLES[level];
    return (
        <button type="button" onClick={onClick}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${active ? styles.active : styles.idle}`}>
            {active && <HiOutlineCheckCircle className="w-4 h-4" />}
            {DIFFICULTY_LABELS[level]}
        </button>
    );
};

// ── Topic combobox with "+ Yeni mövzu yarat" ─────────────────────────────────
const TopicCombobox = ({ value, onChange, availableTopics }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const q = query.trim();
    const lower = q.toLowerCase();
    const merged = useMemo(() => {
        const set = new Map();
        availableTopics.forEach(t => set.set(t.name, t.name));
        if (value && !set.has(value)) set.set(value, value);
        return [...set.keys()];
    }, [availableTopics, value]);
    const filtered = merged.filter(n => !lower || n.toLowerCase().includes(lower));
    const showCreate = q && !merged.some(n => n.toLowerCase() === lower);

    const commit = (name) => {
        onChange(name || null);
        setOpen(false);
        setQuery('');
    };

    return (
        <div className="relative" ref={rootRef}>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className={`flex-1 inline-flex items-center justify-between gap-2 px-3 py-2 border rounded-xl text-sm transition-colors ${
                        value
                            ? 'border-teal-300 bg-teal-50 text-teal-800'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                    }`}
                >
                    <span className="inline-flex items-center gap-1.5 truncate">
                        <HiOutlineTag className="w-3.5 h-3.5" />
                        {value || 'Mövzu seç'}
                    </span>
                    {value && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            className="text-teal-700 hover:text-teal-900"
                            title="Təmizlə"
                        >
                            <HiOutlineX className="w-3.5 h-3.5" />
                        </span>
                    )}
                </button>
            </div>

            {open && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (showCreate) commit(q);
                                    else if (filtered.length > 0) commit(filtered[0]);
                                } else if (e.key === 'Escape') setOpen(false);
                            }}
                            placeholder="Mövzu axtar və ya yeni ad yaz..."
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto py-1">
                        {filtered.length === 0 && !showCreate && (
                            <p className="text-xs text-gray-400 px-3 py-2">Mövzu tapılmadı</p>
                        )}
                        {filtered.map(name => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => commit(name)}
                                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-blue-50 ${
                                    name === value ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-gray-700'
                                }`}
                            >
                                <HiOutlineTag className="w-3.5 h-3.5 text-teal-500" />
                                {name}
                            </button>
                        ))}
                    </div>
                    {/* Always-visible create action — earlier the "+ Yeni mövzu yarat"
                        only appeared after the user typed something the existing
                        topic list didn't match, so the option was easy to miss.
                        Pinning it to the dropdown footer makes new-topic creation
                        discoverable: with a query it commits the typed name, with
                        no query it focuses the search input so the user knows
                        where to type. */}
                    <button
                        type="button"
                        onClick={() => {
                            if (q) {
                                commit(q);
                            } else {
                                // Focus the input so the user knows what to do next.
                                const input = rootRef.current?.querySelector('input');
                                input?.focus();
                            }
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 border-t border-gray-100 text-blue-700 font-semibold hover:bg-blue-50 bg-blue-50/30"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        {q ? `"${q}" mövzusunu yarat` : 'Yeni mövzu əlavə et'}
                        {!q && <span className="text-xs font-normal text-gray-400 ml-auto">adını yuxarıda yazın</span>}
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Tag input (chip + free text) ─────────────────────────────────────────────
const TagInput = ({ value, onChange }) => {
    const [text, setText] = useState('');
    const tags = value || [];
    const commit = () => {
        const t = text.trim().toLowerCase();
        if (!t) return;
        if (tags.includes(t)) { setText(''); return; }
        onChange([...tags, t]);
        setText('');
    };
    return (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border border-gray-200 rounded-xl bg-white min-h-[44px] focus-within:border-blue-400">
            {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    #{t}
                    <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-pink-900">
                        <HiOutlineX className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
                    else if (e.key === 'Backspace' && !text && tags.length > 0) {
                        onChange(tags.slice(0, -1));
                    }
                }}
                onBlur={commit}
                placeholder={tags.length === 0 ? 'imtahan-2024, olimpiada... Enter ilə əlavə et' : 'Yeni etiket...'}
                className="flex-1 min-w-[120px] text-xs px-1 py-1 outline-none bg-transparent"
            />
        </div>
    );
};

// ── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({ question, onSave, onClose, saving, availableTopics }) => {
    const [local, setLocal] = useState(question);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-bold text-gray-900">Sualı redaktə et</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body — caps the modal at 90vh and lets the
                   inner sections scroll while the header + footer stay put. */}
                <div className="flex-1 overflow-y-auto">

                {/* ── Metadata card ───────────────────── */}
                <div className="mx-5 mt-4 mb-2 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-4 space-y-4">
                    {/* Difficulty + grade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="inline-block w-1 h-3.5 bg-blue-500 rounded-full" /> Çətinlik
                            </label>
                            <div className="flex items-center gap-2">
                                <DifficultyPill level="EASY" active={local.difficulty === 'EASY'} onClick={() => setLocal(p => ({ ...p, difficulty: p.difficulty === 'EASY' ? null : 'EASY' }))} />
                                <DifficultyPill level="MEDIUM" active={local.difficulty === 'MEDIUM'} onClick={() => setLocal(p => ({ ...p, difficulty: p.difficulty === 'MEDIUM' ? null : 'MEDIUM' }))} />
                                <DifficultyPill level="HARD" active={local.difficulty === 'HARD'} onClick={() => setLocal(p => ({ ...p, difficulty: p.difficulty === 'HARD' ? null : 'HARD' }))} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="inline-block w-1 h-3.5 bg-sky-500 rounded-full" /> Sinif
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {GRADE_LEVELS.map(g => {
                                    const active = local.gradeLevel === g;
                                    return (
                                        <button key={g} type="button"
                                            onClick={() => setLocal(p => ({ ...p, gradeLevel: p.gradeLevel === g ? null : g }))}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                active ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-sky-700 border-sky-200 hover:border-sky-400 hover:bg-sky-50'
                                            }`}>
                                            {g}
                                        </button>
                                    );
                                })}
                                {local.gradeLevel && (
                                    <button type="button" onClick={() => setLocal(p => ({ ...p, gradeLevel: null }))}
                                        className="px-2 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl"><HiOutlineX className="w-4 h-4" /></button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Topic combobox */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                            <HiOutlineTag className="w-3.5 h-3.5 text-teal-500" /> Mövzu
                        </label>
                        <TopicCombobox
                            value={local.topic}
                            onChange={(t) => setLocal(p => ({ ...p, topic: t }))}
                            availableTopics={availableTopics}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="text-pink-500">#</span> Etiketlər
                        </label>
                        <TagInput value={local.tags} onChange={(tags) => setLocal(p => ({ ...p, tags }))} />
                    </div>
                </div>

                <QuestionEditor
                    question={local}
                    index={0}
                    onChange={(_qId, updated) => setLocal(prev => ({
                        ...updated,
                        id: prev.id, _bankId: prev._bankId,
                        topic: prev.topic, difficulty: prev.difficulty,
                        gradeLevel: prev.gradeLevel, tags: prev.tags,
                    }))}
                    onDelete={null}
                    hidePoints={false}
                    hideDelete
                />
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 text-sm">Ləğv et</button>
                    <button onClick={() => onSave(local)} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                        <HiOutlineSave className="w-4 h-4" />
                        {saving ? 'Saxlanılır...' : 'Yadda saxla'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Stats Card ───────────────────────────────────────────────────────────────
const StatsCard = ({ stats }) => {
    if (!stats) return null;
    const fmt = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'indi';
        if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
        return `${Math.floor(diff / 86400)} gün əvvəl`;
    };
    const totalByType = Object.entries(stats.byType || {});
    return (
        <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                <HiOutlineLibrary className="w-3.5 h-3.5 text-[var(--primary)]" />
                <strong className="text-[var(--ink-900)]">{stats.total.toLocaleString()}</strong> sual
            </span>
            {totalByType.map(([type, count]) => (
                <span key={type} className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                    <strong className="text-[var(--ink-900)]">{count}</strong> {TYPE_LABELS[BACKEND_TO_FRONTEND[type]] || type}
                </span>
            ))}
            {stats.topics > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                    <HiOutlineTag className="w-3.5 h-3.5 text-amber-600" />
                    <strong className="text-[var(--ink-900)]">{stats.topics}</strong> mövzu
                </span>
            )}
            {stats.tagsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                    <strong className="text-[var(--ink-900)]">{stats.tagsCount}</strong> etiket
                </span>
            )}
            {stats.lastAddedAt && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-3 py-1.5 text-[var(--ink-700)]">
                    <HiOutlineSparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Son əlavə: <strong className="text-[var(--ink-900)]">{fmt(stats.lastAddedAt)}</strong>
                </span>
            )}
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const QuestionBankSubject = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [subject, setSubject] = useState(null);
    const [stats, setStats] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [topicFilter, setTopicFilter] = useState('ALL');
    const [difficultyFilter, setDifficultyFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [gradeFilter, setGradeFilter] = useState('ALL');
    const [sort, setSort] = useState('order');
    const [page, setPage] = useState(0);
    const [viewQuestion, setViewQuestion] = useState(null);
    const [editQuestion, setEditQuestion] = useState(null);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [dragId, setDragId] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => { fetchInitial(); }, [subjectId]);

    // Debounce search input
    useEffect(() => {
        const id = setTimeout(() => setSearchDebounced(search.trim()), 300);
        return () => clearTimeout(id);
    }, [search]);

    // Reset page when filters change
    useEffect(() => { setPage(0); }, [searchDebounced, topicFilter, difficultyFilter, typeFilter, gradeFilter, sort]);

    // Fetch paged questions whenever filters/sort/page change
    useEffect(() => {
        if (!subject) return;
        fetchPaged();
    }, [subject, page, sort, searchDebounced, topicFilter, difficultyFilter, typeFilter, gradeFilter]);

    const fetchInitial = async () => {
        setLoading(true);
        try {
            const subjectsRes = await api.get('/bank/subjects');
            const found = subjectsRes.data.find(s => String(s.id) === String(subjectId));
            const sub = found || { name: 'Fənn', isGlobal: false };
            setSubject(sub);
            setCanEdit(!!found && (!found.isGlobal || isAdmin));
            if (found?.name) {
                api.get('/subjects/topics', { params: { name: found.name } })
                    .then(r => setAvailableTopics(r.data || []))
                    .catch(() => {});
            }
            await refreshStats();
        } catch {
            toast.error('Məlumatlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaged = useCallback(async () => {
        try {
            const params = {
                page, size: PAGE_SIZE, sort,
                search: searchDebounced || undefined,
                topic: topicFilter !== 'ALL' ? topicFilter : undefined,
                difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
                type: typeFilter !== 'ALL' ? FRONTEND_TO_BACKEND[typeFilter] : undefined,
                gradeLevel: gradeFilter !== 'ALL' ? gradeFilter : undefined,
            };
            const { data } = await api.get(`/bank/subjects/${subjectId}/questions/paged`, { params });
            setQuestions((data.content || []).map(bankToEditor));
            setTotalElements(data.totalElements ?? 0);
        } catch {
            toast.error('Suallar yüklənmədi');
        }
    }, [subjectId, page, sort, searchDebounced, topicFilter, difficultyFilter, typeFilter, gradeFilter]);

    const refreshStats = async () => {
        try {
            const { data } = await api.get(`/bank/subjects/${subjectId}/stats`);
            setStats(data);
        } catch {}
    };

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            const inField = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
            if (e.key === '/' && !inField) {
                e.preventDefault();
                searchRef.current?.focus();
            } else if ((e.key === 'n' || e.key === 'N') && !inField && canEdit && !viewQuestion && !editQuestion && !aiModalOpen) {
                e.preventDefault();
                handleAddQuestion();
            } else if (e.key === 'Escape') {
                if (viewQuestion) setViewQuestion(null);
                else if (editQuestion) setEditQuestion(null);
                else if (selectedIds.size > 0) setSelectedIds(new Set());
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [canEdit, viewQuestion, editQuestion, aiModalOpen, selectedIds]);

    // ── Save (with duplicate detection) ──────────────────────────────────────
    const handleSave = async (localQuestion) => {
        // The exam editor lets teachers create image-only questions (e.g. a
        // scanned task cropped from a PDF) with no typed text. In the question
        // bank we now allow the same: if there's an attached image, the text
        // can be empty. Without both, the question is empty and we still block.
        const hasText = !!localQuestion.text?.trim();
        const hasImage = !!localQuestion.attachedImage;
        if (!hasText && !hasImage) {
            toast.error('Sual mətni və ya şəkli əlavə edin');
            return;
        }

        const contentValidation = validateLatexSyntax(localQuestion.text);
        if (!contentValidation.valid) {
            toast.error(`LaTeX xətası sualda:\n${getLatexErrorMessage(contentValidation.errors)}`);
            return;
        }
        if (localQuestion.options) {
            for (const opt of localQuestion.options) {
                const optValidation = validateLatexSyntax(opt.text);
                if (!optValidation.valid) { toast.error(`LaTeX xətası variantda:\n${getLatexErrorMessage(optValidation.errors)}`); return; }
            }
        }
        if (localQuestion.sampleAnswer) {
            const answerValidation = validateLatexSyntax(localQuestion.sampleAnswer);
            if (!answerValidation.valid) { toast.error(`LaTeX xətası cavabda:\n${getLatexErrorMessage(answerValidation.errors)}`); return; }
        }

        const needsCorrect = ['MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(localQuestion.type);
        const needsAnswer  = ['OPEN_AUTO', 'FILL_IN_THE_BLANK'].includes(localQuestion.type);
        if (needsCorrect && !localQuestion.options?.some(o => o.isCorrect)) { toast.error('Ən azı bir düzgün variant seçilməlidir'); return; }
        if (needsAnswer && !localQuestion.sampleAnswer?.trim()) { toast.error('Düzgün cavab daxil edilməlidir'); return; }

        // Duplicate detection — but ONLY for questions that have meaningful,
        // non-empty text. Image-only / blank questions can't realistically
        // be duplicates (the image is the content) and every previous
        // attempt to compare them just produced false positives. Skip the
        // check unless we have at least 10 characters of plain (non-HTML)
        // text — that filters out empty placeholders, single letters,
        // dashes, etc.
        const plainText = (localQuestion.text || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&[a-z]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (plainText.length >= 10) {
            const hash = dedupeHash(localQuestion);
            const dup = questions.find(q => q.id !== localQuestion.id && dedupeHash(q) === hash);
            if (dup && !window.confirm('Eyni mətnli sual artıq mövcuddur. Yenə də yadda saxlayım?')) return;
        }

        setSaving(true);
        try {
            const payload = editorToBank(Number(subjectId), localQuestion);
            if (localQuestion._bankId) await api.put(`/bank/questions/${localQuestion._bankId}`, payload);
            else await api.post('/bank/questions', payload);
            setEditQuestion(null);
            toast.success('Sual yadda saxlanıldı');
            await Promise.all([fetchPaged(), refreshStats()]);
        } catch {
            toast.error('Yadda saxlanılmadı');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (localId) => {
        const q = questions.find(q => q.id === localId);
        if (!q) return;
        if (q._bankId) {
            if (!window.confirm('Bu sualı silmək istədiyinizdən əminsiniz?')) return;
            try {
                await api.delete(`/bank/questions/${q._bankId}`);
                toast.success('Sual silindi');
                await Promise.all([fetchPaged(), refreshStats()]);
            } catch {
                toast.error('Əməliyyat uğursuz oldu');
            }
        } else {
            setQuestions(prev => prev.filter(q => q.id !== localId));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        const ids = [...selectedIds].map(id => questions.find(q => q.id === id)?._bankId).filter(Boolean);
        if (ids.length === 0) return;
        if (!window.confirm(`${ids.length} sualı silmək istədiyinizdən əminsiniz?`)) return;
        setBulkDeleting(true);
        try {
            const { data } = await api.post('/bank/questions/bulk-delete', { ids });
            // Older backend builds don't return `deleted` — fall back to the
            // count we requested so the toast never shows "undefined sual silindi".
            toast.success(`${data?.deleted ?? ids.length} sual silindi`);
            setSelectedIds(new Set());
            await Promise.all([fetchPaged(), refreshStats()]);
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleClone = async (q) => {
        if (!q._bankId) { toast.error('Əvvəlcə yadda saxlanmalıdır'); return; }
        try {
            await api.post(`/bank/questions/${q._bankId}/clone`);
            toast.success('Sual klonlandı');
            await Promise.all([fetchPaged(), refreshStats()]);
        } catch {
            toast.error('Klonlama uğursuz oldu');
        }
    };

    const handleAddQuestion = () => {
        const newQ = newEditorQuestion(totalElements);
        setEditQuestion(newQ);
    };

    const handleExportExcel = async () => {
        try {
            const res = await api.get(`/bank/subjects/${subjectId}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subject?.name || 'sual-bazasi'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Yükləmə uğursuz oldu');
        }
    };

    // ── Drag & drop reorder (HTML5 native) ───────────────────────────────────
    const onDragStart = (id) => setDragId(id);
    const onDragOver = (e, id) => { e.preventDefault(); if (id !== hoverId) setHoverId(id); };
    const onDragEnd = () => { setDragId(null); setHoverId(null); };
    const onDrop = async (targetId) => {
        if (!dragId || dragId === targetId) { onDragEnd(); return; }
        const fromIdx = questions.findIndex(q => q.id === dragId);
        const toIdx   = questions.findIndex(q => q.id === targetId);
        if (fromIdx < 0 || toIdx < 0) { onDragEnd(); return; }
        const next = [...questions];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        setQuestions(next);
        onDragEnd();
        // Persist (only if all have _bankId)
        const orderedIds = next.map(q => q._bankId).filter(Boolean);
        try {
            await api.post(`/bank/subjects/${subjectId}/reorder`, { orderedIds });
        } catch {
            toast.error('Sıra yadda saxlanmadı');
            fetchPaged();
        }
    };

    // ── Derived UI data ──────────────────────────────────────────────────────
    const allFilteredSelected = questions.length > 0 && questions.every(q => selectedIds.has(q.id));
    const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
    const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
    const showingTo   = Math.min((page + 1) * PAGE_SIZE, totalElements);
    const draggableSort = sort === 'order' && !searchDebounced
        && topicFilter === 'ALL' && difficultyFilter === 'ALL'
        && typeFilter === 'ALL' && gradeFilter === 'ALL';

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--paper-cream)' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20" style={{ background: 'var(--paper-cream)' }}>
            {/* Hero — testup style */}
            <section className="bg-white border-b border-[var(--ink-150)]">
                <div className="container-main py-8 md:py-12">
                    {/* Breadcrumb back */}
                    <button
                        onClick={() => navigate('/sual-bazasi')}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-500)] hover:text-[var(--primary)] mb-4 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Sual Bazası
                    </button>

                    <div className="flex items-end justify-between flex-wrap gap-5">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] border border-[var(--brand-blue-100)]">
                                <HiOutlineBookOpen className="w-3.5 h-3.5" />
                                Fənn
                                {subject?.isGlobal && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-[var(--primary)]/60 mx-0.5" />
                                        <HiOutlineGlobe className="w-3.5 h-3.5" />
                                        Ümumi baza
                                    </>
                                )}
                            </span>
                            <h1 className="mt-4 text-[34px] sm:text-[42px] md:text-[48px] font-extrabold text-[var(--ink-900)] tracking-tight leading-[1.05]">
                                {subject?.name}
                            </h1>
                            <p className="mt-3 text-[15px] text-[var(--ink-500)] leading-relaxed max-w-xl">
                                Bu fənn üzrə sualları idarə edin — yeni əlavə edin, AI ilə yaradın və ya Excel-dən idxal/ixrac edin.
                            </p>

                            {/* Stat chips */}
                            <div className="mt-5">
                                <StatsCard stats={stats} />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <button
                                onClick={handleExportExcel}
                                className="h-11 px-4 inline-flex items-center gap-1.5 bg-white border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] text-[13.5px] font-semibold rounded-full transition-colors"
                                title="Excel olaraq ixrac et"
                            >
                                <HiOutlineDownload className="w-4 h-4" /> Excel
                            </button>
                            {canEdit && (
                                <>
                                    <button
                                        onClick={() => setAiModalOpen(true)}
                                        className="h-11 px-5 inline-flex items-center gap-1.5 text-white text-[13.5px] font-bold rounded-full transition-all shadow-[0_8px_24px_-10px_rgba(34,197,94,0.55)]"
                                        style={{ background: 'linear-gradient(135deg, var(--brand-green-600) 0%, var(--primary) 100%)' }}
                                    >
                                        <HiOutlineSparkles className="w-4 h-4" /> AI ilə sual yarat
                                    </button>
                                    <button
                                        onClick={handleAddQuestion}
                                        className="h-11 px-5 inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors"
                                        title="Yeni sual (N)"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" /> Yeni sual
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-main mt-6 space-y-4">
                {/* Search box */}
                <div className="relative max-w-md">
                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-400)]" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Sual mətnində, variantda axtar..."
                        className="w-full h-10 pl-10 pr-12 text-[13px] bg-white border border-[var(--ink-200)] rounded-full focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--ink-400)] bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-md px-1.5 py-0.5">/</kbd>
                </div>

                {/* Filter & sort row */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="text-[12px] font-bold px-3.5 py-2 border border-[var(--ink-200)] rounded-full bg-white focus:outline-none focus:border-[var(--primary)] text-[var(--ink-700)]"
                    >
                        <option value="ALL">Bütün tiplər</option>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                        value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}
                        className="text-[12px] font-bold px-3.5 py-2 border border-[var(--ink-200)] rounded-full bg-white focus:outline-none focus:border-[var(--primary)] text-[var(--ink-700)]"
                    >
                        <option value="ALL">Bütün çətinliklər</option>
                        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                        value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
                        className="text-[12px] font-bold px-3.5 py-2 border border-[var(--ink-200)] rounded-full bg-white focus:outline-none focus:border-[var(--primary)] text-[var(--ink-700)]"
                    >
                        <option value="ALL">Bütün siniflər</option>
                        {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select
                        value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
                        className="text-[12px] font-bold px-3.5 py-2 border border-[var(--ink-200)] rounded-full bg-white focus:outline-none focus:border-[var(--primary)] text-[var(--ink-700)] max-w-[200px]"
                    >
                        <option value="ALL">Bütün mövzular</option>
                        {availableTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>

                    <div className="flex-1" />

                    <div className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 border border-[var(--ink-200)] rounded-full bg-white">
                        <HiOutlineSortDescending className="w-3.5 h-3.5 text-[var(--ink-400)]" />
                        <select
                            value={sort} onChange={e => setSort(e.target.value)}
                            className="text-[12px] font-bold bg-transparent focus:outline-none text-[var(--ink-700)] pr-2"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Bulk action bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-[var(--primary-soft)] border border-[var(--brand-blue-200)] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-[var(--sh-sm)]">
                        <span className="w-7 h-7 rounded-xl bg-white text-[var(--primary)] border border-[var(--brand-blue-200)] inline-flex items-center justify-center shrink-0">
                            <HiOutlineCheck className="w-4 h-4" />
                        </span>
                        <p className="text-[13px] font-bold text-[var(--primary-hover)] tracking-tight">
                            <span className="font-extrabold">{selectedIds.size}</span> sual seçildi
                        </p>
                        <div className="flex-1" />
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-[12px] font-semibold text-[var(--ink-700)] hover:bg-white px-3 py-1.5 rounded-full transition-colors"
                        >Seçimi təmizlə</button>
                        {canEdit && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 px-3.5 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                            >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                {bulkDeleting ? 'Silinir...' : 'Sil'}
                            </button>
                        )}
                    </div>
                )}

                {/* Table */}
                {totalElements === 0 && questions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-sm)] py-16 px-8 text-center">
                        <span className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--ink-50)] inline-flex items-center justify-center">
                            <HiOutlineBookOpen className="w-8 h-8 text-[var(--ink-300)]" />
                        </span>
                        <p className="text-[15px] font-bold text-[var(--ink-800)] tracking-tight">Filtrlərə uyğun sual tapılmadı</p>
                        <p className="text-[12.5px] text-[var(--ink-500)] mt-1">Yeni sual əlavə edin və ya filtri sıfırlayın</p>
                        {canEdit && (
                            <button onClick={handleAddQuestion} className="mt-5 inline-flex items-center gap-2 h-11 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full font-bold text-[13px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors">
                                <HiOutlinePlus className="w-4 h-4" /> İlk sualı əlavə et
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-sm)] overflow-hidden">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="bg-[var(--paper-cream)]/60 border-b border-[var(--ink-150)] text-[10.5px] font-bold text-[var(--ink-500)] uppercase tracking-[0.08em]">
                                    <th className="px-3 py-3 text-left w-8">
                                        {canEdit && (
                                            <input
                                                type="checkbox"
                                                checked={allFilteredSelected}
                                                onChange={() => {
                                                    if (allFilteredSelected) setSelectedIds(new Set());
                                                    else setSelectedIds(new Set(questions.map(q => q.id)));
                                                }}
                                                className="w-4 h-4 rounded accent-[var(--primary)] focus:ring-[var(--primary)]"
                                            />
                                        )}
                                    </th>
                                    <th className="px-3 py-3 text-left w-10">#</th>
                                    <th className="px-4 py-3 text-left">Sual</th>
                                    <th className="px-4 py-3 text-left w-28">Mövzu</th>
                                    <th className="px-4 py-3 text-left w-20">Sinif</th>
                                    <th className="px-4 py-3 text-left w-24">Çətinlik</th>
                                    <th className="px-4 py-3 text-left w-36">Tip</th>
                                    <th className="px-4 py-3 text-center w-14">Bal</th>
                                    <th className="px-4 py-3 text-right w-36">Əməliyyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {questions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-gray-400">
                                            <HiOutlineSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>Filtrlərə uyğun sual tapılmadı</p>
                                        </td>
                                    </tr>
                                ) : questions.map((q, idx) => {
                                    const checked = selectedIds.has(q.id);
                                    const isDragTarget = hoverId === q.id && dragId !== q.id;
                                    return (
                                    <tr
                                        key={q.id}
                                        draggable={canEdit && draggableSort}
                                        onDragStart={() => onDragStart(q.id)}
                                        onDragOver={(e) => onDragOver(e, q.id)}
                                        onDragLeave={() => setHoverId(null)}
                                        onDrop={() => onDrop(q.id)}
                                        onDragEnd={onDragEnd}
                                        className={`transition-colors ${checked ? 'bg-blue-50/60' : 'hover:bg-gray-100'} ${isDragTarget ? 'outline outline-2 outline-blue-400' : ''}`}
                                    >
                                        <td className="px-3 py-3 align-top">
                                            <div className="flex items-center gap-1.5">
                                                {canEdit && draggableSort && (
                                                    <span className="cursor-grab text-gray-300 hover:text-gray-500" title="Sıralamaq üçün sürüşdür">
                                                        <HiOutlineMenu className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                                {canEdit && (
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => {
                                                            setSelectedIds(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(q.id)) next.delete(q.id); else next.add(q.id);
                                                                return next;
                                                            });
                                                        }}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-400"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-400 font-medium align-top">
                                            {page * PAGE_SIZE + idx + 1}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-start gap-3">
                                                {q.attachedImage && (
                                                    <img
                                                        src={q.attachedImage}
                                                        alt="Sual şəkli"
                                                        className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                                                        loading="lazy"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {q.text?.trim() ? (
                                                        <div className="line-clamp-2 text-gray-800">
                                                            <LatexPreview content={q.text} placeholder={null} />
                                                        </div>
                                                    ) : (
                                                        !q.attachedImage && <span className="text-gray-300">—</span>
                                                    )}
                                                    {(q.tags || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {q.tags.slice(0, 4).map(t => (
                                                                <span key={t} className="text-[10px] font-semibold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-full">#{t}</span>
                                                            ))}
                                                            {q.tags.length > 4 && (
                                                                <span className="text-[10px] text-gray-400">+{q.tags.length - 4}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!q._bankId && (
                                                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">Yadda saxlanılmayıb</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {q.topic ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                                                    <HiOutlineTag className="w-3 h-3" />{q.topic}
                                                </span>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {q.gradeLevel ? (
                                                <span className="text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full whitespace-nowrap">{q.gradeLevel}</span>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {q.difficulty ? (
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${DIFFICULTY_COLORS[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                                                    {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                                                </span>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_COLORS[q.type] || 'bg-gray-100 text-gray-600'}`}>
                                                {TYPE_LABELS[q.type] || q.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700 align-top">{q.points}</td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setViewQuestion(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Bax">
                                                    <HiOutlineEye className="w-4 h-4" />
                                                </button>
                                                {canEdit && (
                                                    <>
                                                        <button onClick={() => setEditQuestion(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Redaktə">
                                                            <HiOutlinePencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleClone(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="Klonla">
                                                            <HiOutlineDocumentDuplicate className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Sil">
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalElements > PAGE_SIZE && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-xs text-gray-500">
                                    {showingFrom}–{showingTo} / {totalElements}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <HiOutlineChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-semibold text-gray-700 px-2">
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <HiOutlineChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Drag hint */}
                {canEdit && !draggableSort && totalElements > 1 && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <HiOutlineExclamation className="w-3.5 h-3.5" />
                        Sırasını dəyişmək üçün sıralamağı "Sıra üzrə"-yə qoyun və filtrləri təmizləyin.
                    </p>
                )}
            </div>

            {viewQuestion && <ViewModal question={viewQuestion} onClose={() => setViewQuestion(null)} />}
            {editQuestion && (
                <EditModal
                    question={editQuestion}
                    onSave={handleSave}
                    onClose={() => setEditQuestion(null)}
                    saving={saving}
                    availableTopics={availableTopics}
                />
            )}

            <AiGenerateModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                subjectId={Number(subjectId)}
                subjectName={subject?.name || ''}
                topics={availableTopics}
                onSave={() => Promise.all([fetchPaged(), refreshStats()])}
            />
        </div>
    );
};

export default QuestionBankSubject;
