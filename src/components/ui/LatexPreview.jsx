import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

const LatexPreview = ({ content, placeholder = "Önbaxış burada görünəcək...", className = "" }) => {
    return (
        <div className={`w-full ${className}`}>
            {!content || content.trim() === '' ? (
                <div className="p-3 bg-gray-50 border border-gray-100 border-dashed rounded-lg flex items-center min-h-[40px]">
                    <span className="text-gray-400 italic text-sm select-none">{placeholder}</span>
                </div>
            ) : (
                <div className="prose prose-sm max-w-none text-gray-800 break-words w-full">
                    <Latex>{content.replace(/\$\$/g, '$')}</Latex>
                </div>
            )}
        </div>
    );
};

export default LatexPreview;
