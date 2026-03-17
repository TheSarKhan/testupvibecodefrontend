import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineDocumentText,
    HiOutlineClipboardList, HiOutlineUserGroup, HiOutlineTrendingUp,
    HiOutlineShieldCheck, HiOutlineCheckCircle, HiOutlineClock,
    HiOutlineLightningBolt
} from 'react-icons/hi';
import api from '../../api/axios';

const StatCard = ({ icon: Icon, label, value, bg, color, to }) => {
    const inner = (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value ?? '—'}</p>
            </div>
        </div>
    );
    return to ? <Link to={to}>{inner}</Link> : inner;
};

const BarChart = ({ data, color }) => {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Məlumat yoxdur</div>
    );
    const max = Math.max(...data.map(d => d.count), 1);
    const monthNames = { '01': 'Yan', '02': 'Fev', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'İyn', '07': 'İyl', '08': 'Avq', '09': 'Sen', '10': 'Okt', '11': 'Noy', '12': 'Dek' };
    return (
        <div className="flex items-end gap-2 h-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-500">{d.count > 0 ? d.count : ''}</span>
                    <div
                        className={`w-full rounded-t-lg ${color}`}
                        style={{ height: `${Math.max((d.count / max) * 88, d.count > 0 ? 6 : 2)}px` }}
                    />
                    <span className="text-xs text-gray-400">{monthNames[d.month?.split('-')[1]] || d.month}</span>
                </div>
            ))}
        </div>
    );
};

const roleBadge = (role) => {
    const map = { ADMIN: 'bg-purple-100 text-purple-700', TEACHER: 'bg-indigo-100 text-indigo-700', STUDENT: 'bg-emerald-100 text-emerald-700' };
    const labels = { ADMIN: 'Admin', TEACHER: 'Müəllim', STUDENT: 'Tələbə' };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[role] || 'bg-gray-100 text-gray-600'}`}>{labels[role] || role}</span>;
};

const statusBadge = (status) => {
    const map = {
        PUBLISHED: 'bg-emerald-100 text-emerald-700',
        ACTIVE: 'bg-blue-100 text-blue-700',
        DRAFT: 'bg-gray-100 text-gray-600',
        COMPLETED: 'bg-purple-100 text-purple-700',
        CANCELLED: 'bg-red-100 text-red-700',
        ARCHIVED: 'bg-orange-100 text-orange-700',
    };
    const labels = {
        PUBLISHED: 'Dərc edilib', ACTIVE: 'Aktiv', DRAFT: 'Qaralama',
        COMPLETED: 'Tamamlandı', CANCELLED: 'Ləğv edilib', ARCHIVED: 'Arxivdə',
    };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
    );

    const totalAdmins = Math.max(0, (stats?.totalUsers || 0) - (stats?.totalTeachers || 0) - (stats?.totalStudents || 0));

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">Platformanın ümumi statistikası</p>
            </div>

            {/* Stat Cards — 3 columns on large, 6 on xl */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={HiOutlineUsers} label="Ümumi İstifadəçi" value={stats?.totalUsers} bg="bg-gray-100" color="text-gray-700" to="/admin/users" />
                <StatCard icon={HiOutlineShieldCheck} label="Adminlər" value={totalAdmins} bg="bg-purple-50" color="text-purple-600" to="/admin/users" />
                <StatCard icon={HiOutlineAcademicCap} label="Müəllimlər" value={stats?.totalTeachers} bg="bg-indigo-50" color="text-indigo-600" to="/admin/users" />
                <StatCard icon={HiOutlineUserGroup} label="Tələbələr" value={stats?.totalStudents} bg="bg-emerald-50" color="text-emerald-600" to="/admin/users" />
                <StatCard icon={HiOutlineDocumentText} label="Cəmi İmtahan" value={stats?.totalExams} bg="bg-amber-50" color="text-amber-600" to="/admin/muellim-imtahanlar" />
                <StatCard icon={HiOutlineCheckCircle} label="Aktiv İmtahan" value={stats?.totalPublishedExams} bg="bg-teal-50" color="text-teal-600" to="/admin/muellim-imtahanlar" />
            </div>

            {/* Hero + Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: main content (2/3) */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Submissions hero */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center justify-between text-white shadow-lg shadow-indigo-200">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium">Ümumi İmtahan Cəhdi</p>
                            <p className="text-5xl font-bold mt-1 tabular-nums">{stats?.totalSubmissions ?? '—'}</p>
                            <p className="text-indigo-200 text-xs mt-2 font-medium">Bütün zamanlar üzrə</p>
                        </div>
                        <HiOutlineClipboardList className="w-20 h-20 text-indigo-300 opacity-40" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineTrendingUp className="w-4 h-4 text-indigo-500" />
                                <span className="font-bold text-gray-800 text-sm">Son 6 ay — Qeydiyyatlar</span>
                            </div>
                            <BarChart data={stats?.monthlyRegistrations} color="bg-indigo-400" />
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineClipboardList className="w-4 h-4 text-emerald-500" />
                                <span className="font-bold text-gray-800 text-sm">Son 6 ay — İmtahan cəhdləri</span>
                            </div>
                            <BarChart data={stats?.monthlySubmissions} color="bg-emerald-400" />
                        </div>
                    </div>

                    {/* User distribution */}
                    {stats?.totalUsers > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-800 text-sm mb-4">İstifadəçi Paylanması</h3>
                            <div className="flex rounded-full overflow-hidden h-3 mb-4 bg-gray-100">
                                {totalAdmins > 0 && <div className="bg-purple-500" style={{ width: `${(totalAdmins / stats.totalUsers) * 100}%` }} />}
                                {stats.totalTeachers > 0 && <div className="bg-indigo-500" style={{ width: `${(stats.totalTeachers / stats.totalUsers) * 100}%` }} />}
                                {stats.totalStudents > 0 && <div className="bg-emerald-500" style={{ width: `${(stats.totalStudents / stats.totalUsers) * 100}%` }} />}
                            </div>
                            <div className="flex flex-wrap gap-5 text-sm">
                                {[
                                    { label: 'Admin', count: totalAdmins, color: 'bg-purple-500' },
                                    { label: 'Müəllim', count: stats.totalTeachers, color: 'bg-indigo-500' },
                                    { label: 'Tələbə', count: stats.totalStudents, color: 'bg-emerald-500' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                                        <span className="text-gray-600">{item.label}: <strong className="text-gray-900">{item.count}</strong></span>
                                        <span className="text-gray-400 text-xs">({Math.round((item.count / stats.totalUsers) * 100)}%)</span>
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
                                            {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' }) : ''}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="px-6 py-4 text-sm text-gray-400">Hələ imtahan yoxdur</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right sidebar (1/3) */}
                <div className="space-y-5">
                    {/* Quick stats mini cards */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="font-bold text-gray-800 text-sm">Sürətli Baxış</h3>
                        {[
                            {
                                label: 'Cəld qeydiyyat (bu ay)',
                                value: stats?.monthlyRegistrations?.at(-1)?.count ?? 0,
                                icon: HiOutlineTrendingUp,
                                color: 'text-indigo-600',
                                bg: 'bg-indigo-50'
                            },
                            {
                                label: 'Bu ay imtahan cəhdi',
                                value: stats?.monthlySubmissions?.at(-1)?.count ?? 0,
                                icon: HiOutlineClipboardList,
                                color: 'text-emerald-600',
                                bg: 'bg-emerald-50'
                            },
                            {
                                label: 'Dərc edilmiş imtahan',
                                value: stats?.totalPublishedExams ?? 0,
                                icon: HiOutlineCheckCircle,
                                color: 'text-teal-600',
                                bg: 'bg-teal-50'
                            },
                            {
                                label: 'Müəllim/Tələbə nisbəti',
                                value: stats?.totalStudents > 0
                                    ? `1 : ${Math.round(stats.totalStudents / Math.max(stats.totalTeachers, 1))}`
                                    : '—',
                                icon: HiOutlineClock,
                                color: 'text-amber-600',
                                bg: 'bg-amber-50'
                            },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500 truncate">{item.label}</p>
                                    <p className="text-lg font-bold text-gray-900 tabular-nums">{item.value}</p>
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
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' }) : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Sürətli Keçidlər</h3>
                        <div className="space-y-1.5">
                            {[
                                { to: '/admin/users', label: 'İstifadəçiləri idarə et' },
                                { to: '/admin/muellim-imtahanlar', label: 'İmtahanları idarə et' },
                                { to: '/admin/sablonlar', label: 'Şablonları idarə et' },
                                { to: '/admin/bildirişlər', label: 'Bildiriş göndər' },
                                { to: '/admin/reklamlar', label: 'Reklamları idarə et' },
                                { to: '/admin/planlar', label: 'Abunəlik planları' },
                            ].map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium group"
                                >
                                    {link.label}
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
