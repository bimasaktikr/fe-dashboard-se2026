import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import axios from 'axios';

export default function UploadHistoris() {
  const [file, setFile] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file || !date) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_date', date);

    try {
      const res = await axios.post('http://localhost:8000/api/v1/admin/upload-historis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Injeksi Data Historis (FASIH)</h1>
        <p className="text-slate-500 mt-2">Unggah log export dari FASIH untuk melihat progres di masa lalu.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Tanggal Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-12 bg-slate-50">
          <UploadCloud size={48} className="text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Pilih File Excel FASIH (.xlsx)</h3>
          
          <label className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-50 transition-colors mt-4">
            Cari File
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          
          {file && (
            <div className="mt-4 text-sm text-blue-600 font-medium">
              File terpilih: {file.name}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || !date || loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
              !file || !date || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Mulai Sinkronisasi'}
          </button>
        </div>

        {message && (
          <div className="mt-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} />
            <span className="font-medium">{message}</span>
          </div>
        )}
        
        {error && (
          <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
