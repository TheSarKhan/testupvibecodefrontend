import { useState, useEffect, useMemo } from 'react';
import {
    HiOutlineBookOpen, HiOutlinePlus, HiOutlineTrash, HiOutlineTag,
    HiOutlinePencil, HiOutlineColorSwatch, HiOutlineChevronRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
    useAdminSubjects,
    useAddSubject,
    useDeleteSubject,
    useAddTopic,
    useDeleteTopic,
    useUpdateSubjectMetadata,
    useSubjectCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
} from '../../hooks/admin/useAdminSubjects';
import Pagination from '../../components/admin/Pagination';
import TagsTab from './subjects/TagsTab';

const PRESET_COLORS = [
    '#6366f1', '#0ea5e9', '#10b981', '#22c55e', '#f59e0b',
    '#3b82f6', '#ef4444', '#84cc16', '#8b5cf6', '#f97316',
    '#ec4899', '#06b6d4', '#14b8a6', '#a855f7', '#f43f5e',
    '#64748b', '#78716c', '#7c3aed', '#0891b2', '#059669',
];

const GRADE_LEVELS = [
    { value: '', label: 'Bütün siniflər' },
    { value: '1-4', label: '1-4 sinif' },
    { value: '5-8', label: '5-8 sinif' },
    { value: '9-11', label: '9-11 sinif' },
    { value: 'Buraxılış', label: 'Buraxılış' },
];

const GRADE_SECTION_LABELS = {
    '1-4': '1-4 sinif',
    '5-8': '5-8 sinif',
    '9-11': '9-11 sinif',
    'Buraxılış': 'Buraxılış',
    null: 'Bütün siniflər',
};

/**
 * Admin-managed picker categories: add, rename, recolor, reorder, delete.
 * Default (seeded) categories are deletion-protected; deleting a custom one
 * leaves its subjects uncategorised (FK SET NULL on the backend).
 */
const CategoriesTab = ({ categories }) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatOrder, setNewCatOrder] = useState('');
    const [newCatColor, setNewCatColor] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editOrder, setEditOrder] = useState('');
    const [editColor, setEditColor] = useState('');

    const createCat = useCreateCategory();
    const updateCat = useUpdateCategory();
    const deleteCat = useDeleteCategory();

    const handleCreate = async (e) => {
        e.preventDefault();
        const name = newCatName.trim();
        if (!name) return;
        try {
            await createCat.mutateAsync({
                name,
                orderIndex: newCatOrder === '' ? null : Number(newCatOrder),
                color: newCatColor || null,
            });
            setNewCatName(''); setNewCatOrder(''); setNewCatColor('');
            toast.success(`"${name}" kateqoriyası yaradıldı`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditOrder(cat.orderIndex != null ? String(cat.orderIndex) : '');
        setEditColor(cat.color || '');
    };

    const handleSaveEdit = async (cat) => {
        try {
            await updateCat.mutateAsync({
                id: cat.id,
                name: editName.trim() || null,
                orderIndex: editOrder === '' ? null : Number(editOrder),
                color: editColor,
            });
            setEditingId(null);
            toast.success('Kateqoriya yeniləndi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (cat) => {
        if (cat.default) {
            toast.error('Default kateqoriyalar silinə bilməz');
            return;
        }
        if (!window.confirm(`"${cat.name}" kateqoriyasını silmək istədiyinizdən əminsiniz? Bağlı fənlər silinmir, sadəcə kateqoriyasız qalır.`)) return;
        try {
            await deleteCat.mutateAsync(cat.id);
            toast.success(`"${cat.name}" silindi`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    return (
        <div className="max-w-3xl">
            {/* Add category */}
            <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Yeni kateqoriya</p>
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Kateqoriya adı..."
                        className="flex-1 min-w-[160px] text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={80}
                    />
                    <input
                        type="number"
                        value={newCatOrder}
                        onChange={e => setNewCatOrder(e.target.value)}
                        placeholder="Sıra"
                        className="w-20 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="text"
                        value={newCatColor}
                        onChange={e => setNewCatColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="w-28 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                    <button
                        type="submit"
                        disabled={!newCatName.trim() || createCat.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Əlavə et
                    </button>
                </div>
            </form>

            {/* Category list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kateqoriyalar</span>
                    <span className="text-xs text-gray-400">{categories.length}</span>
                </div>
                {categories.length === 0 ? (
                    <p className="text-center text-gray-400 py-10 text-sm">Hələ kateqoriya yoxdur</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                                {editingId === cat.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 min-w-0 text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                            maxLength={80}
                                        />
                                        <input
                                            type="number"
                                            value={editOrder}
                                            onChange={e => setEditOrder(e.target.value)}
                                            placeholder="Sıra"
                                            className="w-16 text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={editColor}
                                            onChange={e => setEditColor(e.target.value)}
                                            placeholder="#3b82f6"
                                            className="w-24 text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(cat)}
                                            disabled={updateCat.isPending}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Saxla
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Ləğv et
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: cat.color || '#e5e7eb' }}
                                        />
                                        <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                                        {cat.orderIndex != null && (
                                            <span className="text-xs text-gray-400">sıra: {cat.orderIndex}</span>
                                        )}
                                        {cat.default && (
                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                Default
                                            </span>
                                        )}
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Redaktə et"
                                        >
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        {!cat.default && (
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const AdminSubjects = () => {
    const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'tags'
    const [selectedId, setSelectedId] = useState(null);
    const [newName, setNewName] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicGrade, setNewTopicGrade] = useState('');
    const [metaColor, setMetaColor] = useState('');
    const [metaDesc, setMetaDesc] = useState('');
    const [metaCategoryId, setMetaCategoryId] = useState('');

    const [subjPage, setSubjPage] = useState(0);
    const { data: subjData, isLoading: loading, error } = useAdminSubjects({ page: subjPage, size: 15 });
    const subjects = subjData?.content ?? [];
    const subjTotalPages = subjData?.totalPages ?? 0;
    const subjTotal = subjData?.totalElements ?? 0;
    const addSubject = useAddSubject();
    const deleteSubjectMut = useDeleteSubject();
    const addTopicMut = useAddTopic();
    const deleteTopicMut = useDeleteTopic();
    const saveMetaMut = useUpdateSubjectMetadata();

    const adding = addSubject.isPending;
    const addingTopic = addTopicMut.isPending;
    const savingMeta = saveMetaMut.isPending;

    if (error) toast.error('Fənnlər yüklənmədi');

    // Auto-select first subject when list loads
    useEffect(() => {
        if (subjects.length > 0 && !selectedId) {
            setSelectedId(subjects[0].id);
        }
    }, [subjects, selectedId]);

    const selectedSubject = useMemo(
        () => subjects.find(s => s.id === selectedId) || null,
        [subjects, selectedId]
    );

    useEffect(() => {
        if (selectedSubject) {
            setMetaColor(selectedSubject.color || '');
            setMetaDesc(selectedSubject.description || '');
            setMetaCategoryId(selectedSubject.categoryId != null ? String(selectedSubject.categoryId) : '');
        }
    }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Admin-managed categories (dropdown options + management tab)
    const { data: categories = [] } = useSubjectCategories();

    const handleAddSubject = async (e) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) return;
        try {
            const data = await addSubject.mutateAsync({ name: trimmed, categoryId: newCategoryId || null });
            setNewName('');
            setNewCategoryId('');
            setSelectedId(data.id);
            toast.success(`"${data.name}" əlavə edildi`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDeleteSubject = async (subject) => {
        if (subject.default) {
            toast.error('Default fənnlər silinə bilməz');
            return;
        }
        if (!window.confirm(`"${subject.name}" fənnini silmək istədiyinizdən əminsiniz?`)) return;
        try {
            await deleteSubjectMut.mutateAsync(subject.id);
            if (selectedId === subject.id) {
                const remaining = subjects.filter(s => s.id !== subject.id);
                setSelectedId(remaining.length > 0 ? remaining[0].id : null);
            }
            toast.success(`"${subject.name}" silindi`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleAddTopic = async () => {
        const trimmed = newTopicName.trim();
        if (!trimmed || !selectedId) return;
        try {
            await addTopicMut.mutateAsync({
                subjectId: selectedId,
                name: trimmed,
                gradeLevel: newTopicGrade || null,
            });
            setNewTopicName('');
            setNewTopicGrade('');
            toast.success('Mövzu əlavə edildi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleRemoveTopic = async (topicId) => {
        if (!selectedId) return;
        try {
            await deleteTopicMut.mutateAsync({ subjectId: selectedId, topicId });
            toast.success('Mövzu silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleSaveMeta = async () => {
        if (!selectedId) return;
        try {
            await saveMetaMut.mutateAsync({
                subjectId: selectedId,
                color: metaColor || null,
                description: metaDesc || null,
                // '' clears the category server-side; null would leave it untouched
                categoryId: metaCategoryId,
            });
            toast.success('Metadata yadda saxlanıldı');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    // Group topics by gradeLevel
    const groupedTopics = useMemo(() => {
        const topics = selectedSubject?.topics || [];
        const groups = {};
        for (const t of topics) {
            const key = t.gradeLevel ?? null;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        }
        return groups;
    }, [selectedSubject]);

    const gradeSectionOrder = [null, '1-4', '5-8', '9-11', 'Buraxılış'];

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Kontent Taksonomiyası</h1>
                <p className="text-sm text-gray-500 mt-1">Fənnlər və imtahan teqləri</p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'subjects' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Fənnlər
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kateqoriyalar
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'tags' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Teqlər
                </button>
            </div>

            {activeTab === 'tags' ? <TagsTab /> :
             activeTab === 'categories' ? <CategoriesTab categories={categories} /> : (
            <div className="flex gap-6 min-h-[600px]">
                {/* ── Left panel: subject list ── */}
                <div className="w-72 shrink-0 flex flex-col gap-3">
                    {/* Add subject form */}
                    <form onSubmit={handleAddSubject} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Yeni fənn adı..."
                                className="flex-1 min-w-0 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={80}
                            />
                            <button
                                type="submit"
                                disabled={!newName.trim() || adding}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>
                        </div>
                        <select
                            value={newCategoryId}
                            onChange={e => setNewCategoryId(e.target.value)}
                            className="text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        >
                            <option value="">Kateqoriyasız</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </form>

                    {/* Subject list */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fənnlər</span>
                            <span className="text-xs text-gray-400">{subjects.length}</span>
                        </div>
                        {subjects.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 text-sm">Heç bir fənn tapılmadı</p>
                        ) : (
                            <ul className="divide-y divide-gray-50 min-h-[520px] max-h-[520px] overflow-y-auto">
                                {subjects.map(subject => {
                                    const topicCount = (subject.topics || []).length;
                                    const isSelected = subject.id === selectedId;
                                    return (
                                        <li key={subject.id}>
                                            <button
                                                onClick={() => setSelectedId(subject.id)}
                                                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                            >
                                                {/* Color dot */}
                                                <span
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: subject.color || '#e5e7eb' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                                        {subject.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{topicCount} mövzu</p>
                                                </div>
                                                {isSelected && <HiOutlineChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                                                {!subject.default && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDeleteSubject(subject); }}
                                                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Sil"
                                                    >
                                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {subjects.length > 0 && (
                            <div className="px-3 pb-3">
                                <Pagination page={subjPage} totalPages={subjTotalPages} totalElements={subjTotal} onChange={setSubjPage} maxButtons={3} compact />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel: selected subject details ── */}
                {selectedSubject ? (
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        {/* Subject header */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
                            <span
                                className="w-4 h-4 rounded-full shrink-0"
                                style={{ backgroundColor: selectedSubject.color || '#e5e7eb' }}
                            />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selectedSubject.name}</h2>
                                {selectedSubject.default && (
                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Default
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metadata editor */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                <HiOutlineColorSwatch className="w-4 h-4 text-blue-500" />
                                Metadata
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Color picker */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Rəng</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {PRESET_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setMetaColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 transition-transform ${metaColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-200 shrink-0"
                                            style={{ backgroundColor: metaColor || '#e5e7eb' }}
                                        />
                                        <input
                                            type="text"
                                            value={metaColor}
                                            onChange={e => setMetaColor(e.target.value)}
                                            placeholder="#3b82f6"
                                            className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* Category */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Kateqoriya</label>
                                        <select
                                            value={metaCategoryId}
                                            onChange={e => setMetaCategoryId(e.target.value)}
                                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                        >
                                            <option value="">Kateqoriyasız</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Description */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Təsvir</label>
                                        <textarea
                                            value={metaDesc}
                                            onChange={e => setMetaDesc(e.target.value)}
                                            placeholder="Fənn haqqında qısa məlumat..."
                                            rows={2}
                                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            maxLength={300}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleSaveMeta}
                                    disabled={savingMeta}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                    <HiOutlinePencil className="w-4 h-4" />
                                    {savingMeta ? 'Saxlanılır...' : 'Yadda saxla'}
                                </button>
                            </div>
                        </div>

                        {/* Topics panel */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                <HiOutlineTag className="w-4 h-4 text-teal-500" />
                                Mövzular
                                <span className="ml-auto text-xs font-normal text-gray-400">
                                    {(selectedSubject.topics || []).length} mövzu
                                </span>
                            </h3>

                            {/* Topics grouped by grade level */}
                            {gradeSectionOrder.map(grade => {
                                const key = grade === null ? 'null' : grade;
                                const topicsInGroup = groupedTopics[grade] || groupedTopics[key] || [];
                                // Only show if there are topics in this group
                                if (topicsInGroup.length === 0) return null;
                                return (
                                    <div key={key} className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            {GRADE_SECTION_LABELS[grade]}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {topicsInGroup.map(topic => (
                                                <span
                                                    key={topic.id}
                                                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full"
                                                >
                                                    <HiOutlineTag className="w-3 h-3 text-teal-500" />
                                                    {topic.name}
                                                    <button
                                                        onClick={() => handleRemoveTopic(topic.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                                                        title="Sil"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {(selectedSubject.topics || []).length === 0 && (
                                <p className="text-xs text-gray-400 mb-4">Hələ mövzu əlavə edilməyib</p>
                            )}

                            {/* Add topic form */}
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Yeni mövzu əlavə et</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTopicName}
                                        onChange={e => setNewTopicName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                                        placeholder="Mövzu adı (məs. Cəbr)"
                                        className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        maxLength={80}
                                    />
                                    <select
                                        value={newTopicGrade}
                                        onChange={e => setNewTopicGrade(e.target.value)}
                                        className="text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-36"
                                    >
                                        {GRADE_LEVELS.map(g => (
                                            <option key={g.value} value={g.value}>{g.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddTopic}
                                        disabled={!newTopicName.trim() || addingTopic}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" />
                                        Əlavə et
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <HiOutlineBookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Fənn seçin</p>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default AdminSubjects;
