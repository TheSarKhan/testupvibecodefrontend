import { useState, useEffect, useRef } from 'react';
import { HiOutlineTag, HiOutlinePlus, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminTags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef(null);

    const fetchTags = async () => {
        try {
            const { data } = await api.get('/admin/tags');
            setTags(data);
        } catch {
            toast.error('Teqlər yüklənərkən xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setAdding(true);
        try {
            const { data } = await api.post('/admin/tags', { name });
            setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'az')));
            setNewName('');
            inputRef.current?.focus();
            toast.success(`"${data.name}" teqi əlavə edildi`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Xəta baş verdi');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (tag) => {
        if (!window.confirm(`"${tag.name}" teqini silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/tags/${tag.id}`);
            setTags(prev => prev.filter(t => t.id !== tag.id));
            toast.success('Teq silindi');
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">Teqlər</h1>
                <p className="text-sm text-gray-500 mt-1">İmtahan yaradarkən seçim üçün mövcud teqlər</p>
            </div>

            {/* Add form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Yeni teq adı..."
                    maxLength={50}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={adding || !newName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Əlavə et
                </button>
            </form>

            {/* Search */}
            {tags.length > 10 && (
                <div className="relative mb-4">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Teqlərdə axtar..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            )}

            {/* Tag list */}
            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin mr-2" />
                    Yüklənir...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <HiOutlineTag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{search ? 'Axtarışa uyğun teq tapılmadı' : 'Hələ teq əlavə edilməyib'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {filtered.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between px-4 py-3 group hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <HiOutlineTag className="w-3.5 h-3.5 text-indigo-500" />
                                </span>
                                <span className="text-sm font-medium text-gray-800">#{tag.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(tag)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Sil"
                            >
                                <HiOutlineTrash className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {tags.length > 0 && (
                <p className="text-xs text-gray-400 mt-3 text-right">{tags.length} teq</p>
            )}
        </div>
    );
};

export default AdminTags;
