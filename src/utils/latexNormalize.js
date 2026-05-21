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
