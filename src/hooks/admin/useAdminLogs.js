import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminLogs({ action = '', category = '', search = '', period = '', actor = '', targetType = '', page = 0, size = 30 } = {}) {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (category && category !== 'ALL') params.set('category', category);
    if (search) params.set('search', search);
    if (period) params.set('period', period);
    if (actor) params.set('actor', actor);
    if (targetType) params.set('targetType', targetType);
    params.set('page', String(page));
    params.set('size', String(size));

    return useQuery({
        queryKey: adminKeys.logs({ action, category, search, period, actor, targetType, page, size }),
        queryFn: () => api.get(`/admin/logs?${params}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}
