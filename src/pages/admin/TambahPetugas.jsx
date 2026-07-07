import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TambahPetugas() {
  const [form, setForm] = useState({ nama: '', email: '', role: 'PCL' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      
      const API_URL = import.meta.env.VITE_API_BASE_URL || '';
      const res = await axios.post(`${API_URL}/api/v1/admin/petugas/tambah`, formData);
      
      setMessage({ type: 'success', text: res.data.message || "Petugas berhasil ditambahkan!" });
      setForm({ nama: '', email: '', role: 'PCL' }); // Reset form
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Gagal menambah petugas" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tambah Petugas Baru</h2>
            <p className="text-sm text-slate-400">Daftarkan petugas lapangan atau pengawas baru ke dalam sistem.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Lengkap</label>
            <input required className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="Masukkan nama lengkap" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Alamat Email</label>
            <input required type="email" className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="email@bps.go.id" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Peran (Role)</label>
            <select className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-white focus:border-indigo-500 outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="PCL">PCL (Pencacah)</option>
              <option value="PML">PML (Pengawas)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Menyimpan...' : 'Simpan Petugas'}
          </button>
        </form>
      </div>
    </div>
  );
}