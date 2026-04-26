import React, { useMemo } from 'react';
import katex from 'katex';

const decodeEntities = (str) =>
    str.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Detect new HTML-formatted content vs old plain-text content
const hasHtmlTags = (text) => text && /<[a-z][\s\S]*>/i.test(text);

const renderLatex = (text) => {
    if (!text) return '';

    const isHtml = hasHtmlTags(text);
    const parts = [];
    // Match $$...$$ (display) or $...$ (inline) — non-greedy
    const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            const segment = text.slice(last, match.index);
            // HTML content: convert newlines + pass through; plain text: escape + convert newlines
            parts.push(isHtml ? segment.replace(/\n/g, '<br>') : escapeHtml(decodeEntities(segment)).replace(/\n/g, '<br>'));
        }

        const isDisplay = match[1] !== undefined;
        const math = isDisplay ? match[1] : match[2];
        try {
            parts.push(katex.renderToString(math, {
                displayMode: isDisplay,
                throwOnError: false,
                output: 'html',
            }));
        } catch {
            parts.push(isHtml ? match[0] : escapeHtml(match[0]));
        }

        last = match.index + match[0].length;
    }

    if (last < text.length) {
        const segment = text.slice(last);
        parts.push(isHtml ? segment.replace(/\n/g, '<br>') : escapeHtml(decodeEntities(segment)).replace(/\n/g, '<br>'));
    }

    return parts.join('');
};

const LatexPreview = ({ content, placeholder = 'Önbaxış burada görünəcək...', className = '' }) => {
    const html = useMemo(() => renderLatex(content), [content]);

    if (!content || content.trim() === '') {
        return (
            <div className={`w-full ${className}`}>
                <div className="p-3 bg-gray-50 border border-gray-100 border-dashed rounded-lg flex items-center min-h-[40px]">
                    <span className="text-gray-400 italic text-sm select-none">{placeholder}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`w-full text-gray-800 break-words leading-relaxed ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default LatexPreview;
