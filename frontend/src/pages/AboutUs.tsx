import { motion } from 'framer-motion';

const teamMembers = [
    {
        name: "Himanshu Patil",
        role: "System Architecture & Backend",
        description: "Engineered the high-throughput asynchronous FastApi pipeline and the core Graph-Network anomaly detection logic.",
        image: "/himanshupatil.png"
    },
    {
        name: "Aarya Maurya",
        role: "Frontend Engineering",
        description: "Crafted the immersive, glassmorphic UI and interactive data visualization interfaces.",
        image: "/aaryamaurya.png"
    },
    {
        name: "Soham Shirke",
        role: "Database & Data Structuring",
        description: "Designed the concurrent WAL-enabled databases and synthetic transaction architectures.",
        image: "/sohamshirke.png"
    },
    {
        name: "Saksham Jaiswal",
        role: "Scripting & Motion",
        description: "Developed the seamless framer-motion transitions, loading animations, and dynamic UI interactions.",
        image: "/sakshamjaiswal.png"
    }
];

const AboutUs = () => {
    return (
        <div className="w-full flex justify-center items-center py-20 px-4 md:px-8 mt-12 mb-24 min-h-screen">
            <div className="max-w-6xl w-full flex flex-col items-center">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl md:text-7xl font-black text-[#121212] mb-6 tracking-tight">The Architects</h1>
                    <div className="w-24 h-1 bg-[#E27C37] mx-auto rounded-full mb-8"></div>
                    
                    <p className="text-sm md:text-base text-[#121212]/70 max-w-2xl mx-auto font-medium leading-relaxed italic">
                        "To break the silos of modern banking. Satark provides edge-powered, cryptographic threat intelligence, allowing financial institutions to collaboratively destroy multi-hop money laundering networks without compromising user privacy."
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="flex flex-col items-center text-center"
                        >
                            <motion.div 
                                className="w-48 h-48 mb-6 rounded-2xl overflow-hidden glass-panel p-2 flex items-center justify-center bg-white/40 shadow-[0_15px_30px_rgba(0,0,0,0.1)]"
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 5 + (index % 2), repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img 
                                    src={member.image} 
                                    alt={member.name} 
                                    className="w-full h-full object-cover rounded-xl filter drop-shadow-md brightness-95"
                                    onError={(e) => {
                                        // Fallback if image doesn't exist yet
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${member.name.replace(' ', '+')}&background=006C67&color=fff&size=200`;
                                    }}
                                />
                            </motion.div>
                            
                            <h3 className="text-2xl font-black text-[#121212] tracking-tight">{member.name}</h3>
                            <p className="text-[#006C67] font-bold text-sm uppercase tracking-widest mt-1 mt-2 mb-4">{member.role}</p>
                            <p className="text-[#121212]/70 text-sm font-medium leading-relaxed px-2">
                                {member.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AboutUs;
