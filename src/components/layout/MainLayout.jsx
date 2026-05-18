import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import OngoingExamPopup from '../ui/OngoingExamPopup';

// Routes that render their own self-contained top bar + footer (exam entry,
// payment result screens). The global chrome adds an extra empty cream strip
// between the two bars — hide it on these paths so the page reads as a single
// focused card.
const isChromeFreeRoute = (pathname) =>
    pathname.startsWith('/imtahan/') ||
    pathname.startsWith('/odenis/') ||
    // Mid-exam page only — result + review keep the global navbar so the
    // student can navigate back to their dashboard from there.
    pathname.startsWith('/test/take/');

const MainLayout = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

    const chromeFree = isChromeFreeRoute(pathname);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {!chromeFree && <Navbar />}
            <main className="flex-1">
                <OngoingExamPopup />
                <Outlet />
            </main>
            {!chromeFree && <Footer />}
        </div>
    );
};

export default MainLayout;
