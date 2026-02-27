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
  LuChevronRight,
  LuSparkles
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

// --- SMART ANIMATIONS ---
const softSpring = { type: "spring", stiffness: 300, damping: 28 } as const;

// --- TYPES ---
interface InvitationData {
  id: string;
  name: string;
  hospital: string;
  email?: string; 
  sourceSheet: string;
  status: 'pending' | 'uploaded' | 'generated' | 'error';
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
        item.hospital.toLowerCase().includes(lowerQuery)
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invitation_${name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
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
        alert("Smart Sync Error: Please check your spreadsheet format.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F4F7FB] text-[#5C6370] lg:pl-[88px] font-sans overflow-hidden selection:bg-[#818CF8]/30">
      
      {/* --- SMART GLOW TOAST --- */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }}
            animate={{ y: 32, opacity: 1, x: '-50%', scale: 1 }}
            exit={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }}
            className="fixed top-0 left-1/2 z-[300] flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl border border-[#E0E7FF] shadow-[0_20px_40px_rgba(99,102,241,0.15)] rounded-full"
          >
            <LuSparkles className="text-[#818CF8] animate-pulse" size={18} />
            <span className="text-[14px] font-medium bg-gradient-to-r from-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">
              Document beautifully crafted!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={softSpring}
        className="w-full lg:w-[320px] h-full bg-white/50 backdrop-blur-3xl border-r border-white/50 z-20 flex flex-col p-8 shadow-[10px_0_30px_rgba(0,0,0,0.02)]"
      >
        <div className="mb-12">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="mb-6 relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#F0F2F5] cursor-pointer"
          >
            <Image src="/logos/ssilogo.png" alt="Logo" width={28} height={28} className="object-contain" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">Invitations</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
            <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-[0.15em]">System Live</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
            <motion.button 
                whileHover={{ y: -3, backgroundColor: "white", boxShadow: "0 10px 20px rgba(99,102,241,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between p-4.5 rounded-3xl bg-[#F5F8FF] border border-white/80 transition-all cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-[#6366F1] shadow-sm group-hover:bg-[#6366F1] group-hover:text-white transition-colors">
                        <LuUserPlus size={18} />
                    </div>
                    <span className="text-[14px] font-medium text-[#4B5563]">Individual Entry</span>
                </div>
                <LuChevronRight size={16} className="text-[#C7D2FE]" />
            </motion.button>

            <div className="relative group">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <motion.div 
                    whileHover={{ scale: 1.02, borderColor: "#C7D2FE", backgroundColor: "white" }}
                    className="w-full border-2 border-dashed border-[#E5E7EB] rounded-[32px] p-10 flex flex-col items-center justify-center gap-3 bg-white/20 transition-all cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                        <LuUpload size={20} className="text-[#818CF8]" />
                    </div>
                    <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">Spreadsheet Sync</span>
                </motion.div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#94A3B8] ml-2 uppercase tracking-[0.1em]">Target Date</label>
                <div className="relative">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#818CF8]" size={15} />
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      className="w-full pl-11 pr-4 py-4 bg-white/50 border border-white rounded-[20px] text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all cursor-pointer shadow-sm" 
                    />
                </div>
            </div>
        </div>

        <div className="mt-8 space-y-3 pt-8 border-t border-[#F0F2F5]">
          <motion.button whileHover={{ scale: 1.02 }} className="w-full py-4 rounded-2xl bg-[#1F2937] text-white text-[13px] font-medium shadow-lg shadow-gray-200 cursor-pointer">
            Finalize All
          </motion.button>
          <motion.button onClick={() => setData([])} whileHover={{ backgroundColor: "rgba(239,68,68,0.05)" }} className="w-full py-3 rounded-2xl text-[#EF4444] text-[12px] font-semibold cursor-pointer transition-all">
            Clear Workspace
          </motion.button>
        </div>
      </motion.div>

      {/* --- MAIN PREVIEW AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="h-20 bg-white/30 backdrop-blur-md border-b border-white flex items-center px-10 justify-between shrink-0 gap-8">
            <h2 className="text-[17px] font-semibold text-[#1F2937]">Archive Preview</h2>
            <div className="relative flex-1 max-w-sm">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                <input 
                    type="text" 
                    placeholder="Search by name or facility..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-full text-[13px] outline-none border border-transparent focus:border-[#C7D2FE] shadow-sm transition-all focus:bg-white"
                />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-10">
            <AnimatePresence mode='wait'>
            {data.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-[#94A3B8]"
                >
                    <div className="w-24 h-24 bg-white rounded-[35px] shadow-sm border border-[#F0F2F5] flex items-center justify-center mb-6">
                      <LuFileSpreadsheet size={40} className="opacity-10" />
                    </div>
                    <p className="text-[15px] font-medium text-[#6B7280]">System Idle</p>
                    <p className="text-[13px] mt-1">Awaiting data injection...</p>
                </motion.div>
            ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-[0_10px_50px_rgba(0,0,0,0.03)] overflow-hidden"
                >
                    <table className="w-full text-left">
                        <thead className="bg-[#F9FBFF]/50 border-b border-[#F0F2F5]">
                            <tr className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">
                                <th className="px-10 py-5">Status</th>
                                <th className="px-10 py-5">Name</th>
                                <th className="px-10 py-5">Facility</th>
                                <th className="px-10 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {filteredData.map((row) => (
                                <motion.tr layout key={row.id} className="hover:bg-white transition-colors cursor-default group">
                                    <td className="px-10 py-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-[11px] font-bold">
                                          <div className="w-1 h-1 rounded-full bg-[#10B981]" /> Validated
                                        </span>
                                    </td>
                                    <td className="px-10 py-5 text-[14px] font-medium text-[#374151]">{row.name}</td>
                                    <td className="px-10 py-5 text-[13px] text-[#6B7280]">{row.hospital || '—'}</td>
                                    <td className="px-10 py-5 text-right">
                                        <motion.button 
                                            whileHover={{ scale: 1.1, backgroundColor: "#6366F1", color: "white" }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDownloadSingle(row.name, row.hospital)}
                                            className="p-3 text-[#6366F1] bg-[#F5F8FF] rounded-2xl transition-all cursor-pointer"
                                        >
                                            <LuDownload size={16} />
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

      {/* --- CUTE SMART MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1F2937]/10 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white p-10"
            >
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold text-[#1F2937]">Quick Add</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-[#F9FAFB] hover:bg-[#FEE2E2] hover:text-[#EF4444] text-[#94A3B8] rounded-full transition-all cursor-pointer"><LuX size={18} /></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#94A3B8] ml-2 uppercase">Full Name</p>
                  <input 
                    type="text" 
                    placeholder="First Middle Last" 
                    value={singleEntry.name} 
                    onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} 
                    className="w-full px-6 py-4 bg-[#F9FAFB] rounded-[24px] text-[14px] font-medium outline-none border border-transparent focus:border-[#C7D2FE] focus:bg-white transition-all shadow-inner" 
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#94A3B8] ml-2 uppercase">Institution</p>
                  <input 
                    type="text" 
                    placeholder="Medical Center" 
                    value={singleEntry.hospital} 
                    onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} 
                    className="w-full px-6 py-4 bg-[#F9FAFB] rounded-[24px] text-[14px] font-medium outline-none border border-transparent focus:border-[#C7D2FE] focus:bg-white transition-all shadow-inner" 
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(99,102,241,0.2)" }} 
                  whileTap={{ scale: 0.98 }} 
                  disabled={!singleEntry.name || isProcessing}
                  onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }}
                  className="w-full mt-6 py-4.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white text-[15px] font-semibold rounded-[24px] shadow-lg shadow-indigo-100 flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  {isProcessing ? <LuLoader className="animate-spin" /> : "Generate PDF"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}