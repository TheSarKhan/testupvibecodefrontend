import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineClipboardList,
    HiOutlineClock,
    HiOutlineShoppingBag,
    HiOutlineArrowRight,
    HiOutlineCalendar,
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineStar,
    HiOutlineUser,
    HiOutlineSortAscending,
    HiOutlineFilter,
    HiOutlineX,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineSearch,
} from 'react-icons/hi';
import api from '../../api/axios';

const TAB_EXAMS = 'exams';
const TAB_RESULTS = 'results';

const SCORE_RANGES = [
    { key: '75-100', label: '75–100%', min: 75, max: 100 },
    { key: '50-75',  label: '50–75%',  min: 50, max: 75  },
    { key: '25-50',  label: '25–50%',  min: 25, max: 50  },
    { key: '0-25',   label: '0–25%',   min: 0,  max: 25  },
];

const EMPTY_FILTERS = {
    search: '',
    subjects: [],
    tags: [],
    teachers: [],
    scoreRanges: [],
    status: 'all',      // 'all' | 'graded' | 'pending'
    dateFrom: '',
    dateTo: '',
    minRating: 0,
};

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState(TAB_EXAMS);

    const [exams, setExams] = useState([]);
    const [examsLoading, setExamsLoading] = useState(true);

    const [results, setResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(true);
    const [resultSort, setResultSort] = useState('time');

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [filterOpen, setFilterOpen] = useState(false);

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

    // Derive unique filter options from results
    const filterOptions = useMemo(() => {
        const subjects = new Set();
        const tags = new Set();
        const teachers = new Set();
        results.forEach(r => {
            (r.subjects || []).forEach(s => subjects.add(s));
            (r.tags || []).forEach(t => tags.add(t));
            if (r.teacherName) teachers.add(r.teacherName);
        });
        return {
            subjects: [...subjects].sort((a, b) => a.localeCompare(b, 'az')),
            tags: [...tags].sort((a, b) => a.localeCompare(b, 'az')),
            teachers: [...teachers].sort((a, b) => a.localeCompare(b, 'az')),
        };
    }, [results]);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (filters.search.trim()) n++;
        if (filters.subjects.length) n++;
        if (filters.tags.length) n++;
        if (filters.teachers.length) n++;
        if (filters.scoreRanges.length) n++;
        if (filters.status !== 'all') n++;
        if (filters.dateFrom) n++;
        if (filters.dateTo) n++;
        if (filters.minRating > 0) n++;
        return n;
    }, [filters]);

    const patchFilter = useCallback((patch) => setFilters(f => ({ ...f, ...patch })), []);

    const toggleArr = useCallback((field, value) => {
        setFilters(f => {
            const arr = f[field];
            return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
        });
    }, []);

    const sortedFilteredResults = useMemo(() => {
        let arr = [...results];

        // --- filters ---
        const search = filters.search.trim().toLowerCase();
        if (search) {
            arr = arr.filter(r =>
                (r.examTitle || '').toLowerCase().includes(search) ||
                (r.subjects || []).some(s => s.toLowerCase().includes(search)) ||
                (r.tags || []).some(t => t.toLowerCase().includes(search)) ||
                (r.teacherName || '').toLowerCase().includes(search)
            );
        }
        if (filters.subjects.length) {
            arr = arr.filter(r => filters.subjects.some(s => (r.subjects || []).includes(s)));
        }
        if (filters.tags.length) {
            arr = arr.filter(r => filters.tags.some(t => (r.tags || []).includes(t)));
        }
        if (filters.teachers.length) {
            arr = arr.filter(r => filters.teachers.includes(r.teacherName));
        }
        if (filters.scoreRanges.length) {
            arr = arr.filter(r => {
                const pct = r.maxScore > 0 ? Math.round((r.totalScore / r.maxScore) * 100) : 0;
                return filters.scoreRanges.some(key => {
                    const range = SCORE_RANGES.find(x => x.key === key);
                    return range && pct >= range.min && pct <= range.max;
                });
            });
        }
        if (filters.status === 'graded') arr = arr.filter(r => r.isFullyGraded);
        if (filters.status === 'pending') arr = arr.filter(r => !r.isFullyGraded);
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom);
            arr = arr.filter(r => r.submittedAt && new Date(r.submittedAt) >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo);
            to.setHours(23, 59, 59, 999);
            arr = arr.filter(r => r.submittedAt && new Date(r.submittedAt) <= to);
        }
        if (filters.minRating > 0) {
            arr = arr.filter(r => r.rating && r.rating >= filters.minRating);
        }

        // --- sort ---
        if (resultSort === 'time') {
            arr.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        } else if (resultSort === 'subject') {
            arr.sort((a, b) => {
                const sa = (a.subjects || [])[0] || '';
                const sb = (b.subjects || [])[0] || '';
                return sa.localeCompare(sb, 'az');
            });
        } else if (resultSort === 'result') {
            arr.sort((a, b) => {
                const pa = a.maxScore > 0 ? (a.totalScore / a.maxScore) : 0;
                const pb = b.maxScore > 0 ? (b.totalScore / b.maxScore) : 0;
                return pb - pa;
            });
        }
        return arr;
    }, [results, resultSort, filters]);

    const fmtDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-10">

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
                        <>
                        {/* Sort + Filter toolbar */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={e => patchFilter({ search: e.target.value })}
                                    placeholder="Axtarış..."
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-1.5">
                                <HiOutlineSortAscending className="w-4 h-4 text-gray-400" />
                                {[
                                    { key: 'time', label: 'Vaxt' },
                                    { key: 'subject', label: 'Fənn' },
                                    { key: 'result', label: 'Nəticə' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setResultSort(key)}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                            resultSort === key
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                    filterOpen || activeFilterCount > 0
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                            >
                                <HiOutlineFilter className="w-4 h-4" />
                                Filterlər
                                {activeFilterCount > 0 && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                        {activeFilterCount}
                                    </span>
                                )}
                                {filterOpen ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => setFilters(EMPTY_FILTERS)}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2"
                                >
                                    <HiOutlineX className="w-3.5 h-3.5" /> Sıfırla
                                </button>
                            )}

                            <span className="ml-auto text-xs text-gray-400 font-medium">
                                {sortedFilteredResults.length} / {results.length} nəticə
                            </span>
                        </div>

                        {/* Filter panel */}
                        {filterOpen && (
                            <ResultFilterPanel
                                filters={filters}
                                options={filterOptions}
                                patchFilter={patchFilter}
                                toggleArr={toggleArr}
                            />
                        )}

                        {/* Active filter chips */}
                        {activeFilterCount > 0 && (
                            <ActiveFilterChips
                                filters={filters}
                                patchFilter={patchFilter}
                                toggleArr={toggleArr}
                            />
                        )}

                        {/* Grid */}
                        {sortedFilteredResults.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mt-4">
                                <HiOutlineFilter className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="font-semibold text-gray-600 mb-1">Nəticə tapılmadı</p>
                                <p className="text-sm text-gray-400">Filter şərtlərini dəyişdirin</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {sortedFilteredResults.map(r => {
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
                                            <div className="h-1.5 w-full bg-gray-100">
                                                <div
                                                    className={`h-full rounded-r-full transition-all duration-500 ${
                                                        accentColor === 'green' ? 'bg-green-500' : accentColor === 'red' ? 'bg-red-400' : 'bg-amber-400'
                                                    }`}
                                                    style={{ width: `${Math.max(pct, 2)}%` }}
                                                />
                                            </div>

                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {!r.isFullyGraded && (
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

                                                <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                    {r.examTitle}
                                                </h3>

                                                {subjects.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                                                        <HiOutlineAcademicCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="font-medium text-gray-700 truncate">{subjects.join(', ')}</span>
                                                    </div>
                                                )}

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
                        )}
                        </>
                    )
                )}
            </div>
        </div>
    );
};

/* ─── Filter Panel ─────────────────────────────────────────── */
const ResultFilterPanel = ({ filters, options, patchFilter, toggleArr }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Fənn */}
            {options.subjects.length > 0 && (
                <FilterGroup title="Fənn" icon={<HiOutlineAcademicCap className="w-4 h-4" />}>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {options.subjects.map(s => (
                            <Chip
                                key={s}
                                active={filters.subjects.includes(s)}
                                onClick={() => toggleArr('subjects', s)}
                            >
                                {s}
                            </Chip>
                        ))}
                    </div>
                </FilterGroup>
            )}

            {/* Bal aralığı */}
            <FilterGroup title="Bal aralığı" icon={<HiOutlineDocumentText className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {SCORE_RANGES.map(({ key, label }) => (
                        <Chip
                            key={key}
                            active={filters.scoreRanges.includes(key)}
                            onClick={() => toggleArr('scoreRanges', key)}
                        >
                            {label}
                        </Chip>
                    ))}
                </div>
            </FilterGroup>

            {/* Status */}
            <FilterGroup title="Status" icon={<HiOutlineClipboardList className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                        { key: 'all', label: 'Hamısı' },
                        { key: 'graded', label: 'Qiymətləndirilmiş' },
                        { key: 'pending', label: 'Gözlənilir' },
                    ].map(({ key, label }) => (
                        <Chip
                            key={key}
                            active={filters.status === key}
                            onClick={() => patchFilter({ status: key })}
                        >
                            {label}
                        </Chip>
                    ))}
                </div>
            </FilterGroup>

            {/* Tarix aralığı */}
            <FilterGroup title="Tarix aralığı" icon={<HiOutlineCalendar className="w-4 h-4" />}>
                <div className="flex gap-2 mt-2">
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={e => patchFilter({ dateFrom: e.target.value })}
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                    <span className="text-gray-400 self-center text-xs">—</span>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={e => patchFilter({ dateTo: e.target.value })}
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                </div>
            </FilterGroup>

            {/* Müəllim */}
            {options.teachers.length > 0 && (
                <FilterGroup title="Müəllim" icon={<HiOutlineUser className="w-4 h-4" />}>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {options.teachers.map(t => (
                            <Chip
                                key={t}
                                active={filters.teachers.includes(t)}
                                onClick={() => toggleArr('teachers', t)}
                            >
                                {t}
                            </Chip>
                        ))}
                    </div>
                </FilterGroup>
            )}

            {/* Reytinq */}
            <FilterGroup title="Minimum reytinq" icon={<HiOutlineStar className="w-4 h-4" />}>
                <div className="flex items-center gap-1 mt-2">
                    {[0, 1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            onClick={() => patchFilter({ minRating: n })}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                filters.minRating === n
                                    ? 'bg-amber-400 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600'
                            }`}
                        >
                            {n === 0 ? 'Hər' : `${n}★`}
                        </button>
                    ))}
                </div>
            </FilterGroup>

            {/* Etiketlər */}
            {options.tags.length > 0 && (
                <FilterGroup title="Etiketlər" icon={<HiOutlineDocumentText className="w-4 h-4" />} className="sm:col-span-2 lg:col-span-2">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {options.tags.map(t => (
                            <Chip
                                key={t}
                                active={filters.tags.includes(t)}
                                onClick={() => toggleArr('tags', t)}
                            >
                                #{t}
                            </Chip>
                        ))}
                    </div>
                </FilterGroup>
            )}
        </div>
    );
};

/* ─── Active filter chips bar ──────────────────────────────── */
const ActiveFilterChips = ({ filters, patchFilter, toggleArr }) => {
    const chips = [];

    if (filters.status !== 'all') {
        const labels = { graded: 'Qiymətləndirilmiş', pending: 'Gözlənilir' };
        chips.push({ label: labels[filters.status], onRemove: () => patchFilter({ status: 'all' }) });
    }
    filters.subjects.forEach(s => chips.push({ label: s, onRemove: () => toggleArr('subjects', s) }));
    filters.teachers.forEach(t => chips.push({ label: t, onRemove: () => toggleArr('teachers', t) }));
    filters.scoreRanges.forEach(k => {
        const r = SCORE_RANGES.find(x => x.key === k);
        if (r) chips.push({ label: r.label, onRemove: () => toggleArr('scoreRanges', k) });
    });
    filters.tags.forEach(t => chips.push({ label: `#${t}`, onRemove: () => toggleArr('tags', t) }));
    if (filters.dateFrom) chips.push({ label: `≥ ${filters.dateFrom}`, onRemove: () => patchFilter({ dateFrom: '' }) });
    if (filters.dateTo) chips.push({ label: `≤ ${filters.dateTo}`, onRemove: () => patchFilter({ dateTo: '' }) });
    if (filters.minRating > 0) chips.push({ label: `≥ ${filters.minRating}★`, onRemove: () => patchFilter({ minRating: 0 }) });

    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.map((c, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full"
                >
                    {c.label}
                    <button onClick={c.onRemove} className="ml-0.5 hover:text-indigo-900 transition-colors">
                        <HiOutlineX className="w-3 h-3" />
                    </button>
                </span>
            ))}
        </div>
    );
};

/* ─── Small helpers ────────────────────────────────────────── */
const FilterGroup = ({ title, icon, children, className = '' }) => (
    <div className={className}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const Chip = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
    >
        {children}
    </button>
);

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
