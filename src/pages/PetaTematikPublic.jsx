import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Loader2, AlertTriangle, ShieldCheck, FilterX, Layers, Database, ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';

// =========================================================================
// 🌟 1. HELPER FUNCTIONS
// =========================================================================

// Pembaca Properti Kebal Peluru GeoJSON
const getProp = (obj, key) => {
  if (!obj) return null;
  const actualKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  return actualKey ? obj[actualKey] : null;
};

// Sensor Nama: "BIMA SAKTI" -> "B*** S****"
const sensorNama = (nama) => {
  if (!nama || nama.trim() === '' || nama.toUpperCase() === 'N/A') return 'N/A';
  return nama.split(' ').map(kata => {
    if (kata.length <= 1) return kata; 
    return kata.charAt(0) + '*'.repeat(kata.length - 1);
  }).join(' ');
};

// =========================================================================
// 🌟 2. KOMPONEN: RENDER TITIK (LABEL NOMOR BANGUNAN)
// =========================================================================
function FastTitikLayer({ data }) {
  const map = useMap();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    const markerGroup = L.layerGroup().addTo(map);

    data.forEach(titik => {
      const lat = parseFloat(titik.latitude);
      const lng = parseFloat(titik.longitude);
      
      let color = '#94a3b8';
      if (titik.status_alias === 'APPROVED') color = '#10b981';
      else if (titik.status_alias === 'OPEN') color = '#f59e0b';
      else if (titik.status_alias === 'SUBMITTED') color = '#3b82f6';
      else if (titik.status_alias === 'REJECTED') color = '#ef4444';

      const nomor = titik.nomor_bangunan || '-';
      const namaAman = sensorNama(titik.nama_usaha);

      // Desain Kapsul Nomor
      const iconHtml = `
        <div style="
          background-color: ${color};
          border: 1.5px solid #ffffff;
          color: #ffffff;
          font-weight: 900;
          font-size: 10px;
          font-family: sans-serif;
          border-radius: 12px;
          padding: 2px 5px;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          transform: translate(-50%, -50%);
          display: inline-block;
          text-shadow: 0 1px 1px rgba(0,0,0,0.3);
        ">
          ${nomor}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [0, 0], 
        iconAnchor: [0, 0], 
        popupAnchor: [0, -12] 
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: sans-serif;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 4px;">BANGUNAN ${nomor}</div>
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

// =========================================================================
// 🌟 3. KOMPONEN: PENGENDALI ZOOM OTOMATIS
// =========================================================================
function MapZoomController({ batasWilayah, selectedNmkec, selectedNmdesa, selectedSls }) {
  const map = useMap();

  useEffect(() => {
    if (!batasWilayah || !batasWilayah.features) return;

    let featuresToZoom = [];

    if (selectedSls) {
      featuresToZoom = batasWilayah.features.filter(f => String(getProp(f.properties, 'idsubsls')) === String(selectedSls));
    } else if (selectedNmdesa) {
      featuresToZoom = batasWilayah.features.filter(f => {
        const nmdesa = getProp(f.properties, 'nmdesa');
        return nmdesa && nmdesa.toUpperCase() === String(selectedNmdesa).toUpperCase();
      });
    } else if (selectedNmkec) {
      featuresToZoom = batasWilayah.features.filter(f => {
        const nmkec = getProp(f.properties, 'nmkec');
        return nmkec && nmkec.toUpperCase() === String(selectedNmkec).toUpperCase();
      });
    }

    if (featuresToZoom.length > 0) {
      const geoJsonLayer = L.geoJSON({ type: 'FeatureCollection', features: featuresToZoom });
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    } else if (!selectedNmkec && !selectedNmdesa && !selectedSls) {
      map.flyTo([-7.9839, 112.6326], 13, { duration: 1.5 });
    }
  }, [batasWilayah, selectedNmkec, selectedNmdesa, selectedSls, map]);

  return null;
}

// =========================================================================
// 🌟 4. KOMPONEN: PANEL DETEKSI ANOMALI BANGUNAN
// =========================================================================
function PanelAnomali({ dataTitik }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { denganStrip, terlewat, maxSls } = useMemo(() => {
    if (!dataTitik || dataTitik.length === 0) {
      return { denganStrip: [], terlewat: [], maxSls: 0 };
    }

    const denganStrip = [];
    const angkaUnik = new Set();
    let maxSls = 0;

    dataTitik.forEach(t => {
      const noStr = String(t.nomor_bangunan || '').trim();

      if (noStr.includes('-')) {
        denganStrip.push({
          nomor: noStr,
          nama: sensorNama(t.nama_usaha) 
        });
      }

      const parsed = parseInt(noStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        angkaUnik.add(parsed);
        if (parsed > maxSls) maxSls = parsed;
      }
    });

    const terlewat = [];
    for (let i = 1; i <= maxSls; i++) {
      if (!angkaUnik.has(i)) {
        terlewat.push(i);
      }
    }

    return { denganStrip, terlewat, maxSls };
  }, [dataTitik]);

  if (!dataTitik || dataTitik.length === 0) return null;

  const totalAnomali = denganStrip.length + terlewat.length;

  return (
    <div className="absolute bottom-8 right-8 z-[1000] w-80">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md bg-opacity-95">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-4 transition-colors ${
            totalAnomali > 0 ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {totalAnomali > 0 ? <AlertTriangle size={20} className="text-rose-500" /> : <ShieldCheck size={20} className="text-emerald-500" />}
            <div className="text-left">
              <h3 className={`font-black text-sm ${totalAnomali > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {totalAnomali > 0 ? 'ANOMALI TERDETEKSI' : 'DATA AMAN'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {totalAnomali} Temuan
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 max-h-64 overflow-y-auto custom-scrollbar">
            {/* ANOMALI 1: STRIP */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 mb-2 uppercase border-b border-slate-800 pb-1">
                <AlertTriangle size={14} /> Penggunaan Strip (-) <span className="bg-amber-500 text-slate-900 px-1.5 rounded-md ml-auto text-[9px]">{denganStrip.length}</span>
              </h4>
              {denganStrip.length > 0 ? (
                <ul className="space-y-1">
                  {denganStrip.map((item, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="text-rose-400 font-black mt-0.5">•</span>
                      <span>No. <b className="text-white">{item.nomor}</b> ({item.nama})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-slate-500 italic">Tidak ada penggunaan strip (-).</p>
              )}
            </div>

            {/* ANOMALI 2: TERLEWAT */}
            <div>
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-2 uppercase border-b border-slate-800 pb-1">
                <Database size={14} /> Nomor Terlewat <span className="bg-blue-500 text-white px-1.5 rounded-md ml-auto text-[9px]">{terlewat.length}</span>
              </h4>
              {terlewat.length > 0 ? (
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <p className="mb-2 text-slate-400 text-[10px]">Bangunan tertinggi: <b>{maxSls}</b></p>
                  <div className="flex flex-wrap gap-1.5">
                    {terlewat.map(num => (
                      <span key={num} className="bg-slate-800 border border-slate-700 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">Tidak ada urutan nomor yang terlewat.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 🌟 5. KOMPONEN UTAMA: PETA TEMATIK PUBLIC
// =========================================================================
export default function PetaTematikPublic() {
  const [dataTitik, setDataTitik] = useState([]);
  const [batasWilayah, setBatasWilayah] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listKelurahan, setListKelurahan] = useState([]);
  const [listSlsApi, setListSlsApi] = useState([]);

  const [selectedKdkec, setSelectedKdkec] = useState("");
  const [selectedNmkec, setSelectedNmkec] = useState(""); 
  const [selectedIddesa, setSelectedIddesa] = useState("");
  const [selectedNmdesa, setSelectedNmdesa] = useState(""); 
  const [selectedSls, setSelectedSls] = useState("");   

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const resKec = await axios.get(`${API_URL}/api/v1/maps/get-list-kecamatan`);
        setListKecamatan(resKec.data || []);

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

  const handleKecamatanChange = async (e) => {
    const kdkec = e.target.value;
    setSelectedKdkec(kdkec);
    
    const kecObj = listKecamatan.find(k => String(k.kdkec) === String(kdkec));
    setSelectedNmkec(kecObj ? kecObj.nmkec : "");

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

  const handleMuatData = async () => {
    if (!selectedIddesa) return;
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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

  const filteredTitik = useMemo(() => {
    if (!selectedSls) return dataTitik; 
    return dataTitik.filter(titik => String(titik.region_code).trim().startsWith(String(selectedSls)));
  }, [dataTitik, selectedSls]);

  const isFeatureHighlighted = (feature) => {
    const p = feature.properties;
    const fSLS = String(getProp(p, 'idsubsls'));
    const fKel = String(getProp(p, 'nmdesa'));
    const fKec = String(getProp(p, 'nmkec'));

    if (selectedSls) return fSLS === String(selectedSls);
    if (selectedNmdesa) return fKel.toUpperCase() === String(selectedNmdesa).toUpperCase();
    if (selectedNmkec) return fKec.toUpperCase() === String(selectedNmkec).toUpperCase();
    
    return false;
  };

  const handleReset = () => {
    setSelectedKdkec("");
    setSelectedNmkec("");
    setSelectedIddesa("");
    setSelectedNmdesa("");
    setSelectedSls("");
    setDataTitik([]); 
    setListKelurahan([]);
    setListSlsApi([]);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 relative font-sans">
      
      {/* 🌟 TOMBOL ADMIN PORTAL */}
      <div className="absolute top-6 right-6 z-[1000]">
        <Link to="/admin" className="flex items-center gap-2 bg-slate-900/80 hover:bg-blue-600 backdrop-blur border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl shadow-lg transition-all text-sm font-bold">
          <ShieldCheck size={18} />
          Portal Admin
        </Link>
      </div>

      {/* 🌟 PANEL FILTER KIRI */}
      <div className="absolute top-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 p-5 rounded-2xl shadow-2xl max-w-sm w-80 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h1 className="text-xl font-black flex items-center gap-2 text-white mb-1 tracking-wide">
          <MapIcon className="text-emerald-500" size={24} />
          Visualisasi SE2026
        </h1>
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-4">BPS Kota Malang</p>
        
        {/* KECAMATAN */}
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

        {/* KELURAHAN */}
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

        {/* SLS */}
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

        {(selectedKdkec || selectedIddesa || dataTitik.length > 0) && (
          <button 
            onClick={handleReset}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <FilterX size={16} /> Reset Semua Filter
          </button>
        )}

        {/* LEGENDA */}
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

      {/* 🌟 KANVAS PETA LEAFLET */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          preferCanvas={true}
          center={[-7.9839, 112.6326]} 
          zoom={13} 
          zoomControl={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        >
          {/* BASEMAP GOOGLE HYBRID */}
          <TileLayer 
            url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
            attribution="&copy; Google Maps"
            maxZoom={20}
          />

          {/* CONTROLLER AUTO-ZOOM */}
          <MapZoomController 
            batasWilayah={batasWilayah} 
            selectedNmkec={selectedNmkec} 
            selectedNmdesa={selectedNmdesa} 
            selectedSls={selectedSls} 
          />

          {/* RENDER POLIGON BATAS */}
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
            />
          )}

          {/* RENDER TITIK LABEL NOMOR */}
          <FastTitikLayer data={filteredTitik} />
        </MapContainer>
      </div>

      {/* 🌟 PANEL DETEKSI ANOMALI */}
      <PanelAnomali dataTitik={filteredTitik} />
      
    </div>
  );
}