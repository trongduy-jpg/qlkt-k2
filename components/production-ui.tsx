"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { hasMeaningfulDisplayValue } from "@/lib/production-helpers";
import type { SelectOption } from "@/lib/production-journal-options";

// Cac primitive giao dien dung chung cho form/panel cua man san xuat.
// Tach ra khoi material-dashboard.tsx de tai su dung va giam do dai file.

export const fieldControlClass =
  "h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-zinc-400 focus:border-jade focus:ring-2 focus:ring-jade/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

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
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="min-h-4 text-xs font-semibold uppercase leading-4 tracking-wide text-zinc-500">
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
        className={`${fieldControlClass} appearance-none truncate pr-10`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export type SearchableSelectGroup = { label?: string; options: SelectOption[] };

const SEARCH_THRESHOLD = 8;

type PanelCoords = { top: number; left: number; width: number };

// Dropdown tuy bien thay cho <select> goc: <select> de trinh duyet ve popup
// bang giao dien he dieu hanh (nen trang, highlight xanh mac dinh), khong
// dong bo duoc voi theme cua app va khong co o tim kiem cho danh sach dai
// (VD Ma noi NXT ~74 ma). Component nay tu ve panel, co o tim kiem khi
// danh sach dai, va giu nguyen API value/onChange nhu SelectControl.
//
// Panel duoc ve qua portal vao document.body voi toa do fixed (thay vi
// absolute long trong DOM) vi cac drawer dung translate-x-* (transform) de
// truot vao/ra - mot ancestor co transform se tao "containing block" moi
// khien position:fixed thong thuong bi neo sai vi tri; portal + toa do tinh
// tu getBoundingClientRect tranh duoc ca van de nay lan viec bi ancestor
// overflow-y-auto cua drawer cat mat panel khi mo gan cuoi vung cuon.
export function SearchableSelect({
  value,
  onChange,
  groups,
  placeholder = "Chọn..."
}: {
  value: string;
  onChange: (value: string) => void;
  groups: SearchableSelectGroup[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selectedOption = allOptions.find((option) => option.value === value);
  const showSearch = allOptions.length > SEARCH_THRESHOLD;

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return groups;
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  function close() {
    setIsOpen(false);
    setQuery("");
  }

  function openPanel() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    }

    function handleScrollOrResize() {
      close();
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showSearch) searchInputRef.current?.focus();
  }, [isOpen, showSearch]);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${fieldControlClass} flex items-center justify-between gap-2 text-left`}
        onClick={() => (isOpen ? close() : openPanel())}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <span className={`truncate ${selectedOption ? "text-ink" : "text-zinc-400"}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
              className="z-50 overflow-hidden rounded-md border border-line bg-white shadow-lg"
            >
              {showSearch ? (
                <div className="relative border-b border-line">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    className="h-10 w-full bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-zinc-400"
                    placeholder="Gõ để tìm kiếm..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") close();
                    }}
                  />
                </div>
              ) : null}

              <div className="max-h-64 overflow-y-auto py-1">
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-jade/10 ${
                    !value ? "font-semibold text-jade" : "text-zinc-500"
                  }`}
                  onClick={() => selectValue("")}
                >
                  {placeholder}
                </button>

                {filteredGroups.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-zinc-400">Không tìm thấy lựa chọn phù hợp.</p>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.label ?? "__default"}>
                      {group.label ? (
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          {group.label}
                        </p>
                      ) : null}
                      {group.options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-jade/10 ${
                              isSelected ? "bg-jade/10 font-medium text-jade" : "text-ink"
                            }`}
                            title={option.label}
                            onClick={() => selectValue(option.value)}
                          >
                            <span className="truncate">{option.label}</span>
                            {isSelected ? <Check className="size-4 shrink-0" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
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
