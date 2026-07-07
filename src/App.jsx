import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import UserDashboard from './pages/UserDashboard';
import AdminLayout from './components/AdminLayout';

// Import Admin Features
import UploadWilayah from './pages/admin/UploadWilayah';
import UploadPetugas from './pages/admin/UploadPetugas';
import UploadHistoris from './pages/admin/UploadHistoris';
import TriggerBot from './pages/admin/TriggerBot';
import AITraining from './pages/admin/AITraining';
import TambahPetugas from './pages/admin/TambahPetugas';
import TransferPetugas from './pages/admin/TransferPetugas';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Utama - User Dashboard */}
        <Route path="/" element={<UserDashboard />} />

        {/* Route Admin - Dibungkus AdminLayout untuk Sidebar & Login */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="upload-wilayah" replace />} />
          <Route path="upload-wilayah" element={<UploadWilayah />} />
          <Route path="upload-petugas" element={<UploadPetugas />} />
          <Route path="tambah-petugas" element={<TambahPetugas />} />
          <Route path="transfer-petugas" element={<TransferPetugas />} />
          <Route path="historis" element={<UploadHistoris />} />
          <Route path="trigger-bot" element={<TriggerBot />} />
          <Route path="ai-training" element={<AITraining />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
