import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineBookOpen, HiOutlineGlobe, HiOutlineUser,
    HiOutlineX, HiOutlineCheck
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QuestionBank = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [examSubjects, setExamSubjects] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchSubjects();
        api.get('/subjects').then(r => setExamSubjects(r.data || [])).catch(() => {});
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
            const { data } = await api.post('/bank/subjects', { name: newName.trim() });
            setSubjects(prev => [data, ...prev]);
            setNewName('');
            setAdding(false);
            toast.success('Fənn əlavə edildi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        try {
            const { data } = await api.put(`/bank/subjects/${id}`, { name: editName.trim() });
            setSubjects(prev => prev.map(s => s.id === id ? data : s));
            setEditId(null);
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (id) => {
        const subject = subjects.find(s => s.id === id);
        if (subject?.questionCount > 0) {
            toast.error(`Bu fənndə ${subject.questionCount} sual var. Əvvəlcə sualları silin.`);
            return;
        }
        if (!window.confirm('Bu fənni silmək istədiyinizdən əminsiniz?')) return;
        try {
            await api.delete(`/bank/subjects/${id}`);
            setSubjects(prev => prev.filter(s => s.id !== id));
            toast.success('Fənn silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const ownSubjects = subjects.filter(s => !s.isGlobal || isAdmin);
    const globalSubjects = subjects.filter(s => s.isGlobal && !isAdmin);

    const SubjectCard = ({ subject }) => {
        const isOwn = !subject.isGlobal || isAdmin;
        return (
            <div
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/sual-bazasi/${subject.id}`)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${subject.isGlobal ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {subject.isGlobal ? <HiOutlineGlobe className="w-5 h-5" /> : <HiOutlineBookOpen className="w-5 h-5" />}
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
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">{subject.questionCount} sual</span>
                                {subject.isGlobal && (
                                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Admin</span>
                                )}
                                {!subject.isGlobal && (
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <HiOutlineUser className="w-3 h-3" /> Mənim
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isOwn && (
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
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Sual Bazası</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Fənnlər üzrə suallarınızı idarə edin</p>
                    </div>
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Fənn əlavə et
                    </button>
                </div>
            </div>

            <div className="container-main mt-8 space-y-8">
                {/* Add new subject form */}
                {adding && (
                    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Yeni fənn</p>
                        <div className="flex gap-3">
                            <select
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">— Fənn seçin —</option>
                                {examSubjects
                                    .filter(name => !subjects.some(s => s.name === name))
                                    .map(name => <option key={name} value={name}>{name}</option>)
                                }
                            </select>
                            <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">Əlavə et</button>
                            <button onClick={() => { setAdding(false); setNewName(''); }} className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">Ləğv et</button>
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
                        <p className="text-sm text-gray-400 mt-1">Yuxarıdakı "Fənn əlavə et" düyməsini basın</p>
                    </div>
                ) : (
                    <>
                        {ownSubjects.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Mənim fənnlərim</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {ownSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                                </div>
                            </div>
                        )}
                        {globalSubjects.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ümumi baza (Admin)</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {globalSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default QuestionBank;
