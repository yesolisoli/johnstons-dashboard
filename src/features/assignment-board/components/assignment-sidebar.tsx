"use client";

import { useEffect, useRef, useState } from "react";
import { mockWorkDate } from "../mock-data";
import type { Employee, Station, StationAssignment, WorkArea } from "../types";

type EmployeeStatus = string;

type StatusConfig = {
  code: string;
  label: string;
  className: string;
  protected?: boolean;
};

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
  { code: "available",  label: "Available",  className: "bg-green-100 text-green-700",  protected: true },
  { code: "assigned",   label: "Assigned",   className: "bg-blue-100 text-blue-700",    protected: true },
  { code: "unassigned", label: "Unassigned", className: "bg-slate-200 text-slate-500",  protected: true },
  { code: "absent",     label: "Absent",     className: "bg-red-100 text-red-600" },
  { code: "sick",       label: "Sick",       className: "bg-red-100 text-red-600" },
  { code: "vacation",   label: "Vacation",   className: "bg-yellow-100 text-yellow-700" },
  { code: "injured",    label: "Injured",    className: "bg-orange-100 text-orange-700" },
  { code: "training",   label: "Training",   className: "bg-purple-100 text-purple-700" },
  { code: "off_shift",  label: "Off Shift",  className: "bg-slate-100 text-slate-600" },
];

// ─── ManageStatusesModal ──────────────────────────────────────────────────────

function ManageStatusesModal({
  configs,
  onUpdate,
  onDelete,
  onAdd,
  onClose,
}: {
  configs: StatusConfig[];
  onUpdate: (code: string, updates: Partial<StatusConfig>) => void;
  onDelete: (code: string) => void;
  onAdd: (label: string, className: string) => void;
  onClose: () => void;
}) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[3].className);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-80 rounded-lg bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">Manage Statuses</h3>

        <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
          {configs.map((cfg) => (
            <div key={cfg.code}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setColorPickerFor(colorPickerFor === cfg.code ? null : cfg.code)}
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                  title="Click to change color"
                >
                  {cfg.label}
                </button>

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
                    className="flex-1 rounded border px-2 py-0.5 text-sm"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 cursor-pointer text-sm text-slate-700 hover:text-blue-600"
                    onClick={() => { setEditingCode(cfg.code); setEditingLabel(cfg.label); }}
                    title="Click to edit label"
                  >
                    {cfg.label}
                  </span>
                )}

                {!cfg.protected ? (
                  <button
                    onClick={() => onDelete(cfg.code)}
                    className="text-slate-300 hover:text-red-400"
                  >
                    ×
                  </button>
                ) : (
                  <span className="w-4" />
                )}
              </div>

              {colorPickerFor === cfg.code && (
                <div className="mt-1.5 ml-1 flex flex-wrap gap-1 pb-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.className}
                      onClick={() => { onUpdate(cfg.code, { className: c.className }); setColorPickerFor(null); }}
                      className={`h-5 w-5 rounded border-2 ${c.className} ${cfg.className === c.className ? "border-slate-500" : "border-transparent"}`}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Add New Status</p>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLabel.trim()) { onAdd(newLabel.trim(), newColor); setNewLabel(""); }
            }}
            placeholder="Label..."
            className="w-full rounded border px-2 py-1 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.className}
                onClick={() => setNewColor(c.className)}
                className={`h-5 w-5 rounded border-2 ${c.className} ${newColor === c.className ? "border-slate-500" : "border-transparent"}`}
                title={c.label}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {newLabel && (
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${newColor}`}>{newLabel}</span>
            )}
            <button
              onClick={() => { if (newLabel.trim()) { onAdd(newLabel.trim(), newColor); setNewLabel(""); } }}
              disabled={!newLabel.trim()}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-md border px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatusPopover ────────────────────────────────────────────────────────────

function StatusPopover({
  current,
  configs,
  onSelect,
  onRemove,
  onClose,
}: {
  current: EmployeeStatus;
  configs: StatusConfig[];
  onSelect: (s: EmployeeStatus) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [onClose]);

  const selectable = configs.filter((c) => c.code !== "assigned");

  return (
    <div ref={ref} className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border bg-white shadow-xl">
      <div className="p-1.5">
        {selectable.map((cfg) => (
          <button key={cfg.code} onClick={() => onSelect(cfg.code)}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${cfg.code === current ? "font-semibold" : ""}`}>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
              {cfg.label}
            </span>
            {cfg.code === current && <span className="ml-auto text-xs text-slate-400">✓</span>}
          </button>
        ))}
        <div className="my-1 border-t border-slate-100" />
        <button onClick={onRemove}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50">
          Remove from roster
        </button>
      </div>
    </div>
  );
}

// ─── DepartmentPopover ───────────────────────────────────────────────────────

function DepartmentPopover({
  current, workAreas, stations, onSelect, onClear, onAssignStation, onClose,
}: {
  current: string | null;
  workAreas: WorkArea[];
  stations: Station[];
  onSelect: (deptName: string) => void;
  onClear: () => void;
  onAssignStation: (stationId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(
    workAreas.find((wa) => wa.name === current)?.id ?? workAreas[0]?.id ?? null,
  );

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [onClose]);

  const previewStations = stations.filter((s) => s.work_area_id === previewId);
  const previewWa = workAreas.find((wa) => wa.id === previewId);

  return (
    <div ref={ref} className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border bg-white shadow-xl">
      <div className="p-1.5">
        {workAreas.map((wa) => (
          <button key={wa.id}
            onClick={() => setPreviewId(wa.id)}
            onMouseEnter={() => { onSelect(wa.name); setPreviewId(wa.id); }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${wa.name === current ? "font-semibold text-blue-600" : "text-slate-700"}`}>
            <span>{wa.name}</span>
            {wa.name === current && <span className="text-xs text-slate-400">✓</span>}
          </button>
        ))}
      </div>
      {previewStations.length > 0 && (
        <div className="border-t p-2.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {previewWa?.name} Stations
          </p>
          {previewStations.map((s) => (
            <button
              key={s.id}
              onClick={() => { if (previewWa) onSelect(previewWa.name); onAssignStation(s.id); onClose(); }}
              className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="text-slate-300">·</span> {s.name}
            </button>
          ))}
        </div>
      )}
      {current && (
        <div className="border-t p-1.5">
          <button onClick={() => { onClear(); onClose(); }}
            className="flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50">
            Clear Department
          </button>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-slate-900" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── AssignmentSidebar ────────────────────────────────────────────────────────

export function AssignmentSidebar({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  onAdd,
  onRemove,
  onUpdate,
  onStatusChange,
  onAssignToStation,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
}) {
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIGS);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [openDeptPopover, setOpenDeptPopover] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [newName, setNewName] = useState("");
  const [showManage, setShowManage] = useState(false);

  const getStatus = (id: string): EmployeeStatus => statuses[id] ?? "available";

  const getConfig = (code: string): StatusConfig =>
    statusConfigs.find((c) => c.code === code) ?? { code, label: code, className: "bg-slate-100 text-slate-600" };

  const activeEmployees = employees.filter((e) => e.active);
  const totalStaff = activeEmployees.length;

  const getDisplayStatus = (emp: Employee): EmployeeStatus => {
    const s = getStatus(emp.id);
    if (s === "available" && emp.default_department) return "assigned";
    return s;
  };

  const assignedCount = activeEmployees.filter(
    (e) => e.default_department !== null && getStatus(e.id) === "available",
  ).length;

  const notAssignedCount = activeEmployees.filter((e) => getStatus(e.id) === "unassigned").length;

  const efficiency = totalStaff > 0 ? ((assignedCount / totalStaff) * 100).toFixed(1) : "0.0";

  const getStationCount = (empId: string): number =>
    new Set(
      assignments
        .filter((a) => a.employee_id === empId && a.work_date === mockWorkDate)
        .map((a) => a.station_id)
    ).size;

  const sorted = [...activeEmployees]
    .map((e) => ({ ...e, status: getStatus(e.id) }))
    .sort((a, b) => {
      if (a.status === "available" && b.status !== "available") return 1;
      if (a.status !== "available" && b.status === "available") return -1;
      return a.full_name.localeCompare(b.full_name);
    });

  const handleSaveName = (id: string) => {
    if (editingName.trim()) onUpdate(id, { full_name: editingName.trim() });
    setEditingId(null);
  };

  const handleAddEmployee = () => {
    if (!newName.trim()) return;
    const maxNum = employees.reduce((max, e) => {
      const match = e.employee_code?.match(/^E(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextCode = `E${String(maxNum + 1).padStart(3, "0")}`;
    onAdd({ id: `emp_${Date.now()}`, employee_code: nextCode, full_name: newName.trim(), default_department: null, active: true });
    setNewName("");
    setAddingEmployee(false);
  };

  const handleUpdateConfig = (code: string, updates: Partial<StatusConfig>) =>
    setStatusConfigs((prev) => prev.map((c) => c.code === code ? { ...c, ...updates } : c));

  const handleDeleteConfig = (code: string) =>
    setStatusConfigs((prev) => prev.filter((c) => c.code !== code));

  const handleAddConfig = (label: string, className: string) => {
    const code = `status_${Date.now()}`;
    setStatusConfigs((prev) => [...prev, { code, label, className }]);
  };

  return (
    <div className="w-72 shrink-0 space-y-4">
      {/* Today's Status */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today's Status</p>
          <button
            onClick={() => setShowManage(true)}
            className="text-xs text-slate-400 hover:text-slate-600"
            title="Manage statuses"
          >
            ⚙ Manage
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Total Staff" value={totalStaff} />
          <StatCard label="Assigned" value={assignedCount} color="text-green-600" />
          <StatCard label="Not Assigned" value={notAssignedCount} color="text-amber-500" />
          <StatCard label="Efficiency" value={`${efficiency}%`} />
        </div>
      </div>

      {/* Employee Roster */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Employee Roster
            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {totalStaff}
            </span>
          </p>
          <button
            onClick={() => setAddingEmployee((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            +
          </button>
        </div>

        {addingEmployee && (
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddEmployee();
                if (e.key === "Escape") { setAddingEmployee(false); setNewName(""); }
              }}
              placeholder="Full name..."
              className="flex-1 rounded-md border px-3 py-1.5 text-sm" autoFocus />
            <button onClick={handleAddEmployee} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">Add</button>
            <button onClick={() => { setAddingEmployee(false); setNewName(""); }} className="text-sm text-slate-400">✕</button>
          </div>
        )}

        <div className="max-h-130 overflow-y-auto">
          {sorted.map((emp) => {
            const displayStatus = getDisplayStatus(emp);
            const cfg = getConfig(displayStatus);
            const stationCount = getStationCount(emp.id);
            const stationNames = [...new Set(
              assignments
                .filter((a) => a.employee_id === emp.id && a.work_date === mockWorkDate)
                .map((a) => stations.find((s) => s.id === a.station_id)?.name)
                .filter(Boolean) as string[]
            )];
            return (
              <div key={emp.id} className="group flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-slate-50/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {emp.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  {editingId === emp.id ? (
                    <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(emp.id); if (e.key === "Escape") setEditingId(null); }}
                      onBlur={() => handleSaveName(emp.id)}
                      className="w-full rounded border px-2 py-0.5 text-sm" autoFocus />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="cursor-pointer truncate text-sm font-medium text-slate-800 hover:text-blue-600"
                        onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}
                        title="Double-click to edit">
                        {emp.full_name}
                      </p>
                      {stationCount > 0 && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                          {stationCount}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDeptPopover(openDeptPopover === emp.id ? null : emp.id)}
                      className="truncate text-xs text-slate-400 hover:text-blue-500"
                    >
                      {emp.default_department ?? "+ Dept"}
                    </button>
                    {openDeptPopover === emp.id && (
                      <DepartmentPopover
                        current={emp.default_department}
                        workAreas={workAreas}
                        stations={stations}
                        onSelect={(name) => onUpdate(emp.id, { default_department: name })}
                        onClear={() => onUpdate(emp.id, { default_department: null })}
                        onAssignStation={(stationId) => onAssignToStation(emp.id, stationId)}
                        onClose={() => setOpenDeptPopover(null)}
                      />
                    )}
                  </div>
                  {stationNames.length > 0 && (
                    <p className="truncate text-xs text-blue-400">{stationNames.join(", ")}</p>
                  )}
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenPopover(openPopover === emp.id ? null : emp.id)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${cfg.className}`}>
                    {cfg.label}
                  </button>
                  {openPopover === emp.id && (
                    <StatusPopover
                      current={emp.status}
                      configs={statusConfigs}
                      onSelect={(s) => {
                        if (s === "unassigned") onUpdate(emp.id, { default_department: null });
                        onStatusChange(emp.id, s);
                        setOpenPopover(null);
                      }}
                      onRemove={() => { onRemove(emp.id); setOpenPopover(null); }}
                      onClose={() => setOpenPopover(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showManage && (
        <ManageStatusesModal
          configs={statusConfigs}
          onUpdate={handleUpdateConfig}
          onDelete={handleDeleteConfig}
          onAdd={handleAddConfig}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
