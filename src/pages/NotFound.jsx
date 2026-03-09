import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-7xl font-bold text-indigo-600">404</h1>
            <p className="mt-4 text-xl text-gray-700">Səhifə tapılmadı</p>
            <p className="mt-2 text-gray-500">Axtardığınız səhifə mövcud deyil.</p>
            <Link
                to="/"
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Ana Səhifəyə qayıt
            </Link>
        </div>
    );
};

export default NotFound;
