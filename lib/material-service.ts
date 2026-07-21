// Barrel re-export: giu nguyen 1 diem import "@/lib/material-service" cho
// toan bo code hien co, trong khi logic thuc te da duoc chia theo domain
// sang cac file rieng de de doc/de bao tri hon:
// - materials-service.ts        (danh muc NVL)
// - workers-service.ts          (danh muc tho)
// - stages-service.ts           (danh muc cong doan)
// - reference-options-service.ts(danh muc dropdown dung chung)
// - production-orders-service.ts(header LSX)
// - material-movements-service.ts (giao dich NK NVL)
// - database-health-service.ts  (so luong ban ghi phuc vu Dashboard)
// - audit-log-service.ts        (nhat ky thao tac)

export type {
  MaterialMaster,
  WorkerMaster,
  StageMaster,
  ReferenceOption,
  DatabaseHealth,
  ProductionOrderHeaderInput,
  ProductionOrderHeaderRecord
} from "@/lib/material-service-types";

export { loadMaterials, createMaterial, updateMaterial, deleteMaterial } from "@/lib/materials-service";

export { loadWorkers, createWorker, updateWorker, deleteWorker } from "@/lib/workers-service";

export { loadStages, createStage, updateStage, deleteStage } from "@/lib/stages-service";

export {
  loadReferenceOptions,
  createReferenceOption,
  updateReferenceOption,
  deleteReferenceOption
} from "@/lib/reference-options-service";

export {
  loadProductionOrderHeaders,
  createProductionOrderHeader,
  updateProductionOrderHeader,
  updateProductionOrderStatus
} from "@/lib/production-orders-service";

export {
  loadProductionOrders,
  createMaterialMovement,
  updateMaterialMovement,
  updateMaterialMovementStatus,
  deleteMaterialMovement
} from "@/lib/material-movements-service";

export { loadDatabaseHealth } from "@/lib/database-health-service";

export { createAuditLog } from "@/lib/audit-log-service";
