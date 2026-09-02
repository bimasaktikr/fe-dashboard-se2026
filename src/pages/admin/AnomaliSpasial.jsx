import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ShieldAlert, RefreshCw, Database, AlertTriangle, CheckCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnomaliSpasial() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  
  // State Master Wilayah
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listKelurahan, setListKelurahan] = useState([]);

  // State untuk pencarian teks & filter wilayah bertingkat
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatanCode, setSelectedKecamatanCode] = useState('');
  const [selectedKelurahanId, setSelectedKelurahanId] = useState('');

  // 🌟 STATE UNTUK PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Menampilkan 10 data per halaman

  const isSuperadmin = localStorage.getItem('is_superadmin') === 'true';

  useEffect(() => {
    fetchAnomaliesFromDb();
    fetchKecamatanMaster();
  }, [selectedKecamatanCode, selectedKelurahanId]);

  // 🌟 Reset ke halaman 1 setiap kali filter atau kotak pencarian diubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedKecamatanCode, selectedKelurahanId]);

  const fetchAnomaliesFromDb = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || '';
      
      const params = new URLSearchParams();
      if (selectedKecamatanCode) params.append('kdkec', selectedKecamatanCode);
      if (selectedKelurahanId) params.append('iddesa', selectedKelurahanId);

      const res = await axios.get(`${API_URL}/api/v1/maps/get-spatial-anomalies?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      console.error("Gagal memuat log anomali:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKecamatanMaster = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || '';
      const res = await axios.get(`${API_URL}/api/v1/maps/get-list-kecamatan`);
      setListKecamatan(res.data || []); 
    } catch (err) {
      console.error("Gagal memuat master kecamatan:", err);
    }
  };

  const handleKecamatanChange = async (e) => {
    const kdkec = e.target.value;
    setSelectedKecamatanCode(kdkec);
    setSelectedKelurahanId('');
    setListKelurahan([]);

    if (kdkec) {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || '';
        const res = await axios.get(`${API_URL}/api/v1/maps/get-list-kelurahan/${kdkec}`);
        setListKelurahan(res.data || []); 
      } catch (err) {
        console.error("Gagal memuat master kelurahan:", err);
      }
    }
  };

  const handleRunCalculation = async () => {
    if (!window.confirm("Jalankan kalkulasi ulang spasial? Proses ini akan membaca ulang seluruh koordinat.")) return;
    
    setRunning(true);
    setMessage('');
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || '';
      const currentAdmin = localStorage.getItem('username') || 'superadmin';

      const res = await axios.post(`${API_URL}/api/v1/maps/run-spatial-check`, {}, {
        headers: { 'X-Admin-Username': currentAdmin }
      });
      
      setMessage(res.data.message);
      fetchAnomaliesFromDb(); 
    } catch (err) {
      alert("Gagal menjalankan kalkulasi: " + (err.response?.data?.detail || err.message));
    } finally {
      setRunning(false);
    }
  };

  // Logika Filter Data Tabel dari Memory Client
  const filteredData = useMemo(() => {
    const dataList = result?.data || [];
    if (dataList.length === 0) return [];

    return dataList.filter(item => {
      const keyword = searchTerm.toLowerCase();
      const namaUsaha = (item.nama_usaha || '').toLowerCase();
      const assignmentId = (item.assignment_id || '').toLowerCase();
      const regionDb = String(item.region_code_db || '').toLowerCase();
      
      return namaUsaha.includes(keyword) || assignmentId.includes(keyword) || regionDb.includes(keyword);
    });
  }, [result, searchTerm]);

  // 🌟 LOGIKA PAGINATION MATH
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Ini adalah data akhir yang di-render di tabel per halaman
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-8 text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="text-rose-500" size={28} />
            Monitoring Anomali Spasial
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Daftar titik bangunan yang berada di luar batas poligon SLS atau mengalami *mismatch* wilayah.
          </p>
        </div>

        {isSuperadmin && (
          <button
            onClick={handleRunCalculation}
            disabled={running}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={running ? "animate-spin" : ""} size={18} />
            {running ? "Sedang Kalkulasi Spasial..." : "Jalankan Kalkulasi Ulang (Superadmin)"}
          </button>
        )}
      </div>

      {message && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {message}
        </div>
      )}

      {/* Ringkasan Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><Database size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Titik Dicek</p>
            <p className="text-2xl font-black text-white">{result?.total_checked || 0}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Anomali Terdeteksi</p>
            <p className="text-2xl font-black text-rose-400">{result?.anomalies_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabel Hasil dengan Filter Master Wilayah & Pencarian */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="font-bold text-white text-sm">
            Daftar Log Anomali Tersimpan di Database
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* DROPDOWN KECAMATAN */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs w-full sm:w-auto">
              <Filter size={16} className="text-blue-400 shrink-0" />
              <select
                value={selectedKecamatanCode}
                onChange={handleKecamatanChange}
                className="bg-transparent text-white focus:outline-none cursor-pointer w-full sm:w-48 font-semibold"
              >
                <option value="" className="bg-slate-900">-- SEMUA KECAMATAN --</option>
                {listKecamatan.map((kec) => (
                  <option key={kec.kdkec} value={kec.kdkec} className="bg-slate-900">
                    {kec.nmkec}
                  </option>
                ))}
              </select>
            </div>

            {/* DROPDOWN KELURAHAN */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs w-full sm:w-auto">
              <Filter size={16} className="text-emerald-400 shrink-0" />
              <select
                value={selectedKelurahanId}
                onChange={(e) => setSelectedKelurahanId(e.target.value)}
                disabled={!selectedKecamatanCode}
                className="bg-transparent text-white focus:outline-none cursor-pointer w-full sm:w-48 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-slate-900">
                  {selectedKecamatanCode ? "-- SEMUA KELURAHAN --" : "PILIH KECAMATAN DULU"}
                </option>
                {listKelurahan.map((kel) => (
                  <option key={kel.iddesa} value={kel.iddesa} className="bg-slate-900">
                    {kel.nmdesa}
                  </option>
                ))}
              </select>
            </div>

            {/* KOTAK PENCARIAN */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Cari nama usaha / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data dari database...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle size={32} className="text-emerald-400" />
            <span>Tidak ada data anomali yang cocok dengan filter atau kata kunci tersebut.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-xs border-b border-slate-800">
                    <th className="p-4">Assignment ID</th>
                    <th className="p-4">Nama Usaha</th>
                    <th className="p-4">Region DB</th>
                    <th className="p-4">Wilayah Aktual (Poligon)</th>
                    <th className="p-4">Status Anomali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {/* 🌟 HANYA ME-RENDER currentItems */}
                  {currentItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-blue-400">{row.assignment_id}</td>
                      <td className="p-4 font-semibold text-white">{row.nama_usaha || "-"}</td>
                      <td className="p-4 font-mono text-xs">{row.region_code_db}</td>
                      <td className="p-4 font-mono text-xs text-amber-400">{row.actual_wilayah}</td>
                      <td className="p-4">
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {row.status_anomali}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🌟 FOOTER PAGINATION */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Menampilkan <span className="font-bold text-white">{filteredData.length === 0 ? 0 : indexOfFirstItem + 1}</span> hingga <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredData.length)}</span> dari <span className="font-bold text-white">{filteredData.length}</span> entri
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <span className="text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  Halaman {currentPage} / {totalPages || 1}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}