"use client";

import { useState } from "react";
import { Gem, Mail } from "lucide-react";
import { sendMagicLink, signInWithGoogle } from "@/lib/auth-service";

export function LoginView({ deniedEmail }: { deniedEmail?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Google la duy nhat hien mac dinh - magic link van giu lam duong lui
  // cho email da duoc cap quyen nhung khong gan voi tai khoan Google (VD
  // email noi bo khong phai Gmail/Google Workspace), chi hien khi bam mo.
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setError(null);
    try {
      await sendMagicLink(email);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được link đăng nhập.");
      setStatus("idle");
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // Chuyen huong sang Google, tab hien tai se roi trang nen khong can
      // tu tat isGoogleLoading o day - chi tat lai neu chinh Supabase tra
      // ve loi truoc khi kip chuyen huong (VD chua bat provider Google).
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được bằng Google.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <Gem className="text-ink" size={22} />
          <div>
            <p className="font-display text-xl font-semibold text-ink">ASIANA GOLD</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">QLKT K2</p>
          </div>
        </div>

        <h1 className="mt-6 text-lg font-bold text-ink">Đăng nhập</h1>
        <p className="mt-1 text-sm text-zinc-600">Đăng nhập bằng Gmail công ty để vào hệ thống.</p>

        {deniedEmail ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Tài khoản <strong>{deniedEmail}</strong> không còn/chưa được cấp quyền truy cập hệ thống.
          </div>
        ) : null}

        <button
          className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-line bg-white text-sm font-semibold text-ink shadow-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          {isGoogleLoading ? "Đang chuyển tới Google..." : "Đăng nhập bằng Google"}
        </button>

        {error && !showEmailFallback ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        {!showEmailFallback ? (
          <button
            className="mt-5 w-full text-center text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
            type="button"
            onClick={() => setShowEmailFallback(true)}
          >
            Không đăng nhập được bằng Google?
          </button>
        ) : (
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-xs text-zinc-500">
              Nhập email đã được admin cấp quyền để nhận link đăng nhập.
            </p>

            {status === "sent" ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Đã gửi link đăng nhập tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả mục thư rác) và bấm vào link để tiếp tục.
              </div>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-jade/30"
                    type="email"
                    placeholder="email@congty.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <button
                  className="h-10 w-full rounded-md bg-ink text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                  type="submit"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Đang gửi..." : "Gửi link đăng nhập"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
