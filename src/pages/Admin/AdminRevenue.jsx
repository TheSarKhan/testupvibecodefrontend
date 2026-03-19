import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineTrendingDown,
    HiOutlineUsers, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineExclamationCircle
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const monthNames = {
    '01': 'Yan', '02': 'Fev', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'İyn', '07': 'İyl', '08': 'Avq',
    '09': 'Sen', '10': 'Okt', '11': 'Noy', '12': 'Dek'
};

const fmt = (n) => (n ?? 0).toFixed(2);

const RevenueBarChart = ({ data }) => {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-36 text-gray-300 text-sm">Məlumat yoxdur</div>
    );
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="flex items-end gap-2 h-36">
            {data.map((d, i) => {
                const [year, mon] = d.month.split('-');
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500">
                            {d.revenue > 0 ? `${Math.round(d.revenue)}` : ''}
                        </span>
                        <div
                            className="w-full rounded-t-lg bg-emerald-400 transition-all"
                            style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 6 : 2)}px` }}
                            title={`${d.revenue.toFixed(2)} AZN — ${d.orders} ödəniş`}
                        />
                        <span className="text-[10px] text-gray-400">{monthNames[mon]}</span>
                    </div>
                );
            })}
        </div>
    );
};

const AdminRevenue = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState([]);
    const [verifying, setVerifying] = useState(null);

    const fetchStats = () => {
        setLoading(true);
        Promise.all([
            api.get('/admin/revenue').then(r => r.data),
            api.get('/admin/revenue/pending-orders').then(r => r.data).catch(() => []),
        ]).then(([rev, pend]) => { setStats(rev); setPending(pend); }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchStats(); }, []);

    const handleVerify = async (orderId) => {
        setVerifying(orderId + '_check');
        try {
            const { data } = await api.post(`/admin/revenue/verify-order/${orderId}`);
            if (data.success) {
                toast.success(data.alreadyPaid ? 'Artıq aktiv idi' : 'Abunəlik aktivləşdirildi!');
                fetchStats();
            } else {
                toast(`Payriff statusu: ${data.payriffStatus || 'UNKNOWN'} — ödəniş tamamlanmayıb`, { icon: '⚠️' });
            }
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setVerifying(null);
        }
    };

    const handleForceActivate = async (orderId) => {
        if (!window.confirm('Payriff statusundan asılı olmayaraq bu abunəliyi aktivləşdirirsiniz. Əminsiniz?')) return;
        setVerifying(orderId + '_force');
        try {
            const { data } = await api.post(`/admin/revenue/force-activate/${orderId}`);
            if (data.success) {
                toast.success('Abunəlik məcburi aktivləşdirildi!');
                fetchStats();
            }
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setVerifying(null);
        }
    };

    const handleCancel = async (orderId) => {
        if (!window.confirm('Bu pending orderi ləğv edirsiniz. Əminsiniz?')) return;
        setVerifying(orderId + '_cancel');
        try {
            await api.post(`/admin/revenue/cancel-order/${orderId}`);
            toast.success('Order ləğv edildi');
            fetchStats();
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setVerifying(null);
        }
    };

    const growthPositive = (stats?.growthPct ?? 0) >= 0;

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Qazanc Statistikası</h1>
                    <p className="text-gray-500 mt-1 text-sm">Payriff vasitəsilə gələn ödənişlər</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <HiOutlineRefresh className="w-4 h-4" />
                    Yenilə
                </button>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
                    <p className="text-emerald-100 text-xs font-medium mb-1">Ümumi Qazanc</p>
                    <p className="text-3xl font-extrabold tabular-nums">{fmt(stats?.totalRevenue)}</p>
                    <p className="text-emerald-200 text-xs mt-1">AZN — Bütün zamanlar</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <HiOutlineCurrencyDollar className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs font-medium text-gray-500">Bu ay</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(stats?.thisMonthRevenue)} <span className="text-sm font-normal text-gray-400">AZN</span></p>
                    <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${growthPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {growthPositive
                            ? <HiOutlineTrendingUp className="w-3.5 h-3.5" />
                            : <HiOutlineTrendingDown className="w-3.5 h-3.5" />
                        }
                        {growthPositive ? '+' : ''}{fmt(stats?.growthPct)}% ötən aya nisbətən
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <HiOutlineCheckCircle className="w-4 h-4 text-teal-500" />
                        <p className="text-xs font-medium text-gray-500">Ötən ay</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(stats?.lastMonthRevenue)} <span className="text-sm font-normal text-gray-400">AZN</span></p>
                    <p className="text-xs text-gray-400 mt-1">{stats?.totalPaidOrders ?? 0} ödəniş cəmi</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <HiOutlineUsers className="w-4 h-4 text-purple-500" />
                        <p className="text-xs font-medium text-gray-500">Aktiv Abunəliklər</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats?.activeSubscriptions ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Hal-hazırda aktiv</p>
                </div>
            </div>

            {/* Chart + Plan breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly revenue chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineTrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-gray-800 text-sm">Son 6 ay — Aylıq Qazanc (AZN)</span>
                    </div>
                    <RevenueBarChart data={stats?.monthlyRevenue} />
                    {stats?.monthlyRevenue?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                            {stats.monthlyRevenue.map(m => (
                                <div key={m.month} className="flex flex-col items-center">
                                    <span className="font-semibold text-gray-700">{fmt(m.revenue)} AZN</span>
                                    <span>{m.orders} ödəniş</span>
                                    <span className="text-gray-400">{m.month}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Revenue by plan */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Plana görə qazanc</h3>
                    {stats?.revenueByPlan?.length > 0 ? (() => {
                        const maxR = Math.max(...stats.revenueByPlan.map(p => p.revenue), 1);
                        const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500'];
                        return (
                            <div className="space-y-4">
                                {stats.revenueByPlan.map((p, i) => (
                                    <div key={p.planName}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-gray-800">{p.planName}</span>
                                            <span className="text-sm font-bold text-gray-900 tabular-nums">{fmt(p.revenue)} AZN</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${colors[i % colors.length]}`}
                                                style={{ width: `${(p.revenue / maxR) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{p.orders} ödəniş</p>
                                    </div>
                                ))}
                            </div>
                        );
                    })() : (
                        <p className="text-sm text-gray-400">Məlumat yoxdur</p>
                    )}
                </div>
            </div>

            {/* Pending orders — needs action */}
            {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
                    <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
                        <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600" />
                        <h2 className="font-bold text-amber-800">Gözləyən Ödənişlər ({pending.length})</h2>
                        <span className="text-xs text-amber-600 ml-1">— Payriff-də tamamlandı amma sistemdə aktivləşmədi</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold text-amber-700 uppercase tracking-wide bg-amber-100/50">
                                    <th className="px-6 py-3 text-left">İstifadəçi</th>
                                    <th className="px-6 py-3 text-left">Plan</th>
                                    <th className="px-6 py-3 text-right">Məbləğ</th>
                                    <th className="px-6 py-3 text-right">Tarix</th>
                                    <th className="px-6 py-3 text-right">Əməliyyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                                {pending.map(p => (
                                    <tr key={p.orderId} className="hover:bg-amber-50/80">
                                        <td className="px-6 py-3.5">
                                            <p className="font-semibold text-gray-900">{p.userName}</p>
                                            <p className="text-xs text-gray-500">{p.userEmail}</p>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{p.planName}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right font-bold text-gray-800 tabular-nums">
                                            {fmt(p.amount)} AZN
                                        </td>
                                        <td className="px-6 py-3.5 text-right text-gray-500 text-xs">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleVerify(p.orderId)}
                                                    disabled={!!verifying}
                                                    title="Payriff-dən statusu yoxla və avtomatik aktivləşdir"
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {verifying === p.orderId + '_check' ? '...' : 'Yoxla'}
                                                </button>
                                                <button
                                                    onClick={() => handleForceActivate(p.orderId)}
                                                    disabled={!!verifying}
                                                    title="Payriff statusundan asılı olmayaraq məcburi aktivləşdir (pul köçürülübsə)"
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {verifying === p.orderId + '_force' ? '...' : 'Force ✓'}
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(p.orderId)}
                                                    disabled={!!verifying}
                                                    title="Bu orderi ləğv et (test orderidirsə)"
                                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {verifying === p.orderId + '_cancel' ? '...' : 'Ləğv'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent payments table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-500" />
                        <h2 className="font-bold text-gray-800">Son Ödənişlər</h2>
                    </div>
                    <Link to="/admin/loglar" className="text-xs text-indigo-600 hover:underline font-medium">Loglara bax →</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-6 py-3 text-left">İstifadəçi</th>
                                <th className="px-6 py-3 text-left">Plan</th>
                                <th className="px-6 py-3 text-right">Məbləğ</th>
                                <th className="px-6 py-3 text-right">Müddət</th>
                                <th className="px-6 py-3 text-right">Tarix</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats?.recentPayments?.length > 0 ? stats.recentPayments.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <p className="font-semibold text-gray-900">{p.userName}</p>
                                        <p className="text-xs text-gray-400">{p.userEmail}</p>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{p.planName}</span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-bold text-emerald-700 tabular-nums">
                                        {fmt(p.amount)} AZN
                                    </td>
                                    <td className="px-6 py-3.5 text-right text-gray-600 tabular-nums">
                                        {p.durationDays} gün
                                    </td>
                                    <td className="px-6 py-3.5 text-right text-gray-400 text-xs">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                                        Hələ ödəniş yoxdur
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminRevenue;
