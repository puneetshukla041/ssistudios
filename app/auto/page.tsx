'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { 
  LuUpload, 
  LuDatabase, 
  LuFileSpreadsheet, 
  LuDownload, 
  LuLoader, 
  LuCheck, 
  LuTrash2,
  LuFileText, 
  LuSearch, 
  LuX, 
  LuCalendar, 
  LuUserPlus, 
  LuChevronRight 
} from 'react-icons/lu'

// --- PDF CONFIGURATION ---
const NAME_MARGIN_LEFT = 72 
const NAME_MARGIN_TOP = 133     
const HOSPITAL_MARGIN_LEFT = 72 
const SECOND_NAME_MARGIN_LEFT = 98
const SECOND_NAME_MARGIN_TOP = 238
const DATE_MARGIN_LEFT = 455    
const DATE_MARGIN_TOP = 75      

const FONT_SIZE = 10
const TEXT_COLOR = rgb(0, 0, 0)

// --- APPLE ANIMATION CONFIG ---
// FIXED: Added 'as const' to resolve the Transition type error
const springTransition = { type: "spring", stiffness: 400, damping: 30 } as const;
const fadeIn = { 
  initial: { opacity: 0, y: 10 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
} as const;

// --- TYPES ---
interface InvitationData {
  id: string;
  name: string;
  hospital: string;
  email?: string; 
  sourceSheet: string;
  status: 'pending' | 'uploaded' | 'generated' | 'error';
}

const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const toTitleCase = (str: any) => {
  if (!str) return '';
  return String(str).trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}

export default function BulkInvitationPage() {
  const [data, setData] = useState<InvitationData[]>([])
  const [searchQuery, setSearchQuery] = useState('') 
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false) 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [singleEntry, setSingleEntry] = useState({ name: '', hospital: '' })

  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.hospital.toLowerCase().includes(lowerQuery) ||
        item.sourceSheet.toLowerCase().includes(lowerQuery)
    );
  }, [data, searchQuery]);

  const generatePdfBlob = async (name: string, hospital: string): Promise<Uint8Array> => {
    const existingPdfBytes = await fetch('/invitation/Invitation.pdf').then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    pdfDoc.registerFontkit(fontkit)
    const fontBytes = await fetch('/fonts/Poppins-Regular.ttf').then(res => res.arrayBuffer())
    const customFont = await pdfDoc.embedFont(fontBytes)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { height: pageHeight } = firstPage.getSize()

    const nameY = pageHeight - NAME_MARGIN_TOP
    const hospitalY = nameY - 15 
    const secondNameY = pageHeight - SECOND_NAME_MARGIN_TOP 
    const dateY = pageHeight - DATE_MARGIN_TOP

    if (name) firstPage.drawText(name, { x: NAME_MARGIN_LEFT, y: nameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    if (hospital) firstPage.drawText(hospital, { x: HOSPITAL_MARGIN_LEFT, y: hospitalY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    if (name) firstPage.drawText(`${name},`, { x: SECOND_NAME_MARGIN_LEFT, y: secondNameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })

    const now = new Date(selectedDate + 'T12:00:00') 
    const dateLine = `${now.toLocaleString('en-US', { month: 'short' })} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}` 
    firstPage.drawText(dateLine, { x: DATE_MARGIN_LEFT, y: dateY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    return await pdfDoc.save()
  }

  const handleDownloadSingle = async (name: string, hospital: string) => {
    setIsProcessing(true)
    try {
      const pdfBytes = await generatePdfBlob(name, hospital)
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      downloadFile(blob, `Invitation_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
      
      // TRIGGER POSITIVE COMPLETION ANIMATION
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
    } catch (error) {
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        let allExtractedData: InvitationData[] = [];
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(ws);
          if (!rawData || rawData.length === 0) return;
          const firstRow = rawData[0] as any;
          const keys = Object.keys(firstRow);
          const nK = keys.find(k => /name|doctor|participant/i.test(k));
          const hK = keys.find(k => /hospital|society|clinic/i.test(k));
          if (!nK) return; 
          allExtractedData = [...allExtractedData, ...rawData.map((row: any, index: number) => ({
            id: `${sheetName}-${index}-${Date.now()}`,
            sourceSheet: sheetName,
            name: toTitleCase(row[nK]),
            hospital: hK ? toTitleCase(row[hK]) : '', 
            status: 'uploaded' as const
          }))];
        });
        setData(allExtractedData);
      } catch (error) {
        alert("Failed to process Excel data.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F2F2F7] text-[#1D1D1F] lg:pl-[88px] font-sans overflow-hidden select-none">
      
      {/* --- APPLE DYNAMIC SUCCESS TOAST --- */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 20, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[300] flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-full"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-8 h-8 bg-[#34C759] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#34C759]/30"
            >
              <LuCheck size={20} strokeWidth={4} />
            </motion.div>
            <span className="text-[15px] font-bold tracking-tight">Letter Generated Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={springTransition}
        className="w-full lg:w-[320px] h-full bg-white/70 backdrop-blur-3xl border-r border-[#D2D2D7]/50 z-20 flex flex-col p-8 overflow-y-auto"
      >
        <div className="mb-10">
          <motion.div whileHover={{ scale: 1.05 }} className="mb-6 relative w-12 h-12 shadow-xl rounded-2xl overflow-hidden bg-white p-2 border border-[#D2D2D7]/30">
            <Image src="/logos/ssilogo.png" alt="Logo" fill className="object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="text-[11px] text-[#86868B] mt-0.5 font-black uppercase tracking-[0.2em]">Automated v5.0</p>
        </div>

        <div className="space-y-6 flex-1">
            <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white shadow-sm backdrop-blur-md transition-all cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0071E3] rounded-xl text-white shadow-lg shadow-[#0071E3]/20">
                        <LuUserPlus size={18} />
                    </div>
                    <span className="text-[15px] font-semibold">Single Recipient</span>
                </div>
                <LuChevronRight size={16} className="text-[#D2D2D7]" />
            </motion.button>

            <div className="relative group">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <motion.div 
                    whileHover={{ scale: 1.01, borderColor: "#0071E3" }}
                    className="w-full border-2 border-dashed border-[#D2D2D7] rounded-3xl p-10 flex flex-col items-center justify-center gap-3 bg-white/30 transition-all cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <LuUpload size={20} className="text-[#0071E3]" />
                    </div>
                    <span className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Excel Drop Zone</span>
                </motion.div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#86868B] ml-2 uppercase tracking-widest">Effective Date</label>
                <div className="relative">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0071E3]" size={16} />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-white rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-4 focus:ring-[#0071E3]/10 transition-all" />
                </div>
            </div>
        </div>

        <div className="mt-10 space-y-3 pt-8 border-t border-[#D2D2D7]/30">
          <button className="w-full py-3.5 rounded-2xl bg-[#1D1D1F] text-white text-[13px] font-bold hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-2">
            <LuDatabase size={16} /> Cloud Sync
          </button>
          <button onClick={() => setData([])} className="w-full py-3.5 rounded-2xl bg-white/50 text-[#FF3B30] text-[13px] font-bold hover:bg-[#FF3B30] hover:text-white transition-all cursor-pointer border border-[#FF3B30]/10">
            <LuTrash2 className="inline mr-2" size={16} /> Clear Workspace
          </button>
        </div>
      </motion.div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-[#D2D2D7]/30 flex items-center px-10 justify-between shrink-0">
            <h2 className="text-[19px] font-bold tracking-tight">Active Queue</h2>
            <div className="relative flex-1 max-w-sm">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" size={16} />
                <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white/60 rounded-full text-sm font-medium outline-none focus:bg-white border border-[#D2D2D7]/30 focus:border-[#0071E3] transition-all"
                />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-8 lg:p-12">
            <AnimatePresence mode='wait'>
            {data.length === 0 ? (
                <motion.div {...fadeIn} className="h-full flex flex-col items-center justify-center text-[#86868B]">
                    <div className="w-28 h-28 bg-white/40 backdrop-blur-lg rounded-[40px] flex items-center justify-center shadow-inner mb-6 border border-white">
                        <LuFileText size={44} className="opacity-10 text-black" />
                    </div>
                    <p className="text-[18px] font-bold text-[#1D1D1F]">No Records Active</p>
                    <p className="text-sm font-medium">Please import a source file or add manually.</p>
                </motion.div>
            ) : (
                <motion.div {...fadeIn} className="bg-white/50 backdrop-blur-md rounded-[32px] border border-white shadow-2xl shadow-black/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#FBFBFD]/60 border-b border-[#D2D2D7]/30">
                            <tr className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">
                                <th className="px-10 py-5">Verification</th>
                                <th className="px-10 py-5">Full Name</th>
                                <th className="px-10 py-5">Institution</th>
                                <th className="px-10 py-5 text-right">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D2D2D7]/20">
                            {filteredData.map((row) => (
                                <motion.tr layout key={row.id} className="hover:bg-white/80 transition-colors cursor-default group">
                                    <td className="px-10 py-5">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-[11px] font-black tracking-tight">
                                            <LuCheck size={14} strokeWidth={4} /> VALIDATED
                                        </span>
                                    </td>
                                    <td className="px-10 py-5 text-[15px] font-bold text-[#1D1D1F]">{row.name}</td>
                                    <td className="px-10 py-5 text-[14px] text-[#86868B] font-semibold">{row.hospital || '—'}</td>
                                    <td className="px-10 py-5 text-right">
                                        <motion.button 
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDownloadSingle(row.name, row.hospital)}
                                            className="p-3 bg-[#0071E3] text-white rounded-2xl shadow-lg shadow-[#0071E3]/20 cursor-pointer inline-flex transition-colors hover:bg-[#0077ED]"
                                        >
                                            <LuDownload size={18} strokeWidth={2.5} />
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
            </AnimatePresence>
        </main>
      </div>

      {/* --- APPLE SHEET MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/10 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 40 }} transition={springTransition}
              className="relative w-full max-w-md bg-[#F2F2F7]/95 backdrop-blur-3xl rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white p-10"
            >
              <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold tracking-tight">New Recipient</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/5 hover:bg-black/10 rounded-full cursor-pointer transition-colors"><LuX size={20} /></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-[#86868B] ml-2 uppercase tracking-widest">Recipient Identity</p>
                  <input type="text" placeholder="e.g. Dr. Puneet Shukla" value={singleEntry.name} onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} className="w-full px-6 py-4 bg-white rounded-2xl text-[15px] font-bold shadow-sm outline-none border-none focus:ring-4 focus:ring-[#0071E3]/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-[#86868B] ml-2 uppercase tracking-widest">Institution Details</p>
                  <input type="text" placeholder="e.g. SSI Medical Center" value={singleEntry.hospital} onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} className="w-full px-6 py-4 bg-white rounded-2xl text-[15px] font-bold shadow-sm outline-none border-none focus:ring-4 focus:ring-[#0071E3]/10 transition-all" />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!singleEntry.name || isProcessing}
                  onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }}
                  className="w-full mt-8 py-5 bg-[#0071E3] text-white text-[17px] font-bold rounded-[20px] shadow-2xl shadow-[#0071E3]/30 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:grayscale transition-all"
                >
                  {isProcessing ? <LuLoader className="animate-spin" /> : "Generate Document"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}