import { useState } from 'react';
import { HiOutlineX, HiOutlineSparkles } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const GoogleRoleModal = ({ accessToken, userInfo, onSuccess, onClose }) => {
    const [role, setRole] = useState('STUDENT');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!termsAccepted) {
            toast.error('İstifadə şərtlərini qəbul etməlisiniz');
            return;
        }
        if (!phoneNumber.trim()) {
            toast.error('Telefon nömrəsi daxil edin');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/google/complete', {
                accessToken,
                role,
                phoneNumber: phoneNumber.trim(),
                termsAccepted,
            });
            onSuccess(data);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Qeydiyyat uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-center">
                    {userInfo.picture ? (
                        <img src={userInfo.picture} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/50" />
                    ) : (
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                            {userInfo.name?.charAt(0) || 'G'}
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-white">Xoş gəldiniz!</h2>
                    <p className="text-indigo-200 text-sm mt-1">{userInfo.name}</p>
                    <p className="text-indigo-300 text-xs">{userInfo.email}</p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-sm text-gray-600 text-center">
                        Google hesabınızla ilk dəfə daxil olursunuz. Zəhmət olmasa məlumatları doldurun.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rol seçin</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'STUDENT', label: 'Şagird', icon: '🎓' },
                                { value: 'TEACHER', label: 'Müəllim', icon: '👩‍🏫' },
                            ].map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRole(value)}
                                    className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                                        role === value
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl">{icon}</span>
                                    <span className="text-sm font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                        {role === 'TEACHER' && (
                            <p className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                                <HiOutlineSparkles className="w-3.5 h-3.5" />
                                Müəllim kimi qeydiyyat keçin — 3 aylıq Basic plan hədiyyəsi alın!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon nömrəsi</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                            placeholder="+994 50 000 00 00"
                        />
                    </div>

                    <div>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
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
                        disabled={loading || !termsAccepted}
                        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Gözləyin...' : 'Qeydiyyatı tamamla'}
                    </button>
                </form>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default GoogleRoleModal;
