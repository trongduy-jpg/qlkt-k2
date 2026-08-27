"use client";

import { useEffect } from "react";

// Bat loi xay ra o TANG GOC (app/layout.tsx - VD AuthProvider/AuthGate
// throw truoc khi render duoc component nao) - app/error.tsx KHONG bat
// duoc loai loi nay vi no nam trong chinh layout bi loi. global-error.tsx
// thay the toan bo <html>/<body> nen phai tu ve lai tu dau (khong dung lai
// duoc globals.css/font cua layout chinh), giu don gian de luon render
// duoc ke ca khi CSS chua kip tai.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global client-side exception:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f3ede4" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 8,
              border: "1px solid #ddd4c5",
              background: "#fff",
              padding: 24,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Đã xảy ra lỗi nghiêm trọng</h1>
            <p style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
              Hệ thống không tải được. Vui lòng chụp lại nội dung bên dưới và gửi cho admin/đội kỹ thuật.
            </p>
            <div style={{ marginTop: 16, borderRadius: 6, border: "1px solid #f1c0c0", background: "#fdecec", padding: "8px 12px" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#a11", wordBreak: "break-word" }}>
                {error.message || "Lỗi không xác định"}
              </p>
              {error.digest ? (
                <p style={{ marginTop: 4, fontSize: 12, color: "#c33" }}>Mã lỗi: {error.digest}</p>
              ) : null}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 6,
                  border: "none",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 6,
                  border: "1px solid #ddd4c5",
                  background: "#fff",
                  color: "#1a1a1a",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
