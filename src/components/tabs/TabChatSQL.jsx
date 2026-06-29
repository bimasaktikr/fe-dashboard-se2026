import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, Bot, User, Table as TableIcon, Loader2, ThumbsDown, 
  ArrowUpDown, ArrowUp, ArrowDown, Code, CheckCircle2, 
  ChevronDown, ChevronUp, Sparkles, BarChart as BarChartIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip as ChartTooltip, CartesianGrid, Legend 
} from 'recharts';

const getChartConfig = (data) => {
  if (!data || data.length < 2) return null;
  
  const sample = data[0];
  const keys = Object.keys(sample);
  
  // 1. Cari label key (kolom bertipe teks/nama wilayah/nama petugas)
  let labelKey = null;
  const labelCandidates = ['nama', 'nmdesa', 'nmkec', 'desa', 'kecamatan', 'role'];
  for (const c of labelCandidates) {
    const found = keys.find(k => k.toLowerCase() === c);
    if (found) {
      labelKey = found;
      break;
    }
  }
  if (!labelKey) {
    // Fallback: cari string column pertama
    labelKey = keys.find(k => typeof sample[k] === 'string' && isNaN(Number(sample[k])));
  }
  
  // 2. Cari value keys (kolom bertipe numerik untuk digambar di grafik)
  const valueKeys = [];
  const numericCandidates = [
    'persentase_capaian', 'progres_persen', 'total_realisasi', 'total_submitted', 
    'total_approved', 'total_open', 'total_target', 'target_usaha', 
    'status_open', 'status_submitted', 'status_approved', 'status_rejected'
  ];
  
  for (const c of numericCandidates) {
    const found = keys.find(k => k.toLowerCase() === c);
    if (found) {
      valueKeys.push(found);
    }
  }
  
  // Fallback: cari kolom numerik apa saja yang bukan label
  if (valueKeys.length === 0) {
    keys.forEach(k => {
      if (k !== labelKey && typeof sample[k] === 'number') {
        valueKeys.push(k);
      }
    });
  }
  
  if (!labelKey || valueKeys.length === 0) return null;
  
  return { labelKey, valueKeys };
};

const MessageTable = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  const isTruncated = data.length > 5;
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const displayData = isExpanded ? sortedData : sortedData.slice(0, 5);

  const renderCell = (header, value) => {
    if (value === null || value === undefined) return '-';
    
    const valStr = value.toString();
    const hUpper = header.toUpperCase();
    
    if (hUpper.includes('TARGET') || hUpper.includes('TGT')) {
      return <span className="font-bold text-purple-400 font-mono">{valStr}</span>;
    }
    if (hUpper.includes('OPEN')) {
      return <span className="font-bold text-amber-400 font-mono">{valStr}</span>;
    }
    if (hUpper.includes('SUBMIT') || hUpper.includes('REALISASI')) {
      return <span className="font-bold text-blue-400 font-mono">{valStr}</span>;
    }
    if (hUpper.includes('APPROVE') || hUpper.includes('APPV')) {
      return <span className="font-black text-emerald-400 font-mono">{valStr}</span>;
    }
    if (hUpper.includes('REJECT') || hUpper.includes('REJC')) {
      return <span className="font-bold text-rose-400 font-mono">{valStr}</span>;
    }
    if (hUpper.includes('PERSEN') || hUpper.includes('PROGRES')) {
      const suffix = valStr.endsWith('%') ? '' : '%';
      return <span className="font-black text-purple-400 font-mono">{valStr}{suffix}</span>;
    }
    
    return valStr;
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/30 shadow-inner">
      <table className="w-full text-xs text-left text-slate-350">
        <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 tracking-wider">
          <tr>
            <th className="px-4 py-3 border-b border-slate-700 w-12 font-bold text-slate-500">No.</th>
            {headers.map((h, i) => (
              <th 
                key={i} 
                className="px-4 py-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800/40 transition-colors font-bold select-none text-slate-400"
                onClick={() => handleSort(h)}
              >
                <div className="flex items-center gap-1.5">
                  {h}
                  {sortConfig.key === h ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-purple-400" /> : <ArrowDown size={12} className="text-purple-400" />
                  ) : (
                    <ArrowUpDown size={11} className="opacity-30" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {displayData.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/20 transition-colors">
              <td className="px-4 py-2.5 font-medium text-slate-500">
                {i + 1}
              </td>
              {headers.map((h, j) => (
                <td key={j} className="px-4 py-2.5 font-sans">
                  {renderCell(h, row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isTruncated && (
        <div className="px-4 py-2.5 bg-slate-950/20 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-700">
          <span className="italic opacity-80">
            {isExpanded 
              ? `Menampilkan seluruh ${data.length} baris data.` 
              : `*Menampilkan 5 dari ${data.length} baris data untuk kenyamanan membaca.`}
          </span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300 font-bold px-3 py-1 bg-purple-500/10 rounded transition-all active:scale-95"
          >
            {isExpanded ? 'Lebih Sedikit' : 'Lihat Semua'}
          </button>
        </div>
      )}
    </div>
  );
};

const MessageDataView = ({ data }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const chartConfig = React.useMemo(() => getChartConfig(data), [data]);
  
  return (
    <div className="mt-4">
      {chartConfig && (
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              viewMode === 'table' 
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 font-bold' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            <TableIcon size={13} />
            <span>Lihat Tabel</span>
          </button>
          <button 
            onClick={() => setViewMode('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              viewMode === 'chart' 
                ? 'bg-purple-600/10 border-purple-500/40 text-purple-400 font-bold' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            <BarChartIcon size={13} />
            <span>Lihat Grafik</span>
          </button>
        </div>
      )}

      {viewMode === 'table' ? (
        <MessageTable data={data} />
      ) : (
        <div className="mt-2 p-4 bg-slate-950/30 border border-slate-700/60 rounded-xl shadow-inner h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey={chartConfig.labelKey} 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: 10 }}
                itemStyle={{ fontSize: 10 }}
              />
              <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
              {chartConfig.valueKeys.map((vKey, index) => {
                const colors = ['#a78bfa', '#60a5fa', '#34d399', '#fb7185'];
                const color = colors[index % colors.length];
                return (
                  <Bar 
                    key={vKey} 
                    dataKey={vKey} 
                    fill={color} 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const CollapsibleSQL = ({ sql, explanation, confidence }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getConfidenceColor = (level) => {
    if (level === 'tinggi') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (level === 'sedang') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      <div className="flex flex-col gap-2.5">
        {explanation && (
          <p className="text-xs text-slate-400 italic bg-slate-900/30 p-2.5 rounded border border-slate-800/80 leading-relaxed">
            💡 <strong className="text-slate-350 not-italic font-bold">Tujuan Kueri:</strong> {explanation}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-slate-900/50 rounded border border-slate-750 transition-all active:scale-95"
          >
            <Code size={14} />
            <span>{isOpen ? 'Sembunyikan SQL Query' : 'Lihat SQL Query'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {confidence && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getConfidenceColor(confidence.level)}`}>
              <span>Tingkat Keyakinan: {confidence.level} ({confidence.score}%)</span>
            </div>
          )}
        </div>

        {confidence && confidence.warnings && confidence.warnings.length > 0 && (
          <div className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 px-2.5 py-2 rounded-lg leading-relaxed space-y-1">
            <div className="font-bold">⚠️ Catatan Audit AI:</div>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              {confidence.warnings.map((w, wIdx) => <li key={wIdx}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
      {isOpen && (
        <div className="mt-2 text-[10px] text-slate-400 font-mono bg-slate-900/50 p-2.5 rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          <div className="text-slate-500 font-bold mb-1">Query Executed:</div>
          <pre className="whitespace-pre-wrap text-slate-400">{sql}</pre>
        </div>
      )}
    </div>
  );
};

const ThinkingSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Memeriksa ejaan nama & wilayah (Fuzzy Matching)...",
    "Membaca DDL skema & dokumentasi aturan BPS...",
    "Menyusun kueri SQL relasional (Gemini Flash)...",
    "Memvalidasi keamanan kueri (Anti-Injection Check)...",
    "Mengeksekusi kueri & menyusun narasi ringkasan..."
  ];

  useEffect(() => {
    setCurrentStep(0);
    const intervals = [1000, 1200, 1400, 900]; // Durasi dinamis per langkah
    let step = 0;
    let timer;

    const runNextStep = () => {
      if (step < steps.length - 1) {
        timer = setTimeout(() => {
          step++;
          setCurrentStep(step);
          runNextStep();
        }, intervals[step]);
      }
    };

    runNextStep();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl rounded-tl-none max-w-[85%] shadow-lg">
      <div className="flex items-center gap-2 mb-1 pb-1.5 border-b border-slate-700/50">
        <Sparkles className="text-blue-400 animate-pulse" size={14} />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Thinking Process</span>
      </div>
      <div className="space-y-2">
        {steps.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-3 text-xs ${
                isActive ? 'text-blue-400 font-bold scale-[1.01]' : isCompleted ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center w-4 h-4 shrink-0">
                {isCompleted && <CheckCircle2 size={15} className="text-emerald-400" />}
                {isActive && <Loader2 size={13} className="animate-spin text-blue-400" />}
                {isPending && <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />}
              </div>
              <span className="text-[11px]">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TabChatSQL = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Halo! Saya asisten AI BPS Kota Malang. Silakan tanyakan apa saja mengenai data Sensus Ekonomi 2026 (misalnya target desa, capaian progres petugas, atau rincian dokumen lapangan).', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeedback = async (question, sql, msgIdx) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/v1/chat/feedback`, { question: question || 'Unknown question', sql_generated: sql || '' });
      
      setMessages(prev => prev.map((msg, idx) => 
        idx === msgIdx ? { ...msg, feedbackSent: true } : msg
      ));
    } catch (error) {
      console.error("Feedback error:", error);
      alert("Gagal mengirim laporan. Pastikan server backend menyala.");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overrideMessage = null, skipFuzzy = false, hideUserBubble = false) => {
    const userMessage = overrideMessage || input.trim();
    if (!userMessage) return;
    
    if (!hideUserBubble) {
      setMessages(prev => [...prev, { role: 'user', text: userMessage, type: 'text' }]);
      if (!overrideMessage) setInput('');
    }
    
    setIsLoading(true);

    // Kumpulkan riwayat percakapan yang berhasil dieksekusi sebelumnya
    const history = messages
      .filter(m => m.role === 'ai' && m.type === 'data' && m.sql)
      .map(m => ({ question: m.question, sql: m.sql }));

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/v1/chat`, { 
        question: userMessage,
        skip_fuzzy: skipFuzzy,
        corrected_question: overrideMessage ? userMessage : undefined,
        conversation_history: history
      });
      
      if (response.data.status === 'confirmation') {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: response.data.message, 
          correctedPrompt: response.data.corrected_prompt,
          originalPrompt: userMessage,
          type: 'confirmation' 
        }]);
      } else {
        const { text, table_data, sql, sql_explanation, suggestions, confidence } = response.data;
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: text, 
          tableData: table_data, 
          sql: sql,
          sqlExplanation: sql_explanation,
          suggestions: suggestions || [],
          confidence: confidence || { score: 100, level: 'tinggi', warnings: [] },
          question: userMessage,
          type: 'data' 
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Maaf, terjadi kesalahan saat menghubungi asisten AI BPS. Pastikan koneksi server menyala dengan baik.', 
        type: 'error' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[680px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl mt-4">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <Bot className="text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Tanya Data AI</h2>
          <p className="text-xs text-slate-400">Asisten Pintar BPS Kota Malang</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 w-full ${msg.role === 'user' ? 'max-w-[80%] flex-row-reverse' : 'max-w-[96%]'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-blue-400"/>}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                
                {msg.type === 'confirmation' && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleSend(msg.correctedPrompt, true, false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      Ya, Benar
                    </button>
                    <button 
                      onClick={() => handleSend(msg.originalPrompt, true, true)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-colors border border-slate-600 flex items-center gap-2"
                    >
                      Tidak, Lanjutkan Asli
                    </button>
                  </div>
                )}
                
                {msg.type === 'data' && msg.tableData && msg.tableData.length > 0 && (
                  <MessageDataView data={msg.tableData} />
                )}
                
                {msg.type === 'data' && msg.sql && (
                  <CollapsibleSQL sql={msg.sql} explanation={msg.sqlExplanation} confidence={msg.confidence} />
                )}
                
                {msg.role === 'ai' && msg.type === 'data' && (
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => handleFeedback(msg.question, msg.sql, idx)}
                      disabled={msg.feedbackSent}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        msg.feedbackSent 
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20 cursor-not-allowed' 
                          : 'text-slate-400 bg-slate-800 border border-slate-700 hover:text-rose-400 hover:bg-slate-800 hover:border-rose-500/50 shadow-sm'
                      }`}
                      title="Laporkan jika AI memberikan jawaban atau kueri yang salah"
                    >
                      <ThumbsDown size={14} /> {msg.feedbackSent ? 'Dilaporkan ke Admin' : 'Jawaban Salah?'}
                    </button>
                  </div>
                )}

                {msg.type === 'data' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/40 animate-fade-in">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-purple-400" />
                      <span>Pertanyaan Lanjutan:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(suggestion)}
                          className="text-[11px] text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-600/25 border border-purple-500/20 hover:border-purple-500/40 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 text-left leading-normal"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[96%] w-full">
              <div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot size={16} className="text-blue-400"/>
              </div>
              <ThinkingSteps />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya soal target, progres, atau kinerja petugas..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-xl flex items-center justify-center transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabChatSQL;
