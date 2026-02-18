"use client";

import React, { useEffect } from "react";
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

  // --- THE DOM NUKER (Professional Edition) ---
  useEffect(() => {
    // 1. Professional Console Message
    console.clear(); 
    console.log(
      "%cSSI Studios | Security Alert", 
      "color: #007AFF; font-size: 24px; font-weight: 800; font-family: sans-serif;"
    );
    console.log(
      "%cDeveloper tools are restricted in this environment.", 
      "color: #64748B; font-size: 16px; font-family: sans-serif;"
    );

    // 2. The "Self-Destruct" DOM Replacement
    const blockStalkers = () => {
      const threshold = 160; 
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        document.body.innerHTML = `
          <div style="height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; background-color: #000; position: relative; overflow: hidden; font-family: sans-serif;">
            
            <style>
              .dev-btn {
                margin-top: 2rem;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 28px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                color: white;
                text-decoration: none;
                font-size: 0.95rem;
                font-weight: 500;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                letter-spacing: 0.02em;
              }
              .dev-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.6);
              }
            </style>

            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom right, #0F172A, #1E293B, #334155); opacity: 1;"></div>
            
            <div style="position: relative; z-index: 10; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); padding: 4rem 5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5); text-align: center; color: white; max-width: 90%;">
              <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: -0.02em; margin-top: 0;">Access Restricted</h1>
              <p style="font-size: 1.1rem; font-weight: 400; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.6;">Developer tools are disabled for security reasons.<br>Please return to the standard view.</p>
              
              <a href="https://www.linkedin.com/in/puneet-shukla-72b915225/" target="_blank" rel="noopener noreferrer" class="dev-btn">
                <span>Contact Developer</span>
              </a>

            </div>
          </div>
        `;
      }
    };

    const intervalId = setInterval(blockStalkers, 500);
    return () => clearInterval(intervalId);
  }, []);
  // ----------------------------------------

  // Explicit type definition for Cubic Bezier tuple
  const fastEase: [number, number, number, number] = [0.19, 1.0, 0.22, 1.0];

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: fastEase,
      },
    },
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "linear",
        delay: 0.1,
      },
    },
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center bg-[#F2F2F7] p-4 antialiased relative overflow-hidden ${manrope.className}`}>
      
      {/* IOS DYNAMIC WALLPAPER BACKGROUND */}
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
        
        {/* 1. FULL WIDTH GLASS BASE (Z-0) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl backdrop-saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent opacity-60" />
          <div className="absolute inset-0 rounded-[48px] border border-white/20" />
        </div>

        {/* 2. SLIDING WHITE CARD (Z-10) */}
        <motion.div 
          variants={contentVariants}
          className="absolute inset-y-0 right-0 w-full md:w-[55%] h-full bg-[#F8F9FE] md:bg-white flex flex-col justify-center px-6 md:px-14 py-10 z-10 md:rounded-l-[44px] md:rounded-r-[48px] border-l border-white/80 shadow-[-10px_0_40px_rgba(0,0,0,0.08)] will-change-transform"
        >
          {children}
        </motion.div>

        {/* 3. LEFT CONTENT AREA (Z-20) */}
        <motion.div variants={contentVariants} className="hidden md:flex flex-col justify-between absolute inset-y-0 left-0 w-[45%] h-full p-12 text-white z-20 pointer-events-none">
          
          <div className="flex items-center gap-3 pointer-events-auto">
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
          </div>

          <div className="mb-6 pointer-events-auto">
            <div className="mb-6">
              <p className="text-lg text-white/90 font-medium mb-1.5 tracking-wide drop-shadow-sm">Welcome to</p>
              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tighter drop-shadow-md mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80">
                SSI Studios
              </h1>
              <div className="inline-flex items-center px-5 py-2 bg-white/20 backdrop-blur-xl border border-white/40 rounded-full shadow-xl">
                <span className="text-white text-[11px] font-bold tracking-[0.2em] uppercase opacity-95">
                  Creative Operations
                </span>
              </div>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}