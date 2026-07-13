import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

export default function TabDesa({ onExport }) {
  // 🌟 State Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'progres_target', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🌟 Server-Side Data State & Caching
  const [serverData, setServerData] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageCache, setPageCache] = useState({}); // Cache pages to minimize lazy loading
  const apiUrl = 'http://localhost:8000'; // FIXME: Revert to env for production

  // Reset cache & halaman jika sorting atau rows per page berubah
  useEffect(() => {
    setCurrentPage(1);
    setPageCache({});
  }, [sortConfig, rowsPerPage]);

  // Fetch Data from Server
  const fetchData = useCallback(async (pageToFetch) => {
    // Cek cache lokal terlebih dahulu
    const cacheKey = `${pageToFetch}-${rowsPerPage}-${sortConfig.key}-${sortConfig.direction}`;
    if (pageCache[cacheKey]) {
      setServerData(pageCache[cacheKey].data);
      setTotalData(pageCache[cacheKey].total_data);
      setTotalPages(pageCache[cacheKey].total_pages);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/v1/dashboard/summary`, {
        params: {
          page: pageToFetch,
          limit: rowsPerPage,
          sort_by: sortConfig.key,
          order: sortConfig.direction
        }
      });
      
      const payload = res.data;
      setServerData(payload.data || []);
      setTotalData(payload.total_data || 0);
      setTotalPages(payload.total_pages || 1);
      
      // Simpan ke cache
      setPageCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: payload.data || [],
          total_data: payload.total_data || 0,
          total_pages: payload.total_pages || 1
        }
      }));
    } catch (err) {
      console.error("Error fetching summary data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, rowsPerPage, sortConfig, pageCache]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // 🌟 KALKULATOR TARGET HARIAN DINAMIS (15 Juni - 75 Hari)
  const getTargetHarian = () => {
    const startDate = new Date('2026-06-15T00:00:00');
    const today = new Date();
    if (today < startDate) return 0;
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
    if (diffDays > 75) return 100;
    return (diffDays / 75) * 100;
  };

  const targetHarian = getTargetHarian();

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="opacity-30 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-400 inline" /> : <ArrowDown size={12} className="text-blue-400 inline" />;
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalData);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <span className="text-sm font-semibold text-slate-400">Total: <strong className="text-white font-bold">{totalData || 0}</strong> kelurahan/desa terpantau</span>
        <button onClick={onExport} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-950/20 transition-all">
          <Download size={16} />
          <span>Unduh Excel</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-900/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
            <th className="p-4 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('kecamatan')}>Kecamatan {getSortIcon('kecamatan')}</th>
            <th className="p-4 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('desa')}>Desa {getSortIcon('desa')}</th>
            
            {/* 🌟 KOLOM TARGET & ALOKATOR */}
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800 text-blue-400" onClick={() => requestSort('target')}>Tgt Utama {getSortIcon('target')}</th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800 text-purple-400" onClick={() => requestSort('alokator')}>Alokator {getSortIcon('alokator')}</th>
            
            <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-950/20" onClick={() => requestSort('status_approved')}>Approved {getSortIcon('status_approved')}</th>
            <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-950/20" onClick={() => requestSort('status_submitted')}>Submitted {getSortIcon('status_submitted')}</th>
            <th className="p-4 text-center text-slate-300 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('status_draft')}>Draft {getSortIcon('status_draft')}</th>
            <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-950/20" onClick={() => requestSort('status_rejected')}>Rejected {getSortIcon('status_rejected')}</th>
            <th className="p-4 text-center text-slate-500 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('status_open')}>Open {getSortIcon('status_open')}</th>
            
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800 w-56" onClick={() => requestSort('progres_target')}>
              Dual Progress {getSortIcon('progres_target')}
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-slate-700/40 text-sm ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
          {serverData.map((item, idx) => {
            // 🌟 Ambil progres target dan alokator langsung dari data API
            const target = item.target || 0;
            const alokator = item.alokator || 0;
            const selesai = (item.status_approved || 0) + (item.status_submitted || 0)+ (item.status_rejected || 0);

            // Hitung persentase jika target > 0
            const progresTarget = target > 0 ? Math.round((selesai / target) * 100) : 0;
            const progresAlokator = alokator > 0 ? Math.round((selesai / alokator) * 100) : 0;
                      
            const isAmanTarget = progresTarget >= targetHarian;

            return (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300">{item.kecamatan}</td>
                <td className="p-4 font-bold text-white">{item.desa}</td>
                
                {/* 🌟 VALUE TARGET & ALOKATOR */}
                <td className="p-4 text-center font-black text-blue-400">{item.target?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-black text-purple-400">{item.alokator?.toLocaleString('id-ID')}</td>
                
                <td className="p-4 text-center font-bold font-mono text-emerald-400">{item.status_approved?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-semibold font-mono text-amber-400">{item.status_submitted?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-mono text-slate-300">{item.status_draft?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-medium font-mono text-rose-400">{item.status_rejected?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-mono text-slate-500">{item.status_open?.toLocaleString('id-ID')}</td>
                
                {/* 🌟 DUAL PROGRESS BAR UNTUK DESA */}
                <td className="p-4">
                  <div className="space-y-3 w-full max-w-[200px] mx-auto">
                    
                    {/* BARIS ATAS: INDIKATOR TARGET UTAMA */}
                    <div title={`Target Hari Ini: ${targetHarian.toFixed(2)}%`}>
                      <div className="flex justify-between text-[10px] text-blue-400 font-bold mb-1">
                        <span>Vs Target ({targetHarian.toFixed(1)}%)</span>
                        <span className={isAmanTarget ? 'text-blue-400' : 'text-rose-400'}>{progresTarget}%</span>
                      </div>
                      <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isAmanTarget ? 'bg-blue-500' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(progresTarget, 100)}%` }}
                        ></div>
                        {/* Garis Penanda Target Harian */}
                        <div 
                          className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10"
                          style={{ left: `${targetHarian}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* BARIS BAWAH: INDIKATOR ALOKATOR */}
                    <div>
                      <div className="flex justify-between text-[10px] text-purple-400 font-bold mb-1">
                        <span>Vs Alokator</span>
                        <span>{progresAlokator}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(progresAlokator, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {/* 🌟 PAGINATION CONTROLS */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
        <div>
          Menampilkan {totalData === 0 ? 0 : startIndex + 1}-{endIndex} dari {totalData} baris
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="desa-rows" className="text-slate-500">Baris:</label>
          <select
            id="desa-rows"
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