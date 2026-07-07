import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TabDesa({ dataDesa }) {
  // 🌟 State Sorting (Default urutkan berdasarkan Capaian vs Target Utama)
  const [sortConfig, setSortConfig] = useState({ key: 'progres_target', direction: 'desc' });

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
            <th className="p-4 text-center text-slate-300">Draft</th>
            <th className="p-4 text-center text-rose-400">Rejected</th>
            <th className="p-4 text-center text-slate-500">Open</th>
            
            <th className="p-4 text-center cursor-pointer hover:bg-slate-800 w-56" onClick={() => requestSort('progres_target')}>
              Dual Progress {getSortIcon('progres_target')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40 text-sm">
          {sortedDataDesa.map((item, idx) => {
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
  );
}