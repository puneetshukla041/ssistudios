'use client'

import React, { useState, useMemo } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { motion } from 'framer-motion'
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
  LuTriangleAlert,
  LuSearch,
  LuX,
  LuFolderInput,
  LuCalendar
} from 'react-icons/lu'

// --- PDF CONFIGURATION ---
const NAME_MARGIN_LEFT = 72 
const NAME_MARGIN_TOP = 133     
const HOSPITAL_MARGIN_LEFT = 72 

// --- SECOND NAME CONFIGURATION ---
const SECOND_NAME_MARGIN_LEFT = 72
const SECOND_NAME_MARGIN_TOP = 210 

// --- DATE CONFIGURATION (Single Line) ---
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

// --- HELPER: DOWNLOAD SINGLE FILE (Browser Fallback) ---
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

// --- HELPER: TITLE CASE ---
const toTitleCase = (str: any) => {
  if (str === null || str === undefined || str === '') return '';
  return String(str).trim().replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export default function BulkInvitationPage() {
  const [data, setData] = useState<InvitationData[]>([])
  const [searchQuery, setSearchQuery] = useState('') 
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  
  // --- NEW: SELECTED DATE STATE (Defaults to Today) ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

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

  // --- 1. EXCEL ALGORITHM ---
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
        console.error("Error parsing excel:", error)
        alert("Failed to parse Excel file.")
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  // --- 2. GENERATE PDF ---
  const generatePdfBlob = async (name: string, hospital: string): Promise<Uint8Array> => {
    const existingPdfBytes = await fetch('/invitation/Invitation.pdf').then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    pdfDoc.registerFontkit(fontkit)

    // --- FONT LOADING (LOCAL) ---
    const fontBytes = await fetch('/fonts/Poppins-Regular.ttf').then(res => res.arrayBuffer())
    const customFont = await pdfDoc.embedFont(fontBytes)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { height: pageHeight } = firstPage.getSize()

    // --- COORDINATE CALCULATIONS ---
    const nameY = pageHeight - NAME_MARGIN_TOP
    const hospitalY = nameY - 15 
    const secondNameY = pageHeight - SECOND_NAME_MARGIN_TOP 
    const dateY = pageHeight - DATE_MARGIN_TOP

    // --- DRAW 1: First Name (No Comma) ---
    if (name) {
      firstPage.drawText(name, { 
          x: NAME_MARGIN_LEFT, 
          y: nameY, 
          size: FONT_SIZE, 
          font: customFont, 
          color: TEXT_COLOR 
      })
    }

    // --- DRAW 2: Hospital Name ---
    if (hospital) {
      firstPage.drawText(hospital, { 
          x: HOSPITAL_MARGIN_LEFT, 
          y: hospitalY, 
          size: FONT_SIZE, 
          font: customFont, 
          color: TEXT_COLOR 
      })
    }

    // --- DRAW 3: Second Name (WITH "Dear" AND COMMA) ---
    if (name) {
        // UPDATED HERE: Added "Dear " prefix
        firstPage.drawText(`Dear ${name},`, { 
            x: SECOND_NAME_MARGIN_LEFT, 
            y: secondNameY,            
            size: FONT_SIZE, 
            font: customFont, 
            color: TEXT_COLOR 
        })
      }

    // --- DRAW 4: DATE (Uses selectedDate state) ---
    // We append T12:00:00 to prevent timezone rollback issues when parsing string dates
    const now = new Date(selectedDate + 'T12:00:00') 
    
    const month = now.toLocaleString('en-US', { month: 'short' }) 
    const day = String(now.getDate()).padStart(2, '0')            
    const year = String(now.getFullYear())                        

    // Result: "Feb 09, 2026"
    const dateLine = `${month} ${day}, ${year}` 

    firstPage.drawText(dateLine, {
      x: DATE_MARGIN_LEFT,  
      y: dateY,
      size: FONT_SIZE,
      font: customFont,
      color: TEXT_COLOR
    })

    return await pdfDoc.save()
  }

  // --- 3. DOWNLOAD SINGLE ITEM ---
  const handleDownloadSingle = async (item: InvitationData) => {
    try {
      const pdfBytes = await generatePdfBlob(item.name, item.hospital)
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      downloadFile(blob, `Invitation_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
    } catch (error) {
      console.error("Error generating PDF", error)
    }
  }

  // --- 4. SAVE TO FOLDER ---
  const handleSaveToFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
        alert("Your browser does not support Folder Saving (Try Chrome, Edge, or Opera on Desktop).");
        return;
    }

    const targetData = filteredData.length > 0 ? filteredData : data; 
    if (targetData.length === 0) return;

    setIsProcessing(true);

    try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();

        let successCount = 0;

        for (const item of targetData) {
            try {
                const pdfBytes = await generatePdfBlob(item.name, item.hospital);
                const safeName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `Invitation_${safeName}.pdf`;

                const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(pdfBytes);
                await writable.close();

                successCount++;
            } catch (err) {
                console.error(`Failed to save ${item.name}`, err);
            }
        }

        alert(`Successfully saved ${successCount} files to the selected folder!`);

    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Folder save failed", error);
            alert("An error occurred while saving files.");
        }
    } finally {
        setIsProcessing(false);
    }
  }

  // --- 5. MOCK DATABASE UPLOAD ---
  const handleUploadToDB = async () => {
    if (data.length === 0) return
    setUploadStatus('uploading')

    setTimeout(() => {
        const updatedData = data.map(item => ({ ...item, status: 'uploaded' as const }))
        setData(updatedData)
        setUploadStatus('success')
        setTimeout(() => setUploadStatus('idle'), 3000)
    }, 2000)
  }

  const handleClear = () => {
    setData([])
    setSearchQuery('')
    setUploadStatus('idle')
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden lg:pl-[88px]">
      
      {/* --- SIDEBAR --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-[320px] h-full bg-white border-r border-slate-200/60 z-20 flex flex-col p-6 shadow-sm"
      >
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
             <LuFileSpreadsheet size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bulk Processor</h1>
          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
            Import Excel data to generate and manage invitation certificates in bulk.
          </p>
        </div>

        <div className="space-y-4 flex-1">
            {/* FILE INPUT */}
            <div className="relative group">
                <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all">
                    <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-colors">
                        <LuUpload size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Import Excel</span>
                    <span className="text-[10px] text-slate-400">.xlsx or .xls files</span>
                </div>
            </div>

            {/* --- NEW: CALENDAR INPUT --- */}
            <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Invitation Date
                </label>
                <div className="relative group">
                    <LuCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-sm cursor-pointer"
                    />
                </div>
            </div>

            {/* STATS */}
            {data.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Ready</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">{data.length}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        Extracted from all sheets
                    </div>
                </div>
            )}
        </div>

        <div className="mt-auto space-y-3 pt-6 border-t border-slate-100">
          <button
            onClick={handleUploadToDB}
            disabled={data.length === 0 || uploadStatus === 'uploading'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadStatus === 'uploading' ? <LuLoader className="animate-spin" /> : <LuDatabase size={16} />} 
            {uploadStatus === 'success' ? 'Uploaded!' : 'Upload to MongoDB'}
          </button>

          <button
            onClick={handleSaveToFolder}
            disabled={filteredData.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#007AFF] text-white font-bold text-[13px] shadow-lg shadow-blue-500/20 hover:bg-[#0062cc] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isProcessing ? <LuLoader className="animate-spin" /> : <LuFolderInput size={16} />} 
             {searchQuery ? 'Save Filtered to Folder' : 'Save All to Folder'}
          </button>

          <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-[13px] hover:bg-slate-200 active:scale-95 transition-all"
          >
            <LuTrash2 size={16} /> Clear Data
          </button>
        </div>
      </motion.div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        
        {/* HEADER & SEARCH */}
        <div className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center px-8 justify-between shrink-0 gap-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 whitespace-nowrap">
                <LuFileText className="text-slate-400" /> Data Preview
            </h2>

            <div className="relative w-full max-w-md">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search name, hospital, email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-50/50 rounded-xl text-sm transition-all outline-none"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <LuX size={14} />
                    </button>
                )}
            </div>

            <div className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap hidden sm:block">
                Columns: Name, Hospital, Email
            </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto p-8">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <LuFileSpreadsheet className="w-16 h-16 opacity-20" />
                    <p className="text-sm font-medium">No data imported yet. Upload an Excel file to begin.</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <LuSearch className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="text-blue-500 text-xs font-bold hover:underline">Clear Search</button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Hospital / Org</th>
                                <th className="px-6 py-4">Email ID</th>
                                <th className="px-6 py-4">Source Sheet</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-3">
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                                            <LuCheck size={12} /> Synced
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-semibold text-slate-700">{row.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{row.hospital}</td>
                                    <td className="px-6 py-3 text-sm text-slate-500 font-mono">{row.email}</td>
                                    <td className="px-6 py-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">{row.sourceSheet}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={() => handleDownloadSingle(row)}
                                            className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Download PDF"
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
        </div>
      </div>

    </div>
  )
}
