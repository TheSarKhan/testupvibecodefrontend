import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineArrowLeft, HiOutlineClock, HiOutlineQuestionMarkCircle,
    HiOutlineBookOpen, HiOutlineUser, HiOutlineLockClosed,
    HiOutlineBookmark, HiBookmark, HiOutlineShare,
    HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineTag,
    HiOutlineCurrencyDollar, HiOutlineAcademicCap, HiOutlineCalendar,
    HiOutlineStar, HiOutlineSparkles, HiOutlineDocumentText,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className={`p-3 rounded-xl shrink-0 ${accent}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
            <p className="text-lg font-extrabold text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

// ── Subject row ──────────────────────────────────────────────────────────────
const SubjectRow = ({ name, questionCount, points, total, color }) => {
    const percent = total > 0 ? Math.round((questionCount / total) * 100) : 0;
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <HiOutlineBookOpen className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-gray-800 truncate">{name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="font-semibold text-gray-600">{questionCount} sual</span>
                    {points > 0 && (
                        <span className="font-semibold text-indigo-600">{points} bal</span>
                    )}
                </div>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color.replace('bg-', 'bg-').replace('-50', '-400').replace('text-', '')} transition-all`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

const SUBJECT_COLORS = [
    'bg-indigo-50 text-indigo-600',
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-600',
    'bg-rose-50 text-rose-600',
    'bg-sky-50 text-sky-600',
    'bg-violet-50 text-violet-600',
    'bg-teal-50 text-teal-600',
    'bg-orange-50 text-orange-600',
];

// ── Main ─────────────────────────────────────────────────────────────────────
const ExamDetail = () => {
    const { shareLink } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isStudent } = useAuth();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/exams/${shareLink}`);
                if (cancelled) return;
                setExam(data);

                const isFree = data.price == null || Number(data.price) === 0;
                if (isFree) {
                    setHasPurchased(true);
                } else if (isAuthenticated) {
                    try {
                        const status = await api.get(`/exams/${data.shareLink}/my-status`);
                        if (!cancelled) setHasPurchased(status.data.hasUnusedPurchase);
                    } catch {}
                }

                if (isAuthenticated) {
                    try {
                        const depot = await api.get('/depot');
                        if (!cancelled) {
                            setIsSaved(depot.data.some(e => e.shareLink === data.shareLink));
                        }
                    } catch {}
                }
            } catch (err) {
                toast.error('İmtahan tapılmadı və ya aktiv deyil');
                navigate('/imtahanlar');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [shareLink, isAuthenticated]);

    // ── Derived data ────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (!exam) return null;
        const standalone = exam.questions || [];
        const passageQs = (exam.passages || []).flatMap(p => p.questions || []);
        const all = [...standalone, ...passageQs];
        const totalQuestions = all.length;
        const totalPoints = all.reduce((s, q) => s + (Number(q.points) || 0), 0);
        const totalPassages = (exam.passages || []).length;

        const bySubject = {};
        all.forEach(q => {
            const subj = q.subjectGroup || (exam.subjects?.[0]) || 'Ümumi';
            if (!bySubject[subj]) bySubject[subj] = { name: subj, questionCount: 0, points: 0 };
            bySubject[subj].questionCount += 1;
            bySubject[subj].points += Number(q.points) || 0;
        });
        (exam.subjects || []).forEach(s => {
            if (!bySubject[s]) bySubject[s] = { name: s, questionCount: 0, points: 0 };
        });
        const subjectBreakdown = Object.values(bySubject).sort((a, b) => b.questionCount - a.questionCount);

        return { totalQuestions, totalPoints, totalPassages, subjectBreakdown };
    }, [exam]);

    const isPaid = exam?.price != null && Number(exam.price) > 0;
    const isPrivate = exam?.visibility === 'PRIVATE';
    const isInactive = exam?.status === 'DRAFT' || exam?.status === 'CANCELLED';

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleStart = () => {
        navigate(`/imtahan/${shareLink}`);
    };

    const handleToggleSave = async () => {
        if (!isAuthenticated) {
            toast.error('Depoya əlavə etmək üçün hesabınıza daxil olun');
            return;
        }
        setSaving(true);
        try {
            if (isSaved) {
                await api.delete(`/depot/${shareLink}`);
                setIsSaved(false);
                toast.success('Depodan silindi');
            } else {
                await api.post(`/depot/${shareLink}`);
                setIsSaved(true);
                toast.success('Depoya əlavə edildi');
            }
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        } finally {
            setSaving(false);
        }
    };

    const handleShare = () => {
        const link = `${window.location.origin}/imtahanlar/melumat/${shareLink}`;
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
        toast.success('Link kopyalandı');
    };

    // ── Render ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!exam) return null;

    const subjectChips = exam.subjects?.filter(Boolean) || [];
    const tags = exam.tags || [];
    const avgRating = exam.averageRating ? Math.round(exam.averageRating * 10) / 10 : null;
    const ratingCount = exam.ratingCount || 0;

    const canStart = !isPaid || hasPurchased;
    const ctaLabel = isInactive
        ? 'İmtahan bağlıdır'
        : isPaid && !hasPurchased
            ? `Satın al · ${Number(exam.price).toFixed(2)} ₼`
            : 'İmtahana başla';

    return (
        <div className="bg-gradient-to-b from-indigo-50/40 via-gray-50/30 to-gray-50 min-h-screen pb-16">
            <Helmet>
                <title>{exam.title} — testup.az</title>
                <meta name="description" content={(exam.description || `${exam.title} imtahanı haqqında ətraflı məlumat`).slice(0, 160)} />
                <link rel="canonical" href={`https://testup.az/imtahanlar/melumat/${shareLink}`} />
            </Helmet>

            {/* ── Top bar ── */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="container-main py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5" />
                        Geri qayıt
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                            title="Paylaş"
                        >
                            <HiOutlineShare className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleToggleSave}
                            disabled={saving}
                            className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
                                isSaved
                                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
                            }`}
                            title={isSaved ? 'Depodan çıxar' : 'Depoya əlavə et'}
                        >
                            {saving
                                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : isSaved ? <HiBookmark className="w-5 h-5" /> : <HiOutlineBookmark className="w-5 h-5" />
                            }
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main pt-8">
                {/* ── Hero ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                    {/* Accent strip */}
                    <div className={`h-1.5 w-full ${isPaid ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`} />

                    <div className="p-6 md:p-10">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                {/* Subject + status badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {subjectChips.slice(0, 4).map((s, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full"
                                        >
                                            <HiOutlineBookOpen className="w-3.5 h-3.5" />
                                            {s}
                                        </span>
                                    ))}
                                    {subjectChips.length > 4 && (
                                        <span className="text-xs font-semibold text-gray-400">
                                            +{subjectChips.length - 4} fənn
                                        </span>
                                    )}
                                    {isPrivate && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                            <HiOutlineLockClosed className="w-3.5 h-3.5" /> Gizli
                                        </span>
                                    )}
                                    {isInactive && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                                            {exam.status === 'DRAFT' ? 'Qaralama' : 'Bağlı'}
                                        </span>
                                    )}
                                    {isPaid && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                                            <HiOutlineCurrencyDollar className="w-3.5 h-3.5" />
                                            {Number(exam.price).toFixed(2)} ₼
                                        </span>
                                    )}
                                    {!isPaid && !isInactive && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Pulsuz
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                                    {exam.title}
                                </h1>

                                {/* Teacher + rating */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    {exam.teacherName && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <HiOutlineUser className="w-4 h-4" />
                                            <span className="font-semibold text-gray-700">{exam.teacherName}</span>
                                        </span>
                                    )}
                                    {avgRating !== null && (
                                        <span className="inline-flex items-center gap-1">
                                            <HiOutlineStar className="w-4 h-4 text-yellow-500" />
                                            <span className="font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                                            {ratingCount > 0 && (
                                                <span className="text-gray-400">({ratingCount} rəy)</span>
                                            )}
                                        </span>
                                    )}
                                    {exam.createdAt && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <HiOutlineCalendar className="w-4 h-4" />
                                            {new Date(exam.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col gap-2 md:items-end shrink-0">
                                <button
                                    onClick={handleStart}
                                    disabled={isInactive}
                                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all whitespace-nowrap ${
                                        isInactive
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : isPaid && !hasPurchased
                                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/60 hover:-translate-y-0.5'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/60 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {ctaLabel}
                                    {!isInactive && <HiOutlineArrowRight className="w-4 h-4" />}
                                </button>
                                {hasPurchased && isPaid && (
                                    <span className="text-xs font-bold text-green-700 text-center md:text-right">
                                        ✓ Bu imtahan sizə aiddir
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={HiOutlineClock}
                        label="Müddət"
                        value={exam.durationMinutes ? `${exam.durationMinutes} dəq` : 'Sərbəst'}
                        accent="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={HiOutlineQuestionMarkCircle}
                        label="Sual sayı"
                        value={`${stats.totalQuestions}`}
                        accent="bg-indigo-50 text-indigo-600"
                    />
                    <StatCard
                        icon={HiOutlineAcademicCap}
                        label="Ümumi bal"
                        value={stats.totalPoints > 0 ? `${stats.totalPoints}` : '—'}
                        accent="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                        icon={HiOutlineBookOpen}
                        label="Fənn sayı"
                        value={`${subjectChips.length || stats.subjectBreakdown.length}`}
                        accent="bg-violet-50 text-violet-600"
                    />
                </div>

                {/* ── Two-column body ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Description + Subjects */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-4">
                                <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
                                İmtahan haqqında
                            </h2>
                            {exam.description ? (
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {exam.description}
                                </p>
                            ) : (
                                <p className="text-gray-400 italic text-sm">
                                    Bu imtahan üçün təsvir əlavə edilməyib.
                                </p>
                            )}
                        </section>

                        {/* Subjects breakdown */}
                        {stats.subjectBreakdown.length > 0 && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-1">
                                    <HiOutlineBookOpen className="w-5 h-5 text-indigo-600" />
                                    Daxili fənnlər
                                </h2>
                                <p className="text-sm text-gray-400 mb-5">
                                    Hər fənn üzrə sual və bal bölgüsü
                                </p>
                                <div className="space-y-3">
                                    {stats.subjectBreakdown.map((subj, i) => (
                                        <SubjectRow
                                            key={subj.name}
                                            name={subj.name}
                                            questionCount={subj.questionCount}
                                            points={subj.points}
                                            total={stats.totalQuestions}
                                            color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                                        />
                                    ))}
                                </div>
                                {stats.totalPassages > 0 && (
                                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                                        <HiOutlineSparkles className="w-3.5 h-3.5" />
                                        İmtahanda {stats.totalPassages} oxu mətni də mövcuddur
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-4">
                                    <HiOutlineTag className="w-5 h-5 text-indigo-600" />
                                    Teqlər
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((t, i) => (
                                        <Link
                                            key={i}
                                            to={`/imtahanlar?tag=${encodeURIComponent(t)}`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 text-xs font-semibold rounded-full transition-colors"
                                        >
                                            #{t}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right: Info aside */}
                    <aside className="space-y-6">
                        {/* Quick info card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
                                Qısa məlumat
                            </h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Format</dt>
                                    <dd className="font-semibold text-gray-800">
                                        {exam.examType === 'TEMPLATE' ? 'Şablon' : 'Sərbəst'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Görünürlük</dt>
                                    <dd className="font-semibold text-gray-800">
                                        {isPrivate ? 'Gizli (kod tələb olunur)' : 'Açıq'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Qiymət</dt>
                                    <dd className={`font-semibold ${isPaid ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {isPaid ? `${Number(exam.price).toFixed(2)} ₼` : 'Pulsuz'}
                                    </dd>
                                </div>
                                {exam.durationMinutes > 0 && (
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="text-gray-500">Müddət</dt>
                                        <dd className="font-semibold text-gray-800">{exam.durationMinutes} dəqiqə</dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-gray-500">Suallar</dt>
                                    <dd className="font-semibold text-gray-800">{stats.totalQuestions} ədəd</dd>
                                </div>
                                {stats.totalPoints > 0 && (
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="text-gray-500">Ümumi bal</dt>
                                        <dd className="font-semibold text-gray-800">{stats.totalPoints}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Teacher card */}
                        {exam.teacherName && (
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-md p-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Müəllim</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center font-extrabold text-lg shrink-0">
                                        {(exam.teacherName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold leading-tight truncate">{exam.teacherName}</p>
                                        <p className="text-xs opacity-80">İmtahan müəllifi</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mobile-friendly bottom CTA */}
                        <button
                            onClick={handleStart}
                            disabled={isInactive}
                            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all ${
                                isInactive
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : isPaid && !hasPurchased
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        >
                            {ctaLabel}
                            {!isInactive && <HiOutlineArrowRight className="w-4 h-4" />}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ExamDetail;
