"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import localFont from "next/font/local";

const manrope = localFont({
  src: "../../../public/fonts/Manrope-VariableFont_wght.ttf",
  display: "swap",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoSrc = "/logos/ssilogo.png";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- THE PHYSICS ENGINE ---
  // FIX: Explicitly typed as a tuple of 4 numbers
  const ultraSmoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

  // 1. The Glass Container
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        when: "beforeChildren"
      }
    }
  };

  // 2. The Left Panel (Branding)
  const leftPanelVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        ease: "linear",
        when: "beforeChildren",
        staggerChildren: 0.05 
      } 
    }
  };

  // 3. THE WHITE CARD SLIDE (Optimized)
  const rightPanelVariants: Variants = {
    hidden: { 
      x: "-100%",     
      opacity: 0,     
    },
    visible: { 
      x: "0%",
      opacity: 1,
      transition: { 
        duration: 0.9,      
        ease: ultraSmoothEase, // Now types match correctly
        delay: 0.05,         
        when: "beforeChildren",
        staggerChildren: 0.05,
        delayChildren: 0.15
      }
    }
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ultraSmoothEase } }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center bg-[#F2F2F7] p-4 antialiased relative overflow-hidden ${manrope.className}`}>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] via-[#5856D6] to-[#AF52DE] opacity-90" />
         <motion.div 
           animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-white/20 rounded-full blur-[120px] mix-blend-overlay"
         />
         <motion.div 
           animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 0] }}
           transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
           className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-[100px] mix-blend-overlay"
         />
      </div>

      {/* THE MAIN CARD */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{ perspective: 1000 }}
        className="relative flex w-full max-w-[960px] h-[600px] sm:h-[580px] rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden z-10"
      >
        
        {/* 1. GLASS BASE */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl backdrop-saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent opacity-60" />
          <div className="absolute inset-0 rounded-[48px] border border-white/20" />
        </div>

        {/* 2. RIGHT PANEL (White Card) */}
        <div className={`absolute inset-y-0 right-0 w-full md:w-[55%] h-full z-10 ${!isMounted ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <motion.div 
            variants={rightPanelVariants}
            className="w-full h-full bg-[#F8F9FE] md:bg-white flex flex-col justify-center px-6 md:px-14 py-10 md:rounded-l-[44px] md:rounded-r-[48px] border-l border-white/80 shadow-[-10px_0_40px_rgba(0,0,0,0.08)] will-change-transform"
          >
            {children}
          </motion.div>
        </div>

        {/* 3. LEFT CONTENT AREA */}
        <motion.div variants={leftPanelVariants} className="hidden md:flex flex-col justify-between absolute inset-y-0 left-0 w-[45%] h-full p-12 text-white z-20 pointer-events-none">
          
          <motion.div variants={textVariants} className="flex items-center gap-3 pointer-events-auto">
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-13 h-13 bg-white/20 rounded-[16px] flex items-center justify-center backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/40 p-2.5"
            >
              <img 
                src={logoSrc} 
                alt="SSI Logo" 
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => (e.currentTarget.style.display = 'none')} 
              />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-white/95 drop-shadow-sm">SSI Studios</span>
          </motion.div>

          <div className="mb-6 pointer-events-auto">
            <motion.div variants={textVariants} className="mb-6">
              <p className="text-lg text-white/90 font-medium mb-1.5 tracking-wide drop-shadow-sm">Welcome to</p>
              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tighter drop-shadow-md mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80">
                SSI Studios
              </h1>
              <div className="inline-flex items-center px-5 py-2 bg-white/20 backdrop-blur-xl border border-white/40 rounded-full shadow-xl">
                <span className="text-white text-[11px] font-bold tracking-[0.2em] uppercase opacity-95">
                  Creative Operations
                </span>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}