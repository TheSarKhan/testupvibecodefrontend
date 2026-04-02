import { useState, useEffect } from 'react';
import {
    HiOutlineUserGroup, HiOutlinePlus, HiOutlineX, HiOutlineCheck,
    HiOutlineExclamationCircle, HiOutlineEye, HiOutlineDocumentText,
    HiOutlineClock, HiOutlineRefresh, HiOutlinePencilAlt,
    HiOutlineArrowLeft, HiOutlineBookOpen, HiOutlineTemplate,
    HiOutlineTrash,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
    ASSIGNED:  { label: 'Gözləyir',        color: 'text-blue-600 bg-blue-50 border-blue-200' },
    SUBMITTED: { label: 'Göndərildi',       color: 'text-amber-600 bg-amber-50 border-amber-200' },
    APPROVED:  { label: 'Təsdiqləndi',      color: 'text-green-600 bg-green-50 border-green-200' },
    REJECTED:  { label: 'Geri qaytarıldı',  color: 'text-red-600 bg-red-50 border-red-200' },
};

// ── Create Modal ─────────────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(90);
    const [examType, setExamType] = useState('FREE');
    const [loading, setLoading] = useState(false);

    // Subjects for free mode (from /subjects API)
    const [subjects, setSubjects] = useState([]);
    useEffect(() => {
        api.get('/subjects').then(r => setSubjects(r.data || [])).catch(() => {});
    }, []);

    // Free mode: rows of {subject, email}
    const [freeRows, setFreeRows] = useState([{ subject: '', email: '' }]);
    const addFreeRow = () => setFreeRows(prev => [...prev, { subject: '', email: '' }]);
    const removeFreeRow = (i) => setFreeRows(prev => prev.filter((_, idx) => idx !== i));
    const updateFreeRow = (i, field, val) =>
        setFreeRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

    // Template mode: list of assigned {sectionId, subjectName, questionCount, templateId, email}
    const [tmplAssignments, setTmplAssignments] = useState([]);
    const [tmplId, setTmplId] = useState(null); // locked after first section added

    // Template picker sub-state: null | 'template' | 'subtitle' | 'section' | 'email'
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
        // If already have assignments for another template, lock
        if (tmplId && tmplId !== tmpl.id) {
            toast.error('Artıq başqa şablondan bölmə əlavə edilib. Sıfırlamaq üçün mövcud bölmələri silin.');
            return;
        }
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

    const handlePickSubtitle = (sub) => {
        setPickerSubtitle(sub);
        setPickerStep('section');
    };

    const handlePickSection = (sec) => {
        setPickerSection(sec);
        setPickerEmail('');
        setPickerStep('email');
    };

    const handleConfirmSection = () => {
        if (!pickerEmail.trim()) { toast.error('Müəllim email-i daxil edin'); return; }
        setTmplAssignments(prev => [...prev, {
            sectionId: pickerSection.id,
            subjectName: pickerSection.subjectName,
            questionCount: pickerSection.questionCount,
            templateId: pickerTemplate.id,
            email: pickerEmail.trim(),
        }]);
        setTmplId(pickerTemplate.id);
        setPickerStep(null);
    };

    const removeTmplRow = (i) => {
        const next = tmplAssignments.filter((_, idx) => idx !== i);
        setTmplAssignments(next);
        if (next.length === 0) setTmplId(null);
    };

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error('İmtahan adı boş ola bilməz'); return; }

        let mapped = [];
        if (examType === 'FREE') {
            const valid = freeRows.filter(r => r.subject && r.email.trim());
            if (valid.length === 0) { toast.error('Ən az bir fənn və müəllim email-i daxil edin'); return; }
            // Group subjects by email
            const byEmail = {};
            for (const r of valid) {
                const e = r.email.trim();
                if (!byEmail[e]) byEmail[e] = [];
                if (!byEmail[e].includes(r.subject)) byEmail[e].push(r.subject);
            }
            mapped = Object.entries(byEmail).map(([email, subs]) => ({
                teacherEmail: email,
                subjects: subs,
                templateSectionIds: [],
            }));
        } else {
            if (tmplAssignments.length === 0) { toast.error('Ən az bir şablon bölməsi əlavə edin'); return; }
            const byEmail = {};
            for (const a of tmplAssignments) {
                if (!byEmail[a.email]) byEmail[a.email] = [];
                byEmail[a.email].push(a.sectionId);
            }
            mapped = Object.entries(byEmail).map(([email, ids]) => ({
                teacherEmail: email,
                subjects: [],
                templateSectionIds: ids,
            }));
        }

        setLoading(true);
        try {
            const { data } = await api.post('/admin/collaborative-exams', {
                title: title.trim(),
                description: description.trim() || null,
                durationMinutes: parseInt(duration) || null,
                examType,
                templateId: examType === 'TEMPLATE' ? (tmplId || null) : null,
                collaborators: mapped,
            });
            toast.success('Birgə imtahan yaradıldı');
            onCreated(data);
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    // ── Picker overlay (template cascade) ────────────────────────────────────
    const renderPicker = () => {
        if (!pickerStep) return null;

        const pickerTitle = pickerStep === 'template' ? 'Şablon seçin'
            : pickerStep === 'subtitle' ? 'Alt başlıq seçin'
            : pickerStep === 'section' ? 'Fənn bölməsi seçin'
            : 'Müəllim email-i';

        const goBack = () => {
            if (pickerStep === 'template') { setPickerStep(null); }
            else if (pickerStep === 'subtitle') { setPickerStep('template'); }
            else if (pickerStep === 'section') { setPickerStep('subtitle'); }
            else if (pickerStep === 'email') { setPickerStep('section'); }
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
                        {/* Template list */}
                        {pickerStep === 'template' && (
                            pickerLoadingTmpl ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                                </div>
                            ) : pickerTemplates.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Şablon tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {pickerTemplates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handlePickTemplate(t)}
                                            disabled={tmplId && tmplId !== t.id}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                tmplId && tmplId !== t.id
                                                    ? 'border-gray-100 opacity-40 cursor-not-allowed'
                                                    : 'border-purple-100 hover:border-purple-400 hover:bg-purple-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <HiOutlineTemplate className="w-5 h-5 text-purple-400 shrink-0" />
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

                        {/* Subtitle list */}
                        {pickerStep === 'subtitle' && (
                            pickerLoadingSubtitles ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                                </div>
                            ) : pickerSubtitles.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Alt başlıq tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {pickerSubtitles.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handlePickSubtitle(s)}
                                            className="w-full text-left p-4 rounded-xl border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                                        >
                                            <p className="font-bold text-gray-900 text-sm">{s.subtitle}</p>
                                            <p className="text-xs text-gray-400">{(s.sections || []).length} fənn</p>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}

                        {/* Section list */}
                        {pickerStep === 'section' && (
                            (pickerSubtitle?.sections || []).length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Fənn tapılmadı</p>
                            ) : (
                                <div className="space-y-2">
                                    {(pickerSubtitle?.sections || []).map(sec => {
                                        const alreadyAdded = tmplAssignments.some(a => a.sectionId === sec.id);
                                        return (
                                            <button
                                                key={sec.id}
                                                onClick={() => !alreadyAdded && handlePickSection(sec)}
                                                disabled={alreadyAdded}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                    alreadyAdded
                                                        ? 'border-green-200 bg-green-50 opacity-60 cursor-default'
                                                        : 'border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <HiOutlineBookOpen className="w-4 h-4 text-indigo-500" />
                                                        <span className="font-bold text-gray-900 text-sm">{sec.subjectName}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-indigo-600">{sec.questionCount} sual</span>
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

                        {/* Email input */}
                        {pickerStep === 'email' && pickerSection && (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-indigo-900 text-sm">{pickerSection.subjectName}</p>
                                        <p className="text-xs text-indigo-500">{pickerSection.questionCount} sual · {pickerTemplate?.title}</p>
                                    </div>
                                    <HiOutlineBookOpen className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Müəllim email-i *</label>
                                    <input
                                        autoFocus
                                        value={pickerEmail}
                                        onChange={e => setPickerEmail(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleConfirmSection()}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                                        placeholder="müəllim@email.com"
                                    />
                                </div>
                                <button
                                    onClick={handleConfirmSection}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
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
                        {/* Basic info */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">İmtahan adı *</label>
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                                placeholder="Birgə imtahan adı"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Açıqlama</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)} rows={2}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 resize-none"
                                placeholder="İxtiyari açıqlama"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Müddət (dəqiqə)</label>
                            <input
                                type="number" value={duration} onChange={e => setDuration(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                            />
                        </div>

                        {/* Exam type toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">İmtahan növü</label>
                            <div className="flex gap-2">
                                {[{ val: 'FREE', label: 'Sərbəst' }, { val: 'TEMPLATE', label: 'Şablonlu' }].map(({ val, label }) => (
                                    <button
                                        key={val}
                                        onClick={() => setExamType(val)}
                                        className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${examType === val
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FREE mode: subject + email rows */}
                        {examType === 'FREE' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Müəllimlər və fənnləri seç *</label>
                                <div className="space-y-2">
                                    {freeRows.map((row, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <select
                                                value={row.subject}
                                                onChange={e => updateFreeRow(i, 'subject', e.target.value)}
                                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
                                            >
                                                <option value="">— Fənn seçin —</option>
                                                {subjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <input
                                                value={row.email}
                                                onChange={e => updateFreeRow(i, 'email', e.target.value)}
                                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                                                placeholder="müəllim@email.com"
                                            />
                                            <button
                                                onClick={() => removeFreeRow(i)}
                                                disabled={freeRows.length === 1}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 rounded-lg transition-colors"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addFreeRow} className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                                    <HiOutlinePlus className="w-3.5 h-3.5" /> Yeni fənn əlavə et
                                </button>
                            </div>
                        )}

                        {/* TEMPLATE mode: assignment list + add button */}
                        {examType === 'TEMPLATE' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Şablon bölmələri *</label>
                                {tmplAssignments.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                                        <p className="text-sm text-gray-400">Hələ bölmə əlavə edilməyib</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-2">
                                        {tmplAssignments.map((a, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
                                                <HiOutlineBookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-indigo-800 truncate">{a.subjectName}</p>
                                                    <p className="text-[11px] text-indigo-500">{a.questionCount} sual · {a.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeTmplRow(i)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={openPicker}
                                    className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 font-semibold hover:text-purple-700"
                                >
                                    <HiOutlinePlus className="w-3.5 h-3.5" /> Bölmə əlavə et
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                Ləğv et
                            </button>
                            <button
                                onClick={handleSubmit} disabled={loading}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
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

// ── Review Modal (view draft questions + approve/reject) ──────────────────────
const ReviewModal = ({ collaborator, onClose, onAction }) => {
    const [draftQuestions, setDraftQuestions] = useState([]);
    const [loadingQ, setLoadingQ] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [actioning, setActioning] = useState(false);

    useEffect(() => {
        if (collaborator.draftExamId) {
            setLoadingQ(true);
            api.get(`/exams/${collaborator.draftExamId}/details`)
                .then(r => setDraftQuestions(r.data.questions || []))
                .catch(() => {})
                .finally(() => setLoadingQ(false));
        }
    }, [collaborator.draftExamId]);

    const handleApprove = async () => {
        setActioning(true);
        try {
            await api.post(`/admin/collaborators/${collaborator.id}/approve`);
            toast.success('Suallar təsdiqləndi və əsl imtahana əlavə edildi');
            onAction();
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setActioning(false);
        }
    };

    const handleReject = async () => {
        setActioning(true);
        try {
            await api.post(`/admin/collaborators/${collaborator.id}/reject`, { comment: rejectComment });
            toast.success('Suallar geri qaytarıldı');
            onAction();
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setActioning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{collaborator.teacherName} — Suallar</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Fənnlər: {(collaborator.subjects || []).join(', ')}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {loadingQ ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : draftQuestions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sual tapılmadı</p>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {draftQuestions.map((q, i) => (
                                <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">{i + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 font-medium leading-snug">{q.content || '(mətn yoxdur)'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{q.questionType}</span>
                                                {q.subjectGroup && <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{q.subjectGroup}</span>}
                                                <span className="text-[11px] font-semibold text-gray-500">{q.points} xal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showRejectForm ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Geri qaytar
                            </button>
                            <button
                                onClick={handleApprove} disabled={actioning || draftQuestions.length === 0}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <HiOutlineCheck className="w-4 h-4" />
                                {actioning ? 'Gözləyin...' : 'Təsdiqlə'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none"
                                placeholder="Müəllimə şərh (ixtiyari)"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowRejectForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Ləğv et
                                </button>
                                <button
                                    onClick={handleReject} disabled={actioning}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    {actioning ? 'Gözləyin...' : 'Geri qaytar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminCollaborativeExams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [reviewing, setReviewing] = useState(null); // collaborator being reviewed

    const fetchExams = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/collaborative-exams?size=50');
            setExams(data.content || []);
        } catch {
            toast.error('Yüklənmə xətası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExams(); }, []);

    const handleCreated = (newExam) => {
        setExams(prev => [newExam, ...prev]);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Birgə İmtahanlar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Müəllimlərlə birgə hazırlanan imtahanları idarə edin</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchExams} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Yenilə">
                        <HiOutlineRefresh className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Yeni Birgə İmtahan
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiOutlineUserGroup className="w-7 h-7 text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-gray-900">Hələ birgə imtahan yoxdur</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Müəllimlərlə birgə imtahan yaratmaq üçün "Yeni Birgə İmtahan" düyməsini basın.</p>
                    <button onClick={() => setShowCreate(true)} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                        İlk imtahanı yarat
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {exams.map(exam => (
                        <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Exam header */}
                            <div className="p-5 border-b border-gray-50 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base">{exam.title}</h2>
                                    {exam.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{exam.description}</p>}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        {exam.durationMinutes && (
                                            <span className="flex items-center gap-1">
                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                {exam.durationMinutes} dəq
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <HiOutlineDocumentText className="w-3.5 h-3.5" />
                                            {exam.totalQuestions} sual
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[exam.status]?.color || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                        {STATUS_CONFIG[exam.status]?.label || exam.status}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                                        title="Bu imtahana sual əlavə et"
                                    >
                                        <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                                        Sual əlavə et
                                    </button>
                                </div>
                            </div>

                            {/* Collaborators */}
                            {exam.collaborators?.length > 0 && (
                                <div className="p-5">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Müəllimlər</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {exam.collaborators.map(c => {
                                            const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.ASSIGNED;
                                            return (
                                                <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                                        {c.teacherName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 truncate">{c.teacherName}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{(c.subjects || []).join(', ') || '—'}</p>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                                            {c.draftQuestionCount > 0 && (
                                                                <span className="text-[10px] text-gray-400">{c.draftQuestionCount} sual</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {c.status === 'SUBMITTED' && (
                                                        <button
                                                            onClick={() => setReviewing(c)}
                                                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors shrink-0"
                                                            title="Sualları bax"
                                                        >
                                                            <HiOutlineEye className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {c.status === 'REJECTED' && c.adminComment && (
                                                        <div title={c.adminComment} className="p-1.5 text-red-400 shrink-0">
                                                            <HiOutlineExclamationCircle className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
            )}

            {reviewing && (
                <ReviewModal
                    collaborator={reviewing}
                    onClose={() => setReviewing(null)}
                    onAction={fetchExams}
                />
            )}
        </div>
    );
};

export default AdminCollaborativeExams;
