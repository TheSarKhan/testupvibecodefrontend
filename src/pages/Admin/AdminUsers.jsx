import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = [
    { value: '', label: 'Hamısı' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TEACHER', label: 'Müəllim' },
    { value: 'STUDENT', label: 'Tələbə' },
];

const roleBadgeClass = {
    ADMIN: 'bg-purple-100 text-purple-700',
    TEACHER: 'bg-indigo-100 text-indigo-700',
    STUDENT: 'bg-green-100 text-green-700',
};
const roleLabel = { ADMIN: 'Admin', TEACHER: 'Müəllim', STUDENT: 'Tələbə' };

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, size: 20 });
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

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setSearch(searchInput);
    };

    const handleRoleChange = async (userId, newRole) => {
        const prev = users.find(u => u.id === userId)?.role;
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            toast.success('Rol dəyişdirildi');
        } catch (err) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: prev } : u));
            toast.error(err.message || 'Xəta baş verdi');
        }
    };

    const handleDelete = async (userId, name) => {
        if (!window.confirm(`"${name}" istifadəçisini silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            toast.success('İstifadəçi silindi');
        } catch (err) {
            toast.error(err.message || 'Xəta baş verdi');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">İstifadəçilər</h1>
                <p className="text-gray-500 mt-1 text-sm">
                    {totalElements > 0 ? `${totalElements} istifadəçi tapıldı` : 'İstifadəçi tapılmadı'}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Ad, email ilə axtar..."
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
                    {ROLES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => { setRoleFilter(r.value); setPage(0); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${roleFilter === r.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
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
                    <div className="text-center py-20 text-gray-400">İstifadəçi tapılmadı</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">İstifadəçi</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Qeydiyyat</th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Əməliyyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                                {user.fullName?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.fullName}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={e => handleRoleChange(user.id, e.target.value)}
                                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${roleBadgeClass[user.role] || 'bg-gray-100 text-gray-600'}`}
                                        >
                                            <option value="ADMIN">Admin</option>
                                            <option value="TEACHER">Müəllim</option>
                                            <option value="STUDENT">Tələbə</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs hidden md:table-cell">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('az-AZ') : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id, user.fullName)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Səhifə {page + 1} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
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
    );
};

export default AdminUsers;
