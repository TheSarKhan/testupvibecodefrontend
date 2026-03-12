import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineBookOpen, HiOutlineGlobe, HiOutlineUser,
    HiOutlineX, HiOutlineCheck
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminQuestionBank = () => {
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIsGlobal, setNewIsGlobal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/bank/subjects');
            setSubjects(data);
        } catch {
            toast.error('Fənnlər yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            const { data } = await api.post('/bank/subjects', { name: newName.trim(), isGlobal: newIsGlobal });
            setSubjects(prev => [data, ...prev]);
            setNewName('');
            setNewIsGlobal(false);
            setAdding(false);
            toast.success('Fənn əlavə edildi');
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        try {
            const { data } = await api.put(`/bank/subjects/${id}`, { name: editName.trim() });
            setSubjects(prev => prev.map(s => s.id === id ? data : s));
            setEditId(null);
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu fənni silmək istədiyinizdən əminsiniz? Bütün suallar da silinəcək.')) return;
        try {
            await api.delete(`/bank/subjects/${id}`);
            setSubjects(prev => prev.filter(s => s.id !== id));
            toast.success('Fənn silindi');
        } catch {
            toast.error('Xəta baş verdi');
        }
    };

    const globalSubjects = subjects.filter(s => s.isGlobal);
    const ownSubjects = subjects.filter(s => !s.isGlobal);

    const SubjectCard = ({ subject }) => (
        <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate(`/admin/sual-bazasi/${subject.id}`)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${subject.isGlobal ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {subject.isGlobal ? <HiOutlineGlobe className="w-4 h-4" /> : <HiOutlineBookOpen className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                        {editId === subject.id ? (
                            <input
                                autoFocus
                                className="text-sm font-semibold border border-indigo-300 rounded-lg px-2 py-1 w-full"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => { if (e.key === 'Enter') handleRename(subject.id); if (e.key === 'Escape') setEditId(null); }}
                            />
                        ) : (
                            <p className="text-sm font-bold text-gray-900 truncate">{subject.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{subject.questionCount} sual</span>
                            {subject.isGlobal ? (
                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Ümumi</span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <HiOutlineUser className="w-3 h-3" /> Şəxsi
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                    {editId === subject.id ? (
                        <>
                            <button onClick={() => handleRename(subject.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><HiOutlineCheck className="w-4 h-4" /></button>
                            <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><HiOutlineX className="w-4 h-4" /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setEditId(subject.id); setEditName(subject.name); }} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><HiOutlinePencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(subject.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><HiOutlineTrash className="w-4 h-4" /></button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Sual Bazası</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Bütün fənnlər və sualları idarə edin</p>
                </div>
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    <HiOutlinePlus className="w-4 h-4" /> Fənn əlavə et
                </button>
            </div>

            {/* Add form */}
            {adding && (
                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Yeni fənn</p>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            autoFocus
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
                            placeholder="Fənnin adı..."
                            className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newIsGlobal}
                                onChange={e => setNewIsGlobal(e.target.checked)}
                                className="w-4 h-4 accent-purple-600"
                            />
                            Ümumi baza
                        </label>
                        <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">Əlavə et</button>
                        <button onClick={() => { setAdding(false); setNewName(''); setNewIsGlobal(false); }} className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">Ləğv et</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : subjects.length === 0 ? (
                <div className="text-center py-20">
                    <HiOutlineBookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Hələ heç bir fənn yoxdur</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {globalSubjects.length > 0 && (
                        <div>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ümumi baza</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {globalSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                            </div>
                        </div>
                    )}
                    {ownSubjects.length > 0 && (
                        <div>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Şəxsi fənnlər</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {ownSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminQuestionBank;
