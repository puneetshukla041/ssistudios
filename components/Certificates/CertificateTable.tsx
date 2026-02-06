'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Inbox,
    Loader2,
    RefreshCw
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

// --- APPLE PHYSICS CONFIGURATION ---
const iosSpring = {
    type: "spring",
    stiffness: 350,
    damping: 30,
    mass: 0.8
} as const;

const layoutSpring = {
    type: "spring",
    stiffness: 500,
    damping: 35,
    mass: 1
} as const;

// --- COMPONENT: ANIMATED NUMBER ---
const AnimatedNumber = ({ value }: { value: number }) => {
    const spring = useSpring(0, { stiffness: 200, damping: 20 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
    useEffect(() => {
      spring.set(value);
    }, [value, spring]);
  
    return <motion.span className="tabular-nums">{display}</motion.span>;
};

// --- COMPONENT: PREMIUM SKELETON LOADER ---
const SkeletonLoader = () => (
    <div className="w-full space-y-6 p-2">
        {/* Action Bar Skeleton */}
        <div className="h-16 bg-gradient-to-r from-slate-200/50 to-slate-100/50 rounded-[24px] border border-white/60 shadow-sm animate-pulse" />
        
        {/* Table Skeleton */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] shadow-sm border border-white/60 overflow-hidden p-1">
            <div className="h-14 bg-white/50 rounded-[28px] mb-2 mx-1 mt-1" />
            <div className="space-y-3 p-2">
                {Array(6).fill(0).map((_, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="h-20 bg-white/60 rounded-[24px] shadow-sm border border-white/40" 
                    />
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
        // Suppress technical sync messages for cleaner UX
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
    const handleBulkMail_V1 = () => showNotification("Bulk Mail (Proctorship) coming soon", "info");
    const handleBulkMail_V2 = () => showNotification("Bulk Mail (Training) coming soon", "info");
    const handleBulkMail_V3 = () => showNotification("Bulk Mail (100+) coming soon", "info");


    // --- Render Logic ---

    if (isLoading) {
        return <SkeletonLoader />;
    }

    return (
        // Changed font-quicksand to font-sans + tracking-tight for Apple look
        <div className="relative flex flex-col gap-6 font-sans tracking-tight antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
            
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
                initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={iosSpring}
                className="z-20"
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
                className="bg-white/70 backdrop-blur-3xl rounded-[36px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden flex flex-col flex-grow relative"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, ...iosSpring }}
                layout
            >
                {/* Processing Overlay */}
                <AnimatePresence>
                    {isAnyActionLoading && (
                        <motion.div 
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            className="absolute inset-0 bg-white/40 z-50 flex items-center justify-center"
                        >
                            <motion.div 
                                initial={{ scale: 0.8, y: 10, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={iosSpring}
                                className="bg-white/80 backdrop-blur-xl p-6 px-8 rounded-[28px] shadow-2xl border border-white/60 flex flex-col items-center gap-4"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin relative z-10" />
                                </div>
                                <span className="text-[15px] font-semibold text-slate-700 tracking-wide">Processing...</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {sortedCertificates.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={iosSpring}
                        className="flex flex-col items-center justify-center py-32 px-4 text-center"
                    >
                        {/* FIXED: Changed onRefresh() to fetchCertificates() */}
                        <div className="relative group cursor-pointer" onClick={() => fetchCertificates()}>
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                            <div className="w-32 h-32 bg-gradient-to-br from-white to-slate-50 rounded-full flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-white border border-slate-100 relative z-10 group-hover:scale-105 transition-transform duration-300">
                                <Inbox className="w-14 h-14 text-slate-300 group-hover:text-indigo-400 transition-colors duration-300" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">No records found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed text-[15px]">
                            We couldn't find any records matching your active filters. Try adjusting your search query or sync the database.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsAddFormVisible(true)}
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 bg-slate-900 rounded-full shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30"
                        >
                            <span>Add New Certificate</span>
                        </motion.button>
                    </motion.div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar p-1">
                            <table className="w-full text-left border-collapse">
                                <TableHeader
                                    certificates={certificates}
                                    selectedIds={selectedIds}
                                    sortConfig={sortConfig}
                                    requestSort={requestSort}
                                    handleSelectAll={handleSelectAll}
                                />
                                <tbody className="divide-y divide-slate-100/60">
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

                        {/* --- Floating Pagination Dock --- */}
                        <div className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-[2px] z-10 flex justify-center">
                            <motion.div 
                                layout
                                className="flex items-center gap-4 bg-white/80 backdrop-blur-xl pl-6 pr-2 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 ring-1 ring-slate-900/5"
                            >
                                <div className="text-[13px] text-slate-500 font-medium tracking-wide flex items-center gap-1.5 mr-2">
                                    <span className="text-slate-900 font-bold"><AnimatedNumber value={((currentPage - 1) * PAGE_LIMIT) + 1} /></span> 
                                    <span>-</span>
                                    <span className="text-slate-900 font-bold"><AnimatedNumber value={Math.min(currentPage * PAGE_LIMIT, totalItems)} /></span> 
                                    <span className="text-slate-400">of</span>
                                    <span className="text-slate-900 font-bold"><AnimatedNumber value={totalItems} /></span>
                                </div>
                                
                                <div className="h-4 w-[1px] bg-slate-200" />
                                
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        whileHover={{ backgroundColor: "#F1F5F9" }}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-full text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </motion.button>
                                    
                                    <div className="flex items-center px-1">
                                        <div className="bg-slate-100 text-slate-900 text-[13px] font-bold h-8 min-w-[32px] px-2 flex items-center justify-center rounded-lg">
                                            {currentPage}
                                        </div>
                                        <span className="text-slate-400 text-[13px] font-medium mx-1">/</span>
                                        <span className="text-slate-500 text-[13px] font-medium">{totalPages}</span>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        whileHover={{ backgroundColor: "#F1F5F9" }}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-2 rounded-full text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </motion.div>
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