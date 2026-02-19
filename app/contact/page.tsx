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

// Upgraded GlassCard for premium iOS feel
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/50 backdrop-blur-[40px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] relative z-10 ${className}`}>
    {children}
  </div>
)

// Upgraded Apple-style Stat Card (Tightened vertically for better fit)
const AppleStatCard = ({ icon: Icon, label, value, iconColor, iconBg }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.7)" }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className="bg-white/40 backdrop-blur-2xl border border-white/50 p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-full cursor-pointer relative overflow-hidden"
  >
    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-4 ${iconBg}`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <p className="text-[32px] font-bold tracking-tight text-[#1D1D1F] leading-none mb-1">{value}</p>
      <p className="text-[13px] font-medium text-[#86868B] tracking-wide">{label}</p>
    </div>
  </motion.div>
)

// Slightly scaled-down to prevent pushing content down
const CircularProgress = ({ percentage, color = "#007AFF" }: { percentage: number, color?: string }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full drop-shadow-sm" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth="10" fill="transparent" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="60" cy="60" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="drop-shadow-md"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1D1D1F]">
        <span className="text-3xl font-bold tracking-tighter">{Math.round(percentage)}%</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#86868B] mt-1">Complete</span>
      </div>
    </div>
  )
}

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
    addLog("System Initialized. Ready for operation.")
  }, [])

  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_contacts', JSON.stringify(contacts)) }, [contacts, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_template', messageTemplate) }, [messageTemplate, isLoaded])
  useEffect(() => { if (isLoaded) localStorage.setItem('ssi_batch', currentBatchIndex.toString()) }, [currentBatchIndex, isLoaded])
  useEffect(() => { if (isLoaded && fileName) localStorage.setItem('ssi_filename', fileName) }, [fileName, isLoaded])

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 6))
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
          setDebugMsg('Error: No valid Name/Mobile columns found.')
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

    const greetings = ["Hi", "Hello", "Dear", "Greetings"]
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    let finalMessage = `${randomGreeting} ${contact.name},\n\n${messageTemplate}`
    const uniqueId = Math.floor(1000 + Math.random() * 9000); 
    finalMessage += `\n\nRef: #${uniqueId}`

    const encodedMessage = encodeURIComponent(finalMessage)
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`

    window.open(url, '_blank')
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c))
    addLog(`Message delivered to ${contact.name} (ID: ${uniqueId})`)
    handleSafetyTimers()
  }

  const handleSafetyTimers = () => {
    const newCount = sentCounter + 1
    setSentCounter(newCount)

    if (newCount % 10 === 0) {
      setIsCoffeeBreak(true)
      setCountdown(20) 
      addLog('Safety Protocol: Mandatory cool-down initiated.')
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
    addLog('Report exported successfully.')
  }

  const currentBatch = contacts.slice(currentBatchIndex * BATCH_SIZE, (currentBatchIndex + 1) * BATCH_SIZE);
  const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);

  if (!isLoaded) return <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans tracking-tight text-[#86868B]">Initializing Subsystems...</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] p-4 lg:p-8 flex justify-center items-center selection:bg-blue-200">
      <style jsx global>{`
        .ios-scrollbar::-webkit-scrollbar { width: 6px; }
        .ios-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ios-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border-radius: 20px; }
        .ios-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.25); }
      `}</style>
      
      {/* WIDENED MAIN CONTAINER: max-w-7xl instead of max-w-6xl for wider breadth */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-7xl w-full bg-white/70 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/80 flex flex-col h-[90vh] overflow-hidden relative"
      >
        {/* --- HEADER --- */}
        <div className="flex-none px-8 py-5 border-b border-gray-200/40 flex items-center justify-between bg-white/40 backdrop-blur-xl z-20">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center shadow-sm border border-gray-100/50 overflow-hidden p-1 cursor-pointer">
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
               <h1 className="text-[20px] font-bold tracking-tight text-[#1D1D1F] leading-none mb-1 cursor-default">SSI Messenger</h1>
               <p className="text-[#86868B] text-[12px] font-medium flex items-center gap-1.5 cursor-default">
                 <LuShieldCheck size={12} className="text-[#34C759]"/> Encrypted & Protected
               </p>
             </div>
           </div>

           <div className="flex items-center gap-3">
             {contacts.length > 0 && (
               <>
                 <motion.button 
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                   onClick={handleReset}
                   className="p-2.5 rounded-full text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                   title="Reset All Data"
                 >
                   <LuTrash2 size={20} />
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                   onClick={handleExport}
                   className="p-2.5 rounded-full text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors cursor-pointer"
                   title="Export Report"
                 >
                   <LuDownload size={20} />
                 </motion.button>
                 <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
               </>
             )}

             <div className="bg-gray-100/80 backdrop-blur-md p-1 rounded-[20px] flex gap-1 shadow-inner border border-black/5">
               <button onClick={() => setActiveTab('upload')} className={`px-5 py-2 rounded-[16px] text-[13px] font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'upload' ? 'bg-white text-black shadow-sm' : 'text-[#86868B] hover:text-black'}`}>Import</button>
               <button onClick={() => contacts.length > 0 && setActiveTab('analysis')} disabled={contacts.length === 0} className={`px-5 py-2 rounded-[16px] text-[13px] font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'analysis' ? 'bg-white text-black shadow-sm' : 'text-[#86868B] hover:text-black disabled:opacity-30'}`}>Analysis</button>
               <button onClick={() => contacts.length > 0 && setActiveTab('message')} disabled={contacts.length === 0} className={`px-5 py-2 rounded-[16px] text-[13px] font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'message' ? 'bg-white text-black shadow-sm' : 'text-[#86868B] hover:text-black disabled:opacity-30'}`}>Engage</button>
             </div>
           </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          
          <AnimatePresence mode="wait">
            {activeTab === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col items-center justify-center p-12 bg-white/20"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-lg aspect-video bg-white/60 backdrop-blur-2xl rounded-[40px] border-2 border-dashed border-[#C7C7CC] flex flex-col items-center justify-center cursor-pointer hover:border-[#007AFF] hover:bg-white/80 transition-all duration-300 group shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                  <div className="w-24 h-24 bg-[#007AFF]/10 rounded-[28px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner cursor-pointer">
                    <LuUpload size={36} className="text-[#007AFF]" />
                  </div>
                  <h3 className="text-[22px] font-bold tracking-tight text-[#1D1D1F] cursor-pointer">
                    {contacts.length > 0 ? "Replace Contact List" : "Upload Dataset"}
                  </h3>
                  <p className="text-[#86868B] text-[14px] mt-2 font-medium cursor-pointer">XLSX or CSV format</p>
                </motion.div>
                {debugMsg && <p className="mt-8 text-[#86868B] font-mono text-[12px] uppercase tracking-widest bg-white/50 px-5 py-2 rounded-full shadow-sm border border-white/60 cursor-default">{debugMsg}</p>}
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                // Reduced vertical padding (p-6 lg:p-8) to stop scrolling
                className="w-full h-full p-6 lg:p-8 overflow-y-auto ios-scrollbar relative"
              >
                {/* Ambient Glows for Glassmorphism Background */}
                <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-400/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

                {/* Widened to max-w-7xl, space tightened to space-y-6 */}
                <div className="max-w-7xl mx-auto space-y-5 z-10 relative">
                  
                  {/* Reduced bottom margin */}
                  <div className="mb-5 cursor-default">
                    <h2 className="text-[32px] font-bold tracking-tight text-[#1D1D1F]">Analytics Overview</h2>
                    <p className="text-[16px] text-[#86868B] font-medium mt-1">Real-time engagement tracking</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Progress Card */}
                    <GlassCard className="lg:col-span-4 p-6 flex flex-col items-center justify-center">
                      <div className="w-full flex justify-start mb-4">
                        <h3 className="text-[12px] font-bold text-[#86868B] uppercase tracking-widest">Master Progress</h3>
                      </div>
                      <CircularProgress percentage={analytics.percent} color="#007AFF" />
                      <div className="mt-6 text-center w-full pt-4 border-t border-black/5">
                        <p className="text-[#1D1D1F] font-semibold text-[14px]">Campaign Status</p>
                        <p className="text-[12px] text-[#86868B] mt-1">{analytics.pending === 0 ? "Fully Executed" : "Processing Active"}</p>
                      </div>
                    </GlassCard>

                    {/* Stats Grid - Now visually wider mapping to col-span-8 */}
                    <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-5">
                      <AppleStatCard icon={LuSmartphone} label="Total Records" value={analytics.total} iconColor="text-[#007AFF]" iconBg="bg-[#007AFF]/10" />
                      <AppleStatCard icon={LuCheck} label="Success" value={analytics.sent} iconColor="text-[#34C759]" iconBg="bg-[#34C759]/10" />
                      <AppleStatCard icon={LuClock} label="Pending" value={analytics.pending} iconColor="text-[#FF9500]" iconBg="bg-[#FF9500]/10" />
                      <AppleStatCard icon={LuActivity} label="Est. Time" value={`~${analytics.minsRemaining}m`} iconColor="text-[#AF52DE]" iconBg="bg-[#AF52DE]/10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Efficiency Module */}
                    <GlassCard className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-[#5856D6]/10 text-[#5856D6] rounded-[14px]"><LuZap size={22} /></div>
                          <div>
                            <h3 className="text-[18px] font-bold tracking-tight text-[#1D1D1F]">System Efficiency</h3>
                            <p className="text-[12px] text-[#86868B] mt-0.5">Live delivery optimization metrics</p>
                          </div>
                        </div>
                        <div className="h-3.5 w-full bg-black/5 rounded-full overflow-hidden shadow-inner relative">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${analytics.percent}%` }} 
                            transition={{ duration: 1 }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#007AFF] to-[#AF52DE] rounded-full"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-between items-center px-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Batch Size</span>
                          <span className="text-[16px] font-semibold text-[#1D1D1F]">{BATCH_SIZE} Units</span>
                        </div>
                        <div className="h-8 w-[1px] bg-black/10"></div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Current State</span>
                          <span className={`text-[16px] font-semibold ${isCooldown ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
                            {isCooldown ? 'Cooling Down' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Developer Logs (Dark Apple Pro Mode) - Tightened height */}
                    <div className="bg-[#1C1C1E]/80 backdrop-blur-[40px] rounded-[32px] p-6 shadow-2xl flex flex-col h-full border border-white/10 cursor-text">
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 text-white/80">
                        <LuTerminal size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Runtime Logs</span>
                      </div>
                      <div className="font-mono text-[12px] text-white/70 space-y-2 h-[100px] overflow-hidden relative">
                        <AnimatePresence>
                          {logs.map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="truncate flex items-center gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] flex-none" /> 
                              {log}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {logs.length === 0 && <span className="text-white/30 italic">Awaiting operations...</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'message' && (
              <motion.div 
                key="message"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex divide-x divide-gray-200/50 bg-white/20"
              >
                {/* Composer Sidebar */}
                <div className="w-[380px] flex-none h-full p-8 flex flex-col bg-white/30 backdrop-blur-md">
                  <h2 className="text-[13px] font-bold text-[#86868B] uppercase tracking-widest mb-6 flex items-center gap-2 cursor-default">
                    <LuSmartphone size={16}/> Protocol Composer
                  </h2>
                  <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[32px] p-3 shadow-sm border border-white relative group focus-within:ring-4 ring-[#007AFF]/10 transition-all cursor-text mb-8">
                    <textarea 
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      className="w-full h-full p-5 rounded-[24px] resize-none focus:outline-none text-[#1D1D1F] text-[15px] leading-relaxed placeholder:text-gray-400 bg-transparent ios-scrollbar"
                      placeholder="Enter your transmission payload..."
                    />
                  </div>
                  <div className="cursor-default">
                    <h3 className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest mb-3 pl-2">Client Preview</h3>
                    <div className="bg-[#E5E5EA]/80 backdrop-blur-md p-5 rounded-[24px] rounded-bl-sm text-[14px] text-black relative shadow-sm border border-white/50">
                       <p className="leading-snug">
                         Hello {contacts[0]?.name.split(' ')[0] || "Client"}, <br/><br/>
                         {messageTemplate}
                       </p>
                       <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-[#86868B] font-mono">Ref: #8392</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Area */}
                <div className="flex-1 flex flex-col h-full min-h-0 relative">
                  <div className="flex-none px-10 py-6 border-b border-white/40 flex items-center justify-between bg-white/40 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-4 cursor-default">
                      <div className="flex flex-col">
                        <h2 className="text-[22px] font-bold tracking-tight text-[#1D1D1F]">Batch Execution {currentBatchIndex + 1}</h2>
                        <span className="text-[13px] text-[#86868B] font-medium mt-1">Segment {currentBatchIndex + 1} of {Math.ceil(contacts.length / BATCH_SIZE)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-[20px] p-1.5 shadow-sm border border-white">
                       <motion.button 
                         whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         disabled={currentBatchIndex === 0}
                         onClick={() => setCurrentBatchIndex(i => i - 1)}
                         className="w-10 h-10 rounded-[14px] bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#1D1D1F]"
                       >
                         <LuChevronLeft size={20} />
                       </motion.button>
                       <motion.button 
                         whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         disabled={currentBatchIndex === Math.ceil(contacts.length / BATCH_SIZE) - 1}
                         onClick={() => setCurrentBatchIndex(i => i + 1)}
                         className="w-10 h-10 rounded-[14px] bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#1D1D1F]"
                       >
                         <LuChevronRight size={20} />
                       </motion.button>
                    </div>
                  </div>

                  <div className="flex-none px-10 py-4 relative z-10">
                     <AnimatePresence mode="wait">
                       {isCoffeeBreak ? (
                          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="w-full bg-[#FF9500]/10 text-[#FF9500] py-3.5 px-6 rounded-[20px] flex items-center justify-center gap-3 font-semibold text-[14px] border border-[#FF9500]/20 shadow-sm cursor-default backdrop-blur-md">
                            <LuCoffee size={18} /> Mandatory Cool-down Period... {countdown}s
                          </motion.div>
                       ) : isCooldown ? (
                         <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="w-full bg-[#007AFF]/10 text-[#007AFF] py-3.5 px-6 rounded-[20px] flex items-center justify-center gap-3 font-semibold text-[14px] border border-[#007AFF]/20 shadow-sm cursor-default backdrop-blur-md">
                           <LuShieldCheck size={18} /> Rate Limit Protection Active... {countdown}s
                         </motion.div>
                       ) : (
                         <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="w-full bg-[#34C759]/10 text-[#34C759] py-3.5 px-6 rounded-[20px] flex items-center justify-center gap-3 font-semibold text-[14px] border border-[#34C759]/20 shadow-sm cursor-default backdrop-blur-md">
                           <LuSparkles size={18} /> Systems Go. Ready to Engage.
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>

                  <div className="flex-1 overflow-y-auto px-10 pb-10 pt-2 space-y-4 ios-scrollbar min-h-0 relative">
                    {currentBatch.map((contact, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.015, duration: 0.2 }}
                        key={contact.id} 
                        className={`group flex items-center justify-between p-5 rounded-[24px] border transition-all duration-300 cursor-pointer ${
                          contact.status === 'sent' 
                            ? 'bg-white/30 border-white/20 opacity-60 grayscale' 
                            : 'bg-white/80 backdrop-blur-xl border-white shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center font-bold text-[20px] shadow-sm ${
                            contact.status === 'sent' ? 'bg-[#E5E5EA] text-[#86868B]' : 'bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] text-white'
                          }`}>
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1D1D1F] text-[16px] tracking-tight">{contact.name}</h3>
                            <p className="text-[13px] text-[#86868B] font-mono tracking-wide mt-1">{contact.contactno}</p>
                          </div>
                        </div>

                        {contact.status === 'sent' ? (
                          <div className="text-[#34C759] flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 bg-[#34C759]/10 rounded-[16px] cursor-default">
                            <LuCheck size={18} /> Delivered
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); openWhatsApp(contact); }}
                            disabled={isCooldown || isCoffeeBreak}
                            className={`px-7 py-3 rounded-[18px] font-semibold text-[14px] flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                              isCooldown || isCoffeeBreak 
                                ? 'bg-[#E5E5EA] text-[#86868B] shadow-none cursor-not-allowed'
                                : 'bg-[#007AFF] text-white shadow-[#007AFF]/20 hover:shadow-[#007AFF]/40'
                            }`}
                          >
                            {isCooldown || isCoffeeBreak ? 'Standby' : <>Transmit <LuSend size={16} className="ml-1"/></>}
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                    <div className="h-10 w-full" />
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