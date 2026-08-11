import { motion } from 'framer-motion';
import { X, ShieldAlert, TrendingUp, Clock, Hash, Link2, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface NodeProfileProps {
    node: any;
    onClose: () => void;
}

const NodeRiskProfile = ({ node, onClose }: NodeProfileProps) => {
    // Generate mock transaction history for the node
    const mockTransactions = Array.from({ length: 8 }, (_, i) => ({
        id: `TXN_${Math.floor(Math.random() * 99999)}`,
        direction: Math.random() > 0.5 ? 'in' : 'out',
        amount: Math.floor(Math.random() * 90000) + 5000,
        counterparty: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        timestamp: new Date(Date.now() - Math.random() * 172800000).toISOString(),
        flagged: Math.random() < (node.is_flagged ? 0.6 : 0.1),
    }));

    const riskScore = node.is_flagged ? (0.75 + Math.random() * 0.24).toFixed(2) : (Math.random() * 0.3).toFixed(2);
    const connections = Math.floor(Math.random() * 12) + 2;
    const firstSeen = new Date(Date.now() - Math.random() * 30 * 86400000);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-end bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="h-full w-[520px] max-w-[90vw] bg-white dark:bg-[#0f1a17] shadow-2xl overflow-y-auto" data-lenis-prevent="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 ${node.is_flagged ? 'bg-gradient-to-r from-red-500/10 to-orange-500/5' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5'} border-b border-slate-200 dark:border-white/10`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl ${node.is_flagged ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account Node Profile</p>
                                <h2 className="text-lg font-black text-[#002A24] dark:text-white tracking-tight">Risk Analysis</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Node Hash */}
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Hash</p>
                        <p className="font-mono text-sm font-bold text-[#002A24] dark:text-white break-all">{node.hash || node.id}</p>
                    </div>
                </div>

                {/* Risk Score */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Risk Score</p>
                            <p className={`text-3xl font-black ${parseFloat(riskScore) > 0.5 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {riskScore}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Connections</p>
                            <p className="text-3xl font-black text-[#002A24] dark:text-white">{connections}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
                                node.is_flagged 
                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600' 
                                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                            }`}>
                                {node.is_flagged ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                {node.is_flagged ? 'FLAGGED' : 'CLEAN'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Indicators */}
                {node.is_flagged && (
                    <div className="p-6 border-b border-slate-100 dark:border-white/5">
                        <h3 className="text-xs font-black text-[#002A24] dark:text-white uppercase tracking-widest mb-4">Threat Indicators</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Isolation Forest Anomaly', value: 0.87, color: 'red' },
                                { label: 'Velocity Score', value: 0.62, color: 'orange' },
                                { label: 'Tarjan SCC Membership', value: 0.95, color: 'red' },
                                { label: 'Cross-Bank Exposure', value: 0.44, color: 'yellow' },
                            ].map((indicator, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-40 flex-shrink-0">{indicator.label}</span>
                                    <div className="flex-grow h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${indicator.value * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                            className={`h-full rounded-full ${
                                                indicator.value > 0.7 ? 'bg-red-500' :
                                                indicator.value > 0.5 ? 'bg-orange-500' :
                                                'bg-yellow-500'
                                            }`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 w-10 text-right">{(indicator.value * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-[#002A24] dark:text-white uppercase tracking-widest">Node Timeline</h3>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            First seen: {firstSeen.toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{mockTransactions.length} recent transactions</span>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="p-6">
                    <h3 className="text-xs font-black text-[#002A24] dark:text-white uppercase tracking-widest mb-4">Transaction History</h3>
                    <div className="space-y-2">
                        {mockTransactions.map((txn, i) => (
                            <motion.div
                                key={txn.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                                    txn.flagged 
                                        ? 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10' 
                                        : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:bg-slate-100/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${
                                        txn.direction === 'in' 
                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' 
                                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                                    }`}>
                                        {txn.direction === 'in' 
                                            ? <ArrowDownLeft className="w-3.5 h-3.5" /> 
                                            : <ArrowUpRight className="w-3.5 h-3.5" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-mono font-bold text-[#002A24] dark:text-white">{txn.id}</p>
                                        <p className="text-[9px] text-slate-400 flex items-center gap-1">
                                            <Link2 className="w-3 h-3" />
                                            {txn.counterparty}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-[#002A24] dark:text-white">
                                        {txn.direction === 'in' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Clock className="w-3 h-3 text-slate-300" />
                                        <p className="text-[9px] text-slate-400">
                                            {Math.floor((Date.now() - new Date(txn.timestamp).getTime()) / 3600000)}h ago
                                        </p>
                                        {txn.flagged && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default NodeRiskProfile;
