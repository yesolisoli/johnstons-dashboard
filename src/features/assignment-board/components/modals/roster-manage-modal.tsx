"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/shared/modal";
import { StatusSelect, type StatusConfig } from "../status-select";
import { MultiFilterSelect } from "../multi-filter-select";
import { DeptSelect } from "../dept-select";
import { StationSelect } from "../station-select";
import { ActiveDeptSelect } from "../active-dept-select";
import type { Employee, Station, StationAssignment, WorkArea } from "../../types";

type EmployeeStatus = string;

export function RosterManageModal({
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
  const [confirmRemoveEmp, setConfirmRemoveEmp] = useState<Employee | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (s === "available" && emp.homeDepartmentId !== null) return "assigned";
    return s;
  };

  const active = employees.filter((e) => e.active);

  const hasNoStation = (emp: Employee) => {
    const effectiveDepts = emp.activeDepartmentIds != null
      ? emp.activeDepartmentIds
      : (emp.homeDepartmentId ? [emp.homeDepartmentId] : []);
    if (effectiveDepts.length === 0) return false;
    return effectiveDepts.some((deptId) => {
      const deptStationIds = new Set(stations.filter((s) => s.work_area_id === deptId).map((s) => s.id));
      return !assignments.some((a) => a.employee_id === emp.id && deptStationIds.has(a.station_id));
    });
  };

  const getGenderViolations = (emp: Employee) =>
    assignments
      .filter((a) => a.employee_id === emp.id)
      .flatMap((a) => {
        const station = stations.find((s) => s.id === a.station_id);
        if (station?.gender_restriction && emp.gender && emp.gender !== station.gender_restriction) {
          return [{ stationName: station.name, required: station.gender_restriction }];
        }
        return [];
      });

  const filtered = active
    .filter((e) => {
      if (searchName && !e.full_name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(statuses[e.id] ?? "available")) return false;
      if (filterDept.length > 0 && !filterDept.includes(e.homeDepartmentId ?? "") && !e.qualifiedDepartmentIds.some((id) => filterDept.includes(id))) return false;
      return true;
    })
    .sort((a, b) => {
      const aAlert = hasNoStation(a) ? 0 : 1;
      const bAlert = hasNoStation(b) ? 0 : 1;
      if (aAlert !== bAlert) return aAlert - bAlert;
      let cmp = 0;
      if (sortKey === "name") cmp = a.full_name.localeCompare(b.full_name);
      else if (sortKey === "code") cmp = (a.employee_code ?? "").localeCompare(b.employee_code ?? "");
      else if (sortKey === "dept") {
        const aOrder = workAreas.find((w) => w.id === a.homeDepartmentId)?.display_order ?? 999;
        const bOrder = workAreas.find((w) => w.id === b.homeDepartmentId)?.display_order ?? 999;
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
    onAdd({ id: newId, employee_code: nextCode, full_name: newName.trim(), homeDepartmentId: null, qualifiedDepartmentIds: [], active: true, ...(newTemporary ? { temporary: true } : {}) });
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
      width="w-[calc(100vw-4rem)] max-w-[1300px]"
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
          options={workAreas.map((wa) => ({ value: wa.id, label: wa.name }))}
          selected={filterDept}
          onChange={setFilterDept}
        />
      </div>

      <div ref={scrollRef} className="h-[calc(100vh-320px)] max-h-140 overflow-y-auto rounded-md border">
        <table className="w-full border-collapse text-sm table-fixed">
          <colgroup>
            <col className="w-52" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-28" />
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
                    {col === "name" ? "Name" : col === "code" ? "Code" : "Home Dept"}
                    <SortIcon col={col} />
                  </button>
                </th>
              ))}
              <th className="border-b border-slate-700 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">Active Dept</th>
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
                <td colSpan={9} className="py-10 text-center text-sm text-slate-400">No employees found</td>
              </tr>
            )}
            {filtered.map((emp) => {
              const alert = hasNoStation(emp);
              const genderViolations = getGenderViolations(emp);
              const assignedWaIds = assignments
                .filter((a) => a.employee_id === emp.id)
                .map((a) => stations.find((s) => s.id === a.station_id)?.work_area_id)
                .filter((id): id is string => !!id);
              const baseActiveDeptIds = emp.activeDepartmentIds != null
                ? emp.activeDepartmentIds
                : (emp.homeDepartmentId ? [emp.homeDepartmentId] : []);
              const effectiveActiveDeptIds = [...new Set([...baseActiveDeptIds, ...assignedWaIds])];
              return (
                <tr key={emp.id} className={`group border-b last:border-b-0 ${alert ? "bg-red-100 hover:bg-red-200" : "hover:bg-slate-50"}`}>
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
                      homeDepartmentId={emp.homeDepartmentId}
                      qualifiedDepartmentIds={emp.qualifiedDepartmentIds}
                      workAreas={workAreas}
                      onChangeHome={(waId) => {
                        const q = waId && !emp.qualifiedDepartmentIds.includes(waId) ? [waId, ...emp.qualifiedDepartmentIds] : emp.qualifiedDepartmentIds;
                        onUpdate(emp.id, { homeDepartmentId: waId, qualifiedDepartmentIds: q });
                        if (!waId) { onUnassignAll(emp.id); onStatusChange(emp.id, "available"); }
                        if (waId && !assignments.some((a) => a.employee_id === emp.id)) {
                          scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
                        }
                      }}
                      onChangeQualified={(waIds) => onUpdate(emp.id, { qualifiedDepartmentIds: waIds })}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <ActiveDeptSelect
                      activeDepartmentIds={effectiveActiveDeptIds}
                      workAreas={workAreas}
                      onChange={(ids) => onUpdate(emp.id, { activeDepartmentIds: ids })}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <StationSelect
                      employeeId={emp.id}
                      qualifiedDepartmentIds={effectiveActiveDeptIds}
                      assignments={assignments}
                      stations={stations}
                      workAreas={workAreas}
                      onAssign={(stationId) => onAssignToStation(emp.id, stationId)}
                      onUnassign={(stationId) => onUnassignFromStation(emp.id, stationId)}
                    />
                    {genderViolations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {genderViolations.map((v, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600">
                            ⚠ {v.stationName} ({v.required === "M" ? "Male" : "Female"} only)
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onUpdate(emp.id, { gender: emp.gender === "M" ? "F" : "M" })}
                      className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${emp.gender === "M" ? "bg-sky-50 text-sky-600 hover:bg-sky-100" : emp.gender === "F" ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                      title="Click to toggle"
                    >
                      {emp.gender ?? "—"}
                    </button>
                  </td>
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
                      onChange={(val) => onStatusChange(emp.id, val)}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onRemove(emp.id)}
                      className="invisible rounded px-1 text-xs text-slate-400 transition-colors group-hover:visible hover:bg-slate-100 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmRemoveEmp && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-95 rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">Remove employee?</h3>
              <p className="mt-1.5 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{confirmRemoveEmp.full_name}</span> will be permanently removed from the roster.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <button
                onClick={() => setConfirmRemoveEmp(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onRemove(confirmRemoveEmp.id); setConfirmRemoveEmp(null); }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
