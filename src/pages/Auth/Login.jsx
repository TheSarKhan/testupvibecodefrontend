import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineEye, HiOutlineEyeOff,
    HiOutlineMail, HiOutlineLockClosed,
    HiOutlineChevronLeft, HiOutlineChartBar,
    HiOutlineLightningBolt, HiOutlineLibrary,
} from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';
import ForgotPasswordModal from '../../components/ui/ForgotPasswordModal';
import Logo, { LogoMark } from '../../components/ui/Logo';

// ───────────────────────────────────────────────────────────────────────────
// Google brand icon
// ───────────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.4-.1-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.7 16.3 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.5l6.2 5.3c-.4.4 6.5-4.8 6.5-14.3 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
);

// ───────────────────────────────────────────────────────────────────────────
// Brand panel (left side)
// ───────────────────────────────────────────────────────────────────────────

const AuthBrand = () => (
    <aside
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(155deg, var(--brand-blue-700) 0%, var(--primary) 55%, var(--brand-green-600) 130%)' }}
    >
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-12 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />

        {/* Logo */}
        <Link to="/" className="relative z-10 w-fit" aria-label="testup.az ana səhifə">
            <Logo size={36} dark />
        </Link>

        {/* Body */}
        <div className="relative z-10 my-10">
            <h1 className="text-[34px] xl:text-[42px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-4">
                Yenidən sizi<br />görmək yaxşıdır.
            </h1>
            <p className="text-white/75 text-[15px] xl:text-[16px] leading-relaxed max-w-[440px]">
                Hesabınıza daxil olun və qaldığınız yerdən davam edin — <strong className="text-white font-semibold">imtahanlar, statistikalar və nəticələriniz</strong> sizi gözləyir.
            </p>

            <div className="mt-9 flex flex-col gap-4">
                {[
                    { Icon: HiOutlineChartBar,      name: 'Dərin statistika', desc: 'Hər şagirdin və hər sualın detallı analizi' },
                    { Icon: HiOutlineLightningBolt, name: 'AI sual yaratma',  desc: 'Saniyələr içində keyfiyyətli suallar' },
                    { Icon: HiOutlineLibrary,       name: '40 000+ sual',     desc: 'DİM, MİQ və müəllif mənbələri' },
                ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                            <f.Icon className="w-5 h-5 text-white" />
                        </span>
                        <div>
                            <div className="font-bold text-[14.5px]">{f.name}</div>
                            <div className="text-[13px] text-white/65 mt-0.5">{f.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <p className="relative z-10 text-white/50 text-[11.5px]">© 2026 testup.az — Onlayn imtahan platforması</p>
    </aside>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
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

            <div className="flex min-h-screen" style={{ background: 'var(--paper-cream)' }}>
                <AuthBrand />

                <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
                    {/* Top — back to site */}
                    <div className="w-full max-w-[440px] mb-6">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] transition-colors"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                            Sayta qayıt
                        </Link>
                    </div>

                    {/* Mobile logo */}
                    <Link to="/" className="lg:hidden mb-6" aria-label="testup.az ana səhifə">
                        <Logo size={36} />
                    </Link>

                    {/* Form card */}
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-[440px] bg-white border border-[var(--ink-200)] rounded-3xl p-7 sm:p-9 shadow-[var(--sh-sm)]"
                    >
                        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight">
                            Yenidən xoş gəldiniz
                        </h1>
                        <p className="mt-1.5 text-[14px] text-[var(--ink-500)]">
                            Davam etmək üçün hesabınıza daxil olun
                        </p>

                        {/* Email */}
                        <div className="mt-6">
                            <label className="block text-[12.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-1.5">E-poçt</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] w-4 h-4 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="email@nümunə.az"
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--ink-50)] border border-[var(--ink-200)] text-[14px] text-[var(--ink-900)] placeholder-[var(--ink-400)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[12.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)]">Şifrə</label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgot(true)}
                                    className="text-[12px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors"
                                >
                                    Şifrəni unutdunuz?
                                </button>
                            </div>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] w-4 h-4 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-[var(--ink-50)] border border-[var(--ink-200)] text-[14px] text-[var(--ink-900)] placeholder-[var(--ink-400)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember */}
                        <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded accent-[var(--primary)]"
                            />
                            <span className="text-[13.5px] text-[var(--ink-700)]">Məni xatırla</span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-6 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
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

                        {/* Divider */}
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--ink-150)]" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-[11.5px] font-semibold text-[var(--ink-400)] uppercase tracking-wider">və ya</span>
                            </div>
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={() => googleLogin()}
                            className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-full border border-[var(--ink-200)] bg-white hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] text-[14px] font-semibold text-[var(--ink-800)] transition-all"
                        >
                            <GoogleIcon />
                            Google ilə daxil ol
                        </button>

                        {/* Footer */}
                        <p className="mt-6 text-center text-[13.5px] text-[var(--ink-500)]">
                            Hesabınız yoxdur?{' '}
                            <Link to="/register" className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors">
                                Qeydiyyatdan keçin
                            </Link>
                        </p>
                    </form>
                </section>
            </div>
        </>
    );
};

export default Login;
