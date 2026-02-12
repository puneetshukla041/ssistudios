import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { ICertificateClient } from "./constants";
// Note: We import formatName just in case you want to use it for fallbacks,
// but the PDF generation main logic will use the raw data to respect manual edits.
import { formatName } from "./helpers";

interface PdfFileResult {
  filename: string;
  blob: Blob;
}

export const generateCertificatePDF = async (
  certData: ICertificateClient,
  onAlert: (message: string, isError: boolean) => void,
  template: 'certificate1.pdf' | 'certificate2.pdf' | 'certificate3.pdf',
  setLoadingId: React.Dispatch<React.SetStateAction<string | null>> | React.Dispatch<React.SetStateAction<boolean>>,
  isBulk: boolean = false
): Promise<PdfFileResult | null | void> => { 

  // ✅ MODIFIED: Use the Name and Hospital EXACTLY as they appear in the database.
  const fullName = certData.name || "Unknown Name";
  const hospitalName = certData.hospital || "Unknown Hospital";
  
  if (!isBulk) {
    (setLoadingId as React.Dispatch<React.SetStateAction<string | null>>)(certData._id);
  }

  try {
    // 1. Fetch Resources
    const [existingPdfBytes, soraBytes, soraSemiBoldBytes, poppinsMediumBytes] = await Promise.all([
      fetch(`/certificates/${template}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch certificate template: ${template}.`);
        return res.arrayBuffer();
      }),
      fetch("/fonts/Sora-Regular.ttf").then((res) => res.arrayBuffer()),
      fetch("/fonts/Sora-SemiBold.ttf").then((res) => res.arrayBuffer()),
      fetch("/fonts/Poppins-Medium.ttf").then((res) => res.arrayBuffer()),
    ]);

    // 2. Setup PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const soraFont = await pdfDoc.embedFont(soraBytes, { subset: true });
    const soraSemiBoldFont = await pdfDoc.embedFont(soraSemiBoldBytes, { subset: true });
    const poppinsMediumFont = await pdfDoc.embedFont(poppinsMediumBytes, { subset: true });

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();

    // --- TEMPLATE 3 LOGIC (Fortis / 100+) ---
    if (template === 'certificate3.pdf') {
        const fontSizeLarge = 24;
        const colorSoftCharcoal = rgb(0.25, 0.25, 0.25); 
        const yCenter = (pageHeight / 2) + 30; 
        const xLeftMargin = 80; 

        firstPage.drawText(fullName, { 
            x: xLeftMargin, 
            y: yCenter, 
            size: fontSizeLarge, 
            font: poppinsMediumFont, 
            color: colorSoftCharcoal,
        });

    } 
    // --- TEMPLATE 1 & 2 LOGIC (Standard) ---
    else {
        const doiDDMMYYYY = certData.doi || "01-01-2025"; 
        const certificateNo = certData.certificateNo || "NO-ID";
        const doi = doiDDMMYYYY.replace(/-/g, '/');

        const yBase = pageHeight - 180;
        const x = 55;
        const margin = 40;
        const fontSizeSmall = 7;
        const fontSizeMedium = 8;
        const fontSizeLarge = 18;
        const colorGray = rgb(0.5, 0.5, 0.5);
        const colorBlack = rgb(0, 0, 0); 
        
        // Check which template we are using
        const isTrainingCert = template === 'certificate2.pdf';

        // ---------------------------------------------------------
        // ✅ DRAWING LOGIC BASED ON TEMPLATE
        // ---------------------------------------------------------

        if (isTrainingCert) {
             // Case: Certificate 2 (Training) -> Show Name AND Hospital
             firstPage.drawText(fullName, { x, y: yBase, size: fontSizeLarge, font: soraFont, color: colorBlack });
             firstPage.drawText(hospitalName, { x, y: yBase - 20, size: fontSizeMedium, font: soraSemiBoldFont, color: colorBlack });
             
             // Extra text for Certificate 2
             const programName = "Robotics Training Program";
             const operationText = "to operate the SSI Mantra Surgical Robotic System";
             const providerLineText = "provided by Sudhir Srivastava Innovations Pvt. Ltd";
             const staticLineText = "has successfully completed the";

             firstPage.drawText(staticLineText, { x, y: yBase - 64, size: fontSizeSmall, font: soraFont, color: colorGray, maxWidth: 350, lineHeight: 10 });
             firstPage.drawText(programName, { x, y: yBase - 76, size: fontSizeSmall, font: soraSemiBoldFont, color: colorBlack });
             firstPage.drawText(providerLineText, { x, y: yBase - 88, size: fontSizeSmall, font: soraFont, color: colorGray, maxWidth: 350, lineHeight: 10 });
             firstPage.drawText(operationText, { x, y: yBase - 100, size: fontSizeSmall, font: soraSemiBoldFont, color: colorBlack });

        } else {
             // Case: Certificate 1 (Proctorship/Other) -> Show ONLY Name
             // Move name down slightly (yBase - 20) to center it since hospital line is gone
             firstPage.drawText(fullName, { x, y: yBase - 20, size: fontSizeLarge, font: soraFont, color: colorBlack });
             
             // DO NOT DRAW HOSPITAL NAME
        }
        
        // DOI
        const doiTextWidth = soraSemiBoldFont.widthOfTextAtSize(doi, fontSizeSmall);
        firstPage.drawText(doi, { x: Math.max(margin, (pageWidth - doiTextWidth) / 2) - 75, y: margin + 45, size: fontSizeSmall, font: soraSemiBoldFont, color: colorBlack });

        // Certificate No.
        const certTextWidth = soraSemiBoldFont.widthOfTextAtSize(certificateNo, fontSizeSmall);
        firstPage.drawText(certificateNo, { x: pageWidth - certTextWidth - margin - 70, y: margin + 45, size: fontSizeSmall, font: soraSemiBoldFont, color: colorBlack });
    }

    // 3. Save and Return/Download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    
    // Sanitize filename
    const safeName = fullName.replace(/[\\/:*?"<>|]/g, '').trim() || "Unknown";
    const safeHospital = hospitalName.replace(/[\\/:*?"<>|]/g, '').trim() || "Hospital"; 
    
    // ---------------------------------------------------------
    // ✅ FILENAME LOGIC BASED ON TEMPLATE
    // ---------------------------------------------------------
    let fileName = `${safeName}.pdf`;

    if (template === 'certificate2.pdf') {
        // Training: Name_Hospital.pdf
        fileName = `${safeName}_${safeHospital}.pdf`;
    } 
    // Certificate 1 & 3: Name.pdf (default)

    if (isBulk) {
      return { filename: fileName, blob };
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onAlert(`Successfully generated: ${fileName}`, false);
    }

  } catch (error) {
    console.error(`PDF Error:`, error);
    if (!isBulk) onAlert(`Failed to generate PDF. Check console.`, true);
    return null; 
  } finally {
    if (!isBulk) (setLoadingId as React.Dispatch<React.SetStateAction<string | null>>)(null);
  }
};