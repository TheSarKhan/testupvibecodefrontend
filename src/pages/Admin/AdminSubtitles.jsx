import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineChevronRight, HiOutlineArrowLeft } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminSubtitles = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [templateTitle, setTemplateTitle] = useState('');
    const [subtitles, setSubtitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newSubtitle, setNewSubtitle] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => { fetchData(); }, [templateId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [templatesRes, subtitlesRes] = await Promise.all([
                api.get('/admin/templates'),
                api.get(`/admin/templates/${templateId}/subtitles`),
            ]);
            const tmpl = templatesRes.data.find(t => String(t.id) === String(templateId));
            if (tmpl) setTemplateTitle(tmpl.title);
            setSubtitles(subtitlesRes.data);
        } catch {
            toast.error('Məlumatlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newSubtitle.trim()) { toast.error('Altbaşlıq daxil edin'); return; }
        try {
            const { data } = await api.post(`/admin/templates/${templateId}/subtitles`, { subtitle: newSubtitle.trim() });
            setSubtitles(prev => [...prev, data]);
            setNewSubtitle(''); setCreating(false);
            toast.success('Altbaşlıq yaradıldı');
        } catch { toast.error('Xəta baş verdi'); }
    };

    const handleUpdate = async (id) => {
        if (!editValue.trim()) { toast.error('Altbaşlıq daxil edin'); return; }
        try {
            const { data } = await api.put(`/admin/subtitles/${id}`, { subtitle: editValue.trim() });
            setSubtitles(prev => prev.map(s => s.id === id ? data : s));
            setEditingId(null);
            toast.success('Yeniləndi');
        } catch { toast.error('Xəta baş verdi'); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`"${name}" altbaşlığını silmək istədiyinizə əminsiniz?`)) return;
        try {
            await api.delete(`/admin/subtitles/${id}`);
            setSubtitles(prev => prev.filter(s => s.id !== id));
            toast.success('Altbaşlıq silindi');
        } catch { toast.error('Xəta baş verdi'); }
    };

    return (
        <div className="p-8 max-w-3xl">
            {/* Breadcrumb */}
            <button onClick={() => navigate('/admin/sablonlar')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Şablonlara qayıt
            </button>

            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{templateTitle}</p>
                    <h1 className="text-2xl font-bold text-gray-900">Altbaşlıqlar</h1>
                    <p className="text-gray-500 mt-1 text-sm">Altbaşlıq yaradın, üzərinə klikləyin fənnləri idarə edin</p>
                </div>
                <button onClick={() => { setCreating(true); setNewSubtitle(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <HiOutlinePlus className="w-4 h-4" /> Yeni Altbaşlıq
                </button>
            </div>

            {creating && (
                <div className="mb-4 bg-white rounded-2xl border-2 border-indigo-200 p-5 flex items-center gap-3">
                    <input autoFocus value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                        placeholder="Altbaşlıq, məs: Buraxılış 11-ci sinif"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                    <button onClick={handleCreate} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">Yarat</button>
                    <button onClick={() => setCreating(false)} className="px-4 py-2.5 text-gray-500 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Ləğv et</button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : subtitles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400">
                    <p className="font-medium">Hələ altbaşlıq yoxdur</p>
                    <p className="text-sm mt-1">Yeni altbaşlıq yaradaraq başlayın</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {subtitles.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {editingId === s.id ? (
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleUpdate(s.id); if (e.key === 'Escape') setEditingId(null); }}
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                                    <button onClick={() => handleUpdate(s.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">Saxla</button>
                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-500 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Ləğv et</button>
                                </div>
                            ) : (
                                <div className="flex items-center px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors group"
                                    onClick={() => navigate(`/admin/sablonlar/${templateId}/${s.id}`)}>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-700 transition-colors">{s.subtitle}</h3>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {(s.sections || []).length === 0 ? 'Fənn yoxdur' : `${s.sections.length} fənn`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <button onClick={e => { e.stopPropagation(); setEditingId(s.id); setEditValue(s.subtitle); }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(s.id, s.subtitle); }}
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

export default AdminSubtitles;
