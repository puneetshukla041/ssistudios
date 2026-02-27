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
  LuFolderInput,
  LuCalendar,
  LuUserPlus
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
const springTransition = { type: "spring", stiffness: 300, damping: 30 }

// --- TYPES ---
interface InvitationData {
  id: string;
  name: string;
  hospital: string;
  email: string;
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
            status: 'uploaded' 
          }))];
        });
        setData(allExtractedData);
      } catch (error) {
        alert("Execution Error: Failed to process data structure.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#FBFBFD] text-[#1D1D1F] lg:pl-[88px]">
      
      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={springTransition}
        className="w-full lg:w-[320px] h-fit lg:h-full bg-white border-b lg:border-r border-[#D2D2D7]/50 z-20 flex flex-col p-8 shadow-sm overflow-y-auto"
      >
        <div className="mb-10">
          <div className="mb-6 relative w-16 h-16">
            <Image 
              src="/logos/ssilogo.png" 
              alt="SSI Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitation Letter</h1>
          <p className="text-[13px] text-[#86868B] mt-1 font-medium">Internal Distribution System</p>
        </div>

        <div className="space-y-6 flex-1">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-all group"
            >
                <LuUserPlus size={20} className="text-[#1D1D1F]" />
                <span className="text-sm font-semibold">Single Recipient</span>
            </button>

            <div className="relative group">
                <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border border-[#D2D2D7] rounded-xl p-8 flex flex-col items-center justify-center gap-3 group-hover:bg-[#F5F5F7] transition-all">
                    <LuUpload size={24} className="text-[#86868B]" />
                    <span className="text-sm font-semibold">Bulk Import Data</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[#86868B] ml-1">Distribution Date</label>
                <div className="relative">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1D1D1F]" size={16} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F5F7] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                    />
                </div>
            </div>
        </div>

        <div className="mt-10 space-y-4 pt-8 border-t border-[#F5F5F7]">
          <button className="w-full py-3.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] font-semibold hover:bg-[#000000] transition-all">
            <LuDatabase className="inline mr-2" size={16} /> Synchronize Database
          </button>
          <button className="w-full py-3.5 rounded-xl bg-[#0071E3] text-white text-[13px] font-semibold hover:bg-[#0077ED] transition-all shadow-md">
             <LuFolderInput className="inline mr-2" size={16} /> Export Local Directory
          </button>
          <button onClick={() => setData([])} className="w-full py-3.5 rounded-xl text-[#FF3B30] text-[13px] font-semibold hover:bg-[#FF3B30]/5 transition-all">
            <LuTrash2 className="inline mr-2" size={16} /> Clear Cache
          </button>
        </div>
      </motion.div>

      {/* --- MAIN PREVIEW AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7]/30 flex items-center px-8 justify-between shrink-0 gap-6">
            <h2 className="text-[15px] font-semibold flex items-center gap-3">
                <LuFileText className="text-[#86868B]" /> Archive Preview
            </h2>
            <div className="relative flex-1 max-w-lg">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by name or institution..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] rounded-full text-sm font-medium outline-none focus:bg-white border border-transparent focus:border-[#D2D2D7] transition-all"
                />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-8 lg:p-12">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#86868B]">
                    <LuFileSpreadsheet size={48} strokeWidth={1.5} className="mb-6 opacity-20" />
                    <p className="text-[15px] font-medium tracking-tight">System idle. Awaiting data import.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#D2D2D7]/40 shadow-sm overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-[#FBFBFD] border-b border-[#D2D2D7]/30">
                            <tr className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">
                                <th className="px-8 py-5">Verification</th>
                                <th className="px-8 py-5">Full Legal Name</th>
                                <th className="px-8 py-5">Institution</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F7]">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-[#F5F5F7]/40 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-[#34C759]">
                                            <LuCheck size={14} /> VERIFIED
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-[14px] font-semibold text-[#1D1D1F]">{row.name}</td>
                                    <td className="px-8 py-4 text-[14px] text-[#86868B] font-medium">{row.hospital || '—'}</td>
                                    <td className="px-8 py-4 text-right">
                                        <button 
                                            onClick={() => handleDownloadSingle(row.name, row.hospital)}
                                            className="p-3 bg-white border border-[#D2D2D7] rounded-lg hover:border-[#1D1D1F] transition-all"
                                        >
                                            <LuDownload size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
      </div>

      {/* --- APPLE-STYLE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-[#000000]/20 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={springTransition}
              className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl p-10"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[22px] font-semibold tracking-tight">Single Recipient</h3>
                  <p className="text-[14px] text-[#86868B] mt-1">Manual generation of individual records</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors">
                  <LuX size={20} className="text-[#1D1D1F]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider ml-1">Legal Name</label>
                  <input 
                    type="text" 
                    placeholder="First Middle Last"
                    value={singleEntry.name}
                    onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                    className="w-full px-5 py-4 bg-[#F5F5F7] rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-[#0071E3]/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider ml-1">Institution</label>
                  <input 
                    type="text" 
                    placeholder="Medical Center / University"
                    value={singleEntry.hospital}
                    onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})}
                    className="w-full px-5 py-4 bg-[#F5F5F7] rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-[#0071E3]/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                disabled={!singleEntry.name || isProcessing} 
                onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }} 
                className="w-full mt-12 py-4.5 bg-[#0071E3] text-white text-[15px] font-semibold rounded-2xl hover:bg-[#0077ED] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#0071E3]/20 active:scale-[0.98]"
              >
                {isProcessing ? <LuLoader className="animate-spin" /> : "Generate Document"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}