export type SheetModuleBlueprint = {
  name: string;
  replaces: string[];
  purpose: string;
  coreFields: string[];
  tables: string[];
  buildPriority: "P1" | "P2" | "P3";
};

export type SchemaTableBlueprint = {
  name: string;
  purpose: string;
  fields: string[];
};

export const sheetSourceStats = {
  spreadsheets: 13,
  tabs: 236,
  sourcePath: "data/qlkt-google-sheets-export-20260710T065019Z-2-001/qlkt-google-sheets-export"
};

export const sheetModuleBlueprints: SheetModuleBlueprint[] = [
  {
    name: "Đơn hàng & tiến độ",
    replaces: [
      "05 - Theo dõi tiến độ đơn hàng",
      "07 - Kế hoạch sản xuất TLKT",
      "04 - Trạng thái NVL và đơn hàng"
    ],
    purpose: "Quản lý PO, đơn hàng, mã sản phẩm, số lượng, deadline, tình trạng giao hàng và cảnh báo trễ hạn.",
    coreFields: [
      "Số PO",
      "Mã đơn hàng",
      "Cửa hàng",
      "Khách hàng",
      "Mã sản phẩm",
      "Tên sản phẩm",
      "Loại vàng/NVL",
      "Số lượng đặt",
      "Trọng lượng",
      "Deadline",
      "Đã giao",
      "Còn lại",
      "Trạng thái"
    ],
    tables: ["sales_orders", "sales_order_items", "products", "customers", "stores"],
    buildPriority: "P1"
  },
  {
    name: "Kế hoạch sản xuất",
    replaces: ["03 - Kế hoạch sản xuất ngày L3", "07 - Kế hoạch sản xuất 2026 TLKT"],
    purpose: "Lập kế hoạch theo ngày, nhân viên, công đoạn, khối lượng kế hoạch và kết quả thực tế.",
    coreFields: [
      "Mã nhân viên",
      "Tên nhân viên",
      "Ngày",
      "Mã công việc",
      "Mã công đoạn",
      "Tên công đoạn",
      "Mã sản phẩm",
      "Đơn hàng",
      "Thời gian kế hoạch",
      "Thời gian thực tế",
      "Khối lượng kế hoạch",
      "Khối lượng hoàn thành"
    ],
    tables: ["production_orders", "production_tasks", "workers", "process_stages", "products"],
    buildPriority: "P1"
  },
  {
    name: "Đề xuất & cấp NVL",
    replaces: ["06 - Đề xuất NVL 2026", "09 - Kế hoạch NVL đơn hàng", "04 - Kế hoạch NVL"],
    purpose: "Tính nhu cầu NVL theo đơn hàng, theo dõi đã cấp, còn lại, cần bổ cấp và trạng thái duyệt.",
    coreFields: [
      "Mã ĐH",
      "PO",
      "Cửa hàng",
      "Khách hàng",
      "Loại NVL",
      "Tuổi vàng",
      "TL sản xuất",
      "TL NL quay đầu",
      "TL NVL đề xuất",
      "TL NVL đã cấp",
      "TL còn lại",
      "TL cần bổ cấp",
      "Deadline đề xuất"
    ],
    tables: ["material_requests", "sales_orders", "sales_order_items", "materials"],
    buildPriority: "P1"
  },
  {
    name: "Nhật ký NVL",
    replaces: ["01 - Nhật ký sản xuất 2026", "12 - Dữ liệu tổng hao hụt", "13 - Dữ liệu tổng NXT"],
    purpose: "Ghi nhận xuất, nhập, chuyển, nhập về KCP theo LSX, thợ, công đoạn và nguồn NVL.",
    coreFields: [
      "Nơi nhận",
      "Ngày phát sinh",
      "Số chứng từ",
      "Mã thợ",
      "Người nhận",
      "Lệnh sản xuất",
      "Mã hàng",
      "Tên hàng",
      "Loại vàng",
      "Diễn giải",
      "Số lượng",
      "KCP xuất thợ",
      "Nhập về KCP",
      "Chuyển",
      "Tháng tính hao",
      "Nguồn nhận NVL"
    ],
    tables: ["material_movements", "production_orders", "materials", "workers", "process_stages"],
    buildPriority: "P1"
  },
  {
    name: "Tồn hộp thợ & NXT",
    replaces: ["02 - Báo cáo tồn hộp thợ", "13 - Báo cáo NXT NVL"],
    purpose: "Tổng hợp tồn đầu kỳ, nhập, xuất, chuyển, tồn cuối theo thợ, công đoạn, NVL và kỳ báo cáo.",
    coreFields: [
      "Mã thợ",
      "Tên thợ",
      "Công đoạn",
      "Mã NL",
      "Tên nguyên liệu",
      "Tuổi nguyên liệu",
      "Tồn đầu kỳ",
      "Nhập trong kỳ",
      "Xuất trong kỳ",
      "Chuyển trong kỳ",
      "Tồn cuối kỳ",
      "Quy 24K/99.99"
    ],
    tables: ["worker_box_balances", "inventory_period_balances", "material_movements"],
    buildPriority: "P2"
  },
  {
    name: "Giá, định mức & hao hụt",
    replaces: ["11 - Đề xuất duyệt giá tính hao", "12 - Báo cáo tổng hợp hao hụt"],
    purpose: "Duyệt giá tính hao, quản lý định mức, tính hao hụt thực tế/vượt định mức và giá trị quyết toán.",
    coreFields: [
      "Tháng tính hao",
      "Giá vàng",
      "Giá bạc",
      "Giá PT",
      "Mã công đoạn",
      "Tên công đoạn",
      "Mã thợ",
      "Loại vàng",
      "Hao hụt thực tế",
      "Định mức",
      "Hao hụt vượt",
      "Thành tiền",
      "Trạng thái duyệt"
    ],
    tables: ["price_periods", "loss_norms", "loss_settlements", "material_movements"],
    buildPriority: "P2"
  },
  {
    name: "Phân kim",
    replaces: ["08 - Báo cáo tổng hợp kết quả phân kim"],
    purpose: "Theo dõi lô phân kim, xuất/nhập PK, chênh lệch, tỷ lệ hao hụt và chi phí phân kim.",
    coreFields: [
      "Số phiếu PK",
      "Ngày xuất PK",
      "Ngày nhập PK",
      "Tên nguyên liệu",
      "Tuổi nguyên liệu",
      "TL xuất PK",
      "TL nhập PK",
      "Chênh lệch nấu",
      "Chênh lệch PK",
      "Tỷ lệ hao hụt",
      "Chi phí PK"
    ],
    tables: ["refining_batches", "materials", "price_periods"],
    buildPriority: "P3"
  }
];

export const schemaTableBlueprints: SchemaTableBlueprint[] = [
  {
    name: "sales_orders",
    purpose: "Đơn hàng/PO, khách hàng, cửa hàng, deadline và trạng thái tổng.",
    fields: ["order_code", "po_number", "store_id", "customer_id", "order_date", "deadline_date", "status", "warning_status"]
  },
  {
    name: "sales_order_items",
    purpose: "Chi tiết mã hàng, số lượng, trọng lượng, đã giao, còn lại.",
    fields: ["sales_order_id", "product_id", "material_id", "ordered_qty", "delivered_qty", "estimated_weight_gram", "converted_24k_chi"]
  },
  {
    name: "production_tasks",
    purpose: "Kế hoạch sản xuất theo ngày, thợ, công đoạn và khối lượng.",
    fields: ["production_order_id", "worker_id", "stage_id", "task_date", "work_code", "plan_weight_gram", "actual_weight_gram", "status"]
  },
  {
    name: "material_requests",
    purpose: "Đề xuất/cấp/bổ cấp NVL theo đơn hàng hoặc LSX.",
    fields: ["request_code", "sales_order_id", "production_order_id", "material_id", "requested_weight_gram", "issued_weight_gram", "supplement_weight_gram", "status"]
  },
  {
    name: "loss_norms",
    purpose: "Định mức hao hụt theo công đoạn, NVL và nhóm sản phẩm.",
    fields: ["norm_code", "stage_id", "material_id", "product_group", "effective_from", "norm_rate"]
  },
  {
    name: "loss_settlements",
    purpose: "Quyết toán hao hụt theo kỳ, thợ, công đoạn, NVL và giá đã duyệt.",
    fields: ["period_code", "worker_id", "stage_id", "material_id", "actual_loss_weight", "allowed_loss_weight", "exceeded_loss_weight", "settlement_amount_vnd"]
  }
];
