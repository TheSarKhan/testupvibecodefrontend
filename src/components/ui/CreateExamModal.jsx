import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineTemplate, HiOutlineArrowRight, HiOutlineArrowLeft, HiLockClosed, HiOutlineCheck, HiOutlineSearch } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CreateExamModal = ({ isOpen, onClose }) => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [examType, setExamType] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [subjects, setSubjects] = useState([]); // [{id, name, color, iconEmoji, category}]
    const [subjectSearch, setSubjectSearch] = useState('');
    const [subjectCat, setSubjectCat] = useState('Hamısı');

    // Template flow state
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const [subtitles, setSubtitles] = useState([]);
    const [loadingSubtitles, setLoadingSubtitles] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);
    const [selectedSectionIds, setSelectedSectionIds] = useState(new Set()); // for multi-select in step 4

    const [categoryList, setCategoryList] = useState([]); // [{id, name, orderIndex, color}]

    useEffect(() => {
        api.get('/subjects/meta').then(res => setSubjects(res.data)).catch(() => {
            // fallback: plain names
            api.get('/subjects').then(r => setSubjects(r.data.map(name => ({ name, color: null, iconEmoji: null }))));
        });
        // Admin-managed picker categories (already in pill order). Failure is
        // non-fatal — pills fall back to the distinct categories in meta.
        api.get('/subjects/categories')
            .then(res => setCategoryList(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCategoryList([]));
    }, []);

    const reset = () => {
        setStep(1);
        setExamType(null);
        setSelectedSubject('');
        setSubjectSearch('');
        setSubjectCat('Hamısı');
        setSelectedTemplate(null);
        setSelectedSubtitle(null);
        setSubtitles([]);
        setTemplates([]);
        setSelectedSectionIds(new Set());
    };

    const handleTypeSelect = (type) => {
        setExamType(type);
        // GET /templates indi bütün template-ləri (köhnə olimpiada da daxil) tək cavabda
        // qaytarır — paralel fetch artıq lazım deyil.
        if (type === 'template') {
            setLoadingTemplates(true);
            api.get('/templates')
                .then(r => setTemplates(r.data || []))
                .catch(() => setTemplates([]))
                .finally(() => setLoadingTemplates(false));
        }
        setStep(2);
    };

    const handleTemplateSelect = (tmpl) => {
        setSelectedTemplate(tmpl);
        setExamType('template');
        setLoadingSubtitles(true);
        api.get(`/templates/${tmpl.id}/subtitles`)
            .then(res => setSubtitles(res.data))
            .catch(() => {})
            .finally(() => setLoadingSubtitles(false));
        setStep(3);
    };

    const handleSubtitleSelect = (sub) => {
        setSelectedSubtitle(sub);
        setStep(4);
    };

    const toggleSectionId = (id) => {
        setSelectedSectionIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSectionsConfirm = () => {
        const sections = (selectedSubtitle?.sections || []).filter(s => selectedSectionIds.has(s.id));
        if (sections.length === 0) return;
        onClose();
        setTimeout(reset, 300);
        const sectionsData = sections.map(s => ({
            id: s.id,
            templateTitle: selectedTemplate.title,
            templateSubtitle: selectedSubtitle.subtitle,
            subjectName: s.subjectName,
            questionCount: s.questionCount,
            formula: s.formula,
            typeCounts: s.typeCounts || [],
            pointGroups: s.pointGroups || null,
        }));
        navigate('/imtahanlar/yarat', {
            state: {
                type: 'template',
                subject: sections[0].subjectName,
                templateId: selectedTemplate.id,
                sectionsData,
                // backward compat for single-section
                sectionId: sections.length === 1 ? sections[0].id : null,
                sectionData: sections.length === 1 ? sectionsData[0] : null,
            },
        });
    };

    const handleContinueFree = () => {
        if (!selectedSubject) return;
        onClose();
        setTimeout(reset, 300);
        navigate('/imtahanlar/yarat', { state: { subject: selectedSubject, type: examType } });
    };

    // ── Step 1: choose exam type ───────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="space-y-4">
            <p className="text-gray-600 mb-6">Yaratmaq istədiyiniz imtahan növünü seçin:</p>
            <button onClick={() => handleTypeSelect('free')}
                className="w-full text-left p-5 rounded-xl border-2 border-blue-100 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all flex items-start gap-4 group">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <HiOutlineDocumentText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Sərbəst İmtahan</h4>
                    <p className="text-gray-500 text-sm mt-1">Öz suallarınızı sıfırdan yaradaraq test tərtib edin.</p>
                </div>
            </button>
            <button onClick={() => hasPermission('useTemplateExams') ? handleTypeSelect('template') : null}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 group relative ${
                    hasPermission('useTemplateExams')
                        ? 'border-emerald-100 hover:border-emerald-500 bg-white hover:bg-emerald-50/50'
                        : 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'
                }`}>
                {!hasPermission('useTemplateExams') && (
                    <div className="absolute top-3 right-3 text-gray-400">
                        <HiLockClosed className="w-5 h-5" />
                    </div>
                )}
                <div className={`p-3 rounded-lg transition-colors ${
                    hasPermission('useTemplateExams')
                        ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                        : 'bg-gray-200 text-gray-500'
                }`}>
                    <HiOutlineTemplate className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Şablon Əsasında</h4>
                    <p className="text-gray-500 text-sm mt-1">Əvvəlcədən təyin edilmiş struktura uyğun imtahan yaradın.</p>
                    {!hasPermission('useTemplateExams') && (
                        <p className="text-xs text-red-500 mt-2 font-medium">Bu funksiya üçün Pro plana keçin.</p>
                    )}
                </div>
            </button>
        </div>
    );

    // ── Step 2 (free): subject select ─────────────────────────────────────────
    const renderStep2Free = () => {
        const q = subjectSearch.trim().toLowerCase();
        // Filter pills: admin-managed categories in their defined order,
        // narrowed to ones actually used by a subject (an empty pill helps
        // no one). Falls back to distinct meta values if the endpoint failed.
        const usedCats = new Set(
            subjects.map(s => (typeof s === 'string' ? null : s.category)).filter(Boolean)
        );
        const orderedNames = categoryList.length > 0
            ? categoryList.map(c => c.name).filter(n => usedCats.has(n))
            : [...usedCats];
        const categories = ['Hamısı', ...orderedNames];
        const filtered = subjects.filter(s => {
            const name = typeof s === 'string' ? s : s.name;
            const cat = typeof s === 'string' ? null : s.category;
            const matchesCat = subjectCat === 'Hamısı' || cat === subjectCat;
            return matchesCat && name.toLowerCase().includes(q);
        });
        return (
            <div className="space-y-4">
                <div>
                    <button onClick={() => setStep(1)} className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1">
                        <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
                    </button>
                    <p className="text-gray-600 text-sm">İmtahan üçün fənn seçin:</p>
                </div>

                {/* Live search */}
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        placeholder="Fənn axtar..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                </div>

                {/* Category filter pills (only when subjects actually carry categories) */}
                {categories.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSubjectCat(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                    subjectCat === cat
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Compact chip grid */}
                <div
                    className="max-h-72 overflow-y-auto p-0.5"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}
                >
                    {filtered.map(s => {
                        const name = typeof s === 'string' ? s : s.name;
                        const color = typeof s === 'string' ? null : s.color;
                        const iconEmoji = typeof s === 'string' ? null : s.iconEmoji;
                        const isSelected = selectedSubject === name;
                        return (
                            <button
                                key={name}
                                onClick={() => setSelectedSubject(prev => prev === name ? '' : name)}
                                title={name}
                                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-[1.5px] text-sm font-medium text-left transition-all ${
                                    isSelected ? 'shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                                // Solid fill + white text when selected — the old
                                // pale tint (~7% alpha) was barely visible.
                                style={isSelected ? {
                                    borderColor: color || '#2563eb',
                                    backgroundColor: color || '#2563eb',
                                } : {}}
                            >
                                {/* Emoji if present, otherwise a color dot */}
                                {iconEmoji ? (
                                    <span className="text-[18px] leading-none shrink-0">{iconEmoji}</span>
                                ) : (
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: isSelected ? '#ffffff' : (color || '#cbd5e1') }}
                                    />
                                )}
                                <span
                                    className="flex-1 min-w-0 truncate font-semibold"
                                    style={{ color: isSelected ? '#ffffff' : '#374151' }}
                                >
                                    {name}
                                </span>
                                {isSelected && (
                                    <HiOutlineCheck className="w-4 h-4 shrink-0 text-white" />
                                )}
                            </button>
                        );
                    })}
                    {filtered.length === 0 && (
                        <p className="col-span-full text-sm text-gray-400 text-center py-6">Uyğun fənn tapılmadı</p>
                    )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 truncate">
                        {selectedSubject ? <>Seçildi: <span className="font-semibold text-gray-700">{selectedSubject}</span></> : 'Fənn seçilməyib'}
                    </span>
                    <button onClick={handleContinueFree} disabled={!selectedSubject}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shrink-0">
                        Davam et <HiOutlineArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    // ── Step 2 (template): template select ────────────────────────────────────
    const renderStep2Template = () => (
        <div className="space-y-4">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1">
                <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
            </button>
            <p className="text-gray-600 font-medium">Şablon seçin:</p>
            {loadingTemplates ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <HiOutlineTemplate className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Hələ şablon yoxdur</p>
                    <p className="text-xs mt-1">Admin paneldən şablon yaradın</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {templates.map(tmpl => (
                        <button key={`${tmpl.templateType || 'STD'}-${tmpl.id}`} onClick={() => handleTemplateSelect(tmpl)}
                            className="w-full text-left p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
                            <div className="font-bold text-gray-900">{tmpl.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {tmpl.subtitleCount === 0 ? 'Altbaşlıq yoxdur' : `${tmpl.subtitleCount} altbaşlıq`}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // ── Step 3 (template): subtitle select ────────────────────────────────────
    const renderStep3Template = () => (
        <div className="space-y-4">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1">
                <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
            </button>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{selectedTemplate?.title}</p>
                <p className="text-gray-700 font-medium mt-1">Altbaşlıq seçin:</p>
            </div>
            {loadingSubtitles ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                </div>
            ) : subtitles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Bu şablonda altbaşlıq yoxdur</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {subtitles.map(sub => (
                        <button key={sub.id} onClick={() => handleSubtitleSelect(sub)}
                            className="w-full text-left p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
                            <div className="font-bold text-gray-900">{sub.subtitle}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {(sub.sections || []).length === 0 ? 'Fənn yoxdur' : `${sub.sections.length} fənn`}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // ── Step 4 (template): section multi-select ───────────────────────────────
    const renderStep4Template = () => {
        const subjectMeta = {};
        subjects.forEach(s => { if (typeof s === 'object') subjectMeta[s.name] = s; });
        const allSections = selectedSubtitle?.sections || [];

        return (
            <div className="space-y-4">
                <button onClick={() => { setStep(3); setSelectedSectionIds(new Set()); }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
                </button>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                        {selectedTemplate?.title} · {selectedSubtitle?.subtitle}
                    </p>
                    <p className="text-gray-700 font-medium mt-1">Fənn bölmələrini seçin:</p>
                    <p className="text-xs text-gray-400 mt-0.5">Bir və ya bir neçə fənn seçib davam edin</p>
                </div>
                {allSections.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Bu altbaşlıqda fənn yoxdur</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {allSections.map(section => {
                                const meta = subjectMeta[section.subjectName];
                                const isSelected = selectedSectionIds.has(section.id);
                                const accent = meta?.color || '#3b82f6';
                                return (
                                    <button key={section.id} onClick={() => toggleSectionId(section.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? 'shadow-sm'
                                                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        style={isSelected ? {
                                            borderColor: accent,
                                            backgroundColor: `${accent}12`,
                                        } : {}}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                                                    style={isSelected
                                                        ? { borderColor: accent, backgroundColor: accent }
                                                        : { borderColor: '#d1d5db', backgroundColor: '#ffffff' }}
                                                >
                                                    {isSelected && <HiOutlineCheck className="w-3 h-3 text-white" />}
                                                </span>
                                                {/* Same visual language as the free-exam subject picker:
                                                    emoji if the subject has one, otherwise its color dot */}
                                                {meta?.iconEmoji ? (
                                                    <span className="text-[18px] leading-none shrink-0">{meta.iconEmoji}</span>
                                                ) : (
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta?.color || '#cbd5e1' }} />
                                                )}
                                                <span className="font-bold text-gray-900">{section.subjectName}</span>
                                            </div>
                                            <span
                                                className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: meta?.color ? `${meta.color}18` : '#f3f4f6', color: '#111827' }}
                                            >
                                                {section.questionCount} sual
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                {selectedSectionIds.size > 0 ? `${selectedSectionIds.size} fənn seçildi` : 'Heç bir fənn seçilməyib'}
                            </span>
                            <button onClick={handleSectionsConfirm} disabled={selectedSectionIds.size === 0}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
                                Davam et <HiOutlineArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const getTitle = () => {
        if (step === 1) return 'Yeni İmtahan Növü';
        if (examType === 'free') return 'Fənn Seçimi';
        if (step === 2) return 'Şablon Seçimi';
        if (step === 3) return 'Altbaşlıq Seçimi';
        return 'Fənn Bölməsi';
    };

    const renderStep = () => {
        if (step === 1) return renderStep1();
        if (examType === 'free') return renderStep2Free();
        if (step === 2) return renderStep2Template();
        if (step === 3) return renderStep3Template();
        return renderStep4Template();
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { onClose(); setTimeout(reset, 300); }} title={getTitle()} maxWidth="max-w-lg">
            {renderStep()}
        </Modal>
    );
};

export default CreateExamModal;
