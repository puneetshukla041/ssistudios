import React from 'react';
import {
    Save,
    X,
    Edit3,
    Trash2,
    Check,
    FileText,
    Calendar,
    Building2,
    User,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICertificateClient, PAGE_LIMIT } from '../utils/constants';
import { getHospitalColor, doiToDateInput, dateInputToDoi, formatName } from '../utils/helpers';
import clsx from 'clsx';

interface TableRowProps {
    cert: ICertificateClient;
    index: number;
    currentPage: number;
    isSelected: boolean;
    isEditing: boolean;
    isFlashing: boolean;
    isDeleting: boolean;
    generatingPdfId: string | null;
    generatingPdfV1Id: string | null;
    isAnyActionLoading: boolean;
    editFormData: Partial<ICertificateClient>;
    handleSelectOne: (id: string, checked: boolean) => void;
    handleEdit: (certificate: ICertificateClient) => void;
    handleSave: (id: string) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleChange: (field: keyof ICertificateClient, value: string) => void;
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
    handleGeneratePDF_V1: (cert: ICertificateClient) => void;
    handleGeneratePDF_V2: (cert: ICertificateClient) => void;
    handleMailCertificate: (cert: ICertificateClient, template: 'certificate1.pdf' | 'certificate2.pdf') => void;
}

const TableRow: React.FC<TableRowProps> = ({
    cert,
    index,
    currentPage,
    isSelected,
    isEditing,
    isFlashing,
    isDeleting,
    generatingPdfId,
    generatingPdfV1Id,
    isAnyActionLoading,
    editFormData,
    handleSelectOne,
    handleEdit,
    handleSave,
    handleDelete,
    handleChange,
    setEditingId,
}) => {

    const serialNumber = (currentPage - 1) * PAGE_LIMIT + index + 1;
    const isPdfGenerating = generatingPdfId === cert._id || generatingPdfV1Id === cert._id;
    const isDisabled = isPdfGenerating || isAnyActionLoading || (isEditing && !editFormData);

    const MobileLabel = ({ children }: { children: React.ReactNode }) => (
        <span className="md:hidden text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-3 min-w-[70px] text-right">
            {children}
        </span>
    );

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: isDeleting ? 0 : 1, 
                x: isDeleting ? -20 : 0,
                backgroundColor: isFlashing 
                    ? 'rgba(240, 253, 244, 0.9)' // Success Green
                    : isEditing 
                        ? 'rgba(255, 251, 235, 0.6)' // Edit Amber
                        : isSelected 
                            ? 'rgba(238, 242, 255, 0.5)' // Selected Blue
                            : 'rgba(255, 255, 255, 0)' // Transparent default
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={clsx(
                "flex flex-col md:table-row mb-4 md:mb-0 rounded-[24px] md:rounded-none p-4 md:p-0",
                "border border-slate-200 md:border-0 md:border-b md:border-slate-100/80",
                "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] md:shadow-none bg-white md:bg-transparent",
                !isEditing && "hover:bg-slate-50/80 transition-colors duration-200"
            )}
        >
            {/* CHECKBOX */}
            <td className="flex md:table-cell items-center justify-between md:justify-center p-2 md:p-4 border-b border-slate-100 md:border-0">
                <div className="md:hidden font-medium text-slate-500 text-sm">Select</div>
                <div className="flex items-center justify-center">
                    <label className={clsx(
                        "relative flex items-center justify-center w-6 h-6 md:w-5 md:h-5 transition-all duration-200",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-90"
                    )}>
                        <input
                            type="checkbox"
                            className="peer appearance-none w-6 h-6 md:w-5 md:h-5 border-[1.5px] border-slate-300 rounded-[8px] md:rounded-[6px] checked:bg-slate-900 checked:border-slate-900 transition-all duration-200 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(cert._id, e.target.checked)}
                            disabled={isDisabled}
                        />
                        <Check className="absolute w-4 h-4 md:w-3.5 md:h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-all duration-200 scale-50 peer-checked:scale-100" strokeWidth={3} />
                    </label>
                </div>
            </td>

            {/* SERIAL NUMBER - HIDDEN ON MOBILE */}
            <td className="hidden md:table-cell px-4 py-5 text-center">
                <span className="text-[13px] font-medium text-slate-400 font-mono tabular-nums tracking-tighter">
                    {String(serialNumber).padStart(2, '0')}
                </span>
            </td>

            {/* Certificate No */}
            <td className="flex md:table-cell items-center justify-between p-2 md:p-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Cert No.</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.certificateNo || ''}
                            onChange={(e) => handleChange('certificateNo', e.target.value)}
                            className="w-full md:w-32 px-3 py-2 text-[14px] md:text-[13px] bg-slate-50 md:bg-white ring-1 ring-slate-200 rounded-[12px] md:rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 shadow-sm transition-all"
                            placeholder="Cert No."
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-2.5 group">
                            <div className="p-1.5 rounded-[8px] bg-slate-100/80 text-slate-400 hidden md:flex group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[14px] md:text-[13px] font-bold text-slate-700 font-mono tracking-tight break-all">
                                {cert.certificateNo}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            {/* Name */}
            <td className="flex md:table-cell items-center justify-between p-2 md:p-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Name</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full md:w-48 px-3 py-2 text-[14px] md:text-[13px] font-medium bg-slate-50 md:bg-white ring-1 ring-slate-200 rounded-[12px] md:rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 shadow-sm transition-all"
                            placeholder="Full Name"
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-100 hidden md:flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-[15px] md:text-[14px] font-semibold text-slate-900 tracking-tight line-clamp-1">
                                {formatName(cert.name)}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            {/* Hospital */}
            <td className="flex md:table-cell items-center justify-between p-2 md:p-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Hospital</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.hospital || ''}
                            onChange={(e) => handleChange('hospital', e.target.value)}
                            className="w-full md:w-40 px-3 py-2 text-[14px] md:text-[13px] bg-slate-50 md:bg-white ring-1 ring-slate-200 rounded-[12px] md:rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 shadow-sm transition-all"
                            placeholder="Hospital Name"
                        />
                    ) : (
                        <span className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide border shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                            getHospitalColor(cert.hospital)
                        )}>
                            <Building2 className="w-3 h-3 opacity-70" />
                            {cert.hospital}
                        </span>
                    )}
                </div>
            </td>

            {/* Date of Issue */}
            <td className="flex md:table-cell items-center justify-between p-2 md:p-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Date</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="date"
                            value={doiToDateInput(editFormData.doi || '')}
                            onChange={(e) => handleChange('doi', dateInputToDoi(e.target.value))}
                            className="w-full md:w-auto px-3 py-2 text-[14px] md:text-[13px] bg-slate-50 md:bg-white ring-1 ring-slate-200 rounded-[12px] md:rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 shadow-sm cursor-pointer font-medium text-slate-600"
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-2 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 hidden md:block opacity-60" />
                            <span className="text-[14px] md:text-[13px] font-medium tabular-nums tracking-tight">
                                {cert.doi}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            {/* ACTION BUTTONS */}
            <td className="block md:table-cell p-2 md:p-4 bg-slate-50 md:bg-transparent rounded-b-[24px] md:rounded-none border-t border-slate-200 md:border-0 mt-2 md:mt-0">
                <div className="w-full md:w-auto relative">
                    {isEditing ? (
                        <div className="flex items-center gap-3 md:gap-2 animate-in fade-in zoom-in duration-200 w-full justify-end">
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleSave(cert._id)}
                                className="flex-1 md:flex-none justify-center flex items-center gap-2 md:gap-1.5 px-4 py-2.5 md:py-2 bg-slate-900 hover:bg-black text-white text-[13px] md:text-[12px] font-bold rounded-[14px] md:rounded-[10px] shadow-md shadow-slate-900/10 transition-all cursor-pointer"
                            >
                                <Save className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                Save
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setEditingId(null)}
                                className="flex-1 md:flex-none justify-center flex items-center gap-2 md:gap-1.5 px-4 py-2.5 md:py-2 bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[13px] md:text-[12px] font-bold rounded-[14px] md:rounded-[10px] shadow-sm transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                Cancel
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-2 md:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handleEdit(cert)}
                                disabled={isDisabled}
                                className={clsx(
                                    "p-2.5 md:p-2 rounded-[14px] md:rounded-[10px] transition-all duration-200 flex items-center justify-center relative group/btn bg-white md:bg-transparent shadow-sm md:shadow-none ring-1 ring-slate-200 md:ring-0",
                                    isDisabled
                                        ? "text-slate-300 cursor-not-allowed"
                                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                )}
                            >
                                <Edit3 className="w-4 h-4" />
                                <span className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
                                    Edit
                                </span>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handleDelete(cert._id)}
                                disabled={isDisabled}
                                className={clsx(
                                    "p-2.5 md:p-2 rounded-[14px] md:rounded-[10px] transition-all duration-200 flex items-center justify-center relative group/btn bg-white md:bg-transparent shadow-sm md:shadow-none ring-1 ring-slate-200 md:ring-0",
                                    isDisabled
                                        ? "text-slate-300 cursor-not-allowed"
                                        : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
                                    Delete
                                </span>
                            </motion.button>
                        </div>
                    )}
                </div>
            </td>
        </motion.tr>
    );
};

export default TableRow;