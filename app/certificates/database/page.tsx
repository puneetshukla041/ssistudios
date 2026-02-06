'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image'; 
import { FiRefreshCw, FiSearch, FiHelpCircle, FiGrid, FiUserCheck, FiUsers, FiDownload, FiCheckCircle, FiX } from 'react-icons/fi';
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

// --- IOS ANIMATION PHYSICS ---
const iosSpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 0.8
};

// --- COMPONENT: SMOOTH ANIMATED NUMBER ---
// Uses spring physics to interpolate numbers smoothly (0 -> 1000)
const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

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
  const [dbTotalRecords, setDbTotalRecords] = useState(0); // For stats

  // --- Search & UI State ---
  const [inputQuery, setInputQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [isHelpCardVisible, setIsHelpCardVisible] = useState(false); 
  const [dummyLoading, setDummyLoading] = useState(false);

  // --- ADD FORM STATE ---
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCertificateData, setNewCertificateData] = useState<Omit<ICertificateClient, '_id'>>(initialNewCertificateState);

  // --- Debounce ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => setSearchQuery(inputQuery), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [inputQuery]);

  // --- Fetch Global Stats ---
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

  // --- Alerts & Refresh Logic ---
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
      const timeout = setTimeout(() => setIsRefreshing(false), 2000); 
      return () => clearTimeout(timeout);
    }
  }, [isRefreshing]);

  // --- Fetch Export ---
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

  // --- Actions Hook Setup ---
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

  // --- Handlers ---
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
    <div className="min-h-full w-full bg-[#F2F2F7] text-slate-800 font-quicksand selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
        
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

      <main className="mx-auto w-full max-w-[1600px] px-6 py-8 space-y-8">
        
        {/* --- HEADER SECTION --- */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 pl-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              Certificate Database
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[13px] text-slate-500 font-semibold tracking-wide uppercase opacity-80"
            >
              Centralized Repository
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full lg:w-[420px] group"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-[#007AFF] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="
                block w-full rounded-[24px] border-none bg-white py-4 pl-12 pr-4 
                text-[15px] font-medium text-slate-700 placeholder:text-slate-400 
                focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white
                shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.05)]
                transition-all duration-300
              "
            />
          </motion.div>
        </header>

        {/* --- DASHBOARD STATS GRID (WIDGET STYLE) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* 1. TOTAL CERTIFICATES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
            transition={iosSpring}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-sm border border-white/50 cursor-default group"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                  Total Records
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold text-slate-800 tracking-tight">
                  <AnimatedNumber value={dbTotalRecords} />
                </span>
              </div>
            </div>
            {/* Widget Icon Container */}
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center p-0.5 transform group-hover:scale-110 transition-transform duration-500">
               <div className="relative w-9 h-9 opacity-95 invert brightness-0">
                  <Image src="/logos/ssilogo.png" alt="Logo" fill className="object-contain" />
               </div>
            </div>
          </motion.div>

          {/* 2. TOTAL HOSPITALS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
            transition={{ ...iosSpring, delay: 0.1 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-sm border border-white/50 cursor-default group"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                  Hospitals
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold text-slate-800 tracking-tight">
                  <AnimatedNumber value={uniqueHospitals.length} />
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-blue-400 to-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                <FiGrid className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* 3. TOTAL DOCTORS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
            transition={{ ...iosSpring, delay: 0.2 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-sm border border-white/50 cursor-default group"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-violet-500 transition-colors">
                  Doctors
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold text-slate-800 tracking-tight">
                  <AnimatedNumber value={doctorsCount} />
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-violet-400 to-violet-500 shadow-lg shadow-violet-500/20 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                <FiUserCheck className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* 4. TOTAL STAFF */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
            transition={{ ...iosSpring, delay: 0.3 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-sm border border-white/50 cursor-default group"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                  Staff
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-bold text-slate-800 tracking-tight">
                  <AnimatedNumber value={staffCount} />
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                <FiUsers className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        </div>

        {/* --- ACTION TOOLBAR --- */}
        <div className="flex flex-col gap-4 pb-2 z-20 relative">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                
                {/* ✅ NEW BATCH ACTIONS - Dynamic Island Expand Animation */}
                <AnimatePresence mode='wait'>
                    {newBatchIds.length > 0 && isBatchLoaded && (
                        <motion.div
                            key="new-batch-actions"
                            initial={{ opacity: 0, scale: 0.8, width: 50 }}
                            animate={{ opacity: 1, scale: 1, width: "auto" }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={iosSpring}
                            className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mr-auto sm:mr-0 p-1.5 pr-3 bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-[24px] shadow-lg shadow-indigo-100/50 overflow-hidden"
                        >
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider px-3 hidden lg:inline-block">
                                Batch Ready
                            </span>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBulkGeneratePDF_V2(newBatchIds)}
                                disabled={isBulkGeneratingV2}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold rounded-[18px] hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                            >
                                {isBulkGeneratingV2 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                <span>Training</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBulkGeneratePDF_V1(newBatchIds)}
                                disabled={isBulkGeneratingV1}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold rounded-[18px] hover:bg-indigo-100 transition-colors"
                            >
                                {isBulkGeneratingV1 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                <span>Proctoring</span>
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClearBatch}
                                className="cursor-pointer ml-1 p-2 text-slate-300 hover:text-red-500 bg-transparent rounded-full transition-colors"
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
                    whileTap={{ scale: 0.96 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`
                        cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 
                        rounded-[20px] text-sm font-bold border transition-all duration-300
                        ${isRefreshing 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                        : 'bg-white text-slate-600 border-slate-200 hover:text-[#007AFF] hover:border-[#007AFF]/30 shadow-sm hover:shadow-md'
                        }
                    `}
                >
                    <FiRefreshCw 
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    <span>Sync</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsHelpCardVisible(true)}
                    className="
                        cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 
                        rounded-[20px] text-sm font-bold border border-transparent
                        bg-[#1C1C1E] text-white shadow-xl shadow-black/10 hover:bg-black
                        transition-all duration-300
                    "
                >
                    <FiHelpCircle className="w-4 h-4" />
                    <span>Guide</span>
                </motion.button>
            </div>
        </div>

        {/* --- CONTENT AREA: Charts & Table --- */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Analytics Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgb(0,0,0,0.05)] overflow-hidden p-1.5"
          >
            <HospitalPieChart
              uniqueHospitals={uniqueHospitals}
              totalRecords={totalRecords}
              certificates={certificateData} 
            />
          </motion.div>
          
          {/* Data Table Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgb(0,0,0,0.05)] overflow-hidden min-h-[500px] p-1.5"
          >
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
          </motion.div>
        </div>
      </main>

      <style>{`
        .font-quicksand {
          font-family: 'Quicksand', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default CertificateDatabasePage;