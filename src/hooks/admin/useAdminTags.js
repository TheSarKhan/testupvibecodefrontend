import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminTags({ page = 0, size = 20 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.tags, { page, size }],
        queryFn: () => api.get(`/admin/tags?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useTagStats() {
    return useQuery({
        queryKey: [...adminKeys.tags, 'stats'],
        queryFn: () => api.get('/admin/tags/stats').then(r => r.data),
    });
}

export function useCreateTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tag) => api.post('/admin/tags', tag).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.tags }),
    });
}

export function useUpdateTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...patch }) => api.put(`/admin/tags/${id}`, patch).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.tags }),
    });
}

export function useDeleteTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/tags/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.tags }),
    });
}

export function useMergeTags() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sourceId, targetId }) =>
            api.post(`/admin/tags/${sourceId}/merge/${targetId}`).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.tags }),
    });
}

export function useBulkDeleteTags() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids) => api.post('/admin/tags/bulk-delete', { ids }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.tags }),
    });
}
