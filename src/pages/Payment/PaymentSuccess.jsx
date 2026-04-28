import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiOutlineRefresh, HiOutlineArrowRight } from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MAX_WAIT_SECONDS = 120; // keep polling for up to 2 minutes

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshSubscription, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying | success | pending | failed
    const [examShareLink, setExamShareLink] = useState(null);
    const [waitSeconds, setWaitSeconds] = useState(0);
    const verified = useRef(false);
    const orderIdRef = useRef(null);
    const pollTimer = useRef(null);

    useEffect(() => {
        if (authLoading) return;
        if (verified.current) return;
        verified.current = true;

        const orderId = searchParams.get('orderId')
            || searchParams.get('order_id')
            || searchParams.get('id')
            || localStorage.getItem('pendingPaymentOrderId');
        if (!orderId) {
            setStatus('pending');
            return;
        }
        localStorage.removeItem('pendingPaymentOrderId');
        orderIdRef.current = orderId;
        verify(orderId);
    }, [authLoading]);

    // Cleanup poll timer on unmount
    useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

    const verify = async (orderId) => {
        try {
            const { data } = await api.post('/payment/verify', { orderId });
            if (data.status === 'NOT_FOUND') {
                setStatus('failed');
                return;
            }
            if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                if (data.examShareLink) {
                    setExamShareLink(data.examShareLink);
                } else {
                    await refreshSubscription();
                }
                localStorage.setItem('paymentCompleted', Date.now().toString());
                setStatus('success');
                return;
            }
            // Not yet confirmed — keep polling
            scheduleRetry(orderId);
        } catch {
            scheduleRetry(orderId);
        }
    };

    const scheduleRetry = (orderId) => {
        setWaitSeconds(prev => {
            const next = prev + 5;
            if (next >= MAX_WAIT_SECONDS) {
                setStatus('pending'); // give up, show manual retry screen
                return prev;
            }
            pollTimer.current = setTimeout(() => verify(orderId), 5000);
            return next;
        });
    };

    if (status === 'verifying') {
        const pct = Math.min(100, (waitSeconds / MAX_WAIT_SECONDS) * 100);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-xs w-full px-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold mb-1">Ödəniş yoxlanılır...</p>
                    {waitSeconds > 0 && (
                        <>
                            <p className="text-gray-400 text-sm mb-3">{waitSeconds} saniyə gözlənildi</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                        </>
                    )}
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
                                onClick={() => navigate('/planlar')}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Planlara bax <HiOutlineArrowRight className="w-4 h-4" />
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
                    <p className="text-gray-500 mb-8">
                        Ödəniş sistemi tərəfindən hələ təsdiqlənməyib. Abunəliyiniz bir neçə dəqiqə içində avtomatik aktivləşəcək.
                    </p>
                    <button
                        onClick={() => { setStatus('verifying'); setWaitSeconds(0); verify(orderIdRef.current); }}
                        className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors mb-3"
                    >
                        Yenidən yoxla
                    </button>
                    <button
                        onClick={() => navigate('/planlar')}
                        className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
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
