import { useState, useEffect, useMemo } from 'react';
import {
    HiOutlineX, HiOutlineCheck, HiOutlineXCircle, HiOutlineExclamation,
    HiOutlineChatAlt2, HiOutlinePaperAirplane,
} from 'react-icons/hi';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import {
    useApproveCollaborator,
    useRejectCollaborator,
    useApproveQuestion,
    useRejectQuestion,
    useFinalizeReview,
} from '../../../hooks/admin/useAdminCollaborativeExams';

// Per-question status badge.
const StatusBadge = ({ status }) => {
    const meta = {
        PENDING:  { label: 'Yoxlanılır',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
        APPROVED: { label: 'Təsdiqləndi',  cls: 'text-green-700 bg-green-50 border-green-200' },
        REJECTED: { label: 'Rədd edildi',  cls: 'text-red-700 bg-red-50 border-red-200' },
    }[status] || { label: '—', cls: 'text-gray-500 bg-gray-50 border-gray-200' };
    return (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
            {meta.label}
        </span>
    );
};

const ReviewModal = ({ collaborator, onClose, onAction }) => {
    const [questions, setQuestions] = useState([]);
    const [loadingQ, setLoadingQ] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);   // question id whose reject form is open
    const [rejectComment, setRejectComment] = useState('');
    const [batchRejectOpen, setBatchRejectOpen] = useState(false);
    const [batchRejectComment, setBatchRejectComment] = useState('');

    const [activeSubject, setActiveSubject] = useState('__ALL__');

    const approveAllMut = useApproveCollaborator();
    const rejectAllMut  = useRejectCollaborator();
    const approveQMut   = useApproveQuestion();
    const rejectQMut    = useRejectQuestion();
    const finalizeMut   = useFinalizeReview();

    const busy =
        approveAllMut.isPending || rejectAllMut.isPending ||
        approveQMut.isPending || rejectQMut.isPending || finalizeMut.isPending;

    // Load draft questions on mount.
    useEffect(() => {
        if (!collaborator.draftExamId) return;
        setLoadingQ(true);
        api.get(`/exams/${collaborator.draftExamId}/details`)
            .then(r => setQuestions(r.data.questions || []))
            .catch(() => toast.error('Suallar yüklənmədi'))
            .finally(() => setLoadingQ(false));
    }, [collaborator.draftExamId]);

    const counts = useMemo(() => {
        const c = { pending: 0, approved: 0, rejected: 0 };
        for (const q of questions) {
            if (q.reviewStatus === 'PENDING')  c.pending++;
            else if (q.reviewStatus === 'APPROVED') c.approved++;
            else if (q.reviewStatus === 'REJECTED') c.rejected++;
        }
        return c;
    }, [questions]);

    // Group questions by subjectGroup so admin can review one subject at a time.
    // The "subjects" array preserves the order subjects first appear in the question list,
    // and each entry carries its own per-status counters for the tab badges.
    const subjects = useMemo(() => {
        const seen = new Map();
        for (const q of questions) {
            const key = q.subjectGroup || '__OTHER__';
            if (!seen.has(key)) {
                seen.set(key, { key, label: q.subjectGroup || 'Digər', total: 0, pending: 0, approved: 0, rejected: 0 });
            }
            const g = seen.get(key);
            g.total++;
            if (q.reviewStatus === 'PENDING')  g.pending++;
            else if (q.reviewStatus === 'APPROVED') g.approved++;
            else if (q.reviewStatus === 'REJECTED') g.rejected++;
        }
        return Array.from(seen.values());
    }, [questions]);

    // Questions visible in the current tab. Global numbering preserved (Q4 stays Q4 even
    // when the Az. dili tab is on) so admins can refer to questions by their absolute index.
    const visibleQuestions = useMemo(() => {
        if (activeSubject === '__ALL__') return questions.map((q, i) => ({ q, globalIdx: i }));
        return questions
            .map((q, i) => ({ q, globalIdx: i }))
            .filter(({ q }) => (q.subjectGroup || '__OTHER__') === activeSubject);
    }, [questions, activeSubject]);

    // Optimistic local updates so admin doesn't wait for a refetch after each click.
    const markQuestion = (id, status, comment = null) => {
        setQuestions(qs => qs.map(q => q.id === id
            ? { ...q, reviewStatus: status, reviewComment: comment }
            : q));
    };

    const handleApproveOne = async (qid) => {
        try {
            await approveQMut.mutateAsync(qid);
            markQuestion(qid, 'APPROVED', null);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Təsdiq alınmadı');
        }
    };

    const handleRejectOne = async (qid) => {
        try {
            await rejectQMut.mutateAsync({ questionId: qid, comment: rejectComment.trim() });
            markQuestion(qid, 'REJECTED', rejectComment.trim() || null);
            setRejectingId(null);
            setRejectComment('');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Rədd alınmadı');
        }
    };

    const handleApproveAll = async () => {
        try {
            await approveAllMut.mutateAsync(collaborator.id);
            toast.success(`${counts.pending} sual təsdiqləndi və əsas imtahana köçürüldü`);
            onAction(); onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz');
        }
    };

    const handleRejectAll = async () => {
        try {
            await rejectAllMut.mutateAsync({ collaboratorId: collaborator.id, comment: batchRejectComment.trim() });
            toast.success('Bütün suallar müəllimə geri qaytarıldı');
            onAction(); onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz');
        }
    };

    const handleFinalize = async () => {
        try {
            await finalizeMut.mutateAsync(collaborator.id);
            if (counts.rejected === 0) {
                toast.success(`${counts.approved} sual əsas imtahana əlavə edildi`);
            } else {
                toast.success(`${counts.approved} təsdiq, ${counts.rejected} rədd — müəllimə bildiriş göndərildi`);
            }
            onAction(); onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Bitirilə bilmədi');
        }
    };

    const canFinalize = counts.pending === 0 && questions.length > 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                {/* ── Header ── */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <HiOutlineChatAlt2 className="w-4 h-4 text-blue-500" />
                            <span className="font-mono">#{collaborator.id}</span>
                            <span>·</span>
                            <span className="truncate">{(collaborator.subjects || []).join(', ')}</span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 truncate">
                            {collaborator.teacherName} <span className="text-gray-400 font-normal">— sual yoxlaması</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg shrink-0">
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* ── Counters strip ── */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-4 text-xs">
                    <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {counts.pending} gözləyir
                    </span>
                    <span className="text-green-700 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {counts.approved} təsdiq
                    </span>
                    <span className="text-red-700 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {counts.rejected} rədd
                    </span>
                    <div className="flex-1" />
                    {counts.pending > 1 && !batchRejectOpen && (
                        <>
                            <button
                                onClick={() => setBatchRejectOpen(true)}
                                disabled={busy}
                                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                            >
                                Hamısını rədd et
                            </button>
                            <span className="text-gray-300">·</span>
                            <button
                                onClick={handleApproveAll}
                                disabled={busy}
                                className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-50"
                            >
                                Hamısını təsdiqlə
                            </button>
                        </>
                    )}
                </div>

                {/* ── Batch reject form (collapses when not open) ── */}
                {batchRejectOpen && (
                    <div className="px-6 py-4 bg-red-50/60 border-b border-red-100 space-y-2">
                        <div className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                            <HiOutlineExclamation className="w-4 h-4" />
                            {counts.pending} gözləyən sual hamısı rədd ediləcək
                        </div>
                        <textarea
                            value={batchRejectComment}
                            onChange={e => setBatchRejectComment(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 bg-white resize-none"
                            placeholder="Müəllimə ümumi şərh (ixtiyari)"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setBatchRejectOpen(false); setBatchRejectComment(''); }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                            >Ləğv et</button>
                            <button
                                onClick={handleRejectAll}
                                disabled={busy}
                                className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg"
                            >Hamısını rədd et</button>
                        </div>
                    </div>
                )}

                {/* ── Subject tabs (only when there's more than one subject) ── */}
                {subjects.length > 1 && (
                    <div className="px-6 pt-3 pb-1 border-b border-gray-100 bg-gray-50/40 flex items-center gap-1.5 overflow-x-auto">
                        <button
                            onClick={() => setActiveSubject('__ALL__')}
                            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                activeSubject === '__ALL__'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                        >
                            Hamısı
                            <span className={`tabular-nums text-[10px] font-bold ${activeSubject === '__ALL__' ? 'text-white/80' : 'text-gray-400'}`}>
                                {questions.length}
                            </span>
                        </button>
                        {subjects.map(s => {
                            const active = activeSubject === s.key;
                            return (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveSubject(s.key)}
                                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                                        active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                                    }`}
                                >
                                    {s.label}
                                    <span className={`tabular-nums text-[10px] font-bold ${active ? 'text-white/80' : 'text-gray-400'}`}>
                                        {s.total}
                                    </span>
                                    {s.pending > 0 && (
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`} title={`${s.pending} gözləyir`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Questions list (grouped under subject headers when in "Hamısı" view, flat when a tab is selected) ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loadingQ ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : questions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">Sual tapılmadı</p>
                    ) : visibleQuestions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">Bu fənndə sual yoxdur</p>
                    ) : (
                        <div className="space-y-3">
                            {visibleQuestions.map(({ q, globalIdx }, vi) => {
                                const i = globalIdx;
                                // Subject header before the first question of each group when
                                // we're in the "Hamısı" tab. Within a single-subject tab the
                                // header is redundant — the tab itself names the subject.
                                const prev = vi > 0 ? visibleQuestions[vi - 1].q : null;
                                const showSubjectHeader =
                                    activeSubject === '__ALL__' &&
                                    subjects.length > 1 &&
                                    (!prev || (prev.subjectGroup || '__OTHER__') !== (q.subjectGroup || '__OTHER__'));
                                const headerLabel = q.subjectGroup || 'Digər';
                                const groupInfo = subjects.find(s => s.key === (q.subjectGroup || '__OTHER__'));

                                const isPending  = q.reviewStatus === 'PENDING';
                                const isApproved = q.reviewStatus === 'APPROVED';
                                const isRejected = q.reviewStatus === 'REJECTED';
                                const rowBg = isApproved ? 'bg-green-50/40 border-green-100'
                                            : isRejected ? 'bg-red-50/40 border-red-100'
                                            : 'bg-gray-50 border-gray-100';
                                return (
                                    <div key={q.id}>
                                        {showSubjectHeader && (
                                            <div className="flex items-center gap-3 mt-4 mb-2 first:mt-0">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
                                                    {headerLabel}
                                                    <span className="text-blue-500 font-mono tabular-nums">{groupInfo?.total ?? 0}</span>
                                                </div>
                                                <div className="flex-1 h-px bg-gray-200" />
                                                {groupInfo && (
                                                    <div className="flex items-center gap-2 text-[10px] font-semibold tabular-nums">
                                                        {groupInfo.pending > 0  && <span className="text-amber-700">{groupInfo.pending}↻</span>}
                                                        {groupInfo.approved > 0 && <span className="text-green-700">{groupInfo.approved}✓</span>}
                                                        {groupInfo.rejected > 0 && <span className="text-red-700">{groupInfo.rejected}✗</span>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className={`rounded-xl border ${rowBg} p-4`}>
                                        <div className="flex items-start gap-3">
                                            <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5 w-6">{i + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <StatusBadge status={q.reviewStatus} />
                                                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{q.questionType}</span>
                                                    {q.subjectGroup && (
                                                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{q.subjectGroup}</span>
                                                    )}
                                                    <span className="text-[11px] font-semibold text-gray-500">{q.points} xal</span>
                                                </div>
                                                <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap">
                                                    {q.content || <span className="italic text-gray-400">(mətn yoxdur)</span>}
                                                </p>

                                                {/* Options (MCQ / multi-select / true-false) */}
                                                {(q.options?.length > 0) && (
                                                    <ul className="mt-2 space-y-1">
                                                        {q.options.map((opt, oi) => (
                                                            <li key={opt.id ?? oi}
                                                                className={`text-xs px-2.5 py-1 rounded border flex items-center gap-2 ${
                                                                    opt.isCorrect
                                                                        ? 'bg-green-50 border-green-200 text-green-800 font-semibold'
                                                                        : 'bg-white border-gray-100 text-gray-600'
                                                                }`}>
                                                                <span className="font-mono text-[10px] text-gray-400">{String.fromCharCode(65 + oi)}.</span>
                                                                <span className="flex-1 truncate">{opt.content}</span>
                                                                {opt.isCorrect && <HiOutlineCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Existing per-question admin comment when rejected */}
                                                {isRejected && q.reviewComment && (
                                                    <div className="mt-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-red-700">
                                                        <span className="font-semibold">Şərh: </span>{q.reviewComment}
                                                    </div>
                                                )}

                                                {/* Action row */}
                                                {isPending && rejectingId !== q.id && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => { setRejectingId(q.id); setRejectComment(''); }}
                                                            disabled={busy}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                        >
                                                            <HiOutlineXCircle className="w-4 h-4" /> Rədd et
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveOne(q.id)}
                                                            disabled={busy}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                                                        >
                                                            <HiOutlineCheck className="w-4 h-4" /> Təsdiqlə
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Inline reject form */}
                                                {isPending && rejectingId === q.id && (
                                                    <div className="mt-3 space-y-2">
                                                        <textarea
                                                            value={rejectComment}
                                                            onChange={e => setRejectComment(e.target.value)}
                                                            rows={2}
                                                            autoFocus
                                                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 bg-white resize-none"
                                                            placeholder="Müəllim üçün şərh (məs. 'cavabda səhv var, B variantı düz deyil')"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => { setRejectingId(null); setRejectComment(''); }}
                                                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                                                            >Ləğv</button>
                                                            <button
                                                                onClick={() => handleRejectOne(q.id)}
                                                                disabled={busy}
                                                                className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg"
                                                            >Rədd et</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer: finalize ── */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">
                    <p className="text-xs text-gray-500 leading-tight">
                        {canFinalize
                            ? counts.rejected === 0
                                ? `${counts.approved} sual əsas imtahana köçürüləcək.`
                                : `${counts.approved} təsdiq, ${counts.rejected} müəllimə geri qayıdacaq.`
                            : `${counts.pending} sual hələ yoxlanmayıb.`}
                    </p>
                    <button
                        onClick={handleFinalize}
                        disabled={!canFinalize || busy}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shrink-0"
                    >
                        <HiOutlinePaperAirplane className="w-4 h-4" />
                        {finalizeMut.isPending ? 'Göndərilir...' : 'Bitir və müəllimə bildir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
