import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const { data } = await api.get('/submissions/my-results');
                setResults(data);
            } catch (error) {
                toast.error("Nəticələri yükləyərkən xəta baş verdi");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchResults();
        }
    }, [user]);

    return (
        <div className="container-main py-16">
            <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{user?.fullName}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 px-3 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nəticələrim</h2>
            
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : results.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 border border-gray-100">
                    Hələ heç bir imtahanda iştirak etməmisiniz.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((result) => (
                        <div key={result.id} className="bg-white border text-left border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2 truncate" title={result.examTitle}>
                                    {result.examTitle}
                                </h3>
                                <div className="space-y-1 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Toplanan Bal:</span>
                                        <span className="font-semibold text-indigo-600">{result.totalScore} / {result.maxScore}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`font-medium ${result.isFullyGraded ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {result.isFullyGraded ? 'Tam Yoxlanılıb' : 'Yoxlanılır...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 text-xs text-gray-400">
                                {new Date(result.submittedAt).toLocaleString('az-AZ')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;
