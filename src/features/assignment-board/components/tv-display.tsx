"use client";

import React, { useEffect, useRef, useState } from "react";
import { Truck, Package, Settings, Scissors, Archive, Megaphone, Monitor } from "lucide-react";
import { mockShifts } from "../mock-data";
import type { Employee, EmployeeStatus, ShiftInfo, Station, StationAssignment, WorkArea } from "../types";

// ── helpers ───────────────────────────────────────────────────────────────────

function parseMin(t: string): number {
  const [h, m] = t.trim().split(":").map(Number);
  return h * 60 + m;
}

function getActiveShift(shifts: ShiftInfo[], now: Date): ShiftInfo | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return (
    shifts.find((s) => {
      if (!s.time_range.includes("-")) return false;
      const [a, b] = s.time_range.split("-");
      return nowMin >= parseMin(a) && nowMin <= parseMin(b);
    }) ?? null
  );
}

function getWaActiveMode(wa: WorkArea, nowMin: number): string {
  if (!wa.mode_views || wa.mode_views.length === 0) return "normal";
  for (const mv of wa.mode_views) {
    if (!mv.time_range) continue;
    const parts = mv.time_range.split("-").map((s) => s.trim());
    if (parts.length === 2 && nowMin >= parseMin(parts[0]) && nowMin <= parseMin(parts[1])) {
      return mv.mode_code;
    }
  }
  return wa.mode_views[0]?.mode_code ?? "normal";
}

function getNextShift(shifts: ShiftInfo[], current: ShiftInfo | null): ShiftInfo | null {
  if (!current) return shifts[0] ?? null;
  const idx = shifts.findIndex((s) => s.code === current.code);
  return shifts[idx + 1] ?? null;
}

const DEPT_ICONS: Record<string, React.ReactNode> = {
  "Loading Dock": <Truck size={13} />,
  "Small Pro": <Package size={13} />,
  "Processing Floor": <Settings size={13} />,
  "Meat Cutting": <Scissors size={13} />,
  "Packaging": <Archive size={13} />,
};

const UNAVAILABLE = new Set(["sick", "vacation", "off_shift"]);

// ── sub-components ────────────────────────────────────────────────────────────

function AutoScrollRows({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setInterval(() => {
      if (!el || el.scrollHeight <= el.clientHeight) return;
      if (atBottom.current) {
        el.scrollTo({ top: 0, behavior: "smooth" });
        atBottom.current = false;
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        atBottom.current = true;
      }
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto" style={style}>
      {children}
    </div>
  );
}

// ── TVDisplay ─────────────────────────────────────────────────────────────────

export function TVDisplay({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  shifts: shiftsProp,
  workAreaShifts,
  announcement = "Please clean your work area and report any equipment issues.",
  onClose,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  shifts?: ShiftInfo[];
  workAreaShifts?: Record<string, ShiftInfo[]>;
  announcement?: string;
  onClose: () => void;
}) {
  const [now, setNow] = useState(new Date());
  const [previewMode, setPreviewMode] = useState(false);
  const [previewTime, setPreviewTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const effectiveDate = (() => {
    if (!previewMode) return now;
    const [h, m] = previewTime.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const usedCodes = [...new Set(assignments.map((a) => a.shift_code))];
  const shifts: ShiftInfo[] = shiftsProp ?? [
    ...mockShifts,
    ...usedCodes
      .filter((c) => !mockShifts.some((s) => s.code === c))
      .map((c) => ({ code: c, label: c, time_range: "" })),
  ];

  const activeShift = getActiveShift(shifts, effectiveDate);
  const nextShift = getNextShift(shifts, activeShift);
  const nowMin = effectiveDate.getHours() * 60 + effectiveDate.getMinutes();

  const activeEmployees = employees.filter((e) => e.active);
  const shiftAssignments = activeShift
    ? assignments.filter((a) => a.shift_code === activeShift.code)
    : [];
  const assignedEmpIds = new Set(shiftAssignments.map((a) => a.employee_id));
  const totalStaff = activeEmployees.length;
  const assignedCount = activeEmployees.filter((e) => assignedEmpIds.has(e.id)).length;
  const efficiency = totalStaff > 0 ? ((assignedCount / totalStaff) * 100).toFixed(1) : "0.0";

  const sortedWorkAreas = [...workAreas].sort((a, b) => a.display_order - b.display_order);

  const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-950">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-4 bg-slate-900 px-6 py-3 border-b border-white/10">
        {/* Date + Time */}
        <div className="flex items-center gap-5 shrink-0">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {fmtDate(now)}
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {previewMode ? previewTime : fmt(now)}
          </span>
        </div>

        {/* Live / Preview toggle */}
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setPreviewMode(false)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${!previewMode ? "bg-green-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            ● Live
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${previewMode ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Preview
          </button>
        </div>

        {/* Preview controls */}
        {previewMode && (
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="time"
              value={previewTime}
              onChange={(e) => setPreviewTime(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-white/40"
            />
            <div className="flex items-center gap-1">
              {["06:00","08:00","10:00","12:00","14:00"].map((t) => (
                <button
                  key={t}
                  onClick={() => setPreviewTime(t)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    previewTime === t
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Shift */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Current Shift</p>
          <p className="text-3xl font-bold text-white leading-tight tracking-tight">
            {activeShift?.time_range?.replace("-", "  –  ") ?? "—"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Monitor size={14} />
            Admin View
          </button>
        </div>
      </div>

      {/* ── Content: department columns ── */}
      <div className="flex min-h-0 flex-1 overflow-x-auto">
        {!activeShift ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg font-semibold text-slate-500">No active shift at this time</p>
          </div>
        ) : sortedWorkAreas.flatMap((wa) => {
          const activeModeCode = getWaActiveMode(wa, nowMin);
          const waStations = stations
            .filter((s) => s.work_area_id === wa.id && (s.mode_code === activeModeCode || s.mode_code == null))
            .sort((a, b) => a.display_order - b.display_order);

          if (waStations.length === 0) return [];
          if (workAreaShifts && activeShift && !workAreaShifts[wa.id]?.some((s) => s.code === activeShift.code)) return [];

          return [(
            <div key={wa.id} className="flex min-w-[180px] flex-1 flex-col border-r border-slate-200 last:border-r-0">
              {/* Dept header */}
              <div
                className="shrink-0 flex items-center justify-center gap-2 px-3 py-3"
                style={{ backgroundColor: wa.color_hex ?? "#1e293b" }}
              >
                <span className="text-white/80 shrink-0">{DEPT_ICONS[wa.name] ?? <Package size={13} />}</span>
                <span className="text-sm font-bold uppercase tracking-widest text-white truncate">{wa.name}</span>
                {(() => {
                  const modeView = wa.mode_views?.find((mv) => mv.mode_code === activeModeCode);
                  if (!modeView) return null;
                  return (
                    <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                      {modeView.label}
                    </span>
                  );
                })()}
              </div>

              {/* Sub-header */}
              <div className="flex shrink-0 border-b border-slate-300">
                <div className="w-[45%] shrink-0 px-3 py-1.5 bg-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Station</span>
                </div>
                <div className="flex-1 bg-slate-300 px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee</span>
                </div>
              </div>

              {/* Rows */}
              <AutoScrollRows style={{ background: `linear-gradient(to right, #f8fafc 45%, white 45%)` }}>
                {waStations.map((station) => {
                  const asgn = shiftAssignments.find(
                    (a) => a.station_id === station.id && a.mode_code === activeModeCode
                  );
                  const emp = asgn ? activeEmployees.find((e) => e.id === asgn.employee_id) : null;
                  const isUnavailable = emp ? UNAVAILABLE.has(statuses[emp.id] ?? "") : false;
                  const dotColor = !emp || isUnavailable
                    ? "bg-red-500"
                    : emp.temporary
                    ? "bg-amber-400"
                    : "bg-green-500";

                  return (
                    <div
                      key={station.id}
                      className="flex items-stretch border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex w-[45%] shrink-0 items-center px-3 py-2" style={{ backgroundColor: "transparent" }}>
                        <span className="truncate text-xs text-slate-500">{station.name}</span>
                      </div>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 bg-white px-3 py-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                        {emp && !isUnavailable ? (
                          <>
                            <span className="truncate text-xs font-semibold text-slate-800">{emp.full_name}</span>
                            {emp.temporary && (
                              <span className="shrink-0 rounded bg-amber-100 px-1 py-px text-[9px] font-bold text-amber-600">
                                TEMP
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-red-500">Unassigned</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </AutoScrollRows>
            </div>
          )];
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-slate-900 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Megaphone size={13} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Announcement</span>
          </div>
          <span className="text-xl text-slate-300">{announcement}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-400 shrink-0">
          {nextShift && (
            <span>
              Next Shift <span className="font-semibold text-white">{nextShift.time_range}</span>
            </span>
          )}
          <span>
            Last Updated <span className="font-semibold text-white">{fmt(now)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
