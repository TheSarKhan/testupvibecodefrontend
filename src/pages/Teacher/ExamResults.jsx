import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineStar, HiOutlineUsers, HiOutlineTrendingUp, HiOutlineCheckCircle } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StarDisplay = ({ value }) => {
    const fullStars = Math.round(value || 0);
    return (
        <span className="text-yellow-400 text-lg tracking-tight">
            {'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}
        </span>
    );
};

const ExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [submissions, setSubmissions] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [subsRes, statsRes] = await Promise.all([
                    api.get(`/submissions/exam/${examId}`),
                    api.get(`/submissions/exam/${examId}/statistics`)
                ]);
                setSubmissions(subsRes.data);
                setStatistics(statsRes.data);
            } catch (error) {
                toast.error("Məlumatlar yüklənərkən xəta baş verdi");
                navigate('/imtahanlar');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [examId]);

    const formatDuration = (startedAt, submittedAt) => {
        if (!startedAt || !submittedAt) return '–';
        const diffSec = Math.abs(new Date(submittedAt) - new Date(startedAt)) / 1000;
        const m = Math.floor(diffSec / 60);
        const s = Math.floor(diffSec % 60);
        return `${m}dk ${s}sn`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/imtahanlar/${examId}`)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{statistics?.examTitle || 'İmtahan Nəticələri'}</h1>
                        <p className="text-xs text-gray-500">İmtahan ID: {examId}</p>
                    </div>
                </div>
            </div>

            <div className="container-main mt-8 space-y-8">
                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total participants */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><HiOutlineUsers className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">İştirakçılar</p>
                                <p className="text-2xl font-black text-gray-900">{statistics.totalParticipants}</p>
                            </div>
                        </div>
                        {/* Average score */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><HiOutlineTrendingUp className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Bal</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {statistics.averageScore?.toFixed(1)} <span className="text-gray-400 text-sm font-normal">/ {statistics.maximumScore}</span>
                                </p>
                            </div>
                        </div>
                        {/* Average time */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><HiOutlineClock className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Vaxt</p>
                                <p className="text-2xl font-black text-gray-900">{statistics.averageDurationMinutes}dk</p>
                            </div>
                        </div>
                        {/* Average rating */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><HiOutlineStar className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Reytinq</p>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : '–'}</p>
                                    {statistics.averageRating > 0 && <StarDisplay value={statistics.averageRating} />}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Students Podium */}
                {statistics?.topStudents?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            🏆 Ən Yaxşı Şagirdlər
                        </h2>
                        <div className="space-y-3">
                            {statistics.topStudents.map((student, idx) => (
                                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl ${idx === 0 ? 'bg-yellow-50 border border-yellow-100' : idx === 1 ? 'bg-gray-50 border border-gray-100' : 'bg-orange-50 border border-orange-100'}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-500' : 'text-orange-500'}`}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                        <p className="text-xs text-gray-500">Vaxt: {student.timeSpent}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-indigo-600 text-xl">{student.score}</p>
                                        <p className="text-xs text-gray-400">bal</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Full Participant Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Bütün İştirakçılar</h2>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Hələ heç bir iştirakçı bu imtahanı verməyib.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                                            <th className="p-4 py-3 font-semibold">İştirakçı</th>
                                            <th className="p-4 py-3 font-semibold">Başlayıb</th>
                                            <th className="p-4 py-3 font-semibold">Xərclənən Vaxt</th>
                                            <th className="p-4 py-3 font-semibold">Bal</th>
                                            <th className="p-4 py-3 font-semibold">Reytinq</th>
                                            <th className="p-4 py-3 font-semibold">Status</th>
                                            <th className="p-4 py-3 font-semibold">Əməliyyat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {submissions.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-semibold text-gray-900">{r.studentName}</p>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    {r.startedAt ? new Date(r.startedAt).toLocaleString('az-AZ') : '–'}
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-700">
                                                    {formatDuration(r.startedAt, r.submittedAt)}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-indigo-600">
                                                    {r.submittedAt ? `${r.totalScore} / ${r.maxScore}` : '–'}
                                                </td>
                                                <td className="p-4">
                                                    {r.rating ? (
                                                        <StarDisplay value={r.rating} />
                                                    ) : (
                                                        <span className="text-gray-300 text-sm">–</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        r.submittedAt
                                                            ? r.isFullyGraded
                                                                ? 'bg-green-50 text-green-700'
                                                                : 'bg-yellow-50 text-yellow-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                        {!r.submittedAt ? '⏳ Davam edir' : r.isFullyGraded ? <><HiOutlineCheckCircle className="w-3.5 h-3.5"/> Tam Yoxlanılıb</> : '⏳ Yoxlanılır...'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {r.submittedAt && (
                                                        <button
                                                            onClick={() => navigate(`/test/review/${r.id}`)}
                                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 transition-colors"
                                                        >
                                                            Bax 👁️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamResults;
