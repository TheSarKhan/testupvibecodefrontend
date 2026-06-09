import { useState } from 'react';
import {
    HiOutlineUserGroup, HiOutlinePlus,
    HiOutlineExclamationCircle, HiOutlineEye, HiOutlineDocumentText,
    HiOutlineClock, HiOutlineRefresh, HiOutlinePencilAlt,
    HiOutlineGlobeAlt, HiOutlineEyeOff,
    HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineXCircle,
    HiOutlineMail, HiOutlineTemplate, HiOutlineSparkles,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
    useAdminCollaborativeExams,
    usePublishCollaborative,
    useUnpublishCollaborative,
} from '../../hooks/admin/useAdminCollaborativeExams';
import CreateModal from './collaborative-exams/CreateModal';
import ReviewModal from './collaborative-exams/ReviewModal';
import { STATUS_CONFIG } from './collaborative-exams/constants';
import Pagination from '../../components/admin/Pagination';
import { formatRelativeTime } from '../../utils/date';

// Shared helper (utils/date) — parses naked backend timestamps as UTC, fixing
// the per-page `new Date(iso)` drift (BUG-10).
const formatRelative = (iso) => formatRelativeTime(iso) || null;

const ProgressBar = ({ approved, pending, rejected, total }) => {
    if (!total) return null;
    const a = (approved / total) * 100;
    const p = (pending / total) * 100;
    const r = (rejected / total) * 100;
    return (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            {a > 0 && <div className="bg-green-500" style={{ width: `${a}%` }} />}
            {p > 0 && <div className="bg-amber-400" style={{ width: `${p}%` }} />}
            {r > 0 && <div className="bg-red-500" style={{ width: `${r}%` }} />}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminCollaborativeExams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [reviewing, setReviewing] = useState(null);
    const [page, setPage] = useState(0);

    const { data, isLoading: loading, error, refetch: fetchExams } = useAdminCollaborativeExams({ page, size: 15 });
    const publishMut = usePublishCollaborative();
    const unpublishMut = useUnpublishCollaborative();
    const exams = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;
    if (error) toast.error('Yüklənmə xətası');

    const handlePublish = async (exam) => {
        // COL-4: publishing is allowed with ASSIGNED (not-yet-submitted) collaborators,
        // but warn the admin first so a teacher isn't silently left out.
        const notSubmitted = (exam.collaborators || []).filter(c => c.status === 'ASSIGNED');
        if (notSubmitted.length > 0) {
            const names = notSubmitted.map(c => c.teacherName || c.teacherEmail || 'Müəllim').join(', ');
            const ok = window.confirm(
                `Bu müəllimlər hələ sual göndərməyib:\n${names}\n\nYenə də yayımlansın?`
            );
            if (!ok) return;
        }
        try {
            await publishMut.mutateAsync(exam.id);
            toast.success('İmtahan yayımlandı və şagirdlər üçün görünür');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Yayımlanma uğursuz');
        }
    };
    const handleUnpublish = async (exam) => {
        try {
            await unpublishMut.mutateAsync(exam.id);
            toast.success('İmtahan gizlədildi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz');
        }
    };

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
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Yeni Birgə İmtahan
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiOutlineUserGroup className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900">Hələ birgə imtahan yoxdur</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Müəllimlərlə birgə imtahan yaratmaq üçün "Yeni Birgə İmtahan" düyməsini basın.</p>
                    <button onClick={() => setShowCreate(true)} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                        İlk imtahanı yarat
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {exams.map(exam => {
                        const collabs = exam.collaborators || [];
                        const totalCollab = collabs.length;
                        const approvedCollab = collabs.filter(c => c.status === 'APPROVED').length;
                        const submittedCollab = collabs.filter(c => c.status === 'SUBMITTED').length;
                        const rejectedCollab = collabs.filter(c => c.status === 'REJECTED').length;
                        const pendingCollab = totalCollab - approvedCollab - submittedCollab - rejectedCollab;
                        const sumPending = collabs.reduce((s, c) => s + (c.pendingCount || 0), 0);
                        const sumApproved = collabs.reduce((s, c) => s + (c.approvedCount || 0), 0);
                        const sumRejected = collabs.reduce((s, c) => s + (c.rejectedCount || 0), 0);
                        const totalDraft = sumPending + sumApproved + sumRejected;
                        const examStatus = STATUS_CONFIG[exam.status] || { label: exam.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {/* Exam header */}
                                <div className="p-5 border-b border-gray-50">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h2 className="font-extrabold text-gray-900 text-lg truncate">{exam.title}</h2>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${examStatus.color}`}>
                                                    {examStatus.label}
                                                </span>
                                                {exam.sitePublished && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                                        <HiOutlineGlobeAlt className="w-3 h-3" /> Saytda
                                                    </span>
                                                )}
                                            </div>
                                            {exam.description && <p className="text-sm text-gray-500 line-clamp-1">{exam.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                                                title="Bu imtahana sual əlavə et"
                                            >
                                                <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                                                Sual əlavə et
                                            </button>
                                            {exam.sitePublished ? (
                                                <button
                                                    onClick={() => handleUnpublish(exam)}
                                                    disabled={unpublishMut.isPending}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                                                    title="Şagirdlərdən gizlət"
                                                >
                                                    <HiOutlineEyeOff className="w-3.5 h-3.5" />
                                                    Gizlət
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePublish(exam)}
                                                    disabled={publishMut.isPending}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                                                    title="Status + sitePublished + visibility bir kliklə"
                                                >
                                                    <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
                                                    Yayımla
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stat strip */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">
                                                <HiOutlineUserGroup className="w-3.5 h-3.5" /> Müəllim
                                            </div>
                                            <div className="text-lg font-extrabold text-blue-900">
                                                {approvedCollab}<span className="text-gray-400 font-bold text-base">/{totalCollab}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">təsdiqlənmiş</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">
                                                <HiOutlineDocumentText className="w-3.5 h-3.5" /> Sual
                                            </div>
                                            <div className="text-lg font-extrabold text-green-900">{exam.totalQuestions || 0}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                {totalDraft > 0 ? `${sumApproved} qəbul · ${sumPending} gözləyir` : 'qəbul edilmiş'}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                                                <HiOutlineClock className="w-3.5 h-3.5" /> Müddət
                                            </div>
                                            <div className="text-lg font-extrabold text-amber-900">
                                                {exam.durationMinutes ? `${exam.durationMinutes}` : '—'}
                                                {exam.durationMinutes && <span className="text-gray-400 font-bold text-sm"> dəq</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">imtahan vaxtı</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                <HiOutlineCalendar className="w-3.5 h-3.5" /> Yaradılıb
                                            </div>
                                            <div className="text-sm font-extrabold text-gray-900 truncate">
                                                {formatRelative(exam.createdAt) || '—'}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                {submittedCollab > 0 ? `${submittedCollab} review gözləyir` : (rejectedCollab > 0 ? `${rejectedCollab} geri qaytarılıb` : 'aktiv')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aggregate progress */}
                                    {totalDraft > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                                                <span className="font-semibold">Sualların təsdiq vəziyyəti</span>
                                                <span>{sumApproved + sumRejected}/{totalDraft} baxılıb</span>
                                            </div>
                                            <ProgressBar approved={sumApproved} pending={sumPending} rejected={sumRejected} total={totalDraft} />
                                        </div>
                                    )}
                                </div>

                                {/* Collaborators */}
                                {totalCollab > 0 ? (
                                    <div className="p-5 bg-gradient-to-b from-gray-50/50 to-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                                <HiOutlineUserGroup className="w-3.5 h-3.5" /> Müəllimlər ({totalCollab})
                                            </p>
                                            {submittedCollab > 0 && (
                                                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                                    {submittedCollab} review gözləyir
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {collabs.map(c => {
                                                const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.ASSIGNED;
                                                const hasTemplate = c.templateSections && c.templateSections.length > 0;
                                                const draftTotal = (c.pendingCount || 0) + (c.approvedCount || 0) + (c.rejectedCount || 0);
                                                return (
                                                    <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                                {c.teacherName?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-gray-900 truncate">{c.teacherName}</p>
                                                                        {c.teacherEmail && (
                                                                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                                                                <HiOutlineMail className="w-3 h-3 shrink-0" />
                                                                                {c.teacherEmail}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${st.color}`}>{st.label}</span>
                                                                </div>

                                                                {/* Subject / section pills */}
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {hasTemplate && c.templateSections.map((sec, i) => (
                                                                        <span key={`sec-${sec.sectionId ?? sec.id ?? sec.subjectName ?? i}`} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                                                                            <HiOutlineTemplate className="w-2.5 h-2.5" />
                                                                            {sec.subtitleName || sec.subjectName || sec.sectionName || 'Bölmə'}
                                                                        </span>
                                                                    ))}
                                                                    {(c.subjects || []).filter(s => {
                                                                        if (!hasTemplate) return true;
                                                                        return !c.templateSections.some(sec => sec.subjectName === s || sec.subtitleName === s);
                                                                    }).map((s) => (
                                                                        <span key={`subj-${s}`} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                                            <HiOutlineSparkles className="w-2.5 h-2.5" />
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Per-teacher progress */}
                                                                {draftTotal > 0 && (
                                                                    <div className="mt-2.5">
                                                                        <div className="flex items-center gap-2 mb-1 text-[10px]">
                                                                            {c.approvedCount > 0 && (
                                                                                <span className="flex items-center gap-0.5 text-green-600 font-bold">
                                                                                    <HiOutlineCheckCircle className="w-3 h-3" />{c.approvedCount}
                                                                                </span>
                                                                            )}
                                                                            {c.pendingCount > 0 && (
                                                                                <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                                                                    <HiOutlineClock className="w-3 h-3" />{c.pendingCount}
                                                                                </span>
                                                                            )}
                                                                            {c.rejectedCount > 0 && (
                                                                                <span className="flex items-center gap-0.5 text-red-600 font-bold">
                                                                                    <HiOutlineXCircle className="w-3 h-3" />{c.rejectedCount}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-gray-400 ml-auto">{draftTotal} sual</span>
                                                                        </div>
                                                                        <ProgressBar
                                                                            approved={c.approvedCount || 0}
                                                                            pending={c.pendingCount || 0}
                                                                            rejected={c.rejectedCount || 0}
                                                                            total={draftTotal}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Footer line */}
                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {c.submittedAt ? `Göndərilib: ${formatRelative(c.submittedAt)}` : (c.createdAt ? `Təyin edilib: ${formatRelative(c.createdAt)}` : '')}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        {c.status === 'REJECTED' && c.adminComment && (
                                                                            <div title={c.adminComment} className="p-1 text-red-500">
                                                                                <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        )}
                                                                        {(c.status === 'SUBMITTED' || (c.pendingCount || 0) > 0) && (
                                                                            <button
                                                                                onClick={() => setReviewing(c)}
                                                                                className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-md transition-colors"
                                                                                title="Sualları bax və təsdiqlə"
                                                                            >
                                                                                <HiOutlineEye className="w-3 h-3" />
                                                                                Bax
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 text-center text-xs text-gray-400">
                                        Bu imtahana hələ müəllim təyin edilməyib
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
