import { useNavigate } from 'react-router-dom';
import { HiOutlineXCircle, HiOutlineArrowLeft } from 'react-icons/hi';

const PaymentDecline = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineXCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Ödəniş ləğv edildi</h1>
                <p className="text-gray-500 mb-8">Ödəniş tamamlanmadı. Dilədiyiniz zaman yenidən cəhd edə bilərsiniz.</p>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/planlar')}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Planlara qayıt
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" /> Ana səhifəyə qayıt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDecline;
