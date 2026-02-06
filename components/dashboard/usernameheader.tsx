"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Clock } from "lucide-react";

// --- Typography ---
const fontHeading = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const fontBody = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

// --- SLOW DYNAMIC ISLAND PHYSICS ---
// mass: 1.5 adds weight (slower start/end)
// stiffness: 80 makes the movement gentle
// damping: 20 prevents excessive bouncing
const dynamicIslandSlowSpring = {
  type: "spring" as const,
  stiffness: 80, 
  damping: 20,
  mass: 1.5,
};

// --- Helper Functions ---
function capitalizeFirstLetter(name: string): string {
  if (!name) return "User";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// --- Components ---
const WavingAnimeCharacter = () => {
  const blinkControls = useAnimation();

  useEffect(() => {
    let mounted = true;
    const blinkLoop = async () => {
      while (mounted) {
        await blinkControls.start({ scaleY: 0.1, transition: { duration: 0.05 } });
        await blinkControls.start({ scaleY: 1, transition: { duration: 0.1 } });
        await new Promise((res) => setTimeout(res, Math.random() * 3000 + 2000));
      }
    };
    blinkLoop();
    return () => { mounted = false; };
  }, [blinkControls]);

  return (
    <motion.div
      className="absolute h-10 w-10 pointer-events-none"
      style={{ top: "-22px", left: "10px", zIndex: 10 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 12, stiffness: 100, delay: 1.2 }} // Delayed further for the slow open
    >
      <motion.svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <motion.rect x="20" y="28" width="60" height="8" rx="4" fill="#1e293b" />
        <motion.path d="M50,20 Q60,10 70,20 L65,30 Q60,40 50,35 Q40,40 35,30 L30,20 Q40,10 50,20" fill="#f3a745" />
        <motion.g animate={blinkControls}>
          <motion.circle cx="43" cy="45" r="4" fill="#1e293b" />
          <motion.circle cx="57" cy="45" r="4" fill="#1e293b" />
        </motion.g>
        <motion.path d="M45,55 Q50,62 55,55" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <motion.path
          d="M70,60 C75,55 80,50 75,45"
          stroke="#f3a745"
          strokeWidth="12"
          strokeLinecap="round"
          animate={{ rotate: [0, 8, -4, 8, 0], y: [0, -1, 1, -1, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 1 }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default function UserHeader() {
  const { user } = useAuth();
  const displayName = capitalizeFirstLetter(user?.username || "Guest");
  const [showTooltip, setShowTooltip] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateString = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const greeting = getGreeting(currentDate.getHours());

  if (!mounted) return null;

  return (
    <div className={`w-full max-w-[1200px] mx-auto mb-8 px-4 flex justify-center ${fontBody.className}`}>
      
      <motion.div
        layout
        initial={{ 
            width: "100px",
            height: "40px",
            borderRadius: "50px",
            opacity: 0,
            y: -40,
            filter: "blur(10px)"
        }}
        animate={{ 
            width: "100%",
            height: "auto",
            borderRadius: "36px",
            opacity: 1,
            y: 0,
            filter: "blur(0px)"
        }}
        transition={dynamicIslandSlowSpring}
        className="relative bg-white/70 backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/50 ring-1 ring-black/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

        {/* Inner Content - Fades in slowly after the expansion is well underway */}
        <motion.div 
            className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 p-6 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }} 
        >
          
          <div className="flex items-center gap-5 w-full md:w-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="hidden sm:flex w-14 h-14 flex-shrink-0 rounded-[18px] bg-gradient-to-b from-white to-slate-50 border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)] items-center justify-center text-slate-700 font-bold text-xl cursor-pointer"
            >
              {displayName.charAt(0)}
            </motion.div>

            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                 <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">
                    Dashboard
                 </span>
              </div>
              
              <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center ${fontHeading.className}`}>
                {greeting}, 
                <span className="relative ml-2 text-slate-900">
                  <div className="hidden sm:block">
                    <WavingAnimeCharacter />
                  </div>
                  {displayName}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            <div className="hidden md:flex flex-col items-end mr-1">
                 <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/50 border border-white/60 rounded-xl shadow-sm backdrop-blur-md whitespace-nowrap">
                    <Clock size={15} className="text-slate-500" />
                    <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
                        {timeString}
                    </span>
                    <span className="w-px h-3.5 bg-slate-300 mx-0.5"></span>
                    <span className="text-[13px] font-medium text-slate-500">
                        {dateString}
                    </span>
                 </div>
            </div>

            <motion.div
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.9)", scale: 1.02 }}
              className="relative hidden sm:flex items-center gap-2 px-3 py-2 bg-white/40 border border-white/60 rounded-xl cursor-pointer transition-all shadow-sm"
              onHoverStart={() => setShowTooltip(true)}
              onHoverEnd={() => setShowTooltip(false)}
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </div>
              <span className="text-xs font-semibold text-slate-600">Active</span>

              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-[-35px] right-0 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg whitespace-nowrap shadow-xl z-20"
                  >
                    All Systems Operational
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "#0f172a" }}
                whileTap={{ scale: 0.98 }}
                className="h-10 px-5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-900/10 cursor-pointer border border-transparent hover:border-slate-700 transition-all whitespace-nowrap"
            >
              + New Project
            </motion.button>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}