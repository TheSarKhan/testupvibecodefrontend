// Shared LaTeX render pipeline. Every call site that hands a string to KaTeX
// should go through here so a malformed expression downgrades the same way
// everywhere instead of falling back to KaTeX's red raw-text rendering.
//
// Pipeline:
//   1. Run normalizeLatex (MathLive macros, invisible unicode, empty slots).
//   2. Try KaTeX with throwOnError: true — this is the only reliable signal
//      that the expression is broken. With throwOnError: false KaTeX always
//      emits a `class="katex"` wrapper even on parse error, so the older
//      `!/class="katex/` heuristic let red error spans through as "rendered".
//   3. On failure, try repairLatex (brace balance, chained sup/sub collapse).
//   4. On still-failure, return { ok: false } so the caller can render its
//      own context-appropriate fallback (amber clickable chip in the editor,
//      muted gray code block in static previews, plain text on chips).

import katex from 'katex';
import { normalizeLatex, repairLatex } from './latexNormalize';

export const safeRenderLatex = (raw, { displayMode = false } = {}) => {
    const opts = { throwOnError: true, displayMode, strict: 'ignore' };
    const normalised = normalizeLatex(raw);
    try {
        return { ok: true, html: katex.renderToString(normalised, opts), latex: normalised };
    } catch {
        const repaired = repairLatex(raw);
        if (repaired && repaired !== normalised) {
            try {
                return { ok: true, html: katex.renderToString(repaired, opts), latex: repaired, repaired: true };
            } catch { /* fall through */ }
        }
        return { ok: false, latex: normalised };
    }
};

export const escapeHtmlAttr = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
