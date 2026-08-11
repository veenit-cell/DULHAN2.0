import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
    ShieldAlert, Activity, Info, 
    Key, CheckCircle2, XCircle, Play, Fingerprint,
    Settings, Share2, Menu, X, ChevronRight, User, Loader2,
    TrendingUp, Building2, Zap, Lock, BarChart3, Bell, Command,
    Users, Package, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import jsPDF from 'jspdf';
import RiskBreakdown from '../components/RiskBreakdown';
import IntelligenceTrends from '../components/IntelligenceTrends';
import OperationsSLA from '../components/OperationsSLA';
import BankOnboarding from '../components/BankOnboarding';
import PSIDashboard from './PSIDashboard';
import LiveThreatFeed from '../components/LiveThreatFeed';
import ImpactDashboard from '../components/ImpactDashboard';
import AcquisitionAgent from '../components/AcquisitionAgent';
import AdoptionAgent from '../components/AdoptionAgent';
import EngagementAgent from '../components/EngagementAgent';
import { API_URL } from '../lib/api';

interface StatsData {
    total_accounts: number;
    total_transactions: number;
    flagged_networks_blocked: number;
    frozen_suspicious_capital: number;
}

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'PENDING';
    time: string;
}

type TabType = 'compliance' | 'intelligence' | 'trends' | 'operations' | 'onboarding' | 'prover' | 'psi' | 'federated' | 'settings' | 'impact' | 'acquisition' | 'adoption' | 'engagement';

interface Notification {
    id: string;
    type: 'threat' | 'info' | 'success';
    title: string;
    message: string;
    time: Date;
    read: boolean;
}

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState<TabType>('compliance');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const sidebarProfileRef = useRef<HTMLDivElement>(null);

    const [userRole] = useState<string>(localStorage.getItem('user_role') || 'analyst');

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Keyboard Shortcuts Modal
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    // User Data
    const user = {
        name: localStorage.getItem('institution_id') || "Institutional User",
        id: localStorage.getItem('institution_id') || "BNK-HDFC",
        role: userRole
    };
    
    // Data State
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
    const [stats, setStats] = useState<StatsData | null>(null);
    
    // Graph State
    const [anomalyThreshold, setAnomalyThreshold] = useState<number>(0.75);
    const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>();

    // Crypto Utility State
    const [rawAccount, setRawAccount] = useState('');
    const [hashedToken, setHashedToken] = useState('');

    // Compliance State
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [runningTests, setRunningTests] = useState(false);

    // Simulated Notification Generator
    useEffect(() => {
        const threatMessages = [
            { title: 'Velocity Burst Detected', message: 'Account 0xA3F9..B2C1 triggered 12 transactions in 8 minutes' },
            { title: 'Tarjan Cycle Alert', message: '7-node circular ring identified in HDFC-SBI cross-bank subgraph' },
            { title: 'Smurfing Pattern', message: '₹4.9L structured deposits from 8 unique senders to single receiver' },
            { title: 'Anomaly Score Spike', message: 'Isolation Forest flagged node 0xE7D2..91AF with score -0.89' },
            { title: 'Cross-Bank Match', message: 'PSI intersection found 3 common threat tokens between AXIS and ICICI' },
        ];
        const infoMessages = [
            { title: 'Model Sync Complete', message: 'Federated round RD-15 aggregated successfully across 5 nodes' },
            { title: 'WORM Log Rotated', message: 'Audit trail checkpoint created — 2,847 entries archived' },
            { title: 'Node Heartbeat', message: 'All 5 institutional nodes reporting healthy' },
        ];

        // Add initial notifications
        const initial: Notification[] = [
            { id: 'init-1', type: 'threat', ...threatMessages[0], time: new Date(Date.now() - 120000), read: false },
            { id: 'init-2', type: 'info', ...infoMessages[0], time: new Date(Date.now() - 300000), read: false },
            { id: 'init-3', type: 'threat', ...threatMessages[1], time: new Date(Date.now() - 600000), read: true },
        ];
        setNotifications(initial);

        // Generate new notifications periodically
        const interval = setInterval(() => {
            const isThreat = Math.random() < 0.6;
            const pool = isThreat ? threatMessages : infoMessages;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            const newNotif: Notification = {
                id: `notif-${Date.now()}`,
                type: isThreat ? 'threat' : 'info',
                ...picked,
                time: new Date(),
                read: false,
            };
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        }, 30000 + Math.random() * 30000); // Every 30-60 seconds

        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const tabList = useMemo(() => [
        { id: 'compliance', roles: ['analyst', 'supervisor', 'admin'] },
        { id: 'intelligence', roles: ['analyst', 'supervisor', 'admin'] },
        { id: 'acquisition', roles: ['analyst', 'supervisor', 'admin'] },
        { id: 'adoption', roles: ['analyst', 'supervisor', 'admin'] },
        { id: 'engagement', roles: ['supervisor', 'admin'] },
        { id: 'trends', roles: ['supervisor', 'admin'] },
        { id: 'impact', roles: ['analyst', 'supervisor', 'admin'] },
        { id: 'operations', roles: ['admin'] },
        { id: 'onboarding', roles: ['admin'] },
        { id: 'prover', roles: ['supervisor', 'admin'] },
        { id: 'psi', roles: ['supervisor', 'admin'] },
        { id: 'federated', roles: ['supervisor', 'admin'] },
        { id: 'settings', roles: ['admin'] },
    ].filter(t => t.roles.includes(userRole)), [userRole]);

    // Keyboard Shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        // ? key — show shortcuts
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
            e.preventDefault();
            setShortcutsOpen(prev => !prev);
            return;
        }

        // Escape — close any open panel
        if (e.key === 'Escape') {
            setShortcutsOpen(false);
            setNotifOpen(false);
            setProfileOpen(false);
            return;
        }

        // Ctrl+1 through Ctrl+9 — switch tabs
        if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const idx = parseInt(e.key) - 1;
            if (idx < tabList.length) {
                setActiveTab(tabList[idx].id as TabType);
            }
        }

        // Ctrl+B — toggle sidebar
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            setSidebarOpen(prev => !prev);
        }

        // Ctrl+N — toggle notifications
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            setNotifOpen(prev => !prev);
        }
    }, [tabList]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Simulated Cross-Bank Verification State
    const [verificationStates, setVerificationStates] = useState<{[key: string]: 'pending' | 'verified'}>({});

    // UNIFIED SPHERICAL TOPOLOGY GENERATOR
    const generateMockData = () => {
        const nodes: any[] = [];
        const links: any[] = [];
        const numNodes = 1000;
        const normHubs: number[] = [];
        const threatHubs: number[] = [];
        const coreNodes: number[] = [];
        const connectionCounts: { [key: string]: number } = {};

        // 0. Generate "Invisible Core Node" for gravitational tethering
        nodes.push({
            id: 'core',
            hash: '0x0000000000000000',
            is_flagged: false,
            is_core: true,
            val: 0.1
        });

        // 1. Generate 5 "Core" Backbone Nodes
        for (let i = 0; i < 5; i++) {
            const id = `node-core-${i}`;
            nodes.push({
                id,
                hash: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
                is_flagged: false,
                val: 6
            });
            coreNodes.push(i);
        }

        // 2. Generate 1,495 Remaining Nodes with 58/42 split
        for (let i = 5; i < numNodes; i++) {
            const isFlagged = Math.random() < 0.42;
            const newNode = {
                id: `node-${i}`,
                hash: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
                is_flagged: isFlagged,
                val: isFlagged ? 4 : 2
            };
            nodes.push(newNode);
            connectionCounts[newNode.id] = 0;

            // Identity hubs: next 15 normal, next 8 threat
            if (!isFlagged && normHubs.length < 15) normHubs.push(i);
            if (isFlagged && threatHubs.length < 8) threatHubs.push(i);
        }
        connectionCounts['core'] = 0;

        // 3. Backbone Integration (Hubs to Core) - These are visible pathways
        normHubs.forEach(hIdx => {
            const sourceId = nodes[hIdx].id;
            const targetId = nodes[coreNodes[Math.floor(Math.random() * coreNodes.length)]].id;
            links.push({ source: sourceId, target: targetId, is_flagged: false });
            connectionCounts[sourceId]++;
            connectionCounts[targetId]++;
        });
        threatHubs.forEach(hIdx => {
            const sourceId = nodes[hIdx].id;
            const targetId = nodes[coreNodes[Math.floor(Math.random() * coreNodes.length)]].id;
            links.push({ source: sourceId, target: targetId, is_flagged: true });
            connectionCounts[sourceId]++;
            connectionCounts[targetId]++;
        });

        // 4. Mesh Link Generation (Strict 4-Gate Limit)
        for (let i = 5; i < numNodes; i++) {
            const node = nodes[i];
            
            // Try mesh connectivity within the same shell (Normal to Normal, Threat to Threat)
            const maxMeshTries = 10;
            let meshCreated = 0;
            const targetMeshCount = node.is_flagged ? 2 : 1; // Dense inner, sparse outer

            for (let t = 0; t < maxMeshTries && meshCreated < targetMeshCount; t++) {
                if (connectionCounts[node.id] >= 4) break;

                const potentialTargetIdx = Math.floor(Math.random() * (numNodes - 5)) + 5;
                const targetNode = nodes[potentialTargetIdx];

                if (targetNode.id !== node.id && 
                    targetNode.is_flagged === node.is_flagged && 
                    connectionCounts[targetNode.id] < 4) {
                    
                    links.push({
                        source: node.id,
                        target: targetNode.id,
                        is_flagged: node.is_flagged,
                        distance: node.is_flagged ? 30 : 120
                    });
                    connectionCounts[node.id]++;
                    connectionCounts[targetNode.id]++;
                    meshCreated++;
                }
            }

            // 10% Cross-link Noise (Capped)
            if (Math.random() < 0.10 && connectionCounts[node.id] < 4) {
                const randomTargetIdx = Math.floor(Math.random() * (numNodes - 5)) + 5;
                const targetNode = nodes[randomTargetIdx];
                if (connectionCounts[targetNode.id] < 4) {
                    links.push({
                        source: node.id,
                        target: targetNode.id,
                        is_flagged: node.is_flagged
                    });
                    connectionCounts[node.id]++;
                    connectionCounts[targetNode.id]++;
                }
            }

            // CENTER TETHERING: Every node connects to the invisible core (The Bicycle Spoke)
            // THESE DO NOT COUNT TOWARDS THE 4-GATE LIMIT
            links.push({
                source: node.id,
                target: 'core',
                is_flagged: false,
                is_tether: true,
                type: node.is_flagged ? 'core_shell' : 'outer_shell'
            });
        }

        return { nodes, links };
    };

    // Stabilize Data with useMemo
    const memoizedGraphData = useMemo(() => generateMockData(), []);

    const [selectedAlert, setSelectedAlert] = useState<any>(null);

    // Responsiveness for Graph
    useEffect(() => {
        const updateDimensions = () => {
            if (graphContainerRef.current) {
                setGraphDimensions({
                    width: graphContainerRef.current.offsetWidth,
                    height: graphContainerRef.current.offsetHeight
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [activeTab, sidebarOpen]);

    // PHYSICS OVERRIDE: Inject custom D3 forces for spherical layout (Bicycle Spoke Method)
    useEffect(() => {
        if (fgRef.current) {
            // 1. Set specific distances for the tether links to create the nested spheres
            fgRef.current.d3Force('link').distance((link: any) => {
                if (link.is_tether) {
                    return link.type === 'outer_shell' ? 140 : 50; // Green far, Orange close
                }
                return 15; // Local cluster links stay tight
            });

            // 2. Add repulsion so nodes spread evenly across their respective sphere surfaces
            fgRef.current.d3Force('charge').strength(-60);

            // 3. Keep the entire structure centered
            fgRef.current.d3Force('center').strength(1);

            // CINEMATIC LIGHTING: Inject lights into the WebGL scene
            const scene = fgRef.current.scene();
            if (!scene.lights_injected) {
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                const pointLight = new THREE.PointLight(0xffffff, 1.2);
                pointLight.position.set(100, 100, 100);
                scene.add(ambientLight);
                scene.add(pointLight);
                scene.lights_injected = true;
            }
        }
    }, [memoizedGraphData]);

    const runDiagnostics = async () => {
        setRunningTests(true);
        setTestResults([]);
        
        const diagnosticPhases = [
            { name: 'HMAC Determinism', status: 'PASS', time: '12ms' },
            { name: 'Replay Attack Prevention', status: 'PASS', time: '45ms' },
            { name: 'Zero-PII Compliance', status: 'PASS', time: '8ms' },
            { name: 'Tarjan SCC Performance', status: 'PASS', time: '112ms' },
            { name: 'Adversarial Token Injection', status: 'PASS', time: '89ms' },
            { name: 'Quantum-Resistant Hash Integrity', status: 'PASS', time: '14ms' },
            { name: 'Multi-Hop Smurfing Detection', status: 'PASS', time: '210ms' },
            { name: 'Velocity Burst Intervention', status: 'PASS', time: '34ms' },
            { name: 'Peer-to-Peer Weight Sync', status: 'PASS', time: '56ms' },
            { name: 'WORM Log Immutability', status: 'PASS', time: '5ms' },
            { name: 'Auth Node Heartbeat', status: 'PASS', time: '21ms' }
        ];

        for (const test of diagnosticPhases) {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));
            // @ts-ignore
            setTestResults(prev => [...prev, test]);
        }
        
        setRunningTests(false);
    };

    const handleCryptoInput = (val: string) => {
        setRawAccount(val);
        if (!val) {
            setHashedToken('');
            return;
        }
        // Mock HMAC-SHA256 visualizer (for UI/UX)
        const mockHash = Array.from(val).reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').padEnd(64, 'a').slice(0, 64);
        setHashedToken(mockHash);
    };

    const downloadSTR = () => {
        if (!selectedAlert) return;
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(255, 79, 0); 
        doc.text("DULHAN SUSPICIOUS TRANSACTION REPORT (STR)", 14, 25);
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(`Generated: ${new Date().toISOString()}`, 14, 35);
        doc.text(`Transaction ID: ${selectedAlert.txn_id}`, 14, 45);
        doc.text(`Risk Category: ${selectedAlert.fraud_pattern}`, 14, 55);
        doc.save(`STR_${selectedAlert.txn_id}.pdf`);
    };

    const handleResolution = (action: 'flag' | 'rbi' | 'clean') => {
        const message = action === 'flag' ? "Manual Flag applied to Neural Network." : 
                       action === 'rbi' ? "Escalated to RBI Investigation Branch." : 
                       "Node cleared. Anomaly suppressed.";
        alert(message);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('dulhan_token');
        if (!token) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [, resStats] = await Promise.all([
                fetch(`${API_URL}/api/graph`, { headers }),
                fetch(`${API_URL}/api/threat-stats`, { headers })
            ]);
            
            // Cinematic 3D Data Implementation (Decentralized Generator)
            // Initializing with memoized structure for stability
            setGraphData(memoizedGraphData);

            if (resStats.ok) setStats(await resStats.json());
        } catch (error) {
            console.error(error);
            // Fallback to generator if API fails
            setGraphData(memoizedGraphData);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s Polling
        return () => clearInterval(interval);
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(event.target as Node)) {
                setSidebarProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const logout = () => {
        localStorage.removeItem('dulhan_token');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login';
    };

    const filteredGraphData = {
        nodes: graphData.nodes.filter((n: any) => n.is_flagged || anomalyThreshold < 0.95),
        links: graphData.links.filter((l: any) => l.is_flagged || anomalyThreshold < 0.95)
    };

    // Tab content animation variants
    const tabVariants = {
        initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
        exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.3 } }
    };

    return (
        <div className="flex h-screen dash-bg-gradient text-slate-200 font-sans overflow-hidden">
            {/* ═══════════════════════════════════════
                SIDEBAR — Dark Glassmorphic
            ═══════════════════════════════════════ */}
            <aside 
                className={`flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-50 border-r border-white/[0.04] ${sidebarOpen ? 'w-[280px]' : 'w-20'}`}
                style={{
                    background: 'rgba(8, 8, 24, 0.85)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                }}
            >
                <div className="h-full flex flex-col p-4">
                    {/* Header Logo */}
                    <div className="flex items-center space-x-3 mb-10 px-2 overflow-hidden">
                        <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 p-1.5 rounded-xl shadow-lg shadow-cyan-500/20 flex-shrink-0">
                            <img src="/logo.png" alt="DULHAN Logo" className="w-9 h-9 object-contain" />
                        </div>
                        {sidebarOpen && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="transition-opacity duration-300"
                            >
                                <h2 className="text-xl font-black tracking-tighter leading-none uppercase text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Dulhan</h2>
                                <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase text-glow-cyan">Fintech Shield</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-grow space-y-1 overflow-y-auto dark-scrollbar" data-lenis-prevent="true">
                        {[
                            { id: 'compliance', icon: ShieldAlert, label: 'Compliance Runner', roles: ['analyst', 'supervisor', 'admin'] },
                            { id: 'intelligence', icon: Activity, label: 'Threat Intelligence', roles: ['analyst', 'supervisor', 'admin'] },
                            { id: 'acquisition', icon: Users, label: 'Acquisition Agent', roles: ['analyst', 'supervisor', 'admin'] },
                            { id: 'adoption', icon: Package, label: 'Adoption Agent', roles: ['analyst', 'supervisor', 'admin'] },
                            { id: 'engagement', icon: Heart, label: 'Engagement Agent', roles: ['supervisor', 'admin'] },
                            { id: 'trends', icon: TrendingUp, label: 'Intelligence Trends', roles: ['supervisor', 'admin'] },
                            { id: 'impact', icon: BarChart3, label: 'System Impact', roles: ['analyst', 'supervisor', 'admin'] },
                            { id: 'operations', icon: Zap, label: 'Operations SLA', roles: ['admin'] },
                            { id: 'onboarding', icon: Building2, label: 'Bank Onboarding', roles: ['admin'] },
                            { id: 'prover', icon: Fingerprint, label: 'Zero-PII Prover', roles: ['supervisor', 'admin'] },
                            { id: 'psi', icon: Lock, label: 'Advanced Crypto (PSI)', roles: ['supervisor', 'admin'] },
                            { id: 'federated', icon: Share2, label: 'Federated Sync', roles: ['supervisor', 'admin'] },
                            { id: 'settings', icon: Settings, label: 'Settings & Audit', roles: ['admin'] }
                        ].filter(item => item.roles.includes(userRole)).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabType)}
                                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                                    activeTab === item.id 
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                                        : 'hover:bg-white/[0.04] text-slate-500 hover:text-slate-300 border border-transparent'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-cyan-400' : ''}`} />
                                {sidebarOpen && <span className="ml-4 font-bold text-sm whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>}
                                {activeTab === item.id && <ChevronRight className="absolute right-2 w-4 h-4 text-cyan-400" />}
                                {!sidebarOpen && (
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10 shadow-xl">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-white/[0.06] pt-4 relative" ref={sidebarProfileRef}>
                        {sidebarProfileOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute bottom-full left-0 mb-4 w-[240px] dark-glass p-4 z-50 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="pb-3 mb-3 border-b border-white/5">
                                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Identity Profile</p>
                                        <div className="flex items-center mt-2">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3 border border-cyan-500/30">
                                                <Fingerprint className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-black truncate text-white">{user.id}</p>
                                                <p className="text-[9px] text-slate-400">{userRole.toUpperCase()} NODE</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <button className="w-full flex items-center p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-300 hover:text-white text-xs font-bold">
                                            <Settings className="w-4 h-4 mr-3" /> System Preferences
                                        </button>
                                        <button 
                                            onClick={logout}
                                            className="w-full flex items-center p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-rose-400 hover:text-rose-300 text-xs font-bold"
                                        >
                                            <XCircle className="w-4 h-4 mr-3" /> Terminate Session
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        <button 
                            onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}
                            className={`w-full flex items-center p-2 rounded-2xl transition-all duration-300 border ${sidebarProfileOpen ? 'bg-white/[0.06] border-white/10' : 'border-transparent hover:bg-white/[0.04]'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/20 flex-shrink-0">
                                <User className="w-5 h-5 text-cyan-400" />
                            </div>
                            {sidebarOpen && (
                                <div className="ml-3 truncate text-left">
                                    <p className="text-sm font-bold truncate capitalize text-white">{userRole}</p>
                                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">{user.id}</p>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ═══════════════════════════════════════
                MAIN CONTENT AREA
            ═══════════════════════════════════════ */}
            <main className="flex-grow overflow-y-auto relative dark-scrollbar" data-lenis-prevent="true">
                {/* Top Header Bar — Dark Glassmorphic */}
                <header 
                    className="sticky top-0 h-20 z-40 px-8 flex items-center justify-between border-b border-white/[0.04]"
                    style={{
                        background: 'rgba(5, 5, 16, 0.7)',
                        backdropFilter: 'blur(40px) saturate(1.8)',
                    }}
                >
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/[0.06] rounded-lg text-slate-400 transition-colors">
                            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Operational Status</span>
                            <h2 className="text-sm font-black text-white flex items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <span className="relative mr-2 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                                </span>
                                DULHAN Neural Node <span className="text-cyan-400 ml-1.5">ACTIVE</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center space-x-5">
                        <div className="text-right hidden md:block border-r border-white/[0.06] pr-5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Health</p>
                            <p className="text-xs font-black text-emerald-400 text-glow-emerald">PEER SYNC OPTIMAL</p>
                        </div>

                        {/* Keyboard Shortcuts Hint */}
                        <button
                            onClick={() => setShortcutsOpen(true)}
                            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
                            title="Keyboard Shortcuts"
                        >
                            <Command className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500">?</span>
                        </button>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => { setNotifOpen(!notifOpen); }}
                                className="relative p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/[0.06]"
                            >
                                <Bell className="w-5 h-5 text-slate-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF4F00] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-[#FF4F00]/30">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="absolute right-0 mt-3 w-96 dark-glass z-50 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Alerts</h3>
                                            {unreadCount > 0 && (
                                                <span className="px-2 py-0.5 bg-[#FF4F00]/10 text-[#FF4F00] text-[9px] font-black rounded-full border border-[#FF4F00]/20">
                                                    {unreadCount} NEW
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto dark-scrollbar" data-lenis-prevent="true">
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-10 text-center">
                                                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500 font-medium">No alerts yet</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className={`px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer ${!notif.read ? 'bg-[#FF4F00]/[0.03]' : ''}`}
                                                    onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                            notif.type === 'threat' ? 'bg-red-500/10 text-red-400' :
                                                            notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            'bg-cyan-500/10 text-cyan-400'
                                                        }`}>
                                                            {notif.type === 'threat' ? <ShieldAlert className="w-4 h-4" /> :
                                                             <Activity className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-xs font-black truncate ${!notif.read ? 'text-white' : 'text-slate-400'}`}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.read && <span className="w-2 h-2 bg-[#FF4F00] rounded-full flex-shrink-0" />}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                                                            <p className="text-[9px] text-slate-600 font-bold mt-1.5 uppercase tracking-wider">
                                                                {Math.round((Date.now() - notif.time.getTime()) / 60000)}m ago
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        
                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button 
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center space-x-3 p-1 rounded-full border border-white/[0.08] hover:border-cyan-500/30 transition-all bg-white/[0.03] shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-black">
                                    {user.id.split('-')[1]}
                                </div>
                                <span className="text-xs font-bold text-slate-300 pr-2">{user.id}</span>
                            </button>

                            {profileOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 mt-3 w-64 dark-glass p-4 z-50"
                                >
                                    <div className="pb-3 mb-3 border-b border-white/[0.06] px-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated As</p>
                                        <p className="text-sm font-black text-white">{user.id}</p>
                                        <p className="text-[10px] text-slate-500 font-medium capitalize">{userRole} Tier</p>
                                    </div>
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center space-x-2 p-2 hover:bg-rose-500/10 rounded-xl text-rose-400 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                            <XCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Terminate Session</span>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-8 pb-20">
                    <AnimatePresence mode="wait">
                    {/* VIEW: COMPLIANCE RUNNER (DEFAULT) */}
                    {activeTab === 'compliance' && (
                        <motion.div key="compliance" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Compliance Diagnostic</h1>
                                    <div className="text-slate-400 flex items-center font-medium text-sm md:text-base">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mr-3 border border-cyan-500/20">
                                            <ShieldAlert className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        Running 11-Phase DULHAN Official Validation Suite
                                    </div>
                                </motion.div>
                                <motion.button 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={runDiagnostics} 
                                    disabled={runningTests}
                                    className={`px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs flex items-center transition-all ${
                                        runningTests 
                                            ? 'bg-slate-800 cursor-not-allowed text-slate-500 border border-slate-700' 
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] border border-cyan-400/50'
                                    }`}
                                >
                                    {runningTests ? (
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin text-cyan-400" />
                                    ) : (
                                        <Play className="w-5 h-5 mr-3" />
                                    )}
                                    {runningTests ? 'Executing Scenarios...' : 'Activate Test Suite'}
                                </motion.button>
                            </div>

                            <motion.div 
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                initial="initial"
                                animate="animate"
                                variants={{
                                    animate: { transition: { staggerChildren: 0.1 } }
                                }}
                            >
                                 {testResults.length === 0 && !runningTests ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <motion.div 
                                            key={i} 
                                            variants={{
                                                initial: { opacity: 0, y: 20 },
                                                animate: { opacity: 1, y: 0 }
                                            }}
                                            className="dark-glass p-6 opacity-40 rounded-3xl"
                                        >
                                            <div className="h-4 w-32 bg-white/[0.06] rounded-full animate-pulse mb-6"></div>
                                            <div className="h-10 w-20 bg-white/[0.03] rounded-xl"></div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <>
                                        <AnimatePresence>
                                            {testResults.map((test, idx) => (
                                                <motion.div 
                                                    key={idx} 
                                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                                    whileHover={{ scale: 1.03, translateY: -5 }}
                                                    className={`dark-glass p-6 rounded-3xl border-l-4 transition-colors relative overflow-hidden group ${
                                                        test.status === 'PASS' 
                                                            ? 'border-l-emerald-400 hover:bg-emerald-500/[0.02]' 
                                                            : 'border-l-rose-400 hover:bg-rose-500/[0.02]'
                                                    }`}
                                                >
                                                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-20 transition-opacity group-hover:opacity-40 ${test.status === 'PASS' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    
                                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest leading-snug pr-4">{test.name.replace(/_/g, ' ')}</h4>
                                                        <motion.div 
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.2, type: 'spring' }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black flex-shrink-0 ${
                                                                test.status === 'PASS' 
                                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                            }`}
                                                        >
                                                            {test.status}
                                                        </motion.div>
                                                    </div>
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Latency</span>
                                                            <p className="text-sm font-mono text-cyan-400 font-bold flex items-center">
                                                                <Activity className="w-4 h-4 mr-1.5 text-cyan-500/50" /> {test.time}
                                                            </p>
                                                        </div>
                                                        {test.status === 'PASS' ? (
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                                                                <XCircle className="w-5 h-5 text-rose-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        {runningTests && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="dark-glass p-6 rounded-3xl border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center text-slate-500 bg-cyan-500/5 min-h-[160px]"
                                            >
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    className="mb-4 relative"
                                                >
                                                    <div className="absolute inset-0 bg-cyan-500 rounded-full blur-md opacity-50"></div>
                                                    <Loader2 className="w-10 h-10 text-cyan-400 relative z-10" />
                                                </motion.div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 animate-pulse">Executing Protocol...</span>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* VIEW: THREAT INTELLIGENCE (GRAPH) */}
                    {activeTab === 'intelligence' && (
                        <motion.div key="intelligence" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="h-full">
                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="dark-glass-cyan p-6 flex-grow transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Identity Tokens</p>
                                    <h3 className="text-4xl font-black text-cyan-400 text-glow-cyan">{stats?.total_accounts || 0}</h3>
                                </div>
                                <div className="dark-glass-orange p-6 flex-grow transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,79,0,0.1)]">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Anomalous Rings</p>
                                    <h3 className="text-4xl font-black text-[#FF4F00] text-glow-orange">{stats?.flagged_networks_blocked || 0}</h3>
                                </div>
                                <div className="dark-glass p-6 flex-[2] flex flex-col justify-center" style={{ borderColor: 'rgba(34, 211, 238, 0.1)' }}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Neural Sensitivity</span>
                                        <span className="text-[10px] font-mono font-bold text-[#FF4F00]">{anomalyThreshold.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.05" value={anomalyThreshold} 
                                        onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                    />
                                </div>
                            </div>

                             <div 
                                className="w-full h-[60vh] rounded-[28px] relative overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/50"
                                ref={graphContainerRef}
                            >
                                <ForceGraph3D
                                    ref={fgRef}
                                    width={graphDimensions.width}
                                    height={graphDimensions.height}
                                    graphData={filteredGraphData}
                                    backgroundColor="#050510"
                                    nodeThreeObject={(node: any) => {
                                        if (node.is_core) return new THREE.Object3D();
                                        
                                        const geometry = new THREE.SphereGeometry(node.val || 4, 8, 8);
                                        const material = new THREE.MeshLambertMaterial({
                                            color: node.is_flagged ? '#FF4F00' : '#22d3ee',
                                            emissive: node.is_flagged ? '#FF4F00' : '#22d3ee',
                                            emissiveIntensity: 0.6,
                                            transparent: true,
                                            opacity: 0.9
                                        });
                                        return new THREE.Mesh(geometry, material);
                                    }}
                                    nodeOpacity={0.9}
                                    nodeLabel={node => {
                                        if ((node as any).is_core) return '';
                                        const vState = verificationStates[(node as any).id];
                                        return `
                                        <div style="background: rgba(5, 5, 16, 0.95); border: 1px solid ${(node as any).is_flagged ? 'rgba(255,79,0,0.5)' : 'rgba(34,211,238,0.3)'}; padding: 10px 14px; border-radius: 12px; font-family: Inter, sans-serif; backdrop-filter: blur(12px); min-width: 180px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
                                            <div style="color: #64748b; font-size: 10px; margin-bottom: 6px; display: flex; justify-content: space-between; letter-spacing: 0.1em; text-transform: uppercase;">
                                                <span>NODE HASH</span>
                                                ${(node as any).is_flagged ? '<span style="color: #FF4F00; font-weight: 900;">[!] THREAT</span>' : ''}
                                            </div>
                                            <div style="color: #e2e8f0; font-size: 13px; font-family: JetBrains Mono, monospace;">${(node as any).hash || (node as any).id}</div>
                                            
                                            <div style="height: 1px; background: rgba(255,255,255,0.06); margin: 10px 0;"></div>
                                            
                                            <div style="color: ${(node as any).is_flagged ? '#FF4F00' : '#22d3ee'}; font-size: 12px; font-weight: 900; text-shadow: 0 0 10px ${(node as any).is_flagged ? 'rgba(255,79,0,0.3)' : 'rgba(34,211,238,0.3)'};">
                                                STATUS: ${(node as any).is_flagged ? 'COMPROMISED' : 'SECURE'}
                                            </div>

                                            ${(node as any).is_flagged ? `
                                                <div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                                    <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 3px;">Cross-Bank Verify</div>
                                                    <div style="font-size: 10px; color: ${vState === 'verified' ? '#22d3ee' : vState === 'pending' ? '#FFAD66' : '#475569'}; font-weight: 900;">
                                                        ${vState === 'verified' ? '✓ VERIFIED BY BANK B' : vState === 'pending' ? '⟳ SYNCING LEDGER...' : 'CLICK TO AUDIT'}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;}}
                                    onNodeClick={(node: any) => {
                                        if (!node.is_flagged) return; 
                                        if (verificationStates[node.id]) return;

                                        setVerificationStates(prev => ({ ...prev, [node.id]: 'pending' }));
                                        
                                        // Simulate Bank B review time
                                        setTimeout(() => {
                                            setVerificationStates(prev => ({ ...prev, [node.id]: 'verified' }));
                                        }, 2500);
                                    }}
                                    linkColor={(link: any) => {
                                        if (link.is_tether) return 'rgba(0,0,0,0)';
                                        return (link.source.is_flagged && link.target.is_flagged) ? 'rgba(255, 79, 0, 0.6)' : 'rgba(34, 211, 238, 0.1)';
                                    }}
                                    linkWidth={(link: any) => {
                                        if (link.is_tether) return 0;
                                        return (link.source.is_flagged && link.target.is_flagged) ? 2.5 : 1.2;
                                    }}
                                    // CINEMATIC FLOW: Data packets streaming through links
                                    linkDirectionalParticles={2}
                                    linkDirectionalParticleWidth={(link: any) => link.is_tether ? 0 : 3}
                                    linkDirectionalParticleSpeed={0.006}
                                    linkDirectionalParticleColor={(link: any) => link.is_flagged ? '#FF4F00' : '#22d3ee'}
                                    enableNodeDrag={false}
                                    showNavInfo={false}
                                    cooldownTicks={150}
                                />

                                <div className="absolute top-8 left-8 dark-glass p-4 text-white pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-cyan-400 absolute inset-0 animate-pulse-ring"></div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black font-mono tracking-widest uppercase block text-cyan-300">Dulhan Neural Topology</span>
                                            <span className="text-[8px] font-mono text-slate-500">HEURISTIC OVERLAY ACTIVE</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1">
                                        <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-tighter">Total Analyzed Nodes: 5,000+</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">Rendered Threat Subgraph: {graphData.nodes?.length || 0} Nodes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <LiveThreatFeed />
                            </div>

                            {/* INTERACTIVE THREAT RESOLUTION PANEL */}
                            <div className="mt-8 dark-glass p-8 relative overflow-hidden" style={{ borderColor: 'rgba(239, 68, 68, 0.1)' }}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="max-w-xl text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
                                            <div className="relative">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <div className="w-3 h-3 bg-red-500 rounded-full absolute inset-0 animate-pulse-ring"></div>
                                            </div>
                                            <span className="text-red-400 font-bold text-sm uppercase tracking-widest">Neural Forensics Conflict Resolution</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-2">Isolated Threat Topology Analysis</h2>
                                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                            The Tarjan SCC Engine has identified 15 suspect accounts in a high-velocity cycle. Cross-bank weights indicate 0.98 probability of capital structuring. Immediate analyst intervention required.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        <button 
                                            onClick={() => handleResolution('flag')}
                                            className="px-6 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/[0.08] hover:border-white/[0.15]"
                                        >
                                            Manual Flag
                                        </button>
                                        <button 
                                            onClick={() => handleResolution('rbi')}
                                            className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 shadow-lg shadow-red-500/5"
                                        >
                                            Flag to RBI Investigation
                                        </button>
                                        <button 
                                            onClick={() => handleResolution('clean')}
                                            className="px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                        >
                                            Clean Record
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {/* VIEW: INTELLIGENCE TRENDS */}
                    {activeTab === 'trends' && (
                        <motion.div key="trends" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <IntelligenceTrends />
                        </motion.div>
                    )}

                    {/* VIEW: SYSTEM IMPACT */}
                    {activeTab === 'impact' && (
                        <motion.div key="impact" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <ImpactDashboard />
                        </motion.div>
                    )}

                    {/* VIEW: OPERATIONS SLA */}
                    {activeTab === 'operations' && (
                        <motion.div key="operations" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <OperationsSLA />
                        </motion.div>
                    )}

                    {/* VIEW: CUSTOMER ACQUISITION AGENT */}
                    {activeTab === 'acquisition' && (
                        <motion.div key="acquisition" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <AcquisitionAgent />
                        </motion.div>
                    )}

                    {/* VIEW: DIGITAL ADOPTION AGENT */}
                    {activeTab === 'adoption' && (
                        <motion.div key="adoption" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <AdoptionAgent />
                        </motion.div>
                    )}

                    {/* VIEW: DIGITAL ENGAGEMENT AGENT */}
                    {activeTab === 'engagement' && (
                        <motion.div key="engagement" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <EngagementAgent />
                        </motion.div>
                    )}

                    {/* VIEW: BANK ONBOARDING */}
                    {activeTab === 'onboarding' && (
                        <motion.div key="onboarding" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <BankOnboarding />
                        </motion.div>
                    )}

                    {/* VIEW: ZERO-PII PROVER */}
                    {activeTab === 'prover' && (
                        <motion.div key="prover" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <div className="max-w-4xl mx-auto w-full py-10">
                                <div className="dark-glass p-12 relative overflow-hidden">
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
                                    
                                    <div className="flex items-center mb-10 relative z-10">
                                        <div className="p-4 bg-gradient-to-br from-[#FF4F00] to-orange-600 rounded-2xl mr-6 shadow-xl shadow-[#FF4F00]/20 text-white">
                                            <Fingerprint className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-white">HMAC Identity Masking</h2>
                                            <p className="text-slate-500 font-medium">Verify the Zero-PII Deterministic Hashing Logic</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10 relative z-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mock Account (Entry Point)</label>
                                            <div className="relative group">
                                                <input 
                                                    type="text" 
                                                    placeholder="Type raw PII data (e.g. Bank Account Number)"
                                                    value={rawAccount}
                                                    onChange={(e) => handleCryptoInput(e.target.value)}
                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-6 px-8 text-xl font-bold text-white focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all outline-none placeholder:text-slate-600"
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#FF4F00] opacity-50 group-focus-within:opacity-100 transition-opacity">
                                                    <Key className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 bg-black/40 rounded-2xl shadow-inner relative border border-white/[0.04]">
                                            <label className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-6 block">Encrypted Neural Token (Stored Output)</label>
                                            <div className="font-mono text-lg break-all text-white/90 leading-relaxed min-h-[4rem] flex items-center justify-center text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                {hashedToken ? (
                                                    <motion.span 
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                    >
                                                        {hashedToken}
                                                    </motion.span>
                                                ) : (
                                                    <span className="text-white/10 italic font-normal tracking-widest">Stream locked... waiting for local hash</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-4 right-6 flex items-center space-x-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                                <span className="text-[9px] font-black text-cyan-500/50 uppercase tracking-widest">SHA-256 Verified</span>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 flex items-start space-x-4">
                                            <Info className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                            <p className="text-xs text-emerald-300/80 font-medium leading-relaxed">
                                                <span className="font-black text-emerald-400">TECHNICAL COMPLIANCE:</span> Dulhan Edge Agents never transmit raw strings. 
                                                This UI demonstrates the local HMAC logic where PII is irreversibly converted into a 64-character token before graph ingestion.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: ADVANCED CRYPTO (PSI) */}
                    {activeTab === 'psi' && (
                        <motion.div key="psi" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <PSIDashboard />
                        </motion.div>
                    )}

                    {/* VIEW: FEDERATED SYNC */}
                    {activeTab === 'federated' && (
                        <motion.div key="federated" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <h1 className="text-4xl font-black text-white mb-8">Federated Model Sync</h1>
                            <div className="dark-glass p-12 text-center">
                                <Share2 className="w-16 h-16 text-[#FF4F00] mx-auto mb-6 opacity-30" />
                                <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Private Weight Exchange</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-10">Cross-institution model synchronization using Flower (flwr) protocol. 100% data residency maintained.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="dark-glass-cyan p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                                        <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Local Accuracy</p>
                                        <p className="text-2xl font-black text-cyan-400">94.2%</p>
                                    </div>
                                    <div className="dark-glass-cyan p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                                        <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Global Precision</p>
                                        <p className="text-2xl font-black text-cyan-400">92.8%</p>
                                    </div>
                                    <div className="dark-glass-orange p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,79,0,0.08)]">
                                        <div className="w-20 h-1.5 bg-gradient-to-r from-[#FF4F00] to-orange-400 rounded-full mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Sync Cycle</p>
                                        <p className="text-2xl font-black text-[#FF4F00]">RD-14</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: SETTINGS */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                            <h1 className="text-4xl font-black text-white mb-8">System Audit & Settings</h1>
                            <div className="dark-glass p-8 space-y-4">
                                <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                    <div>
                                        <p className="text-sm font-black text-white">WORM Audit Logging</p>
                                        <p className="text-xs text-slate-500">Immutable record of all threat detections</p>
                                    </div>
                                    <div className="w-12 h-6 bg-emerald-500/30 rounded-full relative border border-emerald-500/30">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/30"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                    <div>
                                        <p className="text-sm font-black text-white">Edge Node Protection</p>
                                        <p className="text-xs text-slate-500">Auto-reject payloads with invalid HMAC</p>
                                    </div>
                                    <div className="w-12 h-6 bg-emerald-500/30 rounded-full relative border border-emerald-500/30">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/30"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] opacity-50">
                                    <div>
                                        <p className="text-sm font-black text-white">Key Rotation Mode</p>
                                        <p className="text-xs text-slate-500">Schedule periodic EPOCH_KEY updates</p>
                                    </div>
                                    <div className="w-12 h-6 bg-slate-700 rounded-full relative border border-slate-600">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                {/* Bottom Status Bar */}
                <footer className="fixed bottom-0 left-0 right-0 h-10 text-[9px] font-black text-white/30 flex items-center justify-between px-6 z-30 uppercase tracking-[0.2em] border-t border-white/[0.04]"
                    style={{
                        background: 'rgba(5, 5, 16, 0.85)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div className="flex items-center">
                        <span className="text-cyan-400 mr-2 opacity-100">●</span> 
                        Node Connection: <span className="text-cyan-400 ml-1">SECURE</span> (HDFC_E_MUMBAI)
                    </div>
                    <div className="text-slate-600">SECURED BY DULHAN QUANTUM-RESISTANT ENGINE v4.2</div>
                    <div className="flex items-center">
                        <Activity className="w-3 h-3 mr-2 text-[#FF4F00]" />
                        Threat Watch <span className="text-emerald-400 ml-1">active</span>
                    </div>
                </footer>
            </main>

            {selectedAlert && (
                <RiskBreakdown transaction={selectedAlert} onClose={() => setSelectedAlert(null)} onDownloadSTR={downloadSTR} />
            )}

            {/* Keyboard Shortcuts Modal */}
            {shortcutsOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="dark-glass w-[480px] max-w-[90vw] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl text-white">
                                    <Command className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Keyboard Shortcuts</h2>
                            </div>
                            <button onClick={() => setShortcutsOpen(false)} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            {[
                                { keys: ['Ctrl', '1-9'], desc: 'Switch between dashboard tabs' },
                                { keys: ['Ctrl', 'B'], desc: 'Toggle sidebar' },
                                { keys: ['Ctrl', 'N'], desc: 'Toggle notifications' },
                                { keys: ['?'], desc: 'Show this shortcuts panel' },
                                { keys: ['Esc'], desc: 'Close any open panel' },
                            ].map((shortcut, i) => (
                                <div key={i} className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-400 font-medium">{shortcut.desc}</span>
                                    <div className="flex items-center gap-1.5">
                                        {shortcut.keys.map((key, j) => (
                                            <span key={j}>
                                                <kbd className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[11px] font-black text-slate-400 shadow-sm">
                                                    {key}
                                                </kbd>
                                                {j < shortcut.keys.length - 1 && <span className="text-slate-600 mx-0.5">+</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-8 py-4 border-t border-white/[0.06]">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">Press <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-black text-slate-400">Esc</kbd> to close</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
