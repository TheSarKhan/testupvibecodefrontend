import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt,
    HiOutlineChevronRight, HiOutlineTemplate, HiOutlineCheck, HiOutlineX,
    HiOutlineSearch, HiOutlineDuplicate, HiOutlineTrendingUp,
    HiOutlineDocumentText, HiOutlineClock, HiOutlineStar, HiOutlineChevronDown,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
    useAdminTemplates,
    useAdminSubtitles,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
    useCloneTemplate,
    useTemplateStats,
    useCreateSubtitle,
    useDeleteSubtitle,
    useCreateSection,
    useDeleteSection,
} from '../../hooks/admin/useAdminTemplates';
import Pagination from '../../components/admin/Pagination';
import SectionForm from './templates/SectionForm';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { fmtDate } from '../../utils/date';

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        teal: 'bg-teal-50 text-teal-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-extrabold text-gray-900 tabular-nums mt-0.5 truncate">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
                </div>
            </div>
        </div>
    );
};

// ── Inline create/edit form ──────────────────────────────────────────────────
const TemplateForm = ({ initial, onSave, onCancel, saving }) => {
    const [title, setTitle] = useState(initial?.title || '');
    const handleSubmit = () => {
        if (!title.trim()) { toast.error('Başlıq daxil edin'); return; }
        onSave({ title: title.trim() });
    };
    return (
        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    {initial ? 'Redaktə' : 'Yeni şablon'}
                </p>
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
                    placeholder="Şablon adı"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
            </div>
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white">
                    Ləğv
                </button>
                <button onClick={handleSubmit} disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-60">
                    {saving ? '...' : (initial ? 'Yenilə' : 'Yarat')}
                </button>
            </div>
        </div>
    );
};

// ── Section form modal shell ─────────────────────────────────────────────────
const SectionModal = ({ subtitleName, subjects, onSave, onClose, saving }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Sticky header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-900">Yeni fənn bölməsi</h2>
                        {subtitleName && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                Altbaşlıq: <span className="font-semibold text-gray-700">{subtitleName}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Bağla (Esc)"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form fills remaining space */}
                <div className="flex-1 overflow-hidden">
                    <SectionForm
                        subjects={subjects}
                        onSave={onSave}
                        onCancel={onClose}
                        saving={saving}
                    />
                </div>
            </div>
        </div>
    );
};

// ── Single subtitle row (collapsible accordion with sections) ───────────────
const SubtitleAccordion = ({ subtitle, templateId, navigate, onAddSection }) => {
    const [open, setOpen] = useState(false);
    const deleteSection = useDeleteSection();
    const deleteSubtitleMut = useDeleteSubtitle();

    const sections = subtitle.sections || [];
    const subTotal = sections.reduce((s, sec) => s + (sec.questionCount || 0), 0);

    const handleDeleteSubtitle = async () => {
        if (!window.confirm(`"${subtitle.subtitle}" altbaşlığını silmək istəyirsiniz?`)) return;
        try {
            await deleteSubtitleMut.mutateAsync(subtitle.id);
            toast.success('Altbaşlıq silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleDeleteSection = async (sec) => {
        if (!window.confirm(`"${sec.subjectName}" fənnini silmək istəyirsiniz?`)) return;
        try {
            await deleteSection.mutateAsync(sec.id);
            toast.success('Fənn silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div
                onClick={() => setOpen(!open)}
                className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/80 transition-colors group"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    <p className="text-sm font-bold text-gray-800 truncate">{subtitle.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">{sections.length} fənn · {subTotal} sual</span>
                    <button
                        onClick={e => { e.stopPropagation(); handleDeleteSubtitle(); }}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Altbaşlığı sil"
                    >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {open && (
                <>
                    {sections.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-gray-400">Fənn yoxdur</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {sections.map(sec => (
                                <div key={sec.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-100/60 group">
                                    <span className="text-sm text-gray-700">{sec.subjectName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-blue-700">{sec.questionCount} sual</span>
                                        <button
                                            onClick={() => navigate(`/admin/sablonlar/${templateId}/${subtitle.id}`)}
                                            className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Redaktə"
                                        >
                                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection(sec)}
                                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Sil"
                                        >
                                            <HiOutlineTrash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => onAddSection(subtitle.id)}
                        className="w-full px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <HiOutlinePlus className="w-3.5 h-3.5" /> Fənn əlavə et
                    </button>
                </>
            )}
        </div>
    );
};

// ── Inline subtitle add form ─────────────────────────────────────────────────
const SubtitleQuickAdd = ({ templateId, onDone }) => {
    const [name, setName] = useState('');
    const createSubtitle = useCreateSubtitle();

    const submit = async () => {
        if (!name.trim()) { toast.error('Altbaşlıq adı daxil edin'); return; }
        try {
            await createSubtitle.mutateAsync({ templateId, subtitle: { subtitle: name.trim() } });
            setName('');
            toast.success('Altbaşlıq əlavə edildi');
            onDone();
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone(); }}
                placeholder="Altbaşlıq adı..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
            />
            <button onClick={submit} disabled={createSubtitle.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-60">
                {createSubtitle.isPending ? '...' : 'Əlavə et'}
            </button>
            <button onClick={onDone} className="p-2 text-gray-400 hover:bg-white rounded-lg">
                <HiOutlineX className="w-4 h-4" />
            </button>
        </div>
    );
};

// ── Detail panel for selected template ───────────────────────────────────────
const TemplateDetailPanel = ({ template, navigate }) => {
    const [addingSubtitle, setAddingSubtitle] = useState(false);
    const [sectionModalSubtitleId, setSectionModalSubtitleId] = useState(null);

    const { data, isLoading } = useAdminSubtitles(template?.id, { page: 0, size: 100 });
    const subtitles = data?.content ?? [];
    const totalQuestions = subtitles.reduce(
        (sum, sub) => sum + (sub.sections || []).reduce((s, sec) => s + (sec.questionCount || 0), 0),
        0
    );

    // Subjects list for SectionForm dropdown
    const { data: subjectsList = [] } = useQuery({
        queryKey: ['public', 'subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data),
        enabled: !!sectionModalSubtitleId,
    });

    const createSection = useCreateSection();

    const handleSaveSection = async (formData) => {
        const payload = {
            subjectName: formData.subjectName,
            formula: formData.formula,
            typeCounts: formData.typeCounts,
            pointGroups: formData.pointGroups,
            maxScore: formData.maxScore,
            allowCustomPoints: formData.allowCustomPoints,
        };
        try {
            await createSection.mutateAsync({ subtitleId: sectionModalSubtitleId, section: payload });
            setSectionModalSubtitleId(null);
            toast.success('Fənn əlavə edildi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    // Reset add forms when switching template
    useEffect(() => {
        setAddingSubtitle(false);
        setSectionModalSubtitleId(null);
    }, [template?.id]);

    if (!template) {
        return (
            <div className="flex-1 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 text-center">
                <HiOutlineTemplate className="w-12 h-12 text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700">Şablon seçin</p>
                <p className="text-sm text-gray-400 mt-1">Soldan bir şablon seçərək strukturunu görün</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{template.title}</h2>
                        {template.examCount > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                {template.examCount} imtahanda
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {subtitles.length} altbaşlıq · {totalQuestions} sual cəmi
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/admin/sablonlar/${template.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                    Tam redaktə <HiOutlineChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {addingSubtitle ? (
                    <SubtitleQuickAdd templateId={template.id} onDone={() => setAddingSubtitle(false)} />
                ) : (
                    <button
                        onClick={() => setAddingSubtitle(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 text-blue-600 text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Yeni altbaşlıq əlavə et
                    </button>
                )}

                {isLoading ? (
                    <p className="text-sm text-gray-400 text-center py-10">Yüklənir...</p>
                ) : subtitles.length === 0 && !addingSubtitle ? (
                    <p className="text-sm text-gray-400 text-center py-6">Hələ altbaşlıq yoxdur</p>
                ) : (
                    subtitles.map(sub => (
                        <SubtitleAccordion
                            key={sub.id}
                            subtitle={sub}
                            templateId={template.id}
                            navigate={navigate}
                            onAddSection={(subId) => setSectionModalSubtitleId(subId)}
                        />
                    ))
                )}
            </div>

            {/* Section form modal */}
            {sectionModalSubtitleId && (
                <SectionModal
                    subtitleName={subtitles.find(s => s.id === sectionModalSubtitleId)?.subtitle}
                    subjects={subjectsList}
                    onSave={handleSaveSection}
                    onClose={() => setSectionModalSubtitleId(null)}
                    saving={createSection.isPending}
                />
            )}
        </div>
    );
};

// ── Main page ────────────────────────────────────────────────────────────────
const AdminTemplates = () => {
    const navigate = useNavigate();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { data, isLoading: loading, error } = useAdminTemplates({ page, size: 12, search });
    const templates = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;

    const { data: stats } = useTemplateStats();

    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const deleteTemplate = useDeleteTemplate();
    const cloneTemplate = useCloneTemplate();
    const saving = createTemplate.isPending || updateTemplate.isPending;

    if (error) toast.error('Şablonlar yüklənmədi');

    // Auto-select first template when list loads
    useEffect(() => {
        if (templates.length > 0 && !templates.find(t => t.id === selectedId)) {
            setSelectedId(templates[0].id);
        }
    }, [templates, selectedId]);

    const selectedTemplate = templates.find(t => t.id === selectedId) || null;

    const handleCreate = async ({ title }) => {
        try {
            const created = await createTemplate.mutateAsync({ title });
            setShowCreateForm(false);
            setSelectedId(created.id);
            toast.success('Şablon yaradıldı');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleUpdate = async (id, { title }) => {
        try {
            await updateTemplate.mutateAsync({ id, template: { title } });
            setEditingId(null);
            toast.success('Yeniləndi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleDelete = async (id, title, examCount) => {
        const warn = examCount > 0 ? `\n\nDİQQƏT: Bu şablon ${examCount} imtahanda istifadə olunur.` : '';
        if (!window.confirm(`"${title}" şablonunu silmək istədiyinizə əminsiniz?${warn}`)) return;
        try {
            await deleteTemplate.mutateAsync(id);
            if (selectedId === id) setSelectedId(null);
            toast.success('Şablon silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleClone = async (id, title) => {
        try {
            const cloned = await cloneTemplate.mutateAsync(id);
            setSelectedId(cloned.id);
            toast.success(`"${cloned.title}" yaradıldı`);
        } catch { toast.error(`"${title}" kopyalanmadı`); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">İmtahan Şablonları</h1>
                    <p className="text-gray-500 mt-1 text-sm">Şablon yaradın və üzərində işləyin — soldan seçin, sağda strukturunu görün</p>
                </div>
                {!showCreateForm && (
                    <button
                        onClick={() => { setShowCreateForm(true); setEditingId(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Yeni Şablon
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={HiOutlineTemplate}
                    label="Cəmi şablonlar"
                    value={stats?.totalTemplates ?? '—'}
                    color="blue"
                />
                <StatCard
                    icon={HiOutlineDocumentText}
                    label="İmtahanlarda istifadə"
                    value={stats?.totalExamUsage ?? '—'}
                    sub="cəmi imtahan"
                    color="emerald"
                />
                <StatCard
                    icon={HiOutlineStar}
                    label="Ən populyar"
                    value={stats?.topTemplate?.title ?? '—'}
                    sub={stats?.topTemplate ? `${stats.topTemplate.examCount} imtahan` : null}
                    color="amber"
                />
                <StatCard
                    icon={HiOutlineClock}
                    label="Ən yeni"
                    value={stats?.mostRecent?.title ?? '—'}
                    sub={stats?.mostRecent?.createdAt
                        ? fmtDate(stats.mostRecent.createdAt)
                        : null}
                    color="teal"
                />
            </div>

            {/* Master-detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-[600px]">
                {/* Left: template list */}
                <div className="lg:col-span-1 flex flex-col gap-3">
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Şablon adı ilə axtar..."
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
                        />
                        {searchInput && (
                            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {showCreateForm && (
                        <TemplateForm
                            onSave={handleCreate}
                            onCancel={() => setShowCreateForm(false)}
                            saving={saving}
                        />
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                        {loading && templates.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 px-4">
                                <HiOutlineTemplate className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{search ? 'Tapılmadı' : 'Şablon yoxdur'}</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50 flex-1">
                                {templates.map(t => {
                                    const isSelected = t.id === selectedId;
                                    return (
                                        <li key={t.id}>
                                            {editingId === t.id ? (
                                                <div className="p-2">
                                                    <TemplateForm
                                                        initial={{ title: t.title }}
                                                        onSave={(d) => handleUpdate(t.id, d)}
                                                        onCancel={() => setEditingId(null)}
                                                        saving={saving}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => setSelectedId(t.id)}
                                                    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-100 border-l-4 border-transparent'}`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{t.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                                            <span>{t.subtitleCount} altbaşlıq</span>
                                                            {t.examCount > 0 && (
                                                                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                                                    <HiOutlineTrendingUp className="w-3 h-3" />{t.examCount}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleClone(t.id, t.title); }}
                                                            disabled={cloneTemplate.isPending}
                                                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                            title="Kopyala"
                                                        >
                                                            <HiOutlineDuplicate className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setEditingId(t.id); }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Redaktə"
                                                        >
                                                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleDelete(t.id, t.title, t.examCount); }}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                            title="Sil"
                                                        >
                                                            <HiOutlineTrash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {templates.length > 0 && (
                            <div className="px-3 pb-3 border-t border-gray-50 pt-2">
                                <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} maxButtons={3} compact />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: detail */}
                <div className="lg:col-span-2 flex">
                    <TemplateDetailPanel template={selectedTemplate} navigate={navigate} />
                </div>
            </div>
        </div>
    );
};

export default AdminTemplates;
