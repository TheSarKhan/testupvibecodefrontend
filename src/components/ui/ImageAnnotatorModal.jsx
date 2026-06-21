import { useEffect, useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    HiOutlineX, HiOutlineCheck, HiOutlineArrowLeft, HiOutlineTrash,
    HiOutlineSwitchHorizontal, HiOutlineSwitchVertical, HiOutlineScissors,
    HiOutlineRefresh,
} from 'react-icons/hi';

const TOOLS = [
    { id: 'pen', label: 'Qələm', icon: '✏️', cursor: 'crosshair' },
    { id: 'marker', label: 'Marker', icon: '🖍', cursor: 'crosshair' },
    { id: 'eraser', label: 'Silgi', icon: '🧹', cursor: 'cell' },
];

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff'];

const SIZES = [
    { id: 'sm', pen: 2, marker: 8, eraser: 16 },
    { id: 'md', pen: 4, marker: 16, eraser: 32 },
    { id: 'lg', pen: 8, marker: 28, eraser: 56 },
];

const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
});

/**
 * ImageAnnotatorModal
 *
 * Lets the teacher clean up an image extracted from a (often scanned, skewed)
 * PDF before it becomes a question: freehand annotate (pen/marker/eraser) AND
 * geometric edits — rotate, flip, crop — so a crooked or oversized scan can be
 * straightened and trimmed for readability. "Sıfırla" reverts every edit back to
 * the original.
 *
 * Props:
 *   src       — base64 image string to edit
 *   onConfirm — (newBase64) => void
 *   onClose   — () => void
 */
const ImageAnnotatorModal = ({ src, onConfirm, onClose }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const cropImgRef = useRef(null);
    const historyRef = useRef([]); // stack of ImageData snapshots for stroke undo

    // The working image. Transforms (rotate/flip/crop) bake the current canvas
    // — image + any drawings — into a new data URL and swap it in here, which
    // reloads a fresh canvas at the new dimensions.
    const [imgSrc, setImgSrc] = useState(src);

    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#ef4444');
    const [sizeId, setSizeId] = useState('md');
    const [drawing, setDrawing] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [busy, setBusy] = useState(false);

    // Crop sub-mode: while active the canvas is hidden and ReactCrop overlays
    // the current image so the teacher can pick a region to keep.
    const [cropMode, setCropMode] = useState(false);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);

    // If the modal is reused for a different image, reset the working copy.
    useEffect(() => {
        setImgSrc(src);
        setCropMode(false);
    }, [src]);

    // Load the working image onto the canvas whenever it changes.
    useEffect(() => {
        if (!imgSrc || cropMode || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            imgRef.current = img;
            historyRef.current = [];
            setCanUndo(false);
        };
        img.src = imgSrc;
    }, [imgSrc, cropMode]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const getStrokeWidth = () => {
        const sz = SIZES.find(s => s.id === sizeId) || SIZES[1];
        return sz[tool] ?? sz.pen;
    };

    const saveSnapshot = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        setCanUndo(true);
    };

    const handleUndo = () => {
        if (!historyRef.current.length) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const snapshot = historyRef.current.pop();
        ctx.putImageData(snapshot, 0, 0);
        setCanUndo(historyRef.current.length > 0);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        saveSnapshot();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0);
    };

    const startDraw = (e) => {
        if (cropMode) return;
        e.preventDefault();
        saveSnapshot();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setDrawing(true);

        applyToolStyle(ctx);
    };

    const applyToolStyle = (ctx) => {
        const w = getStrokeWidth();
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = w;
        } else if (tool === 'marker') {
            ctx.globalCompositeOperation = 'source-over';
            // Convert hex to rgba with 50% opacity for marker effect
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r},${g},${b},0.45)`;
            ctx.lineWidth = w;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = w;
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const draw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = getPos(e);
        applyToolStyle(ctx);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        setDrawing(false);
    };

    // ─── Geometric transforms ────────────────────────────────────────────────
    // Each bakes the current canvas (image + drawings) and produces a new image.

    const applyTransform = async (kind) => {
        if (busy || !canvasRef.current) return;
        setBusy(true);
        try {
            const baked = canvasRef.current.toDataURL('image/png');
            const img = await loadImage(baked);
            const out = document.createElement('canvas');
            const ctx = out.getContext('2d');
            const w = img.naturalWidth, h = img.naturalHeight;

            if (kind === 'rotateCW' || kind === 'rotateCCW') {
                out.width = h;
                out.height = w;
                ctx.translate(out.width / 2, out.height / 2);
                ctx.rotate((kind === 'rotateCW' ? 90 : -90) * Math.PI / 180);
                ctx.drawImage(img, -w / 2, -h / 2);
            } else if (kind === 'flipH') {
                out.width = w;
                out.height = h;
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0);
            } else if (kind === 'flipV') {
                out.width = w;
                out.height = h;
                ctx.translate(0, h);
                ctx.scale(1, -1);
                ctx.drawImage(img, 0, 0);
            }
            setImgSrc(out.toDataURL('image/png'));
        } finally {
            setBusy(false);
        }
    };

    // ─── Crop sub-mode ───────────────────────────────────────────────────────

    const enterCropMode = () => {
        if (!canvasRef.current) return;
        // Bake current drawings in first so the crop operates on the latest state.
        setImgSrc(canvasRef.current.toDataURL('image/png'));
        setCrop(undefined);
        setCompletedCrop(null);
        setCropMode(true);
    };

    const cancelCrop = () => {
        setCropMode(false);
        setCrop(undefined);
        setCompletedCrop(null);
    };

    const applyCrop = () => {
        const img = cropImgRef.current;
        if (!completedCrop?.width || !completedCrop?.height || !img) {
            cancelCrop();
            return;
        }
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        const out = document.createElement('canvas');
        out.width = Math.round(completedCrop.width * scaleX);
        out.height = Math.round(completedCrop.height * scaleY);
        const ctx = out.getContext('2d');
        ctx.drawImage(
            img,
            completedCrop.x * scaleX, completedCrop.y * scaleY,
            completedCrop.width * scaleX, completedCrop.height * scaleY,
            0, 0, out.width, out.height
        );
        setImgSrc(out.toDataURL('image/png'));
        setCropMode(false);
        setCrop(undefined);
        setCompletedCrop(null);
    };

    const handleReset = () => {
        if (cropMode) cancelCrop();
        setImgSrc(src);
    };

    const handleConfirm = () => {
        // The working canvas already holds image + drawings; emit it directly.
        const canvas = canvasRef.current;
        if (!canvas) return;
        onConfirm(canvas.toDataURL('image/png'));
    };

    if (!src) return null;

    const isOriginal = imgSrc === src;

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                    <h4 className="font-bold text-gray-900">Şəkli redaktə et</h4>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Transform toolbar — rotate / flip / crop / reset */}
                <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 mr-1">Çevir:</span>
                    <button
                        onClick={() => applyTransform('rotateCCW')}
                        disabled={busy || cropMode}
                        title="Sola döndər (90°)"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                    >
                        <span className="text-base leading-none">↺</span> Sola
                    </button>
                    <button
                        onClick={() => applyTransform('rotateCW')}
                        disabled={busy || cropMode}
                        title="Sağa döndər (90°)"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                    >
                        <span className="text-base leading-none">↻</span> Sağa
                    </button>
                    <button
                        onClick={() => applyTransform('flipH')}
                        disabled={busy || cropMode}
                        title="Üfüqi çevir"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                    >
                        <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" /> Üfüqi
                    </button>
                    <button
                        onClick={() => applyTransform('flipV')}
                        disabled={busy || cropMode}
                        title="Şaquli çevir"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                    >
                        <HiOutlineSwitchVertical className="w-3.5 h-3.5" /> Şaquli
                    </button>

                    <div className="w-px h-5 bg-gray-200 mx-1" />

                    {!cropMode ? (
                        <button
                            onClick={enterCropMode}
                            disabled={busy}
                            title="Şəkli kəs"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                        >
                            <HiOutlineScissors className="w-3.5 h-3.5" /> Kəs
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={applyCrop}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <HiOutlineCheck className="w-3.5 h-3.5" /> Kəsimi tətbiq et
                            </button>
                            <button
                                onClick={cancelCrop}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Ləğv et
                            </button>
                        </>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={isOriginal && !cropMode}
                        title="Bütün dəyişiklikləri sıfırla"
                        className="flex items-center gap-1 ml-auto px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    >
                        <HiOutlineRefresh className="w-3.5 h-3.5" /> Sıfırla
                    </button>
                </div>

                {/* Drawing toolbar (hidden while cropping) */}
                {!cropMode && (
                    <div className="shrink-0 flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                        {/* Tools */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                            {TOOLS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id)}
                                    title={t.label}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                        tool === t.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="mr-1">{t.icon}</span>
                                    <span className="text-xs">{t.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Colors (hidden for eraser) */}
                        {tool !== 'eraser' && (
                            <div className="flex items-center gap-1.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                            color === c ? 'border-blue-600 scale-125' : 'border-gray-300 hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Sizes */}
                        <div className="flex items-center gap-1.5">
                            {SIZES.map(s => {
                                const w = s[tool] ?? s.pen;
                                const displayW = Math.min(w, 20);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setSizeId(s.id)}
                                        className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-colors ${
                                            sizeId === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        <span
                                            className="rounded-full bg-gray-700"
                                            style={{ width: `${Math.max(4, displayW * 0.6)}px`, height: `${Math.max(4, displayW * 0.6)}px` }}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Undo / Clear */}
                        <div className="flex items-center gap-1 ml-auto">
                            <button
                                onClick={handleUndo}
                                disabled={!canUndo}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                            >
                                <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Geri al
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <HiOutlineTrash className="w-3.5 h-3.5" /> Təmizlə
                            </button>
                        </div>
                    </div>
                )}

                {/* Canvas / crop area */}
                <div ref={containerRef} className="flex-1 min-h-0 overflow-auto bg-gray-200 flex items-center justify-center p-4">
                    {cropMode ? (
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                            style={{ maxWidth: '100%' }}
                        >
                            <img
                                ref={cropImgRef}
                                src={imgSrc}
                                alt="Kəsim"
                                style={{ maxWidth: '100%', maxHeight: '65vh', display: 'block', borderRadius: '8px' }}
                            />
                        </ReactCrop>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={endDraw}
                            onMouseLeave={endDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={endDraw}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '65vh',
                                display: 'block',
                                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                                borderRadius: '8px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                                touchAction: 'none',
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Ləğv et
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={cropMode}
                        title={cropMode ? 'Əvvəlcə kəsimi tətbiq edin və ya ləğv edin' : undefined}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
                    >
                        <HiOutlineCheck className="w-4 h-4" />
                        Tətbiq et
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageAnnotatorModal;
