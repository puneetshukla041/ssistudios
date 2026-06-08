import type React from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import { ICertificateClient } from "./constants";

interface PdfFileResult {
  filename: string;
  blob: Blob;
}

export const generateCertificatePDF = async (
  certData: ICertificateClient,
  onAlert: (message: string, isError: boolean) => void,
  template: "certificate1.pdf" | "certificate2.pdf" | "certificate3.pdf",
  setLoadingId:
    | React.Dispatch<React.SetStateAction<string | null>>
    | React.Dispatch<React.SetStateAction<boolean>>,
  isBulk: boolean = false
): Promise<PdfFileResult | null | void> => {
  const fullName = certData.name || "Unknown Name";
  const hospitalName = certData.hospital || "Unknown Hospital";

  if (!isBulk) {
    (setLoadingId as React.Dispatch<React.SetStateAction<string | null>>)(
      certData._id
    );
  }

  try {
    // 1. Fetch Resources
    const [
      existingPdfBytes,
      soraBytes,
      soraSemiBoldBytes,
      poppinsMediumBytes,
    ] = await Promise.all([
      fetch(`/certificates/${template}`).then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch certificate template: ${template}.`);
        }
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
    const soraSemiBoldFont = await pdfDoc.embedFont(soraSemiBoldBytes, {
      subset: true,
    });
    const poppinsMediumFont = await pdfDoc.embedFont(poppinsMediumBytes, {
      subset: true,
    });

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();

    // --- TEMPLATE 3 LOGIC (Fortis / 100+) ---
    if (template === "certificate3.pdf") {
      const fontSizeLarge = 24;
      const colorSoftCharcoal = rgb(0.25, 0.25, 0.25);
      const yCenter = pageHeight / 2 + 30;
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
      const doi = doiDDMMYYYY.replace(/-/g, "/");

      const yBase = pageHeight - 180;
      const x = 55;
      const margin = 40;

      const fontSizeSmall = 7;
      const fontSizeMedium = 8;
      const fontSizeLarge = 18;

      const colorBlack = rgb(0, 0, 0);
      const isV2Template = template === "certificate2.pdf";

      const drawCenteredText = (
        text: string,
        y: number,
        size: number,
        font: PDFFont
      ) => {
        const textWidth = font.widthOfTextAtSize(text, size);

        firstPage.drawText(text, {
          x: (pageWidth - textWidth) / 2,
          y,
          size,
          font,
          color: colorBlack,
        });
      };
if (isV2Template) {
  // certificate2.pdf page size is 780 x 540 pt
  // In pdf-lib: higher Y = moves UP, lower Y = moves DOWN

  const getFittedFontSize = (
    text: string,
    font: PDFFont,
    desiredSize: number,
    maxWidth: number,
    minSize: number
  ): number => {
    let size = desiredSize;

    while (
      font.widthOfTextAtSize(text, size) > maxWidth &&
      size > minSize
    ) {
      size -= 0.25;
    }

    return size;
  };

  const drawCenteredFittedText = (
    text: string,
    y: number,
    desiredSize: number,
    minSize: number,
    font: PDFFont,
    maxWidth: number
  ) => {
    const fittedSize = getFittedFontSize(
      text,
      font,
      desiredSize,
      maxWidth,
      minSize
    );

    const textWidth = font.widthOfTextAtSize(text, fittedSize);

    firstPage.drawText(text, {
      x: (pageWidth - textWidth) / 2,
      y,
      size: fittedSize,
      font,
      color: colorBlack,
    });
  };

  // Corrected positions for certificate2.pdf
  const nameY = 324;
  const hospitalY = 303;

  const doiX = 128;
  const doiY = 68;

  const certNoX = 435;
  const certNoY = 139;

  // 1. Doctor Name - centered in the blank space
  drawCenteredFittedText(
    fullName,
    nameY,
    fontSizeLarge,
    14,
    soraSemiBoldFont,
    pageWidth - 170
  );

  // 2. Hospital Name - centered below doctor name
  drawCenteredFittedText(
    hospitalName,
    hospitalY,
    fontSizeMedium,
    6.5,
    soraFont,
    pageWidth - 190
  );

  // 3. Date of Issue - inside bottom-left box, after "Date of Issue:"
  firstPage.drawText(doi, {
    x: doiX,
    y: doiY,
    size: fontSizeSmall,
    font: soraSemiBoldFont,
    color: colorBlack,
  });

  // 4. Certificate Number - aligned after "Certificate No.-"
  const fittedCertNoSize = getFittedFontSize(
    certificateNo,
    soraSemiBoldFont,
    fontSizeSmall,
    pageWidth - certNoX - 70,
    5.5
  );

  firstPage.drawText(certificateNo, {
    x: certNoX,
    y: certNoY,
    size: fittedCertNoSize,
    font: soraSemiBoldFont,
    color: colorBlack,
  });
}
    }

    // 3. Save and Return/Download
    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });

    // Sanitize filename
    const safeName =
      fullName.replace(/[\\/:*?"<>|]/g, "").trim() || "Unknown";

    const safeHospital =
      hospitalName.replace(/[\\/:*?"<>|]/g, "").trim() || "Hospital";

    const fileName =
      template === "certificate3.pdf"
        ? `${safeName}.pdf`
        : `${safeName}_${safeHospital}.pdf`;

    if (isBulk) {
      return {
        filename: fileName,
        blob,
      };
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
    console.error("PDF Error:", error);

    if (!isBulk) {
      onAlert("Failed to generate PDF. Check console.", true);
    }

    return null;
  } finally {
    if (!isBulk) {
      (setLoadingId as React.Dispatch<React.SetStateAction<string | null>>)(
        null
      );
    }
  }
};