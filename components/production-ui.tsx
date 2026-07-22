import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { hasMeaningfulDisplayValue } from "@/lib/production-helpers";

// Cac primitive giao dien dung chung cho form/panel cua man san xuat.
// Tach ra khoi material-dashboard.tsx de tai su dung va giam do dai file.

export const fieldControlClass =
  "h-10 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none transition-colors focus:border-jade focus:ring-2 focus:ring-jade/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

export function FieldShell({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function SelectControl({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        className={`${fieldControlClass} appearance-none pr-10`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

export function DetailGroup({
  title,
  items
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  const visibleItems = items.filter(([, value]) => hasMeaningfulDisplayValue(value));

  return (
    <div className="rounded-md border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      {visibleItems.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {visibleItems.map(([label, value]) => (
            <div key={`${title}-${label}`} className="rounded-md bg-paper px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 text-sm font-medium text-ink">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-line bg-paper px-3 py-4 text-sm text-zinc-500">
          Chưa có dữ liệu cần hiển thị trong nhóm này.
        </div>
      )}
    </div>
  );
}

export function DetailInlineList({
  items
}: {
  items: Array<[string, string]>;
}) {
  const visibleItems = items.filter(([, value]) => hasMeaningfulDisplayValue(value));

  if (visibleItems.length === 0) {
    return <p className="text-sm text-zinc-500">Chưa có dữ liệu vận hành phát sinh.</p>;
  }

  return (
    <div className="grid gap-2">
      {visibleItems.map(([label, value]) => (
        <div
          key={`${label}-${value}`}
          className="flex items-start justify-between gap-4 rounded-md border border-line bg-white px-3 py-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="text-right text-sm font-medium text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function DrawerSection({
  title,
  note,
  children
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line/80 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h4>
            {note ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{note}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-3 py-3">{children}</div>
    </section>
  );
}
