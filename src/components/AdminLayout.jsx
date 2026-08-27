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
  Map,
  ShieldAlert
} from 'lucide-react';
import Login from '../pages/admin/Login';

function Sidebar({ onLogout, isSuperadmin }) {
  const location = useLocation();
  
  // 🌟 STRUKTUR BARU: MENU DIKELOMPOKKAN BERDASARKAN KATEGORI
  const menuGroups = [
    {
      title: "DATA MASTER & SDM",
      items: [
        { name: 'Upload Wilayah', path: '/admin/upload-wilayah', icon: <MapPin size={18} /> },
        { name: 'Upload Petugas', path: '/admin/upload-petugas', icon: <Users size={18} /> },
        { name: 'Tambah Petugas', path: '/admin/tambah-petugas', icon: <Users size={18} /> },
        { name: 'Transfer Petugas', path: '/admin/transfer-petugas', icon: <Users size={18} /> },
      ]
    },
    {
      title: "SINKRONISASI & TARGET",
      items: [
        { name: 'Data Historis', path: '/admin/historis', icon: <History size={18} /> },
        { name: 'Update Assignment', path: '/admin/update-assignment', icon: <History size={18} /> },
        { name: 'Update Target Prelist', path: '/admin/upload-target-prelist', icon: <Target size={18} /> },
        { name: 'Upload Alokator', path: '/admin/upload-alokator', icon: <FileSpreadsheet size={18} /> }, 
      ]
    },
    {
      title: "PETA & INTELIJEN SPASIAL",
      items: [
        { name: 'Peta Tematik SLS', path: '/admin/peta-tematik', icon: <Map size={18} className={isSuperadmin ? "text-emerald-400" : ""} /> },
        { name: 'Injeksi Titik Tematik', path: '/admin/upload-detail-assignment', icon: <MapPin size={18} className={isSuperadmin ? "text-rose-400" : ""} /> },
        { name: 'Usaha Tidak Ditemukan', path: '/admin/usaha-nr', icon: <AlertTriangle size={18} className={isSuperadmin ? "text-amber-400" : ""} /> },
        { name: 'Anomali Spasial', path: '/admin/anomali-spasial', icon: <ShieldAlert size={18} className="text-rose-400" /> },
      ]
    },
    {
      title: "AI & DATABASE LAB",
      items: [
        { name: 'SQL LAB', path: '/admin/upload-sqllab', icon: <Database size={18} className={isSuperadmin ? "text-blue-400" : ""} /> },
        { name: 'Trigger Bot FASIH', path: '/admin/trigger-bot', icon: <Bot size={18} /> },
        { name: 'Latih Ulang AI', path: '/admin/ai-training', icon: <BrainCircuit size={18} /> },
      ]
    }
  ];

  // 🌟 LOGIKA RBAC OTOMATIS MEMBUANG GRUP KOSONG
  const filteredGroups = menuGroups.map(group => {
    return {
      ...group,
      // Filter isi menunya dulu
      items: group.items.filter(menu => {
        if (isSuperadmin) return true;
        return menu.name === 'Anomali Spasial'; // Operator hanya lihat ini
      })
    };
  }).filter(group => group.items.length > 0); // Buang judul kategori jika tidak ada menu di dalamnya

  return (
    <div className="w-72 bg-slate-950 min-h-screen text-slate-300 p-4 flex flex-col overflow-y-auto border-r border-slate-800/60 shadow-2xl z-20 relative custom-scrollbar">
      {/* HEADER LOGO */}
      <div className="text-2xl font-black text-white mb-8 mt-2 px-4 flex items-center gap-3 tracking-wide">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
          <Database className="text-white" size={24} />
        </div>
        <span>BPS Admin</span>
      </div>
      
      {/* LIST KELOMPOK MENU */}
      <div className="flex-1 flex flex-col gap-6">
        {filteredGroups.map((group, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            {/* JUDUL KELOMPOK (GROUP HEADER) */}
            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {group.title}
            </h3>
            
            {/* ITEM MENU DALAM KELOMPOK */}
            {group.items.map((menu) => {
              const isActive = menu.path === '/admin' 
                ? location.pathname === '/admin' || location.pathname === '/admin/'
                : location.pathname.startsWith(menu.path);
                
              return (
                <Link
                  key={menu.path}
                  to={menu.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium border border-transparent ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-700/50'
                  }`}
                >
                  <div className={`${isActive ? 'text-blue-400' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                    {menu.icon}
                  </div>
                  <span className="text-sm tracking-wide">{menu.name}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* FOOTER ACTIONS (LOGOUT & HOME) */}
      <div className="pt-4 mt-8 border-t border-slate-800/80 flex flex-col gap-2 shrink-0">
        <div className="px-4 pb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sesi Pengguna</p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             {isSuperadmin ? "Super Administrator" : "Operator Lapangan"}
          </p>
        </div>
        <Link 
          to="/"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all font-medium"
        >
          <Home size={18} />
          <span className="text-sm">Ke Dashboard Utama</span>
        </Link>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all font-medium"
        >
          <LogOut size={18} />
          <span className="text-sm">Keluar Sistem</span>
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

      if (now > authData.expiry) {
        localStorage.removeItem('admin_auth'); 
        localStorage.removeItem('is_superadmin'); 
        return false;
      }
      return true; 
    } catch (err) {
      localStorage.removeItem('admin_auth');
      localStorage.removeItem('is_superadmin');
      return false;
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(checkLoginStatus());
  
  const isSuperadmin = localStorage.getItem('is_superadmin') === 'true';

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('is_superadmin'); 
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 w-full text-left font-sans">
      <Sidebar onLogout={handleLogout} isSuperadmin={isSuperadmin} />
      <main className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] relative">
        <Outlet />
      </main>
    </div>
  );
}