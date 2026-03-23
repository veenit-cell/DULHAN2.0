import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Lock, Download, Zap, ShieldCheck } from 'lucide-react';

const BankOnboarding = () => {
    const [step, setStep] = useState(1);
    const [epochKey, setEpochKey] = useState('');
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const generateKey = () => {
        const key = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setEpochKey(key);
    };

    const runTest = () => {
        setIsTestRunning(true);
        setTimeout(() => {
            setIsTestRunning(false);
            setIsVerified(true);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-[#006C67]/10 rounded-2xl">
                    <Building className="w-8 h-8 text-[#006C67]" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-[#121212]">Bank Onboarding</h2>
                    <p className="text-xs font-bold text-[#121212]/40 uppercase tracking-widest">Self-Serve Institutional Provisioning Portal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#006C67]' : 'bg-[#121212]/10'}`}></div>
                ))}
            </div>

            <div className="glass-panel p-10 min-h-[500px] flex flex-col relative overflow-hidden bg-white/40">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-xl font-black text-[#121212]">Step 1: Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#121212]/40">Bank Name</label>
                                    <input type="text" className="w-full bg-white/60 border border-[#121212]/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40" placeholder="e.g. Global Trust Bank" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#121212]/40">Institution ID</label>
                                    <input type="text" className="w-full bg-white/60 border border-[#121212]/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40" placeholder="e.g. GTB-INDIA-01" />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#121212]/40">Compliance Webhook URL</label>
                                    <input type="url" className="w-full bg-white/60 border border-[#121212]/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006C67]/40" placeholder="https://api.yourbank.com/satark-alerts" />
                                </div>
                            </div>
                            <button onClick={() => setStep(2)} className="mt-8 px-8 py-4 bg-[#121212] text-white rounded-xl font-bold hover:bg-[#2a2a2a] transition shadow-xl">Continue to SDK</button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-xl font-black text-[#121212]">Step 2: SDK Delivery</h3>
                            <div className="bg-[#121212] p-6 rounded-2xl font-mono text-sm text-green-400 border border-white/10 shadow-2xl">
                                <p className="mb-2"><span className="text-white">$</span> pip install satark-edge-agent</p>
                                <p className="text-white/40 italic"># Initialize edge agent on your on-premise hardware</p>
                                <p className="mt-4"><span className="text-white">$</span> satark --init --node-id GTB-01</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#121212]/10 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                                    <Download className="w-4 h-4" /> Download SDK Bundle (.zip)
                                </button>
                                <button onClick={() => setStep(3)} className="px-8 py-3 bg-[#121212] text-white rounded-xl font-bold hover:bg-[#2a2a2a] transition">Provision Crypto</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                            <Lock className="w-16 h-16 text-[#E27C37] mx-auto mb-4" />
                            <h3 className="text-xl font-black text-[#121212]">Step 3: Cryptographic Provisioning</h3>
                            <p className="text-sm text-[#121212]/60 max-w-md mx-auto">Generate your institutional Epoch Key. This key is used for Zero-Knowledge PII masking at the edge.</p>
                            
                            {!epochKey ? (
                                <button onClick={generateKey} className="px-8 py-4 bg-[#E27C37] text-white rounded-xl font-bold hover:bg-[#c96a29] transition shadow-lg">Generate Secure Epoch Key</button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/80 border-2 border-dashed border-[#E27C37]/40 rounded-xl font-mono text-xs break-all text-[#E27C37] font-black">
                                        {epochKey}
                                    </div>
                                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-3 text-left">
                                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                                        <p className="text-[11px] font-bold text-orange-700 leading-tight">
                                            IMPORTANT: Store this in your Hardware Security Module (HSM). SATARK will never store or transmit this key again. Loss of this key means loss of telemetry history.
                                        </p>
                                    </div>
                                    <button onClick={() => setStep(4)} className="px-8 py-4 bg-[#121212] text-white rounded-xl font-bold hover:bg-[#2a2a2a] transition">Final Verification</button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
                            <Zap className={`w-20 h-20 mx-auto transition-colors duration-1000 ${isVerified ? 'text-[#006C67]' : 'text-[#121212]/20'}`} />
                            <div>
                                <h3 className="text-xl font-black text-[#121212]">Step 4: Synthetic Edge Test</h3>
                                <p className="text-sm text-[#121212]/60">Triggering a mock transaction from your virtual edge node to verify ingestion handshake.</p>
                            </div>

                            {!isVerified ? (
                                <button 
                                    onClick={runTest} 
                                    disabled={isTestRunning}
                                    className="px-10 py-5 bg-[#006C67] text-white rounded-2xl font-black hover:bg-[#005a56] transition shadow-2xl disabled:opacity-50"
                                >
                                    {isTestRunning ? "Initializing Handshake..." : "Run Synthetic Edge Test"}
                                </button>
                            ) : (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="p-8 bg-[#006C67]/10 border-2 border-[#006C67] rounded-3xl inline-flex flex-col items-center gap-4">
                                    <ShieldCheck className="w-12 h-12 text-[#006C67]" />
                                    <p className="text-2xl font-black text-[#006C67]">Connection Verified</p>
                                    <p className="text-xs font-bold text-[#121212]/60">Institutional ID: GTB-INDIA-01 ACTIVE</p>
                                    <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-[#121212] underline">Go to Global Nodes</button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Mock Icon because AlertCircle wasn't imported from lucide-react in step 3 (adding it now)
import { AlertCircle } from 'lucide-react';

export default BankOnboarding;
