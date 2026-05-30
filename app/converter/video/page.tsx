'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, ArrowRight, Download, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';

type FileItem = {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  outputUrl: string | null;
};

export default function BulkVideoConverter() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'converting' | 'done'>('idle');
  
  const ffmpegRef = useRef(new FFmpeg());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // We use a ref to track which file is currently converting 
  // so the FFmpeg progress event knows which UI item to update.
  const currentFileIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    // Global progress listener attached once
    ffmpeg.on('progress', ({ progress }) => {
      if (currentFileIdRef.current) {
        setFiles(prev => prev.map(f => 
          f.id === currentFileIdRef.current 
            ? { ...f, progress: Math.max(0, Math.min(100, Math.round(progress * 100))) } 
            : f
        ));
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    setIsLoaded(true);
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(f => f.name.toLowerCase().endsWith('.mov'));
    
    const newItems: FileItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
      outputUrl: null
    }));

    setFiles(prev => [...prev, ...newItems]);
    if (globalStatus === 'done') setGlobalStatus('idle');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleConvertQueue = async () => {
    if (files.length === 0) return;
    setGlobalStatus('converting');
    
    const ffmpeg = ffmpegRef.current;
    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const item of pendingFiles) {
      currentFileIdRef.current = item.id;
      
      // Update UI to show this specific file is starting
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'converting', progress: 0 } : f));

      try {
        // Create unique filenames for the virtual file system to prevent collisions
        const inputName = `in_${item.id}.mov`;
        const outputName = `out_${item.id}.mp4`;

        // 1. Write to WASM memory
        await ffmpeg.writeFile(inputName, await fetchFile(item.file));
        
        // 2. Execute conversion
        await ffmpeg.exec(['-i', inputName, outputName]);
        
        // 3. Read result
        const data = await ffmpeg.readFile(outputName);
        
        // Using `as any` to bypass TypeScript's strict BlobPart definitions for SharedArrayBuffer (as discussed previously)
        const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
        
        // 4. Update UI with success
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', outputUrl: url, progress: 100 } : f));

        // 5. CRITICAL: Free up memory! If we don't do this, bulk converting will crash the browser.
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

      } catch (error) {
        console.error(`Error converting ${item.file.name}:`, error);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
      }
    }

    currentFileIdRef.current = null;
    setGlobalStatus('done');
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    // Reset input so selecting the same files again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[85vh]">
          
          <div className="mb-8 text-center shrink-0">
            <h1 className="text-3xl font-medium tracking-tight mb-2">Bulk Media Converter</h1>
            <p className="text-white/50 text-sm">Transform multiple MOV files to MP4 entirely on your device.</p>
          </div>

          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm">Initializing rendering engine...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Compact Dropzone / Add More Button */}
              <div
                onClick={() => globalStatus !== 'converting' && fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`shrink-0 relative flex flex-col items-center justify-center py-8 mb-6 rounded-2xl border-2 border-dashed transition-colors ${globalStatus === 'converting' ? 'opacity-50 cursor-not-allowed border-white/5' : 'cursor-pointer group hover:border-white/20 hover:bg-white/[0.02]'} ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10'}`}
              >
                <UploadCloud className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-white/40 group-hover:text-white/60'}`} />
                <p className="text-sm font-medium text-white/80">
                  {files.length > 0 ? 'Click or drag to add more files' : 'Click or drag .MOV files here'}
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px] mb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <AnimatePresence>
                    {files.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden relative"
                      >
                        {/* Background Progress Bar (Subtle) */}
                        {item.status === 'converting' && (
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500/10 transition-all duration-300 ease-linear"
                            style={{ width: `${item.progress}%` }}
                          />
                        )}

                        <div className="relative flex items-center justify-between z-10">
                          <div className="flex items-center space-x-4 overflow-hidden">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-green-500/20 text-green-400' : item.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {item.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : item.status === 'error' ? <AlertCircle className="w-5 h-5" /> : <FileVideo className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.file.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-white/40">
                                <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                {item.status === 'converting' && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-400">{item.progress}%</span>
                                  </>
                                )}
                                {item.status === 'error' && (
                                  <>
                                    <span>•</span>
                                    <span className="text-red-400">Failed</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0 pl-4">
                            {item.status === 'done' && item.outputUrl && (
                              <a
                                href={item.outputUrl}
                                download={item.file.name.replace(/\.[^/.]+$/, "") + '.mp4'}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-2 text-xs font-medium"
                              >
                                <Download className="w-4 h-4" />
                                <span>Save</span>
                              </a>
                            )}
                            
                            {(item.status === 'pending' || item.status === 'error') && (
                              <button 
                                onClick={() => removeFile(item.id)}
                                disabled={globalStatus === 'converting'}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {item.status === 'converting' && (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Master Action Button */}
              {files.length > 0 && (
                <div className="shrink-0 pt-4 border-t border-white/10">
                  <button
                    onClick={handleConvertQueue}
                    disabled={pendingCount === 0 || globalStatus === 'converting'}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-black py-4 rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {globalStatus === 'converting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Queue...</span>
                      </>
                    ) : pendingCount > 0 ? (
                      <>
                        <span>Convert {pendingCount} File{pendingCount !== 1 ? 's' : ''}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>All Conversions Complete</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </motion.div>

      {/* Hidden File Input (Notice the "multiple" attribute) */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".mov,video/quicktime"
        className="hidden"
      />
    </div>
  );
}