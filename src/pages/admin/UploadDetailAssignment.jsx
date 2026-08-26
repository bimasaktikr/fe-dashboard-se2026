'use client';
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, MapPin } from 'lucide-react';

export default function UploadDetailAssignment() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: 'error', message: 'Pilih file Excel terlebih dahulu!' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 🌟 SESUAIKAN DENGAN URL API FASTAPI ANDA
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';      

      const response = await fetch(`${API_URL}/api/v1/admin/upload-detail-assignment`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Berhasil! ${result.inserted || 0} titik disuntikkan, ${result.updated || 0} titik diperbarui.` 
        });
        setFile(null); // Reset file setelah sukses
      } else {
        // FastAPI biasanya mengembalikan error di properti 'detail'
        setStatus({ type: 'error', message: result.detail || 'Gagal mengunggah data.' });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus({ type: 'error', message: 'Koneksi ke server FastAPI terputus.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-slate-950 min-h-screen text-slate-200">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide text-white">
          <MapPin className="text-rose-500" size={32} />
          Injeksi Data Peta Tematik
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Unggah raw data satuan dari SQL LAB (format .xlsx) untuk memetakan koordinat usaha, detail identitas, dan status progres ke dalam Peta Tematik SLS.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Efek Glow Tipis di Latar */}
        <div className="absolute -top-20 -right-20 bg-rose-500/5 w-64 h-64 rounded-full blur-3xl"></div>

        <form onSubmit={handleUpload} className="space-y-6 relative z-10">
          
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center hover:border-rose-500/50 hover:bg-slate-800/50 transition-all group">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange}
              className="hidden" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-4">
              <div className={`p-4 rounded-full transition-all ${file ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400 group-hover:text-rose-400"}`}>
                <UploadCloud size={40} />
              </div>
              <span className="text-sm font-bold text-slate-300">
                {file ? file.name : "Klik untuk menelusuri file Excel (.xlsx)"}
              </span>
              {!file && (
                <span className="text-xs text-slate-500 font-mono">
                  Maksimal ukuran file disesuaikan dengan limit server.
                </span>
              )}
            </label>
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 ${
              status.type === 'error' 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {status.type === 'error' ? <AlertTriangle size={20} className="shrink-0" /> : <CheckCircle size={20} className="shrink-0" />}
              <span className="leading-snug">{status.message}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!file || isUploading}
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 border border-rose-500/50"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> 
                Menyuntikkan Koordinat...
              </>
            ) : (
              'Eksekusi Injeksi Peta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}