import { useState, useEffect } from 'react';
import { HiClock, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAdminNotificationHistory } from '../../../hooks/admin/useAdminNotifications';
import { CHANNEL_LABELS, TARGET_LABELS, ROLE_OPTIONS, fmtDate } from './constants';
import Pagination from '../../../components/admin/Pagination';

const HistoryTable = () => {
    const [page, setPage] = useState(0);
    const { data, isFetching: loading, error } = useAdminNotificationHistory(page, 15);
    const logs = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;

    useEffect(() => {
        if (error) toast.error('Tarixçə yüklənə bilmədi');
    }, [error]);

    const channelBadge = (channels) => {
        if (!channels) return null;
        return channels.split(',').map(c => (
            <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium mr-1 ${
                c === 'SITE' ? 'bg-blue-100 text-blue-700'
                : c === 'GMAIL' ? 'bg-red-100 text-red-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
                {CHANNEL_LABELS[c] || c}
            </span>
        ));
    };

    if (loading) return (
        <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
        </div>
    );

    return (
        <div>
            {logs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <HiClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Hələ göndəriş yoxdur</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Başlıq</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Kanal</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Hədəf</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Alıcı</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Tarix</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-gray-800 truncate max-w-[200px]">{log.title}</p>
                                            {log.description && (
                                                <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{log.description}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">{channelBadge(log.channels)}</td>
                                        <td className="px-5 py-3">
                                            <span className="text-gray-600">
                                                {TARGET_LABELS[log.targetType] || log.targetType}
                                                {log.roleFilter && (
                                                    <span className="ml-1 text-gray-400">
                                                        ({ROLE_OPTIONS.find(r => r.value === log.roleFilter)?.label || log.roleFilter})
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="font-semibold text-indigo-700">{log.recipientCount}</span>
                                            <span className="text-gray-400 ml-1">nəfər</span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{fmtDate(log.sentAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
                </>
            )}
        </div>
    );
};

export default HistoryTable;
