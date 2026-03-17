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
import Pricing from '../pages/Pricing/Pricing';
import NotFound from '../pages/NotFound';

import ExamEntry from '../pages/Student/ExamEntry';
import ExamSession from '../pages/Student/ExamSession';
import ExamResultSummary from '../pages/Student/ExamResultSummary';
import ExamReview from '../pages/Student/ExamReview';
import ExamResults from '../pages/Teacher/ExamResults';
import QuestionBank from '../pages/Teacher/QuestionBank';
import QuestionBankSubject from '../pages/Teacher/QuestionBankSubject';
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminMyExams from '../pages/Admin/AdminMyExams';
import AdminExams from '../pages/Admin/AdminExams';
import AdminSubjects from '../pages/Admin/AdminSubjects';
import AdminTemplates from '../pages/Admin/AdminTemplates';
import AdminSubtitles from '../pages/Admin/AdminSubtitles';
import AdminTemplateSections from '../pages/Admin/AdminTemplateSections';
import AdminSubscriptionPlans from '../pages/Admin/AdminSubscriptionPlans';
import AdminQuestionBank from '../pages/Admin/AdminQuestionBank';
import AdminQuestionBankSubject from '../pages/Admin/AdminQuestionBankSubject';
import AdminBanners from '../pages/Admin/AdminBanners';
import AdminNotifications from '../pages/Admin/AdminNotifications';
import AdminCollaborativeExams from '../pages/Admin/AdminCollaborativeExams';
import AdminLogs from '../pages/Admin/AdminLogs';
import CollaborativeAssignments from '../pages/Teacher/CollaborativeAssignments';

// Protected
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
    // ── Main site (with Navbar + Footer) ──
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
            { path: 'birge-imtahanlari', element: <CollaborativeAssignments /> },
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
            { path: 'planlar', element: <Pricing /> },
            {
                path: 'sual-bazasi',
                element: (
                    <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                        <QuestionBank />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'sual-bazasi/:subjectId',
                element: (
                    <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                        <QuestionBankSubject />
                    </ProtectedRoute>
                ),
            },
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

    // ── Admin panel (standalone, no site Navbar) ──
    {
        path: '/admin',
        element: (
            <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'users', element: <AdminUsers /> },
            { path: 'oz-imtahanlar', element: <AdminMyExams /> },
            { path: 'birge-imtahanlar', element: <AdminCollaborativeExams /> },
            { path: 'muellim-imtahanlar', element: <AdminExams /> },
            { path: 'fennler', element: <AdminSubjects /> },
            { path: 'sablonlar', element: <AdminTemplates /> },
            { path: 'sablonlar/:templateId', element: <AdminSubtitles /> },
            { path: 'sablonlar/:templateId/:subtitleId', element: <AdminTemplateSections /> },
            { path: 'sual-bazasi', element: <AdminQuestionBank /> },
            { path: 'sual-bazasi/:subjectId', element: <AdminQuestionBankSubject /> },
            { path: 'planlar', element: <AdminSubscriptionPlans /> },
            { path: 'reklamlar', element: <AdminBanners /> },
            { path: 'bildirişlər', element: <AdminNotifications /> },
            { path: 'loglar', element: <AdminLogs /> },
        ],
    },
]);

export default router;
