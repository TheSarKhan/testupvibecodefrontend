import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineSparkles, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

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
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Şifrələr uyğun gəlmir');
            return;
        }

        setLoading(true);
        try {
            const data = await register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Gözləyin...' : 'Qeydiyyatdan keç'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Artıq hesabınız var?{' '}
                        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                            Daxil olun
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Register;
