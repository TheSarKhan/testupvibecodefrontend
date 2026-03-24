import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineSparkles, HiOutlineX } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';

const WelcomeGiftModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🎁</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-1">Xoş gəldiniz!</h2>
                <p className="text-indigo-200 text-sm">testup.az ailəsinə qoşulduğunuz üçün təşəkkür edirik</p>
            </div>
            {/* Content */}
            <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                    <HiOutlineSparkles className="w-4 h-4" />
                    3 aylıq Basic plan — Pulsuz Hədiyyə!
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Müəllim kimi qeydiyyatdan keçdiyiniz üçün sizə <strong>3 aylıq Basic abunəlik</strong> hədiyyə edildi.
                    Bütün premium imkanlardan dərhal istifadə edə bilərsiniz.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                    {['Sınırsız sual bazası', 'PDF yükləmə', 'Detallı statistika', 'Şablon imtahanlar'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-500 font-bold">✓</span> {f}
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                >
                    Başlayaq! 🚀
                </button>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <HiOutlineX className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
        termsAccepted: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [googlePending, setGooglePending] = useState(null);
    const { register, loginWithTokens } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            toast.error(err.response?.data?.message || 'Google ilə qeydiyyat xətası');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google girişi ləğv edildi'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            toast.success('Qeydiyyat uğurla tamamlandı!');
            if (data?.giftPlanAssigned) {
                setShowGiftModal(true);
            } else {
                navigate('/login');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showGiftModal && (
                <WelcomeGiftModal onClose={() => navigate('/login')} />
            )}
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">Qeydiyyat</h2>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                        Yeni hesab yaradın
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ad, Soyad
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                placeholder="Ad Soyad"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-poçt
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                placeholder="email@nümunə.az"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefon nömrəsi
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                placeholder="+994 50 000 00 00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rol
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                                <option value="STUDENT">Şagird</option>
                                <option value="TEACHER">Müəllim</option>
                            </select>
                            {formData.role === 'TEACHER' && (
                                <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
                                    <HiOutlineSparkles className="w-3.5 h-3.5" />
                                    Müəllim kimi qeydiyyat keçin — 3 aylıq Basic plan hədiyyəsi alın!
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Şifrə
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Şifrəni təsdiqləyin
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                                />
                                <span className="text-sm text-gray-600 leading-relaxed">
                                    <a href="/istifade-sertleri" target="_blank" className="text-indigo-600 hover:underline font-medium">İstifadə şərtlərini</a>
                                    {' '}və{' '}
                                    <a href="/gizlilik-siyaseti" target="_blank" className="text-indigo-600 hover:underline font-medium">Gizlilik Siyasətini</a>
                                    {' '}oxuyub qəbul edirəm
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.termsAccepted}
                            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Gözləyin...' : 'Qeydiyyatdan keç'}
                        </button>
                    </form>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs text-gray-400">
                            <span className="bg-white px-2">və ya</span>
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

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Artıq hesabınız var?{' '}
                        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                            Daxil olun
                        </Link>
                    </p>
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
