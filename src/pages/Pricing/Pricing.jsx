import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiOutlineCreditCard } from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const featureList = [
    { key: 'monthlyExamLimit', label: 'Aylıq İmtahan Sayı', type: 'number' },
    { key: 'maxQuestionsPerExam', label: 'Bir imtahanda max Sual', type: 'number' },
    { key: 'maxSavedExamsLimit', label: 'Ümumi yadda saxlanılan imtahan', type: 'number' },
    { key: 'maxParticipantsPerExam', label: 'Max iştirakçı sayısı', type: 'number' },
    { key: 'studentResultAnalysis', label: 'Şagird nəticələrinin analizi', type: 'boolean' },
    { key: 'examEditing', label: 'İmtahan redaktəsi', type: 'boolean' },
    { key: 'addImage', label: 'Suala şəkil əlavə etmək', type: 'boolean' },
    { key: 'addPassageQuestion', label: 'Mətn/Dinləmə sualları', type: 'boolean' },
    { key: 'downloadPastExams', label: 'Keçmiş imtahanları yükləmək', type: 'boolean' },
    { key: 'downloadAsPdf', label: 'İmtahanı PDF kimi yükləmək', type: 'boolean' },
    { key: 'multipleSubjects', label: 'Bir imtahanda bir neçə fənn', type: 'boolean' },
    { key: 'useTemplateExams', label: 'Şablon imtahanlardan istifadə', type: 'boolean' },
    { key: 'manualChecking', label: 'Açıq sualların yoxlanışı (Manual)', type: 'boolean' },
    { key: 'selectExamDuration', label: 'Xüsusi imtahan müddəti', type: 'boolean' },
    { key: 'useQuestionBank', label: 'Sual bazasından istifadə', type: 'boolean' },
    { key: 'createQuestionBank', label: 'Sual bazası yaratmaq', type: 'boolean' },
    { key: 'importQuestionsFromPdf', label: 'PDF-dən sualların kəsilməsi', type: 'boolean' }
];

const MONTHS_OPTIONS = [
    { value: 1, label: '1 ay' },
    { value: 3, label: '3 ay', discount: 5 },
    { value: 6, label: '6 ay', discount: 10 },
    { value: 12, label: '12 ay', discount: 15 },
];

const Pricing = ({ isEmbedded = false }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonths, setSelectedMonths] = useState(1);
    const [paying, setPaying] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);
    const { user, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    // Auto-check on tab focus while payment window is open
    useEffect(() => {
        if (!paymentWindowOpen) return;
        const onFocus = () => checkPendingOrder(false, true);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [paymentWindowOpen]);

    const checkPendingOrder = async (manual = false, silent = false) => {
        const pendingOrderId = localStorage.getItem('pendingPayriffOrderId');
        if (!pendingOrderId) return;
        if (manual) setVerifying(true);
        try {
            const { data } = await api.post('/payment/verify', { orderId: pendingOrderId });
            if (data.status === 'NOT_FOUND') {
                localStorage.removeItem('pendingPayriffOrderId');
                setPaymentWindowOpen(false);
                if (manual) toast.error('Ödəniş tapılmadı. Yenidən cəhd edin.');
            } else if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status)) {
                localStorage.removeItem('pendingPayriffOrderId');
                setPaymentWindowOpen(false);
                await refreshSubscription();
                toast.success('Ödəniş təsdiqləndi! Abunəliyiniz aktivləşdirildi.');
            } else if (manual) {
                toast('Ödəniş hələ təsdiqlənməyib. Bir az gözləyin.', { icon: '⏳' });
            }
        } catch {
            if (!silent) {
                localStorage.removeItem('pendingPayriffOrderId');
                setPaymentWindowOpen(false);
            }
            if (manual) toast.error('Yoxlama zamanı xəta baş verdi.');
        } finally {
            if (manual) setVerifying(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/subscription-plans');
            setPlans(response.data.sort((a, b) => a.price - b.price));
        } catch {
            toast.error('Planları yükləyərkən xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const getDiscountedPrice = (price) => {
        const opt = MONTHS_OPTIONS.find(o => o.value === selectedMonths);
        if (!opt?.discount) return price;
        return +(price * (1 - opt.discount / 100)).toFixed(2);
    };

    // Returns value wallet info for switching to a different plan
    const getWalletInfo = (plan) => {
        const baseCharge = plan.price * selectedMonths;
        const baseDuration = selectedMonths * 30;
        const empty = { creditAzn: 0, chargeAmount: baseCharge, durationDays: baseDuration, bonusDays: 0, isFree: false };
        if (!subscription || !subscription.startDate || !subscription.endDate) return empty;
        if (subscription.plan?.id === plan.id || !plan.price) return empty;
        const totalDays = Math.max(1, Math.floor(
            (new Date(subscription.endDate) - new Date(subscription.startDate)) / 86400000
        ));
        const remainingDays = Math.max(0, Math.floor(
            (new Date(subscription.endDate) - Date.now()) / 86400000
        ));
        if (remainingDays === 0) return empty;
        const oldDailyRate = (subscription.amountPaid || 0) / totalDays;
        const creditAzn = oldDailyRate * remainingDays;
        const chargeAmount = Math.max(0, baseCharge - creditAzn);
        const totalValue = creditAzn + chargeAmount;
        const durationDays = Math.floor(totalValue / (plan.price / 30));
        const bonusDays = Math.max(0, durationDays - baseDuration);
        return { creditAzn, chargeAmount, durationDays, bonusDays, isFree: chargeAmount === 0 };
    };

    const getPlanAction = (plan) => {
        if (!user || !subscription) return 'subscribe';
        if (subscription.plan?.id === plan.id) return 'renew';
        return 'switch';
    };

    const handleSubscribe = async (planId, planPrice) => {
        if (!user) {
            toast('Davam etmək üçün sistemə daxil olun', { icon: '🔒' });
            navigate('/login', { state: { returnUrl: '/planlar' } });
            return;
        }
        if (planPrice <= 0) return;

        setPaying(planId);
        try {
            const { data } = await api.post('/payment/initiate', { planId, months: selectedMonths });
            if (data.directActivated) {
                await refreshSubscription();
                toast.success('Plan dəyişdirildi! Kredit ilə ödənişsiz keçid edildi.');
                return;
            }
            localStorage.setItem('pendingPayriffOrderId', data.orderId);
            window.open(data.paymentUrl, '_blank', 'noopener');
            setPaymentWindowOpen(true);
            toast('Ödəniş pəncərəsi açıldı. Ödənişi tamamlayıb bu səhifəyə qayıdın.', { icon: '💳', duration: 6000 });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ödəniş başladılarkən xəta baş verdi');
        } finally {
            setPaying(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 ${isEmbedded ? 'py-20' : 'min-h-screen py-20'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Sizə uyğun planı seçin
                    </h1>
                    <p className="text-lg text-gray-500">
                        Bütün xüsusiyyətlərimizdən faydalanaraq tədris prosesinizi tamamilə rəqəmsallaşdırın.
                    </p>
                </div>

                {/* Months selector */}
                <div className="flex justify-center mb-16">
                    <div className="inline-flex bg-white border border-gray-200 rounded-2xl p-1 gap-1 shadow-sm">
                        {MONTHS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedMonths(opt.value)}
                                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    selectedMonths === opt.value
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                                {opt.discount && (
                                    <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        selectedMonths === opt.value ? 'bg-green-400 text-white' : 'bg-green-100 text-green-700'
                                    }`}>
                                        -{opt.discount}%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8 items-stretch">
                    {plans.map((plan, index) => {
                        const isCurrentPlan = subscription?.plan?.id === plan.id;
                        const isMostPopular = index === 1 || (plan.price > 0 && plan.price < 50);
                        const displayPrice = plan.price > 0 ? getDiscountedPrice(plan.price) : 0;
                        const totalPrice = +(displayPrice * selectedMonths).toFixed(2);
                        const hasDiscount = plan.price > 0 && displayPrice < plan.price;
                        const action = getPlanAction(plan);
                        const wallet = action === 'switch' ? getWalletInfo(plan) : { bonusDays: 0, isFree: false, chargeAmount: plan.price * selectedMonths };
                        const bonusDays = wallet.bonusDays;
                        const isFreeSwitch = action === 'switch' && wallet.isFree;
                        const remainingDays = isCurrentPlan && subscription?.endDate
                            ? Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000))
                            : null;

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col w-full max-w-sm rounded-3xl bg-white shadow-xl transition-transform duration-300 hover:-translate-y-2 border-2 ${isMostPopular ? 'border-indigo-500 shadow-indigo-200 z-10 scale-105 md:scale-110' : 'border-transparent shadow-gray-200'}`}
                            >
                                {isMostPopular && (
                                    <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                                        <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full shadow-md">
                                            Ən Populyar
                                        </span>
                                    </div>
                                )}

                                <div className="p-8 pb-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                                        {isCurrentPlan && (
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${remainingDays <= 7 ? 'bg-red-100 text-red-700' : remainingDays <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                {remainingDays === 0 ? 'Bu gün bitir' : `${remainingDays} gün qalır`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 min-h-[40px] leading-relaxed">{plan.description}</p>

                                    <div className="my-6">
                                        {plan.price > 0 ? (
                                            <>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-extrabold text-gray-900">{displayPrice}</span>
                                                    <span className="text-lg font-semibold text-gray-500">AZN</span>
                                                    <span className="text-sm text-gray-400 ml-1">/ ay</span>
                                                    {hasDiscount && (
                                                        <span className="text-sm text-gray-400 line-through ml-1">{plan.price}</span>
                                                    )}
                                                </div>
                                                {action === 'switch' && isFreeSwitch && (
                                                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                                        <p className="text-xs font-bold text-green-700">Ödənişsiz keçid — kredit kifayət edir</p>
                                                        {bonusDays > 0 && (
                                                            <p className="text-xs text-green-600 mt-0.5">+{bonusDays} əlavə gün alırsınız</p>
                                                        )}
                                                    </div>
                                                )}
                                                {action === 'switch' && !isFreeSwitch && bonusDays > 0 && (
                                                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                                        <p className="text-xs text-green-700 font-medium">
                                                            Cari planınızın krediti ilə <span className="font-bold">+{bonusDays} gün</span> əlavə olunacaq
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-0.5">
                                                            Ödəniləcək: <span className="font-bold">{wallet.chargeAmount.toFixed(2)} AZN</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {action !== 'switch' && selectedMonths > 1 && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Cəmi: <span className="font-semibold text-gray-700">{totalPrice} AZN</span> / {selectedMonths} ay
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold text-gray-900">0</span>
                                                <span className="text-lg font-semibold text-gray-500">AZN</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => plan.price > 0 ? handleSubscribe(plan.id, plan.price) : null}
                                        disabled={paying === plan.id || plan.price === 0}
                                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                                            paying === plan.id
                                                ? 'bg-indigo-400 text-white cursor-wait'
                                                : plan.price === 0
                                                    ? 'bg-gray-100 text-gray-500 cursor-default'
                                                    : action === 'renew'
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : isFreeSwitch
                                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                            : isMostPopular
                                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                        }`}
                                    >
                                        {paying === plan.id ? 'İşlənir...'
                                            : plan.price === 0 ? 'Aktiv Plan'
                                            : action === 'renew' ? <><HiOutlineCreditCard className="w-4 h-4" /> Uzat</>
                                            : isFreeSwitch ? 'Ödənişsiz Keçid Et'
                                            : action === 'switch' ? <><HiOutlineCreditCard className="w-4 h-4" /> Plana Keçid Et</>
                                            : <><HiOutlineCreditCard className="w-4 h-4" /> Abunə Ol</>
                                        }
                                    </button>

                                    {action === 'renew' && (
                                        <p className="text-xs text-gray-400 text-center mt-2">Bitmə tarixi uzadılacaq</p>
                                    )}
                                    {action === 'switch' && !isFreeSwitch && wallet.chargeAmount < plan.price * selectedMonths && (
                                        <p className="text-xs text-green-600 text-center mt-2">
                                            Kredit tətbiq edilib: -{(plan.price * selectedMonths - wallet.chargeAmount).toFixed(2)} AZN
                                        </p>
                                    )}
                                </div>

                                <div className="p-8 flex-1 flex flex-col justify-start">
                                    <ul className="space-y-4 text-sm text-gray-600">
                                        {featureList.map((feature, i) => {
                                            const hasValue = plan[feature.key];
                                            let displayValue = null;
                                            let isIncluded = false;

                                            if (feature.type === 'boolean') {
                                                isIncluded = hasValue === true;
                                            } else if (feature.type === 'number') {
                                                displayValue = hasValue === -1 ? 'Limitsiz' : hasValue;
                                                isIncluded = hasValue === -1 || hasValue > 0;
                                            }

                                            return (
                                                <li key={i} className={`flex items-start gap-3 ${!isIncluded ? 'opacity-50' : ''}`}>
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isIncluded ? (
                                                            <HiCheckCircle className={`w-5 h-5 ${isMostPopular ? 'text-indigo-500' : 'text-teal-500'}`} />
                                                        ) : (
                                                            <HiXCircle className="w-5 h-5 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <span className={isIncluded ? 'font-medium text-gray-800' : 'text-gray-400 line-through'}>
                                                        {feature.label}
                                                        {feature.type === 'number' && displayValue && (
                                                            <span className="ml-1.5 font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                                                {displayValue}
                                                            </span>
                                                        )}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Pricing;
