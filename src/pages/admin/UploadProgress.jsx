import React, { useState, useRef } from 'react';
import { Upload, Calendar, Database, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

// 🌟 NAMA KOMPONEN SUDAH DIGANTI MENJADI UploadProgress
export default function UploadProgress() {
  const fileInputRef = useRef(null);

  // 🌟 STATE
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });

  // 📤 FUNGSI UPLOAD FILE EXCEL KE FASTAPI
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset status
    setUploadStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tanggal', activeDate); 

    setIsUploading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/admin/upload-progress-pendataan', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Terjadi kesalahan saat upload data ke server.');
      }
      
      const result = await response.json();
      setUploadStatus({ type: 'success', message: result.message });
      
    } catch (error) {
      console.error("Error Upload:", error);
      setUploadStatus({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-start justify-center font-sans">
      
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER PANEL */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-900/80 flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Database size={24} />
          </div>
          <div>
            <h2 className="font-black text-lg text-white tracking-tight">ADMIN PANEL</h2>
            <p className="text-xs text-slate-400 font-semibold">Upload Progress Kewajaran (Responden)</p>
          </div>
        </div>

        {/* BODY PANEL */}
        <div className="p-8 space-y-8">
          
          {/* 1. PILIH TANGGAL */}
          <div className="space-y-3">
            <label className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-2">
              <Calendar size={14} /> 1. TENTUKAN TANGGAL DATA
            </label>
            <div className="relative">
              <input 
                type="date" 
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="w-full text-base font-bold text-slate-200 p-3 pl-12 border border-slate-700 rounded-xl bg-slate-950 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-inner"
                style={{ colorScheme: 'dark' }}
              />
              <Calendar className="absolute left-4 top-3.5 text-indigo-500" size={20} />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
              <strong className="text-amber-400">Penting:</strong> Jika Anda mengunggah ulang data pada tanggal yang sama, sistem akan <strong className="text-rose-400">menghapus & menimpa</strong> data lama pada tanggal tersebut dengan file Excel yang baru.
            </p>
          </div>

          {/* 2. UPLOAD FILE EXCEL */}
          <div className="space-y-3 border-t border-slate-800 pt-6">
            <label className="text-xs font-black text-emerald-400 tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={14} /> 2. UPLOAD FILE EXCEL
            </label>
            
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl text-base font-bold text-white transition-all shadow-lg ${
                isUploading 
                  ? 'bg-slate-700 text-slate-400 cursor-wait' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:-translate-y-1'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Memproses File Excel...
                </>
              ) : (
                <>
                  <Upload size={20} /> 
                  Pilih & Upload File Progress
                </>
              )}
            </button>
          </div>

          {/* 3. STATUS NOTIFICATION */}
          {uploadStatus.message && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in zoom-in-95 ${
              uploadStatus.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
              <div className="text-sm font-medium leading-relaxed">
                {uploadStatus.message}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}