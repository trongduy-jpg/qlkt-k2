"use client";

import { useState } from "react";
import { Gem, Mail } from "lucide-react";
import { sendMagicLink } from "@/lib/auth-service";

export function LoginView({ deniedEmail }: { deniedEmail?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

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
        <p className="mt-1 text-sm text-zinc-600">
          Nhập email đã được admin cấp quyền để nhận link đăng nhập.
        </p>

        {deniedEmail ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Tài khoản <strong>{deniedEmail}</strong> không còn/chưa được cấp quyền truy cập hệ thống.
          </div>
        ) : null}

        {status === "sent" ? (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Đã gửi link đăng nhập tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả mục thư rác) và bấm vào link để tiếp tục.
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
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
    </main>
  );
}
