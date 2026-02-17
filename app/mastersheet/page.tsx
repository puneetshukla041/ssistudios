'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Trash2, Search, Loader2, Database, AlertCircle, FileSpreadsheet, RefreshCw, Save, BarChart3, ChevronUp, ChevronDown, FilterX } from 'lucide-react';
import clsx from 'clsx';
import MasterAnalytics from '@/components/features/Certificates/ui/MasterAnalytics';

export default function MasterSheetPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});

    // Filtering States
    const [searchQuery, setSearchQuery] = useState('');
    const [hospitalFilter, setHospitalFilter] = useState('');
    const [specialityFilter, setSpecialityFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');
    const [healthFilter, setHealthFilter] = useState(''); // '', 'missing_phone', 'missing_email', 'complete'

    const fileInputRef = useRef<HTMLInputElement>(null);
    const syncInputRef = useRef<HTMLInputElement>(null);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/master');
            const data = await res.json();
            if (data.success) {
                setRecords(data.data);
                setPendingUpdates({}); 
            }
        } catch (error) {
            console.error("Failed to fetch records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRecords(); }, []);

    // 1. EXTRACT UNIQUE OPTIONS FOR FILTERS
    const filterOptions = useMemo(() => {
        return {
            hospitals: Array.from(new Set(records.map(r => r.hospitalName).filter(Boolean))).sort(),
            specialities: Array.from(new Set(records.map(r => r.speciality).filter(Boolean))).sort(),
            salesReps: Array.from(new Set(records.map(r => r.salesPersonName).filter(Boolean))).sort(),
        };
    }, [records]);

    // 2. APPLY ALL FILTERS
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = (record.surgeonName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                  (record.hospitalName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesHospital = hospitalFilter ? record.hospitalName === hospitalFilter : true;
            const matchesSpeciality = specialityFilter ? record.speciality === specialityFilter : true;
            const matchesSales = salesFilter ? record.salesPersonName === salesFilter : true;
            
            let matchesHealth = true;
            if (healthFilter === 'missing_phone') matchesHealth = !record.contactNumber;
            if (healthFilter === 'missing_email') matchesHealth = !record.emailId;
            if (healthFilter === 'complete') matchesHealth = !!(record.contactNumber && record.emailId);

            return matchesSearch && matchesHospital && matchesSpeciality && matchesSales && matchesHealth;
        });
    }, [records, searchQuery, hospitalFilter, specialityFilter, salesFilter, healthFilter]);

    // UPLOAD & SYNC HANDLERS (Same as before)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/master/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) { alert(`Success! ${data.count} records imported.`); fetchRecords(); } 
            else alert(`Upload failed: ${data.message}`);
        } catch (error) { alert("An error occurred during upload."); } 
        finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleSyncUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsSyncing(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

        try {
            const res = await fetch('/api/master/parse', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.data) {
                const newUpdates: Record<string, any> = { ...pendingUpdates };
                let matchCount = 0;
                const normalize = (str: any) => str ? String(str).toLowerCase().trim().replace(/\s+/g, ' ') : '';

                data.data.forEach((row: any) => {
                    const sName = normalize(row["Surgeon's Name"] || row["Surgeon Name"] || row["Name"] || "");
                    const hName = normalize(row["Hospital Name"] || row["Hospital"] || "");
                    const spec = row["Speciality"] || row["Specialty"] || "";
                    const contact = row["Contact Number"] || row["Phone"] || row["Mobile"] || "";
                    const email = row["Email ID"] || row["Email"] || "";

                    if (!sName || (!spec && !contact && !email)) return; 

                    let matchedRecords = records.filter(r => normalize(r.surgeonName) === sName && normalize(r.hospitalName) === hName);
                    if (matchedRecords.length === 0) matchedRecords = records.filter(r => normalize(r.surgeonName) === sName);

                    if (matchedRecords.length > 0) {
                        matchedRecords.forEach(match => {
                            const id = match._id;
                            if (!newUpdates[id]) newUpdates[id] = {};
                            if (spec) newUpdates[id].speciality = String(spec).trim();
                            if (contact) newUpdates[id].contactNumber = String(contact).trim();
                            if (email) newUpdates[id].emailId = String(email).trim();
                        });
                        matchCount++;
                    }
                });

                if (matchCount > 0) {
                    setPendingUpdates(newUpdates);
                    alert(`Found details for ${matchCount} doctors! Review the blue highlighted changes and click "Save Updates".`);
                } else alert('No matching doctors found.');
            }
        } catch (error) { alert("An error occurred during syncing."); } 
        finally { setIsSyncing(false); if (syncInputRef.current) syncInputRef.current.value = ''; }
    };

    const handleSaveUpdates = async () => {
        setIsLoading(true);
        const updatesArray = Object.keys(pendingUpdates).map(id => ({ _id: id, ...pendingUpdates[id] }));
        try {
            const res = await fetch('/api/master/bulk-update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: updatesArray }) });
            if ((await res.json()).success) { alert('Changes saved!'); fetchRecords(); }
        } catch (error) { alert("Error saving updates."); } 
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return;
        try { await fetch(`/api/master/${id}`, { method: 'DELETE' }); setRecords(records.filter(r => r._id !== id)); } 
        catch (error) {}
    };

    const handleClearAll = async () => {
        if (!confirm("WARNING: This will delete ALL records. Are you sure?")) return;
        try { const res = await fetch('/api/master', { method: 'DELETE' }); if ((await res.json()).success) setRecords([]); } 
        catch (error) {}
    };

    const hasPendingUpdates = Object.keys(pendingUpdates).length > 0;
    const isAnyFilterActive = hospitalFilter || specialityFilter || salesFilter || healthFilter;

    // Custom Apple-style Select Component
    const FilterSelect = ({ value, onChange, options, defaultLabel, isObject = false }: any) => (
        <div className="relative">
            <select 
                value={value} onChange={(e) => onChange(e.target.value)}
                className={clsx(
                    "appearance-none bg-[#e3e3e8]/60 hover:bg-[#d1d1d6]/60 border border-transparent rounded-full pl-4 pr-8 py-1.5 text-[13px] outline-none transition-colors cursor-pointer",
                    value ? "font-semibold text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/20" : "font-medium text-[#1d1d1f]"
                )}
            >
                <option value="">{defaultLabel}</option>
                {options.map((opt: any, i: number) => (
                    <option key={i} value={isObject ? opt.val : opt}>{isObject ? opt.label : opt}</option>
                ))}
            </select>
            <ChevronDown className={clsx("absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none", value ? "text-[#0071e3]" : "text-[#86868b]")} />
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col bg-[#f5f5f7] font-sans text-[#1d1d1f] overflow-hidden antialiased selection:bg-[#0071e3]/20">
            <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden gap-6 max-w-[1600px] mx-auto w-full">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-2">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-tight text-[#1d1d1f] flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-black/5">
                                <Database className="w-6 h-6 text-[#0071e3]" />
                            </div>
                            Global Master Sheet
                        </h1>
                        <p className="text-[14px] text-[#86868b] mt-1.5 ml-1 font-medium">
                            Manage all doctors, hospitals, and sales assignments centrally.
                        </p>
                    </div>

                    {/* Actions */}
                    {hasPendingUpdates ? (
                        <div className="flex items-center gap-3 p-2 bg-white/80 backdrop-blur-xl border border-[#0071e3]/30 rounded-full shadow-[0_8px_30px_rgba(0,113,227,0.15)] animate-in slide-in-from-top-4 fade-in duration-300">
                            <span className="text-[13px] font-bold text-[#0071e3] px-3">{Object.keys(pendingUpdates).length} Doctors Updated</span>
                            <button onClick={() => { if(confirm('Discard changes?')) setPendingUpdates({}); }} className="px-4 py-2 text-[#ff3b30] bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 rounded-full text-[13px] font-semibold transition-colors active:scale-95">Discard</button>
                            <button onClick={handleSaveUpdates} className="px-5 py-2 bg-[#0071e3] text-white rounded-full text-[13px] font-semibold hover:bg-[#0077ED] transition-all flex items-center gap-2 active:scale-95"><Save className="w-4 h-4" /> Save</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <button onClick={() => setShowAnalytics(!showAnalytics)} className={clsx("px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-sm active:scale-95 border", showAnalytics ? "bg-slate-800 text-white border-slate-900" : "bg-white/60 backdrop-blur-md border-[#e5e5ea] hover:bg-white")}>
                                {showAnalytics ? <ChevronUp className="w-4 h-4" /> : <BarChart3 className="w-4 h-4 text-[#0071e3]" />} {showAnalytics ? "Hide Analytics" : "View Analytics"}
                            </button>
                            <button onClick={handleClearAll} disabled={records.length === 0} className="px-4 py-2.5 bg-white/60 backdrop-blur-md border border-[#e5e5ea] text-[#ff3b30] rounded-full text-[13px] font-semibold hover:bg-[#ff3b30]/10 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Clear</span></button>
                            <input type="file" ref={syncInputRef} onChange={handleSyncUpload} className="hidden" accept=".xlsx, .xls, .csv" multiple />
                            <button onClick={() => syncInputRef.current?.click()} disabled={isSyncing || records.length === 0} className="px-5 py-2.5 bg-white/60 backdrop-blur-md border border-[#e5e5ea] text-[#1d1d1f] rounded-full text-[13px] font-semibold hover:bg-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95">
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[#0071e3]" />} Sync Details (Multi)
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-6 py-2.5 bg-[#0071e3] text-white rounded-full text-[13px] font-semibold hover:bg-[#0077ED] transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-70 active:scale-95">
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Upload Base
                            </button>
                        </div>
                    )}
                </div>

                {/* macOS Style Search & Filter Bar */}
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] p-3 shadow-sm flex flex-col gap-3 shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                        <div className="relative w-full sm:w-[400px] group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                            <input 
                                type="text" placeholder="Search by Surgeon or Hospital..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f7] focus:bg-white border border-transparent rounded-[12px] text-[14px] focus:outline-none focus:ring-4 focus:ring-[#0071e3]/20 focus:border-[#0071e3]/30 transition-all text-[#1d1d1f] placeholder:text-[#86868b]"
                            />
                        </div>
                        <div className="text-[13px] font-medium text-[#86868b] flex items-center gap-2 bg-[#f5f5f7] px-3 py-1.5 rounded-full border border-black/[0.03]">
                            Showing <span className="text-[#1d1d1f] font-bold">{filteredRecords.length}</span> / {records.length}
                        </div>
                    </div>
                    
                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-2 px-2 border-t border-black/[0.03] pt-3">
                        <FilterSelect value={hospitalFilter} onChange={setHospitalFilter} options={filterOptions.hospitals} defaultLabel="All Hospitals" />
                        <FilterSelect value={specialityFilter} onChange={setSpecialityFilter} options={filterOptions.specialities} defaultLabel="All Specialities" />
                        <FilterSelect value={salesFilter} onChange={setSalesFilter} options={filterOptions.salesReps} defaultLabel="All Sales Team" />
                        <FilterSelect value={healthFilter} onChange={setHealthFilter} isObject options={[{val:'missing_phone', label:'Missing Phone'}, {val:'missing_email', label:'Missing Email'}, {val:'complete', label:'100% Complete'}]} defaultLabel="Data Health" />
                        
                        {isAnyFilterActive && (
                            <button 
                                onClick={() => { setHospitalFilter(''); setSpecialityFilter(''); setSalesFilter(''); setHealthFilter(''); setSearchQuery(''); }}
                                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full transition-colors"
                            >
                                <FilterX className="w-3.5 h-3.5" /> Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable Main Area */}
                <div className="flex-1 overflow-auto w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d2d2d7] hover:[&::-webkit-scrollbar-thumb]:bg-[#86868b] [&::-webkit-scrollbar-thumb]:rounded-full px-1 pb-6">
                    
                    {showAnalytics && records.length > 0 && <MasterAnalytics records={filteredRecords} />}

                    {/* Main Glassmorphism Table */}
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white overflow-hidden flex flex-col relative ring-1 ring-black/[0.02]">
                        {isLoading ? (
                            <div className="py-32 flex flex-col items-center justify-center text-[#86868b]">
                                <Loader2 className="w-8 h-8 animate-spin text-[#0071e3] mb-4" />
                                <p className="font-medium text-[14px]">Loading database...</p>
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="py-32 flex flex-col items-center justify-center text-[#86868b]">
                                <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-4 shadow-inner border border-black/5">
                                    <AlertCircle className="w-8 h-8 text-[#d2d2d7]" />
                                </div>
                                <h3 className="font-semibold text-[#1d1d1f] text-[17px]">No records found</h3>
                                <p className="text-[13px] mt-1 text-[#86868b]">Try adjusting your filters or upload more data.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead className="bg-white/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider w-16 text-center border-r border-black/[0.03]">#</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Surgeon's Name</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Speciality</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Hospital Name</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Contact Number</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Email ID</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Sales Person</th>
                                            <th className="px-6 py-3.5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider text-right w-24">Action</th>
                                        </tr>
                                    </thead>
                                    
                                    <tbody className="divide-y divide-black/[0.03]">
                                        {filteredRecords.map((record, index) => {
                                            const update = pendingUpdates[record._id];
                                            const displaySpec = update?.speciality ?? record.speciality;
                                            const displayContact = update?.contactNumber ?? record.contactNumber;
                                            const displayEmail = update?.emailId ?? record.emailId;

                                            return (
                                                <tr key={record._id} className={clsx("transition-colors group", update ? "bg-[#0071e3]/[0.03] hover:bg-[#0071e3]/[0.06]" : "hover:bg-black/[0.02]")}>
                                                    <td className="px-6 py-4 text-[13px] text-[#86868b] text-center font-mono border-r border-black/[0.03]">{index + 1}</td>
                                                    <td className="px-6 py-4 text-[14px] font-semibold text-[#1d1d1f]">{record.surgeonName}</td>
                                                    <td className={clsx("px-6 py-4 text-[14px]", update?.speciality ? "text-[#0071e3] font-medium" : "text-[#515154]")}>{displaySpec || <span className="text-[#d2d2d7]">-</span>}</td>
                                                    <td className="px-6 py-4 text-[14px] text-[#1d1d1f] font-medium">{record.hospitalName}</td>
                                                    <td className={clsx("px-6 py-4 text-[14px] font-mono tracking-tight", update?.contactNumber ? "text-[#0071e3] font-medium" : "text-[#515154]")}>{displayContact || <span className="text-[#d2d2d7]">-</span>}</td>
                                                    <td className={clsx("px-6 py-4 text-[14px]", update?.emailId ? "text-[#0071e3] font-medium" : "text-[#515154]")}>{displayEmail || <span className="text-[#d2d2d7]">-</span>}</td>
                                                    <td className="px-6 py-4 text-[14px]">
                                                        {record.salesPersonName ? <span className="inline-flex items-center bg-[#f5f5f7] text-[#1d1d1f] px-3 py-1 rounded-full text-[12px] font-medium border border-black/5 shadow-sm">{record.salesPersonName}</span> : <span className="text-[#d2d2d7]">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleDelete(record._id)} disabled={hasPendingUpdates} className="p-2 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:opacity-0"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}