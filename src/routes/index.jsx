import { createBrowserRouter } from 'react-router-dom';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Pages
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import Contact from '../pages/Contact/Contact';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ExamList from '../pages/Exams/ExamList';
import ExamView from '../pages/Exams/ExamView';
import ExamEditor from '../pages/Teacher/ExamEditor';
import Profile from '../pages/Profile/Profile';
import NotFound from '../pages/NotFound';

// Protected
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'haqqimizda', element: <About /> },
            { path: 'elaqe', element: <Contact /> },
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'imtahanlar', element: <ExamList /> },
            { path: 'imtahanlar/:id', element: <ExamView /> },
            { path: 'imtahanlar/yarat', element: <ExamEditor /> },
            { path: 'imtahanlar/edit/:id', element: <ExamEditor /> },
            {
                path: 'profil',
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
            { path: '*', element: <NotFound /> },
        ],
    },
]);

export default router;
