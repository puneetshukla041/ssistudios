'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { 
  LuUpload, 
  LuFileSpreadsheet, 
  LuDownload, 
  LuLoader, 
  LuSearch, 
  LuX, 
  LuCalendar, 
  LuUserPlus, 
  LuChevronRight,
  LuSparkles,
  LuGlobe,
  LuFlag,
  LuLayers
} from 'react-icons/lu'

// --- PDF MARGIN CONFIGURATION ---
const NAME_MARGIN_LEFT = 72 
const NAME_MARGIN_TOP = 133     
const HOSPITAL_MARGIN_LEFT = 72 
const SECOND_NAME_MARGIN_LEFT = 98
const SECOND_NAME_MARGIN_TOP = 238
const DATE_MARGIN_LEFT = 455    
const DATE_MARGIN_TOP = 75      

const INTL_CONFIG = {
  NAME_LEFT: 72,
  NAME_TOP: 133,
  HOSPITAL_LEFT: 72,
  SECOND_NAME_LEFT: 98,
  SECOND_NAME_TOP: 238,
  DATE_LEFT: 455,
  DATE_TOP: 75
}

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
  type: 'national' | 'international';
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
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  
  const [singleEntry, setSingleEntry] = useState({ name: '', hospital: '', type: 'national' as 'national' | 'international' })
  const [bulkType, setBulkType] = useState<'national' | 'international'>('national')

  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.hospital.toLowerCase().includes(lowerQuery)
    );
  }, [data, searchQuery]);

  const generatePdfBlob = async (name: string, hospital: string, type: 'national' | 'international'): Promise<Uint8Array> => {
    const templatePath = type === 'international' ? '/invitation/international.pdf' : '/invitation/Invitation.pdf';
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    pdfDoc.registerFontkit(fontkit)
    const fontBytes = await fetch('/fonts/Poppins-Regular.ttf').then(res => res.arrayBuffer())
    const customFont = await pdfDoc.embedFont(fontBytes)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { height: pageHeight } = firstPage.getSize()

    const cfg = type === 'international' ? INTL_CONFIG : {
      NAME_LEFT: NAME_MARGIN_LEFT, NAME_TOP: NAME_MARGIN_TOP,
      HOSPITAL_LEFT: HOSPITAL_MARGIN_LEFT, SECOND_NAME_LEFT: SECOND_NAME_MARGIN_LEFT,
      SECOND_NAME_TOP: SECOND_NAME_MARGIN_TOP, DATE_LEFT: DATE_MARGIN_LEFT, DATE_TOP: DATE_MARGIN_TOP
    };

    const nameY = pageHeight - cfg.NAME_TOP
    const hospitalY = nameY - 15 
    const secondNameY = pageHeight - cfg.SECOND_NAME_TOP 
    const dateY = pageHeight - cfg.DATE_TOP

    if (name) firstPage.drawText(name, { x: cfg.NAME_LEFT, y: nameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    if (hospital) firstPage.drawText(hospital, { x: cfg.HOSPITAL_LEFT, y: hospitalY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    if (name) firstPage.drawText(`${name},`, { x: cfg.SECOND_NAME_LEFT, y: secondNameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })

    const now = new Date(selectedDate + 'T12:00:00') 
    const dateLine = `${now.toLocaleString('en-US', { month: 'short' })} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}` 
    firstPage.drawText(dateLine, { x: cfg.DATE_LEFT, y: dateY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    
    return await pdfDoc.save()
  }

  const handleDownloadSingle = async (name: string, hospital: string, type: 'national' | 'international') => {
    setIsProcessing(true)
    try {
      const pdfBytes = await generatePdfBlob(name, hospital, type)
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type.toUpperCase()}_Invitation_${name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      alert("Template Error. Check /public/invitation/")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDownload = async () => {
    setIsProcessing(true)
    try {
      for (const item of data) {
        const pdfBytes = await generatePdfBlob(item.name, item.hospital, bulkType);
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bulkType.toUpperCase()}_Invitation_${item.name.replace(/\s+/g, '_')}.pdf`;
        link.click();
        // Small delay to prevent browser download blocking
        await new Promise(r => setTimeout(r, 300));
      }
      setIsBulkModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert("Bulk Generation Error");
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
          const tK = keys.find(k => /type|category|region/i.test(k));

          if (!nK) return; 
          allExtractedData = [...allExtractedData, ...rawData.map((row: any, index: number) => {
            const rowType = (row[tK!]?.toString().toLowerCase().includes('inter') ? 'international' : 'national') as 'national' | 'international';
            return {
                id: `${sheetName}-${index}-${Date.now()}`,
                sourceSheet: sheetName,
                name: toTitleCase(row[nK]),
                hospital: hK ? toTitleCase(row[hK]) : '', 
                status: 'uploaded' as const,
                type: rowType
            }
          })];
        });
        setData(allExtractedData);
      } catch (error) {
        alert("Spreadsheet error.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F4F7FB] text-[#5C6370] lg:pl-[88px] font-sans overflow-hidden selection:bg-[#818CF8]/30">
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }} animate={{ y: 32, opacity: 1, x: '-50%', scale: 1 }} exit={{ y: -60, opacity: 0, x: '-50%', scale: 0.9 }}
            className="fixed top-0 left-1/2 z-[300] flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl border border-[#E0E7FF] shadow-xl rounded-full"
          >
            <LuSparkles className="text-[#818CF8]" size={18} />
            <span className="text-[14px] font-medium bg-gradient-to-r from-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">Document beautifully crafted!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-[320px] h-full bg-white/50 backdrop-blur-3xl border-r border-white/50 z-20 flex flex-col p-8">
        <div className="mb-12">
          <div className="mb-6 relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#F0F2F5] cursor-pointer">
            <Image src="/logos/ssilogo.png" alt="Logo" width={28} height={28} />
          </div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Invitations</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
            <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-widest">System Live</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
            <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-between p-4.5 rounded-3xl bg-[#F5F8FF] border border-white hover:bg-white transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white transition-colors cursor-pointer"><LuUserPlus size={18} /></div>
                    <span className="text-[14px] font-medium text-[#4B5563]">Individual Entry</span>
                </div>
                <LuChevronRight size={16} className="text-[#C7D2FE]" />
            </button>

            <div className="relative group cursor-pointer">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-full border-2 border-dashed border-[#E5E7EB] rounded-[32px] p-10 flex flex-col items-center justify-center gap-3 bg-white/20 group-hover:bg-white transition-all cursor-pointer">
                    <LuUpload size={20} className="text-[#818CF8]" />
                    <span className="text-[12px] font-semibold text-[#94A3B8] uppercase">Spreadsheet Sync</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#94A3B8] ml-2 uppercase">Target Date</label>
                <div className="relative cursor-pointer">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#818CF8]" size={15} />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white/50 border border-white rounded-[20px] text-[13px] outline-none cursor-pointer" />
                </div>
            </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#F0F2F5] space-y-3">
          <button 
            disabled={data.length === 0}
            onClick={() => setIsBulkModalOpen(true)}
            className="w-full py-4 rounded-2xl bg-[#1F2937] text-white text-[13px] font-medium cursor-pointer hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Finalize All ({data.length})
          </button>
          <button onClick={() => setData([])} className="w-full py-3 rounded-2xl text-red-500 text-[12px] font-semibold cursor-pointer hover:bg-red-50 transition-colors">Clear Workspace</button>
        </div>
      </motion.div>

      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="h-20 bg-white/30 backdrop-blur-md border-b border-white flex items-center px-10 justify-between">
            <h2 className="text-[17px] font-semibold text-[#1F2937]">Archive Preview</h2>
            <div className="relative flex-1 max-w-sm ml-8">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white/80 rounded-full text-[13px] outline-none border border-transparent focus:border-[#C7D2FE] transition-all" />
            </div>
        </header>

        <main className="flex-1 overflow-auto p-10">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#94A3B8]">
                    <div className="w-24 h-24 bg-white rounded-[35px] shadow-sm flex items-center justify-center mb-6"><LuFileSpreadsheet size={40} className="opacity-10" /></div>
                    <p className="text-[15px] font-medium">System Idle</p>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F9FBFF]/50 border-b border-[#F0F2F5]">
                            <tr className="text-[11px] font-bold text-[#94A3B8] uppercase">
                                <th className="px-10 py-5">Type</th>
                                <th className="px-10 py-5">Name</th>
                                <th className="px-10 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-white transition-colors cursor-default">
                                    <td className="px-10 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${row.type === 'international' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                          {row.type === 'international' ? <LuGlobe size={12}/> : <LuFlag size={12}/>}
                                          {row.type === 'international' ? 'International' : 'National'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-5 text-[14px] font-medium text-[#374151]">{row.name}</td>
                                    <td className="px-10 py-5 text-right">
                                        <button onClick={() => handleDownloadSingle(row.name, row.hospital, row.type)} className="p-3 text-[#6366F1] bg-[#F5F8FF] rounded-2xl hover:bg-[#6366F1] hover:text-white transition-all cursor-pointer"><LuDownload size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
      </div>

      {/* --- BULK DOWNLOAD SELECTOR MODAL --- */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1F2937]/10 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl border border-white">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><LuLayers size={18}/></div>
                    <h3 className="text-xl font-semibold">Batch Config</h3>
                  </div>
                  <button onClick={() => setIsBulkModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-red-500 cursor-pointer"><LuX size={20}/></button>
              </div>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">Select the invitation template to apply for all <span className="font-bold text-gray-900">{data.length} records</span> in this batch.</p>
              <div className="space-y-6">
                <div className="flex p-1 bg-[#F9FAFB] rounded-[20px] border">
                  {(['national', 'international'] as const).map((t) => (
                    <button key={t} onClick={() => setBulkType(t)} className={`flex-1 py-3 text-[12px] font-bold rounded-[15px] capitalize cursor-pointer transition-all ${bulkType === t ? 'bg-white text-[#6366F1] shadow-sm' : 'text-[#94A3B8]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleBulkDownload}
                  disabled={isProcessing}
                  className="w-full py-4.5 bg-[#1F2937] text-white font-semibold rounded-[24px] cursor-pointer shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? <LuLoader className="animate-spin" /> : <><LuDownload size={18}/> Download All</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- QUICK ADD MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1F2937]/10 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl border border-white">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-semibold">Quick Add</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-red-500 cursor-pointer"><LuX size={20}/></button>
              </div>
              <div className="space-y-5">
                <div className="flex p-1 bg-[#F9FAFB] rounded-[20px] border">
                  {(['national', 'international'] as const).map((t) => (
                    <button key={t} onClick={() => setSingleEntry({ ...singleEntry, type: t })} className={`flex-1 py-2 text-[12px] font-bold rounded-[15px] capitalize cursor-pointer transition-all ${singleEntry.type === t ? 'bg-white text-[#6366F1] shadow-sm' : 'text-[#94A3B8]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Full Name" value={singleEntry.name} onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} className="w-full px-6 py-4 bg-[#F9FAFB] rounded-[24px] outline-none border border-transparent focus:border-[#C7D2FE] focus:bg-white transition-all" />
                <input type="text" placeholder="Institution" value={singleEntry.hospital} onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} className="w-full px-6 py-4 bg-[#F9FAFB] rounded-[24px] outline-none border border-transparent focus:border-[#C7D2FE] focus:bg-white transition-all" />
                <button disabled={!singleEntry.name || isProcessing} onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital, singleEntry.type); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '', type: 'national' }) }} className="w-full py-4.5 bg-[#6366F1] text-white font-semibold rounded-[24px] cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-indigo-200 transition-all">
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