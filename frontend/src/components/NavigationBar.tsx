import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationBar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('dulhan_token'));

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        const checkAuth = () => {
            setIsAuthenticated(!!localStorage.getItem('dulhan_token'));
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('auth-change', checkAuth);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const logout = () => {
        localStorage.removeItem('dulhan_token');
        localStorage.removeItem('user_role');
        window.dispatchEvent(new Event('auth-change'));
        setMobileOpen(false);
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 py-6 px-8 md:px-12 ${scrolled ? 'bg-white/80 backdrop-blur-2xl py-4 shadow-xl border-b border-[#006C67]/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center group">
                        <img src="/logo.png" alt="DULHAN Logo" className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform duration-300" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-12">
                        <div className="flex items-center space-x-10 mr-6 border-r border-[#121212]/5 pr-10">
                            <Link to="/" className="text-sm font-bold text-[#121212]/60 hover:text-[#121212] transition-colors tracking-wide uppercase">Home</Link>
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

                    {/* Mobile Hamburger */}
                    <button 
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-xl hover:bg-[#121212]/5 transition-colors"
                    >
                        {mobileOpen ? <X className="w-6 h-6 text-[#121212]" /> : <Menu className="w-6 h-6 text-[#121212]" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm md:hidden"
                        onClick={() => setMobileOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col h-full pt-24 px-8 pb-8">
                                {/* Mobile Logo */}
                                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-[#121212]/10">
                                    <img src="/logo.png" alt="DULHAN" className="h-10 w-auto" />
                                    <div>
                                        <p className="text-lg font-black text-[#121212] tracking-tight">DULHAN</p>
                                        <p className="text-[9px] font-bold text-[#FF4F00] uppercase tracking-widest">Fintech Shield</p>
                                    </div>
                                </div>

                                {/* Mobile Links */}
                                <div className="flex flex-col space-y-2 flex-grow">
                                    <Link 
                                        to="/" 
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center px-5 py-4 rounded-2xl text-sm font-bold text-[#121212]/70 hover:bg-[#121212]/5 hover:text-[#121212] transition-all uppercase tracking-wider"
                                    >
                                        Home
                                    </Link>
                                    {isAuthenticated && (
                                        <Link 
                                            to="/dashboard" 
                                            onClick={() => setMobileOpen(false)}
                                            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black text-[#FF4F00] bg-[#FF4F00]/5 hover:bg-[#FF4F00]/10 transition-all uppercase tracking-wider border border-[#FF4F00]/10"
                                        >
                                            <Shield className="w-5 h-5" /> Launch Node
                                        </Link>
                                    )}
                                </div>

                                {/* Mobile Auth Button */}
                                <div className="pt-6 border-t border-[#121212]/10">
                                    {!isAuthenticated ? (
                                        <Link 
                                            to="/login"
                                            onClick={() => setMobileOpen(false)}
                                            className="w-full block text-center px-8 py-4 bg-[#121212] text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-95 transition-transform"
                                        >
                                            Authenticate
                                        </Link>
                                    ) : (
                                        <button 
                                            onClick={logout}
                                            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-red-500/10 text-red-600 rounded-2xl font-black text-sm tracking-widest uppercase border border-red-500/20 active:scale-95 transition-transform"
                                        >
                                            <LogOut className="w-5 h-5" /> End Session
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NavigationBar;
