import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const SUBJECTS_KEY = ['admin', 'bank', 'subjects'];
const questionsKey = (subjectId) => ['admin', 'bank', 'subjects', subjectId, 'questions'];

export function useBankSubjects({ page = 0, size = 12 } = {}) {
    return useQuery({
        queryKey: [...SUBJECTS_KEY, { page, size }],
        queryFn: () => api.get(`/bank/subjects/paged?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useBankSubjectQuestions(subjectId, { page = 0, size = 20 } = {}) {
    return useQuery({
        queryKey: [...questionsKey(subjectId), { page, size }],
        queryFn: () => api.get(`/bank/subjects/${subjectId}/questions/paged?page=${page}&size=${size}`).then(r => r.data),
        enabled: !!subjectId,
        placeholderData: (prev) => prev,
    });
}

export function useCreateBankSubject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post('/bank/subjects', payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
    });
}

export function useUpdateBankSubject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => api.put(`/bank/subjects/${id}`, payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
    });
}

export function useDeleteBankSubject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/bank/subjects/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
    });
}

export function useCreateBankQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post('/bank/questions', payload).then(r => r.data),
        onSuccess: (_d, payload) => {
            if (payload?.subjectId) {
                qc.invalidateQueries({ queryKey: questionsKey(payload.subjectId) });
            }
            qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
        },
    });
}

export function useUpdateBankQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => api.put(`/bank/questions/${id}`, payload).then(r => r.data),
        onSuccess: (_d, { payload }) => {
            if (payload?.subjectId) {
                qc.invalidateQueries({ queryKey: questionsKey(payload.subjectId) });
            }
        },
    });
}

export function useDeleteBankQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id }) => api.delete(`/bank/questions/${id}`),
        onSuccess: (_d, { subjectId }) => {
            if (subjectId) qc.invalidateQueries({ queryKey: questionsKey(subjectId) });
            qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
        },
    });
}

// ─── Admin: import a teacher's bank into the site (global) bank ──────────────

/** All bank subjects owned by a given teacher (import source side). */
export function useTeacherBankSubjects(teacherId) {
    return useQuery({
        queryKey: ['admin', 'bank', 'teacher', teacherId, 'subjects'],
        queryFn: () => api.get(`/admin/bank/teacher/${teacherId}/subjects`).then(r => r.data),
        enabled: !!teacherId,
    });
}

/** Questions of any subject for admin preview (no owner guard). */
export function useAdminSubjectQuestions(subjectId) {
    return useQuery({
        queryKey: ['admin', 'bank', 'subject', subjectId, 'questions'],
        queryFn: () => api.get(`/admin/bank/subject/${subjectId}/questions`).then(r => r.data),
        enabled: !!subjectId,
    });
}

/** Deep-copy a teacher's questions into the site bank. */
export function useImportFromTeacher() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post('/admin/bank/import', payload).then(r => r.data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
            if (data?.targetSubjectId) {
                qc.invalidateQueries({ queryKey: questionsKey(data.targetSubjectId) });
            }
        },
    });
}
