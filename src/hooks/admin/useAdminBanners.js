import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminBanners({ page = 0, size = 10 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.banners, { page, size }],
        queryFn: () => api.get(`/admin/banners?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useCreateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (banner) => api.post('/admin/banners', banner).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.banners }),
    });
}

export function useUpdateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, banner }) => api.put(`/admin/banners/${id}`, banner).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.banners }),
    });
}

export function useDeleteBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/banners/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.banners }),
    });
}
