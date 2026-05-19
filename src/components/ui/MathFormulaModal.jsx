import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import 'mathlive';
import { normalizeLatex } from '../../utils/latexNormalize';

const MathFormulaModal = ({ isOpen, onClose, onInsert }) => {
    const mathFieldRef = useRef(null);
    const [formula, setFormula] = useState('');

    useEffect(() => {
        if (isOpen && mathFieldRef.current) {
            mathFieldRef.current.value = '';
            setFormula('');
            // Focus the math field after modal opens
            setTimeout(() => {
                if (mathFieldRef.current) {
                    mathFieldRef.current.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    const handleInsert = () => {
        const mf = mathFieldRef.current;
        let expanded = '';
        try {
            if (mf && typeof mf.getValue === 'function') {
                // Prefer MathLive's expanded form (which rewrites its own
                // macros internally) and then normaliseLatex on top to catch
                // anything MathLive still leaves behind.
                expanded = mf.getValue('latex-expanded') || mf.getValue('latex') || mf.value || '';
            } else {
                expanded = mf?.value || formula;
            }
        } catch {
            expanded = formula;
        }
        const cleaned = normalizeLatex(expanded).trim();
        if (cleaned) {
            onInsert(cleaned);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} closeOnBackdrop={false} title="Riyaziyyat Formulu Əlavə Et" maxWidth="max-w-2xl">
            <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                    Aşağıdakı xanaya riyazi ifadəni daxil edin. İfadə mətnin içərisinə LaTeX formatında əlavə olunacaq.
                </p>

                <div className="math-field-container border border-gray-300 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow overflow-hidden bg-white shadow-inner">
                    <math-field
                        ref={mathFieldRef}
                        style={{ width: '100%', minHeight: '120px', padding: '16px', fontSize: '1.25rem', backgroundColor: 'transparent' }}
                        onInput={(e) => setFormula(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                        Ləğv et
                    </button>
                    <button
                        type="button"
                        onClick={handleInsert}
                        disabled={!formula.trim()}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        Mətnə Əlavə Et
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MathFormulaModal;
