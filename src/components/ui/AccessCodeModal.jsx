import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineKey, HiOutlineX } from 'react-icons/hi';

const AccessCodeModal = ({ code, onClose }) => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <HiOutlineKey className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Tələbə Giriş Kodu</p>
                            <p className="text-xs text-gray-400">Tələbəyə göndər</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>

                <div
                    onClick={copy}
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 cursor-pointer hover:bg-blue-100 transition-colors mb-3"
                >
                    <span className="text-3xl font-black tracking-[0.4em] text-blue-700 font-mono">{code}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {copied ? '✓ Kopyalandı' : 'Kopyala'}
                    </span>
                </div>

                <p className="text-xs text-gray-400 text-center mb-4">Bu kod yalnız <b>1 dəfə</b> istifadə edilə bilər · <b>48 saat</b> keçərlidir</p>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                    Bağla
                </button>
            </div>
        </div>,
        document.body
    );
};

export default AccessCodeModal;
