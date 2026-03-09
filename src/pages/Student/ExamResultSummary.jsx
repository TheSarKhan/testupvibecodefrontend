import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

const ExamResultSummary = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get submission data passed from ExamSession via navigation state
    // This avoids making an authenticated API call which breaks guest users
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

    const getScoreColor = (pct) => {
        if (pct >= 80) return 'text-green-500';
        if (pct >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center items-center py-12 px-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Top Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-4 text-5xl">
                        🎉
                    </div>
                    <h1 className="text-2xl font-bold">Təbrik edirik!</h1>
                    <p className="mt-1 text-indigo-100">İmtahanı uğurla bitirdiniz</p>
                </div>

                {/* Score */}
                <div className="p-8 text-center border-b border-gray-100">
                    <p className="text-gray-500 text-sm mb-2 font-medium uppercase tracking-wide">
                        {submission?.examTitle || 'İmtahan'}
                    </p>

                    {scorePercent !== null ? (
                        <>
                            <p className={`text-7xl font-black ${getScoreColor(scorePercent)}`}>
                                {scorePercent}%
                            </p>
                            <p className="text-gray-600 mt-2 text-lg">
                                <strong>{submission.totalScore?.toFixed(1)}</strong> / {submission.maxScore} bal
                            </p>
                            <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-sm font-medium ${
                                submission.isFullyGraded
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {submission.isFullyGraded
                                    ? '✓ Tam Yoxlanılıb'
                                    : '⏳ Açıq suallar müəllim tərəfindən yoxlanılacaq'}
                            </span>
                        </>
                    ) : (
                        <p className="text-gray-500 text-lg mt-4">
                            Nəticəniz hazırlandıqdan sonra profilinizə əlavə olunacaq.
                        </p>
                    )}
                </div>

                {/* Rating */}
                <div className="p-8 text-center border-b border-gray-100">
                    <p className="font-semibold text-gray-800 mb-1">Bu imtahanı qiymətləndirin</p>
                    <p className="text-sm text-gray-400 mb-5">Müəllimə rəy bildirin</p>
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
