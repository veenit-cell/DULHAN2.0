import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, TrendingUp, Bell, Route, Smartphone, CreditCard,
    Shield, PiggyBank, Wallet, BarChart3, ArrowUpRight,
    ChevronRight, Zap, Eye, CheckCircle2, XCircle, Clock,
    Layers, Users, Filter
} from 'lucide-react';
import { API_URL } from '../lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface Recommendation {
    product_id: string;
    product_name: string;
    category: string;
    match_score: number;
    reason: string;
    prereqs_met: boolean;
    priority: string;
}

interface Nudge {
    id: number;
    customer_id: string;
    product_id: string;
    product_name: string;
    nudge_type: string;
    message: string;
    confidence: number;
    status: string;
    channel: string;
    first_name?: string;
    last_name?: string;
    digital_maturity?: number;
}

interface AdoptionAnalytics {
    total_customers: number;
    adoption_rates: Array<{ product_id: string; product_name: string; adopters: number; adoption_rate: number }>;
    category_stats: Array<{ category: string; users: number; total_products: number }>;
    maturity_distribution: Array<{ segment: string; count: number; avg_maturity: number }>;
    nudge_effectiveness: Array<{ status: string; count: number }>;
    active_campaigns: any[];
    usage_distribution: Array<{ usage_frequency: string; count: number }>;
    avg_products_per_customer: number;
}

const CATEGORY_ICONS: Record<string, any> = {
    payments: Wallet,
    cards: CreditCard,
    investments: TrendingUp,
    insurance: Shield,
    deposits: PiggyBank,
    accounts: Users,
    loans: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
    payments: '#22d3ee',
    cards: '#a78bfa',
    investments: '#34d399',
    insurance: '#f97316',
    deposits: '#fbbf24',
    accounts: '#60a5fa',
    loans: '#f472b6',
};

const PRIORITY_BADGE: Record<string, string> = {
    high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_BADGE: Record<string, { color: string; icon: any }> = {
    pending: { color: 'text-slate-400', icon: Clock },
    sent: { color: 'text-blue-400', icon: ArrowUpRight },
    clicked: { color: 'text-amber-400', icon: Eye },
    converted: { color: 'text-emerald-400', icon: CheckCircle2 },
    dismissed: { color: 'text-rose-400', icon: XCircle },
};

const AdoptionAgent = () => {
    const [activeView, setActiveView] = useState<'overview' | 'nudges' | 'recommendations'>('overview');
    const [analytics, setAnalytics] = useState<AdoptionAnalytics | null>(null);
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAnalytics();
        fetchNudges();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/adopt/analytics`);
            if (res.ok) setAnalytics(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchNudges = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/adopt/nudges`);
            if (res.ok) setNudges(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchRecommendations = async (customerId: string) => {
        if (!customerId.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/agent/adopt/recommendations/${customerId}`);
            if (res.ok) {
                setRecommendations(await res.json());
            } else {
                setRecommendations({ error: 'Customer not found' });
            }
        } catch (e) {
            setRecommendations({ error: 'Failed to fetch recommendations' });
        }
        setLoading(false);
    };

    const PIE_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f97316', '#fbbf24'];

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white">Digital Adoption Agent</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-14">AI-powered product recommendations, contextual nudges & adoption journey builder</p>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 mb-8">
                {([
                    { id: 'overview', label: 'Adoption Overview', icon: BarChart3 },
                    { id: 'nudges', label: 'Active Nudges', icon: Bell },
                    { id: 'recommendations', label: 'Product Engine', icon: Layers },
                ] as const).map(view => (
                    <button
                        key={view.id}
                        onClick={() => setActiveView(view.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeView === view.id
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.1)]'
                                : 'bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.06] hover:text-slate-300'
                        }`}
                    >
                        <view.icon className="w-4 h-4" />
                        {view.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ===== OVERVIEW ===== */}
                {activeView === 'overview' && analytics && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all">
                                <p className="text-3xl font-black text-white mb-1">{analytics.total_customers}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customers</p>
                            </div>
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(34,211,238,0.06)] transition-all">
                                <p className="text-3xl font-black text-cyan-400 mb-1">{analytics.avg_products_per_customer}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Products/User</p>
                            </div>
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all">
                                <p className="text-3xl font-black text-violet-400 mb-1">{analytics.adoption_rates.length}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Products Tracked</p>
                            </div>
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(249,115,22,0.06)] transition-all">
                                <p className="text-3xl font-black text-orange-400 mb-1">{analytics.active_campaigns.length}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Campaigns</p>
                            </div>
                        </div>

                        {/* Adoption Rates Heatmap */}
                        <div className="dark-glass p-8 mb-8">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-400" />
                                Product Adoption Heatmap
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {analytics.adoption_rates.map((prod, i) => {
                                    const intensity = prod.adoption_rate / 100;
                                    const catColor = CATEGORY_COLORS[analytics.category_stats.find(c =>
                                        prod.product_name.toLowerCase().includes(c.category)
                                    )?.category || 'payments'] || '#22d3ee';

                                    return (
                                        <motion.div
                                            key={prod.product_id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 rounded-xl border border-white/[0.06] text-center relative overflow-hidden group hover:scale-[1.03] transition-transform"
                                            style={{
                                                background: `rgba(${
                                                    catColor === '#22d3ee' ? '34,211,238' :
                                                    catColor === '#34d399' ? '52,211,153' :
                                                    catColor === '#a78bfa' ? '167,139,250' :
                                                    catColor === '#f97316' ? '249,115,22' :
                                                    catColor === '#fbbf24' ? '251,191,36' : '96,165,250'
                                                }, ${intensity * 0.15})`,
                                            }}
                                        >
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 truncate">{prod.product_name}</p>
                                            <p className="text-2xl font-black text-white">{prod.adoption_rate}%</p>
                                            <p className="text-[9px] text-slate-500 mt-1">{prod.adopters} users</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Usage Distribution */}
                            <div className="dark-glass p-6">
                                <h4 className="text-sm font-black text-white mb-4">Usage Frequency Distribution</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.usage_distribution}
                                            dataKey="count"
                                            nameKey="usage_frequency"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            strokeWidth={2}
                                            stroke="rgba(0,0,0,0.3)"
                                        >
                                            {analytics.usage_distribution.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-3 justify-center mt-2">
                                    {analytics.usage_distribution.map((u, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[10px] text-slate-400 capitalize">{u.usage_frequency}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Digital Maturity */}
                            <div className="dark-glass p-6">
                                <h4 className="text-sm font-black text-white mb-4">Digital Maturity Segments</h4>
                                <div className="space-y-5 mt-6">
                                    {analytics.maturity_distribution.map((seg) => {
                                        const color = seg.segment === 'high' ? 'emerald' : seg.segment === 'medium' ? 'amber' : 'rose';
                                        const pct = Math.round((seg.count / analytics.total_customers) * 100);
                                        return (
                                            <div key={seg.segment}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-300 capitalize">{seg.segment} Maturity</span>
                                                    <span className={`text-sm font-black text-${color}-400`}>{seg.count} ({pct}%)</span>
                                                </div>
                                                <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, delay: 0.2 }}
                                                        className={`h-full rounded-full bg-gradient-to-r ${
                                                            color === 'emerald' ? 'from-emerald-500 to-teal-400' :
                                                            color === 'amber' ? 'from-amber-500 to-yellow-400' :
                                                            'from-rose-500 to-pink-400'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ===== NUDGES VIEW ===== */}
                {activeView === 'nudges' && (
                    <motion.div key="nudges" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {nudges.map((nudge, i) => {
                                const statusInfo = STATUS_BADGE[nudge.status] || STATUS_BADGE.pending;
                                const StatusIcon = statusInfo.icon;
                                return (
                                    <motion.div
                                        key={nudge.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="dark-glass p-5 hover:shadow-[0_0_25px_rgba(52,211,153,0.05)] transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <Smartphone className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white">{nudge.product_name}</p>
                                                    <p className="text-[9px] text-slate-500">{nudge.first_name} {nudge.last_name}</p>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase">{nudge.status}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{nudge.message}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">{nudge.channel}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-black text-emerald-400">{Math.round(nudge.confidence * 100)}%</span>
                                                <span className="text-[9px] text-slate-600">conf</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ===== RECOMMENDATIONS ENGINE ===== */}
                {activeView === 'recommendations' && (
                    <motion.div key="recs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Search */}
                        <div className="dark-glass p-6 mb-6">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchRecommendations(selectedCustomerId)}
                                    placeholder="Enter Customer ID (e.g., CUS-XXXXXXXX)"
                                    className="flex-grow bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 transition-colors"
                                />
                                <button
                                    onClick={() => fetchRecommendations(selectedCustomerId)}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white text-sm font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Analyzing...' : 'Get AI Recommendations'}
                                </button>
                            </div>
                        </div>

                        {recommendations && !recommendations.error && (
                            <div>
                                {/* Customer Profile */}
                                <div className="dark-glass p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-black text-white">{recommendations.customer_name}</p>
                                            <p className="text-xs text-slate-500 font-mono">{recommendations.customer_id}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="text-xl font-black text-emerald-400">{recommendations.adoption_rate}%</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase">Adoption</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-cyan-400">{Math.round(recommendations.digital_maturity * 100)}%</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase">Digital Maturity</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-violet-400">{recommendations.products_held}/{recommendations.products_available}</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase">Products</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendation Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recommendations.recommendations.map((rec: Recommendation, i: number) => {
                                        const CatIcon = CATEGORY_ICONS[rec.category] || Package;
                                        return (
                                            <motion.div
                                                key={rec.product_id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="dark-glass p-6 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all group"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                        <CatIcon className="w-6 h-6 text-emerald-400" />
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${PRIORITY_BADGE[rec.priority]}`}>
                                                        {rec.priority.toUpperCase()}
                                                    </span>
                                                </div>

                                                <h4 className="text-sm font-black text-white mb-1">{rec.product_name}</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">{rec.category}</p>
                                                <p className="text-xs text-slate-400 leading-relaxed mb-4">{rec.reason}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                                                style={{ width: `${rec.match_score}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-black text-emerald-400">{rec.match_score}%</span>
                                                    </div>
                                                    {rec.prereqs_met ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-amber-400" />
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {recommendations?.error && (
                            <div className="dark-glass p-8 text-center">
                                <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">{recommendations.error}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdoptionAgent;
