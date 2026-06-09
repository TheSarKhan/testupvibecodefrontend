import { useState, useRef, useEffect } from 'react';
import {
    HiOutlineTag, HiOutlinePlus, HiOutlineTrash, HiOutlineSearch,
    HiOutlinePencilAlt, HiOutlineCheck, HiOutlineX, HiOutlineSwitchHorizontal,
    HiOutlineFire, HiOutlineExclamationCircle, HiOutlineCollection,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import getErrorMessage from '../../../utils/getErrorMessage';
import {
    useAdminTags, useCreateTag, useUpdateTag, useDeleteTag,
    useTagStats, useMergeTags, useBulkDeleteTags,
} from '../../../hooks/admin/useAdminTags';
import Pagination from '../../../components/admin/Pagination';

const PALETTE = [
    { name: 'gray',    bg: 'bg-gray-100',    text: 'text-gray-700',    ring: 'ring-gray-300',    dot: 'bg-gray-400' },
    { name: 'blue',  bg: 'bg-blue-100',  text: 'text-blue-700',  ring: 'ring-blue-300',  dot: 'bg-blue-500' },
    { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300', dot: 'bg-emerald-500' },
    { name: 'amber',   bg: 'bg-amber-100',   text: 'text-amber-700',   ring: 'ring-amber-300',   dot: 'bg-amber-500' },
    { name: 'rose',    bg: 'bg-rose-100',    text: 'text-rose-700',    ring: 'ring-rose-300',    dot: 'bg-rose-500' },
    { name: 'emerald',  bg: 'bg-emerald-100',  text: 'text-emerald-700',  ring: 'ring-emerald-300',  dot: 'bg-emerald-500' },
    { name: 'teal',    bg: 'bg-teal-100',    text: 'text-teal-700',    ring: 'ring-teal-300',    dot: 'bg-teal-500' },
    { name: 'sky',     bg: 'bg-sky-100',     text: 'text-sky-700',     ring: 'ring-sky-300',     dot: 'bg-sky-500' },
];

const paletteOf = (color) => PALETTE.find(p => p.name === color) || PALETTE[1];

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
    const tone = {
        blue:  'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber:   'bg-amber-50 text-amber-600',
        rose:    'bg-rose-50 text-rose-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-extrabold text-gray-900 tabular-nums mt-0.5 truncate">{value}</p>
                    {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
                </div>
            </div>
        </div>
    );
};

// ── Color picker swatches ───────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
        {PALETTE.map(p => (
            <button
                key={p.name}
                type="button"
                onClick={() => onChange(p.name)}
                className={`w-6 h-6 rounded-full ${p.dot} ring-2 transition-all ${value === p.name ? 'ring-gray-900 scale-110' : 'ring-transparent hover:ring-gray-300'}`}
                title={p.name}
            />
        ))}
    </div>
);

// ── Merge modal ──────────────────────────────────────────────────────────────
const MergeModal = ({ sourceTag, allTags, onClose, onMerge, pending }) => {
    const [targetId, setTargetId] = useState('');
    const candidates = allTags.filter(t => t.id !== sourceTag.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Teqi birləşdir</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <HiOutlineX className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">#{sourceTag.name}</span> teqi seçilmiş teqə birləşəcək.
                    Bu teqi istifadə edən bütün imtahanlar hədəf teqə keçəcək, sonra mənbə teq silinəcək.
                </p>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Hədəf teq</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white mb-4">
                    <option value="">— Teq seçin —</option>
                    {candidates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.usageCount} imtahan)</option>
                    ))}
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100">
                        Ləğv
                    </button>
                    <button
                        disabled={!targetId || pending}
                        onClick={() => onMerge(parseInt(targetId))}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60"
                    >
                        {pending ? 'Birləşdirilir...' : 'Birləşdir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main TagsTab ─────────────────────────────────────────────────────────────
const TagsTab = () => {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('blue');
    const [search, setSearch] = useState('');
    const inputRef = useRef(null);

    const [page, setPage] = useState(0);
    const { data, isLoading: loading, error } = useAdminTags({ page, size: 20 });
    const { data: stats } = useTagStats();
    const tags = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;

    const createTag = useCreateTag();
    const updateTag = useUpdateTag();
    const deleteTagMut = useDeleteTag();
    const mergeTags = useMergeTags();
    const bulkDelete = useBulkDeleteTags();

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('blue');
    const [mergingTag, setMergingTag] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        if (error) toast.error('Teqlər yüklənmədi');
    }, [error]);

    const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    const handleAdd = async (e) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        try {
            const data = await createTag.mutateAsync({ name, color: newColor });
            setNewName('');
            inputRef.current?.focus();
            toast.success(`"${data.name}" əlavə edildi`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.error || getErrorMessage(err));
        }
    };

    const startEdit = (tag) => {
        setEditingId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color || 'blue');
    };

    const saveEdit = async () => {
        if (!editName.trim()) { toast.error('Ad boş ola bilməz'); return; }
        try {
            await updateTag.mutateAsync({ id: editingId, name: editName.trim(), color: editColor });
            setEditingId(null);
            toast.success('Yeniləndi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.error || getErrorMessage(err));
        }
    };

    const handleDelete = async (tag) => {
        const warn = tag.usageCount > 0 ? `\n\n${tag.usageCount} imtahanda istifadə olunur — teq silinsə də imtahanlardan adı silinməyəcək.` : '';
        if (!window.confirm(`"${tag.name}" teqini silmək istəyirsiniz?${warn}`)) return;
        try {
            await deleteTagMut.mutateAsync(tag.id);
            toast.success('Teq silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleMerge = async (targetId) => {
        try {
            const result = await mergeTags.mutateAsync({ sourceId: mergingTag.id, targetId });
            toast.success(`${result.merged} imtahan "${result.target}" teqinə keçdi`);
            setMergingTag(null);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Birləşdirmə uğursuz'));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedIds.size} teqi silmək istəyirsiniz?`)) return;
        try {
            const result = await bulkDelete.mutateAsync([...selectedIds]);
            toast.success(`${result.deleted} teq silindi`);
            setSelectedIds(new Set());
        } catch { toast.error('Bulk silinmə uğursuz'); }
    };

    // Tag cloud: scale font size based on usageCount
    const maxUsage = Math.max(1, ...tags.map(t => t.usageCount || 0));

    return (
        <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={HiOutlineTag} label="Cəmi teqlər" value={stats?.totalTags ?? '—'} color="blue" />
                <StatCard icon={HiOutlineCollection} label="Teq istifadəsi" value={stats?.totalTagUsages ?? '—'} sub="exam × tag" color="emerald" />
                <StatCard icon={HiOutlineFire} label="Ən populyar" value={stats?.topTags?.[0]?.name ?? '—'} sub={stats?.topTags?.[0] ? `${stats.topTags[0].usageCount} imtahan` : null} color="amber" />
                <StatCard icon={HiOutlineExclamationCircle} label="Teqsiz imtahan" value={stats?.untaggedExamCount ?? '—'} sub="taglanmalıdır" color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: main list */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Add form */}
                    <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 p-4">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Yeni teq adı..."
                                maxLength={50}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={createTag.isPending || !newName.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                            >
                                <HiOutlinePlus className="w-4 h-4" /> Əlavə et
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-500">Rəng:</span>
                            <ColorPicker value={newColor} onChange={setNewColor} />
                        </div>
                    </form>

                    {/* Search + bulk bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari səhifədə axtar..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-700">{selectedIds.size} seçildi</span>
                                <button onClick={handleBulkDelete} disabled={bulkDelete.isPending}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                                    Sil
                                </button>
                                <button onClick={() => setSelectedIds(new Set())}
                                    className="text-xs text-gray-500 hover:text-gray-700">Ləğv</button>
                            </div>
                        )}
                    </div>

                    {/* Tag list */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                            Yüklənir...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                            <HiOutlineTag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">{search ? 'Axtarışa uyğun teq tapılmadı' : 'Hələ teq əlavə edilməyib'}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                            {filtered.map(tag => {
                                const isEditing = editingId === tag.id;
                                const isSelected = selectedIds.has(tag.id);
                                const p = paletteOf(tag.color);
                                return (
                                    <div key={tag.id} className={`group px-4 py-3 transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-100'}`}>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                                        className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
                                                    />
                                                    <button onClick={saveEdit} disabled={updateTag.isPending}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                        <HiOutlineCheck className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                                                        <HiOutlineX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <ColorPicker value={editColor} onChange={setEditColor} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(tag.id)}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${p.bg} ${p.text} ring-1 ${p.ring}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                                    #{tag.name}
                                                </span>
                                                <span className="text-xs text-gray-400 flex-1">
                                                    {tag.usageCount > 0
                                                        ? <><span className="font-bold text-gray-600">{tag.usageCount}</span> imtahan</>
                                                        : <span className="italic">istifadə olunmur</span>}
                                                </span>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(tag)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Rename + rəng">
                                                        <HiOutlinePencilAlt className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setMergingTag(tag)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                        title="Başqa teqə birləşdir">
                                                        <HiOutlineSwitchHorizontal className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(tag)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Sil">
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
                </div>

                {/* Right sidebar: top used + tag cloud */}
                <div className="space-y-4">
                    {/* Top used */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <HiOutlineFire className="w-4 h-4 text-amber-500" /> Ən çox istifadə olunan
                        </h3>
                        {stats?.topTags?.length > 0 ? (
                            <div className="space-y-2">
                                {stats.topTags.map((t, i) => {
                                    const p = paletteOf(t.color);
                                    const maxTop = stats.topTags[0]?.usageCount || 1;
                                    return (
                                        <div key={t.id} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 w-4 text-right">{i + 1}</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${p.bg} ${p.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                                {t.name}
                                            </span>
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${p.dot}`} style={{ width: `${(t.usageCount / maxTop) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 tabular-nums w-8 text-right">{t.usageCount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 py-4 text-center">Məlumat yoxdur</p>
                        )}
                    </div>

                    {/* Tag cloud */}
                    {tags.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Teq buludu</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(tag => {
                                    const p = paletteOf(tag.color);
                                    const size = 11 + Math.round(((tag.usageCount || 0) / maxUsage) * 8);
                                    return (
                                        <span
                                            key={tag.id}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${p.bg} ${p.text} font-semibold`}
                                            style={{ fontSize: `${size}px` }}
                                            title={`${tag.usageCount} imtahan`}
                                        >
                                            #{tag.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {mergingTag && (
                <MergeModal
                    sourceTag={mergingTag}
                    allTags={tags}
                    onClose={() => setMergingTag(null)}
                    onMerge={handleMerge}
                    pending={mergeTags.isPending}
                />
            )}
        </div>
    );
};

export default TagsTab;
