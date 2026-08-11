import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const DarkModeToggle = () => {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('dulhan_dark_mode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('dulhan_dark_mode', String(dark));
    }, [dark]);

    return (
        <button
            onClick={() => setDark(!dark)}
            className="relative p-2.5 rounded-xl hover:bg-[#002A24]/5 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <motion.div
                key={dark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
            >
                {dark ? (
                    <Moon className="w-5 h-5 text-amber-400" />
                ) : (
                    <Sun className="w-5 h-5 text-slate-500" />
                )}
            </motion.div>
        </button>
    );
};

export default DarkModeToggle;
