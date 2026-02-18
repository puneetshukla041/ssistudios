"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import RequestModal from "@/components/login/RequestModal";
import AnimatedModals from "@/components/login/AnimatedModals";

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestIDFile, setRequestIDFile] = useState<File | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const iosSpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
    mass: 0.8
  };

  // Fluid rise for the inputs
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25, filter: "blur(6px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 280, damping: 22, mass: 0.8 }
    }
  };

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
    if (requestIDFile) formData.append("idCard", requestIDFile);

    try {
      const res = await fetch("/api/request-access", { method: "POST", body: formData });
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
    <div className="w-full max-w-[370px] mx-auto">
      <AnimatedModals {...modalProps} />

      {/* Mobile Header */}
      <div className="md:hidden mb-10 flex flex-col items-center justify-center text-center mt-4">
        <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)] border border-white/30 mb-4">
          <img 
            src="/logos/ssilogo.png" 
            alt="SSI Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
        </div>
        <p className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.15em]">
          SSI Studios
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.19, 1.0, 0.22, 1.0] }}
            className="mb-6 p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-600 text-[13.5px] font-semibold rounded-2xl text-center shadow-[0_10px_20px_rgba(239,68,68,0.15)]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleLogin} className="space-y-7">
        
        {/* PHYSICS: Concave Inputs. Dark inset shadow + White opposite inset creates a "carved out" look */}
        <motion.div variants={itemVariants} className="space-y-2.5">
          <label className="text-[12px] font-bold text-[#64748B] ml-3 tracking-[0.1em] uppercase">Login ID</label>
          <div className="relative group">
            <input
              type="text"
              placeholder="Enter Mail ID"
              className="w-full bg-[#F4F5F8] text-[#1E293B] placeholder-[#94A3B8] border border-white/50 rounded-[22px] py-4 px-6 transition-all duration-400 text-[15px] font-medium outline-none shadow-[inset_4px_4px_10px_rgba(0,0,0,0.04),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] focus:bg-white focus:shadow-[0_10px_30px_rgba(0,122,255,0.15),inset_0_0_0_rgba(0,0,0,0)] focus:border-[#007AFF]/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || showTick || showWelcome}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2.5">
          <label className="text-[12px] font-bold text-[#64748B] ml-3 tracking-[0.1em] uppercase">Password</label>
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              className="w-full bg-[#F4F5F8] text-[#1E293B] placeholder-[#94A3B8] border border-white/50 rounded-[22px] py-4 px-6 pr-14 transition-all duration-400 text-[15px] font-medium outline-none shadow-[inset_4px_4px_10px_rgba(0,0,0,0.04),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] focus:bg-white focus:shadow-[0_10px_30px_rgba(0,122,255,0.15),inset_0_0_0_rgba(0,0,0,0)] focus:border-[#007AFF]/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || showTick || showWelcome}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#007AFF] transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-between pt-8 pl-3">
          <button 
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="text-[14px] font-bold text-[#64748B] hover:text-[#007AFF] transition-colors cursor-pointer relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-0 after:left-0 after:bg-[#007AFF] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            New User? Request Access
          </button>

          {/* PHYSICS: Convex Jewel Button. Gradient + Outer Colored Glow + Inner Top Highlight */}
          <motion.button
            whileHover={{ scale: 1.08, y: -2, boxShadow: "0px 20px 40px -10px rgba(0, 122, 255, 0.6), inset 0px 2px 2px rgba(255,255,255,0.4)" }}
            whileTap={{ scale: 0.92, y: 2, boxShadow: "0px 5px 15px -5px rgba(0, 122, 255, 0.4), inset 0px 4px 6px rgba(0,0,0,0.3)" }}
            transition={iosSpring}
            type="submit"
            disabled={isLoading || showTick || showWelcome}
            className="group w-16 h-16 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-full flex items-center justify-center text-white shadow-[0_12px_24px_rgba(0,122,255,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {isLoading ? (
              <div className="w-6 h-6 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={26} strokeWidth={2.5} className="relative z-10 transition-transform duration-300 ease-out group-hover:translate-x-1 drop-shadow-md" />
            )}
          </motion.button>
        </motion.div>

      </form>
      
      <RequestModal {...requestModalProps} />
    </div>
  );
}