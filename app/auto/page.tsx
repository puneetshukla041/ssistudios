'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion, AnimatePresence } from 'framer-motion'
import { LuDownload, LuRotateCcw, LuLoader, LuType, LuBuilding, LuFileText } from 'react-icons/lu'

// --- CONSTANTS ---
const NAME_MARGIN_LEFT = 89 
const NAME_MARGIN_TOP = 133    

// ADJUST THIS VALUE to move the hospital name left/right
const HOSPITAL_MARGIN_LEFT = 72 

const FONT_SIZE = 10
const TEXT_COLOR = rgb(0, 0, 0)

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
      const { height: pageHeight } = firstPage.getSize()

      // Define Base Coordinates
      const nameX = NAME_MARGIN_LEFT
      const nameY = pageHeight - NAME_MARGIN_TOP
      
      // Hospital Coordinates relative to Name
      const hospitalX = HOSPITAL_MARGIN_LEFT // Uses the separate margin constant
      const hospitalY = nameY - 15 

      // --- DRAW DOCTOR NAME ---
      if (doctorName) {
        firstPage.drawText(doctorName, { 
            x: nameX, 
            y: nameY, 
            size: FONT_SIZE, 
            font: poppinsFont, 
            color: TEXT_COLOR 
        })
      }

      // --- DRAW HOSPITAL NAME ---
      if (hospitalName) {
        firstPage.drawText(hospitalName, { 
            x: hospitalX, 
            y: hospitalY, 
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

  // --- HANDLERS FOR INPUTS (Auto-Capitalization) ---
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Capitalize first letter of every word
    const capitalized = val.replace(/\b\w/g, char => char.toUpperCase());
    setDoctorName(capitalized);
  }

  const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Capitalize first letter of every word
    const capitalized = val.replace(/\b\w/g, char => char.toUpperCase());
    setHospitalName(capitalized);
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden lg:pl-[88px]">
      
      {/* --- SIDEBAR --- */}
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
            Generate professional invitation letters with instant live preview.
          </p>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Doctor Name
            </label>
            <div className="relative group">
                <LuType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={doctorName}
                  onChange={handleNameChange}
                  placeholder="Enter name..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-sm cursor-text"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Hospital / Organization
            </label>
            <div className="relative group">
                <LuBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={hospitalName}
                  onChange={handleHospitalChange} // Using the new handler here
                  placeholder="Enter organization..."
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
                <p className="text-sm font-medium">Preparing document...</p>
                </div>
            )}
            </motion.div>
        </div>
      </div>

    </div>
  )
}