import { useState } from 'react';
import * as XLSX from 'xlsx';
import { ICertificateClient, CertificateTableProps, NotificationType } from '../utils/constants';
import { sortCertificates, formatName } from '../utils/helpers'; 
import { generateCertificatePDF } from '../utils/pdfGenerator';

type GeneratePDFType = (
    certData: ICertificateClient,
    onAlert: (message: string, isError: boolean) => void,
    template: 'certificate1.pdf' | 'certificate2.pdf' | 'certificate3.pdf',
    setLoadingId: React.Dispatch<React.SetStateAction<string | null>> | React.Dispatch<React.SetStateAction<boolean>>,
    isBulk?: boolean
) => Promise<{ filename: string, blob: Blob } | null>;

const generateCertificatePDFTyped = generateCertificatePDF as unknown as GeneratePDFType;

interface UseCertificateActionsProps {
    certificates: ICertificateClient[];
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    fetchCertificates: (resetPage?: boolean) => Promise<void>;
    fetchCertificatesForExport: (isBulkPdfExport?: boolean, idsToFetch?: string[]) => Promise<ICertificateClient[]>;
    deleteCertificate: (id: string) => Promise<boolean>;
    updateCertificate: (id: string, data: Partial<ICertificateClient>) => Promise<boolean>;
    showNotification: (message: string, type: NotificationType) => void;
    onAlert: CertificateTableProps['onAlert'];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCertificateActions = ({
    certificates,
    selectedIds,
    setSelectedIds,
    fetchCertificates,
    fetchCertificatesForExport,
    deleteCertificate,
    updateCertificate,
    showNotification,
    onAlert: oldOnAlert,
    setIsLoading,
}: UseCertificateActionsProps) => {
     
    // --- Row Actions State ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ICertificateClient>>({});
    const [flashId, setFlashId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
     
    // --- PDF Generation States ---
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const [generatingPdfV1Id, setGeneratingPdfV1Id] = useState<string | null>(null);
    const [isBulkGeneratingV1, setIsBulkGeneratingV1] = useState(false);
    const [isBulkGeneratingV2, setIsBulkGeneratingV2] = useState(false);
    const [isBulkGeneratingV3, setIsBulkGeneratingV3] = useState(false); 

    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const triggerSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
    };

    // Helper to sanitize filenames (prevents invalid characters in download)
    const formatForFilename = (text: string | undefined | null) => {
        if (!text) return 'Unknown';
        return text.replace(/[\\/:*?"<>|]/g, '').trim();
    };

    const triggerFileDownload = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // --- Selection & Delete Handlers ---
    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(certificates.map(cert => cert._id));
        else setSelectedIds([]);
    };

    const handleBulkDelete = async () => { 
        if(selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} certificates?`)) return;
         
        showNotification("Processing bulk delete...", "info");
         
        let deletedCount = 0;
        for (const id of selectedIds) {
            const success = await deleteCertificate(id);
            if (success) deletedCount++;
        }

        if (deletedCount > 0) {
            showNotification(`Successfully deleted ${deletedCount} certificates.`, "success");
            setSelectedIds([]);
            fetchCertificates(false);
        } else {
            showNotification("Failed to delete certificates.", "error");
        }
    };

    const handleDelete = async (id: string) => { 
        if (!confirm("Are you sure you want to delete this certificate? This action cannot be undone.")) return;

        setDeletingId(id);
         
        try {
            const success = await deleteCertificate(id);
            if (success) {
                showNotification("Certificate deleted successfully", "success");
                await fetchCertificates(false);
            }
        } catch (error) {
            console.error("Delete failed in handler", error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (certificate: ICertificateClient) => { 
        setEditingId(certificate._id); 
        setEditFormData({ ...certificate }); 
    };
     
    // --- SAVE HANDLER ---
    const handleSave = async (id: string) => { 
        if(!editFormData) return;
        
        // Optimistic Feedback
        setFlashId(id);

        // ✅ MODIFIED: We send the data EXACTLY as typed.
        // We do NOT use formatName() here anymore. This allows you to manually 
        // set "of" (lowercase) or "SSI" (uppercase) without the system overriding you.
        const success = await updateCertificate(id, editFormData);

        if (success) {
            setEditingId(null);
            showNotification("Edit saved successfully", "success");
            setEditFormData({});
            await fetchCertificates(false); 
        }
    };

    const handleChange = (field: keyof ICertificateClient, value: string) => { 
        setEditFormData(prev => ({ ...prev, [field]: value })); 
    };

    // --- PDF Generation Handlers ---

    const handleGeneratePDF_V2 = async (cert: ICertificateClient) => {
        if (generatingPdfId === cert._id) return;
        
        // ✅ MODIFIED: Pass raw cert data. No forced formatting.
        const result = await generateCertificatePDFTyped(cert, oldOnAlert, 'certificate2.pdf', setGeneratingPdfId, true);
        
        // Use raw names for filename to ensure it matches user expectation
        if (result && result.blob) {
            const safeName = formatForFilename(cert.name);
            const safeHospital = formatForFilename(cert.hospital);
            triggerFileDownload(result.blob, `${safeName}_${safeHospital}.pdf`);
        }
    };

    const handleGeneratePDF_V1 = async (cert: ICertificateClient) => {
        if (generatingPdfV1Id === cert._id) return;

        // ✅ MODIFIED: Pass raw cert data.
        const result = await generateCertificatePDFTyped(cert, oldOnAlert, 'certificate1.pdf', setGeneratingPdfV1Id, true);
        
        if (result && result.blob) {
            const safeName = formatForFilename(cert.name);
            const safeHospital = formatForFilename(cert.hospital);
            triggerFileDownload(result.blob, `${safeName}_${safeHospital}.pdf`);
        }
    };

    // --- BULK GENERATION LOGIC ---
    const handleBulkGenerate = async (
        template: 'certificate1.pdf' | 'certificate2.pdf' | 'certificate3.pdf', 
        setBulkState: React.Dispatch<React.SetStateAction<boolean>>, 
        typeLabel: string,
        specificIds?: string[]
    ) => {
        const idsToProcess = specificIds && specificIds.length > 0 ? specificIds : selectedIds;

        if (idsToProcess.length === 0) {
            showNotification(`Select certificates for ${typeLabel} export.`, 'info');
            return;
        }

        setBulkState(true);
        showNotification(`Preparing ${idsToProcess.length} ${typeLabel} certificates...`, 'info');

        try {
            let selectedCertificates = await fetchCertificatesForExport(true, idsToProcess);
             
            selectedCertificates = selectedCertificates.filter(cert => idsToProcess.includes(cert._id));

            if (selectedCertificates.length === 0) {
                throw new Error(`Could not retrieve data for ${typeLabel} export.`);
            }

            const pdfPromises = selectedCertificates.map(cert => {
                // ✅ MODIFIED: Pass raw cert data.
                return generateCertificatePDFTyped(cert, oldOnAlert, template, setBulkState as any, true);
            });

            const results = await Promise.all(pdfPromises);
            let successCount = 0;

            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && result.blob) {
                    triggerFileDownload(result.blob, result.filename);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            if (successCount > 0) {
                triggerSuccess(`${successCount} Downloaded`);
                if (!specificIds) {
                    setSelectedIds([]);
                }
            } else {
                showNotification('PDF generation failed.', 'error');
            }
        } catch (error: any) {
            console.error(error);
            showNotification(`Bulk Generation failed: ${error.message}`, 'error');
        } finally {
            setBulkState(false);
        }
    };

    const handleBulkGeneratePDF_V1 = (ids?: string[]) => handleBulkGenerate('certificate1.pdf', setIsBulkGeneratingV1, 'Proctorship', ids);
    const handleBulkGeneratePDF_V2 = (ids?: string[]) => handleBulkGenerate('certificate2.pdf', setIsBulkGeneratingV2, 'Training', ids);
    const handleBulkGeneratePDF_V3 = (ids?: string[]) => handleBulkGenerate('certificate3.pdf', setIsBulkGeneratingV3, '100+ Others', ids);

    // --- Excel Export Handler ---
    const handleDownload = async (type: 'xlsx' | 'csv') => {
        showNotification('Fetching all filtered records for export, please wait...', 'info');
        const allCertificates = await fetchCertificatesForExport();
        if (allCertificates.length === 0) {
            showNotification('No data found.', 'info');
            return;
        }
        const sortedExportData = sortCertificates(allCertificates, { key: '_id', direction: 'desc' });
        
        const dataToExport = sortedExportData.map((cert, index) => ({
            'S. No.': index + 1,
            'Certificate No.': cert.certificateNo,
            'Name': cert.name,       // ✅ MODIFIED: Export exactly as stored in DB
            'Hospital': cert.hospital, // ✅ MODIFIED: Export exactly as stored in DB
            'DOI': cert.doi,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        if (type === 'xlsx') {
            worksheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 55 }, { wch: 15 }];
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
        XLSX.writeFile(workbook, `certificates_export.${type}`);
        triggerSuccess('Export Complete');
    };

    return {
        editingId, editFormData, flashId, deletingId,
        generatingPdfId, generatingPdfV1Id,
        isBulkGeneratingV1, isBulkGeneratingV2, isBulkGeneratingV3,
        showSuccessAnimation, successMessage,
        setEditingId, setEditFormData, setFlashId, setShowSuccessAnimation,
        handleSelectOne, handleSelectAll, handleBulkDelete, handleEdit, handleSave, handleDelete, handleChange,
        handleDownload,
        handleGeneratePDF_V1, handleGeneratePDF_V2,
        handleBulkGeneratePDF_V1, handleBulkGeneratePDF_V2, handleBulkGeneratePDF_V3,
    };
};