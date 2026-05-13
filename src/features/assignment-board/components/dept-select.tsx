"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WorkArea } from "../types";

export function DeptSelect({
  homeDepartmentId,
  qualifiedDepartmentIds = [],
  workAreas,
  onChangeHome,
  onChangeQualified,
  showQualified = true,
  placeholder = "Select dept...",
  triggerClassName,
}: {
  homeDepartmentId: string | null;
  qualifiedDepartmentIds?: string[];
  workAreas: WorkArea[];
  onChangeHome: (waId: string | null) => void;
  onChangeQualified?: (waIds: string[]) => void;
  showQualified?: boolean;
  placeholder?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const openUp = rect.bottom + 320 > window.innerHeight;
      setPos({ top: openUp ? rect.top : rect.bottom + 4, left: rect.left, width: rect.width, openUp });
    }
    setOpen((v) => !v);
  };

  const homeWa = workAreas.find((w) => w.id === homeDepartmentId);

  const toggleQualified = (waId: string) => {
    if (!onChangeQualified) return;
    if (qualifiedDepartmentIds.includes(waId)) {
      onChangeQualified(qualifiedDepartmentIds.filter((id) => id !== waId));
    } else {
      onChangeQualified([...qualifiedDepartmentIds, waId]);
    }
  };

  const dropdown = open && (
    <div
      className="fixed z-200 min-w-48 rounded-lg border bg-white shadow-lg"
      style={pos.openUp
        ? { bottom: window.innerHeight - pos.top, left: pos.left, minWidth: Math.max(pos.width, 192) }
        : { top: pos.top, left: pos.left, minWidth: Math.max(pos.width, 192) }
      }
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="border-b px-3 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Home Dept</p>
      </div>
      {workAreas.map((wa) => (
        <button
          key={`home-${wa.id}`}
          onClick={() => { onChangeHome(wa.id); setOpen(false); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50"
          style={{ color: wa.color_hex ?? "#475569" }}
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: wa.color_hex ?? "#475569" }} />
          {wa.name}
          {homeDepartmentId === wa.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />}
        </button>
      ))}

      {showQualified && (
        <>
          <div className="border-t px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Qualified Dept</p>
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
        </>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={triggerClassName ?? "flex items-center gap-1 rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 hover:bg-white"}
        style={{ color: homeWa ? (homeWa.color_hex ?? "#475569") : "#94a3b8" }}
      >
        <span className="flex-1 text-left">{homeWa ? homeWa.name : placeholder}</span>
        <svg className="h-3 w-3 shrink-0 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {typeof window !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
