import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamEntry = () => {
    const { shareLink } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, login } = useAuth();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [guestName, setGuestName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);

    // Inline login states
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        fetchExamInfo();
    }, [shareLink]);

    // Re-check purchase status when user logs in
    useEffect(() => {
        if (isAuthenticated && exam && exam.price != null && Number(exam.price) > 0) {
            checkPurchaseStatus(exam);
        }
    }, [isAuthenticated]);

    const checkPurchaseStatus = async (examData) => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get(`/exams/${examData.shareLink}/my-status`);
            setHasPurchased(data.hasUnusedPurchase);
        } catch {}
    };

    const fetchExamInfo = async () => {
        try {
            const { data } = await api.get(`/exams/${shareLink}`);
            setExam(data);
            const isFree = data.price == null || Number(data.price) === 0;
            if (isFree) {
                setHasPurchased(true);
            } else if (isAuthenticated) {
                await checkPurchaseStatus(data);
            }
        } catch (error) {
            toast.error("İmtahan tapılmadı və ya aktiv deyil");
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleInlineLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            await login(loginEmail, loginPassword);
            toast.success('Uğurla daxil oldunuz!');
            setShowLoginForm(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Auto-check payment when tab regains focus
    useEffect(() => {
        if (!paymentWindowOpen) return;
        const onFocus = async () => {
            const orderId = localStorage.getItem('pendingPayriffOrderId');
            if (!orderId) return;
            try {
                const { data } = await api.post('/payment/verify', { orderId });
                if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                    localStorage.removeItem('pendingPayriffOrderId');
                    setPaymentWindowOpen(false);
                    setHasPurchased(true);
                    toast.success('Ödəniş uğurlu! İmtahana başlaya bilərsiniz.');
                }
            } catch {}
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [paymentWindowOpen]);

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            toast.error("Ödənişli imtahan üçün hesabınıza daxil olun");
            setShowLoginForm(true);
            return;
        }
        setIsPurchasing(true);
        try {
            const { data } = await api.post('/payment/initiate-exam', { shareLink });
            if (data.alreadyPurchased) {
                setHasPurchased(true);
                toast.success('Bu imtahanı artıq almışsınız. İmtahana başlaya bilərsiniz.');
                return;
            }
            localStorage.setItem('pendingPayriffOrderId', data.orderId);
            window.open(data.paymentUrl, '_blank', 'noopener');
            setPaymentWindowOpen(true);
            toast('Ödəniş pəncərəsi açıldı. Ödənişi tamamlayıb bu səhifəyə qayıdın.', { icon: '💳', duration: 6000 });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ödəniş başladıla bilmədi');
        } finally {
            setIsPurchasing(false);
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
                            {(exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0)} sual • {exam.durationMinutes ? `${exam.durationMinutes} dəqiqə` : 'Sərbəst vaxt'}
                        </p>
                        {exam.price != null && exam.price > 0 && (
                            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                                <span>💳</span>
                                <span>Ödənişli · {Number(exam.price).toFixed(2)} ₼</span>
                            </div>
                        )}
                        {(exam.price == null || exam.price === 0) && (
                            <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                Pulsuz
                            </div>
                        )}
                    </div>

                    {/* Inline login form */}
                    {showLoginForm && !isAuthenticated && (
                        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-sm font-semibold text-indigo-800 mb-3">Hesabınıza daxil olun</p>
                            <form onSubmit={handleInlineLogin} className="space-y-3">
                                <input
                                    type="email"
                                    required
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="E-poçt"
                                />
                                <div className="relative">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        required
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="Şifrə"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(v => !v)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showLoginPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isLoggingIn}
                                        className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoggingIn ? 'Gözləyin...' : 'Daxil ol'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginForm(false)}
                                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
                                    >
                                        Ləğv et
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <form onSubmit={handleStartExam} className="space-y-6">
                        {!isAuthenticated && !showLoginForm && (
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
                                        onClick={() => setShowLoginForm(true)}
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

                        {exam.price != null && exam.price > 0 && !hasPurchased ? (
                            <button
                                type="button"
                                onClick={handlePurchase}
                                disabled={isPurchasing}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-70"
                            >
                                {isPurchasing ? 'Emal edilir...' : `💳 Satın Al · ${Number(exam.price).toFixed(2)} ₼`}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isJoining || (showLoginForm && !isAuthenticated)}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                            >
                                {isJoining ? 'Yüklənir...' : 'İmtahana Başla'}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExamEntry;
