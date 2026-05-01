"use client";

import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import type { Employee, Station, StationAssignment, WorkArea } from "../types";
import { Modal } from "./modal";

type EmployeeStatus = string;

type StatusConfig = {
  code: string;
  label: string;
  className: string;
  colorHex?: string;
  protected?: boolean;
};

function cfgBadge(cfg: StatusConfig): { cls: string; sty?: React.CSSProperties } {
  if (cfg.colorHex) {
    return {
      cls: "rounded-md px-2.5 py-1 text-xs font-semibold",
      sty: { backgroundColor: cfg.colorHex + "28", color: cfg.colorHex },
    };
  }
  return { cls: `rounded-md px-2.5 py-1 text-xs font-semibold ${cfg.className}` };
}

const COLOR_OPTIONS: { label: string; className: string }[] = [
  { label: "Green",  className: "bg-green-100 text-green-700" },
  { label: "Blue",   className: "bg-blue-100 text-blue-700" },
  { label: "Slate",  className: "bg-slate-200 text-slate-500" },
  { label: "Red",    className: "bg-red-100 text-red-600" },
  { label: "Yellow", className: "bg-yellow-100 text-yellow-700" },
  { label: "Orange", className: "bg-orange-100 text-orange-700" },
  { label: "Purple", className: "bg-purple-100 text-purple-700" },
  { label: "Gray",   className: "bg-slate-100 text-slate-600" },
  { label: "Teal",   className: "bg-teal-100 text-teal-700" },
  { label: "Pink",   className: "bg-pink-100 text-pink-700" },
];

const DEFAULT_STATUS_CONFIGS: StatusConfig[] = [
  { code: "available",  label: "Available",  className: "bg-emerald-50 text-emerald-600",  protected: true },
  { code: "assigned",   label: "Assigned",   className: "bg-sky-50 text-sky-600",          protected: true },
  { code: "sick",       label: "Sick",       className: "bg-rose-50 text-rose-500" },
  { code: "vacation",   label: "Vacation",   className: "bg-amber-50 text-amber-500" },
  { code: "injured",    label: "Injured",    className: "bg-orange-50 text-orange-400" },
  { code: "training",   label: "Training",   className: "bg-violet-50 text-violet-400" },
  { code: "off_shift",  label: "Off Shift",  className: "bg-slate-100 text-slate-400" },
];

// ─── ManageStatusesModal ──────────────────────────────────────────────────────

function ManageStatusesModal({
  configs,
  onUpdate,
  onDelete,
  onAdd,
  onReorder,
  onClose,
}: {
  configs: StatusConfig[];
  onUpdate: (code: string, updates: Partial<StatusConfig>) => void;
  onDelete: (code: string) => void;
  onAdd: (label: string, colorHex: string) => void;
  onReorder: (newConfigs: StatusConfig[]) => void;
  onClose: () => void;
}) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newColorHex, setNewColorHex] = useState("#312e81");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const startEdit = (cfg: StatusConfig) => {
    setEditingCode(cfg.code);
    setEditingLabel(cfg.label);
    setColorPickerFor(null);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const next = [...configs];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <Modal
      title="Manage Statuses"
      onClose={onClose}
      width="w-[42rem] max-w-[calc(100vw-2rem)]"
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-indigo-900 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-800">
            Done
          </button>
        </div>
      }
    >
      {/* Status list */}
      <div className="max-h-[28rem] space-y-1.5 overflow-y-auto">
        {configs.map((cfg, idx) => (
          <div
            key={cfg.code}
            className="group"
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragEnter={() => setDropIndex(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            style={{ opacity: dragIndex === idx ? 0.4 : 1 }}
          >
            <div className={`flex items-center gap-3 rounded-lg border border-slate-300 px-2 py-2 hover:bg-slate-50 ${dropIndex === idx && dragIndex !== idx ? "border-t-2 border-blue-400" : ""}`}>
              {/* Drag handle */}
              <span className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing">
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/>
                  <circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
                </svg>
              </span>
              {/* Color badge */}
              <button
                onClick={() => {
                  if (cfg.protected) return;
                  setColorPickerFor(colorPickerFor === cfg.code ? null : cfg.code);
                  setEditingCode(null);
                }}
                className={`shrink-0 transition-transform hover:scale-105 ${cfgBadge(cfg).cls} ${cfg.protected ? "cursor-default" : "cursor-pointer"}`}
                style={cfgBadge(cfg).sty}
                title={cfg.protected ? undefined : "Click to change color"}
              >
                {cfg.label}
              </button>

              {/* Label edit */}
              {editingCode === cfg.code ? (
                <input
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editingLabel.trim()) {
                      onUpdate(cfg.code, { label: editingLabel.trim() });
                      setEditingCode(null);
                    }
                    if (e.key === "Escape") setEditingCode(null);
                  }}
                  onBlur={() => {
                    if (editingLabel.trim()) onUpdate(cfg.code, { label: editingLabel.trim() });
                    setEditingCode(null);
                  }}
                  className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm text-slate-700">{cfg.label}</span>
              )}

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {!cfg.protected && editingCode !== cfg.code && (
                  <button
                    onClick={() => startEdit(cfg)}
                    className="rounded p-1 text-slate-600 hover:bg-slate-700 hover:text-white"
                    title="Edit label"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 2l3 3-9 9H2v-3L11 2z" />
                    </svg>
                  </button>
                )}
                {!cfg.protected && (
                  <button
                    onClick={() => { onDelete(cfg.code); setColorPickerFor(null); }}
                    className="rounded p-1 text-slate-600 hover:bg-red-500 hover:text-white"
                    title="Delete"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 4h10M6 4V2h4v2M5 4l1 9h4l1-9" />
                    </svg>
                  </button>
                )}
                {cfg.protected && <span className="w-6 shrink-0" />}
              </div>
            </div>

            {/* Inline color picker */}
            {colorPickerFor === cfg.code && (
              <div className="mb-1 ml-2 flex flex-wrap gap-2 rounded-lg bg-slate-50 px-3 py-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.className}
                    onClick={() => { onUpdate(cfg.code, { className: c.className }); setColorPickerFor(null); }}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${c.className} ${cfg.className === c.className ? "border-slate-600 scale-110" : "border-transparent"}`}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new status */}
      <div className="mt-3 rounded-xl border border-indigo-300 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Add New Status</p>
        <div className="flex items-center gap-2">
          {/* Color picker */}
          <label className="relative shrink-0 cursor-pointer" title="Pick color">
            <span
              className="block h-8 w-8 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: newColorHex }}
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLabel.trim()) { onAdd(newLabel.trim(), newColorHex); setNewLabel(""); }
            }}
            placeholder="Status name..."
            className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm text-indigo-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={() => { if (newLabel.trim()) { onAdd(newLabel.trim(), newColorHex); setNewLabel(""); } }}
            disabled={!newLabel.trim()}
            className="shrink-0 rounded-lg border border-indigo-900 bg-indigo-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-40"
          >
            + Add
          </button>
        </div>
        {newLabel.trim() && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs text-indigo-700">Preview:</span>
            <span
              className="rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-semibold text-indigo-900"
            >
              {newLabel}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── AssignmentModal ──────────────────────────────────────────────────────────

function AssignmentModal({
  employee, workAreas, stations, assignedStationIds, onSave, onClear, onClose,
}: {
  employee: Employee;
  workAreas: WorkArea[];
  stations: Station[];
  assignedStationIds: Set<string>;
  onSave: (deptName: string, toAdd: string[], toRemove: string[]) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [selectedWaId, setSelectedWaId] = useState<string | null>(() => {
    if (assignedStationIds.size > 0) {
      const firstStation = stations.find((s) => assignedStationIds.has(s.id));
      if (firstStation) return firstStation.work_area_id;
    }
    return workAreas.find((wa) => wa.name === employee.departments[0])?.id ?? null;
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedStationIds));

  const waStations = stations.filter((s) => s.work_area_id === selectedWaId);
  const selectedWa = workAreas.find((wa) => wa.id === selectedWaId);

  const toggleStation = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedWa) return;
    const toAdd = waStations.filter((s) => selectedIds.has(s.id) && !assignedStationIds.has(s.id)).map((s) => s.id);
    const toRemove = waStations.filter((s) => !selectedIds.has(s.id) && assignedStationIds.has(s.id)).map((s) => s.id);
    onSave(selectedWa.name, toAdd, toRemove);
  };

  return (
    <Modal
      title="Assign Department & Station"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!selectedWa}
              className="flex-1 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {employee.departments[0] && (
            <button onClick={() => { onClear(); onClose(); }} className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors">
              Clear Department
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-base font-semibold text-slate-800">
          {employee.full_name}
          {employee.employee_code && <span className="ml-2 text-sm font-normal text-slate-400">{employee.employee_code}</span>}
        </p>

        {/* Department */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Department</p>
          <div className="flex flex-wrap gap-2">
            {workAreas.map((wa) => (
              <button
                key={wa.id}
                onClick={() => { setSelectedWaId(wa.id); setSelectedIds(new Set()); }}
                className="rounded-md border px-3 py-1.5 text-sm transition-all"
                style={selectedWaId === wa.id
                  ? { backgroundColor: wa.color_hex ?? "#334155", color: "#fff", borderColor: "transparent" }
                  : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}
              >
                {wa.name}
              </button>
            ))}
          </div>
        </div>

        {/* Station */}
        {waStations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Station <span className="font-normal normal-case text-slate-400">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {waStations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStation(s.id)}
                  className="rounded-md border px-3 py-1.5 text-sm transition-all"
                  style={selectedIds.has(s.id)
                    ? { backgroundColor: selectedWa?.color_hex ?? "#334155", borderColor: "transparent", color: "#fff" }
                    : { borderColor: "#e2e8f0", color: "#475569" }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-slate-900", bg = "bg-slate-50", labelColor = "text-slate-500", borderColor = "border-slate-200" }: { label: string; value: string | number; color?: string; bg?: string; labelColor?: string; borderColor?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${bg} ${borderColor}`}>
      <p className={`text-xs font-medium ${labelColor}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── MultiFilterSelect ───────────────────────────────────────────────────────

function MultiFilterSelect({ placeholder, options, selected, onChange }: {
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (val: string[]) => void;
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

  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const label = selected.length === 0 ? `All ${placeholder}s` : selected.length === 1
    ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
    : `${placeholder} (${selected.length})`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-36 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm text-slate-600 hover:border-slate-400 ${selected.length > 0 ? "border-slate-400 bg-slate-50 font-medium" : "border-slate-200"}`}
      >
        <span className="flex-1 truncate text-left">{label}</span>
        {selected.length > 0 && (
          <span onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="ml-0.5 rounded-full text-slate-400 hover:text-slate-600">×</span>
        )}
        <svg className="h-3.5 w-3.5 opacity-40" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-70 mt-1 min-w-40 rounded-lg border bg-white shadow-lg">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.includes(opt.value) ? "border-slate-700 bg-slate-700 text-white" : "border-slate-300"}`}>
                {selected.includes(opt.value) && <svg viewBox="0 0 10 8" fill="currentColor" className="h-2.5 w-2.5"><path d="M1 4l3 3 5-6"/></svg>}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DeptSelect ──────────────────────────────────────────────────────────────

function DeptSelect({ values, workAreas, onChange }: {
  values: string[];
  workAreas: WorkArea[];
  onChange: (depts: string[]) => void;
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

  const toggle = (name: string) => {
    onChange(values.includes(name) ? values.filter((d) => d !== name) : [...values, name]);
  };

  const label = values.length === 0 ? "— None —" : values.length === 1 ? values[0] : `${values.length} depts`;
  const firstWa = workAreas.find((w) => w.name === values[0]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 hover:bg-white"
        style={{ color: values.length > 0 ? (firstWa?.color_hex ?? "#475569") : "#94a3b8" }}
      >
        <span>{label}</span>
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-40 rounded-lg border bg-white shadow-lg">
          <button
            onClick={() => { onChange([]); setOpen(false); }}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50"
          >
            — None —
          </button>
          {workAreas.map((wa) => (
            <button
              key={wa.id}
              onClick={() => toggle(wa.name)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50"
              style={{ color: wa.color_hex ?? "#475569" }}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: wa.color_hex ?? "#475569" }} />
              {wa.name}
              {values.includes(wa.name) && <span className="ml-auto text-slate-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StationSelect ────────────────────────────────────────────────────────────

function StationSelect({ employeeId, empDepts, assignments, stations, workAreas, onAssign, onUnassign }: {
  employeeId: string;
  empDepts: string[];
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  onAssign: (stationId: string) => void;
  onUnassign: (stationId: string) => void;
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

  const deptWas = workAreas.filter((w) => empDepts.includes(w.name));
  const deptStations = stations.filter((s) => deptWas.some((wa) => wa.id === s.work_area_id));
  const assignedIds = new Set(
    assignments.filter((a) => a.employee_id === employeeId).map((a) => a.station_id)
  );
  const assignedStations = deptStations.filter((s) => assignedIds.has(s.id));
  const label = assignedStations.length === 0 ? "— None —" : assignedStations.length === 1 ? assignedStations[0].name : `${assignedStations.length} stations`;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={empDepts.length === 0}
        className="flex w-full items-center gap-1 rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        style={{ color: assignedStations.length > 0 ? (deptWas[0]?.color_hex ?? "#475569") : "#94a3b8" }}
      >
        <span className="truncate">{label}</span>
        <svg className="h-3 w-3 shrink-0 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && deptStations.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-64 min-w-44 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {deptWas.map((wa, waIdx) => {
            const waStations = deptStations.filter((s) => s.work_area_id === wa.id);
            if (waStations.length === 0) return null;
            return (
              <div key={wa.id}>
                {deptWas.length > 1 && (
                  <div
                    className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${waIdx > 0 ? "border-t-2 border-slate-300" : ""}`}
                    style={{ color: wa.color_hex ?? "#475569" }}
                  >
                    {wa.name}
                  </div>
                )}
                {waStations.map((s) => {
                  const assigned = assignedIds.has(s.id);
                  const waColor = wa.color_hex ?? "#475569";
                  return (
                    <button
                      key={s.id}
                      onClick={() => { assigned ? onUnassign(s.id) : onAssign(s.id); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50"
                      style={{ color: assigned ? waColor : "#64748b" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: assigned ? waColor : "#cbd5e1" }} />
                      {s.name}
                      {assigned && <span className="ml-auto text-slate-300">✓</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── StatusSelect ─────────────────────────────────────────────────────────────

function StatusSelect({ value, configs, onChange }: {
  value: string;
  configs: StatusConfig[];
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const options = configs.filter((c) => c.code !== "assigned");
  const current = options.find((c) => c.code === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${cfgBadge(current).cls}`}
        style={cfgBadge(current).sty}
      >
        {current.label}
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </button>
      {open && (
        <div
          className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          style={{ top: pos.top, left: pos.left, minWidth: Math.max(pos.width, 130) }}
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {options.map((cfg) => {
              const active = cfg.code === value;
              return (
                <button
                  key={cfg.code}
                  onClick={() => { onChange(cfg.code); setOpen(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <span className={`shrink-0 ${cfgBadge(cfg).cls}`} style={cfgBadge(cfg).sty}>{cfg.label}</span>
                  {active && (
                    <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l4 4 6-7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RosterManageModal ───────────────────────────────────────────────────────

function RosterManageModal({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  statusConfigs,
  onAdd,
  onRemove,
  onUpdate,
  onStatusChange,
  onUnassignAll,
  onAssignToStation,
  onUnassignFromStation,
  onClose,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  statusConfigs: StatusConfig[];
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onUnassignAll: (empId: string) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
  onUnassignFromStation: (empId: string, stationId: string) => void;
  onClose: () => void;
}) {
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDept, setFilterDept] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newTemporary, setNewTemporary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "code" | "dept" | "status" | "level" | "gender">("dept");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  const SortIcon = ({ col }: { col: typeof sortKey }) => (
    <span className="ml-1 text-slate-400">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const getStatus = (id: string): EmployeeStatus => statuses[id] ?? "available";
  const getDisplayStatus = (emp: Employee): EmployeeStatus => {
    const s = getStatus(emp.id);
    if (s === "available" && emp.departments.length > 0) return "assigned";
    return s;
  };

  const active = employees.filter((e) => e.active);

  const hasNoStation = (emp: Employee) =>
    emp.departments.length > 0 && !assignments.some((a) => a.employee_id === emp.id);

  const filtered = active
    .filter((e) => {
      if (searchName && !e.full_name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(statuses[e.id] ?? "available")) return false;
      if (filterDept.length > 0 && !filterDept.some((d) => e.departments.includes(d))) return false;
      return true;
    })
    .sort((a, b) => {
      // Always float "dept set but no station" to top
      const aAlert = hasNoStation(a) ? 0 : 1;
      const bAlert = hasNoStation(b) ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      let cmp = 0;
      if (sortKey === "name") cmp = a.full_name.localeCompare(b.full_name);
      else if (sortKey === "code") cmp = (a.employee_code ?? "").localeCompare(b.employee_code ?? "");
      else if (sortKey === "dept") {
        const aOrder = workAreas.find((w) => a.departments.includes(w.name))?.display_order ?? 999;
        const bOrder = workAreas.find((w) => b.departments.includes(w.name))?.display_order ?? 999;
        cmp = aOrder - bOrder;
      }
      else if (sortKey === "status") cmp = getDisplayStatus(a).localeCompare(getDisplayStatus(b));
      else if (sortKey === "level") cmp = (a.level ?? 0) - (b.level ?? 0);
      else if (sortKey === "gender") cmp = (a.gender ?? "").localeCompare(b.gender ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleAdd = () => {
    if (!newName.trim()) return;
    const maxNum = employees.reduce((max, e) => {
      const match = e.employee_code?.match(/^E(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextCode = `E${String(maxNum + 1).padStart(3, "0")}`;
    const newId = `emp_${Date.now()}`;
    onAdd({ id: newId, employee_code: nextCode, full_name: newName.trim(), departments: [], active: true, ...(newTemporary ? { temporary: true } : {}) });
    onStatusChange(newId, "available");
    setNewName("");
    setNewTemporary(false);
  };

  const handleSaveName = (id: string) => {
    if (editingName.trim()) onUpdate(id, { full_name: editingName.trim() });
    setEditingId(null);
  };

  return (
    <Modal
      title="Manage Roster"
      onClose={onClose}
      width="w-[1200px]"
      footer={
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="New employee name..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 select-none">
            <input
              type="checkbox"
              checked={newTemporary}
              onChange={(e) => setNewTemporary(e.target.checked)}
              className="accent-amber-500"
            />
            Temporary
          </label>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-slate-700"
          >
            + Add
          </button>
        </div>
      }
    >
      {/* Search / Filter */}
      <div className="mb-4 flex gap-2">
        <input
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 rounded-md border px-3 py-1.5 text-sm"
        />
        <MultiFilterSelect
          placeholder="Status"
          options={statusConfigs.filter((c) => c.code !== "assigned").map((c) => ({ value: c.code, label: c.label }))}
          selected={filterStatus}
          onChange={setFilterStatus}
        />
        <MultiFilterSelect
          placeholder="Dept"
          options={workAreas.map((wa) => ({ value: wa.name, label: wa.name }))}
          selected={filterDept}
          onChange={setFilterDept}
        />
      </div>

      {/* Employee table */}
      <div className="h-[calc(100vh-320px)] max-h-140 overflow-y-auto rounded-md border">
        <table className="w-full border-collapse text-sm table-fixed">
          <colgroup>
            <col className="w-52" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-36" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-28" />
            <col className="w-16" />
          </colgroup>
          <thead className="sticky top-0 z-60 bg-slate-800">
            <tr>
              {(["name", "code", "dept"] as const).map((col) => (
                <th key={col} className="border-b border-slate-700 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <button onClick={() => handleSort(col)} className="flex items-center hover:text-white">
                    {col === "name" ? "Name" : col === "code" ? "Code" : "Department"}
                    <SortIcon col={col} />
                  </button>
                </th>
              ))}
              <th className="border-b border-slate-700 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">Station</th>
              <th className="border-b border-slate-700 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                <button onClick={() => handleSort("gender")} className="flex items-center hover:text-white">
                  Gender <SortIcon col="gender" />
                </button>
              </th>
              <th className="border-b border-slate-700 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                <button onClick={() => handleSort("level")} className="flex items-center hover:text-white">
                  Level <SortIcon col="level" />
                </button>
              </th>
              <th className="border-b border-slate-700 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-white">
                  Status <SortIcon col="status" />
                </button>
              </th>
              <th className="border-b border-slate-700 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-slate-400">No employees found</td>
              </tr>
            )}
            {filtered.map((emp) => {
              const alert = hasNoStation(emp);
              return (
                <tr key={emp.id} className={`border-b last:border-b-0 ${alert ? "bg-red-100 hover:bg-red-200" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {emp.full_name.charAt(0)}
                      </div>
                      {editingId === emp.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(emp.id); if (e.key === "Escape") setEditingId(null); }}
                          onBlur={() => handleSaveName(emp.id)}
                          className="w-full rounded border px-2 py-0.5 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer font-medium text-slate-800 hover:text-blue-600 truncate"
                          onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}
                          title={emp.full_name}
                        >
                          {emp.full_name}
                        </span>
                      )}
                      {emp.temporary && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">
                          TEMP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400"><span className="block truncate">{emp.employee_code ?? "—"}</span></td>
                  <td className="px-4 py-2.5 max-w-0">
                    <DeptSelect
                      values={emp.departments}
                      workAreas={workAreas}
                      onChange={(depts) => {
                        onUpdate(emp.id, { departments: depts });
                        if (depts.length === 0) { onUnassignAll(emp.id); onStatusChange(emp.id, "available"); }
                      }}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <StationSelect
                      employeeId={emp.id}
                      empDepts={emp.departments}
                      assignments={assignments}
                      stations={stations}
                      workAreas={workAreas}
                      onAssign={(stationId) => onAssignToStation(emp.id, stationId)}
                      onUnassign={(stationId) => onUnassignFromStation(emp.id, stationId)}
                    />
                  </td>
                  {/* Gender */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onUpdate(emp.id, { gender: emp.gender === "M" ? "F" : "M" })}
                      className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${emp.gender === "M" ? "bg-sky-50 text-sky-600 hover:bg-sky-100" : emp.gender === "F" ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                      title="Click to toggle"
                    >
                      {emp.gender ?? "—"}
                    </button>
                  </td>
                  {/* Level */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onUpdate(emp.id, { level: emp.level === 3 ? 1 : ((emp.level ?? 0) + 1) as 1 | 2 | 3 })}
                      className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${emp.level === 3 ? "bg-slate-800 text-white hover:bg-slate-700" : emp.level === 2 ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                      title="Click to cycle level"
                    >
                      {emp.level ? `Lv.${emp.level}` : "—"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusSelect
                      value={statuses[emp.id] ?? "available"}
                      configs={statusConfigs}
                      onChange={(val) => {
                        onStatusChange(emp.id, val);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onRemove(emp.id)}
                      className="text-slate-300 transition-colors hover:text-red-400"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── AssignmentSidebar ────────────────────────────────────────────────────────

export function AssignmentSidebar({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  selectedWorkAreaId,
  onAdd,
  onRemove,
  onUpdate,
  onStatusChange,
  onAssignToStation,
  onUnassignAll,
  onUnassignFromStation,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  selectedWorkAreaId?: string;
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
  onUnassignAll: (empId: string) => void;
  onUnassignFromStation: (empId: string, stationId: string) => void;
}) {
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIGS);
  const [assignModalEmp, setAssignModalEmp] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [showRosterManage, setShowRosterManage] = useState(false);

  const getStatus = (id: string): EmployeeStatus => statuses[id] ?? "available";

  const activeEmployees = employees.filter((e) => e.active);
  const totalStaff = activeEmployees.length;

  const assignedCount = activeEmployees.filter(
    (e) => e.departments.length > 0 && getStatus(e.id) === "available",
  ).length;

  const notAssignedCount = activeEmployees.filter((e) => e.departments.length === 0).length;

  const efficiency = totalStaff > 0 ? ((assignedCount / totalStaff) * 100).toFixed(1) : "0.0";



  const handleSaveName = (id: string) => {
    if (editingName.trim()) onUpdate(id, { full_name: editingName.trim() });
    setEditingId(null);
  };

  const handleUpdateConfig = (code: string, updates: Partial<StatusConfig>) =>
    setStatusConfigs((prev) => prev.map((c) => c.code === code ? { ...c, ...updates } : c));

  const handleDeleteConfig = (code: string) =>
    setStatusConfigs((prev) => prev.filter((c) => c.code !== code));

  const handleAddConfig = (label: string, colorHex: string) => {
    const code = `status_${Date.now()}`;
    setStatusConfigs((prev) => [...prev, { code, label, className: "", colorHex }]);
  };

  const handleReorderConfig = (newConfigs: StatusConfig[]) =>
    setStatusConfigs(newConfigs);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4 overflow-hidden">
      {/* Today's Status */}
      <div className="shrink-0 rounded-lg border border-slate-700 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Today's Status</p>
          <button
            onClick={() => setShowManage(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Manage statuses"
          >
            <Settings size={14} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Total Staff" value={totalStaff} bg="bg-white" labelColor="text-slate-400" color="text-slate-800" borderColor="border-slate-200" />
          <StatCard label="Assigned" value={assignedCount} color="text-slate-800" bg="bg-white" labelColor="text-slate-400" borderColor="border-slate-200" />
          <StatCard label="Unassigned" value={notAssignedCount} color="text-white" bg="bg-slate-700" labelColor="text-slate-400" borderColor="border-slate-600" />
          <StatCard label="Efficiency" value={`${efficiency}%`} bg="bg-slate-800" labelColor="text-slate-400" color="text-white" borderColor="border-slate-700" />
        </div>
      </div>

      {/* Station Pending */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-700 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Station Pending
            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {totalStaff}
            </span>
          </p>
          <button
            onClick={() => setShowRosterManage(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Settings size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {(() => {
            const selectedWa = workAreas.find((w) => w.id === selectedWorkAreaId);
            const visibleWorkAreas = selectedWa ? [selectedWa] : workAreas;
            const noDept = !selectedWa ? activeEmployees.filter((e) => e.departments.length === 0) : [];
            const unassignedEmps = activeEmployees.filter((e) => e.departments.length === 0);
            return (
              <>
                {visibleWorkAreas.map((wa) => {
                  const deptEmps = activeEmployees.filter((e) =>
                    e.departments.includes(wa.name) && !assignments.some((a) => a.employee_id === e.id)
                  );
                  if (deptEmps.length === 0) return null;
                  return (
                    <div key={wa.id}>
                      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                        <span className="h-2 w-2 rounded-full shrink-0 bg-red-600" />
                        <span className="text-xs font-semibold text-slate-600">No Station</span>
                        <span className="ml-auto text-xs text-slate-400">{deptEmps.length}</span>
                      </div>
                      {deptEmps.map((emp) => {
                        return (
                          <div
                            key={emp.id}
                            className="group flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50"
                          >
                            {editingId === emp.id ? (
                              <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(emp.id); if (e.key === "Escape") setEditingId(null); }}
                                onBlur={() => handleSaveName(emp.id)}
                                className="flex-1 rounded border px-2 py-0.5 text-sm" autoFocus />
                            ) : (
                              <p
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData("application/json", JSON.stringify({
                                    employeeId: emp.id,
                                    fromStationId: null,
                                    fromShiftCode: null,
                                    fromModeCode: null,
                                  }));
                                  const ghost = document.createElement("div");
                                  ghost.textContent = emp.full_name;
                                  Object.assign(ghost.style, {
                                    position: "fixed", top: "-200px", left: "0",
                                    padding: "4px 10px", borderRadius: "6px",
                                    background: wa.color_hex ?? "#64748b", color: "#fff",
                                    fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                                  });
                                  document.body.appendChild(ghost);
                                  e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                                  setTimeout(() => document.body.removeChild(ghost), 0);
                                }}
                                className="min-w-0 cursor-grab truncate text-sm font-medium text-slate-800 hover:text-blue-600 active:cursor-grabbing"
                                onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}
                                title="Drag to assign station · Double-click to edit">
                                {emp.full_name}
                              </p>
                            )}
                            {emp.temporary && (
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">TEMP</span>
                            )}
                            <div className="ml-auto shrink-0">
                              <StatusSelect
                                value={getStatus(emp.id)}
                                configs={statusConfigs}
                                onChange={(val) => onStatusChange(emp.id, val)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {unassignedEmps.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-600">Unassigned</span>
                      <span className="ml-auto text-xs text-slate-400">{unassignedEmps.length}</span>
                    </div>
                    {unassignedEmps.map((emp) => {
                      return (
                        <div key={emp.id} className="group flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50">
                          <p
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("application/json", JSON.stringify({ employeeId: emp.id, fromStationId: null, fromShiftCode: null, fromModeCode: null }));
                              const ghost = document.createElement("div");
                              ghost.textContent = emp.full_name;
                              Object.assign(ghost.style, { position: "fixed", top: "-200px", left: "0", padding: "4px 10px", borderRadius: "6px", background: "#94a3b8", color: "#fff", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" });
                              document.body.appendChild(ghost);
                              e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                              setTimeout(() => document.body.removeChild(ghost), 0);
                            }}
                            className="min-w-0 cursor-grab truncate text-sm font-medium text-slate-800 active:cursor-grabbing"
                          >{emp.full_name}</p>
                          {emp.temporary && (
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">TEMP</span>
                          )}
                          <div className="ml-auto shrink-0">
                            <StatusSelect
                              value={getStatus(emp.id)}
                              configs={statusConfigs}
                              onChange={(val) => onStatusChange(emp.id, val)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Assigned section */}
                {visibleWorkAreas.map((wa) => {
                  const assignedEmps = activeEmployees.filter((e) =>
                    e.departments.includes(wa.name) && assignments.some((a) => a.employee_id === e.id)
                  );
                  if (assignedEmps.length === 0) return null;
                  return (
                    <div key={`assigned-${wa.id}`}>
                      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: wa.color_hex ?? "#64748b" }} />
                        <span className="text-xs font-semibold text-slate-600">{wa.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{assignedEmps.length}</span>
                      </div>
                      {assignedEmps.map((emp) => {
                        const empStations = [...new Set(assignments.filter((a) => a.employee_id === emp.id).map((a) => stations.find((s) => s.id === a.station_id)?.name).filter(Boolean))];
                        return (
                          <div key={emp.id} className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50">
                            <p
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("application/json", JSON.stringify({ employeeId: emp.id, fromStationId: null, fromShiftCode: null, fromModeCode: null }));
                                const ghost = document.createElement("div");
                                ghost.textContent = emp.full_name;
                                Object.assign(ghost.style, { position: "fixed", top: "-200px", left: "0", padding: "4px 10px", borderRadius: "6px", background: wa.color_hex ?? "#64748b", color: "#fff", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" });
                                document.body.appendChild(ghost);
                                e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                                setTimeout(() => document.body.removeChild(ghost), 0);
                              }}
                              className="min-w-0 cursor-grab truncate text-sm font-medium text-slate-600 active:cursor-grabbing"
                            >{emp.full_name}</p>
                            {emp.temporary && (
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">TEMP</span>
                            )}
                            <span className="min-w-0 max-w-[45%] truncate text-xs text-slate-400">{empStations.join(", ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {noDept.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                      <span className="text-xs font-semibold text-slate-600">No Department</span>
                      <span className="ml-auto text-xs text-slate-400">{noDept.length}</span>
                    </div>
                    {noDept.map((emp) => {
                      return (
                        <div key={emp.id} className="group flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50">
                          <p
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("application/json", JSON.stringify({ employeeId: emp.id, fromStationId: null, fromShiftCode: null, fromModeCode: null }));
                              const ghost = document.createElement("div");
                              ghost.textContent = emp.full_name;
                              Object.assign(ghost.style, { position: "fixed", top: "-200px", left: "0", padding: "4px 10px", borderRadius: "6px", background: "#64748b", color: "#fff", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" });
                              document.body.appendChild(ghost);
                              e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                              setTimeout(() => document.body.removeChild(ghost), 0);
                            }}
                            className="flex-1 cursor-grab truncate text-sm font-medium text-slate-800 hover:text-blue-600 active:cursor-grabbing"
                            onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}>
                            {emp.full_name}
                          </p>
                          <div className="ml-auto flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => setAssignModalEmp(emp)}
                              className="text-xs text-slate-400 hover:text-blue-500">
                              + Dept
                            </button>
                            <StatusSelect
                              value={getStatus(emp.id)}
                              configs={statusConfigs}
                              onChange={(val) => onStatusChange(emp.id, val)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {showManage && (
        <ManageStatusesModal
          configs={statusConfigs}
          onUpdate={handleUpdateConfig}
          onDelete={handleDeleteConfig}
          onAdd={handleAddConfig}
          onReorder={handleReorderConfig}
          onClose={() => setShowManage(false)}
        />
      )}

      {assignModalEmp && (
        <AssignmentModal
          employee={assignModalEmp}
          workAreas={workAreas}
          stations={stations}
          assignedStationIds={new Set(assignments.filter((a) => a.employee_id === assignModalEmp.id).map((a) => a.station_id))}
          onSave={(deptName: string, toAdd: string[], toRemove: string[]) => {
            onUpdate(assignModalEmp.id, { departments: assignModalEmp.departments.includes(deptName) ? assignModalEmp.departments : [...assignModalEmp.departments, deptName] });
            toAdd.forEach((sid) => onAssignToStation(assignModalEmp.id, sid));
            toRemove.forEach((sid) => onUnassignFromStation(assignModalEmp.id, sid));
            setAssignModalEmp(null);
          }}
          onClear={() => {
            onUpdate(assignModalEmp.id, { departments: [] });
            onUnassignAll(assignModalEmp.id);
          }}
          onClose={() => setAssignModalEmp(null)}
        />
      )}

      {showRosterManage && (
        <RosterManageModal
          employees={employees}
          statuses={statuses}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          statusConfigs={statusConfigs}
          onAdd={onAdd}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onStatusChange={onStatusChange}
          onUnassignAll={onUnassignAll}
          onAssignToStation={onAssignToStation}
          onUnassignFromStation={onUnassignFromStation}
          onClose={() => setShowRosterManage(false)}
        />
      )}

    </div>
  );
}
