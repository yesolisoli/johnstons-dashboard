"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkArea } from "../types";

export function DeptSelect({ homeDepartmentId, workAreas, onChange }: {
  homeDepartmentId: string | null;
  workAreas: WorkArea[];
  onChange: (waId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedWa = workAreas.find((w) => w.id === homeDepartmentId);
  const label = selectedWa ? selectedWa.name : "— None —";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 hover:bg-white"
        style={{ color: selectedWa ? (selectedWa.color_hex ?? "#475569") : "#94a3b8" }}
      >
        <span>{label}</span>
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-40 rounded-lg border bg-white shadow-lg">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50"
          >
            — None —
          </button>
          {workAreas.map((wa) => (
            <button
              key={wa.id}
              onClick={() => { onChange(wa.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50"
              style={{ color: wa.color_hex ?? "#475569" }}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: wa.color_hex ?? "#475569" }} />
              {wa.name}
              {homeDepartmentId === wa.id && <span className="ml-auto text-slate-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
