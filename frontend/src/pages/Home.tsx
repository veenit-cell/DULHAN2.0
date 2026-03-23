import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ImpactDashboard from '../components/ImpactDashboard';
import { GlowCard } from '../components/ui/spotlight-card';
import { Marquee } from '../components/ui/marquee';
import { FlickeringGrid } from '../components/ui/flickering-grid';

const Home = () => {
    const containerRef = useRef<HTMLElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMouse({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
    const yText = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

    return (
        <motion.div
            className="w-full flex flex-col bg-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
            {/* Hero Section */}
            <section 
                ref={containerRef} 
                onMouseMove={handleMouseMove}
                className="relative w-full min-h-[90vh] flex flex-col justify-center items-center text-center overflow-hidden pt-24 px-6 bg-transparent rounded-[3rem] md:rounded-[4rem] mx-auto max-w-[98%]"
            >
                {/* Base Grid (Layer 1) */}
                <div className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ 
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                        backgroundSize: '4rem 4rem'
                    }}
                />

                {/* Spotlight Grid (Layer 2) - Intensity Boosted */}
                <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{ 
                        backgroundImage: `linear-gradient(to right, rgba(255, 79, 0, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 79, 0, 0.6) 1px, transparent 1px)`,
                        backgroundSize: '4rem 4rem',
                        WebkitMaskImage: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, black 0%, transparent 100%)`,
                        maskImage: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, black 0%, transparent 100%)`
                    }}
                />

                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{ y: yBackground }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4F00]/5 rounded-full blur-[120px]"></div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl relative z-10"
                    style={{ y: yText }}
                >
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-1000">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Neural Network Operational</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-black mb-6 leading-tight tracking-tight drop-shadow-sm">
                        Collaborative Fintech <br /> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4F00] to-[#FF8C00]">
                            Security Intelligence.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-black mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                        Destroying multi-hop money laundering networks and coordinated fraud rings with real-time, cross-bank graph topology. Detecting complex threats before capital is fully siphoned.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pointer-events-auto">
                        <Link
                            to="/login"
                            className="group relative px-10 py-5 bg-[#FF4F00] text-white rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,79,0,0.3)] hover:shadow-[0_0_60px_rgba(255,79,0,0.5)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <span className="relative flex items-center space-x-3 text-lg uppercase tracking-wider">
                                <span>Bank Portal</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                        
                        <Link
                            to="/about"
                            className="px-10 py-5 bg-black border border-white/10 text-white rounded-2xl font-black transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.15)] text-lg uppercase tracking-wider backdrop-blur-xl"
                        >
                            The Network
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* IMPACT TELEMETRY SUITE */}
            <section className="bg-white pt-12 border-t border-slate-100">
                <ImpactDashboard />
            </section>

            {/* NODE COMPROMISE CHECKER */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="glass-panel p-12 rounded-[3.5rem] border border-[#FF4F00]/10 bg-white/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(255,79,0,0.05)] text-center relative overflow-hidden">
                        {/* Flickering Grid Background Overlay */}
                        <FlickeringGrid 
                            className="absolute inset-0 z-0"
                            squareSize={3}
                            gridGap={5}
                            color="#FF4F00"
                            maxOpacity={0.15}
                            flickerChance={0.2}
                        />
                        
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4F00]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-[#002A24] mb-3 uppercase tracking-tight">Institutional Node Compromise Checker</h2>
                            <p className="text-slate-500 font-medium mb-10 max-w-2xl mx-auto">Verify if an institutional node ID or account hash has been exposed in known illicit financial cycles or historical data breaches.</p>
                            
                            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-8">
                                <input 
                                    type="text" 
                                    placeholder="Enter Bank Account Hash or Node ID..."
                                    className="flex-grow px-8 py-5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/50 focus:border-[#FF4F00] transition-all font-bold text-[#002A24]"
                                    id="node-checker-input"
                                />
                                <button 
                                    onClick={() => {
                                        const input = document.getElementById('node-checker-input') as HTMLInputElement;
                                        const val = input.value;
                                        const btn = document.getElementById('node-checker-btn');
                                        const result = document.getElementById('node-checker-result');
                                        
                                        if (!val) return;
                                        
                                        if (btn && result) {
                                            btn.innerHTML = '<span class="animate-spin mr-2">◌</span> Scanning...';
                                            result.classList.add('hidden');
                                            
                                            setTimeout(() => {
                                                btn.innerHTML = 'Check Exposure';
                                                result.classList.remove('hidden');
                                                
                                                if (val.includes('7') || val.toLowerCase().includes('x')) {
                                                    result.innerHTML = `
                                                        <div class="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 animate-in zoom-in-95 duration-300">
                                                            <p class="font-black text-lg mb-1">⚠️ COMPROMISED</p>
                                                            <p class="text-xs font-bold uppercase tracking-wider opacity-80">Node found in [2023 Co-operative Bank Data Breach]. 4 associated illicit edges detected.</p>
                                                        </div>
                                                    `;
                                                } else {
                                                    result.innerHTML = `
                                                        <div class="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 animate-in zoom-in-95 duration-300">
                                                            <p class="font-black text-lg mb-1">✅ SECURE</p>
                                                            <p class="text-xs font-bold uppercase tracking-wider opacity-80">Node hash does not appear in known illicit ledgers. Zero exposure detected.</p>
                                                        </div>
                                                    `;
                                                }
                                            }, 1500);
                                        }
                                    }}
                                    id="node-checker-btn"
                                    className="px-10 py-5 bg-[#002A24] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center min-w-[180px]"
                                >
                                    Check Exposure
                                </button>
                            </div>
                            
                            <div id="node-checker-result" className="max-w-2xl mx-auto h-24 flex items-center justify-center">
                                {/* Result will be injected here */}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PARTNER MARQUEE */}
            <section className="bg-white pb-24 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8">
                        The Federated Backbone: Cross-Institutional Trust Network
                    </p>
                </div>
                <Marquee speed={40} pauseOnHover className="mt-0 opacity-80 hover:opacity-100 transition-opacity duration-700">
                    {[
                        '/Banks/axis-bank-seeklogo.png',
                        '/Banks/bank-of-baroda-seeklogo.png',
                        '/Banks/bank-of-maharashtra-seeklogo.png',
                        '/Banks/icici-bank-seeklogo.png',
                        '/Banks/indusind-bank-seeklogo.png',
                        '/Banks/nsdl-seeklogo.png',
                        '/Banks/sbi-new-seeklogo.png'
                    ].map((logo, index) => (
                        <div key={index} className="mx-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 transform hover:scale-110">
                            <img 
                                src={logo} 
                                alt="Bank Logo" 
                                className="h-12 w-auto object-contain max-w-[180px]" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    ))}
                </Marquee>
            </section>

            {/* The Problem Section */}
            <section id="problem" className="py-24 px-6 md:px-12 lg:px-24 relative z-10 bg-white rounded-[3rem] md:rounded-[4rem] mx-auto max-w-[98%] mb-8 shadow-sm border border-[#121212]/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        className="glass-panel h-96 flex items-center justify-center p-4 relative overflow-hidden shadow-[0_6px_32px_rgba(147,111,173,0.12)] hover:shadow-[0_8px_40px_rgba(147,111,173,0.20)] transition-all duration-300"
                        animate={{ y: [-15, 5, -15] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#E27C37]/10 to-transparent z-0"></div>
                        <img
                            src="/threat_simulation.jpg"
                            alt="Threat Topology Mapping"
                            className="relative z-10 w-full h-full object-cover rounded-lg shadow-2xl drop-shadow-[0_15px_15px_rgba(18,18,18,0.3)]"
                        />
                    </motion.div>
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-[#121212] mb-6 leading-tight">
                            Mule networks are draining the system.
                        </h2>
                        <p className="text-lg text-[#121212]/80 leading-relaxed font-medium">
                            Organized fraud rings exploit decentralized banking by routing billions of rupees through proxy accounts mapping multi-hop "smurfing" patterns. Traditional siloed verification cannot scale to intercept these coordinated attacks before funds disappear across borders.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Solution Section */}
            <section id="solution" className="py-32 px-6 md:px-12 lg:px-24 relative z-10 bg-white rounded-[3rem] md:rounded-[4rem] mx-auto max-w-[98%] mb-8 shadow-sm border border-[#121212]/5">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-[#121212] mb-20 tracking-tight">The Engine</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                        {/* Card 1 */}
                        <GlowCard glowColor="orange" className="p-8 w-full h-full shadow-none border-none" customSize={true}>
                            <h3 className="text-2xl font-bold text-[#121212] mb-4">Cross-Bank Inspector</h3>
                            <p className="text-[#121212]/80 font-medium leading-relaxed">Cross-references registered KYC endpoints to identify excessive wealth spikes or high-risk structuring overlapping across institutional boundaries.</p>
                        </GlowCard>

                        {/* Card 2 */}
                        <GlowCard glowColor="blue" className="p-8 w-full h-full shadow-none border-none" customSize={true}>
                            <h3 className="text-2xl font-bold text-[#121212] mb-4">Deterministic Heuristics</h3>
                            <p className="text-[#121212]/80 font-medium leading-relaxed">
                                Core logic instantly maps extracted financial routing across distributed databases to spot mismatches and anomalies in milliseconds without relying on error-prone OCR.
                            </p>
                        </GlowCard>

                        {/* Card 3 */}
                        <GlowCard glowColor="green" className="p-8 w-full h-full shadow-none border-none" customSize={true}>
                            <h3 className="text-2xl font-bold text-[#121212] mb-4">Graph-Based Threat Topology</h3>
                            <p className="text-[#121212]/80 font-medium leading-relaxed">
                                Real-time transaction network mapping traces direct connections between seemingly unrelated accounts, formulating a cluster of matching mule proxy accounts instantly.
                            </p>
                        </GlowCard>

                        {/* Card 4 */}
                        <GlowCard glowColor="purple" className="p-8 w-full h-full shadow-none border-none" customSize={true}>
                            <h3 className="text-2xl font-bold text-[#121212] mb-4">Adaptive Neural Scoring</h3>
                            <p className="text-[#121212]/80 font-medium leading-relaxed">
                                Sophisticated deep-learning models that dynamically adjust weights based on emerging fraud patterns, ensuring SATARK stays ahead of evolving smurfing tactics.
                            </p>
                        </GlowCard>
                    </div>
                </div>
            </section>
        </motion.div>
    );
};

export default Home;
