import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminExams({ search = '', status = '', teacherId = '', teacherRoleName = '', page = 0, size = 20 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (teacherId) params.set('teacherId', String(teacherId));
    if (teacherRoleName) params.set('teacherRoleName', teacherRoleName);
    params.set('page', String(page));
    params.set('size', String(size));

    return useQuery({
        queryKey: adminKeys.exams({ search, status, teacherId, teacherRoleName, page, size }),
        queryFn: () => api.get(`/admin/exams?${params}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

function updateExamInCache(qc, examId, mutator) {
    const queries = qc.getQueriesData({ queryKey: adminKeys.examsAll });
    for (const [key, data] of queries) {
        if (!data?.content) continue;
        qc.setQueryData(key, {
            ...data,
            content: data.content.map(e => e.id === examId ? mutator(e) : e),
        });
    }
}

export function useToggleSitePublished() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (examId) =>
            api.patch(`/admin/exams/${examId}/site-publish`).then(r => r.data),
        onMutate: (examId) => {
            updateExamInCache(qc, examId, e => ({ ...e, sitePublished: !e.sitePublished }));
        },
        onError: () => qc.invalidateQueries({ queryKey: adminKeys.examsAll }),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.examsAll }),
    });
}

export function useSetExamPrice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ examId, price }) =>
            api.patch(`/admin/exams/${examId}/price`, { price }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.examsAll }),
    });
}

export function useDeleteExam() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (examId) => api.delete(`/admin/exams/${examId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.examsAll }),
    });
}
