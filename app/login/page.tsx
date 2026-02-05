"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react"; // Using Lucide icons to match the new design
import { useAuth } from "@/contexts/AuthContext"; 
import RequestModal from "@/components/login/RequestModal";
import AnimatedModals from "@/components/login/AnimatedModals";

export default function LoginLayout() {
  const { login } = useAuth();

  // --- STATE MANAGEMENT (From Old Code) ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Request Modal State ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestIDFile, setRequestIDFile] = useState<File | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  
  // LOGO PATH: Ensure this file exists at /public/logos/ssilogo.png
  const logoSrc = "/logos/ssilogo.png";

  // --- HANDLERS (From Old Code) ---

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

      if (!res.ok) throw new Error(data.message || "Login failed. Please try again.");

      // Success Animation Sequence
      setTimeout(() => {
        setIsLoading(false);
        setShowTick(true);

        setTimeout(() => {
          setShowTick(false);
          setShowWelcome(true);

          setTimeout(() => {
            setShowWelcome(false);
            login(data.user); // Final login action
          }, 2000);
        }, 1000);
      }, 1500);
    } catch (err: any) {
      console.error("API Error Response:", err);
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

    // Basic validation
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

      if (!res.ok) throw new Error(data.message || "Failed to submit request. Please try again.");

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

  // Props for Modals
  const modalProps = { isLoading, showTick, showWelcome, username };
  
  // Props for RequestModal
  const requestModalProps = {
    showRequestModal, setShowRequestModal, requestName, setRequestName,
    requestPhone, setRequestPhone, requestIDFile, setRequestIDFile,
    requestComment, setRequestComment, requestError, setRequestError,
    isRequestLoading, handleRequestAccess, handleIDFileChange,
    MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#5B86E5] to-[#36D1DC] p-4 font-sans antialiased relative">
      
      {/* Include the Animated Modals (Success/Welcome) */}
      <AnimatedModals {...modalProps} />

      {/* Main Card Container - Fixed Aspect Ratio & Rounded Corners */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex w-full max-w-[950px] h-[550px] bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        
        {/* LEFT SIDE: Glass/Gradient Panel */}
        <div className="hidden md:flex flex-col justify-between w-[45%] h-full relative overflow-hidden">
          
          {/* Background Gradient matching the reference */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#6baaff] to-[#4facfe]" />
          
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

          {/* Decorative faint circle in background */}
          <div className="absolute -top-20 -left-20 w-80 h-80 border-[40px] border-white/10 rounded-full blur-sm" />

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col justify-between h-full p-10 text-white">
            
            {/* Header / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <img 
                  src={logoSrc} 
                  alt="SSI Logo" 
                  className="w-6 h-6 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              </div>
              <span className="text-xl font-bold tracking-wide drop-shadow-sm">SSI Studios</span>
            </div>

            {/* Bottom Welcome Text */}
            <div className="mb-4">
              <p className="text-blue-50 text-sm font-medium mb-1 opacity-90">Welcome to,</p>
              <h1 className="text-4xl font-bold leading-tight drop-shadow-md mb-2">
                SSI Studios
              </h1>
              <p className="text-blue-100 text-xs font-light tracking-wide opacity-80 uppercase">
                Team Creative Operations
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Clean White Form */}
        <div className="w-full md:w-[55%] h-full bg-white flex flex-col justify-center px-12 py-10 relative">
          
          <div className="w-full max-w-[380px] mx-auto">
            {/* Mobile Header (Only visible on small screens) */}
            <div className="md:hidden mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">SSI Studios</h2>
              <p className="text-gray-500 text-xs uppercase mt-1">Team Creative Operations</p>
            </div>

            {/* Error Message Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Login ID Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 ml-1">Login ID</label>
                <input
                  type="text"
                  placeholder="Enter Mail ID / SSI - 000"
                  className="w-full bg-[#F3F4F6] text-gray-700 placeholder-gray-400 border-none rounded-2xl py-4 px-5 
                             focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-sm outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || showTick || showWelcome}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full bg-[#F3F4F6] text-gray-700 placeholder-gray-400 border-none rounded-2xl py-4 px-5 pr-12
                               focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all duration-200 text-sm outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || showTick || showWelcome}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex items-center justify-between pt-8">
                {/* Forgot Password Link - Triggers Request Modal */}
                <button 
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                >
                  Forgot Password?
                </button>

                {/* Circular Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading || showTick || showWelcome}
                  className="w-14 h-14 bg-[#4facfe] hover:bg-[#3b9eff] rounded-full flex items-center justify-center text-white 
                             shadow-[0_8px_20px_rgba(79,172,254,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={24} strokeWidth={2.5} />
                  )}
                </motion.button>
              </div>

            </form>
          </div>
        </div>

      </motion.div>

      {/* Request Access Modal */}
      <RequestModal {...requestModalProps} />
    </div>
  );
}
