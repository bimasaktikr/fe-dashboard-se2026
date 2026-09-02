import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, Key, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TambahUser() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!username || !password) {
    setError("Username dan password wajib diisi!");
    return;
  }

  setLoading(true);
  setError(null);
  setMessage(null);

  try {
    const API_URL = import.meta.env.VITE_API_BASE_URL || '';
    
    // Ambil username admin yang sedang login dari localStorage
    const currentAdmin = localStorage.getItem('username') || 'superadmin';

    const res = await axios.post(`${API_URL}/api/v1/admin/create-user`, {
      username,
      password,
      is_superadmin: isSuperadmin
    }, {
      headers: {
        'X-Admin-Username': currentAdmin // 🌟 Kirim identitas peminta ke backend
      }
    });

    setMessage(res.data.message || "Akun berhasil dibuat!");
    setUsername('');
    setPassword('');
    setIsSuperadmin(false);
  } catch (err) {
    setError(err.response?.data?.detail || "Gagal terhubung ke server.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-8 max-w-2xl mx-auto text-slate-200">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <UserPlus className="text-blue-500" size={28} />
          Manajemen Tambah User Baru
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Daftarkan akun baru untuk pegawai atau operator lapangan agar dapat mengakses sistem sesuai hak aksesnya.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username Baru</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: operator_sukun"
                className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password Awal</label>
            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={isSuperadmin ? "text-amber-400" : "text-slate-500"} size={22} />
              <div>
                <p className="text-sm font-bold text-white">Jadikan Sebagai Superadmin?</p>
                <p className="text-xs text-slate-400">Jika dimatikan, akun ini otomatis berstatus Operator (hanya bisa cek anomali).</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isSuperadmin} 
                onChange={(e) => setIsSuperadmin(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? "Menyimpan Akun..." : "Simpan & Buat Akun"}
          </button>
        </form>
      </div>
    </div>
  );
}