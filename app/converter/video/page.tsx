'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, ArrowRight, Download, Loader2, CheckCircle2 } from 'lucide-react';

export default function VideoConverter() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'converting' | 'done'>('idle');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('progress', ({ progress, time }) => {
      setProgress(Math.round(progress * 100));
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    setIsLoaded(true);
  };

  const handleConvert = async () => {
    if (!file) return;
    setStatus('converting');
    setProgress(0);
    
    const ffmpeg = ffmpegRef.current;
    const inputName = file.name;
    const outputName = inputName.replace(/\.[^/.]+$/, "") + '.mp4';

    // Write file to FFmpeg's virtual file system
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Run the conversion command (-c:v copy if you just want to remux, or libx264 for full encode)
    await ffmpeg.exec(['-i', inputName, outputName]);
    
    // Read the output file
    const data = await ffmpeg.readFile(outputName);
const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));    setOutputUrl(url);
    setStatus('done');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.mov')) {
      setFile(droppedFile);
      setStatus('idle');
      setOutputUrl(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setOutputUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl z-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-medium tracking-tight mb-2">Convert Media</h1>
            <p className="text-white/50 text-sm">Transform MOV to MP4 entirely on your device.</p>
          </div>

          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm">Initializing rendering engine...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed transition-colors cursor-pointer group
                      ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
                  >
                    <UploadCloud className={`w-10 h-10 mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-white/40 group-hover:text-white/60'}`} />
                    <p className="text-sm font-medium text-white/80">Click or drag a .MOV file</p>
                    <p className="text-xs text-white/40 mt-1">High-fidelity conversion in browser</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-info"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <FileVideo className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-white/40">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    
                    {status === 'idle' && (
                      <button onClick={() => setFile(null)} className="text-xs text-white/40 hover:text-white transition-colors p-2">
                        Remove
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Area */}
              <AnimatePresence>
                {file && status === 'idle' && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={handleConvert}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-black py-4 rounded-xl font-medium hover:bg-white/90 transition-colors"
                  >
                    <span>Convert to MP4</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}

                {status === 'converting' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Transcoding via WebAssembly...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.1 }}
                      />
                    </div>
                  </motion.div>
                )}

                {status === 'done' && outputUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2 flex flex-col space-y-4"
                  >
                    <div className="flex items-center space-x-2 text-green-400 text-sm justify-center mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Conversion successful</span>
                    </div>
                    <a
                      href={outputUrl}
                      download={file?.name.replace(/\.[^/.]+$/, "") + '.mp4'}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-500 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download MP4</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>
      </motion.div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".mov,video/quicktime"
        className="hidden"
      />
    </div>
  );
}