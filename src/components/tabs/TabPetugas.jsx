import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Map, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TabPetugas({ dataPetugas, dataTimeline, onExport }) {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 🌟 STATE UNTUK SORTING
  const [sortConfig, setSortConfig] = useState({ key: 'progres_persen', direction: 'desc' });

  const toggleRow = (email) => {
    setExpandedRow(expandedRow === email ? null : email);
  };

  // 🌟 KALKULASI SISA HARI (Deadline: 15 Agustus 2026)
  const getSisaHari = () => {
    const deadline = new Date('2026-08-15T23:59:59');
    const today = new Date();
    if (today >= deadline) return 1; // Cegah pembagian dengan 0 atau minus
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };
  const sisaHari = getSisaHari();

  // 🌟 KALKULATOR TARGET HARIAN DINAMIS (15 Juni - 60 Hari)
  const getTargetHarian = () => {
    const startDate = new Date('2026-06-15T00:00:00');
    const today = new Date();
    if (today < startDate) return 0;
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
    if (diffDays > 60) return 100;
    return (diffDays / 60) * 100;
  };
  const targetHarian = getTargetHarian();

  // 🌟 MESIN PENGURUT DATA
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

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig?.key !== columnName) return <ArrowUpDown size={14} className="opacity-30 inline-block ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-400 inline-block ml-1" /> : <ArrowDown size={14} className="text-blue-400 inline-block ml-1" />;
  };

  const formatLengkapWaktu = (timestampRaw) => {
    if (!timestampRaw || timestampRaw === "-") return "-";
    try {
      const dateObj = new Date(timestampRaw);
      if (isNaN(dateObj.getTime())) return timestampRaw;
      return new Intl.DateTimeFormat('id-ID', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(dateObj);
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
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <span className="text-sm font-semibold text-slate-400">Total: <strong className="text-white font-bold">{dataPetugas?.length || 0}</strong> petugas terpantau</span>
        <button onClick={onExport} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-950/20 transition-all">
          <Download size={16} />
          <span>Unduh Excel</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <th className="p-4 w-10"></th>
            <th className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('nama')}>
              <div className="flex items-center">Nama Petugas {getSortIcon('nama')}</div>
            </th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('target')}>
              <div className="flex justify-center items-center">Beban Tugas {getSortIcon('target')}</div>
            </th>
            <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-900/20 transition-colors" onClick={() => requestSort('status_approved')}>
              <div className="flex items-center justify-center">Appv {getSortIcon('status_approved')}</div>
            </th>
            <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-900/20 transition-colors" onClick={() => requestSort('status_submitted')}>
              <div className="flex items-center justify-center">Subm {getSortIcon('status_submitted')}</div>
            </th>
            <th className="p-4 text-center text-slate-400 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('status_draft')}>
              <div className="flex items-center justify-center">Draft {getSortIcon('status_draft')}</div>
            </th>
            <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-900/20 transition-colors" onClick={() => requestSort('status_rejected')}>
              <div className="flex items-center justify-center">Rejc {getSortIcon('status_rejected')}</div>
            </th>
            <th className="p-4 text-center text-teal-400 cursor-pointer hover:bg-teal-900/20 transition-colors" title="Target yg harus dikerjakan per hari (Open+Draft / Sisa Hari)">
              <div className="flex items-center justify-center">Tgt Harian</div>
            </th>
            <th className="p-4 w-1/4 cursor-pointer hover:bg-slate-800/50 transition-colors text-center" onClick={() => requestSort('progres_persen')}>
              <div className="flex items-center justify-center">Capaian Kinerja Total {getSortIcon('progres_persen')}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-slate-300">
          {sortedDataPetugas.map((item, idx) => {
            const isExpanded = expandedRow === item.email;
            
            const target = item.target || 0;
            const alokator = item.alokator || 0;
            const approved = item.status_approved || 0;
            const submitted = item.status_submitted || 0;
            const draft = item.status_draft || 0;
            const open = item.status_open || 0;
            const rejected = item.status_rejected || 0;
            
            const progresRiil = approved + submitted + rejected;
            const pTarget = target > 0 ? Math.round((progresRiil / target) * 100) : 0;
            const pAlokator = alokator > 0 ? Math.round((progresRiil / alokator) * 100) : 0;
            const isAman = pTarget >= targetHarian;

            const harusDikerjakanPerHari = Math.max(0, Math.ceil((alokator - progresRiil) / sisaHari));

            return (
              <React.Fragment key={idx}>
                {/* BARIS UTAMA */}
                <tr 
                  onClick={() => toggleRow(item.email)}
                  className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isAman ? 'bg-emerald-400' : 'bg-rose-500'}`}></span> 
                      {item.nama}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-1">{item.email} • {item.role}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                       <span className="text-[11px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20" title="Target Utama">
                         T: {target.toLocaleString('id-ID')}
                       </span>
                       <span className="text-[11px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20" title="Alokator">
                         A: {alokator.toLocaleString('id-ID')}
                       </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-emerald-400 font-bold">{approved.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-amber-400">{submitted.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-slate-300">{draft.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{rejected.toLocaleString('id-ID')}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-lg font-black font-mono text-teal-400 leading-none">{harusDikerjakanPerHari}</span>
                      <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">dok/hari</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 w-full max-w-[200px] mx-auto">
                      <div className="flex items-center gap-2" title={`Vs Target: ${pTarget}% | Target Hari Ini: ${targetHarian.toFixed(2)}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isAman ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(pTarget, 100)}%` }}></div>
                          <div className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" style={{ left: `${targetHarian}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${isAman ? 'text-blue-400' : 'text-rose-400'}`}>{pTarget}%</span>
                      </div>
                      <div className="flex items-center gap-2" title={`Vs Alokator: ${pAlokator}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(pAlokator, 100)}%` }}></div>
                          <div className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" style={{ left: `${targetHarian}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-purple-400 w-7 text-right">{pAlokator}%</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 🌟 SUB-BARIS AKORDEON */}
                {isExpanded && (
                  <tr className="bg-slate-900/80 border-l-2 border-indigo-500">
                    <td colSpan="9" className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-12 pr-4 py-2">
                        {/* KOLOM KIRI: TABEL DETAIL ASSIGNMENT */}
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2 mb-3">
                            <Map size={14} /> Detail Penugasan Region (SLS):
                          </h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-700/50 text-[10px] uppercase font-bold tracking-wider">
                                <th className="pb-2 text-left">Kode SLS & Waktu Sync</th>
                                <th className="pb-2 text-center">Beban</th>
                                <th className="pb-2 text-center text-emerald-400">Appv</th>
                                <th className="pb-2 text-center text-amber-400">Subm</th>
                                <th className="pb-2 text-center text-slate-300">Drft</th>
                                <th className="pb-2 text-center text-rose-400">Rejc</th>
                                <th className="pb-2 text-center w-32">Dual Progress</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.detail_assignment?.map((assign, i) => {
                                const assignTarget = assign.target || 0;
                                const assignAlokator = assign.alokator || 0;
                                const assignSelesai = (assign.status_approved || 0) + (assign.status_submitted || 0) + (assign.status_rejected || 0);
                                const pAssignTarget = assignTarget > 0 ? Math.round((assignSelesai / assignTarget) * 100) : 0;
                                const pAssignAlokator = assignAlokator > 0 ? Math.round((assignSelesai / assignAlokator) * 100) : 0;
                                const isAssignAman = pAssignTarget >= targetHarian;
                                
                                return(
                                <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/40">
                                  <td className="py-2 text-indigo-200 font-mono text-[11px] leading-tight">
                                    <span className="text-slate-400">{assign.assignment_code}</span> <br/>
                                    <span className="font-bold block mb-1.5">{assign.desa}</span>
                                    {assign.last_synced_at !== "-" ? (
                                      <span className="inline-flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-700 font-medium whitespace-nowrap" title="Bot Sync Terakhir">
                                        <Clock size={10} className="text-emerald-500" />
                                        {formatLengkapWaktu(assign.last_synced_at)}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-600">- Belum Sync</span>
                                    )}
                                  </td>
                                  
                                  <td className="py-2 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                      <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">T: {assignTarget.toLocaleString('id-ID')}</span>
                                      <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">A: {assignAlokator.toLocaleString('id-ID')}</span>
                                    </div>
                                  </td>

                                  <td className="py-2 text-center font-mono text-emerald-500/80">{assign.status_approved}</td>
                                  <td className="py-2 text-center font-mono text-amber-500/80">{assign.status_submitted}</td>
                                  <td className="py-2 text-center font-mono text-slate-300">{assign.status_draft}</td>
                                  <td className="py-2 text-center font-mono text-rose-500/80">{assign.status_rejected}</td>
                                  
                                  {/* 🌟 DUAL PROGRESS BAR UNTUK AKORDEON */}
                                  <td className="py-2 w-32">
                                    <div className="space-y-1.5">
                                      {/* Baris Target */}
                                      <div className="flex items-center gap-2" title={`Vs Target: ${pAssignTarget}%`}>
                                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                                          <div className={`absolute top-0 left-0 h-full rounded-full ${isAssignAman ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(pAssignTarget, 100)}%` }}></div>
                                        </div>
                                        <span className={`text-[9px] font-bold w-6 text-right ${isAssignAman ? 'text-blue-400' : 'text-rose-400'}`}>{pAssignTarget}%</span>
                                      </div>
                                      {/* Baris Alokator */}
                                      <div className="flex items-center gap-2" title={`Vs Alokator: ${pAssignAlokator}%`}>
                                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                                          <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(pAssignAlokator, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-purple-400 w-6 text-right">{pAssignAlokator}%</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        {/* CHART */}
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-4">
                            <TrendingUp size={14} /> Kecepatan Validasi Harian
                          </h4>
                          <div className="w-full h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartDataForPetugas(item.email)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={10} width={30} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Line type="monotone" dataKey="Approved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="Submitted" stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 4" dot={{ r: 2 }} />
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
  </div>
  );
}