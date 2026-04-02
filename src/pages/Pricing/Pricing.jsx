import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiOutlineCreditCard, HiOutlineX } from 'react-icons/hi';
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
    const [confirmModal, setConfirmModal] = useState(null); // { plan, wallet, isFreeSwitch, action }
    const { user, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
        refreshSubscription();
    }, []);

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

    const openConfirm = (plan, action, wallet, isFreeSwitch) => {
        if (!user) {
            toast('Davam etmək üçün sistemə daxil olun', { icon: '🔒' });
            navigate('/login', { state: { returnUrl: '/planlar' } });
            return;
        }
        setConfirmModal({ plan, action, wallet, isFreeSwitch });
    };

    const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);

    // When user returns to this tab after paying in Payriff tab — auto-verify
    useEffect(() => {
        if (!paymentWindowOpen) return;
        const onFocus = async () => {
            const orderId = localStorage.getItem('pendingPayriffOrderId');
            if (!orderId) return;
            try {
                const { data } = await api.post('/payment/verify', { orderId });
                if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                    localStorage.removeItem('pendingPayriffOrderId');
                    setPaymentWindowOpen(false);
                    await refreshSubscription();
                    toast.success('Abunəlik aktivləşdirildi! 🎉');
                }
            } catch {}
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [paymentWindowOpen]);

    const handleSubscribe = async (planId) => {
        setConfirmModal(null);
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
            if (!err._handled) toast.error(err.response?.data?.message || 'Ödəniş başladılarkən xəta baş verdi');
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

        {/* ── Confirmation Modal ── */}
        {confirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <button onClick={() => setConfirmModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {confirmModal.action === 'renew' ? 'Planı uzat' : confirmModal.isFreeSwitch ? 'Ödənişsiz keçid' : 'Plana keçid'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            <span className="font-semibold text-gray-800">{confirmModal.plan.name}</span> planına keçmək istədiyinizdən əminsiniz?
                        </p>

                        {/* Credit breakdown */}
                        {confirmModal.action === 'switch' && confirmModal.wallet.creditAzn > 0 ? (
                            <div className={`rounded-xl p-4 mb-5 text-sm space-y-2 ${confirmModal.isFreeSwitch ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                <div className="flex justify-between text-gray-600">
                                    <span>Plan qiyməti ({selectedMonths} ay)</span>
                                    <span>{(confirmModal.plan.price * selectedMonths).toFixed(2)} AZN</span>
                                </div>
                                <div className={`flex justify-between font-semibold ${confirmModal.isFreeSwitch ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    <span>Cari plan krediti</span>
                                    <span>−{confirmModal.wallet.creditAzn.toFixed(2)} AZN</span>
                                </div>
                                <div className={`flex justify-between font-bold pt-2 border-t ${confirmModal.isFreeSwitch ? 'border-emerald-200 text-emerald-800' : 'border-amber-200 text-gray-900'}`}>
                                    <span>Ödəniləcək</span>
                                    <span>{confirmModal.isFreeSwitch ? 'Pulsuz 🎉' : confirmModal.wallet.chargeAmount.toFixed(2) + ' AZN'}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 pt-1">
                                    <span>Müddət</span>
                                    <span>{confirmModal.wallet.durationDays} gün</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm">
                                <div className="flex justify-between font-semibold text-gray-800">
                                    <span>Ödəniləcək məbləğ</span>
                                    <span>{(confirmModal.plan.price * selectedMonths).toFixed(2)} AZN</span>
                                </div>
                                <div className="flex justify-between text-gray-500 mt-1">
                                    <span>Müddət</span>
                                    <span>{selectedMonths * 30} gün</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Ləğv et
                            </button>
                            <button
                                onClick={() => handleSubscribe(confirmModal.plan.id)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                                    confirmModal.isFreeSwitch
                                        ? 'bg-emerald-500 hover:bg-emerald-600'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {confirmModal.isFreeSwitch ? 'Keçid Et' : 'Ödənişə Keç'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
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
                        const wallet = action === 'switch' ? getWalletInfo(plan) : { creditAzn: 0, isFree: false, chargeAmount: plan.price * selectedMonths, durationDays: selectedMonths * 30 };
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
                                                    {action === 'switch' && wallet.creditAzn > 0 && !isFreeSwitch ? (
                                                        <>
                                                            <span className="text-4xl font-extrabold text-gray-900">{wallet.chargeAmount.toFixed(2)}</span>
                                                            <span className="text-lg font-semibold text-gray-500">AZN</span>
                                                            <span className="text-sm text-gray-400 line-through ml-1">{totalPrice} AZN</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-4xl font-extrabold text-gray-900">{isFreeSwitch ? '0' : displayPrice}</span>
                                                            <span className="text-lg font-semibold text-gray-500">AZN</span>
                                                            {!isFreeSwitch && <span className="text-sm text-gray-400 ml-1">/ ay</span>}
                                                            {hasDiscount && !isFreeSwitch && (
                                                                <span className="text-sm text-gray-400 line-through ml-1">{plan.price}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Credit breakdown box */}
                                                {action === 'switch' && wallet.creditAzn > 0 && (
                                                    <div className={`mt-3 p-3 rounded-xl border ${isFreeSwitch ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between text-gray-600">
                                                                <span>Plan qiyməti</span>
                                                                <span>{totalPrice.toFixed(2)} AZN</span>
                                                            </div>
                                                            <div className={`flex justify-between font-semibold ${isFreeSwitch ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                                <span>Cari plan krediti</span>
                                                                <span>−{wallet.creditAzn.toFixed(2)} AZN</span>
                                                            </div>
                                                            <div className={`flex justify-between font-bold pt-1 border-t ${isFreeSwitch ? 'border-emerald-200 text-emerald-800' : 'border-amber-200 text-gray-900'}`}>
                                                                <span>Ödəniləcək</span>
                                                                <span>{isFreeSwitch ? 'Pulsuz' : wallet.chargeAmount.toFixed(2) + ' AZN'}</span>
                                                            </div>
                                                            {wallet.durationDays !== selectedMonths * 30 && (
                                                                <div className={`flex justify-between font-semibold pt-0.5 ${isFreeSwitch ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                                    <span>Müddət</span>
                                                                    <span>{wallet.durationDays} gün</span>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                <span className="text-sm text-gray-400 ml-1">/ həmişə</span>
                                            </div>
                                        )}
                                    </div>

                                    {plan.price === 0 ? (
                                        <div className="w-full py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-sm text-gray-400 font-medium">
                                            Baza plan — hər zaman mövcuddur
                                        </div>
                                    ) : (
                                    <button
                                        onClick={() => openConfirm(plan, action, wallet, isFreeSwitch)}
                                        disabled={paying === plan.id}
                                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                                            paying === plan.id
                                                ? 'bg-indigo-400 text-white cursor-wait'
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
                                            : action === 'renew' ? <><HiOutlineCreditCard className="w-4 h-4" /> Uzat</>
                                            : isFreeSwitch ? '✓ Ödənişsiz Keçid Et'
                                            : action === 'switch' ? <><HiOutlineCreditCard className="w-4 h-4" /> Plana Keçid Et</>
                                            : <><HiOutlineCreditCard className="w-4 h-4" /> Abunə Ol</>
                                        }
                                    </button>
                                    )}

                                    {action === 'renew' && (
                                        <p className="text-xs text-gray-400 text-center mt-2">Bitmə tarixi uzadılacaq</p>
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
