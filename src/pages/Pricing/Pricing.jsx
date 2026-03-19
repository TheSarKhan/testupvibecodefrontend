import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
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

const Pricing = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, subscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get('/subscription-plans');

            // Sort by price ascending
            const sortedPlans = response.data.sort((a, b) => a.price - b.price);
            setPlans(sortedPlans);
        } catch (error) {
            toast.error('Planları yükləyərkən xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        if (!user) {
            toast('Davam etmək üçün sistemə daxil olun', { icon: '🔒' });
            navigate('/login', { state: { returnUrl: '/pricing' } });
            return;
        }

        // Ideally, this would open a payment modal or redirect to ePoint.
        // For now, we will hit the endpoint to assign the subscription directly (or show a pending message)
        try {
            // Note: Currently, only admins can assign subscriptions through user-subscriptions endpoint.
            // If we have a self-subscribe endpoint, we call it here. For now, we simulate a process.
            toast.success('Ödəniş sistemi (ePoint) yaxın zamanda inteqrasiya olunacaq!');
            
            // Temporary dummy call to user subscription creation if backend allows it for users (which it doesn't currently)
            // await api.post(`/user-subscriptions`, { userId: user.id, planId: planId, durationDays: 30 });
            // await refreshSubscription();
        } catch (error) {
            toast.error('Gözlənilməz xəta baş verdi');
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Sizə uyğun planı seçin
                    </h1>
                    <p className="text-lg text-gray-500">
                        Bütün xüsusiyyətlərimizdən faydalanaraq tədris prosesinizi tamamilə rəqəmsallaşdırın və avtomatlaşdırın. Ehtiyaclarınıza və tələbə sayınıza uyğun ən optimal planı indi seçin.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-8 items-stretch">
                    {plans.map((plan, index) => {
                        const isCurrentPlan = subscription?.plan?.id === plan.id;
                        const isMostPopular = index === 1 || plan.price > 0 && plan.price < 50; // Simple logic to highlight the middle/pro plan

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
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 min-h-[40px] leading-relaxed">{plan.description}</p>
                                    
                                    <div className="my-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                            <span className="text-lg font-semibold text-gray-500">AZN</span>
                                            <span className="text-sm text-gray-400 ml-1">/ ay</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-center transition-all duration-200 ${
                                            isCurrentPlan 
                                                ? 'bg-green-100 text-green-700 cursor-not-allowed border-2 border-green-200' 
                                                : isMostPopular 
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' 
                                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                        }`}
                                    >
                                        {isCurrentPlan ? 'Cari Plan' : plan.price === 0 ? 'İndi Başla' : 'Abunə Ol'}
                                    </button>
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
