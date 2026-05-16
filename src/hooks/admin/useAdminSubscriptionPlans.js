import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const KEY = ['admin', 'subscription-plans'];

export function useAdminSubscriptionPlans({ page = 0, size = 12 } = {}) {
    return useQuery({
        queryKey: [...KEY, { page, size }],
        queryFn: () => api.get(`/subscription-plans/paged?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useCreateSubscriptionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (plan) => api.post('/subscription-plans', plan).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}

export function useUpdateSubscriptionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, plan }) => api.put(`/subscription-plans/${id}`, plan).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}

export function useDeleteSubscriptionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/subscription-plans/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
}
