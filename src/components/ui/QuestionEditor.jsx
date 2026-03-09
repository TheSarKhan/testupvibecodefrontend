import { useState, useRef, useEffect } from 'react';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import PdfCropperModal from './PdfCropperModal';
import MathFormulaModal from './MathFormulaModal';
import MathTextEditor from './MathTextEditor';

// Supported Question Types
const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'Qapalı',
    OPEN_ENDED: 'Açıq',
    MATCHING: 'Uyğunlaşdırma'
};

const QuestionEditor = ({ question, index, onChange, onDelete }) => {
    const [mathModalField, setMathModalField] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfTarget, setPdfTarget] = useState(null); // { type: 'main' } or { type: 'option', id: optId }
    const [zoomedImage, setZoomedImage] = useState(null);
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
                if (field === 'isCorrect' && value === true) {
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
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={opt.isCorrect}
                            onChange={() => updateOption(opt.id, 'isCorrect', true)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            title="Düzgün cavabı işarələ"
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

        const addPair = () => {
            handleChange('matchingPairs', [...pairs, createEmptyPair()]);
        };

        const updatePair = (pairId, side, value) => {
            const newPairs = pairs.map(p => p.id === pairId ? { ...p, [side]: value } : p);
            handleChange('matchingPairs', newPairs);
        };

        const removePair = (pairId) => {
            handleChange('matchingPairs', pairs.filter(p => p.id !== pairId));
        };

        return (
            <div className="space-y-4 mt-4">
                <p className="text-sm font-medium text-gray-700">Uyğunlaşdırma cütləri (Sol tərəf ↔ Sağ tərəf):</p>
                {pairs.map((pair, i) => (
                    <div key={pair.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className="font-bold text-gray-400 w-6 text-center">{i + 1}.</span>

                        <div className="flex-1 w-full flex bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                            <MathTextEditor
                                ref={setEditorRef(`matching-left-${pair.id}`)}
                                value={pair.left}
                                onChange={(val) => updatePair(pair.id, 'left', val)}
                                placeholder="Sol tərəf ifadəsi"
                                className="flex-1 px-3 py-2 border-none focus:ring-0 sm:text-sm bg-transparent min-h-[40px]"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setMathModalField({ type: 'matching-left', id: pair.id })}
                                className="px-3 border-l text-indigo-600 font-bold hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0"
                                title="Riyaziyyat formulu əlavə et"
                            >
                                fx
                            </button>
                        </div>

                        <div className="text-gray-400 mx-2 hidden sm:block">↔</div>

                        <div className="flex-1 w-full flex bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
                            <MathTextEditor
                                ref={setEditorRef(`matching-right-${pair.id}`)}
                                value={pair.right}
                                onChange={(val) => updatePair(pair.id, 'right', val)}
                                placeholder="Sağ tərəf (Düzgün cavab)"
                                className="flex-1 px-3 py-2 border-none focus:ring-0 sm:text-sm bg-transparent min-h-[40px]"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setMathModalField({ type: 'matching-right', id: pair.id })}
                                className="px-3 border-l text-indigo-600 font-bold hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0"
                                title="Riyaziyyat formulu əlavə et"
                            >
                                fx
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => removePair(pair.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <HiOutlineTrash className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addPair}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium border border-transparent hover:border-indigo-100"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Yeni cüt əlavə et
                </button>
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
            {question.type === 'MULTIPLE_CHOICE' && renderMultipleChoice()}
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
