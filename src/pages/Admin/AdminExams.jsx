import { useState, useEffect, useCallback } from 'react';
import {
    HiOutlineSearch, HiOutlineTrash, HiOutlineGlobe, HiOutlineLockClosed,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineExternalLink,
    HiOutlineChartBar,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUSES = [
    { value: '', label: 'Hamısı' },
    { value: 'PUBLISHED', label: 'Yayımlı' },
    { value: 'DRAFT', label: 'Qaralama' },
    { value: 'CANCELLED', label: 'Bağlı' },
];

const statusBadgeClass = {
    DRAFT: 'bg-amber-100 text-amber-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
};
const statusLabel = {
    DRAFT: 'Qaralama', PUBLISHED: 'Yayımlı', CANCELLED: 'Bağlı', ACTIVE: 'Aktiv',
};

const AdminExams = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [priceInputs, setPriceInputs] = useState({});
    const [savingPrice, setSavingPrice] = useState({});

    const fetchExams = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, size: 20, teacherRoleName: 'TEACHER' });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            const { data } = await api.get(`/admin/exams?${params}`);
            setExams(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch {
            toast.error('İmtahanlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page]);

    useEffect(() => { fetchExams(); }, [fetchExams]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setSearch(searchInput);
    };

    const handleToggleSitePublish = async (examId) => {
        const prev = exams.find(e => e.id === examId)?.sitePublished;
        setExams(exams.map(e => e.id === examId ? { ...e, sitePublished: !prev } : e));
        try {
            const { data } = await api.patch(`/admin/exams/${examId}/site-publish`);
            setExams(ex => ex.map(e => e.id === examId ? { ...e, sitePublished: data.sitePublished } : e));
            toast.success(data.sitePublished ? 'Saytda paylaşıldı' : 'Saytdan silindi');
        } catch {
            setExams(exams.map(e => e.id === examId ? { ...e, sitePublished: prev } : e));
            toast.error('Xəta baş verdi');
        }
    };

    const handlePriceChange = (examId, value) => {
        setPriceInputs(prev => ({ ...prev, [examId]: value }));
    };

    const handlePriceSave = async (examId) => {
        const raw = priceInputs[examId];
        const price = raw === '' || raw == null ? null : parseFloat(raw);
        if (price !== null && (isNaN(price) || price < 0)) {
            toast.error('Düzgün qiymət daxil edin');
            return;
        }
        setSavingPrice(prev => ({ ...prev, [examId]: true }));
        try {
            const { data } = await api.patch(`/admin/exams/${examId}/price`, { price });
            setExams(ex => ex.map(e => e.id === examId ? { ...e, price: data.price } : e));
            setPriceInputs(prev => { const n = { ...prev }; delete n[examId]; return n; });
            toast.success('Qiymət yadda saxlandı');
        } catch {
            toast.error('Qiymət saxlanılmadı');
        } finally {
            setSavingPrice(prev => ({ ...prev, [examId]: false }));
        }
    };

    const handleDelete = async (examId, title) => {
        if (!window.confirm(`"${title}" imtahanını silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/exams/${examId}`);
            setExams(exams.filter(e => e.id !== examId));
            toast.success('İmtahan silindi');
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const getPriceDisplay = (exam) => {
        if (priceInputs[exam.id] !== undefined) return priceInputs[exam.id];
        return exam.price != null ? String(exam.price) : '';
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Müəllim İmtahanları</h1>
                <p className="text-gray-500 mt-1 text-sm">
                    {totalElements > 0 ? `${totalElements} imtahan tapıldı` : 'İmtahan tapılmadı'} · Saytda paylaş, qiymət təyin et, statistikaya bax
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İmtahan adı ilə axtar..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                        Axtar
                    </button>
                </form>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {STATUSES.map(s => (
                        <button
                            key={s.value}
                            onClick={() => { setStatusFilter(s.value); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${statusFilter === s.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">İmtahan tapılmadı</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">İmtahan</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Müəllim</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Saytda</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qiymət (₼)</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Əməliyyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {exams.map(exam => (
                                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900 leading-tight">{exam.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{exam.questionCount} sual · {(exam.subjects || []).join(', ') || exam.subject}</p>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <p className="text-gray-700 font-medium text-xs">{exam.teacherName}</p>
                                        <p className="text-xs text-gray-400">{exam.teacherEmail}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass[exam.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {statusLabel[exam.status] || exam.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleSitePublish(exam.id)}
                                            title={exam.sitePublished ? 'Saytdan çıxar' : 'Saytda paylaş'}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                                                exam.sitePublished
                                                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                            }`}
                                        >
                                            {exam.sitePublished
                                                ? <><HiOutlineGlobe className="w-3.5 h-3.5" /> Paylaşılıb</>
                                                : <><HiOutlineLockClosed className="w-3.5 h-3.5" /> Gizli</>
                                            }
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₼</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Pulsuz"
                                                    value={getPriceDisplay(exam)}
                                                    onChange={e => handlePriceChange(exam.id, e.target.value)}
                                                    className="w-24 pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400"
                                                />
                                            </div>
                                            {priceInputs[exam.id] !== undefined && (
                                                <button
                                                    onClick={() => handlePriceSave(exam.id)}
                                                    disabled={savingPrice[exam.id]}
                                                    className="px-2 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {savingPrice[exam.id] ? '...' : 'Saxla'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)}
                                                className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Statistika"
                                            >
                                                <HiOutlineChartBar className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={`/imtahan/${exam.shareLink}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="İmtahana bax"
                                            >
                                                <HiOutlineExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(exam.id, exam.title)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Səhifə {page + 1} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                            <HiOutlineChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExams;
