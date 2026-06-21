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
    // Value-based undo/redo. execCommand's native undo is unreliable for
    // superscript/subscript in Chromium (the format survives Ctrl+Z while bold/
    // italic revert fine), so we drive undo off the editor's own value history
    // instead: every change snapshots the prior value, and Ctrl+Z restores it by
    // re-rendering — which reverts EVERY format uniformly, sup/sub included.
    const undoStack = useRef([]);
    const redoStack = useRef([]);
    const isRestoring = useRef(false);
    const lastSnapAt = useRef(0);
    const lastSnapTyping = useRef(false);
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, underline: false,
        strikeThrough: false, superscript: false, subscript: false,
    });
    const [fontSize, setFontSize] = useState('3');
    const [fontMenuOpen, setFontMenuOpen] = useState(false);
    const fontMenuRef = useRef(null);

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
            // Keep the font-size control in sync with whatever the caret is
            // actually sitting in. Without this the dropdown label drifts —
            // it shows the last *picked* size even when the cursor moves into
            // text of a different size, so it "looks selected" but isn't real.
            const fs = document.queryCommandValue('fontSize');
            if (fs) setFontSize(String(fs));
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

    // Close the font-size dropdown when clicking anywhere outside it. We listen
    // on `mousedown` (not `click`) so the close fires before the editor's own
    // selection handling, and the option buttons live inside `fontMenuRef`, so
    // picking one never triggers this.
    useEffect(() => {
        if (!fontMenuOpen) return;
        const onDocMouseDown = (e) => {
            if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) {
                setFontMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [fontMenuOpen]);

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
            // A genuine external value change (e.g. a different question loaded into
            // this editor instance) starts a new document — drop the old undo/redo
            // history so Ctrl+Z can't jump back into the previous content. Restores
            // we drive ourselves keep external==internal, so they skip this branch.
            undoStack.current = [];
            redoStack.current = [];
            lastSnapTyping.current = false;
        }
    }, [value]);

    // Extract current editor content as HTML string with math-nodes replaced by $$latex$$
    const extractValue = (rootNode) => {
        const clone = rootNode.cloneNode(true);
        clone.querySelectorAll('.math-node').forEach(node => {
            node.replaceWith(`$$${node.getAttribute('data-latex')}$$`);
        });
        // Drop EMPTY inline-format elements before serializing. Chromium's
        // execCommand('superscript'/'subscript') at a collapsed caret inserts a
        // bare `<sup></sup>` (bold/italic only set a pending style — no node), and
        // toggling formats off can leave stray empty `<b>`/`<i>` wrappers. If those
        // empties reach the value, each becomes its own undo state: Ctrl+Z then
        // removes the typed character but leaves the empty `<sup>` behind, so the
        // caret stays in superscript and the format looks like it never reverted.
        // This was the root of "üst/alt indeks geri qaytarılmır" — bold/italic
        // undo worked only because they never produced such an empty node.
        // Removing empties keeps the undo history clean so a single Ctrl+Z reverts
        // the whole sup/sub edit. An element holding only a zero-width space (the
        // caret-parking ZWS we insert) or whitespace counts as empty.
        clone.querySelectorAll('sup, sub, b, strong, i, em, u, s, strike').forEach(el => {
            if (el.children.length === 0 && (el.textContent || '').replace(/[\u200B\s]/g, '') === '') {
                el.remove();
            }
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

    // Snapshot the value that existed BEFORE the change about to be reported, so
    // Ctrl+Z can return to it. Consecutive typing within a short window collapses
    // into one undo step (so undo isn't per-keystroke); format/structural edits
    // always start a fresh step. New edits invalidate the redo stack.
    const recordHistory = (prevValue, isTyping) => {
        if (prevValue === null || prevValue === undefined) return;
        const now = Date.now();
        if (isTyping && lastSnapTyping.current && now - lastSnapAt.current < 600) {
            lastSnapAt.current = now;
            return; // coalesce a typing burst
        }
        const top = undoStack.current[undoStack.current.length - 1];
        if (top !== prevValue) {
            undoStack.current.push(prevValue);
            if (undoStack.current.length > 200) undoStack.current.shift();
        }
        redoStack.current = [];
        lastSnapAt.current = now;
        lastSnapTyping.current = !!isTyping;
    };

    const handleChange = (isTyping = false) => {
        if (!editorRef.current) return;
        const newValue = extractValue(editorRef.current);
        if (newValue === lastReportedValue.current) return;
        if (!isRestoring.current) recordHistory(lastReportedValue.current, isTyping);
        lastReportedValue.current = newValue;
        onChange(newValue);
    };

    const placeCaretAtEnd = () => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        savedSelection.current = range.cloneRange();
    };

    // Re-render the editor to a historical value. Setting innerHTML does NOT fire
    // an input event, so this won't re-enter handleChange; we sync our own refs
    // and notify the parent explicitly.
    const applyHistoryValue = (v) => {
        if (!editorRef.current) return;
        isRestoring.current = true;
        editorRef.current.innerHTML = parseToHtml(v || '');
        lastReportedValue.current = v;
        onChange(v);
        placeCaretAtEnd();
        updateActiveFormats();
        isRestoring.current = false;
    };

    const doUndo = () => {
        if (undoStack.current.length === 0) return;
        const current = lastReportedValue.current ?? extractValue(editorRef.current);
        const prev = undoStack.current.pop();
        redoStack.current.push(current);
        lastSnapTyping.current = false; // next edit starts a fresh undo step
        applyHistoryValue(prev);
    };

    const doRedo = () => {
        if (redoStack.current.length === 0) return;
        const current = lastReportedValue.current ?? extractValue(editorRef.current);
        const next = redoStack.current.pop();
        undoStack.current.push(current);
        lastSnapTyping.current = false;
        applyHistoryValue(next);
    };

    const handleKeyDown = (e) => {
        const key = e.key.toLowerCase();
        const mod = e.ctrlKey || e.metaKey;
        if (mod && key === 'z' && !e.shiftKey) {
            e.preventDefault();
            doUndo();
        } else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
            e.preventDefault();
            doRedo();
        }
    };

    const handleInput = () => {
        isEditing.current = true;
        handleChange(true);
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

    // True when the live selection/caret is still inside this editor. Toolbar
    // buttons use onMouseDown+preventDefault, so the caret never actually
    // leaves — in that case we must NOT re-set the selection, because
    // removeAllRanges()+addRange() resets Chrome's pending typing style and
    // breaks the collapsed-caret toggle (clicking U/S to turn them OFF did
    // nothing — the format wouldn't "close").
    const selectionInEditor = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const node = sel.getRangeAt(0).commonAncestorContainer;
        return !!(editorRef.current && editorRef.current.contains(node));
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

    // Deterministic toggle for underline / strikethrough at a COLLAPSED caret.
    // These are `text-decoration` based, and Chromium's execCommand pending-
    // style toggle is unreliable for them with no selection — clicking the
    // button changed nothing, so the user couldn't freely turn them on/off.
    //
    // The trap: at the boundary of underlined text the caret can sit either
    // INSIDE or OUTSIDE the <u> while looking identical, so a blind
    // execCommand sometimes ADDED the format when the user meant to remove it.
    // Fix: read the *perceived* current state via queryCommandState (this is
    // what makes the button glow), decide the target = opposite, then insert a
    // zero-width space, select it, and force it to the target state — only
    // running execCommand when the ZWS isn't already there. Because we drive
    // toward an absolute target instead of toggling, the boundary ambiguity no
    // longer matters: ON→OFF and OFF→ON both land correctly every time.
    const toggleDecorationCollapsed = (command) => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return false; // real selection → execCommand is reliable
        const target = !document.queryCommandState(command); // desired new state
        const zws = document.createTextNode('​');
        range.insertNode(zws);
        const zwsRange = document.createRange();
        zwsRange.selectNodeContents(zws);
        sel.removeAllRanges();
        sel.addRange(zwsRange);
        // Force the ZWS (and therefore the caret context) to the desired state,
        // no matter which side of the format boundary it landed on.
        if (document.queryCommandState(command) !== target) {
            document.execCommand(command, false, null);
        }
        // Collapse to the end of the ZWS — robust against execCommand
        // reparenting the node into/out of a wrapper.
        const after = window.getSelection();
        if (after && after.rangeCount > 0) {
            after.collapseToEnd();
            savedSelection.current = after.getRangeAt(0).cloneRange();
        }
        return true;
    };

    const execFormat = (command, val = null) => {
        editorRef.current?.focus();
        // Only restore the saved range when the caret genuinely left the
        // editor. If it's still inside (the normal toolbar-button case),
        // re-setting the selection would reset Chrome's pending typing style
        // and break the toggle for underline/strikethrough.
        if (!selectionInEditor()) restoreSelection();
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
        // Deterministic collapsed-caret toggle for the text-decoration formats.
        if ((command === 'underline' || command === 'strikeThrough') &&
            toggleDecorationCollapsed(command)) {
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
        setFontMenuOpen(false);
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
                onKeyDown={handleKeyDown}
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

                    {/* Custom font-size dropdown. A native <select> can't keep
                        the editor's text selection alive while it's open — the
                        moment the OS dropdown takes focus, the contentEditable
                        selection collapses, so execCommand('fontSize') had
                        nothing to apply to (it "looked" picked but did nothing).
                        These buttons use onMouseDown+preventDefault, exactly
                        like B/I/U above, so the selection survives the click. */}
                    <div className="relative" ref={fontMenuRef}>
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setFontMenuOpen(o => !o); }}
                            className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                            title="Hərf ölçüsü"
                        >
                            {FONT_SIZES.find(s => s.value === fontSize)?.label || 'Ölçü'}
                            <span className="text-[8px] leading-none">▼</span>
                        </button>
                        {fontMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 z-30 min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                {FONT_SIZES.map(s => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); applyFontSize(s.value); }}
                                        className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                            s.value === fontSize
                                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
                onKeyDown={handleKeyDown}
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
