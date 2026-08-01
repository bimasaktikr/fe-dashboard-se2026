import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Map, TrendingUp, Clock, ArrowUpDown, ArrowUp, Download, ArrowDown, Users, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { handleExportExcelBPS } from '../../utils/export-report';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function TabPetugas({ dataPetugas, dataTimeline, onExport }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('pcl');
  
  const [sortConfig, setSortConfig] = useState({ key: 'progres_target', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const toggleRow = (email) => {
    setExpandedRow(expandedRow === email ? null : email);
  };

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [activeSubTab, dataPetugas]);

  const getSisaHari = () => {
    const deadline = new Date('2026-08-15T23:59:59');
    const today = new Date();
    if (today >= deadline) return 1; 
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };
  const sisaHari = getSisaHari();

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

  const filteredData = useMemo(() => {
    if (!dataPetugas) return [];
    return dataPetugas.filter(item => {
      const role = item.role ? item.role.toUpperCase() : 'PCL';
      return activeSubTab === 'pcl' ? role === 'PCL' : role === 'PML';
    });
  }, [dataPetugas, activeSubTab]);

  const sortedDataPetugas = useMemo(() => {
    let sortableItems = filteredData.map(item => {
      const total = Math.max(0, (item.target || 0) - (item.status_open || 0) - (item.status_draft || 0));
      const target_prelist = item.target_prelist || 0;
      const target = item.target || 0;
      const alokator = item.alokator || 0;
      
      return { 
        ...item, 
        progres_prelist: target_prelist > 0 ? Math.round((total / target_prelist) * 100) : 0,
        progres_target: target > 0 ? Math.round((total / target) * 100) : 0,
        progres_alokator: alokator > 0 ? Math.round((total / alokator) * 100) : 0,
        harusDikerjakanPerHari: Math.max(0, Math.ceil((alokator - total) / sisaHari))
      };
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || 0;
        let bValue = b[sortConfig.key] || 0;

        if (typeof aValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, sisaHari]);

  const totalItems = sortedDataPetugas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = sortedDataPetugas.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig?.key !== columnName) return <ArrowUpDown size={10} className="opacity-30 inline-block ml-0.5" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-white inline-block ml-0.5" /> : <ArrowDown size={10} className="text-white inline-block ml-0.5" />;
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

  const getAnakBuahPML = (pmlEmail) => {
    const pml = dataPetugas.find(p => p.email === pmlEmail);
    if (!pml || !pml.detail_assignment) return [];
    
    const s_codes_pml = new Set(pml.detail_assignment.map(d => d.assignment_code));
    const anakBuah = {};

    dataPetugas.filter(p => p.role?.toUpperCase() === 'PCL').forEach(pcl => {
      const slsMilikPclDiBawahPml = pcl.detail_assignment?.filter(d => s_codes_pml.has(d.assignment_code)) || [];
      
      if (slsMilikPclDiBawahPml.length > 0) {
        if (!anakBuah[pcl.email]) {
          anakBuah[pcl.email] = {
            nama: pcl.nama, total_sls: 0, target_prelist: 0, target: 0, alokator: 0,
            submitted: 0, approved: 0, rejected: 0, open: 0, draft: 0
          };
        }
        slsMilikPclDiBawahPml.forEach(s => {
          anakBuah[pcl.email].total_sls += 1;
          anakBuah[pcl.email].target_prelist += (s.target_prelist || 0);
          anakBuah[pcl.email].target += (s.target || 0);
          anakBuah[pcl.email].alokator += (s.alokator || 0);
          anakBuah[pcl.email].submitted += (s.status_submitted || 0);
          anakBuah[pcl.email].approved += (s.status_approved || 0);
          anakBuah[pcl.email].rejected += (s.status_rejected || 0);
          anakBuah[pcl.email].open += (s.status_open || 0);
          anakBuah[pcl.email].draft += (s.status_draft || 0);
        });
      }
    });
    return Object.values(anakBuah);
  };

  const getChartDataForPML = (pmlEmail) => {
    const pml = dataPetugas.find(p => p.email === pmlEmail);
    if (!pml || !pml.detail_assignment || !dataTimeline) return [];
    
    const s_codes_pml = new Set(pml.detail_assignment.map(d => d.assignment_code));
    const bawahanMap = {}; 

    dataPetugas.filter(p => p.role?.toUpperCase() === 'PCL').forEach(pcl => {
      if (pcl.detail_assignment?.some(d => s_codes_pml.has(d.assignment_code))) {
        bawahanMap[pcl.email] = pcl.nama;
      }
    });

    const emailsBawahan = Object.keys(bawahanMap);
    if (emailsBawahan.length === 0) return [];

    const kelompokTanggal = {};

    dataTimeline.forEach(tl => {
      const emailTL = tl.email_petugas || tl.email;
      const namaTL = tl.nama_petugas || tl.nama;
      const isMilikBawahan = emailsBawahan.includes(emailTL) || Object.values(bawahanMap).includes(namaTL);

      if (isMilikBawahan) {
          const tgl = tl.tanggal_data || tl.tanggal || "-";
          
          if (!kelompokTanggal[tgl]) {
            kelompokTanggal[tgl] = { tanggal: tgl };
            Object.values(bawahanMap).forEach(nama => { kelompokTanggal[tgl][nama] = 0; });
          }

          let keyNama = bawahanMap[emailTL] || Object.values(bawahanMap).find(n => n === namaTL);

          if (keyNama) {
            kelompokTanggal[tgl][keyNama] += (tl.status_approved || tl.approved || 0);
          }
      }
    });

    return Object.values(kelompokTanggal).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  };

  const StackedTargets = ({ prelist, usaha, alokator }) => (
    <div className="flex flex-col items-center justify-center space-y-1">
      <span className="text-[10px] font-black font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 w-16 text-center shadow-sm" title="Target Prelist">
        {prelist.toLocaleString('id-ID')}
      </span>
      {/* 🌟 DIUBAH KE ASSIGNMENT */}
      <span className="text-[10px] font-black font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-16 text-center shadow-sm" title="Target Assignment">
        {usaha.toLocaleString('id-ID')}
      </span>
      <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 w-16 text-center shadow-sm" title="Target Alokator">
        {alokator.toLocaleString('id-ID')}
      </span>
    </div>
  );

  return (
    <div className="overflow-x-auto animate-in fade-in duration-500">
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveSubTab('pcl')}
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pcl' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Kinerja PCL Lapangan
        </button>
        <button
          onClick={() => setActiveSubTab('pml')}
          className={`px-6 py-2.5 text-sm font-bold rounded-t-lg transition-all ${
            activeSubTab === 'pml' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Pengawasan PML
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/60 p-4 rounded-t-xl border border-slate-700/50 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tampilkan</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); }}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entri</span>
          </div>
          <span className="text-sm font-semibold text-slate-400 border-l border-slate-700 pl-4">
            Total: <strong className="text-white font-bold">{totalItems}</strong> petugas terpantau
          </span>
        </div>
        
        <button 
          onClick={() => handleExportExcelBPS(dataPetugas)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-xs shadow-lg shadow-emerald-600/20"
        >
          <Download size={14} /> Export Excel
        </button>
      </div>
  
      <div className="overflow-x-auto bg-slate-900/40 border-l border-r border-b border-slate-700/50 shadow-inner rounded-b-xl">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-900/80">
              <th className="p-4 w-10 text-center">No</th>
              <th className="p-4 w-[220px] cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('nama')}>
                <div className="flex items-center">Nama Petugas <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" /></div>
              </th>
              
              <th className="p-4 text-center w-28">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span>Beban Tugas</span>
                  <div className="flex items-center gap-1.5 text-[9px] bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-700/80 shadow-inner">
                    <button onClick={() => requestSort('target_prelist')} className="hover:text-teal-300 text-teal-400 flex items-center" title="Urutkan berdasar Prelist">P{getSortIcon('target_prelist')}</button>
                    <div className="w-px h-3 bg-slate-700"></div>
                    {/* 🌟 DIUBAH KE Asg (Assignment) */}
                    <button onClick={() => requestSort('target')} className="hover:text-blue-300 text-blue-400 flex items-center" title="Urutkan berdasar Assignment">Asg{getSortIcon('target')}</button>
                    <div className="w-px h-3 bg-slate-700"></div>
                    <button onClick={() => requestSort('alokator')} className="hover:text-purple-300 text-purple-400 flex items-center" title="Urutkan berdasar Alokator">A{getSortIcon('alokator')}</button>
                  </div>
                </div>
              </th>

              <th className="p-4 text-center text-emerald-400 cursor-pointer hover:bg-emerald-900/20 transition-colors" onClick={() => requestSort('status_approved')}>
                <div className="flex items-center justify-center">Appv <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" /></div>
              </th>
              <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-amber-900/20 transition-colors" onClick={() => requestSort('status_submitted')}>
                <div className="flex items-center justify-center">Subm <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" /></div>
              </th>
              <th className="p-4 text-center text-slate-400 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('status_draft')}>
                <div className="flex items-center justify-center">Draft <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" /></div>
              </th>
              <th className="p-4 text-center text-rose-400 cursor-pointer hover:bg-rose-900/20 transition-colors" onClick={() => requestSort('status_rejected')}>
                <div className="flex items-center justify-center">Rejc <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" /></div>
              </th>
              <th className="p-4 text-center text-amber-400 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => requestSort('harusDikerjakanPerHari')} title="Target yg harus dikerjakan per hari (Sisa Beban / Sisa Hari)">
                <div className="flex flex-col items-center justify-center gap-1">
                   <span>Tgt/Hari</span>
                   <ArrowUpDown size={12} className="opacity-30 inline-block ml-1" />
                </div>
              </th>
              <th className="p-4 w-60 cursor-pointer hover:bg-slate-800/50 transition-colors text-center" onClick={() => requestSort('progres_target')}>
                <div className="flex items-center justify-center">Triple Progress Capaian</div>
              </th>
              <th className="p-4 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-slate-300 text-sm">
            {currentData.map((item, idx) => {
              const actualIndex = startIndex + idx + 1;
              const isExpanded = expandedRow === item.email;
              
              const tPrelist = item.target_prelist || 0;
              const tUsaha = item.target || 0;
              const tAlokator = item.alokator || 0;
              
              const approved = item.status_approved || 0;
              const submitted = item.status_submitted || 0;
              const open = item.status_open || 0;
              const draft = item.status_draft || 0;
              const rejected = item.status_rejected || 0;
              
              const progresRiil = Math.max(0, tUsaha - open - draft);

              const pPrelist = item.progres_prelist || 0;
              const pUsaha = item.progres_target || 0;
              const pAlokator = item.progres_alokator || 0;
              const isAman = pUsaha >= targetHarian;

              return (
                <React.Fragment key={idx}>
                  <tr 
                    onClick={() => toggleRow(item.email)}
                    className={`hover:bg-slate-800/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}
                  >
                    <td className="p-4 text-center text-slate-500 font-mono text-xs">{actualIndex}</td>
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2 max-w-[200px] truncate" title={item.nama}>
                        <span className={`shrink-0 w-2 h-2 rounded-full ${isAman ? 'bg-emerald-400' : 'bg-rose-500'}`}></span> 
                        {item.nama}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px] mt-1 truncate max-w-[200px]">{item.email}</div>
                      <div className="mt-1">
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${item.role?.toUpperCase() === 'PML' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                          {item.role || 'PCL'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <StackedTargets prelist={tPrelist} usaha={tUsaha} alokator={tAlokator} />
                    </td>
                    
                    <td className="p-4 text-center font-mono text-emerald-400 font-bold">{approved.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center font-mono text-amber-400">{submitted.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center font-mono text-slate-300">{draft.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center font-mono text-rose-400">{rejected.toLocaleString('id-ID')}</td>
                    
                    <td className="p-4 text-center">
                      <div className="flex flex-col justify-center items-center h-full pt-1.5">
                        <span className="text-lg font-black font-mono text-amber-400 leading-none">{item.harusDikerjakanPerHari}</span>
                        <span className="block text-[8px] text-slate-500 mt-1 uppercase tracking-wider">dok/hari</span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-2 w-full">
                        <div className="flex items-center gap-2" title={`Vs Target Prelist: ${pPrelist}%`}>
                          <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Prelist</span>
                          <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                            <div className="absolute top-0 left-0 h-full rounded-full bg-teal-500" style={{ width: `${Math.min(pPrelist, 100)}%` }}></div>
                          </div>
                          <span className={`text-[9px] font-bold w-7 text-right ${pPrelist < 60 ? 'text-rose-400' : 'text-teal-400'}`}>{pPrelist}%</span>
                        </div>
                        {/* 🌟 DIUBAH KE ASSIGNMENT */}
                        <div className="flex items-center gap-2" title={`Vs Target Assignment: ${pUsaha}% | Target Harian: ${targetHarian.toFixed(1)}%`}>
                          <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Assign</span>
                          <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isAman ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(pUsaha, 100)}%` }}></div>
                            <div className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" style={{ left: `${targetHarian}%` }}></div>
                          </div>
                          <span className={`text-[9px] font-bold w-7 text-right ${isAman ? 'text-blue-400' : 'text-rose-400'}`}>{pUsaha}%</span>
                        </div>
                        <div className="flex items-center gap-2" title={`Vs Target Alokator: ${pAlokator}%`}>
                          <span className="text-[8px] font-bold text-slate-500 w-10 uppercase tracking-tighter">Alokatr</span>
                          <div className="relative flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                            <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(pAlokator, 100)}%` }}></div>
                            <div className="absolute top-0 h-full border-r-[2px] border-amber-400 z-10" style={{ left: `${targetHarian}%` }}></div>
                          </div>
                          <span className={`text-[9px] font-bold w-7 text-right ${pAlokator < 60 ? 'text-rose-400' : 'text-purple-400'}`}>{pAlokator}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center text-slate-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-950/80 border-b border-slate-700/50 shadow-inner">
                      <td colSpan="10" className="p-0">
                        
                        {activeSubTab === 'pcl' && (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pl-12 pr-4 py-6 animate-in slide-in-from-top-2 duration-300">
                            
                            <div>
                              <h4 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2 mb-3">
                                <Map size={14} /> Detail Penugasan Region (SLS):
                              </h4>
                              <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/50">
                                    <tr>
                                      <th className="p-3">Kode SLS & Wilayah</th>
                                      <th className="p-3 text-center">Beban Tugas</th>
                                      <th className="p-3 text-center text-emerald-400">Appv</th>
                                      <th className="p-3 text-center text-amber-400">Subm</th>
                                      <th className="p-3 text-center text-slate-300">Drft</th>
                                      <th className="p-3 text-center text-rose-400">Rejc</th>
                                      <th className="p-3 w-40 text-center">Progres SLS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/50">
                                    {item.detail_assignment?.map((assign, i) => {
                                      const aPrelist = assign.target_prelist || 0;
                                      const aUsaha = assign.target || 0;
                                      const aAlokator = assign.alokator || 0;
                                      
                                      const aOpen = assign.status_open || 0;
                                      const aDraft = assign.status_draft || 0;
                                      
                                      const aSelesai = Math.max(0, aUsaha - aOpen - aDraft);
                                      
                                      const pAPrelist = aPrelist > 0 ? Math.round((aSelesai / aPrelist) * 100) : 0;
                                      const pAUsaha = aUsaha > 0 ? Math.round((aSelesai / aUsaha) * 100) : 0;
                                      const pAAlokator = aAlokator > 0 ? Math.round((aSelesai / aAlokator) * 100) : 0;
                                      
                                      return(
                                        <tr key={i} className="hover:bg-slate-800/30">
                                          <td className="p-3 align-top pt-4">
                                            <div className="font-mono font-bold text-slate-300">{assign.assignment_code}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{assign.desa}</div>
                                            {assign.last_synced_at !== "-" && (
                                              <div className="text-[9px] text-emerald-500 flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {formatLengkapWaktu(assign.last_synced_at)}
                                              </div>
                                            )}
                                          </td>
                                          
                                          <td className="p-3">
                                            <StackedTargets prelist={aPrelist} usaha={aUsaha} alokator={aAlokator} />
                                          </td>

                                          <td className="p-3 text-center font-mono text-emerald-400/80 align-top pt-5">{assign.status_approved}</td>
                                          <td className="p-3 text-center font-mono text-amber-400/80 align-top pt-5">{assign.status_submitted}</td>
                                          <td className="p-3 text-center font-mono text-slate-400 align-top pt-5">{assign.status_draft}</td>
                                          <td className="p-3 text-center font-mono text-rose-400/80 align-top pt-5">{assign.status_rejected}</td>
                                          
                                          <td className="p-3 align-top pt-4">
                                            <div className="space-y-1.5 w-full">
                                              <div className="flex items-center gap-1.5">
                                                <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                  <div className="absolute top-0 left-0 h-full rounded-full bg-teal-500" style={{ width: `${Math.min(pAPrelist, 100)}%` }}></div>
                                                </div>
                                                <span className={`text-[8px] font-bold w-6 text-right ${pAPrelist < 60 ? 'text-rose-400' : 'text-teal-400'}`}>{pAPrelist}%</span>
                                              </div>
                                              {/* 🌟 DIUBAH KE ASSIGNMENT */}
                                              <div className="flex items-center gap-1.5">
                                                <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                  <div className="absolute top-0 left-0 h-full rounded-full bg-blue-500" style={{ width: `${Math.min(pAUsaha, 100)}%` }}></div>
                                                </div>
                                                <span className={`text-[8px] font-bold w-6 text-right ${pAUsaha < 60 ? 'text-rose-400' : 'text-blue-400'}`}>{pAUsaha}%</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                  <div className="absolute top-0 left-0 h-full rounded-full bg-purple-500" style={{ width: `${Math.min(pAAlokator, 100)}%` }}></div>
                                                </div>
                                                <span className={`text-[8px] font-bold w-6 text-right ${pAAlokator < 60 ? 'text-rose-400' : 'text-purple-400'}`}>{pAAlokator}%</span>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-3">
                                <TrendingUp size={14} /> Kecepatan Validasi Harian
                              </h4>
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={getChartDataForPetugas(item.email)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="tanggal" stroke="#475569" fontSize={10} tickMargin={8} />
                                    <YAxis stroke="#475569" fontSize={10} width={30} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                                    <Line type="monotone" dataKey="Approved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Submitted" stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 4" dot={{ r: 2 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSubTab === 'pml' && (
                          <div className="flex flex-col gap-6 pl-12 pr-4 py-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                  <Users size={14} /> Tim PCL di Bawah Pengawasan
                                </h4>
                                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                                  {getAnakBuahPML(item.email).length} PCL Aktif
                                </span>
                              </div>

                              <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700/50">
                                    <tr>
                                      <th className="p-3">Nama PCL</th>
                                      <th className="p-3 text-center">Jml SLS</th>
                                      <th className="p-3 text-center">Beban Tugas</th>
                                      <th className="p-3 text-center text-emerald-400">Appv</th>
                                      <th className="p-3 text-center text-amber-400">Subm</th>
                                      <th className="p-3 text-center text-rose-400">Rejc</th>
                                      <th className="p-3 text-center w-40">Triple Progress Anak Buah</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
                                    {getAnakBuahPML(item.email).length === 0 ? (
                                      <tr>
                                        <td colSpan={7} className="p-6 text-center text-slate-500 font-sans italic">
                                          Tidak ada PCL yang terikat dengan wilayah tugas PML ini.
                                        </td>
                                      </tr>
                                    ) : (
                                      getAnakBuahPML(item.email).map((anak, i) => {
                                        
                                        const anakSelesai = Math.max(0, (anak.target || 0) - (anak.open || 0) - (anak.draft || 0));
                                        
                                        const pABPrelist = anak.target_prelist > 0 ? Math.round((anakSelesai / anak.target_prelist) * 100) : 0;
                                        const pABUsaha = anak.target > 0 ? Math.round((anakSelesai / anak.target) * 100) : 0;
                                        const pABAlokator = anak.alokator > 0 ? Math.round((anakSelesai / anak.alokator) * 100) : 0;
                                        
                                        return (
                                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="p-3 font-sans font-semibold text-slate-200 align-top pt-4">{anak.nama}</td>
                                            <td className="p-3 text-center text-slate-400 align-top pt-4">{anak.total_sls}</td>
                                            
                                            <td className="p-3">
                                               <StackedTargets prelist={anak.target_prelist} usaha={anak.target} alokator={anak.alokator} />
                                            </td>

                                            <td className="p-3 text-center text-emerald-400 font-bold align-top pt-5">{anak.approved}</td>
                                            <td className="p-3 text-center text-amber-400 align-top pt-5">{anak.submitted}</td>
                                            <td className="p-3 text-center text-rose-400 align-top pt-5">{anak.rejected}</td>
                                            <td className="p-3 align-top pt-4">
                                              <div className="space-y-1.5 w-full">
                                                <div className="flex items-center gap-1.5">
                                                  <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="absolute top-0 left-0 h-full rounded-full bg-teal-500" style={{ width: `${Math.min(pABPrelist, 100)}%` }}></div>
                                                  </div>
                                                  <span className={`text-[8px] font-bold w-6 text-right ${pABPrelist < 60 ? 'text-rose-400' : 'text-teal-400'}`}>{pABPrelist}%</span>
                                                </div>
                                                {/* 🌟 DIUBAH KE ASSIGNMENT */}
                                                <div className="flex items-center gap-1.5">
                                                  <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="absolute top-0 left-0 h-full rounded-full bg-blue-500" style={{ width: `${Math.min(pABUsaha, 100)}%` }}></div>
                                                  </div>
                                                  <span className={`text-[8px] font-bold w-6 text-right ${pABUsaha < 60 ? 'text-rose-400' : 'text-blue-400'}`}>{pABUsaha}%</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <div className="relative flex-1 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                                                    <div className="absolute top-0 left-0 h-full rounded-full bg-purple-500" style={{ width: `${Math.min(pABAlokator, 100)}%` }}></div>
                                                  </div>
                                                  <span className={`text-[8px] font-bold w-6 text-right ${pABAlokator < 60 ? 'text-rose-400' : 'text-purple-400'}`}>{pABAlokator}%</span>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="w-full">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <BarChart2 size={14} /> Radar Perolehan Harian Tim (Approved)
                              </h4>
                              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 h-[280px] w-full">
                                {getChartDataForPML(item.email).length === 0 ? (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-xs">
                                    <TrendingUp size={24} className="mb-2 opacity-20" />
                                    <span>Menunggu aktivitas sinkronisasi dari lapangan...</span>
                                  </div>
                                ) : (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getChartDataForPML(item.email)}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                      <XAxis dataKey="tanggal" stroke="#475569" fontSize={10} tickLine={false} tickMargin={8} />
                                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={30} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}
                                        itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                                      />
                                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                                      
                                      {getAnakBuahPML(item.email).map((anak, index) => (
                                        <Line
                                          key={anak.nama}
                                          type="monotone"
                                          dataKey={anak.nama}
                                          stroke={`hsl(${(index * 137) % 360}, 85%, 60%)`} 
                                          strokeWidth={2.5}
                                          dot={{ r: 3, strokeWidth: 1 }}
                                          activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                      ))}
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}
                              </div>
                            </div>

                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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