import React, { useState } from 'react';
import axios from 'axios';
import { Shuffle, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TransferPetugas() {
  const [form, setForm] = useState({ email_lama: '', email_baru: '', nama_baru: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!window.confirm("PERINGATAN: Tindakan ini akan memindahkan SELURUH beban tugas SLS dari petugas lama ke petugas baru secara permanen. Lanjutkan?")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      
      const res = await axios.post('/api/v1/admin/petugas/transfer', formData);
      setMessage({ type: 'success', text: res.data.message || 'Transfer Penugasan Berhasil!' });
      setForm({ email_lama: '', email_baru: '', nama_baru: '' }); // Reset form
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Gagal melakukan transfer penugasan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-6 flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl mt-1">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400 mb-1">Transfer Penugasan SLS</h2>
            <p className="text-sm text-amber-400/80 leading-relaxed">
              Gunakan fitur ini jika ada petugas yang mengundurkan diri atau diganti. 
              Sistem akan otomatis membuat akun petugas baru (jika belum ada) dan memindahkan semua target wilayah (SLS) ke email yang baru.
            </p>
          </div>
        </div>

        <div className="p-6">
          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span className="font-medium text-sm">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Petugas Lama (Sumber)</label>
              <input required type="email" className="w-full p-3 bg-slate-900 rounded-xl border border-slate-700 text-white focus:border-amber-500 outline-none transition-all" placeholder="Masukkan email petugas yang akan diganti..." value={form.email_lama} onChange={e => setForm({...form, email_lama: e.target.value})} />
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-800 p-2 rounded-full border-4 border-slate-900 text-slate-400">
                <ArrowRight size={24} className="rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="p-5 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">Email Petugas Baru (Tujuan)</label>
                  <input required type="email" className="w-full p-3 bg-slate-900 rounded-xl border border-indigo-900/50 text-white focus:border-indigo-500 outline-none transition-all" placeholder="Email pengganti..." value={form.email_baru} onChange={e => setForm({...form, email_baru: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">Nama Petugas Baru</label>
                  <input required className="w-full p-3 bg-slate-900 rounded-xl border border-indigo-900/50 text-white focus:border-indigo-500 outline-none transition-all" placeholder="Nama lengkap pengganti..." value={form.nama_baru} onChange={e => setForm({...form, nama_baru: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Shuffle size={20} />}
              {loading ? 'Memproses Transfer Data...' : 'Eksekusi Transfer Penugasan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}