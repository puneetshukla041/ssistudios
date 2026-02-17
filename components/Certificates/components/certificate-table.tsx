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
import { useCertificateData } from '../hooks/useCertificateData';
import { useCertificateActions } from '../hooks/useCertificateActions';
import { useMailCertificate } from '../hooks/useMailCertificate'; 
import { CertificateTableProps, PAGE_LIMIT, NotificationState, NotificationType } from '../utils/constants';

// Import UI Components
import QuickActionBar from '../ui/QuickActionBar';
import TableHeader from '../ui/TableHeader';
import TableRow from '../ui/TableRow';
import MailComposer from '../ui/MailComposer';
import FloatingNotification from '../ui/FloatingNotification';
import SuccessAnimation from '../ui/SuccessAnimation'; 

// --- APPLE PHYSICS CONFIGURATION ---
const iosSpring = {
    type: "spring",
    stiffness: 320,
    damping: 30,
    mass: 0.8
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
        <div className="h-16 bg-white/50 backdrop-blur-md rounded-[24px] border border-white/40 shadow-sm animate-pulse" />
        
        {/* Table Skeleton */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/60 overflow-hidden p-1.5">
            <div className="h-14 bg-white/50 rounded-[24px] mb-2 mx-1 mt-1" />
            <div className="space-y-3 p-2">
                {Array(6).fill(0).map((_, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="h-20 bg-white/60 rounded-[20px] shadow-sm border border-white/40" 
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
        <div className="relative flex flex-col gap-6 font-sans tracking-tight antialiased selection:bg-[#007AFF]/20 selection:text-slate-900">
            
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
                className="bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-white/60 flex flex-col flex-grow relative overflow-hidden"
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
                                className="bg-white/90 backdrop-blur-2xl p-6 px-8 rounded-[24px] shadow-2xl border border-white/60 flex flex-col items-center gap-4"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                                    <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin relative z-10" />
                                </div>
                                <span className="text-[14px] font-semibold text-slate-800 tracking-wide">Processing...</span>
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
                        <div className="relative group cursor-pointer" onClick={() => fetchCertificates()}>
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-white rounded-[28px] flex items-center justify-center mb-6 shadow-sm border border-slate-200/50 relative z-10 group-hover:scale-105 transition-transform duration-300">
                                <Inbox className="w-10 h-10 text-slate-300 group-hover:text-[#007AFF] transition-colors duration-300" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">No records found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed text-[14px]">
                            We couldn't find any records matching your active filters.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsAddFormVisible(true)}
                            className="px-6 py-3 bg-[#007AFF] hover:bg-[#0062cc] text-white text-[14px] font-semibold rounded-full shadow-lg shadow-blue-500/20 transition-all"
                        >
                            Add New Certificate
                        </motion.button>
                    </motion.div>
                ) : (
                    <>
                        {/* SCROLL FIX: 
                            1. overflow-x-auto: Allows horizontal scroll if needed
                            2. scrollbar-hide utilities: Removes the visual scrollbar line 
                            3. p-1.5: Padding to prevent shadow clipping
                        */}
                        <div className="overflow-x-auto p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            <table className="w-full text-left border-collapse">
                                <TableHeader
                                    certificates={certificates}
                                    selectedIds={selectedIds}
                                    sortConfig={sortConfig}
                                    requestSort={requestSort}
                                    handleSelectAll={handleSelectAll}
                                />
                                <tbody className="divide-y divide-slate-100/80">
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

                        {/* --- Floating Pagination Dock (Apple Dynamic Island Style) --- */}
                        <div className="sticky bottom-0 left-0 right-0 p-6 pointer-events-none z-10 flex justify-center">
                            <motion.div 
                                layout
                                className="pointer-events-auto flex items-center gap-1 bg-white/80 backdrop-blur-2xl p-1.5 pr-2 rounded-full shadow-[0_8px_40px_-10px_rgba(0,0,0,0.12)] border border-white/60 ring-1 ring-black/5"
                            >
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm hover:shadow border border-transparent hover:border-black/5 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all duration-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </motion.button>

                                <div className="flex items-center px-4 gap-3 text-[13px] font-medium text-slate-500 select-none">
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Page</span>
                                        <span className="text-slate-900 font-bold text-[14px]">
                                            <AnimatedNumber value={currentPage} />
                                        </span>
                                    </div>
                                    <div className="w-[1px] h-6 bg-slate-200" />
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total</span>
                                        <span className="text-slate-700 font-bold text-[14px]">{totalPages}</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm hover:shadow border border-transparent hover:border-black/5 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all duration-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
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