import { useState } from 'react';
import {
    HiOutlineX, HiOutlineMail, HiOutlineLockClosed,
    HiOutlineEye, HiOutlineEyeOff, HiOutlineCheckCircle,
    HiOutlineArrowLeft,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

/**
 * 2-step forgot password modal:
 *  Step 1 — enter email → POST /auth/forgot-password → OTP sent
 *  Step 2 — enter OTP + new password → POST /auth/reset-password → done
 */
const ForgotPasswordModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
            toast.success('Kod e-poçtunuza göndərildi');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Şifrələr uyğun gəlmir');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Şifrə ən azı 6 simvol olmalıdır');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setDone(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <HiOutlineX className="w-5 h-5" />
                </button>

                {/* ── Success screen ── */}
                {done ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineCheckCircle className="w-9 h-9 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Şifrə yeniləndi!</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Şifrəniz uğurla dəyişdirildi. İndi yeni şifrənizlə daxil ola bilərsiniz.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all text-sm"
                        >
                            Daxil olmaq üçün keç
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-7 pt-7 pb-5">
                            {step === 2 && (
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
                                >
                                    <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                                    Geri
                                </button>
                            )}
                            <h3 className="text-xl font-bold text-gray-900">
                                {step === 1 ? 'Şifrəni unutdum' : 'Şifrəni sıfırla'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {step === 1
                                    ? 'E-poçtunuzu daxil edin, sıfırlama kodu göndərək'
                                    : `${email} ünvanına göndərilən 6 rəqəmli kodu daxil edin`
                                }
                            </p>
                        </div>

                        {/* ── Step 1: Email ── */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="px-7 pb-7 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        E-poçt ünvanı
                                    </label>
                                    <div className="relative">
                                        <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                            placeholder="email@nümunə.az"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm shadow-indigo-200"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Göndərilir...
                                        </>
                                    ) : 'Kod göndər'}
                                </button>
                            </form>
                        )}

                        {/* ── Step 2: OTP + new password ── */}
                        {step === 2 && (
                            <form onSubmit={handleReset} className="px-7 pb-7 space-y-4">

                                {/* OTP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Doğrulama kodu
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        autoFocus
                                        className="w-full text-center text-2xl font-bold tracking-[0.6em] py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-300 placeholder:tracking-[0.6em]"
                                        placeholder="000000"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoading(true);
                                            api.post('/auth/forgot-password', { email })
                                                .then(() => toast.success('Kod yenidən göndərildi'))
                                                .catch(() => toast.error('Xəta baş verdi'))
                                                .finally(() => setLoading(false));
                                        }}
                                        className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        Kodu yenidən göndər
                                    </button>
                                </div>

                                {/* New password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Yeni şifrə
                                    </label>
                                    <div className="relative">
                                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                            placeholder="Ən azı 6 simvol"
                                        />
                                        <button type="button" onClick={() => setShowNew(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                                            {showNew ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Şifrəni təsdiqləyin
                                    </label>
                                    <div className="relative">
                                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className={`w-full pl-11 pr-11 py-3 border rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm ${
                                                confirmPassword
                                                    ? passwordsMatch
                                                        ? 'border-green-400 focus:ring-green-500/20 focus:border-green-500'
                                                        : 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                                                    : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                                            {showConfirm ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && (
                                        <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                            {passwordsMatch
                                                ? <><HiOutlineCheckCircle className="w-3.5 h-3.5" /> Şifrələr uyğundur</>
                                                : <><HiOutlineX className="w-3.5 h-3.5" /> Şifrələr uyğun gəlmir</>
                                            }
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm shadow-indigo-200"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Yenilənir...
                                        </>
                                    ) : 'Şifrəni yenilə'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
