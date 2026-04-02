import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineUserGroup, HiOutlinePencilAlt, HiOutlinePaperAirplane,
    HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineClock,
    HiOutlineDocumentText, HiOutlineRefresh,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_META = {
    ASSIGNED:  { label: 'Gözləyir',         badge: 'text-blue-700 bg-blue-50 border-blue-200',   bar: 'bg-blue-400' },
    SUBMITTED: { label: 'Admin yoxlayır',    badge: 'text-amber-700 bg-amber-50 border-amber-200', bar: 'bg-amber-400' },
    APPROVED:  { label: 'Təsdiqləndi',       badge: 'text-green-700 bg-green-50 border-green-200', bar: 'bg-green-500' },
    REJECTED:  { label: 'Geri qaytarıldı',   badge: 'text-red-700 bg-red-50 border-red-200',       bar: 'bg-red-400' },
};

const CollaborativeAssignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openingDraft, setOpeningDraft] = useState(null);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/collaborative-exams/my-assignments');
            setAssignments(data);
        } catch {
            toast.error('Yüklənmə xətası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAssignments(); }, []);

    const handleOpenDraft = async (collaboratorId) => {
        setOpeningDraft(collaboratorId);
        try {
            const { data } = await api.post(`/collaborative-exams/${collaboratorId}/open-draft`);
            navigate(`/imtahanlar/edit/${data.draftExamId}`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setOpeningDraft(null);
        }
    };

    const active   = assignments.filter(a => a.status !== 'APPROVED');
    const approved = assignments.filter(a => a.status === 'APPROVED');

    const fmtDate = (iso) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-gray-50/50 min-h-screen py-10">
            <Helmet>
                <title>Birgə İmtahanlarım — testup.az</title>
            </Helmet>

            <div className="container-main max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <HiOutlineUserGroup className="w-7 h-7 text-indigo-500" />
                            Birgə İmtahanlarım
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Admin tərəfindən sizə tapşırılan imtahanlar
                        </p>
                    </div>
                    <button
                        onClick={fetchAssignments}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all"
                    >
                        <HiOutlineRefresh className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineUserGroup className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Hələ tapşırıq yoxdur</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                            Admin sizə birgə imtahan tapşırdıqda burada görünəcək.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Active assignments */}
                        {active.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                                    Aktiv tapşırıqlar · {active.length}
                                </h2>
                                <div className="space-y-4">
                                    {active.map(a => {
                                        const meta = STATUS_META[a.status] || STATUS_META.ASSIGNED;
                                        const canEdit = a.status === 'ASSIGNED' || a.status === 'REJECTED';
                                        const isOpening = openingDraft === a.id;

                                        return (
                                            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                {/* Status bar */}
                                                <div className={`h-1 w-full ${meta.bar}`} />

                                                <div className="p-5">
                                                    {/* Title row */}
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <h3 className="font-bold text-gray-900 text-base leading-snug">{a.examTitle}</h3>
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${meta.badge}`}>
                                                            {meta.label}
                                                        </span>
                                                    </div>

                                                    {/* Template sections (if template-based) */}
                                                    {a.templateSections?.length > 0 ? (
                                                        <div className="flex flex-col gap-1.5 mb-3">
                                                            {a.templateSections.map(sec => (
                                                                <div key={sec.id} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
                                                                    <span className="text-xs font-bold text-indigo-800">{sec.subjectName}</span>
                                                                    <span className="text-[11px] text-indigo-500 font-semibold">{sec.questionCount} sual</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : a.subjects?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            {a.subjects.map(s => (
                                                                <span key={s} className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Stats row */}
                                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                                        {a.draftQuestionCount > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineDocumentText className="w-3.5 h-3.5" />
                                                                {a.draftQuestionCount} sual hazırlanıb
                                                            </span>
                                                        )}
                                                        {a.submittedAt && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                                {fmtDate(a.submittedAt)} göndərildi
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rejection comment */}
                                                    {a.status === 'REJECTED' && a.adminComment && (
                                                        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                                                            <HiOutlineExclamationCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="font-semibold text-xs mb-0.5">Admin şərhi:</p>
                                                                <p className="text-xs leading-relaxed">{a.adminComment}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action button */}
                                                    {a.status === 'SUBMITTED' ? (
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl">
                                                            <HiOutlinePaperAirplane className="w-4 h-4" />
                                                            Suallarınız adminin yoxlamasını gözləyir
                                                        </div>
                                                    ) : canEdit ? (
                                                        <button
                                                            onClick={() => handleOpenDraft(a.id)}
                                                            disabled={isOpening}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
                                                        >
                                                            {isOpening
                                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : <>
                                                                    <HiOutlinePencilAlt className="w-4 h-4" />
                                                                    {a.status === 'REJECTED'
                                                                        ? 'Düzəliş et və yenidən göndər'
                                                                        : a.draftQuestionCount > 0 ? 'Davam et' : 'Sual əlavə et'}
                                                                </>
                                                            }
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Approved/completed */}
                        {approved.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                                    Tamamlanmış · {approved.length}
                                </h2>
                                <div className="space-y-3">
                                    {approved.map(a => (
                                        <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 opacity-70">
                                            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-700 text-sm truncate">{a.examTitle}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {(a.subjects || []).join(', ')}
                                                    {a.draftQuestionCount > 0 && ` · ${a.draftQuestionCount} sual`}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 shrink-0">
                                                Təsdiqləndi
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborativeAssignments;
