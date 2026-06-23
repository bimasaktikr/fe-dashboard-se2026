import React, { useState, useMemo } from 'react';
import { AlertTriangle, Filter, AlertOctagon, FileWarning, UserX, MapPin } from 'lucide-react';

export default function TabAnomali({ dataPetugas }) {
  const [filterAktif, setFilterAktif] = useState('under_50');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');

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
  
  // 🌟 AMBANG BATAS ANOMALI: 50% dari Target Harian
  const batasAnomaliHarian = targetHarian * 0.5; 

  // MESIN GROUPING: MENGGULUNG DATA FLAT MENJADI "PER PETUGAS"
  const groupedPetugas = useMemo(() => {
    if (!dataPetugas) return [];
    const map = {};
    dataPetugas.forEach(item => {
      const email = item.email;
      if (!map[email]) {
        map[email] = {
          nama: item.nama, email: item.email, role: item.role,
          kecamatans: new Set(), desas: new Set(),
          target: 0, status_approved: 0, status_submitted: 0, status_draft: 0, status_rejected: 0, status_open: 0
        };
      }
      if (item.kecamatan) map[email].kecamatans.add(item.kecamatan);
      if (item.desa) map[email].desas.add(item.desa);

      map[email].target += Number(item.target || item.target_usaha || 0);
      map[email].status_approved += Number(item.status_approved || 0);
      map[email].status_submitted += Number(item.status_submitted || 0);
      map[email].status_draft += Number(item.status_draft || 0);
      map[email].status_rejected += Number(item.status_rejected || 0);
      map[email].status_open += Number(item.status_open || 0);
    });

    return Object.values(map).map(p => {
      const totalRiil = p.status_approved + p.status_submitted;
      return {
        ...p,
        kecamatanStr: Array.from(p.kecamatans).join(', '),
        desaStr: Array.from(p.desas).join(', '),
        progres_persen: p.target > 0 ? Number((totalRiil / p.target * 100).toFixed(2)) : 0
      };
    });
  }, [dataPetugas]);

  // EKSTRAKSI DROPDOWN WILAYAH
  const listKecamatan = useMemo(() => {
    if (!dataPetugas) return [];
    return [...new Set(dataPetugas.map(item => item.kecamatan).filter(Boolean))].sort();
  }, [dataPetugas]);

  const listDesa = useMemo(() => {
    if (!dataPetugas || !selectedKecamatan) return [];
    const desas = dataPetugas.filter(item => item.kecamatan === selectedKecamatan).map(item => item.desa);
    return [...new Set(desas.filter(Boolean))].sort();
  }, [dataPetugas, selectedKecamatan]);

  // MESIN FILTER ANOMALI
  const dataAnomaliFiltered = useMemo(() => {
    let hasilSaringan = groupedPetugas; 

    switch (filterAktif) {
      case 'under_50':
        // 🌟 KUNCI PERUBAHAN: Bandingkan dengan separuh dari target hari ini
        hasilSaringan = hasilSaringan.filter(item => item.progres_persen < batasAnomaliHarian);
        break;
      case 'high_draft':
        hasilSaringan = hasilSaringan.filter(item => item.status_draft > item.status_submitted);
        break;
      case 'high_reject':
        hasilSaringan = hasilSaringan.filter(item => item.status_rejected > 0);
        break;
      default:
        break;
    }

    if (selectedKecamatan) hasilSaringan = hasilSaringan.filter(item => item.kecamatans.has(selectedKecamatan));
    if (selectedDesa) hasilSaringan = hasilSaringan.filter(item => item.desas.has(selectedDesa));

    return hasilSaringan.sort((a, b) => a.progres_persen - b.progres_persen);
  }, [groupedPetugas, filterAktif, selectedKecamatan, selectedDesa, batasAnomaliHarian]);

  return (
    <div className="space-y-6">
      {/* 🌟 PANEL KENDALI FILTER */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
        
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 p-2 rounded-lg">
              <UserX size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Radar Kinerja Petugas</h3>
              <p className="text-xs text-slate-400">Deteksi mitra lapangan terindikasi bermasalah.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterAktif('under_50')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                filterAktif === 'under_50' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {/* Teks dinamis agar pengguna tahu berapa batas anomalinya hari ini */}
              <AlertTriangle size={14} /> Progres &lt; {batasAnomaliHarian.toFixed(1)}% (Batas Hari Ini)
            </button>
            <button 
              onClick={() => setFilterAktif('high_draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                filterAktif === 'high_draft' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <FileWarning size={14} /> Draft Menumpuk
            </button>
            <button 
              onClick={() => setFilterAktif('high_reject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                filterAktif === 'high_reject' ? 'bg-purple-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <AlertOctagon size={14} /> Terdeteksi Reject
            </button>
          </div>
        </div>

        {/* Dropdown Filter Wilayah */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter size={14} className="text-indigo-400" /> Filter Teritorial:
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[180px]">
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedKecamatan}
              onChange={(e) => { setSelectedKecamatan(e.target.value); setSelectedDesa(''); }}
              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer"
            >
              <option value="" className="bg-slate-900">-- Semua Kecamatan --</option>
              {listKecamatan.map((kec, i) => (
                <option key={i} value={kec} className="bg-slate-900">{kec}</option>
              ))}
            </select>
          </div>

          <div className={`flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[180px] transition-opacity ${!selectedKecamatan ? 'opacity-40' : 'opacity-100'}`}>
            <MapPin size={14} className="text-slate-500" />
            <select
              value={selectedDesa}
              disabled={!selectedKecamatan}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900">-- Semua Kelurahan --</option>
              {listDesa.map((desa, i) => (
                <option key={i} value={desa} className="bg-slate-900">{desa}</option>
              ))}
            </select>
          </div>

          {(selectedKecamatan || selectedDesa) && (
            <button onClick={() => { setSelectedKecamatan(''); setSelectedDesa(''); }} className="text-xs font-semibold text-slate-400 hover:text-white underline transition-colors">
              Reset Wilayah
            </button>
          )}
        </div>
      </div>

      {/* 🌟 BANNER HASIL */}
      <div className="bg-slate-800/50 border-l-4 border-rose-500 p-4 rounded-r-xl flex justify-between items-center">
        <div>
          <h4 className="text-rose-400 font-bold text-sm">Hasil Scan Lapangan:</h4>
          <p className="text-slate-300 text-xs mt-1">
            Terdeteksi <span className="font-bold text-white text-base font-mono">{dataAnomaliFiltered.length}</span> petugas bermasalah pada filter ini.
          </p>
        </div>
      </div>

      {/* 🌟 TABEL DATA PETUGAS ANOMALI */}
      <div className="overflow-x-auto bg-slate-900/40 rounded-xl border border-slate-700/50">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 w-[250px]">Identitas Petugas</th>
              <th className="p-4">Kec. / Desa Tugas</th>
              <th className="p-4 text-center">Beban Target</th>
              <th className="p-4 text-center text-emerald-400">Approved</th>
              <th className="p-4 text-center text-amber-400">Submitted</th>
              <th className="p-4 text-center text-slate-300 bg-slate-800/30">Draft</th>
              <th className="p-4 text-center text-rose-400 bg-rose-950/20">Rejected</th>
              <th className="p-4 text-center">Progres Riil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-sm">
            {dataAnomaliFiltered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-slate-800/50 p-4 rounded-full mb-3">
                      <AlertTriangle size={32} className="text-emerald-500/50" />
                    </div>
                    <span className="font-semibold text-emerald-400">Aman & Terkendali, Komandan!</span>
                    <span className="text-xs mt-1">Tidak ditemukan petugas dengan parameter anomali di wilayah ini.</span>
                  </div>
                </td>
              </tr>
            ) : (
              dataAnomaliFiltered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white leading-tight">{item.nama}</div>
                    <div className="text-xs font-mono text-slate-400 mt-1">{item.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-300 leading-tight">{item.kecamatanStr}</div>
                    <div className="text-[11px] text-slate-400 mt-1 uppercase max-w-[200px] truncate" title={item.desaStr}>{item.desaStr}</div>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-300">{item.target?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-bold font-mono text-emerald-400">{item.status_approved?.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center font-semibold font-mono text-amber-400">{item.status_submitted?.toLocaleString('id-ID')}</td>
                  <td className={`p-4 text-center font-mono font-bold ${filterAktif === 'high_draft' ? 'text-amber-500 bg-amber-950/30' : 'text-slate-300'}`}>
                    {item.status_draft?.toLocaleString('id-ID')}
                  </td>
                  <td className={`p-4 text-center font-mono font-bold ${filterAktif === 'high_reject' ? 'text-rose-500 bg-rose-950/30' : 'text-rose-400'}`}>
                    {item.status_rejected?.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold font-mono px-2 py-1 rounded ${filterAktif === 'under_50' ? 'bg-rose-950/50 text-rose-400' : 'bg-slate-800 text-blue-400'}`}>
                      {item.progres_persen}%
                    </span>
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