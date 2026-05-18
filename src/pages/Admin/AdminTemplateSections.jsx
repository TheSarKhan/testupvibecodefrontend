import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineInformationCircle, HiOutlineX, HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineVolumeUp, HiOutlineDocumentText } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    useAdminTemplates,
    useAdminSubtitles,
    useAdminSections,
    useCreateSection,
    useUpdateSection,
    useDeleteSection,
} from '../../hooks/admin/useAdminTemplates';
import Pagination from '../../components/admin/Pagination';
import SectionForm, { QUESTION_TYPE_SHORT, PASSAGE_TYPES } from './templates/SectionForm';

// ─── Main Page ─────────────────────────────────────────────────────────────────
const AdminTemplateSections = () => {
    const { templateId, subtitleId } = useParams();
    const navigate = useNavigate();
    const [editingIdx, setEditingIdx] = useState(null);

    const [page, setPage] = useState(0);
    const { data: secData, isLoading } = useAdminSections(subtitleId, { page, size: 15 });
    const sections = secData?.content ?? [];
    const totalPages = secData?.totalPages ?? 0;
    const totalElements = secData?.totalElements ?? 0;
    const { data: subjects = [] } = useQuery({
        queryKey: ['public', 'subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data),
    });
    const { data: templatesPage } = useAdminTemplates({ page: 0, size: 100 });
    const templates = templatesPage?.content ?? [];
    const { data: subPage } = useAdminSubtitles(templateId, { page: 0, size: 100 });
    const subtitles = subPage?.content ?? [];
    const loading = isLoading;

    const createSection = useCreateSection();
    const updateSection = useUpdateSection();
    const deleteSectionMut = useDeleteSection();

    const savingIdx = createSection.isPending
        ? -1
        : (updateSection.isPending && updateSection.variables
            ? sections.findIndex(s => s.id === updateSection.variables.id)
            : null);

    const info = sections.length > 0
        ? { templateTitle: sections[0].templateTitle, subtitleName: sections[0].subtitleName }
        : {
            templateTitle: templates.find(t => String(t.id) === String(templateId))?.title || '',
            subtitleName: subtitles.find(s => String(s.id) === String(subtitleId))?.subtitle || '',
        };

    const handleSave = async (formData) => {
        const payload = {
            subjectName: formData.subjectName,
            formula: formData.formula,
            typeCounts: formData.typeCounts.map(tc => ({ questionType: tc.questionType, count: parseInt(tc.count), passageType: tc.passageType || null })),
            pointGroups: formData.pointGroups || null,
            maxScore: formData.maxScore ?? null,
            allowCustomPoints: formData.allowCustomPoints ?? true,
        };

        if (editingIdx === -1) {
            try {
                await createSection.mutateAsync({ subtitleId, section: payload });
                setEditingIdx(null);
                toast.success('Fənn əlavə edildi');
            } catch { toast.error('Əməliyyat uğursuz oldu'); }
        } else {
            // editingIdx is global; convert to within-page index
            const localIdx = editingIdx - page * 15;
            const sectionId = sections[localIdx]?.id;
            if (!sectionId) { toast.error('Bölmə tapılmadı'); return; }
            try {
                await updateSection.mutateAsync({ id: sectionId, section: payload });
                setEditingIdx(null);
                toast.success('Fənn yeniləndi');
            } catch { toast.error('Əməliyyat uğursuz oldu'); }
        }
    };

    const handleDelete = async (idx) => {
        // idx is global index; convert to local
        const section = sections[idx - page * 15];
        if (!section) return;
        if (!window.confirm(`"${section.subjectName}" fənnini silmək istədiyinizə əminsiniz?`)) return;
        try {
            await deleteSectionMut.mutateAsync(section.id);
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
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {info.templateTitle}{info.templateTitle && info.subtitleName ? ' · ' : ''}{info.subtitleName}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">Fənnlər</h1>
                    <p className="text-gray-500 mt-1 text-sm">Bu altbaşlığa aid fənnləri idarə edin</p>
                </div>
                {editingIdx !== -1 && (
                    <button onClick={() => setEditingIdx(-1)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <HiOutlinePlus className="w-4 h-4" /> Fənn əlavə et
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((s, localIdx) => {
                        const i = page * 15 + localIdx;
                        const total = (s.typeCounts || []).reduce((sum, tc) => sum + (tc.count || 0), 0);

                        if (editingIdx === i) {
                            return (
                                <SectionForm
                                    key={s.id}
                                    initial={{
                                        subjectName: s.subjectName,
                                        formula: s.formula,
                                        typeCounts: (s.typeCounts || []).map(tc => ({ questionType: tc.questionType, count: String(tc.count), passageType: tc.passageType || null })),
                                        pointGroups: s.pointGroups || null,
                                        maxScore: s.maxScore ?? null,
                                        allowCustomPoints: s.allowCustomPoints ?? true,
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
                                        <code className="text-xs font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{s.formula}</code>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(s.typeCounts || []).map((tc, j) => {
                                            const pt = tc.passageType ? PASSAGE_TYPES[tc.passageType] : null;
                                            return (
                                                <span key={j} className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg gap-1 ${
                                                    pt?.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
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
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
                                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                + Fənn əlavə et
                            </button>
                        </div>
                    )}
                </div>
            )}

            {sections.length > 0 && (
                <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
            )}
        </div>
    );
};

export default AdminTemplateSections;
