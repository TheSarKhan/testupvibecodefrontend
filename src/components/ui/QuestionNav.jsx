import { useState } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

export const getQuestionStatus = (q) => {
    const hasAnswer = (
        q.studentSelectedOptionId != null ||
        (q.studentSelectedOptionIds && q.studentSelectedOptionIds.length > 0) ||
        q.studentAnswerText?.trim() ||
        q.studentAnswerImage ||
        q.studentMatchingAnswerJson
    );
    if (!q.isGraded) return hasAnswer ? 'pending' : 'blank';
    if (!hasAnswer) return 'blank';
    if (q.awardedScore === q.points) return 'correct';
    if (q.awardedScore > 0) return 'partial';
    return 'wrong';
};

const STATUS_STYLE = {
    correct: 'bg-green-500 text-white',
    wrong:   'bg-red-500 text-white',
    partial: 'bg-yellow-400 text-white',
    pending: 'bg-yellow-400 text-white',
    blank:   'bg-gray-100 text-gray-400 border border-gray-200',
};

const BADGE = {
    correct: 'bg-green-100 text-green-700',
    wrong:   'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-700',
    blank:   'bg-gray-100 text-gray-500',
};

const QuestionNav = ({ questions, examSubject, onClickQ, className = '' }) => {
    const groups = [];
    const seen = new Map();
    questions.forEach((q, idx) => {
        const key = q.subjectGroup ?? '__main__';
        if (!seen.has(key)) {
            seen.set(key, groups.length);
            const label = q.subjectGroup || examSubject || 'Əsas fənn';
            groups.push({ key, label, items: [] });
        }
        groups[seen.get(key)].items.push({ q, idx });
    });

    const [openGroups, setOpenGroups] = useState(() =>
        Object.fromEntries(groups.map(g => [g.key, true]))
    );

    const toggle = (key) =>
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className={`rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 ${className}`}>
            {groups.map(group => {
                const correct = group.items.filter(({ q }) => getQuestionStatus(q) === 'correct').length;
                const wrong   = group.items.filter(({ q }) => getQuestionStatus(q) === 'wrong').length;
                const blank   = group.items.filter(({ q }) => getQuestionStatus(q) === 'blank').length;
                const pending = group.items.filter(({ q }) => ['pending', 'partial'].includes(getQuestionStatus(q))).length;
                const isOpen  = openGroups[group.key] !== false;

                return (
                    <div key={group.key} className="bg-white">
                        {/* Header */}
                        <button
                            type="button"
                            onClick={() => toggle(group.key)}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <span className="text-sm font-bold text-gray-800 flex-1">
                                {group.label}
                                <span className="text-gray-400 font-medium ml-1">({group.items.length})</span>
                            </span>
                            <div className="flex items-center gap-1">
                                {correct > 0 && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BADGE.correct}`}>{correct}</span>
                                )}
                                {wrong > 0 && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BADGE.wrong}`}>{wrong}</span>
                                )}
                                {pending > 0 && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BADGE.pending}`}>{pending}</span>
                                )}
                                {blank > 0 && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BADGE.blank}`}>{blank}</span>
                                )}
                            </div>
                            {isOpen
                                ? <HiOutlineChevronUp className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                : <HiOutlineChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            }
                        </button>

                        {/* Grid */}
                        {isOpen && (
                            <div className="px-4 pb-4 pt-1 flex flex-wrap gap-1.5">
                                {group.items.map(({ q, idx }) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => onClickQ(q, idx)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all hover:opacity-75 hover:scale-105 ${STATUS_STYLE[getQuestionStatus(q)]}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default QuestionNav;
