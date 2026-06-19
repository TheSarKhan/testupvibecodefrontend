import { EXAM_STATUS_LABELS } from '../../../utils/enumLabels';

// Per-collaborator review status (ExamCollaborator.status).
export const STATUS_CONFIG = {
    ASSIGNED:  { label: 'Gözləyir',        color: 'text-blue-600 bg-blue-50 border-blue-200' },
    SUBMITTED: { label: 'Göndərildi',       color: 'text-amber-600 bg-amber-50 border-amber-200' },
    APPROVED:  { label: 'Təsdiqləndi',      color: 'text-green-600 bg-green-50 border-green-200' },
    REJECTED:  { label: 'Geri qaytarıldı',  color: 'text-red-600 bg-red-50 border-red-200' },
};

// Exam-level lifecycle status (Exam.status) → chip styling. This is a DIFFERENT
// enum from the collaborator status above; rendering exam.status through
// STATUS_CONFIG leaked the raw English enum (e.g. a published exam showed
// "PUBLISHED" and a draft showed "DRAFT"). Labels come from the central enum
// map so a draft reads "Qaralama" and only a truly published exam reads
// "Dərc edilib".
const EXAM_STATUS_COLOR = {
    DRAFT:     'text-gray-600 bg-gray-50 border-gray-200',
    PUBLISHED: 'text-green-700 bg-green-50 border-green-200',
    ACTIVE:    'text-blue-600 bg-blue-50 border-blue-200',
    COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    CANCELLED: 'text-red-600 bg-red-50 border-red-200',
    ARCHIVED:  'text-gray-500 bg-gray-50 border-gray-200',
};

export const examStatusChip = (status) => ({
    label: EXAM_STATUS_LABELS[status] || EXAM_STATUS_LABELS.DRAFT,
    color: EXAM_STATUS_COLOR[status] || EXAM_STATUS_COLOR.DRAFT,
});
