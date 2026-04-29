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
    <Modal
      title="Manage Statuses"
      onClose={onClose}
      width="w-80"
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-md border px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
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
                <button onClick={() => onDelete(cfg.code)} className="text-slate-300 hover:text-red-400">×</button>
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
    </Modal>
  );
}

// ─── StatusModal ─────────────────────────────────────────────────────────────

function StatusModal({
  employee,
  current,
  configs,
  onSelect,
  onRemove,
  onClose,
}: {
  employee: Employee;
  current: EmployeeStatus;
  configs: StatusConfig[];
  onSelect: (s: EmployeeStatus) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const selectable = configs.filter((c) => c.code !== "assigned");

  return (
    <Modal
      title="Update Status"
      onClose={onClose}
      footer={
        <button onClick={onRemove} className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors">
          Remove from roster
        </button>
      }
    >
      <div className="mb-4">
        <p className="text-base font-semibold text-slate-800">
          {employee.full_name}
          {employee.employee_code && <span className="ml-2 text-sm font-normal text-slate-400">{employee.employee_code}</span>}
        </p>
      </div>
      <div className="space-y-1">
        {selectable.map((cfg) => (
          <button
            key={cfg.code}
            onClick={() => onSelect(cfg.code)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-slate-50 ${cfg.code === current ? "bg-slate-50" : ""}`}
          >
            <span className={`rounded px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
              {cfg.label}
            </span>
            {cfg.code === current && <span className="ml-auto text-xs text-slate-400">✓</span>}
          </button>
        ))}
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
    return workAreas.find((wa) => wa.name === employee.default_department)?.id ?? null;
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
          {employee.default_department && (
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

function StatCard({ label, value, color = "text-slate-900", bg = "bg-slate-50", labelColor = "text-slate-500" }: { label: string; value: string | number; color?: string; bg?: string; labelColor?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <p className={`text-xs font-medium ${labelColor}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── DeptCellDropdown ────────────────────────────────────────────────────────

function DeptCellDropdown({
  emp,
  workAreas,
  stations,
  assignments,
  onUpdateDept,
  onAssignToStation,
  onUnassignAll,
  onUnassignFromStation,
  onClose,
}: {
  emp: Employee;
  workAreas: WorkArea[];
  stations: Station[];
  assignments: StationAssignment[];
  onUpdateDept: (dept: string | null) => void;
  onAssignToStation: (stationId: string) => void;
  onUnassignAll: () => void;
  onUnassignFromStation: (stationId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(
    workAreas.find((wa) => wa.name === emp.default_department)?.id ?? null,
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const assignedStationIds = new Set(
    assignments.filter((a) => a.employee_id === emp.id).map((a) => a.station_id),
  );
  const selectedWa = workAreas.find((wa) => wa.id === selectedWaId);
  const waStations = stations.filter((s) => s.work_area_id === selectedWaId);

  const handleSelectWa = (wa: WorkArea) => {
    if (wa.id === selectedWaId) return;
    onUnassignAll();
    onUpdateDept(wa.name);
    setSelectedWaId(wa.id);
  };

  const toggleStation = (stationId: string) => {
    if (assignedStationIds.has(stationId)) onUnassignFromStation(stationId);
    else onAssignToStation(stationId);
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white shadow-xl"
    >
      <div className="py-1">
        {workAreas.map((wa) => (
          <button
            key={wa.id}
            onClick={() => handleSelectWa(wa)}
            className="flex w-full items-center px-4 py-2 text-sm hover:bg-slate-50"
            style={wa.id === selectedWaId ? { color: wa.color_hex ?? undefined, fontWeight: 600 } : { color: "#475569" }}
          >
            <span className="flex-1 text-left">{wa.name}</span>
            {wa.id === selectedWaId && <span className="text-xs text-slate-400">✓</span>}
          </button>
        ))}
      </div>

      {waStations.length > 0 && (
        <>
          <div className="border-t" />
          <div className="py-1">
            <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {selectedWa?.name} Stations
            </p>
            {waStations.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStation(s.id)}
                className="flex w-full items-center gap-2 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <span className="flex-1 text-left">{s.name}</span>
                {assignedStationIds.has(s.id) && <span className="text-xs text-blue-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {emp.default_department && (
        <>
          <div className="border-t" />
          <button
            onClick={() => { onUnassignAll(); onUpdateDept(null); onClose(); }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
          >
            Clear Department
          </button>
        </>
      )}
    </div>
  );
}

// ─── RosterManageModal ───────────────────────────────────────────────────────

function RosterManageModal({
  employees,
  statuses,
  workAreas,
  stations,
  assignments,
  statusConfigs,
  onAdd,
  onRemove,
  onUpdate,
  onStatusChange,
  onAssignToStation,
  onUnassignAll,
  onUnassignFromStation,
  onClose,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  workAreas: WorkArea[];
  stations: Station[];
  assignments: StationAssignment[];
  statusConfigs: StatusConfig[];
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
  onUnassignAll: (empId: string) => void;
  onUnassignFromStation: (empId: string, stationId: string) => void;
  onClose: () => void;
}) {
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deptDropdownId, setDeptDropdownId] = useState<string | null>(null);

  const getStatus = (id: string): EmployeeStatus => statuses[id] ?? "available";
  const getDisplayStatus = (emp: Employee): EmployeeStatus => {
    const s = getStatus(emp.id);
    if (s === "available" && emp.default_department) return "assigned";
    return s;
  };
  const getConfig = (code: string): StatusConfig =>
    statusConfigs.find((c) => c.code === code) ?? { code, label: code, className: "bg-slate-100 text-slate-600" };

  const active = employees.filter((e) => e.active);

  const filtered = active.filter((e) => {
    if (searchName && !e.full_name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterStatus && getDisplayStatus(e) !== filterStatus) return false;
    if (filterDept && e.default_department !== filterDept) return false;
    return true;
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    const maxNum = employees.reduce((max, e) => {
      const match = e.employee_code?.match(/^E(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextCode = `E${String(maxNum + 1).padStart(3, "0")}`;
    onAdd({ id: `emp_${Date.now()}`, employee_code: nextCode, full_name: newName.trim(), default_department: null, active: true });
    setNewName("");
  };

  const handleSaveName = (id: string) => {
    if (editingName.trim()) onUpdate(id, { full_name: editingName.trim() });
    setEditingId(null);
  };

  return (
    <Modal
      title="Manage Roster"
      onClose={onClose}
      width="w-[680px]"
      footer={
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="New employee name..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-slate-700"
          >
            + Add Employee
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm text-slate-600"
        >
          <option value="">All Statuses</option>
          {statusConfigs.filter((c) => c.code !== "assigned").map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
          <option value="assigned">Assigned</option>
        </select>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm text-slate-600"
        >
          <option value="">All Depts</option>
          {workAreas.map((wa) => (
            <option key={wa.id} value={wa.name}>{wa.name}</option>
          ))}
        </select>
      </div>

      {/* Employee table */}
      <div className="h-[calc(100vh-320px)] max-h-140 overflow-y-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Name</th>
              <th className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Code</th>
              <th className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Department</th>
              <th className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Status</th>
              <th className="border-b px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No employees found</td>
              </tr>
            )}
            {filtered.map((emp) => {
              const displayStatus = getDisplayStatus(emp);
              const cfg = getConfig(displayStatus);
              const wa = workAreas.find((w) => w.name === emp.default_department);
              return (
                <tr key={emp.id} className="border-b last:border-b-0 hover:bg-slate-50">
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
                          className="cursor-pointer font-medium text-slate-800 hover:text-blue-600"
                          onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}
                          title="Double-click to edit"
                        >
                          {emp.full_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{emp.employee_code ?? "—"}</td>
                  <td className="relative px-4 py-2.5">
                    <button
                      onClick={() => setDeptDropdownId(deptDropdownId === emp.id ? null : emp.id)}
                      className="rounded px-2 py-1 text-xs font-medium hover:bg-slate-100"
                      style={wa ? { color: wa.color_hex ?? undefined } : { color: "#94a3b8" }}
                    >
                      {emp.default_department ?? "— None —"}
                    </button>
                    {deptDropdownId === emp.id && (
                      <DeptCellDropdown
                        emp={emp}
                        workAreas={workAreas}
                        stations={stations}
                        assignments={assignments}
                        onUpdateDept={(dept) => onUpdate(emp.id, { default_department: dept })}
                        onAssignToStation={(sid) => onAssignToStation(emp.id, sid)}
                        onUnassignAll={() => onUnassignAll(emp.id)}
                        onUnassignFromStation={(sid) => onUnassignFromStation(emp.id, sid)}
                        onClose={() => setDeptDropdownId(null)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={statuses[emp.id] ?? "available"}
                      onChange={(e) => onStatusChange(emp.id, e.target.value)}
                      className={`rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-slate-200 focus:border-slate-300 focus:outline-none cursor-pointer ${cfg.className}`}
                    >
                      {statusConfigs.filter((c) => c.code !== "assigned").map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
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
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
  onUnassignAll: (empId: string) => void;
  onUnassignFromStation: (empId: string, stationId: string) => void;
}) {
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUS_CONFIGS);
  const [statusModalEmp, setStatusModalEmp] = useState<Employee | null>(null);
  const [assignModalEmp, setAssignModalEmp] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [showRosterManage, setShowRosterManage] = useState(false);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Today's Status</p>
          <button
            onClick={() => setShowManage(true)}
            className="text-xs text-slate-400 hover:text-slate-600"
            title="Manage statuses"
          >
            ⚙ Manage
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Total Staff" value={totalStaff} bg="bg-slate-50" />
          <StatCard label="Assigned" value={assignedCount} color="text-green-700" bg="bg-green-50" labelColor="text-green-600" />
          <StatCard label="Unassigned" value={notAssignedCount} color="text-red-600" bg="bg-red-50" labelColor="text-red-400" />
          <StatCard label="Efficiency" value={`${efficiency}%`} bg="bg-slate-50" />
        </div>
      </div>

      {/* Employee Roster */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Employee Roster
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

        <div className="max-h-130 overflow-y-auto">
          {sorted.map((emp) => {
            const displayStatus = getDisplayStatus(emp);
            const cfg = getConfig(displayStatus);
            return (
              <div key={emp.id} className="group flex items-center gap-2 border-b px-4 py-2.5 last:border-b-0 hover:bg-slate-50/50">
                {editingId === emp.id ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(emp.id); if (e.key === "Escape") setEditingId(null); }}
                    onBlur={() => handleSaveName(emp.id)}
                    className="flex-1 rounded border px-2 py-0.5 text-sm" autoFocus />
                ) : (
                  <p className="cursor-pointer truncate text-sm font-medium text-slate-800 hover:text-blue-600"
                    onDoubleClick={() => { setEditingId(emp.id); setEditingName(emp.full_name); }}
                    title="Double-click to edit">
                    {emp.full_name}
                  </p>
                )}
                <button
                  onClick={() => setAssignModalEmp(emp)}
                  className="shrink-0 text-xs text-slate-400 hover:text-blue-500"
                >
                  {emp.default_department ?? "+ Dept"}
                </button>
                <button
                  onClick={() => setStatusModalEmp(emp)}
                  className={`ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${cfg.className}`}>
                  {cfg.label}
                </button>
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

      {assignModalEmp && (
        <AssignmentModal
          employee={assignModalEmp}
          workAreas={workAreas}
          stations={stations}
          assignedStationIds={new Set(assignments.filter((a) => a.employee_id === assignModalEmp.id).map((a) => a.station_id))}
          onSave={(deptName: string, toAdd: string[], toRemove: string[]) => {
            onUpdate(assignModalEmp.id, { default_department: deptName });
            toAdd.forEach((sid) => onAssignToStation(assignModalEmp.id, sid));
            toRemove.forEach((sid) => onUnassignFromStation(assignModalEmp.id, sid));
            setAssignModalEmp(null);
          }}
          onClear={() => {
            onUpdate(assignModalEmp.id, { default_department: null });
            onUnassignAll(assignModalEmp.id);
          }}
          onClose={() => setAssignModalEmp(null)}
        />
      )}

      {showRosterManage && (
        <RosterManageModal
          employees={employees}
          statuses={statuses}
          workAreas={workAreas}
          statusConfigs={statusConfigs}
          onAdd={onAdd}
          onRemove={onRemove}
          onUpdate={onUpdate}
          stations={stations}
          assignments={assignments}
          onStatusChange={onStatusChange}
          onAssignToStation={onAssignToStation}
          onUnassignAll={onUnassignAll}
          onUnassignFromStation={onUnassignFromStation}
          onClose={() => setShowRosterManage(false)}
        />
      )}

      {statusModalEmp && (
        <StatusModal
          employee={statusModalEmp}
          current={getStatus(statusModalEmp.id)}
          configs={statusConfigs}
          onSelect={(s: EmployeeStatus) => {
            if (s === "unassigned") onUpdate(statusModalEmp.id, { default_department: null });
            onStatusChange(statusModalEmp.id, s);
            setStatusModalEmp(null);
          }}
          onRemove={() => { onRemove(statusModalEmp.id); setStatusModalEmp(null); }}
          onClose={() => setStatusModalEmp(null)}
        />
      )}
    </div>
  );
}
