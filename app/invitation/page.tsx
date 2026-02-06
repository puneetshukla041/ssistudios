'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion, AnimatePresence } from 'framer-motion'
import { LuDownload, LuRotateCcw, LuLoader, LuType, LuBuilding, LuFileText } from 'react-icons/lu'

// --- COORDINATES BASED ON YOUR IMAGE ---
// x: Distance from left edge (pts)
// y: Distance from bottom edge (pts). 
// In professional letters, address blocks are roughly 70-75% up from the bottom.
const TEXT_X_ALIGN = 82   // Aligns with the "Dr." in your image
const DOCTOR_Y = 605      // Position for Dr. [Full Name]
const HOSPITAL_Y = 590    // Position for [Hospital / Institution Name]
const FONT_SIZE = 10
const TEXT_COLOR = rgb(0.1, 0.1, 0.1) // Near black for professional print

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

      // Draw Doctor Name (Dr. + Input)
      if (doctorName) {
        firstPage.drawText(`Dr. ${doctorName}`, { 
          x: TEXT_X_ALIGN, 
          y: DOCTOR_Y, 
          size: FONT_SIZE, 
          font: poppinsFont, 
          color: TEXT_COLOR 
        })
      }

      // Draw Hospital Name
      if (hospitalName) {
        firstPage.drawText(hospitalName, { 
          x: TEXT_X_ALIGN, 
          y: HOSPITAL_Y, 
          size: FONT_SIZE, 
          font: poppinsFont, 
          color: TEXT_COLOR 
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
      link.download = `Invitation_${doctorName || 'Faculty'}.pdf`
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
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden lg:pl-[88px]">
      
      {/* --- SIDEBAR: APPLE INSPECTOR STYLE --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-[380px] h-full bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 z-20 flex flex-col p-8"
      >
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-blue-600 mb-6">
             <LuFileText size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invitation Studio</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">
            Personalize the faculty invitation for SMRSC 2026.
          </p>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Faculty Name
            </label>
            <div className="relative group">
                <LuType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-sm cursor-text"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Institution
            </label>
            <div className="relative group">
                <LuBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Hospital / Institution"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-sm cursor-text"
                />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-[13px] hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
          >
            <LuRotateCcw size={16} /> Reset
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!pdfUrl}
            className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-[#007AFF] text-white font-bold text-[13px] shadow-lg shadow-blue-500/20 hover:bg-[#0062cc] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <LuDownload size={16} /> Save PDF
          </button>
        </div>
      </motion.div>

      {/* --- PREVIEW AREA --- */}
      <div className="flex-1 h-full bg-[#F5F5F7] flex flex-col relative">
        <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <AnimatePresence>
            {isGenerating && (
                <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full shadow-sm flex items-center gap-2 text-[12px] font-semibold text-slate-600"
                >
                <LuLoader className="animate-spin text-blue-500" size={14} /> Updating...
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        <div className="flex-1 p-6 lg:p-12 flex items-center justify-center">
            <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full max-w-4xl bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/50 overflow-hidden relative"
            >
            {pdfUrl ? (
                <iframe 
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                className="w-full h-full border-none"
                title="Preview"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-300">
                <LuLoader className="animate-spin w-8 h-8 mb-3 text-slate-200" />
                <p className="text-sm font-medium">Loading SMRSC 2026 Template...</p>
                </div>
            )}
            </motion.div>
        </div>
      </div>
    </div>
  )
}