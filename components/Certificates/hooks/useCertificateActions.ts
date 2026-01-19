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
     
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ICertificateClient>>({});
    const [flashId, setFlashId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
     
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

    const formatForFilename = (text: string | undefined | null) => {
        if (!text) return 'Unknown';
        const cleanText = text.replace(/[\\/:*?"<>|]/g, '').trim();
        return formatName(cleanText); // Updated: use comma/bracket logic for filename too
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
        if (!confirm("Are you sure you want to delete this certificate?")) return;
        setDeletingId(id);
        try {
            const success = await deleteCertificate(id);
            if (success) {
                showNotification("Certificate deleted successfully", "success");
                await fetchCertificates(false);
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (certificate: ICertificateClient) => { 
        setEditingId(certificate._id); 
        setEditFormData({ ...certificate }); 
    };
     
    const handleSave = async (id: string) => { 
        if(!editFormData) return;
        setFlashId(id);

        // ✅ Apply formatName to BOTH name and hospital BEFORE saving
        const dataToSave = { ...editFormData };
        if (dataToSave.name) dataToSave.name = formatName(dataToSave.name);
        if (dataToSave.hospital) dataToSave.hospital = formatName(dataToSave.hospital);

        const success = await updateCertificate(id, dataToSave);
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

    const handleGeneratePDF_V2 = async (cert: ICertificateClient) => {
        if (generatingPdfId === cert._id) return;
        // Format for consistent display in PDF
        const formattedCert = { 
            ...cert, 
            name: formatName(cert.name), 
            hospital: formatName(cert.hospital) 
        };
        const result = await generateCertificatePDFTyped(formattedCert, oldOnAlert, 'certificate2.pdf', setGeneratingPdfId, true);
        if (result && result.blob) triggerFileDownload(result.blob, result.filename);
    };

    const handleGeneratePDF_V1 = async (cert: ICertificateClient) => {
        if (generatingPdfV1Id === cert._id) return;
        const formattedCert = { 
            ...cert, 
            name: formatName(cert.name), 
            hospital: formatName(cert.hospital) 
        };
        const result = await generateCertificatePDFTyped(formattedCert, oldOnAlert, 'certificate1.pdf', setGeneratingPdfV1Id, true);
        if (result && result.blob) triggerFileDownload(result.blob, result.filename);
    };

    const handleBulkGenerate = async (
        template: 'certificate1.pdf' | 'certificate2.pdf' | 'certificate3.pdf', 
        setBulkState: React.Dispatch<React.SetStateAction<boolean>>, 
        typeLabel: string,
        specificIds?: string[]
    ) => {
        const idsToProcess = specificIds && specificIds.length > 0 ? specificIds : selectedIds;
        if (idsToProcess.length === 0) {
            showNotification(`Select certificates for export.`, 'info');
            return;
        }
        setBulkState(true);
        try {
            let selectedCertificates = await fetchCertificatesForExport(true, idsToProcess);
            selectedCertificates = selectedCertificates.filter(cert => idsToProcess.includes(cert._id));
            const pdfPromises = selectedCertificates.map(cert => {
                const formattedCert = { 
                    ...cert, 
                    name: formatName(cert.name), 
                    hospital: formatName(cert.hospital) 
                };
                return generateCertificatePDFTyped(formattedCert, oldOnAlert, template, setBulkState as any, true);
            });
            const results = await Promise.all(pdfPromises);
            let successCount = 0;
            for (const result of results) {
                if (result && result.blob) {
                    triggerFileDownload(result.blob, result.filename);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            if (successCount > 0) triggerSuccess(`${successCount} Downloaded`);
        } catch (error: any) {
            showNotification(`Bulk Generation failed.`, 'error');
        } finally {
            setBulkState(false);
        }
    };

    const handleBulkGeneratePDF_V1 = (ids?: string[]) => handleBulkGenerate('certificate1.pdf', setIsBulkGeneratingV1, 'Proctorship', ids);
    const handleBulkGeneratePDF_V2 = (ids?: string[]) => handleBulkGenerate('certificate2.pdf', setIsBulkGeneratingV2, 'Training', ids);
    const handleBulkGeneratePDF_V3 = (ids?: string[]) => handleBulkGenerate('certificate3.pdf', setIsBulkGeneratingV3, '100+ Others', ids);

    const handleDownload = async (type: 'xlsx' | 'csv') => {
        showNotification('Fetching records...', 'info');
        const allCertificates = await fetchCertificatesForExport();
        if (allCertificates.length === 0) return;
        const sortedExportData = sortCertificates(allCertificates, { key: '_id', direction: 'desc' });
        const dataToExport = sortedExportData.map((cert, index) => ({
            'S. No.': index + 1,
            'Certificate No.': cert.certificateNo,
            'Name': formatName(cert.name),
            'Hospital': formatName(cert.hospital), // ✅ Capitalized for Excel
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