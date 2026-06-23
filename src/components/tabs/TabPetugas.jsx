import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Map, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TabPetugas({ dataPetugas, dataTimeline }) {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 🌟 STATE UNTUK SORTING (Default: Urutkan berdasarkan progres terbesar)
  const [sortConfig, setSortConfig] = useState({ key: 'progres_persen', direction: 'desc' });

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
        // Ambil nilai, handle undefined/null
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Jika tipe datanya string (seperti Nama Petugas), gunakan localeCompare
        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        // Jika angka (seperti Target, Approved, Progres)
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
    let direction = 'desc'; // Default klik pertama selalu dari yang terbesar (desc)
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'; // Jika diklik lagi, balik jadi dari yang terkecil (asc)
    }
    setSortConfig({ key, direction });
  };

  // Fungsi utilitas render Ikon Sorting
  const getSortIcon = (columnName) => {
    if (sortConfig?.key !== columnName) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />;
  };

  // Format Waktu
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

  // Data Chart
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
          <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase font-semibold">
            <th className="p-4 w-10"></th>
            <th className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('nama')}>
              <div className="flex items-center gap-2">Nama Petugas {getSortIcon('nama')}</div>
            </th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('target')}>
              <div className="flex items-center justify-center gap-2">Beban Target {getSortIcon('target')}</div>
            </th>
            <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-900/20 transition-colors" onClick={() => requestSort('status_approved')}>
              <div className="flex items-center justify-center gap-2">Approved {getSortIcon('status_approved')}</div>
            </th>
            <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-900/20 transition-colors" onClick={() => requestSort('status_submitted')}>
              <div className="flex items-center justify-center gap-2">Submitted {getSortIcon('status_submitted')}</div>
            </th>
            <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-900/20 transition-colors" onClick={() => requestSort('status_rejected')}>
              <div className="flex items-center justify-center gap-2">Rejected {getSortIcon('status_rejected')}</div>
            </th>
            <th className="p-4 w-1/4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('progres_persen')}>
              <div className="flex items-center gap-2">Capaian Kinerja Total {getSortIcon('progres_persen')}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-slate-300">
          {/* 🌟 Gunakan sortedDataPetugas di sini, BUKAN dataPetugas mentah */}
          {sortedDataPetugas.map((item, idx) => {
            const isExpanded = expandedRow === item.email;
            const progres = item.progres_persen || 0;
            const isAman = progres >= targetHarian;

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
                  <td className="p-4 text-center font-mono">{item.target}</td>
                  <td className="p-4 text-center font-mono text-emerald-400 font-bold">{item.status_approved}</td>
                  <td className="p-4 text-center font-mono text-amber-400">{item.status_submitted}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{item.status_rejected}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5" title={`Target Hari Ini: ${targetHarian.toFixed(2)}%`}>
                      <div className="flex justify-between items-end">
                        <span className={`text-sm font-bold font-mono ${isAman ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {progres}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Target: {targetHarian.toFixed(1)}%</span>
                      </div>
                      <div className="relative w-full bg-slate-700 h-2.5 rounded-full overflow-hidden border border-slate-600">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isAman ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(progres, 100)}%` }}
                        ></div>
                        <div 
                          className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10"
                          style={{ left: `${targetHarian}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* SUB-BARIS AKORDEON (Tetap sama seperti sebelumnya) */}
                {isExpanded && (
                  <tr className="bg-slate-900/80 border-l-2 border-indigo-500">
                    <td colSpan="7" className="p-4">
                      {/* ... (Konten detail assignment & grafik sama seperti sebelumnya) ... */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-12 pr-4 py-2">
                        {/* TABEL DETAIL */}
                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2 mb-3">
                            <Map size={14} /> Detail Penugasan Region (SLS):
                          </h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-700/50">
                                <th className="pb-2 text-left">Kode SLS</th>
                                <th className="pb-2 text-center">Target</th>
                                <th className="pb-2 text-center text-emerald-400">Appv</th>
                                <th className="pb-2 text-center text-amber-400">Subm</th>
                                <th className="pb-2 text-center text-rose-400">Rejc</th>
                                <th className="pb-2 text-right w-44">Bot Sync Terakhir</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.detail_assignment?.map((assign, i) => (
                                <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/40">
                                  <td className="py-2 text-indigo-200 font-mono text-[11px] leading-tight">
                                    {assign.assignment_code} <br/>
                                    <span className="text-slate-500">{assign.desa}</span>
                                  </td>
                                  <td className="py-2 text-center font-mono text-slate-400">{assign.target}</td>
                                  <td className="py-2 text-center font-mono text-emerald-500/80">{assign.status_approved}</td>
                                  <td className="py-2 text-center font-mono text-amber-500/80">{assign.status_submitted}</td>
                                  <td className="py-2 text-center font-mono text-rose-500/80">{assign.status_rejected}</td>
                                  <td className="py-2 text-right font-mono text-[11px] leading-relaxed">
                                    <span className="font-bold text-indigo-300 text-xs block mb-0.5">{assign.progres_lokal}%</span>
                                    {assign.last_synced_at !== "-" ? (
                                      <span className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-slate-700 font-medium whitespace-nowrap">
                                        <Clock size={10} className="text-emerald-500" />
                                        {formatLengkapWaktu(assign.last_synced_at)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-600 mr-2">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
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
  );
}