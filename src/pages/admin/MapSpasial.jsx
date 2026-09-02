import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import { Search, Map as MapIcon, Filter, Settings, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function MapSpasial() {
  // 🌟 STATE UNTUK TOGGLE & FILTER (Sesuai Gambar)
  const [showUsaha, setShowUsaha] = useState(true);
  const [showRumahTangga, setShowRumahTangga] = useState(true);
  
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 📍 DUMMY DATA KOORDINAT (Nanti diganti tarikan dari backend)
  const dummyPoints = [
    { id: 1, lat: -7.9826, lng: 112.6286, type: 'usaha', nama: 'Warung Bakso Pak Min', alamat: 'Jl. Kawi No 10' },
    { id: 2, lat: -7.9840, lng: 112.6290, type: 'rumahtangga', nama: 'Budi Santoso', alamat: 'Jl. Kawi Gg. 1' },
    { id: 3, lat: -7.9810, lng: 112.6250, type: 'usaha', nama: 'Toko Kelontong Berkah', alamat: 'Jl. Ijen No 5' },
  ];

  // Logic Filter Titik
  const filteredPoints = dummyPoints.filter(point => {
    const matchType = (point.type === 'usaha' && showUsaha) || (point.type === 'rumahtangga' && showRumahTangga);
    const matchSearch = point.nama.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="flex h-[85vh] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl font-sans text-slate-800">
      
      {/* 🌟 PANEL KIRI (SIDEBAR FILTER) */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-[1000] shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
        
        {/* Header Sidebar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <MapIcon size={20} />
            </div>
            <h2 className="font-black text-lg text-slate-800 tracking-tight">TENTORING PETA</h2>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          {/* SECTION 1: TOGGLE LAYER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Titik Usaha</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={showUsaha} onChange={() => setShowUsaha(!showUsaha)} />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Titik Rumah Tangga</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={showRumahTangga} onChange={() => setShowRumahTangga(!showRumahTangga)} />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* SECTION 2: FILTER WILAYAH */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Filter size={14} /> Filter Wilayah
            </h3>
            
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Kecamatan</label>
              <select 
                value={selectedKecamatan} 
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Semua Kecamatan</option>
                <option value="klojen">Klojen</option>
                <option value="sukun">Sukun</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Desa / Kelurahan</label>
              <select 
                value={selectedKelurahan} 
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Semua Desa</option>
                <option value="bareng">Bareng</option>
                <option value="ciptomulyo">Ciptomulyo</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* SECTION 3: PENCARIAN */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500">Cari Nama Usaha / RT</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="contoh: BAKSO"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => { setSearchKeyword(''); setSelectedKecamatan(''); setSelectedKelurahan(''); }}
              className="w-full mt-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset Filter
            </button>
          </div>

        </div>
      </div>

      {/* 🌟 PANEL KANAN (MAP LEAFLET) */}
      <div className="flex-1 relative bg-slate-200">
        <MapContainer 
          center={[-7.9839, 112.6214]} // Koordinat tengah Malang
          zoom={15} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false} // Matikan zoom bawaan agar bisa dikustom posisi
        >
          {/* BASEMAP CARTO POSITRON (Abu-abu bersih seperti di gambar referensi) */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* RENDER TITIK DATA MENGGUNAKAN CIRCLE MARKER */}
          {filteredPoints.map((point) => (
            <CircleMarker 
              key={point.id}
              center={[point.lat, point.lng]}
              radius={6}
              pathOptions={{
                color: point.type === 'usaha' ? '#ea580c' : '#059669', // Border Outline (Orange / Emerald)
                fillColor: point.type === 'usaha' ? '#f97316' : '#10b981', // Fill Color (Orange / Emerald)
                fillOpacity: 0.8,
                weight: 2
              }}
            >
              {/* KOTAK POPUP SAAT TITIK DI-KLIK */}
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${point.type === 'usaha' ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {point.type === 'usaha' ? 'Titik Usaha Biasa' : 'Titik Rumah Tangga'}
                  </div>
                  <h3 className="font-black text-slate-800 text-sm mb-1">{point.nama}</h3>
                  <p className="text-xs text-slate-500 flex items-start gap-1">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    {point.alamat}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          
          {/* (OPSIONAL) RENDER GEOJSON POLIGON DI SINI NANTI */}
          {/* <GeoJSON data={dataPoligonSLS} style={{ color: '#000', weight: 2, fillOpacity: 0 }} /> */}

        </MapContainer>
      </div>

    </div>
  );
}