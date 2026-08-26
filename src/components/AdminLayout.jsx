import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  History, 
  Bot, 
  BrainCircuit,
  LogOut,
  Home,
  Target,
  FileSpreadsheet,
  AlertTriangle,
  Database,
  Map // 🌟 Tambahan icon baru untuk Peta Tematik
} from 'lucide-react';
import Login from '../pages/admin/Login';

function Sidebar({ onLogout }) {
  const location = useLocation();
  const menus = [
    // Data Master
    { name: 'Upload Wilayah', path: '/admin/upload-wilayah', icon: <MapPin size={20} /> },
    { name: 'Upload Petugas', path: '/admin/upload-petugas', icon: <Users size={20} /> },
    { name: 'Tambah Petugas', path: '/admin/tambah-petugas', icon: <Users size={20} /> },
    { name: 'Transfer Petugas', path: '/admin/transfer-petugas', icon: <Users size={20} /> },
    
    // Sinkronisasi & Update
    { name: 'Data Historis', path: '/admin/historis', icon: <History size={20} /> },
    { name: 'Update Assignment', path: '/admin/update-assignment', icon: <History size={20} /> },
    
    // 🌟 Target & Baseline
    { name: 'Update Target Prelist', path: '/admin/upload-target-prelist', icon: <Target size={20} /> },
    { name: 'Upload Alokator', path: '/admin/upload-alokator', icon: <FileSpreadsheet size={20} /> }, 
    
    // 🌟 Visualisasi Geospasial (BARU)
    { name: 'Peta Tematik SLS', path: '/admin/peta-tematik', icon: <Map size={20} className="text-emerald-400" /> },
    { name: 'Injeksi Titik Tematik', path: '/admin/upload-detail-assignment', icon: <MapPin size={20} className="text-rose-400" /> },
    
    // 🌟 Intelijen & Anomali
    { name: 'Usaha Tidak Ditemukan', path: '/admin/usaha-nr', icon: <AlertTriangle size={20} className="text-amber-400" /> },
    
    // 🌟 SQL LAB
    { name: 'SQL LAB', path: '/admin/upload-sqllab', icon: <Database size={20} className="text-blue-400" /> },

    // AI & Automasi
    { name: 'Trigger Bot FASIH', path: '/admin/trigger-bot', icon: <Bot size={20} /> },
    { name: '🧠 Latih Ulang AI', path: '/admin/ai-training', icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 p-4 flex flex-col overflow-y-auto shadow-xl z-20 relative">
      <div className="text-2xl font-black text-white mb-8 mt-2 px-4 flex items-center gap-3 tracking-wide">
        <Database className="text-blue-500" size={28} />
        <span>BPS Admin</span>
      </div>
      
      <div className="flex-1 flex flex-col gap-1.5">
        {menus.map((menu) => {
          const isActive = menu.path === '/admin' 
            ? location.pathname === '/admin' || location.pathname === '/admin/'
            : location.pathname.startsWith(menu.path);
            
          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className={`${isActive ? 'text-white' : ''}`}>
                {menu.icon}
              </div>
              <span className="text-sm tracking-wide">{menu.name}</span>
            </Link>
          )
        })}
      </div>

      <div className="pt-4 mt-6 border-t border-slate-800 flex flex-col gap-2 shrink-0">
        <Link 
          to="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
        >
          <Home size={20} />
          <span className="text-sm">Ke Dashboard Utama</span>
        </Link>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium"
        >
          <LogOut size={20} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {

  const checkLoginStatus = () => {
    const authItem = localStorage.getItem('admin_auth');
    if (!authItem) return false;

    try {
      const authData = JSON.parse(authItem);
      const now = new Date().getTime();

      // Bandingkan waktu sekarang dengan waktu expiry
      if (now > authData.expiry) {
        localStorage.removeItem('admin_auth'); // Sesi habis, bersihkan
        return false;
      }
      return true; // Sesi masih berlaku
    } catch (err) {
      // Jika format bukan JSON (misal sisa data lama), bersihkan
      localStorage.removeItem('admin_auth');
      return false;
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(checkLoginStatus());

  // Hanya butuh merubah state, karena setItem JSON sudah dilakukan di Login.jsx
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsLoggedIn(false);
  };

  // Blokir akses masuk jika belum login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 w-full text-left font-sans">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] relative">
        <Outlet />
      </main>
    </div>
  );
}