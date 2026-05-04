"use client";

import { useEffect, useRef, useState } from "react";
import type { Employee, ModeCode, ShiftCode, StationAssignment } from "../types";
import { EmployeeCard } from "./employee-card";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  available:  { label: "Available",  className: "bg-green-100 text-green-700" },
  sick:       { label: "Sick",       className: "bg-red-100 text-red-600" },
  vacation:   { label: "Vacation",   className: "bg-yellow-100 text-yellow-600" },
  injured:    { label: "Injured",    className: "bg-orange-100 text-orange-600" },
  training:   { label: "Training",   className: "bg-purple-100 text-purple-600" },
  off_shift:  { label: "Off Shift",  className: "bg-slate-100 text-slate-500" },
};

export function AssignmentCell({
  stationId, shiftCode, modeCode, color, assignments, allEmployees, statuses, disabledEmployeeIds, onAssign, onRemove, workAreaName,
}: {
  stationId: string;
  shiftCode: ShiftCode;
  modeCode: ModeCode;
  color: string;
  assignments: StationAssignment[];
  allEmployees: Employee[];
  statuses?: Record<string, string>;
  disabledEmployeeIds?: Set<string>;
  onAssign: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void;
  onRemove: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void;
  workAreaName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "unassigned">("all");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  const cellAssignments = assignments.filter(
    (a) => a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode,
  );
  const assignedIds = new Set(cellAssignments.map((a) => a.employee_id));
  const assignedEmployees = cellAssignments
    .map((a) => allEmployees.find((e) => e.id === a.employee_id))
    .filter((e): e is Employee => !!e && !disabledEmployeeIds?.has(e.id));
  const UNAVAILABLE = new Set(["sick", "vacation", "injured"]);
  const deptEmployees = workAreaName
    ? allEmployees.filter((e) => e.departments.length === 0 || e.departments.includes(workAreaName))
    : allEmployees;
  const allPickable = deptEmployees.filter((e) => !assignedIds.has(e.id));
  const unassignedPickable = allPickable.filter((e) =>
    !assignments.some((a) => a.employee_id === e.id) || UNAVAILABLE.has(statuses?.[e.id] ?? "available")
  );

  const sortedAllPickable = [...allPickable].sort((a, b) => {
    if (a.departments.length === 0 && b.departments.length > 0) return 1;
    if (a.departments.length > 0 && b.departments.length === 0) return -1;
    return (a.departments[0] ?? "").localeCompare(b.departments[0] ?? "");
  });
  const baseList = tab === "unassigned" ? unassignedPickable : sortedAllPickable;
  const filtered = search.trim()
    ? baseList.filter((e) => e.full_name.toLowerCase().includes(search.toLowerCase()))
    : baseList;

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.right - 288 });
    }
    setIsOpen((v) => !v);
    setSearch("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const { employeeId, fromStationId, fromShiftCode, fromModeCode } = JSON.parse(e.dataTransfer.getData("application/json"));
      if (fromStationId === stationId && fromShiftCode === shiftCode && fromModeCode === modeCode) return;
      if (assignedIds.has(employeeId)) return;
      if (fromStationId) onRemove(employeeId, fromStationId, fromShiftCode, fromModeCode);
      onAssign(employeeId, stationId, shiftCode, modeCode);
    } catch {}
  };

  return (
    <div
      ref={ref}
      className="relative h-full min-h-12 rounded-md transition-all"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={isDragOver ? { backgroundColor: color + "22", outline: `2px solid ${color}99`, outlineOffset: "2px" } : {}}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          {assignedEmployees.length === 0 && !isOpen && (
            <div
              className="flex items-center justify-center rounded-md border border-dashed px-3 py-2 text-sm transition-colors"
              style={{ minHeight: "2.5rem", ...(isDragOver ? { borderColor: color, color } : { borderColor: "#cbd5e1", color: "#94a3b8" }) }}
            >
              {isDragOver ? "Drop here" : "No assignment"}
            </div>
          )}
          {assignedEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              stationId={stationId}
              shiftCode={shiftCode}
              modeCode={modeCode}
              onRemove={() => onRemove(emp.id, stationId, shiftCode, modeCode)}
            />
          ))}
        </div>
        <div className="shrink-0">
          <button
            ref={btnRef}
            onClick={handleOpen}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-600"
          >
            +
          </button>
          {isOpen && (
            <div
              className="fixed z-50 w-72 rounded-xl border bg-white shadow-2xl"
              style={{ top: dropPos.top, left: dropPos.left }}
            >
              {/* Search */}
              <div className="p-2 pb-0">
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                />
              </div>
              {/* Tabs */}
              <div className="flex gap-1 px-2 pt-2">
                <button
                  onClick={() => setTab("all")}
                  className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${tab === "all" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  All ({allPickable.length})
                </button>
                <button
                  onClick={() => setTab("unassigned")}
                  className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${tab === "unassigned" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  Unassigned ({unassignedPickable.length})
                </button>
              </div>
              {/* List */}
              <div className="max-h-56 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <p className="px-3 py-3 text-center text-sm text-slate-400">
                    {search ? "No results" : "No staff available"}
                  </p>
                )}
                {filtered.map((emp) => {
                  const status = statuses?.[emp.id] ?? "available";
                  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.available;
                  const empAssignCount = assignments.filter((a) => a.employee_id === emp.id).length;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => { onAssign(emp.id, stationId, shiftCode, modeCode); setIsOpen(false); setSearch(""); }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-slate-800 truncate">{emp.full_name}</span>
                        {emp.temporary && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Temp</span>
                        )}
                      </div>
                      {tab === "unassigned" ? (
                        <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                      ) : (
                        <div className="ml-2 flex shrink-0 items-center gap-1.5">
                          {emp.departments.map((d) => (
                            <span key={d} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{d}</span>
                          ))}
                          {empAssignCount > 0 && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-500">{empAssignCount}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
