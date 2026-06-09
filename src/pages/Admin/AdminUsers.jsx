import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
    HiOutlineSearch, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight,
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineShieldCheck,
    HiOutlineX, HiOutlineCheck, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineCurrencyDollar,
    HiOutlineBell, HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlineBookOpen
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import getErrorMessage from '../../utils/getErrorMessage';
import { fmtDate } from '../../utils/date';
import {
    useAdminUsers,
    useChangeUserRole,
    useToggleUserStatus,
    useDeleteUser,
    useBulkDeleteUsers,
    useBulkToggleUserStatus,
} from '../../hooks/admin/useAdminUsers';
import AssignPlanModal from './users/AssignPlanModal';
import AssignExamModal from './users/AssignExamModal';
import TableSkeleton from '../../components/admin/TableSkeleton';
import Pagination from '../../components/admin/Pagination';
import { useUndoableAction } from '../../hooks/admin/useUndoableAction';

const ROLES = [
    { value: '', label: 'Hamısı', icon: HiOutlineUsers },
    { value: 'ADMIN', label: 'Admin', icon: HiOutlineShieldCheck },
    { value: 'TEACHER', label: 'Müəllim', icon: HiOutlineAcademicCap },
    { value: 'STUDENT', label: 'Tələbə', icon: HiOutlineUserGroup },
];

const ROLE_STYLE = {
    ADMIN: { badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', avatar: 'bg-emerald-100 text-emerald-700' },
    TEACHER: { badge: 'bg-blue-100 text-blue-700 ring-blue-200', dot: 'bg-blue-500', avatar: 'bg-blue-100 text-blue-700' },
    STUDENT: { badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', avatar: 'bg-emerald-100 text-emerald-700' },
};
const ROLE_LABEL = { ADMIN: 'Admin', TEACHER: 'Müəllim', STUDENT: 'Tələbə' };

const PAGE_SIZE = 15;

const AdminUsers = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [planFilter, setPlanFilter] = useState(''); // '', 'HAS_PLAN', 'NO_PLAN'
    const [page, setPage] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [planModalUser, setPlanModalUser] = useState(null);
    const [examModalUser, setExamModalUser] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const debounceRef = useRef(null);

    const { data: usersData, isFetching, error } = useAdminUsers({
        search: debouncedSearch,
        role: roleFilter,
        page,
        size: PAGE_SIZE,
    });
    const users = usersData?.content ?? [];
    const totalPages = usersData?.totalPages ?? 0;
    const totalElements = usersData?.totalElements ?? 0;
    const loading = isFetching;
    if (error) toast.error('İstifadəçilər yüklənmədi');

    const roleCountQueries = useQueries({
        queries: ['ADMIN', 'TEACHER', 'STUDENT'].map(role => ({
            queryKey: ['admin', 'users', 'role-count', role],
            queryFn: () => api.get(`/admin/users?role=${role}&page=0&size=1`).then(r => ({ role, count: r.data.totalElements })),
            staleTime: 60_000,
        })),
    });
    const roleCounts = roleCountQueries.reduce((acc, q) => {
        if (q.data) acc[q.data.role] = q.data.count;
        return acc;
    }, { ADMIN: 0, TEACHER: 0, STUDENT: 0 });

    const toggleStatus = useToggleUserStatus();
    const changeRole = useChangeUserRole();
    const deleteUserMut = useDeleteUser();
    const bulkDelete = useBulkDeleteUsers();
    const bulkToggle = useBulkToggleUserStatus();
    const undoable = useUndoableAction();

    // Client-side filter for plan status (applies on top of server results)
    const filteredUsers = users.filter(u => {
        if (planFilter === 'HAS_PLAN') return !!u.activePlanName;
        if (planFilter === 'NO_PLAN') return !u.activePlanName;
        return true;
    });

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const pageIds = filteredUsers.map(u => u.id);
        const allSelected = pageIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) pageIds.forEach(id => next.delete(id));
            else pageIds.forEach(id => next.add(id));
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedIds.size} istifadəçini silmək istəyirsiniz?`)) return;
        try {
            const result = await bulkDelete.mutateAsync([...selectedIds]);
            toast.success(`${result.deleted} istifadəçi silindi`);
            clearSelection();
        } catch {
            toast.error('Bulk silinmə uğursuz');
        }
    };

    const handleBulkToggle = async (enabled) => {
        try {
            const result = await bulkToggle.mutateAsync({ userIds: [...selectedIds], enabled });
            toast.success(`${result.updated} istifadəçi ${enabled ? 'aktivləşdirildi' : 'deaktivləşdirildi'}`);
            clearSelection();
        } catch {
            toast.error('Bulk əməliyyat uğursuz');
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(val);
            setPage(0);
        }, 400);
    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
        setPage(0);
    };

    const handleToggleStatus = async (userId) => {
        try {
            const data = await toggleStatus.mutateAsync(userId);
            toast.success(data.enabled ? 'Hesab aktivləşdirildi' : 'Hesab deaktiv edildi');
        } catch (err) {
            if (!err._handled) toast.error(getErrorMessage(err));
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await changeRole.mutateAsync({ userId, role: newRole });
            toast.success('Rol dəyişdirildi');
        } catch (err) {
            if (!err._handled) toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = (userId) => {
        const user = users.find(u => u.id === userId);
        setConfirmDelete(null);
        undoable.run({
            label: `"${user?.fullName || 'İstifadəçi'}" silinir...`,
            successMessage: 'İstifadəçi silindi',
            onCommit: () => deleteUserMut.mutateAsync(userId),
        });
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
                    { label: 'Adminlər', count: roleCounts.ADMIN, color: 'bg-emerald-600', text: 'text-white', sub: 'text-emerald-200' },
                    { label: 'Müəllimlər', count: roleCounts.TEACHER, color: 'bg-blue-600', text: 'text-white', sub: 'text-blue-200' },
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
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white"
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
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${roleFilter === r.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={planFilter}
                            onChange={e => setPlanFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white self-start"
                        >
                            <option value="">Bütün planlar</option>
                            <option value="HAS_PLAN">Aktiv plan</option>
                            <option value="NO_PLAN">Plansız</option>
                        </select>
                    </div>

                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <span className="text-sm font-bold text-blue-700">{selectedIds.size} seçildi</span>
                            <div className="flex-1" />
                            <button onClick={() => handleBulkToggle(true)} disabled={bulkToggle.isPending}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                                Aktivləşdir
                            </button>
                            <button onClick={() => handleBulkToggle(false)} disabled={bulkToggle.isPending}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                                Deaktiv et
                            </button>
                            <button onClick={handleBulkDelete} disabled={bulkDelete.isPending}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                                Sil
                            </button>
                            <button onClick={clearSelection}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-semibold">
                                Ləğv et
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading && users.length === 0 ? (
                            <TableSkeleton rows={8} cols={4} withCheckbox withAvatar />
                        ) : users.length === 0 ? (
                            <div className="text-center py-20">
                                <HiOutlineUsers className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">İstifadəçi tapılmadı</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '44px' }} />
                                    <col />
                                    <col style={{ width: '120px' }} />
                                    <col style={{ width: '140px' }} />
                                    <col style={{ width: '110px' }} />
                                    <col style={{ width: '140px' }} className="hidden md:table-column" />
                                    <col style={{ width: '160px' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60">
                                        <th className="px-3 py-3.5">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id))}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">İstifadəçi</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Qeydiyyat</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Əməliyyat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredUsers.map(user => {
                                        const style = ROLE_STYLE[user.role] || { badge: 'bg-gray-100 text-gray-600', avatar: 'bg-gray-100 text-gray-600' };
                                        const isDeleting = confirmDelete === user.id;
                                        const isSelected = selectedIds.has(user.id);
                                        return (
                                            <tr key={user.id} className={`transition-colors ${isDeleting ? 'bg-red-50' : isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-100/60'}`}>
                                                <td className="px-3 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(user.id)}
                                                    />
                                                </td>
                                                {/* User */}
                                                <td className="px-5 py-3.5 min-w-0">
                                                    <div className="flex items-center gap-3 min-w-0">
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
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 ring-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 ${style.badge}`}
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="TEACHER">Müəllim</option>
                                                        <option value="STUDENT">Tələbə</option>
                                                    </select>
                                                </td>

                                                {/* Plan */}
                                                <td className="px-5 py-3.5">
                                                    {user.activePlanName ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
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
                                                    {user.createdAt ? fmtDate(user.createdAt) : '—'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
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
                                                                    onClick={() => setPlanModalUser(user)}
                                                                    className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Plan təyin et"
                                                                >
                                                                    <HiOutlineCurrencyDollar className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {user.role === 'STUDENT' && (
                                                                <button
                                                                    onClick={() => setExamModalUser(user)}
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
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
                </div>

                {/* Right sidebar (1/4) */}
                <div className="space-y-5">
                    {/* Role Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-4">Rol Bölgüsü</h3>
                        {totalAll_dist > 0 ? (
                            <>
                                <div className="flex rounded-full overflow-hidden h-2.5 mb-4 bg-gray-100">
                                    {roleCounts.ADMIN > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(roleCounts.ADMIN / totalAll_dist) * 100}%` }} />}
                                    {roleCounts.TEACHER > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(roleCounts.TEACHER / totalAll_dist) * 100}%` }} />}
                                    {roleCounts.STUDENT > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(roleCounts.STUDENT / totalAll_dist) * 100}%` }} />}
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'Admin', count: roleCounts.ADMIN, color: 'bg-emerald-500', pct: Math.round((roleCounts.ADMIN / totalAll_dist) * 100) },
                                        { label: 'Müəllim', count: roleCounts.TEACHER, color: 'bg-blue-500', pct: Math.round((roleCounts.TEACHER / totalAll_dist) * 100) },
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
                                    <span className="font-bold text-blue-600">{pageWithPlan}</span>
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
                                { to: '/admin/bildirişlər', label: 'Bildiriş göndər', icon: HiOutlineBell, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { to: '/admin/planlar', label: 'Planları idarə et', icon: HiOutlineCurrencyDollar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { to: '/admin/muellim-imtahanlar', label: 'İmtahanlara bax', icon: HiOutlineDocumentText, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map(item => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
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

            {planModalUser && (
                <AssignPlanModal user={planModalUser} onClose={() => setPlanModalUser(null)} />
            )}
            {examModalUser && (
                <AssignExamModal user={examModalUser} onClose={() => setExamModalUser(null)} />
            )}
        </div>
    );
};

export default AdminUsers;
