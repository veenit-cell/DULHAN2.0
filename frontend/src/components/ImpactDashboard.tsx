import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  ShieldAlert, 
  ShieldCheck, 
  Network, 
  Shapes,
  Activity
} from "lucide-react";
import { AnimatedGradient } from "./ui/animated-gradient-with-svg";

interface BentoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colors: string[];
  delay: number;
  icon: React.ReactNode;
  className?: string;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors,
  delay,
  icon,
  className
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className={`relative overflow-hidden h-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[#FF4F00]/10 group shadow-[0_8px_30px_rgb(255,79,0,0.08)] hover:shadow-[0_8px_40px_rgb(255,79,0,0.2)] transition-all duration-700 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatedGradient colors={colors} speed={0.03} blur="light" />
      <motion.div
        className="relative z-10 p-8 text-slate-900 h-full flex flex-col justify-end"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div 
            className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4F00]/5 border border-[#FF4F00]/10 backdrop-blur-md group-hover:scale-110 transition-transform duration-500 shadow-sm shadow-[#FF4F00]/20"
            variants={item}
        >
          {icon}
        </motion.div>
        
        <div>
            <motion.h3 
                className="text-xs font-black uppercase tracking-[0.2em] text-black mb-2" 
                variants={item}
            >
                {title}
            </motion.h3>
            <motion.p
                className="text-4xl md:text-5xl font-black mb-4 leading-none tracking-tighter text-[#002A24]"
                variants={item}
            >
                {value}
            </motion.p>
            {subtitle && (
                <motion.p 
                    className="text-sm font-medium text-[#FF4F00]/80 leading-relaxed max-w-[280px]" 
                    variants={item}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ImpactDashboard: React.FC = () => {
  return (
    <div className="w-full bg-transparent py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Telemetry Live</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-emerald-600 leading-[0.9] tracking-tight mb-4">
            Platform Impact <br />
            <span className="text-slate-600 uppercase text-3xl md:text-4xl">Heuristic Performance Suite</span>
          </h2>
          <p className="text-[#FF4F00]/60 font-medium text-lg leading-relaxed">
            Real-time visual quantification of SATARK's defensive posture across the federated banking network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <BentoCard
            title="Total Transaction Volume Monitored"
            value="₹4.2 Billion"
            subtitle="Across 3 simulated banking nodes in the current neural cluster."
            colors={["#2C33FF", "#1A1453", "#936FAD"]}
            delay={0.1}
            icon={<BarChart3 className="w-6 h-6 text-[#2C33FF]" />}
          />
        </div>
        
        <BentoCard
          title="Illicit Networks Flagged"
          value="142"
          subtitle="Multi-hop laundering rings isolated by the Tarjan SCC Engine."
          colors={["#ea580c", "#FF4F00", "#7B3FE0"]}
          delay={0.2}
          icon={<ShieldAlert className="w-6 h-6 text-[#ea580c]" />}
        />

        {/* NEW MENTOR METRICS */}
        <BentoCard
          title="Baseline Network (Non-Anomalous)"
          value="42,891 Nodes"
          subtitle="Verified legitimate institutional endpoints currently inactive in threat cycles."
          colors={["#00D68F", "#002A24", "#05040B"]}
          delay={0.3}
          icon={<ShieldCheck className="w-6 h-6 text-[#00D68F]" />}
        />

        <BentoCard
          title="Active Transacting Entities"
          value="18,442"
          subtitle="Live identities processing cross-institution payloads in the last 60 seconds."
          colors={["#2C33FF", "#002A24", "#05040B"]}
          delay={0.4}
          icon={<Activity className="w-6 h-6 text-[#2C33FF]" />}
        />

        <BentoCard
          title="Highest Density Hub"
          value="Node-X9B2"
          subtitle="142 Edges | Under Active Forensic Monitoring"
          colors={["#FF4F00", "#7B3FE0", "#05040B"]}
          delay={0.5}
          icon={<Network className="w-6 h-6 text-[#FF4F00]" />}
        />
        
        <BentoCard
          title="False Positive Reduction"
          value="94.2%"
          subtitle="Precision boost achieved using Isolation Forest ML heuristics."
          colors={["#00D68F", "#2C33FF", "#0B0B12"]}
          delay={0.6}
          icon={<ShieldCheck className="w-6 h-6 text-[#00D68F]" />}
        />
        
        <div className="md:col-span-2">
          <BentoCard
            title="Active Graph Nodes"
            value="50,000+"
            subtitle="Real-time identities ingested via Zero-PII HSM Hardware Hashes."
            colors={["#936FAD", "#E1ACF4", "#2C33FF"]}
            delay={0.7}
            icon={<Network className="w-6 h-6 text-[#936FAD]" />}
          />
        </div>
        
        <div className="md:col-span-3">
          <BentoCard
            title="Cross-Bank Intersections"
            value="18 High-Risk Overlaps"
            subtitle="Detected mathematically via PSI (Private Set Intersection) without exposing raw customer PII to the central SATARK kernel."
            colors={["#2C33FF", "#936FAD", "#05040B"]}
            delay={0.8}
            icon={<Shapes className="w-6 h-6 text-[#2C33FF]" />}
            className="min-h-[350px]"
          />
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
