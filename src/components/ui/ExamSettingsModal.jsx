import { useState, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineEye, HiOutlineBookOpen, HiLockClosed } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ExamSettingsModal = ({ isOpen, onClose, examConfig, onSave }) => {
    const { hasPermission } = useAuth();
    const [formData, setFormData] = useState(examConfig);
    const [tagInput, setTagInput] = useState('');
    const [subjects, setSubjects] = useState([]);

    // Fetch subjects once on mount
    useEffect(() => {
        api.get('/subjects').then(res => setSubjects(res.data)).catch(() => {});
    }, []);

    // Sync when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(examConfig);
            setTagInput('');
        }
    }, [isOpen, examConfig]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 5) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="İmtahan Parametrləri" maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        İmtahanın Adı *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineDocumentText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Məsələn: Azərbaycan Tarixi - Yekun İmtahan"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Təsvir (Məqsəd, mövzu və s.)
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows="2"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="İmtaham haqqında qısa məlumat..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fənn *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HiOutlineBookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                name="subject"
                                required
                                value={formData.subject || (formData.subjects?.[0] || '')}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value, subjects: [e.target.value] }))}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                            >
                                {subjects.length === 0 ? (
                                    <option value={formData.subject || formData.subjects?.[0]}>{formData.subject || formData.subjects?.[0]}</option>
                                ) : (
                                    subjects.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            Müddət (Dəqiqə)
                            {!hasPermission('selectExamDuration') && <HiLockClosed className="text-red-400 w-4 h-4" title="Plana daxil deyil"/>}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HiOutlineClock className={`h-5 w-5 ${hasPermission('selectExamDuration') ? 'text-gray-400' : 'text-gray-300'}`} />
                            </div>
                            <input
                                type="number"
                                name="duration"
                                min="1"
                                max="360"
                                value={formData.duration}
                                onChange={handleChange}
                                disabled={!hasPermission('selectExamDuration')}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 cursor-not-allowed"
                                placeholder={hasPermission('selectExamDuration') ? "90" : "Limitli (0)"}
                            />
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Görünürlük *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HiOutlineEye className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                name="visibility"
                                required
                                value={formData.visibility}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                            >
                                <option value="PUBLIC">Açıq (Hər kəs)</option>
                                <option value="PRIVATE">Gizli (Kodla giriş)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {formData.visibility === 'PRIVATE' && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
                        Giriş kodu imtahan yaradıldıqdan sonra imtahan səhifəsindən yaradıla bilər.
                    </div>
                )}

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etiketlər (Taglər)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">İmtahanı asan tapmaq üçün taglər əlavə edin (Vergül və ya Enter ilə fərqləndirin, maks 5 ədəd).</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none">
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        disabled={formData.tags.length >= 5}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder={formData.tags.length >= 5 ? "Maksimum 5 tag əlavə edildi" : "Tag yazın..."}
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none">
                        Ləğv et
                    </button>
                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 focus:outline-none shadow-sm shadow-indigo-200">
                        Yadda Saxla
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExamSettingsModal;
