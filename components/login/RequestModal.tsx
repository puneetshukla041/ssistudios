"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PaperAirplaneIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface RequestModalProps {
  showRequestModal: boolean;
  setShowRequestModal: (show: boolean) => void;
  requestName: string;
  setRequestName: (name: string) => void;
  requestPhone: string;
  setRequestPhone: (phone: string) => void;
  requestIDFile: File | null;
  setRequestIDFile: (file: File | null) => void;
  requestComment: string;
  setRequestComment: (comment: string) => void;
  requestError: string;
  setRequestError: (error: string) => void;
  isRequestLoading: boolean;
  handleRequestAccess: (e: React.FormEvent) => Promise<void>;
  handleIDFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  MAX_FILE_SIZE_MB: number;
  MAX_FILE_SIZE_BYTES: number;
}

export default function RequestModal({
  showRequestModal, setShowRequestModal, requestName, setRequestName,
  requestPhone, setRequestPhone, requestIDFile, requestComment,
  setRequestComment, requestError, isRequestLoading, handleRequestAccess,
  handleIDFileChange, MAX_FILE_SIZE_MB
}: RequestModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iosSpring = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 1.2
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {showRequestModal && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md sm:bg-slate-900/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white/90 sm:bg-white/80 backdrop-blur-2xl text-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 max-w-lg w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] relative border border-white/50 max-h-[90vh] overflow-y-auto hide-scrollbar"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={iosSpring}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer bg-white/60 sm:bg-white/50 rounded-full p-2 hover:bg-white shadow-sm sm:shadow-none z-10"
              onClick={() => setShowRequestModal(false)}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6 sm:mb-8 text-center sm:text-left mt-2 sm:mt-0 px-2 sm:px-0">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 tracking-tight">Request Access</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Fill out the form below to request admin approval.
              </p>
            </div>

            {/* Error Message */}
            {requestError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6 text-center border border-red-100 font-medium"
              >
                {requestError}
              </motion.div>
            )}

            <form onSubmit={handleRequestAccess} className="space-y-4 sm:space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="fullName" className="text-xs sm:text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="w-full bg-[#F2F2F7] text-slate-900 placeholder-slate-400/70 border-0 rounded-2xl sm:rounded-[22px] py-3 px-5 sm:py-4 sm:px-6 focus:ring-[3px] focus:ring-[#007AFF]/20 focus:bg-white transition-all duration-300 text-[15px] font-medium shadow-inner outline-none"
                  placeholder="e.g., Puneet Shukla"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="phone" className="text-xs sm:text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={requestPhone}
                  onChange={(e) => setRequestPhone(e.target.value)}
                  className="w-full bg-[#F2F2F7] text-slate-900 placeholder-slate-400/70 border-0 rounded-2xl sm:rounded-[22px] py-3 px-5 sm:py-4 sm:px-6 focus:ring-[3px] focus:ring-[#007AFF]/20 focus:bg-white transition-all duration-300 text-[15px] font-medium shadow-inner outline-none"
                  placeholder="+91-8527989270"
                  required
                />
              </div>

              {/* ID Card Upload */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="idCard" className="text-xs sm:text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">
                  ID Card <span className="normal-case tracking-normal opacity-70">(Max {MAX_FILE_SIZE_MB}MB)</span>
                </label>
                <div className="relative group">
                  <input
                    id="idCard"
                    type="file"
                    onChange={handleIDFileChange}
                    className="hidden"
                    accept="image/*, .pdf"
                  />
                  <label
                    htmlFor="idCard"
                    className={`flex items-center justify-center w-full py-3 px-5 sm:py-4 sm:px-6 rounded-2xl sm:rounded-[22px] cursor-pointer transition-all duration-300 border-2 border-dashed
                      ${requestIDFile 
                        ? "bg-blue-50 border-blue-200 text-blue-600" 
                        : "bg-[#F2F2F7] border-slate-300 text-slate-400 hover:border-[#007AFF]/50 hover:bg-white"
                      }`}
                  >
                    {requestIDFile ? (
                       <div className="flex items-center space-x-2 truncate">
                         <DocumentIcon className="w-5 h-5 flex-shrink-0" />
                         <span className="font-medium text-[14px] sm:text-[15px] truncate">{requestIDFile.name}</span>
                       </div>
                    ) : (
                       <div className="flex items-center space-x-2">
                         <PhotoIcon className="w-5 h-5" />
                         <span className="font-medium text-[14px] sm:text-[15px]">Upload ID / Photo</span>
                       </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="comment" className="text-xs sm:text-[13px] font-semibold text-slate-400 ml-3 tracking-wide uppercase">Reason</label>
                <textarea
                  id="comment"
                  rows={2}
                  value={requestComment}
                  onChange={(e) => setRequestComment(e.target.value)}
                  className="w-full bg-[#F2F2F7] text-slate-900 placeholder-slate-400/70 border-0 rounded-2xl sm:rounded-[22px] py-3 px-5 sm:py-4 sm:px-6 focus:ring-[3px] focus:ring-[#007AFF]/20 focus:bg-white transition-all duration-300 text-[15px] font-medium shadow-inner outline-none resize-none"
                  placeholder="Explain why you need access..."
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full py-3.5 sm:py-4 rounded-2xl sm:rounded-[22px] font-bold flex items-center justify-center space-x-2 mt-2 sm:mt-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isRequestLoading}
              >
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <AnimatePresence mode="wait">
                  {isRequestLoading ? (
                    <motion.div 
                      key="loading" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-[15px]">Submitting...</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="submit" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center space-x-2 relative z-10"
                    >
                      <span className="text-[15px]">Submit Request</span>
                      <PaperAirplaneIcon className="w-5 h-5 -rotate-45 mb-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}