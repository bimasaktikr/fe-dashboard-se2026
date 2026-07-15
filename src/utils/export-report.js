import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const handleExportExcelBPS = async (dataPetugas, dataWilayah) => {
  if (!dataPetugas) {
    console.error("DEBUG: dataPetugas kosong!");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Beban Kerja Lapangan');

  // --- Header ---
  worksheet.addRow(['BEBAN KERJA PETUGAS LAPANGAN SE 2026']);
  worksheet.addRow(['BPS KOTA MALANG PROVINSI JAWA TIMUR']);
  worksheet.addRow([]);
  
  worksheet.addRow([
    'No', 'Petugas Pemeriksa Lapangan (PML)', '', 'Petugas Pendataan Lapangan (PPL)', '', 
    '[Kode] KECAMATAN', '[Kode] KELURAHAN', '[Kode] SLS/SUB SLS', 
    'Target Muatan Pada Prelist Awal', '', '', 'Realisasi', '', '', 'Persentase (%)', 'Keterangan'
  ]);

  worksheet.addRow([
    '', 'Nama ', 'Username SOBAT', 'Nama ', 'Username SOBAT', 
    '', '', '', 'Keluarga ', 'Usaha', 'Jumlah', 'Keluarga ', 'Usaha', 'Jumlah', '', ''
  ]);

  worksheet.addRow([]);
  worksheet.addRow(['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', '(14)', "(15)=(14)/(11)", '(16)']);

  const mergeRanges = ['A4:A6', 'B4:C4', 'D4:E4', 'F4:F6', 'G4:G6', 'H4:H6', 'I4:K4', 'L4:N4', 'O4:O6', 'P4:P6'];
  mergeRanges.forEach(range => worksheet.mergeCells(range));

  // --- Styling Header ---
  for (let i = 4; i <= 7; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.font = { bold: true, size: 10, name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  // --- Isi Data ---
  let rowNumber = 1;
  let currentRowIdx = 8; 

  const listPML = dataPetugas.filter(p => p.role?.toUpperCase() === 'PML');
  const listPCL = dataPetugas.filter(p => p.role?.toUpperCase() === 'PCL');

  listPCL.forEach((pcl) => {
    if (pcl.detail_assignment && pcl.detail_assignment.length > 0) {
      pcl.detail_assignment.forEach((assign) => {
        
        // 1. Pencarian PML
        let namaPML = "-";
        let emailPML = "-";
        const atasan = listPML.find(pml => 
          pml.detail_assignment && 
          pml.detail_assignment.some(pmlAssign => String(pmlAssign.assignment_code) === String(assign.assignment_code))
        );
        if (atasan) { namaPML = atasan.nama; emailPML = atasan.email; }

        // 2. Pencarian Wilayah
        let namaKecamatan = "-";
        let namaDesa = "-";
        if (dataWilayah && Array.isArray(dataWilayah)) {
          const infoWilayah = dataWilayah.find(w => String(w.iddesa).trim() === String(assign.id_desa || '').trim());
          if (infoWilayah) {
            namaKecamatan = infoWilayah.nmkec || '-';
            namaDesa = infoWilayah.nmdesa || '-';
          }
        }

        const targetUsaha = assign.target || 0;
        const realisasiTotal = (assign.status_approved || 0) + (assign.status_submitted || 0) + (assign.status_rejected || 0);

        // 3. Tambahkan Baris (menggunakan currentRowIdx untuk referensi rumus Excel)
        const row = worksheet.addRow([
          rowNumber, namaPML, emailPML, pcl.nama, pcl.email, 
          namaKecamatan, namaDesa, assign.assignment_code || '-', 
          0, targetUsaha, targetUsaha, 0, realisasiTotal, realisasiTotal, 
          { formula: `IF(K${currentRowIdx}=0, 0, N${currentRowIdx}/K${currentRowIdx})`, result: targetUsaha > 0 ? realisasiTotal/targetUsaha : 0 }, 
          'Bayar/tidak dibayar'
        ]);

        // Styling Baris
        row.eachCell((cell, colNumber) => {
          cell.font = { size: 10, name: 'Arial' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if ([1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(colNumber)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });

        worksheet.getCell(`O${currentRowIdx}`).numFmt = '0.00%';
        rowNumber++;
        currentRowIdx++; // Increment baris Excel dengan benar
      });
    }
  });

  // Export File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Beban_Kerja_Petugas_Lapangan_SE2026.xlsx');
};