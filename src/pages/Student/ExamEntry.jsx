import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUser, HiOutlineLockClosed } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamEntry = () => {
    const { shareLink } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [guestName, setGuestName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        fetchExamInfo();
    }, [shareLink]);

    const fetchExamInfo = async () => {
        try {
            const { data } = await api.get(`/exams/${shareLink}`);
            setExam(data);
        } catch (error) {
            toast.error("İmtahan tapılmadı və ya aktiv deyil");
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (e) => {
        e?.preventDefault();
        
        if (!isAuthenticated && !guestName.trim()) {
            toast.error("Zəhmət olmasa adınızı qeyd edin");
            return;
        }

        if (exam?.visibility === 'PRIVATE' && !accessCode.trim()) {
            toast.error("Bu imtahan üçün keçid kodu tələb olunur");
            return;
        }

        setIsJoining(true);
        try {
            const { data } = await api.post(`/submissions/start/${shareLink}`, {
                guestName: isAuthenticated ? undefined : guestName,
                accessCode: exam?.visibility === 'PRIVATE' ? accessCode : undefined
            });
            // data.id is the submission id
            navigate(`/test/take/${data.id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "İmtahana başlamaq mümkün olmadı");
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!exam) return null;

    if (exam.status === 'CANCELLED' || exam.status === 'DRAFT') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-xl sm:rounded-2xl border border-gray-100 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-5">
                            <HiOutlineLockClosed className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                        <p className="text-gray-500 mb-1">Bu imtahan hazırda <strong className="text-red-500">bağlıdır</strong>.</p>
                        <p className="text-gray-400 text-sm">Müəllimlə əlaqə saxlayın və ya sonra yenidən yoxlayın.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{exam.title}</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {exam.questions?.length || 0} sual • {exam.durationMinutes ? `${exam.durationMinutes} dəqiqə` : 'Sərbəst vaxt'}
                        </p>
                    </div>

                    <form onSubmit={handleStartExam} className="space-y-6">
                        {!isAuthenticated && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Ad və Soyad
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <HiOutlineUser className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                        placeholder="Adınızı daxil edin"
                                    />
                                </div>
                                <div className="mt-4 text-center">
                                    <span className="text-sm text-gray-500">Və ya hesabınız varsa </span>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login', { state: { returnUrl: `/test/${shareLink}` } })}
                                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                    >
                                        Daxil olun
                                    </button>
                                </div>
                            </div>
                        )}

                        {isAuthenticated && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                                <p className="text-sm text-indigo-800 text-center">
                                    <strong>{user?.fullName}</strong> kimi daxil olmusunuz. Nəticəniz profilinizə əlavə ediləcək.
                                </p>
                            </div>
                        )}

                        {exam.visibility === 'PRIVATE' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keçid kodu (Müəllim tərəfindən verilir)
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                        placeholder="Kodu daxil edin"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isJoining}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                        >
                            {isJoining ? 'Yüklənir...' : 'İmtahana Başla'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExamEntry;
