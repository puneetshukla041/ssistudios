import React, { useState, useRef, useEffect } from 'react';
import { initialNewCertificateState, ICertificateClient } from '../utils/constants';
import { doiToDateInput, dateInputToDoi, getTodayDoi } from '../utils/helpers';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import {
    Tag, User, Hospital, Calendar, Save, Loader2, X, ChevronDown, Check, Sparkles, Download, RefreshCw, FileText, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// --- PROPS INTERFACE ---
interface AddCertificateFormProps {
    newCertificateData: Omit<ICertificateClient, '_id'>;
    isAdding: boolean;
    uniqueHospitals?: string[];
    handleNewCertChange: (field: keyof Omit<ICertificateClient, '_id'>, value: string) => void;
    handleAddCertificate: () => Promise<boolean>;
    setIsAddFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setNewCertificateData: React.Dispatch<React.SetStateAction<Omit<ICertificateClient, '_id'>>>;
}

// --- REUSABLE COMPONENT: APPLE STYLE INPUT ---
const InputField = ({
    label, icon: Icon, placeholder, value, onChange, type = 'text', onFocus, onBlur, autoComplete
}: {
    label: string, icon: React.ElementType, placeholder: string, value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string,
    onFocus?: () => void, onBlur?: () => void, autoComplete?: string
}) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[13px] font-medium text-slate-700 ml-1 flex items-center gap-1.5">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none z-10 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300">
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                autoComplete={autoComplete}
                className="block w-full rounded-[14px] border border-slate-200 bg-white/50 py-3 pl-10 pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400/80 focus:bg-white focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all duration-200 outline-none"
            />
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const AddCertificateForm: React.FC<AddCertificateFormProps> = ({
    newCertificateData, isAdding, uniqueHospitals = [], handleNewCertChange,
    handleAddCertificate, setIsAddFormVisible, setNewCertificateData,
}) => {

    const [view, setView] = useState<'form' | 'success'>('form');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Initial Setup
    useEffect(() => {
        if (!newCertificateData.doi) {
            handleNewCertChange('doi', getTodayDoi());
        }
    }, []);

    // Click Outside Handler
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
        return searchTerm.trim() === '' ? true : hospital.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const selectHospital = (hospital: string) => {
        handleNewCertChange('hospital', hospital);
        setShowSuggestions(false);
    };

    const handleSubmit = async () => {
        const success = await handleAddCertificate();
        if (success) setView('success');
    };

    const handleReset = () => {
        setNewCertificateData({ ...initialNewCertificateState, doi: getTodayDoi() });
        setView('form');
    };

    const handleDownload = async (template: 'certificate1.pdf' | 'certificate2.pdf') => {
        setIsGeneratingPdf(true);
        try {
            const certForPdf = { ...newCertificateData, _id: 'new-temp' } as ICertificateClient;
            // @ts-ignore
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans antialiased tracking-tight">
            
            {/* Darkened Backdrop with Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddFormVisible(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="relative w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/40 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <AnimatePresence mode="wait">
                    {view === 'form' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, filter: 'blur(4px)' }}
                            className="flex flex-col h-full"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-200/50 bg-white/50 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-center">
                                <div>
                                    <h2 className="text-[17px] font-semibold text-slate-900">
                                        New Certificate
                                    </h2>
                                    <p className="text-[13px] text-slate-500">
                                        Enter recipient details below.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFormVisible(false)}
                                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                    <X className="w-5 h-5" strokeWidth={2} />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="px-6 pt-6 pb-32 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-6">
                                    
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField
                                            label="Certificate ID"
                                            icon={Tag}
                                            placeholder="e.g. CERT-001"
                                            value={newCertificateData.certificateNo}
                                            onChange={(e) => handleNewCertChange('certificateNo', e.target.value)}
                                        />
                                        <InputField
                                            label="Recipient Name"
                                            icon={User}
                                            placeholder="Full Name"
                                            value={newCertificateData.name}
                                            onChange={(e) => handleNewCertChange('name', e.target.value)}
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Hospital Autocomplete */}
                                        <div className="relative z-50" ref={wrapperRef}>
                                            <InputField
                                                label="Institution"
                                                icon={Hospital}
                                                placeholder="Hospital Name"
                                                value={newCertificateData.hospital}
                                                onChange={handleHospitalChange}
                                                onFocus={() => setShowSuggestions(true)}
                                                autoComplete="off"
                                            />
                                            <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400">
                                                <ChevronDown className="w-4 h-4 opacity-60" />
                                            </div>

                                            <AnimatePresence>
                                                {showSuggestions && filteredHospitals.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 4 }}
                                                        className="absolute top-full left-0 right-0 mt-1.5 bg-white/90 backdrop-blur-xl rounded-[16px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200/60 z-50 overflow-hidden max-h-56 overflow-y-auto"
                                                    >
                                                        <div className="p-1">
                                                            {filteredHospitals.map((hospital, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => selectHospital(hospital)}
                                                                    className={clsx(
                                                                        "w-full text-left px-3.5 py-2.5 rounded-[12px] text-[13px] transition-all duration-200 flex items-center justify-between group cursor-pointer",
                                                                        newCertificateData.hospital === hospital
                                                                            ? 'bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20'
                                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                                    )}
                                                                >
                                                                    <span className="truncate">{hospital}</span>
                                                                    {newCertificateData.hospital === hospital && (
                                                                        <Check className="w-3.5 h-3.5 text-white" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <InputField
                                            label="Issue Date"
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
                            <div className="px-6 py-4 bg-white/60 border-t border-slate-200/50 flex items-center justify-end gap-3 sticky bottom-0 z-20 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddFormVisible(false);
                                        setNewCertificateData(initialNewCertificateState);
                                    }}
                                    className="px-5 py-2.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    disabled={isAdding}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isAdding}
                                    className="px-6 py-2.5 text-[13px] font-semibold text-white bg-[#0071e3] hover:bg-[#0077ED] rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isAdding ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Save Record</span>
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
                            className="flex flex-col items-center justify-center p-8 min-h-[450px] text-center bg-white/40 backdrop-blur-sm"
                        >
                            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
                                <BadgeCheck className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>

                            <h3 className="text-[20px] font-bold text-slate-900 mb-2">Record Added</h3>
                            <p className="text-[14px] text-slate-500 mb-8 max-w-xs leading-relaxed">
                                The certificate for <span className="font-semibold text-slate-800">{newCertificateData.name}</span> has been securely saved.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mb-8">
                                <button
                                    type="button"
                                    onClick={() => handleDownload('certificate1.pdf')}
                                    disabled={isGeneratingPdf}
                                    className="group relative flex items-center p-3 bg-white border border-slate-200/60 rounded-2xl hover:border-indigo-500/30 hover:ring-2 hover:ring-indigo-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[13px] font-semibold text-slate-800">Standard</div>
                                        <div className="text-[11px] text-slate-400">PDF Format</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDownload('certificate2.pdf')}
                                    disabled={isGeneratingPdf}
                                    className="group relative flex items-center p-3 bg-white border border-slate-200/60 rounded-2xl hover:border-teal-500/30 hover:ring-2 hover:ring-teal-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mr-3 group-hover:bg-teal-100 transition-colors">
                                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> : <FileText className="w-5 h-5 text-teal-600" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[13px] font-semibold text-slate-800">Training</div>
                                        <div className="text-[11px] text-slate-400">PDF Format</div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex gap-3 w-full max-w-xs">
                                <button
                                    type="button"
                                    onClick={() => setIsAddFormVisible(false)}
                                    className="flex-1 py-3 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-[16px] hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex-1 py-3 text-[13px] font-semibold text-white bg-slate-900 rounded-[16px] hover:bg-black transition-all cursor-pointer active:scale-95 shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Add New
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