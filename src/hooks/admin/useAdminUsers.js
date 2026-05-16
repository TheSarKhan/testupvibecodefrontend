import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminUsers({ search = '', role = '', page = 0, size = 20 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    params.set('page', String(page));
    params.set('size', String(size));

    return useQuery({
        queryKey: adminKeys.users({ search, role, page, size }),
        queryFn: () => api.get(`/admin/users?${params}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

function updateUserInCache(qc, userId, mutator) {
    const queries = qc.getQueriesData({ queryKey: adminKeys.usersAll });
    for (const [key, data] of queries) {
        if (!data?.content) continue;
        qc.setQueryData(key, {
            ...data,
            content: data.content.map(u => u.id === userId ? mutator(u) : u),
        });
    }
}

export function useChangeUserRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, role }) =>
            api.patch(`/admin/users/${userId}/role`, { role }).then(r => r.data),
        onMutate: ({ userId, role }) => {
            updateUserInCache(qc, userId, u => ({ ...u, role }));
        },
        onError: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}

export function useToggleUserStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) =>
            api.patch(`/admin/users/${userId}/toggle-status`).then(r => r.data),
        onMutate: (userId) => {
            updateUserInCache(qc, userId, u => ({ ...u, enabled: !u.enabled }));
        },
        onError: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}

export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}

export function useAssignExamToUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, examId }) =>
            api.post(`/admin/users/${userId}/assign-exam`, { examId }),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}

export function useBulkDeleteUsers() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userIds) => api.post('/admin/users/bulk/delete', { userIds }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}

export function useBulkToggleUserStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userIds, enabled }) =>
            api.post('/admin/users/bulk/toggle-status', { userIds, enabled }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.usersAll }),
    });
}
