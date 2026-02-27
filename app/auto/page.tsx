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
  LuSparkles,
  LuMenu
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

const softSpring = { type: "spring", stiffness: 300, damping: 28 } as const;

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile Sidebar State
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
        setIsSidebarOpen(false); // Close sidebar on mobile after upload
      } catch (error) {
        alert("Smart Sync Error: Please check your spreadsheet format.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F4F7FB] text-[#5C6370] font-sans overflow-hidden selection:bg-[#818CF8]/30">
      
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-[#F0F2F5] flex items-center justify-between px-6 z-50">
        <div className="relative w-8 h-8">
          <Image src="/logos/ssilogo.png" alt="Logo" fill className="object-contain" />
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-[#F5F8FF] rounded-xl text-[#6366F1]">
          <LuMenu size={20} />
        </button>
      </div>

      {/* --- SMART GLOW TOAST --- */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }}
            animate={{ y: 32, opacity: 1, x: '-50%', scale: 1 }}
            exit={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }}
            className="fixed top-0 left-1/2 z-[300] flex items-center gap-3 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-xl border border-[#E0E7FF] shadow-[0_20px_40px_rgba(99,102,241,0.15)] rounded-full w-[90%] sm:w-auto"
          >
            <LuSparkles className="text-[#818CF8] animate-pulse shrink-0" size={18} />
            <span className="text-[13px] sm:text-[14px] font-medium bg-gradient-to-r from-[#6366F1] to-[#818CF8] bg-clip-text text-transparent truncate">
              Document beautifully crafted!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR (Responsive Overlay) --- */}
      <AnimatePresence>
        {(isSidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#1F2937]/20 backdrop-blur-sm z-[100] lg:hidden"
            />
            
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={softSpring}
              className="fixed lg:relative top-0 left-0 bottom-0 w-[280px] sm:w-[320px] h-full bg-white lg:bg-white/50 backdrop-blur-3xl border-r border-white/50 z-[101] lg:z-20 flex flex-col p-6 sm:p-8 shadow-[10px_0_30px_rgba(0,0,0,0.02)]"
            >
              <div className="flex justify-between items-center mb-10 lg:mb-12">
                <div>
                  <motion.div 
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    className="mb-4 relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#F0F2F5] cursor-pointer"
                  >
                    <Image src="/logos/ssilogo.png" alt="Logo" width={24} height={24} className="object-contain" />
                  </motion.div>
                  <h1 className="text-xl font-semibold tracking-tight text-[#1F2937]">Invitations</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">System Live</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-[#94A3B8]">
                  <LuX size={20} />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <motion.button 
                      whileHover={{ y: -3, backgroundColor: "white" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setIsModalOpen(true); setIsSidebarOpen(false); }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F5F8FF] border border-white/80 transition-all cursor-pointer group"
                  >
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-[#6366F1] shadow-sm">
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
                          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 bg-white/20 transition-all cursor-pointer"
                      >
                          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                              <LuUpload size={18} className="text-[#818CF8]" />
                          </div>
                          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-center">Spreadsheet Sync</span>
                      </motion.div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#94A3B8] ml-2 uppercase tracking-[0.1em]">Target Date</label>
                      <div className="relative">
                          <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#818CF8]" size={14} />
                          <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all cursor-pointer" 
                          />
                      </div>
                  </div>
              </div>

              <div className="mt-6 space-y-2 pt-6 border-t border-[#F0F2F5]">
                <button className="w-full py-3.5 rounded-xl bg-[#1F2937] text-white text-[12px] font-medium cursor-pointer">Finalize All</button>
                <button onClick={() => setData([])} className="w-full py-3 rounded-xl text-[#EF4444] text-[11px] font-semibold cursor-pointer">Clear Workspace</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN PREVIEW AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <header className="h-16 lg:h-20 bg-white/30 backdrop-blur-md border-b border-white flex items-center px-6 lg:px-10 justify-between shrink-0 gap-4 lg:gap-8">
            <h2 className="hidden sm:block text-[16px] lg:text-[17px] font-semibold text-[#1F2937]">Archive Preview</h2>
            <div className="relative flex-1 max-w-sm">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                <input 
                    type="text" 
                    placeholder="Search name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 rounded-full text-[12px] lg:text-[13px] outline-none border border-transparent focus:border-[#C7D2FE] shadow-sm transition-all"
                />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
            <AnimatePresence mode='wait'>
            {data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-[#94A3B8] text-center px-4">
                    <div className="w-20 h-20 bg-white rounded-[30px] shadow-sm border border-[#F0F2F5] flex items-center justify-center mb-6">
                      <LuFileSpreadsheet size={32} className="opacity-10" />
                    </div>
                    <p className="text-[14px] font-medium text-[#6B7280]">System Idle</p>
                    <p className="text-[12px] mt-1">Ready to receive your recipient data.</p>
                </motion.div>
            ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-[32px] border border-white shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px] lg:min-w-full">
                          <thead className="bg-[#F9FBFF]/50 border-b border-[#F0F2F5]">
                              <tr className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">
                                  <th className="px-6 lg:px-10 py-4 lg:py-5">Status</th>
                                  <th className="px-6 lg:px-10 py-4 lg:py-5">Name</th>
                                  <th className="px-6 lg:px-10 py-4 lg:py-5">Facility</th>
                                  <th className="px-6 lg:px-10 py-4 lg:py-5 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0F2F5]">
                              {filteredData.map((row) => (
                                  <motion.tr layout key={row.id} className="hover:bg-white transition-colors cursor-default">
                                      <td className="px-6 lg:px-10 py-4">
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-[10px] font-bold">
                                            <div className="w-1 h-1 rounded-full bg-[#10B981]" /> Valid
                                          </span>
                                      </td>
                                      <td className="px-6 lg:px-10 py-4 text-[13px] lg:text-[14px] font-medium text-[#374151]">{row.name}</td>
                                      <td className="px-6 lg:px-10 py-4 text-[12px] lg:text-[13px] text-[#6B7280]">{row.hospital || '—'}</td>
                                      <td className="px-6 lg:px-10 py-4 text-right">
                                          <motion.button 
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() => handleDownloadSingle(row.name, row.hospital)}
                                              className="p-2 lg:p-3 text-[#6366F1] bg-[#F5F8FF] rounded-xl cursor-pointer"
                                          >
                                              <LuDownload size={14} />
                                          </motion.button>
                                      </td>
                                  </motion.tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </main>
      </div>

      {/* --- CUTE SMART MODAL (Responsive Sizing) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1F2937]/10 backdrop-blur-md">
            <motion.div 
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              className="relative w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-t sm:border border-white p-8 sm:p-10"
            >
              <div className="w-12 h-1.5 bg-[#E5E7EB] rounded-full mx-auto mb-6 sm:hidden" /> {/* Drag Handle for Mobile */}
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold text-[#1F2937]">Quick Add</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-[#F9FAFB] text-[#94A3B8] rounded-full cursor-pointer"><LuX size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] ml-2 uppercase tracking-wider">Full Name</p>
                  <input type="text" placeholder="Recipient name" value={singleEntry.name} onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} className="w-full px-5 py-4 bg-[#F9FAFB] rounded-2xl text-[14px] font-medium outline-none focus:bg-white transition-all shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] ml-2 uppercase tracking-wider">Institution</p>
                  <input type="text" placeholder="Hospital / University" value={singleEntry.hospital} onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} className="w-full px-5 py-4 bg-[#F9FAFB] rounded-2xl text-[14px] font-medium outline-none focus:bg-white transition-all shadow-inner" />
                </div>
                <button 
                  disabled={!singleEntry.name || isProcessing}
                  onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }}
                  className="w-full mt-4 py-4.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white text-[14px] font-semibold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  {isProcessing ? <LuLoader className="animate-spin" /> : "Generate PDF"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}