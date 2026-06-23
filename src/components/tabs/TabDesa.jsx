import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TabDesa({ dataDesa }) {
  // 🌟 State Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'progres_persen', direction: 'desc' });

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
  const sortedDataDesa = useMemo(() => {
    let items = [...(dataDesa || [])];
    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key] || 0;
        let bVal = b[sortConfig.key] || 0;
        
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    return items;
  }, [dataDesa, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="opacity-30 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-400 inline" /> : <ArrowDown size={12} className="text-blue-400 inline" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
            <th className="p-4 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('kecamatan')}>Kecamatan {getSortIcon('kecamatan')}</th>
            <th className="p-4 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('desa')}>Desa {getSortIcon('desa')}</th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800" onClick={() => requestSort('target')}>Target {getSortIcon('target')}</th>
            <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-950/20" onClick={() => requestSort('status_approved')}>Approved {getSortIcon('status_approved')}</th>
            <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-950/20" onClick={() => requestSort('status_submitted')}>Submitted {getSortIcon('status_submitted')}</th>
            <th className="p-4 text-center text-slate-300">Draft</th>
            <th className="p-4 text-center text-rose-400">Rejected</th>
            <th className="p-4 text-center text-slate-400">Open</th>
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800" onClick={() => requestSort('progres_persen')}>Progres Riil {getSortIcon('progres_persen')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40 text-sm">
          {sortedDataDesa.map((item, idx) => {
            const progres = item.progres_persen || 0;
            const isAman = progres >= targetHarian;

            return (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300">{item.kecamatan}</td>
                <td className="p-4 font-bold text-white">{item.desa}</td>
                <td className="p-4 text-center font-mono text-slate-300">{item.target?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-bold font-mono text-emerald-400">{item.status_approved?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-semibold font-mono text-amber-400">{item.status_submitted?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-mono text-slate-300">{item.status_draft?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-medium font-mono text-rose-400">{item.status_rejected?.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center font-mono text-slate-400">{item.status_open?.toLocaleString('id-ID')}</td>
                
                {/* 🌟 KOLOM PROGRES RIIL DENGAN VISUALISASI TARGET HARIAN */}
                <td className="p-4">
                  <div className="flex flex-col gap-1.5" title={`Target Hari Ini: ${targetHarian.toFixed(2)}%`}>
                    <div className="flex justify-between items-end">
                      <span className={`text-sm font-bold font-mono ${isAman ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {progres}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Tgt: {targetHarian.toFixed(1)}%</span>
                    </div>
                    
                    <div className="relative w-full bg-slate-700 h-2 rounded-full overflow-hidden border border-slate-600">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isAman ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min(progres, 100)}%` }}
                      ></div>
                      {/* Garis Merah Penanda Target */}
                      <div 
                        className="absolute top-0 h-full border-r-[2px] border-rose-500 z-10"
                        style={{ left: `${targetHarian}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}