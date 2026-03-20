import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiOutlineRefresh, HiOutlineArrowRight } from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshSubscription, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying | success | pending | failed
    const [examShareLink, setExamShareLink] = useState(null);
    const verified = useRef(false);

    // Wait for auth to initialize before verifying — so refreshSubscription works
    useEffect(() => {
        if (authLoading) return;
        if (verified.current) return;
        verified.current = true;

        const orderId = searchParams.get('orderId')
            || searchParams.get('order_id')
            || searchParams.get('id')
            || localStorage.getItem('pendingPayriffOrderId');
        if (!orderId) {
            setStatus('pending');
            return;
        }
        localStorage.removeItem('pendingPayriffOrderId');
        verify(orderId);
    }, [authLoading]);

    const verify = async (orderId) => {
        try {
            const { data } = await api.post('/payment/verify', { orderId });
            if (data.status === 'NOT_FOUND') {
                setStatus('failed');
            } else if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                if (data.examShareLink) {
                    setExamShareLink(data.examShareLink);
                } else {
                    await refreshSubscription();
                }
                setStatus('success');
            } else {
                setStatus('pending');
            }
        } catch {
            setStatus('failed');
        }
    };

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Ödəniş yoxlanılır...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HiCheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Ödəniş uğurlu oldu!</h1>
                    {examShareLink ? (
                        <>
                            <p className="text-gray-500 mb-8">İmtahan alındı. İstədiyiniz vaxt başlaya bilərsiniz.</p>
                            <button
                                onClick={() => navigate(`/imtahan/${examShareLink}`)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                            >
                                İmtahana Başla <HiOutlineArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-500 mb-8">Abunəliyiniz aktivləşdirildi. Bütün imkanlardan istifadə edə bilərsiniz.</p>
                            <button
                                onClick={() => navigate('/imtahanlar')}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                            >
                                İmtahanlara keç <HiOutlineArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HiOutlineRefresh className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Ödəniş gözlənilir</h1>
                    <p className="text-gray-500 mb-8">Ödəniş hələ təsdiqlənməyib. Bir neçə dəqiqə gözləyin, abunəliyiniz avtomatik aktivləşəcək.</p>
                    <button
                        onClick={() => navigate('/planlar')}
                        className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors"
                    >
                        Planlara qayıt
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✕</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Xəta baş verdi</h1>
                <p className="text-gray-500 mb-8">Ödəniş təsdiqlənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.</p>
                <button
                    onClick={() => navigate('/planlar')}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                >
                    Yenidən cəhd et
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccess;
