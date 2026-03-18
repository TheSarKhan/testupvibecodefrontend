import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathTextEditor = forwardRef(({ value, onChange, placeholder, className }, ref) => {
    const editorRef = useRef(null);
    const isEditing = useRef(false);
    const savedSelection = useRef(null);
    const lastReportedValue = useRef(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                    savedSelection.current = range.cloneRange();
                }
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    // Parse $$ latex $$ or $ latex $ into HTML with Katex nodes
    const parseToHtml = (text) => {
        if (!text) return '';
        // Match $$...$$ first (display), then $...$ (inline)
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
                } catch (e) {
                    html += part;
                }
            } else {
                const escaped = part
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
                html += escaped;
            }
        });
        return html;
    };

    // Update HTML only when external value changes distinctly from ours
    useEffect(() => {
        if (!editorRef.current) return;

        const normalizedExternal = (value || '');
        const normalizedInternal = (lastReportedValue.current === null) ? null : (lastReportedValue.current || '');

        if (normalizedExternal !== normalizedInternal) {
            editorRef.current.innerHTML = parseToHtml(value || '');
            lastReportedValue.current = value;
        }
    }, [value]);

    const extractText = (rootNode) => {
        let newText = '';
        const traverse = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                newText += node.textContent.replace(/\u00A0/g, ' '); // replace nbsp with space
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('math-node')) {
                    newText += `$$${node.getAttribute('data-latex')}$$`;
                } else if (node.tagName === 'BR') {
                    newText += '\n';
                } else if (node.tagName === 'DIV' || node.tagName === 'P') {
                    newText += '\n';
                    node.childNodes.forEach(traverse);
                } else {
                    node.childNodes.forEach(traverse);
                }
            }
        };
        rootNode.childNodes.forEach(traverse);
        return newText;
    };

    const handleChange = () => {
        if (!editorRef.current) return;
        const newText = extractText(editorRef.current);
        lastReportedValue.current = newText;
        onChange(newText);
    };

    const handleInput = () => {
        isEditing.current = true;
        handleChange();
    };

    const handleBlur = () => {
        isEditing.current = false;
        // We explicitly do not rebuild the DOM here to prevent detaching existing Math Nodes
        // which would cause savedSelection.current to point to 'ghost' DOM nodes.
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
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

            // Focus is polite but not strictly required for Range manipulation
            editorRef.current.focus();

            const sel = window.getSelection();
            let targetRange = savedSelection.current;

            // If we don't have a saved selection, or it's invalid, default to the end of the editor
            if (!targetRange) {
                targetRange = document.createRange();
                targetRange.selectNodeContents(editorRef.current);
                targetRange.collapse(false); // collapse to end
            }

            try {
                // Generate KaTeX HTML
                const mathHtml = katex.renderToString(latexString, { throwOnError: false, displayMode: false });

                // Create the wrapper span
                const span = document.createElement('span');
                span.className = "math-node mx-1 inline-block align-middle cursor-default bg-indigo-50/50 px-1 rounded";
                span.contentEditable = "false";
                span.setAttribute('data-latex', latexString);
                span.innerHTML = mathHtml;

                // Create a zero-width space or a regular space to place cursor after the atomic node
                const space = document.createTextNode('\u00A0');

                // Execute precise DOM insertion
                targetRange.deleteContents();
                targetRange.insertNode(space); // Insert space first (it pushes backwards)
                targetRange.insertNode(span);  // Insert span before the space

                // Move the actual cursor to the end of the newly inserted space
                targetRange.setStartAfter(space);
                targetRange.collapse(true);

                // Update the actual window selection so the user sees the blinking cursor there
                sel.removeAllRanges();
                sel.addRange(targetRange);

                // Update our saved selection explicitly
                savedSelection.current = targetRange.cloneRange();

            } catch (e) {
                // Fallback to plain text via Range
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
});

export default MathTextEditor;
