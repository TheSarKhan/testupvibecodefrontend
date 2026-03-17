import { useState, useEffect, useRef } from 'react';
import {
    HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineEye,
    HiOutlineEyeOff, HiOutlineX, HiOutlineCheck, HiOutlinePhotograph,
    HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineUpload,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const POSITIONS = [
    { value: 'HERO', label: 'Hero (Üst tam genişlik)', desc: 'Sayfanın ən üstünde, hero bölməsinin altında' },
    { value: 'INLINE', label: 'Daxili (Bölmələr arası)', desc: 'Bölmələr arasında yerləşir' },
    { value: 'BOTTOM', label: 'Alt (Footerdan əvvəl)', desc: 'Sayfanın altında, footer-dan əvvəl' },
];

const GRADIENTS = [
    { value: 'from-indigo-600 to-purple-600', label: 'İndigo → Bənövşəyi', preview: 'bg-gradient-to-r from-indigo-600 to-purple-600' },
    { value: 'from-blue-600 to-cyan-500', label: 'Mavi → Cyan', preview: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
    { value: 'from-emerald-500 to-teal-600', label: 'Yaşıl → Teal', preview: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
    { value: 'from-orange-500 to-pink-500', label: 'Narıncı → Çəhrayı', preview: 'bg-gradient-to-r from-orange-500 to-pink-500' },
    { value: 'from-rose-500 to-red-600', label: 'Gül → Qırmızı', preview: 'bg-gradient-to-r from-rose-500 to-red-600' },
    { value: 'from-amber-500 to-orange-600', label: 'Kəhrəba → Narıncı', preview: 'bg-gradient-to-r from-amber-500 to-orange-600' },
    { value: 'from-gray-800 to-gray-900', label: 'Tünd Boz', preview: 'bg-gradient-to-r from-gray-800 to-gray-900' },
];

const emptyForm = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    linkText: 'Ətraflı bax',
    isActive: true,
    position: 'INLINE',
    bgGradient: 'from-indigo-600 to-purple-600',
    orderIndex: 0,
};

const BannerPreview = ({ form }) => {
    const grad = form.bgGradient || 'from-indigo-600 to-purple-600';
    return (
        <div className={`bg-gradient-to-r ${grad} rounded-2xl p-6 text-white flex items-center gap-6 overflow-hidden relative`}>
            <div className="absolute inset-0 bg-black/10 rounded-2xl" />
            {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="relative z-10 h-20 w-20 object-cover rounded-xl shrink-0 shadow-lg" />
            )}
            <div className="relative z-10 flex-1 min-w-0">
                <p className="font-extrabold text-lg leading-tight truncate">{form.title || 'Başlıq'}</p>
                {form.subtitle && <p className="text-white/80 text-sm mt-1 line-clamp-2">{form.subtitle}</p>}
                {form.linkUrl && (
                    <span className="inline-flex items-center mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30">
                        {form.linkText || 'Ətraflı bax'} →
                    </span>
                )}
            </div>
        </div>
    );
};

const Modal = ({ banner, onClose, onSave }) => {
    const [form, setForm] = useState(banner ? { ...banner } : { ...emptyForm });
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleImageFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => set('imageUrl', ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Başlıq tələb olunur'); return; }
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">
                        {banner ? 'Banneri Redaktə Et' : 'Yeni Banner Əlavə Et'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Live Preview */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Önizləmə</p>
                        <BannerPreview form={form} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlıq *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Banner başlığı"
                            />
                        </div>

                        {/* Subtitle */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alt başlıq</label>
                            <textarea
                                rows={2}
                                value={form.subtitle}
                                onChange={e => set('subtitle', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                placeholder="Qısa açıqlama mətni"
                            />
                        </div>

                        {/* Link URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                            <input
                                type="text"
                                value={form.linkUrl}
                                onChange={e => set('linkUrl', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="/planlar və ya https://..."
                            />
                        </div>

                        {/* Link Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Düymə mətni</label>
                            <input
                                type="text"
                                value={form.linkText}
                                onChange={e => set('linkText', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Ətraflı bax"
                            />
                        </div>

                        {/* Image upload */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <HiOutlinePhotograph className="inline w-4 h-4 mr-1" />
                                Şəkil (istəyə bağlı)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageFile}
                            />
                            {form.imageUrl ? (
                                <div className="flex items-center gap-3">
                                    <img src={form.imageUrl} alt="" className="h-16 w-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            <HiOutlineUpload className="w-3.5 h-3.5" /> Dəyiş
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => set('imageUrl', '')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <HiOutlineX className="w-3.5 h-3.5" /> Sil
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 w-full px-4 py-6 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl text-sm text-gray-500 hover:text-indigo-600 transition-colors justify-center"
                                >
                                    <HiOutlineUpload className="w-5 h-5" />
                                    Şəkil yükləyin
                                </button>
                            )}
                        </div>

                        {/* Gradient */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fon rəngi</label>
                            <div className="grid grid-cols-4 gap-2">
                                {GRADIENTS.map(g => (
                                    <button
                                        key={g.value}
                                        type="button"
                                        onClick={() => set('bgGradient', g.value)}
                                        className={`relative h-10 rounded-lg ${g.preview} transition-transform hover:scale-105 ${form.bgGradient === g.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : ''}`}
                                        title={g.label}
                                    >
                                        {form.bgGradient === g.value && (
                                            <HiOutlineCheck className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mövqe</label>
                            <select
                                value={form.position}
                                onChange={e => set('position', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                {POSITIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Order + Active */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sıra</label>
                                <input
                                    type="number"
                                    value={form.orderIndex}
                                    onChange={e => set('orderIndex', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    min={0}
                                />
                            </div>
                            <div className="flex flex-col justify-end pb-0.5">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <button
                                    type="button"
                                    onClick={() => set('isActive', !form.isActive)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {form.isActive ? <HiOutlineEye className="w-4 h-4" /> : <HiOutlineEyeOff className="w-4 h-4" />}
                                    {form.isActive ? 'Aktiv' : 'Gizli'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors">
                        Ləğv et
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saxlanılır...' : (banner ? 'Yenilə' : 'Əlavə et')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', banner? }
    const [deleting, setDeleting] = useState(null);

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/banners');
            setBanners(data);
        } catch { toast.error('Bannerlər yüklənmədi'); }
        finally { setLoading(false); }
    };

    const handleSave = async (form) => {
        try {
            if (modal?.banner) {
                await api.put(`/admin/banners/${modal.banner.id}`, form);
                toast.success('Banner yeniləndi');
            } else {
                await api.post('/admin/banners', form);
                toast.success('Banner əlavə edildi');
            }
            fetchBanners();
        } catch { toast.error('Xəta baş verdi'); }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await api.delete(`/admin/banners/${id}`);
            toast.success('Banner silindi');
            fetchBanners();
        } catch { toast.error('Silinə bilmədi'); }
        finally { setDeleting(null); }
    };

    const toggleActive = async (banner) => {
        try {
            await api.put(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
            toast.success(banner.isActive ? 'Banner gizlədildi' : 'Banner aktivləşdirildi');
            fetchBanners();
        } catch { toast.error('Xəta baş verdi'); }
    };

    const positionLabel = (pos) => POSITIONS.find(p => p.value === pos)?.label || pos;

    return (
        <div className="p-8">
            {modal && (
                <Modal
                    banner={modal.banner}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Reklamlar & Bannerlər</h1>
                    <p className="text-sm text-gray-500 mt-1">Ana səhifədə göstəriləcək bannerlər</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'create' })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Yeni Banner
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Ümumi Banner', value: banners.length, color: 'text-gray-900' },
                    { label: 'Aktiv', value: banners.filter(b => b.isActive).length, color: 'text-green-600' },
                    { label: 'Gizli', value: banners.filter(b => !b.isActive).length, color: 'text-gray-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HiOutlinePhotograph className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-700 mb-1">Hələ banner yoxdur</h3>
                    <p className="text-sm text-gray-400 mb-5">İlk banneri əlavə edin</p>
                    <button
                        onClick={() => setModal({ mode: 'create' })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Əlavə et
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {banners.map(banner => {
                        const grad = banner.bgGradient || 'from-indigo-600 to-purple-600';
                        return (
                            <div key={banner.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!banner.isActive ? 'opacity-60' : 'border-gray-100'}`}>
                                <div className="flex items-stretch">
                                    {/* Color stripe + preview */}
                                    <div className={`w-2 bg-gradient-to-b ${grad} shrink-0`} />
                                    <div className="flex-1 p-5 flex items-center gap-5">
                                        {/* Mini preview */}
                                        <div className={`hidden sm:flex w-48 h-16 bg-gradient-to-r ${grad} rounded-xl items-center justify-center px-4 shrink-0 overflow-hidden`}>
                                            {banner.imageUrl
                                                ? <img src={banner.imageUrl} alt="" className="h-12 w-12 object-cover rounded-lg mr-3 shrink-0" />
                                                : null
                                            }
                                            <p className="text-white text-xs font-bold truncate">{banner.title}</p>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm truncate">{banner.title}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {banner.isActive ? 'Aktiv' : 'Gizli'}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                                                    {positionLabel(banner.position)}
                                                </span>
                                            </div>
                                            {banner.subtitle && (
                                                <p className="text-xs text-gray-400 truncate">{banner.subtitle}</p>
                                            )}
                                            {banner.linkUrl && (
                                                <p className="text-xs text-indigo-400 truncate mt-0.5">{banner.linkUrl}</p>
                                            )}
                                        </div>

                                        {/* Sıra */}
                                        <div className="shrink-0 text-center">
                                            <p className="text-xs text-gray-400">Sıra</p>
                                            <p className="text-lg font-extrabold text-gray-700">{banner.orderIndex}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col justify-center gap-1 px-4 border-l border-gray-100">
                                        <button
                                            onClick={() => setModal({ mode: 'edit', banner })}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Redaktə et"
                                        >
                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleActive(banner)}
                                            className={`p-2 rounded-lg transition-colors ${banner.isActive ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                            title={banner.isActive ? 'Gizlət' : 'Aktivləşdir'}
                                        >
                                            {banner.isActive ? <HiOutlineEye className="w-4 h-4" /> : <HiOutlineEyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner.id)}
                                            disabled={deleting === banner.id}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
