'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { LuUpload, LuDownload, LuFileSpreadsheet, LuUsers, LuCheck } from 'react-icons/lu'

// Expected structure of the Excel rows
type ContactRow = {
  name: string;
  contactno: string | number;
}

export default function ContactSaverPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      // Convert sheet to JSON.
      const parsedData = XLSX.utils.sheet_to_json<ContactRow>(sheet, { 
        raw: false,
        defval: "" 
      })

      // Normalize keys: Looking specifically for "name" and "phone"
      const normalizedData = parsedData.map(row => {
        const rowAny = row as any;
        const nameKey = Object.keys(rowAny).find(k => k.toLowerCase().includes('name'));
        
        // UPDATE: Changed this line to look for "phone" instead of "contact"
        const phoneKey = Object.keys(rowAny).find(k => k.toLowerCase().includes('phone'));
        
        return {
          name: nameKey ? rowAny[nameKey] : '',
          contactno: phoneKey ? rowAny[phoneKey] : ''
        }
      }).filter(c => c.name && c.contactno) // filter out empty rows

      setContacts(normalizedData)
    }
    
    reader.readAsArrayBuffer(file)
  }

  // Generate and Download vCard (.vcf)
  const handleSaveContacts = () => {
    if (contacts.length === 0) return

    let vcfData = ''
    
    contacts.forEach(contact => {
      vcfData += 'BEGIN:VCARD\n'
      vcfData += 'VERSION:3.0\n'
      vcfData += `FN:${contact.name}\n`
      vcfData += `TEL;TYPE=CELL:${contact.contactno}\n`
      vcfData += 'END:VCARD\n'
    })

    // Create a Blob from the VCF data
    const blob = new Blob([vcfData], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary link to trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = `Contacts_${new Date().getTime()}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up memory
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8 lg:p-12 font-quicksand ml-0 lg:ml-[88px] flex justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[24px] shadow-xl p-8 border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center">
            <LuUsers size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Contact Saver</h1>
            <p className="text-slate-500 text-sm mt-1">Upload an Excel file to generate a mobile contact book.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-[#007AFF] hover:bg-blue-50/50 transition-all rounded-[20px] p-10 flex flex-col items-center justify-center cursor-pointer mb-6"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          
          {fileName ? (
            <>
              <LuFileSpreadsheet size={40} className="text-[#007AFF] mb-4" />
              <p className="font-bold text-slate-700">{fileName}</p>
              <p className="text-sm text-slate-400 mt-2">Click to replace file</p>
            </>
          ) : (
            <>
              <LuUpload size={40} className="text-slate-400 mb-4" />
              <p className="font-bold text-slate-700">Click to upload Excel File</p>
              <p className="text-sm text-slate-400 mt-2">Must contain 'name' and 'phone' columns</p>
            </>
          )}
        </div>

        {/* Action Button & Status */}
        {contacts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col gap-4"
          >
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-[12px] flex items-center gap-3 text-sm font-semibold border border-green-100">
              <LuCheck size={18} />
              Successfully parsed {contacts.length} contacts!
            </div>
            
            <button 
              onClick={handleSaveContacts}
              className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-bold py-4 rounded-[16px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,122,255,0.3)] transition-all active:scale-[0.98]"
            >
              <LuDownload size={20} />
              Save Contacts to Device
            </button>
            <p className="text-center text-[11px] text-slate-400 font-medium">
              This will download a .vcf file. Open it on your phone to add them to your contacts.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}