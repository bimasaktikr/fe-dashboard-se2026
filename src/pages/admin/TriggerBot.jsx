import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, StopCircle } from 'lucide-react';

export default function TriggerBot() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const startBot = () => {
    setIsStreaming(true);
    setLogs(["[SYSTEM] Memulai Bot FASIH... Menghubungkan ke API..."]);
    
    const eventSource = new EventSource('http://localhost:8000/api/v1/admin/trigger-bot-stream');
    
    eventSource.onmessage = (event) => {
      const newLog = event.data;
      if (newLog === '[DONE]') {
        setLogs(prev => [...prev, "[SYSTEM] Proses selesai."]);
        eventSource.close();
        setIsStreaming(false);
      } else {
        setLogs(prev => [...prev, newLog]);
      }
    };
    
    eventSource.onerror = () => {
      setLogs(prev => [...prev, "[ERROR] Koneksi terputus atau server gagal memproses."]);
      eventSource.close();
      setIsStreaming(false);
    };
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="p-8 max-w-5xl h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Trigger Bot FASIH</h1>
          <p className="text-slate-500 mt-2">Jalankan mesin penarik data Playwright langsung dari browser.</p>
        </div>
        
        <button
          onClick={startBot}
          disabled={isStreaming}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
            isStreaming ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-lg'
          }`}
        >
          {isStreaming ? (
            <><Loader2 className="animate-spin" size={20} /> Sedang Berjalan...</>
          ) : (
            <><Play size={20} /> JALANKAN MESIN</>
          )}
        </button>
      </div>

      <div className="flex-1 bg-[#0f172a] rounded-2xl border border-slate-700 p-6 flex flex-col min-h-[500px]">
        <div className="text-slate-400 font-mono text-sm mb-4 border-b border-slate-700 pb-2">
          Real-time Ingestion Stream Log
        </div>
        
        <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2">
          {logs.length === 0 ? (
            <div className="text-emerald-500/50 italic">Menunggu instruksi eksekusi...</div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i} 
                className={`${
                  log.includes('[ERROR]') ? 'text-rose-400' :
                  log.includes('[SYSTEM]') ? 'text-blue-400 font-bold' :
                  'text-emerald-400'
                }`}
              >
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
