"use client";

import { useEffect, useRef, useState } from "react";

export const STATUS_CODE_AVAILABLE = "available" as const;
export const STATUS_CODE_ASSIGNED = "assigned" as const;

export type StatusConfig = {
  code: string;
  label: string;
  className: string;
  colorHex?: string;
  protected?: boolean;
  /** When true, employee is excluded from assignment eligibility */
  unavailable?: boolean;
};

export function getUnavailableStatusCodes(configs: StatusConfig[]): Set<string> {
  return new Set(configs.filter((c) => c.unavailable).map((c) => c.code));
}

export function cfgBadge(cfg: StatusConfig): { cls: string; sty?: React.CSSProperties } {
  if (cfg.colorHex) {
    return {
      cls: "rounded-md px-2.5 py-1 text-xs font-semibold",
      sty: { backgroundColor: cfg.colorHex + "28", color: cfg.colorHex },
    };
  }
  return { cls: `rounded-md px-2.5 py-1 text-xs font-semibold ${cfg.className}` };
}

export const COLOR_OPTIONS: { label: string; colorHex: string }[] = [
  { label: "Green",  colorHex: "#15803d" },
  { label: "Blue",   colorHex: "#1d4ed8" },
  { label: "Slate",  colorHex: "#64748b" },
  { label: "Red",    colorHex: "#dc2626" },
  { label: "Yellow", colorHex: "#a16207" },
  { label: "Orange", colorHex: "#c2410c" },
  { label: "Purple", colorHex: "#7e22ce" },
  { label: "Gray",   colorHex: "#475569" },
  { label: "Teal",   colorHex: "#0f766e" },
  { label: "Pink",   colorHex: "#be185d" },
];

export const DEFAULT_STATUS_CONFIGS: StatusConfig[] = [
  { code: "available",  label: "Available",  className: "bg-emerald-50 text-emerald-600",  colorHex: "#059669", protected: true },
  { code: "assigned",   label: "Assigned",   className: "bg-sky-50 text-sky-600",          colorHex: "#0284c7", protected: true },
  { code: "sick",       label: "Sick",       className: "bg-rose-50 text-rose-500",        colorHex: "#f43f5e", unavailable: true },
  { code: "vacation",   label: "Vacation",   className: "bg-amber-50 text-amber-500",      colorHex: "#f59e0b", unavailable: true },
  { code: "injured",    label: "Injured",    className: "bg-orange-50 text-orange-400",    colorHex: "#fb923c", unavailable: true },
  { code: "training",   label: "Training",   className: "bg-violet-50 text-violet-400",    colorHex: "#a78bfa" },
  { code: "off_shift",  label: "Off Shift",  className: "bg-slate-100 text-slate-400",     colorHex: "#94a3b8", unavailable: true },
];

export function StatusSelect({ value, configs, onChange, onManageStatuses }: {
  value: string;
  configs: StatusConfig[];
  onChange: (status: string) => void;
  onManageStatuses?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const options = configs.filter((c) => c.code !== STATUS_CODE_ASSIGNED);
  const current = options.find((c) => c.code === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${cfgBadge(current).cls}`}
        style={cfgBadge(current).sty}
      >
        {current.label}
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div
          className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          style={{ top: pos.top, left: pos.left, minWidth: Math.max(pos.width, 130) }}
        >
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            {onManageStatuses && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onManageStatuses(); }}
                className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Manage statuses"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
          <div className="p-1.5 space-y-0.5">
            {options.map((cfg) => {
              const active = cfg.code === value;
              return (
                <button
                  key={cfg.code}
                  onClick={() => { onChange(cfg.code); setOpen(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <span className={`shrink-0 ${cfgBadge(cfg).cls}`} style={cfgBadge(cfg).sty}>{cfg.label}</span>
                  {active && (
                    <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l4 4 6-7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
