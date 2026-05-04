"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./modal";
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

function EmployeeCard({ employee, stationId, shiftCode, modeCode, onRemove }: {
  employee: Employee;
  stationId: string;
  shiftCode: ShiftCode;
  modeCode: ModeCode;
  onRemove: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      employeeId: employee.id,
      fromStationId: stationId,
      fromShiftCode: shiftCode,
      fromModeCode: modeCode,
    }));
    const ghost = document.createElement("div");
    ghost.textContent = employee.full_name;
    Object.assign(ghost.style, {
      position: "fixed", top: "-200px", left: "-200px",
      background: "white", padding: "6px 12px", borderRadius: "6px",
      fontSize: "13px", fontWeight: "600", color: "#475569",
      boxShadow: "0 4px 14px rgba(0,0,0,0.18)", border: "1px solid #e2e8f0",
      whiteSpace: "nowrap", pointerEvents: "none",
    });
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex cursor-grab items-center justify-between gap-2 rounded-md bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <p className="font-bold text-slate-600 truncate">{employee.full_name}</p>
        {employee.temporary && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Temp
          </span>
        )}
      </div>
      <button onClick={onRemove} className="shrink-0 text-slate-300 transition-colors hover:text-red-400">
        ×
      </button>
    </div>
  );
}

// ─── AssignmentCell ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  available:  { label: "Available",  className: "bg-green-100 text-green-700" },
  sick:       { label: "Sick",       className: "bg-red-100 text-red-600" },
  vacation:   { label: "Vacation",   className: "bg-yellow-100 text-yellow-600" },
  injured:    { label: "Injured",    className: "bg-orange-100 text-orange-600" },
  training:   { label: "Training",   className: "bg-purple-100 text-purple-600" },
  off_shift:  { label: "Off Shift",  className: "bg-slate-100 text-slate-500" },
};

function AssignmentCell({
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

// ─── AddStationModal ─────────────────────────────────────────────────────────

function AddStationModal({ existingGroups, onClose, onSave }: {
  existingGroups: string[];
  onClose: () => void;
  onSave: (name: string, group: string) => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const canSave = name.trim().length > 0;

  return (
    <Modal onClose={onClose} title="New Station"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => canSave && onSave(name.trim(), group.trim())}
            disabled={!canSave}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            Add Station
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Station Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave(name.trim(), group.trim())}
            autoFocus
            placeholder="e.g. Saw, Helper #1"
            className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-slate-800 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Group</label>
            <span className="text-xs text-slate-300">— optional</span>
          </div>
          {existingGroups.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {existingGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(group === g ? "" : g)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${group === g ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder={existingGroups.length > 0 ? "Or type a new group name..." : "Type a group name..."}
            className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-slate-800 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── WorkAreaModal ──────────────────────────────────────────────────────────

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
    <Modal
      title={initial ? "Edit Department" : "Add Department"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), color, buildViews())}
            disabled={!name.trim()}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
          >
            {initial ? "Save" : "Add Department"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Shipping"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Color */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Color</label>
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer">
              <span className="block h-9 w-9 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: color }} />
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
            <span className="rounded-md bg-slate-50 px-2.5 py-1 font-mono text-sm text-slate-500">{color}</span>
          </div>
        </div>

        {/* Mode views toggle */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className={`relative h-5 w-9 rounded-full transition-colors ${hasModes ? "bg-slate-800" : "bg-slate-200"}`}
              onClick={() => setHasModes((v) => !v)}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hasModes ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Has mode views</span>
            <span className="text-xs text-slate-400">(e.g. Hog Break / After Hog Break)</span>
          </label>

          {hasModes && (
            <div className="mt-4 space-y-3">
              {([0, 1] as const).map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-400">Mode {i + 1}</span>
                  <input
                    value={modeLabels[i]}
                    onChange={(e) => setModeLabels((prev) => { const n = [...prev] as [string, string]; n[i] = e.target.value; return n; })}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder={`Mode ${i + 1} label`}
                  />
                  <input
                    value={modeTimeRanges[i]}
                    onChange={(e) => setModeTimeRanges((prev) => { const n = [...prev] as [string, string]; n[i] = e.target.value; return n; })}
                    className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="05:00–09:00"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── AssignmentGrid ───────────────────────────────────────────────────────────


export function AssignmentGrid({ employees: employeesProp, statuses, disabledEmployeeIds, assignments: assignmentsProp, onAssign: onAssignProp, onUnassign: onUnassignProp, onClearWorkArea, stations: stationsProp, onStationsChange, workAreas: workAreasProp, onWorkAreasChange, selectedWorkAreaId: selectedWorkAreaIdProp, onWorkAreaChange }: { employees?: Employee[]; statuses?: Record<string, string>; disabledEmployeeIds?: Set<string>; assignments?: StationAssignment[]; onAssign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; onUnassign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; onClearWorkArea?: (workAreaId: string) => void; stations?: Station[]; onStationsChange?: (s: Station[]) => void; workAreas?: WorkArea[]; onWorkAreasChange?: (wa: WorkArea[]) => void; selectedWorkAreaId?: string; onWorkAreaChange?: (id: string) => void } = {}) {
  const [localWorkAreas, setLocalWorkAreas] = useState<WorkArea[]>(mockWorkAreas);
  const workAreas = workAreasProp ?? localWorkAreas;
  const setWorkAreas = (updater: WorkArea[] | ((prev: WorkArea[]) => WorkArea[])) => {
    const next = typeof updater === "function" ? updater(workAreas) : updater;
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

  const [localSelectedWorkAreaId, setLocalSelectedWorkAreaId] = useState(mockWorkAreas[0].id);
  const selectedWorkAreaId = selectedWorkAreaIdProp ?? localSelectedWorkAreaId;
  const [selectedMode, setSelectedMode] = useState<ModeCode>("normal");

  // Shift editing state
  const [editingShift, setEditingShift] = useState<{ code: ShiftCode; label: string; startTime: string; endTime: string } | null>(null);
  const [addingShift, setAddingShift] = useState<{ label: string; startTime: string; endTime: string } | null>(null);

  // Station editing state
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editingStationName, setEditingStationName] = useState("");
  const [editingStationGroup, setEditingStationGroup] = useState("");
  const [addingStation, setAddingStation] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Group editing state
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupText, setEditingGroupText] = useState("");

  // Station drag state
  const [dragStationId, setDragStationId] = useState<string | null>(null);
  const [dragOverStationId, setDragOverStationId] = useState<string | null>(null);

  const [workAreaModal, setWorkAreaModal] = useState<"add" | WorkArea | null>(null);

  const sortedWorkAreas = [...workAreas].sort((a, b) => a.display_order - b.display_order);
  const selectedWorkArea = workAreas.find((wa) => wa.id === selectedWorkAreaId) ?? workAreas[0];
  const hasModes = !!selectedWorkArea?.mode_views?.length;
  const currentShifts = workAreaShifts[selectedWorkAreaId] ?? [];
  const workAreaStations = stations
    .filter((s) => s.work_area_id === selectedWorkAreaId && (!hasModes || s.mode_code === selectedMode))
    .sort((a, b) => a.display_order - b.display_order);

  const selectWorkArea = (waId: string) => {
    setLocalSelectedWorkAreaId(waId);
    onWorkAreaChange?.(waId);
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
        s.code === editingShift.code ? { ...s, label: editingShift.label, time_range: editingShift.startTime && editingShift.endTime ? `${editingShift.startTime}-${editingShift.endTime}` : "" } : s,
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
        { code: next, label: addingShift.label.trim(), time_range: addingShift.startTime && addingShift.endTime ? `${addingShift.startTime}-${addingShift.endTime}` : "" },
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
    const newGroup = editingStationGroup.trim() || undefined;
    setStations((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const target = sorted.find((s) => s.id === stationId);
      if (!target || target.group === newGroup) {
        return prev.map((s) => s.id === stationId ? { ...s, name: editingStationName.trim(), group: newGroup } : s);
      }
      // Find insertion point: after last station of the new group in same work area
      const sameArea = sorted.filter((s) => s.work_area_id === target.work_area_id && (!hasModes || s.mode_code === target.mode_code));
      const groupStations = newGroup ? sameArea.filter((s) => s.id !== stationId && s.group === newGroup) : [];
      let insertAfterOrder: number;
      if (groupStations.length > 0) {
        insertAfterOrder = groupStations[groupStations.length - 1].display_order;
      } else {
        insertAfterOrder = sameArea[sameArea.length - 1]?.display_order ?? 0;
      }
      // Rebuild display_orders: remove target, insert after insertAfterOrder
      const withoutTarget = sameArea.filter((s) => s.id !== stationId);
      const updated = withoutTarget.map((s) => ({ ...s }));
      // Insert target after the insertAfterOrder position
      const insertIdx = updated.findIndex((s) => s.display_order === insertAfterOrder);
      updated.splice(insertIdx + 1, 0, { ...target, name: editingStationName.trim(), group: newGroup });
      // Renormalize display_order
      updated.forEach((s, i) => { s.display_order = i + 1; });
      return prev.map((s) => updated.find((u) => u.id === s.id) ?? s);
    });
    setEditingStationId(null);
  };

  // ── Group handlers ──
  const handleDeleteGroup = (groupName: string) => {
    setStations((prev) => prev.map((s) =>
      s.work_area_id === selectedWorkAreaId &&
      (!hasModes || s.mode_code === selectedMode) &&
      s.group === groupName
        ? { ...s, group: undefined }
        : s,
    ));
  };

  const handleAddStation = (name: string, group: string) => {
    setStations((prev) => [...prev, {
      id: `st_${Date.now()}`,
      work_area_id: selectedWorkAreaId,
      name,
      required_headcount: 1,
      display_order: workAreaStations.length + 1,
      ...(hasModes ? { mode_code: selectedMode } : {}),
      ...(group ? { group } : {}),
    }]);
    setAddingStation(false);
  };

  const handleSaveGroupName = (oldName: string) => {
    if (!editingGroupText.trim() || editingGroupText.trim() === oldName) {
      setEditingGroupKey(null);
      return;
    }
    setStations((prev) => prev.map((s) =>
      s.work_area_id === selectedWorkAreaId &&
      (!hasModes || s.mode_code === selectedMode) &&
      s.group === oldName
        ? { ...s, group: editingGroupText.trim() }
        : s,
    ));
    setEditingGroupKey(null);
  };

  const handleStationDrop = (targetStationId: string) => {
    if (!dragStationId || dragStationId === targetStationId) return;
    setStations((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const dragged = sorted.find((s) => s.id === dragStationId);
      const target = sorted.find((s) => s.id === targetStationId);
      if (!dragged || !target) return prev;
      const sameArea = sorted.filter((s) => s.work_area_id === dragged.work_area_id && (!hasModes || s.mode_code === dragged.mode_code));
      const withoutDragged = sameArea.filter((s) => s.id !== dragStationId);
      const targetIdx = withoutDragged.findIndex((s) => s.id === targetStationId);
      withoutDragged.splice(targetIdx + 1, 0, { ...dragged, group: target.group });
      withoutDragged.forEach((s, i) => { s.display_order = i + 1; });
      return prev.map((s) => withoutDragged.find((u) => u.id === s.id) ?? s);
    });
    setDragStationId(null);
    setDragOverStationId(null);
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
    <div className="flex h-full min-w-0 flex-col gap-4">
      {/* Work Area Tabs */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
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
        <button
          onClick={() => setConfirmClear(true)}
          className="ml-auto rounded-lg px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Mode toggle */}
      {hasModes && (
        <div className="shrink-0 flex items-center gap-2">
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
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-700 bg-white">
        <table className="w-full border-separate border-spacing-0" style={{ minWidth: "max-content" }}>
          <thead className="sticky top-0 z-30">
            <tr>
              {/* Station label */}
              <th className="sticky left-0 z-10 w-48 bg-white px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 border-r border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span>Station</span>
                  <button onClick={() => setAddingStation(true)} title="Add station"
                    className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-slate-600 text-slate-400 hover:border-slate-300 hover:text-white text-xs">
                    +
                  </button>
                </div>
              </th>

              {/* Shift column headers */}
              {currentShifts.map((shift) => (
                <th key={shift.code} className="group/col min-w-52 px-4 py-3 text-left text-sm font-semibold text-white" style={{ backgroundColor: color }}>
                  {editingShift?.code === shift.code ? (
                    <div className="flex items-center gap-1.5" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleSaveEditShift(); }}>
                      <input value={editingShift.label} onChange={(e) => setEditingShift((s) => s && { ...s, label: e.target.value })}
                        className="w-24 rounded border border-white/30 bg-white px-2 py-1 text-sm font-normal text-slate-800" autoFocus />
                      <input type="time" value={editingShift.startTime} onChange={(e) => setEditingShift((s) => s && { ...s, startTime: e.target.value })}
                        className="w-16 min-w-0 rounded border border-white/30 bg-white px-1.5 py-1 text-xs font-normal text-slate-800 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                      <span className="text-white/60 text-xs">–</span>
                      <input type="time" value={editingShift.endTime} onChange={(e) => setEditingShift((s) => s && { ...s, endTime: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEditShift()}
                        className="w-16 min-w-0 rounded border border-white/30 bg-white px-1.5 py-1 text-xs font-normal text-slate-800 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                      <button onClick={handleSaveEditShift} className="text-white hover:opacity-70">✓</button>
                      <button onClick={() => setEditingShift(null)} className="text-white/60 hover:text-white">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          const [start, end] = (shift.time_range ?? "").split("-");
                          setEditingShift({ code: shift.code, label: shift.label, startTime: start ?? "", endTime: end ?? "" });
                        }}
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
                    <input type="time" value={addingShift.startTime} onChange={(e) => setAddingShift((s) => s && { ...s, startTime: e.target.value })}
                      className="w-16 min-w-0 rounded border border-white/30 bg-white px-1.5 py-1 text-xs font-normal text-slate-800 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                    <span className="text-white/60 text-xs">–</span>
                    <input type="time" value={addingShift.endTime} onChange={(e) => setAddingShift((s) => s && { ...s, endTime: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddShift(); if (e.key === "Escape") setAddingShift(null); }}
                      className="w-16 min-w-0 rounded border border-white/30 bg-white px-1.5 py-1 text-xs font-normal text-slate-800 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                    <button onClick={handleAddShift} className="text-white hover:opacity-70">✓</button>
                    <button onClick={() => setAddingShift(null)} className="text-white/60 hover:text-white">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingShift({ label: "", startTime: "", endTime: "" })}
                    className="whitespace-nowrap rounded-md border border-white/30 px-3 py-1 text-sm text-white/80 hover:border-white hover:text-white">
                    + Shift
                  </button>
                )}
              </th>
            </tr>
          </thead>

          <tbody style={{ backgroundColor: color + "1a" }}>
            {(() => {
              let prevGroup: string | undefined = "__init__";
              return workAreaStations.map((station) => {
                const showGroupHeader = station.group !== undefined && station.group !== prevGroup;
                prevGroup = station.group;
                return (
                  <React.Fragment key={station.id}>
                    {showGroupHeader && (
                      <tr className="group/grp">
                        <td
                          colSpan={currentShifts.length + 2}
                          className="border-t border-b py-0.5 text-center"
                          style={{ borderTopColor: color + "40", borderBottomColor: color + "40", backgroundColor: color + "18" }}
                        >
                          {editingGroupKey === station.group ? (
                            <input
                              value={editingGroupText}
                              onChange={(e) => setEditingGroupText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveGroupName(station.group!); if (e.key === "Escape") setEditingGroupKey(null); }}
                              onBlur={() => handleSaveGroupName(station.group!)}
                              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 outline-none text-center"
                              autoFocus
                            />
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="cursor-pointer text-xs font-semibold uppercase tracking-wider hover:opacity-80"
                                style={{ color, letterSpacing: "0.08em" }}
                                onDoubleClick={() => { setEditingGroupKey(station.group!); setEditingGroupText(station.group!); }}
                                title="Double-click to rename"
                              >
                                {station.group}
                              </span>
                              <button
                                onClick={() => handleDeleteGroup(station.group!)}
                                className="hidden rounded px-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-400 group-hover/grp:inline-flex"
                                title="Remove group (ungroup stations)"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    <tr
                      className={`group border-t transition-colors ${dragOverStationId === station.id && dragStationId !== station.id ? "outline-2 -outline-offset-2" : ""}`}
                      style={{ borderColor: color + "40", outlineColor: color }}
                      draggable={!station.protected && editingStationId !== station.id}
                      onDragStart={() => setDragStationId(station.id)}
                      onDragEnd={() => { setDragStationId(null); setDragOverStationId(null); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverStationId(station.id); }}
                      onDragLeave={() => setDragOverStationId(null)}
                      onDrop={() => handleStationDrop(station.id)}
                    >
                {/* Station name */}
                <td className="sticky left-0 z-20 border-t border-r border-slate-200 bg-white px-5 py-4 align-top group-hover:bg-slate-50" style={{ borderTopColor: "#e2e8f0" }}>
                  {station.protected ? (
                    <span className="text-sm font-semibold text-slate-800">{station.name}</span>
                  ) : editingStationId === station.id ? (
                    <div className="flex flex-col gap-1.5">
                      <input value={editingStationName} onChange={(e) => setEditingStationName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveStation(station.id)}
                        className="rounded-md border px-2 py-1 text-sm" autoFocus />
                      <select
                        value={editingStationGroup}
                        onChange={(e) => setEditingStationGroup(e.target.value)}
                        className="rounded-md border px-2 py-1 text-xs text-slate-500 bg-white"
                      >
                        <option value="">Group (optional)</option>
                        {Array.from(new Set(workAreaStations.filter((s) => s.group).map((s) => s.group as string))).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveStation(station.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                        <button onClick={() => setEditingStationId(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer text-sm italic text-slate-600 hover:text-slate-900"
                        onDoubleClick={() => { setEditingStationId(station.id); setEditingStationName(station.name); setEditingStationGroup(station.group ?? ""); }}
                        title="Double-click to edit">
                        {station.name}
                      </span>
                      <button onClick={() => handleDeleteStation(station.id)}
                        className="ml-auto hidden text-slate-500 hover:text-red-400 group-hover:block">×</button>
                    </div>
                  )}
                </td>

                {/* Assignment cells */}
                {currentShifts.map((shift) => (
                  <td key={shift.code} className="h-px border-t border-black/6 p-0 align-top">
                    <div className="h-full px-4 py-4">
                      <AssignmentCell stationId={station.id} shiftCode={shift.code} modeCode={selectedMode} color={color}
                        assignments={assignments} allEmployees={employees} statuses={statuses} disabledEmployeeIds={disabledEmployeeIds} onAssign={handleAssign} onRemove={handleRemove} workAreaName={selectedWorkArea.name} />
                    </div>
                  </td>
                ))}

                {/* Empty cell under + Shift column */}
                <td className="border-t border-black/6" />
              </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>

        </table>
      </div>

      {/* Datalist for group autocomplete — must be outside <table> */}
      <datalist id="group-datalist">
        {Array.from(new Set(
          workAreaStations.filter((s) => s.group).map((s) => s.group as string)
        )).map((g) => <option key={g} value={g} />)}
      </datalist>

      {/* Add Station Modal */}
      {addingStation && (
        <AddStationModal
          existingGroups={Array.from(new Set(
            workAreaStations.filter((s) => s.group).map((s) => s.group as string)
          ))}
          onClose={() => setAddingStation(false)}
          onSave={handleAddStation}
        />
      )}

      {/* Work Area Modal */}
      {workAreaModal && (
        <WorkAreaModal initial={workAreaModal === "add" ? undefined : workAreaModal}
          onClose={() => setWorkAreaModal(null)} onSave={handleSaveWorkArea} />
      )}

      {/* Clear All Confirm */}
      {confirmClear && (
        <Modal title="Clear All Assignments" onClose={() => setConfirmClear(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmClear(false)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => { onClearWorkArea?.(selectedWorkAreaId); setConfirmClear(false); }}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Remove all assignments?</p>
              <p className="mt-1 text-sm text-slate-500">
                All station assignments in <span className="font-medium text-slate-700">{selectedWorkArea?.name}</span> will be cleared. This cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
