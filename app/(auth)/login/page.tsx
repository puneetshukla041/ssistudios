"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react"; 
import { useAuth } from "@/contexts/auth-context"; 
import RequestModal from "@/components/features/auth/RequestModal";
import AnimatedModals from "@/components/features/auth/AnimatedModals";

export default function LoginLayout() {
  const { login } = useAuth();

  // --- STATE ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Modal State ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestIDFile, setRequestIDFile] = useState<File | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  
  const logoSrc = "/logos/ssilogo.png";

  // --- IOS-STYLE ANIMATION PHYSICS ---
  const iosSpring = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 1.2
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(5px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");

      setTimeout(() => {
        setIsLoading(false);
        setShowTick(true);
        setTimeout(() => {
          setShowTick(false);
          setShowWelcome(true);
          setTimeout(() => {
            setShowWelcome(false);
            login(data.user); 
          }, 2000);
        }, 1000);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleIDFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setRequestError(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`);
      setRequestIDFile(null);
    } else {
      setRequestError("");
      setRequestIDFile(file);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setIsRequestLoading(true);

    if (!requestName || !requestPhone) {
      setRequestError("Full Name and Phone Number are required.");
      setIsRequestLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("fullName", requestName);
    formData.append("phoneNumber", requestPhone);
    formData.append("comment", requestComment);
    if (requestIDFile) {
      formData.append("idCard", requestIDFile);
    }

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit request.");

      alert("Your access request has been submitted successfully!");
      setShowRequestModal(false);
      setRequestName("");
      setRequestPhone("");
      setRequestIDFile(null);
      setRequestComment("");
      setIsRequestLoading(false);

    } catch (err: any) {
      console.error("API Error Response:", err);
      setRequestError(err.message);
      setIsRequestLoading(false);
    }
  };

  const modalProps = { isLoading, showTick, showWelcome, username };
  const requestModalProps = {
    showRequestModal, setShowRequestModal, requestName, setRequestName,
    requestPhone, setRequestPhone, requestIDFile, setRequestIDFile,
    requestComment, setRequestComment, requestError, setRequestError,
    isRequestLoading, handleRequestAccess, handleIDFileChange,
    MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES
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

      <AnimatedModals {...modalProps} />

      {/* --- THE IPHONE COMFORT CARD --- */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative flex w-full max-w-[960px] h-[580px] rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden z-10"
      >
        
        {/* LEFT PANEL: The "Vision Pro" Glass Look */}
        <div className="hidden md:flex flex-col justify-between w-[45%] h-full relative overflow-hidden group">
          {/* Real Glass Stack */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl backdrop-saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
          
          {/* Subtle Border Gradient for 3D Edge effect */}
          <div className="absolute inset-0 border-r border-white/20" />

          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            
            {/* Logo Pill */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
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

            {/* Typography Section */}
            <div className="mb-6">
              <motion.div variants={itemVariants} className="mb-6">
                <p className="text-blue-100 text-base font-medium mb-2 tracking-wide opacity-80">Welcome Back</p>
                <h1 className="text-5xl font-bold leading-[1.1] tracking-tighter drop-shadow-sm mb-4">
                  SSI Studios
                </h1>
                
                {/* The "Pill" Badge */}
                <motion.div 
                  variants={itemVariants}
                  className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full shadow-lg"
                >
                  <span className="text-white text-[11px] font-bold tracking-widest uppercase opacity-90">
                    Team Creative Operations
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The "iOS Settings" Comfort Look */}
        <div className="w-full md:w-[55%] h-full bg-white/90 backdrop-blur-xl flex flex-col justify-center px-14 py-10 relative">
          
          <div className="w-full max-w-[360px] mx-auto">
            {/* Mobile Header */}
            <div className="md:hidden mb-10 text-center">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">SSI Studios</h2>
              <p className="text-slate-500 text-xs font-semibold uppercase mt-2 tracking-widest">Creative Ops</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6 p-4 bg-red-50/80 backdrop-blur-md border border-red-100 text-red-600 text-sm font-medium rounded-2xl text-center shadow-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-7">
              
              {/* Login Input Group */}
              <motion.div variants={itemVariants} className="space-y-2.5">
                <label className="text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">Login ID</label>
                <div className="relative group">
                   <input
                    type="text"
                    placeholder="Enter Mail ID / SSI - 000"
                    className="w-full bg-[#F2F2F7] text-slate-900 placeholder-slate-400/70 border-0 rounded-[22px] py-4 px-6 
                               focus:ring-[3px] focus:ring-[#007AFF]/20 focus:bg-white transition-all duration-300 text-[15px] font-medium shadow-inner"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading || showTick || showWelcome}
                  />
                </div>
              </motion.div>

              {/* Password Input Group */}
              <motion.div variants={itemVariants} className="space-y-2.5">
                <label className="text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full bg-[#F2F2F7] text-slate-900 placeholder-slate-400/70 border-0 rounded-[22px] py-4 px-6 pr-14
                               focus:ring-[3px] focus:ring-[#007AFF]/20 focus:bg-white transition-all duration-300 text-[15px] font-medium shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || showTick || showWelcome}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007AFF] transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </motion.div>

              {/* Footer Actions */}
              <motion.div variants={itemVariants} className="flex items-center justify-between pt-8 pl-2">
                <button 
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="text-sm font-medium text-slate-400 hover:text-[#007AFF] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>

                {/* The "Haptic" Button */}
                <motion.button
                  whileHover={{ scale: 1.08, boxShadow: "0px 10px 25px -5px rgba(0, 122, 255, 0.4)" }}
                  whileTap={{ scale: 0.92 }}
                  transition={iosSpring}
                  type="submit"
                  disabled={isLoading || showTick || showWelcome}
                  className="w-16 h-16 bg-gradient-to-tr from-[#007AFF] to-[#5856D6] rounded-full flex items-center justify-center text-white 
                             shadow-lg shadow-blue-500/30 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  {/* Subtle Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {isLoading ? (
                    <div className="w-6 h-6 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={26} strokeWidth={2.5} className="relative z-10" />
                  )}
                </motion.button>
              </motion.div>

            </form>
          </div>
        </div>

      </motion.div>

      <RequestModal {...requestModalProps} />
    </div>
  );
}