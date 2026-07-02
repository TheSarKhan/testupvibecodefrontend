// Centralized LaTeX sanitiser used by every code path that hands a string
// to KaTeX (MathTextEditor.parseToHtml, MathTextEditor.insertMath, LatexPreview,
// MathFormulaModal). Failure modes the sanitiser handles:
//
//   1. MathLive macros. The `<math-field>` element emits its own dialect
//      (\exponentialE, \differentialD, \placeholder{}, \mleft/\mright,
//      \nobreakspace, …) which KaTeX does not understand. We rewrite these
//      into KaTeX-compatible LaTeX so the rendered expression matches what
//      the student saw in the editor.
//
//   2. Invisible unicode. MathLive sometimes drops U+200B/U+FEFF and other
//      zero-width chars into latex-expanded; KaTeX treats them as unknown
//      tokens and the whole expression falls back to a red error span.
//
//   3. Empty / dangling sup-sub markers. Students often open `^{}` or `_{}`
//      slots in the keyboard and close them without filling, or leave a
//      bare `^` / `_` at the end of an expression.
//
// The function is intentionally pure / pass-through-safe: empty input
// returns empty, already-valid LaTeX is returned (effectively) unchanged.
export const normalizeLatex = (raw) => {
    if (!raw) return '';
    let out = String(raw);

    // Strip invisible/zero-width unicode that MathLive occasionally embeds.
    // These otherwise become "unknown command" parse errors in KaTeX.
    out = out.replace(/[​-‏‪-‮⁠﻿­]/g, '');

    // Relational operators ( <, > ) typed in the math keyboard survive the
    // editor's HTML round-trip as entities — and the editor's LaTeX escaping of
    // the entity's `&` turns them into `\&lt;` / `\&gt;`. KaTeX can't parse
    // either form, so a whole inequality (e.g. 4(x-4)-3(x+2) < -2x-28) fell back
    // to "Düstur xətalı". Decode them back to plain < / > (which KaTeX renders
    // natively). The optional leading backslash covers the `\&lt;` form.
    out = out
        .replace(/\\?&lt;/g, '<')
        .replace(/\\?&gt;/g, '>');

    // MathLive → KaTeX macro translation table. Order matters for the
    // longer-token-first rule, so list specific differentials before the
    // generic \differentialD prefix.
    const macroMap = {
        '\\exponentialE': 'e',
        '\\imaginaryI': 'i',
        '\\imaginaryJ': 'j',
        '\\differentialD': '\\mathrm{d}',
        '\\differentialX': '\\mathrm{d}x',
        '\\differentialY': '\\mathrm{d}y',
        '\\differentialT': '\\mathrm{d}t',
        '\\real': '\\mathbb{R}',
        '\\imaginary': '\\mathbb{I}',
        '\\complex': '\\mathbb{C}',
        '\\rational': '\\mathbb{Q}',
        '\\natural': '\\mathbb{N}',
        '\\integer': '\\mathbb{Z}',
        // MathLive's "matched" left/right delimiters — KaTeX supports the
        // plain \left / \right form.
        '\\mleft': '\\left',
        '\\mright': '\\right',
        // MathLive spacing commands KaTeX doesn't ship.
        '\\nobreakspace': '~',
        '\\thinspace': '\\,',
        '\\medspace': '\\:',
        '\\thickspace': '\\;',
        // Style commands MathLive may emit that KaTeX misses.
        '\\mathnormal': '\\mathit',
    };
    // Replace longest keys first so e.g. \differentialX wins over \differentialD.
    const sortedKeys = Object.keys(macroMap).sort((a, b) => b.length - a.length);
    for (const from of sortedKeys) {
        out = out.split(from).join(macroMap[from]);
    }

    // Drop any `\placeholder{…}` (with or without content) — these are
    // MathLive's "empty slot" markers.
    out = out.replace(/\\placeholder\{[^{}]*\}/g, '');
    out = out.replace(/\\placeholder\b/g, '');

    // Strip MathLive's HTML/attribute annotations which KaTeX doesn't parse.
    out = out.replace(/\\htmlData\{[^{}]*\}/g, '');
    out = out.replace(/\\class\{[^{}]*\}/g, '');

    // Empty `^{}` / `_{}` produced when the student opens a slot and
    // closes it blank.
    out = out.replace(/\^\{\s*\}/g, '');
    out = out.replace(/_\{\s*\}/g, '');

    // Trailing or floating `^` / `_` with no group after them (KaTeX parse
    // error). The lookahead `(?!\w|\{)` allows valid `^2`, `^{abc}`.
    out = out.replace(/[\^_](?!\w|\{)/g, '');

    return out;
};

/**
 * Best-effort *syntactic* repair for LaTeX that students sometimes produce
 * (esp. via MathLive — chaining \^ on top of an already-superscripted token,
 * pasting partial expressions, etc.). The function never changes meaning of
 * already-valid LaTeX; it only tries to make broken expressions parseable so
 * KaTeX renders something readable instead of falling back to red raw text.
 *
 * Pipeline:
 *   1. Run {@link normalizeLatex} (macros, invisible unicode, empty slots).
 *   2. Balance unmatched curly braces.
 *      • If too few `}` → append the missing closes at the end.
 *      • If too many `}` → strip trailing extras (common copy/paste artefact).
 *   3. Wrap chained `^^…` / `__…` into a single group. KaTeX rejects
 *      `x^a^b` with "Double superscript"; we collapse it into `x^{ab}`. The
 *      heuristic may change the *meaning* (was the intent `(x^a)^b` or
 *      `x^{ab}`?) but the alternative is total parse failure, which is what
 *      the student actually sees today.
 *
 * Applies the rewrites repeatedly until the string stops changing so chains
 * longer than two (`^a^b^c^d`) collapse fully in one call.
 */
export const repairLatex = (raw) => {
    if (!raw) return '';
    let out = normalizeLatex(raw);

    // ── 1. Balance braces ───────────────────────────────────────────────
    let depth = 0;
    let unmatchedCloses = 0;
    for (const ch of out) {
        if (ch === '{') depth++;
        else if (ch === '}') {
            if (depth > 0) depth--;
            else unmatchedCloses++;
        }
    }
    if (depth > 0) out += '}'.repeat(depth);
    if (unmatchedCloses > 0) {
        // Strip trailing `}` first — that's where the noise usually lives.
        let toStrip = unmatchedCloses;
        while (toStrip > 0 && out.endsWith('}')) {
            out = out.slice(0, -1);
            toStrip--;
        }
        // Anything still unmatched is mid-string; leave it alone rather than
        // guess at the right position.
    }

    // ── 2. Collapse chained ^^ / __ into single groups ──────────────────
    // Token after the operator is either a single char/word or a {…} group.
    const CHAIN_RE = /([\^_])((?:[A-Za-z0-9]|\\[a-zA-Z]+|\{[^{}]*\}))\1((?:[A-Za-z0-9]|\\[a-zA-Z]+|\{[^{}]*\}))/g;
    const unwrap = (tok) => tok.startsWith('{') && tok.endsWith('}') ? tok.slice(1, -1) : tok;
    let prev;
    do {
        prev = out;
        out = out.replace(CHAIN_RE, (_, op, a, b) => `${op}{${unwrap(a)}${unwrap(b)}}`);
    } while (out !== prev);

    return out;
};
