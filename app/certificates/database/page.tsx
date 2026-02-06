'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image'; 
import { FiRefreshCw, FiSearch, FiHelpCircle, FiGrid, FiUserCheck, FiUsers, FiDownload, FiCheckCircle, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

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

const CertificateDatabasePage: React.FC = () => {
  // --- Global State ---
  const [refreshKey, setRefreshKey] = useState(0);
  const [certificateData, setCertificateData] = useState<ICertificateClient[]>([]);
  const [totalRecords, setTotalRecords] = useState(0); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uniqueHospitals, setUniqueHospitals] = useState<string[]>([]);
    
  // --- NEW: Batch Upload State (With Persistence) ---
  const [newBatchIds, setNewBatchIds] = useState<string[]>([]);
  const [isBatchLoaded, setIsBatchLoaded] = useState(false);

  // Load Batch IDs from LocalStorage on mount
  useEffect(() => {
    let mounted = true;
    try {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cert_db_new_batch');
            if (saved && mounted) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setNewBatchIds(parsed);
                }
            }
        }
    } catch (e) {
        console.error("Failed to load saved batch", e);
    } finally {
        if (mounted) setIsBatchLoaded(true);
    }
    return () => { mounted = false; };
  }, []);

  // Save Batch IDs to LocalStorage whenever they change
  useEffect(() => {
    if (!isBatchLoaded) return; 

    if (newBatchIds.length > 0) {
        localStorage.setItem('cert_db_new_batch', JSON.stringify(newBatchIds));
    } else {
        localStorage.removeItem('cert_db_new_batch');
    }
  }, [newBatchIds, isBatchLoaded]);

  // --- Stats State ---
  const [dbTotalRecords, setDbTotalRecords] = useState(0); 
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);

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

  // --- Animated Counts State ---
  const [animatedTotalRecords, setAnimatedTotalRecords] = useState(0);
  const [animatedHospitalCount, setAnimatedHospitalCount] = useState(0);
  const [animatedDoctors, setAnimatedDoctors] = useState(0);
  const [animatedStaff, setAnimatedStaff] = useState(0);

  // --- Debounce Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(inputQuery);
    }, 500);
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

  // --- Helper: Number Animation ---
  const useCounterAnimation = (targetValue: number, setter: React.Dispatch<React.SetStateAction<number>>, duration = 2000) => {
    useEffect(() => {
      let start = 0; 
      const end = targetValue;
      if (start === end) return;
      const steps = 50;
      const stepTime = duration / steps;
      const increment = (end - start) / steps; 
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          start += increment;
          setter(Math.round(start));
        } else {
          setter(end);
          clearInterval(timer);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }, [targetValue, duration, setter]);
  };

  useCounterAnimation(dbTotalRecords, setAnimatedTotalRecords);
  useCounterAnimation(uniqueHospitals.length, setAnimatedHospitalCount);
  useCounterAnimation(doctorsCount, setAnimatedDoctors, 1500);
  useCounterAnimation(staffCount, setAnimatedStaff, 1500);

  // --- Alerts & Refresh Logic ---
  const handleAlert = useCallback(
    (message: string, isError: boolean) => {
       if (isError) console.error("Alert (ERROR):", message);
       else console.log("Alert (INFO):", message);
    },
    []
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setIsRefreshing(true);
  }, []);

  // Safety timeout for refresh spinner
  useEffect(() => {
    if (isRefreshing) {
      const timeout = setTimeout(() => {
        setIsRefreshing(false);
      }, 2000); 
      return () => clearTimeout(timeout);
    }
  }, [isRefreshing]);

  // --- Fetch Function for Actions Hook (Page Level) ---
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

  // --- Dummies for Hook ---
  const [dummySelectedIds, setDummySelectedIds] = useState<string[]>([]);
    
  // ✅ DELETE Function
  const deleteCertificate = useCallback(async (id: string): Promise<boolean> => {
      try {
          const response = await fetch(`/api/certificates/${id}`, {
              method: 'DELETE',
          });
            
          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || "Failed to delete certificate");
          }
          return true;
      } catch (error: any) {
          console.error("Delete error:", error);
          handleAlert(error.message || "Failed to delete certificate", true);
          return false;
      }
  }, [handleAlert]);

  // ✅ UPDATE Function (Required by Hook, even if only used for bulk actions here)
  const updateCertificate = useCallback(async (id: string, data: Partial<ICertificateClient>): Promise<boolean> => {
    try {
        const response = await fetch(`/api/certificates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update certificate");
        }

        return true;
    } catch (error: any) {
        console.error("Update error:", error);
        handleAlert(error.message || "Failed to update certificate", true);
        return false;
    }
  }, [handleAlert]);

  // --- Initialize Actions Hook ---
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

  // --- Upload Handlers ---
  const handleUploadSuccess = useCallback((message: string, uploadedIds?: string[]) => {
    handleAlert(message, false);
    handleRefresh();
    
    // Check if we received the IDs of the new batch
    if (uploadedIds && Array.isArray(uploadedIds) && uploadedIds.length > 0) {
        console.log("New Batch Detected:", uploadedIds.length);
        setNewBatchIds(uploadedIds);
    } else {
        console.warn("Upload succeeded but no IDs were returned to client.");
    }
  }, [handleAlert, handleRefresh]);

  const handleUploadError = useCallback((message: string) => {
    if (message) handleAlert(message, true);
  }, [handleAlert]);

  const handleClearBatch = () => {
    setNewBatchIds([]);
  };

  const handleTableDataUpdate = useCallback(
    (data: ICertificateClient[], totalCount: number, uniqueHospitalsList: string[]) => {
       setCertificateData(data);
       setTotalRecords(totalCount);
       setUniqueHospitals(uniqueHospitalsList); 
       setIsRefreshing(false);
    },
    []
  );

  const handleNewCertChange = (field: keyof Omit<ICertificateClient, '_id'>, value: string) => {
    setNewCertificateData(prev => ({
        ...prev,
        [field]: value
    }));
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCertificateData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add certificate");
        }

        handleAlert("Certificate saved successfully!", false);
        setRefreshKey(prev => prev + 1); 
        return true; 

    } catch (error: any) {
        console.error("Error saving:", error);
        handleAlert(error.message, true);
        alert(error.message); 
        return false;
    } finally {
        setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-slate-800 font-quicksand selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
        
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Certificate Database
            </h1>
            <p className="text-[13px] text-slate-500 font-semibold tracking-wide uppercase opacity-80">
              Centralized Repository
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full lg:w-[420px] group"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-[#007AFF] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search database..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="
                block w-full rounded-[20px] border-none bg-white py-4 pl-12 pr-4 
                text-[15px] font-medium text-slate-700 placeholder:text-slate-400 
                focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white
                shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.05)]
                transition-all duration-300
              "
            />
          </motion.div>
        </header>

        {/* --- DASHBOARD STATS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. TOTAL CERTIFICATES */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={iosSpring}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Records
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-800 tracking-tight">
                  {animatedTotalRecords.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center p-0.5">
               <div className="relative w-8 h-8 opacity-90 invert brightness-0">
                  <Image src="/logos/ssilogo.png" alt="Logo" fill className="object-contain" />
               </div>
            </div>
          </motion.div>

          {/* 2. TOTAL HOSPITALS */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ ...iosSpring, delay: 0.1 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Hospitals
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-800 tracking-tight">
                  {animatedHospitalCount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-blue-400 to-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <FiGrid className="w-7 h-7 text-white" />
            </div>
          </motion.div>

          {/* 3. TOTAL DOCTORS */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ ...iosSpring, delay: 0.2 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Doctors
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-800 tracking-tight">
                  {animatedDoctors.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-violet-400 to-violet-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                <FiUserCheck className="w-7 h-7 text-white" />
            </div>
          </motion.div>

          {/* 4. TOTAL STAFF */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ ...iosSpring, delay: 0.3 }}
            className="relative flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
          >
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Staff
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold text-slate-800 tracking-tight">
                  {animatedStaff.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <FiUsers className="w-7 h-7 text-white" />
            </div>
          </motion.div>
        </div>

        {/* --- ACTION TOOLBAR --- */}
        <div className="flex flex-col gap-4 pb-2">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                
                {/* ✅ NEW BATCH ACTIONS - Dynamic Island Style */}
                <AnimatePresence mode='wait'>
                    {newBatchIds.length > 0 && isBatchLoaded && (
                        <motion.div
                            key="new-batch-actions"
                            initial={{ opacity: 0, scale: 0.9, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: "auto" }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            transition={iosSpring}
                            className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mr-auto sm:mr-0 p-1.5 pr-3 bg-white border border-indigo-100 rounded-[20px] shadow-sm overflow-hidden"
                        >
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider px-3 hidden lg:inline-block">
                                New Batch ({newBatchIds.length})
                            </span>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBulkGeneratePDF_V2(newBatchIds)}
                                disabled={isBulkGeneratingV2}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold rounded-[14px] hover:shadow-md transition-all shadow-indigo-200"
                            >
                                {isBulkGeneratingV2 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                <span>Training</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBulkGeneratePDF_V1(newBatchIds)}
                                disabled={isBulkGeneratingV1}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold rounded-[14px] hover:bg-indigo-100 transition-colors"
                            >
                                {isBulkGeneratingV1 ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                <span>Proctoring</span>
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClearBatch}
                                className="ml-1 p-2 text-slate-300 hover:text-red-500 bg-transparent rounded-full transition-colors"
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`
                        w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 
                        rounded-[16px] text-sm font-bold border transition-all duration-300
                        ${isRefreshing 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                        : 'bg-white text-slate-600 border-slate-200 hover:text-[#007AFF] hover:border-[#007AFF]/30 shadow-sm'
                        }
                    `}
                >
                    <FiRefreshCw 
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    <span>Sync</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsHelpCardVisible(true)}
                    className="
                        w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 
                        rounded-[16px] text-sm font-bold border border-transparent
                        bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-900 
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
          <div className="rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgb(0,0,0,0.05)] overflow-hidden p-1">
            <HospitalPieChart
              uniqueHospitals={uniqueHospitals}
              totalRecords={totalRecords}
              certificates={certificateData} 
            />
          </div>
          
          {/* Data Table Section */}
          <div className="rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgb(0,0,0,0.05)] overflow-hidden min-h-[500px] p-1">
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