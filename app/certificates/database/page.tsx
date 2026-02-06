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
    className="group relative p-4 bg-white/60 backdrop-blur-2xl rounded-[24px] border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="text-[26px] font-bold text-slate-800 tracking-tight leading-tight">
          <AnimatedCounter value={value} />
        </div>
        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtext}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-sm`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
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
    <div className="min-h-full w-full bg-[#F5F5F7] text-slate-900 font-sans antialiased tracking-tight selection:bg-[#007AFF]/30 selection:text-slate-900 relative overflow-hidden">
        
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

      <main className="w-full max-w-[1920px] px-4 md:px-6 py-8 relative z-10 flex flex-col lg:flex-row gap-6 lg:pl-60 transition-all duration-500">
        
        {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            {/* Header */}
            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[32px] font-bold tracking-tight text-slate-900"
                >
                  Database
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[14px] text-slate-500 font-medium tracking-wide"
                >
                  Manage all digital certifications
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full md:w-[420px] group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-[26px] opacity-0 group-focus-within:opacity-20 transition duration-500 blur-md" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/60 transition-all duration-300 group-focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-focus-within:bg-white/90">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                      <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-[#007AFF] transition-colors duration-300" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Name, ID, or Hospital..."
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      className="
                        block w-full bg-transparent py-3.5 pl-14 pr-6
                        text-[15px] font-semibold text-slate-800 placeholder:text-slate-400/80
                        focus:outline-none rounded-[24px]
                      "
                    />
                </div>
              </motion.div>
            </header>

            {/* Actions Bar */}
            <div className="w-full">
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                    <AnimatePresence mode='wait'>
                        {newBatchIds.length > 0 && isBatchLoaded && (
                            <motion.div
                                key="new-batch-actions"
                                initial={{ opacity: 0, scale: 0.8, width: 50 }}
                                animate={{ opacity: 1, scale: 1, width: "auto" }}
                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                transition={appleSpring}
                                className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mr-auto sm:mr-0 p-1.5 pr-3 bg-white/90 backdrop-blur-xl border border-indigo-100/50 rounded-[20px] shadow-[0_8px_30px_rgb(99,102,241,0.15)] overflow-hidden"
                            >
                                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider px-3 hidden lg:inline-block">
                                    Batch Ready
                                </span>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBulkGeneratePDF_V2(newBatchIds)}
                                    disabled={isBulkGeneratingV2}
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold rounded-[14px] hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                                >
                                    {isBulkGeneratingV2 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                    <span>Training</span>
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBulkGeneratePDF_V1(newBatchIds)}
                                    disabled={isBulkGeneratingV1}
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-100 text-xs font-bold rounded-[14px] hover:bg-indigo-50 transition-colors"
                                >
                                    {isBulkGeneratingV1 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                    <span>Proctoring</span>
                                </motion.button>

                                <motion.button 
                                    whileHover={{ scale: 1.2, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClearBatch}
                                    className="cursor-pointer ml-1 p-2 text-slate-400 hover:text-red-500 bg-transparent rounded-full transition-colors"
                                >
                                    <FiX className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="w-full sm:w-auto">
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
                        className={`
                            cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 
                            rounded-[20px] text-[13px] font-bold border transition-all duration-300
                            ${isRefreshing 
                            ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed' 
                            : 'bg-white text-slate-700 border-white/50 hover:text-[#007AFF] hover:border-[#007AFF]/20 shadow-sm hover:shadow-md'
                            }
                        `}
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHelpCardVisible(true)}
                        className="
                            cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 
                            rounded-[20px] text-[13px] font-bold border border-transparent
                            bg-[#1d1d1f] text-white shadow-xl shadow-black/10 hover:bg-black hover:shadow-2xl
                            transition-all duration-300
                        "
                    >
                        <FiHelpCircle className="w-4 h-4" />
                        <span>Guide</span>
                    </motion.button>
                </div>
            </div>

            {/* Data Table Section */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...appleSpring, delay: 0.2 }}
                className="rounded-[36px] border border-white/50 bg-white/50 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden min-h-[500px] flex-1 p-2"
            >
                <div className="rounded-[30px] overflow-hidden bg-white/40 h-full">
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
            </motion.div>

        </div>

        {/* --- RIGHT SIDEBAR (STATS & GRAPH) --- */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4 transition-all duration-500">
            <div className="sticky top-6 flex flex-col gap-4">
                
                {/* 1. Stat Cards */}
                <VerticalStatCard 
                    label="Records" 
                    value={dbTotalRecords} 
                    subtext="System Wide"
                    icon={FiDatabase}
                    colorClass="bg-emerald-500 text-emerald-600"
                    delay={0.1}
                />
                
                <VerticalStatCard 
                    label="Hospitals" 
                    value={uniqueHospitals.length} 
                    subtext="Active Partners"
                    icon={FiGrid}
                    colorClass="bg-blue-500 text-blue-600"
                    delay={0.15}
                />

                <VerticalStatCard 
                    label="Doctors" 
                    value={doctorsCount} 
                    subtext="Certified"
                    icon={FiUserCheck}
                    colorClass="bg-violet-500 text-violet-600"
                    delay={0.2}
                />

                <VerticalStatCard 
                    label="Staff" 
                    value={staffCount} 
                    subtext="Registered"
                    icon={FiUsers}
                    colorClass="bg-orange-500 text-orange-600"
                    delay={0.25}
                />

                {/* 2. Graph */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: 0.3 }}
                    className="p-1 rounded-[24px] border border-white/50 bg-white/50 backdrop-blur-2xl shadow-sm overflow-hidden"
                >
                    <div className="rounded-[20px] overflow-hidden bg-white/60 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FiPieChart className="text-slate-400 w-4 h-4" />
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Distribution</h3>
                        </div>
                        <div className="h-[240px] w-full flex items-center justify-center">
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
                    className="p-5 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-[24px] text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-1 leading-tight">Analytics</h3>
                        <p className="text-white/80 text-[11px] leading-relaxed mb-4">
                            Real-time insights available above.
                        </p>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <FiTrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </motion.div>
            </div>
        </aside>

      </main>
    </div>
  );
};

export default CertificateDatabasePage;