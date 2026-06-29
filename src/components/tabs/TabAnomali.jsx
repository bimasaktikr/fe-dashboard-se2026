import React, { useState, useMemo } from 'react';
import { AlertTriangle, Filter, UserX, MapPin, Target } from 'lucide-react';

export default function TabAnomali({ dataPetugas }) {
  // 🌟 STATE BARU: Acuan Anomali
  const [acuanAnomali, setAcuanAnomali] = useState('target'); // 'target' atau 'alokator'
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');

  // 🌟 KALKULATOR TARGET HARIAN DINAMIS
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
  const batasAnomaliHarian = targetHarian * 0.5; 

  // MESIN GROUPING
  const groupedPetugas = useMemo(() => {
    if (!dataPetugas) return [];
    const map = {};
    dataPetugas.forEach(item => {
      const email = item.email;
      if (!map[email]) {
        map[email] = {
          nama: item.nama, email: item.email, role: item.role,
          kecamatans: new Set(), desas: new Set(),
          target: 0, alokator: 0,
          status_approved: 0, status_submitted: 0, status_draft: 0, status_rejected: 0
        };
      }
      if (item.kecamatan) map[email].kecamatans.add(item.kecamatan);
      if (item.desa) map[email].desas.add(item.desa);

      map[email].target += Number(item.target || item.target_usaha || 0);
      map[email].alokator += Number(item.alokator || 0);
      map[email].status_approved += Number(item.status_approved || 0);
      map[email].status_submitted += Number(item.status_submitted || 0);
      map[email].status_draft += Number(item.status_draft || 0);
      map[email].status_rejected += Number(item.status_rejected || 0);
    });

    return Object.values(map).map(p => {
      const totalRiil = p.status_approved + p.status_submitted + p.status_rejected;
      return {
        ...p,
        kecamatanStr: Array.from(p.kecamatans).join(', '),
        desaStr: Array.from(p.desas).join(', '),
        progres_target: p.target > 0 ? Math.round((totalRiil / p.target) * 100) : 0,
        progres_alokator: p.alokator > 0 ? Math.round((totalRiil / p.alokator) * 100) : 0
      };
    });
  }, [dataPetugas]);

  // DROPDOWN WILAYAH
  const listKecamatan = useMemo(() => {
    if (!dataPetugas) return [];
    return [...new Set(dataPetugas.map(item => item.kecamatan).filter(Boolean))].sort();
  }, [dataPetugas]);

  const listDesa = useMemo(() => {
    if (!dataPetugas || !selectedKecamatan) return [];
    const desas = dataPetugas.filter(item => item.kecamatan === selectedKecamatan).map(item => item.desa);
    return [...new Set(desas.filter(Boolean))].sort();
  }, [dataPetugas, selectedKecamatan]);

  // 🌟 MESIN FILTER ANOMALI (Berdasarkan Dropdown)
  const dataAnomaliFiltered = useMemo(() => {
    let hasilSaringan = groupedPetugas; 

    // Saring berdasarkan batas harian (dibawah 50%) menggunakan acuan yang dipilih
    if (acuanAnomali === 'target') {
      hasilSaringan = hasilSaringan.filter(item => item.progres_target < batasAnomaliHarian);
    } else {
      hasilSaringan = hasilSaringan.filter(item => item.progres_alokator < batasAnomaliHarian);
    }

    if (selectedKecamatan) hasilSaringan = hasilSaringan.filter(item => item.kecamatans.has(selectedKecamatan));
    if (selectedDesa) hasilSaringan = hasilSaringan.filter(item => item.desas.has(selectedDesa));

    // Urutkan dari yang terburuk
    return hasilSaringan.sort((a, b) => {
      if (acuanAnomali === 'target') return a.progres_target - b.progres_target;
      return a.progres_alokator - b.progres_alokator;
    });
  }, [groupedPetugas, acuanAnomali, selectedKecamatan, selectedDesa, batasAnomaliHarian]);

  return (
    <div className="space-y-6">
      {/* 🌟 PANEL KENDALI BARU */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-6 justify-between items-center">
        
        {/* Kiri: Header */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 p-2 rounded-lg">
            <UserX size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Radar Anomali</h3>
            <p className="text-[11px] text-slate-400">Petugas dengan progres di bawah <strong className="text-rose-400">{batasAnomaliHarian.toFixed(1)}%</strong></p>
          </div>
        </div>

        {/* Kanan: Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* 🌟 DROPDOWN ACUAN ANOMALI */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-rose-900/50 shadow-inner">
             <Target size={14} className="text-rose-400" />
             <span className="text-[10px] uppercase font-bold text-slate-400">Acuan:</span>
             <select
                value={acuanAnomali}
                onChange={(e) => setAcuanAnomali(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
             >
                <option value="target" className="bg-slate-900 text-blue-400">Di Bawah Target Utama</option>
                <option value="alokator" className="bg-slate-900 text-purple-400">Di Bawah Alokator</option>
             </select>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

          {/* DROPDOWN KECAMATAN */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedKecamatan}
              onChange={(e) => { setSelectedKecamatan(e.target.value); setSelectedDesa(''); }}
              className="bg-transparent text-xs text-white focus:outline-none w-32 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">Semua Kec.</option>
              {listKecamatan.map((kec, i) => (
                <option key={i} value={kec} className="bg-slate-900">{kec}</option>
              ))}
            </select>
          </div>

          {/* DROPDOWN DESA */}
          <div className={`flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 transition-opacity ${!selectedKecamatan ? 'opacity-40' : 'opacity-100'}`}>
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedDesa}
              disabled={!selectedKecamatan}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-32 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900 text-slate-400">Semua Kel.</option>
              {listDesa.map((desa, i) => (
                <option key={i} value={desa} className="bg-slate-900">{desa}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* BANNER HASIL */}
      <div className="bg-slate-800/50 border-l-4 border-rose-500 p-4 rounded-r-xl flex justify-between items-center">
        <div>
          <h4 className="text-rose-400 font-bold text-sm">Hasil Scan Lapangan:</h4>
          <p className="text-slate-300 text-xs mt-1">
            Terdeteksi <span className="font-bold text-white text-base font-mono">{dataAnomaliFiltered.length}</span> petugas bermasalah.
          </p>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="overflow-x-auto bg-slate-900/40 rounded-xl border border-slate-700/50">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 w-[250px]">Identitas Petugas</th>
              <th className="p-4">Wilayah Tugas</th>
              <th className="p-4 text-center text-blue-400">Target</th>
              <th className="p-4 text-center text-purple-400">Alokator</th>
              <th className="p-4 text-center text-emerald-400">Appv</th>
              <th className="p-4 text-center text-amber-400">Subm</th>
              <th className="p-4 text-center text-slate-300">Draft</th>
              <th className="p-4 text-center text-rose-400">Rejc</th>
              <th className="p-4 w-48 text-center">Dual Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-sm">
            {dataAnomaliFiltered.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center p-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-slate-800/50 p-4 rounded-full mb-3">
                      <AlertTriangle size={32} className="text-emerald-500/50" />
                    </div>
                    <span className="font-semibold text-emerald-400">Aman & Terkendali, Komandan!</span>
                  </div>
                </td>
              </tr>
            ) : (
              dataAnomaliFiltered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white leading-tight">{item.nama}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{item.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-300 leading-tight text-xs">{item.kecamatanStr}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase max-w-[150px] truncate" title={item.desaStr}>{item.desaStr}</div>
                  </td>
                  <td className="p-4 text-center font-black font-mono text-blue-400">{item.target?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-black font-mono text-purple-400">{item.alokator?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-bold font-mono text-emerald-400">{item.status_approved?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-semibold font-mono text-amber-400">{item.status_submitted?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-slate-300">{item.status_draft?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-mono text-rose-400">{item.status_rejected?.toLocaleString('id-ID')}</td>
                  
                  <td className="p-4">
                    <div className="space-y-2 w-full">
                      {/* Baris Target */}
                      <div className="flex items-center gap-2" title={`Vs Target: ${item.progres_target}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`absolute top-0 left-0 h-full rounded-full ${item.progres_target < batasAnomaliHarian ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(item.progres_target, 100)}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${item.progres_target < batasAnomaliHarian ? 'text-rose-400' : 'text-blue-400'}`}>{item.progres_target}%</span>
                      </div>
                      {/* Baris Alokator */}
                      <div className="flex items-center gap-2" title={`Vs Alokator: ${item.progres_alokator}%`}>
                        <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`absolute top-0 left-0 h-full rounded-full ${item.progres_alokator < batasAnomaliHarian ? 'bg-rose-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(item.progres_alokator, 100)}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${item.progres_alokator < batasAnomaliHarian ? 'text-rose-400' : 'text-purple-400'}`}>{item.progres_alokator}%</span>
                      </div>
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