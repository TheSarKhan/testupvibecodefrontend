import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineEye } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StarRating = ({ value, onChange }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                    <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
};

const DonutChart = ({ percent, color }) => {
    const r = 70;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (circumference * percent) / 100;

    const colorMap = {
        green: { stroke: '#22c55e', text: 'text-green-600', bg: 'from-green-50 to-emerald-50' },
        yellow: { stroke: '#eab308', text: 'text-yellow-600', bg: 'from-yellow-50 to-amber-50' },
        red: { stroke: '#ef4444', text: 'text-red-600', bg: 'from-red-50 to-rose-50' },
    };
    const c = colorMap[color] || colorMap.green;

    return (
        <div className="relative inline-flex">
            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={r} stroke="#f3f4f6" strokeWidth="14" fill="transparent" />
                <circle
                    cx="80" cy="80" r={r}
                    stroke={c.stroke}
                    strokeWidth="14"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${c.text}`}>{percent}%</span>
                <span className="text-xs text-gray-400 font-medium mt-0.5">nəticə</span>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, colorClass }) => (
    <div className={`bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100`}>
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-base font-bold text-gray-800">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    </div>
);

const ExamResultSummary = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const submission = location.state?.submission || null;

    const [rating, setRating] = useState(0);
    const [rated, setRated] = useState(false);
    const [isRating, setIsRating] = useState(false);

    const handleRate = async (starValue) => {
        setRating(starValue);
        setIsRating(true);
        try {
            await api.post(`/submissions/${sessionId}/rate`, null, { params: { rating: starValue } });
            setRated(true);
            toast.success('Reytinqiniz qeydə alındı!');
        } catch {
            toast.error('Reytinq saxlanılarkən xəta baş verdi');
        } finally {
            setIsRating(false);
        }
    };

    const scorePercent = submission?.maxScore > 0
        ? Math.round((submission.totalScore / submission.maxScore) * 100)
        : null;

    const getColor = (pct) => {
        if (pct >= 80) return 'green';
        if (pct >= 50) return 'yellow';
        return 'red';
    };

    const getBadge = (pct) => {
        if (pct >= 90) return { label: 'Əla', bg: 'bg-green-100 text-green-700' };
        if (pct >= 75) return { label: 'Yaxşı', bg: 'bg-blue-100 text-blue-700' };
        if (pct >= 50) return { label: 'Kafi', bg: 'bg-yellow-100 text-yellow-700' };
        return { label: 'Zəif', bg: 'bg-red-100 text-red-700' };
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds <= 0) return null;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s} saniyə`;
        return s > 0 ? `${m} dəq ${s} san` : `${m} dəqiqə`;
    };

    const timeTaken = (() => {
        if (!submission?.startedAt || !submission?.submittedAt) return null;
        const diffSec = Math.round(
            (new Date(submission.submittedAt) - new Date(submission.startedAt)) / 1000
        );
        return formatDuration(diffSec);
    })();

    const badge = scorePercent !== null ? getBadge(scorePercent) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center items-center py-12 px-4">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Top Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 pt-8 pb-6 text-white text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3 text-3xl">
                        🎉
                    </div>
                    <h1 className="text-2xl font-bold">Təbrik edirik!</h1>
                    <p className="mt-1 text-indigo-100 text-sm">
                        {submission?.examTitle || 'İmtahan'} bitdi
                    </p>
                </div>

                {/* Donut Chart + Score */}
                <div className="px-8 py-8 flex flex-col items-center border-b border-gray-100">
                    {scorePercent !== null ? (
                        <>
                            <DonutChart percent={scorePercent} color={getColor(scorePercent)} />

                            <div className="mt-4 text-center">
                                <p className="text-gray-700 text-lg font-semibold">
                                    <span className="font-black text-gray-900">{submission.totalScore?.toFixed(1)}</span>
                                    <span className="text-gray-400"> / </span>
                                    <span>{submission.maxScore} bal</span>
                                </p>
                                <div className="mt-3 flex items-center gap-2 justify-center flex-wrap">
                                    {badge && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg}`}>
                                            {badge.label}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        submission.isFullyGraded
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {submission.isFullyGraded
                                            ? '✓ Tam Yoxlanılıb'
                                            : '⏳ Açıq suallar gözləyir'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-6 text-center">
                            <p className="text-5xl mb-4">📋</p>
                            <p className="text-gray-600 font-medium">
                                Nəticəniz müəllim tərəfindən yoxlandıqdan sonra profilinizə əlavə olunacaq.
                            </p>
                        </div>
                    )}
                </div>

                {/* Stat Cards */}
                {(timeTaken || submission?.durationMinutes) && (
                    <div className="px-8 py-6 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            {timeTaken && (
                                <StatCard
                                    icon={<HiOutlineClock className="w-5 h-5 text-indigo-600" />}
                                    label="Sərf Edilən Vaxt"
                                    value={timeTaken}
                                    colorClass="bg-indigo-50"
                                />
                            )}
                            {submission?.durationMinutes && (
                                <StatCard
                                    icon={<HiOutlineDocumentText className="w-5 h-5 text-purple-600" />}
                                    label="Ayrılan Vaxt"
                                    value={`${submission.durationMinutes} dəqiqə`}
                                    colorClass="bg-purple-50"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* View Answers Button */}
                <div className="px-8 pt-6 pb-2">
                    <button
                        onClick={() => navigate(`/test/review/${sessionId}`)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-semibold transition-colors"
                    >
                        <HiOutlineEye className="w-5 h-5" />
                        Cavablarıma Bax
                    </button>
                </div>

                {/* Rating */}
                <div className="px-8 py-6 text-center border-b border-gray-100">
                    <p className="font-semibold text-gray-800 mb-1">Bu imtahanı qiymətləndirin</p>
                    <p className="text-sm text-gray-400 mb-4">Müəllimə rəy bildirin</p>
                    {rated ? (
                        <div>
                            <p className="text-yellow-400 text-3xl mb-1">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</p>
                            <p className="text-sm text-green-600 font-medium">Reytinqiniz qeydə alındı, sağ olun!</p>
                        </div>
                    ) : (
                        <StarRating value={rating} onChange={handleRate} />
                    )}
                    {isRating && <p className="text-sm text-gray-400 mt-2">Göndərilir...</p>}
                </div>

                {/* Navigation Buttons */}
                <div className="px-8 py-6 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="py-3 px-4 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Ana Səhifə
                    </button>
                    <button
                        onClick={() => navigate('/profil')}
                        className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Profilimə Bax
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExamResultSummary;
