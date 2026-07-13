import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { CalendarDays, TrendingUp } from 'lucide-react';

export default function TabHarian({ chartData }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700 p-6 shadow-2xl">
      {/* HEADER TAB */}
      <div className="flex items-center gap-4 mb-8 border-b border-slate-700/80 pb-5">
        <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <CalendarDays className="text-indigo-400 h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">Grafik Tren Progres Harian</h2>
          <p className="text-sm text-slate-400 mt-1">Pemantauan laju kecepatan pencacahan dan validasi pengawas (Time-Series)</p>
        </div>
      </div>

      {/* RENDER GRAFIK RECHARTS */}
      {chartData && chartData.length > 0 ? (
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              {/* DEFINISI WARNA GRADIENT UNTUK AREA BAWAH GARIS */}
              <defs>
                <linearGradient id="colorAppv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSubm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRejc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              
              <XAxis 
                dataKey="tanggal" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickMargin={12} 
                tick={{ fill: '#94a3b8' }}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)}
                tick={{ fill: '#94a3b8' }}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              
              <Legend 
                wrapperStyle={{ paddingTop: '25px' }} 
                iconType="circle"
              />
              
              {/* GARIS 1: APPROVED (HIJAU) */}
              <Area 
                type="monotone" 
                dataKey="Approved" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorAppv)" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              
              {/* GARIS 2: SUBMITTED (KUNING/AMBER) */}
              <Area 
                type="monotone" 
                dataKey="Submitted" 
                stroke="#fbbf24" 
                fillOpacity={1} 
                fill="url(#colorSubm)" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
              />

              {/* GARIS 3: REJECTED (MERAH) */}
              <Area 
                type="monotone" 
                dataKey="Rejected" 
                stroke="#f43f5e" 
                fillOpacity={1} 
                fill="url(#colorRejc)" 
                strokeWidth={2}
              />

              {/* GARIS 4: DRAFT (ABU-ABU PUTUS-PUTUS) - Tidak pakai fill agar bersih */}
              <Area 
                type="monotone" 
                dataKey="Draft" 
                stroke="#94a3b8" 
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* FALLBACK JIKA DATA KOSONG */
        <div className="h-[450px] flex flex-col items-center justify-center text-slate-500 font-medium border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
          <TrendingUp className="h-12 w-12 text-slate-600 mb-3" />
          <p>Belum ada rekaman data historis harian dari server.</p>
        </div>
      )}
    </div>
  );
}