import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineClipboardList,
    HiOutlineClock,
    HiOutlineShoppingBag,
    HiOutlineArrowRight,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineCalendar,
} from 'react-icons/hi';
import api from '../../api/axios';

const TAB_EXAMS = 'exams';
const TAB_RESULTS = 'results';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState(TAB_EXAMS);

    const [exams, setExams] = useState([]);
    const [examsLoading, setExamsLoading] = useState(true);

    const [results, setResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(true);

    useEffect(() => {
        api.get('/exams/my-purchased-exam-details')
            .then(r => setExams(r.data))
            .catch(() => {})
            .finally(() => setExamsLoading(false));

        api.get('/submissions/my-results')
            .then(r => setResults(r.data))
            .catch(() => {})
            .finally(() => setResultsLoading(false));
    }, []);

    const fmtDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
        return d.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-10">

                {/* Page title */}
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6">İmtahanlarım</h1>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-8 w-fit">
                    <TabBtn active={tab === TAB_EXAMS} onClick={() => setTab(TAB_EXAMS)}>
                        <HiOutlineShoppingBag className="w-4 h-4" />
                        Alınmış İmtahanlar
                        {exams.length > 0 && (
                            <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {exams.length}
                            </span>
                        )}
                    </TabBtn>
                    <TabBtn active={tab === TAB_RESULTS} onClick={() => setTab(TAB_RESULTS)}>
                        <HiOutlineClipboardList className="w-4 h-4" />
                        Nəticələrim
                        {results.length > 0 && (
                            <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {results.length}
                            </span>
                        )}
                    </TabBtn>
                </div>

                {/* Purchased Exams */}
                {tab === TAB_EXAMS && (
                    examsLoading ? <SkeletonGrid /> :
                    exams.length === 0 ? (
                        <EmptyState
                            icon={<HiOutlineShoppingBag className="w-10 h-10 text-gray-300" />}
                            title="Alınmış imtahan yoxdur"
                            subtitle="İmtahanlar səhifəsindən imtahan satın ala bilərsiniz."
                            btnLabel="İmtahanlara bax"
                            onBtn={() => navigate('/imtahanlar')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exams.map(exam => (
                                <div
                                    key={exam.orderId}
                                    onClick={() => navigate(`/imtahan/${exam.shareLink}`)}
                                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
                                >
                                    <div className="h-1 w-full bg-green-500" />
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="mb-3">
                                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                                Alınıb
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                            {exam.title}
                                        </h3>
                                        {exam.description && (
                                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
                                                {exam.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto mb-4">
                                            {exam.durationMinutes && (
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineClock className="w-3.5 h-3.5" />
                                                    {exam.durationMinutes} dəq
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <HiOutlineCalendar className="w-3.5 h-3.5" />
                                                {fmtDate(exam.purchasedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                                            <span className="text-sm font-black text-green-600">{exam.amountPaid} ₼</span>
                                            <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors">
                                                İmtahana Başla <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Results */}
                {tab === TAB_RESULTS && (
                    resultsLoading ? <SkeletonGrid /> :
                    results.length === 0 ? (
                        <EmptyState
                            icon={<HiOutlineClipboardList className="w-10 h-10 text-gray-300" />}
                            title="Nəticə yoxdur"
                            subtitle="Hələ heç bir imtahanı tamamlamamısınız."
                            btnLabel="İmtahanlara bax"
                            onBtn={() => navigate('/imtahanlar')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map(r => {
                                const pct = r.maxScore > 0 ? Math.round((r.totalScore / r.maxScore) * 100) : 0;
                                const passed = pct >= 50;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => navigate(`/test/result/${r.id}`)}
                                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
                                    >
                                        <div className={`h-1 w-full ${passed ? 'bg-green-500' : 'bg-red-400'}`} />
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                {r.isFullyGraded ? (
                                                    passed
                                                        ? <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                                            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Keçdi
                                                          </span>
                                                        : <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                                                            <HiOutlineXCircle className="w-3.5 h-3.5" /> Keçmədi
                                                          </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
                                                        Qiymətləndirilir
                                                    </span>
                                                )}
                                                <span className={`text-2xl font-black ${passed ? 'text-green-600' : 'text-red-500'}`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                {r.examTitle}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto mb-4">
                                                {r.submittedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineCalendar className="w-3.5 h-3.5" />
                                                        {fmtDate(r.submittedAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-2 text-xs">
                                                    {r.correctCount != null && (
                                                        <>
                                                            <span className="text-green-600 font-semibold">✓ {r.correctCount}</span>
                                                            <span className="text-red-500 font-semibold">✗ {r.wrongCount}</span>
                                                            {r.skippedCount > 0 && <span className="text-gray-400">— {r.skippedCount}</span>}
                                                        </>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-700 text-sm">
                                                    {r.totalScore}/{r.maxScore} bal
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

const TabBtn = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
    >
        {children}
    </button>
);

const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-1 w-full bg-gray-100" />
                <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded mt-4" />
                </div>
            </div>
        ))}
    </div>
);

const EmptyState = ({ icon, title, subtitle, btnLabel, onBtn }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <p className="font-bold text-gray-700 mb-1">{title}</p>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>
        <button
            onClick={onBtn}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
            {btnLabel}
        </button>
    </div>
);

export default StudentDashboard;
