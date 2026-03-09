import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-400 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            testup.az
                        </span>
                        <p className="mt-3 text-sm">
                            Müəllimlər üçün onlayn imtahan yaratma və idarəetmə platforması.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-3">Keçidlər</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-white transition-colors">Ana Səhifə</Link></li>
                            <li><Link to="/haqqimizda" className="hover:text-white transition-colors">Haqqımızda</Link></li>
                            <li><Link to="/imtahanlar" className="hover:text-white transition-colors">İmtahanlar</Link></li>
                            <li><Link to="/elaqe" className="hover:text-white transition-colors">Əlaqə</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-3">Əlaqə</h3>
                        <ul className="space-y-2 text-sm">
                            <li>info@testup.az</li>
                            <li>Bakı, Azərbaycan</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
                    © {new Date().getFullYear()} testup.az — Bütün hüquqlar qorunur.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
