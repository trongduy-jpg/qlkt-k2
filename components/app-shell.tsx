"use client";

import type { ReactNode } from "react";
import {
  Boxes,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
  History,
  ListChecks,
  Scale,
  Settings2,
  X
} from "lucide-react";
import type { AppUser } from "@/lib/auth-service";

const navItems = [
  ["Dashboard", ClipboardList],
  ["Lệnh sản xuất", Boxes],
  ["Nhật ký NVL", Scale],
  ["Ghi nhận công đoạn", ListChecks],
  ["Giá & định mức", CircleDollarSign],
  ["Tồn hộp thợ", Boxes],
  ["Báo cáo hao hụt", FileWarning],
  ["Audit log", History],
  ["Cấu hình", Settings2]
] as const;

type AppShellProps = {
  activeModule: string;
  appUser: AppUser | null;
  isAdmin: boolean;
  isLoadingRemote: boolean;
  remoteError: string | null;
  children: ReactNode;
  onClearRemoteError: () => void;
  onSelectModule: (label: string) => void;
  onSignOut: () => void;
};

export function AppShell({
  activeModule,
  appUser,
  isAdmin,
  isLoadingRemote,
  remoteError,
  children,
  onClearRemoteError,
  onSelectModule,
  onSignOut
}: AppShellProps) {
  const visibleNavItems = isAdmin ? navItems : navItems.filter(([label]) => label !== "Cấu hình");

  return (
    <main className="min-h-screen">
      {remoteError ? (
        <div className="fixed right-4 top-4 z-[100] w-full max-w-sm">
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 shadow-lg">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Có lỗi xảy ra</p>
              <p className="mt-1 text-sm text-red-700">{remoteError}</p>
            </div>
            <button
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-red-700 hover:bg-red-100"
              type="button"
              onClick={onClearRemoteError}
              title="Đóng thông báo lỗi"
              aria-label="Đóng thông báo lỗi"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="shell-grid min-h-screen">
        <aside className="border-r border-line bg-[#ece6de] px-5 py-6">
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide text-ink">ASIANA GOLD</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">QLKT K2</p>
          </div>

          <nav className="mt-8 space-y-0.5">
            {visibleNavItems.map(([label, Icon]) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                  activeModule === label
                    ? "border-ink font-semibold text-ink"
                    : "border-transparent text-zinc-500 hover:border-line hover:text-ink"
                }`}
                type="button"
                onClick={() => onSelectModule(label)}
              >
                <Icon size={16} className={activeModule === label ? "text-ink" : "text-zinc-400"} />
                {label}
              </button>
            ))}
          </nav>

          {isLoadingRemote ? <p className="mt-8 text-xs font-semibold text-brass">Đang tải dữ liệu...</p> : null}

          {appUser ? (
            <div className="mt-8 border-t border-line pt-4">
              <p className="truncate text-sm font-medium text-ink">{appUser.full_name || appUser.email}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{isAdmin ? "Quản trị viên" : "Nhân viên"}</p>
              <button
                className="mt-2 text-xs font-semibold text-zinc-500 underline hover:text-ink"
                type="button"
                onClick={onSignOut}
              >
                Đăng xuất
              </button>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 px-5 py-5 md:px-8">
          <div className="content-shell">
            <header className="border-b border-line pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quản trị sản xuất</p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                {activeModule === "Dashboard" ? "Tổng quan" : activeModule}
              </h2>
            </header>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
