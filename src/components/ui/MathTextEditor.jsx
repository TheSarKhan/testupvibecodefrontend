import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import 'katex/dist/katex.min.css';
import { safeRenderLatex, escapeHtmlAttr } from '../../utils/latexRender';

const buildOkSpan = (html, latex) =>
    `<span class="math-node mx-1 inline-block align-middle cursor-default bg-blue-50/50 px-1 rounded" contenteditable="false" data-latex="${escapeHtmlAttr(latex)}">${html}</span>`;

const buildErrorSpan = (latex) =>
    `<span class="math-node math-error mx-1 inline-flex items-center gap-1 align-middle cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 text-[12px] font-semibold px-2 py-0.5 rounded-md border border-amber-200" contenteditable="false" data-latex="${escapeHtmlAttr(latex)}" title="Düstur xətalıdır — redaktə etmək üçün basın">⚠ Düstur xətalı</span>`;

const FONT_SIZES = [
    { label: 'Kiçik', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Böyük', value: '5' },
    { label: 'X-Böyük', value: '6' },
];

// Detect if a string already contains HTML tags (new format) vs plain text (old format)
const hasHtmlTags = (text) => text && /<[a-z][\s\S]*>/i.test(text);

const MathTextEditor = forwardRef(({ value, onChange, placeholder, className, showToolbar = false, editorKey }, ref) => {
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
            // queryCommandState is reliable for bold/italic/underline/strike.
            // But for superscript/subscript Chromium starts reporting `false`
            // after 2-3 keystrokes inside <sup>/<sub> even though the caret
            // hasn't actually left the tag — the user sees the button stop
            // glowing and assumes they're back in normal mode (then types
            // expecting normal, gets confused when it stays super). Walking
            // up the DOM from the caret is the source of truth here.
            let inSup = false, inSub = false;
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node = sel.getRangeAt(0).startContainer;
                if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
                if (editorRef.current && node && editorRef.current.contains(node)) {
                    while (node && node !== editorRef.current) {
                        if (node.nodeName === 'SUP') inSup = true;
                        else if (node.nodeName === 'SUB') inSub = true;
                        node = node.parentNode;
                    }
                }
            }
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                superscript: inSup || document.queryCommandState('superscript'),
                subscript:  inSub || document.queryCommandState('subscript'),
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

    // Build a math-node span. Routes through safeRenderLatex so a malformed
    // expression downgrades to a clickable amber chip instead of red raw text.
    // `data-latex` keeps the *original* source so the student's intent isn't
    // silently rewritten by the repair pass.
    const buildMathSpan = (rawLatex) => {
        const original = String(rawLatex).trim();
        const result = safeRenderLatex(original);
        if (result.ok) return buildOkSpan(result.html, original);
        return buildErrorSpan(original);
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
        // Refresh the toolbar's active state on every keystroke so the
        // superscript/subscript pill stays lit while the caret is still
        // inside <sup>/<sub>. `selectionchange` alone misses some typing
        // events in Chromium, which made the button look like it had
        // toggled off mid-typing.
        updateActiveFormats();
    };

    const handleBlur = () => {
        isEditing.current = false;
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    // Click on the amber "⚠ Düstur xətalı" chip bubbles a custom event up to
    // the parent so it can re-open MathFormulaModal with the broken LaTeX
    // preloaded for fixing. `editorKey` lets a parent that hosts multiple
    // editors (QuestionEditor has ~8 — main, sample, options, matching
    // sides) route the event back to the right editor's imperative ref.
    const handleClick = (e) => {
        const chip = e.target.closest('.math-error');
        if (!chip || !editorRef.current?.contains(chip)) return;
        const latex = chip.getAttribute('data-latex') || '';
        editorRef.current.dispatchEvent(new CustomEvent('math-edit-request', {
            bubbles: true,
            detail: { latex, editorKey },
        }));
    };

    const restoreSelection = () => {
        if (!savedSelection.current) return;
        const sel = window.getSelection();
        try {
            sel.removeAllRanges();
            sel.addRange(savedSelection.current);
        } catch {}
    };

    // Move the caret OUT of the nearest <sup>/<sub> ancestor by inserting a
     // zero-width space after the element and parking the caret there. We need
     // this because `document.execCommand('superscript')` reliably toggles only
     // when a range is selected — with a bare caret inside an empty <sup> the
     // browser leaves the caret WHERE it is, so the next keystroke still types
     // in superscript. Symptom users hit: click x², type "²", click x² again,
     // expect normal text — but typing continues in superscript.
    const exitSuperOrSub = (tagName) => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return false; // real selection — let execCommand toggle it
        let node = range.startContainer;
        while (node && node !== editorRef.current && node.nodeName !== tagName) {
            node = node.parentNode;
        }
        if (!node || node.nodeName !== tagName) return false;
        const zws = document.createTextNode('​');
        if (node.nextSibling) node.parentNode.insertBefore(zws, node.nextSibling);
        else node.parentNode.appendChild(zws);
        const newRange = document.createRange();
        newRange.setStartAfter(zws);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        return true;
    };

    const execFormat = (command, val = null) => {
        editorRef.current?.focus();
        restoreSelection();
        // Caret-only escape from superscript/subscript: if the user is parked
        // inside a <sup>/<sub> with nothing selected and clicks the same
        // button, jump the caret out instead of relying on execCommand's
        // flaky toggle behaviour.
        if (command === 'superscript' && exitSuperOrSub('SUP')) {
            handleChange();
            updateActiveFormats();
            return;
        }
        if (command === 'subscript' && exitSuperOrSub('SUB')) {
            handleChange();
            updateActiveFormats();
            return;
        }
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
            // Goes through the same safeRenderLatex pipeline as buildMathSpan
            // \u2014 single source of truth for "render or downgrade to chip".
            const original = String(latexString);
            const result = safeRenderLatex(original);
            const wrapper = document.createElement('span');
            wrapper.innerHTML = result.ok
                ? buildOkSpan(result.html, original)
                : buildErrorSpan(original);
            const span = wrapper.firstChild;
            const space = document.createTextNode('\u00A0');
            targetRange.deleteContents();
            targetRange.insertNode(space);
            targetRange.insertNode(span);
            targetRange.setStartAfter(space);
            targetRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(targetRange);
            savedSelection.current = targetRange.cloneRange();
            isEditing.current = true;
            handleChange();
        },
        // Replace the math-node currently focused (or the first error chip
        // matching the given LaTeX) \u2014 used by the click-to-edit error flow
        // so a fixed formula slots back where the broken one was.
        replaceMath: (oldLatex, newLatex) => {
            if (!editorRef.current) return false;
            const nodes = editorRef.current.querySelectorAll('.math-node');
            for (const node of nodes) {
                if (node.getAttribute('data-latex') === oldLatex) {
                    const original = String(newLatex);
                    const result = safeRenderLatex(original);
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = result.ok
                        ? buildOkSpan(result.html, original)
                        : buildErrorSpan(original);
                    node.replaceWith(wrapper.firstChild);
                    isEditing.current = true;
                    handleChange();
                    return true;
                }
            }
            return false;
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
                onClick={handleClick}
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
                onClick={handleClick}
                className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 block ${className}`}
                data-placeholder={placeholder}
                spellCheck={false}
                style={{ minHeight: '80px' }}
            />
        </div>
    );
});

export default MathTextEditor;
