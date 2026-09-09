'use client';
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, MapPin } from 'lucide-react';

export default function UploadDetailAssignment() {
  const [file, setFile] = useState(null);
  
  // 🌟 PERBAIKAN 1: Jadikan satu state status berbentuk objek yang rapi
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // 🌟 PERBAIKAN 2: Gunakan satu state loading saja untuk semua
  const [loading, setLoading] = useState(false);
  
  const [progress, setProgress] = useState(0); 
  const [progressText, setProgressText] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: '', message: '' }); // Reset pesan saat file baru dipilih
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      // 🌟 Format status harus konsisten berbentuk objek
      setStatus({ type: 'error', message: 'Pilih file Excel terlebih dahulu!' });
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressText('Sedang membaca & merangkum Excel...');
    setStatus({ type: '', message: '' }); // Bersihkan error sebelumnya

    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload-detail-assignment`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Terjadi kesalahan koneksi ke markas');

      // TANGKAP ALIRAN DATA (STREAMING)
      // 🌟 TANGKAP ALIRAN DATA (STREAMING)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = ''; // 🌟 TAMBAHKAN BUFFER PENAMPUNG DI SINI

      while (true) {
        const { value, done } = await reader.read();
        if (done) break; 

        // Masukkan paket baru ke dalam wadah penampung
        buffer += decoder.decode(value, { stream: true });
        
        // Pisahkan pesan berdasarkan enter (\n)
        const lines = buffer.split('\n');
        
        // 🌟 KUNCI RAHASIA: Ambil elemen terakhir (yang mungkin terpotong) 
        // dan kembalikan ke buffer untuk digabung dengan paket selanjutnya!
        buffer = lines.pop(); 

        for (const line of lines) {
          if (!line.trim()) continue; // Abaikan baris kosong

          try {
            const data = JSON.parse(line);

            if (data.status === 'start') {
               setProgressText(`Menyiapkan injeksi ${data.total} data bangunan...`);
            } 
            else if (data.status === 'progress') {
               const percentage = Math.round((data.processed / data.total) * 100);
               setProgress(percentage);
               setProgressText(`Menyuntikkan data ke peta... ${data.processed} / ${data.total}`);
            } 
            else if (data.status === 'done') {
               setProgress(100);
               setProgressText('Eksekusi Selesai!');
               setStatus({ type: 'success', message: `${data.message} (${data.processed} titik diperbarui)` });
               setFile(null); 
            }
            else if (data.status === 'error') {
               setStatus({ type: 'error', message: `Gagal: ${data.message}` });
               setLoading(false);
               setProgressText('');
            }
          } catch (err) {
            console.error('Pesan Stream gagal dibaca (diabaikan sementara):', err, line);
          }
        }
      }
    } catch (error) {
      console.error(error);
      // 🌟 Masukkan pesan error ke dalam state objek
      setStatus({ type: 'error', message: error.message });
      setProgressText('');
    } finally {
      setLoading(false);
      setTimeout(() => { setProgress(0); setProgressText(''); }, 3000);
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
            disabled={!file || loading} // 🌟 Sinkronisasi tombol dengan state loading
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 border border-rose-500/50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> 
                Menyuntikkan Koordinat...
              </>
            ) : (
              'Eksekusi Injeksi Peta'
            )}
          </button>

          {(loading || progress > 0) && (
            <div className="mt-6 p-5 bg-slate-900 border border-slate-700 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300 animate-pulse">{progressText}</span>
                <span className="text-xs font-black text-blue-400">{progress}%</span>
              </div>
              
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}