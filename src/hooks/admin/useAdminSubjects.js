import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminSubjects({ page = 0, size = 15 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.subjects, { page, size }],
        queryFn: () => api.get(`/admin/subjects?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useAdminSubjectStats(subjectId) {
    return useQuery({
        queryKey: adminKeys.subjectStats(subjectId),
        queryFn: () => api.get(`/admin/subjects/${subjectId}/stats`).then(r => r.data),
        enabled: !!subjectId,
    });
}

export function useAddSubject() {
    const qc = useQueryClient();
    return useMutation({
        // Accepts either a plain name string or { name, categoryId }
        mutationFn: (input) => {
            const body = typeof input === 'string' ? { name: input } : input;
            return api.post('/admin/subjects', body).then(r => r.data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}

// ── Subject categories (admin-managed picker groups) ──

const CATEGORY_KEY = ['admin', 'subject-categories'];

export function useSubjectCategories() {
    return useQuery({
        queryKey: CATEGORY_KEY,
        queryFn: () => api.get('/admin/subjects/categories').then(r => r.data),
    });
}

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ name, orderIndex, color }) =>
            api.post('/admin/subjects/categories', { name, orderIndex, color }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORY_KEY }),
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name, orderIndex, color }) =>
            api.put(`/admin/subjects/categories/${id}`, { name, orderIndex, color }).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CATEGORY_KEY });
            qc.invalidateQueries({ queryKey: adminKeys.subjects }); // subjects show category names
        },
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/subjects/categories/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CATEGORY_KEY });
            qc.invalidateQueries({ queryKey: adminKeys.subjects }); // FK SET NULL detaches subjects
        },
    });
}

export function useDeleteSubject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/subjects/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}

export function useAddTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ subjectId, name, gradeLevel }) =>
            api.post(`/admin/subjects/${subjectId}/topics`, { name, gradeLevel }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}

export function useDeleteTopic() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ subjectId, topicId }) =>
            api.delete(`/admin/subjects/${subjectId}/topics/${topicId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}

export function useUpdateSubjectMetadata() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ subjectId, color, iconEmoji, description, categoryId }) =>
            api.put(`/admin/subjects/${subjectId}/metadata`, { color, iconEmoji, description, categoryId }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}
