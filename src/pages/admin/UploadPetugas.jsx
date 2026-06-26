import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function UploadPetugas() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/api/v1/admin/upload-petugas', formData, {
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
        <h1 className="text-3xl font-bold text-slate-800">Upload Master Petugas</h1>
        <p className="text-slate-500 mt-2">Unggah file Excel yang berisi daftar Mitra BPS baru.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-12 bg-slate-50">
          <UploadCloud size={48} className="text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Pilih File Excel (.xlsx)</h3>
          <p className="text-sm text-slate-500 mb-6">Wajib memiliki kolom: nama, email, role</p>
          
          <label className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-50 transition-colors">
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
            disabled={!file || loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
              !file || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Daftarkan Petugas'}
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
