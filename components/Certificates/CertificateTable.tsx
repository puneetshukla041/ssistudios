'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Inbox,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// Import Hooks and Utils
import { useCertificateData } from './hooks/useCertificateData';
import { useCertificateActions } from './hooks/useCertificateActions';
import { useMailCertificate } from './hooks/useMailCertificate'; 
import { CertificateTableProps, PAGE_LIMIT, NotificationState, NotificationType } from './utils/constants';

// Import UI Components
import QuickActionBar from './ui/QuickActionBar';
import TableHeader from './ui/TableHeader';
import TableRow from './ui/TableRow';
import MailComposer from './ui/MailComposer';
import FloatingNotification from './ui/FloatingNotification';
import SuccessAnimation from './ui/SuccessAnimation'; 

// --- IOS PHYSICS ---
// FIXED: Added 'as const' to ensure strict typing for Framer Motion
const iosSpring = {
    type: "spring",
    stiffness: 350,
    damping: 30,
    mass: 0.8
} as const;

// --- COMPONENT: ANIMATED NUMBER (For Pagination) ---
const AnimatedNumber = ({ value }: { value: number }) => {
    const spring = useSpring(0, { stiffness: 200, damping: 20 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
    useEffect(() => {
      spring.set(value);
    }, [value, spring]);
  
    return <motion.span>{display}</motion.span>;
};

// --- COMPONENT: MODERN SKELETON LOADER ---
const SkeletonLoader = () => (
    <div className="w-full space-y-6">
        {/* Action Bar Skeleton */}
        <div className="h-16 bg-white/50 rounded-[24px] border border-white/40 animate-pulse shadow-sm" />
        
        {/* Table Skeleton */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/50 overflow-hidden p-2">
            <div className="h-14 bg-white/40 rounded-[24px] mb-2" />
            <div className="space-y-2">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-white/30 rounded-[20px] animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

// --- Extended Props Interface ---
interface CertificateTableExtendedProps extends CertificateTableProps {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    hospitalFilter: string;
    setHospitalFilter: React.Dispatch<React.SetStateAction<string>>;
    isAddFormVisible: boolean;
    setIsAddFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    uniqueHospitals?: string[];
}

const CertificateTable: React.FC<CertificateTableExtendedProps> = ({ 
    refreshKey, 
    onRefresh, 
    searchQuery,
    setSearchQuery,
    hospitalFilter,
    setHospitalFilter,
    isAddFormVisible,
    setIsAddFormVisible,
    uniqueHospitals: _propUniqueHospitals 
}) => {
    
    // ✅ State for Certificate Type Mode
    const [certTypeMode, setCertTypeMode] = useState('internal');

    // --- Notification State ---
    const [notification, setNotification] = useState<NotificationState | null>(null);

    const showNotification = useCallback((message: string, type: NotificationType) => {
        setNotification({ message, type, active: true });
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, active: false } : null);
        }, 3000);
        setTimeout(() => {
            setNotification(null);
        }, 3500);
    }, []);

    const pdfOnAlert = useCallback((message: string, isError: boolean) => {
        if (!isError && (message.includes('synchronized') || message.includes('loaded'))) {
            return;
        }
        showNotification(message, isError ? 'error' : 'info');
    }, [showNotification]);


    // --- Data Hooks ---
    const {
        certificates,
        isLoading,
        totalItems,
        currentPage,
        totalPages,
        uniqueHospitals, 
        sortConfig,
        selectedIds,
        fetchCertificates,
        fetchCertificatesForExport,
        deleteCertificate,
        updateCertificate,
        setCurrentPage,
        setSelectedIds,
        requestSort,
        sortedCertificates,
        setIsLoading,
    } = useCertificateData(
        refreshKey, 
        onRefresh, 
        showNotification, 
        searchQuery, 
        hospitalFilter, 
        setSearchQuery, 
        setHospitalFilter
    ); 

    // --- Action Hooks ---
    const {
        editingId,
        editFormData,
        flashId,
        deletingId,
        generatingPdfId,
        generatingPdfV1Id,
        isBulkGeneratingV1, 
        isBulkGeneratingV2,
        isBulkGeneratingV3,
        showSuccessAnimation,
        successMessage,
        setEditingId,
        setEditFormData,
        setFlashId,
        handleSelectOne,
        handleSelectAll,
        handleBulkDelete,
        handleEdit,
        handleSave,
        handleDelete,
        handleChange,
        handleDownload,
        handleGeneratePDF_V1,
        handleGeneratePDF_V2,
        handleBulkGeneratePDF_V1, 
        handleBulkGeneratePDF_V2, 
        handleBulkGeneratePDF_V3,
    } = useCertificateActions({
        certificates,
        selectedIds,
        setSelectedIds,
        fetchCertificates,
        fetchCertificatesForExport,
        deleteCertificate,
        updateCertificate,
        showNotification, 
        onAlert: pdfOnAlert, 
        setIsLoading,
    });
    
    // --- Mail Hooks ---
    const {
        isMailComposerOpen,
        mailComposerCert,
        mailComposerPdfBlob,
        isSending,
        handleOpenMailComposer,
        handleSendMail,
        handleCloseMailComposer,
    } = useMailCertificate(pdfOnAlert); 

    const isAnyActionLoading = isMailComposerOpen || isSending || isBulkGeneratingV1 || isBulkGeneratingV2 || isBulkGeneratingV3;

    useEffect(() => {
        if (flashId) {
            const timer = setTimeout(() => setFlashId(null), 1000); 
            return () => clearTimeout(timer);
        }
    }, [flashId, setFlashId]);

    // ✅ Bulk Mail Handlers
    const handleBulkMail_V1 = () => showNotification("Bulk Mail (Proctorship) feature coming soon!", "info");
    const handleBulkMail_V2 = () => showNotification("Bulk Mail (Training) feature coming soon!", "info");
    const handleBulkMail_V3 = () => showNotification("Bulk Mail (100+) feature coming soon!", "info");


    // --- Render Logic ---

    if (isLoading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="relative flex flex-col gap-6 font-quicksand">
            
            {/* Global Overlays */}
            <FloatingNotification 
                message={notification?.message || ''}
                type={notification?.type || 'info'}
                isVisible={!!notification?.active}
                onClose={() => setNotification(prev => prev ? { ...prev, active: false } : null)}
            />

            <SuccessAnimation 
                isVisible={showSuccessAnimation} 
                message={successMessage} 
            />
            
            {/* Action Bar (Sliding In) */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={iosSpring}
            >
                <QuickActionBar
                    isAddFormVisible={isAddFormVisible}
                    selectedIds={selectedIds}
                    uniqueHospitals={uniqueHospitals}
                    hospitalFilter={hospitalFilter}
                    setIsAddFormVisible={setIsAddFormVisible} 
                    setHospitalFilter={setHospitalFilter}
                    handleBulkDelete={handleBulkDelete}
                    handleDownload={handleDownload}
                    
                    // ✅ State & Handlers
                    certTypeMode={certTypeMode}
                    setCertTypeMode={setCertTypeMode}
                    
                    isBulkGeneratingV1={isBulkGeneratingV1}
                    isBulkGeneratingV2={isBulkGeneratingV2}
                    isBulkGeneratingV3={isBulkGeneratingV3}
                    
                    handleBulkGeneratePDF_V1={handleBulkGeneratePDF_V1}
                    handleBulkGeneratePDF_V2={handleBulkGeneratePDF_V2}
                    handleBulkGeneratePDF_V3={handleBulkGeneratePDF_V3}

                    handleBulkMail_V1={handleBulkMail_V1}
                    handleBulkMail_V2={handleBulkMail_V2}
                    handleBulkMail_V3={handleBulkMail_V3}
                />
            </motion.div>

            {/* Main Content Area (Glass Card) */}
            <motion.div 
                className="bg-white/60 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_40px_-10px_rgb(0,0,0,0.05)] border border-white/50 overflow-hidden flex flex-col flex-grow relative"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, ...iosSpring }}
            >
                {/* Processing Overlay */}
                <AnimatePresence>
                    {isAnyActionLoading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/40 backdrop-blur-md z-50 flex items-center justify-center"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-white/90 p-5 rounded-[24px] shadow-2xl border border-white/60 flex items-center gap-4"
                            >
                                <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />
                                <span className="text-[15px] font-semibold text-slate-800">Processing request...</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {sortedCertificates.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-28 px-4 text-center"
                    >
                        <div className="w-28 h-28 bg-gradient-to-tr from-slate-100 to-white rounded-full flex items-center justify-center mb-6 shadow-inner ring-[1px] ring-slate-200">
                            <Inbox className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">No records found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed text-sm">
                            We couldn't find any records matching your active filters. Try adjusting your search query or add a new entry.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAddFormVisible(true)}
                            className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                        >
                            <span>Add New Certificate</span>
                        </motion.button>
                    </motion.div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <TableHeader
                                    certificates={certificates}
                                    selectedIds={selectedIds}
                                    sortConfig={sortConfig}
                                    requestSort={requestSort}
                                    handleSelectAll={handleSelectAll}
                                />
                                <tbody className="divide-y divide-slate-100/50 bg-white/40">
                                    {sortedCertificates.map((cert, index) => ( 
                                        <TableRow
                                            key={cert._id}
                                            cert={cert}
                                            index={index} 
                                            currentPage={currentPage} 
                                            isSelected={selectedIds.includes(cert._id)}
                                            isEditing={editingId === cert._id}
                                            isFlashing={flashId === cert._id}
                                            isDeleting={deletingId === cert._id || (deletingId !== null && selectedIds.includes(cert._id))}
                                            generatingPdfId={generatingPdfId}
                                            generatingPdfV1Id={generatingPdfV1Id}
                                            editFormData={editFormData}
                                            handleSelectOne={handleSelectOne}
                                            handleEdit={handleEdit}
                                            handleSave={handleSave}
                                            handleDelete={handleDelete}
                                            handleChange={handleChange}
                                            setEditingId={setEditingId}
                                            handleGeneratePDF_V1={handleGeneratePDF_V1}
                                            handleGeneratePDF_V2={handleGeneratePDF_V2}
                                            handleMailCertificate={handleOpenMailComposer}
                                            isAnyActionLoading={isAnyActionLoading}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Modern Floating Pagination --- */}
                        <div className="border-t border-white/50 bg-white/40 backdrop-blur-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-[13px] text-slate-500 font-medium tracking-wide flex items-center gap-1">
                                Showing <span className="text-slate-900 font-bold"><AnimatedNumber value={((currentPage - 1) * PAGE_LIMIT) + 1} /></span> 
                                to <span className="text-slate-900 font-bold"><AnimatedNumber value={Math.min(currentPage * PAGE_LIMIT, totalItems)} /></span> 
                                of <span className="text-slate-900 font-bold"><AnimatedNumber value={totalItems} /></span> results
                            </div>
                            
                            <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-[16px] shadow-sm border border-slate-200/50">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.1, backgroundColor: "#F1F5F9" }}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-[12px] text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:scale-100 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </motion.button>
                                
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                                        .map((page, index, array) => (
                                            <React.Fragment key={page}>
                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                    <span className="text-[10px] text-slate-300 px-1 select-none">•••</span>
                                                )}
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={clsx(
                                                        "w-8 h-8 flex items-center justify-center rounded-[10px] text-[13px] font-bold transition-all cursor-pointer",
                                                        page === currentPage
                                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                    )}
                                                >
                                                    {page}
                                                </motion.button>
                                            </React.Fragment>
                                    ))}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.1, backgroundColor: "#F1F5F9" }}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-[12px] text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:scale-100 transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
            
            {/* Mail Composer Modal */}
            <AnimatePresence>
                {isMailComposerOpen && mailComposerCert && (
                    <MailComposer
                        certData={mailComposerCert}
                        pdfBlob={mailComposerPdfBlob}
                        isSending={isSending}
                        onClose={handleCloseMailComposer}
                        onSend={handleSendMail}
                        onAlert={pdfOnAlert} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CertificateTable;