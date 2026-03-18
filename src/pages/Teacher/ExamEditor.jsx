import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCog, HiOutlinePlus, HiOutlineX, HiOutlineVolumeUp, HiOutlineDocumentText, HiOutlineBookOpen, HiOutlineInformationCircle, HiLockClosed, HiOutlineUserGroup, HiOutlinePaperAirplane, HiOutlineCheckCircle } from 'react-icons/hi';
import { ExamSettingsModal, QuestionEditor, PdfCropperModal } from '../../components/ui';
import BankPickerModal from '../../components/ui/BankPickerModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TYPE_TO_FRONTEND = {
    MCQ: 'MULTIPLE_CHOICE', TRUE_FALSE: 'MULTIPLE_CHOICE',
    MULTI_SELECT: 'MULTI_SELECT', OPEN_AUTO: 'OPEN_AUTO',
    FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING', OPEN_MANUAL: 'OPEN_MANUAL',
};

// Converts backend matchingPairs to frontend format with content-based canonical visualIds.
// Pairs sharing the same leftItem/rightItem text get the SAME visualId so they appear
// as one node in the editor (many-to-many connections).
const toFrontendMatchingPairs = (pairs) => {
    if (!pairs || pairs.length === 0) return [];
    const lvMap = {}, rvMap = {};
    pairs.forEach(p => {
        if (p.leftItem && !lvMap[p.leftItem]) lvMap[p.leftItem] = `lv-${p.id}`;
        if (p.rightItem && !rvMap[p.rightItem]) rvMap[p.rightItem] = `rv-${p.id}`;
    });
    return pairs.map(p => ({
        id: p.id,
        leftItem: p.leftItem || null,
        rightItem: p.rightItem || null,
        attachedImageLeft: p.attachedImageLeft || null,
        attachedImageRight: p.attachedImageRight || null,
        leftVisualId: p.leftItem ? lvMap[p.leftItem] : null,
        rightVisualId: p.rightItem ? rvMap[p.rightItem] : null,
    }));
};

const buildQuestionsFromTypeCounts = (typeCounts) => {
    const questions = [];
    let orderIdx = 0;
    typeCounts.forEach(({ questionType, count }) => {
        const frontendType = TYPE_TO_FRONTEND[questionType] || 'MULTIPLE_CHOICE';
        const isChoice = frontendType === 'MULTIPLE_CHOICE' || frontendType === 'MULTI_SELECT';
        for (let i = 0; i < count; i++) {
            const ts = Date.now();
            questions.push({
                id: `new-${ts}-${orderIdx}`,
                type: frontendType,
                text: '', points: 0,
                orderIndex: orderIdx++,
                subjectGroup: null,
                options: isChoice ? [
                    { id: `o1-${ts}-${orderIdx}`, text: 'A', isCorrect: false },
                    { id: `o2-${ts}-${orderIdx}`, text: 'B', isCorrect: false },
                    { id: `o3-${ts}-${orderIdx}`, text: 'C', isCorrect: false },
                    { id: `o4-${ts}-${orderIdx}`, text: 'D', isCorrect: false },
                ] : [],
                matchingPairs: [],
                sampleAnswer: ''
            });
        }
    });
    return questions;
};

const ExamEditor = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin, hasPermission } = useAuth();
    const isEditMode = !!id;
    const backPath = isAdmin ? '/admin/oz-imtahanlar' : '/imtahanlar';
    const initialLocationState = location.state || { subject: 'Seçilməyib', type: 'free' };

    const [type, setType] = useState(initialLocationState.type);
    const [examConfig, setExamConfig] = useState({
        title: '',
        subject: initialLocationState.subject && initialLocationState.subject !== 'Seçilməyib'
            ? initialLocationState.subject : (initialLocationState.type === 'template' ? (initialLocationState.sectionData?.subjectName || 'Şablon') : 'Riyaziyyat'),
        extraSubjects: [],
        duration: 60, visibility: 'PUBLIC', password: '', tags: [], description: ''
    });
    const [subjectsList, setSubjectsList] = useState([]);
    const [showSectionPicker, setShowSectionPicker] = useState(false);
    const [passageSectionTarget, setPassageSectionTarget] = useState(null);
    const [batchPdfSection, setBatchPdfSection] = useState(null);
    const [questions, setQuestions] = useState(() => {
        if (isEditMode) return [];
        const state = location.state || {};
        if (state.type === 'template') return []; // pre-populated via useEffect
        return [{
            id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', points: 1,
            orderIndex: 0, subjectGroup: null,
            options: [
                { id: Date.now() + 1, text: 'A', isCorrect: false },
                { id: Date.now() + 2, text: 'B', isCorrect: false },
                { id: Date.now() + 3, text: 'C', isCorrect: false },
                { id: Date.now() + 4, text: 'D', isCorrect: false },
            ],
            matchingPairs: [], sampleAnswer: ''
        }];
    });
    const [passages, setPassages] = useState([]);
    const [examStatus, setExamStatus] = useState('DRAFT');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBatchPdfOpen, setIsBatchPdfOpen] = useState(false);
    const [batchPdfFile, setBatchPdfFile] = useState(null);
    const [loading, setLoading] = useState(isEditMode);
    const [showPassageTypeModal, setShowPassageTypeModal] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving' | 'saved'

    // Collaborative mode
    const [collaborativeParentId, setCollaborativeParentId] = useState(null);
    const [collaborativeSubjects, setCollaborativeSubjects] = useState([]);
    const [collaborativeTemplateSections, setCollaborativeTemplateSections] = useState([]); // template sections for this draft
    const [isCollaborativeParent, setIsCollaborativeParent] = useState(false); // admin editing the parent exam

    // Template mode state
    const [templateInfo, setTemplateInfo] = useState(null); // { templateTitle, templateSubtitle, subjectName, questionCount, formula, typeCounts }
    const [selectedSectionId, setSelectedSectionId] = useState(null);

    // Bank picker state
    const [bankPicker, setBankPicker] = useState(null); // null | { section, replaceId, filterType }

    const bankQuestionToEditorFormat = (bq) => ({
        id: Date.now().toString(),
        type: TYPE_TO_FRONTEND[bq.questionType] || 'MULTIPLE_CHOICE',
        text: bq.content || '',
        attachedImage: bq.attachedImage || null,
        points: type === 'template' ? 1 : (bq.points ?? 1),
        orderIndex: nextOrderIndex(),
        subjectGroup: null,
        options: (bq.options || [])
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map(o => ({ id: String(o.id || Date.now() + Math.random()), text: o.content || '', isCorrect: !!o.isCorrect, attachedImage: o.attachedImage || null })),
        matchingPairs: toFrontendMatchingPairs(
            (bq.matchingPairs || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        ).map(p => ({ ...p, id: String(p.id || Date.now() + Math.random()) })),
        sampleAnswer: bq.correctAnswer || '',
    });

    const handleBankSelect = (bq) => {
        const { section, replaceId, filterType } = bankPicker;
        setBankPicker(null);

        if (replaceId) {
            // Template mode: replace existing question's content, keep id/orderIndex/subjectGroup
            setQuestions(prev => prev.map(q => {
                if (q.id !== replaceId) return q;
                const converted = bankQuestionToEditorFormat(bq);
                const sameType = converted.type === q.type;
                return {
                    ...q,
                    text: converted.text,
                    attachedImage: converted.attachedImage,
                    sampleAnswer: converted.sampleAnswer,
                    // Replace options/pairs only if types match
                    options: sameType ? converted.options : q.options,
                    matchingPairs: sameType ? converted.matchingPairs : q.matchingPairs,
                };
            }));
            toast.success('Sual bazadan seçildi');
        } else {
            // Normal mode: add as new question to section
            const isMain = !section || section === examConfig.subject;
            const newQ = { ...bankQuestionToEditorFormat(bq), subjectGroup: isMain ? null : section };
            setQuestions(prev => [...prev, newQ]);
            toast.success('Sual bazadan əlavə edildi');
        }
    };

    // Tracks the backend ID of the draft (for new exams created silently via auto-save)
    const createdIdRef = useRef(isEditMode ? id : null);
    const autoSaveTimerRef = useRef(null);

    useEffect(() => {
        if (isEditMode) fetchExamData();
    }, [id]);

    useEffect(() => {
        api.get('/subjects').then(res => setSubjectsList(res.data)).catch(() => {});
    }, []);

    // On new template exam: load section data from navigation state
    useEffect(() => {
        if (!isEditMode && initialLocationState.type === 'template' && initialLocationState.sectionData) {
            const sd = initialLocationState.sectionData;
            setTemplateInfo(sd);
            setSelectedSectionId(sd.id);
            setQuestions(buildQuestionsFromTypeCounts(sd.typeCounts || []));
            // Auto-set title so auto-save can proceed without user input
            setExamConfig(prev => ({
                ...prev,
                title: prev.title || `${sd.subjectName || 'Şablon'} - ${sd.subtitleName || sd.name || 'İmtahan'}`
            }));
        }
    }, []);

    // On new exam with AI-generated questions
    useEffect(() => {
        if (!isEditMode && initialLocationState.aiQuestions?.length > 0) {
            const mapped = initialLocationState.aiQuestions.map((q, idx) => ({
                id: (Date.now() + idx).toString(),
                orderIndex: idx,
                type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                      q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                      q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' :
                      q.questionType === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' :
                      q.questionType === 'OPEN_MANUAL' ? 'OPEN_MANUAL' : 'MULTIPLE_CHOICE',
                text: q.content || '',
                points: q.points ?? 1,
                subjectGroup: null,
                options: (q.options || []).map((o, oi) => ({
                    id: Date.now() + idx * 100 + oi,
                    text: o.content || '',
                    isCorrect: !!o.isCorrect
                })),
                matchingPairs: [],
                sampleAnswer: q.correctAnswer || ''
            }));
            setQuestions(mapped);
            // Auto-set title so auto-save can proceed
            const subj = initialLocationState.subject || 'AI';
            setExamConfig(prev => ({
                ...prev,
                title: prev.title || `${subj} - AI İmtahan`,
                subject: prev.subject || subj,
            }));
        }
    }, []);

    // Auto-save: debounce 2.5s after any content change
    useEffect(() => {
        if (loading) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(async () => {
            if (type !== 'template' && (!examConfig.title || !examConfig.title.trim())) return;
            const payload = buildPayload(examStatus);
            setAutoSaveStatus('saving');
            try {
                if (createdIdRef.current) {
                    await api.put(`/exams/${createdIdRef.current}`, payload);
                } else {
                    const { data } = await api.post('/exams', payload);
                    createdIdRef.current = data.id;
                    window.history.replaceState(null, '', `/imtahanlar/duzenle/${data.id}`);
                }
                setAutoSaveStatus('saved');
                setTimeout(() => setAutoSaveStatus(null), 3000);
            } catch {
                setAutoSaveStatus(null);
            }
        }, 1500);
        return () => clearTimeout(autoSaveTimerRef.current);
    }, [questions, passages, examConfig, type, loading, examStatus]);

    const fetchExamData = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExamConfig({
                title: data.title,
                subject: data.subjects?.[0] || 'Riyaziyyat',
                extraSubjects: data.subjects?.slice(1) || [],
                duration: data.durationMinutes, visibility: data.visibility,
                tags: data.tags || [], description: data.description || ''
            });
            setType(data.examType.toLowerCase());
            setExamStatus(data.status || 'DRAFT');
            if (data.collaborativeParentId) {
                setCollaborativeParentId(data.collaborativeParentId);
                setCollaborativeSubjects(data.collaborativeSubjects || []);
                setCollaborativeTemplateSections(data.collaborativeTemplateSections || []);
            }
            if (data.isCollaborative && !data.collaborativeParentId) {
                setIsCollaborativeParent(true);
            }
            if (data.templateSectionId) setSelectedSectionId(data.templateSectionId);
            if (data.templateSectionId) {
                api.get(`/templates/sections/${data.templateSectionId}`).then(({ data: sec }) => {
                    setTemplateInfo({
                        ...sec,
                        templateTitle: sec.templateTitle,
                        templateSubtitle: sec.subtitleName,
                    });
                }).catch(() => {});
            }

            const mappedQuestions = (data.questions || []).map(q => ({
                id: q.id.toString(),
                orderIndex: q.orderIndex ?? 0,
                type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                    q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                    q.questionType === 'MATCHING' ? 'MATCHING' :
                    q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' :
                    q.questionType === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' : 'OPEN_MANUAL',
                text: q.content, points: q.points, attachedImage: q.attachedImage,
                sampleAnswer: q.correctAnswer,
                subjectGroup: q.subjectGroup || null,
                options: q.options?.map(opt => ({ id: opt.id, text: opt.content, isCorrect: opt.isCorrect })),
                matchingPairs: toFrontendMatchingPairs(q.matchingPairs)
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
                subjectGroup: p.subjectGroup || null,
                questions: (p.questions || []).map(q => ({
                    id: q.id.toString(),
                    type: q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                        q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                        q.questionType === 'MATCHING' ? 'MATCHING' :
                        q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' :
                        q.questionType === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' : 'OPEN_MANUAL',
                    text: q.content, points: q.points, attachedImage: q.attachedImage,
                    sampleAnswer: q.correctAnswer,
                    options: q.options?.map(opt => ({ id: opt.id, text: opt.content, isCorrect: opt.isCorrect })),
                    matchingPairs: toFrontendMatchingPairs(q.matchingPairs)
                }))
            }));
            setPassages(mappedPassages);
        } catch (error) {
            toast.error("İmtahan məlumatlarını yükləmək mümkün olmadı");
            navigate(backPath);
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

    // ---------- Section handlers ----------
    const handleAddSection = (subjectName) => {
        if (!subjectName || (examConfig.extraSubjects || []).includes(subjectName) || subjectName === examConfig.subject) return;
        setExamConfig(prev => ({ ...prev, extraSubjects: [...(prev.extraSubjects || []), subjectName] }));
        setShowSectionPicker(false);
    };

    const handleRemoveSection = (subjectName) => {
        setQuestions(prev => prev.map(q => q.subjectGroup === subjectName ? { ...q, subjectGroup: null } : q));
        setExamConfig(prev => ({ ...prev, extraSubjects: (prev.extraSubjects || []).filter(s => s !== subjectName) }));
    };

    // ---------- Standalone question handlers ----------
    const handleAddQuestion = (sectionSubject) => {
        const isMainSection = !sectionSubject || sectionSubject === examConfig.subject;
        const newQuestion = {
            id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', points: 1,
            orderIndex: nextOrderIndex(),
            subjectGroup: isMainSection ? null : sectionSubject,
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
        const isMain = !batchPdfSection || batchPdfSection === examConfig.subject;
        const newQuestions = base64Images.map((img, idx) => ({
            id: `batch-${Date.now()}-${idx}`, type: 'MULTIPLE_CHOICE',
            text: 'Şəkilə əsasən cavabı qeyd edin', points: 1, attachedImage: img,
            orderIndex: startIdx + idx,
            subjectGroup: isMain ? null : batchPdfSection,
            options: [
                { id: `opt-a-${Date.now()}-${idx}`, text: 'A', isCorrect: false },
                { id: `opt-b-${Date.now()}-${idx}`, text: 'B', isCorrect: false },
                { id: `opt-c-${Date.now()}-${idx}`, text: 'C', isCorrect: false },
                { id: `opt-d-${Date.now()}-${idx}`, text: 'D', isCorrect: false },
                { id: `opt-e-${Date.now()}-${idx}`, text: 'E', isCorrect: false },
            ]
        }));
        setQuestions([...questions, ...newQuestions]);
        setBatchPdfSection(null);
        toast.success(`${base64Images.length} yeni sual əlavə edildi`);
    };

    // ---------- Passage handlers ----------
    const handleAddPassage = (passageType) => {
        const isMain = !passageSectionTarget || passageSectionTarget === examConfig.subject;
        const newPassage = {
            id: Date.now().toString(), passageType,
            title: '', textContent: '', attachedImage: null, audioContent: null,
            listenLimit: null, orderIndex: nextOrderIndex(),
            subjectGroup: isMain ? null : passageSectionTarget,
            questions: []
        };
        setPassages([...passages, newPassage]);
        setShowPassageTypeModal(false);
        setPassageSectionTarget(null);
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
    const isNewId = (id) => {
        if (id === null || id === undefined) return true;
        if (typeof id === 'string') {
            if (id.startsWith('batch') || id.length > 10) return true;
            if (isNaN(Number(id))) return true; // e.g. "blank-0", "opt-a-..."
        }
        return id > 1000000000000;
    };

    const mapQuestion = (q, idx) => ({
        id: isNewId(q.id) ? null : q.id,
        content: q.text,
        attachedImage: q.attachedImage || null,
        questionType: q.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
            q.type === 'MULTI_SELECT' ? 'MULTI_SELECT' :
            q.type === 'MATCHING' ? 'MATCHING' :
            q.type === 'OPEN_AUTO' ? 'OPEN_AUTO' :
            q.type === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' : 'OPEN_MANUAL',
        points: type === 'template' ? 1 : (parseFloat(q.points) || 1),
        orderIndex: q.orderIndex ?? idx,
        correctAnswer: q.sampleAnswer || '',
        subjectGroup: q.subjectGroup || null,
        options: q.options ? q.options.map((opt, oIdx) => ({
            id: isNewId(opt.id) ? null : opt.id,
            content: opt.text, isCorrect: opt.isCorrect, orderIndex: oIdx
        })) : [],
        matchingPairs: q.matchingPairs
            ? q.matchingPairs
                .filter(pair => pair.leftItem || pair.rightItem)  // save all non-empty pairs (linked + distractors)
                .map((pair, pIdx) => ({
                    id: isNewId(pair.id) ? null : pair.id,
                    leftItem: pair.leftItem || null,
                    attachedImageLeft: pair.attachedImageLeft || null,
                    rightItem: pair.rightItem || null,
                    attachedImageRight: pair.attachedImageRight || null,
                    orderIndex: pIdx,
                }))
            : []
    });

    const buildPayload = (status, config) => {
        const cfg = config || examConfig;
        const durationAllowed = hasPermission('selectExamDuration');
        const duration = durationAllowed ? (parseInt(cfg.duration) || null) : null;
        return {
            title: cfg.title || 'Adsız İmtahan',
            description: cfg.description || '',
            subjects: cfg.subject ? [cfg.subject, ...(cfg.extraSubjects || [])] : [],
            visibility: cfg.visibility || 'PUBLIC',
            examType: type === 'free' ? 'FREE' : 'TEMPLATE',
            status,
            durationMinutes: duration,
            tags: cfg.tags || [],
            templateSectionId: type === 'template' ? (selectedSectionId || null) : null,
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
                subjectGroup: p.subjectGroup || null,
                questions: p.questions.map((q, qIdx) => mapQuestion(q, qIdx))
            }))
        };
    };

    const handleSaveDraft = async () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        const currentId = createdIdRef.current;
        const loadId = toast.loading('Qaralama saxlanılır...');
        try {
            if (currentId) {
                await api.put(`/exams/${currentId}`, buildPayload(examStatus));
                toast.success(examStatus === 'PUBLISHED' ? 'Dəyişikliklər saxlanıldı' : 'Qaralama yeniləndi', { id: loadId });
            } else {
                const { data } = await api.post('/exams', buildPayload('DRAFT'));
                createdIdRef.current = data.id;
                window.history.replaceState(null, '', `/imtahanlar/duzenle/${data.id}`);
                toast.success('Qaralama saxlanıldı', { id: loadId });
            }
        } catch (error) {
            toast.error(error.message || 'Xəta baş verdi', { id: loadId });
        }
    };

    const handlePublish = async () => {
        // Validate required settings first — open settings modal if something is wrong
        if (!examConfig.title) {
            toast.error('İmtahanın adını qeyd edin');
            setIsSettingsOpen(true);
            return;
        }
        if (questions.length === 0 && passages.length === 0) {
            toast.error('İmtahana ən azı bir sual əlavə edilməlidir');
            return;
        }

        // Validate that every auto-graded question has a correct answer defined
        const allQs = [
            ...questions,
            ...passages.flatMap(p => p.questions || [])
        ];
        for (let i = 0; i < allQs.length; i++) {
            const q = allQs[i];
            const label = `Sual ${i + 1}`;
            if (q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTI_SELECT') {
                if (!q.options || !q.options.some(o => o.isCorrect)) {
                    toast.error(`${label}: düzgün cavab variantı seçilməyib`);
                    return;
                }
            } else if (q.type === 'OPEN_AUTO') {
                if (!q.sampleAnswer || !q.sampleAnswer.trim()) {
                    toast.error(`${label}: düzgün cavab daxil edilməyib`);
                    return;
                }
            } else if (q.type === 'FILL_IN_THE_BLANK') {
                let blanks = [];
                try { blanks = JSON.parse(q.sampleAnswer || '[]'); } catch (e) {}
                if (!blanks.some(b => b && b.trim() !== '')) {
                    toast.error(`${label}: boşluqların düzgün cavabları daxil edilməyib`);
                    return;
                }
            } else if (q.type === 'MATCHING') {
                const hasConnection = (q.matchingPairs || []).some(p => p.leftItem && p.rightItem);
                if (!hasConnection) {
                    toast.error(`${label}: ən azı bir uyğunlaşdırma əlaqəsi qurulmalıdır`);
                    return;
                }
            }
        }

        // If plan doesn't allow duration, silently strip it before publishing
        let configToSend = examConfig;
        if (!hasPermission('selectExamDuration') && examConfig.duration) {
            configToSend = { ...examConfig, duration: 0 };
            setExamConfig(configToSend);
        }

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        const currentId = createdIdRef.current;
        const loadId = toast.loading(currentId ? 'Dəyişikliklər saxlanılır...' : 'İmtahan yayımlanır...');
        try {
            if (currentId) {
                await api.put(`/exams/${currentId}`, buildPayload('PUBLISHED', configToSend));
                setExamStatus('PUBLISHED');
                toast.success('İmtahan yayımlandı!', { id: loadId });
            } else {
                await api.post('/exams', buildPayload('PUBLISHED', configToSend));
                toast.success('İmtahan uğurla yayımlandı!', { id: loadId });
            }
            navigate(backPath);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Xəta baş verdi', { id: loadId });
        }
    };

    const isCollaborativeMode = !!collaborativeParentId;

    const handleSubmitDraft = async () => {
        const currentId = createdIdRef.current;
        if (!currentId) { toast.error('Əvvəlcə ən azı bir sual əlavə edin'); return; }
        if (questions.length === 0 && passages.length === 0) {
            toast.error('Göndərməzdən əvvəl ən azı bir sual əlavə edin');
            return;
        }
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        const loadId = toast.loading('Göndərilir...');
        try {
            await api.put(`/exams/${currentId}`, buildPayload(examStatus));
            await api.post(`/collaborative-exams/submit/${currentId}`);
            toast.success('Suallarınız admin-ə göndərildi!', { id: loadId });
            navigate('/imtahanlar');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xəta baş verdi', { id: loadId });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const isTemplateMode = type === 'template';
    const isQuestionCountLocked = isTemplateMode && templateInfo !== null;

    // Pre-compute global question offset for each section so numbering continues across sections
    const _sectionSubjectsList = [examConfig.subject, ...(examConfig.extraSubjects || [])];
    let _gqc = 0;
    const sectionQuestionOffsets = {};
    _sectionSubjectsList.forEach((sub, si) => {
        const isMain = si === 0;
        sectionQuestionOffsets[sub] = _gqc;
        _gqc += questions.filter(q => isMain
            ? (q.subjectGroup == null || q.subjectGroup === sub)
            : q.subjectGroup === sub).length;
        _gqc += passages
            .filter(p => isMain ? (p.subjectGroup == null || p.subjectGroup === sub) : p.subjectGroup === sub)
            .reduce((acc, p) => acc + (p.questions?.length || 0), 0);
    });

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(backPath)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 max-w-xl truncate">
                                {examConfig.title || (isEditMode ? 'İmtahan Redaktə Edilir' : 'Yeni İmtahan Yaradılır')}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">{type}</span>
                                <span>•</span>
                                <span>{examConfig.subject}</span>
                                {examConfig.duration && <><span>•</span><span>{examConfig.duration} dəq</span></>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => isCollaborativeMode ? null : setIsSettingsOpen(true)}
                            disabled={isCollaborativeMode}
                            title={isCollaborativeMode ? 'Parametrləri yalnız admin dəyişə bilər' : 'Parametrlər'}
                            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors ${
                                isCollaborativeMode
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        >
                            <HiOutlineCog className="w-5 h-5" />
                            <span className="hidden sm:inline">Parametrlər</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="container-main mt-8 max-w-4xl">
                {/* Collaborative parent banner (admin editing the main exam) */}
                {isCollaborativeParent && (
                    <div className="mb-6 bg-violet-50 border border-violet-200 rounded-2xl px-6 py-4 flex items-start gap-3">
                        <HiOutlineUserGroup className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold text-sm text-violet-800">Birgə İmtahan — Admin Redaktəsi</p>
                            <p className="text-xs text-violet-600 mt-0.5">
                                Bu imtahana müəllimlər də sual əlavə edir. Siz birbaşa sual, fənn və parametr əlavə edə bilərsiniz.
                                Müəllimlərin göndərdiyi suallar admin panelindən təsdiq edildikdə avtomatik əlavə olunur.
                            </p>
                        </div>
                    </div>
                )}

                {/* Collaborative mode banner */}
                {isCollaborativeMode && (
                    <div className={`mb-6 rounded-2xl px-6 py-4 border ${examStatus === 'SUBMITTED' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                            <HiOutlineUserGroup className={`w-5 h-5 mt-0.5 shrink-0 ${examStatus === 'SUBMITTED' ? 'text-amber-500' : 'text-blue-500'}`} />
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${examStatus === 'SUBMITTED' ? 'text-amber-800' : 'text-blue-800'}`}>
                                    {examStatus === 'SUBMITTED' ? 'Göndərildi — Admin yoxlayır' : 'Birgə İmtahan Workspace'}
                                </p>
                                {collaborativeTemplateSections.length > 0 ? (
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        {collaborativeTemplateSections.map(sec => {
                                            const filled = questions.filter(q => q.subjectGroup === sec.subjectName && q.text?.trim()).length;
                                            const pct = sec.questionCount > 0 ? Math.round((filled / sec.questionCount) * 100) : 0;
                                            return (
                                                <div key={sec.id}>
                                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                                        <span className={`font-semibold ${examStatus === 'SUBMITTED' ? 'text-amber-700' : 'text-blue-700'}`}>{sec.subjectName}</span>
                                                        <span className={`${examStatus === 'SUBMITTED' ? 'text-amber-600' : 'text-blue-600'}`}>{filled}/{sec.questionCount} sual</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : examStatus === 'SUBMITTED' ? 'bg-amber-400' : 'bg-blue-400'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : collaborativeSubjects.length > 0 && (
                                    <p className={`text-xs mt-1 ${examStatus === 'SUBMITTED' ? 'text-amber-600' : 'text-blue-600'}`}>
                                        Sizin fənnlər: {collaborativeSubjects.join(', ')}
                                    </p>
                                )}
                                {examStatus === 'SUBMITTED' && (
                                    <p className="text-xs text-amber-600 mt-1.5">Admin təsdiq etdikdən sonra suallar əsl imtahana əlavə ediləcək.</p>
                                )}
                            </div>
                            {examStatus === 'SUBMITTED' && (
                                <HiOutlineCheckCircle className="w-5 h-5 text-amber-500 ml-auto shrink-0" />
                            )}
                        </div>
                    </div>
                )}

                {/* Template info banner (read-only) */}
                {isTemplateMode && templateInfo && (
                    <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                                {templateInfo.templateTitle} · {templateInfo.templateSubtitle}
                            </div>
                            <div className="mt-0.5 font-bold text-indigo-800 text-base">{templateInfo.subjectName}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-100 px-3 py-1 rounded-full">
                                <HiOutlineInformationCircle className="w-4 h-4" />
                                {templateInfo.questionCount} sual (sabit)
                            </span>
                            <code className="text-xs font-mono text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg">{templateInfo.formula}</code>
                        </div>
                    </div>
                )}

                {/* Subject Sections */}
                {[examConfig.subject, ...(examConfig.extraSubjects || [])].map((sectionSubject, sectionIdx) => {
                    const isMain = sectionIdx === 0;
                    const sectionItems = [
                        ...questions
                            .filter(q => isMain
                                ? (q.subjectGroup == null || q.subjectGroup === sectionSubject)
                                : q.subjectGroup === sectionSubject)
                            .map(q => ({ kind: 'question', data: q, orderIndex: q.orderIndex ?? 0 })),
                        ...passages
                            .filter(p => isMain
                                ? (p.subjectGroup == null || p.subjectGroup === sectionSubject)
                                : p.subjectGroup === sectionSubject)
                            .map(p => ({ kind: 'passage', data: p, orderIndex: p.orderIndex ?? 0 }))
                    ].sort((a, b) => a.orderIndex - b.orderIndex);
                    return (
                        <div key={sectionSubject} className="mb-10">
                            {/* Section header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm">
                                    <HiOutlineBookOpen className="w-4 h-4" />
                                    <span className="font-bold text-sm">{sectionSubject}</span>
                                </div>
                                <div className="flex-1 h-px bg-gray-200" />
                                {!isMain && !isTemplateMode && !isCollaborativeMode && (
                                    <button
                                        onClick={() => handleRemoveSection(sectionSubject)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Bu bölməni sil"
                                    >
                                        <HiOutlineX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Questions and passages interleaved by orderIndex */}
                            {sectionItems.length > 0 && (
                                <div className="space-y-6 mb-4">
                                    {(() => {
                                        let qOffset = sectionQuestionOffsets[sectionSubject] ?? 0;
                                        return sectionItems.map((item) => {
                                            if (item.kind === 'question') {
                                                const globalIdx = qOffset++;
                                                return (
                                                    <div key={item.data.id}>
                                                        <QuestionEditor
                                                            index={globalIdx}
                                                            question={item.data}
                                                            onChange={handleUpdateQuestion}
                                                            onDelete={handleDeleteQuestion}
                                                            hidePoints={isTemplateMode}
                                                            hideDelete={isQuestionCountLocked}
                                                        />
                                                        {isQuestionCountLocked && (
                                                            <div className="mt-2 flex justify-end">
                                                                <button
                                                                    onClick={() => setBankPicker({ section: sectionSubject, replaceId: item.data.id, filterType: item.data.type })}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-lg transition-colors text-xs"
                                                                >
                                                                    <HiOutlineBookOpen className="w-3.5 h-3.5" />
                                                                    Bazadan seç
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                const passageOffset = qOffset;
                                                qOffset += item.data.questions?.length || 0;
                                                return (
                                                    <PassageEditor
                                                        key={item.data.id}
                                                        passage={item.data}
                                                        questionOffset={passageOffset}
                                                        onChange={handleUpdatePassage}
                                                        onDelete={handleDeletePassage}
                                                        onAddQuestion={handleAddPassageQuestion}
                                                        onUpdateQuestion={handleUpdatePassageQuestion}
                                                        onDeleteQuestion={handleDeletePassageQuestion}
                                                        hasPermission={hasPermission}
                                                    />
                                                );
                                            }
                                        });
                                    })()}
                                </div>
                            )}

                            {/* Add question / PDF / passage buttons for this section */}
                            {!isQuestionCountLocked && (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleAddQuestion(sectionSubject)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-xl transition-colors text-sm"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" />
                                        Sual əlavə et
                                    </button>
                                    <button
                                        onClick={() => hasPermission('addPassageQuestion') ? (setPassageSectionTarget(sectionSubject), setShowPassageTypeModal(true)) : null}
                                        className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-xl transition-colors text-sm ${
                                            hasPermission('addPassageQuestion')
                                                ? 'bg-white border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-teal-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {!hasPermission('addPassageQuestion') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlinePlus className="w-4 h-4" />}
                                        Mətn / Dinləmə
                                    </button>
                                    <div className="relative">
                                        <input type="file" disabled={!hasPermission('importQuestionsFromPdf')} accept="application/pdf" className={`absolute inset-0 w-full h-full opacity-0 ${hasPermission('importQuestionsFromPdf') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            onChange={(e) => { const file = e.target.files[0]; if (file) { setBatchPdfSection(sectionSubject); setBatchPdfFile(file); setIsBatchPdfOpen(true); } e.target.value = null; }} />
                                        <button className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-xl transition-colors text-sm ${
                                            hasPermission('importQuestionsFromPdf')
                                                ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}>
                                            {!hasPermission('importQuestionsFromPdf') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlinePlus className="w-4 h-4" />}
                                            PDF-dən suallar əlavə et
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => hasPermission('useQuestionBank') ? setBankPicker({ section: sectionSubject, replaceId: null, filterType: null }) : null}
                                        className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-xl transition-colors text-sm ${
                                            hasPermission('useQuestionBank')
                                                ? 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {!hasPermission('useQuestionBank') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlineBookOpen className="w-4 h-4" />}
                                        Bazadan əlavə et
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}


                {/* Add new subject section */}
                {!isTemplateMode && !isCollaborativeMode && (
                    <div className="mt-4 mb-8">
                        {showSectionPicker ? (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Yeni fənn seçin:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-3">
                                    {subjectsList
                                        .filter(s => s !== examConfig.subject && !(examConfig.extraSubjects || []).includes(s))
                                        .map(name => (
                                            <button
                                                key={name}
                                                onClick={() => handleAddSection(name)}
                                                className="text-left px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                                            >
                                                {name}
                                            </button>
                                        ))}
                                </div>
                                <button onClick={() => setShowSectionPicker(false)} className="text-sm text-gray-400 hover:text-gray-600">Ləğv et</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => hasPermission('multipleSubjects') ? setShowSectionPicker(true) : null}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed font-semibold rounded-2xl transition-colors ${
                                    hasPermission('multipleSubjects') 
                                        ? 'bg-white border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700' 
                                        : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {!hasPermission('multipleSubjects') ? <HiLockClosed className="w-5 h-5"/> : <HiOutlinePlus className="w-5 h-5" />}
                                Yeni fənn əlavə et {!hasPermission('multipleSubjects') && <span className="text-xs font-normal ml-2">(Pro plan tələb olunur)</span>}
                            </button>
                        )}
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

            {/* Bank Picker Modal */}
            {bankPicker && (
                <BankPickerModal
                    filterType={bankPicker.filterType}
                    onSelect={handleBankSelect}
                    onClose={() => setBankPicker(null)}
                />
            )}

            {/* Floating Publish / Submit Button */}
            <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                {autoSaveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-xs text-white bg-amber-400 px-3 py-1.5 rounded-full shadow">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Saxlanılır...
                    </span>
                )}
                {autoSaveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-xs text-white bg-green-500 px-3 py-1.5 rounded-full shadow">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        Yadda saxlanıldı
                    </span>
                )}
                {isCollaborativeMode ? (
                    <button
                        onClick={examStatus === 'SUBMITTED' ? undefined : handleSubmitDraft}
                        disabled={examStatus === 'SUBMITTED'}
                        className={`flex items-center gap-2 px-6 py-3.5 font-bold rounded-2xl shadow-xl transition-all ${
                            examStatus === 'SUBMITTED'
                                ? 'bg-amber-400 text-white cursor-not-allowed shadow-amber-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-300'
                        }`}
                    >
                        {examStatus === 'SUBMITTED'
                            ? <><HiOutlineCheckCircle className="w-5 h-5" /> Göndərilib</>
                            : <><HiOutlinePaperAirplane className="w-5 h-5" /> Admin-ə göndər</>
                        }
                    </button>
                ) : (
                    <button
                        onClick={handlePublish}
                        className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-xl shadow-indigo-300 transition-all"
                    >
                        <HiOutlineDocumentText className="w-5 h-5" />
                        {examStatus === 'PUBLISHED' ? 'Yenilə' : 'Yayımla'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ---------- PassageEditor component ----------
const PassageEditor = ({ passage, onChange, onDelete, onAddQuestion, onUpdateQuestion, onDeleteQuestion, hasPermission, questionOffset = 0 }) => {
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
                            placeholder="Mətn parçasını bura daxil edin."
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-y font-mono"
                        />
                        {/* Image for text passage */}
                        <div className="flex items-center gap-3">
                            <input ref={imageInputRef} type="file" accept="image/*" disabled={!hasPermission('addImage')} className="hidden" onChange={handleImageUpload} />
                            <button onClick={() => hasPermission('addImage') ? imageInputRef.current.click() : null} className={`text-sm px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${hasPermission('addImage') ? 'border-teal-300 text-teal-700 hover:bg-teal-50' : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'}`}>
                                {!hasPermission('addImage') ? <HiLockClosed className="w-4 h-4"/> : null}
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
                        <input ref={audioInputRef} type="file" accept="audio/*" disabled={!hasPermission('addPassageQuestion')} className="hidden" onChange={handleAudioUpload} />
                        <div className="flex flex-col gap-3">
                            <button onClick={() => hasPermission('addPassageQuestion') ? audioInputRef.current.click() : null} className={`flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-xl transition-colors font-medium ${hasPermission('addPassageQuestion') ? 'border-purple-300 hover:bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
                                {!hasPermission('addPassageQuestion') ? <HiLockClosed className="w-6 h-6"/> : <HiOutlineVolumeUp className="w-6 h-6" />}
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
                                index={questionOffset + idx}
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


export default ExamEditor;
