"use client";

import { useEffect, useRef, useState } from "react";
import {
  mockAssignments,
  mockEmployees,
  mockShifts,
  mockStations,
  mockWorkAreas,
  mockWorkDate,
} from "../mock-data";
import type {
  Employee,
  ModeCode,
  ShiftCode,
  ShiftInfo,
  Station,
  StationAssignment,
  WorkArea,
  WorkAreaModeView,
} from "../types";

// ─── EmployeeCard ─────────────────────────────────────────────────────────────

function EmployeeCard({ employee, onRemove }: { employee: Employee; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm">
      <div>
        <p className="font-medium text-slate-900">{employee.full_name}</p>
        {employee.employee_code && <p className="text-xs text-slate-500">{employee.employee_code}</p>}
      </div>
      <button onClick={onRemove} className="text-slate-300 transition-colors hover:text-red-400">
        ×
      </button>
    </div>
  );
}

// ─── AssignmentCell ───────────────────────────────────────────────────────────

function AssignmentCell({
  stationId, shiftCode, modeCode, assignments, allEmployees, disabledEmployeeIds, onAssign, onRemove,
}: {
  stationId: string;
  shiftCode: ShiftCode;
  modeCode: ModeCode;
  assignments: StationAssignment[];
  allEmployees: Employee[];
  disabledEmployeeIds?: Set<string>;
  onAssign: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void;
  onRemove: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isOpen]);

  const cellAssignments = assignments.filter(
    (a) => a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode,
  );
  const assignedIds = new Set(cellAssignments.map((a) => a.employee_id));
  const assignedEmployees = cellAssignments
    .map((a) => allEmployees.find((e) => e.id === a.employee_id))
    .filter((e): e is Employee => !!e && !disabledEmployeeIds?.has(e.id));
  const available = allEmployees.filter((e) => !assignedIds.has(e.id) && !disabledEmployeeIds?.has(e.id));

  return (
    <div ref={ref} className="relative space-y-2">
      {assignedEmployees.map((emp) => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          onRemove={() => onRemove(emp.id, stationId, shiftCode, modeCode)}
        />
      ))}
      {assignedEmployees.length === 0 && !isOpen && (
        <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
          No assignment
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600"
        >
          + Add
        </button>
        {isOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-lg border bg-white shadow-xl">
            <div className="p-2">
              {available.length > 0 ? (
                available.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => { onAssign(emp.id, stationId, shiftCode, modeCode); setIsOpen(false); }}
                    className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{emp.full_name}</span>
                    {emp.employee_code && <span className="text-xs text-slate-400">{emp.employee_code}</span>}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-slate-400">No more staff available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WorkAreaModal ────────────────────────────────────────────────────────────

function WorkAreaModal({ initial, onClose, onSave }: {
  initial?: WorkArea;
  onClose: () => void;
  onSave: (name: string, color: string, modeViews: WorkAreaModeView[]) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color_hex ?? "#334155");
  const [hasModes, setHasModes] = useState(!!(initial?.mode_views?.length));
  const [modeLabels, setModeLabels] = useState<[string, string]>([
    initial?.mode_views?.[0]?.label ?? "Hog Break",
    initial?.mode_views?.[1]?.label ?? "After Hog Break",
  ]);
  const [modeTimeRanges, setModeTimeRanges] = useState<[string, string]>([
    initial?.mode_views?.[0]?.time_range ?? "",
    initial?.mode_views?.[1]?.time_range ?? "",
  ]);
  const modeCodes: ModeCode[] = ["hog_break", "after_hog_break"];
  const buildViews = (): WorkAreaModeView[] =>
    hasModes ? modeCodes.map((mc, i) => ({ mode_code: mc, label: modeLabels[i], time_range: modeTimeRanges[i] || undefined })) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">{initial ? "Edit Department" : "Add Department"}</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Shipping" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border" />
              <span className="text-sm text-slate-500">{color}</span>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={hasModes} onChange={(e) => setHasModes(e.target.checked)} className="rounded" />
            Has mode views (e.g. During / After Hog Break)
          </label>
          {hasModes && (
            <div className="space-y-3 pl-5">
              {([0, 1] as const).map((i) => (
                <div key={i} className="flex gap-2">
                  <input value={modeLabels[i]}
                    onChange={(e) => setModeLabels((prev) => { const n = [...prev] as [string, string]; n[i] = e.target.value; return n; })}
                    className="flex-1 rounded-md border px-3 py-1.5 text-sm" placeholder={`Mode ${i + 1} label`} />
                  <input value={modeTimeRanges[i]}
                    onChange={(e) => setModeTimeRanges((prev) => { const n = [...prev] as [string, string]; n[i] = e.target.value; return n; })}
                    className="w-32 rounded-md border px-3 py-1.5 text-sm" placeholder="05:00 - 09:00" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim(), color, buildViews())} disabled={!name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {initial ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AssignmentGrid ───────────────────────────────────────────────────────────


export function AssignmentGrid({ employees: employeesProp, disabledEmployeeIds, assignments: assignmentsProp, onAssign: onAssignProp, onUnassign: onUnassignProp, stations: stationsProp, onStationsChange, onWorkAreasChange }: { employees?: Employee[]; disabledEmployeeIds?: Set<string>; assignments?: StationAssignment[]; onAssign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; onUnassign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; stations?: Station[]; onStationsChange?: (s: Station[]) => void; onWorkAreasChange?: (wa: WorkArea[]) => void } = {}) {
  const [localWorkAreas, setLocalWorkAreas] = useState<WorkArea[]>(mockWorkAreas);
  const workAreas = localWorkAreas;
  const setWorkAreas = (updater: WorkArea[] | ((prev: WorkArea[]) => WorkArea[])) => {
    const next = typeof updater === "function" ? updater(localWorkAreas) : updater;
    setLocalWorkAreas(next);
    onWorkAreasChange?.(next);
  };
  const [localStations, setLocalStations] = useState<Station[]>(mockStations);
  const stations = stationsProp ?? localStations;
  const setStations = (updater: Station[] | ((prev: Station[]) => Station[])) => {
    const next = typeof updater === "function" ? updater(stations) : updater;
    setLocalStations(next);
    onStationsChange?.(next);
  };
  // Shifts per work area
  const [workAreaShifts, setWorkAreaShifts] = useState<Record<string, ShiftInfo[]>>(() =>
    Object.fromEntries(mockWorkAreas.map((wa) => [wa.id, [...mockShifts]])),
  );
  const [localAssignments, setLocalAssignments] = useState<StationAssignment[]>(mockAssignments);
  const assignments = assignmentsProp ?? localAssignments;
  const setAssignments = (updater: StationAssignment[] | ((prev: StationAssignment[]) => StationAssignment[])) => {
    const next = typeof updater === "function" ? updater(assignments) : updater;
    setLocalAssignments(next);
  };
  const employees = (employeesProp ?? mockEmployees).filter((e) => e.active);

  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState(mockWorkAreas[0].id);
  const [selectedMode, setSelectedMode] = useState<ModeCode>("normal");

  // Shift editing state
  const [editingShift, setEditingShift] = useState<{ code: ShiftCode; label: string; timeRange: string } | null>(null);
  const [addingShift, setAddingShift] = useState<{ label: string; timeRange: string } | null>(null);

  // Station editing state
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editingStationName, setEditingStationName] = useState("");
  const [addingStation, setAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState("");

  const [workAreaModal, setWorkAreaModal] = useState<"add" | WorkArea | null>(null);

  const sortedWorkAreas = [...workAreas].sort((a, b) => a.display_order - b.display_order);
  const selectedWorkArea = workAreas.find((wa) => wa.id === selectedWorkAreaId) ?? workAreas[0];
  const hasModes = !!selectedWorkArea?.mode_views?.length;
  const currentShifts = workAreaShifts[selectedWorkAreaId] ?? [];
  const workAreaStations = stations
    .filter((s) => s.work_area_id === selectedWorkAreaId)
    .sort((a, b) => a.display_order - b.display_order);

  const selectWorkArea = (waId: string) => {
    setSelectedWorkAreaId(waId);
    const wa = workAreas.find((w) => w.id === waId);
    setSelectedMode(wa?.mode_views?.[0]?.mode_code ?? "normal");
    setEditingShift(null);
    setAddingShift(null);
  };

  // ── Shift handlers ──
  const handleSaveEditShift = () => {
    if (!editingShift) return;
    setWorkAreaShifts((prev) => ({
      ...prev,
      [selectedWorkAreaId]: (prev[selectedWorkAreaId] ?? []).map((s) =>
        s.code === editingShift.code ? { ...s, label: editingShift.label, time_range: editingShift.timeRange } : s,
      ),
    }));
    setEditingShift(null);
  };

  const handleAddShift = () => {
    if (!addingShift || !addingShift.label.trim()) return;
    const next = `shift_${Date.now()}`;
    setWorkAreaShifts((prev) => ({
      ...prev,
      [selectedWorkAreaId]: [
        ...(prev[selectedWorkAreaId] ?? []),
        { code: next, label: addingShift.label.trim(), time_range: addingShift.timeRange.trim() },
      ],
    }));
    setAddingShift(null);
  };

  const handleDeleteShift = (code: ShiftCode) => {
    setWorkAreaShifts((prev) => ({
      ...prev,
      [selectedWorkAreaId]: (prev[selectedWorkAreaId] ?? []).filter((s) => s.code !== code),
    }));
    const stationIdSet = new Set(workAreaStations.map((s) => s.id));
    if (onUnassignProp) {
      assignments.filter((a) => stationIdSet.has(a.station_id) && a.shift_code === code).forEach((a) => onUnassignProp(a.employee_id, a.station_id, a.shift_code, a.mode_code));
    } else {
      setAssignments((prev) => prev.filter((a) => !(stationIdSet.has(a.station_id) && a.shift_code === code)));
    }
  };

  // ── Assignment handlers ──
  const handleAssign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    if (onAssignProp) { onAssignProp(employeeId, stationId, shiftCode, modeCode); return; }
    if (localAssignments.some((a) => a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)) return;
    setLocalAssignments((prev) => [...prev, { id: `a_${Date.now()}`, employee_id: employeeId, station_id: stationId, work_date: mockWorkDate, shift_code: shiftCode, mode_code: modeCode }]);
  };

  const handleRemove = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    if (onUnassignProp) { onUnassignProp(employeeId, stationId, shiftCode, modeCode); return; }
    setLocalAssignments((prev) => prev.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)));
  };

  // ── Station handlers ──
  const handleSaveStation = (stationId: string) => {
    if (!editingStationName.trim()) return;
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, name: editingStationName.trim() } : s)));
    setEditingStationId(null);
  };

  const handleAddStation = () => {
    if (!newStationName.trim()) return;
    setStations((prev) => [...prev, { id: `st_${Date.now()}`, work_area_id: selectedWorkAreaId, name: newStationName.trim(), required_headcount: 1, display_order: workAreaStations.length + 1 }]);
    setNewStationName("");
    setAddingStation(false);
  };

  const handleDeleteStation = (stationId: string) => {
    setStations((prev) => prev.filter((s) => s.id !== stationId));
    if (onUnassignProp) {
      assignments.filter((a) => a.station_id === stationId).forEach((a) => onUnassignProp(a.employee_id, a.station_id, a.shift_code, a.mode_code));
    } else {
      setAssignments((prev) => prev.filter((a) => a.station_id !== stationId));
    }
  };

  // ── Work area handlers ──
  const handleSaveWorkArea = (name: string, color: string, modeViews: WorkAreaModeView[]) => {
    if (workAreaModal === "add") {
      const newWa: WorkArea = { id: `wa_${Date.now()}`, name, color_hex: color, display_order: workAreas.length + 1, mode_views: modeViews.length ? modeViews : undefined };
      setWorkAreas((prev) => [...prev, newWa]);
      setWorkAreaShifts((prev) => ({ ...prev, [newWa.id]: [...mockShifts] }));
      setWorkAreaModal(null);
      selectWorkArea(newWa.id);
    } else if (workAreaModal && typeof workAreaModal === "object") {
      setWorkAreas((prev) => prev.map((wa) => wa.id === workAreaModal.id ? { ...wa, name, color_hex: color, mode_views: modeViews.length ? modeViews : undefined } : wa));
      setWorkAreaModal(null);
    }
  };

  const color = selectedWorkArea?.color_hex ?? "#334155";

  return (
    <div className="min-w-0 space-y-6">
      {/* Work Area Tabs */}
      <div className="flex flex-wrap gap-2">
        {sortedWorkAreas.map((wa) => (
          <button key={wa.id} onClick={() => selectWorkArea(wa.id)} onDoubleClick={() => setWorkAreaModal(wa)} title="Double-click to edit"
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all"
            style={selectedWorkAreaId === wa.id ? { backgroundColor: wa.color_hex ?? "#334155", color: "#fff" } : { backgroundColor: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}>
            {wa.name}
          </button>
        ))}
        <button onClick={() => setWorkAreaModal("add")}
          className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700">
          + Add Dept
        </button>
      </div>

      {/* Mode toggle */}
      {hasModes && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mode:</span>
          {selectedWorkArea.mode_views!.map((mv) => (
            <button
              key={mv.mode_code}
              onClick={() => setSelectedMode(mv.mode_code)}
              className="rounded px-4 py-1.5 text-sm font-medium transition-all"
              style={
                selectedMode === mv.mode_code
                  ? { backgroundColor: "#1e293b", color: "#fff" }
                  : { backgroundColor: "#f1f5f9", color: "#475569" }
              }
            >
              {mv.label}{mv.time_range ? ` (${mv.time_range})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="max-w-full overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full border-collapse" style={{ minWidth: "max-content" }}>
          <thead>
            <tr>
              {/* Station label */}
              <th className="sticky left-0 z-10 w-48 bg-slate-50 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Station
              </th>

              {/* Shift column headers */}
              {currentShifts.map((shift) => (
                <th key={shift.code} className="group/col min-w-52 px-4 py-3 text-left text-sm font-semibold text-white" style={{ backgroundColor: color }}>
                  {editingShift?.code === shift.code ? (
                    <div className="flex items-center gap-1.5" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleSaveEditShift(); }}>
                      <input value={editingShift.label} onChange={(e) => setEditingShift((s) => s && { ...s, label: e.target.value })}
                        className="w-24 rounded border border-white/30 bg-white px-2 py-1 text-sm font-normal text-slate-800" autoFocus />
                      <input value={editingShift.timeRange} onChange={(e) => setEditingShift((s) => s && { ...s, timeRange: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEditShift()}
                        className="w-28 rounded border border-white/30 bg-white px-2 py-1 text-sm font-normal text-slate-800" placeholder="5:00-7:30" />
                      <button onClick={handleSaveEditShift} className="text-white hover:opacity-70">✓</button>
                      <button onClick={() => setEditingShift(null)} className="text-white/60 hover:text-white">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer hover:opacity-80"
                        onClick={() => setEditingShift({ code: shift.code, label: shift.label, timeRange: shift.time_range })}
                        title="Click to edit">
                        {shift.label}
                        {shift.time_range && <span className="ml-1.5 text-xs font-normal opacity-80">{shift.time_range}</span>}
                      </span>
                      <button onClick={() => handleDeleteShift(shift.code)}
                        className="ml-auto hidden text-white/50 hover:text-white group-hover/col:block">×</button>
                    </div>
                  )}
                </th>
              ))}

              {/* Add shift th */}
              <th className="whitespace-nowrap px-3 py-3 text-left" style={{ backgroundColor: color }}>
                {addingShift !== null ? (
                  <div className="flex items-center gap-1.5" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleAddShift(); }}>
                    <input value={addingShift.label} onChange={(e) => setAddingShift((s) => s && { ...s, label: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddShift(); if (e.key === "Escape") setAddingShift(null); }}
                      className="w-24 rounded border border-white/30 bg-white px-2 py-1 text-sm font-normal text-slate-800" placeholder="Name" autoFocus />
                    <input value={addingShift.timeRange} onChange={(e) => setAddingShift((s) => s && { ...s, timeRange: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddShift(); if (e.key === "Escape") setAddingShift(null); }}
                      className="w-28 rounded border border-white/30 bg-white px-2 py-1 text-sm font-normal text-slate-800" placeholder="5:00-7:30" />
                    <button onClick={handleAddShift} className="text-white hover:opacity-70">✓</button>
                    <button onClick={() => setAddingShift(null)} className="text-white/60 hover:text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingShift({ label: "", timeRange: "" })}
                    className="whitespace-nowrap rounded-md border border-white/30 px-3 py-1 text-sm text-white/80 hover:border-white hover:text-white">
                    + Shift
                  </button>
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {workAreaStations.map((station) => (
              <tr key={station.id} className="group border-t hover:bg-slate-50/50">
                {/* Station name */}
                <td className="sticky left-0 z-10 bg-white px-5 py-4 align-top group-hover:bg-slate-50/50">
                  {editingStationId === station.id ? (
                    <div className="flex flex-col gap-1.5">
                      <input value={editingStationName} onChange={(e) => setEditingStationName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveStation(station.id)}
                        className="rounded-md border px-2 py-1 text-sm" autoFocus />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveStation(station.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                        <button onClick={() => setEditingStationId(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer text-sm italic text-slate-700 hover:text-blue-600"
                        onDoubleClick={() => { setEditingStationId(station.id); setEditingStationName(station.name); }}
                        title="Double-click to edit">
                        {station.name}
                      </span>
                      <button onClick={() => handleDeleteStation(station.id)}
                        className="ml-auto hidden text-slate-300 hover:text-red-400 group-hover:block">×</button>
                    </div>
                  )}
                </td>

                {/* Assignment cells */}
                {currentShifts.map((shift) => (
                  <td key={shift.code} className="px-4 py-4 align-top">
                    <AssignmentCell stationId={station.id} shiftCode={shift.code} modeCode={selectedMode}
                      assignments={assignments} allEmployees={employees} disabledEmployeeIds={disabledEmployeeIds} onAssign={handleAssign} onRemove={handleRemove} />
                  </td>
                ))}

                {/* Empty cell under + Shift column */}
                <td />
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={currentShifts.length + 2} className="border-t border-slate-100 px-5 py-3">
                {addingStation ? (
                  <div className="flex items-center gap-2">
                    <input value={newStationName} onChange={(e) => setNewStationName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddStation(); if (e.key === "Escape") { setAddingStation(false); setNewStationName(""); } }}
                      placeholder="Station name..." className="rounded-md border px-3 py-1.5 text-sm" autoFocus />
                    <button onClick={handleAddStation} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">Add</button>
                    <button onClick={() => { setAddingStation(false); setNewStationName(""); }} className="text-sm text-slate-500">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingStation(true)}
                    className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-4 py-1.5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700">
                    + Add Station
                  </button>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Work Area Modal */}
      {workAreaModal && (
        <WorkAreaModal initial={workAreaModal === "add" ? undefined : workAreaModal}
          onClose={() => setWorkAreaModal(null)} onSave={handleSaveWorkArea} />
      )}
    </div>
  );
}
