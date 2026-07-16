export type WorkerBoxBalanceLine = {
  id: string;
  periodCode: string;
  fromDate: string;
  toDate: string;
  workerCode: string;
  workerName: string;
  stageCode: string;
  stageName: string;
  materialGroup: "gold" | "silver" | "platinum";
  metalCode: "AU" | "AG" | "PT";
  materialName: string;
  goldAgeCode: string;
  goldAge: number;
  rowGroup: "normal" | "debt" | "total";
  debtStatus: "none" | "treo_no" | "resolved";
  sourceFile: string;
  sourceSheet: string;
  sourceRowIndex: number;
  sourceJournalFilter: string;
  openingPowderGram: number;
  openingRawGram: number;
  openingConvertedGram: number;
  importPowderGram: number;
  importRawGram: number;
  importConvertedGram: number;
  exportPowderGram: number;
  exportRawGram: number;
  exportConvertedGram: number;
  bookClosingPowderGram: number;
  bookClosingRawGram: number;
  bookClosingConvertedGram: number;
  physicalBtpGram: number;
  physicalNvlGram: number;
  physicalScrapGram: number;
  physicalTotalRawGram: number;
  physicalConvertedGram: number;
  diffRawGram: number;
  diffConvertedGram: number;
  machinePowderRawGram: number;
  machinePowderConvertedGram: number;
  reviewLossConvertedGram: number;
  depositNormConvertedGram: number;
  riskDiffConvertedGram: number;
  reviewStatus: "pending" | "matched" | "risk";
  comment: string;
  xdcStatus: string;
  ndcStatus: string;
};

export const workerBoxPeriods = [
  { code: "2026-06", label: "Tháng 06/2026", fromDate: "2026-06-01", toDate: "2026-06-17", source: "005-b-2-bc-tonhoptho-t06-2026.csv" },
  { code: "2026-05", label: "Tháng 05/2026", fromDate: "2026-05-01", toDate: "2026-05-30", source: "012-b-2-bc-tonhoptho-t05-2026.csv" },
  { code: "2026-02", label: "Tháng 02/2026", fromDate: "2026-02-01", toDate: "2026-02-06", source: "009-b-2-bc-tonhoptho-t02-2026.csv" }
];

export const workerBoxBalanceLines: WorkerBoxBalanceLine[] = [
  {
    id: "wb-202606-001",
    periodCode: "2026-06",
    fromDate: "2026-06-01",
    toDate: "2026-06-17",
    workerCode: "TD003",
    workerName: "Lê Văn Tùng",
    stageCode: "CK",
    stageName: "Cán kéo",
    materialGroup: "gold",
    metalCode: "AU",
    materialName: "Vàng 18K",
    goldAgeCode: "18K",
    goldAge: 0.75,
    rowGroup: "debt",
    debtStatus: "treo_no",
    sourceFile: "005-b-2-bc-tonhoptho-t06-2026.csv",
    sourceSheet: "B.2.BC.TONHOPTHO T06.2026",
    sourceRowIndex: 35,
    sourceJournalFilter: "004-a-nhat-ky-sx-filter-t06-2026.csv",
    openingPowderGram: 0.18,
    openingRawGram: 12.46,
    openingConvertedGram: 9.35,
    importPowderGram: 0.05,
    importRawGram: 18.25,
    importConvertedGram: 13.69,
    exportPowderGram: 0.02,
    exportRawGram: 17.98,
    exportConvertedGram: 13.49,
    bookClosingPowderGram: 0.21,
    bookClosingRawGram: 12.73,
    bookClosingConvertedGram: 9.55,
    physicalBtpGram: 1.15,
    physicalNvlGram: 11.38,
    physicalScrapGram: 0.08,
    physicalTotalRawGram: 12.61,
    physicalConvertedGram: 9.46,
    diffRawGram: -0.12,
    diffConvertedGram: -0.09,
    machinePowderRawGram: 0.03,
    machinePowderConvertedGram: 0.02,
    reviewLossConvertedGram: 0.18,
    depositNormConvertedGram: 0.12,
    riskDiffConvertedGram: 0.06,
    reviewStatus: "risk",
    comment: "Cần đối soát bột trên máy và tồn thực tế",
    xdcStatus: "pending",
    ndcStatus: "pending"
  },
  {
    id: "wb-202606-002",
    periodCode: "2026-06",
    fromDate: "2026-06-01",
    toDate: "2026-06-17",
    workerCode: "KTL02",
    workerName: "Lương Trí Hiển",
    stageCode: "NAU",
    stageName: "Nấu chế nguyên liệu",
    materialGroup: "gold",
    metalCode: "AU",
    materialName: "Nguyên liệu vàng 24K",
    goldAgeCode: "24K",
    goldAge: 0.9999,
    rowGroup: "debt",
    debtStatus: "treo_no",
    sourceFile: "005-b-2-bc-tonhoptho-t06-2026.csv",
    sourceSheet: "B.2.BC.TONHOPTHO T06.2026",
    sourceRowIndex: 32,
    sourceJournalFilter: "004-a-nhat-ky-sx-filter-t06-2026.csv",
    openingPowderGram: 0,
    openingRawGram: 4.26,
    openingConvertedGram: 4.26,
    importPowderGram: 0,
    importRawGram: 158.02,
    importConvertedGram: 158,
    exportPowderGram: 0,
    exportRawGram: 153.76,
    exportConvertedGram: 153.74,
    bookClosingPowderGram: 0,
    bookClosingRawGram: 8.52,
    bookClosingConvertedGram: 8.52,
    physicalBtpGram: 0,
    physicalNvlGram: 8.5,
    physicalScrapGram: 0,
    physicalTotalRawGram: 8.5,
    physicalConvertedGram: 8.5,
    diffRawGram: -0.02,
    diffConvertedGram: -0.02,
    machinePowderRawGram: 0,
    machinePowderConvertedGram: 0,
    reviewLossConvertedGram: 0.02,
    depositNormConvertedGram: 0.03,
    riskDiffConvertedGram: -0.01,
    reviewStatus: "matched",
    comment: "Dữ liệu gần khớp",
    xdcStatus: "done",
    ndcStatus: "done"
  },
  {
    id: "wb-202605-001",
    periodCode: "2026-05",
    fromDate: "2026-05-01",
    toDate: "2026-05-30",
    workerCode: "AN001",
    workerName: "Nguyễn Văn An",
    stageCode: "CD",
    stageName: "Cán dát",
    materialGroup: "platinum",
    metalCode: "PT",
    materialName: "Platinum 900",
    goldAgeCode: "PT900",
    goldAge: 0.9,
    rowGroup: "normal",
    debtStatus: "none",
    sourceFile: "012-b-2-bc-tonhoptho-t05-2026.csv",
    sourceSheet: "B.2.BC.TONHOPTHO T05.2026",
    sourceRowIndex: 43,
    sourceJournalFilter: "003-a-nhat-ky-sx-filter-t05-2026.csv",
    openingPowderGram: 0.05,
    openingRawGram: 6.8,
    openingConvertedGram: 6.12,
    importPowderGram: 0.42,
    importRawGram: 41.5,
    importConvertedGram: 37.35,
    exportPowderGram: 0.21,
    exportRawGram: 39.86,
    exportConvertedGram: 35.87,
    bookClosingPowderGram: 0.26,
    bookClosingRawGram: 8.44,
    bookClosingConvertedGram: 7.6,
    physicalBtpGram: 0.35,
    physicalNvlGram: 7.98,
    physicalScrapGram: 0.04,
    physicalTotalRawGram: 8.37,
    physicalConvertedGram: 7.53,
    diffRawGram: -0.07,
    diffConvertedGram: -0.07,
    machinePowderRawGram: 0.02,
    machinePowderConvertedGram: 0.02,
    reviewLossConvertedGram: 1.22,
    depositNormConvertedGram: 1.15,
    riskDiffConvertedGram: 0.07,
    reviewStatus: "pending",
    comment: "Chờ xác nhận tồn thực tế",
    xdcStatus: "pending",
    ndcStatus: "pending"
  },
  {
    id: "wb-202606-003",
    periodCode: "2026-06",
    fromDate: "2026-06-01",
    toDate: "2026-06-17",
    workerCode: "KH001",
    workerName: "Trần Minh Khôi",
    stageCode: "DUC",
    stageName: "Đúc",
    materialGroup: "gold",
    metalCode: "AU",
    materialName: "Vàng 18K",
    goldAgeCode: "18K",
    goldAge: 0.75,
    rowGroup: "normal",
    debtStatus: "none",
    sourceFile: "005-b-2-bc-tonhoptho-t06-2026.csv",
    sourceSheet: "B.2.BC.TONHOPTHO T06.2026",
    sourceRowIndex: 43,
    sourceJournalFilter: "004-a-nhat-ky-sx-filter-t06-2026.csv",
    openingPowderGram: 0.04,
    openingRawGram: 6.12,
    openingConvertedGram: 4.59,
    importPowderGram: 0.08,
    importRawGram: 18.25,
    importConvertedGram: 13.69,
    exportPowderGram: 0.03,
    exportRawGram: 17.98,
    exportConvertedGram: 13.49,
    bookClosingPowderGram: 0.09,
    bookClosingRawGram: 6.39,
    bookClosingConvertedGram: 4.79,
    physicalBtpGram: 0.4,
    physicalNvlGram: 5.96,
    physicalScrapGram: 0.02,
    physicalTotalRawGram: 6.38,
    physicalConvertedGram: 4.78,
    diffRawGram: -0.01,
    diffConvertedGram: -0.01,
    machinePowderRawGram: 0.01,
    machinePowderConvertedGram: 0.01,
    reviewLossConvertedGram: 0.19,
    depositNormConvertedGram: 0.2,
    riskDiffConvertedGram: -0.01,
    reviewStatus: "matched",
    comment: "Đã kiểm tra với nhật ký xuất nhập",
    xdcStatus: "done",
    ndcStatus: "done"
  },
  {
    id: "wb-202606-004",
    periodCode: "2026-06",
    fromDate: "2026-06-01",
    toDate: "2026-06-17",
    workerCode: "PH002",
    workerName: "Phạm Quốc Huy",
    stageCode: "HT",
    stageName: "Hoàn thiện",
    materialGroup: "silver",
    metalCode: "AG",
    materialName: "Bạc 92.5",
    goldAgeCode: "BAC92.5",
    goldAge: 0.925,
    rowGroup: "normal",
    debtStatus: "none",
    sourceFile: "005-b-2-bc-tonhoptho-t06-2026.csv",
    sourceSheet: "B.2.BC.TONHOPTHO T06.2026",
    sourceRowIndex: 59,
    sourceJournalFilter: "004-a-nhat-ky-sx-filter-t06-2026.csv",
    openingPowderGram: 0.02,
    openingRawGram: 9.8,
    openingConvertedGram: 9.06,
    importPowderGram: 0.13,
    importRawGram: 76.2,
    importConvertedGram: 70.49,
    exportPowderGram: 0.08,
    exportRawGram: 75.91,
    exportConvertedGram: 70.22,
    bookClosingPowderGram: 0.07,
    bookClosingRawGram: 10.09,
    bookClosingConvertedGram: 9.33,
    physicalBtpGram: 0.5,
    physicalNvlGram: 9.46,
    physicalScrapGram: 0.05,
    physicalTotalRawGram: 10.01,
    physicalConvertedGram: 9.26,
    diffRawGram: -0.08,
    diffConvertedGram: -0.07,
    machinePowderRawGram: 0.03,
    machinePowderConvertedGram: 0.03,
    reviewLossConvertedGram: 0.16,
    depositNormConvertedGram: 0.1,
    riskDiffConvertedGram: 0.06,
    reviewStatus: "pending",
    comment: "Chờ NDC xác nhận tồn thực tế cuối kỳ",
    xdcStatus: "done",
    ndcStatus: "pending"
  }
];

export const workerBoxSchemaFields = [
  "period_code",
  "worker_code",
  "worker_name",
  "stage_code",
  "stage_name",
  "material_group",
  "metal_code",
  "material_name",
  "gold_age_code",
  "gold_age",
  "row_group",
  "debt_status",
  "source_file",
  "source_sheet",
  "source_row_index",
  "source_journal_filter",
  "opening_powder_gram",
  "opening_raw_gram",
  "opening_converted_gram",
  "import_powder_gram",
  "import_raw_gram",
  "import_converted_gram",
  "export_powder_gram",
  "export_raw_gram",
  "export_converted_gram",
  "book_closing_powder_gram",
  "book_closing_raw_gram",
  "book_closing_converted_gram",
  "physical_btp_gram",
  "physical_nvl_gram",
  "physical_scrap_gram",
  "physical_total_raw_gram",
  "physical_converted_gram",
  "diff_raw_gram",
  "diff_converted_gram",
  "machine_powder_raw_gram",
  "machine_powder_converted_gram",
  "review_loss_converted_gram",
  "deposit_norm_converted_gram",
  "risk_diff_converted_gram",
  "review_status",
  "comment",
  "xdc_status",
  "ndc_status"
];
