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
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineStar,
    HiOutlineUser,
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
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
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
                                const totalQ = r.questionCount || ((r.correctCount || 0) + (r.wrongCount || 0) + (r.skippedCount || 0) + (r.pendingManualCount || 0));
                                const gradedQ = (r.correctCount || 0) + (r.wrongCount || 0) + (r.skippedCount || 0);
                                const accentColor = r.isFullyGraded ? (passed ? 'green' : 'red') : 'amber';
                                const subjects = r.subjects || [];
                                const tags = r.tags || [];

                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => navigate(`/test/result/${r.id}`)}
                                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
                                    >
                                        {/* Progress bar */}
                                        <div className="h-1.5 w-full bg-gray-100">
                                            <div
                                                className={`h-full rounded-r-full transition-all duration-500 ${
                                                    accentColor === 'green' ? 'bg-green-500' : accentColor === 'red' ? 'bg-red-400' : 'bg-amber-400'
                                                }`}
                                                style={{ width: `${Math.max(pct, 2)}%` }}
                                            />
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Status badges + percent */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {r.isFullyGraded ? (
                                                        passed
                                                            ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                                <HiOutlineCheckCircle className="w-3 h-3" /> Keçdi
                                                              </span>
                                                            : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                                                <HiOutlineXCircle className="w-3 h-3" /> Keçmədi
                                                              </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                            <HiOutlineClock className="w-3 h-3" /> Qiymətləndirilir
                                                        </span>
                                                    )}
                                                    {r.pendingManualCount > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                            <HiOutlineClipboardList className="w-3 h-3" /> {r.pendingManualCount} yoxlanılır
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-2xl font-black shrink-0 leading-none ${
                                                    accentColor === 'green' ? 'text-green-600' : accentColor === 'red' ? 'text-red-500' : 'text-amber-600'
                                                }`}>
                                                    {pct}%
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                {r.examTitle}
                                            </h3>

                                            {/* Subjects */}
                                            {subjects.length > 0 && (
                                                <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                                                    <HiOutlineAcademicCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="font-medium text-gray-700 truncate">{subjects.join(', ')}</span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {tags.slice(0, 4).map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-full font-medium">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {tags.length > 4 && (
                                                        <span className="px-2 py-0.5 text-gray-400 text-[11px] font-medium">+{tags.length - 4}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Answer breakdown bar */}
                                            {totalQ > 0 && (
                                                <div className="mt-auto mb-3">
                                                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                                                        {(r.correctCount || 0) > 0 && (
                                                            <div className="bg-green-500" style={{ width: `${((r.correctCount || 0) / totalQ) * 100}%` }} title={`${r.correctCount} doğru`} />
                                                        )}
                                                        {(r.wrongCount || 0) > 0 && (
                                                            <div className="bg-red-400" style={{ width: `${((r.wrongCount || 0) / totalQ) * 100}%` }} title={`${r.wrongCount} yanlış`} />
                                                        )}
                                                        {(r.skippedCount || 0) > 0 && (
                                                            <div className="bg-gray-300" style={{ width: `${((r.skippedCount || 0) / totalQ) * 100}%` }} title={`${r.skippedCount} boş`} />
                                                        )}
                                                        {(r.pendingManualCount || 0) > 0 && (
                                                            <div className="bg-amber-400" style={{ width: `${((r.pendingManualCount || 0) / totalQ) * 100}%` }} title={`${r.pendingManualCount} yoxlanılır`} />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                                                        {(r.correctCount || 0) > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{r.correctCount} doğru</span>}
                                                        {(r.wrongCount || 0) > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{r.wrongCount} yanlış</span>}
                                                        {(r.skippedCount || 0) > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />{r.skippedCount} boş</span>}
                                                        {(r.pendingManualCount || 0) > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{r.pendingManualCount} yoxlanılır</span>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer meta */}
                                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                                {r.submittedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-400" />
                                                        {fmtDate(r.submittedAt)}
                                                    </span>
                                                )}
                                                {r.durationMinutes && (
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineClock className="w-3.5 h-3.5 text-gray-400" />
                                                        {r.durationMinutes} dəq
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineDocumentText className="w-3.5 h-3.5 text-gray-400" />
                                                    {!r.isFullyGraded && totalQ !== gradedQ ? `${gradedQ}/${totalQ}` : totalQ} sual
                                                </span>
                                                <span className="ml-auto font-bold text-gray-700">
                                                    {r.totalScore}/{r.maxScore} bal
                                                </span>
                                            </div>

                                            {/* Teacher + Rating */}
                                            {(r.teacherName || r.rating) && (
                                                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                                    {r.teacherName && (
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineUser className="w-3.5 h-3.5" />
                                                            {r.teacherName}
                                                        </span>
                                                    )}
                                                    {r.rating && (
                                                        <span className="flex items-center gap-0.5 text-amber-500">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <HiOutlineStar key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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
