import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlinePlusCircle, HiOutlineSearch, HiOutlineDocumentText,
    HiOutlineLockClosed, HiOutlineBookmark, HiBookmark,
    HiOutlineClock, HiOutlineQuestionMarkCircle, HiOutlineArrowRight,
    HiOutlineFilter, HiOutlineX, HiOutlineChevronDown, HiOutlineAdjustments,
    HiOutlineUserGroup, HiOutlinePaperAirplane, HiOutlineTag,
} from 'react-icons/hi';
import { useNavigate, Link } from 'react-router-dom';
import { ExamCard, CreateExamModal } from '../../components/ui';
import AiExamModal from '../../components/ui/AiExamModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Filter pill ───────────────────────────────────────────────────────────────
const Pill = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
        }`}
    >
        {label}
    </button>
);

// ── Select filter ─────────────────────────────────────────────────────────────
const FilterSelect = ({ value, onChange, options }) => (
    <div className="relative">
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer hover:border-indigo-300 transition-colors"
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
);

// ── Subscription Usage Bar ────────────────────────────────────────────────────
const UsageBar = ({ label, used, limit, colorClass }) => {
    // If limit is null/undefined but we have usage (e.g. no plan assigned yet)
    const isUnlimited = limit === -1;
    const hasNoLimit = limit === undefined || limit === null;

    if (isUnlimited) {
        return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <span>{label}</span>
                    <span className="text-indigo-600">Limitsiz</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-full opacity-20" />
                </div>
            </div>
        );
    }

    if (hasNoLimit) {
        return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <span>{label}</span>
                    <span className="text-gray-400">{used} / —</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-300 w-0" />
                </div>
            </div>
        );
    }

    const percent = Math.min(100, Math.round((used / limit) * 100));
    const isFull = used >= limit;

    return (
        <div className="flex flex-col gap-1.5 min-w-[140px]">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <span>{label}</span>
                <span className={isFull ? 'text-red-500' : 'text-gray-900'}>{used} / {limit}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : colorClass}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};


// ── Main ──────────────────────────────────────────────────────────────────────
const ExamList = () => {
    const { user, isTeacher, isAdmin, isStudent, isAuthenticated, hasPermission, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAdmin) navigate('/admin/oz-imtahanlar', { replace: true });
    }, [isAdmin, navigate]);

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showAiExamModal, setShowAiExamModal] = useState(false);
    const [savedExamLinks, setSavedExamLinks] = useState(new Set());
    const [savingLink, setSavingLink] = useState(null);
    const [examPaymentWindowOpen, setExamPaymentWindowOpen] = useState(false);
    const [payingExam, setPayingExam] = useState(null);
    const [purchasedExams, setPurchasedExams] = useState(new Set());

    // Collaborative assignments (teacher only)
    const [collaborativeAssignments, setCollaborativeAssignments] = useState([]);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    // Teacher filters
    const [statusFilter, setStatusFilter] = useState('ALL');   // ALL | DRAFT | PUBLISHED
    const [visibilityFilter, setVisibilityFilter] = useState('ALL'); // ALL | PUBLIC | PRIVATE
    // Student filters
    const [priceFilter, setPriceFilter] = useState('ALL');     // ALL | FREE | PAID
    const [durationFilter, setDurationFilter] = useState('ALL'); // ALL | SHORT | MEDIUM | LONG
    // Shared
    const [sortBy, setSortBy] = useState('NEWEST');            // NEWEST | OLDEST | TITLE | QUESTIONS
    // New filters
    const [selectedTags, setSelectedTags] = useState([]);      // array of tag strings
    const [subjectFilter, setSubjectFilter] = useState('');    // '' = all
    const [typeFilter, setTypeFilter] = useState('ALL');       // ALL | FREE | TEMPLATE

    // ── Computed values ───────────────────────────────────────────────────────
    const allTags = useMemo(() => {
        const map = {};
        exams.forEach(e => (e.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; }));
        return Object.entries(map).sort((a, b) => b[1] - a[1]); // [[tag, count], ...]
    }, [exams]);

    const allSubjects = useMemo(() => {
        const set = new Set();
        exams.forEach(e => (e.subjects || []).forEach(s => set.add(s)));
        return [...set].sort();
    }, [exams]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (isTeacher) {
            if (statusFilter !== 'ALL') count++;
            if (visibilityFilter !== 'ALL') count++;
        } else {
            if (priceFilter !== 'ALL') count++;
            if (durationFilter !== 'ALL') count++;
        }
        if (sortBy !== 'NEWEST') count++;
        count += selectedTags.length + (subjectFilter ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);
        return count;
    }, [search, statusFilter, visibilityFilter, priceFilter, durationFilter, sortBy, isTeacher, selectedTags, subjectFilter, typeFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setVisibilityFilter('ALL');
        setPriceFilter('ALL');
        setDurationFilter('ALL');
        setSortBy('NEWEST');
        setSelectedTags([]);
        setSubjectFilter('');
        setTypeFilter('ALL');
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                let data;
                if (isStudent) {
                    data = (await api.get('/exams/public')).data;
                } else if (isTeacher || isAdmin) {
                    data = (await api.get('/exams')).data;
                } else {
                    data = (await api.get('/exams/public')).data;
                }
                if (!cancelled) setExams(data);
            } catch {
                if (!cancelled) toast.error("İmtahanları yükləyərkən xəta baş verdi");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        if (isTeacher) {
            refreshSubscription();
            api.get('/collaborative-exams/my-assignments')
                .then(r => { if (!cancelled) setCollaborativeAssignments(r.data); })
                .catch(() => {});
        }
        return () => { cancelled = true; };
    }, [user]);


    useEffect(() => {
        if (isStudent && isAuthenticated) {
            api.get('/depot').then(res => {
                setSavedExamLinks(new Set(res.data.map(e => e.shareLink)));
            }).catch(() => {});
            api.get('/exams/my-purchased-exams').then(res => {
                setPurchasedExams(new Set(res.data));
            }).catch(() => {});
        }
    }, [isStudent, isAuthenticated]);


    const handleDelete = async (id) => {
        if (!window.confirm('Bu imtahanı silmək istədiyinizə əminsiniz?')) return;
        try {
            await api.delete(`/exams/${id}`);
            toast.success("İmtahan silindi");
            setExams(exams.filter(e => e.id !== id));
        } catch {
            toast.error("İmtahanı silmək mümkün olmadı");
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
            toast.error(err.message || 'Xəta baş verdi');
        }
    };

    const handleDownloadPdf = async (examId) => {
        const loadingToast = toast.loading("PDF hazırlanır...");
        try {
            const response = await api.get(`/exams/${examId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `exam_${examId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("PDF uğurla yükləndi", { id: loadingToast });
        } catch (error) {
            toast.error("PDF yükləyərkən xəta baş verdi", { id: loadingToast });
        }
    };

    const handleShare = (id) => {
        const exam = exams.find(e => e.id === id);
        if (!exam) return;
        const link = `${window.location.origin}/imtahan/${exam.shareLink}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(link);
        } else {
            const el = document.createElement('textarea');
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        toast.success("Paylaşım linki kopyalandı");
    };

    const handleJoinExam = (exam) => navigate(`/imtahan/${exam.shareLink}`);

    // Auto-check exam payment when tab regains focus
    useEffect(() => {
        if (!examPaymentWindowOpen) return;
        const onFocus = async () => {
            const orderId = localStorage.getItem('pendingPayriffOrderId');
            if (!orderId) return;
            try {
                const { data } = await api.post('/payment/verify', { orderId });
                if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                    localStorage.removeItem('pendingPayriffOrderId');
                    setExamPaymentWindowOpen(false);
                    setPayingExam(null);
                    toast.success('Ödəniş uğurlu! İmtahana başlaya bilərsiniz.');
                    if (data.examShareLink) {
                        setPurchasedExams(prev => new Set([...prev, data.examShareLink]));
                        navigate(`/imtahan/${data.examShareLink}`);
                    }
                }
            } catch {}
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [examPaymentWindowOpen]);

    const handlePurchaseExam = async (exam) => {
        if (!isAuthenticated) {
            toast.error('Satın almaq üçün hesabınıza daxil olun');
            navigate('/login', { state: { returnUrl: '/imtahanlar' } });
            return;
        }
        setPayingExam(exam.id);
        try {
            const { data } = await api.post('/payment/initiate-exam', { shareLink: exam.shareLink });
            if (data.alreadyPurchased) {
                setPurchasedExams(prev => new Set([...prev, exam.shareLink]));
                navigate(`/imtahan/${exam.shareLink}`);
                return;
            }
            localStorage.setItem('pendingPayriffOrderId', data.orderId);
            window.open(data.paymentUrl, '_blank', 'noopener');
            setExamPaymentWindowOpen(true);
            toast('Ödəniş pəncərəsi açıldı. Ödənişi tamamlayıb bu səhifəyə qayıdın.', { icon: '💳', duration: 6000 });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ödəniş başladıla bilmədi');
        } finally {
            setPayingExam(null);
        }
    };

    const handleAiExamGenerate = (questions, subjectName) => {
        setShowAiExamModal(false);
        navigate('/imtahanlar/yarat', {
            state: {
                type: 'free',
                subject: subjectName,
                aiQuestions: questions
            }
        });
    };

    const handleToggleDepot = async (exam) => {
        if (!isAuthenticated) { toast.error('Depoya əlavə etmək üçün hesabınıza daxil olun'); return; }
        const isSaved = savedExamLinks.has(exam.shareLink);
        setSavingLink(exam.shareLink);
        try {
            if (isSaved) {
                await api.delete(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => { const n = new Set(prev); n.delete(exam.shareLink); return n; });
                toast.success('Depodan silindi');
            } else {
                await api.post(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => new Set([...prev, exam.shareLink]));
                toast.success('Depoya əlavə edildi');
                navigate('/profil', { state: { tab: 'depot' } });
            }
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setSavingLink(null);
        }
    };

    const handleTagClick = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
        // scroll to filter panel
    };

    // ── Filtering + Sorting logic ─────────────────────────────────────────────
    const filteredExams = useMemo(() => {
        let list = [...exams];

        // Search
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (e.subjects || []).some(s => s.toLowerCase().includes(q)) ||
                (e.subject || '').toLowerCase().includes(q)
            );
        }

        if (isTeacher) {
            // Status
            if (statusFilter === 'DRAFT') list = list.filter(e => e.status === 'DRAFT');
            else if (statusFilter === 'PUBLISHED') list = list.filter(e => e.status === 'PUBLISHED');

            // Visibility
            if (visibilityFilter === 'PUBLIC') list = list.filter(e => e.visibility === 'PUBLIC');
            else if (visibilityFilter === 'PRIVATE') list = list.filter(e => e.visibility === 'PRIVATE');
        } else {
            // Price
            if (priceFilter === 'FREE') list = list.filter(e => !e.price || Number(e.price) === 0);
            else if (priceFilter === 'PAID') list = list.filter(e => e.price && Number(e.price) > 0);

            // Duration
            if (durationFilter === 'SHORT') list = list.filter(e => e.durationMinutes && e.durationMinutes < 30);
            else if (durationFilter === 'MEDIUM') list = list.filter(e => e.durationMinutes && e.durationMinutes >= 30 && e.durationMinutes <= 60);
            else if (durationFilter === 'LONG') list = list.filter(e => e.durationMinutes && e.durationMinutes > 60);
        }

        // Tag filter (OR: exam must have at least one selected tag)
        if (selectedTags.length > 0) {
            list = list.filter(e => selectedTags.some(t => (e.tags || []).includes(t)));
        }
        // Subject filter
        if (subjectFilter) {
            list = list.filter(e => (e.subjects || []).includes(subjectFilter));
        }
        // Type filter (teacher only)
        if (isTeacher && typeFilter !== 'ALL') {
            list = list.filter(e => e.examType === typeFilter);
        }

        // Sort
        if (sortBy === 'NEWEST') list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        else if (sortBy === 'OLDEST') list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        else if (sortBy === 'TITLE') list.sort((a, b) => a.title.localeCompare(b.title, 'az'));
        else if (sortBy === 'QUESTIONS') {
            const total = e => (e.questions?.length || 0) + (e.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);
            list.sort((a, b) => total(b) - total(a));
        }

        return list;
    }, [exams, search, statusFilter, visibilityFilter, priceFilter, durationFilter, sortBy, isTeacher, selectedTags, subjectFilter, typeFilter]);

    const draftExams = filteredExams.filter(e => e.status === 'DRAFT');
    const publishedExams = filteredExams.filter(e => e.status !== 'DRAFT');

    return (
        <div className="bg-gray-50/50 min-h-screen py-10">
            <Helmet>
                <title>İmtahanlar — testup.az</title>
                <meta name="description" content="testup.az platformasındakı imtahanları nəzərdən keçirin, yeni imtahan yaradın və ya mövcud imtahanlara qoşulun." />
                <link rel="canonical" href="https://testup.az/imtahanlar" />
            </Helmet>

            <div className="container-main">
                {/* ── Page header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            {isStudent ? 'İmtahanlar' : 'İmtahanlarım'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isStudent
                                ? 'Sizin üçün hazırlanmış imtahanların siyahısı'
                                : 'Yaratdığınız imtahanları idarə edin'}
                        </p>
                    </div>
                    {(isTeacher || isAdmin) && (
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
                            {(isTeacher || isAdmin) && (
                                <div className="hidden lg:flex items-center gap-8 bg-white/50 backdrop-blur-sm px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                                    {subscription ? (
                                        <>
                                            <UsageBar
                                                label="Aylıq Limit"
                                                used={subscription.usedMonthlyExams}
                                                limit={subscription.plan?.monthlyExamLimit}
                                                colorClass="bg-indigo-500"
                                            />
                                            <div className="w-px h-8 bg-gray-100" />
                                            <UsageBar
                                                label="Ümumi Limit"
                                                used={subscription.totalExamsCount}
                                                limit={subscription.plan?.maxSavedExamsLimit}
                                                colorClass="bg-emerald-500"
                                            />
                                            {subscription.endDate && (() => {
                                                const days = Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000));
                                                const urgent = days <= 7;
                                                const soon = days <= 30;
                                                return (
                                                    <>
                                                        <div className="w-px h-8 bg-gray-100" />
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{subscription.plan?.name}</p>
                                                            <p className={`text-xs font-bold ${urgent ? 'text-red-600' : soon ? 'text-amber-600' : 'text-gray-600'}`}>
                                                                {days === 0 ? 'Bu gün bitir' : `${days} gün qalır`}
                                                            </p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <div className="text-xs text-gray-400 font-medium px-4">
                                            {isTeacher ? "Aktiv abunəlik tapılmadı" : "Admin (Limitsiz icazə)"}
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setShowAiExamModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold shadow-sm transition-all text-sm whitespace-nowrap bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200 hover:-translate-y-0.5"
                            >
                                ✨ AI ilə Yarat
                            </button>
                            <button
                                onClick={() => {
                                    if (isAdmin) {
                                        setIsCreateModalOpen(true);
                                        return;
                                    }

                                    if (!subscription?.plan) {
                                        toast.error("İmtahan yaratmaq üçün aktiv abunəliyiniz olmalıdır.");
                                        return;
                                    }

                                    const mLimit = subscription?.plan?.monthlyExamLimit;
                                    const mUsed = subscription?.usedMonthlyExams || 0;
                                    if (mLimit !== -1 && mUsed >= mLimit) {
                                        toast.error(`Aylıq imtahan yaratma limitiniz (${mLimit}) dolub. Zəhmət olmasa planınızı yeniləyin.`);
                                        return;
                                    }

                                    const tLimit = subscription?.plan?.maxSavedExamsLimit;
                                    const tUsed = subscription?.totalExamsCount || 0;
                                    if (tLimit !== -1 && tUsed >= tLimit) {
                                        toast.error(`Maksimum yadda saxlanıla bilən imtahan limitini (${tLimit}) aşmısınız. Yeni yaratmaq üçün bəzi köhnə imtahanları silməlisiniz.`);
                                        return;
                                    }

                                    setIsCreateModalOpen(true);
                                }}
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md transition-all text-sm whitespace-nowrap ${
                                    !isAdmin && (
                                        !subscription?.plan ||
                                        (subscription?.plan?.monthlyExamLimit !== -1 && (subscription?.usedMonthlyExams || 0) >= subscription?.plan?.monthlyExamLimit) ||
                                        (subscription?.plan?.maxSavedExamsLimit !== -1 && (subscription?.totalExamsCount || 0) >= subscription?.plan?.maxSavedExamsLimit)
                                    )
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/60 hover:-translate-y-0.5'
                                }`}
                            >
                                {!isAdmin && (
                                    !subscription?.plan ||
                                    (subscription?.plan?.monthlyExamLimit !== -1 && (subscription?.usedMonthlyExams || 0) >= subscription?.plan?.monthlyExamLimit) ||
                                    (subscription?.plan?.maxSavedExamsLimit !== -1 && (subscription?.totalExamsCount || 0) >= subscription?.plan?.maxSavedExamsLimit)
                                )
                                    ? <HiOutlineLockClosed className="w-5 h-5" />
                                    : <HiOutlinePlusCircle className="w-5 h-5" />
                                }
                                Yeni İmtahan
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Usage Info */}
                {(isTeacher || isAdmin) && (
                    <div className="lg:hidden mb-6 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        {subscription ? (
                            <div className="grid grid-cols-2 gap-4">
                                <UsageBar
                                    label="Aylıq"
                                    used={subscription.usedMonthlyExams}
                                    limit={subscription.plan?.monthlyExamLimit}
                                    colorClass="bg-indigo-500"
                                />
                                <UsageBar
                                    label="Ümumi"
                                    used={subscription.totalExamsCount}
                                    limit={subscription.plan?.maxSavedExamsLimit}
                                    colorClass="bg-emerald-500"
                                />
                            </div>
                        ) : (
                            <div className="text-xs text-center text-gray-400 font-medium">
                                {isTeacher ? "Aktiv abunəlik tapılmadı" : "Admin (Limitsiz)"}
                            </div>
                        )}
                    </div>
                )}


                {/* ── Collaborative banner (Teacher only) ── */}
                {isTeacher && collaborativeAssignments.filter(a => a.status !== 'APPROVED').length > 0 && (() => {
                    const active = collaborativeAssignments.filter(a => a.status !== 'APPROVED');
                    const rejected = active.filter(a => a.status === 'REJECTED').length;
                    const submitted = active.filter(a => a.status === 'SUBMITTED').length;
                    return (
                        <Link
                            to="/birge-imtahanlari"
                            className="mb-6 flex items-center justify-between gap-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl shadow-md shadow-indigo-200 transition-all group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                                    <HiOutlineUserGroup className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm">Birgə İmtahanlarım</p>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        {active.length} aktiv tapşırıq
                                        {rejected > 0 && <span className="ml-2 text-red-300 font-semibold">· {rejected} geri qaytarıldı</span>}
                                        {submitted > 0 && <span className="ml-2 text-amber-200 font-semibold">· {submitted} admin yoxlayır</span>}
                                    </p>
                                </div>
                            </div>
                            <HiOutlinePaperAirplane className="w-5 h-5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity rotate-90" />
                        </Link>
                    );
                })()}

                {/* ── Filter panel ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
                    {/* Row 1: Search + Sort */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
                            <HiOutlineSearch className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                placeholder={isTeacher ? 'Ad, tag, fənn ilə axtar...' : 'İmtahan adı, fənn, tag...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <HiOutlineAdjustments className="w-4 h-4 text-gray-400" />
                            <FilterSelect
                                value={sortBy}
                                onChange={setSortBy}
                                options={[
                                    { value: 'NEWEST', label: 'Ən yeni' },
                                    { value: 'OLDEST', label: 'Ən köhnə' },
                                    { value: 'TITLE', label: 'Ad (A-Z)' },
                                    { value: 'QUESTIONS', label: 'Sual sayı' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Row 2: Status/visibility pills + Subject dropdown + Type filter (teacher) OR Price/Duration + Subject (student) */}
                    {isTeacher ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
                                <HiOutlineFilter className="w-3.5 h-3.5" /> Status:
                            </span>
                            <Pill label="Hamısı" active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
                            <Pill label="Qaralama" active={statusFilter === 'DRAFT'} onClick={() => setStatusFilter('DRAFT')} />
                            <Pill label="Yayımlanmış" active={statusFilter === 'PUBLISHED'} onClick={() => setStatusFilter('PUBLISHED')} />

                            <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

                            <Pill label="Hər görünürlük" active={visibilityFilter === 'ALL'} onClick={() => setVisibilityFilter('ALL')} />
                            <Pill label="Açıq" active={visibilityFilter === 'PUBLIC'} onClick={() => setVisibilityFilter('PUBLIC')} />
                            <Pill label="Gizli" active={visibilityFilter === 'PRIVATE'} onClick={() => setVisibilityFilter('PRIVATE')} />

                            {allSubjects.length > 0 && <>
                                <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                                <FilterSelect value={subjectFilter} onChange={setSubjectFilter} options={[
                                    { value: '', label: 'Bütün fənnlər' },
                                    ...allSubjects.map(s => ({ value: s, label: s }))
                                ]} />
                            </>}

                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                                    <HiOutlineX className="w-3.5 h-3.5" /> Təmizlə ({activeFilterCount})
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
                                <HiOutlineFilter className="w-3.5 h-3.5" /> Filter:
                            </span>
                            {/* Price */}
                            <Pill label="Hamısı" active={priceFilter === 'ALL'} onClick={() => setPriceFilter('ALL')} />
                            <Pill label="Pulsuz" active={priceFilter === 'FREE'} onClick={() => setPriceFilter('FREE')} />
                            <Pill label="Ödənişli" active={priceFilter === 'PAID'} onClick={() => setPriceFilter('PAID')} />
                            <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                            {/* Duration */}
                            <Pill label="İstənilən vaxt" active={durationFilter === 'ALL'} onClick={() => setDurationFilter('ALL')} />
                            <Pill label="<30 dəq" active={durationFilter === 'SHORT'} onClick={() => setDurationFilter('SHORT')} />
                            <Pill label="30–60 dəq" active={durationFilter === 'MEDIUM'} onClick={() => setDurationFilter('MEDIUM')} />
                            <Pill label=">60 dəq" active={durationFilter === 'LONG'} onClick={() => setDurationFilter('LONG')} />

                            {allSubjects.length > 0 && <>
                                <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                                <FilterSelect value={subjectFilter} onChange={setSubjectFilter} options={[
                                    { value: '', label: 'Bütün fənnlər' },
                                    ...allSubjects.map(s => ({ value: s, label: s }))
                                ]} />
                            </>}

                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                                    <HiOutlineX className="w-3.5 h-3.5" /> Təmizlə ({activeFilterCount})
                                </button>
                            )}
                        </div>
                    )}

                    {/* Row 3: Tag filter (only if tags exist) */}
                    {allTags.length > 0 && (
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-gray-400 shrink-0 pt-1.5 flex items-center gap-1">
                                <HiOutlineTag className="w-3.5 h-3.5" /> Teqlər:
                            </span>
                            <div className="flex flex-wrap gap-1.5 flex-1">
                                {allTags.map(([tag, count]) => {
                                    const active = selectedTags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTags(prev =>
                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                            )}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                                active
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                            }`}
                                        >
                                            #{tag}
                                            <span className={`text-[10px] ${active ? 'text-indigo-200' : 'text-gray-400'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Results count + active tag badges ── */}
                {!loading && (
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                        <p className="text-xs text-gray-400">
                            {filteredExams.length} imtahan tapıldı
                            {activeFilterCount > 0 && <span className="text-indigo-500 font-semibold"> · {activeFilterCount} filter aktiv</span>}
                        </p>
                        {selectedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full hover:bg-indigo-200 transition-colors"
                            >
                                #{tag} <HiOutlineX className="w-3 h-3" />
                            </button>
                        ))}
                        {subjectFilter && (
                            <button
                                onClick={() => setSubjectFilter('')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full hover:bg-green-200 transition-colors"
                            >
                                {subjectFilter} <HiOutlineX className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <>
                        {/* Student view */}
                        {isStudent ? (
                            filteredExams.length === 0 ? (
                                <EmptyState activeFilterCount={activeFilterCount} onClear={clearFilters} isStudent />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredExams.map(exam => {
                                        const isSaved = savedExamLinks.has(exam.shareLink);
                                        const isPaid = exam.price != null && Number(exam.price) > 0;
                                        const isPurchased = isPaid && purchasedExams.has(exam.shareLink);
                                        const subjectName = (exam.subjects || []).join(', ') || exam.subject || '';
                                        const canStart = !isPaid || isPurchased;
                                        return (
                                            <div key={exam.id} onClick={() => canStart && handleJoinExam(exam)} className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden ${canStart ? 'cursor-pointer' : 'cursor-default'}`}>
                                                <div className={`h-1 w-full ${isPurchased ? 'bg-green-500' : isPaid ? 'bg-amber-400' : 'bg-indigo-500'}`} />
                                                <div className="p-5 flex flex-col flex-1">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        {subjectName && (
                                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0 truncate max-w-[160px]">
                                                                {subjectName}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleToggleDepot(exam); }}

                                                            disabled={savingLink === exam.shareLink}
                                                            title={isSaved ? 'Depodan çıxar' : 'Depoya əlavə et'}
                                                            className={`p-1.5 rounded-xl transition-all disabled:opacity-50 shrink-0 ml-auto ${isSaved ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                                        >
                                                            {savingLink === exam.shareLink
                                                                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                : isSaved ? <HiBookmark className="w-4 h-4" /> : <HiOutlineBookmark className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                        {exam.title}
                                                    </h3>
                                                    {exam.description && (
                                                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{exam.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto mb-4">
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineQuestionMarkCircle className="w-3.5 h-3.5" />
                                                            {(exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0)} sual
                                                        </span>
                                                        {exam.durationMinutes && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                                {exam.durationMinutes} dəq
                                                            </span>
                                                        )}
                                                        {exam.visibility === 'PRIVATE' && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineLockClosed className="w-3.5 h-3.5" /> Gizli
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                                                        {isPurchased ? (
                                                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">Alınıb</span>
                                                        ) : isPaid ? (
                                                            <span className="text-sm font-black text-amber-600">{Number(exam.price).toFixed(2)} ₼</span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">Pulsuz</span>
                                                        )}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); isPurchased ? handleJoinExam(exam) : isPaid ? handlePurchaseExam(exam) : handleJoinExam(exam); }}
                                                            disabled={payingExam === exam.id}
                                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 ${isPurchased ? 'bg-green-600 hover:bg-green-700 text-white' : isPaid ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                                        >
                                                            {payingExam === exam.id
                                                                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                : isPurchased ? 'İmtahana Başla' : isPaid ? '💳 Satın al' : 'Başla'}
                                                            {payingExam !== exam.id && <HiOutlineArrowRight className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            /* Teacher / Admin view */
                            filteredExams.length === 0 ? (
                                <EmptyState activeFilterCount={activeFilterCount} onClear={clearFilters} />
                            ) : (
                                <>
                                    {/* Show by status groups only when no status filter active */}
                                    {statusFilter === 'ALL' && draftExams.length > 0 && publishedExams.length > 0 ? (
                                        <>
                                            <SectionHeader icon={HiOutlineDocumentText} label="Qaralamalar" count={draftExams.length} />
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                                                {draftExams.map(exam => (
                                                    <ExamCard
                                                        key={exam.id}
                                                        exam={normalizeExam(exam)}
                                                        onDelete={handleDelete}
                                                        onClone={handleClone}
                                                        onDownloadPdf={handleDownloadPdf}
                                                        canEdit={hasPermission('examEditing')}
                                                        canDownloadPdf={hasPermission('downloadAsPdf')}
                                                        onTagClick={handleTagClick}
                                                    />
                                                ))}

                                            </div>
                                            <SectionHeader icon={HiOutlineDocumentText} label="Yayımlanmış" count={publishedExams.length} />
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {publishedExams.map(exam => (
                                                    <ExamCard
                                                        key={exam.id}
                                                        exam={normalizeExam(exam)}
                                                        onDelete={handleDelete}
                                                        onClone={handleClone}
                                                        onShare={handleShare}
                                                        onToggleStatus={handleToggleStatus}
                                                        onDownloadPdf={handleDownloadPdf}
                                                        canEdit={hasPermission('examEditing')}
                                                        canDownloadPdf={hasPermission('downloadAsPdf')}
                                                        onTagClick={handleTagClick}
                                                    />
                                                ))}

                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredExams.map(exam => (
                                                <ExamCard
                                                    key={exam.id}
                                                    exam={normalizeExam(exam)}
                                                    onDelete={handleDelete}
                                                    onClone={handleClone}
                                                    onShare={exam.status !== 'DRAFT' ? handleShare : undefined}
                                                    onToggleStatus={exam.status !== 'DRAFT' ? handleToggleStatus : undefined}
                                                    canEdit={hasPermission('examEditing')}
                                                    onTagClick={handleTagClick}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </>
                )}
            </div>

            <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            {showAiExamModal && (
                <AiExamModal
                    onClose={() => setShowAiExamModal(false)}
                    onGenerate={handleAiExamGenerate}
                />
            )}
        </div>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeExam = (exam) => ({
    ...exam,
    subjects: exam.subjects || [],
    tags: exam.tags || [],
    duration: exam.durationMinutes,
    questionCount: (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0),
});

const SectionHeader = ({ icon: Icon, label, count }) => (
    <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
        <Icon className="w-4 h-4" />
        {label}
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
    </h2>
);

const EmptyState = ({ activeFilterCount, onClear, isStudent }) => (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineDocumentText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
            {activeFilterCount > 0 ? 'Filterlərə uyğun imtahan tapılmadı' : 'Hələ imtahan yoxdur'}
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {activeFilterCount > 0
                ? 'Filter şərtlərini dəyişərək yenidən yoxlayın.'
                : isStudent ? 'Admin hələ heç bir imtahan yerləşdirməyib.' : 'İlk imtahanınızı yaratmaqla başlayın.'}
        </p>
        {activeFilterCount > 0 && (
            <button onClick={onClear} className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                Filterləri təmizlə
            </button>
        )}
    </div>
);

export default ExamList;
