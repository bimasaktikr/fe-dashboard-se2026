import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadTargetPrelist() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('loading');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/v1/admin/upload-target-prelist`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        setStatus('success');
        setMessage(`${result.message} ${result.details || ''}`);
        setFile(null);
        
        const fileInput = document.getElementById('prelistUpload');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.detail || result.message || 'Gagal mengunggah data.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Terjadi kesalahan jaringan.');
    }
  };

  return (
    // Wrapper luar memusatkan kotak di tengah layar (horizontal & vertikal padding)
    <div className="w-full flex justify-center p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Kotak Utama: Max width dibatasi agar tidak melar, efek glassmorphism */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-indigo-500/5">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl border border-indigo-500/30 mb-4 shadow-inner">
            <UploadCloud className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Master Target Prelist</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-[250px] leading-relaxed">
            Sinkronisasi baseline awal lapangan. Pastikan <span className="text-indigo-400 font-mono">Kol A=Region</span> & <span className="text-emerald-400 font-mono">Kol B=Target</span>.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div className="relative group">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            id="prelistUpload"
          />
          <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
            file 
              ? 'border-emerald-500/50 bg-emerald-500/5' 
              : 'border-slate-600/50 bg-slate-950/50 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/5'
          }`}>
            <FileSpreadsheet 
              size={48} 
              strokeWidth={1.5}
              className={`mb-4 transition-colors duration-300 ${
                file ? "text-emerald-400" : "text-slate-500 group-hover:text-indigo-400"
              }`} 
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-emerald-400 text-center px-4 break-all line-clamp-2">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-slate-300">Pilih file Excel / CSV</span>
                <span className="text-xs text-slate-500">atau drag and drop ke sini</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleUpload}
          disabled={!file || status === 'loading'}
          className="relative overflow-hidden w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 text-sm tracking-wider shadow-lg shadow-indigo-600/20 border border-indigo-500/50 flex justify-center items-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> 
              <span>Memproses Data...</span>
            </>
          ) : (
            'Mulai Sinkronisasi'
          )}
        </button>

        {/* Feedback Messages */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${status === 'idle' || status === 'loading' ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100 mt-4'}`}>
          {status === 'success' && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" /> 
              <p className="text-emerald-200/90 text-xs font-medium leading-relaxed">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" /> 
              <p className="text-rose-200/90 text-xs font-medium leading-relaxed">{message}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}