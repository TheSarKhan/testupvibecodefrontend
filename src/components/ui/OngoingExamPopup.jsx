import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';

const OngoingExamPopup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [ongoingExams, setOngoingExams] = useState([]);
    const [finishingId, setFinishingId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isHidden, setIsHidden] = useState(false);

    // Don't show popup if we are already in an exam session
    const isExamSession = location.pathname.startsWith('/test/take/');

    useEffect(() => {
        const fetchOngoing = async () => {
            try {
                const { data } = await api.get('/submissions/ongoing');
                setOngoingExams(data);
                if (data.length > 0 && data[0].startedAt && data[0].durationMinutes) {
                    calculateTimeLeft(data[0].startedAt, data[0].durationMinutes);
                }
            } catch (error) {
                console.error("Error fetching ongoing exams:", error);
            }
        };

        if (user && !isExamSession) {
            fetchOngoing();
            const interval = setInterval(fetchOngoing, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        } else {
            setOngoingExams([]);
        }
    }, [user, isExamSession]);

    useEffect(() => {
        if (ongoingExams.length > 0 && ongoingExams[0].startedAt && ongoingExams[0].durationMinutes) {
            const timer = setInterval(() => {
                calculateTimeLeft(ongoingExams[0].startedAt, ongoingExams[0].durationMinutes);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [ongoingExams]);

    const calculateTimeLeft = (startedAt, durationMinutes) => {
        const start = new Date(startedAt).getTime();
        const now = new Date().getTime();
        const diffInSeconds = Math.floor((now - start) / 1000);
        const totalDurationSeconds = durationMinutes * 60;
        const remaining = Math.max(0, totalDurationSeconds - diffInSeconds);
        setTimeLeft(remaining);
    };

    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleFinishExam = async (submissionId) => {
        if (!window.confirm("Bu imtahanı bitirmək istədiyinizə əminsiniz?")) return;
        
        setFinishingId(submissionId);
        try {
            await api.post(`/submissions/${submissionId}/finalize`);
            toast.success("İmtahan bitirildi");
            setOngoingExams(prev => prev.filter(ex => ex.id !== submissionId));
            navigate(`/test/result/${submissionId}`);
        } catch (error) {
            toast.error("İmtahanı bitirərkən xəta baş verdi");
        } finally {
            setFinishingId(null);
        }
    };

    if (ongoingExams.length === 0 || isExamSession || isHidden) return null;

    const exam = ongoingExams[0];

    return (
        <div className="fixed top-24 right-8 z-[100] animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="w-[320px] bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[24px] p-6 shadow-2xl relative overflow-hidden border border-white/10 group">
                <div className="flex items-center justify-between mb-8">
                    {/* Timer */}
                    <div className="text-white text-3xl font-bold font-mono">
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Finish Button */}
                        <button
                            onClick={() => handleFinishExam(exam.id)}
                            disabled={finishingId === exam.id}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-md disabled:opacity-50"
                        >
                            {finishingId === exam.id ? '...' : 'Bitir'}
                        </button>

                        {/* Close Button */}
                        <button 
                            onClick={() => setIsHidden(true)}
                            className="text-white/90 hover:text-white transition-colors"
                        >
                            <HiOutlineX className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* Message */}
                <div className="text-white text-center mb-10">
                    <p className="font-bold text-lg leading-snug">
                        İmtahanınız yarımçıq qalıb,<br />
                        bitirmək üçün klikləyin
                    </p>
                </div>

                {/* Continue Button */}
                <button
                    onClick={() => navigate(`/test/take/${exam.id}`)}
                    className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-[0.98]"
                >
                    İmtahana davam et
                </button>
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default OngoingExamPopup;
