import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineTemplate, HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineBookOpen, HiOutlineVolumeUp } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';

const QUESTION_TYPE_LABELS = {
    MCQ: 'Birseçimli / T-F',
    MULTI_SELECT: 'Çoxseçimli',
    OPEN_AUTO: 'Açıq (avtomatik)',
    FILL_IN_THE_BLANK: 'Boşluq doldurma',
    MATCHING: 'Uyğunlaşdırma',
    OPEN_MANUAL: 'Açıq (müəllim)',
};

const PASSAGE_LABELS = { LISTENING: 'Dinləmə', TEXT: 'Mətn' };

const CreateExamModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [examType, setExamType] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [subjects, setSubjects] = useState([]);

    // Template flow state
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const [subtitles, setSubtitles] = useState([]);
    const [loadingSubtitles, setLoadingSubtitles] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);

    useEffect(() => {
        api.get('/subjects').then(res => setSubjects(res.data)).catch(() => {});
    }, []);

    const reset = () => {
        setStep(1);
        setExamType(null);
        setSelectedSubject('');
        setSelectedTemplate(null);
        setSelectedSubtitle(null);
        setSubtitles([]);
        setTemplates([]);
    };

    const handleTypeSelect = (type) => {
        setExamType(type);
        if (type === 'template') {
            setLoadingTemplates(true);
            api.get('/templates')
                .then(res => setTemplates(res.data))
                .catch(() => {})
                .finally(() => setLoadingTemplates(false));
        }
        setStep(2);
    };

    const handleTemplateSelect = (tmpl) => {
        setSelectedTemplate(tmpl);
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

    const handleSectionSelect = (section) => {
        onClose();
        setTimeout(reset, 300);
        navigate('/imtahanlar/yarat', {
            state: {
                type: 'template',
                subject: section.subjectName,
                templateId: selectedTemplate.id,
                sectionId: section.id,
                sectionData: {
                    id: section.id,
                    templateTitle: selectedTemplate.title,
                    templateSubtitle: selectedSubtitle.subtitle,
                    subjectName: section.subjectName,
                    questionCount: section.questionCount,
                    formula: section.formula,
                    typeCounts: section.typeCounts || [],
                },
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
                className="w-full text-left p-5 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 transition-all flex items-start gap-4 group">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <HiOutlineDocumentText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Sərbəst İmtahan</h4>
                    <p className="text-gray-500 text-sm mt-1">Öz suallarınızı sıfırdan yaradaraq test tərtib edin.</p>
                </div>
            </button>
            <button onClick={() => handleTypeSelect('template')}
                className="w-full text-left p-5 rounded-xl border-2 border-purple-100 hover:border-purple-500 bg-white hover:bg-purple-50/50 transition-all flex items-start gap-4 group">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <HiOutlineTemplate className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Şablon Əsasında</h4>
                    <p className="text-gray-500 text-sm mt-1">Əvvəlcədən təyin edilmiş struktura uyğun imtahan yaradın.</p>
                </div>
            </button>
        </div>
    );

    // ── Step 2 (free): subject select ─────────────────────────────────────────
    const renderStep2Free = () => (
        <div className="space-y-6">
            <div>
                <button onClick={() => setStep(1)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
                </button>
                <p className="text-gray-600">Sərbəst imtahan üçün fənn seçin:</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                {subjects.map(name => (
                    <button key={name} onClick={() => setSelectedSubject(name)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${
                            selectedSubject === name
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
                        }`}>
                        {name}
                    </button>
                ))}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={handleContinueFree} disabled={!selectedSubject}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
                    Davam et <HiOutlineArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    // ── Step 2 (template): template select ────────────────────────────────────
    const renderStep2Template = () => (
        <div className="space-y-4">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-purple-600 hover:text-purple-800 inline-flex items-center gap-1">
                <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
            </button>
            <p className="text-gray-600 font-medium">Şablon seçin:</p>
            {loadingTemplates ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
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
                        <button key={tmpl.id} onClick={() => handleTemplateSelect(tmpl)}
                            className="w-full text-left p-4 rounded-xl border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all">
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
            <button onClick={() => setStep(2)} className="text-sm font-medium text-purple-600 hover:text-purple-800 inline-flex items-center gap-1">
                <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
            </button>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{selectedTemplate?.title}</p>
                <p className="text-gray-700 font-medium mt-1">Altbaşlıq seçin:</p>
            </div>
            {loadingSubtitles ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                </div>
            ) : subtitles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Bu şablonda altbaşlıq yoxdur</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {subtitles.map(sub => (
                        <button key={sub.id} onClick={() => handleSubtitleSelect(sub)}
                            className="w-full text-left p-4 rounded-xl border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all">
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

    // ── Step 4 (template): section select ─────────────────────────────────────
    const renderStep4Template = () => (
        <div className="space-y-4">
            <button onClick={() => setStep(3)} className="text-sm font-medium text-purple-600 hover:text-purple-800 inline-flex items-center gap-1">
                <HiOutlineArrowLeft className="w-4 h-4" /> Geriyə qayıt
            </button>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    {selectedTemplate?.title} · {selectedSubtitle?.subtitle}
                </p>
                <p className="text-gray-700 font-medium mt-1">Fənn bölməsi seçin:</p>
            </div>
            {(selectedSubtitle?.sections || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Bu altbaşlıqda fənn yoxdur</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {(selectedSubtitle?.sections || []).map(section => (
                        <button key={section.id} onClick={() => handleSectionSelect(section)}
                            className="w-full text-left p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HiOutlineBookOpen className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-gray-900">{section.subjectName}</span>
                                </div>
                                <span className="text-sm font-semibold text-indigo-600">{section.questionCount} sual</span>
                            </div>
                            {(section.typeCounts || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {section.typeCounts.map((tc, j) => (
                                        <span key={j} className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                            tc.passageType === 'LISTENING' ? 'bg-purple-100 text-purple-700' :
                                            tc.passageType === 'TEXT'      ? 'bg-teal-100 text-teal-700' :
                                            'bg-gray-100 text-gray-600'}`}>
                                            {tc.passageType && <HiOutlineVolumeUp className="w-3 h-3" />}
                                            {tc.passageType ? `${PASSAGE_LABELS[tc.passageType]} ` : ''}{QUESTION_TYPE_LABELS[tc.questionType] || tc.questionType}: {tc.count}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <code className="mt-2 block text-xs font-mono text-indigo-500">{section.formula}</code>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

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
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-lg">
            {renderStep()}
        </Modal>
    );
};

export default CreateExamModal;
