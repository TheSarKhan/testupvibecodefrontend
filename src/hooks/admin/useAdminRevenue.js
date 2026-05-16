import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminRevenue() {
    return useQuery({
        queryKey: adminKeys.revenue,
        queryFn: () => api.get('/admin/revenue').then(r => r.data),
    });
}

export function useAdminPendingOrders({ page = 0, size = 10 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.pendingOrders, { page, size }],
        queryFn: () => api.get(`/admin/revenue/pending-orders?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useVerifyOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (orderId) =>
            api.post(`/admin/revenue/verify-order/${orderId}`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.revenue });
            qc.invalidateQueries({ queryKey: adminKeys.pendingOrders });
        },
    });
}

export function useForceActivateOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (orderId) =>
            api.post(`/admin/revenue/force-activate/${orderId}`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.revenue });
            qc.invalidateQueries({ queryKey: adminKeys.pendingOrders });
        },
    });
}

export function useCancelOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (orderId) =>
            api.post(`/admin/revenue/cancel-order/${orderId}`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.pendingOrders });
        },
    });
}

export async function downloadRevenueCsv({ status, from, to } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const response = await api.get(`/admin/revenue/export?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
