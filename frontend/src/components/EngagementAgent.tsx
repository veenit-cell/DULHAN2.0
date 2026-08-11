import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Activity, Calendar, Send, Bell, Users,
    TrendingUp, TrendingDown, AlertTriangle, Clock,
    CheckCircle2, XCircle, MessageSquare, Zap, Eye,
    BarChart3, Target, Sparkles, ArrowUpRight, ChevronRight,
    UserCheck, UserX, UserMinus, User
} from 'lucide-react';
import { API_URL } from '../lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';

interface EngagementHealth {
    total_customers: number;
    overall_health_score: number;
    active_percentage: number;
    segments: Array<{
        status: string;
        count: number;
        percentage: number;
        avg_score: number;
        avg_maturity: number;
    }>;
    event_distribution: Array<{
        event_type: string;
        count: number;
        avg_confidence: number;
        acted_count: number;
    }>;
    channel_preferences: Array<{ channel: string; count: number }>;
    at_risk_customers: Array<{
        customer_id: string;
        first_name: string;
        last_name: string;
        engagement_score: number;
        engagement_status: string;
        last_active: string;
        digital_maturity: number;
    }>;
}

interface LifeEvent {
    id: number;
    customer_id: string;
    event_type: string;
    event_data: string;
    event_data_parsed: Record<string, any>;
    detected_at: string;
    ai_action: string;
    ai_confidence: number;
    status: string;
    first_name: string;
    last_name: string;
    engagement_status: string;
    template_title: string;
    urgency: string;
    best_channel: string;
}

interface Campaign {
    campaign_id: string;
    name: string;
    target_segment: string;
    status: string;
    message_template: string;
    channel: string;
    total_targeted: number;
    total_converted: number;
    conversion_rate: number;
}

const SEGMENT_CONFIG: Record<string, { color: string; gradient: string; icon: any; label: string }> = {
    active: {
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-400',
        icon: UserCheck,
        label: 'Active',
    },
    at_risk: {
        color: 'amber',
        gradient: 'from-amber-500 to-yellow-400',
        icon: AlertTriangle,
        label: 'At Risk',
    },
    dormant: {
        color: 'slate',
        gradient: 'from-slate-500 to-slate-400',
        icon: UserMinus,
        label: 'Dormant',
    },
    churned: {
        color: 'rose',
        gradient: 'from-rose-500 to-pink-400',
        icon: UserX,
        label: 'Churned',
    },
};

const URGENCY_COLOR: Record<string, string> = {
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const EVENT_ICONS: Record<string, any> = {
    salary_credit: TrendingUp,
    large_purchase: Zap,
    dormancy_detected: AlertTriangle,
    spending_spike: TrendingUp,
    savings_milestone: Target,
    first_upi_transaction: Sparkles,
    emi_start: Calendar,
    emi_end: CheckCircle2,
};

const EngagementAgent = () => {
    const [activeView, setActiveView] = useState<'health' | 'events' | 'campaigns'>('health');
    const [healthData, setHealthData] = useState<EngagementHealth | null>(null);
    const [events, setEvents] = useState<LifeEvent[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [engagementTrend, setEngagementTrend] = useState<Array<{ date: string; interactions: number }>>([]);

    useEffect(() => {
        fetchHealth();
        fetchEvents();
        fetchCampaigns();
        fetchAnalytics();
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/engage/health`);
            if (res.ok) setHealthData(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/engage/events?limit=30`);
            if (res.ok) setEvents(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/engage/campaigns`);
            if (res.ok) setCampaigns(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/engage/analytics`);
            if (res.ok) {
                const data = await res.json();
                setEngagementTrend(data.engagement_trend || []);
            }
        } catch (e) { console.error(e); }
    };

    const DONUT_COLORS = ['#34d399', '#fbbf24', '#94a3b8', '#f43f5e'];

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg shadow-rose-500/20">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white">Digital Engagement Agent</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-14">Proactive AI engagement with life event detection, behavioral analysis & campaign orchestration</p>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 mb-8">
                {([
                    { id: 'health', label: 'Engagement Health', icon: Activity },
                    { id: 'events', label: 'Life Events', icon: Calendar },
                    { id: 'campaigns', label: 'Campaigns', icon: Send },
                ] as const).map(view => (
                    <button
                        key={view.id}
                        onClick={() => setActiveView(view.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeView === view.id
                                ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                                : 'bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.06] hover:text-slate-300'
                        }`}
                    >
                        <view.icon className="w-4 h-4" />
                        {view.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ===== HEALTH DASHBOARD ===== */}
                {activeView === 'health' && healthData && (
                    <motion.div key="health" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Overall Health Score */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="dark-glass p-8 md:col-span-1 text-center relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">Overall Health Score</p>
                                <div className="relative inline-flex items-center justify-center mb-4">
                                    <svg viewBox="0 0 120 120" className="w-32 h-32">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                                        <circle
                                            cx="60" cy="60" r="52"
                                            fill="none"
                                            stroke="url(#healthGradient)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${healthData.overall_health_score * 3.27} 327`}
                                            transform="rotate(-90 60 60)"
                                        />
                                        <defs>
                                            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#34d399" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-black text-white">{healthData.overall_health_score}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-emerald-400 font-bold">{healthData.active_percentage}% Active</p>
                            </div>

                            {/* Segment Cards */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                {healthData.segments.map((seg) => {
                                    const config = SEGMENT_CONFIG[seg.status] || SEGMENT_CONFIG.active;
                                    const SegIcon = config.icon;
                                    return (
                                        <motion.div
                                            key={seg.status}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`dark-glass p-5 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all group`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} bg-opacity-10 flex items-center justify-center`}
                                                     style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))` }}>
                                                    <SegIcon className={`w-5 h-5 text-${config.color}-400`} />
                                                </div>
                                                <span className={`text-2xl font-black text-${config.color}-400`}>{seg.count}</span>
                                            </div>
                                            <p className="text-xs font-black text-white capitalize">{config.label}</p>
                                            <p className="text-[10px] text-slate-500">{seg.percentage}% of customers</p>
                                            <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${seg.percentage}%` }}
                                                    transition={{ duration: 0.8 }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Engagement Trend Chart */}
                        {engagementTrend.length > 0 && (
                            <div className="dark-glass p-6 mb-8">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-rose-400" />
                                    14-Day Engagement Trend
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={engagementTrend}>
                                        <defs>
                                            <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            tickFormatter={(v) => v.slice(5)}
                                        />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Area type="monotone" dataKey="interactions" stroke="#f43f5e" strokeWidth={2} fill="url(#engGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* At-Risk Customers + Channel Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="dark-glass p-6">
                                <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    At-Risk Customers
                                </h4>
                                <div className="space-y-3">
                                    {healthData.at_risk_customers.slice(0, 6).map((cust) => (
                                        <div key={cust.customer_id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{cust.first_name} {cust.last_name}</p>
                                                    <p className="text-[9px] text-slate-500 capitalize">{cust.engagement_status.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-amber-400">{Math.round(cust.engagement_score * 100)}%</p>
                                                <p className="text-[9px] text-slate-600">score</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dark-glass p-6">
                                <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                                    Channel Preferences
                                </h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={healthData.channel_preferences} layout="vertical">
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis type="category" dataKey="channel" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                            {healthData.channel_preferences.map((_, i) => (
                                                <Cell key={i} fill={['#22d3ee', '#a78bfa', '#34d399', '#f97316', '#f43f5e', '#fbbf24', '#60a5fa'][i % 7]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ===== LIFE EVENTS VIEW ===== */}
                {activeView === 'events' && (
                    <motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Event Distribution Summary */}
                        {healthData?.event_distribution && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {healthData.event_distribution.slice(0, 4).map((evt, i) => (
                                    <motion.div
                                        key={evt.event_type}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="dark-glass p-5 text-center"
                                    >
                                        <p className="text-2xl font-black text-white mb-1">{evt.count}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{evt.event_type.replace(/_/g, ' ')}</p>
                                        <p className="text-[9px] text-emerald-400 mt-1">{evt.acted_count} acted</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Event Timeline */}
                        <div className="space-y-3">
                            {events.map((event, i) => {
                                const EventIcon = EVENT_ICONS[event.event_type] || Bell;
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="dark-glass p-5 flex items-start gap-5 hover:shadow-[0_0_25px_rgba(244,63,94,0.04)] transition-all group"
                                    >
                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                                            <EventIcon className="w-6 h-6 text-rose-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-sm font-black text-white">{event.template_title}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${URGENCY_COLOR[event.urgency]}`}>
                                                    {event.urgency.toUpperCase()}
                                                </span>
                                                <span className={`text-[9px] font-bold ${
                                                    event.status === 'acted' ? 'text-emerald-400' :
                                                    event.status === 'pending' ? 'text-amber-400' : 'text-slate-500'
                                                }`}>
                                                    {event.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-2">
                                                <span className="text-white font-bold">{event.first_name} {event.last_name}</span>
                                                {' — '}{event.customer_id}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed mb-2">{event.ai_action}</p>
                                            <div className="flex items-center gap-4 text-[9px] text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(event.detected_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Target className="w-3 h-3" />
                                                    {Math.round(event.ai_confidence * 100)}% confidence
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Send className="w-3 h-3" />
                                                    {event.best_channel}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-rose-400 hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 uppercase tracking-wider">
                                            Act
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ===== CAMPAIGNS VIEW ===== */}
                {activeView === 'campaigns' && (
                    <motion.div key="campaigns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {campaigns.map((camp, i) => (
                                <motion.div
                                    key={camp.campaign_id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="dark-glass p-6 hover:shadow-[0_0_30px_rgba(244,63,94,0.05)] transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-white mb-1">{camp.name}</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{camp.target_segment.replace(/_/g, ' ')}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full border border-emerald-500/20 uppercase">
                                            {camp.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-400 leading-relaxed mb-5 italic">"{camp.message_template}"</p>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                                            <p className="text-lg font-black text-white">{camp.total_targeted}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">Targeted</p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                                            <p className="text-lg font-black text-emerald-400">{camp.total_converted}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">Converted</p>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                                            <p className="text-lg font-black text-rose-400">{camp.conversion_rate}%</p>
                                            <p className="text-[9px] text-slate-500 uppercase">CVR</p>
                                        </div>
                                    </div>

                                    {/* Conversion Bar */}
                                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${camp.conversion_rate}%` }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{camp.channel}</span>
                                        <span className="text-[9px] text-slate-600 font-mono">{camp.campaign_id}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {campaigns.length === 0 && (
                            <div className="dark-glass p-12 text-center">
                                <Send className="w-12 h-12 text-rose-400/30 mx-auto mb-4" />
                                <p className="text-sm text-slate-500">No active engagement campaigns. The AI agent will create them based on detected life events.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EngagementAgent;
