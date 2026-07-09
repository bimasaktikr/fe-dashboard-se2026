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
  Home
} from 'lucide-react';
import Login from '../pages/admin/Login';

function Sidebar({ onLogout }) {
  const location = useLocation();
  const menus = [
    { name: 'Upload Wilayah', path: '/admin/upload-wilayah', icon: <MapPin size={20} /> },
    { name: 'Upload Petugas', path: '/admin/upload-petugas', icon: <Users size={20} /> },
    { name: 'Tambah Petugas', path: '/admin/tambah-petugas', icon: <Users size={20} /> },
    { name: 'Transfer Petugas', path: '/admin/transfer-petugas', icon: <Users size={20} /> },
    { name: 'Data Historis', path: '/admin/historis', icon: <History size={20} /> },
    { name: 'Update Assignment', path: '/admin/update-assignment', icon: <History size={20} /> },
    
    { name: 'Trigger Bot FASIH', path: '/admin/trigger-bot', icon: <Bot size={20} /> },
    { name: '🧠 Latih Ulang AI', path: '/admin/ai-training', icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 p-4 flex flex-col">
      <div className="text-2xl font-bold text-white mb-8 mt-2 px-4 flex items-center gap-2">
        <span>BPS Admin</span>
      </div>
      
      <div className="flex-1 flex flex-col gap-2">
        {menus.map((menu) => {
          // Exact match for /admin, startsWith for others
          const isActive = menu.path === '/admin' 
            ? location.pathname === '/admin' || location.pathname === '/admin/'
            : location.pathname.startsWith(menu.path);
            
          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              {menu.icon}
              <span className="font-medium">{menu.name}</span>
            </Link>
          )
        })}
      </div>

      <div className="pt-4 border-t border-slate-700 flex flex-col gap-2">
        <Link 
          to="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
        >
          <Home size={20} />
          <span>Ke Dashboard Utama</span>
        </Link>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('admin_auth') === 'true');

  const handleLogin = () => {
    localStorage.setItem('admin_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full text-left">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
