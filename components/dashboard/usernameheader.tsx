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

// --- Physics (FIXED) ---
const appleSpring = {
  type: "spring" as const, // Added 'as const' to fix the TypeScript error
  stiffness: 260,
  damping: 28,
  mass: 1
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
      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.4 }}
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
  
  // Time State
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formats
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

  // Avoid hydration mismatch
  if (!mounted) return null;

  return (
    <motion.header
      className={`w-full max-w-[1200px] mx-auto mb-6 ${fontBody.className}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={appleSpring}
    >
      {/* --- GLASS CARD --- */}
      <div className="relative w-full bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] p-6 sm:px-8 overflow-hidden">
        
        {/* Subtle top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* LEFT: Greeting Section */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Avatar - Apple Style Squircle */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="hidden sm:flex w-14 h-14 rounded-[18px] bg-gradient-to-b from-white to-slate-50 border border-slate-200/60 shadow-sm items-center justify-center text-slate-600 font-bold text-xl cursor-pointer"
            >
              {displayName.charAt(0)}
            </motion.div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                 <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-400">
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

          {/* RIGHT: Time & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* 1. Date & Time Pill (macOS Menu Bar Style) */}
            <div className="flex flex-col items-end mr-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 border border-white/50 rounded-lg shadow-sm backdrop-blur-md">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                        {timeString}
                    </span>
                    <span className="w-px h-3 bg-slate-300 mx-0.5"></span>
                    <span className="text-xs font-medium text-slate-500">
                        {dateString}
                    </span>
                 </div>
            </div>

            {/* 2. Operational Status (Interactive) */}
            <motion.div
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.8)", scale: 1.02 }}
              className="relative hidden sm:flex items-center gap-2.5 px-4 py-2 bg-slate-50/40 border border-slate-200/60 rounded-2xl cursor-pointer transition-all"
              onHoverStart={() => setShowTooltip(true)}
              onHoverEnd={() => setShowTooltip(false)}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-600">Active</span>

              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-[-35px] right-0 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg whitespace-nowrap shadow-xl z-20"
                  >
                    System operational
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 3. New Project Button */}
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-10 px-5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 cursor-pointer"
            >
              + New Project
            </motion.button>
          </div>

        </div>
      </div>
    </motion.header>
  );
}