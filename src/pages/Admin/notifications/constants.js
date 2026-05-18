import { HiUserGroup, HiAcademicCap, HiShieldCheck } from 'react-icons/hi';

export const ROLE_OPTIONS = [
    { value: 'STUDENT', label: 'Tələbələr', icon: HiUserGroup, color: 'emerald' },
    { value: 'TEACHER', label: 'Müəllimlər', icon: HiAcademicCap, color: 'blue' },
    { value: 'ADMIN', label: 'Adminlər', icon: HiShieldCheck, color: 'emerald' },
];

export const CHANNEL_LABELS = { SITE: 'Sayt', GMAIL: 'Gmail', SENDPULSE: 'SendPulse' };
export const TARGET_LABELS = { ALL: 'Hamısı', ROLE: 'Rola görə', SELECTED: 'Seçilmiş' };

export const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
