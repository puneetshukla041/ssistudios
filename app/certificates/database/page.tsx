'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image'; 
import { FiRefreshCw, FiSearch, FiHelpCircle, FiGrid, FiUserCheck, FiUsers, FiDownload, FiCheckCircle, FiX, FiDatabase, FiTrendingUp, FiPieChart } from 'react-icons/fi';
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion';

// --- IMPORTS ---
import HelpCard from '@/components/Certificates/ui/HelpCard'; 
import UploadButton from '@/components/UploadButton'; 
import CertificateTable from '@/components/Certificates/CertificateTable';
import HospitalPieChart from '@/components/Certificates/analysis/HospitalPieChart';
import AddCertificateForm from '@/components/Certificates/ui/AddCertificateForm';
import { useCertificateActions } from '@/components/Certificates/hooks/useCertificateActions';

// Import Constants
import { 
  ICertificateClient, 
  initialNewCertificateState 
} from '@/components/Certificates/utils/constants';

// --- PRO-MOTION PHYSICS (Apple Style) ---
const appleSpring = {
  type: "spring",
  stiffness: 250,
  damping: 25,
  mass: 0.6,
  restDelta: 0.001
} as const;

// --- COMPONENT: INTELLIGENT NUMBER COUNTER ---
const AnimatedCounter = ({ value }: { value: number }) => {
  const spring = useSpring(0, { stiffness: 150, damping: 20, mass: 0.8 });
  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className="tabular-nums tracking-tight">{display}</motion.span>;
};

// --- COMPONENT: VERTICAL STAT CARD ---
const VerticalStatCard = ({ 
  label, 
  value, 
  subtext, 
  icon: Icon, 
  colorClass, 
  delay 
}: { 
  label: string, 
  value: number, 
  subtext: string, 
  icon: any, 
  colorClass: string,
  delay: number
}) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ ...appleSpring, delay }}
    className="group relative p-3 bg-white/60 backdrop-blur-2xl rounded-[20px] border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-default"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="text-[24px] font-bold text-slate-800 tracking-tight leading-tight">
          <AnimatedCounter value={value} />
        </div>
        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subtext}</p>
      </div>
      <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center ${colorClass} bg-opacity-10 shadow-sm`}>
        <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </motion.div>
);

const CertificateDatabasePage: React.FC = () => {
  // --- Global State ---
  const [refreshKey, setRefreshKey] = useState(0);
  const [certificateData, setCertificateData] = useState<ICertificateClient[]>([]);
  const [totalRecords, setTotalRecords] = useState(0); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uniqueHospitals, setUniqueHospitals] = useState<string[]>([]);
    
  // --- Batch Upload State ---
  const [newBatchIds, setNewBatchIds] = useState<string[]>([]);
  const [isBatchLoaded, setIsBatchLoaded] = useState(false);

  // Load Batch IDs
  useEffect(() => {
    let mounted = true;
    try {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cert_db_new_batch');
            if (saved && mounted) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setNewBatchIds(parsed);
            }
        }
    } catch (e) {
        console.error("Failed to load saved batch", e);
    } finally {
        if (mounted) setIsBatchLoaded(true);
    }
    return () => { mounted = false; };
  }, []);

  // Save Batch IDs
  useEffect(() => {
    if (!isBatchLoaded) return; 
    if (newBatchIds.length > 0) {
        localStorage.setItem('cert_db_new_batch', JSON.stringify(newBatchIds));
    } else {
        localStorage.removeItem('cert_db_new_batch');
    }
  }, [newBatchIds, isBatchLoaded]);

  // --- Stats State ---
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [dbTotalRecords, setDbTotalRecords] = useState(0);

  // --- UI State ---
  const [inputQuery, setInputQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [isHelpCardVisible, setIsHelpCardVisible] = useState(false); 
  const [dummyLoading, setDummyLoading] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCertificateData, setNewCertificateData] = useState<Omit<ICertificateClient, '_id'>>(initialNewCertificateState);

  // --- Debounce ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => setSearchQuery(inputQuery), 400); 
    return () => clearTimeout(delayDebounceFn);
  }, [inputQuery]);

  // --- Fetch Stats ---
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch('/api/analytics/stats');
        if (res.ok) {
          const data = await res.json();
          setDoctorsCount(data.doctorsCount || 0);
          setStaffCount(data.staffCount || 0);
          setDbTotalRecords(data.totalRecords || 0);
        }
      } catch (error) {
        console.error("Failed to fetch global stats:", error);
      }
    };
    fetchGlobalStats();
  }, [refreshKey]);

  // --- Logic ---
  const handleAlert = useCallback((message: string, isError: boolean) => {
       if (isError) console.error("Alert (ERROR):", message);
       else console.log("Alert (INFO):", message);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setIsRefreshing(true);
  }, []);

  useEffect(() => {
    if (isRefreshing) {
      const timeout = setTimeout(() => setIsRefreshing(false), 1500); 
      return () => clearTimeout(timeout);
    }
  }, [isRefreshing]);

  const fetchCertificatesForExportPageSide = useCallback(async (isBulkPdfExport = false, idsToFetch: string[] = []) => {
      try {
          const params = new URLSearchParams({ all: 'true' });
          if (isBulkPdfExport && idsToFetch.length > 0) {
              params.append('ids', idsToFetch.join(','));
          }
          const response = await fetch(`/api/certificates?${params.toString()}`);
          const result = await response.json();
          return response.ok && result.success ? result.data : [];
      } catch (error) {
          console.error('Export error:', error);
          return [];
      }
  }, []);

  const [dummySelectedIds, setDummySelectedIds] = useState<string[]>([]);
    
  const deleteCertificate = useCallback(async (id: string): Promise<boolean> => {
      try {
          const response = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Failed to delete");
          return true;
      } catch (error: any) {
          handleAlert(error.message, true);
          return false;
      }
  }, [handleAlert]);

  const updateCertificate = useCallback(async (id: string, data: Partial<ICertificateClient>): Promise<boolean> => {
    try {
        const response = await fetch(`/api/certificates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to update");
        return true;
    } catch (error: any) {
        handleAlert(error.message, true);
        return false;
    }
  }, [handleAlert]);

  const { 
    handleBulkGeneratePDF_V1, 
    handleBulkGeneratePDF_V2,
    isBulkGeneratingV1, 
    isBulkGeneratingV2
  } = useCertificateActions({
    certificates: certificateData,
    selectedIds: dummySelectedIds,
    setSelectedIds: setDummySelectedIds,
    fetchCertificates: async () => { handleRefresh(); },
    deleteCertificate, 
    updateCertificate, 
    fetchCertificatesForExport: fetchCertificatesForExportPageSide,
    showNotification: (msg, type) => handleAlert(msg, type === 'error'),
    onAlert: handleAlert,
    setIsLoading: setDummyLoading,
  });

  const handleUploadSuccess = useCallback((message: string, uploadedIds?: string[]) => {
    handleAlert(message, false);
    handleRefresh();
    if (uploadedIds && Array.isArray(uploadedIds) && uploadedIds.length > 0) {
        setNewBatchIds(uploadedIds);
    }
  }, [handleAlert, handleRefresh]);

  const handleUploadError = useCallback((message: string) => {
    if (message) handleAlert(message, true);
  }, [handleAlert]);

  const handleClearBatch = () => setNewBatchIds([]);

  const handleTableDataUpdate = useCallback(
    (data: ICertificateClient[], totalCount: number, uniqueHospitalsList: string[]) => {
       setCertificateData(data);
       setTotalRecords(totalCount);
       setUniqueHospitals(uniqueHospitalsList); 
       setIsRefreshing(false);
    }, []
  );

  const handleNewCertChange = (field: keyof Omit<ICertificateClient, '_id'>, value: string) => {
    setNewCertificateData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCertificate = async (): Promise<boolean> => {
    try {
        if (!newCertificateData.certificateNo || !newCertificateData.name || !newCertificateData.hospital || !newCertificateData.doi) {
            alert("Please fill in all fields.");
            return false;
        }
        setIsAdding(true);
        const response = await fetch('/api/certificates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCertificateData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to add certificate");
        handleAlert("Certificate saved successfully!", false);
        setRefreshKey(prev => prev + 1); 
        return true; 
    } catch (error: any) {
        handleAlert(error.message, true);
        return false;
    } finally {
        setIsAdding(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F5F5F7] text-slate-900 font-sans antialiased tracking-tight selection:bg-[#007AFF]/30 selection:text-slate-900 relative overflow-hidden flex flex-col">
        
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {isHelpCardVisible && <HelpCard onClose={() => setIsHelpCardVisible(false)} />}
        
        {isAddFormVisible && (
            <AddCertificateForm 
                newCertificateData={newCertificateData}
                isAdding={isAdding}
                uniqueHospitals={uniqueHospitals}
                handleNewCertChange={handleNewCertChange}
                handleAddCertificate={handleAddCertificate}
                setIsAddFormVisible={setIsAddFormVisible}
                setNewCertificateData={setNewCertificateData}
            />
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <main className="w-full max-w-[1920px] px-4 md:px-6 py-1.5 relative z-10 flex flex-col lg:flex-row gap-2 lg:pl-32 transition-all duration-500 h-full overflow-hidden">
        
        {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 h-full">
            
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5 bg-white/40 backdrop-blur-xl p-1.5 rounded-[18px] border border-white/60 shadow-sm shrink-0">
                {/* 1. Title Area */}
                <div className="px-2 shrink-0 flex items-center gap-3">
                      <div className="flex flex-col">
                        <motion.h1 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[18px] font-bold tracking-tight text-slate-900 leading-none"
                        >
                            Database
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5"
                        >
                            Central Registry
                        </motion.p>
                    </div>
                </div>

                {/* 2. Actions Row (Search + Buttons) */}
                <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto xl:justify-end">
                    
                    {/* Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full sm:w-[220px] group"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <FiSearch className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-[#007AFF] transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            className="block w-full bg-white/50 border border-transparent focus:border-blue-200/50 py-1.5 pl-9 pr-3 text-[12px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-[14px] focus:bg-white transition-all h-9"
                        />
                    </motion.div>

                    {/* Batch Actions */}
                    <AnimatePresence mode='wait'>
                        {newBatchIds.length > 0 && isBatchLoaded && (
                            <motion.div
                                key="new-batch-actions"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1 p-0.5 bg-white border border-indigo-100/50 rounded-[14px] shadow-sm h-9"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBulkGeneratePDF_V2(newBatchIds)}
                                    disabled={isBulkGeneratingV2}
                                    className="cursor-pointer flex items-center justify-center w-8 h-8 bg-indigo-500 text-white rounded-[12px]"
                                    title="Training"
                                >
                                    {isBulkGeneratingV2 ? <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> : <FiDownload className="w-3.5 h-3.5" />}
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBulkGeneratePDF_V1(newBatchIds)}
                                    disabled={isBulkGeneratingV1}
                                    className="cursor-pointer flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-[12px]"
                                    title="Proctoring"
                                >
                                    {isBulkGeneratingV1 ? <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> : <FiDownload className="w-3.5 h-3.5" />}
                                </motion.button>

                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    onClick={handleClearBatch}
                                    className="cursor-pointer w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500"
                                >
                                    <FiX className="w-3.5 h-3.5" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        <div className="h-9 flex items-center">
                            <UploadButton
                                onUploadSuccess={handleUploadSuccess}
                                onUploadError={handleUploadError}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`cursor-pointer flex items-center gap-2 px-3 h-9 rounded-[14px] text-[11px] font-bold border transition-all duration-300 ${isRefreshing ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-slate-700 border-white/50 hover:text-[#007AFF] shadow-sm'}`}
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Sync</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsHelpCardVisible(true)}
                            className="cursor-pointer flex items-center gap-2 px-3 h-9 rounded-[14px] text-[11px] font-bold border border-transparent bg-[#1d1d1f] text-white shadow-lg shadow-black/10 hover:bg-black transition-all duration-300"
                        >
                            <FiHelpCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Guide</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Data Table Section - RESPONSIVE FIX */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...appleSpring, delay: 0.2 }}
                // FIX: Added 'flex flex-col' and kept 'min-h-0' to handle flex shrinking
                className="rounded-[24px] border border-white/50 bg-white/50 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden flex-1 p-0.5 min-h-0 flex flex-col"
            >
                {/* FIX: Changed overflow-hidden to overflow-y-auto so the table scrolls internally if it doesn't fit */}
                <div className="rounded-[22px] bg-white/40 h-full relative flex flex-col overflow-hidden">
                    <div className="flex-1 w-full h-full overflow-y-auto">
                        <CertificateTable
                            refreshKey={refreshKey}
                            onRefresh={handleTableDataUpdate as any} 
                            onAlert={handleAlert}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery} 
                            hospitalFilter={hospitalFilter}
                            setHospitalFilter={setHospitalFilter}
                            isAddFormVisible={isAddFormVisible}
                            setIsAddFormVisible={setIsAddFormVisible}
                            uniqueHospitals={uniqueHospitals} 
                        />
                    </div>
                </div>
            </motion.div>

        </div>

        {/* --- RIGHT SIDEBAR (STATS & GRAPH) --- */}
        <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar pb-2 h-full shrink-0">
            <div className="flex flex-col gap-2">
                
                {/* 1. Stat Cards */}
                <VerticalStatCard 
                    label="Registry" 
                    value={dbTotalRecords} 
                    subtext="Verified Entries"
                    icon={FiDatabase}
                    colorClass="bg-emerald-500 text-emerald-600"
                    delay={0.1}
                />
                
                <VerticalStatCard 
                    label="Institutions" 
                    value={uniqueHospitals.length} 
                    subtext="Partner Network"
                    icon={FiGrid}
                    colorClass="bg-blue-500 text-blue-600"
                    delay={0.15}
                />

                <VerticalStatCard 
                    label="Practitioners" 
                    value={doctorsCount} 
                    subtext="Board Certified"
                    icon={FiUserCheck}
                    colorClass="bg-violet-500 text-violet-600"
                    delay={0.2}
                />

                <VerticalStatCard 
                    label="Personnel" 
                    value={staffCount} 
                    subtext="System Directory"
                    icon={FiUsers}
                    colorClass="bg-orange-500 text-orange-600"
                    delay={0.25}
                />

                {/* 2. Graph */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: 0.3 }}
                    className="p-1 rounded-[24px] border border-white/50 bg-white/50 backdrop-blur-2xl shadow-sm"
                >
                    <div className="rounded-[20px] overflow-hidden bg-white/60 p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <FiPieChart className="text-slate-400 w-3.5 h-3.5" />
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Topology</h3>
                        </div>
                        <div className="h-[200px] w-full flex items-center justify-center">
                            <HospitalPieChart
                                uniqueHospitals={uniqueHospitals}
                                totalRecords={totalRecords}
                                certificates={certificateData} 
                            />
                        </div>
                    </div>
                </motion.div>

                {/* 3. Analytics Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: 0.35 }}
                    className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[20px] text-white shadow-lg shadow-black/10 relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h3 className="font-bold text-base mb-0.5">Intelligence</h3>
                        <p className="text-white/60 text-[10px] leading-relaxed mb-3 font-medium">
                            Automated verification and pattern analysis active.
                        </p>
                        <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                            <FiTrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                    </div>
                    <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                </motion.div>
            </div>
        </aside>

      </main>
    </div>
  );
};

export default CertificateDatabasePage;