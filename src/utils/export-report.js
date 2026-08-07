import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// =========================================================================
// 1. FUNGSI EXPORT 1: UNTUK BUKTI PEMBAYARAN (FORMAT BPS)
// =========================================================================
export const handleExportExcelBPS = async (dataPetugas, dataWilayah) => {
  if (!dataPetugas) {
    console.error("DEBUG: dataPetugas kosong!");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Beban Kerja Lapangan');

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

  for (let i = 4; i <= 7; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.font = { bold: true, size: 10, name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  let rowNumber = 1;
  let currentRowIdx = 8; 

  const listPML = dataPetugas.filter(p => p.role?.toUpperCase() === 'PML');
  const listPCL = dataPetugas.filter(p => p.role?.toUpperCase() === 'PCL');

  listPCL.forEach((pcl) => {
    if (pcl.detail_assignment && pcl.detail_assignment.length > 0) {
      pcl.detail_assignment.forEach((assign) => {
        
        let namaPML = "-";
        let emailPML = "-";
        const atasan = listPML.find(pml => 
          pml.detail_assignment && 
          pml.detail_assignment.some(pmlAssign => String(pmlAssign.assignment_code) === String(assign.assignment_code))
        );
        if (atasan) { namaPML = atasan.nama; emailPML = atasan.email; }

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

        const row = worksheet.addRow([
          rowNumber, namaPML, emailPML, pcl.nama, pcl.email, 
          namaKecamatan, namaDesa, assign.assignment_code || '-', 
          0, targetUsaha, targetUsaha, 0, realisasiTotal, realisasiTotal, 
          { formula: `IF(K${currentRowIdx}=0, 0, N${currentRowIdx}/K${currentRowIdx})`, result: targetUsaha > 0 ? realisasiTotal/targetUsaha : 0 }, 
          'Bayar/tidak dibayar'
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { size: 10, name: 'Arial' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if ([1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(colNumber)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });

        worksheet.getCell(`O${currentRowIdx}`).numFmt = '0.00%';
        rowNumber++;
        currentRowIdx++; 
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Beban_Kerja_Petugas_Lapangan_SE2026.xlsx');
};



// =========================================================================
// 2. FUNGSI EXPORT 2: UNTUK DAFTAR SLS TERFILTER (WITH PIVOT REKAP)
// =========================================================================
export const handleExportSLSFiltered = async (dataPetugasFiltered, dataPetugasAll) => {
  if (!dataPetugasFiltered || dataPetugasFiltered.length === 0) {
    alert("Tidak ada data terfilter untuk diekspor!");
    return;
  }

  const listPML = dataPetugasAll ? dataPetugasAll.filter(p => p.role?.toUpperCase() === 'PML') : [];
  const listPCL = dataPetugasFiltered ? dataPetugasFiltered.filter(p => p.role?.toUpperCase() === 'PCL') : [];

  const getTargetHarian = () => {
    const startDate = new Date('2026-06-16T00:00:00');
    const endDate = new Date('2026-08-20T23:59:59');
    const today = new Date();

    if (today < startDate) return 0;
    if (today > endDate) return 1;

    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
    return Math.min((diffDays / 66), 1); 
  };

  const targetHarianDesimal = getTargetHarian();
  const workbook = new ExcelJS.Workbook();

  // =======================================================
  // SHEET 1: LAPORAN TERFILTER (DETAIL PER SLS)
  // =======================================================
  const worksheet = workbook.addWorksheet('Laporan Terfilter');

  const headers = [
    "ID SLS", "NAMA PML", "NAMA PPL", 
    "OPEN", "DRAFT", "SUBMIT", "APROVE", "REJECTED", 
    "TARGET PRELIST", "PERSENTASE PRELIST", 
    "TARGET ASSIGNMENT", "PERSENTASE ASSIGNMENT", 
    "TARGET ALOKATOR", "PERSENTASE ALOKATOR", 
    "STATUS"
  ];
  
  worksheet.addRow(headers);

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; 
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  dataPetugasFiltered.forEach((petugas) => {
    const assignments = petugas.detail_assignment || [];

    assignments.forEach((sls) => {
      const open = sls.status_open || 0;
      const draft = sls.status_draft || 0;
      const submit = sls.status_submitted || 0;
      const approve = sls.status_approved || 0;
      const rejected = sls.status_rejected || 0;

      const targetPrelist = sls.target_prelist || 0;
      const targetAssignment = sls.target || 0; 
      const targetAlokator = sls.alokator || 0;

      const realisasi = Math.max(0, targetAssignment - open - draft);

      const persenPrelist = targetPrelist > 0 ? (realisasi / targetPrelist) : 0;
      const persenAssignment = targetAssignment > 0 ? (realisasi / targetAssignment) : 0;
      const persenAlokator = targetAlokator > 0 ? (realisasi / targetAlokator) : 0;

      let statusTarget = "Sesuai Target";
      if (persenAssignment < (targetHarianDesimal - 0.01)) { 
        statusTarget = "Dibawah Target";
      } else if (persenAssignment > (targetHarianDesimal + 0.01)) {
        statusTarget = "Diatas Target";
      }

      let namaPML = "-";
      let namaPPL = "-";

      if (petugas.role?.toUpperCase() === 'PML') {
        namaPML = petugas.nama; 
        const bawahan = listPCL.find(pcl => pcl.detail_assignment?.some(a => String(a.assignment_code) === String(sls.assignment_code)));
        if (bawahan) namaPPL = bawahan.nama;
      } else {
        namaPPL = petugas.nama; 
        const atasan = listPML.find(pml => pml.detail_assignment?.some(a => String(a.assignment_code) === String(sls.assignment_code)));
        if (atasan) namaPML = atasan.nama;
      }

      const rowData = [
        sls.assignment_code || '-', 
        namaPML,                    
        namaPPL,                    
        open,                       
        draft,                      
        submit,                     
        approve,                    
        rejected,                   
        targetPrelist,              
        persenPrelist,              
        targetAssignment,           
        persenAssignment,           
        targetAlokator,             
        persenAlokator,             
        statusTarget                
      ];

      const row = worksheet.addRow(rowData);

      row.getCell(10).numFmt = '0.00%'; 
      row.getCell(12).numFmt = '0.00%'; 
      row.getCell(14).numFmt = '0.00%'; 
      
      row.eachCell(cell => { 
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; 
      });
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLen = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value) {
        const len = cell.value.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    column.width = maxLen + 3; 
  });


  // =======================================================
  // SHEET 2: REKAP PER PCL (PIVOT)
  // =======================================================
  const wsRekap = workbook.addWorksheet('Rekap Per PCL');
  
  // 🌟 PERBAIKAN: Menyelaraskan Header Pivot dengan Triple Progress Target
  const headersRekap = [
    "NAMA PCL", "NAMA PML", "JUMLAH SLS", 
    "TOTAL OPEN", "TOTAL DRAFT", "TOTAL SUBMIT", "TOTAL APPROVE", "TOTAL REJECTED",
    "TOTAL REALISASI", 
    "TARGET PRELIST", "PERSENTASE PRELIST", 
    "TARGET ASSIGNMENT", "PERSENTASE ASSIGNMENT", 
    "TARGET ALOKATOR", "PERSENTASE ALOKATOR"
  ];
  
  wsRekap.addRow(headersRekap);
  wsRekap.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; 
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  listPCL.forEach(pcl => {
    let totalSLS = 0;
    
    let totalOpen = 0;
    let totalDraft = 0;
    let totalSubmit = 0;
    let totalApprove = 0;
    let totalRejected = 0;

    let totalPrelist = 0;
    let totalAssign = 0;
    let totalAlokator = 0;
    let totalRealisasi = 0;
    let namaPML = "-";

    const assignments = pcl.detail_assignment || [];
    assignments.forEach(sls => {
      totalSLS += 1;
      
      const open = sls.status_open || 0;
      const draft = sls.status_draft || 0;
      const submit = sls.status_submitted || 0;
      const approve = sls.status_approved || 0;
      const rejected = sls.status_rejected || 0;

      totalOpen += open;
      totalDraft += draft;
      totalSubmit += submit;
      totalApprove += approve;
      totalRejected += rejected;

      totalPrelist += (sls.target_prelist || 0);
      totalAssign += (sls.target || 0);
      totalAlokator += (sls.alokator || 0);

    });

    // 🌟 KALKULASI REALISASI (Total Target Assignment - Open - Draft)
    totalRealisasi = Math.max(0, totalAssign - totalOpen - totalDraft);

    // 🌟 KALKULASI TRIPLE PERSENTASE
    const persenPrelist = totalPrelist > 0 ? (totalRealisasi / totalPrelist) : 0;
    const persenAssignment = totalAssign > 0 ? (totalRealisasi / totalAssign) : 0;
    const persenAlokator = totalAlokator > 0 ? (totalRealisasi / totalAlokator) : 0;

    // Cari PML
    if (namaPML === "-") {
      const atasan = listPML.find(pml => pml.detail_assignment?.some(a => String(a.assignment_code) === String(assignments[0]?.assignment_code)));
      if (atasan) namaPML = atasan.nama;
    }

    const row = wsRekap.addRow([
      pcl.nama, namaPML, totalSLS, 
      totalOpen, totalDraft, totalSubmit, totalApprove, totalRejected,
      totalRealisasi,
      totalPrelist, persenPrelist,
      totalAssign, persenAssignment,
      totalAlokator, persenAlokator
    ]);

    // Format persentase ada di Kolom 11, 13, 15 (K, M, O)
    row.getCell(11).numFmt = '0.00%';
    row.getCell(13).numFmt = '0.00%';
    row.getCell(15).numFmt = '0.00%';

    row.eachCell(cell => { 
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; 
      cell.alignment = { vertical: 'middle' };
    });
  });

  wsRekap.columns.forEach((column) => {
    let maxLen = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value) {
        const len = cell.value.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    column.width = maxLen + 3; 
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const tgl = new Date().toISOString().split('T')[0];
  saveAs(blob, `Report_Filter_${tgl}.xlsx`);
};