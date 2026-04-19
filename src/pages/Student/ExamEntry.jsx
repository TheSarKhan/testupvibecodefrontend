import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineX } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';

const ExamEntry = () => {
    const { shareLink } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, login, register, loginWithTokens } = useAuth();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [guestName, setGuestName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Inline login/register states
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [googlePending, setGooglePending] = useState(null);

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
            setShowAuthForm(false);
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Giriş mümkün olmadı');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!registerData.fullName.trim()) {
            toast.error('Zəhmət olmasa adınızı daxil edin');
            return;
        }
        if (registerData.password !== registerData.confirmPassword) {
            toast.error('Şifrələr uyğun gəlmir');
            return;
        }
        if (registerData.password.length < 6) {
            toast.error('Şifrə ən azı 6 rəqəmdən ibarət olmalıdır');
            return;
        }
        setIsRegistering(true);
        try {
            const data = await register({
                fullName: registerData.fullName,
                email: registerData.email,
                phoneNumber: registerData.phoneNumber || undefined,
                password: registerData.password,
                role: 'STUDENT',
            });
            loginWithTokens(data);
            toast.success('Qeydiyyat tamamlandı!');
            setShowAuthForm(false);
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Qeydiyyat uğursuz oldu');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const { data } = await api.post('/auth/google', { accessToken: tokenResponse.access_token });
            if (data.status === 'LOGIN') {
                loginWithTokens(data);
                toast.success('Uğurla daxil oldunuz!');
                setShowAuthForm(false);
            } else if (data.status === 'NEEDS_REGISTRATION') {
                setGooglePending({ accessToken: tokenResponse.access_token, userInfo: data });
            }
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Google ilə giriş xətası');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google girişi ləğv edildi'),
    });

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            toast.error("Ödənişli imtahan üçün hesabınıza daxil olun");
            setShowAuthForm(true);
            setAuthMode('login');
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
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Ödəniş başladıla bilmədi');
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
            if (!error._handled) toast.error(error.response?.data?.message || "İmtahana başlamaq mümkün olmadı");
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
        const totalQ = (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);
        const subjects = exam.subjects?.filter(Boolean) || [];
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-xl sm:rounded-2xl border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                                <HiOutlineLockClosed className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{exam.title}</h2>
                            {subjects.length > 0 && (
                                <p className="text-sm text-gray-500 mb-3">{subjects.join(' + ')}</p>
                            )}
                            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                                Bu imtahan hazırda bağlıdır
                            </span>
                        </div>

                        {/* Exam info grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {totalQ > 0 && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                                    <p className="text-lg font-bold text-gray-800">{totalQ}</p>
                                    <p className="text-xs text-gray-400">Sual</p>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                                <p className="text-lg font-bold text-gray-800">
                                    {exam.durationMinutes ? `${exam.durationMinutes}` : '∞'}
                                </p>
                                <p className="text-xs text-gray-400">{exam.durationMinutes ? 'Dəqiqə' : 'Sərbəst vaxt'}</p>
                            </div>
                            {exam.teacherName && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center col-span-2">
                                    <p className="text-sm font-semibold text-gray-700">{exam.teacherName}</p>
                                    <p className="text-xs text-gray-400">Müəllim</p>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-gray-400 text-sm">Müəllimlə əlaqə saxlayın və ya sonra yenidən yoxlayın.</p>
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

                    {/* Inline auth form (login or register) */}
                    {googlePending && (
                        <GoogleRoleModal
                            accessToken={googlePending.accessToken}
                            userInfo={googlePending.userInfo}
                            onSuccess={(data) => {
                                loginWithTokens(data);
                                toast.success('Qeydiyyat tamamlandı!');
                                setShowAuthForm(false);
                                setGooglePending(null);
                            }}
                            onClose={() => setGooglePending(null)}
                        />
                    )}

                    {showAuthForm && !isAuthenticated && (
                        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-indigo-800">
                                    {authMode === 'login' ? 'Hesabınıza daxil olun' : 'Qeydiyyat olun'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAuthForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            </div>

                            {authMode === 'login' ? (
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
                                    <button
                                        type="submit"
                                        disabled={isLoggingIn}
                                        className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoggingIn ? 'Gözləyin...' : 'Daxil ol'}
                                    </button>
                                    <div className="text-center">
                                        <span className="text-xs text-gray-600">Hesabınız yoxdur? </span>
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('register'); setLoginEmail(''); setLoginPassword(''); }}
                                            className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                                        >
                                            Qeydiyyat olun
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-3">
                                    <input
                                        type="text"
                                        required
                                        value={registerData.fullName}
                                        onChange={e => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="Ad və Soyad"
                                    />
                                    <input
                                        type="email"
                                        required
                                        value={registerData.email}
                                        onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="E-poçt"
                                    />
                                    <input
                                        type="tel"
                                        value={registerData.phoneNumber}
                                        onChange={e => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="Telefon nömrəsi (isteğe bağlı)"
                                    />
                                    <div className="relative">
                                        <input
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            required
                                            value={registerData.password}
                                            onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            placeholder="Şifrə (ən azı 6 rəqəm)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegisterPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showRegisterPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showRegisterConfirm ? 'text' : 'password'}
                                            required
                                            value={registerData.confirmPassword}
                                            onChange={e => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            placeholder="Şifrəni təsdiq edin"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegisterConfirm(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showRegisterConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isRegistering}
                                        className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isRegistering ? 'Gözləyin...' : 'Qeydiyyat ol'}
                                    </button>
                                    <div className="text-center">
                                        <span className="text-xs text-gray-600">Artıq hesabınız var? </span>
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('login'); setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' }); }}
                                            className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                                        >
                                            Daxil olun
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Divider */}
                            <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs text-gray-400">
                                    <span className="bg-indigo-50 px-2">və ya</span>
                                </div>
                            </div>

                            {/* Google login button */}
                            <button
                                type="button"
                                onClick={() => googleLogin()}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google ile {authMode === 'login' ? 'gir' : 'qeydiyyat'}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleStartExam} className="space-y-6">
                        {!isAuthenticated && !showAuthForm && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                <p className="font-medium">⚠️ Xəbərdarlıq</p>
                                <p className="text-xs mt-1">Qeydiyyat olmadan imtahana başlasanız, nəticənizi sonradan görə bilməyəcəksiniz.</p>
                            </div>
                        )}

                        {!isAuthenticated && !showAuthForm && (
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
                                <div className="mt-4 text-center text-sm text-gray-500">
                                    Hesabınız varsa
                                    <button
                                        type="button"
                                        onClick={() => { setShowAuthForm(true); setAuthMode('login'); setLoginEmail(''); setLoginPassword(''); }}
                                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium ml-1"
                                    >
                                        daxil olun
                                    </button>
                                    <span className="mx-1">və ya</span>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAuthForm(true); setAuthMode('register'); setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' }); }}
                                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                    >
                                        qeydiyyat olun
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
                                disabled={isJoining || (showAuthForm && !isAuthenticated)}
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
