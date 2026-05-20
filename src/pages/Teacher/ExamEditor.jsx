import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCog, HiOutlinePlus, HiOutlineX, HiOutlineVolumeUp, HiOutlineDocumentText, HiOutlineBookOpen, HiOutlineInformationCircle, HiLockClosed, HiOutlineUserGroup, HiOutlinePaperAirplane, HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi';
import { ExamSettingsModal, QuestionEditor, PdfCropperModal } from '../../components/ui';
import BankPickerModal from '../../components/ui/BankPickerModal';
import MathTextEditor from '../../components/ui/MathTextEditor';
import MathFormulaModal from '../../components/ui/MathFormulaModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useSmartBack } from '../../hooks/useSmartBack';

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

const makeQuestion = (questionType, orderIdx, subjectGroup, points = 1) => {
    const frontendType = TYPE_TO_FRONTEND[questionType] || 'MULTIPLE_CHOICE';
    const isChoice = frontendType === 'MULTIPLE_CHOICE' || frontendType === 'MULTI_SELECT';
    const ts = Date.now() + Math.random();
    return {
        id: `new-${ts}-${orderIdx}`,
        type: frontendType, text: '', points,
        orderIndex: orderIdx,
        subjectGroup: subjectGroup || null,
        options: isChoice ? [
            { id: `o1-${ts}`, text: '', isCorrect: false },
            { id: `o2-${ts}`, text: '', isCorrect: false },
            { id: `o3-${ts}`, text: '', isCorrect: false },
            { id: `o4-${ts}`, text: '', isCorrect: false },
        ] : [],
        matchingPairs: [], sampleAnswer: '',
    };
};

const makePassageQuestion = (questionType, idx) => {
    const frontendType = TYPE_TO_FRONTEND[questionType] || 'MULTIPLE_CHOICE';
    const isChoice = frontendType === 'MULTIPLE_CHOICE' || frontendType === 'MULTI_SELECT';
    const ts = Date.now() + Math.random();
    return {
        id: `new-pq-${ts}-${idx}`,
        type: frontendType, text: '', points: 1,
        options: isChoice ? [
            { id: `o1-${ts}`, text: '', isCorrect: false },
            { id: `o2-${ts}`, text: '', isCorrect: false },
            { id: `o3-${ts}`, text: '', isCorrect: false },
            { id: `o4-${ts}`, text: '', isCorrect: false },
        ] : [],
        matchingPairs: [], sampleAnswer: '',
    };
};

// Builds questions and passages from a section's typeCounts (handles passageType grouping).
const buildFromTypeCounts = (typeCounts, subjectGroup = null, startOrderIdx = 0) => {
    const standaloneTypes = typeCounts.filter(tc => !tc.passageType);
    const passageTypeGroups = {};
    typeCounts.filter(tc => tc.passageType).forEach(tc => {
        if (!passageTypeGroups[tc.passageType]) passageTypeGroups[tc.passageType] = [];
        passageTypeGroups[tc.passageType].push(tc);
    });

    let orderIdx = startOrderIdx;
    const questions = standaloneTypes.flatMap(({ questionType, count }) =>
        Array.from({ length: count }, (_, i) => makeQuestion(questionType, orderIdx++, subjectGroup))
    );
    const passages = Object.entries(passageTypeGroups).map(([passageType, tcs]) => ({
        id: `new-passage-${Date.now()}-${Math.random()}`,
        passageType, title: '', textContent: '', attachedImage: null, audioContent: null,
        listenLimit: null, orderIndex: orderIdx++, subjectGroup,
        questions: tcs.flatMap(({ questionType, count }, ti) =>
            Array.from({ length: count }, (_, i) => makePassageQuestion(questionType, ti * 100 + i))
        ),
    }));
    return { questions, passages };
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
                text: '', points: 1,
                orderIndex: orderIdx++,
                subjectGroup: null,
                options: isChoice ? [
                    { id: `o1-${ts}-${orderIdx}`, text: '', isCorrect: false },
                    { id: `o2-${ts}-${orderIdx}`, text: '', isCorrect: false },
                    { id: `o3-${ts}-${orderIdx}`, text: '', isCorrect: false },
                    { id: `o4-${ts}-${orderIdx}`, text: '', isCorrect: false },
                ] : [],
                matchingPairs: [],
                sampleAnswer: ''
            });
        }
    });
    return questions;
};

// Build questions with point values assigned from pointGroups JSON (olimpiyada mode).
// pointGroupsJson: '[{"from":1,"to":15,"points":1.0},{"from":16,"to":20,"points":1.5}]'
// startOrderIdx: global orderIndex offset (for multi-section exams)
const buildQuestionsWithPointGroups = (typeCounts, pointGroupsJson, startOrderIdx = 0) => {
    let pointGroups = [];
    try { pointGroups = JSON.parse(pointGroupsJson || '[]'); } catch {}

    const getPointsForSectionIndex = (sectionIdx) => {
        // sectionIdx is 0-based within section; pointGroups use 1-based from/to
        const qNum = sectionIdx + 1;
        const group = pointGroups.find(g => qNum >= g.from && qNum <= g.to);
        return group ? group.points : 1.0;
    };

    const questions = [];
    let globalOrderIdx = startOrderIdx;
    let sectionIdx = 0;
    typeCounts.forEach(({ questionType, count }) => {
        const frontendType = TYPE_TO_FRONTEND[questionType] || 'MULTIPLE_CHOICE';
        const isChoice = frontendType === 'MULTIPLE_CHOICE' || frontendType === 'MULTI_SELECT';
        for (let i = 0; i < count; i++) {
            const ts = Date.now();
            questions.push({
                id: `new-${ts}-${globalOrderIdx}`,
                type: frontendType,
                text: '',
                points: getPointsForSectionIndex(sectionIdx),
                orderIndex: globalOrderIdx++,
                subjectGroup: null,
                options: isChoice ? [
                    { id: `o1-${ts}-${globalOrderIdx}`, text: '', isCorrect: false },
                    { id: `o2-${ts}-${globalOrderIdx}`, text: '', isCorrect: false },
                    { id: `o3-${ts}-${globalOrderIdx}`, text: '', isCorrect: false },
                    { id: `o4-${ts}-${globalOrderIdx}`, text: '', isCorrect: false },
                ] : [],
                matchingPairs: [],
                sampleAnswer: ''
            });
            sectionIdx++;
        }
    });
    return questions;
};

const ExamEditor = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin, hasPermission, subscription } = useAuth();
    const isEditMode = !!id;
    const backPath = isAdmin ? '/admin/oz-imtahanlar' : '/imtahanlar';
    const goBack = useSmartBack(backPath);
    const initialLocationState = location.state || { subject: 'Seçilməyib', type: 'free' };

    const [type, setType] = useState(initialLocationState.type);
    const [examConfig, setExamConfig] = useState({
        title: (!id && initialLocationState.type === 'free' && initialLocationState.subject && initialLocationState.subject !== 'Seçilməyib')
            ? initialLocationState.subject : '',
        subject: initialLocationState.subject && initialLocationState.subject !== 'Seçilməyib'
            ? initialLocationState.subject : (initialLocationState.type === 'template' ? (initialLocationState.sectionData?.subjectName || 'Şablon') : 'Riyaziyyat'),
        extraSubjects: [],
        duration: 60, visibility: 'PUBLIC', password: '', tags: [], description: '', explanationVideoUrl: ''
    });
    const [subjectsList, setSubjectsList] = useState([]);
    const [showSectionPicker, setShowSectionPicker] = useState(false);
    const [passageSectionTarget, setPassageSectionTarget] = useState(null);
    const [batchPdfSection, setBatchPdfSection] = useState(null);
    const [questions, setQuestions] = useState(() => {
        if (isEditMode) return [];
        const state = location.state || {};
        if (state.type === 'template' || state.type === 'olimpiyada') return []; // pre-populated via useEffect
        // Prefilled from the Question Bank's bulk "İmtahan yarat" action —
        // each item is a BankQuestionResponse coming through router state.
        // We map them through the same conversion used by handleBankSelectMany,
        // but inline because the helper closes over `nextOrderIndex()`.
        if (Array.isArray(state.bankQuestions) && state.bankQuestions.length > 0) {
            return state.bankQuestions.map((bq, i) => {
                const ts = Date.now() + i;
                const frontendType = TYPE_TO_FRONTEND[bq.questionType] || 'MULTIPLE_CHOICE';
                return {
                    id: `bank-${ts}-${bq.id}`,
                    type: frontendType,
                    text: bq.content || '',
                    attachedImage: bq.attachedImage || null,
                    points: bq.points ?? 1,
                    orderIndex: i,
                    subjectGroup: null,
                    options: (bq.options || [])
                        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                        .map(o => ({
                            id: String(o.id || ts + Math.random()),
                            text: o.content || '',
                            isCorrect: !!o.isCorrect,
                            attachedImage: o.attachedImage || null,
                        })),
                    matchingPairs: toFrontendMatchingPairs(
                        (bq.matchingPairs || []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    ).map(p => ({ ...p, id: String(p.id || ts + Math.random()) })),
                    sampleAnswer: bq.correctAnswer || '',
                };
            });
        }
        return [{
            id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', points: 1,
            orderIndex: 0, subjectGroup: null,
            options: [
                { id: Date.now() + 1, text: '', isCorrect: false },
                { id: Date.now() + 2, text: '', isCorrect: false },
                { id: Date.now() + 3, text: '', isCorrect: false },
                { id: Date.now() + 4, text: '', isCorrect: false },
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
    // Multi-section template state
    const [templateSections, setTemplateSections] = useState([]); // array of section info objects
    const [selectedSectionIds, setSelectedSectionIds] = useState([]); // array of section IDs

    // Bank picker state
    const [bankPicker, setBankPicker] = useState(null); // null | { section, replaceId, filterType }

    // AI question generation state
    const [aiModal, setAiModal] = useState(null); // null | { section, replaceId?, lockedQuestionType? }
    const [aiLoading, setAiLoading] = useState(false);
    const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'MEDIUM', questionType: 'MCQ' });
    const [aiTopics, setAiTopics] = useState([]);
    const [aiTopicsLoading, setAiTopicsLoading] = useState(false);
    const [aiUsage, setAiUsage] = useState(null); // { limit, used, remaining }

    // Template section adder (for adding more sections to an existing template exam)
    const [addSectionModal, setAddSectionModal] = useState(null);
    // null | { tab: 'subject'|'template', step: 1|2|3, templates: [], selectedTemplate: null, subtitles: [], selectedSubtitle: null, loadingTemplates: false, loadingSubtitles: false }

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

    const handleBankSelectMany = (bqs) => {
        const { section, replaceId } = bankPicker || {};
        setBankPicker(null);
        if (replaceId) {
            // Replace mode only supports a single question; take the first.
            if (bqs.length > 0) handleBankSelect(bqs[0]);
            return;
        }
        const isMain = !section || section === examConfig.subject;
        let baseOrder = nextOrderIndex();
        const newQs = bqs.map((bq, i) => {
            const converted = bankQuestionToEditorFormat(bq);
            return {
                ...converted,
                orderIndex: baseOrder + i,
                id: `${Date.now()}-${i}-${bq.id}`,
                subjectGroup: isMain ? null : section,
            };
        });
        setQuestions(prev => [...prev, ...newQs]);
        toast.success(`${newQs.length} sual bazadan əlavə edildi`);
    };

    const handleAiGenerate = async () => {
        if (!aiModal) return;
        if (!aiForm.topic.trim()) { toast.error('Mövzu daxil edin'); return; }
        setAiLoading(true);
        try {
            const { data } = await api.post('/ai/generate-questions', {
                subjectName: aiModal.section,
                topicName: aiForm.topic.trim(),
                difficulty: aiForm.difficulty,
                questionType: aiForm.questionType,
                count: 1,
            });
            const q = data[0];
            if (!q) { toast.error('Sual yaradılmadı'); return; }
            const frontendType =
                q.questionType === 'MCQ' ? 'MULTIPLE_CHOICE' :
                q.questionType === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                q.questionType === 'OPEN_AUTO' ? 'OPEN_AUTO' :
                q.questionType === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' : 'MULTIPLE_CHOICE';

            if (aiModal.replaceId) {
                // Template mode: fill into existing question slot, keep id/orderIndex/subjectGroup/points
                setQuestions(prev => prev.map(existing => {
                    if (existing.id !== aiModal.replaceId) return existing;
                    const sameType = frontendType === existing.type;
                    return {
                        ...existing,
                        text: q.content || '',
                        sampleAnswer: q.correctAnswer || '',
                        options: sameType ? (q.options || []).map((o, oi) => ({
                            id: Date.now() + oi + 1,
                            text: o.content || '',
                            isCorrect: !!o.isCorrect,
                        })) : existing.options,
                    };
                }));
                toast.success('Sual AI ilə dolduruldu');
            } else {
                // Free mode: add as new question
                const isMain = !aiModal.section || aiModal.section === examConfig.subject;
                const newQ = {
                    id: Date.now().toString(),
                    type: frontendType,
                    text: q.content || '',
                    points: q.points ?? 1,
                    orderIndex: nextOrderIndex(),
                    subjectGroup: isMain ? null : aiModal.section,
                    options: (q.options || []).map((o, oi) => ({
                        id: Date.now() + oi + 1,
                        text: o.content || '',
                        isCorrect: !!o.isCorrect,
                    })),
                    matchingPairs: [],
                    sampleAnswer: q.correctAnswer || '',
                };
                setQuestions(prev => [...prev, newQ]);
                toast.success('AI sual əlavə edildi');
            }
            // Update usage after successful generation
            try {
                const { data: usageData } = await api.get('/ai/usage');
                setAiUsage(usageData);
            } catch {}
            setAiModal(null);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'AI sual yaradılmadı. Yenidən cəhd edin.';
            toast.error(errMsg);
        } finally {
            setAiLoading(false);
        }
    };

    // Tracks the backend ID of the draft (for new exams created silently via auto-save)
    const createdIdRef = useRef(isEditMode ? id : null);
    const autoSaveTimerRef = useRef(null);

    useEffect(() => {
        if (isEditMode) fetchExamData();
    }, [id]);

    useEffect(() => {
        api.get('/subjects/meta').then(res => setSubjectsList(res.data)).catch(() => {});
    }, []);

    // On new template exam: load section data from navigation state
    useEffect(() => {
        if (!isEditMode && initialLocationState.type === 'template') {
            const sds = initialLocationState.sectionsData;
            if (sds && sds.length >= 2) {
                setTemplateSections(sds);
                setSelectedSectionIds(sds.map(s => s.id));
                let orderIdx = 0;
                const allQuestions = [], allPassages = [];
                sds.forEach(sd => {
                    const built = buildFromTypeCounts(sd.typeCounts || [], sd.subjectName, orderIdx);
                    allQuestions.push(...built.questions);
                    allPassages.push(...built.passages);
                    orderIdx += built.questions.length + built.passages.length;
                });
                setQuestions(allQuestions);
                setPassages(allPassages);
                setExamConfig(prev => ({
                    ...prev,
                    subject: sds[0].subjectName,
                    extraSubjects: sds.slice(1).map(s => s.subjectName),
                    title: prev.title || `${sds.map(s => s.subjectName).join(' + ')} - İmtahan`,
                }));
            } else if (initialLocationState.sectionData) {
                const sd = initialLocationState.sectionData;
                setTemplateInfo(sd);
                setSelectedSectionId(sd.id);
                setSelectedSectionIds([sd.id]);
                const built = buildFromTypeCounts(sd.typeCounts || []);
                setQuestions(built.questions);
                setPassages(built.passages);
                setExamConfig(prev => ({
                    ...prev,
                    title: prev.title || `${sd.subjectName || 'Şablon'} - ${sd.subtitleName || sd.name || 'İmtahan'}`,
                }));
            } else if (sds && sds.length === 1) {
                const sd = sds[0];
                setTemplateInfo(sd);
                setSelectedSectionId(sd.id);
                setSelectedSectionIds([sd.id]);
                const built = buildFromTypeCounts(sd.typeCounts || []);
                setQuestions(built.questions);
                setPassages(built.passages);
                setExamConfig(prev => ({
                    ...prev,
                    title: prev.title || `${sd.subjectName || 'Şablon'} - İmtahan`,
                }));
            }
        }
    }, []);

    // On new olimpiyada exam: load section data and assign points from pointGroups
    useEffect(() => {
        if (!isEditMode && initialLocationState.type === 'olimpiyada') {
            const sds = initialLocationState.sectionsData;
            if (sds && sds.length >= 2) {
                setTemplateSections(sds);
                setSelectedSectionIds(sds.map(s => s.id));
                let globalOrderIdx = 0;
                const allQuestions = [], allPassages = [];
                sds.forEach(sd => {
                    const standaloneTypes = (sd.typeCounts || []).filter(tc => !tc.passageType);
                    const qs = buildQuestionsWithPointGroups(standaloneTypes, sd.pointGroups, globalOrderIdx)
                        .map(q => ({ ...q, subjectGroup: sd.subjectName }));
                    allQuestions.push(...qs);
                    globalOrderIdx += qs.length;
                    const { passages: ps } = buildFromTypeCounts(
                        (sd.typeCounts || []).filter(tc => tc.passageType), sd.subjectName, globalOrderIdx
                    );
                    allPassages.push(...ps);
                    globalOrderIdx += ps.length;
                });
                setQuestions(allQuestions);
                setPassages(allPassages);
                setExamConfig(prev => ({
                    ...prev,
                    subject: sds[0].subjectName,
                    extraSubjects: sds.slice(1).map(s => s.subjectName),
                    title: prev.title || `${sds.map(s => s.subjectName).join(' + ')} - Olimpiada`,
                }));
            } else if (initialLocationState.sectionData) {
                const sd = initialLocationState.sectionData;
                setTemplateInfo(sd);
                setSelectedSectionId(sd.id);
                setSelectedSectionIds([sd.id]);
                const standaloneTypes = (sd.typeCounts || []).filter(tc => !tc.passageType);
                const qs = buildQuestionsWithPointGroups(standaloneTypes, sd.pointGroups);
                const { passages: ps } = buildFromTypeCounts((sd.typeCounts || []).filter(tc => tc.passageType), null, qs.length);
                setQuestions(qs);
                setPassages(ps);
                setExamConfig(prev => ({
                    ...prev,
                    title: prev.title || `${sd.subjectName || 'Olimpiada'} - İmtahan`,
                }));
            } else if (sds && sds.length === 1) {
                const sd = sds[0];
                setTemplateInfo(sd);
                setSelectedSectionId(sd.id);
                setSelectedSectionIds([sd.id]);
                const standaloneTypes = (sd.typeCounts || []).filter(tc => !tc.passageType);
                const qs = buildQuestionsWithPointGroups(standaloneTypes, sd.pointGroups);
                const { passages: ps } = buildFromTypeCounts((sd.typeCounts || []).filter(tc => tc.passageType), null, qs.length);
                setQuestions(qs);
                setPassages(ps);
                setExamConfig(prev => ({
                    ...prev,
                    title: prev.title || `${sd.subjectName || 'Olimpiada'} - İmtahan`,
                }));
            }
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
            if (type !== 'template' && type !== 'olimpiyada' && (!examConfig.title || !examConfig.title.trim())) return;
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
                tags: data.tags || [], description: data.description || '',
                explanationVideoUrl: data.explanationVideoUrl || ''
            });
            setType(data.examType === 'OLIMPIYADA' ? 'olimpiyada' : data.examType.toLowerCase());
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
            if (data.templateSectionIds?.length >= 2) {
                // Multi-section template: load all sections
                setSelectedSectionIds(data.templateSectionIds);
                Promise.all(data.templateSectionIds.map(sid => api.get(`/templates/sections/${sid}`).then(r => r.data)))
                    .then(secs => {
                        setTemplateSections(secs.map(sec => ({
                            id: sec.id,
                            templateTitle: sec.templateTitle,
                            templateSubtitle: sec.subtitleName,
                            subjectName: sec.subjectName,
                            questionCount: sec.questionCount,
                            formula: sec.formula,
                            typeCounts: sec.typeCounts || [],
                            allowCustomPoints: sec.allowCustomPoints,
                        })));
                    }).catch(() => {});
            } else if (data.templateSectionId) {
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
                reviewStatus: q.reviewStatus || null,
                reviewComment: q.reviewComment || null,
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

    const handleAddTemplateSectionFromPicker = async (section) => {
        // section: TemplateSectionResponse from API
        const { id: secId, subjectName, pointGroups, typeCounts, formula } = section;
        if ((examConfig.extraSubjects || []).includes(subjectName) || subjectName === examConfig.subject) {
            toast.error(`${subjectName} artıq əlavədir`);
            return;
        }
        const isOlimp = type === 'olimpiyada';
        const allOrderIndices = [
            ...questions.map(q => q.orderIndex ?? 0),
            ...passages.map(p => p.orderIndex ?? 0),
        ];
        const startIdx = allOrderIndices.length > 0 ? Math.max(...allOrderIndices) + 1 : 0;
        let newQs, newPs;
        if (isOlimp) {
            const standaloneTypes = (typeCounts || []).filter(tc => !tc.passageType);
            newQs = buildQuestionsWithPointGroups(standaloneTypes, pointGroups, startIdx)
                .map(q => ({ ...q, subjectGroup: subjectName }));
            const { passages: ps } = buildFromTypeCounts(
                (typeCounts || []).filter(tc => tc.passageType), subjectName, startIdx + newQs.length
            );
            newPs = ps;
        } else {
            const built = buildFromTypeCounts(typeCounts || [], subjectName, startIdx);
            newQs = built.questions;
            newPs = built.passages;
        }

        const secInfo = {
            id: secId,
            templateTitle: section.templateTitle || '',
            templateSubtitle: section.subtitleName || '',
            subjectName,
            questionCount: section.questionCount,
            formula,
            typeCounts: typeCounts || [],
            pointGroups: pointGroups || null,
        };
        setTemplateSections(prev => [...prev, secInfo]);
        setSelectedSectionIds(prev => [...prev, secId]);
        setQuestions(prev => [...prev, ...newQs]);
        setPassages(prev => [...prev, ...newPs]);
        setExamConfig(prev => ({ ...prev, extraSubjects: [...(prev.extraSubjects || []), subjectName] }));
        setAddSectionModal(null);
        toast.success(`${subjectName} bölməsi əlavə edildi`);
    };

    const handleRemoveSection = (subjectName) => {
        if (type === 'template' || type === 'olimpiyada') {
            // In template/olimpiyada mode: delete questions and update template section lists
            setQuestions(prev => prev.filter(q => q.subjectGroup !== subjectName));
            setPassages(prev => prev.filter(p => p.subjectGroup !== subjectName));
            setTemplateSections(prev => prev.filter(s => s.subjectName !== subjectName));
            setSelectedSectionIds(prev => {
                const sec = templateSections.find(s => s.subjectName === subjectName);
                return sec ? prev.filter(id => id !== sec.id) : prev;
            });
        } else {
            // In free mode: move questions back to main section
            setQuestions(prev => prev.map(q => q.subjectGroup === subjectName ? { ...q, subjectGroup: null } : q));
            setPassages(prev => prev.map(p => p.subjectGroup === subjectName ? { ...p, subjectGroup: null } : p));
        }
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
        setQuestions(prev => prev.map(q => q.id === qId ? updatedData : q));
    };

    const handleDeleteQuestion = (qId) => {
        setQuestions(prev => prev.filter(q => q.id !== qId));
    };

    const handleBatchPdfComplete = (payload) => {
        const isMain = !batchPdfSection || batchPdfSection === examConfig.subject;
        const _isLocked = (type === 'template' || type === 'olimpiyada') && (templateInfo !== null || templateSections.length >= 2);

        // Payload shape: { crops: [{id, questionImage, options:[{label,image}]}], optionCount: 3|4|5, cropMode: 'simple'|'advanced', optionTextMode: 'label'|'empty' }
        // Backward compat: plain string[] (single-image old format)
        const isNewFormat = payload && typeof payload === 'object' && !Array.isArray(payload) && 'crops' in payload;
        const crops = isNewFormat ? payload.crops : (Array.isArray(payload) ? payload.map(img => ({ questionImage: img, options: [] })) : []);
        const optionCount = isNewFormat ? (payload.optionCount || 5) : 5;
        const cropMode = isNewFormat ? (payload.cropMode || 'simple') : 'simple';
        // Default to 'empty' so PDF-imported questions don't pre-fill each
        // option with "A variantı / B variantı". The letter pill rendered by
        // the option UI already makes the variant identity clear; the extra
        // placeholder text was visual noise.
        const optionTextMode = isNewFormat ? (payload.optionTextMode || 'empty') : 'empty';

        const ALL_OPT = ['A', 'B', 'C', 'D', 'E'];
        const activeLabels = ALL_OPT.slice(0, optionCount);

        const buildOptions = (optionCrops, existingOptions) => {
            if (cropMode === 'advanced' && optionCrops && optionCrops.length > 0) {
                const base = existingOptions && existingOptions.length >= optionCount
                    ? existingOptions.slice(0, optionCount).map(o => ({ ...o }))
                    : activeLabels.map((lbl, i) => ({
                        id: `opt-${lbl}-${Date.now()}-${i}`,
                        text: optionTextMode === 'label' ? lbl + ' variantı' : '', isCorrect: false, attachedImage: null
                    }));
                optionCrops.forEach(({ label, image }) => {
                    const i = activeLabels.indexOf(label);
                    if (i !== -1 && base[i]) base[i] = { ...base[i], attachedImage: image };
                });
                return base;
            }
            if (existingOptions && existingOptions.length >= optionCount) {
                return existingOptions.slice(0, optionCount).map(o => ({ ...o }));
            }
            return activeLabels.map((lbl, i) => ({
                id: `opt-${lbl}-${Date.now()}-${i}`,
                text: optionTextMode === 'label' ? lbl + ' variantı' : '', isCorrect: false, attachedImage: null,
            }));
        };

        if (_isLocked) {
            const emptySlots = questions.filter(q => {
                const inSection = isMain
                    ? (q.subjectGroup == null || q.subjectGroup === batchPdfSection)
                    : q.subjectGroup === batchPdfSection;
                return inSection && !q.text?.trim() && !q.attachedImage;
            });
            const toFill = Math.min(crops.length, emptySlots.length);
            if (toFill === 0) {
                toast.error('Bu bölmədə doldurulacaq boş sual yoxdur');
                setBatchPdfSection(null);
                return;
            }
            setQuestions(prev => {
                const updated = [...prev];
                for (let i = 0; i < toFill; i++) {
                    const idx = updated.findIndex(q => q.id === emptySlots[i].id);
                    if (idx !== -1) {
                        updated[idx] = {
                            ...updated[idx],
                            text: 'Şəklə əsasən cavabı qeyd edin',
                            attachedImage: crops[i].questionImage,
                            options: buildOptions(crops[i].options, updated[idx].options),
                        };
                    }
                }
                return updated;
            });
            setBatchPdfSection(null);
            toast.success(`${toFill} sual dolduruldu${crops.length > emptySlots.length ? ` (${crops.length - toFill} artıq idi)` : ''}`);
            return;
        }
        const startIdx = nextOrderIndex();
        const newQuestions = crops.map((crop, idx) => ({
            id: `batch-${Date.now()}-${idx}`, type: 'MULTIPLE_CHOICE',
            text: 'Şəklə əsasən cavabı qeyd edin', points: 1,
            attachedImage: crop.questionImage,
            orderIndex: startIdx + idx,
            subjectGroup: isMain ? null : batchPdfSection,
            options: buildOptions(crop.options, null),
        }));
        setQuestions([...questions, ...newQuestions]);
        setBatchPdfSection(null);
        toast.success(`${crops.length} yeni sual əlavə edildi`);
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
        setPassages(prev => prev.map(p => p.id === pId ? updatedData : p));
    };

    const handleDeletePassage = (pId) => {
        setPassages(prev => prev.filter(p => p.id !== pId));
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
        setPassages(prev => prev.map(p => p.id === pId
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
            explanationVideoUrl: (cfg.explanationVideoUrl && cfg.explanationVideoUrl.trim()) ? cfg.explanationVideoUrl.trim() : null,
            subjects: cfg.subject ? [cfg.subject, ...(cfg.extraSubjects || [])] : [],
            visibility: cfg.visibility || 'PUBLIC',
            examType: type === 'free' ? 'FREE' : type === 'olimpiyada' ? 'OLIMPIYADA' : 'TEMPLATE',
            status,
            durationMinutes: duration,
            tags: cfg.tags || [],
            templateSectionId: (type === 'template' || type === 'olimpiyada') ? (selectedSectionId || (selectedSectionIds.length > 0 ? selectedSectionIds[0] : null)) : null,
            templateSectionIds: (type === 'template' || type === 'olimpiyada') && selectedSectionIds.length > 1 ? selectedSectionIds : null,
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
            if (!error._handled) toast.error(error.message || 'Əməliyyat uğursuz oldu', { id: loadId });
        }
    };

    // Step 1: validate questions, then open settings modal
    const handlePublish = () => {
        if (questions.length === 0 && passages.length === 0) {
            toast.error('İmtahana ən azı bir sual əlavə edilməlidir');
            return;
        }

        // Build ordered list matching UI numbering: section order, then orderIndex within section
        const subjectsList = [examConfig.subject, ...(examConfig.extraSubjects || [])];
        const orderedQs = [];
        subjectsList.forEach((sub, si) => {
            const isMain = si === 0;
            const sectionItems = [
                ...questions
                    .filter(q => isMain ? (q.subjectGroup == null || q.subjectGroup === sub) : q.subjectGroup === sub)
                    .map(q => ({ kind: 'question', data: q, orderIndex: q.orderIndex ?? 0 })),
                ...passages
                    .filter(p => isMain ? (p.subjectGroup == null || p.subjectGroup === sub) : p.subjectGroup === sub)
                    .map(p => ({ kind: 'passage', data: p, orderIndex: p.orderIndex ?? 0 }))
            ].sort((a, b) => a.orderIndex - b.orderIndex);
            sectionItems.forEach(item => {
                if (item.kind === 'question') {
                    orderedQs.push(item.data);
                } else {
                    (item.data.questions || []).forEach(pq => orderedQs.push(pq));
                }
            });
        });

        for (let i = 0; i < orderedQs.length; i++) {
            const q = orderedQs[i];
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

        // Open settings modal so user can review/edit params before publishing
        setIsSettingsOpen(true);
    };

    // Step 2: called from settings modal "Yayımla" button with final config
    const handlePublishConfirm = async (configFromModal) => {
        if (!configFromModal.title) {
            toast.error('İmtahanın adını qeyd edin');
            setIsSettingsOpen(true);
            return;
        }

        let configToSend = configFromModal;
        if (!hasPermission('selectExamDuration') && configFromModal.duration) {
            configToSend = { ...configFromModal, duration: 0 };
        }
        setExamConfig(configToSend);

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
            if (!error._handled) toast.error(error.response?.data?.message || error.message || 'Əməliyyat uğursuz oldu', { id: loadId });
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
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu', { id: loadId });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--paper-cream)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    const isTemplateMode = type === 'template';
    const isOlimpiyadaMode = type === 'olimpiyada';
    const isMultiSectionTemplate = templateSections.length >= 2;
    const isQuestionCountLocked = (isTemplateMode || isOlimpiyadaMode) && (templateInfo !== null || isMultiSectionTemplate);

    // Per-section lock: a subject is template-bound (locked count, AI/Bazadan flow) when
    // it matches one of the exam's template section references — regardless of the overall
    // examType. This is what makes a hybrid collab parent (examType=FREE because mixed,
    // but Azərbaycan-dili came from a template section) still lock Azərbaycan-dili while
    // leaving truly free subjects unlocked. Free exams have no template refs at all →
    // returns false → existing free behaviour preserved.
    const isSectionLocked = (subjectName) => {
        if (templateSections.some(s => s.subjectName === subjectName)) return true;
        if (templateInfo && templateInfo.subjectName === subjectName) return true;
        return false;
    };

    // Returns the template-section descriptor (id, subjectName, questionCount, formula,
    // allowCustomPoints) for a given subject, or null when the subject is free-form. Lets
    // the section header surface ŞABLON metadata (count cap, formula) inline.
    const getTemplateSectionFor = (subjectName) => {
        if (!isTemplateMode && !isOlimpiyadaMode) return null;
        if (isMultiSectionTemplate) {
            return templateSections.find(s => s.subjectName === subjectName) || null;
        }
        if (templateInfo && templateInfo.subjectName === subjectName) return templateInfo;
        return null;
    };

    // Hide the points input for a subject when its template section explicitly disallows
    // custom points. Mirrors isSectionLocked — driven by per-subject template refs, not by
    // the exam's overall mode. Olimpiada flow keeps its own pointsReadOnly path.
    const sectionHidesPoints = (subjectName) => {
        if (isOlimpiyadaMode) return false;
        const sec = templateSections.find(s => s.subjectName === subjectName)
                  || (templateInfo && templateInfo.subjectName === subjectName ? templateInfo : null);
        return sec ? sec.allowCustomPoints === false : false;
    };

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
        <div className="min-h-screen pb-24" style={{ background: 'var(--paper-cream)' }}>
            {/* Top Toolbar */}
            <div className="bg-white border-b border-[var(--ink-150)] sticky top-0 z-10 shadow-[var(--sh-sm)]">
                <div className="container-main py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={goBack} className="p-2 text-[var(--ink-500)] hover:text-[var(--ink-800)] hover:bg-[var(--ink-100)] rounded-xl transition-colors" title="Geri qayıt">
                            <HiOutlineArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-[17px] md:text-[19px] font-extrabold text-[var(--ink-900)] tracking-tight max-w-xl truncate">
                                {examConfig.title || (isEditMode ? 'İmtahan Redaktə Edilir' : 'Yeni İmtahan Yaradılır')}
                            </h1>
                            <div className="flex items-center gap-2 text-[12px] text-[var(--ink-500)] mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${isOlimpiyadaMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[var(--primary-soft)] text-[var(--primary-hover)] border border-[var(--brand-blue-100)]'}`}>{{ free: 'Sərbəst', template: 'Şablon', olimpiyada: 'Olimpiada' }[type] || type}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-[var(--ink-300)]" />
                                <span className="font-medium text-[var(--ink-600)]">{examConfig.subject}</span>
                                {examConfig.duration && <><span className="w-0.5 h-0.5 rounded-full bg-[var(--ink-300)]" /><span>{examConfig.duration} dəq</span></>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => isCollaborativeMode ? null : setIsSettingsOpen(true)}
                            disabled={isCollaborativeMode}
                            title={isCollaborativeMode ? 'Parametrləri yalnız admin dəyişə bilər' : 'Parametrlər'}
                            className={`h-10 px-4 inline-flex items-center gap-2 font-semibold rounded-full text-[13px] transition-colors ${
                                isCollaborativeMode
                                    ? 'bg-[var(--ink-50)] text-[var(--ink-300)] cursor-not-allowed border border-[var(--ink-150)]'
                                    : 'bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] text-[var(--ink-800)]'
                            }`}
                        >
                            <HiOutlineCog className="w-4.5 h-4.5" />
                            <span className="hidden sm:inline">Parametrlər</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="container-main mt-8 max-w-4xl">
                {/* Collaborative parent banner (admin editing the main exam) */}
                {isCollaborativeParent && (
                    <div className="mb-6 bg-[var(--brand-green-50)] border border-[var(--brand-green-200)] rounded-3xl px-5 md:px-6 py-4 flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-white text-[var(--brand-green-600)] border border-[var(--brand-green-200)] flex items-center justify-center shrink-0">
                            <HiOutlineUserGroup className="w-4.5 h-4.5" />
                        </span>
                        <div>
                            <p className="font-extrabold text-[14px] text-[var(--brand-green-700)] tracking-tight">Birgə İmtahan — Admin Redaktəsi</p>
                            <p className="text-[12.5px] text-[var(--brand-green-700)]/80 mt-1 leading-relaxed">
                                Bu imtahana müəllimlər də sual əlavə edir. Siz birbaşa sual, fənn və parametr əlavə edə bilərsiniz.
                                Müəllimlərin göndərdiyi suallar admin panelindən təsdiq edildikdə avtomatik əlavə olunur.
                            </p>
                        </div>
                    </div>
                )}

                {/* Collaborative mode banner */}
                {isCollaborativeMode && (
                    <div className={`mb-6 rounded-3xl px-5 md:px-6 py-4 border ${examStatus === 'SUBMITTED' ? 'bg-amber-50 border-amber-200' : 'bg-[var(--primary-soft)] border-[var(--brand-blue-200)]'}`}>
                        <div className="flex items-start gap-3">
                            <span className={`w-9 h-9 rounded-xl bg-white border flex items-center justify-center shrink-0 ${examStatus === 'SUBMITTED' ? 'text-amber-600 border-amber-200' : 'text-[var(--primary)] border-[var(--brand-blue-200)]'}`}>
                                <HiOutlineUserGroup className="w-4.5 h-4.5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-extrabold text-[14px] tracking-tight ${examStatus === 'SUBMITTED' ? 'text-amber-800' : 'text-[var(--primary-hover)]'}`}>
                                    {examStatus === 'SUBMITTED' ? 'Göndərildi — Admin yoxlayır' : 'Birgə İmtahan Workspace'}
                                </p>
                                {collaborativeTemplateSections.length > 0 ? (
                                    <div className="mt-2.5 flex flex-col gap-2">
                                        {collaborativeTemplateSections.map(sec => {
                                            const filled = questions.filter(q => q.subjectGroup === sec.subjectName && q.text?.trim()).length;
                                            const pct = sec.questionCount > 0 ? Math.round((filled / sec.questionCount) * 100) : 0;
                                            return (
                                                <div key={sec.id}>
                                                    <div className="flex items-center justify-between text-[12px] mb-1">
                                                        <span className={`font-bold ${examStatus === 'SUBMITTED' ? 'text-amber-700' : 'text-[var(--primary-hover)]'}`}>{sec.subjectName}</span>
                                                        <span className={`${examStatus === 'SUBMITTED' ? 'text-amber-600' : 'text-[var(--primary)]'}`}>{filled}/{sec.questionCount} sual</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-[var(--brand-green-600)]' : examStatus === 'SUBMITTED' ? 'bg-amber-400' : 'bg-[var(--primary)]'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : collaborativeSubjects.length > 0 && (
                                    <p className={`text-[12px] mt-1 ${examStatus === 'SUBMITTED' ? 'text-amber-600' : 'text-[var(--primary)]'}`}>
                                        Sizin fənnlər: {collaborativeSubjects.join(', ')}
                                    </p>
                                )}
                                {examStatus === 'SUBMITTED' && (
                                    <p className="text-[12px] text-amber-600 mt-1.5">Admin təsdiq etdikdən sonra suallar əsl imtahana əlavə ediləcək.</p>
                                )}
                            </div>
                            {examStatus === 'SUBMITTED' && (
                                <HiOutlineCheckCircle className="w-5 h-5 text-amber-500 ml-auto shrink-0" />
                            )}
                        </div>
                    </div>
                )}

                {/* Template info banner — multi-section */}
                {isTemplateMode && isMultiSectionTemplate && (
                    <div className="mb-6 bg-[var(--primary-soft)] border border-[var(--brand-blue-200)] rounded-3xl px-5 md:px-6 py-4">
                        <div className="text-[10.5px] font-bold text-[var(--primary)] uppercase tracking-[0.1em] mb-3">
                            {templateSections[0]?.templateTitle} · {templateSections[0]?.templateSubtitle} · Çox Fənli Şablon
                        </div>
                        <div className="flex flex-col gap-2">
                            {templateSections.map(sec => (
                                <div key={sec.id} className="flex flex-wrap items-center justify-between gap-2 bg-white/70 border border-[var(--brand-blue-100)] rounded-2xl px-3 py-2">
                                    <span className="font-bold text-[var(--primary-hover)] text-[13.5px]">{sec.subjectName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11.5px] font-bold text-[var(--primary-hover)] bg-[var(--primary-soft)] border border-[var(--brand-blue-100)] px-2.5 py-0.5 rounded-full">
                                            {sec.questionCount} sual (sabit)
                                        </span>
                                        <code className="text-[11px] font-mono text-[var(--primary)] bg-white border border-[var(--brand-blue-200)] px-2 py-0.5 rounded-lg">{sec.formula}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Template info banner — single section (read-only) */}
                {isTemplateMode && templateInfo && !isMultiSectionTemplate && (
                    <div className="mb-6 bg-[var(--primary-soft)] border border-[var(--brand-blue-200)] rounded-3xl px-5 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-[10.5px] font-bold text-[var(--primary)] uppercase tracking-[0.1em]">
                                {templateInfo.templateTitle} · {templateInfo.templateSubtitle}
                            </div>
                            <div className="mt-0.5 font-extrabold text-[var(--primary-hover)] text-[15px] tracking-tight">{templateInfo.subjectName}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-[var(--primary-hover)] text-[12px] font-bold bg-white border border-[var(--brand-blue-200)] px-3 py-1 rounded-full">
                                <HiOutlineInformationCircle className="w-4 h-4" />
                                {templateInfo.questionCount} sual (sabit)
                            </span>
                            <code className="text-[11px] font-mono text-[var(--primary)] bg-white border border-[var(--brand-blue-200)] px-2.5 py-1 rounded-lg">{templateInfo.formula}</code>
                        </div>
                    </div>
                )}

                {/* Olimpiyada info banner — multi-section */}
                {isOlimpiyadaMode && isMultiSectionTemplate && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-3xl px-5 md:px-6 py-4">
                        <div className="text-[10.5px] font-bold text-amber-600 uppercase tracking-[0.1em] mb-3">
                            {templateSections[0]?.templateTitle} · {templateSections[0]?.templateSubtitle} · Olimpiada Şablonu
                        </div>
                        <div className="flex flex-col gap-2">
                            {templateSections.map(sec => (
                                <div key={sec.id} className="flex flex-wrap items-center justify-between gap-2 bg-white/70 border border-amber-100 rounded-2xl px-3 py-2">
                                    <span className="font-bold text-amber-800 text-[13.5px]">{sec.subjectName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11.5px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                                            {sec.questionCount} sual (sabit)
                                        </span>
                                        <code className="text-[11px] font-mono text-amber-600 bg-white border border-amber-200 px-2 py-0.5 rounded-lg">{sec.formula}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[12px] text-amber-700 mt-3">Hər sualın balı şablon tərəfindən avtomatik təyin edilib (dəyişdirilə bilməz)</p>
                    </div>
                )}

                {/* Olimpiyada info banner — single section */}
                {isOlimpiyadaMode && templateInfo && !isMultiSectionTemplate && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-3xl px-5 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-[10.5px] font-bold text-amber-600 uppercase tracking-[0.1em]">
                                {templateInfo.templateTitle} · {templateInfo.templateSubtitle} · Olimpiada
                            </div>
                            <div className="mt-0.5 font-extrabold text-amber-800 text-[15px] tracking-tight">{templateInfo.subjectName}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-amber-700 text-[12px] font-bold bg-white border border-amber-200 px-3 py-1 rounded-full">
                                <HiOutlineInformationCircle className="w-4 h-4" />
                                {templateInfo.questionCount} sual (sabit)
                            </span>
                            <code className="text-[11px] font-mono text-amber-600 bg-white border border-amber-200 px-2.5 py-1 rounded-lg">{templateInfo.formula}</code>
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
                                <div
                                    className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full shadow-[var(--sh-sm)]"
                                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}
                                >
                                    <HiOutlineBookOpen className="w-4 h-4" />
                                    <span className="font-bold text-[13px] tracking-tight">{sectionSubject}</span>
                                </div>
                                <div className="flex-1 h-px bg-[var(--ink-150)]" />
                                {!isMain && !isCollaborativeMode && (
                                    <button
                                        onClick={() => handleRemoveSection(sectionSubject)}
                                        className="p-1.5 text-[var(--ink-400)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                                                            hidePoints={sectionHidesPoints(sectionSubject)}
                                                            hideDelete={isSectionLocked(sectionSubject)}
                                                            // Şablon-bağlı section: bal və sual tipi şablonla təyin olunur,
                                                            // müəllim onları dəyişə bilməz — sadəcə oxuya bilər.
                                                            pointsReadOnly={isOlimpiyadaMode || isSectionLocked(sectionSubject)}
                                                            typeReadOnly={isSectionLocked(sectionSubject)}
                                                        />
                                                        {isSectionLocked(sectionSubject) && (
                                                            <div className="mt-2 flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setBankPicker({ section: sectionSubject, replaceId: item.data.id, filterType: item.data.type })}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white font-semibold rounded-full transition-colors text-[11.5px] ${
                                                                        isOlimpiyadaMode
                                                                            ? 'border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-700'
                                                                            : 'border border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)]'
                                                                    }`}
                                                                >
                                                                    <HiOutlineBookOpen className="w-3.5 h-3.5" />
                                                                    Bazadan seç
                                                                </button>
                                                                {(hasPermission('useAiExamGeneration') || (subscription?.plan?.monthlyAiQuestionLimit && subscription.plan.monthlyAiQuestionLimit !== 0) || isAdmin) && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const qType = item.data.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
                                                                                item.data.type === 'MULTI_SELECT' ? 'MULTI_SELECT' :
                                                                                item.data.type === 'OPEN_AUTO' ? 'OPEN_AUTO' :
                                                                                item.data.type === 'FILL_IN_THE_BLANK' ? 'FILL_IN_THE_BLANK' : 'MCQ';
                                                                            setAiForm({ topic: '', difficulty: 'MEDIUM', questionType: qType });
                                                                            setAiTopics([]);
                                                                            setAiUsage(null);
                                                                            setAiModal({ section: sectionSubject, replaceId: item.data.id, lockedQuestionType: qType });
                                                                            setAiTopicsLoading(true);
                                                                            try {
                                                                                const [topicsRes, usageRes] = await Promise.all([
                                                                                    api.get('/subjects/topics', { params: { name: sectionSubject } }),
                                                                                    api.get('/ai/usage'),
                                                                                ]);
                                                                                setAiTopics(topicsRes.data);
                                                                                setAiUsage(usageRes.data);
                                                                            } catch { setAiTopics([]); } finally { setAiTopicsLoading(false); }
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] text-[var(--brand-green-700)] font-semibold rounded-full transition-colors text-[11.5px]"
                                                                    >
                                                                        <HiOutlineSparkles className="w-3.5 h-3.5" />
                                                                        AI ilə doldur
                                                                    </button>
                                                                )}
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
                                                        isQuestionCountLocked={isSectionLocked(sectionSubject)}
                                                        hidePoints={sectionHidesPoints(sectionSubject)}
                                                    />
                                                );
                                            }
                                        });
                                    })()}
                                </div>
                            )}

                            {/* Template mode: single PDF fill button at section bottom */}
                            {isSectionLocked(sectionSubject) && (
                                <div className="mt-2 mb-2">
                                    <div className="relative inline-block">
                                        <input type="file" accept="application/pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => { const file = e.target.files[0]; if (file) { setBatchPdfSection(sectionSubject); setBatchPdfFile(file); setIsBatchPdfOpen(true); } e.target.value = null; }} />
                                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-[var(--ink-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--ink-600)] hover:text-[var(--primary-hover)] font-semibold rounded-2xl transition-colors text-[13px]">
                                            <HiOutlineDocumentText className="w-4 h-4" />
                                            PDF-dən doldur
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Add question / PDF / passage buttons for this section */}
                            {!isSectionLocked(sectionSubject) && (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleAddQuestion(sectionSubject)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)] font-semibold rounded-2xl transition-colors text-[13px]"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" />
                                        Sual əlavə et
                                    </button>
                                    <button
                                        onClick={() => hasPermission('addPassageQuestion') ? (setPassageSectionTarget(sectionSubject), setShowPassageTypeModal(true)) : null}
                                        className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-2xl transition-colors text-[13px] ${
                                            hasPermission('addPassageQuestion')
                                                ? 'bg-white border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] text-[var(--brand-green-700)]'
                                                : 'bg-[var(--ink-50)] border-[var(--ink-200)] text-[var(--ink-400)] cursor-not-allowed'
                                        }`}
                                    >
                                        {!hasPermission('addPassageQuestion') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlinePlus className="w-4 h-4" />}
                                        Mətn / Dinləmə
                                    </button>
                                    <div className="relative">
                                        <input type="file" disabled={!hasPermission('importQuestionsFromPdf')} accept="application/pdf" className={`absolute inset-0 w-full h-full opacity-0 ${hasPermission('importQuestionsFromPdf') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            onChange={(e) => { const file = e.target.files[0]; if (file) { setBatchPdfSection(sectionSubject); setBatchPdfFile(file); setIsBatchPdfOpen(true); } e.target.value = null; }} />
                                        <button className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-2xl transition-colors text-[13px] ${
                                            hasPermission('importQuestionsFromPdf')
                                                ? 'bg-white border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)]'
                                                : 'bg-[var(--ink-50)] border-[var(--ink-200)] text-[var(--ink-400)] cursor-not-allowed'
                                        }`}>
                                            {!hasPermission('importQuestionsFromPdf') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlinePlus className="w-4 h-4" />}
                                            PDF-dən suallar əlavə et
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => hasPermission('useQuestionBank') ? setBankPicker({ section: sectionSubject, replaceId: null, filterType: null }) : null}
                                        className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-2xl transition-colors text-[13px] ${
                                            hasPermission('useQuestionBank')
                                                ? 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-700'
                                                : 'bg-[var(--ink-50)] border-[var(--ink-200)] text-[var(--ink-400)] cursor-not-allowed'
                                        }`}
                                    >
                                        {!hasPermission('useQuestionBank') ? <HiLockClosed className="w-4 h-4"/> : <HiOutlineBookOpen className="w-4 h-4" />}
                                        Bazadan əlavə et
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const aiAllowed = hasPermission('useAiExamGeneration') || (subscription?.plan?.monthlyAiQuestionLimit && subscription.plan.monthlyAiQuestionLimit !== 0);
                                            if (!aiAllowed && !isAdmin) return;
                                            setAiForm({ topic: '', difficulty: 'MEDIUM', questionType: 'MCQ' });
                                            setAiTopics([]);
                                            setAiUsage(null);
                                            setAiModal({ section: sectionSubject });
                                            setAiTopicsLoading(true);
                                            try {
                                                const [topicsRes, usageRes] = await Promise.all([
                                                    api.get('/subjects/topics', { params: { name: sectionSubject } }),
                                                    api.get('/ai/usage'),
                                                ]);
                                                setAiTopics(topicsRes.data);
                                                setAiUsage(usageRes.data);
                                            } catch { setAiTopics([]); } finally { setAiTopicsLoading(false); }
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed font-semibold rounded-2xl transition-colors text-[13px] ${
                                            (hasPermission('useAiExamGeneration') || (subscription?.plan?.monthlyAiQuestionLimit && subscription.plan.monthlyAiQuestionLimit !== 0) || isAdmin)
                                                ? 'border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] bg-white text-[var(--brand-green-700)]'
                                                : 'border-[var(--ink-200)] bg-[var(--ink-50)] text-[var(--ink-400)] cursor-not-allowed'
                                        }`}
                                    >
                                        {!(hasPermission('useAiExamGeneration') || (subscription?.plan?.monthlyAiQuestionLimit && subscription.plan.monthlyAiQuestionLimit !== 0) || isAdmin)
                                            ? <HiLockClosed className="w-4 h-4" />
                                            : <HiOutlineSparkles className="w-4 h-4" />}
                                        AI ilə sual yarat
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}


                {/* Add new subject / template section — available in both free and template modes */}
                {!isCollaborativeMode && (
                    <div className="mt-4 mb-8">
                        {showSectionPicker ? (
                            <div className="bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-sm)] p-5">
                                <p className="text-[13px] font-bold text-[var(--ink-800)] mb-3 tracking-tight">Yeni fənn seçin:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-3">
                                    {subjectsList
                                        .filter(s => s.name !== examConfig.subject && !(examConfig.extraSubjects || []).includes(s.name))
                                        .map(s => (
                                            <button
                                                key={s.name}
                                                onClick={() => handleAddSection(s.name)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--ink-200)] text-[12.5px] text-[var(--ink-800)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all"
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || 'var(--primary)' }} />
                                                <span className="truncate">{s.name}</span>
                                            </button>
                                        ))}
                                </div>
                                <button onClick={() => setShowSectionPicker(false)} className="text-[12.5px] text-[var(--ink-500)] hover:text-[var(--ink-800)] font-semibold">Ləğv et</button>
                            </div>
                        ) : (
                            <div className={`flex ${isQuestionCountLocked ? 'gap-3' : ''}`}>
                                <button
                                    onClick={() => hasPermission('multipleSubjects') ? setShowSectionPicker(true) : null}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed font-semibold rounded-3xl transition-colors text-[14px] ${
                                        hasPermission('multipleSubjects')
                                            ? 'bg-white border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)]'
                                            : 'bg-[var(--ink-50)] border-[var(--ink-200)] text-[var(--ink-400)] cursor-not-allowed'
                                    }`}
                                >
                                    {!hasPermission('multipleSubjects') ? <HiLockClosed className="w-5 h-5"/> : <HiOutlinePlus className="w-5 h-5" />}
                                    Yeni fənn əlavə et {!hasPermission('multipleSubjects') && <span className="text-[11px] font-normal ml-2">(Pro plan tələb olunur)</span>}
                                </button>
                                {isQuestionCountLocked && (
                                    <button
                                        onClick={async () => {
                                            const endpoint = isOlimpiyadaMode ? '/templates/olimpiyada' : '/templates';
                                            setAddSectionModal({ tab: 'template', step: 1, templates: [], selectedTemplate: null, subtitles: [], selectedSubtitle: null, loadingTemplates: true, loadingSubtitles: false });
                                            try {
                                                const { data } = await api.get(endpoint);
                                                setAddSectionModal(prev => ({ ...prev, templates: data, loadingTemplates: false }));
                                            } catch {
                                                setAddSectionModal(prev => ({ ...prev, loadingTemplates: false }));
                                            }
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed font-semibold rounded-3xl transition-colors text-[14px] bg-white border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] text-[var(--brand-green-700)]"
                                    >
                                        <HiOutlineBookOpen className="w-5 h-5" />
                                        Şablondan bölmə əlavə et
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AI Question Generation Modal */}
            {aiModal && (
                <div className="fixed inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] p-7 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 bg-[var(--brand-green-50)] rounded-2xl flex items-center justify-center shrink-0">
                                <HiOutlineSparkles className="w-5 h-5 text-[var(--brand-green-700)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[17px] font-extrabold text-[var(--ink-900)] leading-tight tracking-tight">{aiModal.replaceId ? 'AI ilə doldur' : 'AI ilə sual yarat'}</h3>
                                <p className="text-[11.5px] text-[var(--ink-500)]">Fənn: <span className="font-bold text-[var(--ink-700)]">{aiModal.section}</span></p>
                            </div>
                            {aiUsage && (
                                <div className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full ${
                                    aiUsage.remaining === -1
                                        ? 'bg-[var(--brand-green-50)] text-[var(--brand-green-700)]'
                                        : aiUsage.remaining > 5
                                            ? 'bg-[var(--brand-green-50)] text-[var(--brand-green-700)]'
                                            : aiUsage.remaining > 0
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-700'
                                }`}>
                                    {aiUsage.remaining === -1 ? '∞' : `${aiUsage.remaining} qaldı`}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">Mövzu *</label>
                                {aiTopicsLoading ? (
                                    <div className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--ink-200)] text-[13px] text-[var(--ink-400)] flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 border-2 border-[var(--ink-200)] border-t-[var(--brand-green-600)] rounded-full animate-spin" />
                                        Mövzular yüklənir...
                                    </div>
                                ) : aiTopics.length > 0 ? (
                                    <select
                                        value={aiForm.topic}
                                        onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--ink-200)] focus:ring-2 focus:ring-[var(--brand-green-600)]/30 focus:border-[var(--brand-green-600)] outline-none text-[13px] bg-white"
                                        autoFocus
                                    >
                                        <option value="">Mövzu seçin...</option>
                                        {aiTopics.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}{t.gradeLevel ? ` (${t.gradeLevel})` : ''}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={aiForm.topic}
                                        onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
                                        placeholder="məs. Kvadrat tənliklər, Past Simple..."
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--ink-200)] focus:ring-2 focus:ring-[var(--brand-green-600)]/30 focus:border-[var(--brand-green-600)] outline-none text-[13px]"
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">Çətinlik</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[['EASY', 'Asan'], ['MEDIUM', 'Orta'], ['HARD', 'Çətin']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setAiForm(f => ({ ...f, difficulty: val }))}
                                            className={`py-2 rounded-full text-[12px] font-bold border-2 transition-colors ${
                                                aiForm.difficulty === val
                                                    ? 'border-[var(--brand-green-600)] bg-[var(--brand-green-50)] text-[var(--brand-green-700)]'
                                                    : 'border-[var(--ink-200)] text-[var(--ink-500)] hover:border-[var(--brand-green-200)]'
                                            }`}
                                        >{label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">Sual tipi</label>
                                {aiModal.lockedQuestionType ? (
                                    <div className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--ink-200)] bg-[var(--ink-50)] text-[13px] text-[var(--ink-700)] font-semibold">
                                        {{ MCQ: 'Çoxvariantlı (tək cavab)', MULTI_SELECT: 'Çoxvariantlı (çox cavab)', OPEN_AUTO: 'Açıq sual (avtomatik yoxlama)', FILL_IN_THE_BLANK: 'Boşluq doldurma' }[aiModal.lockedQuestionType] || aiModal.lockedQuestionType}
                                        <span className="ml-2 text-[11px] text-[var(--ink-400)]">(şablon tərəfindən müəyyən edilib)</span>
                                    </div>
                                ) : (
                                    <select
                                        value={aiForm.questionType}
                                        onChange={e => setAiForm(f => ({ ...f, questionType: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[var(--ink-200)] focus:ring-2 focus:ring-[var(--brand-green-600)]/30 focus:border-[var(--brand-green-600)] outline-none text-[13px] bg-white"
                                    >
                                        <option value="MCQ">Çoxvariantlı (tək cavab)</option>
                                        <option value="MULTI_SELECT">Çoxvariantlı (çox cavab)</option>
                                        <option value="OPEN_AUTO">Açıq sual (avtomatik yoxlama)</option>
                                        <option value="FILL_IN_THE_BLANK">Boşluq doldurma</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setAiModal(null)}
                                className="flex-1 h-11 rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13px] hover:bg-[var(--ink-100)] transition-colors"
                            >Ləğv et</button>
                            <button
                                onClick={handleAiGenerate}
                                disabled={aiLoading || !aiForm.topic.trim() || (aiUsage && aiUsage.remaining === 0)}
                                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[var(--brand-green-600)] hover:bg-[var(--brand-green-700)] disabled:bg-[var(--brand-green-300)] disabled:hover:bg-[var(--brand-green-300)] disabled:cursor-not-allowed disabled:shadow-none text-white font-bold text-[13px] transition-colors shadow-[0_8px_24px_-10px_rgba(34,197,94,0.6)]"
                            >
                                {aiUsage && aiUsage.remaining === 0 ? (
                                    <>Aylıq limit bitdi</>
                                ) : aiLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Yaradılır...</>
                                ) : (
                                    <><HiOutlineSparkles className="w-4 h-4" /> Yarat</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Passage Type Selection Modal */}
            {showPassageTypeModal && (
                <div className="fixed inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] p-7 max-w-sm w-full">
                        <h3 className="text-[18px] font-extrabold text-[var(--ink-900)] mb-1 tracking-tight">Keçid tipini seçin</h3>
                        <p className="text-[13px] text-[var(--ink-500)] mb-6">Hansı tip keçid əlavə etmək istəyirsiniz?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleAddPassage('TEXT')} className="flex flex-col items-center gap-3 p-5 border-2 border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-2xl transition-all">
                                <span className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                                    <HiOutlineDocumentText className="w-6 h-6" />
                                </span>
                                <span className="font-extrabold text-[var(--ink-900)] text-[14px] tracking-tight">Mətn</span>
                                <span className="text-[11.5px] text-[var(--ink-500)] text-center">Mətn parçası + suallar</span>
                            </button>
                            <button onClick={() => handleAddPassage('LISTENING')} className="flex flex-col items-center gap-3 p-5 border-2 border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] rounded-2xl transition-all">
                                <span className="w-12 h-12 rounded-2xl bg-[var(--brand-green-50)] text-[var(--brand-green-600)] flex items-center justify-center">
                                    <HiOutlineVolumeUp className="w-6 h-6" />
                                </span>
                                <span className="font-extrabold text-[var(--ink-900)] text-[14px] tracking-tight">Dinləmə</span>
                                <span className="text-[11.5px] text-[var(--ink-500)] text-center">Audio fayl + suallar</span>
                            </button>
                        </div>
                        <button onClick={() => setShowPassageTypeModal(false)} className="mt-6 w-full h-10 rounded-full text-[var(--ink-500)] hover:text-[var(--ink-800)] hover:bg-[var(--ink-100)] font-semibold text-[13px] transition-colors">Ləğv et</button>
                    </div>
                </div>
            )}

            <PdfCropperModal
                isOpen={isBatchPdfOpen} isBatchMode={true} file={batchPdfFile}
                onClose={() => { setIsBatchPdfOpen(false); setBatchPdfFile(null); }}
                onCropComplete={handleBatchPdfComplete}
                maxCrops={(() => {
                    const _locked = (type === 'template' || type === 'olimpiyada') && (templateInfo !== null || templateSections.length >= 2);
                    if (!_locked) return null; // unlimited in free mode
                    const isMain = !batchPdfSection || batchPdfSection === examConfig.subject;
                    return questions.filter(q => {
                        const inSection = isMain
                            ? (q.subjectGroup == null || q.subjectGroup === batchPdfSection)
                            : q.subjectGroup === batchPdfSection;
                        return inSection && !q.text?.trim() && !q.attachedImage;
                    }).length;
                })()}
            />

            <ExamSettingsModal
                isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
                examConfig={examConfig} onSave={setExamConfig}
                onPublish={handlePublishConfirm}
            />

            {/* Bank Picker Modal */}
            {bankPicker && (
                <BankPickerModal
                    filterType={bankPicker.filterType}
                    allowMulti={!bankPicker.replaceId}
                    onSelect={handleBankSelect}
                    onSelectMany={handleBankSelectMany}
                    onClose={() => setBankPicker(null)}
                />
            )}

            {/* Add Template Section Modal */}
            {addSectionModal && (
                <div className="fixed inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] w-full max-w-md flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--ink-150)]">
                            <h3 className="text-[15.5px] font-extrabold text-[var(--ink-900)] tracking-tight">
                                {addSectionModal.step === 1 ? 'Şablon seçin' : addSectionModal.step === 2 ? 'Alt başlıq seçin' : 'Bölmə seçin'}
                            </h3>
                            <button onClick={() => setAddSectionModal(null)} className="p-1.5 text-[var(--ink-400)] hover:text-[var(--ink-700)] hover:bg-[var(--ink-100)] rounded-xl">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4">
                            {addSectionModal.step === 1 && (
                                addSectionModal.loadingTemplates ? (
                                    <div className="flex items-center justify-center py-10 text-[var(--ink-400)] text-[13px]">Yüklənir...</div>
                                ) : (
                                    <div className="space-y-2">
                                        {addSectionModal.templates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={async () => {
                                                    setAddSectionModal(prev => ({ ...prev, selectedTemplate: t, step: 2, subtitles: [], loadingSubtitles: true }));
                                                    try {
                                                        const { data } = await api.get(`/templates/${t.id}/subtitles`);
                                                        setAddSectionModal(prev => ({ ...prev, subtitles: data, loadingSubtitles: false }));
                                                    } catch {
                                                        setAddSectionModal(prev => ({ ...prev, loadingSubtitles: false }));
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--ink-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all"
                                            >
                                                <p className="font-bold text-[var(--ink-800)] text-[13.5px]">{t.title}</p>
                                            </button>
                                        ))}
                                        {addSectionModal.templates.length === 0 && (
                                            <p className="text-[13px] text-[var(--ink-400)] text-center py-8">Şablon tapılmadı</p>
                                        )}
                                    </div>
                                )
                            )}

                            {addSectionModal.step === 2 && (
                                addSectionModal.loadingSubtitles ? (
                                    <div className="flex items-center justify-center py-10 text-[var(--ink-400)] text-[13px]">Yüklənir...</div>
                                ) : (
                                    <div className="space-y-2">
                                        {addSectionModal.subtitles.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setAddSectionModal(prev => ({ ...prev, selectedSubtitle: sub, step: 3 }))}
                                                className="w-full text-left px-4 py-3 rounded-2xl border border-[var(--ink-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all"
                                            >
                                                <p className="font-bold text-[var(--ink-800)] text-[13.5px]">{sub.subtitle}</p>
                                                <p className="text-[11.5px] text-[var(--ink-500)] mt-0.5">{sub.sections?.length || 0} bölmə</p>
                                            </button>
                                        ))}
                                    </div>
                                )
                            )}

                            {addSectionModal.step === 3 && (
                                <div className="space-y-2">
                                    {(addSectionModal.selectedSubtitle?.sections || []).map(sec => {
                                        const alreadyAdded = sec.subjectName === examConfig.subject || (examConfig.extraSubjects || []).includes(sec.subjectName);
                                        return (
                                            <button
                                                key={sec.id}
                                                disabled={alreadyAdded}
                                                onClick={() => handleAddTemplateSectionFromPicker(sec)}
                                                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                                                    alreadyAdded
                                                        ? 'border-[var(--ink-100)] bg-[var(--ink-50)] cursor-not-allowed opacity-50'
                                                        : 'border-[var(--ink-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-[var(--ink-800)] text-[13.5px]">{sec.subjectName}</p>
                                                        <p className="text-[11.5px] text-[var(--ink-500)] mt-0.5">{sec.questionCount} sual · <code className="font-mono text-[var(--ink-700)]">{sec.formula}</code></p>
                                                    </div>
                                                    {alreadyAdded && <span className="text-[11px] text-[var(--ink-400)] shrink-0">Əlavədir</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {addSectionModal.step > 1 && (
                            <div className="px-6 py-4 border-t border-[var(--ink-150)]">
                                <button
                                    onClick={() => setAddSectionModal(prev => ({ ...prev, step: prev.step - 1 }))}
                                    className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-500)] hover:text-[var(--ink-800)] font-semibold"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" /> Geri
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Publish / Submit Button */}
            <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                {autoSaveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-white bg-amber-400 px-3 py-1.5 rounded-full shadow-[var(--sh-sm)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Saxlanılır...
                    </span>
                )}
                {autoSaveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-white bg-[var(--brand-green-600)] px-3 py-1.5 rounded-full shadow-[var(--sh-sm)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        Yadda saxlanıldı
                    </span>
                )}
                {isCollaborativeMode ? (
                    <button
                        onClick={examStatus === 'SUBMITTED' ? undefined : handleSubmitDraft}
                        disabled={examStatus === 'SUBMITTED'}
                        className={`inline-flex items-center gap-2 h-12 px-6 font-bold rounded-full transition-all ${
                            examStatus === 'SUBMITTED'
                                ? 'bg-amber-400 text-white cursor-not-allowed shadow-[0_10px_28px_-10px_rgba(251,191,36,0.55)]'
                                : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white shadow-[0_12px_32px_-10px_rgba(37,99,235,0.65)]'
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
                        className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white font-bold rounded-full shadow-[0_12px_32px_-10px_rgba(37,99,235,0.65)] transition-all"
                    >
                        <HiOutlinePaperAirplane className="w-5 h-5" />
                        {examStatus === 'PUBLISHED' ? 'Yenilə' : 'Yayımla'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ---------- PassageEditor component ----------
const PassageEditor = ({ passage, onChange, onDelete, onAddQuestion, onUpdateQuestion, onDeleteQuestion, hasPermission, questionOffset = 0, isQuestionCountLocked = false, hidePoints = false }) => {
    const audioInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const textEditorRef = useRef(null);
    const [mathModalOpen, setMathModalOpen] = useState(false);

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
        <div className={`rounded-3xl border-2 overflow-hidden shadow-[var(--sh-sm)] ${isText ? 'border-[var(--brand-blue-200)]' : 'border-[var(--brand-green-200)]'}`}>
            {/* Passage header */}
            <div className={`px-5 md:px-6 py-3.5 flex items-center justify-between ${isText ? 'bg-[var(--primary-soft)]' : 'bg-[var(--brand-green-50)]'}`}>
                <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isText ? 'bg-white text-[var(--primary)] border border-[var(--brand-blue-200)]' : 'bg-white text-[var(--brand-green-600)] border border-[var(--brand-green-200)]'}`}>
                        {isText
                            ? <HiOutlineDocumentText className="w-5 h-5" />
                            : <HiOutlineVolumeUp className="w-5 h-5" />}
                    </span>
                    <span className={`font-extrabold text-[12px] uppercase tracking-[0.1em] ${isText ? 'text-[var(--primary-hover)]' : 'text-[var(--brand-green-700)]'}`}>
                        {isText ? 'Mətn Parçası' : 'Dinləmə'}
                    </span>
                </div>
                {!isQuestionCountLocked && (
                    <button onClick={() => onDelete(passage.id)} className="p-1.5 text-[var(--ink-400)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="bg-white p-5 md:p-6 space-y-4">
                {/* Title */}
                <input
                    type="text"
                    value={passage.title}
                    onChange={(e) => onChange(passage.id, { ...passage, title: e.target.value })}
                    placeholder={isText ? 'Mətn başlığı (ixtiyari)' : 'Dinləmə başlığı (ixtiyari)'}
                    className="w-full border border-[var(--ink-200)] rounded-2xl px-4 py-2.5 text-[13.5px] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                />

                {isText ? (
                    <>
                        {/* Text content */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Mətn parçası</label>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setMathModalOpen(true)}
                                    className="text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] hover:bg-[var(--brand-blue-100)] transition-colors"
                                >
                                    fx Riyaziyyat
                                </button>
                            </div>
                            <MathTextEditor
                                ref={textEditorRef}
                                value={passage.textContent || ''}
                                onChange={(val) => onChange(passage.id, { ...passage, textContent: val })}
                                placeholder="Mətn parçasını bura daxil edin."
                                className="w-full px-4 py-3 text-sm min-h-[140px] bg-transparent"
                                showToolbar={true}
                            />
                        </div>
                        <MathFormulaModal
                            isOpen={mathModalOpen}
                            onClose={() => setMathModalOpen(false)}
                            onInsert={(latex) => { textEditorRef.current?.insertMath(latex); setMathModalOpen(false); }}
                        />
                        {/* Image for text passage */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <input ref={imageInputRef} type="file" accept="image/*" disabled={!hasPermission('addImage')} className="hidden" onChange={handleImageUpload} />
                            <button onClick={() => hasPermission('addImage') ? imageInputRef.current.click() : null} className={`text-[13px] font-semibold px-4 py-2 border rounded-full transition-colors inline-flex items-center gap-2 ${hasPermission('addImage') ? 'border-[var(--brand-blue-200)] text-[var(--primary-hover)] hover:bg-[var(--primary-soft)]' : 'border-[var(--ink-200)] text-[var(--ink-400)] cursor-not-allowed bg-[var(--ink-50)]'}`}>
                                {!hasPermission('addImage') ? <HiLockClosed className="w-4 h-4"/> : null}
                                {passage.attachedImage ? 'Şəkli Dəyiş' : '+ Şəkil Əlavə Et'}
                            </button>
                            {passage.attachedImage && (
                                <>
                                    <img src={passage.attachedImage} alt="" className="h-16 rounded-2xl border border-[var(--ink-200)] object-cover" />
                                    <button onClick={() => onChange(passage.id, { ...passage, attachedImage: null })} className="text-red-500 hover:text-red-700 text-[11.5px] font-semibold">Sil</button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Audio upload */}
                        <input ref={audioInputRef} type="file" accept="audio/*" disabled={!hasPermission('addPassageQuestion')} className="hidden" onChange={handleAudioUpload} />
                        <div className="flex flex-col gap-3">
                            <button onClick={() => hasPermission('addPassageQuestion') ? audioInputRef.current.click() : null} className={`flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-2xl transition-colors font-semibold text-[13.5px] ${hasPermission('addPassageQuestion') ? 'border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] text-[var(--brand-green-700)]' : 'border-[var(--ink-200)] bg-[var(--ink-50)] text-[var(--ink-400)] cursor-not-allowed'}`}>
                                {!hasPermission('addPassageQuestion') ? <HiLockClosed className="w-6 h-6"/> : <HiOutlineVolumeUp className="w-6 h-6" />}
                                {passage.audioContent ? 'Audio Faylı Dəyiş' : 'Audio Fayl Yüklə (.mp3, .wav, .ogg)'}
                            </button>
                            {passage.audioContent && (
                                <audio controls src={passage.audioContent} className="w-full rounded-2xl" />
                            )}
                        </div>
                        {/* Listen limit */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="text-[13px] font-bold text-[var(--ink-800)]">Dinləmə limiti:</label>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={passage.listenLimit === null}
                                        onChange={() => onChange(passage.id, { ...passage, listenLimit: null })}
                                        className="accent-[var(--brand-green-600)]"
                                    />
                                    <span className="text-[13px] text-[var(--ink-700)]">Limitsiz</span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={passage.listenLimit !== null}
                                        onChange={() => onChange(passage.id, { ...passage, listenLimit: passage.listenLimit ?? 2 })}
                                        className="accent-[var(--brand-green-600)]"
                                    />
                                    <span className="text-[13px] text-[var(--ink-700)]">Məhdud:</span>
                                </label>
                                {passage.listenLimit !== null && (
                                    <input
                                        type="number" min={1} max={10}
                                        value={passage.listenLimit ?? 2}
                                        onChange={(e) => onChange(passage.id, { ...passage, listenLimit: parseInt(e.target.value) || 1 })}
                                        className="w-16 border border-[var(--ink-200)] rounded-xl px-2 py-1 text-[13px] text-center focus:outline-none focus:border-[var(--brand-green-600)]"
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Questions within this passage */}
            {passage.questions.length > 0 && (
                <div className="bg-[var(--ink-50)] p-4 space-y-4 border-t border-[var(--ink-150)]">
                    {passage.questions.map((q, idx) => (
                        <div key={q.id} className={`pl-4 border-l-4 ${isText ? 'border-[var(--brand-blue-200)]' : 'border-[var(--brand-green-200)]'}`}>
                            <QuestionEditor
                                index={questionOffset + idx}
                                question={q}
                                onChange={(qId, updated) => onUpdateQuestion(passage.id, qId, updated)}
                                onDelete={(qId) => onDeleteQuestion(passage.id, qId)}
                                hideDelete={isQuestionCountLocked}
                                hidePoints={hidePoints}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Add question to this passage — hidden in template mode */}
            {!isQuestionCountLocked && (
                <div className="bg-[var(--ink-50)] px-5 md:px-6 py-4 border-t border-[var(--ink-150)]">
                    <button
                        onClick={() => onAddQuestion(passage.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-2xl text-[13px] font-semibold transition-colors ${isText ? 'border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)]' : 'border-[var(--brand-green-200)] hover:border-[var(--brand-green-600)] hover:bg-[var(--brand-green-50)] text-[var(--brand-green-700)]'}`}
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Bu keçidə sual əlavə et
                    </button>
                </div>
            )}
        </div>
    );
};


export default ExamEditor;
