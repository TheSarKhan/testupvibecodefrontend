import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { normalizeLatex } from '../../utils/latexNormalize';

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

    // Build a math-node span. Centralised so error/fallback paths stay
    // visually consistent and `data-latex` always survives the round-trip.
    const buildMathSpan = (rawLatex) => {
        const clean = normalizeLatex(rawLatex.trim());
        const safeAttr = clean.replace(/"/g, '&quot;');
        try {
            const mathHtml = katex.renderToString(clean, { throwOnError: false, displayMode: false, strict: 'ignore' });
            return `<span class="math-node mx-1 inline-block align-middle cursor-default bg-blue-50/50 px-1 rounded" contenteditable="false" data-latex="${safeAttr}">${mathHtml}</span>`;
        } catch {
            return `<span class="math-node mx-1 inline-block align-middle cursor-default bg-amber-50 px-1 rounded text-[12px] font-mono text-amber-700" contenteditable="false" data-latex="${safeAttr}">[math]</span>`;
        }
    };

    // Accept all delimiter flavours we see in the wild:
    //   - `$$...$$` (display, our canonical save format)
    //   - `$...$`   (AI providers, copy-paste)
    //   - `\(...\)` and `\[...\]` (KaTeX standard)
    // Order matters in the alternation: `$$` must come before `$` so the
    // engine claims double-dollar pairs first.
    const MATH_DELIMS_RE = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]*?)\\\)/g;

    const replaceMath = (str) => str.replace(MATH_DELIMS_RE, (_, a, b, c, d) =>
        buildMathSpan(a ?? b ?? c ?? d ?? '')
    );

    // Convert stored value (plain text or HTML) + math markers to rendered HTML
    const parseToHtml = (text) => {
        if (!text) return '';

        const renderMathChunk = (clean) => {
            try {
                const mathHtml = katex.renderToString(clean, { throwOnError: false, displayMode: false, strict: 'ignore' });
                // Only treat as broken when KaTeX produced no `.katex` wrapper
                // at all. A partial katex-error span is still readable and
                // strictly better than `[math]`.
                const isBroken = !/class="katex/.test(mathHtml);
                if (!isBroken) {
                    return `<span class="math-node mx-1 inline-block align-middle cursor-default bg-blue-50/50 px-1 rounded" contenteditable="false" data-latex="${clean}">${mathHtml}</span>`;
                }
            } catch { /* fall through */ }
            return `<span class="math-node mx-1 inline-block align-middle cursor-default bg-amber-50 px-1 rounded text-[12px] font-mono text-amber-700" contenteditable="false" data-latex="${clean}">[math]</span>`;
        };

        if (hasHtmlTags(text)) {
            // HTML format: replace any of the four math delimiter flavours.
            // Previously this path handled only `$$...$$`, so AI content
            // saved with single-`$` markers showed as raw `$\frac{1}{x}$`
            // text in the editor.
            return replaceMath(text);
        }

        // Legacy plain text: split, escape HTML in prose, convert math.
        const parts = text.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g);
        let html = '';
        parts.forEach(part => {
            let math = null;
            if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
                math = part.slice(2, -2);
            } else if (part.startsWith('\\[') && part.endsWith('\\]') && part.length > 4) {
                math = part.slice(2, -2);
            } else if (part.startsWith('\\(') && part.endsWith('\\)') && part.length > 4) {
                math = part.slice(2, -2);
            } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                math = part.slice(1, -1);
            }
            if (math !== null) {
                html += buildMathSpan(math);
            } else {
                html += part
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
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
            // Always normalise before handing to KaTeX \u2014 MathLive macros
            // and empty sup/sub slots otherwise crash the renderer and we
            // fall back to raw red text in the editor.
            const cleanLatex = normalizeLatex(latexString);
            let renderedOk = false;
            try {
                const mathHtml = katex.renderToString(cleanLatex, { throwOnError: false, displayMode: false, strict: 'ignore' });
                // Only treat as broken when KaTeX produced absolutely nothing
                // recognisable. A long expression that contains a single
                // unsupported token still renders the rest \u2014 falling back to
                // `[math]` in that case would hide a perfectly readable
                // formula, which is exactly the bug the student reported.
                const isBroken = !/class="katex/.test(mathHtml);
                if (!isBroken) {
                    const span = document.createElement('span');
                    span.className = "math-node mx-1 inline-block align-middle cursor-default bg-blue-50/50 px-1 rounded";
                    span.contentEditable = "false";
                    span.setAttribute('data-latex', cleanLatex);
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
                    renderedOk = true;
                }
            } catch {
                renderedOk = false;
            }
            if (!renderedOk) {
                // KaTeX bailed (or rendered errors) \u2014 embed a compact [math]
                // placeholder so the editor doesn't fill with red raw LaTeX.
                // data-latex still stores the original so the math survives
                // the round-trip and the teacher can see the source on
                // review.
                const placeholder = document.createElement('span');
                placeholder.className = "math-node mx-1 inline-block align-middle cursor-default bg-amber-50 text-amber-700 text-[12px] font-mono px-1 rounded";
                placeholder.contentEditable = "false";
                placeholder.setAttribute('data-latex', cleanLatex);
                placeholder.textContent = '[math]';
                const space2 = document.createTextNode('\u00A0');
                targetRange.deleteContents();
                targetRange.insertNode(space2);
                targetRange.insertNode(placeholder);
                targetRange.setStartAfter(space2);
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
                ? 'bg-blue-600 text-white border-blue-600'
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
        <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
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
                        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
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
