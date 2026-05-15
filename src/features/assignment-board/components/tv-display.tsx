"use client";

import React, { useEffect, useRef, useState } from "react";
import { Truck, Package, Settings, Scissors, Archive, Megaphone, Monitor } from "lucide-react";
import { mockShifts } from "../mock-data";
import { DEFAULT_MODE_CODE } from "../types";
import type { Employee, EmployeeStatus, ShiftInfo, Station, StationAssignment, WorkArea } from "../types";
import { abbrevDept, getAssignmentWorkAreaId, getActiveShift, getNextShift, getWaActiveMode } from "../utils";
import { getUnavailableStatusCodes, type StatusConfig } from "./status-select";

const DEPT_ICONS: Record<string, React.ReactNode> = {
  "Loading Dock": <Truck size={13} />,
  "Small Pro": <Package size={13} />,
  "Processing Floor": <Settings size={13} />,
  "Meat Cutting": <Scissors size={13} />,
  "Packaging": <Archive size={13} />,
};

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

export function TVDisplay({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  shifts: shiftsProp,
  workAreaShifts,
  statusConfigs,
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
  statusConfigs: StatusConfig[];
  announcement?: string;
  onClose: () => void;
}) {
  const unavailableCodes = getUnavailableStatusCodes(statusConfigs);
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

  const sortedWorkAreas = [...workAreas].sort((a, b) => a.display_order - b.display_order);

  const loanedOutByWaId: Record<string, Employee[]> = {};
  const loanedInByWaId: Record<string, { emp: Employee; homeWaId: string | null }[]> = {};

  for (const wa of workAreas) {
    loanedOutByWaId[wa.id] = [];
    loanedInByWaId[wa.id] = [];
  }

  for (const asgn of shiftAssignments) {
    const emp = activeEmployees.find((e) => e.id === asgn.employee_id);
    if (!emp) continue;
    const homeWaId = emp.homeDepartmentId;
    const activeWaId = getAssignmentWorkAreaId(asgn, stations);
    if (!activeWaId || activeWaId === homeWaId) continue;
    const activeWa = workAreas.find((wa) => wa.id === activeWaId);
    const currentModeForWa = activeWa ? getWaActiveMode(activeWa, nowMin) : DEFAULT_MODE_CODE;
    if (asgn.mode_code !== currentModeForWa) continue;
    if (!loanedInByWaId[activeWaId]) continue;
    if (!loanedInByWaId[activeWaId].some((x) => x.emp.id === emp.id)) {
      loanedInByWaId[activeWaId].push({ emp, homeWaId });
    }
    if (homeWaId && loanedOutByWaId[homeWaId] && !loanedOutByWaId[homeWaId].some((e) => e.id === emp.id)) {
      loanedOutByWaId[homeWaId].push(emp);
    }
  }

  const uniqueActiveModes = sortedWorkAreas
    .map((wa) => {
      const modeCode = getWaActiveMode(wa, nowMin);
      if (modeCode === DEFAULT_MODE_CODE) return null;
      const modeView = wa.mode_views?.find((mv) => mv.mode_code === modeCode);
      return modeView ? { modeCode, label: modeView.label } : null;
    })
    .filter((m): m is { modeCode: string; label: string } => m !== null && m.modeCode !== "after_hog_break")
    .filter((m, i, arr) => arr.findIndex((x) => x.modeCode === m.modeCode) === i);

  const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-950">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-4 bg-slate-900 px-6 py-3 border-b border-white/10">
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

        <div className="flex flex-1 items-center justify-center gap-6">
          <div className="flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Current Shift</p>
            <p className="text-3xl font-bold text-white leading-tight tracking-tight">
              {activeShift?.time_range?.replace("-", "  –  ") ?? "—"}
            </p>
          </div>
          {uniqueActiveModes.length > 0 && (
            <div className="flex items-center gap-2">
              {uniqueActiveModes.map((m) => (
                <span
                  key={m.modeCode}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-xl font-extrabold uppercase tracking-widest text-white/90"
                >
                  {m.label}
                </span>
              ))}
            </div>
          )}
        </div>

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
              <div
                className="shrink-0 flex items-center justify-center gap-2 px-3 py-2"
                style={{ backgroundColor: wa.color_hex ?? "#1e293b" }}
              >
                <span className="text-white/80 shrink-0">{DEPT_ICONS[wa.name] ?? <Package size={13} />}</span>
                <span className="text-sm font-bold uppercase tracking-widest text-white truncate">{wa.name}</span>
              </div>

              <div className="shrink-0 flex items-center justify-center gap-3 px-3 py-1" style={{ backgroundColor: wa.color_hex ? `${wa.color_hex}99` : "#1e293b" }}>
                {loanedOutByWaId[wa.id]?.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                    ↑ {loanedOutByWaId[wa.id].length} Loaned Out
                  </span>
                )}
                {loanedInByWaId[wa.id]?.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-300/90">
                    ↓ {loanedInByWaId[wa.id].length} Support In
                  </span>
                )}
                {!loanedOutByWaId[wa.id]?.length && !loanedInByWaId[wa.id]?.length && (
                  <span className="text-[10px] text-transparent select-none">·</span>
                )}
              </div>

              <div className="flex shrink-0 border-b border-slate-300">
                <div className="w-[45%] shrink-0 px-3 py-1.5 bg-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Station</span>
                </div>
                <div className="flex-1 bg-slate-300 px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee</span>
                </div>
              </div>

              <AutoScrollRows style={{ background: `linear-gradient(to right, #f8fafc 45%, white 45%)` }}>
                {waStations.map((station) => {
                  const stationAsgns = shiftAssignments.filter(
                    (a) => a.station_id === station.id && a.mode_code === activeModeCode
                  );
                  const assignedEmps = stationAsgns
                    .map((a) => ({ asgn: a, emp: activeEmployees.find((e) => e.id === a.employee_id) }))
                    .filter((x): x is { asgn: typeof x.asgn; emp: NonNullable<typeof x.emp> } => !!x.emp);

                  return (
                    <div
                      key={station.id}
                      className="flex items-stretch border-b border-slate-300 last:border-b-0"
                    >
                      <div className="flex w-[45%] shrink-0 flex-col justify-start px-3 py-2">
                        <span className="truncate text-xs text-slate-500">{station.name}</span>
                        {assignedEmps.length > 1 && (
                          <span className="text-[10px] text-slate-400">{assignedEmps.length} people</span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col bg-white">
                        {assignedEmps.length === 0 ? (
                          <span className="flex items-center gap-1.5 px-3 py-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            <span className="text-xs font-semibold text-red-500">Unassigned</span>
                          </span>
                        ) : (
                          assignedEmps.map(({ asgn, emp }) => {
                            const isUnavailableEmp = unavailableCodes.has(statuses[emp.id] ?? "");
                            const asgnWaId = getAssignmentWorkAreaId(asgn, stations);
                            const isLoanedIn = !!asgnWaId && asgnWaId !== emp.homeDepartmentId;
                            const isInjured = statuses[emp.id] === "injured";
                            const dotColor = isUnavailableEmp
                              ? "bg-red-500"
                              : isInjured
                              ? "bg-orange-400"
                              : emp.temporary
                              ? "bg-sky-400"
                              : "bg-green-500";
                            return (
                              <span key={emp.id} className="flex items-center gap-1.5 px-3 py-2">
                                <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                                {!isUnavailableEmp ? (
                                  <>
                                    <span className="truncate text-xs font-semibold text-slate-800">{emp.full_name}</span>
                                    <span className="ml-auto flex shrink-0 items-center gap-1">
                                      {emp.temporary && (
                                        <span className="rounded bg-sky-50 px-1 py-px text-[9px] text-sky-400 border border-sky-100">
                                          TEMP
                                        </span>
                                      )}
                                      {isLoanedIn && emp.homeDepartmentId && (
                                        <span className="rounded border border-blue-200 bg-blue-50 px-1 py-px text-[9px] font-bold text-blue-600">
                                          {abbrevDept(workAreas.find((w) => w.id === emp.homeDepartmentId)?.name ?? emp.homeDepartmentId)}
                                        </span>
                                      )}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-semibold text-red-500">Unassigned</span>
                                )}
                              </span>
                            );
                          })
                        )}
                      </div>
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
