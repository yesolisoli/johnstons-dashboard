"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkArea } from "../types";

export function DeptSelect({ homeDepartmentId, qualifiedDepartmentIds, workAreas, onChangeHome, onChangeQualified }: {
  homeDepartmentId: string | null;
  qualifiedDepartmentIds: string[];
  workAreas: WorkArea[];
  onChangeHome: (waId: string | null) => void;
  onChangeQualified: (waIds: string[]) => void;
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

  const homeWa = workAreas.find((w) => w.id === homeDepartmentId);
  const label = homeWa ? homeWa.name : "— None —";

  const toggleQualified = (waId: string) => {
    if (qualifiedDepartmentIds.includes(waId)) {
      onChangeQualified(qualifiedDepartmentIds.filter((id) => id !== waId));
    } else {
      onChangeQualified([...qualifiedDepartmentIds, waId]);
    }
  };

  const setHome = (waId: string | null) => {
    onChangeHome(waId);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 hover:bg-white"
        style={{ color: homeWa ? (homeWa.color_hex ?? "#475569") : "#94a3b8" }}
      >
        <span>{label}</span>
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-48 rounded-lg border bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
          {/* Home Dept */}
          <div className="border-b px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Home Dept</p>
          </div>
          <button
            onClick={() => { setHome(null); setOpen(false); }}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50"
          >
            — None —
          </button>
          {workAreas.map((wa) => (
            <button
              key={`home-${wa.id}`}
              onClick={() => { setHome(wa.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50"
              style={{ color: wa.color_hex ?? "#475569" }}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: wa.color_hex ?? "#475569" }} />
              {wa.name}
              {homeDepartmentId === wa.id && <span className="ml-auto text-slate-400">●</span>}
            </button>
          ))}

          {/* Can Work In */}
          <div className="border-t px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Can Work In</p>
          </div>
          {workAreas.map((wa) => {
            const checked = qualifiedDepartmentIds.includes(wa.id);
            const isHome = homeDepartmentId === wa.id;
            return (
              <button
                key={`qual-${wa.id}`}
                onClick={() => { if (!isHome) toggleQualified(wa.id); }}
                disabled={isHome}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                style={{ color: wa.color_hex ?? "#475569" }}
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${checked ? "border-slate-600 bg-slate-700" : "border-slate-300"}`}>
                  {checked && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="currentColor"><path d="M1.5 5l3 3 4-5.5"/></svg>}
                </span>
                {wa.name}
                {isHome && <span className="ml-auto text-[9px] text-slate-400">home</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
