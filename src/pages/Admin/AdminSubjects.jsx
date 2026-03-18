import { useState, useEffect, useMemo } from 'react';
import {
    HiOutlineBookOpen, HiOutlinePlus, HiOutlineTrash, HiOutlineTag,
    HiOutlinePencil, HiOutlineColorSwatch, HiOutlineChevronRight
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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

const AdminSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // Right panel state
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicGrade, setNewTopicGrade] = useState('');
    const [addingTopic, setAddingTopic] = useState(false);

    // Metadata editor state
    const [metaColor, setMetaColor] = useState('');
    const [metaDesc, setMetaDesc] = useState('');
    const [savingMeta, setSavingMeta] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const selectedSubject = useMemo(
        () => subjects.find(s => s.id === selectedId) || null,
        [subjects, selectedId]
    );

    useEffect(() => {
        if (selectedSubject) {
            setMetaColor(selectedSubject.color || '');
            setMetaDesc(selectedSubject.description || '');
        }
    }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/admin/subjects');
            setSubjects(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
            }
        } catch {
            toast.error('Fənnlər yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) return;
        setAdding(true);
        try {
            const { data } = await api.post('/admin/subjects', { name: trimmed });
            setSubjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'az')));
            setNewName('');
            setSelectedId(data.id);
            toast.success(`"${data.name}" əlavə edildi`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteSubject = async (subject) => {
        if (subject.default) {
            toast.error('Default fənnlər silinə bilməz');
            return;
        }
        if (!window.confirm(`"${subject.name}" fənnini silmək istədiyinizdən əminsiniz?`)) return;
        try {
            await api.delete(`/admin/subjects/${subject.id}`);
            setSubjects(prev => prev.filter(s => s.id !== subject.id));
            if (selectedId === subject.id) {
                const remaining = subjects.filter(s => s.id !== subject.id);
                setSelectedId(remaining.length > 0 ? remaining[0].id : null);
            }
            toast.success(`"${subject.name}" silindi`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        }
    };

    const handleAddTopic = async () => {
        const trimmed = newTopicName.trim();
        if (!trimmed || !selectedId) return;
        setAddingTopic(true);
        try {
            const { data } = await api.post(`/admin/subjects/${selectedId}/topics`, {
                name: trimmed,
                gradeLevel: newTopicGrade || null,
            });
            setSubjects(prev => prev.map(s => {
                if (s.id !== selectedId) return s;
                return { ...s, topics: [...(s.topics || []), data] };
            }));
            setNewTopicName('');
            setNewTopicGrade('');
            toast.success('Mövzu əlavə edildi');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setAddingTopic(false);
        }
    };

    const handleRemoveTopic = async (topicId) => {
        if (!selectedId) return;
        try {
            await api.delete(`/admin/subjects/${selectedId}/topics/${topicId}`);
            setSubjects(prev => prev.map(s => {
                if (s.id !== selectedId) return s;
                return { ...s, topics: (s.topics || []).filter(t => t.id !== topicId) };
            }));
            toast.success('Mövzu silindi');
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const handleSaveMeta = async () => {
        if (!selectedId) return;
        setSavingMeta(true);
        try {
            const { data } = await api.put(`/admin/subjects/${selectedId}/metadata`, {
                color: metaColor || null,
                description: metaDesc || null,
            });
            setSubjects(prev => prev.map(s => s.id === selectedId ? { ...s, ...data } : s));
            toast.success('Metadata yadda saxlanıldı');
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setSavingMeta(false);
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Fənn İdarəetməsi</h1>
                <p className="text-sm text-gray-500 mt-1">Müəllimlərin imtahan yaradarkən seçə biləcəyi fənn siyahısı</p>
            </div>

            <div className="flex gap-6 min-h-[600px]">
                {/* ── Left panel: subject list ── */}
                <div className="w-72 shrink-0 flex flex-col gap-3">
                    {/* Add subject form */}
                    <form onSubmit={handleAddSubject} className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Yeni fənn adı..."
                            className="flex-1 min-w-0 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            maxLength={80}
                        />
                        <button
                            type="submit"
                            disabled={!newName.trim() || adding}
                            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <HiOutlinePlus className="w-4 h-4" />
                        </button>
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
                            <ul className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                                {subjects.map(subject => {
                                    const topicCount = (subject.topics || []).length;
                                    const isSelected = subject.id === selectedId;
                                    return (
                                        <li key={subject.id}>
                                            <button
                                                onClick={() => setSelectedId(subject.id)}
                                                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Color dot */}
                                                <span
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: subject.color || '#e5e7eb' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                        {subject.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{topicCount} mövzu</p>
                                                </div>
                                                {isSelected && <HiOutlineChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />}
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
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Default
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metadata editor */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                <HiOutlineColorSwatch className="w-4 h-4 text-indigo-500" />
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
                                            placeholder="#6366f1"
                                            className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* Description */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Təsvir</label>
                                        <textarea
                                            value={metaDesc}
                                            onChange={e => setMetaDesc(e.target.value)}
                                            placeholder="Fənn haqqında qısa məlumat..."
                                            rows={2}
                                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                            maxLength={300}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleSaveMeta}
                                    disabled={savingMeta}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
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
                                        className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        maxLength={80}
                                    />
                                    <select
                                        value={newTopicGrade}
                                        onChange={e => setNewTopicGrade(e.target.value)}
                                        className="text-sm px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-36"
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
        </div>
    );
};

export default AdminSubjects;
