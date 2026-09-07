import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Loader2, AlertTriangle, ShieldCheck, FilterX, Layers, Database } from 'lucide-react';
import axios from 'axios';

// 🌟 HELPER: Pembaca Properti Kebal Peluru
const getProp = (obj, key) => {
  if (!obj) return null;
  const actualKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  return actualKey ? obj[actualKey] : null;
};

// 🌟 HELPER SENSOR NAMA: BIMA SAKTI -> B*** S****
const sensorNama = (nama) => {
  if (!nama || nama.trim() === '' || nama.toUpperCase() === 'N/A') return 'N/A';
  
  return nama.split(' ').map(kata => {
    // Kalau cuma 1 karakter/huruf, biarkan saja
    if (kata.length <= 1) return kata; 
    
    // Ambil huruf pertama, sisanya diganti bintang sebanyak jumlah huruf tersisa
    return kata.charAt(0) + '*'.repeat(kata.length - 1);
  }).join(' ');
};

// 🌟 KOMPONEN RENDER CEPAT TITIK
function FastTitikLayer({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const markerGroup = L.layerGroup().addTo(map);

    data.forEach(titik => {
      const lat = parseFloat(titik.latitude);
      const lng = parseFloat(titik.longitude);
      
      let color = '#94a3b8';
      if (titik.status_alias === 'APPROVED') color = '#10b981';
      else if (titik.status_alias === 'OPEN') color = '#f59e0b';
      else if (titik.status_alias === 'SUBMITTED') color = '#3b82f6';
      else if (titik.status_alias === 'REJECTED') color = '#ef4444';

      const marker = L.circleMarker([lat, lng], {
        renderer: canvasRenderer, radius: 5, fillColor: color,
        color: '#ffffff', weight: 1.5, fillOpacity: 0.9
      });

      // 🌟 EKSEKUSI SENSOR NAMA SEBELUM DITAMPILKAN KE POPUP
      const namaAman = sensorNama(titik.nama_usaha);

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: sans-serif;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 4px;">BANGUNAN ${titik.nomor_bangunan || '-'}</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${namaAman}</div>
          <div style="font-size: 10px; font-weight: bold; color: #10b981;">STATUS: ${titik.status_alias}</div>
        </div>
      `);
      markerGroup.addLayer(marker);
    });

    return () => {
      markerGroup.clearLayers();
      map.removeLayer(markerGroup);
    };
  }, [data, map]);
  return null;
}

export default function PetaTematikPublic() {
  const [dataTitik, setDataTitik] = useState([]);
  const [batasWilayah, setBatasWilayah] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  
  // 🌟 MASTER DROPDOWN DARI API (DIKEMBALIKAN KE JALAN YANG BENAR)
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listKelurahan, setListKelurahan] = useState([]);
  const [listSlsApi, setListSlsApi] = useState([]);

  // 🌟 STATE PILIHAN
  const [selectedKdkec, setSelectedKdkec] = useState("");
  const [selectedIddesa, setSelectedIddesa] = useState("");
  const [selectedNmdesa, setSelectedNmdesa] = useState(""); // Disimpan untuk mencocokkan dengan GeoJSON
  const [selectedSls, setSelectedSls] = useState("");   

  // =========================================================================
  // 1. INITIAL LOAD
  // =========================================================================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        
        // Tarik Master Kecamatan API
        const resKec = await axios.get(`${API_URL}/api/v1/maps/get-list-kecamatan`);
        setListKecamatan(resKec.data || []);

        // Tarik GeoJSON Poligon
        const resBatas = await fetch('/batas_sls.geojson'); 
        if (resBatas.ok) {
          const batas = await resBatas.json();
          setBatasWilayah(batas);
        }
      } catch (err) {
        console.warn("Gagal memuat data awal:", err);
      }
    };
    fetchInitialData();
  }, []);

  // =========================================================================
  // 2. HANDLER DROPDOWN BERUNTUN (KEC -> KEL -> SLS)
  // =========================================================================
  const handleKecamatanChange = async (e) => {
    const kdkec = e.target.value;
    setSelectedKdkec(kdkec);
    
    setSelectedIddesa(''); 
    setSelectedNmdesa('');
    setSelectedSls('');
    setListKelurahan([]);
    setListSlsApi([]);
    setDataTitik([]); 

    if (kdkec) {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const resKel = await axios.get(`${API_URL}/api/v1/maps/get-list-kelurahan/${kdkec}`);
        setListKelurahan(resKel.data || []);
      } catch (error) {
        console.error("Gagal memuat master kelurahan:", error);
      }
    }
  };

  const handleKelurahanChange = async (e) => {
    const iddesa = e.target.value;
    setSelectedIddesa(iddesa);
    
    // Simpan Nama Desa untuk highlight Poligon GeoJSON
    const kelObj = listKelurahan.find(k => k.iddesa === iddesa);
    setSelectedNmdesa(kelObj ? kelObj.nmdesa : "");

    setSelectedSls('');
    setListSlsApi([]);
    setDataTitik([]);

    if (iddesa) {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/api/v1/maps/get-list-sls/${iddesa}`);
        
        const sortedData = (res.data || []).sort((a, b) => {
          const namaA = a.nmsls || "";
          const namaB = b.nmsls || "";
          return namaA.localeCompare(namaB, 'id', { numeric: true });
        });
        setListSlsApi(sortedData);
      } catch (err) {
        console.error("Gagal memuat daftar SLS:", err);
      }
    }
  };

  // =========================================================================
  // 3. FUNGSI TARIK DATA (LAZY LOADING API)
  // =========================================================================
  const handleMuatData = async () => {
    if (!selectedIddesa) return;
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // 🌟 SEKARANG BENAR! MENGIRIMKAN KODE ID (Contoh: 3573050001) BUKAN NAMA KELURAHAN
      const response = await axios.get(`${API_URL}/api/v1/maps/get-titik-tematik?iddesa=${selectedIddesa}`);
      
      const titik = response.data.data || response.data;
      if (Array.isArray(titik)) {
        const validTitik = titik.filter(item => item.latitude && item.longitude && !isNaN(parseFloat(item.latitude)));
        setDataTitik(validTitik);
      }
    } catch (err) {
      console.error("Gagal menarik data titik:", err);
      setDataTitik([]);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 4. LOGIKA FILTER TITIK LOKAL & HIGHLIGHT POLIGON
  // =========================================================================
  const filteredTitik = useMemo(() => {
    if (!selectedSls) return dataTitik; 
    return dataTitik.filter(titik => String(titik.region_code).trim().startsWith(String(selectedSls)));
  }, [dataTitik, selectedSls]);

  const isFeatureHighlighted = (feature) => {
    const p = feature.properties;
    const fSLS = String(getProp(p, 'idsubsls'));
    const fKel = String(getProp(p, 'nmdesa'));

    if (selectedSls) return fSLS === String(selectedSls);
    // Kita cek berdasarkan NAMA desa (karena GeoJSON isinya nmdesa, bukan iddesa)
    if (selectedNmdesa) return fKel.toUpperCase() === String(selectedNmdesa).toUpperCase();
    return false;
  };

  const handleReset = () => {
    setSelectedKdkec("");
    setSelectedIddesa("");
    setSelectedNmdesa("");
    setSelectedSls("");
    setDataTitik([]); 
    setListKelurahan([]);
    setListSlsApi([]);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 relative font-sans">
      <div className="absolute top-6 right-6 z-[1000]">
        <Link to="/admin" className="flex items-center gap-2 bg-slate-900/80 hover:bg-blue-600 backdrop-blur border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl shadow-lg transition-all text-sm font-bold">
          <ShieldCheck size={18} />
          Portal Admin
        </Link>
      </div>

      <div className="absolute top-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 p-5 rounded-2xl shadow-2xl max-w-sm w-80 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h1 className="text-xl font-black flex items-center gap-2 text-white mb-1 tracking-wide">
          <MapIcon className="text-emerald-500" size={24} />
          Visualisasi SE2026
        </h1>
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-4">BPS Kota Malang</p>
        
        {/* === FILTER 1: KECAMATAN === */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> Kecamatan</label>
          <select 
            value={selectedKdkec}
            onChange={handleKecamatanChange}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">-- Semua Kecamatan --</option>
            {listKecamatan.map((kec) => <option key={kec.kdkec} value={kec.kdkec}>{kec.nmkec}</option>)}
          </select>
        </div>

        {/* === FILTER 2: KELURAHAN === */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> Kelurahan / Desa</label>
          <select 
            value={selectedIddesa}
            onChange={handleKelurahanChange}
            disabled={!selectedKdkec}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Pilih Kelurahan --</option>
            {listKelurahan.map((kel) => <option key={kel.iddesa} value={kel.iddesa}>{kel.nmdesa}</option>)}
          </select>
        </div>

        {/* === FILTER 3: SLS === */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> SLS (Satuan Lingkungan Setempat)</label>
          <select 
            value={selectedSls}
            onChange={(e) => setSelectedSls(e.target.value)}
            disabled={!selectedIddesa}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-rose-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Semua SLS --</option>
            {listSlsApi.map((sls) => <option key={sls.region_code} value={sls.region_code}>{sls.nmsls || sls.region_code}</option>)}
          </select>
        </div>

        {/* 🌟 TOMBOL LAZY LOAD DATA */}
        <button 
          onClick={handleMuatData}
          disabled={!selectedIddesa || isLoading}
          className={`w-full mb-4 flex justify-center items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${
            !selectedIddesa ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
          }`}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          {isLoading ? 'Menarik Koordinat...' : 'MUAT DATA SPASIAL'}
        </button>

        {!selectedIddesa && (
          <p className="text-[10px] text-amber-500 flex items-center gap-1 font-bold mb-4 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <AlertTriangle size={12} /> Pilih Kelurahan untuk muat data
          </p>
        )}

        {/* TOMBOL RESET */}
        {(selectedKdkec || selectedIddesa || dataTitik.length > 0) && (
          <button 
            onClick={handleReset}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <FilterX size={16} /> Reset Semua Filter
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-300 mt-2 border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> APPROVED</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> OPEN</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> SUBMITTED</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> REJECTED</div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
          <span className="font-bold tracking-widest animate-pulse">MEMUAT DATA...</span>
        </div>
      )}

      {/* KANVAS PETA LEAFLET */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          preferCanvas={true}
          center={[-7.9839, 112.6326]} 
          zoom={13} 
          zoomControl={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        >
          {/* 🌟 GOOGLE MAPS HYBRID BASEMAP (SATELIT + JALAN/LABEL) */}
          <TileLayer 
            url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
            attribution="&copy; Google Maps"
            maxZoom={20}
          />

          {/* RENDER POLIGON */}
          {batasWilayah && (
            <GeoJSON 
              key={`${selectedKdkec}-${selectedIddesa}-${selectedSls}`}
              data={batasWilayah}
              style={(feature) => {
                const highlighted = isFeatureHighlighted(feature);
                return {
                  color: highlighted ? '#3b82f6' : '#94a3b8', 
                  weight: highlighted ? 2.5 : 1,
                  fillColor: highlighted ? '#3b82f6' : 'transparent',
                  fillOpacity: highlighted ? 0.2 : 0
                };
              }}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: () => {
                    const p = feature.properties;
                    const fKec = getProp(p, 'nmkec');
                    const fKel = getProp(p, 'nmdesa');
                    const fSLS = getProp(p, 'idsubsls');

                    // Kita asumsikan API tidak dipanggil saat klik dari peta agar tidak membingungkan state dropdown API
                    console.log(`Poligon di klik: Kec ${fKec}, Kel ${fKel}, SLS ${fSLS}`);
                  }
                });
              }}
            />
          )}

          <FastTitikLayer data={filteredTitik} />
        </MapContainer>
      </div>
    </div>
  );
}