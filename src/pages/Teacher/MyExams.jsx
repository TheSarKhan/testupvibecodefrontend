import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineSparkles, HiOutlineSearch, HiOutlineX,
    HiOutlineUserGroup, HiOutlinePaperAirplane, HiOutlineDocumentText,
    HiOutlineCheckCircle, HiOutlineClock, HiOutlineLibrary,
    HiOutlineEye, HiOutlineChartBar, HiOutlinePencilAlt, HiOutlineDuplicate,
    HiOutlineTrash, HiOutlineShare, HiOutlineDownload, HiOutlineLockClosed, HiOutlineLockOpen,
    HiOutlineFilter, HiOutlineChevronDown, HiOutlineKey,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { CreateExamModal } from '../../components/ui';
import AiExamModal from '../../components/ui/AiExamModal';
import AccessCodeModal from '../../components/ui/AccessCodeModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ───────────────────────────────────────────────────────────────────────────
// Subject palette (deterministic)
// ───────────────────────────────────────────────────────────────────────────

const SUBJECT_PALETTES = [
    { color: '#2563EB', soft: '#EFF4FF' },
    { color: '#16A34A', soft: '#ECFDF3' },
    { color: '#0891B2', soft: '#ECFEFF' },
    { color: '#0D9488', soft: '#F0FDFA' },
    { color: '#C2410C', soft: '#FFF7ED' },
    { color: '#0EA5E9', soft: '#F0F9FF' },
    { color: '#DC2626', soft: '#FEF2F2' },
    { color: '#475569', soft: '#F1F5F9' },
    { color: '#059669', soft: '#ECFDF5' },
];
const hashIdx = (s, n) => { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) % n; };
const paletteFor = (name) => SUBJECT_PALETTES[hashIdx(name || '', SUBJECT_PALETTES.length)];
const initialOf = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

// ───────────────────────────────────────────────────────────────────────────
// Usage bar
// ───────────────────────────────────────────────────────────────────────────

const UsageItem = ({ label, used, limit, color = 'var(--primary)' }) => {
    if (limit === -1) {
        return (
            <div className="min-w-[130px]">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">{label}</div>
                <div className="text-[20px] font-extrabold text-[var(--ink-900)] mt-1 leading-none">
                    {used} <span className="text-[12px] text-[var(--ink-400)]">/ ∞</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--ink-150)] rounded-full overflow-hidden mt-2">
                    <div className="h-full" style={{ background: color, width: '100%', opacity: 0.2 }} />
                </div>
            </div>
        );
    }
    if (limit == null) return null;
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const isFull = used >= limit;
    return (
        <div className="min-w-[130px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">{label}</div>
            <div className="text-[20px] font-extrabold text-[var(--ink-900)] mt-1 leading-none">
                {used} <span className="text-[12px] text-[var(--ink-400)]">/ {limit}</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--ink-150)] rounded-full overflow-hidden mt-2">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: isFull ? '#EF4444' : color }} />
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Management card (my-exams style)
// ───────────────────────────────────────────────────────────────────────────

const ExamMgmtCard = ({
    exam, onView, onStats, onEdit, onClone, onShare,
    onDownloadPdf, onDelete, onToggleStatus,
    canDownloadPdf, canEdit,
}) => {
    const isDraft = exam.status === 'DRAFT';
    const isPublished = exam.status === 'PUBLISHED';
    const isCancelled = exam.status === 'CANCELLED';
    const isFreeFormat = exam.examType === 'FREE';
    const isPrivate = exam.visibility === 'PRIVATE';
    const subjects = exam.subjects?.length ? exam.subjects : (exam.subject ? [exam.subject] : []);
    const primarySubject = subjects[0] || 'İmtahan';
    const palette = paletteFor(primarySubject);
    const qCount = (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);

    const [genCode, setGenCode] = useState(null);
    const [genLoading, setGenLoading] = useState(false);
    const generateCode = async () => {
        if (genLoading) return;
        setGenLoading(true);
        try {
            const { data } = await api.post(`/exams/${exam.id}/generate-code`);
            if (data?.accessCode) setGenCode(data.accessCode);
        } catch {
            toast.error('Kod yaradılmadı');
        } finally {
            setGenLoading(false);
        }
    };

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex flex-col gap-3 hover:border-[var(--primary)] hover:shadow-[var(--sh-md)] transition-all">
            {/* Top: tags + actions */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isFreeFormat ? 'bg-[var(--ink-100)] text-[var(--ink-700)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}>
                        {isFreeFormat ? 'SƏRBƏST' : 'ŞABLON'}
                    </span>
                    {isDraft && (
                        <span className="text-[10.5px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700">
                            Qaralama
                        </span>
                    )}
                    {isPublished && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded bg-[var(--accent-soft)] text-[var(--brand-green-600)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green-600)]" /> {exam.visibility === 'PRIVATE' ? 'Gizli' : 'Açıq'}
                        </span>
                    )}
                    {isCancelled && (
                        <span className="text-[10.5px] font-bold px-2 py-1 rounded bg-red-100 text-red-700">
                            Bağlı
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                    {!isDraft && onShare && (
                        <IconBtn title="Paylaş" onClick={() => onShare(exam.id)}>
                            <HiOutlineShare className="w-3.5 h-3.5" />
                        </IconBtn>
                    )}
                    {!isDraft && canDownloadPdf && onDownloadPdf && (
                        <IconBtn title="PDF yüklə" onClick={() => onDownloadPdf(exam.id)}>
                            <HiOutlineDownload className="w-3.5 h-3.5" />
                        </IconBtn>
                    )}
                    {canEdit && onEdit && (
                        <IconBtn title="Redaktə et" onClick={() => onEdit(exam.id)}>
                            <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                        </IconBtn>
                    )}
                    {onClone && (
                        <IconBtn title="Köçür" onClick={() => onClone(exam.id)}>
                            <HiOutlineDuplicate className="w-3.5 h-3.5" />
                        </IconBtn>
                    )}
                    {!isDraft && onToggleStatus && (
                        <IconBtn title={isPublished ? 'Bağla' : 'Aç'} onClick={() => onToggleStatus(exam.id)}>
                            {isPublished
                                ? <HiOutlineLockClosed className="w-3.5 h-3.5" />
                                : <HiOutlineLockOpen className="w-3.5 h-3.5" />}
                        </IconBtn>
                    )}
                    {onDelete && (
                        <IconBtn title="Sil" onClick={() => onDelete(exam.id)} danger>
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                        </IconBtn>
                    )}
                </div>
            </div>

            {/* Title */}
            <div className="text-[16px] font-bold text-[var(--ink-900)] leading-snug line-clamp-2">{exam.title}</div>

            {/* Note (collaborative pending review etc.) */}
            {exam.pendingManualCount > 0 && (
                <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg self-start">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {exam.pendingManualCount} yoxlanılmağı gözləyir
                </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[var(--ink-500)]">
                <span className="inline-flex items-center gap-1.5">
                    <span
                        className="w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center"
                        style={{ background: palette.soft, color: palette.color }}
                    >
                        {initialOf(primarySubject)}
                    </span>
                    <span className="truncate max-w-[120px]">{primarySubject}</span>
                </span>
                {exam.durationMinutes > 0 && (
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineClock className="w-3.5 h-3.5" /> {exam.durationMinutes} dəq
                    </span>
                )}
                <span className="inline-flex items-center gap-1">
                    <HiOutlineLibrary className="w-3.5 h-3.5" /> {qCount} sual
                </span>
                {exam.participantCount != null && exam.participantCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineUserGroup className="w-3.5 h-3.5" /> {exam.participantCount}
                    </span>
                )}
            </div>

            {/* CTAs */}
            <div className="flex gap-2 pt-1 mt-auto">
                {isDraft ? (
                    <button
                        onClick={() => onEdit?.(exam.id)}
                        className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                    >
                        <HiOutlinePencilAlt className="w-3.5 h-3.5" /> Davam et
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onView(exam)}
                            className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold text-[var(--ink-700)] bg-[var(--ink-50)] border border-[var(--ink-200)] hover:bg-white hover:border-[var(--ink-300)] transition-all"
                        >
                            <HiOutlineEye className="w-3.5 h-3.5" /> İmtahana bax
                        </button>
                        <button
                            onClick={() => onStats(exam.id)}
                            className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                        >
                            <HiOutlineChartBar className="w-3.5 h-3.5" /> Statistika
                        </button>
                    </>
                )}
            </div>

            {isPrivate && !isDraft && (
                <button
                    onClick={generateCode}
                    disabled={genLoading}
                    className="h-9 inline-flex items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-bold bg-[var(--primary-soft)] text-[var(--primary-hover)] hover:bg-[var(--brand-blue-100)] border border-[var(--brand-blue-200)] transition-colors disabled:opacity-60"
                >
                    <HiOutlineKey className={`w-3.5 h-3.5 ${genLoading ? 'animate-pulse' : ''}`} />
                    {genLoading ? 'Yaradılır...' : 'Tələbə kodu yarat'}
                </button>
            )}

            {genCode && <AccessCodeModal code={genCode} onClose={() => setGenCode(null)} />}
        </div>
    );
};

const IconBtn = ({ children, title, onClick, danger }) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--ink-500)] transition-colors ${
            danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-[var(--ink-100)] hover:text-[var(--ink-900)]'
        }`}
    >
        {children}
    </button>
);

// ───────────────────────────────────────────────────────────────────────────
// Section label
// ───────────────────────────────────────────────────────────────────────────

const SectionLabel = ({ Icon, label, count }) => (
    <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mt-7 mb-3">
        <Icon className="w-4 h-4 text-[var(--primary)]" />
        {label}
        <span className="text-[11px] font-bold text-[var(--ink-500)] bg-[var(--ink-100)] px-2 py-0.5 rounded-full">{count}</span>
    </h2>
);

// ───────────────────────────────────────────────────────────────────────────
// Filter pill
// ───────────────────────────────────────────────────────────────────────────

const FChip = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-all border ${
            active
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                : 'bg-white text-[var(--ink-700)] border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)]'
        }`}
    >
        {children}
    </button>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const MyExams = () => {
    const { isAdmin, hasPermission, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showAiExamModal, setShowAiExamModal] = useState(false);
    const [collaborativeAssignments, setCollaborativeAssignments] = useState([]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [visibilityFilter, setVisibilityFilter] = useState('ALL');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [sortBy, setSortBy] = useState('NEWEST');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/exams');
                if (!cancelled) setExams(data);
            } catch {
                if (!cancelled) toast.error('İmtahanları yükləyərkən xəta baş verdi');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        refreshSubscription?.();
        api.get('/collaborative-exams/my-assignments')
            .then(r => { if (!cancelled) setCollaborativeAssignments(r.data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Derived
    const allSubjects = useMemo(() => {
        const set = new Set();
        exams.forEach(e => (e.subjects || []).forEach(s => set.add(s)));
        return [...set].sort();
    }, [exams]);

    const filtered = useMemo(() => {
        let list = [...exams];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (e.subjects || []).some(s => s.toLowerCase().includes(q))
            );
        }
        if (statusFilter === 'DRAFT')     list = list.filter(e => e.status === 'DRAFT');
        if (statusFilter === 'PUBLISHED') list = list.filter(e => e.status === 'PUBLISHED');
        if (visibilityFilter === 'PUBLIC')  list = list.filter(e => e.visibility === 'PUBLIC');
        if (visibilityFilter === 'PRIVATE') list = list.filter(e => e.visibility === 'PRIVATE');
        if (subjectFilter) list = list.filter(e => (e.subjects || []).includes(subjectFilter));

        if (sortBy === 'NEWEST')        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        else if (sortBy === 'PARTICIPANTS') list.sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0));
        else if (sortBy === 'TITLE')    list.sort((a, b) => a.title.localeCompare(b.title, 'az'));

        return list;
    }, [exams, search, statusFilter, visibilityFilter, subjectFilter, sortBy]);

    const drafts    = filtered.filter(e => e.status === 'DRAFT');
    const published = filtered.filter(e => e.status === 'PUBLISHED');
    const other     = filtered.filter(e => e.status !== 'DRAFT' && e.status !== 'PUBLISHED');

    // Handlers
    const handleDelete = async (id) => {
        if (!window.confirm('Bu imtahanı silmək istədiyinizə əminsiniz?')) return;
        try {
            await api.delete(`/exams/${id}`);
            toast.success('İmtahan silindi');
            setExams(prev => prev.filter(e => e.id !== id));
        } catch {
            toast.error('İmtahanı silmək mümkün olmadı');
        }
    };

    const handleClone = async (id) => {
        try {
            const { data } = await api.post(`/exams/${id}/clone`);
            setExams(prev => [data, ...prev]);
            toast.success('İmtahan kopyalandı');
            navigate(`/imtahanlar/duzenle/${data.id}`);
        } catch {
            toast.error('Kopyalama mümkün olmadı');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const { data } = await api.patch(`/exams/${id}/toggle-status`);
            setExams(prev => prev.map(e => e.id === id ? { ...e, status: data.status } : e));
            toast.success(data.status === 'PUBLISHED' ? 'İmtahan açıldı' : 'İmtahan bağlandı');
        } catch (err) {
            if (!err._handled) toast.error(err.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDownloadPdf = async (examId) => {
        const loadingToast = toast.loading('PDF hazırlanır...');
        try {
            const response = await api.get(`/exams/${examId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `exam_${examId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF uğurla yükləndi', { id: loadingToast });
        } catch {
            toast.error('PDF yükləyərkən xəta baş verdi', { id: loadingToast });
        }
    };

    const handleShare = (id) => {
        const exam = exams.find(e => e.id === id);
        if (!exam) return;
        const link = `${window.location.origin}/imtahan/${exam.shareLink}`;
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link);
        toast.success('Paylaşım linki kopyalandı');
    };

    const handleView = (exam) => navigate(`/imtahanlar/melumat/${exam.shareLink}`);
    const handleStats = (id) => navigate(`/imtahanlar/${id}/statistika`);
    const handleEdit  = (id) => navigate(`/imtahanlar/duzenle/${id}`);

    const handleAiExamGenerate = (questions, subjectName) => {
        setShowAiExamModal(false);
        navigate('/imtahanlar/yarat', {
            state: { type: 'free', subject: subjectName, aiQuestions: questions },
        });
    };

    const handleCreateExam = () => {
        if (isAdmin) { setIsCreateModalOpen(true); return; }
        if (!subscription?.plan) { toast.error('İmtahan yaratmaq üçün aktiv abunəliyiniz olmalıdır.'); return; }
        const mLimit = subscription?.plan?.monthlyExamLimit;
        const mUsed = subscription?.usedMonthlyExams || 0;
        if (mLimit !== -1 && mUsed >= mLimit) { toast.error(`Aylıq imtahan limitiniz (${mLimit}) dolub.`); return; }
        const tLimit = subscription?.plan?.maxSavedExamsLimit;
        const tUsed = subscription?.totalExamsCount || 0;
        if (tLimit !== -1 && tUsed >= tLimit) { toast.error(`Maksimum imtahan limitini (${tLimit}) aşmısınız.`); return; }
        setIsCreateModalOpen(true);
    };

    const canEdit = hasPermission?.('examEditing') ?? true;
    const canDownloadPdf = hasPermission?.('downloadAsPdf') ?? true;

    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>İmtahanlarım — testup.az</title>
            </Helmet>

            {/* ── Hero ── */}
            <section
                className="relative pt-12 md:pt-14 pb-10 overflow-hidden border-b border-[var(--ink-150)]"
                style={{ background: 'linear-gradient(180deg, var(--brand-blue-50) 0%, transparent 100%)' }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                    }}
                />
                <div className="container-main relative">
                    <div className="flex flex-wrap items-center gap-6 justify-between">
                        <div>
                            <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.025em] text-[var(--ink-900)]">İmtahanlarım</h1>
                            <p className="text-[14.5px] text-[var(--ink-500)] mt-1">Yaratdığınız imtahanları idarə edin</p>
                        </div>

                        {/* Usage strip */}
                        {subscription && (
                            <div className="flex items-center gap-8 bg-white/70 backdrop-blur-sm border border-[var(--ink-200)] rounded-2xl px-5 py-3 flex-wrap">
                                <UsageItem
                                    label="Aylıq limit"
                                    used={subscription.usedMonthlyExams ?? 0}
                                    limit={subscription.plan?.monthlyExamLimit}
                                    color="#F59E0B"
                                />
                                <div className="w-px h-10 bg-[var(--ink-200)] hidden md:block" />
                                <UsageItem
                                    label="Ümumi limit"
                                    used={subscription.totalExamsCount ?? 0}
                                    limit={subscription.plan?.maxSavedExamsLimit}
                                    color="var(--primary)"
                                />
                                {subscription.endDate && (() => {
                                    const days = Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000));
                                    return (
                                        <>
                                            <div className="w-px h-10 bg-[var(--ink-200)] hidden md:block" />
                                            <div>
                                                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">Plan</div>
                                                <div className="text-[15px] font-extrabold text-[var(--ink-900)] mt-1 inline-flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[11px] bg-[var(--ink-100)] text-[var(--ink-700)]">{subscription.plan?.name}</span>
                                                </div>
                                                <div className={`text-[11.5px] mt-1.5 font-semibold ${days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-[var(--ink-500)]'}`}>
                                                    {days === 0 ? 'Bu gün bitir' : `${days} gün qalır`}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setShowAiExamModal(true)}
                                className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white text-[13.5px] transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                                    boxShadow: '0 8px 24px -10px rgba(139,92,246,0.6)',
                                }}
                            >
                                <HiOutlineSparkles className="w-4 h-4" /> AI ilə yarat
                            </button>
                            <button
                                onClick={handleCreateExam}
                                className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white text-[13.5px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                <HiOutlinePlus className="w-4 h-4" /> Yeni imtahan
                            </button>
                        </div>
                    </div>

                    {/* Collaborative banner */}
                    {collaborativeAssignments.filter(a => a.status !== 'APPROVED').length > 0 && (() => {
                        const active = collaborativeAssignments.filter(a => a.status !== 'APPROVED');
                        const rejected = active.filter(a => a.status === 'REJECTED').length;
                        const submitted = active.filter(a => a.status === 'SUBMITTED').length;
                        return (
                            <Link
                                to="/birge-imtahanlari"
                                className="mt-5 flex items-center justify-between gap-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-3.5 rounded-2xl shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                                        <HiOutlineUserGroup className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[13.5px]">Birgə imtahanlarım</p>
                                        <p className="text-[11.5px] text-white/75 mt-0.5">
                                            {active.length} aktiv tapşırıq
                                            {rejected > 0 && <span className="ml-1.5 text-red-200 font-semibold">· {rejected} geri qaytarıldı</span>}
                                            {submitted > 0 && <span className="ml-1.5 text-amber-200 font-semibold">· {submitted} admin yoxlayır</span>}
                                        </p>
                                    </div>
                                </div>
                                <HiOutlinePaperAirplane className="w-4 h-4 shrink-0 opacity-75 rotate-90" />
                            </Link>
                        );
                    })()}
                </div>
            </section>

            <div className="container-main py-8">
                {/* ── Filter card ── */}
                <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-all">
                            <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Ad, tag, fənn ilə axtar..."
                                className="flex-1 bg-transparent text-[14px] outline-none text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-[var(--ink-400)] hover:text-[var(--ink-700)]">
                                    <HiOutlineX className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-[var(--ink-200)] rounded-xl text-[13px] font-semibold text-[var(--ink-700)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                            >
                                <option value="NEWEST">Ən yeni</option>
                                <option value="PARTICIPANTS">Ən çox iştirakçı</option>
                                <option value="TITLE">Adına görə</option>
                            </select>
                            <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-400)] pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--ink-500)] mr-1">
                            <HiOutlineFilter className="w-3.5 h-3.5" /> Status:
                        </span>
                        <FChip active={statusFilter === 'ALL'}       onClick={() => setStatusFilter('ALL')}>Hamısı</FChip>
                        <FChip active={statusFilter === 'DRAFT'}     onClick={() => setStatusFilter('DRAFT')}>Qaralama</FChip>
                        <FChip active={statusFilter === 'PUBLISHED'} onClick={() => setStatusFilter('PUBLISHED')}>Yayımlanmış</FChip>

                        <span className="w-px h-5 bg-[var(--ink-200)] mx-1" />

                        <FChip active={visibilityFilter === 'ALL'}     onClick={() => setVisibilityFilter('ALL')}>Hər görünürlük</FChip>
                        <FChip active={visibilityFilter === 'PUBLIC'}  onClick={() => setVisibilityFilter('PUBLIC')}>Açıq</FChip>
                        <FChip active={visibilityFilter === 'PRIVATE'} onClick={() => setVisibilityFilter('PRIVATE')}>Gizli</FChip>

                        {allSubjects.length > 0 && (
                            <>
                                <span className="ml-auto" />
                                <div className="relative">
                                    <select
                                        value={subjectFilter}
                                        onChange={e => setSubjectFilter(e.target.value)}
                                        className="appearance-none pl-3 pr-8 h-9 bg-white border border-[var(--ink-200)] rounded-full text-[12.5px] font-semibold text-[var(--ink-700)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                                    >
                                        <option value="">Bütün fənnlər</option>
                                        {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--ink-400)] pointer-events-none" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Result count */}
                <p className="text-[13.5px] text-[var(--ink-500)] mb-2">
                    <strong className="text-[var(--ink-900)]">{filtered.length}</strong> imtahan tapıldı
                </p>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[var(--ink-200)] mt-5">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-4">
                            <HiOutlineDocumentText className="w-8 h-8" />
                        </div>
                        <h3 className="text-[18px] font-bold text-[var(--ink-900)]">Heç bir imtahan tapılmadı</h3>
                        <p className="text-[14px] text-[var(--ink-500)] mt-2 mb-5">Filtrlərinizi yumşaldın və ya yeni imtahan yaradın.</p>
                        <button
                            onClick={handleCreateExam}
                            className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                        >
                            <HiOutlinePlus className="w-4 h-4" /> Yeni imtahan
                        </button>
                    </div>
                ) : (
                    <>
                        {drafts.length > 0 && (
                            <>
                                <SectionLabel Icon={HiOutlineDocumentText} label="Qaralamalar" count={drafts.length} />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {drafts.map(e => (
                                        <ExamMgmtCard
                                            key={e.id}
                                            exam={e}
                                            onView={handleView}
                                            onStats={handleStats}
                                            onEdit={handleEdit}
                                            onClone={handleClone}
                                            onDelete={handleDelete}
                                            canEdit={canEdit}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {published.length > 0 && (
                            <>
                                <SectionLabel Icon={HiOutlineCheckCircle} label="Yayımlanmış" count={published.length} />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {published.map(e => (
                                        <ExamMgmtCard
                                            key={e.id}
                                            exam={e}
                                            onView={handleView}
                                            onStats={handleStats}
                                            onEdit={handleEdit}
                                            onClone={handleClone}
                                            onShare={handleShare}
                                            onDownloadPdf={handleDownloadPdf}
                                            onToggleStatus={handleToggleStatus}
                                            onDelete={handleDelete}
                                            canEdit={canEdit}
                                            canDownloadPdf={canDownloadPdf}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {other.length > 0 && (
                            <>
                                <SectionLabel Icon={HiOutlineLockClosed} label="Digər" count={other.length} />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {other.map(e => (
                                        <ExamMgmtCard
                                            key={e.id}
                                            exam={e}
                                            onView={handleView}
                                            onStats={handleStats}
                                            onEdit={handleEdit}
                                            onClone={handleClone}
                                            onShare={handleShare}
                                            onDownloadPdf={handleDownloadPdf}
                                            /* `onToggleStatus` was missing here — that's why CANCELLED
                                               (Bağlı) exams couldn't be reopened. The card hides the
                                               lock button when the callback isn't passed. */
                                            onToggleStatus={handleToggleStatus}
                                            onDelete={handleDelete}
                                            canEdit={canEdit}
                                            canDownloadPdf={canDownloadPdf}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            {showAiExamModal && (
                <AiExamModal onClose={() => setShowAiExamModal(false)} onGenerate={handleAiExamGenerate} />
            )}
        </div>
    );
};

export default MyExams;
