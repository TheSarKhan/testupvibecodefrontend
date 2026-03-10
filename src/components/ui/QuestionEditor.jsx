import { useState, useRef, useEffect } from 'react';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import PdfCropperModal from './PdfCropperModal';
import MathFormulaModal from './MathFormulaModal';
import MathTextEditor from './MathTextEditor';

// Supported Question Types
const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'Qapalı',
    MULTI_SELECT: 'Çox seçimli',
    OPEN_ENDED: 'Açıq',
    MATCHING: 'Uyğunlaşdırma'
};

const QuestionEditor = ({ question, index, onChange, onDelete }) => {
    const [mathModalField, setMathModalField] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfTarget, setPdfTarget] = useState(null); // { type: 'main' } or { type: 'option', id: optId }
    const [zoomedImage, setZoomedImage] = useState(null);
    const [activeTeacherLeftId, setActiveTeacherLeftId] = useState(null);
    const editorsRefs = useRef({});

    // Register a ref dynamically
    const setEditorRef = (key) => (el) => {
        editorsRefs.current[key] = el;
    };

    const handleMathInsert = (latexString) => {
        if (!mathModalField) return;

        let refKey = '';
        if (mathModalField.type === 'main') refKey = 'main';
        else refKey = `${mathModalField.type}-${mathModalField.id}`;

        const editor = editorsRefs.current[refKey];
        if (editor) {
            editor.insertMath(latexString);
        }

        setMathModalField(null);
    };

    // Default structure for a Multiple Choice option
    const createEmptyOption = () => ({ id: Date.now(), text: '', isCorrect: false });
    // Default structure for a Matching pair
    const createEmptyPair = () => ({ id: Date.now(), left: '', right: '' });

    const handleChange = (field, value) => {
        onChange(question.id, { ...question, [field]: value });
    };

    // --- Type Specific Rendering ---

    // MULTIPLE CHOICE
    const renderMultipleChoice = () => {
        const options = question.options || [];

        const addOption = () => {
            handleChange('options', [...options, createEmptyOption()]);
        };

        const updateOption = (optId, field, value) => {
            const newOptions = options.map(opt => {
                if (opt.id === optId) {
                    // If marking as correct, optionally unmark others if single choice. For now, we allow multiple correct or single correct depending on the teacher, but radio implies single.
                    if (field === 'isCorrect') {
                        return { ...opt, isCorrect: value };
                    }
                    return { ...opt, [field]: value };
                }
                // If this is a radio button selection for the correct answer:
                if (question.type === 'MULTIPLE_CHOICE' && field === 'isCorrect' && value === true) {
                    return { ...opt, isCorrect: false }; // uncheck others
                }
                return opt;
            });
            handleChange('options', newOptions);
        };

        const removeOption = (optId) => {
            handleChange('options', options.filter(o => o.id !== optId));
        };

        return (
            <div className="space-y-3 mt-4">
                <p className="text-sm font-medium text-gray-700">Cavab variantları:</p>
                {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-3">
                        <input
                            type={question.type === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                            name={`correct-${question.id}`}
                            checked={opt.isCorrect}
                            onChange={(e) => updateOption(opt.id, 'isCorrect', question.type === 'MULTI_SELECT' ? e.target.checked : true)}
                            className={`w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${question.type === 'MULTI_SELECT' ? 'rounded' : ''}`}
                            title={question.type === 'MULTI_SELECT' ? 'Düzgün cavab(lar)dan biri kimi işarələ' : 'Düzgün cavabı işarələ'}
                        />
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                                <MathTextEditor
                                    ref={setEditorRef(`option-${opt.id}`)}
                                    value={opt.text}
                                    onChange={(val) => updateOption(opt.id, 'text', val)}
                                    placeholder={`Variant ${i + 1}`}
                                    className={`flex-1 px-3 py-2 border-none focus:ring-0 sm:text-sm min-h-[40px] ${opt.isCorrect ? 'bg-indigo-50/30' : 'bg-transparent'}`}
                                />
                                {/* Image / PDF Button */}
                                <div className="relative border-l border-gray-100 flex items-center">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.type === 'application/pdf') {
                                                    setPdfFile(file);
                                                    setPdfTarget({ type: 'option', id: opt.id });
                                                    setIsPdfModalOpen(true);
                                                } else if (file.type.startsWith('image/')) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        updateOption(opt.id, 'attachedImage', event.target.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }
                                            e.target.value = null;
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="px-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Variant üçün şəkil və ya PDF kəsimi əlavə et"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setMathModalField({ type: 'option', id: opt.id })}
                                    className="px-3 border-l text-indigo-600 font-bold hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0"
                                    title="Riyaziyyat formulu əlavə et"
                                >
                                    fx
                                </button>
                            </div>

                            {/* Option Image Preview */}
                            {opt.attachedImage && (
                                <div className="relative inline-block w-fit">
                                    <img
                                        src={opt.attachedImage}
                                        alt="Variant şəkli"
                                        className="max-h-32 rounded border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => setZoomedImage(opt.attachedImage)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateOption(opt.id, 'attachedImage', null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                    >
                                        <HiOutlineTrash className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeOption(opt.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <HiOutlineTrash className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium border border-transparent hover:border-indigo-100"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Variant əlavə et
                </button>
            </div>
        );
    };

    // OPEN ENDED
    const renderOpenEnded = () => {
        return (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl text-center border-dashed">
                <p className="text-sm text-gray-500">Şagird bu suala açıq mətn formatında cavab verəcək. Sistem xüsusi açar sözlərə görə yoxlaya və ya tamamilə müəllim yoxlamasına buraxa bilər.</p>

                <div className="mt-4 text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açar sözlər və ya Nümunə cavab (İstəyə bağlı)</label>
                    <textarea
                        value={question.sampleAnswer || ''}
                        onChange={(e) => handleChange('sampleAnswer', e.target.value)}
                        placeholder="Avtomatik yoxlama üçün düzgün cavab variantlarını vergüllə yazın..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows="2"
                    />
                </div>
            </div>
        );
    };

    // MATCHING
    const renderMatching = () => {
        const pairs = question.matchingPairs || [];

        const addLeftItem = () => {
            const vId = 'lv-' + Date.now();
            const newPair = { id: Date.now(), leftItem: '', rightItem: null, attachedImageLeft: null, attachedImageRight: null, leftVisualId: vId };
            handleChange('matchingPairs', [...pairs, newPair]);
        };

        const addRightItem = () => {
            const vId = 'rv-' + Date.now();
            const newPair = { id: Date.now(), leftItem: null, rightItem: '', attachedImageLeft: null, attachedImageRight: null, rightVisualId: vId };
            handleChange('matchingPairs', [...pairs, newPair]);
        };

        const updateItemContents = (visualId, side, field, value) => {
            const newPairs = pairs.map(p => {
                if (side === 'left' && p.leftVisualId === visualId) return { ...p, [field]: value };
                if (side === 'right' && p.rightVisualId === visualId) return { ...p, [field]: value };
                return p;
            });
            handleChange('matchingPairs', newPairs);
        };

        const removeItem = (visualId, side) => {
            // Remove all pairs that feature this visual node
            const newPairs = pairs.filter(p => {
                if (side === 'left' && p.leftVisualId === visualId) return false;
                if (side === 'right' && p.rightVisualId === visualId) return false;
                return true;
            });
            handleChange('matchingPairs', newPairs);
        };

        const handleLink = (leftVisualId, rightVisualId) => {
            const leftRecord = pairs.find(p => p.leftVisualId === leftVisualId);
            const rightRecord = pairs.find(p => p.rightVisualId === rightVisualId);
            
            if (!leftRecord || !rightRecord) return;

            // Check if this link already exists
            const alreadyLinked = pairs.some(p => p.leftVisualId === leftVisualId && p.rightVisualId === rightVisualId);
            if (alreadyLinked) {
                toast.error('Bu bəndlər artıq birləşdirilib');
                setActiveTeacherLeftId(null);
                return;
            }

            // MAPPING LOGIC:
            // 1. If leftRecord is independent AND rightRecord is independent -> Merge them.
            // 2. Otherwise -> Create a NEW record for the link.
            
            let newPairs;
            if (leftRecord.rightItem === null && rightRecord.leftItem === null) {
                newPairs = pairs.map(p => {
                    if (p.leftVisualId === leftVisualId) {
                        return { 
                            ...p, 
                            rightItem: rightRecord.rightItem, 
                            attachedImageRight: rightRecord.attachedImageRight,
                            rightVisualId: rightRecord.rightVisualId
                        };
                    }
                    return p;
                }).filter(p => p.rightVisualId !== rightVisualId || p.leftItem !== null);
            } else {
                const newLink = {
                    id: Date.now(),
                    leftItem: leftRecord.leftItem,
                    attachedImageLeft: leftRecord.attachedImageLeft,
                    leftVisualId: leftRecord.leftVisualId,
                    rightItem: rightRecord.rightItem,
                    attachedImageRight: rightRecord.attachedImageRight,
                    rightVisualId: rightRecord.rightVisualId
                };
                
                // If the records we are linking were "ghosts" (independent nodes), we might need to remove the empty shells
                newPairs = pairs.filter(p => {
                    if (p.leftVisualId === leftVisualId && p.rightItem === null) return false;
                    if (p.rightVisualId === rightVisualId && p.leftItem === null) return false;
                    return true;
                });
                newPairs.push(newLink);
            }

            handleChange('matchingPairs', newPairs);
            setActiveTeacherLeftId(null);
            toast.success('Bəndlər birləşdirildi');
        };

        const removeLink = (pairId) => {
            const pair = pairs.find(p => p.id === pairId);
            if (!pair || pair.leftItem === null || pair.rightItem === null) return;

            // When removing a link, we need to ensure the nodes themselves remain as independent items if they have no other links
            const otherLeftLinks = pairs.some(p => p.id !== pairId && p.leftVisualId === pair.leftVisualId);
            const otherRightLinks = pairs.some(p => p.id !== pairId && p.rightVisualId === pair.rightVisualId);

            let newPairs = pairs.filter(p => p.id !== pairId);
            
            if (!otherLeftLinks) {
                newPairs.push({
                    id: Date.now(),
                    leftItem: pair.leftItem,
                    attachedImageLeft: pair.attachedImageLeft,
                    leftVisualId: pair.leftVisualId,
                    rightItem: null,
                    rightVisualId: null
                });
            }
            
            if (!otherRightLinks) {
                newPairs.push({
                    id: Date.now() + 1,
                    leftItem: null,
                    rightItem: pair.rightItem,
                    attachedImageRight: pair.attachedImageRight,
                    rightVisualId: pair.rightVisualId,
                    leftVisualId: null
                });
            }

            handleChange('matchingPairs', newPairs);
            toast.success('Əlaqə silindi');
        };

        const handlePairFileSelect = (visualId, side, file) => {
            if (!file) return;
            if (file.type === 'application/pdf') {
                setPdfFile(file);
                // For PDF crop, we use the first pair ID that matches this visual node
                const targetPair = pairs.find(p => side === 'left' ? p.leftVisualId === visualId : p.rightVisualId === visualId);
                setPdfTarget({ type: 'matching', id: targetPair.id, visualId, side });
                setIsPdfModalOpen(true);
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateItemContents(visualId, side, side === 'left' ? 'attachedImageLeft' : 'attachedImageRight', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };

        // GENERATE VISUAL LISTS
        const leftNodes = [];
        pairs.forEach(p => {
            if (p.leftItem !== null && !leftNodes.some(n => n.visualId === p.leftVisualId)) {
                leftNodes.push({ visualId: p.leftVisualId, content: p.leftItem, image: p.attachedImageLeft });
            }
        });

        const rightNodes = [];
        pairs.forEach(p => {
            if (p.rightItem !== null && !rightNodes.some(n => n.visualId === p.rightVisualId)) {
                rightNodes.push({ visualId: p.rightVisualId, content: p.rightItem, image: p.attachedImageRight });
            }
        });

        // Ensure every record has visual IDs during initialization if missing (for legacy data)
        const initializedPairs = pairs.map(p => {
            if (p.leftItem !== null && !p.leftVisualId) p.leftVisualId = 'lv-' + p.id;
            if (p.rightItem !== null && !p.rightVisualId) p.rightVisualId = 'rv-' + p.id;
            return p;
        });
        if (JSON.stringify(initializedPairs) !== JSON.stringify(pairs)) {
            // Avoid infinite loop by only triggering if changed
            setTimeout(() => handleChange('matchingPairs', initializedPairs), 0);
        }

        return (
            <div className="space-y-6 mt-8">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-4">
                    <p className="text-xs text-indigo-700 font-medium">
                        <span className="font-bold">Təlimat:</span> Maddələri əlavə edin və klikləyərək birləşdirin. Bir maddəni bir neçə maddə ilə birləşdirə bilərsiniz. Oxun üzərinə klikləyərək əlaqəni silə bilərsiniz.
                    </p>
                </div>

                <div className="relative flex justify-between gap-32 py-4">
                    <div className="flex-1 space-y-10 z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sol Sütun</h4>
                            <button type="button" onClick={addLeftItem} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg"><HiOutlinePlus className="w-5 h-5"/></button>
                        </div>
                        {leftNodes.map((node) => (
                            <div
                                key={`edit-left-${node.visualId}`}
                                id={`edit-left-${node.visualId}`}
                                className={`p-4 rounded-2xl border-2 transition-all group/item bg-white ${
                                    activeTeacherLeftId === node.visualId ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-gray-100'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <MathTextEditor
                                        ref={setEditorRef(`matching-left-${node.visualId}`)}
                                        value={node.content || ''}
                                        onChange={(val) => updateItemContents(node.visualId, 'left', 'leftItem', val)}
                                        placeholder="Sol maddə..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-h-[40px]"
                                    />
                                    <button type="button" onClick={() => removeItem(node.visualId, 'left')} className="p-1 text-gray-300 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>
                                </div>
                                
                                {node.image && (
                                    <div className="mt-2 relative inline-block">
                                        <img src={node.image} className="max-h-24 rounded border border-gray-100 cursor-zoom-in" onClick={() => setZoomedImage(node.image)} alt="" />
                                        <button onClick={() => updateItemContents(node.visualId, 'left', 'attachedImageLeft', null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm"><HiOutlineTrash className="w-3 h-3" /></button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                    <div className="relative">
                                        <input type="file" accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handlePairFileSelect(node.visualId, 'left', e.target.files[0])} />
                                        <button type="button" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Şəkil / PDF"><HiOutlinePlus className="w-4 h-4" /></button>
                                    </div>
                                    <button type="button" onClick={() => setMathModalField({ type: 'matching-left', id: node.visualId })} className="p-1.5 text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg text-xs" title="Riyaziyyat">fx</button>
                                    <div className="flex-1"></div>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (activeTeacherLeftId === node.visualId) {
                                                setActiveTeacherLeftId(null);
                                            } else {
                                                setActiveTeacherLeftId(node.visualId);
                                                toast.success('İndi sağdan uyğun olanı seçin');
                                            }
                                        }}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                                            activeTeacherLeftId === node.visualId ? 'bg-yellow-400 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                    >
                                        {activeTeacherLeftId === node.visualId ? 'Seçilib' : 'Birləşdir'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 space-y-10 z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sağ Sütun</h4>
                            <button type="button" onClick={addRightItem} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg"><HiOutlinePlus className="w-5 h-5"/></button>
                        </div>
                        {rightNodes.map((node) => (
                            <div
                                key={`edit-right-${node.visualId}`}
                                id={`edit-right-${node.visualId}`}
                                className={`p-4 rounded-2xl border-2 border-gray-100 bg-white transition-all group/item`}
                            >
                                <div className="flex items-start gap-2">
                                    <MathTextEditor
                                        ref={setEditorRef(`matching-right-${node.visualId}`)}
                                        value={node.content || ''}
                                        onChange={(val) => updateItemContents(node.visualId, 'right', 'rightItem', val)}
                                        placeholder="Sağ maddə..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-h-[40px]"
                                    />
                                    <button type="button" onClick={() => removeItem(node.visualId, 'right')} className="p-1 text-gray-300 hover:text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>
                                </div>

                                {node.image && (
                                    <div className="mt-2 relative inline-block">
                                        <img src={node.image} className="max-h-24 rounded border border-gray-100 cursor-zoom-in" onClick={() => setZoomedImage(node.image)} alt="" />
                                        <button onClick={() => updateItemContents(node.visualId, 'right', 'attachedImageRight', null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm"><HiOutlineTrash className="w-3 h-3" /></button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                    <div className="relative">
                                        <input type="file" accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handlePairFileSelect(node.visualId, 'right', e.target.files[0])} />
                                        <button type="button" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Şəkil / PDF"><HiOutlinePlus className="w-4 h-4" /></button>
                                    </div>
                                    <button type="button" onClick={() => setMathModalField({ type: 'matching-right', id: node.visualId })} className="p-1.5 text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg text-xs" title="Riyaziyyat">fx</button>
                                    <div className="flex-1"></div>
                                    {activeTeacherLeftId && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleLink(activeTeacherLeftId, node.visualId)}
                                            className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-md shadow-sm hover:bg-indigo-700"
                                        >
                                            Buraya Birləşdir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SVG Arrows to show correct connections */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
                        <svg className="w-full h-full overflow-visible">
                            <defs>
                                <marker id={`teacher-arrowhead`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#indigo-300" className="fill-indigo-300" />
                                </marker>
                            </defs>
                            {pairs.filter(p => p.leftItem !== null && p.rightItem !== null).map(pair => {
                                const leftEl = document.getElementById(`edit-left-${pair.leftVisualId}`);
                                const rightEl = document.getElementById(`edit-right-${pair.rightVisualId}`);
                                if (leftEl && rightEl) {
                                    const lRect = leftEl.getBoundingClientRect();
                                    const rRect = rightEl.getBoundingClientRect();
                                    const containerRect = leftEl.parentElement.parentElement.parentElement.getBoundingClientRect();
                                    
                                    const x1 = lRect.right - containerRect.left;
                                    const y1 = lRect.top + lRect.height / 2 - containerRect.top;
                                    const x2 = rRect.left - containerRect.left;
                                    const y2 = rRect.top + rRect.height / 2 - containerRect.top;

                                    return (
                                        <g key={`arrow-group-${pair.id}`} className="group/arrow pointer-events-auto cursor-pointer" onClick={() => removeLink(pair.id)}>
                                            <path
                                                d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                                                stroke="transparent"
                                                strokeWidth="15"
                                                fill="none"
                                            />
                                            <path
                                                d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                                                stroke="#e0e7ff"
                                                strokeWidth="3"
                                                fill="none"
                                                markerEnd="url(#teacher-arrowhead)"
                                                className="stroke-indigo-100 group-hover/arrow:stroke-red-300 transition-colors"
                                            />
                                            <circle cx={(x1+x2)/2} cy={(y1+y2)/2} r="10" className="fill-white stroke-red-100 opacity-0 group-hover/arrow:opacity-100 transition-opacity" />
                                            <text x={(x1+x2)/2} y={(y1+y2)/2 + 4} textAnchor="middle" className="fill-red-500 text-[12px] font-bold opacity-0 group-hover/arrow:opacity-100 transition-opacity">×</text>
                                        </g>
                                    );
                                }
                                return null;
                            })}
                        </svg>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative group transition-all hover:border-indigo-200">
            {/* Question Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                        {index + 1}
                    </span>
                    <select
                        value={question.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 transition-colors hover:bg-gray-100"
                    >
                        {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <label className="text-sm text-gray-600 font-medium">Bal:</label>
                        <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => handleChange('points', parseFloat(e.target.value))}
                            className="w-16 bg-transparent border-none p-0 text-sm focus:ring-0 font-bold text-indigo-700"
                        />
                    </div>
                    <button
                        onClick={() => onDelete(question.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Sualı Sil"
                    >
                        <HiOutlineTrash className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Question Text & Media Upload */}
            <div className="relative">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Mətn və Şəkil</label>
                    <div className="flex items-center gap-2">
                        {/* Image/PDF Upload Button */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        if (file.type === 'application/pdf') {
                                            setPdfFile(file);
                                            setPdfTarget({ type: 'main' });
                                            setIsPdfModalOpen(true);
                                        } else if (file.type.startsWith('image/')) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                handleChange('attachedImage', event.target.result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }
                                    e.target.value = null; // reset 
                                }}
                            />
                            <button
                                type="button"
                                className="text-xs font-medium px-2.5 py-1 rounded-md transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                                title="Suala şəkil və ya PDF dən kəsim əlavə et"
                            >
                                <HiOutlinePlus className="w-3 h-3" /> Şəkil / PDF
                            </button>
                        </div>

                        {/* Mathlive Modal Trigger */}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setMathModalField({ type: 'main' })}
                            className="text-xs font-bold px-2.5 py-1 rounded-md transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            title="Riyaziyyat formulu əlavə et"
                        >
                            fx Riyaziyyat
                        </button>
                    </div>
                </div>

                <MathTextEditor
                    ref={setEditorRef('main')}
                    value={question.text}
                    onChange={(val) => handleChange('text', val)}
                    placeholder="Sualın mətnini buraya yazın... Müntəzəm mətn daxil edə, enterlə aşağı düşə bilərsiniz."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y min-h-[100px] text-gray-800 transition-colors"
                />

                {/* Attached Image Preview */}
                {question.attachedImage && (
                    <div className="mt-3 relative inline-block">
                        <img
                            src={question.attachedImage}
                            alt="Sual mütaliəsi"
                            className="max-w-full max-h-[500px] object-contain rounded-lg border border-gray-200 shadow-sm cursor-zoom-in hover:opacity-95 transition-opacity"
                            onClick={() => setZoomedImage(question.attachedImage)}
                        />
                        <button
                            onClick={() => handleChange('attachedImage', null)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-transform hover:scale-105"
                            title="Şəkli sil"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Dynamic Type Rendering */}
            {(question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTI_SELECT') && renderMultipleChoice()}
            {question.type === 'OPEN_ENDED' && renderOpenEnded()}
            {question.type === 'MATCHING' && renderMatching()}

            {/* PDF Cropper Modal */}
            <PdfCropperModal
                isOpen={isPdfModalOpen}
                isBatchMode={false}
                onClose={() => {
                    setIsPdfModalOpen(false);
                    setPdfFile(null);
                }}
                file={pdfFile}
                onCropComplete={(base64Img) => {
                    if (pdfTarget?.type === 'option') {
                        // We need a way to call updateOption from here. 
                        // Since renderMultipleChoice is a closure, we can't call it directly if it's not in scope?
                        // Actually, QuestionEditor has handleChange. 
                        const options = question.options || [];
                        const newOptions = options.map(opt =>
                            opt.id === pdfTarget.id ? { ...opt, attachedImage: base64Img } : opt
                        );
                        handleChange('options', newOptions);
                    } else if (pdfTarget?.type === 'matching') {
                        const pairs = question.matchingPairs || [];
                        const field = pdfTarget.side === 'left' ? 'attachedImageLeft' : 'attachedImageRight';
                        updateItem(pdfTarget.id, field, base64Img);
                    } else {
                        handleChange('attachedImage', base64Img);
                    }
                }}
            />

            {/* Math Formula Modal */}
            <MathFormulaModal
                isOpen={!!mathModalField}
                onClose={() => setMathModalField(null)}
                onInsert={handleMathInsert}
            />

            {/* Image Zoom Overlay */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-5xl max-h-full">
                        <img
                            src={zoomedImage}
                            alt="Böyüdülmüş baxış"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white/10"
                        />
                        <button
                            className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-full p-2 shadow-xl hover:bg-gray-100"
                            onClick={() => setZoomedImage(null)}
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionEditor;
