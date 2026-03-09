import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX, HiOutlinePlus, HiOutlineMinus, HiOutlineScissors } from 'react-icons/hi';
import Modal from './Modal';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfCropperModal = ({ isOpen, onClose, file, onCropComplete, isBatchMode = false }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [zoom, setZoom] = useState(1.5); // 1.5 = 150%
    const [crops, setCrops] = useState([]); // For batch mode
    const [previewImage, setPreviewImage] = useState(null); // For enlarging a crop

    // Crop state
    const [crop, setCrop] = useState({ unit: '%', width: 80, height: 30, x: 10, y: 10 });
    const [completedCrop, setCompletedCrop] = useState(null);

    // Refs
    const pageRef = useRef(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setCrop({ unit: '%', width: 80, height: 50, x: 10, y: 25 }); // Reset crop on new file
        setCompletedCrop(null);
    };

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
        setCompletedCrop(null);
    };

    const captureCrop = async () => {
        if (!completedCrop || !completedCrop.width || !completedCrop.height || !pageRef.current) {
            return null;
        }

        const canvas = pageRef.current.querySelector('canvas');
        if (!canvas) return null;

        const cropCanvas = document.createElement('canvas');
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;

        cropCanvas.width = completedCrop.width * scaleX;
        cropCanvas.height = completedCrop.height * scaleY;

        const ctx = cropCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(
            canvas,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY
        );

        return cropCanvas.toDataURL('image/png');
    };

    const handleCropAction = async () => {
        const base64Image = await captureCrop();
        if (!base64Image) return;

        if (isBatchMode) {
            setCrops([...crops, base64Image]);
            setCompletedCrop(null);
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

    const removeCrop = (index) => {
        setCrops(crops.filter((_, i) => i !== index));
    };

    if (!file) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isBatchMode ? "PDF-dən Çoxlu Sual Yarat" : "Şəkil kəsimi (PDF)"}
            maxWidth={isBatchMode ? "max-w-6xl" : "max-w-4xl"}
        >
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Side: PDF Viewer */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="bg-gray-100 rounded-xl overflow-auto w-full max-h-[60vh] flex justify-center p-4 border border-gray-200">
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                            className="max-w-full"
                        >
                            <div ref={pageRef} className="shadow-lg border border-gray-300 rounded overflow-hidden">
                                <Document
                                    file={file}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={<div className="p-10 text-gray-500">PDF yüklənir...</div>}
                                    error={<div className="p-10 text-red-500">PDF xətası! Bəlkə fayl zədəlidir?</div>}
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

                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 gap-4">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                                title="Kiçilt"
                            >
                                <HiOutlineMinus className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-gray-700 min-w-[50px] text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                                title="Böyüt"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={pageNumber <= 1}
                                onClick={() => changePage(-1)}
                                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                <HiOutlineChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-1.5">
                                <input
                                    type="number"
                                    min="1"
                                    max={numPages}
                                    value={pageNumber}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val >= 1 && val <= numPages) setPageNumber(val);
                                    }}
                                    className="w-10 text-center border-none p-0 focus:ring-0 text-sm font-bold"
                                />
                                <span className="text-gray-400 mx-1">/</span>
                                <span className="text-sm font-medium text-gray-600">{numPages || '--'}</span>
                            </div>
                            <button
                                type="button"
                                disabled={pageNumber >= numPages}
                                onClick={() => changePage(1)}
                                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                <HiOutlineChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Main Action */}
                        <button
                            onClick={handleCropAction}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-40"
                        >
                            <HiOutlineScissors className="w-5 h-5" />
                            Kəs
                        </button>
                    </div>
                </div>

                {/* Right Side: Captured Clips (Batch Mode Only) */}
                {isBatchMode && (
                    <div className="w-full lg:w-64 flex flex-col h-[60vh] lg:h-auto">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl flex-1 flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 text-sm italic">Kəsilmiş Şəkillər:</h3>
                                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {crops.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {crops.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                        <div className="w-12 h-12 bg-white rounded-full border border-dashed border-gray-300 flex items-center justify-center mb-2">
                                            <HiOutlineScissors className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-xs text-gray-400">Hələ heç bir hissə kəsilməyib. PDF üzərindən seçib "Kəs" düyməsinə basın.</p>
                                    </div>
                                ) : (
                                    crops.map((src, idx) => (
                                        <div key={idx} className="relative group bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm transition-hover hover:border-indigo-300">
                                            <div
                                                className="cursor-zoom-in overflow-hidden rounded"
                                                onClick={() => setPreviewImage(src)}
                                            >
                                                <img src={src} alt={`Crop ${idx + 1}`} className="w-full h-auto rounded transition-transform group-hover:scale-105" />
                                            </div>
                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded-md font-mono pointer-events-none">
                                                Sual {idx + 1}
                                            </div>
                                            <button
                                                onClick={() => removeCrop(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <HiOutlineX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 bg-white border-t border-gray-200 space-y-2">
                                <button
                                    onClick={handleBatchFinish}
                                    disabled={crops.length === 0}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm shadow-indigo-100 shadow-lg transition-all"
                                >
                                    Sualları Yarat ({crops.length})
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Ləğv et
                                </button>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] text-gray-400 text-center uppercase tracking-wider font-bold">Variantlar ilə (A-E)</p>
                    </div>
                )}

                {/* Single Mode Buttons (Hidden in Batch) */}
                {!isBatchMode && (
                    <div className="lg:hidden flex justify-end gap-3 mt-4 w-full">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg"
                        >
                            Ləğv et
                        </button>
                        <button
                            onClick={handleCropAction}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg disabled:opacity-50"
                        >
                            Kəs və Əlavə et
                        </button>
                    </div>
                )}
            </div>

            {/* Enlarged Image Preview Overlay */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl max-h-full">
                        <img
                            src={previewImage}
                            alt="Böyüdülmüş baxış"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white/10"
                        />
                        <button
                            className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-full p-2 shadow-xl hover:bg-gray-100"
                            onClick={() => setPreviewImage(null)}
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                        <p className="absolute -bottom-10 left-0 right-0 text-center text-white font-medium">Baxışı bağlamaq üçün şəkilə və ya kənara klikləyin</p>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default PdfCropperModal;
