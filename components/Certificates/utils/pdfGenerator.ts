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
        // Doctor Name - centered for certificate2
        drawCenteredText(fullName, 360, fontSizeLarge, soraSemiBoldFont);

        // Hospital Name - centered below doctor name
        drawCenteredText(hospitalName, 340, fontSizeMedium, soraFont);

        // Date of Issue - bottom-left box
        firstPage.drawText(doi, {
          x: 142,
          y: 82,
          size: fontSizeSmall,
          font: soraSemiBoldFont,
          color: colorBlack,
        });

        // Certificate Number - center area after "Certificate No.-"
        firstPage.drawText(certificateNo, {
          x: 430,
          y: 157,
          size: fontSizeSmall,
          font: soraSemiBoldFont,
          color: colorBlack,
        });

        // Removed paragraph:
        // has successfully completed the
        // Robotics Training Program
        // provided by Sudhir Srivastava Innovations Pvt. Ltd
        // to operate the SSI Mantra Surgical Robotic System
      } else {
        // Template 1 original placement
        firstPage.drawText(fullName, {
          x,
          y: yBase,
          size: fontSizeLarge,
          font: soraFont,
          color: colorBlack,
        });

        firstPage.drawText(hospitalName, {
          x,
          y: yBase - 20,
          size: fontSizeMedium,
          font: soraSemiBoldFont,
          color: colorBlack,
        });

        // DOI
        const doiTextWidth = soraSemiBoldFont.widthOfTextAtSize(
          doi,
          fontSizeSmall
        );

        firstPage.drawText(doi, {
          x: Math.max(margin, (pageWidth - doiTextWidth) / 2) - 75,
          y: margin + 45,
          size: fontSizeSmall,
          font: soraSemiBoldFont,
          color: colorBlack,
        });

        // Certificate No.
        const certTextWidth = soraSemiBoldFont.widthOfTextAtSize(
          certificateNo,
          fontSizeSmall
        );

        firstPage.drawText(certificateNo, {
          x: pageWidth - certTextWidth - margin - 70,
          y: margin + 45,
          size: fontSizeSmall,
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
