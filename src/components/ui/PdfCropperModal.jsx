import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX, HiOutlinePlus, HiOutlineMinus, HiOutlineScissors, HiOutlinePencil, HiOutlineCheck } from 'react-icons/hi';
import ImageAnnotatorModal from './ImageAnnotatorModal';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ALL_LABELS = ['A', 'B', 'C', 'D', 'E'];

/**
 * onCropComplete receives:
 *   - batch mode → { crops: [{id, questionImage, options:[{label,image}]}], optionCount: 4|5, cropMode: 'simple'|'advanced' }
 *   - single mode → base64 string
 */
const PdfCropperModal = ({ isOpen, onClose, file, onCropComplete, isBatchMode = false, maxCrops = null }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [crops, setCrops] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const pageRef = useRef(null);

    // Batch settings
    const [cropMode, setCropMode] = useState('simple');      // 'simple' | 'advanced'
    const [optionCount, setOptionCount] = useState(5);       // 4 or 5
    const [optionTextMode, setOptionTextMode] = useState('label'); // 'label' | 'empty'

    // Which slot the next "Kəs" goes into: 'question' | 'A'...'E'
    const [cropTarget, setCropTarget] = useState('question');

    // Single mode
    const [pendingSingleCrop, setPendingSingleCrop] = useState(null);

    // Annotator
    const [annotator, setAnnotator] = useState(null);

    const activeLabels = ALL_LABELS.slice(0, optionCount);

    const resetCrop = () => { setCompletedCrop(null); setCrop(undefined); };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
        resetCrop();
    };

    const changePage = (offset) => {
        setPageNumber(prev => prev + offset);
        resetCrop();
    };

    const captureCrop = async () => {
        if (!completedCrop?.width || !completedCrop?.height || !pageRef.current) return null;
        const canvas = pageRef.current.querySelector('canvas');
        if (!canvas) return null;
        const cropCanvas = document.createElement('canvas');
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;
        cropCanvas.width = completedCrop.width * scaleX;
        cropCanvas.height = completedCrop.height * scaleY;
        const ctx = cropCanvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(canvas,
            completedCrop.x * scaleX, completedCrop.y * scaleY,
            completedCrop.width * scaleX, completedCrop.height * scaleY,
            0, 0, completedCrop.width * scaleX, completedCrop.height * scaleY
        );
        return cropCanvas.toDataURL('image/png');
    };

    const handleCropAction = async () => {
        const base64Image = await captureCrop();
        if (!base64Image) return;

        if (isBatchMode) {
            if (cropTarget === 'question') {
                if (maxCrops !== null && crops.length >= maxCrops) return; // limit reached
                setCrops(prev => [...prev, { id: Date.now().toString(), questionImage: base64Image, options: [] }]);
                // In advanced mode auto-advance to A; in simple mode stay on 'question'
                if (cropMode === 'advanced') setCropTarget('A');
            } else {
                // Advanced mode: attach option to last question
                setCrops(prev => {
                    if (prev.length === 0) return prev;
                    const last = prev[prev.length - 1];
                    const existingIdx = last.options.findIndex(o => o.label === cropTarget);
                    const newOptions = existingIdx >= 0
                        ? last.options.map((o, i) => i === existingIdx ? { ...o, image: base64Image } : o)
                        : [...last.options, { label: cropTarget, image: base64Image }];
                    return [...prev.slice(0, -1), { ...last, options: newOptions }];
                });
                // Auto-advance: next active label or back to 'question'
                const idx = activeLabels.indexOf(cropTarget);
                setCropTarget(idx < activeLabels.length - 1 ? activeLabels[idx + 1] : 'question');
            }
            resetCrop();
        } else {
            setPendingSingleCrop(base64Image);
            resetCrop();
        }
    };

    const handleSingleConfirm = () => {
        if (!pendingSingleCrop) return;
        onCropComplete(pendingSingleCrop);
        onClose();
        setPendingSingleCrop(null);
    };

    const handleBatchFinish = () => {
        if (crops.length === 0) return;
        onCropComplete({ crops, optionCount, cropMode, optionTextMode });
        onClose();
        setCrops([]);
        setCropTarget('question');
    };

    const handleDeleteCrop = (id) => {
        setCrops(prev => prev.filter(c => c.id !== id));
    };

    const handleDeleteOption = (cropId, label) => {
        setCrops(prev => prev.map(c => c.id !== cropId ? c : {
            ...c, options: c.options.filter(o => o.label !== label)
        }));
    };

    const openAnnotator = (src, idx, optLabel = null) =>
        setAnnotator({ src, idx, optLabel });

    const handleAnnotatorConfirm = (newSrc) => {
        if (!annotator) return;
        if (annotator.idx === 'single') {
            setPendingSingleCrop(newSrc);
        } else if (annotator.optLabel) {
            setCrops(prev => prev.map((c, i) => i !== annotator.idx ? c : {
                ...c,
                options: c.options.map(o => o.label === annotator.optLabel ? { ...o, image: newSrc } : o)
            }));
        } else {
            setCrops(prev => prev.map((c, i) => i !== annotator.idx ? c : { ...c, questionImage: newSrc }));
        }
        setAnnotator(null);
    };

    // When switching crop mode, reset option-level crop targets
    const handleSetCropMode = (mode) => {
        setCropMode(mode);
        setCropTarget('question');
    };

    if (!isOpen || !file) return null;

    const lastCropHasQuestion = crops.length > 0;
    const targetLabel = cropTarget === 'question' ? '📄 Sual' : `${cropTarget} variant`;
    const limitReached = maxCrops !== null && crops.length >= maxCrops;

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className={`relative flex flex-col bg-white rounded-2xl shadow-2xl w-full ${isBatchMode ? 'max-w-6xl' : 'max-w-4xl'} max-h-full overflow-hidden`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isBatchMode ? 'PDF-dən Çoxlu Sual Yarat' : 'Şəkil kəsimi (PDF)'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 min-h-0 gap-4 p-4">

                    {/* Left: PDF + Controls */}
                    <div className="flex-1 min-w-0 flex flex-col gap-3">

                        {/* PDF Viewer */}
                        <div className="flex-1 min-h-0 bg-gray-100 rounded-xl border border-gray-200 overflow-auto p-3">
                            <div className="w-fit mx-auto">
                                <ReactCrop
                                    crop={crop}
                                    onChange={c => setCrop(c)}
                                    onComplete={c => setCompletedCrop(c)}
                                    style={{ maxWidth: '100%' }}
                                >
                                    <div ref={pageRef} className="shadow border border-gray-300 rounded overflow-hidden">
                                        <Document
                                            file={file}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            loading={<div className="p-10 text-gray-500 text-sm">PDF yüklənir...</div>}
                                            error={<div className="p-10 text-red-500 text-sm">PDF xətası!</div>}
                                        >
                                            <Page pageNumber={pageNumber} scale={zoom} renderTextLayer={false} renderAnnotationLayer={false} />
                                        </Document>
                                    </div>
                                </ReactCrop>
                            </div>
                        </div>

                        {/* Single mode: pending crop preview */}
                        {!isBatchMode && pendingSingleCrop && (
                            <div className="shrink-0 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <img src={pendingSingleCrop} alt="Kəsilmiş şəkil" className="h-16 w-auto rounded border border-green-200 object-contain bg-white" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-green-700 mb-1.5">Kəsilmiş şəkil hazırdır</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openAnnotator(pendingSingleCrop, 'single')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            <HiOutlinePencil className="w-3.5 h-3.5" /> Düzəlt
                                        </button>
                                        <button
                                            onClick={handleSingleConfirm}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                                        >
                                            <HiOutlineCheck className="w-3.5 h-3.5" /> Tətbiq et
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls Bar */}
                        <div className="shrink-0 flex flex-col gap-2">

                            {/* Batch mode settings row: mode toggle + option count */}
                            {isBatchMode && (
                                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-wrap">
                                    {/* Mode toggle */}
                                    <span className="text-xs font-semibold text-gray-500 shrink-0">Rejim:</span>
                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                                        <button
                                            onClick={() => handleSetCropMode('simple')}
                                            className={`px-3 py-1 text-xs font-bold transition-colors ${
                                                cropMode === 'simple'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            📝 Sadə
                                        </button>
                                        <button
                                            onClick={() => handleSetCropMode('advanced')}
                                            className={`px-3 py-1 text-xs font-bold transition-colors border-l border-gray-200 ${
                                                cropMode === 'advanced'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            🖼 Variant şəkilləri
                                        </button>
                                    </div>

                                    {/* Option count */}
                                    <span className="text-xs font-semibold text-gray-500 shrink-0 ml-2">Variant sayı:</span>
                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                                        {[3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => {
                                                    setOptionCount(n);
                                                    // if current cropTarget is out of new range, reset
                                                    if (cropTarget !== 'question' && ALL_LABELS.indexOf(cropTarget) >= n) {
                                                        setCropTarget('question');
                                                    }
                                                }}
                                                className={`px-3 py-1 text-xs font-bold transition-colors ${n > 3 ? 'border-l border-gray-200' : ''} ${
                                                    optionCount === n
                                                        ? 'bg-amber-500 text-white'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Option text mode */}
                                    <span className="text-xs font-semibold text-gray-500 shrink-0 ml-2">Variant mətni:</span>
                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                                        <button
                                            onClick={() => setOptionTextMode('label')}
                                            className={`px-3 py-1 text-xs font-bold transition-colors ${
                                                optionTextMode === 'label'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Avtomatik ad
                                        </button>
                                        <button
                                            onClick={() => setOptionTextMode('empty')}
                                            className={`px-3 py-1 text-xs font-bold transition-colors border-l border-gray-200 ${
                                                optionTextMode === 'empty'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Boş
                                        </button>
                                    </div>

                                    {/* Current crop target indicator (advanced mode) */}
                                    {cropMode === 'advanced' && (
                                        <span className="ml-auto text-xs text-gray-400">
                                            Seçilmiş: <span className="font-bold text-gray-700">{targetLabel}</span>
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Advanced mode: crop target selector */}
                            {isBatchMode && cropMode === 'advanced' && (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex-wrap">
                                    <span className="text-xs font-semibold text-emerald-700 shrink-0">Kəsim növü:</span>
                                    <button
                                        onClick={() => setCropTarget('question')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                            cropTarget === 'question'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400'
                                        }`}
                                    >
                                        📄 Yeni sual
                                    </button>
                                    {activeLabels.map(label => (
                                        <button
                                            key={label}
                                            onClick={() => setCropTarget(label)}
                                            disabled={!lastCropHasQuestion}
                                            className={`w-9 h-7 rounded-lg text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                                cropTarget === label
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main controls row */}
                            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2 flex-wrap">
                                {/* Zoom */}
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                        <HiOutlineMinus className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-bold text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                        <HiOutlinePlus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={pageNumber <= 1} onClick={() => changePage(-1)} className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                                        <HiOutlineChevronLeft className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number" min={1} max={numPages || 1} value={pageNumber}
                                        onChange={e => {
                                            const v = parseInt(e.target.value);
                                            if (v >= 1 && v <= (numPages || 1)) { setPageNumber(v); resetCrop(); }
                                        }}
                                        className="w-14 text-center px-2 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-400"
                                    />
                                    <span className="text-sm text-gray-500">/ {numPages || '--'}</span>
                                    <button type="button" disabled={pageNumber >= numPages} onClick={() => changePage(1)} className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                                        <HiOutlineChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Kəs button */}
                                <button
                                    onClick={handleCropAction}
                                    disabled={!completedCrop?.width || !completedCrop?.height || (limitReached && cropTarget === 'question')}
                                    title={limitReached && cropTarget === 'question' ? `Limit dolub (${maxCrops}/${maxCrops})` : ''}
                                    className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                        cropMode === 'advanced' && cropTarget !== 'question'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : limitReached && cropTarget === 'question'
                                                ? 'bg-red-400'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    <HiOutlineScissors className="w-4 h-4" />
                                    {limitReached && cropTarget === 'question' ? 'Limit dolub' : `Kəs ${isBatchMode && cropMode === 'advanced' && cropTarget !== 'question' ? `(${cropTarget})` : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Batch Panel */}
                    {isBatchMode && (
                        <div className="w-64 shrink-0 flex flex-col gap-2">
                            <div className="flex-1 min-h-0 flex flex-col bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                                    <span className="font-bold text-gray-800 text-sm">Kəsilmiş Suallar</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${limitReached ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                        {maxCrops !== null ? `${crops.length} / ${maxCrops}` : crops.length}
                                    </span>
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3">
                                    {crops.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <HiOutlineScissors className="w-8 h-8 text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-400">
                                                {cropMode === 'simple'
                                                    ? 'PDF-dən seçib "Kəs" düyməsinə basın'
                                                    : 'Sual şəklini kəsin, sonra variant şəkillərini kəsin'}
                                            </p>
                                        </div>
                                    ) : crops.map((q, qIdx) => (
                                        <div key={q.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            {/* Question header */}
                                            <div className="flex items-center justify-between px-2 py-1 bg-indigo-50 border-b border-indigo-100">
                                                <span className="text-[10px] font-bold text-indigo-700">Sual {qIdx + 1}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openAnnotator(q.questionImage, qIdx)}
                                                        className="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-colors"
                                                        title="Düzəlt"
                                                    >
                                                        <HiOutlinePencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCrop(q.id)}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Sil"
                                                    >
                                                        <HiOutlineX className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Question image */}
                                            <div className="p-1.5">
                                                <img
                                                    src={q.questionImage}
                                                    alt={`Sual ${qIdx + 1}`}
                                                    className="w-full h-auto rounded cursor-zoom-in hover:opacity-90 transition-opacity"
                                                    onClick={() => setPreviewImage(q.questionImage)}
                                                />
                                            </div>

                                            {/* Options grid — only in advanced mode */}
                                            {cropMode === 'advanced' && (
                                                <div className={`px-1.5 pb-1.5 grid gap-1`} style={{ gridTemplateColumns: `repeat(${optionCount}, 1fr)` }}>
                                                    {activeLabels.map(label => {
                                                        const opt = q.options.find(o => o.label === label);
                                                        return (
                                                            <div key={label} className="relative group">
                                                                <div
                                                                    className={`rounded border text-center cursor-pointer transition-all ${
                                                                        opt
                                                                            ? 'border-emerald-200 hover:border-emerald-400'
                                                                            : 'border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50'
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (opt) setPreviewImage(opt.image);
                                                                        else setCropTarget(label);
                                                                    }}
                                                                    title={opt ? `${label} variantı` : `${label} kəs`}
                                                                >
                                                                    {opt ? (
                                                                        <img src={opt.image} alt={label} className="w-full h-auto rounded" />
                                                                    ) : (
                                                                        <div className="py-2 text-[10px] font-bold text-gray-300">{label}</div>
                                                                    )}
                                                                    <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold bg-black/40 text-white rounded-b leading-tight py-0.5">
                                                                        {label}
                                                                    </div>
                                                                </div>
                                                                {opt && (
                                                                    <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openAnnotator(opt.image, qIdx, label); }}
                                                                            className="p-0.5 bg-white rounded text-indigo-600 shadow"
                                                                        >
                                                                            <HiOutlinePencil className="w-2.5 h-2.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteOption(q.id, label); }}
                                                                            className="p-0.5 bg-white rounded text-red-500 shadow"
                                                                        >
                                                                            <HiOutlineX className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Simple mode: show text preview of options that will be auto-generated */}
                                            {cropMode === 'simple' && (
                                                <div className="px-2 pb-2">
                                                    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${optionCount}, 1fr)` }}>
                                                        {activeLabels.map(lbl => (
                                                            <div key={lbl} className="bg-gray-50 border border-dashed border-gray-200 rounded text-center py-1 text-[9px] font-bold text-gray-400">
                                                                {lbl}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 text-center mt-1">Avtomatik yaradılacaq</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-2 bg-white border-t border-gray-200 space-y-1.5 shrink-0">
                                    <button
                                        onClick={handleBatchFinish}
                                        disabled={crops.length === 0}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-all"
                                    >
                                        Sualları Yarat ({crops.length})
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-1.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Ləğv et
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Annotator */}
            {annotator && (
                <ImageAnnotatorModal
                    src={annotator.src}
                    onConfirm={handleAnnotatorConfirm}
                    onClose={() => setAnnotator(null)}
                />
            )}

            {/* Enlarged Preview */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-5xl max-h-full">
                        <img src={previewImage} alt="Böyüdülmüş baxış" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white/10" />
                        <button className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-full p-2 shadow-xl hover:bg-gray-100" onClick={() => setPreviewImage(null)}>
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfCropperModal;
