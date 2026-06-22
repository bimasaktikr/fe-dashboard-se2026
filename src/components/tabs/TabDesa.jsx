import React from 'react';

export default function TabDesa({ dataDesa }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
            <th className="p-4">Kecamatan</th>
            <th className="p-4">Kelurahan / Desa</th>
            <th className="p-4 text-center">Target</th>
            <th className="p-4 text-center text-emerald-400 bg-emerald-950/20">Approved</th>
            <th className="p-4 text-center text-amber-400 bg-amber-950/20">Submitted</th>
            <th className="p-4 text-center text-slate-300">Draft</th>
            <th className="p-4 text-center text-rose-400 bg-rose-950/20">Rejected</th>
            <th className="p-4 text-center text-slate-400">Open</th>
            <th className="p-4 text-center">Progres Riil</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40 text-sm">
          {dataDesa.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center p-8 text-slate-500 font-medium">
                Tidak ada data wilayah yang sesuai filter.
              </td>
            </tr>
          ) : (
            dataDesa.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300">{item.kecamatan}</td>
                <td className="p-4 font-bold text-white">{item.desa}</td>
                <td className="p-4 text-center font-mono text-slate-300">{item.target?.toLocaleString('id-ID') || 0}</td>
                
                {/* 🌟 MERENDER KOLOM METRIK BARU */}
                <td className="p-4 text-center font-bold font-mono text-emerald-400 bg-emerald-950/5">
                  {item.status_approved?.toLocaleString('id-ID') || 0}
                </td>
                <td className="p-4 text-center font-semibold font-mono text-amber-400 bg-amber-950/5">
                  {item.status_submitted?.toLocaleString('id-ID') || 0}
                </td>
                <td className="p-4 text-center font-mono text-slate-300">
                  {item.status_draft?.toLocaleString('id-ID') || 0}
                </td>
                <td className="p-4 text-center font-medium font-mono text-rose-400 bg-rose-950/5">
                  {item.status_rejected?.toLocaleString('id-ID') || 0}
                </td>
                <td className="p-4 text-center font-mono text-slate-400">
                  {item.status_open?.toLocaleString('id-ID') || 0}
                </td>
                
                {/* PERSENTASE PROGRES RIIL (Approved + Submitted vs Target) */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold text-blue-400 font-mono">{item.progres_persen || item.progres_dropdown || 0}%</span>
                    <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${Math.min(item.progres_persen || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}