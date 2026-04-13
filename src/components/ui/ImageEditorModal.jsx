import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import {
    MdOutlinePentagon,
    MdOutlineCircle,
    MdTextFields,
    MdUndo,
    MdRedo,
    MdRestartAlt,
} from 'react-icons/md';
import { BiEraser, BiSquare } from 'react-icons/bi';
import { TbArrowUpRight, TbPencil, TbHighlight } from 'react-icons/tb';
import { HiOutlineCheck } from 'react-icons/hi2';

const TOOLS = {
    PENCIL: 'pencil',
    ERASER: 'eraser',
    RECT: 'rect',
    CIRCLE: 'circle',
    HIGHLIGHT: 'highlight',
    ARROW: 'arrow',
    TEXT: 'text',
};

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#a855f7',
    '#000000', '#ffffff',
];

const ImageEditorModal = ({ isOpen, imageBase64, onSave, onClose }) => {
    const canvasRef = useRef(null);
    const originalCanvasRef = useRef(null); // for eraser: restore original pixels
    const isDrawingRef = useRef(false);
    const startPosRef = useRef(null);
    const snapshotRef = useRef(null);    // used during shape drawing to restore canvas before re-drawing
    const historyRef = useRef([]);
    const historyIdxRef = useRef(-1);

    const [activeTool, setActiveTool] = useState(TOOLS.PENCIL);
    const [color, setColor] = useState('#ef4444');
    const [brushSize, setBrushSize] = useState(3);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, canvasX: 0, canvasY: 0, value: '' });
    const textInputRef = useRef(null);

    const syncHistoryState = () => {
        setCanUndo(historyIdxRef.current > 0);
        setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    };

    const pushHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const snap = canvas.toDataURL();
        historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
        historyRef.current.push(snap);
        if (historyRef.current.length > 40) {
            historyRef.current.shift();
        } else {
            historyIdxRef.current++;
        }
        syncHistoryState();
    }, []);

    const restoreCanvas = (dataUrl) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    };

    const undo = () => {
        if (historyIdxRef.current <= 0) return;
        historyIdxRef.current--;
        restoreCanvas(historyRef.current[historyIdxRef.current]);
        syncHistoryState();
    };

    const redo = () => {
        if (historyIdxRef.current >= historyRef.current.length - 1) return;
        historyIdxRef.current++;
        restoreCanvas(historyRef.current[historyIdxRef.current]);
        syncHistoryState();
    };

    const resetAll = () => {
        if (!historyRef.current.length) return;
        restoreCanvas(historyRef.current[0]);
        historyRef.current = [historyRef.current[0]];
        historyIdxRef.current = 0;
        syncHistoryState();
    };

    // Load image when modal opens
    useEffect(() => {
        if (!isOpen || !imageBase64) return;
        // Defer until canvas is mounted
        const timer = setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Keep a clean copy for the eraser
                const orig = document.createElement('canvas');
                orig.width = img.width;
                orig.height = img.height;
                orig.getContext('2d').drawImage(img, 0, 0);
                originalCanvasRef.current = orig;

                // Seed history
                historyRef.current = [canvas.toDataURL()];
                historyIdxRef.current = 0;
                syncHistoryState();
            };
            img.src = imageBase64;
        }, 50);
        return () => clearTimeout(timer);
    }, [isOpen, imageBase64]);

    useEffect(() => {
        if (textInput.visible && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [textInput.visible]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY,
            screenX: src.clientX - rect.left,
            screenY: src.clientY - rect.top,
        };
    };

    const applyCtxStyle = (ctx) => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const drawArrow = (ctx, x1, y1, x2, y2) => {
        const headLen = Math.max(12, brushSize * 5);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    };

    const onMouseDown = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        if (activeTool === TOOLS.TEXT) {
            setTextInput({ visible: true, x: pos.screenX, y: pos.screenY, canvasX: pos.x, canvasY: pos.y, value: '' });
            return;
        }

        isDrawingRef.current = true;
        startPosRef.current = pos;
        applyCtxStyle(ctx);

        if ([TOOLS.RECT, TOOLS.CIRCLE, TOOLS.HIGHLIGHT, TOOLS.ARROW].includes(activeTool)) {
            snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        if (activeTool === TOOLS.PENCIL) {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };

    const onMouseMove = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        applyCtxStyle(ctx);

        switch (activeTool) {
            case TOOLS.PENCIL:
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                break;

            case TOOLS.ERASER: {
                const r = brushSize * 5;
                if (originalCanvasRef.current) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(originalCanvasRef.current, 0, 0);
                    ctx.restore();
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case TOOLS.RECT:
                ctx.putImageData(snapshotRef.current, 0, 0);
                ctx.beginPath();
                ctx.rect(
                    startPosRef.current.x, startPosRef.current.y,
                    pos.x - startPosRef.current.x,
                    pos.y - startPosRef.current.y
                );
                ctx.stroke();
                break;

            case TOOLS.CIRCLE: {
                ctx.putImageData(snapshotRef.current, 0, 0);
                const rx = Math.abs(pos.x - startPosRef.current.x) / 2;
                const ry = Math.abs(pos.y - startPosRef.current.y) / 2;
                const cx = startPosRef.current.x + (pos.x - startPosRef.current.x) / 2;
                const cy = startPosRef.current.y + (pos.y - startPosRef.current.y) / 2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }

            case TOOLS.HIGHLIGHT:
                ctx.putImageData(snapshotRef.current, 0, 0);
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = color;
                ctx.fillRect(
                    startPosRef.current.x, startPosRef.current.y,
                    pos.x - startPosRef.current.x,
                    pos.y - startPosRef.current.y
                );
                ctx.globalAlpha = 1;
                break;

            case TOOLS.ARROW:
                ctx.putImageData(snapshotRef.current, 0, 0);
                drawArrow(ctx, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y);
                break;
        }
    };

    const onMouseUp = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        pushHistory();
    };

    const commitText = () => {
        if (!textInput.value.trim()) {
            setTextInput(p => ({ ...p, visible: false }));
            return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const fontSize = Math.max(16, brushSize * 7);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillText(textInput.value, textInput.canvasX, textInput.canvasY + fontSize * 0.8);
        setTextInput(p => ({ ...p, visible: false }));
        pushHistory();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        onSave(canvas.toDataURL('image/png'));
    };

    if (!isOpen) return null;

    const tools = [
        { id: TOOLS.PENCIL, label: 'Qələm', Icon: TbPencil },
        { id: TOOLS.ERASER, label: 'Silgi', Icon: BiEraser },
        { id: TOOLS.RECT, label: 'Düzbucaq', Icon: BiSquare },
        { id: TOOLS.CIRCLE, label: 'Dairə', Icon: MdOutlineCircle },
        { id: TOOLS.HIGHLIGHT, label: 'Vurğu', Icon: TbHighlight },
        { id: TOOLS.ARROW, label: 'Ok', Icon: TbArrowUpRight },
        { id: TOOLS.TEXT, label: 'Mətn', Icon: MdTextFields },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
            <div className="relative flex flex-col bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                    <h3 className="text-base font-bold text-gray-900">Şəkil Redaktoru</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all"
                        >
                            <HiOutlineCheck className="w-4 h-4" />
                            Saxla
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                            <HiOutlineX className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left Toolbar */}
                    <div className="w-[72px] shrink-0 flex flex-col items-center gap-1 py-3 px-1.5 bg-gray-50 border-r border-gray-200 overflow-y-auto">

                        {/* Tools */}
                        {tools.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                title={label}
                                onClick={() => setActiveTool(id)}
                                className={`w-full py-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-0.5 ${
                                    activeTool === id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-[9px] font-semibold leading-none">{label}</span>
                            </button>
                        ))}

                        <div className="w-full border-t border-gray-200 my-1" />

                        {/* Color palette */}
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide self-start px-1">Rəng</span>
                        <div className="grid grid-cols-2 gap-1 w-full px-0.5">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{ backgroundColor: c }}
                                    className={`aspect-square rounded-md border-2 transition-all ${
                                        color === c
                                            ? 'border-indigo-500 scale-110 shadow'
                                            : 'border-gray-300 hover:scale-105'
                                    }`}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 mt-0.5"
                            title="Xüsusi rəng"
                        />

                        <div className="w-full border-t border-gray-200 my-1" />

                        {/* Brush size */}
                        <div className="w-full px-0.5 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-400 font-semibold uppercase">Ölçü</span>
                                <span className="text-[9px] font-bold text-indigo-600">{brushSize}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={brushSize}
                                onChange={e => setBrushSize(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            {/* Size preview dot */}
                            <div className="flex justify-center">
                                <div
                                    style={{
                                        width: Math.max(4, Math.min(brushSize * 2, 32)),
                                        height: Math.max(4, Math.min(brushSize * 2, 32)),
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                        transition: 'all 0.15s',
                                    }}
                                />
                            </div>
                        </div>

                        <div className="w-full border-t border-gray-200 my-1" />

                        {/* Undo / Redo / Reset */}
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            title="Geri al (Ctrl+Z)"
                            className="w-full py-1.5 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center gap-0.5 transition-all"
                        >
                            <MdUndo className="w-4 h-4" />
                            <span className="text-[9px] font-semibold">Geri</span>
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            title="İrəli (Ctrl+Y)"
                            className="w-full py-1.5 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center gap-0.5 transition-all"
                        >
                            <MdRedo className="w-4 h-4" />
                            <span className="text-[9px] font-semibold">İrəli</span>
                        </button>
                        <button
                            onClick={resetAll}
                            title="Sıfırla"
                            className="w-full py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex flex-col items-center gap-0.5 transition-all"
                        >
                            <MdRestartAlt className="w-4 h-4" />
                            <span className="text-[9px] font-semibold">Sıfırla</span>
                        </button>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 min-w-0 min-h-0 overflow-auto bg-[#e5e7eb] flex items-start justify-start p-3 relative">
                        <canvas
                            ref={canvasRef}
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                display: 'block',
                                cursor:
                                    activeTool === TOOLS.TEXT ? 'text'
                                    : activeTool === TOOLS.ERASER ? 'cell'
                                    : 'crosshair',
                                borderRadius: '8px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            }}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                            onTouchStart={onMouseDown}
                            onTouchMove={onMouseMove}
                            onTouchEnd={onMouseUp}
                        />

                        {/* Floating text input overlay */}
                        {textInput.visible && (
                            <input
                                ref={textInputRef}
                                type="text"
                                value={textInput.value}
                                onChange={e => setTextInput(p => ({ ...p, value: e.target.value }))}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitText();
                                    if (e.key === 'Escape') setTextInput(p => ({ ...p, visible: false }));
                                }}
                                onBlur={commitText}
                                placeholder="Mətn yazın, Enter ilə təsdiq edin..."
                                style={{
                                    position: 'absolute',
                                    left: textInput.x + 12,
                                    top: textInput.y + 12,
                                    fontSize: `${Math.max(16, brushSize * 7)}px`,
                                    color: color,
                                    background: 'rgba(255,255,255,0.85)',
                                    backdropFilter: 'blur(4px)',
                                    border: '2px dashed ' + color,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    minWidth: '180px',
                                    padding: '4px 8px',
                                    zIndex: 20,
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom hint bar */}
                <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center gap-4 text-[11px] text-gray-400">
                    <span>Qələm, fiqur, mətn, ok alətlərindən istifadə edin.</span>
                    <span className="ml-auto">Silgi orijinal pikseli bərpa edir · Mətn: klikləyin, yazın, Enter</span>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorModal;
