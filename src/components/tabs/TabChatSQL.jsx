import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Table as TableIcon, Loader2 } from 'lucide-react';

const MessageTable = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  const isTruncated = data.length > 5;
  const displayData = isExpanded ? data : data.slice(0, 5);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/80">
          <tr>
            {headers.map((h, i) => <th key={i} className="px-4 py-3 border-b border-slate-700">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
              {headers.map((h, j) => <td key={j} className="px-4 py-3">{row[h] !== null ? row[h].toString() : '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {isTruncated && (
        <div className="px-4 py-3 bg-slate-800/90 flex justify-between items-center text-xs text-slate-400 border-t border-slate-700">
          <span className="italic">
            {isExpanded 
              ? `Menampilkan seluruh ${data.length} baris data.` 
              : `*Menampilkan 5 dari ${data.length} baris data untuk kenyamanan membaca.`}
          </span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 font-semibold px-3 py-1 bg-blue-500/10 rounded"
          >
            {isExpanded ? 'Lebih Sedikit' : 'Lihat Semua'}
          </button>
        </div>
      )}
    </div>
  );
};


const TabChatSQL = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Halo! Saya asisten AI BPS. Silakan tanya apa saja mengenai data Sensus Ekonomi 2026 (misalnya target desa, progres petugas, atau status dokumen).', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage, type: 'text' }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/v1/chat`, { question: userMessage });
      
      const { text, table_data, sql } = response.data;
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: text, 
        tableData: table_data, 
        sql: sql,
        type: 'data' 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Maaf, terjadi kesalahan saat menghubungi asisten AI. Pastikan server backend menyala dan API Key terkonfigurasi.', 
        type: 'error' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl mt-4">
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
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-blue-400"/>}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                
                {msg.type === 'data' && msg.tableData && msg.tableData.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold mb-2">
                      <TableIcon size={14} /> <span>Hasil Pencarian Data ({msg.tableData.length} baris)</span>
                    </div>
                    {msg.tableData && <MessageTable data={msg.tableData} />}
                  </div>
                )}
                
                {msg.type === 'data' && msg.sql && (
                  <div className="mt-3 text-[10px] text-slate-500 font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                    <span className="text-slate-600">Query Executed: </span> {msg.sql}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot size={16} className="text-blue-400"/>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 rounded-tl-none flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm animate-pulse">Menyiapkan jawaban dan menarik data...</span>
              </div>
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
            onClick={handleSend}
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
