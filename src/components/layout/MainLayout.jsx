import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import OngoingExamPopup from '../ui/OngoingExamPopup';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-1">
                <OngoingExamPopup />
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
