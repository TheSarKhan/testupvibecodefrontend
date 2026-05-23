// Mərkəzi enum → Azərbaycanca label mapping.
// Bütün user-facing yerlərdə istifadəçi MCQ, OPEN_MANUAL, EXAM_CREATED kimi
// raw enum stringləri görməsin deyə bu fayl single source of truth-dır.
//
// Yeni enum əlavə edirsinizsə backend enum-uyla uzlaşdırın (backend/src/main/java/.../enums).

// ── Question types (backend QuestionType enum) ───────────────────────────────
export const QUESTION_TYPE_LABELS = {
    MCQ: 'Test (Birseçimli)',
    TRUE_FALSE: 'Doğru/Yanlış',
    MULTI_SELECT: 'Çoxseçimli',
    OPEN_AUTO: 'Açıq (avtomatik)',
    OPEN_MANUAL: 'Açıq (müəllim yoxlayır)',
    FILL_IN_THE_BLANK: 'Boşluq doldurma',
    MATCHING: 'Uyğunlaşdırma',
};

// Qısa variantlar — dar yerlər (badge, mobile) üçün
export const QUESTION_TYPE_LABELS_SHORT = {
    MCQ: 'Birseçimli',
    TRUE_FALSE: 'D/Y',
    MULTI_SELECT: 'Çoxseçimli',
    OPEN_AUTO: 'Açıq (auto)',
    OPEN_MANUAL: 'Açıq (müəllim)',
    FILL_IN_THE_BLANK: 'Boşluq',
    MATCHING: 'Uyğunlaşdırma',
};

// Frontend-də MCQ + TRUE_FALSE bir QuestionEditor variantı kimi birləşdirilir
// (MULTIPLE_CHOICE) — bu birləşik tipin labelı.
export const FRONTEND_QUESTION_TYPE_LABELS = {
    MULTIPLE_CHOICE: 'Test (Birseçimli / Doğru-Yanlış)',
    MULTI_SELECT: 'Çoxseçimli',
    OPEN_AUTO: 'Açıq (avtomatik)',
    OPEN_MANUAL: 'Açıq (müəllim yoxlayır)',
    FILL_IN_THE_BLANK: 'Boşluq doldurma',
    MATCHING: 'Uyğunlaşdırma',
};

// ── Difficulty (backend Difficulty enum) ─────────────────────────────────────
export const DIFFICULTY_LABELS = {
    EASY: 'Asan',
    MEDIUM: 'Orta',
    HARD: 'Çətin',
};

// ── Exam status / visibility ─────────────────────────────────────────────────
export const EXAM_STATUS_LABELS = {
    DRAFT: 'Qaralama',
    PUBLISHED: 'Dərc edilib',
    ACTIVE: 'Aktiv',
    CANCELLED: 'Bağlı',
    COMPLETED: 'Tamamlandı',
    ARCHIVED: 'Arxiv',
};

export const EXAM_VISIBILITY_LABELS = {
    PUBLIC: 'Açıq (hər kəs)',
    PRIVATE: 'Gizli (kodla giriş)',
};

export const EXAM_VISIBILITY_LABELS_SHORT = {
    PUBLIC: 'Açıq',
    PRIVATE: 'Gizli',
};

export const EXAM_TYPE_LABELS = {
    FREE: 'Sərbəst',
    TEMPLATE: 'Şablon',
};

// ── Submission lifecycle ─────────────────────────────────────────────────────
export const SUBMISSION_STATUS_LABELS = {
    IN_PROGRESS: 'Davam edir',
    SUBMITTED: 'Göndərildi',
    GRADED: 'Qiymətləndirildi',
    EXPIRED: 'Vaxtı bitdi',
};

// ── Roles ────────────────────────────────────────────────────────────────────
export const ROLE_LABELS = {
    ADMIN: 'Admin',
    TEACHER: 'Müəllim',
    STUDENT: 'Şagird',
};

// ── Notifications (backend NotificationType + channels) ──────────────────────
export const NOTIFICATION_TYPE_LABELS = {
    SYSTEM: 'Sistem',
    ANNOUNCEMENT: 'Elan',
    WARNING: 'Təcili',
    EXAM_CREATED: 'İmtahan',
    EXAM_GRADED: 'Qiymətləndirildi',
    PAYMENT_SUCCESS: 'Ödəniş',
    PAYMENT_FAILED: 'Ödəniş uğursuz',
    SUBSCRIPTION_EXPIRING: 'Abunəlik bitir',
    SUBSCRIPTION_EXPIRED: 'Abunəlik bitdi',
};

export const NOTIFICATION_CHANNEL_LABELS = {
    SITE: 'Sayt',
    GMAIL: 'E-poçt',
    SENDPULSE: 'SendPulse',
};

export const NOTIFICATION_TARGET_LABELS = {
    ALL: 'Hamı',
    ROLE: 'Rol üzrə',
    SELECTED: 'Seçilmişlər',
};

// ── Passage types ────────────────────────────────────────────────────────────
export const PASSAGE_TYPE_LABELS = {
    LISTENING: 'Dinləmə',
    TEXT: 'Mətn',
    IMAGE: 'Şəkil',
    VIDEO: 'Video',
};

// ── Collaborative exam status ────────────────────────────────────────────────
export const COLLAB_STATUS_LABELS = {
    ASSIGNED: 'Gözləyir',
    SUBMITTED: 'Göndərildi',
    APPROVED: 'Təsdiqləndi',
    REJECTED: 'Geri qaytarıldı',
};

// ── Utility: safe lookup that falls back to a humanised version of the key
// instead of leaking the raw enum (e.g. "EXAM_CREATED" → "Exam created")
export const labelOr = (map, key, fallback) => {
    if (!key) return fallback ?? '';
    if (map[key]) return map[key];
    return fallback ?? String(key)
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, c => c.toUpperCase());
};
