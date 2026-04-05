/**
 * Validates LaTeX syntax in content strings
 * Checks for common matrix and math expression errors
 */

export const validateLatexSyntax = (content) => {
    if (!content) return { valid: true, errors: [] };

    const errors = [];

    // Check for unmatched \begin and \end
    const beginMatches = (content.match(/\\begin\{[^}]+\}/g) || []).length;
    const endMatches = (content.match(/\\end\{[^}]+\}/g) || []).length;
    if (beginMatches !== endMatches) {
        errors.push('\\begin ve \\end sayı uyğun gəlmir');
    }

    // Check for properly formatted \end
    const malformedEnd = /end\{/g.test(content);
    if (malformedEnd) {
        errors.push('\\end{ kimi yanlış format — \\end{ istifadə edin');
    }

    // Check for matrix line breaks — should be \\ not \
    const matrixContent = content.match(/\$\\begin\{[^$]*\$\}/g) || [];
    matrixContent.forEach((matrix) => {
        // Check for single backslash before number/paren (likely missing second \)
        if (/\\ [\d(\\]/g.test(matrix)) {
            errors.push(`Matrisdə kəsik yanlış: $...$-da kəsik üçün \\\\\\\\ istifadə edin, rəqəm/mötərizə əvvəl tək \\ qoyulmamalıdır`);
        }
    });

    // Check for balanced dollar signs (inline math)
    const dollarCount = (content.match(/\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
        errors.push('$ işarələri cüt sayda olmalıdır (başlanğıc və sonu)');
    }

    // Check for unescaped or under-escaped LaTeX commands
    // These should NOT appear: "\frac", "\cdot", "\sqrt", "\begin", "\end" (single backslash in content)
    // They should be: "\\frac", "\\cdot", etc. OR rendered as-is in final content
    // Actually, at this point they should be unescaped single backslash, so check for common commands
    const latexCommands = /\\(frac|cdot|sqrt|begin|end|sum|prod|int|log|sin|cos|tan|forall|exists|alpha|beta|gamma|delta|pi|lambda|sigma|omega)/g;
    const matches = content.match(latexCommands) || [];
    if (matches.length > 0 && !content.includes('$')) {
        errors.push('LaTeX komandaları ($...$ içərisində yazılmalıdır)');
    }

    // Check for proper \frac syntax
    const fracSyntax = /\\frac\s*\{[^}]+\}\s*\{[^}]+\}/g;
    const malformedFrac = /\\frac\s+[^{]/g.test(content);
    if (malformedFrac) {
        errors.push('\\frac format: \\frac{say}{məxrəc}');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const sanitizeLatexForDisplay = (content) => {
    if (!content) return content;

    // This just returns the content as-is
    // The display component (KaTeX) will handle rendering
    return content;
};

/**
 * Get a human-readable LaTeX error message for the UI
 */
export const getLatexErrorMessage = (errors) => {
    if (!errors || errors.length === 0) return null;
    return errors.map(err => `• ${err}`).join('\n');
};
