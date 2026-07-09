import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle, Filter, UserX, MapPin, Target, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TabAnomali({ selectedKecamatanGlobal, selectedKelurahanGlobal }) {
  const apiUrl = 'http://localhost:8000'; // FIXME: Revert to env for production

  // 🌟 STATE BARU: Acuan Anomali
  const [acuanAnomali, setAcuanAnomali] = useState('target'); // 'target', 'alokator', 'draft_high', 'draft_low'
  const [selectedKecamatan, setSelectedKecamatan] = useState(selectedKecamatanGlobal || '');
  const [selectedDesa, setSelectedDesa] = useState(selectedKelurahanGlobal || '');

  // 🌟 State Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'progres_target', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 Server-Side Data State & Caching
  const [serverData, setServerData] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageCache, setPageCache] = useState({});

  // 🌟 STATE LIST WILAYAH (Khusus Dropdown)
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listDesa, setListDesa] = useState([]);

  // Sync dengan global props
  useEffect(() => {
    if (selectedKecamatanGlobal) setSelectedKecamatan(selectedKecamatanGlobal);
    if (selectedKelurahanGlobal) setSelectedDesa(selectedKelurahanGlobal);
  }, [selectedKecamatanGlobal, selectedKelurahanGlobal]);

  // 🌟 KALKULATOR TARGET HARIAN DINAMIS
  const getTargetHarian = () => {
    const startDate = new Date('2026-06-15T00:00:00');
    const today = new Date();
    if (today < startDate) return 0;
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
    if (diffDays > 60) return 100;
    return (diffDays / 60) * 100;
  };
  const batasAnomaliHarian = getTargetHarian() * 0.5;

  // Reset cache & halaman jika filter/sorting berubah
  useEffect(() => {
    setCurrentPage(1);
    setPageCache({});
  }, [sortConfig, rowsPerPage, acuanAnomali, selectedKecamatan, selectedDesa]);

  // Fetch Data from Server
  const fetchData = useCallback(async (pageToFetch) => {
    const cacheKey = `${pageToFetch}-${rowsPerPage}-${sortConfig.key}-${sortConfig.direction}-${acuanAnomali}-${selectedKecamatan}-${selectedDesa}`;
    
    if (pageCache[cacheKey]) {
      setServerData(pageCache[cacheKey].data);
      setTotalData(pageCache[cacheKey].total_data);
      setTotalPages(pageCache[cacheKey].total_pages);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/v1/dashboard/petugas`, {
        params: {
          page: pageToFetch,
          limit: rowsPerPage,
          sort_by: sortConfig.key,
          order: sortConfig.direction,
          kecamatan: selectedKecamatan,
          desa: selectedDesa,
          max_progres: batasAnomaliHarian,
          acuan: acuanAnomali
        }
      });
      
      const payload = res.data;
      setServerData(payload.data || []);
      setTotalData(payload.total_data || 0);
      setTotalPages(payload.total_pages || 1);
      
      setPageCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: payload.data || [],
          total_data: payload.total_data || 0,
          total_pages: payload.total_pages || 1
        }
      }));
    } catch (err) {
      console.error("Error fetching anomaly data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, rowsPerPage, sortConfig, pageCache, acuanAnomali, selectedKecamatan, selectedDesa, batasAnomaliHarian]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // Fetch wilayah list for dropdowns (using summary endpoint instead of fetching 9999 petugas)
  useEffect(() => {
    axios.get(`${apiUrl}/api/v1/dashboard/summary`, { params: { limit: 0 } })
      .then(res => {
        const rawData = res.data.data || [];
        setListKecamatan([...new Set(rawData.map(item => item.kecamatan).filter(Boolean))].sort());
        
        if (selectedKecamatan) {
          const desas = rawData.filter(item => item.kecamatan === selectedKecamatan).map(item => item.desa);
          setListDesa([...new Set(desas.filter(Boolean))].sort());
        } else {
          setListDesa([]);
        }
      })
      .catch(err => console.error("Error fetching wilayah:", err));
  }, [apiUrl, selectedKecamatan]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="inline ml-1 opacity-40" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalData);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-6 justify-between items-center">
        
        {/* Kiri: Header */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 p-2 rounded-lg">
            <UserX size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Radar Anomali</h3>
            {acuanAnomali === 'draft_high' ? (
               <p className="text-[11px] text-slate-400">Petugas dengan <strong className="text-amber-400">Draft &gt; 10 Dokumen</strong></p>
            ) : acuanAnomali === 'draft_low' ? (
               <p className="text-[11px] text-slate-400">Petugas dengan <strong className="text-teal-400">Draft &lt; 10 Dokumen</strong></p>
            ) : (
               <p className="text-[11px] text-slate-400">Petugas dengan progres di bawah <strong className="text-rose-400">{batasAnomaliHarian.toFixed(1)}%</strong></p>
            )}
          </div>
        </div>

        {/* Kanan: Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Total Petugas Kritis</div>
              <div className="text-2xl font-black text-rose-400">
                {totalData || 0} <span className="text-sm font-normal text-slate-400">Orang</span>
              </div>
            </div>
          
          {/* 🌟 DROPDOWN ACUAN ANOMALI */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-rose-900/50 shadow-inner">
             <Target size={14} className="text-rose-400" />
             <span className="text-[10px] uppercase font-bold text-slate-400">Acuan:</span>
             <select
                value={acuanAnomali}
                onChange={(e) => setAcuanAnomali(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
             >
                <option value="target" className="bg-slate-900 text-blue-400">Di Bawah Target Utama</option>
                <option value="alokator" className="bg-slate-900 text-purple-400">Di Bawah Alokator</option>
                <option value="draft_high" className="bg-slate-900 text-amber-400">Draft &gt; 10 Dokumen</option>
                <option value="draft_low" className="bg-slate-900 text-teal-400">Draft &lt; 10 Dokumen</option>
             </select>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

          {/* DROPDOWN KECAMATAN */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedKecamatan}
              onChange={(e) => { setSelectedKecamatan(e.target.value); setSelectedDesa(''); }}
              className="bg-transparent text-xs text-white focus:outline-none w-32 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">Semua Kec.</option>
              {listKecamatan.map((kec, i) => (
                <option key={i} value={kec} className="bg-slate-900">{kec}</option>
              ))}
            </select>
          </div>

          {/* DROPDOWN DESA */}
          <div className={`flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 transition-opacity ${!selectedKecamatan ? 'opacity-40' : 'opacity-100'}`}>
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedDesa}
              disabled={!selectedKecamatan}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-32 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900 text-slate-400">Semua Kel.</option>
              {listDesa.map((desa, i) => (
                <option key={i} value={desa} className="bg-slate-900">{desa}</option>
              ))}
            </select>
          </div>

          {(selectedKecamatan || selectedDesa) && (
            <button onClick={() => { setSelectedKecamatan(''); setSelectedDesa(''); }} className="text-xs font-semibold text-slate-400 hover:text-white underline transition-colors">
              Reset Wilayah
            </button>
          )}
        </div>
      </div>

      {/* BANNER HASIL */}
      <div className="bg-slate-800/50 border-l-4 border-rose-500 p-4 rounded-r-xl flex justify-between items-center">
        <div>
          <h4 className="text-rose-400 font-bold text-sm">Hasil Scan Lapangan:</h4>
          <p className="text-slate-300 text-xs mt-1">
            {isLoading ? (
              <span className="text-slate-400 italic">Sedang memindai seluruh petugas di database...</span>
            ) : (
              <>Terdeteksi <span className="font-bold text-white text-base font-mono">{totalData}</span> petugas bermasalah.</>
            )}
          </p>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="overflow-x-auto bg-slate-900/40 rounded-xl border border-slate-700/50">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 w-[250px] cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('nama')}>
                Identitas Petugas {getSortIcon('nama')}
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('kecamatanStr')}>
                Wilayah Tugas {getSortIcon('kecamatanStr')}
              </th>
              <th className="p-4 text-center text-blue-400 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('target')}>
                Target {getSortIcon('target')}
              </th>
              <th className="p-4 text-center text-purple-400 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('alokator')}>
                Alokator {getSortIcon('alokator')}
              </th>
              <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('status_approved')}>
                Appv {getSortIcon('status_approved')}
              </th>
              <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('status_submitted')}>
                Subm {getSortIcon('status_submitted')}
              </th>
              <th className="p-4 text-center text-slate-300 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('status_draft')}>
                Draft {getSortIcon('status_draft')}
              </th>
              <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-950/30 transition-colors" onClick={() => requestSort('status_rejected')}>
                Rejc {getSortIcon('status_rejected')}
              </th>
              <th className="p-4 w-48 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('progres_target')}>
                Dual Progress {getSortIcon('progres_target')}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-700/40 text-sm ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
            {serverData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center p-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-slate-800/50 p-4 rounded-full mb-3">
                      <AlertTriangle size={32} className="text-emerald-500/50" />
                    </div>
                    <span className="font-semibold text-emerald-400">Data Kosong, Komandan!</span>
                  </div>
                </td>
              </tr>
            ) : (
              serverData.map((item, idx) => {
                const progresTarget = item.progres_target;
                const progresAlokator = item.progres_alokator;
                return (
                <tr key={`${item.email || 'email'}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white leading-tight">{item.nama}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{item.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-300 leading-tight text-xs">{item.kecamatanStr}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase max-w-[150px] truncate" title={item.desaStr}>{item.desaStr}</div>
                  </td>
                  <td className="p-4 text-center font-black font-mono text-blue-400">{item.target?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-black font-mono text-purple-400">{item.alokator?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-bold font-mono text-emerald-400">{item.status_approved?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-semibold font-mono text-amber-400">{item.status_submitted?.toLocaleString('id-ID')}</td>
                  
                  {/* 🌟 Kolom Draft akan menyala bila filter Draft dipilih */}
                  <td className={`p-4 text-center font-mono font-bold ${(acuanAnomali === 'draft_high' || acuanAnomali === 'draft_low') ? 'text-amber-500 bg-amber-950/30' : 'text-slate-300'}`}>
                    {item.status_draft?.toLocaleString('id-ID')}
                  </td>

                  <td className="p-4 text-center font-mono text-rose-400">{item.status_rejected?.toLocaleString('id-ID')}</td>
                  
                  <td className="p-4">
                    <div className="space-y-2 w-full">
                      {/* Baris Target */}
                      <div className="flex items-center gap-2" title={`Vs Target: ${item.progres_target}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`absolute top-0 left-0 h-full rounded-full ${acuanAnomali === 'target' && item.progres_target < batasAnomaliHarian ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(item.progres_target, 100)}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${acuanAnomali === 'target' && item.progres_target < batasAnomaliHarian ? 'text-rose-400' : 'text-blue-400'}`}>{item.progres_target}%</span>
                      </div>
                      {/* Baris Alokator */}
                      <div className="flex items-center gap-2" title={`Vs Alokator: ${item.progres_alokator}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`absolute top-0 left-0 h-full rounded-full ${acuanAnomali === 'alokator' && item.progres_alokator < batasAnomaliHarian ? 'bg-rose-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(item.progres_alokator, 100)}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${acuanAnomali === 'alokator' && item.progres_alokator < batasAnomaliHarian ? 'text-rose-400' : 'text-purple-400'}`}>{item.progres_alokator}%</span>
                      </div>
                    </div>
                  </td>

                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 PAGINATION CONTROLS */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
        <div>
          Menampilkan {totalData === 0 ? 0 : startIndex + 1}-{endIndex} dari {totalData} baris
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="anomali-rows" className="text-slate-500">Baris:</label>
          <select
            id="anomali-rows"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-mono"
            title="Halaman Pertama"
          >
            «
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            Sebelumnya
          </button>
          <span className="text-slate-300">Hal {currentPage}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            Selanjutnya
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-mono"
            title="Halaman Terakhir"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}