"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

interface AnimatedModalsProps {
  isLoading: boolean;
  showTick: boolean;
  showWelcome: boolean;
  username: string;
}

// --- ULTIMATE APPLE PHYSICS ---
const snappySpring = {
  type: "spring" as const,
  stiffness: 500, // Faster initial movement
  damping: 35,    // Smooth settlement
  mass: 0.8,      // Feels lighter/faster
};

const IOSSpinner = () => (
  <div className="relative w-10 h-10">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-full h-full left-0 top-0"
        style={{ rotate: `${i * 45}deg` }}
      >
        <motion.div
          className="w-1 h-3 bg-white rounded-full mx-auto"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear",
          }}
        />
      </motion.div>
    ))}
  </div>
);

export default function AnimatedModals({
  isLoading,
  showTick,
  showWelcome,
  username,
}: AnimatedModalsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isVisible = isLoading || showTick || showWelcome;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }}
        >
          {/* Backdrop with Hardware Acceleration */}
          <motion.div 
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* The Morphing Glass Card */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.2 } }}
            transition={snappySpring}
            className="relative bg-white/10 backdrop-blur-2xl border border-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden z-10 will-change-transform"
            style={{ borderRadius: 40 }} 
          >
            <motion.div
              layout="position"
              className="p-10 flex flex-col items-center justify-center min-w-[320px] min-h-[220px]"
            >
              <AnimatePresence mode="wait">
                
                {/* 1. VERIFYING CREDENTIALS */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <IOSSpinner />
                    <p className="text-white/90 font-semibold text-sm uppercase tracking-[0.15em] antialiased">
                      Authenticating
                    </p>
                  </motion.div>
                )}

                {/* 2. SUCCESS TICK */}
                {showTick && !isLoading && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={snappySpring}
                    className="flex flex-col items-center gap-4"
                  >
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-white text-[#007AFF] flex items-center justify-center shadow-xl shadow-blue-500/20"
                      animate={{ scale: [0.8, 1.1, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                        />
                      </svg>
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl">Verified</h3>
                    </div>
                  </motion.div>
                )}

                {/* 3. WELCOME PERSONALIZED */}
                {showWelcome && !showTick && !isLoading && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={snappySpring}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <motion.div 
                      className="w-24 h-24 rounded-full bg-gradient-to-tr from-white/20 to-white/5 backdrop-blur-md mb-2 border border-white/40 flex items-center justify-center overflow-hidden shadow-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                       {/* Placeholder for User Initials or Avatar */}
                       <span className="text-white text-3xl font-bold">{username.charAt(0).toUpperCase()}</span>
                    </motion.div>
                    
                    <div className="space-y-1">
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        Hi, {username}
                      </h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.2 }}
                        className="text-white text-sm font-medium tracking-wide uppercase"
                      >
                        Setting up your space
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}