import { useState, useEffect } from 'react';
import { HiSearch, HiCheck, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAdminUsers } from '../../../hooks/admin/useAdminUsers';

const UserSelector = ({ selectedIds, onChange }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const { data, isFetching: loading, error } = useAdminUsers({
        search: search.trim(),
        page,
        size: 10,
    });
    const users = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    useEffect(() => {
        setPage(0);
    }, [search]);

    useEffect(() => {
        if (error) toast.error('İstifadəçilər yüklənə bilmədi');
    }, [error]);

    const toggle = (id) => {
        onChange(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const pageIds = users.map(u => u.id);
        const allSelected = pageIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            onChange(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            onChange(prev => [...new Set([...prev, ...pageIds])]);
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <HiSearch className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ad, email axtar..."
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                {selectedIds.length > 0 && (
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedIds.length} seçilib
                    </span>
                )}
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">İstifadəçi tapılmadı</p>
                ) : (
                    <>
                        <div
                            onClick={toggleAll}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 cursor-pointer bg-gray-50/80"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                users.every(u => selectedIds.includes(u.id))
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300'
                            }`}>
                                {users.every(u => selectedIds.includes(u.id)) && <HiCheck className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Bu səhifədəkiləri seç</span>
                        </div>
                        {users.map(user => (
                            <div
                                key={user.id}
                                onClick={() => toggle(user.id)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    selectedIds.includes(user.id)
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedIds.includes(user.id) && <HiCheck className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{user.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    user.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700'
                                    : user.role === 'TEACHER' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {user.role === 'ADMIN' ? 'Admin' : user.role === 'TEACHER' ? 'Müəllim' : 'Tələbə'}
                                </span>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1 rounded disabled:opacity-40 hover:bg-gray-200 transition-colors"
                    >
                        <HiChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1 rounded disabled:opacity-40 hover:bg-gray-200 transition-colors"
                    >
                        <HiChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserSelector;
