import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineDocumentText,
    HiOutlineClipboardList, HiOutlineUserGroup, HiOutlineTrendingUp,
    HiOutlineShieldCheck, HiOutlineCheckCircle, HiOutlineClock,
    HiOutlineLightningBolt, HiOutlineCurrencyDollar, HiOutlineTrendingDown,
} from 'react-icons/hi';
import api from '../../api/axios';

/* ─── helpers ─── */
const monthNames = { '01':'Yan','02':'Fev','03':'Mar','04':'Apr','05':'May','06':'İyn','07':'İyl','08':'Avq','09':'Sen','10':'Okt','11':'Noy','12':'Dek' };
const fmtAzn = (n) => (n ?? 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const roleBadge = (role) => {
    const map = { ADMIN:'bg-purple-100 text-purple-700', TEACHER:'bg-indigo-100 text-indigo-700', STUDENT:'bg-emerald-100 text-emerald-700' };
    const labels = { ADMIN:'Admin', TEACHER:'Müəllim', STUDENT:'Tələbə' };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[role]||'bg-gray-100 text-gray-600'}`}>{labels[role]||role}</span>;
};

const statusBadge = (status) => {
    const map = { PUBLISHED:'bg-emerald-100 text-emerald-700', ACTIVE:'bg-blue-100 text-blue-700', DRAFT:'bg-gray-100 text-gray-600', COMPLETED:'bg-purple-100 text-purple-700' };
    const labels = { PUBLISHED:'Dərc edilib', ACTIVE:'Aktiv', DRAFT:'Qaralama', COMPLETED:'Tamamlandı' };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status]||'bg-gray-100 text-gray-600'}`}>{labels[status]||status}</span>;
};

/* ─── mini bar chart ─── */
const MiniBar = ({ data, valueKey = 'count', color }) => {
    if (!data?.length) return <div className="flex items-end justify-center gap-1 h-14 text-gray-200 text-xs">—</div>;
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="flex items-end gap-1 h-14">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className={`w-full rounded-sm ${color}`} style={{ height: `${Math.max((d[valueKey] / max) * 48, d[valueKey] > 0 ? 4 : 1)}px` }} />
                    <span className="text-[8px] text-gray-300">{monthNames[d.month?.split('-')[1]] || ''}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── full bar chart ─── */
const BarChart = ({ data, valueKey = 'count', formatVal, color }) => {
    if (!data?.length) return <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Məlumat yoxdur</div>;
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="flex items-end gap-2 h-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-500">{d[valueKey] > 0 ? (formatVal ? formatVal(d[valueKey]) : d[valueKey]) : ''}</span>
                    <div className={`w-full rounded-t-lg ${color}`} style={{ height: `${Math.max((d[valueKey] / max) * 88, d[valueKey] > 0 ? 6 : 2)}px` }} />
                    <span className="text-xs text-gray-400">{monthNames[d.month?.split('-')[1]] || d.month}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── component ─── */
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/admin/stats').then(r => r.data),
            api.get('/admin/revenue').then(r => r.data).catch(() => null),
            api.get('/admin/revenue/pending-orders').then(r => r.data).catch(() => []),
        ]).then(([s, r, p]) => { setStats(s); setRevenue(r); setPendingOrders(p); }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
    );

    const totalAdmins = Math.max(0, (stats?.totalUsers||0) - (stats?.totalTeachers||0) - (stats?.totalStudents||0));
    const growthUp = (revenue?.growthPct ?? 0) >= 0;
    const revenueMonthly = revenue?.monthlyRevenue ?? [];

    return (
        <div className="p-6 md:p-8 space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <Link to="/admin/qazanc" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-xl transition-colors">
                    <HiOutlineCurrencyDollar className="w-4 h-4" />
                    Qazanc Hesabatı
                </Link>
            </div>

            {/* Pending payments alert */}
            {pendingOrders.length > 0 && (
                <Link to="/admin/qazanc" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 hover:bg-amber-100 transition-colors">
                    <HiOutlineTrendingDown className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800">{pendingOrders.length} gözləyən ödəniş — aktivləşdirilməyib</p>
                        <p className="text-xs text-amber-600">Kapital Bank-da tamamlandı amma abunəlik yaranmadı. Klikləyin →</p>
                    </div>
                </Link>
            )}

            {/* ── Hero row: Revenue + Submissions ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Revenue hero */}
                <Link to="/admin/qazanc" className="group bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-200/60 hover:shadow-emerald-300/70 transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest">Ümumi Qazanc</p>
                            <p className="text-4xl font-extrabold tabular-nums mt-1">{fmtAzn(revenue?.totalRevenue)}</p>
                            <p className="text-emerald-200 text-xs mt-1.5">AZN — bütün zamanlar</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${growthUp ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-100'}`}>
                            {growthUp ? <HiOutlineTrendingUp className="w-3.5 h-3.5" /> : <HiOutlineTrendingDown className="w-3.5 h-3.5" />}
                            {growthUp ? '+' : ''}{(revenue?.growthPct ?? 0).toFixed(1)}%
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-emerald-200 text-[10px] font-medium">Bu ay</p>
                            <p className="text-white font-bold text-sm tabular-nums">{fmtAzn(revenue?.thisMonthRevenue)} ₼</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-emerald-200 text-[10px] font-medium">Ötən ay</p>
                            <p className="text-white font-bold text-sm tabular-nums">{fmtAzn(revenue?.lastMonthRevenue)} ₼</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-emerald-200 text-[10px] font-medium">Aktiv abunə</p>
                            <p className="text-white font-bold text-sm tabular-nums">{revenue?.activeSubscriptions ?? 0}</p>
                        </div>
                    </div>
                    {revenueMonthly.length > 0 && (
                        <div className="mt-4 opacity-60 group-hover:opacity-80 transition-opacity">
                            <MiniBar data={revenueMonthly} valueKey="revenue" color="bg-white/70" />
                        </div>
                    )}
                </Link>

                {/* Submissions hero */}
                <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200/60">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Ümumi İmtahan Cəhdi</p>
                            <p className="text-4xl font-extrabold tabular-nums mt-1">{(stats?.totalSubmissions ?? 0).toLocaleString()}</p>
                            <p className="text-indigo-300 text-xs mt-1.5">bütün zamanlar üzrə</p>
                        </div>
                        <HiOutlineClipboardList className="w-12 h-12 text-indigo-300 opacity-30" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-indigo-300 text-[10px] font-medium">Bu ay cəhd</p>
                            <p className="text-white font-bold text-sm tabular-nums">{stats?.monthlySubmissions?.at(-1)?.count ?? 0}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-indigo-300 text-[10px] font-medium">Bu ay qeydiyyat</p>
                            <p className="text-white font-bold text-sm tabular-nums">{stats?.monthlyRegistrations?.at(-1)?.count ?? 0}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                            <p className="text-indigo-300 text-[10px] font-medium">Aktiv imtahan</p>
                            <p className="text-white font-bold text-sm tabular-nums">{stats?.totalPublishedExams ?? 0}</p>
                        </div>
                    </div>
                    {stats?.monthlySubmissions?.length > 0 && (
                        <div className="mt-4 opacity-50">
                            <MiniBar data={stats.monthlySubmissions} valueKey="count" color="bg-white/70" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                    { icon: HiOutlineUsers,      label: 'Ümumi İstifadəçi', value: stats?.totalUsers,          bg: 'bg-gray-100',     color: 'text-gray-700',   to: '/admin/users' },
                    { icon: HiOutlineShieldCheck, label: 'Adminlər',         value: totalAdmins,                bg: 'bg-purple-50',    color: 'text-purple-600', to: '/admin/users' },
                    { icon: HiOutlineAcademicCap, label: 'Müəllimlər',       value: stats?.totalTeachers,       bg: 'bg-indigo-50',    color: 'text-indigo-600', to: '/admin/users' },
                    { icon: HiOutlineUserGroup,   label: 'Tələbələr',        value: stats?.totalStudents,       bg: 'bg-emerald-50',   color: 'text-emerald-600',to: '/admin/users' },
                    { icon: HiOutlineDocumentText,label: 'Cəmi İmtahan',     value: stats?.totalExams,          bg: 'bg-amber-50',     color: 'text-amber-600',  to: '/admin/muellim-imtahanlar' },
                    { icon: HiOutlineCheckCircle, label: 'Cəmi Ödəniş',      value: revenue?.totalPaidOrders ?? 0, bg: 'bg-teal-50', color: 'text-teal-600',   to: '/admin/qazanc' },
                ].map(({ icon: Icon, label, value, bg, color, to }) => (
                    <Link key={label} to={to} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
                            <p className="text-xl font-bold text-gray-900 tabular-nums">{value ?? '—'}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineTrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-gray-800 text-sm">Son 6 ay — Qeydiyyatlar</span>
                    </div>
                    <BarChart data={stats?.monthlyRegistrations} valueKey="count" color="bg-indigo-400" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineClipboardList className="w-4 h-4 text-violet-500" />
                        <span className="font-bold text-gray-800 text-sm">Son 6 ay — İmtahan cəhdləri</span>
                    </div>
                    <BarChart data={stats?.monthlySubmissions} valueKey="count" color="bg-violet-400" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-gray-800 text-sm">Son 6 ay — Qazanc (AZN)</span>
                    </div>
                    <BarChart
                        data={revenueMonthly}
                        valueKey="revenue"
                        formatVal={v => Math.round(v)}
                        color="bg-emerald-400"
                    />
                </div>
            </div>

            {/* ── Main content + Right sidebar ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left 2/3 */}
                <div className="xl:col-span-2 space-y-5">

                    {/* Plan revenue breakdown */}
                    {revenue?.revenueByPlan?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-500" />
                                    <h3 className="font-bold text-gray-800 text-sm">Plana görə qazanc</h3>
                                </div>
                                <Link to="/admin/qazanc" className="text-xs text-indigo-600 hover:underline font-medium">Ətraflı →</Link>
                            </div>
                            <div className="space-y-3">
                                {(() => {
                                    const maxR = Math.max(...revenue.revenueByPlan.map(p => p.revenue), 1);
                                    const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500'];
                                    return revenue.revenueByPlan.map((p, i) => (
                                        <div key={p.planName}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                                                    <span className="text-sm font-semibold text-gray-800">{p.planName}</span>
                                                    <span className="text-xs text-gray-400">{p.orders} ödəniş</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 tabular-nums">{fmtAzn(p.revenue)} AZN</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${colors[i % colors.length]}`} style={{ width: `${(p.revenue / maxR) * 100}%` }} />
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Recent Payments */}
                    {revenue?.recentPayments?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-500" />
                                    <h2 className="font-bold text-gray-800">Son Ödənişlər</h2>
                                </div>
                                <Link to="/admin/qazanc" className="text-sm text-indigo-600 hover:underline font-medium">Hamısına bax →</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {revenue.recentPayments.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3.5 gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                                                {p.userName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{p.userName}</p>
                                                <p className="text-xs text-gray-400 truncate">{p.userEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">{p.planName}</span>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-700 tabular-nums">{fmtAzn(p.amount)} AZN</p>
                                                <p className="text-xs text-gray-400">{p.durationDays} gün</p>
                                            </div>
                                            <span className="text-xs text-gray-400 hidden sm:block">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('az-AZ', { day:'2-digit', month:'short' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User distribution */}
                    {stats?.totalUsers > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-800 text-sm mb-4">İstifadəçi Paylanması</h3>
                            <div className="flex rounded-full overflow-hidden h-3 mb-4 bg-gray-100">
                                {totalAdmins > 0 && <div className="bg-purple-500" style={{ width: `${(totalAdmins/stats.totalUsers)*100}%` }} />}
                                {stats.totalTeachers > 0 && <div className="bg-indigo-500" style={{ width: `${(stats.totalTeachers/stats.totalUsers)*100}%` }} />}
                                {stats.totalStudents > 0 && <div className="bg-emerald-500" style={{ width: `${(stats.totalStudents/stats.totalUsers)*100}%` }} />}
                            </div>
                            <div className="flex flex-wrap gap-5 text-sm">
                                {[
                                    { label:'Admin',   count: totalAdmins,         color:'bg-purple-500' },
                                    { label:'Müəllim', count: stats.totalTeachers,  color:'bg-indigo-500' },
                                    { label:'Tələbə',  count: stats.totalStudents,  color:'bg-emerald-500' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                                        <span className="text-gray-600">{item.label}: <strong className="text-gray-900">{item.count}</strong></span>
                                        <span className="text-gray-400 text-xs">({Math.round((item.count/stats.totalUsers)*100)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Exams */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HiOutlineLightningBolt className="w-4 h-4 text-amber-500" />
                                <h2 className="font-bold text-gray-800">Son İmtahanlar</h2>
                            </div>
                            <Link to="/admin/muellim-imtahanlar" className="text-sm text-indigo-600 hover:underline font-medium">Hamısına bax →</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {stats?.recentExams?.length > 0 ? stats.recentExams.map(exam => (
                                <div key={exam.id} className="flex items-center justify-between px-6 py-3.5 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{exam.title}</p>
                                        <p className="text-xs text-gray-400">{exam.teacherName}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {statusBadge(exam.status)}
                                        <span className="text-xs text-gray-400 hidden sm:block">
                                            {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('az-AZ', { day:'2-digit', month:'short' }) : ''}
                                        </span>
                                    </div>
                                </div>
                            )) : <p className="px-6 py-4 text-sm text-gray-400">Hələ imtahan yoxdur</p>}
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-5">

                    {/* Quick stats */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="font-bold text-gray-800 text-sm">Sürətli Baxış</h3>
                        {[
                            { label:'Bu ay qazanc',        value: `${fmtAzn(revenue?.thisMonthRevenue)} AZN`, icon: HiOutlineCurrencyDollar, color:'text-emerald-600', bg:'bg-emerald-50' },
                            { label:'Bu ay qeydiyyat',      value: stats?.monthlyRegistrations?.at(-1)?.count ?? 0, icon: HiOutlineTrendingUp,    color:'text-indigo-600',  bg:'bg-indigo-50' },
                            { label:'Bu ay imtahan cəhdi',  value: stats?.monthlySubmissions?.at(-1)?.count ?? 0,   icon: HiOutlineClipboardList, color:'text-violet-600',  bg:'bg-violet-50' },
                            { label:'Aktiv abunəlik',        value: revenue?.activeSubscriptions ?? 0,               icon: HiOutlineCheckCircle,   color:'text-teal-600',    bg:'bg-teal-50' },
                            { label:'Müəllim/Tələbə nisbəti', value: stats?.totalStudents > 0 ? `1 : ${Math.round(stats.totalStudents / Math.max(stats.totalTeachers,1))}` : '—', icon: HiOutlineClock, color:'text-amber-600', bg:'bg-amber-50' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500 truncate">{item.label}</p>
                                    <p className="text-base font-bold text-gray-900 tabular-nums">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800 text-sm">Son Qeydiyyatlar</h2>
                            <Link to="/admin/users" className="text-xs text-indigo-600 hover:underline font-medium">Hamısına bax →</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {stats?.recentUsers?.map(user => (
                                <div key={user.id} className="flex items-center justify-between px-5 py-3 gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {user.profilePicture ? (
                                            <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                                {user.fullName?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        {roleBadge(user.role)}
                                        <span className="text-xs text-gray-400">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ', { day:'2-digit', month:'short' }) : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Sürətli Keçidlər</h3>
                        <div className="space-y-1">
                            {[
                                { to:'/admin/qazanc',            label:'Qazanc hesabatı',        dot:'bg-emerald-400' },
                                { to:'/admin/planlar',           label:'Abunəlik planları',       dot:'bg-teal-400' },
                                { to:'/admin/users',             label:'İstifadəçiləri idarə et', dot:'bg-indigo-400' },
                                { to:'/admin/muellim-imtahanlar',label:'İmtahanları idarə et',   dot:'bg-amber-400' },
                                { to:'/admin/bildirişlər',       label:'Bildiriş göndər',         dot:'bg-violet-400' },
                                { to:'/admin/loglar',            label:'Sistem logları',          dot:'bg-gray-400' },
                            ].map(link => (
                                <Link key={link.to} to={link.to}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium group"
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${link.dot}`} />
                                    <span className="flex-1">{link.label}</span>
                                    <span className="text-gray-300 group-hover:text-indigo-400">→</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
