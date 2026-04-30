import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt,
    HiOutlineChevronRight, HiOutlineTemplate, HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TYPES = [
    {
        value: 'STANDARD',
        label: 'Standart (DİM)',
        desc: 'DİM, məktəb, adi imtahan şablonları',
        color: 'indigo',
    },
    {
        value: 'OLIMPIYADA',
        label: 'Olimpiada',
        desc: 'Hər suala ayrı bal qrupu təyin edilə bilər',
        color: 'amber',
    },
];

const typeMeta = (type) => TYPES.find(t => t.value === type) || TYPES[0];

const TypeBadge = ({ type }) => {
    const meta = typeMeta(type);
    if (meta.value === 'STANDARD') return null;
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            Olimpiada
        </span>
    );
};

const TypeSelector = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-2 mt-3">
        {TYPES.map(t => (
            <button
                key={t.value}
                type="button"
                onClick={() => onChange(t.value)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    value === t.value
                        ? t.color === 'indigo'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
                <div className="flex items-center gap-2 w-full">
                    <span className={`font-bold text-sm ${
                        value === t.value
                            ? t.color === 'indigo' ? 'text-indigo-700' : 'text-amber-700'
                            : 'text-gray-700'
                    }`}>{t.label}</span>
                    {value === t.value && (
                        <HiOutlineCheck className={`w-4 h-4 ml-auto ${t.color === 'indigo' ? 'text-indigo-600' : 'text-amber-600'}`} />
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
        ))}
    </div>
);

// ── Inline create/edit form ──────────────────────────────────────────────────
const TemplateForm = ({ initial, onSave, onCancel, saving }) => {
    const [title, setTitle] = useState(initial?.title || '');
    const [templateType, setTemplateType] = useState(initial?.templateType || 'STANDARD');

    const handleSubmit = () => {
        if (!title.trim()) { toast.error('Başlıq daxil edin'); return; }
        onSave({ title: title.trim(), templateType });
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">
                    {initial ? 'Şablonu redaktə et' : 'Yeni şablon'}
                </p>
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
                    placeholder="Şablon adı, məs: DİM 2025"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                />
                <label className="block text-xs font-semibold text-gray-500 mt-4 mb-1 uppercase tracking-wide">Şablon növü</label>
                <TypeSelector value={templateType} onChange={setTemplateType} />
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-colors font-medium"
                >
                    <HiOutlineX className="w-4 h-4" /> Ləğv et
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                    <HiOutlineCheck className="w-4 h-4" />
                    {saving ? 'Saxlanılır...' : (initial ? 'Yenilə' : 'Yarat')}
                </button>
            </div>
        </div>
    );
};

// ── Main page ────────────────────────────────────────────────────────────────
const AdminTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

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

    const handleCreate = async ({ title, templateType }) => {
        setSaving(true);
        try {
            const { data } = await api.post('/admin/templates', { title, templateType });
            setTemplates(prev => [data, ...prev]);
            setShowCreateForm(false);
            toast.success('Şablon yaradıldı');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (id, { title, templateType }) => {
        setSaving(true);
        try {
            const { data } = await api.put(`/admin/templates/${id}`, { title, templateType });
            setTemplates(prev => prev.map(t => t.id === id ? data : t));
            setEditingId(null);
            toast.success('Yeniləndi');
        } catch { toast.error('Əməliyyat uğursuz oldu'); }
        finally { setSaving(false); }
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
                {!showCreateForm && (
                    <button
                        onClick={() => { setShowCreateForm(true); setEditingId(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Yeni Şablon
                    </button>
                )}
            </div>

            {showCreateForm && (
                <div className="mb-4">
                    <TemplateForm
                        onSave={handleCreate}
                        onCancel={() => setShowCreateForm(false)}
                        saving={saving}
                    />
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
                                <div className="p-1">
                                    <TemplateForm
                                        initial={{ title: t.title, templateType: t.templateType || 'STANDARD' }}
                                        onSave={(data) => handleUpdate(t.id, data)}
                                        onCancel={() => setEditingId(null)}
                                        saving={saving}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex items-center px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors group"
                                    onClick={() => navigate(`/admin/sablonlar/${t.id}`)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-700 transition-colors">
                                                {t.title}
                                            </h3>
                                            <TypeBadge type={t.templateType} />
                                        </div>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {t.subtitleCount === 0 ? 'Altbaşlıq yoxdur' : `${t.subtitleCount} altbaşlıq`}
                                            {' · '}
                                            <span className="text-gray-400">{typeMeta(t.templateType).label}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <button
                                            onClick={e => { e.stopPropagation(); setEditingId(t.id); setShowCreateForm(false); }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(t.id, t.title); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
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
