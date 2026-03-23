import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Building2, Mail, CheckCircle2, ChevronLeft } from 'lucide-react';

const BankLogin = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'login' | 'register' | 'submitted'>('login');
    const [institutionId, setInstitutionId] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [step, setStep] = useState(1); // 1: Credentials, 2: MFA (only for login)
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [tempAuthData, setTempAuthData] = useState<any>(null);

    // Registration Mock Fields
    const [regName, setRegName] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [regEmail, setRegEmail] = useState('');

    const handleInitialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institution_id: institutionId, password })
            });

            const data = await response.json();

            if (response.ok) {
                setTempAuthData(data);
                setStep(2); // Move to MFA
            } else {
                setError(data.detail || "Authentication failed. Please check your credentials.");
            }
        } catch (err) {
            setError("Network error. Please ensure the Satark Neural API is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (mfaCode.length === 18) {
            setIsLoading(true);
            setTimeout(() => {
                localStorage.setItem('satark_token', tempAuthData.access_token);
                localStorage.setItem('user_role', tempAuthData.role);
                window.dispatchEvent(new Event('auth-change'));
                navigate('/dashboard');
                setIsLoading(false);
            }, 800);
        } else {
            setError("Please enter a valid 18-digit institutional token.");
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate onboarding delay
        setTimeout(() => {
            setIsLoading(false);
            setView('submitted');
        }, 1500);
    };

    return (
        <div className="w-full flex justify-center items-center py-20 px-4 mt-12 min-h-[85vh]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                <div className="glass-panel p-10 flex flex-col relative overflow-hidden shadow-[0_10px_48px_rgba(234,88,12,0.25)] border border-zinc-800/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4F00]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#006C67]/10 rounded-full blur-[40px] -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center border border-slate-100 overflow-hidden">
                            <img src="/logo.png" alt="SATARK Logo" className="w-14 h-14 object-contain" />
                        </div>
                    </div>
                
                    <AnimatePresence mode="wait">
                        {view === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="relative z-10"
                            >
                                <h2 className="text-3xl font-black text-[#121212] mb-2 text-center">
                                    {step === 1 ? "Compliance Login" : "Two-Factor Auth"}
                                </h2>
                                <p className="text-sm font-medium text-[#121212]/60 text-center mb-8 uppercase tracking-widest">
                                    {step === 1 ? "Authorized B2B Access Only" : "Verify Institutional Identity"}
                                </p>

                                {step === 1 ? (
                                    <form onSubmit={handleInitialLogin} className="space-y-5">
                                        {error && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm font-semibold mb-4">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-[#121212]/80 uppercase tracking-wider block">Institution ID</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Shield className="h-5 w-5 text-[#121212]/40" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={institutionId}
                                                    onChange={(e) => setInstitutionId(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 focus:border-[#FF4F00] transition text-[#121212] font-medium"
                                                    placeholder="BNK-HDFC-MARK1"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-[#121212]/80 uppercase tracking-wider block">Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Key className="h-5 w-5 text-[#121212]/40" />
                                                </div>
                                                <input 
                                                    type="password" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 focus:border-[#FF4F00] transition text-[#121212] font-medium"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full py-3.5 bg-[#121212] text-white rounded-xl hover:bg-[#2a2a2a] font-bold tracking-wider transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)] active:scale-[0.98] mt-4"
                                        >
                                            {isLoading ? "Verifying..." : "Access Neural Core"}
                                        </button>
                                        
                                        <div className="text-center mt-6">
                                            <button 
                                                type="button" 
                                                onClick={() => setView('register')}
                                                className="text-xs font-bold text-[#FF4F00] hover:scale-105 transition-transform uppercase tracking-widest"
                                            >
                                                New Bank Entity? Request Access
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleMfaVerify} className="space-y-5">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Multi-Hop Hardware Token (18 Digits)</label>
                                            <input 
                                                type="text" 
                                                maxLength={18}
                                                value={mfaCode}
                                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                className="w-full text-center text-xl tracking-[0.2em] py-4 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 transition text-[#121212] font-mono font-black"
                                                placeholder="0000 0000 0000 0000 00"
                                                required
                                                autoFocus
                                            />
                                            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1">
                                                <span>{mfaCode.length}/18 DIGITS</span>
                                                <span className="text-[#FF4F00] font-bold">MODE: ENHANCED ENTITY CHALLENGE</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <button 
                                                type="submit" 
                                                disabled={isLoading || mfaCode.length !== 18}
                                                className="w-full py-4 bg-[#FF4F00] text-white rounded-xl hover:bg-[#e64600] font-black uppercase tracking-widest text-[11px] transition-all shadow-lg active:scale-[0.98]"
                                            >
                                                Confirm Institutional Identity
                                            </button>
                                            
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const mockCode = Array.from({length: 18}, () => Math.floor(Math.random() * 10)).join('');
                                                    setMfaCode(mockCode);
                                                    setTimeout(() => {
                                                        const event = new Event('submit', { cancelable: true, bubbles: true });
                                                        document.querySelector('form')?.dispatchEvent(event);
                                                    }, 500);
                                                }}
                                                className="w-full py-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-500/10 transition-all flex items-center justify-center"
                                            >
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
                                                Simulate HSM-App Approval
                                            </button>
                                        </div>
                                        <button type="button" onClick={() => setStep(1)} className="w-full text-xs font-bold text-[#121212]/40 hover:text-[#121212]/60 uppercase tracking-widest">Back to Credentials</button>
                                    </form>
                                )}
                            </motion.div>
                        )}

                        {view === 'register' && (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="relative z-10"
                            >
                                <h2 className="text-3xl font-black text-[#121212] mb-2 text-center">Entity Onboarding</h2>
                                <p className="text-sm font-medium text-[#121212]/60 text-center mb-8 uppercase tracking-widest">Institutional Registration Request</p>

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-[#121212]/80 uppercase tracking-wider block">Institution Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building2 className="h-5 w-5 text-[#121212]/40" />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 transition text-[#121212] font-medium"
                                                placeholder="Global Reserve Bank"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-[#121212]/80 uppercase tracking-wider block">Registration (CIN/IFSC)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Shield className="h-5 w-5 text-[#121212]/40" />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={regNumber}
                                                onChange={(e) => setRegNumber(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 transition text-[#121212] font-medium"
                                                placeholder="REGL-9920-IND"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-[#121212]/80 uppercase tracking-wider block">Compliance Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-[#121212]/40" />
                                            </div>
                                            <input 
                                                type="email" 
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-[#121212]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 transition text-[#121212] font-medium"
                                                placeholder="ops@bank.org"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full py-4 bg-[#FF4F00] text-white rounded-xl hover:bg-[#e64600] font-black tracking-widest transition-all shadow-[0_4px_20px_rgba(255,79,0,0.3)] active:scale-[0.98] mt-6 uppercase"
                                    >
                                        {isLoading ? "Submitting..." : "Initialize Onboarding"}
                                    </button>

                                    <button 
                                        type="button" 
                                        onClick={() => setView('login')}
                                        className="w-full mt-4 flex items-center justify-center space-x-2 text-xs font-bold text-[#121212]/40 hover:text-[#121212]/80 uppercase tracking-widest"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Already have an account? Sign In</span>
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {view === 'submitted' && (
                            <motion.div
                                key="submitted"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center relative z-10"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-green-500/10 rounded-full">
                                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-[#121212] mb-4">Application Received</h2>
                                <p className="text-sm font-medium text-[#121212]/70 leading-relaxed mb-8">
                                    Your registration request for SATARK API access has been forwarded to the Central Bank Authority for verification. 
                                    Secure credentials will be generated and emailed to <span className="text-[#FF4F00] font-bold">{regEmail}</span> upon approval.
                                </p>
                                <button 
                                    onClick={() => setView('login')}
                                    className="w-full py-3 bg-[#121212] text-white rounded-xl font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                                >
                                    Return to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="mt-8 text-center text-[10px] font-bold text-[#121212]/30 uppercase tracking-[0.2em] relative z-10">
                        Institutional Node Status: <span className="text-green-500/60">Validated</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BankLogin;
