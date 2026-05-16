import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from './queryKeys';

export function useAdminNotificationHistory(page = 0, size = 15) {
    return useQuery({
        queryKey: adminKeys.notifications({ page, size }),
        queryFn: () => api.get(`/admin/notifications/history?page=${page}&size=${size}`).then(r => r.data),
        placeholderData: (prev) => prev,
    });
}

export function useSendAdminNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData) =>
            api.post('/admin/notifications/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.notificationsAll }),
    });
}
