'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { 
  LuUpload, 
  LuCheck, 
  LuMessageSquare, 
  LuSend,
  LuCoffee,
  LuShieldCheck, 
  LuChevronLeft, 
  LuChevronRight,
  LuSmartphone,
  LuSparkles,
  LuTrash2,
  LuDownload,
  LuActivity,
  LuClock,
  LuZap,
  LuTerminal
} from 'react-icons/lu'

// --- TYPES ---
type ContactRow = {
  id: number;
  name: string;
  contactno: string | number;
  status: 'pending' | 'sent';
}

// --- SUB-COMPONENTS ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-[24px] ${className}`}>
    {children}
  </div>
)

const CircularProgress = ({ percentage, color = "#007AFF" }: { percentage: number, color?: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="#E5E5EA" strokeWidth="10" fill="transparent" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx="50" cy="50" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
        <span className="text-xl font-bold">{Math.round(percentage)}%</span>
        <span className="text-[10px] uppercase font-semibold text-gray-400">Complete</span>
      </div>
    </div>
  )
}

const StatWidget = ({ icon: Icon, label, value, color }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/60 shadow-sm cursor-pointer hover:shadow-md transition-all"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </motion.div>
)

// --- MAIN APPLICATION ---

export default function SSIStudiosMessenger() {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [debugMsg, setDebugMsg] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [logs, setLogs] = useState<string[]>([]) 
  
  const [activeTab, setActiveTab] = useState<'upload' | 'message' | 'analysis'>('upload')
  const [messageTemplate, setMessageTemplate] = useState("We are excited to invite you to the event...")
  
  const [isCooldown, setIsCooldown] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sentCounter, setSentCounter] = useState(0)
  const [isCoffeeBreak, setIsCoffeeBreak] = useState(false)

  const BATCH_SIZE = 50; 
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. PERSISTENCE
  useEffect(() => {
    const savedContacts = localStorage.getItem('ssi_contacts')
    const savedTemplate = localStorage.getItem('ssi_template')
    const savedBatch = localStorage.getItem('ssi_batch')
    const savedFilename = localStorage.getItem('ssi_filename')

    if (savedContacts) {
      try {
        const parsed = JSON.parse(savedContacts)
        if (parsed.length > 0) {
          setContacts(parsed)
          setActiveTab('message') 
        }
      } catch (e) { console.error("Data Load Error") }
    }

    if (savedTemplate) setMessageTemplate(savedTemplate)
    if (savedBatch) setCurrentBatchIndex(Number(savedBatch))
    if (savedFilename) setFileName(savedFilename)
    
    setIsLoaded(true)
    addLog("System Initialized. Ready.")
  }, [])

  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_contacts', JSON.stringify(contacts)) }, [contacts, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_template', messageTemplate) }, [messageTemplate, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_batch', currentBatchIndex.toString()) }, [currentBatchIndex, isLoaded])
  useEffect(() => { if (isLoaded && fileName) localStorage.setItem('ssi_filename', fileName) }, [fileName, isLoaded])

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5))
  }

  // 2. ANALYTICS
  const analytics = useMemo(() => {
    const total = contacts.length
    const sent = contacts.filter(c => c.status === 'sent').length
    const pending = total - sent
    const percent = total === 0 ? 0 : (sent / total) * 100
    const minsRemaining = Math.ceil((pending * 15) / 60)
    return { total, sent, pending, percent, minsRemaining }
  }, [contacts])

  // 3. CORE LOGIC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setDebugMsg('Scanning file structure...')
    addLog(`File selected: ${file.name}`)
    setContacts([]) 

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        let foundData: ContactRow[] = []
        
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const parsedData = XLSX.utils.sheet_to_json<any>(sheet, { raw: false, defval: "" })
          if (parsedData.length === 0) continue

          // FIXED: Corrected the mapping and filtering to satisfy TypeScript's strict type predicate rules
          const extracted = parsedData.map((row, index) => {
            const rowKeys = Object.keys(row)
            const nameKey = rowKeys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('doctor'))
            const phoneKey = rowKeys.find(k => k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact') || k.toLowerCase().includes('phone'))

            if (!nameKey || !phoneKey) return null

            const newContact: ContactRow = {
              id: Date.now() + index, 
              name: row[nameKey],
              contactno: row[phoneKey],
              status: 'pending'
            };
            return newContact;
          }).filter((c): c is ContactRow => {
             const cleanPhone = c?.contactno?.toString().replace(/[^0-9]/g, '') || '';
             return !!(c && c.name && cleanPhone.length >= 10)
          })

          if (extracted.length > 0) {
            foundData = extracted
            break;
          }
        }

        if (foundData.length > 0) {
          setContacts(foundData)
          setDebugMsg(`Successfully imported ${foundData.length} contacts`)
          addLog(`Imported ${foundData.length} contacts. Database updated.`)
          setTimeout(() => setActiveTab('analysis'), 800) 
        } else {
          setDebugMsg('Error: No Name/Mobile columns found.')
          addLog('Error: Column matching failed.')
        }

      } catch (err) {
        setDebugMsg('Error parsing file.')
        addLog('Critical Error: File parsing failed.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const openWhatsApp = (contact: ContactRow) => {
    if (isCooldown || isCoffeeBreak) return 

    let cleanPhone = contact.contactno.toString().replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone

    const greetings = ["Hi", "Hello", "Dear", "Greetings", "Namaste"]
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    let finalMessage = `${randomGreeting} ${contact.name},\n\n${messageTemplate}`
    const uniqueId = Math.floor(1000 + Math.random() * 9000); 
    finalMessage += `\n\nRef: #${uniqueId}`

    const encodedMessage = encodeURIComponent(finalMessage)
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`

    window.open(url, '_blank')
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c))
    addLog(`Message sent to ${contact.name} (ID: ${uniqueId})`)
    handleSafetyTimers()
  }

  const handleSafetyTimers = () => {
    const newCount = sentCounter + 1
    setSentCounter(newCount)

    if (newCount % 10 === 0) {
      setIsCoffeeBreak(true)
      setCountdown(20) 
      addLog('Safety Protocol: Coffee Break Initiated.')
    } else {
      setIsCooldown(true)
      const randomDelay = Math.floor(Math.random() * (8 - 3 + 1) + 3)
      setCountdown(randomDelay)
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsCooldown(false)
          setIsCoffeeBreak(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleReset = () => {
    if (confirm("Reset everything? This cannot be undone.")) {
      setContacts([])
      setCurrentBatchIndex(0)
      setFileName(null)
      setLogs([])
      localStorage.clear()
      setActiveTab('upload')
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(contacts)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Report")
    XLSX.writeFile(wb, `SSI_Report_${new Date().toISOString().slice(0,10)}.xlsx`)
    addLog('Report downloaded successfully.')
  }

  const currentBatch = contacts.slice(currentBatchIndex * BATCH_SIZE, (currentBatchIndex + 1) * BATCH_SIZE);
  const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);

  if (!isLoaded) return <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center text-slate-400">Initializing Core...</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] p-4 lg:p-8 flex justify-center items-center selection:bg-blue-100">
      <style jsx global>{`
        .ios-scrollbar::-webkit-scrollbar { width: 6px; }
        .ios-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ios-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 20px; }
        .ios-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.2); }
        .cursor-hand { cursor: pointer !important; }
      `}</style>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl w-full bg-white/85 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/60 flex flex-col h-[90vh] overflow-hidden"
      >
        
        {/* --- HEADER --- */}
        <div className="flex-none px-8 py-5 border-b border-gray-200/50 flex items-center justify-between bg-white/50 backdrop-blur-md z-20">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden p-1 cursor-pointer">
               <img 
                 src="/logos/ssilogo.png" 
                 alt="SSI" 
                 className="w-full h-full object-contain"
                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
               />
               <div className="absolute inset-0 flex items-center justify-center -z-10 text-blue-500">
                  <LuMessageSquare size={24} />
               </div>
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-gray-900 cursor-default">SSI Studios Messenger</h1>
               <p className="text-[#86868B] text-xs font-medium flex items-center gap-1 cursor-default">
                 <LuShieldCheck size={10} className="text-green-500"/> Advanced Safety Protocol Active
               </p>
             </div>
           </div>

           <div className="flex items-center gap-3">
             {contacts.length > 0 && (
               <>
                 <motion.button 
                   whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                   onClick={handleReset}
                   className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                   title="Reset All Data"
                 >
                   <LuTrash2 size={18} />
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                   onClick={handleExport}
                   className="p-2 rounded-full text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                   title="Export Report"
                 >
                   <LuDownload size={18} />
                 </motion.button>
                 <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>
               </>
             )}

             <div className="bg-[#E5E5EA] p-1 rounded-full flex gap-1 shadow-inner">
               <button onClick={() => setActiveTab('upload')} className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeTab === 'upload' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>Import</button>
               <button onClick={() => contacts.length > 0 && setActiveTab('analysis')} disabled={contacts.length === 0} className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeTab === 'analysis' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black disabled:opacity-30'}`}>Analysis</button>
               <button onClick={() => contacts.length > 0 && setActiveTab('message')} disabled={contacts.length === 0} className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeTab === 'message' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black disabled:opacity-30'}`}>Messenger</button>
             </div>
           </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-white/30">
          <AnimatePresence mode="wait">
            
            {activeTab === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center p-12"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-lg aspect-video bg-white/80 backdrop-blur-xl rounded-[32px] border-2 border-dashed border-[#C7C7CC] flex flex-col items-center justify-center cursor-pointer hover:border-[#007AFF] hover:shadow-2xl transition-all duration-300 group"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner cursor-pointer">
                    <LuUpload size={36} className="text-[#007AFF]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 cursor-pointer">
                    {contacts.length > 0 ? "Replace Contact List" : "Upload Data File"}
                  </h3>
                  <p className="text-gray-400 mt-2 font-medium cursor-pointer">Supports .xlsx / .csv</p>
                </motion.div>
                {debugMsg && <p className="mt-6 text-gray-500 font-mono text-sm bg-white/50 px-4 py-2 rounded-full cursor-default">{debugMsg}</p>}
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full h-full p-8 overflow-y-auto ios-scrollbar"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="text-center mb-8 cursor-default">
                    <h2 className="text-3xl font-bold text-gray-900">Mission Control</h2>
                    <p className="text-gray-500">Real-time status of your outreach campaign</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="p-6 flex flex-col items-center justify-center col-span-1 md:col-span-1 cursor-pointer hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Progress</h3>
                      <CircularProgress percentage={analytics.percent} color="#34C759" />
                    </GlassCard>

                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                      <StatWidget icon={LuSmartphone} label="Total Contacts" value={analytics.total} color="bg-blue-500" />
                      <StatWidget icon={LuCheck} label="Sent Successfully" value={analytics.sent} color="bg-green-500" />
                      <StatWidget icon={LuClock} label="Pending" value={analytics.pending} color="bg-gray-400" />
                      <StatWidget icon={LuActivity} label="Est. Time Left" value={`~${analytics.minsRemaining} mins`} color="bg-amber-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard className="p-8 cursor-pointer hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><LuZap size={24} /></div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">System Efficiency</h3>
                          <p className="text-xs text-gray-500">Current running metrics</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${analytics.percent}%` }} 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                      </div>
                      <div className="mt-4 flex justify-between text-sm text-gray-500 font-medium">
                        <span>Batch Size: {BATCH_SIZE}</span>
                        <span>Mode: {isCooldown ? 'Cooling' : 'Active'}</span>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-black/90 border-gray-800 cursor-text">
                      <div className="flex items-center gap-3 mb-3 text-green-400 border-b border-gray-800 pb-2">
                        <LuTerminal size={18} />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">Live System Logs</span>
                      </div>
                      <div className="font-mono text-xs text-gray-300 space-y-2 h-24 overflow-hidden relative">
                        <AnimatePresence>
                          {logs.map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="truncate">
                              <span className="text-blue-400 mr-2">➜</span> {log}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {logs.length === 0 && <span className="text-gray-600 italic">Waiting for events...</span>}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'message' && (
              <motion.div 
                key="message"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full flex divide-x divide-gray-200/50"
              >
                <div className="w-[350px] flex-none bg-white/40 h-full p-6 flex flex-col">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 cursor-default">
                    <LuSmartphone /> Message Composer
                  </h2>
                  <div className="flex-1 bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 relative group focus-within:ring-2 ring-blue-500/20 transition-all cursor-text">
                    <textarea 
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      className="w-full h-full p-4 rounded-[20px] resize-none focus:outline-none text-[#1D1D1F] text-base leading-relaxed placeholder:text-gray-300 bg-transparent"
                      placeholder="Type your message here..."
                    />
                  </div>
                  <div className="mt-6 cursor-default">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 pl-2">Live Preview</h3>
                    <div className="bg-[#E9E9EB] p-4 rounded-2xl rounded-tr-sm text-sm text-black relative shadow-sm">
                       <p className="leading-snug">
                         Hi {contacts[0]?.name.split(' ')[0] || "Doctor"}, <br/><br/>
                         {messageTemplate}
                       </p>
                       <div className="mt-2 text-[10px] text-gray-500 font-mono">Ref: #8392</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col h-full min-h-0 bg-white/20">
                  <div className="flex-none px-8 py-4 border-b border-gray-100/50 flex items-center justify-between bg-white/30 backdrop-blur-md">
                    <div className="flex items-center gap-4 cursor-default">
                      <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900">Batch {currentBatchIndex + 1}</h2>
                        <span className="text-xs text-gray-500 font-medium">Page {currentBatchIndex + 1} of {Math.ceil(contacts.length / BATCH_SIZE)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/50 rounded-full p-1 border border-white">
                       <motion.button 
                         whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                         disabled={currentBatchIndex === 0}
                         onClick={() => setCurrentBatchIndex(i => i - 1)}
                         className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-gray-600"
                       >
                         <LuChevronLeft />
                       </motion.button>
                       <motion.button 
                         whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                         disabled={currentBatchIndex === Math.ceil(contacts.length / BATCH_SIZE) - 1}
                         onClick={() => setCurrentBatchIndex(i => i + 1)}
                         className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-gray-600"
                       >
                         <LuChevronRight />
                       </motion.button>
                    </div>
                  </div>

                  <div className="flex-none px-8 py-3">
                     <AnimatePresence mode="wait">
                       {isCoffeeBreak ? (
                          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-amber-500/10 text-amber-600 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-amber-100 shadow-sm cursor-default">
                            <LuCoffee />Taking a coffee break... {countdown}s
                          </motion.div>
                       ) : isCooldown ? (
                         <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-blue-500/10 text-blue-600 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-blue-100 shadow-sm cursor-default">
                           <LuShieldCheck />Safety Optimization... {countdown}s
                         </motion.div>
                       ) : (
                         <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-green-500/10 text-green-600 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 shadow-sm cursor-default">
                           <LuSparkles />Ready to Engage
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>

                  <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2 space-y-3 ios-scrollbar min-h-0">
                    {currentBatch.map((contact, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={contact.id} 
                        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          contact.status === 'sent' 
                            ? 'bg-gray-50/50 border-transparent opacity-60 grayscale' 
                            : 'bg-white border-white shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                            contact.status === 'sent' ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] text-white'
                          }`}>
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{contact.name}</h3>
                            <p className="text-xs text-gray-500 font-mono tracking-wide">{contact.contactno}</p>
                          </div>
                        </div>

                        {contact.status === 'sent' ? (
                          <div className="text-[#34C759] flex items-center gap-2 text-sm font-bold px-4 py-2 bg-green-50 rounded-full cursor-default">
                            <LuCheck size={16} /> Sent
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); openWhatsApp(contact); }}
                            disabled={isCooldown || isCoffeeBreak}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                              isCooldown || isCoffeeBreak 
                                ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
                                : 'bg-[#007AFF] hover:bg-[#0071E3] text-white shadow-blue-500/30'
                            }`}
                          >
                            {isCooldown || isCoffeeBreak ? 'Wait...' : <>Invite <LuSend size={14}/></>}
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                    <div className="h-8 w-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}