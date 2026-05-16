import { useState } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { adminKeys } from '../../../hooks/admin/queryKeys';

const AssignPlanModal = ({ user, onClose }) => {
    const qc = useQueryClient();
    const [planForm, setPlanForm] = useState({ planId: '', durationMonths: 1 });
    const [assigning, setAssigning] = useState(false);

    const { data: plans = [] } = useQuery({
        queryKey: ['public', 'subscription-plans'],
        queryFn: () => api.get('/subscription-plans').then(r => r.data.sort((a, b) => a.price - b.price)),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAssigning(true);
        try {
            await api.post('/user-subscriptions/assign', {
                userId: user.id,
                planId: planForm.planId,
                durationMonths: planForm.durationMonths,
                paymentProvider: 'MANUAL_ADMIN',
            });
            toast.success('Abunəlik planı təyin edildi');
            qc.invalidateQueries({ queryKey: adminKeys.usersAll });
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Plan təyin edərkən xəta baş verdi');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900">Plan Təyin Et</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <HiOutlineX className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    <strong>{user.fullName}</strong> adlı istifadəçiyə plan təyin edirsiniz.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Seçin *</label>
                        <select
                            required
                            value={planForm.planId}
                            onChange={e => setPlanForm({ ...planForm, planId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                        >
                            <option value="">Plan seçin...</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.price} ₼)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Müddət (Ay) *</label>
                        <input
                            type="number"
                            min="1"
                            max="1200"
                            required
                            value={planForm.durationMonths}
                            onChange={e => setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">Sistem tərəfindən limitsiz planlaşdırmalar üçün (məs: 1200 ay = 100 il) yaza bilərsiniz.</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                            Ləğv et
                        </button>
                        <button type="submit" disabled={assigning} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70">
                            {assigning ? 'Təyin edilir...' : 'Təyin et'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignPlanModal;
