// Centralized LaTeX sanitiser used by every code path that hands a string
// to KaTeX (MathTextEditor.parseToHtml, MathTextEditor.insertMath, LatexPreview,
// MathFormulaModal). Two failure modes the sanitiser handles:
//
//   1. MathLive macros. The `<math-field>` element emits its own dialect
//      (\exponentialE, \differentialD, \placeholder{}, \forall variants
//      typed by accident, …) which KaTeX does not understand. We rewrite
//      these into KaTeX-compatible LaTeX so the rendered expression matches
//      what the student saw in the editor.
//
//   2. Empty / dangling sup-sub markers. Students often open `^{}` or `_{}`
//      slots in the keyboard and close them without filling, or leave a
//      bare `^` / `_` at the end of an expression. KaTeX raises a parse
//      error on those even with `throwOnError: false`, and falls back to
//      red raw text. Stripping the empties keeps the rest of the
//      expression renderable.
//
// The function is intentionally pure / pass-through-safe: empty input
// returns empty, valid LaTeX is returned unchanged.
export const normalizeLatex = (raw) => {
    if (!raw) return '';
    let out = String(raw);

    // MathLive → KaTeX macro translation table.
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
    };
    for (const [from, to] of Object.entries(macroMap)) {
        out = out.split(from).join(to);
    }

    // Drop any `\placeholder{…}` (with or without content) — these are
    // MathLive's "empty slot" markers.
    out = out.replace(/\\placeholder\{[^{}]*\}/g, '');
    out = out.replace(/\\placeholder\b/g, '');

    // Empty `^{}` / `_{}` produced when the student opens a slot and
    // closes it blank.
    out = out.replace(/\^\{\s*\}/g, '');
    out = out.replace(/_\{\s*\}/g, '');

    // Trailing or floating `^` / `_` with no group after them (KaTeX parse
    // error). The lookahead `(?!\w|\{)` allows valid `^2`, `^{abc}`.
    out = out.replace(/[\^_](?!\w|\{)/g, '');

    return out;
};
