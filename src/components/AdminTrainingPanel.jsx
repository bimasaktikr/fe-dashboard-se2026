import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, Brain, Loader2, Save } from 'lucide-react';

const AdminTrainingPanel = ({ onClose }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [correctedSql, setCorrectedSql] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/v1/admin/feedbacks?resolved=${showResolved}`);
      setFeedbacks(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil feedback", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    setSelectedFeedback(null);
  }, [showResolved]);

  const handleSelect = (fb) => {
    setSelectedFeedback(fb);
    setCorrectedSql(fb.sql_generated || '');
  };

  const handleTrain = async () => {
    if (!correctedSql.trim()) {
      alert("Kueri SQL tidak boleh kosong!");
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post(`${apiUrl}/api/v1/admin/train-ai`, {
        feedback_id: selectedFeedback.id,
        question: selectedFeedback.question,
        corrected_sql: correctedSql
      });
      alert("Vanna AI berhasil dilatih dengan kueri baru!");
      setSelectedFeedback(null);
      setCorrectedSql('');
      fetchFeedbacks();
    } catch (error) {
      console.error("Gagal melatih AI", error);
      alert("Gagal melatih AI. Cek console log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 p-2 rounded-lg text-rose-400">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin AI Training Studio</h2>
              <p className="text-sm text-slate-400">Koreksi jawaban AI yang salah dan latih ulang model secara dinamis.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left: Feedback Queue */}
          <div className="w-1/3 border-r border-slate-700 flex flex-col bg-slate-800/30">
            <div className="flex border-b border-slate-700">
              <button 
                onClick={() => setShowResolved(false)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${!showResolved ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
              >
                Belum Ditangani
              </button>
              <button 
                onClick={() => setShowResolved(true)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${showResolved ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
              >
                Riwayat Selesai
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center p-4 text-slate-500"><Loader2 className="animate-spin" /></div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">
                  <Check size={40} className="mx-auto mb-2 opacity-20" />
                  Semua data kosong!
                </div>
              ) : (
                feedbacks.map(fb => (
                  <button 
                    key={fb.id}
                    onClick={() => handleSelect(fb)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedFeedback?.id === fb.id ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                  >
                    <div className="text-sm font-semibold truncate mb-1">{fb.question}</div>
                    <div className="text-xs opacity-70">Dilaporkan: {new Date(fb.created_at).toLocaleString('id-ID')}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Correction Panel */}
          <div className="w-2/3 flex flex-col bg-slate-900/20">
            {selectedFeedback ? (
              <div className="flex flex-col h-full p-6">
                
                <div className="mb-6">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pertanyaan Pengguna</div>
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-slate-200 font-medium">
                    {selectedFeedback.question}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kueri SQL (Koreksi di sini)</div>
                  </div>
                  <textarea 
                    value={correctedSql}
                    onChange={(e) => setCorrectedSql(e.target.value)}
                    className="flex-1 w-full bg-[#1e1e1e] border border-slate-700 rounded-xl p-4 text-emerald-400 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Tuliskan query SELECT yang benar..."
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handleTrain}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {submitting ? 'Menyimpan...' : (showResolved ? 'Latih Ulang AI' : 'Train AI & Resolve')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <Brain size={64} className="opacity-20 mb-4" />
                <p>Pilih keluhan di antrean untuk mulai melatih AI.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminTrainingPanel;
