import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Cpu, Network, Clock, Activity, FileJson } from 'lucide-react';


interface RiskBreakdownProps {
    transaction: any;
    onClose: () => void;
    onDownloadSTR: () => void;
}

const RiskBreakdown: React.FC<RiskBreakdownProps> = ({ transaction, onClose, onDownloadSTR }) => {
    // Simulated SHAP / Risk formula breakdown for visuals
    // R = 0.30*IF + 0.25*CYCLE + 0.15*BETWEEN + 0.15*CROSS + 0.10*VEL + 0.05*TIME
    
    // Generate deterministic pseudo-values based on txn_id to keep it consistent
    const seed = transaction?.txn_id ? transaction.txn_id.charCodeAt(transaction.txn_id.length - 1) : 42;
    
    const if_score = transaction.is_flagged ? 0.85 + (seed % 15) / 100 : 0.2;
    const cycle_score = transaction.is_flagged ? 1.0 : 0.0;
    const between_score = transaction.is_flagged ? 0.6 + (seed % 40) / 100 : 0.1;
    const cross_score = transaction.is_flagged ? 1.0 : 0.0;
    const vel_score = 0.8;
    const time_score = 0.5;

    const riskFactors = [
        { name: "Isolation Forest (IF)", weight: 0.30, value: if_score, icon: Cpu },
        { name: "Graph Tarjan SCC (CYCLE)", weight: 0.25, value: cycle_score, icon: Network },
        { name: "Betweenness Centrality (BETWEEN)", weight: 0.15, value: between_score, icon: Activity },
        { name: "Cross-Bank Orchestration (CROSS)", weight: 0.15, value: cross_score, icon: ShieldAlert },
        { name: "Velocity Burst (VEL)", weight: 0.10, value: vel_score, icon: Clock },
        { name: "Time Anomaly (TIME)", weight: 0.05, value: time_score, icon: Clock }
    ];

    const totalRisk = riskFactors.reduce((acc, curr) => acc + (curr.weight * curr.value), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-[500px] h-full overflow-y-auto shadow-2xl p-8 dark-scrollbar border-l border-white/[0.06]"
                style={{
                    background: 'rgba(10, 10, 26, 0.95)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                }}
                data-lenis-prevent="true"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white">Risk Explainer (SHAP)</h2>
                        <p className="text-cyan-400 uppercase tracking-widest text-[10px] font-bold mt-1">Mathematical Breakdown</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="dark-glass p-5 mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Composite Risk Score</p>
                            <h3 className="text-4xl font-black text-[#FF4F00] text-glow-orange">R = {totalRisk.toFixed(3)}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-600 text-[10px] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{transaction?.txn_id}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                                {transaction?.fraud_pattern || "Anomalous Routing"}
                            </span>
                        </div>
                    </div>
                    <p className="text-slate-600 text-xs font-mono leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        R = 0.30•IF + 0.25•CYCLE + 0.15•BETWEEN + 0.15•CROSS + 0.10•VEL + 0.05•TIME
                    </p>
                </div>

                <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">Waterfall Component Analysis</h4>
                    
                    {riskFactors.map((factor, idx) => {
                        const contribution = factor.weight * factor.value;
                        const percentage = (contribution / totalRisk) * 100;
                        const Icon = factor.icon;
                        
                        return (
                            <div key={idx} className="relative">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center space-x-2">
                                        <Icon className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-bold text-slate-400">{factor.name}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-[#FF4F00]">+{contribution.toFixed(3)}</span>
                                </div>
                                <div className="w-full bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(2, percentage)}%` }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className="bg-gradient-to-r from-cyan-500 to-[#FF4F00] h-full rounded-full"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 pt-6 border-t border-white/[0.06]">
                    <button 
                        onClick={onDownloadSTR}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF4F00] to-orange-600 text-white py-4 rounded-xl font-bold tracking-widest uppercase hover:shadow-lg hover:shadow-[#FF4F00]/20 transition-all"
                    >
                        <FileJson className="w-5 h-5" />
                        <span>Download RBI STR Data (PDF)</span>
                    </button>
                    <p className="text-center mt-3 text-[10px] text-slate-600 font-medium">
                        Downloads compliant Suspicious Transaction Report
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RiskBreakdown;
