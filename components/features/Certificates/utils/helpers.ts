import { ICertificateClient, SortKey, SortConfig } from './constants';

/**
 * Robust Formatting Algorithm (Smart Title Case)
 * * Logic:
 * 1. Finds the first letter of the string.
 * 2. Finds any letter following a Space, Dot (.), Comma (,), or Bracket ( ( ) ).
 * 3. Capitalizes ONLY those letters.
 * * ✅ Updates:
 * - Removed .toLowerCase() from the start. This ensures acronyms (e.g., SSI, USA) 
 * remain uppercase if the user typed them that way.
 * - Added support for Brackets and Commas as separators.
 */
export const formatName = (name: string): string => {
    if (!name) return '';
    return name.replace(/(?:^|[\s.,\(\)])\w/g, (match) => match.toUpperCase());
};

/**
 * Used for Hospital names. Uses the same robust logic as names.
 */
export const toTitleCase = (str: string): string => {
    return formatName(str);
};

// Helper to convert DD-MM-YYYY to YYYY-MM-DD for date input type
export const doiToDateInput = (doi: string): string => {
    const parts = doi.split('-');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.length === 2 ? month : '01'}-${day.length === 2 ? day : '01'}`;
};

// Helper to convert YYYY-MM-DD from date input back to DD-MM-YYYY
export const dateInputToDoi = (dateInput: string): string => {
    const parts = dateInput.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
};

// Helper to get today's date in DD-MM-YYYY format
export const getTodayDoi = (): string => {
    return dateInputToDoi(new Date().toISOString().slice(0, 10));
};

// Helper for consistent hospital colors
export const getHospitalColor = (hospital: string): string => {
    const colors = [
        'bg-sky-100 text-sky-800',
        'bg-emerald-100 text-emerald-800',
        'bg-indigo-100 text-indigo-800',
        'bg-amber-100 text-amber-800',
        'bg-fuchsia-100 text-fuchsia-800',
        'bg-rose-100 text-rose-800',
        'bg-cyan-100 text-cyan-800',
        'bg-orange-100 text-orange-800',
    ];
    let hash = 0;
    for (let i = 0; i < hospital.length; i++) {
        hash = hospital.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const getCertificateColumnConfig = () => {
    return [
        { wch: 14 },
        { wch: 30 },
        { wch: 55 },
        { wch: 15 },
    ];
};

// Helper for sorting
export const sortCertificates = (
    certificates: ICertificateClient[],
    sortConfig: SortConfig | null
): ICertificateClient[] => {
    let sortableItems = [...certificates];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
};