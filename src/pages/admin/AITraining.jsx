import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, Brain, Loader2, Save } from 'lucide-react';

export default function AITraining() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [correctedSql, setCorrectedSql] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = 'http://localhost:8000';

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
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
          <Brain size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin AI Training Studio</h1>
          <p className="text-slate-500 mt-1">Koreksi jawaban AI yang salah dan latih ulang model secara dinamis.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex overflow-hidden min-h-[600px]">
        {/* Left: Feedback Queue */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setShowResolved(false)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${!showResolved ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Belum Ditangani
            </button>
            <button 
              onClick={() => setShowResolved(true)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${showResolved ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Riwayat Selesai
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center p-4 text-slate-500"><Loader2 className="animate-spin" /></div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center text-slate-400 mt-10">
                <Check size={48} className="mx-auto mb-3 opacity-30" />
                Semua antrean bersih!
              </div>
            ) : (
              feedbacks.map(fb => (
                <button 
                  key={fb.id}
                  onClick={() => handleSelect(fb)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedFeedback?.id === fb.id ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                >
                  <div className="text-sm font-semibold truncate mb-1">{fb.question}</div>
                  <div className="text-xs opacity-70">Dilaporkan: {new Date(fb.created_at).toLocaleString('id-ID')}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Correction Panel */}
        <div className="w-2/3 flex flex-col bg-white">
          {selectedFeedback ? (
            <div className="flex flex-col h-full p-8">
              
              <div className="mb-8">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Pertanyaan Pengguna</div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-700 font-medium text-lg">
                  {selectedFeedback.question}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-end mb-3">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kueri SQL (Koreksi di sini)</div>
                </div>
                <textarea 
                  value={correctedSql}
                  onChange={(e) => setCorrectedSql(e.target.value)}
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-emerald-400 font-mono text-base focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-none shadow-inner"
                  placeholder="Tuliskan query SELECT yang benar..."
                />
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleTrain}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {submitting ? 'Menyimpan...' : (showResolved ? 'Latih Ulang AI' : 'Train AI & Resolve')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Brain size={80} className="opacity-20 mb-6" />
              <p className="text-lg">Pilih keluhan di antrean untuk mulai melatih AI.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
