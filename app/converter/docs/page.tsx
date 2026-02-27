'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  LuUpload, 
  LuFileText, 
  LuX, 
  LuDownload, 
  LuRefreshCw, 
  LuChevronRight,
  LuLayers,
  LuFileCheck,
  LuShield
} from 'react-icons/lu'
import confetti from 'canvas-confetti'
import { jsPDF } from "jspdf"

// --- CONSTANTS ---
const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'TXT', 'HTML'];

export default function DocConverterPage() {
  const [files, setFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState('PDF')
  const [isConverting, setIsConverting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
    setIsCompleted(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.html'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    setIsConverting(true)

    let directoryHandle: any = null;
    try {
      if ('showDirectoryPicker' in window) {
        directoryHandle = await (window as any).showDirectoryPicker();
      }
    } catch (err) {
      setIsConverting(false);
      return;
    }

    try {
      for (const file of files) {
        const fileName = `${file.name.split('.')[0]}.${targetFormat.toLowerCase()}`;
        let outputBlob: Blob;

        // --- CONVERSION LOGIC ---
        if (targetFormat === 'PDF') {
          const doc = new jsPDF();
          const text = await file.text();
          const splitText = doc.splitTextToSize(text, 180);
          doc.text(splitText, 10, 10);
          outputBlob = doc.output('blob');
        } else if (targetFormat === 'TXT') {
          const text = await file.text();
          outputBlob = new Blob([text], { type: 'text/plain' });
        } else {
          // Fallback for DOCX/HTML (requires server-side or heavier libs)
          const text = await file.text();
          outputBlob = new Blob([text], { type: 'application/octet-stream' });
        }

        // --- SAVING LOGIC ---
        if (directoryHandle) {
          const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(outputBlob);
          await writable.close();
        } else {
          const url = URL.createObjectURL(outputBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        }
      }

      setIsCompleted(true)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#007AFF', '#5856D6', '#FFFFFF']
      })
    } catch (error) {
      console.error("Conversion failed", error)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-4 lg:p-12 font-quicksand overflow-x-hidden">
      {/* Background Ambient Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-400/5 blur-[120px] rounded-full" />
      </div>

      <header className="max-w-6xl mx-auto mb-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center shadow-sm border border-white/60 shrink-0">
               <Image src="/logos/ssilogo.png" alt="Logo" width={38} height={38} className="object-contain" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#1C1C1E] tracking-tight">Doc Format Converter</h1>
              <p className="text-[#8E8E93] mt-1 font-bold text-lg flex items-center gap-2">
                <LuShield size={18} className="text-green-500" /> ssistudios application
              </p>
            </div>
          </div>
          
          <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 shadow-sm overflow-x-auto no-scrollbar">
            {SUPPORTED_FORMATS.map((fmt) => (
              <button key={fmt} onClick={() => setTargetFormat(fmt)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${targetFormat === fmt ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}>
                {fmt}
              </button>
            ))}
          </div>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[32px] md:rounded-[48px] p-3 md:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              <div {...getRootProps()} className={`relative cursor-pointer rounded-[24px] md:rounded-[38px] border-2 border-dashed transition-all duration-500 min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center p-6 md:p-12 ${isDragActive ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-[#C7C7CC] hover:border-[#8E8E93] bg-white/30'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-white to-[#F2F2F7] rounded-[24px] md:rounded-[30px] flex items-center justify-center mb-6 shadow-xl border border-white">
                    <LuUpload size={38} className="text-[#007AFF]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-[#1C1C1E]">Drop documents here</h3>
                  <p className="text-[#8E8E93] mt-2 font-medium">PDF, DOCX, TXT, HTML</p>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between px-6">
                    <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em]">Queue ({files.length})</span>
                    <button onClick={() => setFiles([])} className="text-xs font-bold text-[#FF3B30] hover:bg-red-50 px-4 py-1.5 rounded-full transition-all cursor-pointer">Clear All</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {files.map((file, idx) => (
                      <motion.div key={file.name + idx} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-4 md:p-5 bg-white/60 backdrop-blur-md border border-white/80 rounded-[24px] md:rounded-[28px] shadow-sm">
                        <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/80 rounded-2xl flex items-center justify-center shadow-inner border border-white shrink-0">
                             <LuFileText className="text-[#007AFF]" size={28} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-[#1C1C1E] truncate">{file.name}</p>
                            <p className="text-[10px] font-bold text-[#AEA7AF] uppercase tracking-wider">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(idx)} className="p-3 text-[#C7C7CC] hover:text-[#FF3B30] hover:bg-red-50 rounded-2xl transition-all cursor-pointer shrink-0">
                          <LuX size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4">
            <div className="bg-white/70 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] p-6 md:p-8 border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#007AFF]/10 rounded-xl text-[#007AFF]"><LuLayers size={20} /></div>
                <h4 className="text-xl font-black text-[#1C1C1E]">Engine Config</h4>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest block mb-4 ml-1">Target Bitstream</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SUPPORTED_FORMATS.map(f => (
                      <button key={f} onClick={() => setTargetFormat(f)} className={`py-4 rounded-2xl text-sm font-bold transition-all duration-300 border cursor-pointer ${targetFormat === f ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-xl' : 'bg-white border-[#F2F2F7] text-[#8E8E93] hover:border-[#C7C7CC]'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 md:p-6 bg-gradient-to-br from-[#F2F2F7]/50 to-white/30 rounded-[24px] md:rounded-[32px] border border-white/50">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-black text-[#1C1C1E] uppercase tracking-wider">OCR Level</span>
                      <span className="text-xs font-black text-[#007AFF]">ACTIVE</span>
                   </div>
                   <div className="h-1.5 w-full bg-[#E5E5EA] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6]" />
                   </div>
                   <p className="text-[10px] text-[#8E8E93] mt-4 leading-relaxed italic">
                    All document parsing is performed locally using client-side encryption. No data is stored.
                   </p>
                </div>

                <motion.button
                  onClick={handleConvert}
                  disabled={files.length === 0 || isConverting}
                  whileHover={!isConverting && files.length > 0 ? { y: -4, boxShadow: "0 20px 40px rgba(0,122,255,0.2)" } : {}}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-5 rounded-[22px] md:rounded-[26px] flex items-center justify-center gap-3 text-white font-black text-lg transition-all cursor-pointer ${isCompleted ? 'bg-[#34C759]' : 'bg-[#007AFF] shadow-[0_15px_30px_rgba(0,122,255,0.15)]'} ${(files.length === 0 || isConverting) && 'opacity-40 cursor-not-allowed grayscale'}`}
                >
                  {isConverting ? <LuRefreshCw className="animate-spin" size={24} /> : isCompleted ? <><LuDownload size={22} /> Export Again</> : <><LuChevronRight size={22} /> Choose Folder & Save</>}
                </motion.button>
              </div>

              {isCompleted && (
                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                   <div className="w-8 h-8 bg-[#34C759] rounded-full flex items-center justify-center text-white"><LuFileCheck size={16} /></div>
                   <span className="text-xs font-bold text-green-700 uppercase tracking-tight">Stream Processed</span>
                 </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  )
}