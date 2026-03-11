import { useState, useEffect } from 'react';
import { HiOutlineBookOpen, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/admin/subjects');
            setSubjects(data);
        } catch {
            toast.error('Fənnlər yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) return;
        setAdding(true);
        try {
            const { data } = await api.post('/admin/subjects', { name: trimmed });
            setSubjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'az')));
            setNewName('');
            toast.success(`"${data.name}" əlavə edildi`);
        } catch (error) {
            toast.error(error.message || 'Xəta baş verdi');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (subject) => {
        if (subject.default) {
            toast.error('Default fənnlər silinə bilməz');
            return;
        }
        try {
            await api.delete(`/admin/subjects/${subject.id}`);
            setSubjects(prev => prev.filter(s => s.id !== subject.id));
            toast.success(`"${subject.name}" silindi`);
        } catch (error) {
            toast.error(error.message || 'Xəta baş verdi');
        }
    };

    return (
        <div className="p-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Fənn İdarəetməsi</h1>
                <p className="text-sm text-gray-500 mt-1">Müəllimlərin imtahan yaradarkən seçə biləcəyi fənn siyahısı</p>
            </div>

            {/* Add form */}
            <form onSubmit={handleAdd} className="flex gap-3 mb-8">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiOutlineBookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Yeni fənn adı (məs. Süni İntellekt)"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        maxLength={80}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newName.trim() || adding}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Əlavə et
                </button>
            </form>

            {/* Subject list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Fənnlər</span>
                        <span className="text-xs text-gray-500">{subjects.length} ədəd</span>
                    </div>
                    {subjects.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 text-sm">Heç bir fənn tapılmadı</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {subjects.map(subject => (
                                <li key={subject.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineBookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-800 font-medium">{subject.name}</span>
                                        {subject.default && (
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {!subject.default && (
                                        <button
                                            onClick={() => handleDelete(subject)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminSubjects;
