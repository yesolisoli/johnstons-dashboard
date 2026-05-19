"use client";

import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import {
  listAssignmentBoardSnapshots,
  loadAssignmentBoardSnapshot,
  type SnapshotListItem,
  type SnapshotRecord,
} from "../supabase";
import { getAssignmentWorkAreaId } from "../utils";
import { DEFAULT_MODE_CODE } from "../types";
import type { ModeCode } from "../types";
import { getUnavailableStatusCodes } from "./status-select";

function formatDate(workDate: string): string {
  const [y, m, d] = workDate.split("-").map(Number);
  if (!y || !m || !d) return workDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
}

function formatCapturedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

export function HistoryClient() {
  const [list, setList] = useState<SnapshotListItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [record, setRecord] = useState<SnapshotRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAssignmentBoardSnapshots()
      .then((items) => {
        if (cancelled) return;
        setList(items);
        if (items.length > 0) setSelectedDate(items[0].work_date);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setListError(error instanceof Error ? error.message : String(error));
        setList([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setRecord(null);
      return;
    }
    let cancelled = false;
    setRecordLoading(true);
    setRecordError(null);
    loadAssignmentBoardSnapshot(selectedDate)
      .then((r) => {
        if (cancelled) return;
        setRecord(r);
        setRecordLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRecordError(error instanceof Error ? error.message : String(error));
        setRecordLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return (
    <div className="flex h-full min-h-0 gap-4">
      <aside className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Saved Snapshots</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list === null ? (
            <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
          ) : listError ? (
            <p className="px-4 py-6 text-sm text-red-500">{listError}</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-slate-400">
              <Archive size={28} />
              <p className="text-sm">No snapshots yet</p>
              <p className="text-xs text-slate-400">
                A snapshot is captured automatically after the last shift ends.
              </p>
            </div>
          ) : (
            <ul>
              {list.map((item) => {
                const active = item.work_date === selectedDate;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(item.work_date)}
                      className={`flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                        active ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-800"}`}>
                        {formatDate(item.work_date)}
                      </span>
                      <span className="text-xs text-slate-500">
                        Captured {formatCapturedAt(item.captured_at)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
        {!selectedDate ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Select a snapshot to view
          </div>
        ) : recordLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading snapshot…</div>
        ) : recordError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{recordError}</div>
        ) : !record ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Snapshot not found</div>
        ) : (
          <SnapshotChart record={record} />
        )}
      </section>
    </div>
  );
}

function SnapshotChart({ record }: { record: SnapshotRecord }) {
  const { snapshot, work_date, captured_at } = record;
  const { employees, statuses, assignments, stations, workAreas, workAreaShifts, statusConfigs } = snapshot;

  const unavailableCodes = getUnavailableStatusCodes(statusConfigs);
  const sortedWorkAreas = [...workAreas].sort((a, b) => a.display_order - b.display_order);
  const activeEmployees = employees.filter((e) => e.active);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Snapshot</p>
        <h2 className="text-lg font-bold text-slate-800">{formatDate(work_date)}</h2>
        <p className="text-xs text-slate-500">Captured {formatCapturedAt(captured_at)} · Read-only</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${sortedWorkAreas.length || 1}, minmax(220px, 1fr))` }}>
          {sortedWorkAreas.map((wa) => {
            const modeCodes: ModeCode[] = wa.mode_views?.length
              ? (wa.mode_views.map((mv) => mv.mode_code) as ModeCode[])
              : [DEFAULT_MODE_CODE];

            return (
              <div key={wa.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-3 py-2" style={{ backgroundColor: wa.color_hex ?? "#1e293b" }}>
                  <p className="truncate text-sm font-bold uppercase tracking-widest text-white">{wa.name}</p>
                </div>

                {modeCodes.map((modeCode) => {
                  const waStations = stations
                    .filter((s) => s.work_area_id === wa.id && (s.mode_code === modeCode || s.mode_code == null))
                    .sort((a, b) => a.display_order - b.display_order);
                  if (waStations.length === 0) return null;

                  const shifts = workAreaShifts?.[wa.id]?.[modeCode] ?? [];

                  return (
                    <div key={modeCode} className="border-b border-slate-100 last:border-b-0">
                      {wa.mode_views && wa.mode_views.length > 1 && (
                        <p className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {wa.mode_views.find((mv) => mv.mode_code === modeCode)?.label ?? modeCode}
                        </p>
                      )}
                      {shifts.map((shift) => {
                        const shiftAsgns = assignments.filter(
                          (a) => a.shift_code === shift.code && a.mode_code === modeCode,
                        );
                        const hasAnyForShift = waStations.some((station) =>
                          shiftAsgns.some((a) => a.station_id === station.id),
                        );
                        if (!hasAnyForShift) return null;

                        return (
                          <div key={shift.code} className="border-b border-slate-100 last:border-b-0">
                            <div className="bg-slate-100/60 px-3 py-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                {shift.label}
                                {shift.time_range ? ` · ${shift.time_range.replace("-", " – ")}` : ""}
                              </p>
                            </div>
                            <ul>
                              {waStations.map((station) => {
                                const stationAsgns = shiftAsgns.filter((a) => a.station_id === station.id);
                                const assignedEmps = stationAsgns
                                  .map((a) => ({ asgn: a, emp: activeEmployees.find((e) => e.id === a.employee_id) }))
                                  .filter((x): x is { asgn: typeof x.asgn; emp: NonNullable<typeof x.emp> } => !!x.emp);

                                return (
                                  <li key={station.id} className="flex items-start gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
                                    <span className="w-2/5 shrink-0 truncate text-xs text-slate-600">{station.name}</span>
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                      {assignedEmps.length === 0 ? (
                                        <span className="text-xs font-semibold text-red-500">Unassigned</span>
                                      ) : (
                                        assignedEmps.map(({ asgn, emp }) => {
                                          const unavailable = unavailableCodes.has(statuses[emp.id] ?? "");
                                          const asgnWaId = getAssignmentWorkAreaId(asgn, stations);
                                          const loaned = !!asgnWaId && asgnWaId !== emp.homeDepartmentId;
                                          return (
                                            <span key={`${emp.id}-${asgn.id}`} className="flex items-center gap-1.5">
                                              <span
                                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                  unavailable ? "bg-red-500" : emp.temporary ? "bg-violet-400" : "bg-green-500"
                                                }`}
                                              />
                                              <span className={`truncate text-xs font-medium ${unavailable ? "text-red-500" : "text-slate-700"}`}>
                                                {emp.full_name}
                                              </span>
                                              {loaned && (
                                                <span className="ml-auto shrink-0 rounded border border-blue-200 bg-blue-50 px-1 text-[9px] text-blue-600">
                                                  loan
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
