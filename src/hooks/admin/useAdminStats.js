import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminStats() {
    return useQuery({
        queryKey: adminKeys.stats,
        queryFn: () => api.get('/admin/stats').then(r => r.data),
    });
}

export function useExecutiveDashboard() {
    return useQuery({
        queryKey: ['admin', 'dashboard', 'executive'],
        queryFn: () => api.get('/admin/dashboard/executive').then(r => r.data),
        refetchInterval: 60_000,
    });
}
