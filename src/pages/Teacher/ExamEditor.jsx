import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCog, HiOutlinePlus } from 'react-icons/hi';
import { ExamSettingsModal, QuestionEditor, PdfCropperModal } from '../../components/ui';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamEditor = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const initialLocationState = location.state || { subject: 'Seçilməyib', type: 'free' };

    const subjectMapping = {
        'Riyaziyyat': 'RIYAZIYYAT',
        'Fizika': 'FIZIKA',
        'Kimya': 'KIMYA',
        'Biologiya': 'BIOLOGIYA',
        'Azərbaycan dili': 'AZERBAYCAN_DILI',
        'İngilis dili': 'INGILIS_DILI',
        'Tarix': 'TARIX',
        'Coğrafiya': 'COGRAFIYA',
        'Informatika': 'INFORMATIKA',
        'Məntiq': 'MANTIQ',
        'Ədəbiyyat': 'EDEBIYYAT',
        'Xarici dil': 'XARICI_DILL',
        'Rus dili': 'RUS_DILI',
        'Alman dili': 'ALMAN_DILI',
        'Fransız dili': 'FRANSIZ_DILI',
        'Həyat bilgisi': 'HAYAT_BILGISI',
        'İncəsənət': 'INCASANAT',
        'Musiqi': 'MUSIQI',
        'Fiziki tərbiyə': 'FIZIKI_TERBIYE',
        'Texnologiya': 'TEXNOLOGIYA'
    };

    const reverseSubjectMapping = {
        'RIYAZIYYAT': 'Riyaziyyat',
        'FIZIKA': 'Fizika',
        'KIMYA': 'Kimya',
        'BIOLOGIYA': 'Biologiya',
        'AZERBAYCAN_DILI': 'Azərbaycan dili',
        'INGILIS_DILI': 'İngilis dili',
        'TARIX': 'Tarix',
        'COGRAFIYA': 'Coğrafiya',
        'INFORMATIKA': 'Informatika',
        'MANTIQ': 'Məntiq',
        'EDEBIYYAT': 'Ədəbiyyat',
        'XARICI_DILL': 'Xarici dil',
        'RUS_DILI': 'Rus dili',
        'ALMAN_DILI': 'Alman dili',
        'FRANSIZ_DILI': 'Fransız dili',
        'HAYAT_BILGISI': 'Həyat bilgisi',
        'INCASANAT': 'İncəsənət',
        'MUSIQI': 'Musiqi',
        'FIZIKI_TERBIYE': 'Fiziki tərbiyə',
        'TEXNOLOGIYA': 'Texnologiya'
    };

    const [type, setType] = useState(initialLocationState.type);

    // Global State for the Exam
    const [examConfig, setExamConfig] = useState({
        title: '',
        subject: initialLocationState.subject === 'Seçilməyib' ? 'RIYAZIYYAT' : (subjectMapping[initialLocationState.subject] || 'RIYAZIYYAT'),
        duration: 60,
        visibility: 'PUBLIC',
        password: '',
        tags: [],
        description: ''
    });
    const [questions, setQuestions] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBatchPdfOpen, setIsBatchPdfOpen] = useState(false);
    const [batchPdfFile, setBatchPdfFile] = useState(null);
    const [loading, setLoading] = useState(isEditMode);



    useEffect(() => {
        if (isEditMode) {
            fetchExamData();
        }
    }, [id]);

    const fetchExamData = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExamConfig({
                title: data.title,
                subject: data.subject,
                duration: data.durationMinutes,
                visibility: data.visibility,
                tags: data.tags || [],
                description: data.description || ''
            });
            setType(data.examType.toLowerCase());

            // Map questions from backend format to frontend editor format
            const mappedQuestions = data.questions.map(q => ({
                id: q.id.toString(),
                type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                    q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                    q.questionType === 'MATCHING' ? 'MATCHING' : 'OPEN_ENDED',
                text: q.content,
                points: q.points,
                attachedImage: q.attachedImage,
                sampleAnswer: q.correctAnswer,
                options: q.options?.map(opt => ({
                    id: opt.id,
                    text: opt.content,
                    isCorrect: opt.isCorrect
                })),
                matchingPairs: q.matchingPairs?.map(pair => ({
                    id: pair.id,
                    left: pair.leftItem,
                    attachedImageLeft: pair.attachedImageLeft,
                    right: pair.rightItem,
                    attachedImageRight: pair.attachedImageRight
                }))
            }));
            setQuestions(mappedQuestions);
        } catch (error) {
            console.error("Error fetching exam:", error);
            toast.error("İmtahan məlumatlarını yükləmək mümkün olmadı");
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = (newConfig) => {
        setExamConfig(newConfig);
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            id: Date.now().toString(),
            type: 'MULTIPLE_CHOICE',
            text: '',
            points: 1,
            options: [
                { id: Date.now() + 1, text: '', isCorrect: false },
                { id: Date.now() + 2, text: '', isCorrect: false },
                { id: Date.now() + 3, text: '', isCorrect: false },
                { id: Date.now() + 4, text: '', isCorrect: false }
            ],
            matchingPairs: [],
            sampleAnswer: ''
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleUpdateQuestion = (id, updatedData) => {
        setQuestions(questions.map(q => q.id === id ? updatedData : q));
    };

    const handleDeleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleBatchPdfComplete = (base64Images) => {
        const newQuestions = base64Images.map((img, idx) => ({
            id: `batch-${Date.now()}-${idx}`,
            type: 'MULTIPLE_CHOICE',
            text: 'Şəkilə əsasən cavabı qeyd edin',
            points: 1,
            attachedImage: img,
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

    const handleSaveExam = async () => {
        if (!examConfig.title) {
            toast.error('Zəhmət olmasa imtahanın adını qeyd edin (Parametrlər bölməsindən)');
            setIsSettingsOpen(true);
            return;
        }

        if (questions.length === 0) {
            toast.error('İmtahana ən azı bir sual əlavə edilməlidir');
            return;
        }

        const payload = {
            title: examConfig.title,
            description: examConfig.description || '',
            subject: examConfig.subject || 'RIYAZIYYAT',
            visibility: examConfig.visibility || 'PUBLIC',
            examType: type === 'free' ? 'FREE' : 'TEMPLATE',
            status: 'PUBLISHED',
            durationMinutes: parseInt(examConfig.duration) || 60,
            tags: examConfig.tags || [],
            questions: questions.map((q, idx) => ({
                id: (typeof q.id === 'string' && (q.id.startsWith('batch') || q.id.length > 10)) || q.id > 1000000000000 ? null : q.id,
                content: q.text,
                attachedImage: q.attachedImage || null,
                questionType: q.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
                    q.type === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                    q.type === 'MATCHING' ? 'MATCHING' :
                        (q.sampleAnswer ? 'OPEN_AUTO' : 'OPEN_MANUAL'),
                points: parseFloat(q.points) || 1,
                orderIndex: idx,
                correctAnswer: q.sampleAnswer || '',
                options: q.options ? q.options.map((opt, oIdx) => ({
                    id: (typeof opt.id === 'string' && opt.id.length > 10) || opt.id > 1000000000000 ? null : opt.id,
                    content: opt.text,
                    isCorrect: opt.isCorrect,
                    orderIndex: oIdx
                })) : [],
                matchingPairs: q.matchingPairs ? q.matchingPairs.map((pair, pIdx) => ({
                    id: (typeof pair.id === 'string' && pair.id.length > 10) || pair.id > 1000000000000 ? null : pair.id,
                    leftItem: pair.left,
                    attachedImageLeft: pair.attachedImageLeft || null,
                    rightItem: pair.right,
                    attachedImageRight: pair.attachedImageRight || null,
                    orderIndex: pIdx
                })) : []
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
            console.error("Save error:", error);
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

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/imtahanlar')}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 max-w-xl truncate">
                                {examConfig.title || (isEditMode ? 'İmtahan Redaktə Edilir' : 'Yeni İmtahan Yaradılır')}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                                    {type}
                                </span>
                                <span>•</span>
                                <span>{reverseSubjectMapping[examConfig.subject] || examConfig.subject}</span>
                                {examConfig.duration && (
                                    <>
                                        <span>•</span>
                                        <span>{examConfig.duration} dəq</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                            <HiOutlineCog className="w-5 h-5" />
                            <span className="hidden sm:inline">Parametrlər</span>
                        </button>
                        <button
                            onClick={handleSaveExam}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                        >
                            {isEditMode ? 'Yenilə' : 'Yadda Saxla'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="container-main mt-8 max-w-4xl">
                <div className="space-y-6 mb-8">
                    {questions.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-20">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300">
                                <span className="text-2xl font-bold">?</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Hələ heç bir sual əlavə edilməyib</h2>
                            <p className="text-gray-500 mb-6">İmtahanınına ilk sualını əlavə etmək üçün aşağıdakı düymədən istifadə edin.</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleAddQuestion}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                                >
                                    <HiOutlinePlus className="w-6 h-6" />
                                    Tək Sual Əlavə Et
                                </button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setBatchPdfFile(file);
                                                setIsBatchPdfOpen(true);
                                            }
                                            e.target.value = null;
                                        }}
                                    />
                                    <button
                                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-xl transition-colors shadow-sm"
                                    >
                                        <HiOutlinePlus className="w-6 h-6" />
                                        PDF-dən Çoxlu Sual
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        questions.map((question, index) => (
                            <QuestionEditor
                                key={question.id}
                                index={index}
                                question={question}
                                onChange={handleUpdateQuestion}
                                onDelete={handleDeleteQuestion}
                            />
                        ))
                    )}
                </div>

                {questions.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <button
                            onClick={handleAddQuestion}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl transition-colors shadow-sm"
                        >
                            <HiOutlinePlus className="w-6 h-6" />
                            Yeni Sual Əlavə Et
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setBatchPdfFile(file);
                                        setIsBatchPdfOpen(true);
                                    }
                                    e.target.value = null;
                                }}
                            />
                            <button
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                <HiOutlinePlus className="w-6 h-6" />
                                PDF-dən Çoxlu Sual
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Batch PDF Cropper */}
            <PdfCropperModal
                isOpen={isBatchPdfOpen}
                isBatchMode={true}
                file={batchPdfFile}
                onClose={() => {
                    setIsBatchPdfOpen(false);
                    setBatchPdfFile(null);
                }}
                onCropComplete={handleBatchPdfComplete}
            />

            <ExamSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                examConfig={examConfig}
                onSave={handleSaveSettings}
            />
        </div>
    );
};

export default ExamEditor;
