'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { QRCodeSVG } from 'qrcode.react' // Required for QR rendering
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
  LuTerminal,
  LuBot,
  LuServer,
  LuLogOut // Added logout icon
} from 'react-icons/lu'

// --- TYPES ---
type ContactRow = {
  id: number;
  name: string;
  contactno: string | number;
  status: 'pending' | 'sent' | 'failed';
}

// --- SUB-COMPONENTS ---
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/50 backdrop-blur-[40px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] relative z-10 ${className}`}>
    {children}
  </div>
)

const AppleStatCard = ({ icon: Icon, label, value, iconColor, iconBg, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
    className="bg-white/60 backdrop-blur-2xl border border-white/70 p-6 rounded-[28px] shadow-sm flex flex-col justify-between h-full cursor-default relative overflow-hidden group"
    style={{ transition: 'box-shadow 0.3s ease' }}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
    
    <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center mb-5 ${iconBg} shadow-sm`}>
      <Icon size={22} className={iconColor} />
    </div>
    <div>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-[36px] font-bold tracking-tight text-[#1D1D1F] leading-none mb-1.5"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </motion.p>
      <p className="text-[13px] font-medium text-[#86868B] tracking-wide">{label}</p>
    </div>
  </motion.div>
)

const CircularProgress = ({ percentage, color = "#007AFF" }: { percentage: number, color?: string }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 172, height: 172 }}>
      <div className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />

      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="rgba(0,0,0,0.06)" strokeWidth="9" fill="transparent" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          cx="60" cy="60" r={radius}
          stroke={color}
          strokeWidth="9"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={Math.round(percentage)}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-[34px] font-bold tracking-tighter text-[#1D1D1F]"
        >
          {Math.round(percentage)}%
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#86868B] mt-1">Complete</span>
      </div>
    </div>
  )
}

const GradientBar = ({ percent }: { percent: number }) => (
  <div className="relative h-3 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: `${percent}%`, opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="absolute top-0 left-0 h-full rounded-full"
      style={{ background: 'linear-gradient(90deg, #007AFF 0%, #5AC8FA 50%, #AF52DE 100%)' }}
    />
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.6 }}
      className="absolute inset-0 w-1/3 h-full"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
    />
  </div>
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

  // Server state
  const [serverReady, setServerReady] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null) // New State for QR

  // Automation Engine States
  const [isAutomating, setIsAutomating] = useState(false)
  const abortAutomation = useRef(false)
  const liveSentCounter = useRef(sentCounter)

  const BATCH_SIZE = 50; 
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const currentBatch = contacts.slice(currentBatchIndex * BATCH_SIZE, (currentBatchIndex + 1) * BATCH_SIZE);
  const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- 🌐 LIVE BACKEND URL CONFIGURED HERE ---
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ssi-whatsapp-backend-production.up.railway.app';

  // 0. SERVER CHECK POLLER
  useEffect(() => {
    const checkServer = async () => {
      try {
        // We hit the new endpoint that returns status AND the QR code if needed
        const res = await fetch(`${BACKEND_URL}/api/get-qr`);
        const data = await res.json();
        setServerReady(data.ready);
        setQrCode(data.qr); 
      } catch (e) {
        setServerReady(false);
      }
    };
    
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

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
    addLog(`System Initialized. Checking live server connection to Railway...`)
  }, [])

  useEffect(() => { liveSentCounter.current = sentCounter }, [sentCounter])

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

  // --- NEW: API BASED SENDING ---
  const sendViaAPI = async (contact: ContactRow) => {
    if (!serverReady) {
      addLog("Error: Server not connected.");
      return false;
    }

    const greetings = ["Hi", "Hello", "Dear", "Greetings"]
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    let finalMessage = `${randomGreeting} ${contact.name},\n\n${messageTemplate}`
    const uniqueId = Math.floor(1000 + Math.random() * 9000); 
    finalMessage += `\n\nRef: #${uniqueId}`

    try {
      const response = await fetch(`${BACKEND_URL}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: contact.contactno,
          message: finalMessage
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c))
        addLog(`Transmitted silently to ${contact.name}`)
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'failed' } : c))
      addLog(`API Error sending to ${contact.name}`)
      return false;
    }
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to disconnect WhatsApp?")) {
        try {
            await fetch(`${BACKEND_URL}/api/logout`, { method: 'POST' });
            setServerReady(false);
            addLog("WhatsApp Disconnected.");
        } catch (e) {
            addLog("Failed to logout backend.");
        }
    }
  }

  // Manual trigger button
  const triggerManualSend = async (contact: ContactRow) => {
    if (isCooldown || isCoffeeBreak) return;
    await sendViaAPI(contact);
    handleSafetyTimers();
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

  // 4. AUTOMATION ENGINE
  const toggleAutomation = async () => {
    if (!serverReady) {
       alert("Cannot run batch. Node.js backend is offline or WhatsApp is not scanned.");
       return;
    }

    if (isAutomating) {
      abortAutomation.current = true;
      setIsAutomating(false);
      addLog("Automation Terminated by User.");
      return;
    }

    abortAutomation.current = false;
    setIsAutomating(true);
    addLog("Initializing Silent Turbo-Automation Engine...");
    
    const pendingInBatch = currentBatch.filter(c => c.status === 'pending' || c.status === 'failed');
    
    if (pendingInBatch.length === 0) {
      addLog("No pending contacts in this batch.");
      setIsAutomating(false);
      return;
    }

    for (let i = 0; i < pendingInBatch.length; i++) {
      if (abortAutomation.current) break;
      const contact = pendingInBatch[i];

      // 1. Check if we need a break
      if (liveSentCounter.current > 0 && liveSentCounter.current % 10 === 0) {
        addLog("System on scheduled rest. Standing by...");
        let breakWaited = 0;
        while(breakWaited < 20000 && !abortAutomation.current) {
            await new Promise(r => setTimeout(r, 1000));
            breakWaited += 1000;
        }
      }

      if (abortAutomation.current) break;

      // 2. Send via Backend API
      addLog(`Auto-Routing: ${contact.name}`);
      const success = await sendViaAPI(contact);
      
      if (success) {
        liveSentCounter.current += 1;
      }
      
      // 3. HUMAN-LIKE DELAY
      if (i < pendingInBatch.length - 1 && !abortAutomation.current) {
        const waitTime = Math.floor(Math.random() * (12000 - 6000 + 1) + 6000); 
        addLog(`Sleeping ${(waitTime/1000).toFixed(1)}s to avoid rate limits...`);
        
        let waitElapsed = 0;
        while(waitElapsed < waitTime && !abortAutomation.current) {
           await new Promise(r => setTimeout(r, 500));
           waitElapsed += 500;
        }
      }
    }
    
    if (!abortAutomation.current) {
      addLog("Batch Execution Completed.");
      setIsAutomating(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset everything? This cannot be undone.")) {
      abortAutomation.current = true;
      setIsAutomating(false);
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

  if (!isLoaded) return <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans tracking-tight text-[#86868B]">Initializing Subsystems...</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] p-4 lg:p-8 flex justify-center items-center selection:bg-blue-200">
      <style jsx global>{`
        .ios-scrollbar::-webkit-scrollbar { width: 6px; }
        .ios-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ios-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border-radius: 20px; }
        .ios-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.25); }
      `}</style>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-7xl w-full bg-white/70 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/80 flex flex-col h-[90vh] overflow-hidden relative"
      >
        {/* --- HEADER --- */}
        <div className="flex-none px-8 py-5 border-b border-gray-200/40 flex items-center justify-between bg-white/40 backdrop-blur-xl z-20">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center shadow-sm border border-gray-100/50 overflow-hidden p-1 cursor-pointer relative">
               <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                  <LuMessageSquare size={24} />
               </div>
               <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${serverReady ? 'bg-green-500' : 'bg-red-500'}`} title={serverReady ? "Server Connected" : "Server Disconnected"} />
             </div>
             <div>
               <h1 className="text-[20px] font-bold tracking-tight text-[#1D1D1F] leading-none mb-1 cursor-default">SSI Messenger Pro</h1>
               <p className="text-[#86868B] text-[12px] font-medium flex items-center gap-1.5 cursor-default">
                 {serverReady ? <><LuServer size={12} className="text-[#34C759]"/> Local Backend Online</> : <><LuServer size={12} className="text-[#FF3B30]"/> Local Backend Offline</>}
               </p>
             </div>
           </div>

           <div className="flex items-center gap-3">
             {serverReady && (
                 <motion.button 
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                   onClick={handleLogout}
                   className="px-4 py-2 bg-red-50 rounded-full text-red-500 hover:bg-red-100 transition-colors flex items-center gap-2 text-[12px] font-bold"
                   title="Disconnect WhatsApp"
                 >
                   <LuLogOut size={16} /> Logout Engine
                 </motion.button>
             )}
             
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
            
            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col items-center justify-center p-12 bg-white/20"
              >
                {!serverReady && !qrCode && (
                   <div className="absolute top-8 bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm">
                      <LuServer size={18} /> Engine Offline. Checking connection...
                   </div>
                )}

                {/* THE NEW QR CODE DISPLAY */}
                <AnimatePresence>
                  {qrCode && !serverReady && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-8 p-6 bg-white/80 backdrop-blur-xl rounded-[32px] shadow-sm border border-white flex flex-col items-center gap-4"
                    >
                      <h3 className="text-[16px] font-bold text-[#1D1D1F] tracking-tight">Scan to Link WhatsApp</h3>
                      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100/50">
                        <QRCodeSVG value={qrCode} size={220} />
                      </div>
                      <p className="text-[12px] font-medium text-[#86868B] flex items-center gap-2">
                        <LuSmartphone size={16}/> Open WhatsApp &gt; Linked Devices
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-lg aspect-video backdrop-blur-2xl rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${
                      !serverReady ? 'bg-gray-50/50 border-gray-300 opacity-50 cursor-not-allowed' : 'bg-white/60 border-[#C7C7CC] hover:border-[#007AFF] hover:bg-white/80'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" disabled={!serverReady} />
                  <div className={`w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 transition-transform shadow-inner ${!serverReady ? 'bg-gray-200/50 text-gray-400' : 'bg-[#007AFF]/10 text-[#007AFF] group-hover:scale-110 cursor-pointer'}`}>
                    <LuUpload size={36} />
                  </div>
                  <h3 className="text-[22px] font-bold tracking-tight text-[#1D1D1F]">
                    {!serverReady ? "Connect Engine First" : contacts.length > 0 ? "Replace Contact List" : "Upload Dataset"}
                  </h3>
                  <p className="text-[#86868B] text-[14px] mt-2 font-medium">XLSX or CSV format</p>
                </motion.div>
                {debugMsg && <p className="mt-8 text-[#86868B] font-mono text-[12px] uppercase tracking-widest bg-white/50 px-5 py-2 rounded-full shadow-sm border border-white/60 cursor-default">{debugMsg}</p>}
              </motion.div>
            )}

            {/* ANALYSIS TAB */}
            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full p-7 lg:p-8 overflow-y-auto ios-scrollbar relative"
              >
                <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                  <motion.div className="cursor-default">
                    <h2 className="text-[34px] font-bold tracking-tight text-[#1D1D1F]">Analytics Overview</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <motion.div className="lg:col-span-4">
                      <GlassCard className="p-7 flex flex-col items-center justify-center h-full gap-6">
                        <div className="w-full flex items-center justify-between">
                          <h3 className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Master Progress</h3>
                        </div>
                        <CircularProgress percentage={analytics.percent} color="#007AFF" />
                        <div className="w-full pt-5 border-t border-black/5 flex justify-between items-center">
                          <div className="text-center">
                            <p className="text-[22px] font-bold text-[#1D1D1F]">{analytics.sent}</p>
                            <p className="text-[11px] text-[#86868B]">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[22px] font-bold text-[#1D1D1F]">{analytics.pending}</p>
                            <p className="text-[11px] text-[#86868B]">Pending</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[22px] font-bold text-[#1D1D1F]">{analytics.total}</p>
                            <p className="text-[11px] text-[#86868B]">Total</p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                    <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-2 gap-5">
                      <AppleStatCard icon={LuSmartphone} label="Total Records" value={analytics.total} iconColor="text-[#007AFF]" iconBg="bg-[#007AFF]/10" delay={0.10} />
                      <AppleStatCard icon={LuCheck} label="Successfully Sent" value={analytics.sent} iconColor="text-[#34C759]" iconBg="bg-[#34C759]/10" delay={0.17} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <GlassCard className="p-7 flex flex-col gap-6 h-full">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#5856D6]/10 text-[#5856D6] rounded-[14px]"><LuZap size={22} /></div>
                          <div><h3 className="text-[18px] font-bold text-[#1D1D1F]">System Efficiency</h3></div>
                        </div>
                        <GradientBar percent={analytics.percent} />
                    </GlassCard>
                    <div className="bg-[#1A1A1C] rounded-[32px] p-6 flex flex-col shadow-lg cursor-text overflow-hidden relative">
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                         <LuTerminal size={13} className="text-white/40"/>
                         <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Terminal Logs</span>
                      </div>
                      <div className="flex-1 font-mono text-[12px] text-white/60 space-y-2.5 overflow-hidden">
                        {logs.map((log, i) => (
                           <div key={i} className="flex gap-2"><span className="text-[#007AFF]">▸</span>{log}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ENGAGE TAB */}
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
                      disabled={isAutomating}
                      className="w-full h-full p-5 rounded-[24px] resize-none focus:outline-none text-[#1D1D1F] text-[15px] leading-relaxed placeholder:text-gray-400 bg-transparent ios-scrollbar disabled:opacity-50"
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

                    <div className="flex items-center gap-4">
                       <motion.button 
                         whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         onClick={toggleAutomation}
                         disabled={!serverReady}
                         className={`px-5 py-2.5 rounded-[18px] font-bold text-[14px] flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                           isAutomating 
                             ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20' 
                             : 'bg-gradient-to-r from-[#AF52DE] to-[#5856D6] text-white shadow-[#AF52DE]/30 border border-white/20'
                         }`}
                       >
                         {isAutomating ? (
                           <>Stop Automation <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" /></>
                         ) : (
                           <><LuBot size={18} /> {serverReady ? 'Silent Auto-Run' : 'Backend Offline'}</>
                         )}
                       </motion.button>
                       <div className="h-6 w-px bg-black/10 mx-1" />

                       <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-[20px] p-1.5 shadow-sm border border-white">
                         <motion.button 
                           onClick={() => setCurrentBatchIndex(i => i - 1)} disabled={currentBatchIndex === 0 || isAutomating}
                           className="w-10 h-10 rounded-[14px] bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                         ><LuChevronLeft size={20} /></motion.button>
                         <motion.button 
                           onClick={() => setCurrentBatchIndex(i => i + 1)} disabled={currentBatchIndex === Math.ceil(contacts.length / BATCH_SIZE) - 1 || isAutomating}
                           className="w-10 h-10 rounded-[14px] bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                         ><LuChevronRight size={20} /></motion.button>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-10 pb-10 pt-6 space-y-4 ios-scrollbar min-h-0 relative">
                    {currentBatch.map((contact, idx) => (
                      <motion.div 
                        key={contact.id} 
                        className={`group flex items-center justify-between p-5 rounded-[24px] border transition-all duration-300 ${
                          contact.status === 'sent' ? 'bg-white/30 border-white/20 opacity-60' : 
                          contact.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-white/80 border-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center font-bold text-[20px] shadow-sm ${
                            contact.status === 'sent' ? 'bg-[#E5E5EA] text-[#86868B]' : 
                            contact.status === 'failed' ? 'bg-red-500 text-white' : 'bg-[#007AFF] text-white'
                          }`}>
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1D1D1F] text-[16px]">{contact.name}</h3>
                            <p className="text-[13px] text-[#86868B] font-mono mt-1">{contact.contactno}</p>
                          </div>
                        </div>

                        {contact.status === 'sent' ? (
                          <div className="text-[#34C759] flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 bg-[#34C759]/10 rounded-[16px]">
                            <LuCheck size={18} /> Delivered
                          </div>
                        ) : contact.status === 'failed' ? (
                           <div className="text-red-500 flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 bg-red-100 rounded-[16px]">
                            Failed
                          </div>
                        ) : (
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); triggerManualSend(contact); }}
                            disabled={isCooldown || isCoffeeBreak || isAutomating || !serverReady}
                            className={`px-7 py-3 rounded-[18px] font-semibold text-[14px] flex items-center gap-2 transition-all ${
                              isAutomating || !serverReady ? 'bg-[#E5E5EA] text-[#86868B] cursor-not-allowed' : 'bg-white border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF] hover:text-white'
                            }`}
                          >
                            Send
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
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