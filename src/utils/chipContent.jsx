import katex from 'katex';
import 'katex/dist/katex.min.css';

// MathTextEditor stores values as a mix of `$$X$$` markers (from fx
// insertions), bare `$X$` segments, contentEditable HTML wrappers, and
// raw text the teacher types between math runs. LatexPreview tries to
// normalise all of that on the fly with regex heuristics, but a single
// stray `$` still slips through and shows up as raw text on chips. For
// chip-sized values we don't need the heuristics — we just want the
// LaTeX to render. So strip everything that isn't math, hand the rest
// to KaTeX, and fall back to plain text only when there are no LaTeX
// commands at all.
export const ChipContent = ({ text }) => {
    console.log('[ChipContent] render with text:', text);
    if (!text) return null;
    let clean = String(text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!clean) return null;
    if (!clean.includes('\\')) return <span>{clean}</span>;
    try {
        const html = katex.renderToString(clean, {
            throwOnError: false,
            displayMode: false,
            strict: 'ignore',
            output: 'html',
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
        return <span>{clean}</span>;
    }
};

export default ChipContent;
