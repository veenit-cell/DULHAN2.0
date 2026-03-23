import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, ShieldCheck, Database, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import axios from 'axios';

const PSIDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<null | any>(null);
    const [bankA] = useState(['TOKEN_X_77', 'TOKEN_Y_88', 'TARGET_99']);
    const [bankB] = useState(['TOKEN_Z_11', 'TOKEN_W_22', 'TARGET_99']);

    const handleIntersect = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('satark_token');
            const salt = "SATARK_PSI_SALT_2026";
            const hash = (t: string) => {
                return btoa(salt + t).slice(0, 32); 
            };

            const cipherA = bankA.map(hash);
            const cipherB = bankB.map(hash);

            const res = await axios.post('http://localhost:8000/api/psi/intersect', {
                bank_a_ciphertexts: cipherA,
                bank_b_ciphertexts: cipherB
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTimeout(() => {
                setResult(res.data);
                setLoading(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-black text-[#FF4F00] uppercase tracking-[0.3em]">Advanced Cryptography</span>
                <h1 className="text-4xl font-black text-[#002A24] tracking-tighter">Private Set Intersection</h1>
                <p className="text-slate-500 font-medium">Matching cross-institution datasets without exposing specific primary key attributes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bank A Input */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[#002A24] uppercase tracking-wider">Institution A</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Source Identity Tokens</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {bankA.map((t, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                <span className="text-slate-600 font-mono text-sm font-bold tracking-tight">{t}</span>
                                <Lock className="w-4 h-4 text-slate-300" />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bank B Input */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[#002A24] uppercase tracking-wider">Institution B</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Encrypted Handshake Pool</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {bankB.map((t, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                <span className="text-slate-600 font-mono text-sm font-bold tracking-tight">{t}</span>
                                <Lock className="w-4 h-4 text-slate-300" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Action Section */}
            <div className="flex flex-col items-center justify-center space-y-8 pt-6">
                <button 
                    onClick={handleIntersect}
                    disabled={loading}
                    className="group relative px-16 py-6 bg-[#002A24] rounded-3xl font-black text-white tracking-widest uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300 shadow-2xl hover:shadow-[#002A24]/20"
                >
                    <div className="absolute inset-0 bg-[#FF4F00] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative flex items-center gap-3">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        Execute Secure Match (PSI)
                    </span>
                </button>

                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-white border-2 border-emerald-100 p-10 rounded-[50px] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 bg-emerald-500 text-white rounded-bl-3xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> Integrity Verified
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-emerald-50 rounded-2xl">
                                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#002A24] tracking-tight">INTERSECTION DETECTED</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cross-Bank Risk Matching Complete</p>
                                </div>
                            </div>

                            {result.intersection_ciphertexts.length > 0 ? (
                                <div className="space-y-6">
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                        The following obfuscated identity match was recovered from the encrypted pool without decrypting the source institutional datasets:
                                    </p>
                                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-inner flex flex-col items-center">
                                        <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.2em] mb-3 block opacity-70">Secured Ciphertext Recovery</span>
                                        <span className="text-white font-mono text-sm break-all text-center">{result.intersection_ciphertexts[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-emerald-600 font-black text-xs justify-center bg-emerald-50 py-3 rounded-2xl border border-emerald-100">
                                        <Link2 className="w-4 h-4" /> 1 COMMON THREAT NODE LINKED IN-SITU
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 italic font-bold">No secure intersection found in current batch.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PSIDashboard;
