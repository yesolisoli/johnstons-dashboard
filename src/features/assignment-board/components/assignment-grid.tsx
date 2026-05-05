"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/shared/modal";
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
import { AssignmentCell } from "./assignment-cell";

// ─── TimePickerInput (local) ──────────────────────────────────────────────────

function TimePickerInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const [selH, selM] = value ? value.split(":") : ["", ""];
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const hIdx = hours.indexOf(selH);
    const mIdx = minutes.indexOf(selM);
    if (hIdx >= 0) hourRef.current?.children[hIdx]?.scrollIntoView({ block: "center" });
    if (mIdx >= 0) minRef.current?.children[mIdx]?.scrollIntoView({ block: "center" });
  }, [open]);

  const select = (h: string, m: string) => {
    onChange(`${h}:${m}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-left text-sm font-medium transition-colors focus:bg-white focus:outline-none"
      >
        {value ? <span className="text-slate-800">{value}</span> : <span className="text-slate-400">--:--</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div ref={hourRef} className="h-48 flex-1 overflow-y-auto border-r border-slate-100 scroll-smooth">
            {hours.map((h) => (
              <button key={h} type="button"
                onClick={() => select(h, selM || "00")}
                className={`w-full py-2 text-center text-sm font-medium transition-colors ${selH === h ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >{h}</button>
            ))}
          </div>
          <div ref={minRef} className="h-48 flex-1 overflow-y-auto scroll-smooth">
            {minutes.map((m) => (
              <button key={m} type="button"
                onClick={() => select(selH || "00", m)}
                className={`w-full py-2 text-center text-sm font-medium transition-colors ${selM === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >{m}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AddShiftModal (local) ────────────────────────────────────────────────────

function AddShiftModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (label: string, startTime: string, endTime: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const canSave = label.trim().length > 0;

  return (
    <Modal
      title="Add Shift"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => canSave && onSave(label.trim(), startTime, endTime)}
            disabled={!canSave}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            Add Shift
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Shift Name</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave(label.trim(), startTime, endTime)}
            autoFocus
            placeholder="e.g. 1st Shift"
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Time Range <span className="font-normal normal-case text-slate-400">— optional</span></label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Start</p>
              <TimePickerInput value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">End</p>
              <TimePickerInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── EditShiftModal (local) ───────────────────────────────────────────────────

function EditShiftModal({ initial, onClose, onSave }: {
  initial: { code: ShiftCode; label: string; startTime: string; endTime: string };
  onClose: () => void;
  onSave: (label: string, startTime: string, endTime: string) => void;
}) {
  const [label, setLabel] = useState(initial.label);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const canSave = label.trim().length > 0;

  return (
    <Modal
      title="Edit Shift"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => canSave && onSave(label.trim(), startTime, endTime)}
            disabled={!canSave}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Shift Name</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave(label.trim(), startTime, endTime)}
            autoFocus
            placeholder="e.g. 1st Shift"
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Time Range <span className="font-normal normal-case text-slate-400">— optional</span></label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Start</p>
              <TimePickerInput value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">End</p>
              <TimePickerInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── AddStationModal (local) ──────────────────────────────────────────────────

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
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Station Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave(name.trim(), group.trim())}
            autoFocus
            placeholder="e.g. Saw, Helper #1"
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Group</label>
            <span className="text-xs text-slate-400">— optional</span>
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
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── EditStationModal (local) ─────────────────────────────────────────────────

function EditStationModal({ initial, existingGroups, onClose, onSave }: {
  initial: { name: string; group: string };
  existingGroups: string[];
  onClose: () => void;
  onSave: (name: string, group: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [group, setGroup] = useState(initial.group);
  const canSave = name.trim().length > 0;

  return (
    <Modal onClose={onClose} title="Edit Station"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={() => canSave && onSave(name.trim(), group.trim())}
            disabled={!canSave}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Station Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave(name.trim(), group.trim())}
            autoFocus
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Group</label>
            <span className="text-xs text-slate-400">— optional</span>
          </div>
          {existingGroups.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {existingGroups.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(group === g ? "" : g)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${group === g ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {g}
                </button>
              ))}
            </div>
          )}
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder={existingGroups.length > 0 ? "Or type a new group name..." : "Type a group name..."}
            className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── WorkAreaModal (local) ────────────────────────────────────────────────────

function WorkAreaModal({ initial, onClose, onSave, onDelete }: {
  initial?: WorkArea;
  onClose: () => void;
  onSave: (name: string, color: string, modeViews: WorkAreaModeView[]) => void;
  onDelete?: () => void;
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
      width="w-[460px]"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {initial && onDelete && (
            <button onClick={onDelete} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
              Delete Department
            </button>
          )}
          <div className="ml-auto flex gap-2">
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


export function AssignmentGrid({ employees: employeesProp, statuses, disabledEmployeeIds, assignments: assignmentsProp, onAssign: onAssignProp, onUnassign: onUnassignProp, onClearWorkArea, stations: stationsProp, onStationsChange, workAreas: workAreasProp, onWorkAreasChange, workAreaShifts: workAreaShiftsProp, onWorkAreaShiftsChange, selectedWorkAreaId: selectedWorkAreaIdProp, onWorkAreaChange }: { employees?: Employee[]; statuses?: Record<string, string>; disabledEmployeeIds?: Set<string>; assignments?: StationAssignment[]; onAssign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; onUnassign?: (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => void; onClearWorkArea?: (workAreaId: string) => void; stations?: Station[]; onStationsChange?: (s: Station[]) => void; workAreas?: WorkArea[]; onWorkAreasChange?: (wa: WorkArea[]) => void; workAreaShifts?: Record<string, ShiftInfo[]>; onWorkAreaShiftsChange?: (v: Record<string, ShiftInfo[]>) => void; selectedWorkAreaId?: string; onWorkAreaChange?: (id: string) => void } = {}) {
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
  const [localWorkAreaShifts, setLocalWorkAreaShifts] = useState<Record<string, ShiftInfo[]>>(() =>
    Object.fromEntries(mockWorkAreas.map((wa) => [wa.id, [...mockShifts]])),
  );
  const workAreaShifts = workAreaShiftsProp ?? localWorkAreaShifts;
  const setWorkAreaShifts = (updater: Record<string, ShiftInfo[]> | ((prev: Record<string, ShiftInfo[]>) => Record<string, ShiftInfo[]>)) => {
    const next = typeof updater === "function" ? updater(workAreaShifts) : updater;
    setLocalWorkAreaShifts(next);
    onWorkAreaShiftsChange?.(next);
  };
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
  const [addingStation, setAddingStation] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Group editing state
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupText, setEditingGroupText] = useState("");
  const [groupDeleteWarning, setGroupDeleteWarning] = useState<string | null>(null); // group name with stations blocking delete

  // Station drag state
  const [dragStationId, setDragStationId] = useState<string | null>(null);
  const [dragOverStationId, setDragOverStationId] = useState<string | null>(null);

  const [workAreaModal, setWorkAreaModal] = useState<"add" | WorkArea | null>(null);
  const [confirmDeleteWorkArea, setConfirmDeleteWorkArea] = useState<WorkArea | null>(null);

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
  const handleSaveEditShift = (label: string, startTime: string, endTime: string) => {
    if (!editingShift) return;
    setWorkAreaShifts((prev) => ({
      ...prev,
      [selectedWorkAreaId]: (prev[selectedWorkAreaId] ?? []).map((s) =>
        s.code === editingShift.code ? { ...s, label, time_range: startTime && endTime ? `${startTime}-${endTime}` : "" } : s,
      ),
    }));
    setEditingShift(null);
  };

  const handleAddShift = (label: string, startTime: string, endTime: string) => {
    const next = `shift_${Date.now()}`;
    setWorkAreaShifts((prev) => ({
      ...prev,
      [selectedWorkAreaId]: [
        ...(prev[selectedWorkAreaId] ?? []),
        { code: next, label, time_range: startTime && endTime ? `${startTime}-${endTime}` : "" },
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
  const handleSaveStation = (stationId: string, name: string, group: string) => {
    if (!name.trim()) return;
    const newGroup = group.trim() || undefined;
    setStations((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const target = sorted.find((s) => s.id === stationId);
      if (!target || target.group === newGroup) {
        return prev.map((s) => s.id === stationId ? { ...s, name: name.trim(), group: newGroup } : s);
      }
      const sameArea = sorted.filter((s) => s.work_area_id === target.work_area_id && (!hasModes || s.mode_code === target.mode_code));
      const groupStations = newGroup ? sameArea.filter((s) => s.id !== stationId && s.group === newGroup) : [];
      let insertAfterOrder: number;
      if (groupStations.length > 0) {
        insertAfterOrder = groupStations[groupStations.length - 1].display_order;
      } else {
        insertAfterOrder = sameArea[sameArea.length - 1]?.display_order ?? 0;
      }
      const withoutTarget = sameArea.filter((s) => s.id !== stationId);
      const updated = withoutTarget.map((s) => ({ ...s }));
      const insertIdx = updated.findIndex((s) => s.display_order === insertAfterOrder);
      updated.splice(insertIdx + 1, 0, { ...target, name: name.trim(), group: newGroup });
      updated.forEach((s, i) => { s.display_order = i + 1; });
      return prev.map((s) => updated.find((u) => u.id === s.id) ?? s);
    });
    setEditingStationId(null);
  };

  // ── Group handlers ──
  const handleDeleteGroup = (groupName: string) => {
    const hasStations = workAreaStations.some((s) => s.group === groupName);
    if (hasStations) {
      setGroupDeleteWarning(groupName);
      return;
    }
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
      const draggedOriginalIdx = sameArea.findIndex((s) => s.id === dragStationId);
      const targetOriginalIdx = sameArea.findIndex((s) => s.id === targetStationId);
      const movingUp = draggedOriginalIdx > targetOriginalIdx;
      // Block: can't drag protected stations, can't move above a protected station
      if (dragged.protected) return prev;
      if (movingUp && target.protected) return prev;
      const withoutDragged = sameArea.filter((s) => s.id !== dragStationId);
      const targetIdx = withoutDragged.findIndex((s) => s.id === targetStationId);
      withoutDragged.splice(movingUp ? targetIdx : targetIdx + 1, 0, { ...dragged, group: target.group });
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

  const handleDeleteWorkArea = (wa: WorkArea) => {
    setWorkAreas((prev) => prev.filter((w) => w.id !== wa.id));
    setStations((prev) => prev.filter((s) => s.work_area_id !== wa.id));
    setAssignments((prev) => prev.filter((a) => {
      const stationIds = new Set(stations.filter((s) => s.work_area_id === wa.id).map((s) => s.id));
      return !stationIds.has(a.station_id);
    }));
    setWorkAreaShifts((prev) => { const next = { ...prev }; delete next[wa.id]; return next; });
    const remaining = workAreas.filter((w) => w.id !== wa.id);
    if (remaining.length > 0) selectWorkArea(remaining[0].id);
    setConfirmDeleteWorkArea(null);
    setWorkAreaModal(null);
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
        <table className="w-full border-separate border-spacing-0" style={{ minWidth: `calc(10.5rem + ${currentShifts.length} * 160px + 3rem)` }}>
          <thead className="sticky top-0 z-30">
            <tr>
              {/* Station label */}
              <th className="sticky left-0 z-10 bg-white px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 border-r border-slate-200" style={{ width: "10.5rem", minWidth: "10.5rem", maxWidth: "10.5rem" }}>
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
                <th key={shift.code} className="group/col px-4 py-3 text-left text-sm font-semibold text-white" style={{ backgroundColor: color, width: `calc((100% - 12rem - 3rem) / ${currentShifts.length})`, minWidth: "160px" }}>
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
                </th>
              ))}

              {/* Add shift th */}
              <th className="whitespace-nowrap px-3 py-3 text-left" style={{ backgroundColor: color }}>
                <button onClick={() => setAddingShift({ label: "", startTime: "", endTime: "" })}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-white/30 text-white/80 hover:border-white hover:text-white text-base leading-none">
                  +
                </button>
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
                                className="invisible rounded px-1 text-xs group-hover/grp:visible transition-colors"
                                style={{ color: color + "80" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color + "22"; (e.currentTarget as HTMLButtonElement).style.color = color; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; (e.currentTarget as HTMLButtonElement).style.color = color + "80"; }}
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
                      onDragOver={(e) => { e.preventDefault(); if (dragStationId) setDragOverStationId(station.id); }}
                      onDragLeave={() => setDragOverStationId(null)}
                      onDrop={() => handleStationDrop(station.id)}
                    >
                {/* Station name */}
                <td className="sticky left-0 z-20 border-t border-r border-slate-200 bg-white px-5 py-4 align-top group-hover:bg-slate-50" style={{ borderTopColor: "#e2e8f0", width: "10.5rem", minWidth: "10.5rem", maxWidth: "10.5rem" }}>
                  {station.protected ? (
                    <span className="text-sm font-semibold text-slate-800">{station.name}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer text-sm italic text-slate-600 hover:text-slate-900"
                        onDoubleClick={() => setEditingStationId(station.id)}
                        title="Double-click to edit">
                        {station.name}
                      </span>
                      <button
                        onClick={() => handleDeleteStation(station.id)}
                        className="invisible ml-auto rounded px-1 text-xs group-hover:visible transition-colors"
                        style={{ color: color + "80" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color + "22"; (e.currentTarget as HTMLButtonElement).style.color = color; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; (e.currentTarget as HTMLButtonElement).style.color = color + "80"; }}
                      >×</button>
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

      {/* Group Delete Warning */}
      {groupDeleteWarning && (
        <Modal
          title="Cannot Delete Group"
          onClose={() => setGroupDeleteWarning(null)}
          footer={
            <div className="flex justify-end">
              <button onClick={() => setGroupDeleteWarning(null)} className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Got it
              </button>
            </div>
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                Group <span className="text-amber-700">"{groupDeleteWarning}"</span> still has stations.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Remove all stations in this group before deleting it.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Shift Modal */}
      {addingShift !== null && (
        <AddShiftModal onClose={() => setAddingShift(null)} onSave={handleAddShift} />
      )}

      {/* Edit Shift Modal */}
      {editingShift !== null && (
        <EditShiftModal initial={editingShift} onClose={() => setEditingShift(null)} onSave={handleSaveEditShift} />
      )}

      {/* Edit Station Modal */}
      {editingStationId !== null && (() => {
        const s = stations.find((s) => s.id === editingStationId);
        if (!s) return null;
        return (
          <EditStationModal
            initial={{ name: s.name, group: s.group ?? "" }}
            existingGroups={Array.from(new Set(workAreaStations.filter((st) => st.group).map((st) => st.group as string)))}
            onClose={() => setEditingStationId(null)}
            onSave={(name, group) => handleSaveStation(editingStationId, name, group)}
          />
        );
      })()}

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
        <WorkAreaModal
          initial={workAreaModal === "add" ? undefined : workAreaModal}
          onClose={() => setWorkAreaModal(null)}
          onSave={handleSaveWorkArea}
          onDelete={workAreaModal !== "add" ? () => setConfirmDeleteWorkArea(workAreaModal) : undefined}
        />
      )}

      {/* Delete Work Area Confirm */}
      {confirmDeleteWorkArea && (() => {
        const waStations = stations.filter((s) => s.work_area_id === confirmDeleteWorkArea.id);
        const assignedEmpIds = new Set(assignments.filter((a) => waStations.some((s) => s.id === a.station_id)).map((a) => a.employee_id));
        return (
          <Modal
            title="Delete Department"
            onClose={() => setConfirmDeleteWorkArea(null)}
            footer={
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteWorkArea(null)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteWorkArea(confirmDeleteWorkArea)}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Delete <span className="text-red-600">"{confirmDeleteWorkArea.name}"</span>?
                  </p>
                  <p className="mt-1 text-sm text-slate-500">This cannot be undone.</p>
                </div>
              </div>
              {(waStations.length > 0 || assignedEmpIds.size > 0) && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Will also be deleted</p>
                  {waStations.length > 0 && (
                    <p className="text-sm text-red-700">• <span className="font-semibold">{waStations.length}</span> station{waStations.length > 1 ? "s" : ""}</p>
                  )}
                  {assignedEmpIds.size > 0 && (
                    <p className="text-sm text-red-700">• <span className="font-semibold">{assignedEmpIds.size}</span> employee assignment{assignedEmpIds.size > 1 ? "s" : ""}</p>
                  )}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

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
