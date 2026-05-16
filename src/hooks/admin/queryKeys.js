export const adminKeys = {
    stats: ['admin', 'stats'],

    revenue: ['admin', 'revenue'],
    pendingOrders: ['admin', 'revenue', 'pending-orders'],

    users: (params = {}) => ['admin', 'users', params],
    usersAll: ['admin', 'users'],

    exams: (params = {}) => ['admin', 'exams', params],
    examsAll: ['admin', 'exams'],

    subjects: ['admin', 'subjects'],
    subjectStats: (id) => ['admin', 'subjects', id, 'stats'],

    banners: ['admin', 'banners'],

    notifications: (page) => ['admin', 'notifications', 'history', page],
    notificationsAll: ['admin', 'notifications'],

    logs: (params = {}) => ['admin', 'logs', params],
    logsAll: ['admin', 'logs'],

    templates: ['admin', 'templates'],
    subtitles: (templateId) => ['admin', 'templates', templateId, 'subtitles'],
    sections: (subtitleId) => ['admin', 'subtitles', subtitleId, 'sections'],

    contactMessages: (params = {}) => ['admin', 'contact-messages', params],
    contactMessagesAll: ['admin', 'contact-messages'],
    contactMessagesUnreadCount: ['admin', 'contact-messages', 'unread-count'],

    tags: ['admin', 'tags'],

    collaborativeExams: ['admin', 'collaborative-exams'],
    collaborativeExamsPendingCount: ['admin', 'collaborative-exams', 'pending-count'],
};
