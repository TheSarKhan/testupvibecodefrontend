import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineStar, HiOutlineUsers, HiOutlineTrendingUp, HiOutlineCheckCircle, HiOutlineDownload, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import DataTable from 'react-data-table-component';

const StarDisplay = ({ value }) => {
    const fullStars = Math.round(value || 0);
    return (
        <span className="text-yellow-400 text-lg tracking-tight">
            {'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}
        </span>
    );
};

const ExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [submissions, setSubmissions] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [subsRes, statsRes] = await Promise.all([
                    api.get(`/submissions/exam/${examId}`),
                    api.get(`/submissions/exam/${examId}/statistics`)
                ]);
                setSubmissions(subsRes.data);
                setStatistics(statsRes.data);
            } catch (error) {
                const msg = error.response?.status === 404
                    ? 'Belə bir imtahan tapılmadı'
                    : (error.response?.data?.message || 'Nəticələr yüklənmədi');
                toast.error(msg);
                navigate('/imtahanlar');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [examId]);

    const formatDuration = (startedAt, submittedAt) => {
        if (!startedAt || !submittedAt) return '–';
        const diffSec = Math.abs(new Date(submittedAt) - new Date(startedAt)) / 1000;
        const m = Math.floor(diffSec / 60);
        const s = Math.floor(diffSec % 60);
        return `${m}dk ${s}sn`;
    };

    const handleHide = async (id) => {
        setDeletingId(id);
        try {
            await api.delete(`/submissions/${id}/teacher-hide`);
            setSubmissions(prev => prev.filter(s => s.id !== id));
            setStatistics(prev => prev ? {
                ...prev,
                totalParticipants: Math.max(0, (prev.totalParticipants || 1) - 1),
            } : prev);
            toast.success('Nəticə statistikadan silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        } finally {
            setDeletingId(null);
            setConfirmId(null);
        }
    };

    const isPaid = isAdmin && statistics?.examPrice != null && statistics.examPrice > 0;

    const filteredSubmissions = useMemo(() =>
        filterText
            ? submissions.filter(r => r.studentName?.toLowerCase().includes(filterText.toLowerCase()))
            : submissions,
        [submissions, filterText]
    );

    const columns = useMemo(() => {
        const cols = [
            {
                name: 'İştirakçı',
                selector: r => r.studentName,
                sortable: true,
                cell: r => <span className="font-semibold text-gray-900 text-sm py-2">{r.studentName}</span>,
                minWidth: '160px',
            },
            {
                name: 'Başlayıb',
                selector: r => r.startedAt,
                sortable: true,
                cell: r => <span className="text-xs text-gray-500">{r.startedAt ? new Date(r.startedAt).toLocaleString('az-AZ') : '–'}</span>,
                minWidth: '160px',
            },
            {
                name: 'Vaxt',
                selector: r => r.startedAt && r.submittedAt
                    ? Math.abs(new Date(r.submittedAt) - new Date(r.startedAt)) / 1000
                    : 0,
                sortable: true,
                cell: r => <span className="text-xs font-mono text-gray-600">{formatDuration(r.startedAt, r.submittedAt)}</span>,
                minWidth: '90px',
            },
            {
                name: 'Bal',
                selector: r => r.totalScore ?? 0,
                sortable: true,
                cell: r => (
                    <span className="text-sm font-bold text-indigo-600">
                        {r.submittedAt
                            ? `${r.totalScore ?? 0} / ${r.maxScore ?? 0}`
                            : '–'}
                    </span>
                ),
                minWidth: '100px',
            },
            {
                name: 'Reytinq',
                selector: r => r.rating ?? 0,
                sortable: true,
                cell: r => r.rating ? <StarDisplay value={r.rating} /> : <span className="text-gray-300 text-sm">–</span>,
                minWidth: '110px',
            },
        ];

        if (isPaid) {
            cols.push({
                name: 'Ödəniş',
                selector: r => r.hasPaid ? 1 : 0,
                sortable: true,
                cell: r => r.hasPaid === true ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        ✓ {r.amountPaid != null ? `${Number(r.amountPaid).toFixed(2)} ₼` : 'Ödənib'}
                    </span>
                ) : r.hasPaid === false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        ✗ Ödənilməyib
                    </span>
                ) : <span className="text-gray-300 text-xs">–</span>,
                minWidth: '130px',
            });
        }

        cols.push(
            {
                name: 'Status',
                selector: r => r.isFullyGraded ? 2 : r.submittedAt ? 1 : 0,
                sortable: true,
                cell: r => (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.submittedAt
                            ? r.isFullyGraded ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                            : 'bg-blue-50 text-blue-700'
                    }`}>
                        {!r.submittedAt ? '⏳ Davam edir' : r.isFullyGraded ? <><HiOutlineCheckCircle className="w-3 h-3" /> Tam Yoxlanılıb</> : '⏳ Yoxlanılır'}
                    </span>
                ),
                minWidth: '140px',
            },
            {
                name: '',
                cell: r => (
                    <div className="flex items-center gap-1">
                        {r.submittedAt && (
                            <button
                                onClick={() => navigate(`/test/review/${r.id}`)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs whitespace-nowrap transition-colors"
                            >
                                Bax 👁️
                            </button>
                        )}
                        {confirmId === r.id ? (
                            <div className="flex items-center gap-1 ml-1">
                                <button
                                    onClick={() => handleHide(r.id)}
                                    disabled={deletingId === r.id}
                                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {deletingId === r.id ? '...' : 'Sil'}
                                </button>
                                <button
                                    onClick={() => setConfirmId(null)}
                                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    Ləğv et
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmId(r.id)}
                                className="ml-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Statistikadan sil"
                            >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ),
                width: '160px',
                ignoreRowClick: true,
            }
        );

        return cols;
    }, [isPaid, statistics, confirmId, deletingId]);

    const customStyles = {
        headRow: { style: { backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' } },
        headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '16px', paddingRight: '16px' } },
        cells: { style: { paddingLeft: '16px', paddingRight: '16px' } },
        rows: { style: { '&:not(:last-of-type)': { borderBottom: '1px solid #f9fafb' } }, highlightOnHoverStyle: { backgroundColor: '#f9fafb', transition: 'background-color 0.1s' } },
        pagination: { style: { borderTop: '1px solid #f3f4f6', fontSize: '13px', color: '#6b7280' } },
    };

    const exportToExcel = async () => {
        try {
            const response = await api.get(`/submissions/exam/${examId}/export`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `imtahan_${examId}_neticeler.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Excel faylı yüklənmədi');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/imtahanlar')}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="İmtahanlar sayfasına qayıt"
                    >
                        <HiOutlineArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">{statistics?.examTitle || 'İmtahan Nəticələri'}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">İmtahan ID: {examId}</p>
                            {isAdmin && (
                                statistics?.examPrice != null && statistics.examPrice > 0 ? (
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        Ödənişli · {Number(statistics.examPrice).toFixed(2)} ₼
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                        Pulsuz
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                    {submissions.length > 0 && (
                        <button
                            onClick={exportToExcel}
                            className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                        >
                            <HiOutlineDownload className="w-4 h-4" />
                            Excel
                        </button>
                    )}
                </div>
            </div>

            <div className="container-main mt-8 space-y-8">
                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total participants */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><HiOutlineUsers className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">İştirakçılar</p>
                                <p className="text-2xl font-black text-gray-900">{statistics.totalParticipants}</p>
                            </div>
                        </div>
                        {/* Average score */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><HiOutlineTrendingUp className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Bal</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {statistics.averageScore?.toFixed(1)} <span className="text-gray-400 text-sm font-normal">/ {statistics.maximumScore}</span>
                                </p>
                            </div>
                        </div>
                        {/* Average time */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><HiOutlineClock className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Vaxt</p>
                                <p className="text-2xl font-black text-gray-900">{statistics.averageDurationMinutes}dk</p>
                            </div>
                        </div>
                        {/* Average rating */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><HiOutlineStar className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-gray-500">Ort. Reytinq</p>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : '–'}</p>
                                    {statistics.averageRating > 0 && <StarDisplay value={statistics.averageRating} />}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top 5 Students — compact inline leaderboard */}
                {statistics?.topStudents?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🏆 Top 5 Şagird</p>
                        <div className="flex flex-col divide-y divide-gray-50">
                            {statistics.topStudents.map((student, idx) => {
                                const medals = ['🥇','🥈','🥉'];
                                return (
                                    <div key={idx} className="flex items-center gap-3 py-2">
                                        <span className="text-base w-6 text-center flex-shrink-0">
                                            {medals[idx] ?? <span className="text-xs font-bold text-gray-400">{idx + 1}</span>}
                                        </span>
                                        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{student.name}</span>
                                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">{student.timeSpent}</span>
                                        <span className="text-sm font-black text-indigo-600 flex-shrink-0 w-16 text-right">{student.score} bal</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Full Participant Table — DataTable */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-gray-900">Bütün İştirakçılar</h2>
                            {submissions.length > 0 && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{submissions.length}</span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Ad ilə axtar..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44"
                        />
                    </div>
                    <DataTable
                        columns={columns}
                        data={filteredSubmissions}
                        pagination
                        paginationPerPage={20}
                        paginationRowsPerPageOptions={[10, 20, 50, 100]}
                        paginationComponentOptions={{
                            rowsPerPageText: 'Sətir sayı:',
                            rangeSeparatorText: '/',
                            noRowsPerPage: false,
                            selectAllRowsItem: false,
                        }}
                        noDataComponent={
                            <div className="py-16 text-center text-gray-400 text-sm">
                                {filterText ? 'Axtarışa uyğun nəticə tapılmadı.' : 'Hələ heç bir iştirakçı bu imtahanı verməyib.'}
                            </div>
                        }
                        customStyles={customStyles}
                        highlightOnHover
                        responsive
                        defaultSortFieldId={1}
                    />
                </div>
            </div>
        </div>
    );
};

export default ExamResults;
