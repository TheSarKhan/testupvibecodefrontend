import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminStats() {
    return useQuery({
        queryKey: adminKeys.stats,
        queryFn: () => api.get('/admin/stats').then(r => r.data),
    });
}
