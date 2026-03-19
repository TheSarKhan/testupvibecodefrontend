import { useState, useEffect, useCallback } from 'react';
import {
    HiOutlineClipboardList,
    HiOutlineSearch,
    HiOutlineRefresh,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
} from 'react-icons/hi';
import api from '../../api/axios';

const ACTION_LABELS = {
    USER_LOGIN: 'Giriş',
    USER_LOGIN_FAILED: 'Giriş uğursuz',
    USER_REGISTERED: 'Qeydiyyat',
    USER_ROLE_CHANGED: 'Rol dəyişdirildi',
    USER_DELETED: 'İstifadəçi silindi',
    USER_TOGGLED: 'Status dəyişdi',
    USER_EXAM_ASSIGNED: 'İmtahan təyin edildi',
    EXAM_CREATED: 'İmtahan yaradıldı',
    EXAM_DELETED: 'İmtahan silindi',
    EXAM_SITE_PUBLISHED: 'Saytda paylaşıldı',
    EXAM_SITE_UNPUBLISHED: 'Saytdan çıxarıldı',
    SUBJECT_ADDED: 'Fənn əlavə edildi',
    SUBJECT_DELETED: 'Fənn silindi',
    TOPIC_ADDED: 'Mövzu əlavə edildi',
    TOPIC_DELETED: 'Mövzu silindi',
    NOTIFICATION_SENT: 'Bildiriş göndərildi',
    SUBSCRIPTION_PURCHASED: 'Abunəlik alındı',
    SUBSCRIPTION_SWITCHED: 'Plan dəyişdirildi',
    SUBSCRIPTION_ASSIGNED_MANUAL: 'Plan əl ilə təyin edildi',
    SUBSCRIPTION_CANCELLED: 'Abunəlik ləğv edildi',
    SYSTEM_ERROR: 'Sistem xətası',
};

const CATEGORIES = [
    { key: 'ALL', label: 'Hamısı' },
    { key: 'AUTH', label: 'Giriş/Çıxış' },
    { key: 'USER', label: 'İstifadəçi' },
    { key: 'EXAM', label: 'İmtahan' },
    { key: 'CONTENT', label: 'Kontent' },
    { key: 'PAYMENT', label: 'Ödəniş' },
    { key: 'SYSTEM', label: 'Sistem' },
];

const CATEGORY_STYLES = {
    AUTH:    'bg-blue-100 text-blue-700',
    USER:    'bg-purple-100 text-purple-700',
    EXAM:    'bg-indigo-100 text-indigo-700',
    CONTENT: 'bg-teal-100 text-teal-700',
    PAYMENT: 'bg-emerald-100 text-emerald-700',
    SYSTEM:  'bg-gray-100 text-gray-600',
};

const PERIODS = [
    { key: '', label: 'Hamısı' },
    { key: 'TODAY', label: 'Bu gün' },
    { key: 'WEEK', label: 'Bu həftə' },
    { key: 'MONTH', label: 'Bu ay' },
];

const relativeTime = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'İndicə';
    if (mins < 60) return `${mins} dəq əvvəl`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat əvvəl`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Dünən';
    return `${days} gün əvvəl`;
};

const formatExact = (isoStr) => {
    if (!isoStr) return '';
    try {
        return new Date(isoStr).toLocaleString('az-AZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch {
        return isoStr;
    }
};

const SkeletonRow = () => (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div className="w-24 h-5 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="w-56 h-3 bg-gray-100 rounded" />
        </div>
        <div className="w-20 h-3 bg-gray-100 rounded" />
    </div>
);

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [period, setPeriod] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchLogs = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('size', 30);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (period) params.set('period', period);

        api.get(`/admin/logs?${params.toString()}`)
            .then(res => {
                const data = res.data;
                setLogs(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
            })
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [page, debouncedSearch, period]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset page when period changes
    const handlePeriodChange = (p) => {
        setPeriod(p);
        setPage(0);
    };

    // Client-side category filter
    const filteredLogs = activeCategory === 'ALL'
        ? logs
        : logs.filter(l => l.category === activeCategory);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Loglar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Sistem əməliyyatlarının tam tarixçəsi</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenilə
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4">
                {/* Search + Period bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="E-poçt, ad, hədəf axtar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => handlePeriodChange(p.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    period === p.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {totalElements > 0 && (
                        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                            {totalElements} qeyd
                        </span>
                    )}
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                activeCategory === cat.key
                                    ? cat.key === 'ALL'
                                        ? 'bg-gray-800 text-white'
                                        : `${CATEGORY_STYLES[cat.key]} ring-1 ring-inset ring-current`
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log List */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-gray-50">
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <HiOutlineClipboardList className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-700 font-semibold text-base">Heç bir log tapılmadı</p>
                        <p className="text-gray-400 text-sm mt-1">Seçilmiş filtrə uyğun qeyd yoxdur</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredLogs.map(log => (
                            <LogRow key={log.id} log={log} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <HiOutlineChevronLeft className="w-4 h-4" />
                        Əvvəlki
                    </button>
                    <span className="text-sm text-gray-500">
                        Səhifə {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Növbəti
                        <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const LogRow = ({ log }) => {
    const catStyle = CATEGORY_STYLES[log.category] || CATEGORY_STYLES.SYSTEM;
    const actionLabel = ACTION_LABELS[log.action] || log.action;

    return (
        <div className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
            {/* Action badge */}
            <div className="flex-shrink-0 mt-0.5">
                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg ${catStyle}`}>
                    {actionLabel}
                </span>
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                        {log.actorName || log.actorEmail || '—'}
                    </span>
                    {log.actorEmail && log.actorName && log.actorEmail !== log.actorName && (
                        <span className="text-xs text-gray-400 truncate">{log.actorEmail}</span>
                    )}
                    {log.targetType && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                            {log.targetType}
                        </span>
                    )}
                </div>
                {log.targetName && (
                    <p className="text-sm text-gray-600 mt-0.5 truncate">
                        {log.targetName}
                    </p>
                )}
                {log.details && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {log.details}
                    </p>
                )}
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right">
                <span
                    className="text-xs text-gray-400 cursor-default"
                    title={formatExact(log.createdAt)}
                >
                    {relativeTime(log.createdAt)}
                </span>
            </div>
        </div>
    );
};

export default AdminLogs;
