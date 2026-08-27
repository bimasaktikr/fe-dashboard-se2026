import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, MapPin } from 'lucide-react';

export default function AnomaliSpasial() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/maps/check-spatial-anomalies`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Gagal memuat data anomali: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={24} />
            Monitor Anomali Spasial Wilayah
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deteksi otomatis titik bangunan yang koordinat GPS-nya tidak sesuai dengan kode wilayah (region_code).
          </p>
        </div>
        <button
          onClick={fetchAnomalies}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Menganalisis Spasial..." : "Jalankan Cek Anomali"}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 font-bold block uppercase">Total Titik Dicek</span>
            <span className="text-2xl font-black text-white">{result.total_checked}</span>
          </div>
          <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl">
            <span className="text-xs text-rose-400 font-bold block uppercase">Ditemukan Anomali / Outlier</span>
            <span className="text-2xl font-black text-rose-400">{result.anomalies_count}</span>
          </div>
        </div>
      )}

      {result && result.data.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-300">
            Daftar Assignment Nyasar / Mismatch
          </div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono sticky top-0">
                <tr>
                  <th className="p-3">Status Anomali</th>
                  <th className="p-3">Nama Usaha / Bangunan</th>
                  <th className="p-3">Kode DB (16 Digit)</th>
                  <th className="p-3">Posisi Aktual Spasial</th>
                  <th className="p-3">Aksi Koordinat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result.data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3">
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg font-bold text-[10px]">
                        {item.status_anomali}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{item.nama_usaha || '-'} (Bng: {item.nomor_bangunan})</td>
                    <td className="p-3 font-mono text-slate-400">{item.region_code_db}</td>
                    <td className="p-3 font-mono text-amber-400">{item.actual_wilayah}</td>
                    <td className="p-3">
                      <a 
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-600/30 transition-all"
                      >
                        <MapPin size={12}/> Buka Maps
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}