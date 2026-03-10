// components/aminations/LoadingScreen.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";

interface LoadingScreenProps {
  redirectUrl: string;
}

// --- IOS SPRING PHYSICS ---
const iosSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ redirectUrl }) => {
  const [status, setStatus] = useState("Verifying credentials...");

  useEffect(() => {
    // Switch text halfway to make it feel responsive
    const timer = setTimeout(() => {
      setStatus("Redirecting...");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    window.location.href = redirectUrl;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F5F5F7]/80 backdrop-blur-3xl font-quicksand">
      
      {/* Central Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={iosSpring}
        className="w-[320px] flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] border border-white/50"
      >
        
        {/* Logo Icon (Pulsing) */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 bg-white rounded-[18px] flex items-center justify-center shadow-sm border border-slate-100 mb-6"
        >
          <Image 
            src="/logos/ssilogo.png" 
            alt="Loading Logo" 
            width={32} 
            height={32} 
            className="object-contain" 
          />
        </motion.div>

        {/* Header */}
        <h2 className="mb-6 text-[17px] font-bold tracking-tight text-slate-800">
          Accessing Workspace
        </h2>

        {/* IOS Gradient Progress Bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 1.2, 
              ease: [0.32, 0.72, 0, 1] // Apple's default ease
            }}
            onAnimationComplete={handleComplete}
          />
        </div>

        {/* Animated Status Text */}
        <div className="mt-5 h-5 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400"
            >
              {status}
            </motion.p>
          </AnimatePresence>
        </div>

      </motion.div>
      
      {/* Font Injection (Just in case it's not loaded globally) */}
      <style>{`
        .font-quicksand {
          font-family: 'Quicksand', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;