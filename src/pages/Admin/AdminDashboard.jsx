import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineUsers, HiOutlineAcademicCap, HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineUserGroup } from 'react-icons/hi';
import api from '../../api/axios';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        </div>
    </div>
);

const roleBadge = (role) => {
    const map = {
        ADMIN: 'bg-purple-100 text-purple-700',
        TEACHER: 'bg-indigo-100 text-indigo-700',
        STUDENT: 'bg-green-100 text-green-700',
    };
    const labels = { ADMIN: 'Admin', TEACHER: 'Müəllim', STUDENT: 'Tələbə' };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[role] || 'bg-gray-100 text-gray-600'}`}>
            {labels[role] || role}
        </span>
    );
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

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">Platformanın ümumi statistikası</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
                <StatCard icon={HiOutlineUsers} label="Ümumi İstifadəçi" value={stats?.totalUsers} color="bg-indigo-50 text-indigo-600" />
                <StatCard icon={HiOutlineAcademicCap} label="Müəllimlər" value={stats?.totalTeachers} color="bg-amber-50 text-amber-600" />
                <StatCard icon={HiOutlineUserGroup} label="Tələbələr" value={stats?.totalStudents} color="bg-green-50 text-green-600" />
                <StatCard icon={HiOutlineDocumentText} label="İmtahanlar" value={stats?.totalExams} color="bg-purple-50 text-purple-600" />
                <StatCard icon={HiOutlineClipboardList} label="Submissionlar" value={stats?.totalSubmissions} color="bg-rose-50 text-rose-600" />
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">Son Qeydiyyatlar</h2>
                    <Link to="/admin/users" className="text-sm text-indigo-600 hover:underline font-medium">Hamısına bax →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {stats?.recentUsers?.map(user => (
                        <div key={user.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                    {user.fullName?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {roleBadge(user.role)}
                                <span className="text-xs text-gray-400 hidden sm:block">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ') : ''}
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
