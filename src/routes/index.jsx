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

import ExamEntry from '../pages/Student/ExamEntry';
import ExamSession from '../pages/Student/ExamSession';
import ExamResultSummary from '../pages/Student/ExamResultSummary';
import ExamReview from '../pages/Student/ExamReview';
import ExamResults from '../pages/Teacher/ExamResults';
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminMyExams from '../pages/Admin/AdminMyExams';
import AdminExams from '../pages/Admin/AdminExams';

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
            { path: 'imtahanlar/:examId/neticeler', element: <ExamResults /> },
            { path: 'imtahanlar/:examId/statistika', element: <ExamResults /> },
            { path: 'imtahanlar/:id', element: <ExamView /> },
            { path: 'imtahanlar/yarat', element: <ExamEditor /> },
            { path: 'imtahanlar/edit/:id', element: <ExamEditor /> },
            { path: 'imtahanlar/duzenle/:id', element: <ExamEditor /> },
            { path: 'imtahan/:shareLink', element: <ExamEntry /> },
            { path: 'test/take/:sessionId', element: <ExamSession /> },
            { path: 'test/result/:sessionId', element: <ExamResultSummary /> },
            { path: 'test/review/:sessionId', element: <ExamReview /> },
            {
                path: 'profil',
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin',
                element: (
                    <ProtectedRoute roles={['ADMIN']}>
                        <AdminLayout />
                    </ProtectedRoute>
                ),
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: 'users', element: <AdminUsers /> },
                    { path: 'oz-imtahanlar', element: <AdminMyExams /> },
                    { path: 'muellim-imtahanlar', element: <AdminExams /> },
                ],
            },
            { path: '*', element: <NotFound /> },
        ],
    },
]);

export default router;
