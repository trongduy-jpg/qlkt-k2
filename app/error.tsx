"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Bat loi phia client cho tung trang (app/*/page.tsx). Truoc khi co file
// nay, Next.js hien man hinh mac dinh chung chung "Application error: a
// client-side exception has occurred... see the browser console" - khong
// ai (ke ca admin) biet loi that la gi neu khong tu mo DevTools. Component
// nay thay bang thong bao co noi dung loi that hien ngay tren man hinh,
// de chup gui bao loi duoc luon.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Van log ra console de khong mat thong tin debug day du (stack trace).
    console.error("Client-side exception:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={22} />
          <div>
            <h1 className="text-base font-bold text-ink">Đã xảy ra lỗi</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Hệ thống gặp lỗi khi hiển thị trang này. Vui lòng chụp lại nội dung bên dưới và gửi cho admin/đội kỹ
              thuật.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="break-words text-sm text-red-800">{error.message || "Lỗi không xác định"}</p>
          {error.digest ? <p className="mt-1 text-xs text-red-600">Mã lỗi: {error.digest}</p> : null}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="h-10 flex-1 rounded-md bg-ink text-sm font-semibold text-white hover:bg-zinc-800"
            type="button"
            onClick={reset}
          >
            Thử lại
          </button>
          <button
            className="h-10 flex-1 rounded-md border border-line bg-white text-sm font-semibold text-ink hover:bg-paper"
            type="button"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    </main>
  );
}
