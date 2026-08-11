import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Send, Bot, User, TrendingUp,
    ArrowRight, CheckCircle2, Clock, Star, Zap, Filter,
    BarChart3, Phone, Mail, MapPin, Briefcase, ChevronRight,
    Sparkles, Target
} from 'lucide-react';
import { API_URL } from '../lib/api';

interface Lead {
    lead_id: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    income_bracket?: string;
    occupation?: string;
    lead_source: string;
    lead_score: number;
    stage: string;
    qualification_data?: string;
    recommended_products?: string;
    created_at: string;
}

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    options?: string[];
}

interface PipelineStats {
    pipeline: Record<string, { count: number; avg_score: number }>;
    total_leads: number;
    total_converted: number;
    conversion_rate: number;
    avg_lead_score: number;
}

const STAGE_COLORS: Record<string, string> = {
    new: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    contacted: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    qualified: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    kyc_pending: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    onboarded: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
};

const STAGE_LABELS: Record<string, string> = {
    new: 'New Lead',
    contacted: 'Contacted',
    qualified: 'Qualified',
    kyc_pending: 'KYC Pending',
    onboarded: 'Onboarded',
};

const AcquisitionAgent = () => {
    const [activeView, setActiveView] = useState<'chat' | 'pipeline' | 'leads'>('chat');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [chatOptions, setChatOptions] = useState<string[] | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [chatProgress, setChatProgress] = useState(0);
    const [filterStage, setFilterStage] = useState<string>('all');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLeads();
        fetchPipeline();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const fetchLeads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/acquire/leads`);
            if (res.ok) setLeads(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchPipeline = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/acquire/pipeline`);
            if (res.ok) setPipeline(await res.json());
        } catch (e) { console.error(e); }
    };

    const startChat = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agent/acquire/start`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setSessionId(data.session_id);
                setChatMessages([{
                    role: 'agent',
                    content: data.message,
                    timestamp: new Date(),
                    options: data.options,
                }]);
                setChatOptions(data.options || null);
                setChatProgress(data.progress || 0);
            }
        } catch (e) { console.error(e); }
    };

    const sendMessage = async (message: string) => {
        if (!sessionId || !message.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() };
        setChatMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setChatOptions(null);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/agent/acquire/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, message }),
            });
            if (res.ok) {
                const data = await res.json();
                // Simulate typing delay
                await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
                setIsTyping(false);
                setChatMessages(prev => [...prev, {
                    role: 'agent',
                    content: data.message,
                    timestamp: new Date(),
                    options: data.options,
                }]);
                setChatOptions(data.options || null);
                setChatProgress(data.progress || 0);

                if (data.complete) {
                    fetchLeads();
                    fetchPipeline();
                }
            }
        } catch (e) {
            setIsTyping(false);
            console.error(e);
        }
    };

    const filteredLeads = filterStage === 'all' ? leads : leads.filter(l => l.stage === filterStage);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white">Customer Acquisition Agent</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-14">AI-powered lead qualification, conversational onboarding & pipeline management</p>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 mb-8">
                {([
                    { id: 'chat', label: 'AI Onboarding Chat', icon: MessageSquare },
                    { id: 'pipeline', label: 'Acquisition Funnel', icon: TrendingUp },
                    { id: 'leads', label: 'Lead Database', icon: Users },
                ] as const).map(view => (
                    <button
                        key={view.id}
                        onClick={() => setActiveView(view.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeView === view.id
                                ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/10 text-blue-300 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                : 'bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.06] hover:text-slate-300'
                        }`}
                    >
                        <view.icon className="w-4 h-4" />
                        {view.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ===== CHAT VIEW ===== */}
                {activeView === 'chat' && (
                    <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chat Window */}
                            <div className="lg:col-span-2 dark-glass overflow-hidden flex flex-col" style={{ height: '600px' }}>
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">Dulhan Acquisition Bot</p>
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">● Online</p>
                                        </div>
                                    </div>
                                    {chatProgress > 0 && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                                            <div className="w-32 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                                                    animate={{ width: `${chatProgress * 100}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-blue-400">{Math.round(chatProgress * 100)}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-grow overflow-y-auto p-6 space-y-4 dark-scrollbar" data-lenis-prevent="true">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                                                <Sparkles className="w-10 h-10 text-blue-400" />
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-2">AI Onboarding Assistant</h3>
                                            <p className="text-slate-500 max-w-sm mb-6">Start a conversation to experience our AI-powered customer acquisition flow. The agent will qualify leads and recommend products.</p>
                                            <button
                                                onClick={startChat}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:translate-y-[-2px] transition-all"
                                            >
                                                <Zap className="w-4 h-4 inline mr-2" />
                                                Start Demo Session
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {chatMessages.map((msg, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                                        <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                                                            msg.role === 'user'
                                                                ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-br-md'
                                                                : 'bg-white/[0.06] text-slate-300 border border-white/[0.06] rounded-bl-md'
                                                        }`}>
                                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                                        </div>
                                                        <p className={`text-[9px] text-slate-600 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                                            {msg.timestamp.toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {isTyping && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                                    <div className="bg-white/[0.06] border border-white/[0.06] rounded-2xl rounded-bl-md px-5 py-4">
                                                        <div className="flex gap-1.5">
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Quick Options */}
                                {chatOptions && chatOptions.length > 0 && (
                                    <div className="px-6 py-3 border-t border-white/[0.04] flex gap-2 flex-wrap">
                                        {chatOptions.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(opt)}
                                                className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-all"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Input */}
                                {sessionId && (
                                    <div className="px-6 py-4 border-t border-white/[0.06]">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                                                placeholder="Type your response..."
                                                className="flex-grow bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-colors"
                                            />
                                            <button
                                                onClick={() => sendMessage(inputValue)}
                                                disabled={!inputValue.trim()}
                                                className="px-5 py-3 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-40"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Side Panel — Lead Score + Stats */}
                            <div className="space-y-5">
                                <div className="dark-glass p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Acquisition Stats</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Total Leads</span>
                                            <span className="text-lg font-black text-white">{pipeline?.total_leads || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Converted</span>
                                            <span className="text-lg font-black text-emerald-400">{pipeline?.total_converted || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Conversion Rate</span>
                                            <span className="text-lg font-black text-blue-400">{pipeline?.conversion_rate || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Avg. Lead Score</span>
                                            <span className="text-lg font-black text-violet-400">{pipeline?.avg_lead_score || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="dark-glass p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pipeline Breakdown</p>
                                    {pipeline?.pipeline && Object.entries(pipeline.pipeline).map(([stage, data]) => (
                                        <div key={stage} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    stage === 'onboarded' ? 'bg-emerald-400' :
                                                    stage === 'qualified' ? 'bg-violet-400' :
                                                    stage === 'kyc_pending' ? 'bg-orange-400' :
                                                    stage === 'contacted' ? 'bg-amber-400' : 'bg-blue-400'
                                                }`} />
                                                <span className="text-xs text-slate-400 capitalize">{stage.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-sm font-black text-white">{data.count}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="dark-glass p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Agent Capabilities</p>
                                    <div className="space-y-2">
                                        {['Lead Scoring', 'Product Matching', 'KYC Flow', 'Conversational AI', 'Auto-Qualification'].map((cap, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-xs text-slate-400">{cap}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ===== PIPELINE VIEW ===== */}
                {activeView === 'pipeline' && (
                    <motion.div key="pipeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Funnel Visualization */}
                        <div className="dark-glass p-8 mb-8">
                            <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                Acquisition Funnel
                            </h3>
                            <div className="flex flex-col items-center gap-3">
                                {['new', 'contacted', 'qualified', 'kyc_pending', 'onboarded'].map((stage, i) => {
                                    const count = pipeline?.pipeline?.[stage]?.count || 0;
                                    const maxCount = Math.max(...Object.values(pipeline?.pipeline || {}).map(d => d.count), 1);
                                    const widthPct = Math.max(20, (count / maxCount) * 100);

                                    return (
                                        <motion.div
                                            key={stage}
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={{ opacity: 1, scaleX: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`relative bg-gradient-to-r ${STAGE_COLORS[stage]} border rounded-xl px-6 py-4 flex items-center justify-between`}
                                            style={{ width: `${widthPct}%`, minWidth: '200px' }}
                                        >
                                            <span className="text-sm font-black uppercase tracking-wider">{STAGE_LABELS[stage]}</span>
                                            <span className="text-2xl font-black">{count}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-center mt-6">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    Overall Conversion: <span className="text-emerald-400">{pipeline?.conversion_rate || 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Source Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-7 h-7 text-blue-400" />
                                </div>
                                <p className="text-3xl font-black text-white mb-1">{pipeline?.total_leads || 0}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Prospects</p>
                            </div>
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                                </div>
                                <p className="text-3xl font-black text-emerald-400 mb-1">{pipeline?.total_converted || 0}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Converted</p>
                            </div>
                            <div className="dark-glass p-6 text-center hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-7 h-7 text-violet-400" />
                                </div>
                                <p className="text-3xl font-black text-violet-400 mb-1">{pipeline?.avg_lead_score || 0}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Lead Score</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ===== LEADS VIEW ===== */}
                {activeView === 'leads' && (
                    <motion.div key="leads" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Filters */}
                        <div className="flex items-center gap-3 mb-6">
                            <Filter className="w-4 h-4 text-slate-500" />
                            {['all', 'new', 'contacted', 'qualified', 'kyc_pending', 'onboarded'].map(stage => (
                                <button
                                    key={stage}
                                    onClick={() => setFilterStage(stage)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        filterStage === stage
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            : 'bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.06]'
                                    }`}
                                >
                                    {stage === 'all' ? 'All' : STAGE_LABELS[stage]}
                                </button>
                            ))}
                            <span className="ml-auto text-xs text-slate-500 font-bold">{filteredLeads.length} leads</span>
                        </div>

                        {/* Lead Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLeads.slice(0, 15).map((lead, i) => (
                                <motion.div
                                    key={lead.lead_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="dark-glass p-5 hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">{lead.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{lead.lead_id}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black bg-gradient-to-r ${STAGE_COLORS[lead.stage]}`}>
                                            {STAGE_LABELS[lead.stage]}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {lead.city && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <MapPin className="w-3 h-3" /> {lead.city}
                                            </div>
                                        )}
                                        {lead.occupation && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Briefcase className="w-3 h-3" /> {lead.occupation}
                                            </div>
                                        )}
                                        {lead.income_bracket && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <BarChart3 className="w-3 h-3" /> ₹{lead.income_bracket}
                                            </div>
                                        )}
                                    </div>

                                    {/* Lead Score Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Score</span>
                                            <span className="text-xs font-black text-blue-400">{Math.round(lead.lead_score * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                                                style={{ width: `${lead.lead_score * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-600 font-bold uppercase">{lead.lead_source}</span>
                                        <ChevronRight className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcquisitionAgent;
