import React, { useMemo } from 'react';
import katex from 'katex';

// One-pass HTML entity decoder. The exam editor serializes through
// `clone.innerHTML`, which means typed `>` ends up stored as the literal
// string `&gt;`. The rich-text editor's own roundtrip can also double-encode
// (`&` → `&amp;` after a prior `&gt;` got `&` turned into `&amp;`), giving
// `&amp;gt;` in storage. We therefore decode in a loop until stable so that
// either single- or double-encoded content collapses to real characters.
const decodeEntitiesOnce = (str) =>
    str
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');

const decodeEntities = (str) => {
    let prev = str;
    let next = decodeEntitiesOnce(prev);
    // Bound the loop in case of pathological inputs.
    for (let i = 0; i < 4 && next !== prev; i++) {
        prev = next;
        next = decodeEntitiesOnce(prev);
    }
    return next;
};

const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Detect new HTML-formatted content vs old plain-text content.
const hasHtmlTags = (text) => text && /<[a-z][\s\S]*>/i.test(text);

// Recognised LaTeX command names — used both to detect bare commands and to
// detect "messy math" runs (where the rich-text editor's per-node $..$
// wrappers got scrambled mid-expression, e.g. `\int_0^{$\infty$}\!x\,...`).
// Keep these as a single alternation so both regexes share the same
// vocabulary.
const LATEX_CMD_PATTERN = 'frac|sqrt|int|sum|prod|lim|binom|mathrm|mathbf|mathit|text|operatorname|left|right|begin|end' +
    '|sin|cos|tan|cot|sec|csc|log|ln|exp|min|max|inf|sup' +
    '|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega' +
    '|Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Pi|Rho|Sigma|Upsilon|Phi|Chi|Psi|Omega' +
    '|infty|partial|nabla|cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|cong|propto|le|ge' +
    '|cup|cap|in|notin|subset|supset|emptyset|forall|exists|to|rightarrow|leftarrow|Rightarrow|Leftarrow|mapsto';

// Catches a "messy math" run: a contiguous whitespace-free chunk that
// contains at least one known LaTeX command. This handles the case where
// a single mathematical expression got split into many tiny $..$ math nodes
// in the editor and concatenated against raw `\int_0^{...}` prose — e.g.
// `\int_0^{$\infty$}\!x\,$\mathrm{d}$x$\sqrt${x^{dw}}`. We collapse the whole
// run into one math segment, stripping the stray `$` markers, so KaTeX can
// render it as a single coherent formula.
const MESSY_MATH_RE = new RegExp(`\\S*\\\\(?:${LATEX_CMD_PATTERN})\\b\\S*`, 'g');

const autoWrapBareLatex = (segment) => {
    if (!segment.includes('\\')) return segment;
    return segment.replace(MESSY_MATH_RE, (match) => {
        // Strip ALL stray `$` characters from the inside; KaTeX would otherwise
        // see them as broken delimiters and bail out. Then wrap the cleaned
        // run in a single inline-math pair.
        const cleaned = match.replace(/\$/g, '');
        return `$${cleaned}$`;
    });
};

const renderLatex = (text) => {
    if (!text) return '';

    // 1) Decode entities first so `&gt;` / `&amp;gt;` collapse to `>`
    //    before we search for `$` delimiters.
    const decoded = decodeEntities(text);
    // 2) Auto-add `$...$` around bare LaTeX commands so authors who skipped
    //    the math editor (or pasted raw markup) still get rendering.
    const normalized = autoWrapBareLatex(decoded);

    const isHtml = hasHtmlTags(normalized);
    const parts = [];
    // Match $$...$$ (display) or $...$ (inline) — non-greedy
    const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
    let last = 0;
    let match;

    while ((match = regex.exec(normalized)) !== null) {
        if (match.index > last) {
            const segment = normalized.slice(last, match.index);
            parts.push(isHtml ? segment.replace(/\n/g, '<br>') : escapeHtml(segment).replace(/\n/g, '<br>'));
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

    if (last < normalized.length) {
        const segment = normalized.slice(last);
        parts.push(isHtml ? segment.replace(/\n/g, '<br>') : escapeHtml(segment).replace(/\n/g, '<br>'));
    }

    return parts.join('');
};

// `placeholder` controls how empty content is rendered:
//   - default string: shows the dashed-border editor preview placeholder. Use
//     this in editor / authoring contexts where the empty state is meaningful.
//   - null / empty string: renders nothing. Use this in display contexts
//     (result summary, review, bank rows) where an empty question or option
//     should just collapse to blank space, not show "Önbaxış burada
//     görünəcək…" repeated under every line.
const LatexPreview = ({ content, placeholder = 'Önbaxış burada görünəcək...', className = '' }) => {
    const html = useMemo(() => renderLatex(content), [content]);

    if (!content || content.trim() === '') {
        if (placeholder == null || placeholder === '') return null;
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
