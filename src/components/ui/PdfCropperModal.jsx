import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX } from 'react-icons/hi';
import Modal from './Modal';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const PdfCropperModal = ({ isOpen, onClose, file, onCropComplete }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    // Crop state
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 30, x: 25, y: 35 });
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
    };

    const handleCropAction = async () => {
        if (!completedCrop || !completedCrop.width || !completedCrop.height || !pageRef.current) {
            return;
        }

        // React-PDF renders to a canvas inside its wrapper. Let's find it.
        const canvas = pageRef.current.querySelector('canvas');
        if (!canvas) return;

        // Create a new canvas to draw the cropped area
        const cropCanvas = document.createElement('canvas');
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;

        cropCanvas.width = completedCrop.width * scaleX;
        cropCanvas.height = completedCrop.height * scaleY;

        const ctx = cropCanvas.getContext('2d');
        if (!ctx) return;

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

        // Convert the cropped area to a base64 Data URL (JPEG for better compression, or PNG)
        const base64Image = cropCanvas.toDataURL('image/png');

        onCropComplete(base64Image);
        onClose();
    };

    if (!file) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Şəkil kəsimi (PDF)" maxWidth="max-w-4xl">
            <div className="flex flex-col items-center">

                {/* PDF Viewer wrapped in ReactCrop */}
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
                                    width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.8, 800) : 800}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </div>
                    </ReactCrop>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            disabled={pageNumber <= 1}
                            onClick={() => changePage(-1)}
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HiOutlineChevronLeft className="w-5 h-5" />
                        </button>
                        <p className="text-sm font-medium text-gray-700">
                            Səhifə {pageNumber} / {numPages || '--'}
                        </p>
                        <button
                            type="button"
                            disabled={pageNumber >= numPages}
                            onClick={() => changePage(1)}
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HiOutlineChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Ləğv et
                        </button>
                        <button
                            onClick={handleCropAction}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                        >
                            Kəs və Əlavə et
                        </button>
                    </div>
                </div>

                <p className="mt-4 text-xs text-gray-400">PDF üzərindəki sahəni mause ilə seçib "Kəs və Əlavə et" düyməsinə klikləyin.</p>
            </div>
        </Modal>
    );
};

export default PdfCropperModal;
