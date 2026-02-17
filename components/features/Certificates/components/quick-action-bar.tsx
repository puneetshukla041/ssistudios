import React, { useState, useRef, useEffect } from 'react';
import { Download, Filter, Plus, Trash2, Loader2, X, Search, ChevronDown, Check, Mail, Shield, Award, FileText } from 'lucide-react';
import clsx from 'clsx';
import { generateCertificatePDF } from '@/components/features/Certificates/utils/pdfGenerator'; 

interface QuickActionBarProps {
    isAddFormVisible: boolean;
    selectedIds: string[];
    uniqueHospitals: string[];
    hospitalFilter: string;
    isBulkGeneratingV1: boolean;
    isBulkGeneratingV2: boolean;
    isBulkGeneratingV3: boolean;
    certTypeMode: string;
    setCertTypeMode: React.Dispatch<React.SetStateAction<string>>;
    setIsAddFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setHospitalFilter: React.Dispatch<React.SetStateAction<string>>;
    handleBulkDelete: () => Promise<void>;
    handleDownload: (type: 'xlsx' | 'csv') => Promise<void>;
    handleBulkGeneratePDF_V1: () => Promise<void>;
    handleBulkGeneratePDF_V2: () => Promise<void>;
    handleBulkGeneratePDF_V3: () => Promise<void>;
    handleBulkMail_V1: () => void;
    handleBulkMail_V2: () => void;
    handleBulkMail_V3: () => void;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({
    isAddFormVisible, selectedIds, uniqueHospitals, hospitalFilter, 
    isBulkGeneratingV1, isBulkGeneratingV2, isBulkGeneratingV3,
    certTypeMode, setCertTypeMode,
    setIsAddFormVisible, setHospitalFilter, handleBulkDelete, handleDownload, 
    handleBulkGeneratePDF_V1, handleBulkGeneratePDF_V2, handleBulkGeneratePDF_V3,
    handleBulkMail_V1, handleBulkMail_V2, handleBulkMail_V3
}) => {
    
    const isGenerating = isBulkGeneratingV1 || isBulkGeneratingV2 || isBulkGeneratingV3;
    const hasSelection = selectedIds.length > 0;
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- FORTIS MODAL STATE ---
    const [isFortisModalOpen, setIsFortisModalOpen] = useState(false);
    const [fortisDoctorName, setFortisDoctorName] = useState('');
    const [isFortisLoading, setIsFortisLoading] = useState(false);

    // ✅ FORCE EXTERNAL MODE ON MOUNT
    useEffect(() => {
        setCertTypeMode('external');
    }, []); 

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredHospitals = uniqueHospitals.filter(hospital =>
        hospital.toLowerCase().includes(filterSearchTerm.toLowerCase())
    );

    // ✅ Handle Fortis Input (Auto Capitalize First Letters)
    const handleFortisNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const titleCaseVal = val.replace(/\b\w/g, char => char.toUpperCase());
        setFortisDoctorName(titleCaseVal);
    };

    // ✅ Handle Fortis Generation
    const handleFortisGenerate = async () => {
        if (!fortisDoctorName.trim()) {
            alert("Please enter a doctor name.");
            return;
        }

        setIsFortisLoading(true);
        try {
            const dummyData = {
                _id: "temp-id",
                name: fortisDoctorName,
                hospital: "Fortis", 
                email: "",
                certificateNo: "",
                doi: "",
                type: "external"
            };

            await generateCertificatePDF(
                dummyData as any, 
                (msg, isErr) => !isErr && console.log(msg), 
                'certificate3.pdf', 
                setIsFortisLoading as any,
                false 
            );
            
            setIsFortisModalOpen(false);
            setFortisDoctorName("");
        } catch (error) {
            console.error(error);
            alert("Failed to generate PDF");
        } finally {
            setIsFortisLoading(false);
        }
    };

    return (
        <>
            <div className="sticky top-2 z-[30] mb-6 px-1 font-sans tracking-tight antialiased">
                <div className={clsx(
                    "flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-3 gap-3",
                    "bg-white/80 backdrop-blur-xl rounded-[26px] border transition-all duration-500 ease-out",
                    hasSelection 
                        ? "border-indigo-200/50 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10" 
                        : "border-white/60 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)]"
                )}>
                    
                    {/* --- LEFT SECTION: Primary Controls (Add & Filter) --- */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full lg:w-auto gap-2.5">
                        
                        {/* Add Button */}
                        <button
                            type="button"
                            onClick={() => setIsAddFormVisible(prev => !prev)}
                            className={clsx(
                                "flex items-center justify-center px-5 py-3 lg:py-2.5 rounded-[18px] text-[13px] font-semibold transition-all duration-300 shadow-sm whitespace-nowrap active:scale-[0.96] cursor-pointer",
                                isAddFormVisible
                                    ? "bg-slate-100 text-slate-500 border border-slate-200/50 hover:bg-slate-200/80"
                                    : "bg-[#1d1d1f] text-white border border-transparent hover:bg-black hover:shadow-lg hover:shadow-black/10"
                            )}
                        >
                            {isAddFormVisible ? (
                                <> <X className="w-4 h-4 mr-2" /> Cancel </>
                            ) : (
                                <> <Plus className="w-4 h-4 mr-2" /> New Entry </>
                            )}
                        </button>

                        {/* Divider - Hidden on mobile */}
                        <div className="hidden lg:block h-6 w-[1px] bg-slate-200/60 mx-1" />

                        {/* Filter Dropdown */}
                        <div className="relative flex-grow lg:flex-grow-0 lg:min-w-[240px]" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={clsx(
                                    "relative w-full text-left pl-10 pr-10 py-3 lg:py-2.5 rounded-[18px] border transition-all duration-300 text-[13px] font-medium focus:outline-none cursor-pointer active:scale-[0.98]",
                                    isFilterOpen 
                                        ? "bg-white border-indigo-500/30 ring-4 ring-indigo-500/5 text-slate-900 shadow-md" 
                                        : "bg-white/50 border-slate-200/60 text-slate-600 hover:bg-white hover:border-slate-300/80 hover:shadow-sm"
                                )}
                            >
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Filter className="w-4 h-4" />
                                </div>
                                <span className="block truncate">
                                    {hospitalFilter || "Filter by Hospital"}
                                </span>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <ChevronDown className={clsx("w-4 h-4 transition-transform duration-300", isFilterOpen && "rotate-180")} />
                                </div>
                            </button>

                            {isFilterOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top ring-1 ring-black/5">
                                    <div className="p-3 border-b border-slate-100/50 bg-slate-50/30">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Find hospital..."
                                                value={filterSearchTerm}
                                                onChange={(e) => setFilterSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-white/80 border border-slate-200/60 rounded-[12px] text-[13px] focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHospitalFilter("");
                                                setIsFilterOpen(false);
                                                setFilterSearchTerm("");
                                            }}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 rounded-[12px] text-[13px] flex items-center justify-between transition-all cursor-pointer",
                                                hospitalFilter === "" ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            <span>All Hospitals</span>
                                            {hospitalFilter === "" && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        {filteredHospitals.map(hospital => (
                                            <button
                                                type="button"
                                                key={hospital}
                                                onClick={() => {
                                                    setHospitalFilter(hospital);
                                                    setIsFilterOpen(false);
                                                    setFilterSearchTerm("");
                                                }}
                                                className={clsx(
                                                    "w-full text-left px-3 py-2 rounded-[12px] text-[13px] flex items-center justify-between transition-all cursor-pointer",
                                                    hospitalFilter === hospital ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="truncate mr-2">{hospital}</span>
                                                {hospitalFilter === hospital && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                            </button>
                                        ))}
                                        {filteredHospitals.length === 0 && (
                                            <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                                                No hospitals found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT SECTION: Actions --- */}
                    <div className="flex flex-col-reverse lg:flex-row items-center w-full lg:w-auto justify-between lg:justify-end gap-2.5">
                        
                        {/* Fortis Generator Button */}
                        <div className="w-full lg:w-auto">
                            <button 
                                onClick={() => setIsFortisModalOpen(true)}
                                className="w-full lg:w-auto justify-center px-4 py-3 lg:py-2.5 bg-rose-50/80 text-rose-600 border border-rose-100/50 rounded-[18px] text-[13px] font-semibold hover:bg-rose-100 hover:shadow-sm transition-all flex items-center active:scale-[0.96] cursor-pointer"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Fortis Gen
                            </button>
                        </div>

                        {hasSelection ? (
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                    {/* Selection Counter */}
                                    <div className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-[12px] text-[11px] font-bold uppercase tracking-wide border border-indigo-100/50 whitespace-nowrap shadow-sm">
                                        {selectedIds.length} <span className="hidden sm:inline ml-1">Selected</span>
                                    </div>
                                </div>

                                {/* Action Buttons Group - Horizontally Scrollable on Mobile */}
                                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide lg:overflow-visible">
                                    
                                    {/* Download Buttons Group */}
                                    <div className="flex items-center bg-slate-100/50 p-1 rounded-[16px] border border-slate-200/50 flex-shrink-0">
                                        {/* Proctorship */}
                                        <button
                                            type="button"
                                            onClick={handleBulkGeneratePDF_V1}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 rounded-[12px] text-[12px] font-semibold transition-all flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-white hover:shadow-sm hover:text-blue-700 active:scale-[0.96]"
                                            title="Download Proctorship"
                                        >
                                            {isBulkGeneratingV1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5 sm:mr-1.5" />}
                                            <span className="hidden xl:inline">Proc.</span>
                                            <Download className="w-3 h-3 ml-1.5 opacity-50" />
                                        </button>
                                        
                                        <div className="w-[1px] h-4 bg-slate-300/50 mx-1" />
                                        
                                        {/* Training */}
                                        <button
                                            type="button"
                                            onClick={handleBulkGeneratePDF_V2}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 rounded-[12px] text-[12px] font-semibold transition-all flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-teal-600 hover:bg-white hover:shadow-sm hover:text-teal-700 active:scale-[0.96]"
                                            title="Download Training"
                                        >
                                            {isBulkGeneratingV2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5 sm:mr-1.5" />}
                                            <span className="hidden xl:inline">Train.</span>
                                            <Download className="w-3 h-3 ml-1.5 opacity-50" />
                                        </button>
                                    </div>

                                    {/* Mail Buttons Group */}
                                    <div className="flex items-center bg-slate-100/50 p-1 rounded-[16px] border border-slate-200/50 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleBulkMail_V1}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 rounded-[12px] text-[12px] font-semibold transition-all flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-indigo-600 hover:bg-white hover:shadow-sm hover:text-indigo-700 active:scale-[0.96]"
                                            title="Mail Proctorship"
                                        >
                                            <Mail className="w-3.5 h-3.5 sm:mr-1.5" />
                                            <span className="hidden xl:inline">Proc.</span>
                                        </button>

                                        <div className="w-[1px] h-4 bg-slate-300/50 mx-1" />

                                        <button
                                            type="button"
                                            onClick={handleBulkMail_V2}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 rounded-[12px] text-[12px] font-semibold transition-all flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-emerald-600 hover:bg-white hover:shadow-sm hover:text-emerald-700 active:scale-[0.96]"
                                            title="Mail Training"
                                        >
                                            <Mail className="w-3.5 h-3.5 sm:mr-1.5" />
                                            <span className="hidden xl:inline">Train.</span>
                                        </button>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        disabled={isGenerating}
                                        className="p-2.5 rounded-[16px] bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm disabled:opacity-50 cursor-pointer flex-shrink-0 ml-auto sm:ml-0 active:scale-[0.96]"
                                        title="Delete Selected"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 duration-200 w-full lg:w-auto">
                                <button
                                    type="button"
                                    onClick={() => handleDownload('xlsx')}
                                    disabled={isGenerating}
                                    className="group flex items-center justify-center w-full lg:w-auto px-5 py-3 lg:py-2.5 bg-white border border-slate-200/60 rounded-[18px] text-[13px] font-medium text-slate-600 hover:text-emerald-700 hover:border-emerald-200/50 hover:bg-emerald-50/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.96]" 
                                >
                                    <Download className="w-4 h-4 mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                    Export Excel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FORTIS MODAL */}
            {isFortisModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300 font-sans tracking-tight">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/40 ring-1 ring-black/5">
                        <div className="p-5 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-b from-white to-slate-50/50">
                            <h3 className="text-[15px] font-bold text-slate-800">Generate Fortis Certificate</h3>
                            <button 
                                onClick={() => setIsFortisModalOpen(false)} 
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                    Doctor Name
                                </label>
                                <input 
                                    type="text" 
                                    value={fortisDoctorName}
                                    onChange={handleFortisNameChange}
                                    placeholder="Enter Doctor Name"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium text-slate-800 placeholder-slate-400 text-[15px]"
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center">
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full mr-1.5" />
                                    Name will be auto-capitalized (e.g., "john doe" → "John Doe")
                                </p>
                            </div>
                            
                            <button 
                                onClick={handleFortisGenerate}
                                disabled={isFortisLoading}
                                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-[18px] font-bold shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex justify-center items-center text-[14px] cursor-pointer"
                            >
                                {isFortisLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Certificate"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuickActionBar;