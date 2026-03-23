import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Key, Building2, Mail, TerminalSquare } from 'lucide-react';

const BankRegister = () => {
    const navigate = useNavigate();
    const [bankName, setBankName] = useState('');
    const [institutionId, setInstitutionId] = useState('');
    const [complianceEmail, setComplianceEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bank_name: bankName, 
                    institution_id: institutionId, 
                    compliance_email: complianceEmail, 
                    password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.detail || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError("Network error. Please ensure the Satark Neural API is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full flex justify-center items-center py-20 px-4 mt-8 min-h-[85vh]">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                <div className="glass-panel p-10 flex flex-col relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF4F00]/10 rounded-full blur-[40px] -ml-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#006C67]/10 rounded-full blur-[40px] -mr-10 -mb-10 pointer-events-none"></div>

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#121212]/5 flex items-center justify-center border border-[#121212]/10">
                            <TerminalSquare className="w-8 h-8 text-[#121212]" />
                        </div>
                    </div>
                
                    <h2 className="text-3xl font-black text-[#121212] mb-2 text-center tracking-tight">Register Institution</h2>
                    <p className="text-sm font-medium text-[#121212]/60 text-center mb-8 uppercase tracking-widest leading-relaxed">Establish Secure B2B Channel</p>

                    <form onSubmit={handleRegister} className="space-y-4 relative z-10">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm font-semibold mb-4">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#121212]/80 uppercase tracking-widest block">Bank Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-4 w-4 text-[#121212]/40" />
                                </div>
                                <input 
                                    type="text" 
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-[#121212]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40 focus:border-[#006C67] transition text-[#121212] font-semibold"
                                    placeholder="e.g. State Bank of India"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#121212]/80 uppercase tracking-widest block">Institution ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield className="h-4 w-4 text-[#121212]/40" />
                                </div>
                                <input 
                                    type="text" 
                                    value={institutionId}
                                    onChange={(e) => setInstitutionId(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-[#121212]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40 focus:border-[#006C67] transition text-[#121212] font-semibold"
                                    placeholder="e.g. SBI-001"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#121212]/80 uppercase tracking-widest block">Compliance Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-[#121212]/40" />
                                </div>
                                <input 
                                    type="email" 
                                    value={complianceEmail}
                                    onChange={(e) => setComplianceEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-[#121212]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40 focus:border-[#006C67] transition text-[#121212] font-semibold"
                                    placeholder="compliance@bank.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#121212]/80 uppercase tracking-widest block">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-4 w-4 text-[#121212]/40" />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-[#121212]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40 focus:border-[#006C67] transition text-[#121212] font-semibold tracking-[0.2em]"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-3 bg-[#006C67] text-white rounded-xl hover:bg-[#005a56] font-extrabold tracking-widest uppercase text-sm transition-all shadow-md active:scale-95 mt-6 border border-white/10 disabled:opacity-50"
                        >
                            {isLoading ? "Processing..." : "Register Institution"}
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center text-sm font-medium text-[#121212]/60">
                        Institution already registered? <Link to="/login" className="text-[#006C67] font-bold hover:underline">Compliance Login</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BankRegister;
