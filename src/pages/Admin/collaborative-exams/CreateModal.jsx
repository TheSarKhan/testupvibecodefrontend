import { useState, useEffect } from 'react';
import {
    HiOutlineX, HiOutlineArrowLeft, HiOutlineBookOpen,
    HiOutlineTemplate, HiOutlinePlus, HiOutlineTrash,
} from 'react-icons/hi';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { useCreateCollaborativeExam } from '../../../hooks/admin/useAdminCollaborativeExams';
import TeacherPicker from '../../../components/ui/TeacherPicker';

/**
 * Unified hybrid create modal.
 *
 * One assignments list. Each row is either:
 *   • { kind: 'free',     subjects: string[], email }   ← one row, many subjects
 *   • { kind: 'template', templateId, templateTitle, sectionId, subjectName, questionCount, email }
 *
 * The two kinds coexist inside the same exam — backend derives examType/template based on
 * what was supplied. Multiple rows for the same email (across kinds) are still merged
 * server-side into one collaborator when the payload is built.
 */
const CreateModal = ({ onClose, onCreated }) => {
    const createCollabExam = useCreateCollaborativeExam();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(90);
    const [loading, setLoading] = useState(false);

    // Subjects fetched once for the inline free-row form.
    const [subjects, setSubjects] = useState([]);
    useEffect(() => {
        api.get('/subjects').then(r => setSubjects(r.data || [])).catch(() => {});
    }, []);

    // Unified assignment list — heterogeneous.
    const [assignments, setAssignments] = useState([]);
    const removeAssignment = (i) =>
        setAssignments(prev => prev.filter((_, idx) => idx !== i));

    // ── Inline "add free row" form ───────────────────────────────────────────
    // Multi-subject: pick one or more subjects via the dropdown, they accumulate as
    // removable chips. One "Əlavə et" click creates a single assignment row carrying
    // every selected subject for that email.
    const [freeDraft, setFreeDraft] = useState({ subjects: [], email: '' });
    const addSubjectToDraft = (s) => {
        if (!s) return;
        setFreeDraft(d => d.subjects.includes(s) ? d : { ...d, subjects: [...d.subjects, s] });
    };
    const removeSubjectFromDraft = (s) =>
        setFreeDraft(d => ({ ...d, subjects: d.subjects.filter(x => x !== s) }));
    const addFreeAssignment = () => {
        if (freeDraft.subjects.length === 0) { toast.error('Ən az bir fənn seçin'); return; }
        if (!freeDraft.email.trim()) { toast.error('Müəllim email-i daxil edin'); return; }
        setAssignments(prev => [...prev, {
            kind: 'free',
            subjects: freeDraft.subjects.slice(),
            email: freeDraft.email.trim(),
        }]);
        setFreeDraft({ subjects: [], email: '' });
    };

    // ── Template section picker (4-step modal) ───────────────────────────────
    const [pickerStep, setPickerStep] = useState(null);
    const [pickerTemplates, setPickerTemplates] = useState([]);
    const [pickerLoadingTmpl, setPickerLoadingTmpl] = useState(false);
    const [pickerTemplate, setPickerTemplate] = useState(null);
    const [pickerSubtitles, setPickerSubtitles] = useState([]);
    const [pickerLoadingSubtitles, setPickerLoadingSubtitles] = useState(false);
    const [pickerSubtitle, setPickerSubtitle] = useState(null);
    const [pickerSection, setPickerSection] = useState(null);
    const [pickerEmail, setPickerEmail] = useState('');

    const openPicker = () => {
        setPickerStep('template');
        if (pickerTemplates.length === 0) {
            setPickerLoadingTmpl(true);
            api.get('/templates')
                .then(r => setPickerTemplates(r.data || []))
                .catch(() => toast.error('Şablonlar yüklənmədi'))
                .finally(() => setPickerLoadingTmpl(false));
        }
    };

    const handlePickTemplate = (tmpl) => {
        setPickerTemplate(tmpl);
        setPickerSubtitle(null);
        setPickerSubtitles([]);
        setPickerLoadingSubtitles(true);
        api.get(`/templates/${tmpl.id}/subtitles`)
            .then(r => setPickerSubtitles(r.data || []))
            .catch(() => toast.error('Alt başlıqlar yüklənmədi'))
            .finally(() => setPickerLoadingSubtitles(false));
        setPickerStep('subtitle');
    };

    const handlePickSubtitle = (sub) => { setPickerSubtitle(sub); setPickerStep('section'); };
    const handlePickSection  = (sec) => { setPickerSection(sec); setPickerEmail(''); setPickerStep('email'); };

    const handleConfirmSection = () => {
        if (!pickerEmail.trim()) { toast.error('Müəllim email-i daxil edin'); return; }
        setAssignments(prev => [...prev, {
            kind: 'template',
            templateId: pickerTemplate.id,
            templateTitle: pickerTemplate.title,
            sectionId: pickerSection.id,
            subjectName: pickerSection.subjectName,
            questionCount: pickerSection.questionCount,
            email: pickerEmail.trim(),
        }]);
        setPickerStep(null);
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!title.trim()) { toast.error('İmtahan adı boş ola bilməz'); return; }
        if (assignments.length === 0) {
            toast.error('Ən az bir müəllim təyin edin (sərbəst və ya şablon bölməsi)');
            return;
        }

        // Group rows by email → one collaborator per teacher with their (possibly mixed)
        // subjects + section ids.
        const byEmail = {};
        for (const a of assignments) {
            const entry = byEmail[a.email] || { subjects: new Set(), sectionIds: new Set() };
            if (a.kind === 'free') a.subjects.forEach(s => entry.subjects.add(s));
            else entry.sectionIds.add(a.sectionId);
            byEmail[a.email] = entry;
        }
        const collaborators = Object.entries(byEmail).map(([email, v]) => ({
            teacherEmail: email,
            subjects: Array.from(v.subjects),
            templateSectionIds: Array.from(v.sectionIds),
        }));

        setLoading(true);
        try {
            const data = await createCollabExam.mutateAsync({
                title: title.trim(),
                description: description.trim() || null,
                durationMinutes: parseInt(duration) || null,
                // examType/templateId are ignored by the backend now but kept for
                // backwards compatibility with older deployments.
                examType: 'FREE',
                templateId: null,
                collaborators,
            });
            toast.success('Birgə imtahan yaradıldı');
            onCreated(data); onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    // ── Render: assignment row ───────────────────────────────────────────────
    const renderAssignment = (a, i) => {
        const isTemplate = a.kind === 'template';
        return (
            <div key={i}
                 className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border ${
                     isTemplate
                         ? 'bg-emerald-50/60 border-emerald-100'
                         : 'bg-blue-50/60 border-blue-100'
                 }`}>
                {isTemplate
                    ? <HiOutlineTemplate className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <HiOutlineBookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {isTemplate ? (
                            <span className="text-xs font-bold text-emerald-800">{a.subjectName}</span>
                        ) : (
                            a.subjects.map(s => (
                                <span key={s}
                                      className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">
                                    {s}
                                </span>
                            ))
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isTemplate ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'
                        }`}>
                            {isTemplate ? 'ŞABLON' : `SƏRBƏST${a.subjects.length > 1 ? ` · ${a.subjects.length}` : ''}`}
                        </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isTemplate ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {isTemplate && `${a.questionCount} sual · ${a.templateTitle} · `}{a.email}
                    </p>
                </div>
                <button
                    onClick={() => removeAssignment(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Sil"
                >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    };

    // ── Render: picker overlay (template flow) ───────────────────────────────
    const renderPicker = () => {
        if (!pickerStep) return null;
        const pickerTitle = pickerStep === 'template' ? 'Şablon seçin'
            : pickerStep === 'subtitle' ? 'Alt başlıq seçin'
            : pickerStep === 'section'  ? 'Fənn bölməsi seçin'
            : 'Müəllim email-i';
        const goBack = () => {
            if (pickerStep === 'template')      setPickerStep(null);
            else if (pickerStep === 'subtitle') setPickerStep('template');
            else if (pickerStep === 'section')  setPickerStep('subtitle');
            else if (pickerStep === 'email')    setPickerStep('section');
        };
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                        <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <h3 className="font-bold text-gray-900 text-base flex-1">{pickerTitle}</h3>
                        <button onClick={() => setPickerStep(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineX className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {pickerStep === 'template' && (
                            pickerLoadingTmpl ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                                </div>
                            ) : pickerTemplates.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Şablon tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {pickerTemplates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handlePickTemplate(t)}
                                            className="w-full text-left p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <HiOutlineTemplate className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{t.title}</p>
                                                    <p className="text-xs text-gray-400">{t.subtitleCount} alt başlıq</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}

                        {pickerStep === 'subtitle' && (
                            pickerLoadingSubtitles ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                                </div>
                            ) : pickerSubtitles.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Alt başlıq tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {pickerSubtitles.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handlePickSubtitle(s)}
                                            className="w-full text-left p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                                        >
                                            <p className="font-bold text-gray-900 text-sm">{s.subtitle}</p>
                                            <p className="text-xs text-gray-400">{(s.sections || []).length} fənn</p>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}

                        {pickerStep === 'section' && (
                            (pickerSubtitle?.sections || []).length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Fənn tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {(pickerSubtitle?.sections || []).map(sec => {
                                        const alreadyAdded = assignments.some(a =>
                                            a.kind === 'template' && a.sectionId === sec.id);
                                        return (
                                            <button
                                                key={sec.id}
                                                onClick={() => !alreadyAdded && handlePickSection(sec)}
                                                disabled={alreadyAdded}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                    alreadyAdded
                                                        ? 'border-green-200 bg-green-50 opacity-60 cursor-default'
                                                        : 'border-blue-100 hover:border-blue-500 hover:bg-blue-50/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <HiOutlineBookOpen className="w-4 h-4 text-blue-500" />
                                                        <span className="font-bold text-gray-900 text-sm">{sec.subjectName}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-blue-600">{sec.questionCount} sual</span>
                                                </div>
                                                {alreadyAdded && (
                                                    <p className="text-[11px] text-green-600 mt-1 font-semibold">✓ Artıq əlavə edilib</p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {pickerStep === 'email' && pickerSection && (
                            <div className="space-y-4">
                                <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-emerald-900 text-sm">{pickerSection.subjectName}</p>
                                        <p className="text-xs text-emerald-500">{pickerSection.questionCount} sual · {pickerTemplate?.title}</p>
                                    </div>
                                    <HiOutlineTemplate className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Müəllim *</label>
                                    <TeacherPicker
                                        value={pickerEmail}
                                        onChange={(email) => setPickerEmail(email)}
                                        onEnter={handleConfirmSection}
                                        autoFocus
                                        placeholder="Müəllim axtarın…"
                                    />
                                </div>
                                <button
                                    onClick={handleConfirmSection}
                                    disabled={!pickerEmail.trim()}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    Əlavə et
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Main render ──────────────────────────────────────────────────────────
    const freeCount = assignments.filter(a => a.kind === 'free').length;
    const tmplCount = assignments.filter(a => a.kind === 'template').length;
    const isHybrid = freeCount > 0 && tmplCount > 0;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Yeni Birgə İmtahan</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">İmtahan adı *</label>
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                                placeholder="Birgə imtahan adı"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Açıqlama</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)} rows={2}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
                                placeholder="İxtiyari açıqlama"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Müddət (dəqiqə)</label>
                            <input
                                type="number" value={duration} onChange={e => setDuration(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* ── Unified assignments list ── */}
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <label className="block text-xs font-semibold text-gray-600">
                                    Müəllim təyinatları *
                                </label>
                                {assignments.length > 0 && (
                                    <span className="text-[11px] text-gray-400 font-mono">
                                        {tmplCount} şablon · {freeCount} sərbəst
                                        {isHybrid && <span className="ml-1.5 text-emerald-600 font-bold">· HİBRİD</span>}
                                    </span>
                                )}
                            </div>

                            {assignments.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
                                    <p className="text-sm text-gray-400">Hələ təyinat yoxdur</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Sərbəst fənn və ya şablon bölməsi əlavə edin</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assignments.map((a, i) => renderAssignment(a, i))}
                                </div>
                            )}
                        </div>

                        {/* ── Add a free assignment (multi-subject for one teacher) ── */}
                        <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                <HiOutlineBookOpen className="w-3.5 h-3.5" /> Sərbəst fənn təyin et
                                <span className="text-[10px] text-blue-500/70 normal-case tracking-normal font-medium">
                                    · bir müəllimə birdən çox fənn ver
                                </span>
                            </p>

                            {/* Selected subject chips */}
                            {freeDraft.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {freeDraft.subjects.map(s => (
                                        <span key={s}
                                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                                            {s}
                                            <button
                                                onClick={() => removeSubjectFromDraft(s)}
                                                className="hover:text-red-600"
                                                title="Sil"
                                            >
                                                <HiOutlineX className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-start">
                                <select
                                    value=""
                                    onChange={e => { addSubjectToDraft(e.target.value); }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white h-[38px]"
                                >
                                    <option value="">+ Fənn əlavə et…</option>
                                    {subjects
                                        .filter(s => !freeDraft.subjects.includes(s))
                                        .map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <TeacherPicker
                                    value={freeDraft.email}
                                    onChange={(email) => setFreeDraft(d => ({ ...d, email }))}
                                    onEnter={addFreeAssignment}
                                    placeholder="Müəllim axtarın…"
                                />
                                <button
                                    onClick={addFreeAssignment}
                                    disabled={freeDraft.subjects.length === 0 || !freeDraft.email.trim()}
                                    className="px-3 py-2 h-[38px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <HiOutlinePlus className="w-3.5 h-3.5" /> Əlavə
                                </button>
                            </div>
                        </div>

                        {/* ── Add a template-section row via picker ── */}
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5 flex items-center gap-1.5">
                                    <HiOutlineTemplate className="w-3.5 h-3.5" /> Şablon bölməsi təyin et
                                </p>
                                <p className="text-[11px] text-emerald-500/80 truncate">Şablon → alt başlıq → fənn → müəllim email-i</p>
                            </div>
                            <button
                                onClick={openPicker}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                            >
                                <HiOutlinePlus className="w-3.5 h-3.5" /> Bölmə
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Ləğv et
                            </button>
                            <button
                                onClick={handleSubmit} disabled={loading || assignments.length === 0}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                                {loading ? 'Yaradılır...' : 'Yarat'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {renderPicker()}
        </>
    );
};

export default CreateModal;
