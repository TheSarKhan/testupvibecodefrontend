import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineEye, HiOutlineEyeOff,
    HiOutlineMail, HiOutlineLockClosed,
    HiOutlineBookOpen, HiOutlineChartBar, HiOutlineLightningBolt,
    HiOutlineArrowLeft,
} from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';
import ForgotPasswordModal from '../../components/ui/ForgotPasswordModal';
import logo from '../../assets/logo.png';

const FEATURES = [
    { icon: HiOutlineBookOpen,      title: 'Hazır sual bazası',   desc: 'Hər fənn üçün minlərlə sual bir yerdə'        },
    { icon: HiOutlineChartBar,      title: 'Anlıq statistika',    desc: 'Hər cavab verildikcə nəticə yenilənir'        },
    { icon: HiOutlineLightningBolt, title: 'Etibarlı & sürətli',  desc: 'İmtahanınız heç vaxt sizi geri qoymaz'        },
];

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googlePending, setGooglePending] = useState(null);
    const [showForgot, setShowForgot] = useState(false);
    const { login, loginWithTokens } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password);
            const { jwtDecode } = await import('jwt-decode');
            const decoded = jwtDecode(data.accessToken);
            toast.success('Uğurla daxil oldunuz!');
            navigate(decoded.role === 'ADMIN' ? '/admin' : '/');
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Giriş uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const { data } = await api.post('/auth/google', { accessToken: tokenResponse.access_token });
            if (data.status === 'LOGIN') {
                loginWithTokens(data);
                toast.success('Uğurla daxil oldunuz!');
                navigate(data.role === 'ADMIN' ? '/admin' : '/');
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

    return (
        <>
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

            {googlePending && (
                <GoogleRoleModal
                    accessToken={googlePending.accessToken}
                    userInfo={googlePending.userInfo}
                    onSuccess={(data) => {
                        loginWithTokens(data);
                        toast.success('Qeydiyyat tamamlandı!');
                        navigate(data.role === 'ADMIN' ? '/admin' : '/');
                    }}
                    onClose={() => setGooglePending(null)}
                />
            )}

            <div className="flex min-h-screen relative">

                {/* Back to site button */}
                <Link
                    to="/"
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                    Sayta qayıt
                </Link>

            <div className="flex flex-1">

                {/* ── Left branding panel ── */}
                <div className="hidden lg:flex lg:w-[42%] xl:w-[44%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-8 xl:p-12 relative overflow-hidden select-none">
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full" />
                    <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full" />
                    <div className="absolute top-1/2 right-8 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />

                    <Link to="/" className="relative z-10">
                        <img src={logo} alt="testup.az" className="h-7 xl:h-8 w-auto brightness-0 invert" />
                    </Link>

                    <div className="relative z-10">
                        <h1 className="text-[1.9rem] xl:text-[2.5rem] font-extrabold text-white leading-snug mb-3 xl:mb-4">
                            Azərbaycanın<br />
                            <span className="text-indigo-200">ən müasir</span><br />
                            imtahan platformu
                        </h1>
                        <p className="text-indigo-200/90 text-sm xl:text-base leading-relaxed mb-8 xl:mb-10">
                            Müəllimlik bir az daha asanlaşır. Hər gün.
                        </p>
                        <div className="space-y-4 xl:space-y-5">
                            {FEATURES.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 xl:gap-4">
                                    <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Icon className="w-4 h-4 xl:w-5 xl:h-5 text-indigo-200" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-xs xl:text-sm">{title}</p>
                                        <p className="text-indigo-300 text-xs mt-0.5 hidden xl:block">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-indigo-400/50 text-xs relative z-10">© 2025 testup.az</p>
                </div>

                {/* ── Right form panel ── */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 bg-gray-50 overflow-y-auto">
                    <div className="w-full max-w-[400px]">

                        {/* Mobile logo */}
                        <div className="lg:hidden flex justify-center mb-7">
                            <img src={logo} alt="testup.az" className="h-8 w-auto" />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <div className="mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Yenidən xoş gəldiniz</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Davam etmək üçün hesabınıza daxil olun
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-poçt</label>
                                    <div className="relative">
                                        <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                            placeholder="email@nümunə.az"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-medium text-gray-700">Şifrə</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgot(true)}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                        >
                                            Şifrəni unutdunuz?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            className="w-full pl-11 pr-11 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm shadow-indigo-200"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Gözləyin...
                                        </>
                                    ) : 'Daxil ol'}
                                </button>
                            </form>

                            <div className="relative my-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-xs text-gray-400">
                                    <span className="bg-white px-3">və ya</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google ilə daxil ol
                                </button>
                            </div>

                            <p className="mt-5 text-center text-sm text-gray-500">
                                Hesabınız yoxdur?{' '}
                                <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                                    Qeydiyyatdan keçin
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </>
    );

};

export default Login;
