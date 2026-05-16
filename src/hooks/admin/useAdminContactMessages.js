import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminContactMessages({ search = '', subject = '', read = '', page = 0, size = 20 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (subject) params.set('subject', subject);
    if (read !== '') params.set('read', read);
    params.set('page', String(page));
    params.set('size', String(size));

    return useQuery({
        queryKey: adminKeys.contactMessages({ search, subject, read, page, size }),
        queryFn: () => api.get(`/admin/contact-messages?${params}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useContactMessagesUnreadCount() {
    return useQuery({
        queryKey: adminKeys.contactMessagesUnreadCount,
        queryFn: () => api.get('/admin/contact-messages/unread-count').then(r => r.data),
    });
}

export function useMarkContactMessageRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.patch(`/admin/contact-messages/${id}/read`).then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.contactMessagesAll });
            qc.invalidateQueries({ queryKey: adminKeys.contactMessagesUnreadCount });
        },
    });
}

export function useReplyContactMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reply }) =>
            api.post(`/admin/contact-messages/${id}/reply`, reply).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.contactMessagesAll }),
    });
}

export function useDeleteContactMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/admin/contact-messages/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.contactMessagesAll });
            qc.invalidateQueries({ queryKey: adminKeys.contactMessagesUnreadCount });
        },
    });
}
