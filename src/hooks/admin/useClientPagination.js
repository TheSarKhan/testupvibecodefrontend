import { useMemo, useState, useEffect } from 'react';

/**
 * Client-side pagination over a fully-loaded array.
 * Use when backend returns the full list and the dataset is small enough.
 *
 * Usage:
 *   const { paged, page, setPage, totalPages, totalElements } = useClientPagination(items, 15);
 *   return <>{paged.map(...)} <Pagination page={page} ... onChange={setPage} /></>
 */
export function useClientPagination(items, pageSize = 15) {
    const [page, setPage] = useState(0);

    const totalElements = items?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    // Clamp page when items shrink
    useEffect(() => {
        if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
    }, [totalPages, page]);

    const paged = useMemo(() => {
        if (!items) return [];
        const start = page * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    return { paged, page, setPage, totalPages, totalElements };
}
