import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, ShieldCheck, BarChart3 } from 'lucide-react';

export default function NavbarPublic() {
  const location = useLocation();

  // Jangan tampilkan header di halaman admin jika tidak diinginkan
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-[1001] px-6 py-3.5 flex items-center justify-between shadow-lg">
      
      {/* BRANDING / LOGO */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-400">
          <BarChart3 size={22} />
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-wide">COMMAND CENTER SE2026</h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">BPS Kota Malang</p>
        </div>
      </div>

      {/* TOMBOL NAVIGASI UTAMA (HEADER) */}
      <div className="flex items-center gap-3">
        {/* Tombol Peta Tematik */}
        <Link 
          to="/map" 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            location.pathname === '/map' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
              : 'bg-slate-950/50 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Map size={16} className="text-emerald-400" />
          Peta Tematik
        </Link>

        {/* Tombol Login Admin */}
        <Link 
          to="/admin" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
        >
          <ShieldCheck size={16} />
          Login Admin
        </Link>
      </div>

    </header>
  );
}