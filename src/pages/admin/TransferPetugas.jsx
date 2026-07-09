import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { Shuffle, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TransferPetugas() {
  const [petugasOptions, setPetugasOptions] = useState([]);
  const [selectedLama, setSelectedLama] = useState(null);
  const [selectedBaru, setSelectedBaru] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || '';

  // 🌟 Ambil data petugas saat halaman dimuat
  useEffect(() => {
    const fetchPetugas = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/admin/petugas`);
        const options = res.data.data.map(p => ({
          value: p.email,
          label: `${p.nama} (${p.role}) - ${p.email}`
        }));
        setPetugasOptions(options);
      } catch (err) {
        setMessage({ type: 'error', text: "Gagal memuat data petugas dari server." });
      } finally {
        setLoadingData(false);
      }
    };
    fetchPetugas();
  }, [API_URL]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedLama || !selectedBaru) {
      setMessage({ type: 'error', text: 'Mohon pilih Petugas Lama dan Petugas Baru terlebih dahulu!' });
      return;
    }
    if (selectedLama.value === selectedBaru.value) {
      setMessage({ type: 'error', text: 'Petugas lama dan baru tidak boleh sama!' });
      return;
    }

    if (!window.confirm(`PERINGATAN: Memindahkan SELURUH beban tugas dari ${selectedLama.label} ke ${selectedBaru.label}. Lanjutkan?`)) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('email_lama', selectedLama.value);
      formData.append('email_baru', selectedBaru.value);
      
      const res = await axios.post(`${API_URL}/api/v1/admin/petugas/transfer`, formData);
      setMessage({ type: 'success', text: res.data.message || 'Transfer Penugasan Berhasil!' });
      
      // Reset pilihan
      setSelectedLama(null);
      setSelectedBaru(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Gagal melakukan transfer penugasan" });
    } finally {
      setLoading(false);
    }
  };

  // 🌟 Gaya khusus agar React-Select menjadi mode gelap (Dark Mode)
  const customStyles = {
    control: (base, state) => ({
      ...base,
      background: '#0f172a', // slate-900
      borderColor: state.isFocused ? '#6366f1' : '#1e293b', // focus:indigo-500, default:slate-800
      color: 'white',
      padding: '4px',
      borderRadius: '0.75rem',
      boxShadow: 'none',
      '&:hover': { borderColor: '#475569' }
    }),
    menu: (base) => ({ ...base, background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem', overflow: 'hidden' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#1e293b' : '#0f172a',
      color: 'white',
      cursor: 'pointer',
      '&:active': { backgroundColor: '#4338ca' }
    }),
    singleValue: (base) => ({ ...base, color: '#e2e8f0' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#64748b' })
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
              Pilih petugas dari database. Sistem akan memindahkan semua target wilayah (SLS) dari petugas sumber ke petugas tujuan secara permanen.
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
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pilih Petugas Lama (Sumber Tugas)</label>
              <Select 
                options={petugasOptions}
                value={selectedLama}
                onChange={setSelectedLama}
                isLoading={loadingData}
                isDisabled={loadingData || loading}
                placeholder="Ketik nama atau email untuk mencari..."
                styles={customStyles}
                isClearable
              />
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-800 p-2 rounded-full border-4 border-slate-900 text-slate-400">
                <ArrowRight size={24} className="rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="p-5 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
              <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">Pilih Petugas Baru (Penerima Tugas)</label>
              <Select 
                options={petugasOptions}
                value={selectedBaru}
                onChange={setSelectedBaru}
                isLoading={loadingData}
                isDisabled={loadingData || loading}
                placeholder="Ketik nama atau email untuk mencari..."
                styles={customStyles}
                isClearable
              />
            </div>

            <button type="submit" disabled={loading || loadingData} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Shuffle size={20} />}
              {loading ? 'Memproses Transfer Data...' : 'Eksekusi Transfer Penugasan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}