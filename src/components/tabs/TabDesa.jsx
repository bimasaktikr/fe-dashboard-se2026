import React, { useState, useEffect } from 'react';
import { Map, Download, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TabDesa({ dataDesa, onExport }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [dataDesa]);

  if (!dataDesa || dataDesa.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 animate-in fade-in">
        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
          <AlertTriangle size={32} className="text-emerald-500/50" />
        </div>
        <p className="font-semibold text-emerald-400">Belum ada data desa yang termonitoring.</p>
      </div>
    );
  }

  const totalItems = dataDesa.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = dataDesa.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2.5 rounded-lg border border-blue-500/30">
            <Map className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Monitoring Progres Wilayah (Desa/Kelurahan)</h3>
            <p className="text-xs text-slate-400">Detail capaian absolut dan persentase berdasarkan 3 pilar target.</p>
          </div>
        </div>
        
        <button 
          onClick={onExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Download size={14} /> Export Excel
        </button>
      </div>

      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-t-xl border-t border-l border-r border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Tampilkan</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entri</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900/40 border border-slate-700/50 shadow-inner">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 w-12 text-center">No</th>
              <th className="p-4 w-[200px]">Kecamatan / Desa</th>
              <th className="p-4 text-center text-teal-400" title="Target Prelist">Prelist</th>
              {/* 🌟 DIUBAH KE ASSIGNMENT */}
              <th className="p-4 text-center text-blue-400" title="Target Assignment">Assign</th>
              <th className="p-4 text-center text-purple-400" title="Target Alokator">Alokator</th>
              <th className="p-4 text-center text-emerald-400">Appv</th>
              <th className="p-4 text-center text-amber-400">Subm</th>
              <th className="p-4 text-center text-slate-300">Draft</th>
              <th className="p-4 text-center text-rose-400">Rejc</th>
              <th className="p-4 w-56 text-center">Triple Progress Capaian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-sm">
            {currentData.map((item, idx) => {
              const actualIndex = startIndex + idx + 1;
              const tPrelist = item.target_prelist || 0;
              const tUsaha = item.target || 0;
              const tAlokator = item.alokator || 0;
              
              const approved = item.status_approved || 0;
              const submitted = item.status_submitted || 0;
              const open = item.status_open || 0;
              const draft = item.status_draft || 0;
              const rejected = item.status_rejected || 0;
              
              const totalRiil = Math.max(0, tUsaha - open - draft);

              const pPrelist = tPrelist > 0 ? ((totalRiil / tPrelist) * 100) : 0;
              const pUsaha = tUsaha > 0 ? ((totalRiil / tUsaha) * 100) : 0;
              const pAlokator = tAlokator > 0 ? ((totalRiil / tAlokator) * 100) : 0;

              return (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-center text-slate-500 font-mono text-xs">{actualIndex}</td>
                  <td className="p-4">
                    <div className="font-bold text-white leading-tight text-sm truncate max-w-[180px]" title={item.desa}>
                      {item.desa || '-'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                      {item.kecamatan || '-'}
                    </div>
                  </td>
                  
                  <td className="p-4 text-center font-black font-mono text-teal-400">{tPrelist.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-black font-mono text-blue-400">{tUsaha.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-black font-mono text-purple-400">{tAlokator.toLocaleString('id-ID')}</td>
                  
                  <td className="p-4 text-center font-bold font-mono text-emerald-400">{approved.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-semibold font-mono text-amber-400">{submitted.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-slate-300">{draft.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{rejected.toLocaleString('id-ID')}</td>
                  
                  <td className="p-4">
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-2" title={`Vs Target Prelist: ${pPrelist.toFixed(2)}%`}>
                        <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Prelist</span>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className="absolute top-0 left-0 h-full rounded-full bg-teal-500" style={{ width: `${Math.min(pPrelist, 100)}%` }}></div>
                        </div>
                        <span className={`text-[9px] font-bold w-7 text-right ${pPrelist < 60 ? 'text-rose-400' : 'text-teal-400'}`}>
                          {pPrelist.toFixed(0)}%
                        </span>
                      </div>

                      {/* 🌟 DIUBAH KE ASSIGNMENT */}
                      <div className="flex items-center gap-2" title={`Vs Target Assignment: ${pUsaha.toFixed(2)}%`}>
                        <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Assign</span>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className="absolute top-0 left-0 h-full rounded-full bg-blue-500" style={{ width: `${Math.min(pUsaha, 100)}%` }}></div>
                        </div>
                        <span className={`text-[9px] font-bold w-7 text-right ${pUsaha < 60 ? 'text-rose-400' : 'text-blue-400'}`}>
                          {pUsaha.toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2" title={`Vs Target Alokator: ${pAlokator.toFixed(2)}%`}>
                        <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Alokatr</span>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className="absolute top-0 left-0 h-full rounded-full bg-purple-500" style={{ width: `${Math.min(pAlokator, 100)}%` }}></div>
                        </div>
                        <span className={`text-[9px] font-bold w-7 text-right ${pAlokator < 60 ? 'text-rose-400' : 'text-purple-400'}`}>
                          {pAlokator.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-b-xl border-b border-l border-r border-slate-700/50 mt-2">
        <div className="text-xs text-slate-400 font-medium">
          Menampilkan <span className="text-white font-bold">{totalItems > 0 ? startIndex + 1 : 0}</span> hingga <span className="text-white font-bold">{endIndex}</span> dari <span className="text-white font-bold">{totalItems}</span> entri
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          
          <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {currentPage} / {totalPages || 1}
          </div>

          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}