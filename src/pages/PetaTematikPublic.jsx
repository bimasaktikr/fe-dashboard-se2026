import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Loader2, AlertTriangle, ShieldCheck, FilterX, Layers } from 'lucide-react';

// 🌟 HELPER: Pembaca Properti Kebal Peluru (Tahan huruf besar/kecil)
const getProp = (obj, key) => {
  if (!obj) return null;
  const actualKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  return actualKey ? obj[actualKey] : null;
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
        color: '#1e293b', weight: 1, fillOpacity: 1
      });

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: sans-serif;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 4px;">BANGUNAN ${titik.nomor_bangunan || '-'}</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${titik.nama_usaha || 'N/A'}</div>
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
  
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("");
  const [selectedSLS, setSelectedSLS] = useState(null);   
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        
        // Fetch Titik
        const resTitik = await fetch(`${API_URL}/api/v1/maps/get-titik-tematik`);
        if (!resTitik.ok) throw new Error('Gagal mengambil data titik');
        const titik = await resTitik.json();
        
        if (Array.isArray(titik)) {
          const validTitik = titik.filter(item => item.latitude && item.longitude && !isNaN(parseFloat(item.latitude)));
          setDataTitik(validTitik);
        }

        // Fetch GeoJSON
        try {
          const resBatas = await fetch('/batas_sls.geojson'); 
          if (resBatas.ok) {
            const batas = await resBatas.json();
            setBatasWilayah(batas);
          }
        } catch (errBatas) {
          console.warn("File batas_sls.geojson bermasalah.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🌟 EKSTRAKSI PROPERTI OTOMATIS (Mencegah Bug Dropdown Kosong)
  const allFeatures = useMemo(() => {
    if (!batasWilayah) return [];
    // Deteksi apakah GeoJSON berupa Array langsung atau FeatureCollection
    const features = Array.isArray(batasWilayah) ? batasWilayah : (batasWilayah.features || []);
    return features.map(f => f.properties || {});
  }, [batasWilayah]);

  // Ekstraksi List Dropdown
  const listKecamatan = useMemo(() => {
    return [...new Set(allFeatures.map(p => getProp(p, 'nmkec')))].filter(Boolean).sort();
  }, [allFeatures]);

  const listKelurahan = useMemo(() => {
    if (!selectedKecamatan) return [];
    return [...new Set(allFeatures.filter(p => getProp(p, 'nmkec') === selectedKecamatan).map(p => getProp(p, 'nmdesa')))].filter(Boolean).sort();
  }, [allFeatures, selectedKecamatan]);

  const listSLS = useMemo(() => {
    if (!selectedKelurahan) return [];
    return allFeatures.filter(p => getProp(p, 'nmdesa') === selectedKelurahan).map(p => getProp(p, 'idsubsls')).filter(Boolean).sort();
  }, [allFeatures, selectedKelurahan]);

  // 🌟 LOGIKA PENYARINGAN TITIK (Lebih Aman)
  const validSLSIds = useMemo(() => {
    // Jika tidak ada filter yang aktif, kembalikan null (tampilkan semua)
    if (!selectedKecamatan && !selectedKelurahan && !selectedSLS) return null;

    let result = allFeatures;
    if (selectedKecamatan) result = result.filter(p => String(getProp(p, 'nmkec')) === String(selectedKecamatan));
    if (selectedKelurahan) result = result.filter(p => String(getProp(p, 'nmdesa')) === String(selectedKelurahan));
    if (selectedSLS) result = result.filter(p => String(getProp(p, 'idsubsls')) === String(selectedSLS));

    return result.map(p => String(getProp(p, 'idsubsls')));
  }, [selectedKecamatan, selectedKelurahan, selectedSLS, allFeatures]);

  const filteredTitik = useMemo(() => {
    if (!validSLSIds) return dataTitik; // Tampilkan semua jika null
    return dataTitik.filter(titik => validSLSIds.includes(String(titik.region_code).trim()));
  }, [dataTitik, validSLSIds]);

  // Highlight Poligon
  const isFeatureHighlighted = (feature) => {
    const p = feature.properties;
    const fSLS = String(getProp(p, 'idsubsls'));
    const fKel = String(getProp(p, 'nmdesa'));
    const fKec = String(getProp(p, 'nmkec'));

    if (selectedSLS) return fSLS === String(selectedSLS);
    if (selectedKelurahan) return fKel === String(selectedKelurahan);
    if (selectedKecamatan) return fKec === String(selectedKecamatan);
    return false;
  };

  const handleReset = () => {
    setSelectedKecamatan("");
    setSelectedKelurahan("");
    setSelectedSLS(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 relative">
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
            value={selectedKecamatan}
            onChange={(e) => {
              setSelectedKecamatan(e.target.value);
              setSelectedKelurahan(""); 
              setSelectedSLS(null);     
            }}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">-- Semua Kecamatan --</option>
            {listKecamatan.map((kec, idx) => <option key={idx} value={kec}>{kec}</option>)}
          </select>
        </div>

        {/* === FILTER 2: KELURAHAN === */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> Kelurahan / Desa</label>
          <select 
            value={selectedKelurahan}
            onChange={(e) => {
              setSelectedKelurahan(e.target.value);
              setSelectedSLS(null); 
            }}
            disabled={!selectedKecamatan}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Semua Kelurahan --</option>
            {listKelurahan.map((kel, idx) => <option key={idx} value={kel}>{kel}</option>)}
          </select>
        </div>

        {/* === FILTER 3: SLS === */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> SLS (idsubsls)</label>
          <select 
            value={selectedSLS || ""}
            onChange={(e) => setSelectedSLS(e.target.value || null)}
            disabled={!selectedKelurahan}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-rose-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Semua SLS --</option>
            {listSLS.map((sls, idx) => <option key={idx} value={sls}>SLS: {sls}</option>)}
          </select>
        </div>

        {/* TOMBOL RESET */}
        {(selectedKecamatan || selectedKelurahan || selectedSLS) && (
          <button 
            onClick={handleReset}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <FilterX size={16} />
            Reset Semua Filter
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-300 mt-2 border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> APPROVED</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> OPEN</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> SUBMITTED</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> LAINNYA</div>
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
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />

          {/* RENDER POLIGON */}
          {batasWilayah && (
            <GeoJSON 
              key={`${selectedKecamatan}-${selectedKelurahan}-${selectedSLS}`}
              data={batasWilayah}
              style={(feature) => {
                const highlighted = isFeatureHighlighted(feature);
                return {
                  color: highlighted ? '#3b82f6' : '#334155', 
                  weight: highlighted ? 2 : 1,
                  fillColor: highlighted ? '#3b82f6' : 'transparent',
                  fillOpacity: highlighted ? 0.15 : 0
                };
              }}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: () => {
                    const p = feature.properties;
                    const fKec = getProp(p, 'nmkec');
                    const fKel = getProp(p, 'nmdesa');
                    const fSLS = getProp(p, 'idsubsls');

                    if (fKec) setSelectedKecamatan(fKec);
                    if (fKel) setSelectedKelurahan(fKel);
                    setSelectedSLS(String(selectedSLS) === String(fSLS) ? null : fSLS);
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