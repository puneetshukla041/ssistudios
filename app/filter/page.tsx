'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { 
  LuUpload, 
  LuFileSpreadsheet, 
  LuArrowRight, 
  LuDownload, 
  LuBadgeAlert,
  LuCheckCheck
} from 'react-icons/lu'

export default function ExcelFilterPage() {
  const [oldFile, setOldFile] = useState<File | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultData, setResultData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // FIX 1: Added `raw: false` so it reads exactly what is displayed (as text)
          // instead of guessing data types and losing precision on large numbers.
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) 
          resolve(json)
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleProcess = async () => {
    if (!oldFile || !newFile) {
      setError("Please upload both Excel files first.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setResultData(null)

    try {
      const oldData = await readExcel(oldFile)
      const newData = await readExcel(newFile)

      // 1. Setup Data Cleaners
      const normalizePhone = (val: any) => String(val || '').replace(/[\s\-\(\)\+]/g, '').trim()
      const normalizeEmail = (val: any) => String(val || '').toLowerCase().trim()

      // 2. Setup Flexible Header Finders
      const phoneKeys = ['Contact Number', 'Contact', 'Phone', 'Mobile', 'Phone Number', 'Ph']
      const emailKeys = ['Email', 'Email ID', 'Mail', 'Email Address']

      const getVal = (row: any, possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== "") return row[key]
        }
        return ''
      }

      // 3. Build sets of existing data for ultra-fast lookup
      const oldPhones = new Set<string>()
      const oldEmails = new Set<string>()

      oldData.forEach(row => {
        const p = normalizePhone(getVal(row, phoneKeys))
        const e = normalizeEmail(getVal(row, emailKeys))
        if (p) oldPhones.add(p)
        if (e) oldEmails.add(e)
      })

      // 4. Filter the new data
      const newOrChangedContacts = newData.filter(row => {
        const p = normalizePhone(getVal(row, phoneKeys))
        const e = normalizeEmail(getVal(row, emailKeys))
        
        if (!p && !e) return false

        const isNewPhone = p !== '' && !oldPhones.has(p)
        const isNewEmail = e !== '' && !oldEmails.has(e)

        return isNewPhone || isNewEmail
      })

      if (newOrChangedContacts.length === 0) {
        setError("No changes detected. The emails and phone numbers in the new file already exist in the old file.")
      } else {
        setResultData(newOrChangedContacts)
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while processing the files. Please ensure they are valid Excel sheets.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultData) return

    // FIX 2: Force every single value to be a string before exporting.
    // This stops Excel from auto-formatting phone numbers into scientific notation or right-aligning them.
    const safeDataForExport = resultData.map(row => {
      const safeRow: any = {}
      for (const key in row) {
        safeRow[key] = String(row[key] || "")
      }
      return safeRow
    })

    const worksheet = XLSX.utils.json_to_sheet(safeDataForExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "New & Changed")
    XLSX.writeFile(workbook, "Filtered_Changes_Only.xlsx")
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8 font-quicksand flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Excel Data Diff</h1>
          <p className="text-slate-500 font-medium">Extract rows where the Email or Phone Number is new/changed.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Old File */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">1. Master/Old Sheet</label>
              <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors ${oldFile ? 'border-green-400 bg-green-50/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'}`}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {oldFile ? (
                  <>
                    <LuFileSpreadsheet className="text-green-500 mb-2" size={32} />
                    <span className="text-sm font-semibold text-green-700 truncate w-full px-4">{oldFile.name}</span>
                  </>
                ) : (
                  <>
                    <LuUpload className="text-slate-400 mb-2" size={32} />
                    <span className="text-sm font-semibold text-slate-600">Click or drag Old Excel</span>
                  </>
                )}
              </div>
            </div>

            {/* New File */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">2. Updated/New Sheet</label>
              <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors ${newFile ? 'border-green-400 bg-green-50/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'}`}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {newFile ? (
                  <>
                    <LuFileSpreadsheet className="text-green-500 mb-2" size={32} />
                    <span className="text-sm font-semibold text-green-700 truncate w-full px-4">{newFile.name}</span>
                  </>
                ) : (
                  <>
                    <LuUpload className="text-slate-400 mb-2" size={32} />
                    <span className="text-sm font-semibold text-slate-600">Click or drag New Excel</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold border border-red-100">
                  <LuBadgeAlert size={18} />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Area */}
          <div className="flex flex-col items-center border-t border-slate-100 pt-8 mt-4">
            {!resultData ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProcess}
                disabled={!oldFile || !newFile || isProcessing}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all shadow-md
                  ${(!oldFile || !newFile || isProcessing) 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] hover:shadow-lg'
                  }
                `}
              >
                {isProcessing ? 'Processing...' : 'Find Email & Phone Changes'}
                {!isProcessing && <LuArrowRight size={18} />}
              </motion.button>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-full text-sm font-bold border border-green-100">
                  <LuCheckCheck size={20} />
                  Found {resultData.length} rows with new Emails or Phones!
                </div>
                
                <div className="flex gap-4 w-full justify-center mt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setResultData(null)
                      setOldFile(null)
                      setNewFile(null)
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Reset
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                  >
                    <LuDownload size={18} />
                    Download Changes
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

        </motion.div>
      </div>

      <style>{`
        .font-quicksand {
          font-family: 'Quicksand', sans-serif;
        }
      `}</style>
    </div>
  )
}