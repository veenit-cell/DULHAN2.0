import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Shield } from 'lucide-react';

const alertData = [
    { day: 'Mon', alerts: 12 },
    { day: 'Tue', alerts: 19 },
    { day: 'Wed', alerts: 15 },
    { day: 'Thu', alerts: 45 }, // Spike
    { day: 'Fri', alerts: 22 },
    { day: 'Sat', alerts: 18 },
    { day: 'Sun', alerts: 25 },
];

const typologyData = [
    { name: 'Smurfing', value: 45, color: '#22d3ee' },
    { name: 'Cycles', value: 30, color: '#FF4F00' },
    { name: 'Velocity', value: 25, color: '#a78bfa' },
];

const riskData = [
    { time: '08:00', score: 0.42 },
    { time: '10:00', score: 0.55 },
    { time: '12:00', score: 0.88 }, // Risk increase
    { time: '14:00', score: 0.65 },
    { time: '16:00', score: 0.48 },
    { time: '18:00', score: 0.52 },
];

const IntelligenceTrends = () => {
    return (
        <div className="space-y-8 p-1">
            <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-black text-white">Intelligence Trends</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 30-Day Alert Volume */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dark-glass p-6 h-[400px] flex flex-col"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Alert Volume (7-Day View)</h3>
                        <div className="px-3 py-1 bg-[#FF4F00]/10 text-[#FF4F00] text-[10px] font-black rounded-full border border-[#FF4F00]/20">SENSITIVE</div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={alertData}>
                            <defs>
                                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                            <Tooltip 
                                contentStyle={{background: 'rgba(15,15,35,0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 'bold', color: '#e2e8f0', backdropFilter: 'blur(12px)'}}
                            />
                            <Area type="monotone" dataKey="alerts" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorAlerts)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Threat Typology */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="dark-glass p-6 h-[400px] flex flex-col"
                >
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-6">Threat Typology Breakdown</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typologyData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} width={80} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{background: 'rgba(15,15,35,0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0'}} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={40}>
                                {typologyData.map((entry, index) => (
                                    <Bar key={`cell-${index}`} dataKey="value" fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Risk Score Trends */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="dark-glass p-6 h-[350px] flex flex-col"
            >
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-[#FF4F00]" />
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Composite Risk Score (Intraday)</h3>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                        <YAxis domain={[0, 1]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                        <Tooltip contentStyle={{background: 'rgba(15,15,35,0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0'}} />
                        <Line type="stepAfter" dataKey="score" stroke="#FF4F00" strokeWidth={3} dot={{ r: 6, fill: '#FF4F00', strokeWidth: 2, stroke: '#0a0a1a' }} activeDot={{ r: 8, fill: '#FF4F00', stroke: '#22d3ee', strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
};

export default IntelligenceTrends;
