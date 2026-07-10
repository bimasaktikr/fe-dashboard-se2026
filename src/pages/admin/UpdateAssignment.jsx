import React, { useState, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export default function UpdateAssignment() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || '';

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${API_URL}/api/v1/admin/rekon-assignment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult({
        type: 'success',
        text: res.data.message,
        subText: res.data.details
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setResult({
        type: 'error',
        text: err.response?.data?.detail || 'Gagal memproses file rekonsiliasi.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-indigo-600/10 border-b border-indigo-500/20 p-6 flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl mt-1">
            <RefreshCw size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Rekonsiliasi Assignment Petugas</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unggah file Excel untuk memetakan atau mengubah ulang pasangan PCL dan PML pada wilayah kerja secara massal.
              Sistem hanya akan memperbarui data wilayah yang <span className="text-indigo-400 font-semibold">sudah terdaftar</span> di database.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Panduan Format File */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={14} className="text-indigo-400" /> Aturan & Format Kolom Excel
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                <span className="block text-xs text-slate-500 font-bold mb-1">KOLOM A</span>
                <code className="text-xs text-indigo-400 font-bold font-mono">region_code</code>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                <span className="block text-xs text-slate-500 font-bold mb-1">KOLOM B</span>
                <code className="text-xs text-indigo-400 font-bold font-mono">email_petugas</code>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
                <span className="block text-xs text-slate-500 font-bold mb-1">KOLOM C</span>
                <code className="text-xs text-indigo-400 font-bold font-mono">email_pml</code>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              *Catatan: Nama header/kolom harus ditulis menggunakan huruf kecil semua. Jika SLS tidak ditugaskan ke petugas tertentu, kosongkan baris emailnya atau biarkan kosong.
            </p>
          </div>

          {/* Notifikasi Status Respon */}
          {result && (
            <div className={`p-4 rounded-xl flex flex-col gap-1 border ${
              result.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <div className="flex items-center gap-3">
                {result.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="font-bold text-sm">{result.text}</span>
              </div>
              {result.subText && <span className="text-xs text-slate-400 pl-8">{result.subText}</span>}
            </div>
          )}

          {/* Form Upload Area */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950 transition-all p-8 flex flex-col items-center justify-center text-center relative">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".xlsx, .xls" 
                onChange={handleFileChange} 
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="p-4 bg-slate-900 text-indigo-400 rounded-full mb-3 border border-slate-800">
                <FileSpreadsheet size={28} />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-white mb-1">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB - Siap dieksekusi</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1">
                    Klik atau jatuhkan file Excel di sini
                  </p>
                  <p className="text-xs text-slate-500">Mendukung format .xlsx atau .xls</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/10"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              {loading ? 'Sedang Mencocokkan Data Master...' : 'Eksekusi Rekonsiliasi Alokasi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}