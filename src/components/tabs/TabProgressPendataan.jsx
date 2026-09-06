import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Map, MapPin, CheckCircle, ChevronLeft, ChevronRight, Database, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TabProgressPendataan({ dataPetugas = [] }) {
  const [dataProgress, setDataProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 STATE BARU UNTUK SUB-TAB PCL / PML
  const [activeSubTab, setActiveSubTab] = useState('pcl');

  // Pagination & Accordion
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const toggleRow = (email) => setExpandedRow(expandedRow === email ? null : email);

  const fetchProgress = async () => {
    setIsLoading(true);
    setExpandedRow(null);
    setCurrentPage(1);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-se2026.bpskotamalang.id';

    try {
      
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload-progress-pendataan` || `http://localhost:8000/api/v1/dashboard/get-progress-pendataan`);

      if (!response.ok) throw new Error("Gagal menarik data");
      const result = await response.json();
      setDataProgress(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      setDataProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  // GABUNGKAN DATA PETUGAS DENGAN DATA PROGRESS (JOIN)
  const combinedData = useMemo(() => {
    if (!dataPetugas || !dataPetugas.length) return [];

    const progressMap = {};
    (dataProgress || []).forEach(dp => {
      progressMap[dp.region_code] = dp;
    });

    return dataPetugas.map(petugas => {
      let totalTarget = 0;
      let totalResponden = 0;
      let matchedSls = [];
      let historyMap = {};

      (petugas.detail_assignment || []).forEach(assign => {
        const slsCode = assign.assignment_code;
        const prog = progressMap[slsCode];

        const tPrelist = prog ? (prog.target_prelist || 0) : (assign.target_prelist || 0);
        const tResponden = prog ? (prog.responden_didata || 0) : 0;
        const tUpdate = prog ? prog.waktu_update : "-";

        totalTarget += tPrelist;
        totalResponden += tResponden;
        
        matchedSls.push({
          ...assign,
          target_prelist: tPrelist,
          responden_didata: tResponden,
          waktu_update: tUpdate,
          sls_persentase: tPrelist > 0 ? Math.round((tResponden / tPrelist) * 100) : 0
        });

        if (prog && prog.history) {
          prog.history.forEach(h => {
            if (!historyMap[h.tanggal]) historyMap[h.tanggal] = { sum: 0, count: 0 };
            historyMap[h.tanggal].sum += h.persentase;
            historyMap[h.tanggal].count += 1;
          });
        }
      });

      const persentase = totalTarget > 0 ? Math.round((totalResponden / totalTarget) * 100) : 0;
      
      const aggregatedHistory = Object.keys(historyMap).map(tgl => ({
        tanggal: tgl,
        persentase: Math.round(historyMap[tgl].sum / historyMap[tgl].count)
      })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

      return {
        ...petugas,
        totalTarget,
        totalResponden,
        persentase,
        matchedSls,
        history: aggregatedHistory
      };
    });
  }, [dataPetugas, dataProgress]);

  // 🌟 FILTER DATA BERDASARKAN SUB-TAB AKTIF (PCL / PML)
  const roleFilteredData = useMemo(() => {
    return combinedData.filter(petugas => {
      const role = petugas.role ? petugas.role.toUpperCase() : 'PCL';
      return activeSubTab === 'pcl' ? role === 'PCL' : role === 'PML';
    });
  }, [combinedData, activeSubTab]);

  // Reset pagination saat pindah tab PCL/PML
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [activeSubTab]);

  // 🌟 PAGINATION SEKARANG MENGGUNAKAN DATA YANG SUDAH DIFILTER ROLE-NYA
  const totalItems = roleFilteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = roleFilteredData.slice(startIndex, endIndex);

  return (
    <div className="overflow-x-auto animate-in fade-in duration-500">
      
      {/* 🌟 TOMBOL NAVIGASI PCL & PML (Sama dengan Tab Petugas Utama) */}
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setActiveSubTab('pcl')} 
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pcl' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Kinerja PCL Lapangan
        </button>
        <button 
          onClick={() => setActiveSubTab('pml')} 
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pml' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Pengawasan PML
        </button>
      </div>

      {/* CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/60 p-4 rounded-tr-xl border border-slate-700/50 gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Tampilkan</span>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entri</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-400 sm:border-l sm:border-slate-700 sm:pl-4">
            Total: <strong className="text-white font-bold">{totalItems}</strong> {activeSubTab === 'pcl' ? 'PCL' : 'PML'} Terpantau
          </span>
        </div>
      </div>

      {/* TABEL DATA PETUGAS */}
      <div className="overflow-x-auto bg-slate-900/40 border-l border-r border-b border-slate-700/50 shadow-inner rounded-b-xl">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-900/80">
              <th className="p-4 w-12 text-center">NO</th>
              <th className="p-4 w-[250px]">NAMA PETUGAS</th>
              <th className="p-4 text-center">TOTAL SLS</th>
              <th className="p-4 text-center">TARGET PRELIST</th>
              <th className="p-4 text-center text-emerald-400">RESPONDEN DIDATA</th>
              <th className="p-4 text-center text-teal-400 w-32">PERSENTASE</th>
              <th className="p-4 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-slate-300 text-sm">
            {currentData.length > 0 ? (
              currentData.map((row, idx) => {
                const actualIndex = startIndex + idx + 1;
                const isExpanded = expandedRow === row.email;
                const isAman = row.persentase >= 100;
                
                // Variabel untuk Badge Label PCL/PML
                const isPml = row.role?.toUpperCase() === 'PML';

                return (
                  <React.Fragment key={idx}>
                    <tr onClick={() => toggleRow(row.email)} className={`hover:bg-slate-800/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}>
                      <td className="p-4 text-center text-slate-500 font-mono text-xs">{actualIndex}</td>
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2" title={row.nama}>
                          <span className={`shrink-0 w-2 h-2 rounded-full ${isAman ? 'bg-teal-400' : 'bg-amber-400'}`}></span> {row.nama}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px] mt-1 truncate">{row.email}</div>
                        {/* 🌟 TAMBAHAN BADGE ROLE DI SINI */}
                        <div className="mt-1">
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${isPml ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                            {row.role || 'PCL'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-300">
                         <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{row.matchedSls.length} Lokasi</span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-300">{row.totalTarget.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-center font-mono text-emerald-400 font-bold text-base">
                        {row.totalResponden.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[100px] mx-auto">
                          <div className="flex justify-end w-full text-[10px] font-bold tracking-tight">
                            <span className={isAman ? 'text-teal-400' : 'text-amber-400'}>{row.persentase}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${isAman ? 'bg-teal-500' : 'bg-amber-500'}`} 
                              style={{ width: `${Math.min(row.persentase, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-500">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                    </tr>

                    {/* ACCORDION DETAIL SLS & GRAFIK */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-b border-slate-700/50 shadow-inner">
                        <td colSpan="7" className="p-0">
                          <div className="pl-12 pr-4 py-6 animate-in slide-in-from-top-2 duration-300">
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                              
                              {/* KIRI: TABEL RINCIAN SLS */}
                              <div className="space-y-4">
                                <h4 className={`text-xs font-bold uppercase flex items-center gap-2 ${isPml ? 'text-purple-400' : 'text-indigo-400'}`}>
                                  <Map size={14} /> Daftar Capaian SLS {isPml ? 'Binaan PML' : 'Petugas'}
                                </h4>
                                <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/50 sticky top-0">
                                      <tr>
                                        <th className="p-3">Kode SLS & Wilayah</th>
                                        <th className="p-3 text-center">Target</th>
                                        <th className="p-3 text-center text-emerald-400">Terdata</th>
                                        <th className="p-3 w-24 text-center text-teal-400">Persentase</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
                                      {row.matchedSls.map((sls, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30">
                                          <td className="p-3">
                                            <div className="font-bold text-slate-200">{sls.assignment_code}</div>
                                            <div className="text-[9px] text-slate-500 mt-0.5 uppercase font-sans">Kec. {sls.nmkec} - {sls.nmdesa}</div>
                                          </td>
                                          <td className="p-3 text-center">{sls.target_prelist || 0}</td>
                                          <td className="p-3 text-center text-emerald-400 font-bold">{sls.responden_didata || 0}</td>
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                <div className={`h-full rounded-full ${sls.sls_persentase >= 100 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(sls.sls_persentase, 100)}%` }}></div>
                                              </div>
                                              <span className={`text-[9px] font-bold w-6 text-right ${sls.sls_persentase >= 100 ? 'text-teal-400' : 'text-amber-400'}`}>{sls.sls_persentase}%</span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* KANAN: GRAFIK TREN KINERJA PETUGAS */}
                              <div>
                                <h4 className="text-xs font-bold text-teal-400 uppercase flex items-center gap-2 mb-4">
                                  <TrendingUp size={14} /> Tren Kinerja (Agregat Harian)
                                </h4>
                                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 h-[250px] w-full">
                                  {row.history && row.history.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={row.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis 
                                          dataKey="tanggal" 
                                          stroke="#64748b" 
                                          fontSize={10} 
                                          tickMargin={10} 
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <YAxis 
                                          stroke="#64748b" 
                                          fontSize={10} 
                                          domain={[0, 100]} 
                                          tickFormatter={(val) => `${val}%`}
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                                          itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
                                          labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                                          formatter={(value) => [`${value}%`, 'Capaian Rata-Rata']}
                                        />
                                        <Line 
                                          type="monotone" 
                                          dataKey="persentase" 
                                          stroke="#2dd4bf" 
                                          strokeWidth={3} 
                                          dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#2dd4bf' }} 
                                          activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 2 }}
                                          animationDuration={1500}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                                      Belum ada histori data untuk petugas ini.
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-24">
                   <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users size={48} className="opacity-20 mb-4" />
                      <span className="font-medium text-sm">
                        {isLoading ? 'Menarik data sinkronisasi...' : `Belum ada data kewajaran yang terhubung dengan ${activeSubTab.toUpperCase()} ini.`}
                      </span>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-b-xl border-b border-l border-r border-slate-700/50 mt-2">
        <div className="text-xs text-slate-400 font-medium">
          Menampilkan <span className="text-white font-bold">{totalItems > 0 ? startIndex + 1 : 0}</span> hingga <span className="text-white font-bold">{endIndex}</span> dari <span className="text-white font-bold">{totalItems}</span> entri
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700">
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {currentPage} / {totalPages || 1}
          </div>
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700">
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}