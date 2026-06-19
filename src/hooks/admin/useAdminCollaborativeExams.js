import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminCollaborativeExams({ page = 0, size = 15 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.collaborativeExams, { page, size }],
        queryFn: () => api.get(`/admin/collaborative-exams?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useCollaborativePendingCount() {
    return useQuery({
        queryKey: adminKeys.collaborativeExamsPendingCount,
        queryFn: () => api.get('/admin/collaborative-exams/pending-count').then(r => r.data),
    });
}

export function useCreateCollaborativeExam() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post('/admin/collaborative-exams', payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams }),
    });
}

export function useApproveCollaborator() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (collaboratorId) =>
            api.post(`/admin/collaborators/${collaboratorId}/approve`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams });
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExamsPendingCount });
        },
    });
}

export function useRejectCollaborator() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ collaboratorId, comment }) =>
            api.post(`/admin/collaborators/${collaboratorId}/reject`, { comment }).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams });
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExamsPendingCount });
        },
    });
}

// ── Per-question (hybrid) review ────────────────────────────────────────────

export function useApproveQuestion() {
    return useMutation({
        mutationFn: (questionId) =>
            api.post(`/admin/questions/${questionId}/approve`).then(r => r.data),
    });
}

export function useRejectQuestion() {
    return useMutation({
        mutationFn: ({ questionId, comment }) =>
            api.post(`/admin/questions/${questionId}/reject`, { comment }).then(r => r.data),
    });
}

export function useFinalizeReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (collaboratorId) =>
            api.post(`/admin/collaborators/${collaboratorId}/finalize`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams });
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExamsPendingCount });
        },
    });
}

// One-click publish/unpublish for a collaborative exam — flips sitePublished, status, and
// visibility together so the student catalog actually surfaces the exam.
export function usePublishCollaborative() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (examId) =>
            api.post(`/admin/collaborative-exams/${examId}/publish`).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams }),
    });
}

export function useUnpublishCollaborative() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (examId) =>
            api.post(`/admin/collaborative-exams/${examId}/unpublish`).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams }),
    });
}

export function useDeleteCollaborative() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (examId) =>
            api.delete(`/admin/collaborative-exams/${examId}`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExams });
            qc.invalidateQueries({ queryKey: adminKeys.collaborativeExamsPendingCount });
        },
    });
}
