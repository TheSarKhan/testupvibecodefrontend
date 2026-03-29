import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import {
    HiOutlineEye, HiOutlineEyeOff,
    HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone,
    HiOutlineAcademicCap, HiOutlineBookOpen,
    HiOutlineSparkles, HiOutlineX, HiOutlineCheckCircle,
    HiOutlineArrowLeft, HiOutlineArrowRight,
    HiOutlineUserGroup, HiOutlineChartBar, HiOutlineLightningBolt,
} from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';
import logo from '../../assets/logo.png';

// ── Password strength ─────────────────────────────────────────────────────────
const calcStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
};
const STRENGTH_META = [
    null,
    { label: 'Zəif',  barColor: 'bg-red-400',  textColor: 'text-red-500'   },
    { label: 'Orta',  barColor: 'bg-amber-400', textColor: 'text-amber-500' },
    { label: 'Yaxşı', barColor: 'bg-blue-400',  textColor: 'text-blue-500'  },
    { label: 'Güclü', barColor: 'bg-green-500', textColor: 'text-green-600' },
];

// ── Left panel features ───────────────────────────────────────────────────────
const FEATURES = [
    { icon: HiOutlineUserGroup,     title: '5,000+ Müəllim',     desc: 'Azərbaycanlı müəllimlərin seçimi'          },
    { icon: HiOutlineChartBar,      title: 'Dərin statistika',    desc: 'Hər şagirdin nəticəsini ayrıca izləyin'    },
    { icon: HiOutlineLightningBolt, title: 'AI sual yaratma',     desc: 'Saniyələr içində hazır, keyfiyyətli suallar' },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepDots = ({ current, total }) => (
    <div className="flex items-center gap-2 justify-center mb-6">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                    i < current
                        ? 'w-2 h-2 bg-indigo-600'
                        : i === current
                            ? 'w-6 h-2 bg-indigo-600'
                            : 'w-2 h-2 bg-gray-200'
                }`}
            />
        ))}
    </div>
);

// ── Welcome gift modal ────────────────────────────────────────────────────────
const WelcomeGiftModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🎁</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-1">Xoş gəldiniz!</h2>
                <p className="text-indigo-200 text-sm">testup.az ilə imtahan hazırlığında yeni bir səhifə açıldı</p>
            </div>
            <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                    <HiOutlineSparkles className="w-4 h-4" />
                    3 aylıq Basic plan — Pulsuz Hədiyyə!
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Müəllim kimi qeydiyyatdan keçdiyiniz üçün sizə{' '}
                    <strong>3 aylıq Basic abunəlik</strong> hədiyyə edildi.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                    {['Sınırsız sual bazası', 'PDF yükləmə', 'Detallı statistika', 'Şablon imtahanlar'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-500 font-bold">✓</span> {f}
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                    Başlayaq! 🚀
                </button>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <HiOutlineX className="w-5 h-5" />
            </button>
        </div>
    </div>
);

// ── Register ──────────────────────────────────────────────────────────────────
const Register = () => {
    const [step, setStep] = useState(0); // 0=role, 1=info, 2=password
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: '',
        termsAccepted: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [googlePending, setGooglePending] = useState(null);
    const { register, loginWithTokens } = useAuth();
    const navigate = useNavigate();

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

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
            toast.error(err.response?.data?.message || 'Google ilə qeydiyyat xətası');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google girişi ləğv edildi'),
    });

    const handleSubmit = async () => {
        if (!formData.termsAccepted) {
            toast.error('İstifadə şərtlərini qəbul etməlisiniz');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Şifrələr uyğun gəlmir');
            return;
        }
        setLoading(true);
        try {
            const data = await register({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                role: formData.role,
                termsAccepted: formData.termsAccepted,
            });
            loginWithTokens(data);
            toast.success('Qeydiyyat uğurla tamamlandı!');
            if (data?.giftPlanAssigned) {
                setShowGiftModal(true);
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const strength = calcStrength(formData.password);
    const strengthMeta = STRENGTH_META[strength];
    const passwordsMatch = formData.password === formData.confirmPassword;

    // ── Step 0: Role selection ────────────────────────────────────────────────
    const RoleStep = () => (
        <div>
            <StepDots current={0} total={3} />
            <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Necə tanıyım sizi?</h2>
                <p className="mt-1.5 text-sm text-gray-500">Rolunuzu seçin — istəsəniz sonra dəyişə bilərsiniz</p>
            </div>

            <div className="space-y-3">
                {/* Student */}
                <button
                    type="button"
                    onClick={() => { set('role', 'STUDENT'); setStep(1); }}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 transition-colors">
                        <HiOutlineBookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">Şagird</p>
                        <p className="text-sm text-gray-500 mt-0.5">İmtahanlara qoşul, nəticəni anında gör</p>
                    </div>
                    <HiOutlineArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </button>

                {/* Teacher */}
                <button
                    type="button"
                    onClick={() => { set('role', 'TEACHER'); setStep(1); }}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group text-left relative overflow-hidden"
                >
                    <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center flex-shrink-0 transition-colors">
                        <HiOutlineAcademicCap className="w-6 h-6 text-violet-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">Müəllim</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                <HiOutlineSparkles className="w-3 h-3" /> 3 ay hədiyyə
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">İmtahan hazırla, nəticəni real vaxtda izlə</p>
                    </div>
                    <HiOutlineArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
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
                    Google ilə qeydiyyat
                </button>
            </div>

            <p className="mt-5 text-center text-sm text-gray-500">
                Artıq hesabınız var?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Daxil olun
                </Link>
            </p>
        </div>
    );

    // ── Step 1: Name + Email ──────────────────────────────────────────────────
    const InfoStep = () => {
        const handleNext = (e) => {
            e.preventDefault();
            if (!formData.fullName.trim())    { toast.error('Ad, Soyad daxil edin');       return; }
            if (!formData.email.trim())       { toast.error('E-poçt daxil edin');          return; }
            if (!formData.phoneNumber.trim()) { toast.error('Telefon nömrəsi daxil edin'); return; }
            setStep(2);
        };
        return (
            <form onSubmit={handleNext}>
                <StepDots current={1} total={3} />
                <div className="mb-6">
                    <button type="button" onClick={() => setStep(0)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors">
                        <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                        Geri
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Məlumatlarınız</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {formData.role === 'TEACHER' ? 'Müəllim' : 'Şagird'} kimi qeydiyyat
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad, Soyad</label>
                        <div className="relative">
                            <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => set('fullName', e.target.value)}
                                required
                                autoFocus
                                autoComplete="name"
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                placeholder="Ad Soyad"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">E-poçt</label>
                        <div className="relative">
                            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => set('email', e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                placeholder="email@nümunə.az"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon nömrəsi</label>
                        <div className="relative">
                            <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => set('phoneNumber', e.target.value)}
                                autoComplete="tel"
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                placeholder="+994 50 000 00 00"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm shadow-indigo-200"
                >
                    Davam et
                    <HiOutlineArrowRight className="w-4 h-4" />
                </button>

                <p className="mt-5 text-center text-sm text-gray-500">
                    Artıq hesabınız var?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                        Daxil olun
                    </Link>
                </p>
            </form>
        );
    };

    // ── Step 2: Password + Terms ──────────────────────────────────────────────
    const PasswordStep = () => (
        <div>
            <StepDots current={2} total={3} />
            <div className="mb-6">
                <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors">
                    <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                    Geri
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Şifrə yaradın</h2>
                <p className="mt-1 text-sm text-gray-500">Güclü şifrə — güvənli hesab</p>
            </div>

            <div className="space-y-4">
                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifrə</label>
                    <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => set('password', e.target.value)}
                            required
                            autoFocus
                            autoComplete="new-password"
                            className="w-full pl-11 pr-11 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= i && strengthMeta ? strengthMeta.barColor : 'bg-gray-200'}`} />
                                ))}
                            </div>
                            {strengthMeta && (
                                <p className={`text-xs ${strengthMeta.textColor}`}>
                                    Şifrə gücü: <span className="font-medium">{strengthMeta.label}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Confirm */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifrəni təsdiqləyin</label>
                    <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => set('confirmPassword', e.target.value)}
                            required
                            autoComplete="new-password"
                            className={`w-full pl-11 pr-11 py-2.5 sm:py-3 border rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm ${
                                formData.confirmPassword
                                    ? passwordsMatch
                                        ? 'border-green-400 focus:ring-green-500/20 focus:border-green-500'
                                        : 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                                    : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                            }`}
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                            {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.confirmPassword && (
                        <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                            {passwordsMatch
                                ? <><HiOutlineCheckCircle className="w-3.5 h-3.5" /> Şifrələr uyğundur</>
                                : <><HiOutlineX className="w-3.5 h-3.5" /> Şifrələr uyğun gəlmir</>
                            }
                        </p>
                    )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group pt-1">
                    <div className="relative mt-0.5 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={(e) => set('termsAccepted', e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            formData.termsAccepted ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'
                        }`}>
                            {formData.termsAccepted && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">
                        <a href="/istifade-sertleri" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">İstifadə şərtlərini</a>
                        {' '}və{' '}
                        <a href="/gizlilik-siyaseti" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Gizlilik Siyasətini</a>
                        {' '}oxuyub qəbul edirəm
                    </span>
                </label>
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.termsAccepted}
                className="w-full mt-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm shadow-indigo-200"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Gözləyin...
                    </>
                ) : 'Hesab yarat'}
            </button>

            <p className="mt-5 text-center text-sm text-gray-500">
                Artıq hesabınız var?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Daxil olun
                </Link>
            </p>
        </div>
    );

    return (
        <>
            {showGiftModal && <WelcomeGiftModal onClose={() => navigate('/')} />}

            <div className="flex flex-col min-h-screen">
            <Navbar />
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
                            Müasir müəllim<br />
                            <span className="text-indigo-200">müasir alətlə</span><br />
                            işləyir
                        </h1>
                        <p className="text-indigo-200/90 text-sm xl:text-base leading-relaxed mb-7 xl:mb-10">
                            Müəllim kimi qeydiyyatdan keçin —{' '}
                            <strong className="text-white">3 aylıq Basic plan</strong> sizindir. Pulsuz.
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

                        <div className="mt-6 xl:mt-8 p-3 xl:p-4 bg-white/10 rounded-2xl border border-white/20">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl xl:text-3xl">🎁</span>
                                <div>
                                    <p className="text-white font-bold text-sm">Müəllim hədiyyəsi</p>
                                    <p className="text-indigo-200 text-xs mt-0.5">
                                        Müəllim hesabına xüsusi hədiyyə — 3 ay Basic plan, büsbütün pulsuz.
                                    </p>
                                </div>
                            </div>
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
                            {step === 0 && RoleStep()}
                            {step === 1 && InfoStep()}
                            {step === 2 && PasswordStep()}
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {googlePending && (
                <GoogleRoleModal
                    accessToken={googlePending.accessToken}
                    userInfo={googlePending.userInfo}
                    onSuccess={(data) => {
                        loginWithTokens(data);
                        if (data.giftPlanAssigned) {
                            setShowGiftModal(true);
                        } else {
                            toast.success('Qeydiyyat tamamlandı!');
                            navigate('/');
                        }
                    }}
                    onClose={() => setGooglePending(null)}
                />
            )}
        </>
    );
};

export default Register;
