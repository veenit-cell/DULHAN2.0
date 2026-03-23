import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'system' | 'analysis';
}

const LiveThreatFeed = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const logMessages = [
        { message: "Ingesting 120 edges from Node-A...", type: 'system' },
        { message: "Calculating Tarjan SCC & Isolation Forest scores...", type: 'analysis' },
        { message: "15-Node Ring Detected. Laundering Probability: 94%. Triggering Graph Highlight.", type: 'warning' },
        { message: "HMAC Determinism check PASSED for block 77A2", type: 'info' },
        { message: "Cross-bank synchronization in progress (Node-B handshake)...", type: 'system' },
        { message: "Neural sensitivity adjusted to 0.75 by supervisor.", type: 'info' },
        { message: "Anomaly Forest: Depth 14 leaf reached. High risk score detected.", type: 'analysis' },
        { message: "Velocity Burst Intervention active on Token_X_77", type: 'warning' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
            const newLog: LogEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                message: randomLog.message,
                type: randomLog.type as any
            };
            setLogs(prev => [...prev.slice(-100), newLog]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (type: string) => {
        switch (type) {
            case 'warning': return 'text-[#FF4F00] font-black';
            case 'system': return 'text-emerald-400';
            case 'analysis': return 'text-indigo-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-[#001411]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[250px] flex flex-col shadow-2xl overflow-hidden group">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Live Threat Telemetry
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-grow overflow-y-auto font-mono text-[11px] space-y-2 pr-2 custom-scrollbar scroll-smooth"
            >
                <AnimatePresence>
                    {logs.map((log) => (
                        <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-3 leading-relaxed"
                        >
                            <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                            <span className="text-white/40 shrink-0 uppercase font-black tracking-widest text-[9px] w-16">{log.type}:</span>
                            <span className={getLogColor(log.type)}>{log.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {logs.length === 0 && (
                    <div className="flex items-center justify-center h-full text-white/10 uppercase tracking-widest font-black text-xs italic">
                        Initializing neural feed...
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveThreatFeed;
