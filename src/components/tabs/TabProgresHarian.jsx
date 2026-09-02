import React, { useMemo, useState } from 'react';
import { Users, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TabProgresHarian({ dataPetugas, dataTimeline, selectedKecamatan, selectedKelurahan }) {
  const [activeSubTab, setActiveSubTab] = useState('pcl');
  
  // 🌟 Default sorting sekarang langsung mengarah ke Progress Realisasi tertinggi!
  const [sortConfig, setSortConfig] = useState({ key: 'progressRealisasi', direction: 'desc' });

  // 🧮 PURE FRONTEND ENGINE
  const sortedData = useMemo(() => {
    if (!dataPetugas || dataPetugas.length === 0 || !dataTimeline || dataTimeline.length === 0) return [];

    // 1. FILTER ROLE (PCL / PML)
    const filteredByRole = dataPetugas.filter(item => {
      const role = item.role ? item.role.toUpperCase() : 'PCL';
      return activeSubTab === 'pcl' ? role === 'PCL' : role === 'PML';
    });

    // 2. Dapatkan Tanggal H-1 dari dataTimeline
    const uniqueDates = [...new Set(dataTimeline.map(d => d.tanggal || d.tanggal_data).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const dateH1 = uniqueDates.length > 1 ? uniqueDates[1] : uniqueDates[0];

    // 3. Saring Timeline H-1
    const timelineH1 = dataTimeline.filter(item => {
      const tglMatch = (item.tanggal === dateH1 || item.tanggal_data === dateH1);
      const matchKec = selectedKecamatan ? item.kecamatan === selectedKecamatan : true;
      const matchKel = selectedKelurahan ? item.desa === selectedKelurahan : true;
      return tglMatch && matchKec && matchKel;
    });

    // 4. Agregasi H-1
    const mapH1 = {};
    timelineH1.forEach(item => {
      const email = item.email_petugas || item.email;
      if (!mapH1[email]) mapH1[email] = { open: 0, draft: 0 };
      mapH1[email].open += (item.status_open || 0);
      mapH1[email].draft += (item.status_draft || 0);
    });

    // 5. Rakit Data (H vs H-1) & Hitung Progress Realisasi
    let computedData = filteredByRole.map(p => {
      const total = p.target || 0; 
      const openH = p.status_open || 0;
      const draftH = p.status_draft || 0;

      const openH1 = mapH1[p.email]?.open || 0;
      const draftH1 = mapH1[p.email]?.draft || 0;

      const realisasiH1 = Math.max(0, total - openH1 - draftH1);
      const realisasiH = Math.max(0, total - openH - draftH);

      return {
        nama_petugas: p.nama || p.email,
        email: p.email,
        role: p.role || 'PCL',
        total: total,
        openH1: openH1,
        openH: openH,
        draftH1: draftH1,
        draftH: draftH,
        progressDraft: draftH1 - draftH,
        realisasiH1: realisasiH1,
        realisasiH: realisasiH,
        // 🌟 TAMBAHAN LOGIKA BARU: PROGRESS REALISASI
        progressRealisasi: realisasiH - realisasiH1 
      };
    });

    // 6. Proses Sorting
    if (sortConfig !== null) {
      computedData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    return computedData;
  }, [dataPetugas, dataTimeline, selectedKecamatan, selectedKelurahan, sortConfig, activeSubTab]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="opacity-30 inline ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-white inline ml-1" /> : <ArrowDown size={12} className="text-white inline ml-1" />;
  };

  return (
    <div className="overflow-x-auto animate-in fade-in duration-500">
      
      {/* Tombol Navigasi PCL & PML */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveSubTab('pcl')}
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pcl' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Progres PCL Lapangan
        </button>
        <button
          onClick={() => setActiveSubTab('pml')}
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pml' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Progres Pengawas PML
        </button>
      </div>

      {/* Header Analitik */}
      <div className="flex items-center gap-3 mb-4 p-4 bg-slate-900/40 border border-slate-700/50 rounded-xl">
        <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-400 border border-blue-500/30">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">ANALITIK PROGRES HARIAN (H-1 vs H)</h2>
          <p className="text-xs font-semibold text-slate-400">Monitoring Kecepatan Harian (Velocity) dan Pergerakan Realisasi per Petugas</p>
        </div>
      </div>

      {/* Tabel Utama */}
      <div className="bg-slate-900/40 border-l border-r border-b border-t border-slate-700/50 shadow-inner rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-700">
              <th className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors w-[220px]" onClick={() => requestSort('nama_petugas')}>
                Nama Petugas {getSortIcon('nama_petugas')}
              </th>
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-blue-400 border-r border-slate-800" onClick={() => requestSort('total')}>
                Total Region {getSortIcon('total')}
              </th>
              
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-slate-500" onClick={() => requestSort('openH1')}>
                Open H-1 {getSortIcon('openH1')}
              </th>
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-slate-300 border-r border-slate-800" onClick={() => requestSort('openH')}>
                Open H {getSortIcon('openH')}
              </th>
              
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-amber-500/50" onClick={() => requestSort('draftH1')}>
                Draft H-1 {getSortIcon('draftH1')}
              </th>
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-amber-400 border-r border-slate-800" onClick={() => requestSort('draftH')}>
                Draft H {getSortIcon('draftH')}
              </th>
              
              <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-purple-400 border-r border-slate-800 bg-purple-900/10" onClick={() => requestSort('progressDraft')}>
                Progress Draft {getSortIcon('progressDraft')}
              </th>
              
              <th className="p-4 text-center cursor-pointer hover:bg-emerald-900/20 transition-colors text-emerald-500/50" onClick={() => requestSort('realisasiH1')}>
                Realisasi H-1 {getSortIcon('realisasiH1')}
              </th>
              <th className="p-4 text-center cursor-pointer hover:bg-emerald-900/20 transition-colors text-emerald-400 bg-emerald-900/10" onClick={() => requestSort('realisasiH')}>
                Realisasi H {getSortIcon('realisasiH')}
              </th>
              
              {/* 🌟 TAMBAHAN: KOLOM PROGRESS REALISASI (VELOCITY) */}
              <th className="p-4 text-center cursor-pointer hover:bg-emerald-800/40 transition-colors text-emerald-300 bg-emerald-900/30 border-l border-emerald-800/50" onClick={() => requestSort('progressRealisasi')} title="Berapa banyak dokumen yang berhasil diselesaikan hari ini">
                Progress Realisasi {getSortIcon('progressRealisasi')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-slate-300 text-sm">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center p-12 text-slate-500 italic">Data progres tidak ada untuk wilayah/role filter ini.</td>
              </tr>
            ) : (
              sortedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white truncate max-w-[200px]" title={item.nama_petugas}>
                      {item.nama_petugas}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${item.role.toUpperCase() === 'PML' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                        {item.role.toUpperCase() === 'PML' ? 'PML' : 'PCL'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-black font-mono text-blue-400 border-r border-slate-800/50">
                    {item.total.toLocaleString('id-ID')}
                  </td>
                  
                  <td className="p-4 text-center font-mono text-slate-500 bg-slate-900/30">
                    {item.openH1.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center font-bold font-mono text-slate-300 border-r border-slate-800/50">
                    {item.openH.toLocaleString('id-ID')}
                  </td>
                  
                  <td className="p-4 text-center font-mono text-amber-500/50 bg-slate-900/30">
                    {item.draftH1.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center font-bold font-mono text-amber-400 border-r border-slate-800/50">
                    {item.draftH.toLocaleString('id-ID')}
                  </td>
                  
                  <td className="p-4 text-center border-r border-slate-800/50 bg-purple-900/10">
                    <div className="flex items-center justify-center gap-1.5">
                      {item.progressDraft > 0 ? (
                        <TrendingUp size={14} className="text-emerald-400" />
                      ) : item.progressDraft < 0 ? (
                        <TrendingDown size={14} className="text-rose-400" />
                      ) : (
                        <Minus size={14} className="text-slate-600" />
                      )}
                      <span className={`font-black font-mono ${item.progressDraft > 0 ? 'text-emerald-400' : item.progressDraft < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {item.progressDraft > 0 ? '+' : ''}{item.progressDraft}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center font-mono text-emerald-500/50 bg-slate-900/30">
                    {item.realisasiH1.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center font-black font-mono text-emerald-400 bg-emerald-900/10 text-lg">
                    {item.realisasiH.toLocaleString('id-ID')}
                  </td>

                  {/* 🌟 TAMBAHAN: RENDER SEL PROGRESS REALISASI */}
                  <td className="p-4 text-center border-l border-emerald-800/30 bg-emerald-900/20">
                    <div className="flex items-center justify-center gap-1.5">
                      {item.progressRealisasi > 0 ? (
                        <TrendingUp size={16} className="text-emerald-300" />
                      ) : item.progressRealisasi < 0 ? (
                        <TrendingDown size={16} className="text-rose-400" />
                      ) : (
                        <Minus size={16} className="text-emerald-800" />
                      )}
                      <span className={`text-lg font-black font-mono ${item.progressRealisasi > 0 ? 'text-emerald-300' : item.progressRealisasi < 0 ? 'text-rose-400' : 'text-emerald-700'}`}>
                        {item.progressRealisasi > 0 ? '+' : ''}{item.progressRealisasi.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}