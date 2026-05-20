import { useEffect, useRef, useState } from 'react';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlineCheck, HiOutlineInformationCircle,
    HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineVolumeUp, HiOutlineDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export const QUESTION_TYPE_OPTIONS = [
    { value: 'MCQ',               label: 'Birseçimli',          short: 'MCQ',     color: 'blue' },
    { value: 'MULTI_SELECT',      label: 'Çoxseçimli',          short: 'Multi',   color: 'emerald' },
    { value: 'OPEN_AUTO',         label: 'Açıq (auto)',         short: 'Auto',    color: 'emerald' },
    { value: 'OPEN_MANUAL',       label: 'Açıq (müəllim)',      short: 'Manual',  color: 'amber' },
    { value: 'FILL_IN_THE_BLANK', label: 'Boşluq doldurma',     short: 'Boşluq',  color: 'teal' },
    { value: 'MATCHING',          label: 'Uyğunlaşdırma',       short: 'Uyğun',   color: 'rose' },
];

export const QUESTION_TYPE_SHORT = {
    MCQ: 'Birseçimli', MULTI_SELECT: 'Çoxseçimli', OPEN_AUTO: 'Açıq (auto)',
    FILL_IN_THE_BLANK: 'Boşluq', MATCHING: 'Uyğunlaşdırma', OPEN_MANUAL: 'Açıq (müəllim)',
};

const TYPE_CHIP_COLORS = {
    blue:  'bg-blue-50 text-blue-700 ring-blue-200',
    emerald:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber:   'bg-amber-50 text-amber-700 ring-amber-200',
    teal:    'bg-teal-50 text-teal-700 ring-teal-200',
    rose:    'bg-rose-50 text-rose-700 ring-rose-200',
};

export const FORMULA_VARS = [
    { v: 'a', label: 'Birseçimli düzgün' },        { v: 'b', label: 'Birseçimli yanlış' },  { v: 'c', label: 'Birseçimli boş' },
    { v: 'd', label: 'Çoxseçimli düzgün' },         { v: 'e', label: 'Çoxseçimli yanlış' },
    { v: 'f', label: 'Açıq (auto) düzgün' },        { v: 'g', label: 'Açıq (auto) yanlış' },
    { v: 'l', label: 'Açıq (müəllim) düzgün' },     { v: 'm', label: 'Açıq (müəllim) yanlış' },
    { v: 'h', label: 'Boşluq düzgün' },             { v: 'i', label: 'Boşluq yanlış' },
    { v: 'j', label: 'Uyğunlaşdırma düzgün' },      { v: 'k', label: 'Uyğunlaşdırma yanlış' },
    { v: 's', label: 'Düzgün MCQ balları cəmi' },
    { v: 'w', label: 'Yanlış MCQ balları cəmi' },
    { v: 'n', label: 'Ümumi sual sayı' },
];

export const PASSAGE_TYPES = {
    LISTENING: { label: 'Dinləmə', Icon: HiOutlineVolumeUp,     color: 'emerald' },
    TEXT:      { label: 'Mətn',    Icon: HiOutlineDocumentText, color: 'teal'   },
};

export const emptyRow   = () => ({ questionType: 'MCQ', count: 1 });
export const emptyGroup = (passageType = null) => ({ passageType, collapsed: false, rows: [emptyRow()] });

export function buildGroups(typeCounts) {
    if (!typeCounts?.length) return [emptyGroup(null)];
    const seen = [], map = {};
    for (const tc of typeCounts) {
        const key = tc.passageType || '__standalone__';
        if (!map[key]) { map[key] = []; seen.push(key); }
        map[key].push({ questionType: tc.questionType, count: tc.count });
    }
    return seen.map(key => ({
        passageType: key === '__standalone__' ? null : key,
        collapsed: false,
        rows: map[key],
    }));
}

const parsePointGroups = (json) => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
};

// ── Visual question-type chip selector ───────────────────────────────────────
const TypeChipSelect = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
        {QUESTION_TYPE_OPTIONS.map(opt => {
            const active = value === opt.value;
            return (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ring-1 transition-all ${
                        active
                            ? `${TYPE_CHIP_COLORS[opt.color]} shadow-sm`
                            : 'bg-white text-gray-500 ring-gray-200 hover:ring-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

// ── Card section wrapper ─────────────────────────────────────────────────────
const Section = ({ title, hint, children, action }) => (
    <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</p>
                {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
            </div>
            {action}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

// ── Main form ────────────────────────────────────────────────────────────────
const SectionForm = ({ initial, onSave, onCancel, saving, subjects }) => {
    const [subjectName, setSubjectName] = useState(initial?.subjectName || '');
    const [formula, setFormula] = useState(initial?.formula || '');
    const [showVars, setShowVars] = useState(false);
    const [groups, setGroups] = useState(() => buildGroups(initial?.typeCounts));
    const [allowCustomPoints, setAllowCustomPoints] = useState(initial?.allowCustomPoints ?? true);
    const [maxScore, setMaxScore] = useState(initial?.maxScore ?? '');
    const [pgEnabled, setPgEnabled] = useState(() => !!initial?.pointGroups);
    const [pgList, setPgList] = useState(() => {
        const parsed = parsePointGroups(initial?.pointGroups);
        return parsed.length ? parsed : [{ from: 1, to: 10, points: 1.0 }];
    });
    const formulaRef = useRef(null);

    const total = groups.reduce((s, g) => s + g.rows.reduce((rs, r) => rs + (parseInt(r.count) || 0), 0), 0);

    const addGroup = (passageType) => setGroups(prev => [...prev, emptyGroup(passageType)]);
    const removeGroup = (gi) => setGroups(prev => prev.filter((_, i) => i !== gi));
    const toggleCollapse = (gi) => setGroups(prev => prev.map((g, i) => i === gi ? { ...g, collapsed: !g.collapsed } : g));
    const addRow = (gi) => setGroups(prev => prev.map((g, i) => i === gi ? { ...g, rows: [...g.rows, emptyRow()] } : g));
    const removeRow = (gi, ri) => setGroups(prev => prev.map((g, i) => i === gi ? { ...g, rows: g.rows.filter((_, j) => j !== ri) } : g));
    const updateRow = (gi, ri, field, val) =>
        setGroups(prev => prev.map((g, i) => i === gi ? { ...g, rows: g.rows.map((r, j) => j === ri ? { ...r, [field]: val } : r) } : g));
    const stepCount = (gi, ri, delta) => {
        const cur = parseInt(groups[gi].rows[ri].count) || 0;
        updateRow(gi, ri, 'count', Math.max(1, cur + delta));
    };

    const insertVar = (v) => {
        const el = formulaRef.current;
        if (!el) { setFormula(f => f + v); return; }
        const start = el.selectionStart ?? formula.length;
        const end = el.selectionEnd ?? formula.length;
        const next = formula.slice(0, start) + v + formula.slice(end);
        setFormula(next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + v.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const handleSave = () => {
        if (!subjectName.trim()) { toast.error('Fənn seçin'); return; }
        if (!formula.trim()) { toast.error('Düstur daxil edin'); return; }
        const allRows = groups.flatMap(g => g.rows);
        if (!allRows.length || allRows.some(r => parseInt(r.count) < 1)) {
            toast.error('Hər sual tipinin sayı ən azı 1 olmalıdır'); return;
        }
        // Validate point groups: must fully cover positions 1..total without gaps/overlaps
        if (pgEnabled) {
            const sorted = [...pgList].sort((a, b) => (a.from || 0) - (b.from || 0));
            for (const pg of sorted) {
                if (!pg.from || !pg.to || pg.from > pg.to) {
                    toast.error('Bal qruplarında başlanğıc/son düzgün deyil'); return;
                }
            }
            if (sorted[0].from !== 1) {
                toast.error(`Bal qrupları 1-dən başlamalıdır (indi ${sorted[0].from}-dən başlayır)`); return;
            }
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].from !== sorted[i - 1].to + 1) {
                    toast.error(`Bal qruplarında boşluq/üst-üstə düşmə: ${sorted[i-1].to} → ${sorted[i].from}`); return;
                }
            }
            if (sorted[sorted.length - 1].to !== total) {
                toast.error(`Bal qrupları bütün ${total} sualı əhatə etməlidir (sonuncu: ${sorted[sorted.length - 1].to})`); return;
            }
        }
        onSave({
            subjectName: subjectName.trim(),
            formula: formula.trim(),
            typeCounts: groups.flatMap(g =>
                g.rows.map(r => ({ questionType: r.questionType, count: parseInt(r.count), passageType: g.passageType || null }))
            ),
            pointGroups: pgEnabled ? JSON.stringify(pgList) : null,
            maxScore: maxScore !== '' ? parseFloat(maxScore) : null,
            allowCustomPoints,
        });
    };

    // Cmd/Ctrl + Enter to save
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Subject */}
                <Section title="Fənn" hint="Bu bölmənin aid olduğu fənn">
                    <select
                        autoFocus
                        value={subjectName}
                        onChange={e => setSubjectName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                        <option value="">— Fənn seçin —</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </Section>

                {/* Question type groups */}
                <Section
                    title="Sual tipləri"
                    hint={`Cəmi: ${total} sual`}
                >
                    <div className="space-y-3">
                        {groups.map((group, gi) => {
                            const pt = group.passageType ? PASSAGE_TYPES[group.passageType] : null;
                            const groupTotal = group.rows.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
                            return (
                                <div key={gi} className={`rounded-xl border-2 overflow-hidden ${
                                    pt?.color === 'emerald' ? 'border-emerald-200' :
                                    pt?.color === 'teal'   ? 'border-teal-200' : 'border-gray-200'}`}>
                                    {pt && (
                                        <div className={`flex items-center justify-between px-3 py-2 ${pt.color === 'emerald' ? 'bg-emerald-50' : 'bg-teal-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <pt.Icon className={`w-4 h-4 ${pt.color === 'emerald' ? 'text-emerald-600' : 'text-teal-600'}`} />
                                                <span className={`text-sm font-bold ${pt.color === 'emerald' ? 'text-emerald-700' : 'text-teal-700'}`}>{pt.label}</span>
                                                <span className="text-xs text-gray-500 font-medium">{groupTotal} sual</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => toggleCollapse(gi)} className="p-1 text-gray-400 hover:text-gray-700 rounded">
                                                    {group.collapsed ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronUp className="w-4 h-4" />}
                                                </button>
                                                <button type="button" onClick={() => removeGroup(gi)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {!group.collapsed && (
                                        <div className="p-3 space-y-3">
                                            {group.rows.map((r, ri) => (
                                                <div key={ri} className="space-y-2 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <TypeChipSelect value={r.questionType} onChange={(v) => updateRow(gi, ri, 'questionType', v)} />
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                                <button type="button" onClick={() => stepCount(gi, ri, -1)}
                                                                    className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-bold">−</button>
                                                                <span className="w-9 text-center text-sm font-bold text-gray-800 select-none">{r.count}</span>
                                                                <button type="button" onClick={() => stepCount(gi, ri, 1)}
                                                                    className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
                                                            </div>
                                                            {group.rows.length > 1 && (
                                                                <button type="button" onClick={() => removeRow(gi, ri)}
                                                                    className="p-1.5 text-gray-300 hover:text-red-500 rounded">
                                                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <button type="button" onClick={() => addRow(gi)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-dashed rounded-lg ${
                                                        pt?.color === 'emerald' ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' :
                                                        pt?.color === 'teal'   ? 'border-teal-200 text-teal-600 hover:bg-teal-50' :
                                                        'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                                                    <HiOutlinePlus className="w-3 h-3" /> Sual tipi əlavə et
                                                </button>
                                                {!pt && (
                                                    <>
                                                        <button type="button" onClick={() => addGroup('TEXT')}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-dashed border-teal-200 text-teal-600 hover:bg-teal-50 rounded-lg">
                                                            <HiOutlineDocumentText className="w-3 h-3" /> Mətn qrupu
                                                        </button>
                                                        <button type="button" onClick={() => addGroup('LISTENING')}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                            <HiOutlineVolumeUp className="w-3 h-3" /> Dinləmə qrupu
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {groups.length === 0 && (
                            <button type="button" onClick={() => addGroup(null)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                                <HiOutlinePlus className="w-4 h-4" /> Sual tipi əlavə et
                            </button>
                        )}
                    </div>
                </Section>

                {/* Formula */}
                <Section
                    title="Bal düsturu"
                    hint="Bölmənin yekun balını hesablayan ifadə"
                    action={
                        <button type="button" onClick={() => setShowVars(v => !v)}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
                            <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                            {showVars ? 'Gizlət' : 'Dəyişənlər'}
                        </button>
                    }
                >
                    {showVars && (
                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {FORMULA_VARS.map(({ v, label }) => (
                                <button key={v} type="button" onClick={() => insertVar(v)}
                                    title="Düstura əlavə et"
                                    className="flex items-center gap-1.5 text-xs hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-colors text-left border border-gray-100">
                                    <code className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded min-w-[1.5rem] text-center text-[11px]">{v}</code>
                                    <span className="text-gray-600 truncate">{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <textarea
                        ref={formulaRef}
                        value={formula}
                        onChange={e => setFormula(e.target.value)}
                        placeholder={'Məs: a*1.5 - b*0.5'}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                </Section>

                {/* Score config */}
                <Section title="Bal konfiqurasiyası">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Maksimum bal <span className="text-gray-400 font-normal">(opsional)</span>
                            </label>
                            <input
                                type="number" min={0} step={0.5}
                                value={maxScore}
                                onChange={e => setMaxScore(e.target.value)}
                                placeholder="Boş qoyulsa hesablanmaz"
                                className="w-48 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex items-start justify-between gap-4 pt-2 border-t border-gray-100">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Müəllim suallara fərdi bal versin</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {allowCustomPoints
                                        ? 'Hər sual üçün ayrı bal sahəsi açıq olacaq'
                                        : 'Ballar yalnız düsturla hesablanır'}
                                </p>
                            </div>
                            <button type="button" onClick={() => setAllowCustomPoints(v => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 ${allowCustomPoints ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${allowCustomPoints ? 'translate-x-6' : 'translate-x-1'} transition-transform`} />
                            </button>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Bal qrupları (olimpiyada)</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Sıra nömrəsinə görə bal təyini</p>
                                </div>
                                <button type="button" onClick={() => setPgEnabled(v => !v)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full ${pgEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ${pgEnabled ? 'translate-x-4.5' : 'translate-x-0.5'} transition-transform`} />
                                </button>
                            </div>
                            {pgEnabled && (
                                <div className="space-y-2 mt-3 bg-blue-50/40 rounded-xl p-3">
                                    {pgList.map((pg, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-6 font-semibold">{i + 1}.</span>
                                            <input type="number" min={1} value={pg.from}
                                                onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, from: parseInt(e.target.value) || 1 } : p))}
                                                className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400" />
                                            <span className="text-xs text-gray-400">—</span>
                                            <input type="number" min={1} value={pg.to}
                                                onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, to: parseInt(e.target.value) || 1 } : p))}
                                                className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400" />
                                            <span className="text-xs text-gray-400">→</span>
                                            <input type="number" min={0} step={0.5} value={pg.points}
                                                onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, points: parseFloat(e.target.value) || 0 } : p))}
                                                className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400" />
                                            <span className="text-xs text-gray-400">bal</span>
                                            {pgList.length > 1 && (
                                                <button type="button" onClick={() => setPgList(prev => prev.filter((_, j) => j !== i))}
                                                    className="p-1 text-gray-300 hover:text-red-500">
                                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setPgList(prev => [...prev, { from: (prev[prev.length-1]?.to || 0) + 1, to: (prev[prev.length-1]?.to || 0) + 5, points: 1.5 }])}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1">
                                        <HiOutlinePlus className="w-3.5 h-3.5" /> Qrup əlavə et
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>
            </div>

            {/* Sticky footer with live preview + actions */}
            <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500 flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-blue-700 whitespace-nowrap">{total} sual</span>
                    {subjectName && <span className="text-gray-400 truncate">· {subjectName}</span>}
                    {maxScore && <span className="text-gray-400 whitespace-nowrap">· max {maxScore} bal</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-100 font-medium">
                        Ləğv et
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl">
                        <HiOutlineCheck className="w-4 h-4" />
                        {saving ? 'Saxlanılır...' : 'Saxla'}
                        <kbd className="hidden sm:inline text-[10px] font-normal bg-white/20 px-1 py-0.5 rounded ml-1">⌘↵</kbd>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectionForm;
