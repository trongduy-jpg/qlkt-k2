import { useMemo, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import type { FeedbackStatus, UserFeedback } from "@/lib/feedback-service";

type FeedbackAdminViewProps = {
  isVisible: boolean;
  feedbackList: UserFeedback[];
  onChangeStatus: (id: string, status: FeedbackStatus, adminNote?: string) => Promise<void>;
};

const tabs = ["Chưa xử lý", "Báo lỗi", "Đề xuất cải tiến", "Tất cả"] as const;
type Tab = (typeof tabs)[number];

const statusLabels: Record<FeedbackStatus, string> = {
  open: "Chưa xử lý",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  rejected: "Từ chối"
};

function formatDateTime(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FeedbackAdminView({ isVisible, feedbackList, onChangeStatus }: FeedbackAdminViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Chưa xử lý");

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "Chưa xử lý":
        return feedbackList.filter((item) => item.status === "open");
      case "Báo lỗi":
        return feedbackList.filter((item) => item.type === "bug");
      case "Đề xuất cải tiến":
        return feedbackList.filter((item) => item.type === "suggestion");
      case "Tất cả":
      default:
        return feedbackList;
    }
  }, [activeTab, feedbackList]);

  const openCount = feedbackList.filter((item) => item.status === "open").length;

  return (
    <section className={`${isVisible ? "block" : "hidden"} mt-5 rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="text-jade" size={18} />
        <h3 className="text-base font-bold text-ink">Phản hồi người dùng</h3>
      </div>
      <p className="mt-1 text-sm text-zinc-500">Báo lỗi và đề xuất cải tiến do nhân viên gửi trực tiếp trong hệ thống.</p>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === tab ? "bg-ink text-white" : "border border-line text-zinc-600 hover:bg-zinc-50"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Chưa xử lý" ? `${tab} (${openCount})` : tab === "Tất cả" ? `${tab} (${feedbackList.length})` : tab}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-600">Không có phản hồi nào.</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="rounded-md border border-line bg-paper px-3 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      item.type === "bug" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.type === "bug" ? "Báo lỗi" : "Đề xuất"}
                  </span>
                  <span className="text-xs text-zinc-500">{item.createdByEmail}</span>
                  {item.contextModule ? (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{item.contextModule}</span>
                  ) : null}
                </div>
                <span className="text-xs text-zinc-500">{formatDateTime(item.createdAt)}</span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-ink">{item.content}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">Trạng thái:</span>
                {(Object.keys(statusLabels) as FeedbackStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                      item.status === status ? "bg-ink text-white" : "border border-line text-zinc-600 hover:bg-zinc-50"
                    }`}
                    onClick={() => onChangeStatus(item.id, status)}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
