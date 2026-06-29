import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Map, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TabPetugas({ dataPetugas, dataTimeline }) {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 🌟 STATE UNTUK SORTING (Default: Urutkan berdasarkan progres target terbesar)
  const [sortConfig, setSortConfig] = useState({ key: 'progres_target', direction: 'desc' });

  const toggleRow = (email) => {
    setExpandedRow(expandedRow === email ? null : email);
  };

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

  // 🌟 MESIN PENGURUT DATA (Sorting Engine)
  const sortedDataPetugas = useMemo(() => {
    let sortableItems = [...(dataPetugas || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [dataPetugas, sortConfig]);

  // 🌟 FUNGSI PENANGAN KLIK HEADER
  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'; 
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig?.key !== columnName) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />;
  };

  const formatLengkapWaktu = (timestampRaw) => {
    if (!timestampRaw || timestampRaw === "-") return "-";
    try {
      const dateObj = new Date(timestampRaw);
      if (isNaN(dateObj.getTime())) return timestampRaw;
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(dateObj) + ' WIB';
    } catch (e) {
      return timestampRaw;
    }
  };

  const getChartDataForPetugas = (email) => {
    if (!dataTimeline) return [];
    const filtered = dataTimeline.filter(d => d.email_petugas === email);
    const grouped = {};
    filtered.forEach(d => {
      if (!grouped[d.tanggal]) grouped[d.tanggal] = { tanggal: d.tanggal, Approved: 0, Submitted: 0 };
      grouped[d.tanggal].Approved += d.status_approved || 0;
      grouped[d.tanggal].Submitted += d.status_submitted || 0;
    });
    return Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <th className="p-4 w-10"></th>
            <th className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('nama')}>
              <div className="flex items-center gap-2">Nama Petugas {getSortIcon('nama')}</div>
            </th>
            {/* 🌟 KOLOM TARGET UTAMA DAN ALOKATOR */}
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-blue-400" onClick={() => requestSort('target')}>
              <div className="flex items-center justify-center gap-2">Tgt Utama {getSortIcon('target')}</div>
            </th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors text-purple-400" onClick={() => requestSort('alokator')}>
              <div className="flex items-center justify-center gap-2">Alokator {getSortIcon('alokator')}</div>
            </th>

            <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-900/20 transition-colors" onClick={() => requestSort('status_approved')}>
              <div className="flex items-center justify-center gap-2">Appv {getSortIcon('status_approved')}</div>
            </th>
            <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-900/20 transition-colors" onClick={() => requestSort('status_submitted')}>
              <div className="flex items-center justify-center gap-2">Subm {getSortIcon('status_submitted')}</div>
            </th>
            <th className="p-4 text-center text-slate-400 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('status_draft')}>
              <div className="flex items-center justify-center gap-2">Draft {getSortIcon('status_draft')}</div>
            </th>
            <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-900/20 transition-colors" onClick={() => requestSort('status_rejected')}>
              <div className="flex items-center justify-center gap-2">Rejc {getSortIcon('status_rejected')}</div>
            </th>
            
            {/* 🌟 SORTING BERDASARKAN PROGRES TARGET UTAMA (sebagai default visual) */}
            <th className="p-4 w-1/4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('progres_target')}>
              <div className="flex items-center justify-center gap-2">Dual Progress {getSortIcon('progres_target')}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-slate-300">
          {sortedDataPetugas.map((item, idx) => {
            const isExpanded = expandedRow === item.email;
            
            // 🌟 KALKULASI PROGRES AMAN (Jika target/alokator 0, hasil 0)
            const target = item.target || 0;
            const alokator = item.alokator || 0;
            const approved = item.status_approved || 0;
            const submitted = item.status_submitted || 0;
            const rejected = item.status_rejected || 0;
            const progresRiil = approved + submitted + rejected;

            const progresTarget = target > 0 ? Math.round((progresRiil / target) * 100) : 0;
            const progresAlokator = alokator > 0 ? Math.round((progresRiil / alokator) * 100) : 0;

            return (
              <React.Fragment key={idx}>
                {/* BARIS UTAMA */}
                <tr 
                  onClick={() => toggleRow(item.email)}
                  className="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      {item.nama}
                    </div>
                    <div className="text-slate-400 font-mono text-[10px] mt-1 tracking-wider">{item.email} • <span className="text-indigo-400">{item.role}</span></div>
                  </td>
                  
                  {/* VALUE TARGET & ALOKATOR */}
                  <td className="p-4 text-center font-black text-blue-400">{target.toLocaleString()}</td>
                  <td className="p-4 text-center font-black text-purple-400">{alokator.toLocaleString()}</td>
                  
                  <td className="p-4 text-center font-mono text-emerald-400 font-bold">{approved.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-amber-400">{submitted.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-slate-400">{item.status_draft?.toLocaleString()}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{item.status_rejected?.toLocaleString()}</td>
                  
                  {/* 🌟 DUAL PROGRESS BAR */}
                  <td className="p-4 text-sm">
                    <div className="space-y-3 w-full lg:w-56 mx-auto">
                      {/* BARIS ATAS: INDIKATOR TARGET UTAMA */}
                      <div>
                        <div className="flex justify-between text-[10px] text-blue-400 font-bold mb-1">
                          <span>Vs Target ({targetHarian.toFixed(1)}%)</span>
                          <span>{progresTarget}%</span>
                        </div>
                        <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                          <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${progresTarget >= targetHarian ? 'bg-blue-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(progresTarget, 100)}%` }}
                          ></div>
                          <div className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" style={{ left: `${targetHarian}%` }}></div>
                        </div>
                      </div>

                      {/* BARIS BAWAH: INDIKATOR ALOKATOR DENGAN GARIS TARGET */}
                      <div>
                        <div className="flex justify-between text-[10px] text-purple-400 font-bold mb-1">
                          <span>Vs Alokator ({targetHarian.toFixed(1)}%)</span>
                          <span>{progresAlokator}%</span>
                        </div>
                        
                        {/* Tambahkan 'relative' di sini agar garis target bisa muncul */}
                        <div className="relative w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                          {/* Bar Progress */}
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(progresAlokator, 100)}%` }}
                          ></div>
                          
                          {/* Garis Penanda Target Harian (Marker) */}
                          <div 
                            className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" 
                            style={{ left: `${targetHarian}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* SUB-BARIS AKORDEON (DETAIL SLS) */}
                {isExpanded && (
                  <tr className="bg-slate-900/90 border-l-[3px] border-indigo-500 shadow-inner">
                    <td colSpan="9" className="p-0"> {/* colSpan disesuaikan jadi 9 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-14 pr-6 py-6">
                        
                        {/* KOLOM KIRI: TABEL DETAIL ASSIGNMENT SLS */}
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2 mb-3">
                            <Map size={14} /> Detail Penugasan Region (SLS):
                          </h4>
                          <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-900">
                                <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                  <th className="p-3 text-left">Wilayah & SLS</th>
                                  <th className="p-3 text-center text-blue-400">Tgt</th>
                                  <th className="p-3 text-center text-purple-400">Alok</th>
                                  <th className="p-3 text-center text-emerald-400">Appv</th>
                                  <th className="p-3 text-center text-amber-400">Subm</th>
                                  <th className="p-3 text-center text-red-400">Rjct</th>
                                  <th className="p-3 text-center">Dual Progress</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {item.detail_assignment?.map((assign, i) => (
                                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 text-indigo-200 font-mono text-[10px] leading-relaxed">
                                      <span className="font-bold text-slate-300">{assign.desa}</span> <br/>
                                      <span className="text-slate-500">{assign.assignment_code}</span>
                                      
                                      {/* Waktu Sinkronisasi Terakhir (Mini Badge) */}
                                      <div className="mt-1">
                                      {assign.last_synced_at !== "-" ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-700">
                                          <Clock size={8} /> {formatLengkapWaktu(assign.last_synced_at)}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-600">Belum sync</span>
                                      )}
                                      </div>
                                    </td>
                                    {/* baris accordion */}
                                    <td className="p-3 text-center font-black text-blue-400 text-xs">{assign.target}</td>
                                    <td className="p-3 text-center font-black text-purple-400 text-xs">{assign.alokator}</td>
                                    <td className="p-3 text-center font-mono text-emerald-500">{assign.status_approved}</td>
                                    <td className="p-3 text-center font-mono text-amber-500">{assign.status_submitted}</td>
                                    <td className="p-3 text-center font-mono text-red-500">{assign.status_rejected}</td>
                                    
                                   {/* 🌟 DUAL PROGRESS BAR VERSI MINI UNTUK SLS DENGAN ANGKA */}
                                  <td className="p-3 w-40"> {/* Lebar ditambah sedikit agar angka muat */}
                                    <div className="space-y-2">
                                      
                                      {/* BARIS PROGRESS TARGET */}
                                      <div className="flex items-center gap-2">
                                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700" title={`Vs Target: ${assign.progres_target}%`}>
                                          <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(assign.progres_target, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-400 w-8 text-right">
                                          {assign.progres_target}%
                                        </span>
                                      </div>

                                      {/* BARIS PROGRESS ALOKATOR */}
                                      <div className="flex items-center gap-2">
                                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700" title={`Vs Alokator: ${assign.progres_alokator}%`}>
                                          <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(assign.progres_alokator, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-purple-400 w-8 text-right">
                                          {assign.progres_alokator}%
                                        </span>
                                      </div>
                                      
                                    </div>
                                  </td>
                                    
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* KOLOM KANAN: CHART */}
                        <div>
                           <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-3">
                            <TrendingUp size={14} /> Histori Validasi Harian
                          </h4>
                          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartDataForPetugas(item.email)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={10} width={40} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="Approved" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Submitted" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}