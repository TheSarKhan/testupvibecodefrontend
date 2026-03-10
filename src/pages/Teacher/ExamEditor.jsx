import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCog, HiOutlinePlus, HiOutlineX, HiOutlineVolumeUp, HiOutlineDocumentText } from 'react-icons/hi';
import { ExamSettingsModal, QuestionEditor, PdfCropperModal } from '../../components/ui';
import LatexPreview from '../../components/ui/LatexPreview';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamEditor = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const initialLocationState = location.state || { subject: 'Seçilməyib', type: 'free' };

    const subjectMapping = {
        'Riyaziyyat': 'RIYAZIYYAT', 'Fizika': 'FIZIKA', 'Kimya': 'KIMYA',
        'Biologiya': 'BIOLOGIYA', 'Azərbaycan dili': 'AZERBAYCAN_DILI',
        'İngilis dili': 'INGILIS_DILI', 'Tarix': 'TARIX', 'Coğrafiya': 'COGRAFIYA',
        'Informatika': 'INFORMATIKA', 'Məntiq': 'MANTIQ', 'Ədəbiyyat': 'EDEBIYYAT',
        'Xarici dil': 'XARICI_DILL', 'Rus dili': 'RUS_DILI', 'Alman dili': 'ALMAN_DILI',
        'Fransız dili': 'FRANSIZ_DILI', 'Həyat bilgisi': 'HAYAT_BILGISI',
        'İncəsənət': 'INCASANAT', 'Musiqi': 'MUSIQI', 'Fiziki tərbiyə': 'FIZIKI_TERBIYE',
        'Texnologiya': 'TEXNOLOGIYA'
    };

    const reverseSubjectMapping = {
        'RIYAZIYYAT': 'Riyaziyyat', 'FIZIKA': 'Fizika', 'KIMYA': 'Kimya',
        'BIOLOGIYA': 'Biologiya', 'AZERBAYCAN_DILI': 'Azərbaycan dili',
        'INGILIS_DILI': 'İngilis dili', 'TARIX': 'Tarix', 'COGRAFIYA': 'Coğrafiya',
        'INFORMATIKA': 'Informatika', 'MANTIQ': 'Məntiq', 'EDEBIYYAT': 'Ədəbiyyat',
        'XARICI_DILL': 'Xarici dil', 'RUS_DILI': 'Rus dili', 'ALMAN_DILI': 'Alman dili',
        'FRANSIZ_DILI': 'Fransız dili', 'HAYAT_BILGISI': 'Həyat bilgisi',
        'INCASANAT': 'İncəsənət', 'MUSIQI': 'Musiqi', 'FIZIKI_TERBIYE': 'Fiziki tərbiyə',
        'TEXNOLOGIYA': 'Texnologiya'
    };

    const [type, setType] = useState(initialLocationState.type);
    const [examConfig, setExamConfig] = useState({
        title: '',
        subject: initialLocationState.subject === 'Seçilməyib' ? 'RIYAZIYYAT' : (subjectMapping[initialLocationState.subject] || 'RIYAZIYYAT'),
        duration: 60, visibility: 'PUBLIC', password: '', tags: [], description: ''
    });
    const [questions, setQuestions] = useState([]);   // standalone questions
    const [passages, setPassages] = useState([]);     // passage groups
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBatchPdfOpen, setIsBatchPdfOpen] = useState(false);
    const [batchPdfFile, setBatchPdfFile] = useState(null);
    const [loading, setLoading] = useState(isEditMode);
    const [showPassageTypeModal, setShowPassageTypeModal] = useState(false);

    useEffect(() => {
        if (isEditMode) fetchExamData();
    }, [id]);

    const fetchExamData = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExamConfig({
                title: data.title, subject: data.subject,
                duration: data.durationMinutes, visibility: data.visibility,
                tags: data.tags || [], description: data.description || ''
            });
            setType(data.examType.toLowerCase());

            const mappedQuestions = (data.questions || []).map(q => ({
                id: q.id.toString(),
                orderIndex: q.orderIndex ?? 0,
                type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                    q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                    q.questionType === 'MATCHING' ? 'MATCHING' :
                    q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' : 'OPEN_MANUAL',
                text: q.content, points: q.points, attachedImage: q.attachedImage,
                sampleAnswer: q.correctAnswer,
                options: q.options?.map(opt => ({ id: opt.id, text: opt.content, isCorrect: opt.isCorrect })),
                matchingPairs: q.matchingPairs?.map(pair => ({
                    id: pair.id, left: pair.leftItem, attachedImageLeft: pair.attachedImageLeft,
                    right: pair.rightItem, attachedImageRight: pair.attachedImageRight
                }))
            }));
            setQuestions(mappedQuestions);

            const mappedPassages = (data.passages || []).map(p => ({
                id: p.id.toString(),
                passageType: p.passageType,
                title: p.title || '',
                textContent: p.textContent || '',
                attachedImage: p.attachedImage || null,
                audioContent: p.audioContent || null,
                listenLimit: p.listenLimit ?? null,
                orderIndex: p.orderIndex ?? 0,
                questions: (p.questions || []).map(q => ({
                    id: q.id.toString(),
                    type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                        q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                        q.questionType === 'MATCHING' ? 'MATCHING' :
                        q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' : 'OPEN_MANUAL',
                    text: q.content, points: q.points, attachedImage: q.attachedImage,
                    sampleAnswer: q.correctAnswer,
                    options: q.options?.map(opt => ({ id: opt.id, text: opt.content, isCorrect: opt.isCorrect })),
                    matchingPairs: q.matchingPairs?.map(pair => ({
                        id: pair.id, left: pair.leftItem, right: pair.rightItem
                    }))
                }))
            }));
            setPassages(mappedPassages);
        } catch (error) {
            toast.error("İmtahan məlumatlarını yükləmək mümkün olmadı");
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    // Helper: next orderIndex = max of all existing + 1
    const nextOrderIndex = () => {
        const allIndices = [
            ...questions.map(q => q.orderIndex ?? 0),
            ...passages.map(p => p.orderIndex ?? 0)
        ];
        return allIndices.length > 0 ? Math.max(...allIndices) + 1 : 0;
    };

    // ---------- Standalone question handlers ----------
    const handleAddQuestion = () => {
        const newQuestion = {
            id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', points: 1,
            orderIndex: nextOrderIndex(),
            options: [
                { id: Date.now() + 1, text: '', isCorrect: false },
                { id: Date.now() + 2, text: '', isCorrect: false },
                { id: Date.now() + 3, text: '', isCorrect: false },
                { id: Date.now() + 4, text: '', isCorrect: false }
            ],
            matchingPairs: [], sampleAnswer: ''
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleUpdateQuestion = (qId, updatedData) => {
        setQuestions(questions.map(q => q.id === qId ? updatedData : q));
    };

    const handleDeleteQuestion = (qId) => {
        setQuestions(questions.filter(q => q.id !== qId));
    };

    const handleBatchPdfComplete = (base64Images) => {
        const startIdx = nextOrderIndex();
        const newQuestions = base64Images.map((img, idx) => ({
            id: `batch-${Date.now()}-${idx}`, type: 'MULTIPLE_CHOICE',
            text: 'Şəkilə əsasən cavabı qeyd edin', points: 1, attachedImage: img,
            orderIndex: startIdx + idx,
            options: [
                { id: `opt-a-${Date.now()}-${idx}`, text: 'A', isCorrect: false },
                { id: `opt-b-${Date.now()}-${idx}`, text: 'B', isCorrect: false },
                { id: `opt-c-${Date.now()}-${idx}`, text: 'C', isCorrect: false },
                { id: `opt-d-${Date.now()}-${idx}`, text: 'D', isCorrect: false },
                { id: `opt-e-${Date.now()}-${idx}`, text: 'E', isCorrect: false },
            ]
        }));
        setQuestions([...questions, ...newQuestions]);
        toast.success(`${base64Images.length} yeni sual əlavə edildi`);
    };

    // ---------- Passage handlers ----------
    const handleAddPassage = (passageType) => {
        const newPassage = {
            id: Date.now().toString(), passageType,
            title: '', textContent: '', attachedImage: null, audioContent: null,
            listenLimit: null, orderIndex: nextOrderIndex(),
            questions: []
        };
        setPassages([...passages, newPassage]);
        setShowPassageTypeModal(false);
    };

    const handleUpdatePassage = (pId, updatedData) => {
        setPassages(passages.map(p => p.id === pId ? updatedData : p));
    };

    const handleDeletePassage = (pId) => {
        setPassages(passages.filter(p => p.id !== pId));
    };

    const handleAddPassageQuestion = (pId) => {
        const newQuestion = {
            id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', points: 1,
            options: [
                { id: Date.now() + 1, text: '', isCorrect: false },
                { id: Date.now() + 2, text: '', isCorrect: false },
                { id: Date.now() + 3, text: '', isCorrect: false },
                { id: Date.now() + 4, text: '', isCorrect: false }
            ],
            matchingPairs: [], sampleAnswer: ''
        };
        setPassages(passages.map(p => p.id === pId
            ? { ...p, questions: [...p.questions, newQuestion] }
            : p));
    };

    const handleUpdatePassageQuestion = (pId, qId, updatedData) => {
        setPassages(passages.map(p => p.id === pId
            ? { ...p, questions: p.questions.map(q => q.id === qId ? updatedData : q) }
            : p));
    };

    const handleDeletePassageQuestion = (pId, qId) => {
        setPassages(passages.map(p => p.id === pId
            ? { ...p, questions: p.questions.filter(q => q.id !== qId) }
            : p));
    };

    // ---------- Save ----------
    const isNewId = (id) =>
        (typeof id === 'string' && (id.startsWith('batch') || id.length > 10)) || id > 1000000000000;

    const mapQuestion = (q, idx) => ({
        id: isNewId(q.id) ? null : q.id,
        content: q.text,
        attachedImage: q.attachedImage || null,
        questionType: q.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
            q.type === 'MULTI_SELECT' ? 'MULTI_SELECT' :
            q.type === 'MATCHING' ? 'MATCHING' :
            q.type === 'OPEN_AUTO' ? 'OPEN_AUTO' : 'OPEN_MANUAL',
        points: parseFloat(q.points) || 1,
        orderIndex: q.orderIndex ?? idx,
        correctAnswer: q.sampleAnswer || '',
        options: q.options ? q.options.map((opt, oIdx) => ({
            id: isNewId(opt.id) ? null : opt.id,
            content: opt.text, isCorrect: opt.isCorrect, orderIndex: oIdx
        })) : [],
        matchingPairs: q.matchingPairs ? q.matchingPairs.map((pair, pIdx) => ({
            id: isNewId(pair.id) ? null : pair.id,
            leftItem: pair.left, attachedImageLeft: pair.attachedImageLeft || null,
            rightItem: pair.right, attachedImageRight: pair.attachedImageRight || null,
            orderIndex: pIdx
        })) : []
    });

    const handleSaveExam = async () => {
        if (!examConfig.title) {
            toast.error('Zəhmət olmasa imtahanın adını qeyd edin (Parametrlər bölməsindən)');
            setIsSettingsOpen(true);
            return;
        }
        if (questions.length === 0 && passages.length === 0) {
            toast.error('İmtahana ən azı bir sual əlavə edilməlidir');
            return;
        }

        const payload = {
            title: examConfig.title, description: examConfig.description || '',
            subject: examConfig.subject || 'RIYAZIYYAT',
            visibility: examConfig.visibility || 'PUBLIC',
            examType: type === 'free' ? 'FREE' : 'TEMPLATE',
            status: 'PUBLISHED', durationMinutes: parseInt(examConfig.duration) || 60,
            tags: examConfig.tags || [],
            questions: questions.map((q) => mapQuestion(q, q.orderIndex ?? 0)),
            passages: passages.map((p) => ({
                id: isNewId(p.id) ? null : p.id,
                passageType: p.passageType,
                title: p.title || null,
                textContent: p.textContent || null,
                attachedImage: p.attachedImage || null,
                audioContent: p.audioContent || null,
                listenLimit: p.listenLimit ?? null,
                orderIndex: p.orderIndex ?? 0,
                questions: p.questions.map((q, qIdx) => mapQuestion(q, qIdx))
            }))
        };

        const loadId = toast.loading(isEditMode ? 'Dəyişikliklər yadda saxlanılır...' : 'İmtahan yaradılır...');
        try {
            if (isEditMode) {
                await api.put(`/exams/${id}`, payload);
                toast.success('Dəyişikliklər uğurla yadda saxlanıldı!', { id: loadId });
            } else {
                await api.post('/exams', payload);
                toast.success('İmtahan uğurla yaradıldı!', { id: loadId });
            }
            navigate('/imtahanlar');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Sistem xətası baş verdi';
            toast.error(errorMsg, { id: loadId });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const totalItems = questions.length + passages.length;

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/imtahanlar')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 max-w-xl truncate">
                                {examConfig.title || (isEditMode ? 'İmtahan Redaktə Edilir' : 'Yeni İmtahan Yaradılır')}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">{type}</span>
                                <span>•</span>
                                <span>{reverseSubjectMapping[examConfig.subject] || examConfig.subject}</span>
                                {examConfig.duration && <><span>•</span><span>{examConfig.duration} dəq</span></>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
                            <HiOutlineCog className="w-5 h-5" />
                            <span className="hidden sm:inline">Parametrlər</span>
                        </button>
                        <button onClick={handleSaveExam} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
                            {isEditMode ? 'Yenilə' : 'Yadda Saxla'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="container-main mt-8 max-w-4xl">
                {totalItems === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300">
                            <span className="text-2xl font-bold">?</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Hələ heç bir element əlavə edilməyib</h2>
                        <p className="text-gray-500 mb-6">Sual, mətn parçası və ya dinləmə tapşırığı əlavə edin.</p>
                        <AddButtons
                            onAddQuestion={handleAddQuestion}
                            onAddPassage={() => setShowPassageTypeModal(true)}
                            onBatchPdf={(file) => { setBatchPdfFile(file); setIsBatchPdfOpen(true); }}
                        />
                    </div>
                ) : (
                    <div className="space-y-6 mb-8">
                        {/* Unified sorted list: standalone questions + passages interleaved by orderIndex */}
                        {[
                            ...questions.map(q => ({ kind: 'question', data: q, orderIndex: q.orderIndex ?? 0 })),
                            ...passages.map(p => ({ kind: 'passage', data: p, orderIndex: p.orderIndex ?? 0 }))
                        ]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item, index) => item.kind === 'question' ? (
                            <QuestionEditor
                                key={item.data.id}
                                index={index}
                                question={item.data}
                                onChange={handleUpdateQuestion}
                                onDelete={handleDeleteQuestion}
                            />
                        ) : (
                            <PassageEditor
                                key={item.data.id}
                                passage={item.data}
                                onChange={handleUpdatePassage}
                                onDelete={handleDeletePassage}
                                onAddQuestion={handleAddPassageQuestion}
                                onUpdateQuestion={handleUpdatePassageQuestion}
                                onDeleteQuestion={handleDeletePassageQuestion}
                            />
                        ))}
                    </div>
                )}

                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <button onClick={handleAddQuestion} className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl transition-colors">
                            <HiOutlinePlus className="w-6 h-6" />
                            Yeni Sual Əlavə Et
                        </button>
                        <button onClick={() => setShowPassageTypeModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-teal-700 font-semibold rounded-xl transition-colors">
                            <HiOutlinePlus className="w-6 h-6" />
                            Mətn / Dinləmə Əlavə Et
                        </button>
                        <div className="relative">
                            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => { const file = e.target.files[0]; if (file) { setBatchPdfFile(file); setIsBatchPdfOpen(true); } e.target.value = null; }} />
                            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl transition-colors">
                                <HiOutlinePlus className="w-6 h-6" />
                                PDF-dən Çoxlu Sual
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Passage Type Selection Modal */}
            {showPassageTypeModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Keçid tipini seçin</h3>
                        <p className="text-sm text-gray-500 mb-6">Hansı tip keçid əlavə etmək istəyirsiniz?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleAddPassage('TEXT')} className="flex flex-col items-center gap-3 p-6 border-2 border-teal-200 hover:border-teal-500 hover:bg-teal-50 rounded-xl transition-all">
                                <HiOutlineDocumentText className="w-10 h-10 text-teal-600" />
                                <span className="font-bold text-gray-800">Mətn</span>
                                <span className="text-xs text-gray-500 text-center">Mətn parçası + suallar</span>
                            </button>
                            <button onClick={() => handleAddPassage('LISTENING')} className="flex flex-col items-center gap-3 p-6 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-xl transition-all">
                                <HiOutlineVolumeUp className="w-10 h-10 text-purple-600" />
                                <span className="font-bold text-gray-800">Dinləmə</span>
                                <span className="text-xs text-gray-500 text-center">Audio fayl + suallar</span>
                            </button>
                        </div>
                        <button onClick={() => setShowPassageTypeModal(false)} className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm">Ləğv et</button>
                    </div>
                </div>
            )}

            <PdfCropperModal
                isOpen={isBatchPdfOpen} isBatchMode={true} file={batchPdfFile}
                onClose={() => { setIsBatchPdfOpen(false); setBatchPdfFile(null); }}
                onCropComplete={handleBatchPdfComplete}
            />

            <ExamSettingsModal
                isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
                examConfig={examConfig} onSave={setExamConfig}
            />
        </div>
    );
};

// ---------- PassageEditor component ----------
const PassageEditor = ({ passage, onChange, onDelete, onAddQuestion, onUpdateQuestion, onDeleteQuestion }) => {
    const audioInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onChange(passage.id, { ...passage, audioContent: ev.target.result });
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onChange(passage.id, { ...passage, attachedImage: ev.target.result });
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const isText = passage.passageType === 'TEXT';

    return (
        <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${isText ? 'border-teal-200' : 'border-purple-200'}`}>
            {/* Passage header */}
            <div className={`px-6 py-4 flex items-center justify-between ${isText ? 'bg-teal-50' : 'bg-purple-50'}`}>
                <div className="flex items-center gap-3">
                    {isText
                        ? <HiOutlineDocumentText className="w-6 h-6 text-teal-600" />
                        : <HiOutlineVolumeUp className="w-6 h-6 text-purple-600" />}
                    <span className={`font-bold text-sm uppercase tracking-wide ${isText ? 'text-teal-700' : 'text-purple-700'}`}>
                        {isText ? 'Mətn Parçası' : 'Dinləmə'}
                    </span>
                </div>
                <button onClick={() => onDelete(passage.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-white p-6 space-y-4">
                {/* Title */}
                <input
                    type="text"
                    value={passage.title}
                    onChange={(e) => onChange(passage.id, { ...passage, title: e.target.value })}
                    placeholder={isText ? 'Mətn başlığı (ixtiyari)' : 'Dinləmə başlığı (ixtiyari)'}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />

                {isText ? (
                    <>
                        {/* Text content */}
                        <textarea
                            rows={6}
                            value={passage.textContent}
                            onChange={(e) => onChange(passage.id, { ...passage, textContent: e.target.value })}
                            placeholder="Mətn parçasını bura daxil edin. LaTeX formulları $...$ şəklində istifadə edilə bilər."
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-y font-mono"
                        />
                        {/* Image for text passage */}
                        <div className="flex items-center gap-3">
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <button onClick={() => imageInputRef.current.click()} className="text-sm px-4 py-2 border border-teal-300 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors">
                                {passage.attachedImage ? 'Şəkli Dəyiş' : '+ Şəkil Əlavə Et'}
                            </button>
                            {passage.attachedImage && (
                                <>
                                    <img src={passage.attachedImage} alt="" className="h-16 rounded-lg border object-cover" />
                                    <button onClick={() => onChange(passage.id, { ...passage, attachedImage: null })} className="text-red-400 hover:text-red-600 text-xs">Sil</button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Audio upload */}
                        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                        <div className="flex flex-col gap-3">
                            <button onClick={() => audioInputRef.current.click()} className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-50 transition-colors text-purple-700 font-medium">
                                <HiOutlineVolumeUp className="w-6 h-6" />
                                {passage.audioContent ? 'Audio Faylı Dəyiş' : 'Audio Fayl Yüklə (.mp3, .wav, .ogg)'}
                            </button>
                            {passage.audioContent && (
                                <audio controls src={passage.audioContent} className="w-full rounded-lg" />
                            )}
                        </div>
                        {/* Listen limit */}
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Dinləmə limiti:</label>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={passage.listenLimit === null}
                                        onChange={() => onChange(passage.id, { ...passage, listenLimit: null })}
                                        className="accent-purple-600"
                                    />
                                    <span className="text-sm text-gray-700">Limitsiz</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={passage.listenLimit !== null}
                                        onChange={() => onChange(passage.id, { ...passage, listenLimit: passage.listenLimit ?? 2 })}
                                        className="accent-purple-600"
                                    />
                                    <span className="text-sm text-gray-700">Məhdud:</span>
                                </label>
                                {passage.listenLimit !== null && (
                                    <input
                                        type="number" min={1} max={10}
                                        value={passage.listenLimit ?? 2}
                                        onChange={(e) => onChange(passage.id, { ...passage, listenLimit: parseInt(e.target.value) || 1 })}
                                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-purple-400"
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Questions within this passage */}
            {passage.questions.length > 0 && (
                <div className="bg-gray-50 p-4 space-y-4 border-t border-gray-100">
                    {passage.questions.map((q, idx) => (
                        <div key={q.id} className="pl-4 border-l-4 border-indigo-200">
                            <QuestionEditor
                                index={idx}
                                question={q}
                                onChange={(qId, updated) => onUpdateQuestion(passage.id, qId, updated)}
                                onDelete={(qId) => onDeleteQuestion(passage.id, qId)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Add question to this passage */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <button
                    onClick={() => onAddQuestion(passage.id)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-xl text-sm font-semibold transition-colors ${isText ? 'border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-teal-700' : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700'}`}
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Bu keçidə sual əlavə et
                </button>
            </div>
        </div>
    );
};

const AddButtons = ({ onAddQuestion, onAddPassage, onBatchPdf }) => (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onAddQuestion} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
            <HiOutlinePlus className="w-6 h-6" />
            Tək Sual Əlavə Et
        </button>
        <button onClick={onAddPassage} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
            <HiOutlinePlus className="w-6 h-6" />
            Mətn / Dinləmə Əlavə Et
        </button>
        <div className="relative">
            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => { const file = e.target.files[0]; if (file) onBatchPdf(file); e.target.value = null; }} />
            <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-xl transition-colors shadow-sm">
                <HiOutlinePlus className="w-6 h-6" />
                PDF-dən Çoxlu Sual
            </button>
        </div>
    </div>
);

export default ExamEditor;
