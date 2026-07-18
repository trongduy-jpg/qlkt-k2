import { History } from "lucide-react";

type AuditLogEvent = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
};

type AuditLogViewProps = {
  isVisible: boolean;
  events: AuditLogEvent[];
};

export function AuditLogView({ isVisible, events }: AuditLogViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} mt-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <History className="text-jade" size={18} />
        <h3 className="text-base font-bold text-ink">Nhật ký thao tác (Audit log)</h3>
      </div>
      <div className="mt-4 grid gap-2">
        {events.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Chưa có thao tác nào. Khi thêm, xóa hoặc đổi trạng thái, hệ thống sẽ ghi lại tại đây.
          </p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="grid gap-1 rounded-md border border-line bg-paper px-3 py-2 text-sm md:grid-cols-[150px_160px_1fr]">
              <span className="font-medium text-zinc-600">{event.createdAt}</span>
              <span className="font-semibold text-ink">{event.action}</span>
              <span className="text-zinc-700">{event.detail}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
