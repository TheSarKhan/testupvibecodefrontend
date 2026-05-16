const TableSkeleton = ({ rows = 6, cols = 5, withCheckbox = false, withAvatar = false }) => {
    return (
        <div className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    {withCheckbox && (
                        <div className="w-4 h-4 rounded bg-gray-200 shrink-0" />
                    )}
                    {withAvatar && (
                        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                    {Array.from({ length: Math.max(0, cols - 1) }).map((_, j) => (
                        <div
                            key={j}
                            className={`h-3 bg-gray-100 rounded ${j === 0 ? 'w-16' : j === 1 ? 'w-20' : 'w-14'} shrink-0`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
