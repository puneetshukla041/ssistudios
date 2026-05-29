'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import { ICertificateClient } from '../utils/constants';
import JSZip from 'jszip';

interface BatchDownloadModalProps {
  isOpen: boolean;
  uploadedIds: string[];
  certificates: ICertificateClient[];
  onClose: () => void;
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  isOpen,
  uploadedIds,
  certificates,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'certificate1.pdf' | 'certificate2.pdf'>('certificate1.pdf');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');

  // Get only the newly uploaded certificates
  const newCertificates = certificates.filter(cert => uploadedIds.includes(cert._id));

  const handleDownload = useCallback(async () => {
    if (newCertificates.length === 0) return;

    setIsDownloading(true);
    setDownloadStatus('generating');
    setProgress(0);

    try {
      const zip = new JSZip();
      let completed = 0;

      // Generate PDF for each certificate
      for (const cert of newCertificates) {
        try {
          const result = await generateCertificatePDF(
            cert,
            () => {}, // Silent alert handling
            selectedTemplate,
            () => {}, // Silent loading state
            true
          );

          if (result && result.blob) {
            // Add to zip with a safe filename
            const filename = `${cert.certificateNo || cert.name || 'cert'}.pdf`;
            zip.file(filename, result.blob);
          }

          completed++;
          setProgress(Math.round((completed / newCertificates.length) * 100));
        } catch (error) {
          console.error(`Failed to generate PDF for ${cert.certificateNo}:`, error);
          // Continue with next certificate
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadStatus('complete');
      setTimeout(() => {
        onClose();
        setDownloadStatus('idle');
        setProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('error');
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
    } finally {
      setIsDownloading(false);
    }
  }, [newCertificates, selectedTemplate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-slate-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-600" />
                  Download Certificates
                </h2>
                <p className="text-sm text-slate-600">
                  {newCertificates.length} certificate{newCertificates.length === 1 ? '' : 's'} ready
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Choose Template</label>
              <div className="grid grid-cols-2 gap-3">
                {(['certificate1.pdf', 'certificate2.pdf'] as const).map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    disabled={isDownloading}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      selectedTemplate === template
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FileText className={`w-6 h-6 ${selectedTemplate === template ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-700">
                      {template === 'certificate1.pdf' ? 'Template 1' : 'Template 2'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            {isDownloading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-slate-600">Generating PDFs...</p>
                  <p className="text-xs font-semibold text-indigo-600">{progress}%</p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                  />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {downloadStatus === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-700">Download complete!</p>
              </motion.div>
            )}

            {downloadStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">Error generating certificates. Please try again.</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                disabled={isDownloading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading || downloadStatus === 'complete'}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download ZIP
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-slate-500 text-center">
              All certificates will be packaged in a single ZIP file for easy download.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
