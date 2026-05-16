import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminTemplates({ page = 0, size = 10, search = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (search) params.set('search', search);
    return useQuery({
        queryKey: [...adminKeys.templates, { page, size, search }],
        queryFn: () => api.get(`/admin/templates?${params}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useAdminSubtitles(templateId, { page = 0, size = 15 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.subtitles(templateId), { page, size }],
        queryFn: () => api.get(`/admin/templates/${templateId}/subtitles?page=${page}&size=${size}`).then(r => r.data),
        enabled: !!templateId,
        placeholderData: (prev) => prev,
    });
}

export function useAdminSections(subtitleId, { page = 0, size = 15 } = {}) {
    return useQuery({
        queryKey: [...adminKeys.sections(subtitleId), { page, size }],
        queryFn: () => api.get(`/admin/subtitles/${subtitleId}/sections?page=${page}&size=${size}`).then(r => r.data),
        enabled: !!subtitleId,
        placeholderData: (prev) => prev,
    });
}

export function useCreateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (template) => api.post('/admin/templates', template).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.templates }),
    });
}

export function useUpdateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, template }) => api.put(`/admin/templates/${id}`, template).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.templates }),
    });
}

export function useDeleteTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/templates/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.templates }),
    });
}

export function useCloneTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/admin/templates/${id}/clone`).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.templates }),
    });
}

export function useTemplateStats() {
    return useQuery({
        queryKey: [...adminKeys.templates, 'stats'],
        queryFn: () => api.get('/admin/templates/stats').then(r => r.data),
    });
}

export function useCreateSubtitle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, subtitle }) =>
            api.post(`/admin/templates/${templateId}/subtitles`, subtitle).then(r => r.data),
        onSuccess: (_d, { templateId }) =>
            qc.invalidateQueries({ queryKey: adminKeys.subtitles(templateId) }),
    });
}

export function useUpdateSubtitle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, subtitle }) =>
            api.put(`/admin/subtitles/${id}`, subtitle).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'templates'] }),
    });
}

export function useDeleteSubtitle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/subtitles/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'templates'] }),
    });
}

export function useCreateSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ subtitleId, section }) =>
            api.post(`/admin/subtitles/${subtitleId}/sections`, section).then(r => r.data),
        onSuccess: (_d, { subtitleId }) =>
            qc.invalidateQueries({ queryKey: adminKeys.sections(subtitleId) }),
    });
}

export function useUpdateSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, section }) =>
            api.put(`/admin/sections/${id}`, section).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subtitles'] }),
    });
}

export function useDeleteSection() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/sections/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subtitles'] }),
    });
}
