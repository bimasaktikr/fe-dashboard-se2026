import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function UploadLabelSls() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setStatus(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Pilih file Excel terlebih dahulu!');
      setStatus('error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload-label-sls`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setStatus('success');
        setFile(null); // Reset form
      } else {
        throw new Error(result.detail || 'Terjadi kesalahan saat upload');
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-in fade-in duration-500 max-w-2xl mx-auto mt-10">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800/80 p-6 border-b border-slate-700 flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <FileSpreadsheet className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Upload Label SLS (RT/RW)</h2>
            <p className="text-sm text-slate-400 mt-1">Kolom A: Kode SLS (16 digit) | Kolom B: Nama SLS</p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleUpload} className="p-6 space-y-6">
          
          {/* File Input */}
          <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-colors bg-slate-950/50 text-center group cursor-pointer">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3">
              <UploadCloud size={48} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
              <div>
                <p className="text-slate-300 font-medium">{file ? file.name : "Tarik & Lepas file Excel ke sini"}</p>
                <p className="text-xs text-slate-500 mt-1">{file ? 'Klik untuk mengganti file' : 'Format didukung: .xlsx, .xls'}</p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${status === 'success' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {status === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || !file}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <UploadCloud size={18} /> Eksekusi Data
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}