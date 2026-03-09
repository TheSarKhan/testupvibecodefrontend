import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="container-main py-16">
            <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
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
        </div>
    );
};

export default Profile;
