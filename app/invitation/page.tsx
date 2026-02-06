'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion, AnimatePresence } from 'framer-motion'
import { LuDownload, LuRotateCcw, LuLoader, LuType, LuBuilding, LuMaximize } from 'react-icons/lu'

// --- CONSTANTS ---
const DOCTOR_Y = 500  
const HOSPITAL_Y = 450 
const FONT_SIZE = 10
const TEXT_COLOR = rgb(0, 0, 0) // Black

export default function InvitationPage() {
  const [doctorName, setDoctorName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      generatePdfPreview()
    }, 600) 

    return () => clearTimeout(timer)
  }, [doctorName, hospitalName])

  const generatePdfPreview = useCallback(async () => {
    setIsGenerating(true)
    try {
      const existingPdfBytes = await fetch('/invitation/Invitation.pdf').then(res => res.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      pdfDoc.registerFontkit(fontkit)

      const fontBytes = await fetch('https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2').then(res => res.arrayBuffer())
      const poppinsFont = await pdfDoc.embedFont(fontBytes)

      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      const { width: pageWidth } = firstPage.getSize()

      if (doctorName) {
        const textWidth = poppinsFont.widthOfTextAtSize(doctorName, FONT_SIZE)
        const centerX = (pageWidth - textWidth) / 2

        firstPage.drawText(doctorName, {
          x: centerX,
          y: DOCTOR_Y,
          size: FONT_SIZE,
          font: poppinsFont,
          color: TEXT_COLOR,
        })
      }

      if (hospitalName) {
        const textWidth = poppinsFont.widthOfTextAtSize(hospitalName, FONT_SIZE)
        const centerX = (pageWidth - textWidth) / 2

        firstPage.drawText(hospitalName, {
          x: centerX,
          y: HOSPITAL_Y,
          size: FONT_SIZE,
          font: poppinsFont,
          color: TEXT_COLOR,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      setPdfUrl(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [doctorName, hospitalName])

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `Invitation_${doctorName || 'Guest'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleReset = () => {
    setDoctorName('')
    setHospitalName('')
  }

  return (
    // Main Container with margin for sidebar
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden lg:pl-[88px]">
      
      {/* --- LEFT PANEL: INSPECTOR --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full lg:w-[380px] h-auto lg:h-full bg-white/70 backdrop-blur-2xl border-r border-white/40 shadow-[10px_0_30px_rgba(0,0,0,0.03)] z-20 flex flex-col p-8 relative"
      >
        {/* Header */}
        <div className="mb-10 mt-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white mb-4">
             <LuType size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invitation</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">
            Enter details below to generate a personalized invitation instantly.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-6 flex-1">
          <div className="group">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Recipient Name
            </label>
            <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
                    <LuType size={16} />
                </div>
                <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor Name"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-700 placeholder-slate-400/70 focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm shadow-sm cursor-text hover:border-slate-300"
                />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Organization
            </label>
            <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
                    <LuBuilding size={16} />
                </div>
                <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Hospital Name"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-700 placeholder-slate-400/70 focus:outline-none focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm shadow-sm cursor-text hover:border-slate-300"
                />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-slate-200/60 grid grid-cols-2 gap-3">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <LuRotateCcw size={16} /> Reset
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!pdfUrl}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-bold text-[13px] shadow-[0_4px_14px_rgba(0,122,255,0.3)] hover:bg-[#0066D6] hover:shadow-[0_6px_20px_rgba(0,122,255,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-transparent"
          >
            <LuDownload size={16} /> Download
          </button>
        </div>
      </motion.div>

      {/* --- RIGHT PANEL: LIVE PREVIEW --- */}
      <div className="flex-1 h-full bg-[#323232] relative flex items-center justify-center p-4 lg:p-8 overflow-hidden">
        
        {/* Status Pill */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 z-30 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl flex items-center gap-2.5"
            >
              <LuLoader className="animate-spin text-white/80" size={14} /> 
              <span className="text-xs font-medium text-white/90">Updating Preview...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden ring-1 ring-white/10"
        >
          {pdfUrl ? (
            <iframe 
              // UPDATED: Added #view=Fit to ensure full page is shown by default
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              className="w-full h-full border-none bg-zinc-800"
              title="PDF Preview"
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-zinc-800">
               <LuLoader className="animate-spin w-10 h-10 mb-4" />
               <p className="text-sm font-medium">Loading Document...</p>
             </div>
          )}
        </motion.div>
      </div>

    </div>
  )
}