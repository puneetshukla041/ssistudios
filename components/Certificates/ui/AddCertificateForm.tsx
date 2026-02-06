import React, { useState, useRef, useEffect } from 'react';
import { initialNewCertificateState, ICertificateClient } from '../utils/constants';
import { doiToDateInput, dateInputToDoi, getTodayDoi } from '../utils/helpers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import {
    Tag, User, Hospital, Calendar, Save, Loader2, X, ChevronDown, Check, Sparkles, Download, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Interface definitions
interface AddCertificateFormProps {
    newCertificateData: Omit<ICertificateClient, '_id'>;
    isAdding: boolean;
    uniqueHospitals?: string[];
    handleNewCertChange: (field: keyof Omit<ICertificateClient, '_id'>, value: string) => void;
    handleAddCertificate: () => Promise<boolean>;
    setIsAddFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setNewCertificateData: React.Dispatch<React.SetStateAction<Omit<ICertificateClient, '_id'>>>;
}

// Reusable Input Field Component with Apple-style styling
const InputField = ({
    label, icon: Icon, placeholder, value, onChange, type = 'text', onFocus, onBlur, autoComplete
}: {
    label: string, icon: React.ElementType, placeholder: string, value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string,
    onFocus?: () => void, onBlur?: () => void, autoComplete?: string
}) => (
    <div className="space-y-2 group w-full">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 transition-colors duration-300">
            {label}
        </label>
        <div className="relative isolate">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                <Icon className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                autoComplete={autoComplete}
                className="block w-full rounded-[18px] border border-slate-200/80 bg-slate-50/50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all duration-300 ease-out hover:border-slate-300/80 hover:bg-slate-50"
            />
        </div>
    </div>
);

const AddCertificateForm: React.FC<AddCertificateFormProps> = ({
    newCertificateData, isAdding, uniqueHospitals = [], handleNewCertChange,
    handleAddCertificate, setIsAddFormVisible, setNewCertificateData,
}) => {

    const [view, setView] = useState<'form' | 'success'>('form');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Auto-fetch Today's Date on Mount
    useEffect(() => {
        if (!newCertificateData.doi) {
            handleNewCertChange('doi', getTodayDoi());
        }
    }, []);

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const capitalizedValue = rawValue.replace(/\b\w/g, (char) => char.toUpperCase());
        handleNewCertChange('hospital', capitalizedValue);
        setShowSuggestions(true);
    };

    const filteredHospitals = uniqueHospitals.filter(hospital => {
        if (!hospital) return false;
        const searchTerm = newCertificateData.hospital || '';
        if (searchTerm.trim() === '') return true;
        return hospital.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const selectHospital = (hospital: string) => {
        handleNewCertChange('hospital', hospital);
        setShowSuggestions(false);
    };

    const handleSubmit = async () => {
        const success = await handleAddCertificate();
        if (success) {
            setView('success');
        }
    };

    const handleReset = () => {
        setNewCertificateData({ ...initialNewCertificateState, doi: getTodayDoi() });
        setView('form');
    };

    const handleDownload = async (template: 'certificate1.pdf' | 'certificate2.pdf') => {
        setIsGeneratingPdf(true);
        try {
            // Mock ID for new cert since it might not be in the list yet
            const certForPdf = { ...newCertificateData, _id: 'new-temp' } as ICertificateClient;

            // @ts-ignore - assuming util function signature matches
            const result = await generateCertificatePDF(
                certForPdf,
                (msg, isErr) => console.log(msg),
                template,
                setIsGeneratingPdf,
                false
            );

            if (result && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans tracking-tight antialiased">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddFormVisible(false)}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
                className="relative w-full max-w-2xl bg-white/90 rounded-[32px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] ring-1 ring-white/60 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <AnimatePresence mode="wait">
                    {view === 'form' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col h-full bg-white/80 backdrop-blur-xl"
                        >
                            {/* Header */}
                            <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-white/60 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <Sparkles className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                                            Issue Certificate
                                        </h2>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium">
                                            Enter details to generate a new record.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFormVisible(false)}
                                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Body - Scrollable */}
                            <div className="px-6 md:px-8 pt-6 md:pt-8 pb-40 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-6 md:space-y-8">
                                    {/* Section 1: Identity */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                        <InputField
                                            label="Certificate ID"
                                            icon={Tag}
                                            placeholder="CERT-202X-XXXX"
                                            value={newCertificateData.certificateNo}
                                            onChange={(e) => handleNewCertChange('certificateNo', e.target.value)}
                                        />
                                        <InputField
                                            label="Recipient Name"
                                            icon={User}
                                            placeholder="Dr. John Doe"
                                            value={newCertificateData.name}
                                            onChange={(e) => handleNewCertChange('name', e.target.value)}
                                        />
                                    </div>

                                    {/* Section 2: Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                        {/* Hospital Dropdown */}
                                        <div className="relative z-50" ref={wrapperRef}>
                                            <InputField
                                                label="Institution / Hospital"
                                                icon={Hospital}
                                                placeholder="Search or type hospital..."
                                                value={newCertificateData.hospital}
                                                onChange={handleHospitalChange}
                                                onFocus={() => setShowSuggestions(true)}
                                                autoComplete="off"
                                            />
                                            <div className="absolute right-4 top-[38px] pointer-events-none text-slate-400">
                                                <ChevronDown className="w-4 h-4 opacity-50" />
                                            </div>

                                            <AnimatePresence>
                                                {showSuggestions && filteredHospitals.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] border border-white/60 z-50 overflow-hidden max-h-60 overflow-y-auto ring-1 ring-black/5"
                                                    >
                                                        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Institutions</span>
                                                        </div>
                                                        <div className="p-1.5 space-y-0.5">
                                                            {filteredHospitals.map((hospital, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => selectHospital(hospital)}
                                                                    className={clsx(
                                                                        "w-full text-left px-3.5 py-2.5 rounded-[14px] text-[13px] transition-all duration-200 flex items-center justify-between group cursor-pointer",
                                                                        newCertificateData.hospital === hospital
                                                                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                                    )}
                                                                >
                                                                    <span className="truncate">{hospital}</span>
                                                                    {newCertificateData.hospital === hospital && (
                                                                        <Check className="w-4 h-4 text-indigo-600" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <InputField
                                            label="Date of Issue"
                                            icon={Calendar}
                                            type="date"
                                            placeholder="Select date"
                                            value={doiToDateInput(newCertificateData.doi)}
                                            onChange={(e) => handleNewCertChange('doi', dateInputToDoi(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 md:px-8 py-5 bg-white/80 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 z-20 backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddFormVisible(false);
                                        setNewCertificateData(initialNewCertificateState);
                                    }}
                                    className="px-6 py-3 text-[13px] font-semibold text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-[16px] transition-all active:scale-[0.96] disabled:opacity-50 cursor-pointer"
                                    disabled={isAdding}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isAdding}
                                    className="px-8 py-3 text-[13px] font-bold text-white bg-[#1d1d1f] hover:bg-black rounded-[16px] shadow-lg shadow-black/10 transition-all transform active:scale-[0.96] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isAdding ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Certificate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        // Success View
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[500px] text-center bg-white/90 backdrop-blur-xl"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-50 to-white rounded-full flex items-center justify-center ring-1 ring-emerald-100 shadow-[0_8px_30px_rgba(16,185,129,0.15)]">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                                    >
                                        <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                                    </motion.div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Certificate Created!</h3>
                            <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed text-[15px]">
                                The certificate for <span className="font-bold text-slate-800">{newCertificateData.name}</span> has been successfully archived.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-10">
                                <button
                                    type="button"
                                    onClick={() => handleDownload('certificate1.pdf')}
                                    disabled={isGeneratingPdf}
                                    className="group relative flex flex-col items-center p-5 bg-white border border-slate-200/60 rounded-[24px] hover:border-indigo-500/30 hover:ring-2 hover:ring-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                                        {isGeneratingPdf ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Proctorship PDF</span>
                                    <span className="text-[11px] text-slate-400 mt-1 font-medium">Formal Verification</span>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
                                        <Download className="w-4 h-4 text-indigo-500" />
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDownload('certificate2.pdf')}
                                    disabled={isGeneratingPdf}
                                    className="group relative flex flex-col items-center p-5 bg-white border border-slate-200/60 rounded-[24px] hover:border-teal-500/30 hover:ring-2 hover:ring-teal-500/10 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-100 transition-all duration-300">
                                        {isGeneratingPdf ? <Loader2 className="w-6 h-6 animate-spin text-teal-600" /> : <FileText className="w-6 h-6 text-teal-600" />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 group-hover:text-teal-700">Training PDF</span>
                                    <span className="text-[11px] text-slate-400 mt-1 font-medium">Course Completion</span>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
                                        <Download className="w-4 h-4 text-teal-500" />
                                    </div>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                <button
                                    type="button"
                                    onClick={() => setIsAddFormVisible(false)}
                                    className="flex-1 py-3.5 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-[18px] hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-[0.96] shadow-sm"
                                >
                                    Close Window
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex-1 py-3.5 text-[13px] font-bold text-white bg-slate-900 rounded-[18px] hover:bg-black transition-all cursor-pointer active:scale-[0.96] shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Add Another
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AddCertificateForm;