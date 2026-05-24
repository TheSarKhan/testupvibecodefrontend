import 'katex/dist/katex.min.css';
import { safeRenderLatex } from './latexRender';

// Compact LaTeX renderer for chip / pill contexts (matching-pair items,
// short labels). MathTextEditor stores values as a mix of `$$X$$` markers,
// bare `$X$` segments, contentEditable HTML wrappers, and free text typed
// between math runs. LatexPreview handles the full markup; chips don't
// need that — strip the wrapping and hand whatever's left to KaTeX
// through the shared safeRenderLatex pipeline so broken expressions
// degrade to plain text instead of red error output.
export const ChipContent = ({ text }) => {
    if (!text) return null;
    const clean = String(text)
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
    // No LaTeX commands → render as plain text, skip KaTeX entirely.
    if (!clean.includes('\\')) return <span>{clean}</span>;

    const result = safeRenderLatex(clean);
    if (result.ok) return <span dangerouslySetInnerHTML={{ __html: result.html }} />;
    // KaTeX gave up even after repair — show the raw source as plain text
    // so it stays readable (chips are tiny; a fallback chip would clip).
    return <span>{clean}</span>;
};

export default ChipContent;
