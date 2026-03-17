import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX, HiOutlinePlus, HiOutlineMinus, HiOutlineScissors } from 'react-icons/hi';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfCropperModal = ({ isOpen, onClose, file, onCropComplete, isBatchMode = false }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [crops, setCrops] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const pageRef = useRef(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setCrop(undefined);
        setCompletedCrop(null);
    };

    const changePage = (offset) => {
        setPageNumber(prev => prev + offset);
        setCompletedCrop(null);
        setCrop(undefined);
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
            setCrops(prev => [...prev, base64Image]);
            setCompletedCrop(null);
            setCrop(undefined);
        } else {
            onCropComplete(base64Image);
            onClose();
        }
    };

    const handleBatchFinish = () => {
        onCropComplete(crops);
        onClose();
        setCrops([]);
    };

    if (!isOpen || !file) return null;

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

                        {/* PDF Viewer — flex-1 takes all remaining height */}
                        <div className="flex-1 min-h-0 bg-gray-100 rounded-xl border border-gray-200 overflow-auto flex justify-center p-3">
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
                                        <Page
                                            pageNumber={pageNumber}
                                            scale={zoom}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </Document>
                                </div>
                            </ReactCrop>
                        </div>

                        {/* Controls Bar — always visible, never overflows */}
                        <div className="shrink-0 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2 flex-wrap">
                            {/* Zoom */}
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                    <HiOutlineMinus className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-gray-700 w-12 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                    <HiOutlinePlus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={pageNumber <= 1} onClick={() => changePage(-1)}
                                    className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={numPages || 1}
                                    value={pageNumber}
                                    onChange={e => {
                                        const v = parseInt(e.target.value);
                                        if (v >= 1 && v <= (numPages || 1)) {
                                            setPageNumber(v);
                                            setCompletedCrop(null);
                                            setCrop(undefined);
                                        }
                                    }}
                                    className="w-14 text-center px-2 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-400"
                                />
                                <span className="text-sm text-gray-500">/ {numPages || '--'}</span>
                                <button type="button" disabled={pageNumber >= numPages} onClick={() => changePage(1)}
                                    className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Kəs Button */}
                            <button
                                onClick={handleCropAction}
                                disabled={!completedCrop?.width || !completedCrop?.height}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <HiOutlineScissors className="w-4 h-4" />
                                Kəs
                            </button>
                        </div>
                    </div>

                    {/* Right: Batch Panel */}
                    {isBatchMode && (
                        <div className="w-56 shrink-0 flex flex-col gap-2">
                            <div className="flex-1 min-h-0 flex flex-col bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                                    <span className="font-bold text-gray-800 text-sm">Kəsilmiş Şəkillər</span>
                                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{crops.length}</span>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                                    {crops.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <HiOutlineScissors className="w-8 h-8 text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-400">PDF-dən seçib "Kəs" düyməsinə basın</p>
                                        </div>
                                    ) : crops.map((src, idx) => (
                                        <div key={idx} className="relative group bg-white border border-gray-200 rounded-lg p-1 shadow-sm hover:border-indigo-300">
                                            <div className="cursor-zoom-in overflow-hidden rounded" onClick={() => setPreviewImage(src)}>
                                                <img src={src} alt={`Crop ${idx + 1}`} className="w-full h-auto rounded" />
                                            </div>
                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded-md font-mono pointer-events-none">
                                                Sual {idx + 1}
                                            </div>
                                            <button onClick={() => setCrops(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <HiOutlineX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 bg-white border-t border-gray-200 space-y-1.5 shrink-0">
                                    <button onClick={handleBatchFinish} disabled={crops.length === 0}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-all">
                                        Sualları Yarat ({crops.length})
                                    </button>
                                    <button onClick={onClose}
                                        className="w-full py-1.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors">
                                        Ləğv et
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enlarged Preview */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-5xl max-h-full">
                        <img src={previewImage} alt="Böyüdülmüş baxış"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white/10" />
                        <button className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-full p-2 shadow-xl hover:bg-gray-100"
                            onClick={() => setPreviewImage(null)}>
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfCropperModal;
