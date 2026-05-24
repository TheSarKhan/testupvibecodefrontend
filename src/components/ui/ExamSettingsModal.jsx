import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineEye, HiOutlineBookOpen, HiLockClosed, HiOutlineX, HiOutlineVideoCamera } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
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

    // Fetch subjects and tags once on mount.
    // Subjects come from TWO sources:
    //   1) /subjects        — admin-seeded system subjects (Riyaziyyat, Fizika, …)
    //   2) /bank/subjects   — the teacher's own question-bank subjects (e.g. "Alman dili"
    //                          if they created it themselves and it's not in the system list)
    // We merge + dedupe so any subject the user has access to is selectable, regardless
    // of whether it originated as a system seed or as a personal bank subject.
    useEffect(() => {
        Promise.all([
            api.get('/subjects').then(r => r.data || []).catch(() => []),
            api.get('/bank/subjects').then(r => (r.data || []).map(s => s.name)).catch(() => []),
        ]).then(([systemNames, bankNames]) => {
            const merged = Array.from(new Set([...systemNames, ...bankNames]))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b, 'az'));
            setSubjects(merged);
        });
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

    const isValidVideoUrl = (url) => {
        if (!url || !url.trim()) return true;
        try {
            const u = new URL(url.trim());
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValidVideoUrl(formData.explanationVideoUrl)) {
            // Previously this returned silently — teacher clicked Yayımla
            // and nothing happened, with no hint that the video URL was
            // the problem.
            toast.error('İzah video linki düzgün deyil — http:// və ya https:// ilə başlamalıdır');
            return;
        }
        // HTML min/max on the input doesn't always block form submit in every browser
        // (Firefox in particular). Validate explicitly so negative or absurdly large
        // durations don't slip through to the backend.
        if (hasPermission('selectExamDuration') && formData.duration !== '' && formData.duration != null) {
            const d = Number(formData.duration);
            if (!Number.isFinite(d) || d < 1 || d > 360) {
                toast.error('İmtahan müddəti 1 ilə 360 dəqiqə arasında olmalıdır');
                return;
            }
        }
        const cleaned = {
            ...formData,
            explanationVideoUrl: (formData.explanationVideoUrl || '').trim() || null,
        };
        onSave(cleaned);
        onClose();
        if (onPublish) onPublish(cleaned);
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
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="İmtahan haqqında qısa məlumat..."
                    />
                </div>

                {/* Explanation video URL (optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        İzah videosunun linki <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineVideoCamera className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="url"
                            name="explanationVideoUrl"
                            value={formData.explanationVideoUrl || ''}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                        Tələbələr imtahanı bitirdikdən sonra bu izaha keçid edə biləcəklər.
                    </p>
                    {formData.explanationVideoUrl && !isValidVideoUrl(formData.explanationVideoUrl) && (
                        <p className="mt-1 text-xs text-red-500">Düzgün URL daxil edin (http:// və ya https://).</p>
                    )}
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
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                            >
                                {(() => {
                                    const current = formData.subject || formData.subjects?.[0] || '';
                                    // Guarantee the current value is selectable even if the
                                    // /subjects + /bank/subjects merge doesn't include it
                                    // (e.g. legacy exams or freshly-created bank subject).
                                    const list = current && !subjects.includes(current)
                                        ? [current, ...subjects]
                                        : subjects;
                                    if (list.length === 0) {
                                        return <option value={current}>{current || '—'}</option>;
                                    }
                                    return list.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ));
                                })()}
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
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 cursor-not-allowed"
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
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                            >
                                <option value="PUBLIC">Açıq (Hər kəs)</option>
                                <option value="PRIVATE">Gizli (Kodla giriş)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {formData.visibility === 'PRIVATE' && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
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
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-600 focus:outline-none">
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
                                    if (e.key === 'Enter' || e.key === ',') {
                                        // Prevent the surrounding <form>'s onSubmit (which
                                        // would publish the exam) and instead commit the
                                        // currently-typed text as a new tag.
                                        e.preventDefault();
                                        if (tagInput.trim()) addTag(tagInput);
                                    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
                                        // Quick-remove the last tag when the input is empty.
                                        e.preventDefault();
                                        setFormData(prev => ({ ...prev, tags: prev.tags.slice(0, -1) }));
                                    } else if (e.key === 'Escape') {
                                        setShowSuggestions(false);
                                    }
                                }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm outline-none"
                                placeholder="Yeni teq yaz və ya siyahıdan seç (Enter ilə əlavə et)"
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
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
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
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 focus:outline-none">
                        Ləğv et
                    </button>
                    <button type="submit" className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-xl focus:outline-none shadow-sm ${onPublish ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                        {onPublish ? 'Yayımla' : 'Yadda Saxla'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExamSettingsModal;
