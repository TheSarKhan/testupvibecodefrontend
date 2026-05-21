import React, { useMemo } from 'react';
import katex from 'katex';
import { normalizeLatex } from '../../utils/latexNormalize';

// Restore C-escape glyphs that have collapsed into real control characters
// somewhere in the pipeline. The classic case is `\frac` getting JSON-parsed
// with a single backslash — `\f` becomes U+000C (form feed) and on the page
// renders as an up-arrow glyph in most fonts, breaking the LaTeX command.
// Convert these back to their two-character "\X" form so KaTeX sees the
// real command name.
const restoreEscapedGlyphs = (str) =>
    str
        .replace(/\f/g, '\\f')      // form feed → \f
        .replace(/\v/g, '\\v')      // vertical tab → \v
        .replace(/[\b]/g, '\\b')    // backspace → \b (character class — bare \b in regex is a word boundary)
        .replace(/\0/g, '\\0');     // null → \0

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

// Locates the position of the next \command from `start`. Returns null if
// none. Names must end on a word boundary so `\infty.something` works but
// random `\foo` (not in our vocabulary) is ignored.
const CMD_LOCATOR_RE = new RegExp(`\\\\(?:${LATEX_CMD_PATTERN})\\b`, 'g');

// Walk through `segment` and locate runs that look like LaTeX math, then
// wrap each one with `$...$`. Two failure modes we have to handle:
//
//   1) Adjacent text glued to the math, e.g.
//      `60\text{ km/s}süratlə` — the AI question generator emits this with
//      no spaces, and the `{ km/s}` brace contains a space, so a simple
//      `\S+` regex breaks. We track brace depth so `\text{ km/s}` stays in
//      one piece.
//
//   2) Mid-expression `$` markers from the rich-text editor's per-node
//      math wrappers, e.g. `\int_0^{$\infty$}\!x\,$\mathrm{d}$x`. We
//      collapse the whole run into one math segment and strip the strays.
const autoWrapBareLatex = (segment) => {
    if (!segment.includes('\\')) return segment;

    const out = [];
    let cursor = 0;
    CMD_LOCATOR_RE.lastIndex = 0;
    let m;

    while ((m = CMD_LOCATOR_RE.exec(segment)) !== null) {
        const cmdAt = m.index;
        if (cmdAt < cursor) continue; // overlap from previous expansion

        // Skip commands that already live inside an existing $...$ pair.
        // Without this we'd produce `$$\frac{...}$ ... $` and break the
        // outer block — the author already delimited the math, our job is
        // only to wrap the cases where they didn't.
        let dollarCount = 0;
        for (let i = 0; i < cmdAt; i++) {
            if (segment[i] === '$' && segment[i - 1] !== '\\') dollarCount++;
        }
        if (dollarCount % 2 === 1) continue;

        // Walk LEFT through any non-whitespace, non-`$`, ASCII characters to
        // absorb a numeric/variable prefix like `60` in `60\text{km}`.
        // Non-ASCII characters mark a prose boundary we shouldn't cross.
        // `<` / `>` are HTML tag boundaries — if we walk past them we drag
        // a `<p>` or `</span>` into the math run, which KaTeX then renders
        // as a red error message.
        let start = cmdAt;
        while (start > cursor) {
            const ch = segment[start - 1];
            if (/\s/.test(ch) || ch === '$' || ch === '<' || ch === '>' || ch.charCodeAt(0) > 127) break;
            start--;
        }

        // Walk RIGHT past the command name, then continue while we're inside
        // a `{...}` (allowing spaces, balanced) or seeing non-space tokens
        // typical of math: digits, letters, `^_+-*/=<>(),`, `\command` etc.
        let end = cmdAt + m[0].length;
        let depth = 0;
        while (end < segment.length) {
            const ch = segment[end];
            if (ch === '{') { depth++; end++; continue; }
            if (ch === '}') { if (depth === 0) break; depth--; end++; continue; }
            if (depth > 0) { end++; continue; }
            // Outside braces: stop on whitespace, stray `$`, a non-ASCII
            // letter, or `<` / `>`. AI-generated content sometimes glues
            // Azerbaijani prose straight onto math (`\text{km}süratlə`),
            // and HTML-wrapped content surrounds the math with tags like
            // `</span>` — neither should be absorbed into the math run
            // (KaTeX would error red on the resulting expression).
            if (/\s/.test(ch) || ch === '$' || ch === '<' || ch === '>' || ch.charCodeAt(0) > 127) break;
            end++;
        }

        // Emit pre-run text untouched.
        if (start > cursor) out.push(segment.slice(cursor, start));
        // Strip any stray `$` inside the run, then wrap once.
        const inner = segment.slice(start, end).replace(/\$/g, '');
        out.push(`$${inner}$`);
        cursor = end;

        // Resume the search from the cursor to avoid re-matching the same run.
        CMD_LOCATOR_RE.lastIndex = cursor;
    }

    if (cursor < segment.length) out.push(segment.slice(cursor));
    return out.join('');
};

const renderLatex = (text) => {
    if (!text) return '';

    // 1) Restore C-escape glyphs (form feed → `\f`, vertical tab → `\v`, …).
    //    If a `\frac` somewhere along the pipeline got JSON-parsed with a
    //    single backslash, `\f` collapses into U+000C and the command is
    //    rendered as an up-arrow + "rac{a}{b}" by KaTeX.
    const escapedRestored = restoreEscapedGlyphs(text);
    // 2) Decode HTML entities so `&gt;` / `&amp;gt;` collapse to `>` before
    //    we search for `$` delimiters.
    const decoded = decodeEntities(escapedRestored);
    // 3) Auto-add `$...$` around bare LaTeX commands so authors who skipped
    //    the math editor (or pasted raw markup) still get rendering.
    let normalized = autoWrapBareLatex(decoded);

    // 4) Repair unbalanced `$` markers. The rich-text editor sometimes emits
    //    `coğrafi$x\int_0^{\infty}\!xdsa\,\mathrm{d}x` (open `$`, no close)
    //    when the user types/pastes around a math chunk. Without a closing
    //    `$` the inline-math regex doesn't match and the LaTeX renders as
    //    raw text. If the dollar count is odd, append a trailing `$` so the
    //    last math run can be picked up by the regex below. We avoid the
    //    `(?<!\\)` lookbehind form because older Safari trips on it.
    let unescapedDollars = 0;
    for (let i = 0; i < normalized.length; i++) {
        if (normalized[i] !== '$') continue;
        let backslashes = 0;
        for (let j = i - 1; j >= 0 && normalized[j] === '\\'; j--) backslashes++;
        if (backslashes % 2 === 0) unescapedDollars++;
    }
    if (unescapedDollars % 2 === 1) normalized = normalized + '$';

    const isHtml = hasHtmlTags(normalized);
    const parts = [];
    // Match $$...$$ (display) or $...$ (inline) — non-greedy
    const regex = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
    let last = 0;
    let match;

    // Plain-text segments between math blocks sometimes still contain stray
    // `$` characters left over from unbalanced wrappers ($$$ at the end of
    // a malformed student answer, for example). They're never meaningful
    // outside a `$...$` pair, so strip them here — otherwise the result
    // page shows ugly `$$$` debris next to rendered math.
    const cleanTextSegment = (s) => s.replace(/\$+/g, '');

    while ((match = regex.exec(normalized)) !== null) {
        if (match.index > last) {
            const segment = cleanTextSegment(normalized.slice(last, match.index));
            parts.push(isHtml ? segment.replace(/\n/g, '<br>') : escapeHtml(segment).replace(/\n/g, '<br>'));
        }

        const isDisplay = match[1] !== undefined;
        const rawMath = isDisplay ? match[1] : match[2];
        const math = normalizeLatex(rawMath);

        const renderFallback = () => {
            // Subdued gray block — far easier on the eye than KaTeX's red
            // error styling for an expression riddled with unknown commands.
            const safe = escapeHtml(rawMath);
            return `<code class="text-[12.5px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">${safe}</code>`;
        };

        try {
            const out = katex.renderToString(math, {
                displayMode: isDisplay,
                throwOnError: false,
                output: 'html',
                strict: 'ignore',
            });
            // Only treat the render as broken if KaTeX returned literally
            // nothing renderable (no `<span class="katex"` wrapper). The
            // earlier `katex-error` heuristic was over-eager — KaTeX can
            // surface a single non-critical warning span while still
            // rendering valid math like `\frac{1}{x}`, and dropping the
            // whole expression into the gray fallback hid perfectly good
            // formulas. KaTeX's inline error spans (red text on undefined
            // commands) are acceptable; we only intervene when nothing was
            // produced at all.
            const looksEmpty = !out || !/class="katex/.test(out);
            parts.push(looksEmpty ? renderFallback() : out);
        } catch {
            parts.push(renderFallback());
        }

        last = match.index + match[0].length;
    }

    if (last < normalized.length) {
        const segment = cleanTextSegment(normalized.slice(last));
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
