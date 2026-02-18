"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoSrc = "/logos/ssilogo.png";

  // Explicitly typing this as a tuple so TypeScript knows it's a valid Framer Motion easing curve
  const premiumEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.9,
        ease: premiumEase,
        when: "beforeChildren"
      }
    }
  };

  const leftPanelVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: premiumEase } }
  };

  // The sliding panel now uses a frictionless tween rather than a bouncy spring
  const rightPanelVariants: Variants = {
    hidden: { x: "-100%" },
    visible: { 
      x: 0,
      transition: { 
        duration: 0.85,
        ease: premiumEase,
        delay: 0.15, // Perfect micro-delay after the main card appears
        when: "beforeChildren",
        staggerChildren: 0.08, // Staggers the form items beautifully
        delayChildren: 0.3 // Waits for the panel to slide out before showing inputs
      }
    }
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F2F2F7] p-4 font-sans antialiased relative overflow-hidden">
      
      {/* IOS DYNAMIC WALLPAPER BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] via-[#5856D6] to-[#AF52DE] opacity-90" />
         <motion.div 
           animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
           transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-white/20 rounded-full blur-[120px] mix-blend-overlay"
         />
         <motion.div 
           animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
           className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-[100px] mix-blend-overlay"
         />
      </div>

      {/* THE MAIN CARD */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative flex w-full max-w-[960px] h-[600px] sm:h-[580px] rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden z-10"
      >
        
        {/* LEFT PANEL: Z-Index 20 keeps it completely on top of the sliding form */}
        <motion.div variants={leftPanelVariants} className="hidden md:flex flex-col justify-between w-[45%] h-full relative overflow-hidden group z-20 shadow-[15px_0_40px_-10px_rgba(0,0,0,0.15)]">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl backdrop-saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
          <div className="absolute inset-0 border-r border-white/20" />

          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            <motion.div variants={textVariants} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/25 rounded-[14px] flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                <img 
                  src={logoSrc} 
                  alt="SSI Logo" 
                  className="w-7 h-7 object-contain drop-shadow-sm"
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white/90">SSI Studios</span>
            </motion.div>

            <div className="mb-6">
              <motion.div variants={textVariants} className="mb-6">
                <p className="text-lg text-white/80 font-medium mb-1 tracking-wide">Welcome to</p>
                <h1 className="text-5xl font-bold leading-[1.1] tracking-tighter drop-shadow-sm mb-4">
                  SSI Studios
                </h1>
                <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full shadow-lg">
                  <span className="text-white text-[11px] font-bold tracking-widest uppercase opacity-90">
                    Creative Operations
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL WRAPPER: The overflow-hidden mask. 
            This forces the form to emerge precisely from the seam without showing its curves early. */}
        <div className="w-full md:w-[55%] h-full relative z-10 overflow-hidden bg-[#F8F9FE] md:bg-transparent">
          <motion.div 
            variants={rightPanelVariants}
            className="w-full h-full bg-[#F8F9FE] md:bg-white/90 backdrop-blur-xl flex flex-col justify-center px-6 md:px-14 py-10 relative"
          >
            {children}
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}