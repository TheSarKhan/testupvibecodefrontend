import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineDocumentText,
    HiOutlineClipboardList, HiOutlineUserGroup, HiOutlineTrendingUp
} from 'react-icons/hi';
import api from '../../api/axios';

const StatCard = ({ icon: Icon, label, value, bg, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value ?? '—'}</p>
        </div>
    </div>
);

const BarChart = ({ data, color }) => {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Məlumat yoxdur</div>
    );
    const max = Math.max(...data.map(d => d.count), 1);
    const monthNames = { '01':'Yan','02':'Fev','03':'Mar','04':'Apr','05':'May','06':'İyn','07':'İyl','08':'Avq','09':'Sen','10':'Okt','11':'Noy','12':'Dek' };
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
        <div className="p-6 md:p-8 max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">Platformanın ümumi statistikası</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={HiOutlineUsers}        label="Ümumi İstifadəçi"  value={stats?.totalUsers}     bg="bg-gray-100"   color="text-gray-700" />
                <StatCard icon={HiOutlineAcademicCap}  label="Müəllimlər"         value={stats?.totalTeachers} bg="bg-indigo-50"  color="text-indigo-600" />
                <StatCard icon={HiOutlineUserGroup}    label="Tələbələr"           value={stats?.totalStudents} bg="bg-emerald-50" color="text-emerald-600" />
                <StatCard icon={HiOutlineDocumentText} label="İmtahanlar"          value={stats?.totalExams}    bg="bg-amber-50"   color="text-amber-600" />
            </div>

            {/* Submissions hero */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 flex items-center justify-between text-white shadow-lg shadow-indigo-200">
                <div>
                    <p className="text-indigo-200 text-sm font-medium">Ümumi İmtahan Cəhdi</p>
                    <p className="text-5xl font-bold mt-1 tabular-nums">{stats?.totalSubmissions ?? '—'}</p>
                </div>
                <HiOutlineClipboardList className="w-16 h-16 text-indigo-300 opacity-50" />
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

            {/* Recent Users */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">Son Qeydiyyatlar</h2>
                    <Link to="/admin/users" className="text-sm text-indigo-600 hover:underline font-medium">Hamısına bax →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {stats?.recentUsers?.map(user => (
                        <div key={user.id} className="flex items-center justify-between px-6 py-3.5">
                            <div className="flex items-center gap-3">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                        {user.fullName?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {roleBadge(user.role)}
                                <span className="text-xs text-gray-400 hidden sm:block">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' }) : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
