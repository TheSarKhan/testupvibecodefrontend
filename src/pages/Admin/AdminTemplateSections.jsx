import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineInformationCircle, HiOutlineX, HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineVolumeUp, HiOutlineDocumentText } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QUESTION_TYPE_OPTIONS = [
    { value: 'MCQ',               label: 'Birseçimli / Doğru-Yanlış' },
    { value: 'MULTI_SELECT',      label: 'Çoxseçimli' },
    { value: 'OPEN_AUTO',         label: 'Açıq (avtomatik)' },
    { value: 'FILL_IN_THE_BLANK', label: 'Boşluq doldurma' },
    { value: 'MATCHING',          label: 'Uyğunlaşdırma' },
    { value: 'OPEN_MANUAL',       label: 'Açıq (müəllim yoxlayır)' },
];

const QUESTION_TYPE_SHORT = {
    MCQ: 'Birseçimli', MULTI_SELECT: 'Çoxseçimli', OPEN_AUTO: 'Açıq (auto)',
    FILL_IN_THE_BLANK: 'Boşluq', MATCHING: 'Uyğunlaşdırma', OPEN_MANUAL: 'Açıq (müəllim)',
};

const FORMULA_VARS = [
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

const PASSAGE_TYPES = {
    LISTENING: { label: 'Dinləmə', Icon: HiOutlineVolumeUp,     color: 'purple' },
    TEXT:      { label: 'Mətn',    Icon: HiOutlineDocumentText, color: 'teal'   },
};

const emptyRow   = () => ({ questionType: 'MCQ', count: 1 });
const emptyGroup = (passageType = null) => ({ passageType, collapsed: false, rows: [emptyRow()] });

function buildGroups(typeCounts) {
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

// ─── Section Form ──────────────────────────────────────────────────────────────
const parsePointGroups = (json) => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
};

const SectionForm = ({ initial, onSave, onCancel, saving, subjects }) => {
    const [subjectName, setSubjectName] = useState(initial?.subjectName || '');
    const [formula, setFormula] = useState(initial?.formula || '');
    const [showVars, setShowVars] = useState(false);
    const [groups, setGroups] = useState(() => buildGroups(initial?.typeCounts));
    const [showGroupMenu, setShowGroupMenu] = useState(false);
    const menuRef = useRef(null);

    // Point groups state
    const [pgEnabled, setPgEnabled] = useState(() => !!initial?.pointGroups);
    const [pgList, setPgList] = useState(() => {
        const parsed = parsePointGroups(initial?.pointGroups);
        return parsed.length ? parsed : [{ from: 1, to: 10, points: 1.0 }];
    });

    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowGroupMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const total = groups.reduce((s, g) => s + g.rows.reduce((rs, r) => rs + (parseInt(r.count) || 0), 0), 0);

    const addGroup = (passageType) => { setGroups(prev => [...prev, emptyGroup(passageType)]); setShowGroupMenu(false); };
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

    const handleSave = () => {
        if (!subjectName.trim()) { toast.error('Fənn seçin'); return; }
        if (!formula.trim()) { toast.error('Düstur daxil edin'); return; }
        const allRows = groups.flatMap(g => g.rows);
        if (!allRows.length || allRows.some(r => parseInt(r.count) < 1)) {
            toast.error('Hər sual tipinin sayı ən azı 1 olmalıdır'); return;
        }
        onSave({
            subjectName: subjectName.trim(),
            formula: formula.trim(),
            typeCounts: groups.flatMap(g =>
                g.rows.map(r => ({ questionType: r.questionType, count: parseInt(r.count), passageType: g.passageType || null }))
            ),
            pointGroups: pgEnabled ? JSON.stringify(pgList) : null,
        });
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden">
            {/* Fənn seçimi */}
            <div className="p-5 border-b border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fənn *</label>
                <select value={subjectName} onChange={e => setSubjectName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                    <option value="">— Fənn seçin —</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Sual qrupları */}
            <div className="p-5 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sual tipləri *</label>
                    <span className="text-xs font-semibold text-indigo-600">Cəmi: {total} sual</span>
                </div>

                {groups.map((group, gi) => {
                    const pt = group.passageType ? PASSAGE_TYPES[group.passageType] : null;
                    const groupTotal = group.rows.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
                    return (
                        <div key={gi} className={`rounded-xl border-2 overflow-hidden ${
                            pt?.color === 'purple' ? 'border-purple-200' :
                            pt?.color === 'teal'   ? 'border-teal-200' : 'border-gray-200'}`}>
                            {pt && (
                                <div className={`flex items-center justify-between px-4 py-2.5 ${pt.color === 'purple' ? 'bg-purple-50' : 'bg-teal-50'}`}>
                                    <div className="flex items-center gap-2">
                                        <pt.Icon className={`w-4 h-4 ${pt.color === 'purple' ? 'text-purple-600' : 'text-teal-600'}`} />
                                        <span className={`text-sm font-bold ${pt.color === 'purple' ? 'text-purple-700' : 'text-teal-700'}`}>{pt.label}</span>
                                        <span className="text-xs text-gray-400 font-medium">{groupTotal} sual</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => toggleCollapse(gi)}
                                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
                                            {group.collapsed ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronUp className="w-4 h-4" />}
                                        </button>
                                        <button type="button" onClick={() => removeGroup(gi)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!group.collapsed && (
                                <div className="p-3 space-y-2">
                                    {group.rows.map((r, ri) => (
                                        <div key={ri} className="flex items-center gap-2">
                                            <select value={r.questionType} onChange={e => updateRow(gi, ri, 'questionType', e.target.value)}
                                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                                {QUESTION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            {group.rows.length > 1 && (
                                                <button type="button" onClick={() => removeRow(gi, ri)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors">
                                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                <button type="button" onClick={() => stepCount(gi, ri, -1)}
                                                    className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">−</button>
                                                <span className="w-10 text-center text-sm font-bold text-gray-800 select-none">{r.count}</span>
                                                <button type="button" onClick={() => stepCount(gi, ri, 1)}
                                                    className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addRow(gi)}
                                        className={`w-full mt-1 py-2 text-xs font-semibold border border-dashed rounded-lg transition-colors ${
                                            pt?.color === 'purple' ? 'border-purple-200 text-purple-600 hover:bg-purple-50' :
                                            pt?.color === 'teal'   ? 'border-teal-200 text-teal-600 hover:bg-teal-50' :
                                            'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                                        {pt ? `+ ${pt.label}ə sual əlavə et` : '+ Sıra əlavə et'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add group */}
                <div className="relative" ref={menuRef}>
                    <button type="button" onClick={() => setShowGroupMenu(v => !v)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <HiOutlinePlus className="w-4 h-4" /> Yeni sual tipi əlavə et
                    </button>
                    {showGroupMenu && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                            <button type="button" onClick={() => addGroup(null)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-medium text-gray-700">
                                Adi suallar
                            </button>
                            <button type="button" onClick={() => addGroup('LISTENING')}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors font-medium text-purple-700 flex items-center gap-2">
                                <HiOutlineVolumeUp className="w-4 h-4" /> Dinləmə
                            </button>
                            <button type="button" onClick={() => addGroup('TEXT')}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors font-medium text-teal-700 flex items-center gap-2">
                                <HiOutlineDocumentText className="w-4 h-4" /> Mətn
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Düstur */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Düstur *</label>
                    <button type="button" onClick={() => setShowVars(v => !v)}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                        <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                        {showVars ? 'Gizlət' : 'Dəyişənlərə bax'}
                    </button>
                </div>
                {showVars && (
                    <div className="mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {FORMULA_VARS.map(({ v, label }) => (
                            <button key={v} type="button" onClick={() => setFormula(f => f + v)}
                                className="flex items-center gap-1.5 text-xs hover:bg-white rounded-lg px-1.5 py-1 transition-colors text-left">
                                <code className="bg-white border border-indigo-200 text-indigo-700 font-bold px-1.5 py-0.5 rounded min-w-[1.5rem] text-center">{v}</code>
                                <span className="text-gray-500">{label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <textarea value={formula} onChange={e => setFormula(e.target.value)}
                    placeholder={'a*1.5 - b*0.5\n\n(a = birseçimli düzgün, b = yanlış...)'}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none" />
            </div>

            {/* Bal qrupları */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bal Qrupları</label>
                    <button type="button" onClick={() => setPgEnabled(v => !v)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pgEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${pgEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                {pgEnabled && (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400">Hər sualın 1-əsaslı sıra nömrəsinə görə bal təyin et (olimpiyada üçün)</p>
                        {pgList.map((pg, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-6">{i + 1}.</span>
                                <input type="number" min={1} value={pg.from}
                                    onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, from: parseInt(e.target.value) || 1 } : p))}
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-400" placeholder="başlanğıc" />
                                <span className="text-xs text-gray-400">—</span>
                                <input type="number" min={1} value={pg.to}
                                    onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, to: parseInt(e.target.value) || 1 } : p))}
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-400" placeholder="son" />
                                <span className="text-xs text-gray-400">→</span>
                                <input type="number" min={0} step={0.5} value={pg.points}
                                    onChange={e => setPgList(prev => prev.map((p, j) => j === i ? { ...p, points: parseFloat(e.target.value) || 0 } : p))}
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-400" placeholder="bal" />
                                <span className="text-xs text-gray-400">bal</span>
                                {pgList.length > 1 && (
                                    <button type="button" onClick={() => setPgList(prev => prev.filter((_, j) => j !== i))}
                                        className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => setPgList(prev => [...prev, { from: (prev[prev.length-1]?.to || 0) + 1, to: (prev[prev.length-1]?.to || 0) + 5, points: 1.5 }])}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1 transition-colors">
                            <HiOutlinePlus className="w-3.5 h-3.5" /> Qrup əlavə et
                        </button>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <button onClick={onCancel}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-white transition-colors font-medium">
                    Ləğv et
                </button>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors">
                    <HiOutlineCheck className="w-4 h-4" />
                    {saving ? 'Saxlanılır...' : 'Saxla'}
                </button>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const AdminTemplateSections = () => {
    const { templateId, subtitleId } = useParams();
    const navigate = useNavigate();
    const [info, setInfo] = useState({ templateTitle: '', subtitleName: '' });
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingIdx, setEditingIdx] = useState(null);
    const [savingIdx, setSavingIdx] = useState(null);

    useEffect(() => { fetchData(); }, [subtitleId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sectionsRes, subjectsRes] = await Promise.all([
                api.get(`/admin/subtitles/${subtitleId}/sections`),
                api.get('/subjects'),
            ]);
            setSections(sectionsRes.data);
            setSubjects(subjectsRes.data);

            if (sectionsRes.data.length > 0) {
                setInfo({ templateTitle: sectionsRes.data[0].templateTitle, subtitleName: sectionsRes.data[0].subtitleName });
            } else {
                const [subRes, tmplRes] = await Promise.all([
                    api.get(`/admin/templates/${templateId}/subtitles`),
                    api.get('/admin/templates'),
                ]);
                const sub = subRes.data.find(s => String(s.id) === String(subtitleId));
                const tmpl = tmplRes.data.find(t => String(t.id) === String(templateId));
                setInfo({ templateTitle: tmpl?.title || '', subtitleName: sub?.subtitle || '' });
            }
        } catch {
            toast.error('Məlumatlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        const payload = {
            subjectName: formData.subjectName,
            formula: formData.formula,
            typeCounts: formData.typeCounts.map(tc => ({ questionType: tc.questionType, count: parseInt(tc.count) })),
            pointGroups: formData.pointGroups || null,
        };

        if (editingIdx === -1) {
            setSavingIdx(-1);
            try {
                const { data } = await api.post(`/admin/subtitles/${subtitleId}/sections`, payload);
                setSections(prev => [...prev, data]);
                setEditingIdx(null);
                toast.success('Fənn əlavə edildi');
            } catch { toast.error('Əməliyyat uğursuz oldu'); }
            finally { setSavingIdx(null); }
        } else {
            const sectionId = sections[editingIdx].id;
            setSavingIdx(editingIdx);
            try {
                const { data } = await api.put(`/admin/sections/${sectionId}`, payload);
                setSections(prev => prev.map((s, i) => i === editingIdx ? data : s));
                setEditingIdx(null);
                toast.success('Fənn yeniləndi');
            } catch { toast.error('Əməliyyat uğursuz oldu'); }
            finally { setSavingIdx(null); }
        }
    };

    const handleDelete = async (idx) => {
        const section = sections[idx];
        if (!window.confirm(`"${section.subjectName}" fənnini silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/sections/${section.id}`);
            setSections(prev => prev.filter((_, i) => i !== idx));
            toast.success('Fənn silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    return (
        <div className="p-8 max-w-3xl">
            <button onClick={() => navigate(`/admin/sablonlar/${templateId}`)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Altbaşlıqlara qayıt
            </button>

            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                        {info.templateTitle}{info.templateTitle && info.subtitleName ? ' · ' : ''}{info.subtitleName}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">Fənnlər</h1>
                    <p className="text-gray-500 mt-1 text-sm">Bu altbaşlığa aid fənnləri idarə edin</p>
                </div>
                {editingIdx !== -1 && (
                    <button onClick={() => setEditingIdx(-1)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <HiOutlinePlus className="w-4 h-4" /> Fənn əlavə et
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((s, i) => {
                        const total = (s.typeCounts || []).reduce((sum, tc) => sum + (tc.count || 0), 0);

                        if (editingIdx === i) {
                            return (
                                <SectionForm
                                    key={s.id}
                                    initial={{
                                        subjectName: s.subjectName,
                                        formula: s.formula,
                                        typeCounts: (s.typeCounts || []).map(tc => ({ questionType: tc.questionType, count: String(tc.count) })),
                                    }}
                                    subjects={subjects}
                                    onSave={handleSave}
                                    onCancel={() => setEditingIdx(null)}
                                    saving={savingIdx === i}
                                />
                            );
                        }

                        return (
                            <div key={s.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="font-bold text-gray-900">{s.subjectName}</span>
                                        <span className="text-xs text-gray-400 font-medium">{s.questionCount || total} sual</span>
                                        <code className="text-xs font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{s.formula}</code>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(s.typeCounts || []).map((tc, j) => {
                                            const pt = tc.passageType ? PASSAGE_TYPES[tc.passageType] : null;
                                            return (
                                                <span key={j} className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg gap-1 ${
                                                    pt?.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                                    pt?.color === 'teal'   ? 'bg-teal-100 text-teal-700' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                                    {pt && <pt.Icon className="w-3 h-3" />}
                                                    {QUESTION_TYPE_SHORT[tc.questionType] || tc.questionType}
                                                    <span className="opacity-40">·</span>
                                                    {tc.count}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => setEditingIdx(i)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <HiOutlinePencilAlt className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(i)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {editingIdx === -1 && (
                        <SectionForm
                            subjects={subjects}
                            onSave={handleSave}
                            onCancel={() => setEditingIdx(null)}
                            saving={savingIdx === -1}
                        />
                    )}

                    {sections.length === 0 && editingIdx !== -1 && (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
                            <p className="font-medium">Hələ fənn yoxdur</p>
                            <button onClick={() => setEditingIdx(-1)}
                                className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                + Fənn əlavə et
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminTemplateSections;
