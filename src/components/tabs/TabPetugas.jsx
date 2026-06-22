import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Map, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TabPetugas({ dataPetugas, dataTimeline }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (email) => {
    setExpandedRow(expandedRow === email ? null : email);
  };

  // Fungsi utilitas untuk memformat timestamp mentah database menjadi Tanggal & Waktu Lengkap Indonesia
  const formatLengkapWaktu = (timestampRaw) => {
    if (!timestampRaw || timestampRaw === "-") return "-";
    try {
      const dateObj = new Date(timestampRaw);
      // Validasi jika format tanggal tidak valid
      if (isNaN(dateObj.getTime())) return timestampRaw;

      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(dateObj) + ' WIB';
    } catch (e) {
      return timestampRaw;
    }
  };

  // Fungsi dinamis untuk membuat grafik khusus petugas yang sedang di-klik
  const getChartDataForPetugas = (email) => {
    if (!dataTimeline) return [];
    
    const filtered = dataTimeline.filter(d => d.email_petugas === email);
    
    const grouped = {};
    filtered.forEach(d => {
      if (!grouped[d.tanggal]) {
        grouped[d.tanggal] = { 
          tanggal: d.tanggal, 
          Approved: 0, 
          Submitted: 0, 
          Draft: 0, 
          Rejected: 0, 
          Open: 0 
        };
      }
      grouped[d.tanggal].Approved += d.status_approved || 0;
      grouped[d.tanggal].Submitted += d.status_submitted || 0;
      grouped[d.tanggal].Draft += d.status_draft || 0;
      grouped[d.tanggal].Rejected += d.status_rejected || 0;
      grouped[d.tanggal].Open += d.status_open || 0;
    });

    return Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase font-semibold">
            <th className="p-4 w-10"></th>
            <th className="p-4">Nama Petugas</th>
            <th className="p-4 text-center">Beban Target</th>
            <th className="p-4 text-center text-emerald-400">Approved</th>
            <th className="p-4 text-center text-amber-400">Submitted</th>
            <th className="p-4 text-center text-rose-400">Rejected</th>
            <th className="p-4 w-1/4">Capaian Kinerja Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-slate-300">
          {dataPetugas.map((item, idx) => {
            const isExpanded = expandedRow === item.email;
            return (
              <React.Fragment key={idx}>
                {/* BARIS UTAMA (BISA DI-KLIK) */}
                <tr 
                  onClick={() => toggleRow(item.email)}
                  className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span> {item.nama}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-1">{item.email} • {item.role}</div>
                  </td>
                  <td className="p-4 text-center font-mono">{item.target}</td>
                  <td className="p-4 text-center font-mono text-emerald-400 font-bold">{item.status_approved}</td>
                  <td className="p-4 text-center font-mono text-amber-400">{item.status_submitted}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{item.status_rejected}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-full bg-slate-700 rounded-full h-3.5 border border-slate-600 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.progres_persen}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-white font-mono w-12 text-right">{item.progres_persen}%</span>
                    </div>
                  </td>
                </tr>

                {/* SUB-BARIS AKORDEON */}
                {isExpanded && (
                  <tr className="bg-slate-900/80 border-l-2 border-indigo-500">
                    <td colSpan="7" className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-12 pr-4 py-2">
                        
                        {/* KOLOM KIRI: TABEL DETAIL ASSIGNMENT */}
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
                              {item.detail_assignment.map((assign, i) => (
                                <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/40">
                                  <td className="py-2 text-indigo-200 font-mono text-[11px] leading-tight">
                                    {assign.assignment_code} <br/>
                                    <span className="text-slate-500">{assign.desa}</span>
                                  </td>
                                  <td className="py-2 text-center font-mono text-slate-400">{assign.target}</td>
                                  <td className="py-2 text-center font-mono text-emerald-500/80">{assign.status_approved}</td>
                                  <td className="py-2 text-center font-mono text-amber-500/80">{assign.status_submitted}</td>
                                  <td className="py-2 text-center font-mono text-rose-500/80">{assign.status_rejected}</td>
                                  
                                  {/* 🌟 DETAIL FIX TANGGAL DAN WAKTU LENGKAP DI SINI 🌟 */}
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

                        {/* KOLOM KANAN: MINI CHART TREN HARIAN */}
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-4">
                            <TrendingUp size={14} /> Kecepatan Validasi Harian ({item.nama})
                          </h4>
                          <div className="w-full h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getChartDataForPetugas(item.email)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={10} width={30} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                  itemStyle={{ color: '#10b981' }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Approved" 
                                  stroke="#10b981" 
                                  strokeWidth={2} 
                                  dot={{ r: 3, fill: '#10b981' }} 
                                  name="Approved"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Submitted" 
                                  stroke="#fbbf24" 
                                  strokeWidth={2} 
                                  strokeDasharray="3 4"
                                  dot={{ r: 2, fill: '#fbbf24' }} 
                                  name="Submitted"
                                />
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