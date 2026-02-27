'use client'

import React, { useState, useMemo } from 'react'
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

// --- TYPES ---
interface InvitationData {
  id: string;
  name: string;
  hospital: string;
  email: string;
  sourceSheet: string;
  status: 'pending' | 'uploaded' | 'generated' | 'error';
}

// --- HELPER: DOWNLOAD SINGLE FILE ---
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

// --- HELPER: SMART CAPITALIZE ---
const toTitleCase = (str: any) => {
  if (!str) return '';
  return String(str).trim().replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1) 
  );
}

export default function BulkInvitationPage() {
  const [data, setData] = useState<InvitationData[]>([])
  const [searchQuery, setSearchQuery] = useState('') 
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // --- SINGLE EXPORT MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [singleEntry, setSingleEntry] = useState({ name: '', hospital: '' })

  // --- FILTERED DATA ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.hospital.toLowerCase().includes(lowerQuery) ||
        item.email.toLowerCase().includes(lowerQuery) ||
        item.sourceSheet.toLowerCase().includes(lowerQuery)
    );
  }, [data, searchQuery]);

  // --- GENERATE PDF LOGIC ---
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

    if (name) {
      firstPage.drawText(name, { x: NAME_MARGIN_LEFT, y: nameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    }
    if (hospital) {
      firstPage.drawText(hospital, { x: HOSPITAL_MARGIN_LEFT, y: hospitalY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    }
    if (name) {
      firstPage.drawText(`${name},`, { x: SECOND_NAME_MARGIN_LEFT, y: secondNameY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    }

    const now = new Date(selectedDate + 'T12:00:00') 
    const dateLine = `${now.toLocaleString('en-US', { month: 'short' })} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}` 

    firstPage.drawText(dateLine, { x: DATE_MARGIN_LEFT, y: dateY, size: FONT_SIZE, font: customFont, color: TEXT_COLOR })
    return await pdfDoc.save()
  }

  const handleDownloadSingle = async (name: string, hospital: string) => {
    setIsProcessing(true)
    try {
      const pdfBytes = await generatePdfBlob(name, hospital)
      // FIX: Cast as any to resolve "Uint8Array not assignable to BlobPart"
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      downloadFile(blob, `Invitation_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
    } catch (error) {
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- EXCEL UPLOAD ---
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
          const nameKey = keys.find(k => /name|doctor|participant|faculty/i.test(k));
          const hospitalKey = keys.find(k => /hospital|society|org|institute|clinic/i.test(k));
          const emailKey = keys.find(k => /email|e-mail|mail/i.test(k));
          if (!nameKey) return; 
          const sheetData = rawData.map((row: any, index: number): InvitationData | null => {
            const nameVal = row[nameKey];
            if (!nameVal) return null;
            return {
              id: `${sheetName}-${index}-${Date.now()}`,
              sourceSheet: sheetName,
              name: toTitleCase(nameVal),
              hospital: hospitalKey ? toTitleCase(row[hospitalKey]) : '', 
              email: emailKey ? String(row[emailKey] || '') : '', 
              status: 'uploaded' 
            };
          }).filter((item): item is InvitationData => item !== null);
          allExtractedData = [...allExtractedData, ...sheetData];
        });
        setData(allExtractedData);
      } catch (error) {
        alert("Failed to parse Excel file.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden lg:pl-[88px]">
      
      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-[320px] h-fit lg:h-full bg-white border-b lg:border-r border-slate-200/60 z-20 flex flex-col p-6 shadow-sm overflow-y-auto"
      >
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
             <LuFileSpreadsheet size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bulk Processor</h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Invitation System</p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-all group"
            >
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <LuUserPlus size={18} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold">Single Export</p>
                    <p className="text-[10px] opacity-70 font-medium">Quick manual entry</p>
                </div>
            </button>

            <div className="relative group">
                <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all">
                    <LuUpload size={20} className="text-slate-400 group-hover:text-blue-500" />
                    <span className="text-sm font-bold text-slate-600">Import Excel</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Invitation Date</label>
                <div className="relative">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    />
                </div>
            </div>
        </div>

        <div className="mt-8 lg:mt-auto space-y-3 pt-6 border-t border-slate-100">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 disabled:opacity-50 transition-all">
            <LuDatabase size={16} /> Sync with Database
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all">
             <LuFolderInput size={16} /> Export All to Folder
          </button>
          <button onClick={() => setData([])} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-[13px] hover:bg-red-50 hover:text-red-500 transition-all">
            <LuTrash2 size={16} /> Clear List
          </button>
        </div>
      </motion.div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <div className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center px-4 lg:px-8 justify-between shrink-0 gap-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <LuFileText className="text-slate-400" /> Preview ({filteredData.length})
            </h2>
            <div className="relative flex-1 max-w-md">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search records..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 rounded-xl text-sm transition-all outline-none"
                />
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <LuFileSpreadsheet className="w-16 h-16 opacity-10" />
                    <p className="text-sm font-bold">Import a file to start bulk processing</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Full Name</th>
                                <th className="px-6 py-4">Hospital / Clinic</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-3 text-green-600 bg-green-50/50 text-[10px] font-bold uppercase"><LuCheck className="inline mr-1"/> Ready</td>
                                    <td className="px-6 py-3 text-sm font-bold text-slate-700">{row.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-500">{row.hospital || '—'}</td>
                                    <td className="px-6 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.sourceSheet}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => handleDownloadSingle(row.name, row.hospital)} className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all">
                                            <LuDownload size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* --- SINGLE EXPORT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Single Invitation</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><LuX size={20} className="text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Name" value={singleEntry.name} onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" />
                <input type="text" placeholder="Hospital" value={singleEntry.hospital} onChange={(e) => setSingleEntry({...singleEntry, hospital: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" />
              </div>
              <button disabled={!singleEntry.name || isProcessing} onClick={async () => { await handleDownloadSingle(singleEntry.name, singleEntry.hospital); setIsModalOpen(false); setSingleEntry({ name: '', hospital: '' }) }} className="w-full mt-8 py-4 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-all">Generate & Download</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}