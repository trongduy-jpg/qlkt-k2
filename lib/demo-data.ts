export type Status = string;

export type ProductionOrder = {
  id: string;
  orderId?: string;
  code: string;
  sku: string;
  productName?: string;
  material: string;
  worker: string;
  stage: string;
  stageStatus?: string;
  destination?: string;
  occurredDate?: string;
  documentNo?: string;
  documentInNo?: string;
  documentLineNo?: string;
  movementType?: "issue" | "return" | "transfer" | "adjustment";
  qtyPiece?: number;
  issued: number;
  returned: number;
  powder: number;
  transferred?: number;
  lossPeriod?: string;
  nxtPeriod?: string;
  goldAge?: number;
  sourceMaterialName?: string;
  nxtLinkCode?: string;
  sourceName?: string;
  importSource?: string;
  exportSource?: string;
  materialType?: string;
  convertedIssueWeight?: number;
  convertedReturnWeight?: number;
  loss: number;
  status: Status;
};

export const kpis = [
  { label: "Giá 24K đã duyệt", value: "15.407.000", unit: "VND/chỉ", trend: "Kỳ 05/2026" },
  { label: "NVL treo nợ", value: "128,46", unit: "gram", trend: "+14,2g trong tuần" },
  { label: "Hao hụt vượt", value: "2.033.927", unit: "VND", trend: "TD003 - Cán kéo" },
  { label: "LSX cần đối soát", value: "18", unit: "lệnh", trend: "6 lệnh quá 3 ngày" }
];

export const productionOrders: ProductionOrder[] = [
  {
    id: "mov-001",
    code: "DHAG-26/03/02",
    sku: "BI50416W",
    material: "Vàng 18K",
    worker: "Lê Văn Tùng",
    stage: "Cán kéo",
    issued: 23,
    returned: 22.89,
    powder: 0,
    loss: 0.11,
    status: "Xác định" as Status
  },
  {
    id: "mov-002",
    code: "DHAG-26/05/18",
    sku: "PT900-PD",
    material: "Platinum 900",
    worker: "Nguyễn Văn An",
    stage: "Cán dát",
    issued: 41.5,
    returned: 39.86,
    powder: 0.42,
    loss: 1.22,
    status: "Treo nợ" as Status
  },
  {
    id: "mov-003",
    code: "DHAG-26/06/11",
    sku: "RG750Y",
    material: "Vàng 18K",
    worker: "Trần Minh Khôi",
    stage: "Đúc",
    issued: 18.25,
    returned: 17.98,
    powder: 0.08,
    loss: 0.19,
    status: "Đang xử lý" as Status
  },
  {
    id: "mov-004",
    code: "DHAG-26/06/22",
    sku: "BC925",
    material: "Bạc 92.5",
    worker: "Phạm Quốc Huy",
    stage: "Hoàn thiện",
    issued: 76.2,
    returned: 75.91,
    powder: 0.13,
    loss: 0.16,
    status: "Đã chốt" as Status
  }
];

export const priceRows = [
  { metal: "Vàng 24K", source: "Giá mua bình quân", purity: "99.99%", value: "154.067.000 VND/lượng", status: "Đã duyệt" },
  { metal: "Vàng 18K", source: "Quy đổi hàm lượng", purity: "75.00%", value: "11.555.250 VND/chỉ", status: "Đã duyệt" },
  { metal: "PT900", source: "90% PT + 10% PD + thuế PD", purity: "90.00%", value: "6.068.000 VND/chỉ", status: "Chờ duyệt" },
  { metal: "Bạc 92.5", source: "Daily Metal Price", purity: "92.50%", value: "Theo kỳ", status: "Nháp" }
];

export const alerts = [
  "6 lệnh sản xuất treo nợ quá 3 ngày cần KCP đối soát.",
  "PT900-PD đang chờ duyệt giá trước khi tính bồi thường.",
  "Giao dịch sửa trọng lượng sau trạng thái Xác định phải ghi audit log.",
  "Cần nhập bột cuối tháng để giảm trừ hao hụt công đoạn cán kéo."
];

export const modules = [
  { name: "Dashboard quản trị", desc: "Tổng quan giá, treo nợ, hao hụt vượt và cảnh báo vận hành." },
  { name: "Lệnh sản xuất", desc: "Theo dõi LSX, mã hàng, thợ phụ trách, công đoạn và trạng thái." },
  { name: "Nhật ký NVL", desc: "Ghi nhận xuất, nhập, bột hoàn trả, QC và hao hụt thực tế." },
  { name: "Tồn hộp thợ", desc: "Đối soát tồn sổ sách, tồn thực tế, chênh lệch và rủi ro theo thợ." },
  { name: "Giá & định mức", desc: "Quản lý giá vàng, PT/PD, tỷ giá, định mức hao hụt theo công đoạn." },
  { name: "Quyết toán", desc: "Quy đổi 99.99, tính hao hụt vượt và bồi thường theo kỳ." }
];
