import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineSearch, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight,
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineShieldCheck,
    HiOutlineX, HiOutlineCheck, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineCurrencyDollar,
    HiOutlineBell, HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlineBookOpen
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = [
    { value: '', label: 'Hamısı', icon: HiOutlineUsers },
    { value: 'ADMIN', label: 'Admin', icon: HiOutlineShieldCheck },
    { value: 'TEACHER', label: 'Müəllim', icon: HiOutlineAcademicCap },
    { value: 'STUDENT', label: 'Tələbə', icon: HiOutlineUserGroup },
];

const ROLE_STYLE = {
    ADMIN: { badge: 'bg-purple-100 text-purple-700 ring-purple-200', dot: 'bg-purple-500', avatar: 'bg-purple-100 text-purple-700' },
    TEACHER: { badge: 'bg-indigo-100 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500', avatar: 'bg-indigo-100 text-indigo-700' },
    STUDENT: { badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', avatar: 'bg-emerald-100 text-emerald-700' },
};
const ROLE_LABEL = { ADMIN: 'Admin', TEACHER: 'Müəllim', STUDENT: 'Tələbə' };

const PAGE_SIZE = 15;

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [roleCounts, setRoleCounts] = useState({ ADMIN: 0, TEACHER: 0, STUDENT: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState(null); // userId
    const [planModalUser, setPlanModalUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [planForm, setPlanForm] = useState({ planId: '', durationMonths: 1 });
    const [assigningPlan, setAssigningPlan] = useState(false);
    const debounceRef = useRef(null);

    // Exam assignment modal state
    const [examModalUser, setExamModalUser] = useState(null);
    const [examSearch, setExamSearch] = useState('');
    const [exams, setExams] = useState([]);
    const [examsLoading, setExamsLoading] = useState(false);
    const [examPage, setExamPage] = useState(0);
    const [examTotalPages, setExamTotalPages] = useState(0);
    const [assigningExam, setAssigningExam] = useState(null); // examId being assigned
    const [assignedExamIds, setAssignedExamIds] = useState(new Set());
    const examDebounceRef = useRef(null);

    // Fetch plans for assignment
    useEffect(() => {
        api.get('/subscription-plans')
            .then(res => setPlans(res.data.sort((a,b) => a.price - b.price)))
            .catch(() => {});
    }, []);


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, size: PAGE_SIZE });
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            const { data } = await api.get(`/admin/users?${params}`);
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch {
            toast.error('İstifadəçilər yüklənmədi');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Fetch role counts once on mount (no filter, page 0, large size)
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const roles = ['ADMIN', 'TEACHER', 'STUDENT'];
                const results = await Promise.all(
                    roles.map(r => api.get(`/admin/users?role=${r}&page=0&size=1`).then(d => ({ role: r, count: d.data.totalElements })))
                );
                const counts = {};
                results.forEach(r => { counts[r.role] = r.count; });
                setRoleCounts(counts);
            } catch { }
        };
        fetchCounts();
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
        }, 400);
    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
        setPage(0);
    };

    const handleToggleStatus = async (userId) => {
        const user = users.find(u => u.id === userId);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: !u.enabled } : u));
        try {
            const { data } = await api.patch(`/admin/users/${userId}/toggle-status`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: data.enabled } : u));
            toast.success(data.enabled ? 'Hesab aktivləşdirildi' : 'Hesab deaktiv edildi');
        } catch (err) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: user.enabled } : u));
            if (!err._handled) toast.error(err.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const prev = users.find(u => u.id === userId)?.role;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            toast.success('Rol dəyişdirildi');
            // Update role counts
            setRoleCounts(c => ({ ...c, [prev]: c[prev] - 1, [newRole]: c[newRole] + 1 }));
        } catch (err) {
            setUsers(u => u.map(x => x.id === userId ? { ...x, role: prev } : x));
            if (!err._handled) toast.error(err.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (userId) => {
        const user = users.find(u => u.id === userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(u => u.filter(x => x.id !== userId));
            setTotalElements(t => t - 1);
            setRoleCounts(c => ({ ...c, [user.role]: c[user.role] - 1 }));
            toast.success('İstifadəçi silindi');
        } catch (err) {
            if (!err._handled) toast.error(err.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleAssignPlan = async (e) => {
        e.preventDefault();
        setAssigningPlan(true);
        try {
            await api.post('/user-subscriptions/assign', {
                userId: planModalUser.id,
                planId: planForm.planId,
                durationMonths: planForm.durationMonths,
                paymentProvider: 'MANUAL_ADMIN'
            });
            toast.success('Abunəlik planı təyin edildi');
            setPlanModalUser(null);
            fetchUsers();

        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Plan təyin edərkən xəta baş verdi');
        } finally {
            setAssigningPlan(false);
        }
    };

    // Fetch exams for the assignment modal
    const fetchExams = useCallback(async (search, page) => {
        setExamsLoading(true);
        try {
            const params = new URLSearchParams({ page, size: 8 });
            if (search) params.set('search', search);
            const { data } = await api.get(`/admin/exams?${params}`);
            setExams(data.content);
            setExamTotalPages(data.totalPages);
        } catch {
            toast.error('İmtahanlar yüklənmədi');
        } finally {
            setExamsLoading(false);
        }
    }, []);

    const openExamModal = (user) => {
        setExamModalUser(user);
        setExamSearch('');
        setExamPage(0);
        setAssignedExamIds(new Set());
        fetchExams('', 0);
    };

    const handleExamSearchChange = (e) => {
        const val = e.target.value;
        setExamSearch(val);
        setExamPage(0);
        clearTimeout(examDebounceRef.current);
        examDebounceRef.current = setTimeout(() => fetchExams(val, 0), 400);
    };

    const handleAssignExam = async (examId) => {
        setAssigningExam(examId);
        try {
            await api.post(`/admin/users/${examModalUser.id}/assign-exam`, { examId });
            setAssignedExamIds(prev => new Set([...prev, examId]));
            toast.success('İmtahan şagirdin deposuna əlavə edildi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setAssigningExam(null);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(0, page - 2);
        const end = Math.min(totalPages - 1, page + 2);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const totalAll = (roleCounts.ADMIN || 0) + (roleCounts.TEACHER || 0) + (roleCounts.STUDENT || 0);

    // Derived sidebar stats from current page
    const pageWithPlan = users.filter(u => u.activePlanName).length;
    const pageDisabled = users.filter(u => !u.enabled).length;
    const totalAll_dist = totalAll;

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">İstifadəçi İdarəsi</h1>
                <p className="text-gray-500 mt-1 text-sm">Sistemdəki bütün istifadəçiləri idarə edin</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Ümumi', count: totalAll, color: 'bg-gray-900', text: 'text-white', sub: 'text-gray-300' },
                    { label: 'Adminlər', count: roleCounts.ADMIN, color: 'bg-purple-600', text: 'text-white', sub: 'text-purple-200' },
                    { label: 'Müəllimlər', count: roleCounts.TEACHER, color: 'bg-indigo-600', text: 'text-white', sub: 'text-indigo-200' },
                    { label: 'Tələbələr', count: roleCounts.STUDENT, color: 'bg-emerald-600', text: 'text-white', sub: 'text-emerald-200' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-2xl p-5`}>
                        <p className={`text-4xl font-bold tabular-nums ${s.text}`}>{s.count ?? '—'}</p>
                        <p className={`text-sm font-medium mt-1 ${s.sub}`}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left: Filters + Table + Pagination (3/4) */}
                <div className="xl:col-span-3 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ad, email ilə axtar..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
                            />
                            {search && (
                                <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 self-start">
                            {ROLES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => handleRoleFilter(r.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${roleFilter === r.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {r.label}
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
                        ) : users.length === 0 ? (
                            <div className="text-center py-20">
                                <HiOutlineUsers className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">İstifadəçi tapılmadı</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">İstifadəçi</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Qeydiyyat</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Əməliyyat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map(user => {
                                        const style = ROLE_STYLE[user.role] || { badge: 'bg-gray-100 text-gray-600', avatar: 'bg-gray-100 text-gray-600' };
                                        const isDeleting = confirmDelete === user.id;
                                        return (
                                            <tr key={user.id} className={`transition-colors ${isDeleting ? 'bg-red-50' : 'hover:bg-gray-50/60'}`}>
                                                {/* User */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative shrink-0">
                                                            {user.profilePicture ? (
                                                                <img src={user.profilePicture} alt="" className={`w-9 h-9 rounded-full object-cover ${!user.enabled ? 'opacity-40 grayscale' : ''}`} />
                                                            ) : (
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${!user.enabled ? 'bg-gray-100 text-gray-400' : style.avatar}`}>
                                                                    {user.fullName?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                            {!user.enabled && (
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                                    <HiOutlineLockClosed className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`font-semibold truncate ${!user.enabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{user.fullName}</p>
                                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                            {user.phoneNumber && (
                                                                <p className="text-xs text-gray-400 truncate">{user.phoneNumber}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-5 py-3.5">
                                                    <select
                                                        value={user.role}
                                                        onChange={e => handleRoleChange(user.id, e.target.value)}
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 ring-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${style.badge}`}
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="TEACHER">Müəllim</option>
                                                        <option value="STUDENT">Tələbə</option>
                                                    </select>
                                                </td>

                                                {/* Plan */}
                                                <td className="px-5 py-3.5">
                                                    {user.activePlanName ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                                                            {user.activePlanName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${user.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        {user.enabled ? 'Aktiv' : 'Deaktiv'}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-3.5 text-right">
                                                    {isDeleting ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs text-red-600 font-medium hidden sm:inline">Silinsin?</span>
                                                            <button onClick={() => handleDelete(user.id)} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors" title="Təsdiq et">
                                                                <HiOutlineCheck className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setConfirmDelete(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors" title="Ləğv et">
                                                                <HiOutlineX className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleToggleStatus(user.id)}
                                                                className={`p-1.5 rounded-lg transition-colors ${user.enabled ? 'text-gray-300 hover:text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                title={user.enabled ? 'Hesabı deaktiv et' : 'Hesabı aktivləşdir'}
                                                            >
                                                                {user.enabled ? <HiOutlineLockClosed className="w-4 h-4" /> : <HiOutlineLockOpen className="w-4 h-4" />}
                                                            </button>
                                                            {user.role === 'TEACHER' && (
                                                                <button
                                                                    onClick={() => { setPlanModalUser(user); setPlanForm({ planId: '', durationMonths: 1 }); }}
                                                                    className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    title="Plan təyin et"
                                                                >
                                                                    <HiOutlineCurrencyDollar className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {user.role === 'STUDENT' && (
                                                                <button
                                                                    onClick={() => openExamModal(user)}
                                                                    className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                    title="İmtahan əlavə et"
                                                                >
                                                                    <HiOutlineBookOpen className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setConfirmDelete(user.id)}
                                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Sil"
                                                            >
                                                                <HiOutlineTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements} istifadəçi
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                </button>
                                {getPageNumbers().map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${n === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {n + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar (1/4) */}
                <div className="space-y-5">
                    {/* Role Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-4">Rol Bölgüsü</h3>
                        {totalAll_dist > 0 ? (
                            <>
                                <div className="flex rounded-full overflow-hidden h-2.5 mb-4 bg-gray-100">
                                    {roleCounts.ADMIN > 0 && <div className="bg-purple-500 transition-all" style={{ width: `${(roleCounts.ADMIN / totalAll_dist) * 100}%` }} />}
                                    {roleCounts.TEACHER > 0 && <div className="bg-indigo-500 transition-all" style={{ width: `${(roleCounts.TEACHER / totalAll_dist) * 100}%` }} />}
                                    {roleCounts.STUDENT > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(roleCounts.STUDENT / totalAll_dist) * 100}%` }} />}
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'Admin', count: roleCounts.ADMIN, color: 'bg-purple-500', pct: Math.round((roleCounts.ADMIN / totalAll_dist) * 100) },
                                        { label: 'Müəllim', count: roleCounts.TEACHER, color: 'bg-indigo-500', pct: Math.round((roleCounts.TEACHER / totalAll_dist) * 100) },
                                        { label: 'Tələbə', count: roleCounts.STUDENT, color: 'bg-emerald-500', pct: Math.round((roleCounts.STUDENT / totalAll_dist) * 100) },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                                <span className="text-gray-600 font-medium">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{item.count}</span>
                                                <span className="text-xs text-gray-400">({item.pct}%)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">Məlumat yoxdur</p>
                        )}
                    </div>

                    {/* Current page snapshot */}
                    {users.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-800 text-sm mb-4">
                                Bu Səhifə
                                <span className="ml-1.5 text-xs text-gray-400 font-normal">({users.length} istifadəçi)</span>
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Aktiv hesab</span>
                                    <span className="font-bold text-emerald-600">{users.length - pageDisabled}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Deaktiv hesab</span>
                                    <span className={`font-bold ${pageDisabled > 0 ? 'text-red-500' : 'text-gray-400'}`}>{pageDisabled}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Aktiv planlı</span>
                                    <span className="font-bold text-indigo-600">{pageWithPlan}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Plansız</span>
                                    <span className="font-bold text-gray-400">{users.length - pageWithPlan}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Sürətli Əməliyyatlar</h3>
                        <div className="space-y-1.5">
                            {[
                                { to: '/admin/bildirişlər', label: 'Bildiriş göndər', icon: HiOutlineBell, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { to: '/admin/planlar', label: 'Planları idarə et', icon: HiOutlineCurrencyDollar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { to: '/admin/muellim-imtahanlar', label: 'İmtahanlara bax', icon: HiOutlineDocumentText, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map(item => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg}`}>
                                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                    <span className="ml-auto text-gray-300 group-hover:text-gray-500">→</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Assignment Modal */}
            {planModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPlanModalUser(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900">Plan Təyin Et</h2>
                            <button onClick={() => setPlanModalUser(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <HiOutlineX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            <strong>{planModalUser.fullName}</strong> adlı istifadəçiyə plan təyin edirsiniz.
                        </p>
                        <form onSubmit={handleAssignPlan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Seçin *</label>
                                <select
                                    required
                                    value={planForm.planId}
                                    onChange={e => setPlanForm({ ...planForm, planId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                                >
                                    <option value="">Plan seçin...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.price} ₼)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Müddət (Ay) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1200"
                                    required
                                    value={planForm.durationMonths}
                                    onChange={e => setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                                />
                                <p className="text-xs text-gray-400 mt-1">Sistem tərəfindən limitsiz planlaşdırmalar üçün (məs: 1200 ay = 100 il) yaza bilərsiniz.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setPlanModalUser(null)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                                    Ləğv et
                                </button>
                                <button type="submit" disabled={assigningPlan} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70">
                                    {assigningPlan ? 'Təyin edilir...' : 'Təyin et'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Exam Assignment Modal */}
            {examModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setExamModalUser(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">İmtahan Əlavə Et</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    <span className="font-semibold text-gray-700">{examModalUser.fullName}</span> — şagirdin deposuna imtahan əlavə edin
                                </p>
                            </div>
                            <button onClick={() => setExamModalUser(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <HiOutlineX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-7 py-4 border-b border-gray-50">
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="İmtahan adı ilə axtar..."
                                    value={examSearch}
                                    onChange={handleExamSearchChange}
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-gray-50"
                                    autoFocus
                                />
                                {examSearch && (
                                    <button onClick={() => { setExamSearch(''); setExamPage(0); fetchExams('', 0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                        <HiOutlineX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Exam list */}
                        <div className="flex-1 overflow-y-auto px-7 py-3 space-y-2">
                            {examsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="text-center py-12">
                                    <HiOutlineBookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">İmtahan tapılmadı</p>
                                </div>
                            ) : exams.map(exam => {
                                const isAssigned = assignedExamIds.has(exam.id);
                                const isAssigning = assigningExam === exam.id;
                                return (
                                    <div key={exam.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${isAssigned ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-gray-900 text-sm truncate">{exam.title}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                    exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                                                    exam.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>{
                                                    exam.status === 'PUBLISHED' ? 'Dərc edilib' :
                                                    exam.status === 'ACTIVE' ? 'Aktiv' :
                                                    exam.status === 'DRAFT' ? 'Qaralama' : exam.status
                                                }</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-400">{exam.teacherName}</span>
                                                <span className={`text-xs font-bold ${exam.price ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {exam.price ? `${exam.price} ₼` : 'Pulsuz'}
                                                </span>
                                                {exam.questionCount != null && (
                                                    <span className="text-xs text-gray-400">{exam.questionCount} sual</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => !isAssigned && handleAssignExam(exam.id)}
                                            disabled={isAssigned || isAssigning}
                                            className={`ml-4 shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                                isAssigned
                                                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'
                                            }`}
                                        >
                                            {isAssigning ? (
                                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            ) : isAssigned ? (
                                                <><HiOutlineCheck className="w-4 h-4" /> Əlavə edildi</>
                                            ) : (
                                                <><HiOutlinePlusCircle className="w-4 h-4" /> Əlavə et</>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {examTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-1 px-7 py-4 border-t border-gray-100">
                                <button
                                    disabled={examPage === 0}
                                    onClick={() => { const p = examPage - 1; setExamPage(p); fetchExams(examSearch, p); }}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(examTotalPages, 5) }, (_, i) => {
                                    const start = Math.max(0, examPage - 2);
                                    const n = start + i;
                                    if (n >= examTotalPages) return null;
                                    return (
                                        <button
                                            key={n}
                                            onClick={() => { setExamPage(n); fetchExams(examSearch, n); }}
                                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${n === examPage ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {n + 1}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={examPage >= examTotalPages - 1}
                                    onClick={() => { const p = examPage + 1; setExamPage(p); fetchExams(examSearch, p); }}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
