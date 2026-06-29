import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import DashboardCard from '../components/DashboardCard';
import { Users, Filter, Layers, TrendingUp, CheckCircle2, ArrowUpRight, FileText, AlertTriangle, Calendar, Database, Target, MessageSquare } from 'lucide-react';

import TabDesa from '../components/tabs/TabDesa';
import TabPetugas from '../components/tabs/TabPetugas';
import TabHarian from '../components/tabs/TabHarian';
import TabAnomali from '../components/tabs/TabAnomali';
import TabChatSQL from '../components/tabs/TabChatSQL';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('desa');
  const [dataDesa, setDataDesa] = useState([]);
  const [dataPetugas, setDataPetugas] = useState([]);
  const [dataTimeline, setDataTimeline] = useState([]); 

  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

  // ==========================================
  // 1. DATA FETCHING FROM GERBANG API
  // ==========================================
  useEffect(() => {
    Promise.all([
      axios.get(`${apiUrl}/api/v1/dashboard/summary`),
      axios.get(`${apiUrl}/api/v1/dashboard/petugas`),
      axios.get(`${apiUrl}/api/v1/dashboard/timeline`) 
    ])
    .then(([resDesa, resPetugas, resTimeline]) => {
      setDataDesa(resDesa.data.data);
      setDataPetugas(resPetugas.data.data);
      setDataTimeline(resTimeline.data.data);
    })
    .catch(err => console.error("Gagal koordinasi data dengan server:", err));
  }, [apiUrl]);

  // ==========================================
  // RENTANG WAKTU SYNC
  // ==========================================
  const syncRange = useMemo(() => {
    if (!dataPetugas || dataPetugas.length === 0) return { awal: '-', akhir: '-', single: true };
    const latestSyncTimesPerAssignment = dataPetugas
      .map(item => item.last_synced_at)
      .filter(tgl => tgl && tgl !== "-"); 

    if (latestSyncTimesPerAssignment.length === 0) return { awal: '-', akhir: '-', single: true };
    const sortedTimes = latestSyncTimesPerAssignment.sort();
    const terlamaRaw = sortedTimes[0]; 
    const terakhirRaw = sortedTimes[sortedTimes.length - 1]; 

    const formatHariBulanTahun = (dateTimeStr) => {
      try {
        const dateObj = new Date(dateTimeStr.replace(/-/g, '/')); 
        if (isNaN(dateObj.getTime())) {
          const tglOnly = dateTimeStr.split(' ')[0];
          const parts = tglOnly.split('-');
          if (parts.length === 3) return `${parseInt(parts[2], 10)} ${getNamaBulan(parts[1])} ${parts[0]}`;
          return dateTimeStr;
        }
        return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return dateTimeStr;
      }
    };

    function getNamaBulan(bulanStr) {
      const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return bulan[parseInt(bulanStr, 10) - 1] || "";
    }

    const awalFormatted = formatHariBulanTahun(terlamaRaw);
    const akhirFormatted = formatHariBulanTahun(terakhirRaw);

    if (awalFormatted === akhirFormatted) return { awal: awalFormatted, akhir: akhirFormatted, single: true };
    return { awal: awalFormatted, akhir: akhirFormatted, single: false };
  }, [dataPetugas]);

  // ==========================================
  // 2. LOGIKA GENERATE LIST EXTRACT FILTER
  // ==========================================
  const listKecamatan = useMemo(() => {
    const unik = new Set(dataDesa.map(item => item.kecamatan));
    return Array.from(unik).sort();
  }, [dataDesa]);

  const listKelurahan = useMemo(() => {
    if (!selectedKecamatan) return [];
    const filtered = dataDesa.filter(item => item.kecamatan === selectedKecamatan);
    const unik = new Set(filtered.map(item => item.desa));
    return Array.from(unik).sort();
  }, [dataDesa, selectedKecamatan]);

  const handleKecamatanChange = (e) => {
    setSelectedKecamatan(e.target.value);
    setSelectedKelurahan('');
  };

  // ==========================================
  // 3. REACTIVE FILTERING ENGINE (MENGARUH KE SEMUA TAB)
  // ==========================================
  const filteredDataDesa = useMemo(() => {
    return dataDesa.filter(item => {
      const matchKec = selectedKecamatan ? item.kecamatan === selectedKecamatan : true;
      const matchKel = selectedKelurahan ? item.desa === selectedKelurahan : true;
      return matchKec && matchKel;
    });
  }, [dataDesa, selectedKecamatan, selectedKelurahan]);

  const filteredDataPetugas = useMemo(() => {
    const filteredRaw = dataPetugas.filter(item => {
      const matchKec = selectedKecamatan ? item.kecamatan === selectedKecamatan : true;
      const matchKel = selectedKelurahan ? item.desa === selectedKelurahan : true;
      return matchKec && matchKel;
    });

    const aggregated = {};
    filteredRaw.forEach(item => {
      if (!aggregated[item.email]) {
        aggregated[item.email] = {
          nama: item.nama, email: item.email, role: item.role,
          target: 0, alokator: 0, // 🌟 BARU: ALOKATOR DITAMBAHKAN
          status_open: 0, status_draft: 0, status_submitted: 0, status_approved: 0, status_rejected: 0,
          detail_assignment: [] 
        };
      }
      aggregated[item.email].target += (item.target || 0);
      aggregated[item.email].alokator += (item.alokator || 0); // 🌟 BARU: AGREGASI ALOKATOR
      aggregated[item.email].status_open += item.status_open;
      aggregated[item.email].status_draft += item.status_draft;
      aggregated[item.email].status_submitted += item.status_submitted;
      aggregated[item.email].status_approved += item.status_approved;
      aggregated[item.email].status_rejected += item.status_rejected;
      
      const riilSelesaiLokal = item.status_approved + item.status_submitted + item.status_rejected;
      
      aggregated[item.email].detail_assignment.push({
        assignment_code: item.assignment_code,
        desa: item.desa,
        target: item.target,
        alokator: item.alokator || 0, // 🌟 BARU
        status_open: item.status_open,
        status_draft: item.status_draft,
        status_submitted: item.status_submitted,
        status_approved: item.status_approved,
        status_rejected: item.status_rejected,
        last_synced_at: item.last_synced_at,
        progres_target: item.target > 0 ? Number((riilSelesaiLokal / item.target * 100).toFixed(2)) : 0, // 🌟 BARU
        progres_alokator: item.alokator > 0 ? Number((riilSelesaiLokal / item.alokator * 100).toFixed(2)) : 0 // 🌟 BARU
      });
    });

    return Object.values(aggregated).map(p => {
      const totalRiilSelesai = p.status_approved + p.status_submitted + p.status_rejected;
      return {
        ...p,
        progres_target: p.target > 0 ? Number((totalRiilSelesai / p.target * 100).toFixed(2)) : 0,
        progres_alokator: p.alokator > 0 ? Number((totalRiilSelesai / p.alokator * 100).toFixed(2)) : 0
      };
    });
  }, [dataPetugas, selectedKecamatan, selectedKelurahan]);

  const chartDataHarian = useMemo(() => {
    const filteredTimeline = dataTimeline.filter(item => {
      const matchKec = selectedKecamatan ? item.kecamatan === selectedKecamatan : true;
      const matchKel = selectedKelurahan ? item.desa === selectedKelurahan : true;
      return matchKec && matchKel;
    });

    const groupByDate = {};
    filteredTimeline.forEach(item => {
      if (!groupByDate[item.tanggal]) {
        groupByDate[item.tanggal] = { 
          tanggal: item.tanggal, 
          Target: 0, Alokator: 0, Approved: 0, Submitted: 0, Draft: 0, Rejected: 0, Open: 0 
        };
      }
      groupByDate[item.tanggal].Target += (item.target || 0);
      groupByDate[item.tanggal].Alokator += (item.alokator || 0); // 🌟 BARU
      groupByDate[item.tanggal].Approved += item.status_approved;
      groupByDate[item.tanggal].Submitted += item.status_submitted;
      groupByDate[item.tanggal].Draft += item.status_draft;
      groupByDate[item.tanggal].Rejected += item.status_rejected;
      groupByDate[item.tanggal].Open += item.status_open;
    });

    return Object.values(groupByDate);
  }, [dataTimeline, selectedKecamatan, selectedKelurahan]);

  const globalStats = useMemo(() => {
    const target = filteredDataDesa.reduce((acc, curr) => acc + (curr.target || 0), 0);
    const alokator = filteredDataDesa.reduce((acc, curr) => acc + (curr.alokator || 0), 0); // 🌟 BARU
    const approved = filteredDataDesa.reduce((acc, curr) => acc + (curr.status_approved || 0), 0);
    const submitted = filteredDataDesa.reduce((acc, curr) => acc + (curr.status_submitted || 0), 0);
    const draft = filteredDataDesa.reduce((acc, curr) => acc + (curr.status_draft || 0), 0);
    const rejected = filteredDataDesa.reduce((acc, curr) => acc + (curr.status_rejected || 0), 0);
    const open = filteredDataDesa.reduce((acc, curr) => acc + (curr.status_open || 0), 0);
    return { target, alokator, approved, submitted, draft, rejected, open };
  }, [filteredDataDesa]);


  return (
    <div className="p-8 min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* HEADER COMMAND CENTER */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">COMMAND CENTER SE2026</h1>
          <p className="text-slate-400 mt-1">BPS Kota Malang — Sistem Monitoring Progress Unggulan</p>
        </div>
        
        <div className="text-xs text-slate-400 font-mono bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/80 flex items-center gap-2 shadow-inner">
            <Calendar size={14} className="text-blue-400" />
            <span>Rentang Monitoring:</span>
            {syncRange.awal === '-' ? (
              <span className="text-slate-500 italic">Menunggu sinkronisasi...</span>
            ) : syncRange.single ? (
              <span className="text-slate-200 font-bold">{syncRange.awal}</span>
            ) : (
              <>
                <span className="text-slate-200 font-bold">{syncRange.awal}</span>
                <span className="text-slate-600">—</span>
                <span className="text-slate-200 font-bold">{syncRange.akhir}</span>
              </>
            )}
          </div>
      </header> 

      {/* PANEL CONTROL FILTER */}
      <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-5 shadow-xl">
        <div className="flex items-center space-x-3 text-blue-400 font-bold text-sm tracking-wide shrink-0">
          <Filter size={18} />
          <span>FILTER MONITORING:</span>
        </div>
        <div className="w-full md:w-64">
          <select value={selectedKecamatan} onChange={handleKecamatanChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold">
            <option value="">-- SEMUA KECAMATAN --</option>
            {listKecamatan.map((kec, i) => <option key={i} value={kec}>{kec}</option>)}
          </select>
        </div>
        <div className="w-full md:w-64">
          <select value={selectedKelurahan} onChange={(e) => setSelectedKelurahan(e.target.value)} disabled={!selectedKecamatan} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-40">
            <option value="">{selectedKecamatan ? "-- SEMUA KELURAHAN --" : "PILIH KECAMATAN DULU"}</option>
            {listKelurahan.map((kel, i) => <option key={i} value={kel}>{kel}</option>)}
          </select>
        </div>
        {(selectedKecamatan || selectedKelurahan) && (
          <button onClick={() => { setSelectedKecamatan(''); setSelectedKelurahan(''); }} className="mt-5 md:mt-0 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold transition-all text-slate-200">
            Reset Filter
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 🌟 DUAL PROGRESS BAR RAKSASA + KARTU KPI ABSOLUT        */}
      {/* ======================================================== */}
      {(() => {
        const totalTarget = globalStats.target || 1; 
        const totalAlokator = globalStats.alokator || 1; 
        const approved = globalStats.approved || 0 ;
        const submitted  = globalStats.submitted  || 0 ;
        const rejected = globalStats.rejected || 0 ;
        const draft = globalStats.draft || 0 ;
        const totalPerolehan = (globalStats.approved || 0) + (globalStats.submitted || 0) + (globalStats.rejected || 0);

        const progresTarget = ((totalPerolehan / totalTarget) * 100).toFixed(2);
        const progresAlokator = ((totalPerolehan / totalAlokator) * 100).toFixed(2);

        return (
          <div className="mb-8">
            
            {/* 🌟 DUAL PROGRESS BAR */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* KOLOM 1: TARGET UTAMA */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase">Progres Target Utama</span>
                  <span className="text-4xl font-black text-blue-400">{progresTarget}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${progresTarget}%` }}></div>
                </div>
                <p className="text-right text-xs text-slate-400 mt-1 font-mono">{totalPerolehan.toLocaleString()} / {totalTarget.toLocaleString()}</p>
              </div>

              {/* KOLOM 2: ALOKATOR */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-400 text-xs font-bold uppercase">Progres Alokator</span>
                  <span className="text-4xl font-black text-purple-400">{progresAlokator}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${progresAlokator}%` }}></div>
                </div>
                <p className="text-right text-xs text-slate-400 mt-1 font-mono">{totalPerolehan.toLocaleString()} / {totalAlokator.toLocaleString()}</p>
              </div>
            </div>

            {/* 🌟 7 KARTU ABSOLUT BAWAHNYA (Fluid Flexbox) */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Approved', val: approved, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                { label: 'Submitted', val: submitted, color: 'text-amber-400', bg: 'bg-amber-500' },
                { label: 'Draft', val: draft, color: 'text-slate-300', bg: 'bg-slate-500' },
                { label: 'Rejected', val: rejected, color: 'text-rose-400', bg: 'bg-rose-500' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/40 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-500">{item.label}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-3xl font-black ${item.color}`}>{item.val.toLocaleString()}</span>
                    {/* Indikator Progres Kecil untuk perbandingan ke Target Utama */}
                    <span className="text-[18px] text-slate-500">{(totalTarget > 0 ? ((item.val/totalTarget)*100).toFixed(2) : 0)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div className={`${item.bg} h-full`} style={{ width: `${totalTarget > 0 ? Math.min((item.val/totalTarget)*100, 100) : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}


      {/* NAVIGASI TAB KONTROL */}
      <div className="flex space-x-4 mb-6 bg-slate-800 p-1.5 rounded-xl w-fit border border-slate-700">
        <button onClick={() => setActiveTab('desa')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'desa' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
          <Layers size={16} /> <span>TAB 1: PROGRES PER DESA</span>
        </button>
        <button onClick={() => setActiveTab('petugas')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'petugas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
          <Users size={16} /> <span>TAB 2: KINERJA PER PETUGAS</span>
        </button>
        <button onClick={() => setActiveTab('harian')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'harian' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
          <TrendingUp size={16} /> <span>TAB 3: TREN PROGRES HARIAN</span>
        </button>
        <button onClick={() => setActiveTab('anomali')} className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${activeTab === 'anomali' ? 'bg-slate-800/80 text-rose-400 border-t-2 border-rose-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
          <AlertTriangle size={16} /> TAB 4: PEROLEHAN ANOMALI
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'}`}>
          <MessageSquare size={16} /> <span>TAB 5: TANYA DATA AI</span>
        </button>
      </div>

      {/* VIEWPORT CONTROLLER CONTAINER */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {activeTab === 'desa' && <TabDesa dataDesa={filteredDataDesa} />}
        {activeTab === 'petugas' && <TabPetugas dataPetugas={filteredDataPetugas} dataTimeline={dataTimeline} />}
        {activeTab === 'harian' && <TabHarian chartData={chartDataHarian} />}
        {activeTab === 'anomali' && <TabAnomali dataPetugas={dataPetugas} />}
        <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
          <TabChatSQL />
        </div>
      </div>
    </div>
  );
}
