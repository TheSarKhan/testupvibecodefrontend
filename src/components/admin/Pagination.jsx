import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

/**
 * Pagination bar. Hidden when totalPages <= 1.
 *
 * Props:
 *   page, totalPages, totalElements, onChange
 *   maxButtons: how many page-number buttons to show (default 5)
 *   compact: icon-only prev/next, no "X qeyd" suffix — for narrow containers
 */
const Pagination = ({ page, totalPages, totalElements, onChange, maxButtons = 5, compact = false }) => {
    if (!totalPages || totalPages <= 1) {
        return totalElements != null ? (
            <p className="text-xs text-gray-400 text-right mt-3">{totalElements} qeyd</p>
        ) : null;
    }

    const start = Math.max(0, Math.min(page - Math.floor(maxButtons / 2), totalPages - maxButtons));
    const pages = [];
    for (let i = 0; i < Math.min(maxButtons, totalPages); i++) {
        pages.push(start + i);
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-1 mt-3">
                <button
                    onClick={() => onChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                    <HiOutlineChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-0.5">
                    {pages.map(n => (
                        <button
                            key={n}
                            onClick={() => onChange(n)}
                            className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                                n === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {n + 1}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                    <HiOutlineChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 mt-4 px-1">
            <button
                onClick={() => onChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <HiOutlineChevronLeft className="w-4 h-4" />
                Əvvəlki
            </button>

            <div className="flex items-center gap-1">
                {pages.map(n => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                            n === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {n + 1}
                    </button>
                ))}
                {totalElements != null && (
                    <span className="ml-3 text-xs text-gray-400 hidden sm:inline">{totalElements} qeyd</span>
                )}
            </div>

            <button
                onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Növbəti
                <HiOutlineChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Pagination;
