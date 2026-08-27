"use client";

import { Children, isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { hasMeaningfulDisplayValue } from "@/lib/production-helpers";
import type { SelectOption } from "@/lib/production-journal-options";

// Cac primitive giao dien dung chung cho form/panel cua man san xuat.
// Tach ra khoi material-dashboard.tsx de tai su dung va giam do dai file.

// outline-none + focus-visible:outline-none o day de chan dut diem sang mac
// dinh cua trinh duyet/OS (thuong la mau xanh duong lac tone voi theme
// "jade" cua app) khi field nhan focus - buoc moi trang thai focus (chuot
// hoac ban phim) chi hien dung 1 kieu vien jade nhat quan thay vi lan giua
// 2 mau khac nhau tuy trinh duyet.
export const fieldControlClass =
  "h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-zinc-400 focus:outline-none focus:border-jade focus:ring-2 focus:ring-jade/25 focus-visible:outline-none focus-visible:border-jade focus-visible:ring-2 focus-visible:ring-jade/25 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

// Truoc day DateInput phu 1 lop text hien dung dd/mm/yy len tren 1
// <input type="date"> AN DI (opacity-0) de ep dinh dang, vi <input
// type="date"> hien thi theo dinh dang trinh duyet/he dieu hanh (VD
// Chrome en-US ra mm/dd/yyyy), khong the ep bang CSS/HTML. Van de: khi go
// truc tiep, nguoi dung go vao input that nhung VO HINH - trinh duyet van
// tu chia 3 vung ngay/thang/nam va nhay vung, nhung nguoi dung khong thay
// vung nao dang duoc chon (khong co con tro), thanh ra cam giac "nhay lung
// tung" khi go tay, dung bam icon lich thi khong sao vi do la 1 UI hien ro
// rang. Component nay thay bang 3 o nhap thuc su nhin thay duoc (dd / mm /
// yyyy), nguoi dung go so truc tiep vao dung o dang chon, tu nhay o khi du
// 2 (hoac 4) chu so, Backspace o dau 1 o se lui ve o truoc. Icon lich van
// mo lich chon native nhu cu (input type="date" chi phu dung vung icon).
function parseIsoDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!match) return { day: "", month: "", year: "" };
  const [, year, month, day] = match;
  return { day, month, year };
}

function clampSegment(digits: string, max: number) {
  if (!digits) return "";
  const num = Number(digits);
  if (Number.isNaN(num)) return "";
  return String(Math.min(num, max));
}

export function DateInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const initial = parseIsoDateParts(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);

  // Dong bo lai 3 o khi value thay doi tu ben ngoai (VD chon qua lich,
  // reset form) - khong dong bo khi nguoi dung dang go do (moi lan onChange
  // that su nem ISO hop le thi 3 o da khop san, tranh vong lap khong can
  // thiet va tranh "giat" con tro giua chung khi dang go).
  useEffect(() => {
    const parts = parseIsoDateParts(value);
    setDay(parts.day);
    setMonth(parts.month);
    setYear(parts.year);
  }, [value]);

  function commitIfComplete(nextDay: string, nextMonth: string, nextYear: string) {
    if (nextDay.length === 2 && nextMonth.length === 2 && nextYear.length === 4) {
      onChange(`${nextYear}-${nextMonth}-${nextDay}`);
    } else if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
    }
  }

  function handleDayChange(raw: string) {
    const digits = clampSegment(raw.replace(/\D/g, "").slice(0, 2), 31);
    setDay(digits);
    commitIfComplete(digits, month, year);
    if (digits.length === 2) monthRef.current?.focus();
  }

  function handleMonthChange(raw: string) {
    const digits = clampSegment(raw.replace(/\D/g, "").slice(0, 2), 12);
    setMonth(digits);
    commitIfComplete(day, digits, year);
    if (digits.length === 2) yearRef.current?.focus();
  }

  function handleYearChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    commitIfComplete(day, month, digits);
  }

  function handleSegmentKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    previousRef: React.RefObject<HTMLInputElement | null> | null
  ) {
    if (event.key === "Backspace" && !currentValue && previousRef?.current) {
      previousRef.current.focus();
    }
  }

  const segmentClass =
    "h-full shrink-0 bg-transparent p-0 text-left text-sm text-ink outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-500";

  return (
    <div
      className={`${fieldControlClass} flex items-center px-3 ${disabled ? "" : "focus-within:border-jade focus-within:ring-2 focus-within:ring-jade/25"}`}
    >
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="dd"
        maxLength={2}
        size={2}
        className={`${segmentClass} w-[1.6em]`}
        value={day}
        disabled={disabled}
        onChange={(event) => handleDayChange(event.target.value)}
        onKeyDown={(event) => handleSegmentKeyDown(event, day, null)}
      />
      <span className="text-zinc-400">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="mm"
        maxLength={2}
        size={2}
        className={`${segmentClass} w-[1.6em]`}
        value={month}
        disabled={disabled}
        onChange={(event) => handleMonthChange(event.target.value)}
        onKeyDown={(event) => handleSegmentKeyDown(event, month, dayRef)}
      />
      <span className="text-zinc-400">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="yyyy"
        maxLength={4}
        size={4}
        className={`${segmentClass} w-[2.8em]`}
        value={year}
        disabled={disabled}
        onChange={(event) => handleYearChange(event.target.value)}
        onKeyDown={(event) => handleSegmentKeyDown(event, year, monthRef)}
      />
      <div className="relative ml-auto flex shrink-0 items-center">
        <Calendar size={15} className="pointer-events-none text-zinc-400" />
        <input
          ref={nativeDateRef}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          title="Mở lịch chọn ngày"
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

// <input type="month"> hien thi theo dinh dang cua trinh duyet/he dieu
// hanh (VD Chrome en-US ra "August 2026" bang chu, khong phai so) - lech
// voi cach app hien thi ngay/thang o moi noi khac (dd/mm/yy toan bang so,
// xem DateInput o tren). Component nay dung chung 1 ky thuat voi DateInput:
// giu nguyen input month goc (an di, van bat lich chon thang native) va
// phu 1 lop text hien dung mm/yyyy len tren, dam bao dong bo bat ke ngon
// ngu/vung cua trinh duyet nguoi dung.
export function MonthInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [year, month] = value ? value.split("-") : ["", ""];
  const displayLabel = year && month ? `${month}/${year}` : "";

  return (
    <div className="relative">
      <div
        className={`${fieldControlClass} pointer-events-none flex items-center justify-between ${
          displayLabel ? "text-ink" : "text-zinc-400"
        }`}
      >
        <span>{displayLabel || "mm/yyyy"}</span>
        <Calendar size={15} className="text-zinc-400" />
      </div>
      <input
        type="month"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}

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
    <div className="grid min-w-0 content-start gap-1.5 text-sm">
      <span className="min-h-4 select-none text-xs font-semibold uppercase leading-4 tracking-wide text-zinc-500">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="select-none text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </div>
  );
}

export function DrawerHeaderMeta({
  items
}: {
  items: Array<{ label: string; value: ReactNode; tone?: "default" | "jade" | "amber" | "sky" }>;
}) {
  const toneClass = {
    default: "border-line bg-paper text-ink",
    jade: "border-jade/30 bg-jade/5 text-jade",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    sky: "border-sky-200 bg-sky-50 text-sky-700"
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`min-w-0 rounded-md border px-2.5 py-1.5 ${toneClass[item.tone ?? "default"]}`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{item.label}</div>
          <div className="truncate text-sm font-semibold">{item.value || "-"}</div>
        </div>
      ))}
    </div>
  );
}

// Doc danh sach <option> tu children de giu nguyen API cu (JSX <option>
// nhu <select> goc), cho phep SelectControl dung chung 1 dropdown tuy bien
// voi SearchableSelect ma khong phai sua ~25 noi dang goi no trong app.
function extractOptionsFromChildren(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as { value?: unknown; children?: ReactNode; title?: string };
    const value = String(props.value ?? "");
    const label = typeof props.children === "string" ? props.children : String(props.children ?? value);
    options.push({ value, label, hint: props.title });
  });
  return options;
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
  const options = useMemo(() => extractOptionsFromChildren(children), [children]);
  return <SearchableSelect value={value} onChange={onChange} groups={[{ options }]} />;
}

export type SearchableSelectGroup = { label?: string; options: SelectOption[] };

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
  placeholder = "Chọn...",
  clearLabel
}: {
  value: string;
  onChange: (value: string) => void;
  groups: SearchableSelectGroup[];
  placeholder?: string;
  // Chi hien dong "bo chon" o dau panel khi truyen prop nay - danh cho cac
  // danh sach KHONG tu co san 1 option value="" (VD Loai NVL, Ma noi NXT).
  // Cac dropdown da co san option value="" trong chinh danh sach (VD "Chon
  // noi nhan") thi khong can, tranh hien thi trung 2 dong bo chon.
  clearLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const triggerRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const selectedOption = allOptions.find((option) => option.value === value);

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

    // "scroll" khong bubble nhung listener capture tren window van bat duoc
    // moi scroll xay ra ben trong trang, ke ca cuon chinh danh sach lua chon
    // cua panel (max-h-64 overflow-y-auto) - phai bo qua truong hop nay,
    // chi dong panel khi scroll xay ra BEN NGOAI no (VD drawer cuon lam
    // lech vi tri trigger), neu khong panel se tu dong bi vua cuon vua dong.
    function handleScrollOrResize(event: Event) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
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

  function selectValue(nextValue: string) {
    onChange(nextValue);
    close();
  }

  // Go truc tiep vao o de tim/loc (khong can bam mo panel truoc) - ca o va
  // icon deu mo panel khi bam, tranh loi truoc day chi bam trung dung icon
  // moi mo duoc do dung <button> lam trigger (vung bam qua nho/de bam hut).
  return (
    <div className="relative">
      <div className="relative flex h-11 items-center rounded-md border border-line bg-white transition-colors focus-within:border-jade focus-within:ring-2 focus-within:ring-jade/25">
        <input
          ref={triggerRef}
          type="text"
          className="h-full w-full min-w-0 flex-1 truncate rounded-md bg-transparent pl-3 pr-1 text-sm text-ink outline-none placeholder:text-zinc-400"
          placeholder={isOpen ? "Gõ để tìm kiếm..." : selectedOption ? undefined : placeholder}
          value={isOpen ? query : (selectedOption?.displayLabel ?? selectedOption?.label ?? "")}
          title={selectedOption?.hint ?? selectedOption?.label}
          onFocus={() => {
            setQuery("");
            openPanel();
          }}
          onClick={() => {
            if (!isOpen) openPanel();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isOpen) openPanel();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-full shrink-0 items-center px-3"
          onClick={() => {
            if (isOpen) {
              close();
            } else {
              triggerRef.current?.focus();
              openPanel();
            }
          }}
        >
          <ChevronDown className={`size-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
              className="z-50 overflow-hidden rounded-md border border-line bg-white shadow-lg"
            >
              <div className="max-h-64 overflow-y-auto py-1">
                {clearLabel ? (
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-jade/10 ${
                      !value ? "font-semibold text-jade" : "text-zinc-500"
                    }`}
                    onClick={() => selectValue("")}
                  >
                    {clearLabel}
                  </button>
                ) : null}

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
                            title={option.hint ?? option.label}
                            onClick={() => selectValue(option.value)}
                          >
                            <span className="truncate">{option.displayLabel ?? option.label}</span>
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
    </div>
  );
}

export function InfoMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const toneClass = tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</p>
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
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
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
          className="flex items-start justify-between gap-4 rounded-md border border-line/70 bg-paper px-3 py-2"
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
