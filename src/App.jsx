import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardCard from './components/DashboardCard';

function App() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ target: 0, selesai: 0, sisa: 0 });

  useEffect(() => {
    // Menarik data dari API FastAPI
    axios.get('http://127.0.0.1:8000/api/v1/dashboard/summary')
      .then(res => {
        const rawData = res.data.data;
        setData(rawData);
        
        // Hitung total dari array
        const totalTarget = rawData.reduce((acc, curr) => acc + curr.target, 0);
        const totalSelesai = rawData.reduce((acc, curr) => acc + curr.selesai, 0);
        const totalSisa = rawData.reduce((acc, curr) => acc + curr.sisa, 0);
        
        setStats({ target: totalTarget, selesai: totalSelesai, sisa: totalSisa });
      })
      .catch(err => console.error("Gagal tarik data:", err));
  }, []);

  return (
    <div className="p-8 min-h-screen bg-slate-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Command Center SE2026</h1>
        <p className="text-slate-500">Monitoring Real-time Progress Enumerasi</p>
      </header>

      {/* METRIK KARTU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Total Target" value={stats.target} color="border-blue-500" />
        <DashboardCard title="Selesai (Submitted)" value={stats.selesai} color="border-green-500" />
        <DashboardCard title="Sisa Beban (Open)" value={stats.sisa} color="border-amber-500" />
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-slate-400">
              <th className="p-4">Kecamatan</th>
              <th className="p-4">Desa</th>
              <th className="p-4">Progres</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50">
                <td className="p-4">{item.kecamatan}</td>
                <td className="p-4">{item.desa}</td>
                <td className="p-4 font-bold">{item.progres_persen}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;