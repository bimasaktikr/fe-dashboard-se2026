import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Calendar, Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function UploadSQLLab() {
  const [file, setFile] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus({ type: '', message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedDate) {
      setStatus({ type: 'error', message: 'Harap pilih tanggal dan file data SQL Lab!' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('selected_date', selectedDate);
    formData.append('file', file);

    try {
      // 🌟 PERBAIKAN: Hapus process.env agar tidak crash di Vite
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload-sqllab`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message || 'Data berhasil disuntikkan!' });
        setTimeout(() => {
          setFile(null);
          setSelectedDate('');
          setStatus({ type: '', message: '' });
        }, 3000);
      } else {
        setStatus({ type: 'error', message: data.detail || 'Gagal mengunggah data.' });
      }
    } catch (error) {
      // 🌟 PERBAIKAN: Tambahkan console.log agar error asli terbaca di tab Console
      console.error("Error Detail:", error);
      setStatus({ type: 'error', message: 'Koneksi ke server terputus. Pastikan API menyala.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Database className="text-blue-500" size={28} />
          Injeksi Data SQL-Lab
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Unggah file CSV atau Excel dari hasil ekspor SQL Lab untuk memperbarui progres PCL dan PML.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Tanggal */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" /> Tanggal Kondisi Data
              </label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ colorScheme: 'dark' }} // 🌟 KUNCI PERBAIKANNYA DI SINI
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
            </div>

            {/* Area Drag & Drop File */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-400" /> Upload File Data
              </label>
              <div className="relative border-2 border-dashed border-slate-700 bg-slate-950/30 rounded-xl p-6 text-center hover:bg-blue-500/5 hover:border-blue-500 transition-all group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="flex items-center justify-center gap-4">
                  <div className={`p-3 rounded-full transition-colors ${file ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400'}`}>
                    <Upload size={24} strokeWidth={file ? 2.5 : 2} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-slate-300 truncate w-48 md:w-64">
                      {file ? file.name : "Pilih file CSV / Excel"}
                    </span>
                    {!file && <span className="text-[10px] font-medium text-slate-500">Maksimal 10MB</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Status Info */}
          {status.message && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-bold animate-in slide-in-from-bottom-2 ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
              <span className="leading-relaxed">{status.message}</span>
            </div>
          )}

          {/* Tombol Eksekusi Gradient */}
          <button 
            type="submit" 
            disabled={isUploading || !file || !selectedDate}
            className="w-full md:w-auto md:min-w-[250px] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm ml-auto"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Merekam ke Database...
              </>
            ) : (
              <>
                <Upload size={18} /> Eksekusi Upload Data
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}