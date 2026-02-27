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

// --- SOFT ANIMATION CONFIG ---
const softSpring = { type: "spring", stiffness: 300, damping: 25 } as const;
const fadeInSoft = { 
  initial: { opacity: 0, scale: 0.98 }, 
  animate: { opacity: 1, scale: 1 }, 
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.3 }
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
        alert("Oops! Check your Excel file.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F9FAFC] text-[#4A4A4A] lg:pl-[88px] font-sans overflow-hidden">
      
      {/* --- CUTE SUCCESS TOAST --- */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 30, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[300] flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-xl border border-[#E0E7FF] shadow-[0_10px_30px_rgba(99,102,241,0.1)] rounded-2xl"
          >
            <div className="w-7 h-7 bg-[#818CF8] rounded-full flex items-center justify-center text-white">
              <LuCheck size={16} />
            </div>
            <span className="text-[14px] font-medium text-[#6366F1]">All done! Letter is ready.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={softSpring}
        className="w-full lg:w-[300px] h-full bg-white/60 backdrop-blur-2xl border-r border-[#F0F2F5] z-20 flex flex-col p-8"
      >
        <div className="mb-12">
          <div className="mb-4 relative w-10 h-10 shadow-sm rounded-xl overflow-hidden bg-white p-1.5 border border-[#F0F2F5]">
            <Image src="/logos/ssilogo.png" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-[#2D3748]">Invitations</h1>
          <p className="text-[12px] text-[#A0AEC0] font-normal uppercase tracking-widest">Studio Workspace</p>
        </div>

        <div className="space-y-5 flex-1">
            <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#EEF2FF] border border-white hover:shadow-md transition-all cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-[#6366F1] shadow-sm">
                        <LuUserPlus size={18} />
                    </div>
                    <span className="text-[14px] font-medium">Add Recipient</span>
                </div>
                <LuChevronRight size={16} className="text-[#C7D2FE]" />
            </motion.button>

            <div className="relative group">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <motion.div 
                    whileHover={{ scale: 1.01, borderColor: "#C7D2FE" }}
                    className="w-full border-2 border-dashed border-[#E2E8F0] rounded-3xl p-8 flex flex-col items-center justify-center gap-2 bg-[#F8FAFC]/50 transition-all cursor-pointer"
                >
                    <LuUpload size={20} className="text-[#94A3B8]" />
                    <span className="text-[12px] font-medium text-[#94A3B8]">Import Excel</span>
                </motion.div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#A0AEC0] ml-1 uppercase tracking-wider">Event Date</label>
                <div className="relative">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#F0F2F5] rounded-xl text-[13px] text-[#4A5568] outline-none focus:border-[#C7D2FE] transition-all" />
                </div>
            </div>
        </div>

        <div className="mt-8 space-y-2 pt-6 border-t border-[#F0F2F5]">
          <button className="w-full py-3 rounded-xl bg-[#2D3748] text-white text-[13px] font-medium hover:bg-[#1A202C] transition-all">
            Cloud Sync
          </button>
          <button onClick={() => setData([])} className="w-full py-3 rounded-xl bg-transparent text-[#E53E3E] text-[12px] font-medium hover:bg-red-50 transition-all">
            Reset Data
          </button>
        </div>
      </motion.div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="h-16 bg-white/40 backdrop-blur-md border-b border-[#F0F2F5] flex items-center px-8 justify-between shrink-0">
            <h2 className="text-[15px] font-medium text-[#4A5568]">Review List</h2>
            <div className="relative flex-1 max-w-xs">
                <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={14} />
                <input 
                    type="text" 
                    placeholder="Search name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 rounded-full text-[13px] outline-none border border-[#F0F2F5] focus:border-[#C7D2FE] transition-all"
                />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
            <AnimatePresence mode='wait'>
            {data.length === 0 ? (
                <motion.div {...fadeInSoft} className="h-full flex flex-col items-center justify-center text-[#A0AEC0]">
                    <LuFileText size={40} className="mb-4 opacity-20" />
                    <p className="text-[14px] font-normal">Your list will appear here</p>
                </motion.div>
            ) : (
                <motion.div {...fadeInSoft} className="bg-white rounded-3xl border border-[#F0F2F5] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F9FAFC] border-b border-[#F0F2F5]">
                            <tr className="text-[11px] font-medium text-[#A0AEC0] uppercase tracking-wider">
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Name</th>
                                <th className="px-8 py-4">Institution</th>
                                <th className="px-8 py-4 text-right">PDF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {filteredData.map((row) => (
                                <motion.tr layout key={row.id} className="hover:bg-[#F9FAFC] transition-colors">
                                    <td className="px-8 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#22C55E] text-[11px] font-medium">
                                          <LuCheck size={12} /> Ready
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-[14px] text-[#2D3748]">{row.name}</td>
                                    <td className="px-8 py-4 text-[13px] text-[#718096]">{row.hospital || '—'}</td>
                                    <td className="px-8 py-4 text-right">
                                        <button 
                                            onClick={() => handleDownloadSingle(row.name, row.hospital)}
                                            className="p-2.5 text-[#6366F1] hover:bg-[#EEF2FF] rounded-xl transition-all"
                                        >
                                            <LuDownload size={16} />
                                        </button>
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

      {/* --- CUTE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/20 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl border border-[#F0F2F5] p-8"
            >
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-medium text-[#2D3748]">Quick Add</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-400 rounded-full transition-colors"><LuX size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[#A0AEC0] ml-1 uppercase">Full Name</p>
                  <input type="text" placeholder="Who is this for?" value={singleEntry.name} onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} className="w-full px-5 py-3.5 bg-[#F8FAFC] rounded-2xl text-[14px] outline-none border border-transparent focus:border-[#C7D2FE] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[#A0AEC0] ml-1 uppercase">Institution</p>
                  <input type="text" placeholder="Where do they work?" value={singleEntry.hospital} onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} className="w-full px-5 py-3.5 bg-[#F8FAFC] rounded-2xl text-[14px] outline-none border border-transparent focus:border-[#C7D2FE] transition-all" />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={!singleEntry.name || isProcessing}
                  onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }}
                  className="w-full mt-4 py-4 bg-[#6366F1] text-white text-[15px] font-medium rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-30"
                >
                  {isProcessing ? <LuLoader className="animate-spin" /> : "Create PDF"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}