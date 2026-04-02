import { useState, useEffect, useCallback } from 'react';
import {
    HiBell, HiMail, HiUsers, HiUserGroup, HiShieldCheck, HiAcademicCap,
    HiPaperClip, HiX, HiCheckCircle, HiClock, HiChevronLeft, HiChevronRight,
    HiSearch, HiCheck, HiInformationCircle, HiOutlineSpeakerphone, HiOutlineExclamationCircle, HiOutlineLink, HiOutlinePencilAlt
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Sabitlər ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
    { value: 'STUDENT', label: 'Tələbələr', icon: HiUserGroup, color: 'emerald' },
    { value: 'TEACHER', label: 'Müəllimlər', icon: HiAcademicCap, color: 'indigo' },
    { value: 'ADMIN', label: 'Adminlər', icon: HiShieldCheck, color: 'purple' },
];

const CHANNEL_LABELS = { SITE: 'Sayt', GMAIL: 'Gmail', SENDPULSE: 'SendPulse' };
const TARGET_LABELS = { ALL: 'Hamısı', ROLE: 'Rola görə', SELECTED: 'Seçilmiş' };

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── User seçim komponenti ────────────────────────────────────────────────────

const UserSelector = ({ selectedIds, onChange }) => {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, size: 10 });
            if (search.trim()) params.set('search', search.trim());
            const { data } = await api.get(`/admin/users?${params}`);
            setUsers(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch {
            toast.error('İstifadəçilər yüklənə bilmədi');
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setPage(0);
    }, [search]);

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
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {selectedIds.length} seçilib
                    </span>
                )}
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin h-5 w-5 border-b-2 border-indigo-600 rounded-full" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">İstifadəçi tapılmadı</p>
                ) : (
                    <>
                        {/* Toggle all on this page */}
                        <div
                            onClick={toggleAll}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer bg-gray-50/80"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                users.every(u => selectedIds.includes(u.id))
                                    ? 'bg-indigo-600 border-indigo-600'
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
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    selectedIds.includes(user.id)
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedIds.includes(user.id) && <HiCheck className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{user.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700'
                                    : user.role === 'TEACHER' ? 'bg-indigo-100 text-indigo-700'
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

// ─── Tarixçə Cədvəli ──────────────────────────────────────────────────────────

const HistoryTable = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/notifications/history?page=${page}&size=15`);
            setLogs(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch {
            toast.error('Tarixçə yüklənə bilmədi');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

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

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <HiChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <HiChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Ana Komponent ─────────────────────────────────────────────────────────────

const AdminNotifications = () => {
    const [activeTab, setActiveTab] = useState('send');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetType, setTargetType] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('STUDENT');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    
    // NEW: Type & Link
    const [notifType, setNotifType] = useState('SYSTEM');
    const [actionUrl, setActionUrl] = useState('');

    const [channelSite, setChannelSite] = useState(true);
    const [channelEmail, setChannelEmail] = useState(false);
    const [emailProvider, setEmailProvider] = useState('GMAIL');
    const [attachment, setAttachment] = useState(null);
    const [sending, setSending] = useState(false);

    // User count for preview
    const [previewCount, setPreviewCount] = useState(null);

    useEffect(() => {
        if (targetType === 'SELECTED') {
            setPreviewCount(selectedUserIds.length);
            return;
        }
        const fetchCount = async () => {
            try {
                const params = new URLSearchParams({ page: 0, size: 1 });
                if (targetType === 'ROLE') params.set('role', roleFilter);
                const { data } = await api.get(`/admin/users?${params}`);
                setPreviewCount(data.totalElements ?? 0);
            } catch {
                setPreviewCount(null);
            }
        };
        fetchCount();
    }, [targetType, roleFilter, selectedUserIds]);

    const handleSend = async () => {
        if (!title.trim()) { toast.error('Başlıq daxil edin'); return; }
        if (!description.trim()) { toast.error('Məzmun daxil edin'); return; }
        if (!channelSite && !channelEmail) { toast.error('Ən az bir kanal seçin'); return; }
        if (targetType === 'SELECTED' && selectedUserIds.length === 0) {
            toast.error('Ən az bir istifadəçi seçin');
            return;
        }

        const channels = [];
        if (channelSite) channels.push('SITE');
        if (channelEmail) channels.push(emailProvider);

        const requestData = {
            title: title.trim(),
            description: description.trim(),
            channels,
            targetType,
            roleFilter: targetType === 'ROLE' ? roleFilter : null,
            userIds: targetType === 'SELECTED' ? selectedUserIds : null,
            type: notifType,
            actionUrl: actionUrl.trim() || null
        };

        const formData = new FormData();
        formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
        if (attachment) formData.append('attachment', attachment);

        setSending(true);
        try {
            await api.post('/admin/notifications/send', formData, {
                headers: { 'Content-Type': undefined },
            });
            toast.success(`${previewCount ?? '?'} istifadəçiyə göndərildi`);
            setTitle('');
            setDescription('');
            setSelectedUserIds([]);
            setAttachment(null);
        } catch (e) {
            if (!e._handled) toast.error(e.response?.data?.message || 'Göndərmə zamanı xəta baş verdi');
        } finally {
            setSending(false);
        }
    };

    const removeAttachment = () => setAttachment(null);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Bildiriş Mərkəzi</h1>
                <p className="text-sm text-gray-500 mt-1">İstifadəçilərə sayt bildirişi və ya e-mail göndərin</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
                {[
                    { key: 'send', label: 'Göndər', icon: HiBell },
                    { key: 'history', label: 'Tarixçə', icon: HiClock },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === key
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── GÖNDƏR TAB ── */}
            {activeTab === 'send' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Target + Content */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* 1. Hədəf */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <HiUsers className="w-4 h-4 text-indigo-500" />
                                Hədəf auditoriya
                            </h2>

                            <div className="flex gap-2 mb-4">
                                {[
                                    { value: 'ALL', label: 'Hamısı' },
                                    { value: 'ROLE', label: 'Rola görə' },
                                    { value: 'SELECTED', label: 'Seçilmiş' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTargetType(opt.value)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                                            targetType === opt.value
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Role filter */}
                            {targetType === 'ROLE' && (
                                <div className="flex gap-3 mt-2">
                                    {ROLE_OPTIONS.map(role => (
                                        <button
                                            key={role.value}
                                            onClick={() => setRoleFilter(role.value)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                                                roleFilter === role.value
                                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <role.icon className="w-4 h-4" />
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected users */}
                            {targetType === 'SELECTED' && (
                                <div className="mt-2">
                                    <UserSelector
                                        selectedIds={selectedUserIds}
                                        onChange={setSelectedUserIds}
                                    />
                                </div>
                            )}

                            {/* Count preview */}
                            {previewCount !== null && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                    <HiInformationCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                                    Bu göndəriş <strong className="text-indigo-700">{previewCount}</strong> istifadəçiyə çatacaq
                                </div>
                            )}
                        </div>

                        {/* 2. Məzmun */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <HiBell className="w-4 h-4 text-indigo-500" />
                                Bildiriş məzmunu
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Başlıq</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Məs. Yeni mövsüm başladı!"
                                        maxLength={100}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                    <p className="text-xs text-gray-400 text-right mt-1">{title.length}/100</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Məzmun / Açıqlama</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Bildiriş məzmununu yazın..."
                                        rows={4}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                    {/* Bildiriş növü seçimi */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">Bildirişin Növü</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'SYSTEM', label: 'Sistem', icon: HiBell, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
                                                { value: 'ANNOUNCEMENT', label: 'Elan', icon: HiOutlineSpeakerphone, color: 'text-purple-500 bg-purple-50 border-purple-200' },
                                                { value: 'WARNING', label: 'Təcili', icon: HiOutlineExclamationCircle, color: 'text-red-500 bg-red-50 border-red-200' },
                                                { value: 'EXAM_CREATED', label: 'İmtahan', icon: HiOutlinePencilAlt, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
                                            ].map(type => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setNotifType(type.value)}
                                                    className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold transition-all ${
                                                        notifType === type.value
                                                            ? `border-opacity-100 shadow-sm ${type.color}`
                                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <type.icon className="w-4 h-4 shrink-0" />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Yönləndirmə Linki */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">Yönləndirmə Linki (könüllü)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <HiOutlineLink className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={actionUrl}
                                                onChange={e => setActionUrl(e.target.value)}
                                                placeholder="Məs. /imtahanlar/123"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <p className="mt-1.5 text-[10px] text-gray-400">İstifadəçi bildirişə klikləyəndə avtomatik bu səhifəyə gedəcək.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Channels + Send */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 3. Kanallar */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <HiMail className="w-4 h-4 text-indigo-500" />
                                Göndəriş kanalı
                            </h2>

                            <div className="space-y-3">
                                {/* Sayt bildirişi */}
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    channelSite ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={channelSite}
                                        onChange={e => setChannelSite(e.target.checked)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    <HiBell className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Sayt bildirişi</p>
                                        <p className="text-xs text-gray-400">Zəng ikonasında görünür</p>
                                    </div>
                                </label>

                                {/* E-mail */}
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    channelEmail ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={channelEmail}
                                        onChange={e => setChannelEmail(e.target.checked)}
                                        className="w-4 h-4 accent-red-600"
                                    />
                                    <HiMail className="w-5 h-5 text-red-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">E-mail</p>
                                        <p className="text-xs text-gray-400">İstifadəçinin e-poctuna</p>
                                    </div>
                                </label>

                                {/* Email provider + attachment */}
                                {channelEmail && (
                                    <div className="ml-2 pl-3 border-l-2 border-red-200 space-y-3">
                                        {/* Provider seçim */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Göndərici</p>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: 'GMAIL', label: 'Gmail' },
                                                    { value: 'SENDPULSE', label: 'SendPulse' },
                                                ].map(p => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setEmailProvider(p.value)}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                            emailProvider === p.value
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                                                        }`}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fayl əlavə et */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Fayl əlavə et (istəyə görə)</p>
                                            {attachment ? (
                                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                                    <HiPaperClip className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="text-xs text-gray-600 truncate flex-1">{attachment.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={removeAttachment}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <HiX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                                                    <HiPaperClip className="w-4 h-4 text-gray-400" />
                                                    <span className="text-xs text-gray-500">Fayl seç...</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={e => setAttachment(e.target.files?.[0] || null)}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Göndər düyməsi */}
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm"
                        >
                            {sending ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                                    Göndərilir...
                                </>
                            ) : (
                                <>
                                    <HiCheckCircle className="w-5 h-5" />
                                    {previewCount !== null
                                        ? `${previewCount} nəfərə Göndər`
                                        : 'Göndər'}
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
                            <p className="font-semibold">Qeydlər:</p>
                            <p>• Sayt bildirişi yalnız qeydiyyatdan keçmiş istifadəçilərə çatır</p>
                            <p>• E-mail göndərişi daha uzun çəkə bilər</p>
                            <p>• SendPulse üçün API açarlarını konfiqurasiyadanda əlavə edin</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TARİXÇƏ TAB ── */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-800 mb-6">Göndəriş Tarixçəsi</h2>
                    <HistoryTable />
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;
