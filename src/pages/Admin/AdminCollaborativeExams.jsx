import { useState } from 'react';
import {
    HiOutlineUserGroup, HiOutlinePlus,
    HiOutlineExclamationCircle, HiOutlineEye, HiOutlineDocumentText,
    HiOutlineClock, HiOutlineRefresh, HiOutlinePencilAlt,
    HiOutlineBookOpen,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useAdminCollaborativeExams } from '../../hooks/admin/useAdminCollaborativeExams';
import CreateModal from './collaborative-exams/CreateModal';
import ReviewModal from './collaborative-exams/ReviewModal';
import { STATUS_CONFIG } from './collaborative-exams/constants';
import Pagination from '../../components/admin/Pagination';

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminCollaborativeExams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [reviewing, setReviewing] = useState(null);
    const [page, setPage] = useState(0);

    const { data, isLoading: loading, error, refetch: fetchExams } = useAdminCollaborativeExams({ page, size: 15 });
    const exams = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;
    if (error) toast.error('Yüklənmə xətası');

    const handleCreated = () => {
        fetchExams();
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

            {exams.length > 0 && (
                <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
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
