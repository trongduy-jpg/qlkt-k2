import { useState } from "react";
import { Lightbulb, TriangleAlert, X } from "lucide-react";
import type { FeedbackType } from "@/lib/feedback-service";

type FeedbackModalProps = {
  isOpen: boolean;
  contextModule: string;
  onClose: () => void;
  onSubmit: (input: { type: FeedbackType; content: string }) => Promise<void>;
};

const typeOptions: Array<{ value: FeedbackType; label: string; description: string; icon: typeof TriangleAlert }> = [
  {
    value: "bug",
    label: "Báo lỗi",
    description: "Có chỗ chạy sai, hiển số không đúng, hoặc tôi không làm tiếp được",
    icon: TriangleAlert
  },
  {
    value: "suggestion",
    label: "Đề xuất cải tiến",
    description: "Hệ thống chạy đúng, nhưng tôi muốn nó làm thêm được việc này",
    icon: Lightbulb
  }
];

export function FeedbackModal({ isOpen, contextModule, onClose, onSubmit }: FeedbackModalProps) {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function reset() {
    setSelectedType(null);
    setContent("");
    setError(null);
    setIsSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedType) return;
    if (!content.trim()) {
      setError("Vui lòng mô tả nội dung trước khi gửi.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ type: selectedType, content });
      reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không gửi được phản hồi");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Góp ý / Báo lỗi</h3>
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
            onClick={handleClose}
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-1 text-xs text-zinc-500">Màn hình hiện tại: {contextModule}</p>

        <div className="mt-4 grid gap-2">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                  isSelected ? "border-ink bg-paper" : "border-line hover:border-zinc-400"
                }`}
                onClick={() => setSelectedType(option.value)}
              >
                <Icon size={18} className={isSelected ? "text-ink" : "text-zinc-400"} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedType ? (
          <div className="mt-4">
            <label htmlFor="feedback-content" className="text-xs font-semibold text-zinc-600">
              Mô tả chi tiết
            </label>
            <textarea
              id="feedback-content"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                selectedType === "bug"
                  ? "VD: Bấm Lưu ở LSX hiện tại 14/8 báo lỗi, không lưu được..."
                  : "VD: Tôi muốn lọc theo khách hàng ở màn Nhật ký NVL..."
              }
            />
          </div>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            onClick={handleClose}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!selectedType || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}
