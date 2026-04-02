import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineChevronRight, HiOutlineTemplate } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/templates');
            setTemplates(data);
        } catch {
            toast.error('Şablonlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) { toast.error('Başlıq daxil edin'); return; }
        try {
            const { data } = await api.post('/admin/templates', { title: newTitle.trim() });
            setTemplates(prev => [data, ...prev]);
            setNewTitle(''); setCreating(false);
            toast.success('Şablon yaradıldı');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleUpdate = async (id) => {
        if (!editTitle.trim()) { toast.error('Başlıq daxil edin'); return; }
        try {
            const { data } = await api.put(`/admin/templates/${id}`, { title: editTitle.trim() });
            setTemplates(prev => prev.map(t => t.id === id ? data : t));
            setEditingId(null);
            toast.success('Yeniləndi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`"${title}" şablonunu silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Şablon silindi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
    };

    return (
        <div className="p-8 max-w-3xl">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">İmtahan Şablonları</h1>
                    <p className="text-gray-500 mt-1 text-sm">Şablon yaradın, üzərinə klikləyin altbaşlıqları idarə edin</p>
                </div>
                <button onClick={() => { setCreating(true); setNewTitle(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <HiOutlinePlus className="w-4 h-4" /> Yeni Şablon
                </button>
            </div>

            {creating && (
                <div className="mb-4 bg-white rounded-2xl border-2 border-indigo-200 p-5 flex items-center gap-3">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                        placeholder="Şablon adı, məs: DIM"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                    <button onClick={handleCreate} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">Yarat</button>
                    <button onClick={() => setCreating(false)} className="px-4 py-2.5 text-gray-500 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Ləğv et</button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400">
                    <HiOutlineTemplate className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Hələ şablon yoxdur</p>
                    <p className="text-sm mt-1">Yeni şablon yaradaraq başlayın</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {editingId === t.id ? (
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleUpdate(t.id); if (e.key === 'Escape') setEditingId(null); }}
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                                    <button onClick={() => handleUpdate(t.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">Saxla</button>
                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-500 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Ləğv et</button>
                                </div>
                            ) : (
                                <div className="flex items-center px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors group"
                                    onClick={() => navigate(`/admin/sablonlar/${t.id}`)}>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-700 transition-colors">{t.title}</h3>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {t.subtitleCount === 0 ? 'Altbaşlıq yoxdur' : `${t.subtitleCount} altbaşlıq`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <button onClick={e => { e.stopPropagation(); setEditingId(t.id); setEditTitle(t.title); }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(t.id, t.title); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                        <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 ml-1 transition-colors" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminTemplates;
