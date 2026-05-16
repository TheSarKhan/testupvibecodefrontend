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
        mutationFn: (name) =>
            api.post('/admin/subjects', { name }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
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
        mutationFn: ({ subjectId, color, iconEmoji, description }) =>
            api.put(`/admin/subjects/${subjectId}/metadata`, { color, iconEmoji, description }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
    });
}
