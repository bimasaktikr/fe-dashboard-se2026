export default function DashboardCard({ title, value, icon, color, subtext }) {
    return (
    <div className={`p-5 rounded-2xl border ${color} shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <div className="opacity-90">{icon}</div>
      </div>
      <div>
        {/* Angka Utama */}
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {value}
        </div>
        {/* 🌟 LOGIKA BARU: Render Sub-teks Persentase Jika Tersedia */}
        {subtext && (
          <div className="text-xs font-medium font-mono opacity-60">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}