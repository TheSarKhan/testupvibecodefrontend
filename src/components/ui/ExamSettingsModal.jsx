import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineEye, HiOutlineBookOpen, HiLockClosed, HiOutlineX } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ExamSettingsModal = ({ isOpen, onClose, examConfig, onSave, onPublish }) => {
    const { hasPermission } = useAuth();
    const [formData, setFormData] = useState(examConfig);
    const [tagInput, setTagInput] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const tagInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Fetch subjects and tags once on mount
    useEffect(() => {
        api.get('/subjects').then(res => setSubjects(res.data)).catch(() => {});
        api.get('/tags').then(res => setAllTags(res.data)).catch(() => {});
    }, []);

    // Sync formData only when examConfig actually changes (after external save), not on every open
    useEffect(() => {
        setFormData(examConfig);
    }, [examConfig]);

    // Reset only input helpers when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setTagInput('');
            setShowSuggestions(false);
        }
    }, [isOpen]);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!tagInputRef.current?.contains(e.target) && !suggestionsRef.current?.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredSuggestions = tagInput.trim()
        ? allTags.filter(t =>
            t.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
            !formData.tags.includes(t)
          )
        : allTags.filter(t => !formData.tags.includes(t));

    const addTag = (tag) => {
        const clean = tag.trim().replace(/^#/, '');
        if (clean && !formData.tags.includes(clean) && formData.tags.length < 5) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, clean] }));
        }
        setTagInput('');
        setShowSuggestions(false);
        tagInputRef.current?.focus();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        if (onPublish) onPublish(formData);
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
                        placeholder="İmtahan haqqında qısa məlumat..."
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
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Etiketlər</label>
                        <span className="text-xs text-gray-400">{formData.tags.length}/5</span>
                    </div>

                    {/* Selected tags */}
                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {formData.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                                        <HiOutlineX className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Autocomplete input */}
                    {formData.tags.length < 5 && (
                        <div className="relative">
                            <input
                                ref={tagInputRef}
                                type="text"
                                value={tagInput}
                                onChange={e => { setTagInput(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') { setShowSuggestions(false); }
                                }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm outline-none"
                                placeholder="Teq axtar və seç..."
                                autoComplete="off"
                            />

                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-44 overflow-y-auto"
                                >
                                    {filteredSuggestions.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showSuggestions && tagInput.trim() && filteredSuggestions.length === 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg px-3 py-2 text-xs text-gray-400">
                                    Uyğun teq tapılmadı
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none">
                        Ləğv et
                    </button>
                    <button type="submit" className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-xl focus:outline-none shadow-sm ${onPublish ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                        {onPublish ? 'Yayımla' : 'Yadda Saxla'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExamSettingsModal;
