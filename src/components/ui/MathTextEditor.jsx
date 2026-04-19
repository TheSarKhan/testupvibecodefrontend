import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const FONT_SIZES = [
    { label: 'Kiçik', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Böyük', value: '5' },
    { label: 'X-Böyük', value: '6' },
];

// Detect if a string already contains HTML tags (new format) vs plain text (old format)
const hasHtmlTags = (text) => text && /<[a-z][\s\S]*>/i.test(text);

const MathTextEditor = forwardRef(({ value, onChange, placeholder, className, showToolbar = false }, ref) => {
    const editorRef = useRef(null);
    const isEditing = useRef(false);
    const savedSelection = useRef(null);
    const lastReportedValue = useRef(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, underline: false,
        strikeThrough: false, superscript: false, subscript: false,
    });
    const [fontSize, setFontSize] = useState('3');

    const updateActiveFormats = useCallback(() => {
        try {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                superscript: document.queryCommandState('superscript'),
                subscript: document.queryCommandState('subscript'),
            });
        } catch {}
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                    savedSelection.current = range.cloneRange();
                    updateActiveFormats();
                }
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [updateActiveFormats]);

    // Convert stored value (plain text or HTML) + $$math$$ to rendered HTML
    const parseToHtml = (text) => {
        if (!text) return '';

        if (hasHtmlTags(text)) {
            // New HTML format: just replace $$math$$ markers
            return text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
                try {
                    const mathHtml = katex.renderToString(latex.trim(), { throwOnError: false, displayMode: false });
                    return `<span class="math-node mx-1 inline-block align-middle cursor-default bg-indigo-50/50 px-1 rounded" contenteditable="false" data-latex="${latex.trim()}">${mathHtml}</span>`;
                } catch { return `$$${latex}$$`; }
            });
        }

        // Legacy plain text format: split on math markers + escape HTML + convert newlines
        const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);
        let html = '';
        parts.forEach(part => {
            let math = null;
            if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
                math = part.slice(2, -2).trim();
            } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                math = part.slice(1, -1).trim();
            }
            if (math !== null) {
                try {
                    const mathHtml = katex.renderToString(math, { throwOnError: false, displayMode: false });
                    html += `<span class="math-node mx-1 inline-block align-middle cursor-default bg-indigo-50/50 px-1 rounded" contenteditable="false" data-latex="${math}">${mathHtml}</span>`;
                } catch { html += part; }
            } else {
                html += part
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
            }
        });
        return html;
    };

    useEffect(() => {
        if (!editorRef.current) return;
        const normalizedExternal = value || '';
        const normalizedInternal = lastReportedValue.current === null ? null : (lastReportedValue.current || '');
        if (normalizedExternal !== normalizedInternal) {
            editorRef.current.innerHTML = parseToHtml(normalizedExternal);
            lastReportedValue.current = value;
        }
    }, [value]);

    // Extract current editor content as HTML string with math-nodes replaced by $$latex$$
    const extractValue = (rootNode) => {
        const clone = rootNode.cloneNode(true);
        clone.querySelectorAll('.math-node').forEach(node => {
            node.replaceWith(`$$${node.getAttribute('data-latex')}$$`);
        });
        // Normalize block-level div/p elements to <br> so line breaks render consistently everywhere
        clone.querySelectorAll('div, p').forEach(block => {
            if (block === clone) return;
            const br = document.createElement('br');
            block.before(br);
            while (block.firstChild) block.before(block.firstChild);
            block.remove();
        });
        return clone.innerHTML;
    };

    const handleChange = () => {
        if (!editorRef.current) return;
        const newValue = extractValue(editorRef.current);
        lastReportedValue.current = newValue;
        onChange(newValue);
    };

    const handleInput = () => {
        isEditing.current = true;
        handleChange();
    };

    const handleBlur = () => {
        isEditing.current = false;
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const restoreSelection = () => {
        if (!savedSelection.current) return;
        const sel = window.getSelection();
        try {
            sel.removeAllRanges();
            sel.addRange(savedSelection.current);
        } catch {}
    };

    const execFormat = (command, val = null) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand(command, false, val);
        handleChange();
        updateActiveFormats();
    };

    const applyFontSize = (size) => {
        setFontSize(size);
        execFormat('fontSize', size);
    };

    useImperativeHandle(ref, () => ({
        insertText: (text) => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            const sel = window.getSelection();
            let targetRange = savedSelection.current;
            if (!targetRange) {
                targetRange = document.createRange();
                targetRange.selectNodeContents(editorRef.current);
                targetRange.collapse(false);
            }
            const textNode = document.createTextNode(text);
            targetRange.deleteContents();
            targetRange.insertNode(textNode);
            targetRange.setStartAfter(textNode);
            targetRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(targetRange);
            savedSelection.current = targetRange.cloneRange();
            isEditing.current = true;
            handleChange();
        },
        insertMath: (latexString) => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            const sel = window.getSelection();
            let targetRange = savedSelection.current;
            if (!targetRange) {
                targetRange = document.createRange();
                targetRange.selectNodeContents(editorRef.current);
                targetRange.collapse(false);
            }
            try {
                const mathHtml = katex.renderToString(latexString, { throwOnError: false, displayMode: false });
                const span = document.createElement('span');
                span.className = "math-node mx-1 inline-block align-middle cursor-default bg-indigo-50/50 px-1 rounded";
                span.contentEditable = "false";
                span.setAttribute('data-latex', latexString);
                span.innerHTML = mathHtml;
                const space = document.createTextNode('\u00A0');
                targetRange.deleteContents();
                targetRange.insertNode(space);
                targetRange.insertNode(span);
                targetRange.setStartAfter(space);
                targetRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(targetRange);
                savedSelection.current = targetRange.cloneRange();
            } catch {
                const textNode = document.createTextNode(` $$ ${latexString} $$ `);
                targetRange.deleteContents();
                targetRange.insertNode(textNode);
                targetRange.setStartAfter(textNode);
                targetRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(targetRange);
                savedSelection.current = targetRange.cloneRange();
            }
            isEditing.current = true;
            handleChange();
        }
    }));

    const btnClass = (active) =>
        `px-2 py-1 rounded text-xs font-bold transition-colors border ${
            active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
        }`;

    if (!showToolbar) {
        return (
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleBlur}
                onPaste={handlePaste}
                className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 block ${className}`}
                data-placeholder={placeholder}
                spellCheck={false}
            />
        );
    }

    return (
        <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
            {showToolbar && (
                <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}
                        className={btnClass(activeFormats.bold)} title="Qalın (Ctrl+B)">
                        <strong>B</strong>
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}
                        className={btnClass(activeFormats.italic)} title="Kursiv (Ctrl+I)">
                        <em>I</em>
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }}
                        className={btnClass(activeFormats.underline)} title="Altdan xətt (Ctrl+U)">
                        <span className="underline">U</span>
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough'); }}
                        className={btnClass(activeFormats.strikeThrough)} title="Üstündən xətt">
                        <span className="line-through">S</span>
                    </button>

                    <div className="w-px h-5 bg-gray-200 mx-0.5" />

                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('superscript'); }}
                        className={btnClass(activeFormats.superscript)} title="Yuxarı indeks">
                        x<sup className="text-[8px]">2</sup>
                    </button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('subscript'); }}
                        className={btnClass(activeFormats.subscript)} title="Aşağı indeks">
                        x<sub className="text-[8px]">2</sub>
                    </button>

                    <div className="w-px h-5 bg-gray-200 mx-0.5" />

                    <select
                        value={fontSize}
                        onChange={(e) => applyFontSize(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
                        title="Hərf ölçüsü"
                    >
                        {FONT_SIZES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>

                    <div className="w-px h-5 bg-gray-200 mx-0.5" />

                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); updateActiveFormats(); }}
                        className="px-2 py-1 rounded text-xs text-gray-500 border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                        title="Formatı sil">
                        T<span className="text-[9px] align-super">×</span>
                    </button>
                </div>
            )}

            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleBlur}
                onPaste={handlePaste}
                className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 block ${className}`}
                data-placeholder={placeholder}
                spellCheck={false}
                style={{ minHeight: '80px' }}
            />
        </div>
    );
});

export default MathTextEditor;
