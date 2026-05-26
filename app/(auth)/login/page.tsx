"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import RequestModal from "@/components/login/RequestModal";
import AnimatedModals from "@/components/login/AnimatedModals";

// --- Configuration Constants ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const LOGO_SRC = "/logos/ssilogo.png";

export default function LoginPage() {
  const { login } = useAuth();

  // --- Form State ---
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Animation/Flow State ---
  const [flowState, setFlowState] = useState({
    showTick: false,
    showWelcome: false,
  });

  // --- Request Modal State ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    name: "",
    phone: "",
    comment: "",
    idFile: null as File | null,
    error: "",
    isLoading: false
  });

  // --- Animations ---
  const iosSpring = {
    type: "spring" as const,
    stiffness: 500, 
    damping: 30,
    mass: 0.8
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
    }
  };

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");

      setIsLoading(false);
      setFlowState(prev => ({ ...prev, showTick: true, showWelcome: false }));
      login(data.user);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setIsLoading(false);
    }
  };

  const handleIDFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setRequestData(prev => ({ ...prev, error: `File size must be less than ${MAX_FILE_SIZE_MB}MB.`, idFile: null }));
    } else {
      setRequestData(prev => ({ ...prev, error: "", idFile: file }));
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestData(prev => ({ ...prev, error: "", isLoading: true }));

    if (!requestData.name || !requestData.phone) {
      setRequestData(prev => ({ ...prev, error: "Full Name and Phone Number are required.", isLoading: false }));
      return;
    }

    const formData = new FormData();
    formData.append("fullName", requestData.name);
    formData.append("phoneNumber", requestData.phone);
    formData.append("comment", requestData.comment);
    if (requestData.idFile) formData.append("idCard", requestData.idFile);

    try {
      const res = await fetch("/api/request-access", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit request.");

      alert("Your access request has been submitted successfully!");
      
      // Reset Form
      setShowRequestModal(false);
      setRequestData({
        name: "",
        phone: "",
        comment: "",
        idFile: null,
        error: "",
        isLoading: false
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setRequestData(prev => ({ ...prev, error: message, isLoading: false }));
    }
  };

  // --- Render Helpers ---
  const isInteracting = isLoading || flowState.showTick || flowState.showWelcome;

  const modalProps = { 
    isLoading, 
    showTick: flowState.showTick, 
    showWelcome: flowState.showWelcome, 
    username: credentials.username 
  };

  const requestModalProps = {
    showRequestModal, 
    setShowRequestModal, 
    requestName: requestData.name, 
    setRequestName: (name: string) => setRequestData(prev => ({ ...prev, name })),
    requestPhone: requestData.phone, 
    setRequestPhone: (phone: string) => setRequestData(prev => ({ ...prev, phone })),
    requestIDFile: requestData.idFile, 
    setRequestIDFile: (file: File | null) => setRequestData(prev => ({ ...prev, idFile: file })),
    requestComment: requestData.comment, 
    setRequestComment: (comment: string) => setRequestData(prev => ({ ...prev, comment })),
    requestError: requestData.error, 
    setRequestError: (error: string) => setRequestData(prev => ({ ...prev, error })),
    isRequestLoading: requestData.isLoading, 
    handleRequestAccess, 
    handleIDFileChange,
    MAX_FILE_SIZE_MB, 
    MAX_FILE_SIZE_BYTES
  };

  return (
    <div className="w-full max-w-[370px] mx-auto">
      <AnimatedModals {...modalProps} />

      {/* Mobile Header */}
      <div className="md:hidden mb-10 flex flex-col items-center justify-center text-center mt-4">
        <motion.div variants={itemVariants} className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)] border border-white/30 mb-4">
          <img 
            src={LOGO_SRC} 
            alt="SSI Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
        </motion.div>
        <motion.p variants={itemVariants} className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.15em]">
          SSI Studios
        </motion.p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, ease: [0.19, 1.0, 0.22, 1.0] }}
            className="mb-6 p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-600 text-[13.5px] font-semibold rounded-2xl text-center shadow-[0_10px_20px_rgba(239,68,68,0.15)]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleLogin} className="space-y-7">
        
        {/* Username Input */}
        <motion.div variants={itemVariants} className="space-y-2.5">
          <label className="text-[12px] font-bold text-[#64748B] ml-3 tracking-[0.1em] uppercase">Login ID</label>
          <div className="relative group">
            <input
              type="text"
              name="username"
              placeholder="Enter UserName / SSI-000"
              className="w-full bg-[#F4F5F8] text-[#1E293B] placeholder-[#94A3B8] border border-white/50 rounded-[22px] py-4 px-6 transition-all duration-400 text-[15px] font-medium outline-none shadow-[inset_4px_4px_10px_rgba(0,0,0,0.04),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] focus:bg-white focus:shadow-[0_10px_30px_rgba(0,122,255,0.15),inset_0_0_0_rgba(0,0,0,0)] focus:border-[#007AFF]/40"
              value={credentials.username}
              onChange={handleInputChange}
              disabled={isInteracting}
            />
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div variants={itemVariants} className="space-y-2.5">
          <label className="text-[12px] font-bold text-[#64748B] ml-3 tracking-[0.1em] uppercase">Password</label>
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••••"
              className="w-full bg-[#F4F5F8] text-[#1E293B] placeholder-[#94A3B8] border border-white/50 rounded-[22px] py-4 px-6 pr-14 transition-all duration-400 text-[15px] font-medium outline-none shadow-[inset_4px_4px_10px_rgba(0,0,0,0.04),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] focus:bg-white focus:shadow-[0_10px_30px_rgba(0,122,255,0.15),inset_0_0_0_rgba(0,0,0,0)] focus:border-[#007AFF]/40"
              value={credentials.password}
              onChange={handleInputChange}
              disabled={isInteracting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#007AFF] transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Actions Row */}
        <motion.div variants={itemVariants} className="flex items-center justify-between pt-8 pl-3">
          <button 
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="text-[14px] font-bold text-[#64748B] hover:text-[#007AFF] transition-colors cursor-pointer relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-0 after:left-0 after:bg-[#007AFF] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            New User? Request Access
          </button>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.08, y: -2, boxShadow: "0px 20px 40px -10px rgba(0, 122, 255, 0.6), inset 0px 2px 2px rgba(255,255,255,0.4)" }}
            whileTap={{ scale: 0.92, y: 2, boxShadow: "0px 5px 15px -5px rgba(0, 122, 255, 0.4), inset 0px 4px 6px rgba(0,0,0,0.3)" }}
            transition={iosSpring}
            type="submit"
            disabled={isInteracting}
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