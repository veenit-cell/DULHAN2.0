import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, LogOut } from 'lucide-react';

const NavigationBar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('satark_token'));

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        const checkAuth = () => {
            setIsAuthenticated(!!localStorage.getItem('satark_token'));
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('auth-change', checkAuth);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem('satark_token');
        localStorage.removeItem('user_role');
        window.dispatchEvent(new Event('auth-change'));
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 py-6 px-8 md:px-12 ${scrolled ? 'bg-white/80 backdrop-blur-2xl py-4 shadow-xl border-b border-[#006C67]/5' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center group">
                    <img src="/logo.png" alt="SATARK Logo" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform duration-300" />
                </Link>

                <div className="hidden md:flex items-center space-x-12">
                    <div className="flex items-center space-x-10 mr-6 border-r border-[#121212]/5 pr-10">
                        <Link to="/" className="text-sm font-bold text-[#121212]/60 hover:text-[#121212] transition-colors tracking-wide uppercase">Home</Link>
                        <Link to="/about" className="text-sm font-bold text-[#121212]/60 hover:text-[#121212] transition-colors tracking-wide uppercase">Network</Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="text-sm font-black text-[#FF4F00] hover:text-[#121212] transition-colors tracking-wide uppercase flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Launch Node
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-5">
                        {!isAuthenticated ? (
                            <Link 
                                to="/login" 
                                className={`px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all active:scale-95 ${scrolled ? 'bg-[#121212] text-white hover:bg-[#2a2a2a] shadow-xl' : 'bg-[#121212] text-white hover:bg-[#2a2a2a] shadow-2xl'}`}
                            >
                                Authenticate
                            </Link>
                        ) : (
                            <button 
                                onClick={logout}
                                className="px-6 py-3 bg-red-500/10 text-red-600 rounded-xl font-black text-xs tracking-widest uppercase hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-red-500/20"
                            >
                                <LogOut className="w-4 h-4" /> End Session
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;
