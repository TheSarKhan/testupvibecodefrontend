import { useState } from 'react';
import {
    useAdminContactMessages,
    useContactMessagesUnreadCount,
    useMarkContactMessageRead,
    useReplyContactMessage,
    useDeleteContactMessage,
} from '../../hooks/admin/useAdminContactMessages';
import Pagination from '../../components/admin/Pagination';
import {
    HiOutlineMail, HiOutlineTrash, HiOutlineSearch,
    HiOutlineRefresh, HiOutlineEye, HiOutlineCheck,
    HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineFilter,
    HiOutlineReply, HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const SUBJECT_LABELS = {
    texniki: 'Texniki problem',
    sual: 'Ümumi sual',
    'eməkdaşlıq': 'Əməkdaşlıq təklifi',
    'digər': 'Digər',
};

const SUBJECT_COLORS = {
    texniki: 'bg-red-50 text-red-700',
    sual: 'bg-blue-50 text-blue-700',
    'eməkdaşlıq': 'bg-green-50 text-green-700',
    'digər': 'bg-gray-100 text-gray-600',
};

const fmtDate = (iso) => {
    if (!iso) return '';
    const normalized = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
    return new Date(normalized).toLocaleString('az-AZ', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const AdminContactMessages = () => {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [readFilter, setReadFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [replyModal, setReplyModal] = useState(null);
    const [replySubject, setReplySubject] = useState('');
    const [replyBody, setReplyBody] = useState('');
    const [replyChannel, setReplyChannel] = useState('GMAIL');
    const PAGE_SIZE = 20;

    const { data, isFetching, error, refetch: fetchMessages } = useAdminContactMessages({
        page, size: PAGE_SIZE, search, subject: subjectFilter, read: readFilter,
    });
    const messages = data?.content ?? [];
    const total = data?.totalElements ?? 0;
    const loading = isFetching;
    if (error) toast.error('Mesajlar yüklənmədi');

    const { data: unreadData, refetch: fetchUnread } = useContactMessagesUnreadCount();
    const unreadCount = unreadData?.count ?? 0;

    const markRead = useMarkContactMessageRead();
    const replyMsg = useReplyContactMessage();
    const deleteMsg = useDeleteContactMessage();
    const replySending = replyMsg.isPending;

    const handleExpand = async (msg) => {
        if (expanded?.id === msg.id) { setExpanded(null); return; }
        setExpanded(msg);
        if (!msg.isRead) {
            try { await markRead.mutateAsync(msg.id); } catch {}
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu mesajı silmək istədiyinizə əminsiniz?')) return;
        try {
            await deleteMsg.mutateAsync(id);
            if (expanded?.id === id) setExpanded(null);
            toast.success('Mesaj silindi');
        } catch {
            toast.error('Silinmə zamanı xəta');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markRead.mutateAsync(id);
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const openReplyModal = (msg) => {
        const subjectLabel = SUBJECT_LABELS[msg.subject] || msg.subject || 'Mesajınıza cavab';
        setReplySubject(`Re: ${subjectLabel}`);
        setReplyBody('');
        setReplyChannel('GMAIL');
        setReplyModal({ msg });
    };

    const sendReply = async () => {
        if (!replyBody.trim()) return;
        try {
            await replyMsg.mutateAsync({
                id: replyModal.msg.id,
                reply: { subject: replySubject, body: replyBody, channel: replyChannel },
            });
            toast.success('Cavab göndərildi');
            setReplyModal(null);
        } catch {
            toast.error('Göndərmə zamanı xəta baş verdi');
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <HiOutlineMail className="w-6 h-6 text-indigo-600" />
                        Əlaqə Mesajları
                        {unreadCount > 0 && (
                            <span className="ml-1 h-6 min-w-[24px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {total} mesaj — {unreadCount} oxunmamış
                    </p>
                </div>
                <button
                    onClick={() => { fetchMessages(); fetchUnread(); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <HiOutlineRefresh className="w-4 h-4" /> Yenilə
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Ad, e-poçt və ya mesaj..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <HiOutlineFilter className="w-4 h-4 text-gray-400" />
                    <select
                        value={subjectFilter}
                        onChange={e => { setSubjectFilter(e.target.value); setPage(0); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                        <option value="">Bütün mövzular</option>
                        <option value="texniki">Texniki problem</option>
                        <option value="sual">Ümumi sual</option>
                        <option value="eməkdaşlıq">Əməkdaşlıq</option>
                        <option value="digər">Digər</option>
                    </select>

                    <select
                        value={readFilter}
                        onChange={e => { setReadFilter(e.target.value); setPage(0); }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                        <option value="">Hamısı</option>
                        <option value="false">Oxunmamış</option>
                        <option value="true">Oxunmuş</option>
                    </select>
                </div>
            </div>

            {/* Messages list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <HiOutlineMail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Mesaj tapılmadı</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {messages.map(msg => {
                        const isExpanded = expanded?.id === msg.id;
                        return (
                            <div
                                key={msg.id}
                                className={`bg-white rounded-2xl border shadow-sm transition-all ${!msg.isRead ? 'border-indigo-200 shadow-indigo-50' : 'border-gray-100'}`}
                            >
                                {/* Row */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                    {/* Unread dot */}
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${!msg.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />

                                    {/* Info */}
                                    <button
                                        onClick={() => handleExpand(msg)}
                                        className="flex-1 min-w-0 text-left"
                                    >
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-bold text-sm ${!msg.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {msg.name}
                                            </span>
                                            <span className="text-xs text-gray-400">{msg.email}</span>
                                            {msg.subject && (
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[msg.subject] || 'bg-gray-100 text-gray-600'}`}>
                                                    {SUBJECT_LABELS[msg.subject] || msg.subject}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{msg.message}</p>
                                    </button>

                                    {/* Date */}
                                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{fmtDate(msg.createdAt)}</span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!msg.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(msg.id)}
                                                title="Oxundu işarələ"
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <HiOutlineCheck className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleExpand(msg)}
                                            title="Mesajı aç"
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            {isExpanded
                                                ? <HiOutlineChevronUp className="w-4 h-4" />
                                                : <HiOutlineEye className="w-4 h-4" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            title="Sil"
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-6 pb-5 pt-2 border-t border-gray-50">
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                                            <span><span className="font-semibold text-gray-700">Ad:</span> {msg.name}</span>
                                            <span><span className="font-semibold text-gray-700">E-poçt:</span> {msg.email}</span>
                                            {msg.subject && <span><span className="font-semibold text-gray-700">Mövzu:</span> {SUBJECT_LABELS[msg.subject] || msg.subject}</span>}
                                            <span><span className="font-semibold text-gray-700">Tarix:</span> {fmtDate(msg.createdAt)}</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {msg.message}
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => openReplyModal(msg)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                                            >
                                                <HiOutlineReply className="w-3.5 h-3.5" />
                                                Cavab ver
                                            </button>
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors border border-red-100"
                                            >
                                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} totalElements={total} onChange={setPage} />
            {/* Reply Modal */}
            {replyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setReplyModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Cavab ver</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {replyModal.msg.name} — <span className="font-medium text-gray-600">{replyModal.msg.email}</span>
                                </p>
                            </div>
                            <button onClick={() => setReplyModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Original message preview */}
                        <div className="px-6 pt-4">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Orijinal mesaj</p>
                            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed line-clamp-3 border-l-2 border-indigo-200">
                                {replyModal.msg.message}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="px-6 py-4 space-y-3">
                            {/* Subject */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Mövzu</label>
                                <input
                                    type="text"
                                    value={replySubject}
                                    onChange={e => setReplySubject(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1">Cavabınız</label>
                                <textarea
                                    rows={6}
                                    value={replyBody}
                                    onChange={e => setReplyBody(e.target.value)}
                                    placeholder="Cavabınızı yazın..."
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            {/* Channel */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-semibold text-gray-600 shrink-0">Kanal:</label>
                                <div className="flex gap-2">
                                    {['GMAIL', 'SENDPULSE'].map(ch => (
                                        <button
                                            key={ch}
                                            onClick={() => setReplyChannel(ch)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                                replyChannel === ch
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                            }`}
                                        >
                                            {ch === 'GMAIL' ? 'Gmail' : 'SendPulse'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-5 flex justify-end gap-2">
                            <button
                                onClick={() => setReplyModal(null)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Ləğv et
                            </button>
                            <button
                                onClick={sendReply}
                                disabled={replySending || !replyBody.trim()}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50"
                            >
                                {replySending ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Göndərilir...</>
                                ) : (
                                    <><HiOutlineReply className="w-4 h-4" /> Göndər</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContactMessages;
