"use client";

import { useEffect, useRef, useState } from "react";

export type StatusConfig = {
  code: string;
  label: string;
  className: string;
  colorHex?: string;
  protected?: boolean;
};

export function cfgBadge(cfg: StatusConfig): { cls: string; sty?: React.CSSProperties } {
  if (cfg.colorHex) {
    return {
      cls: "rounded-md px-2.5 py-1 text-xs font-semibold",
      sty: { backgroundColor: cfg.colorHex + "28", color: cfg.colorHex },
    };
  }
  return { cls: `rounded-md px-2.5 py-1 text-xs font-semibold ${cfg.className}` };
}

export const COLOR_OPTIONS: { label: string; className: string }[] = [
  { label: "Green",  className: "bg-green-100 text-green-700" },
  { label: "Blue",   className: "bg-blue-100 text-blue-700" },
  { label: "Slate",  className: "bg-slate-200 text-slate-500" },
  { label: "Red",    className: "bg-red-100 text-red-600" },
  { label: "Yellow", className: "bg-yellow-100 text-yellow-700" },
  { label: "Orange", className: "bg-orange-100 text-orange-700" },
  { label: "Purple", className: "bg-purple-100 text-purple-700" },
  { label: "Gray",   className: "bg-slate-100 text-slate-600" },
  { label: "Teal",   className: "bg-teal-100 text-teal-700" },
  { label: "Pink",   className: "bg-pink-100 text-pink-700" },
];

export const DEFAULT_STATUS_CONFIGS: StatusConfig[] = [
  { code: "available",  label: "Available",  className: "bg-emerald-50 text-emerald-600",  protected: true },
  { code: "assigned",   label: "Assigned",   className: "bg-sky-50 text-sky-600",          protected: true },
  { code: "sick",       label: "Sick",       className: "bg-rose-50 text-rose-500" },
  { code: "vacation",   label: "Vacation",   className: "bg-amber-50 text-amber-500" },
  { code: "injured",    label: "Injured",    className: "bg-orange-50 text-orange-400" },
  { code: "training",   label: "Training",   className: "bg-violet-50 text-violet-400" },
  { code: "off_shift",  label: "Off Shift",  className: "bg-slate-100 text-slate-400" },
];

export function StatusSelect({ value, configs, onChange }: {
  value: string;
  configs: StatusConfig[];
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const options = configs.filter((c) => c.code !== "assigned");
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
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
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
