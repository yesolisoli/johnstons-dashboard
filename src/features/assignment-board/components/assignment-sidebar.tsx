"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { isEmployeeEligibleForWorkArea } from "../utils";
import type { Employee, Station, StationAssignment, WorkArea } from "../types";
import { StatCard } from "./stat-card";
import { StatusSelect, getUnavailableStatusCodes } from "./status-select";
import type { StatusConfig } from "./status-select";
import { ManageStatusesModal } from "./modals/manage-statuses-modal";
import { AssignmentModal } from "./modals/assignment-modal";
import { RosterManageModal } from "./modals/roster-manage-modal";

type EmployeeStatus = string;

export function AssignmentSidebar({
  employees,
  statuses,
  assignments,
  stations,
  workAreas,
  selectedWorkAreaId,
  statusConfigs,
  onUpdateStatusConfig,
  onDeleteStatusConfig,
  onAddStatusConfig,
  onReorderStatusConfig,
  onAdd,
  onRemove,
  onUpdate,
  onStatusChange,
  onAssignToStation,
  onUnassignAll,
  onUnassignFromStation,
  getEmployeeEffectiveDepartmentIds,
}: {
  employees: Employee[];
  statuses: Record<string, EmployeeStatus>;
  assignments: StationAssignment[];
  stations: Station[];
  workAreas: WorkArea[];
  selectedWorkAreaId?: string;
  statusConfigs: StatusConfig[];
  onUpdateStatusConfig: (code: string, updates: Partial<StatusConfig>) => void;
  onDeleteStatusConfig: (code: string) => void;
  onAddStatusConfig: (label: string, colorHex: string) => void;
  onReorderStatusConfig: (configs: StatusConfig[]) => void;
  onAdd: (emp: Employee) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
  onAssignToStation: (empId: string, stationId: string) => void;
  onUnassignAll: (empId: string, resetStatus?: boolean) => void;
  onUnassignFromStation: (empId: string, stationId: string) => void;
  getEmployeeEffectiveDepartmentIds: (emp: import("../types").Employee) => string[];
}) {
  const [assignModalEmp, setAssignModalEmp] = useState<Employee | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [showRosterManage, setShowRosterManage] = useState(false);

  const getStatus = (id: string): EmployeeStatus => statuses[id] ?? "available";

  const activeEmployees = employees.filter((e) => e.active);
  const totalStaff = activeEmployees.length;

  const unavailableCodes = getUnavailableStatusCodes(statusConfigs);
  const isUnavailableStat = (id: string) => unavailableCodes.has(getStatus(id));

  const unavailableCount = activeEmployees.filter((e) => isUnavailableStat(e.id)).length;
  const assignedCount = activeEmployees.filter(
    (e) => !isUnavailableStat(e.id) && assignments.some((a) => a.employee_id === e.id),
  ).length;
  const unassignedCount = activeEmployees.filter(
    (e) => !isUnavailableStat(e.id) && !assignments.some((a) => a.employee_id === e.id),
  ).length;
  const availableWorkforce = totalStaff - unavailableCount;
  const efficiency = availableWorkforce > 0 ? ((assignedCount / availableWorkforce) * 100).toFixed(1) : "0.0";


  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4 overflow-hidden">
      {/* Workforce Overview */}
      <div className="shrink-0 rounded-lg border border-slate-700 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Workforce Overview</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Total Staff" value={totalStaff} bg="bg-[#FFFFFF]" labelColor="text-slate-400" color="text-[#334155]" borderColor="border-[#E2E8F0]" />
          <StatCard label="Unassigned" value={unassignedCount} bg="bg-[#F1F5F9]" labelColor="text-[#2563EB]" color="text-[#2563EB]" borderColor="border-[#CBD5E1]" />
          <StatCard label="Unavailable" value={unavailableCount} bg="bg-[#FFF7ED]" labelColor="text-[#EA580C]" color="text-[#EA580C]" borderColor="border-[#FED7AA]" />
          <StatCard label="Efficiency" value={`${efficiency}%`} bg="bg-[#0F172A]" labelColor="text-slate-400" color="text-[#FFFFFF]" borderColor="border-[#0F172A]" />
        </div>
      </div>

      {/* Employee Roster */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-700 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Available Employees
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
            const unavailableCodes = getUnavailableStatusCodes(statusConfigs);
            const isUnavailable = (id: string) => unavailableCodes.has(getStatus(id));
            const selectedWa = workAreas.find((w) => w.id === selectedWorkAreaId);
            const visibleWorkAreas = selectedWa ? [selectedWa] : workAreas;
            const noDept = !selectedWa ? activeEmployees.filter((e) => e.homeDepartmentId === null && !isUnavailable(e.id)) : [];
            const unassignedEmps = !selectedWa ? activeEmployees.filter((e) => e.homeDepartmentId === null && !isUnavailable(e.id)) : [];
            const unavailableEmps = activeEmployees.filter((e) => {
              if (!isUnavailable(e.id)) return false;
              if (!selectedWa) return true;
              return isEmployeeEligibleForWorkArea(e, selectedWa.id);
            });
            const abbrevWa = (name: string) =>
              name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("");
            return (
              <>
                {visibleWorkAreas.map((wa) => {
                  const deptEmps = activeEmployees.filter((e) => {
                    if (isUnavailable(e.id)) return false;
                    if (assignments.some((a) => a.employee_id === e.id)) return false;
                    if (selectedWa) {
                      return isEmployeeEligibleForWorkArea(e, wa.id);
                    }
                    return e.homeDepartmentId === wa.id;
                  });
                  if (deptEmps.length === 0) return null;
                  return (
                    <div key={wa.id}>
                      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                        <span className="h-2 w-2 rounded-full shrink-0 bg-red-500" />
                        <span className="text-xs font-semibold text-slate-600">No Station</span>
                        <span className="ml-auto text-xs text-slate-400">{deptEmps.length}</span>
                      </div>
                      {deptEmps.map((emp) => {
                        return (
                          <div
                            key={emp.id}
                            className="group flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50"
                          >
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
                                className="min-w-0 cursor-grab truncate text-sm font-medium text-slate-800 active:cursor-grabbing"
                                title="Drag to assign station">
                                {emp.full_name}
                              </p>
                            {emp.temporary && (
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">TEMP</span>
                            )}
                            <div className="ml-auto flex shrink-0 items-center gap-1.5">
                              {emp.homeDepartmentId !== wa.id && emp.homeDepartmentId && (
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                                  {abbrevWa(workAreas.find((w) => w.id === emp.homeDepartmentId)?.name ?? "")}
                                </span>
                              )}
                              <StatusSelect
                                value={getStatus(emp.id)}
                                configs={statusConfigs}
                                onChange={(val) => onStatusChange(emp.id, val)}
                                onManageStatuses={() => setShowManage(true)}
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
                              onManageStatuses={() => setShowManage(true)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Unavailable section */}
                {unavailableEmps.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-t bg-slate-100 px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-600">Unavailable</span>
                      <span className="ml-auto text-xs text-slate-400">{unavailableEmps.length}</span>
                    </div>
                    {unavailableEmps.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50/50">
                        <p className="min-w-0 truncate text-sm font-medium text-slate-400">{emp.full_name}</p>
                        {emp.temporary && (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide bg-orange-100 text-orange-500">TEMP</span>
                        )}
                        <div className="ml-auto shrink-0">
                          <StatusSelect
                            value={getStatus(emp.id)}
                            configs={statusConfigs}
                            onChange={(val) => {
                              if (val === "available") {
                                onUnassignAll(emp.id);
                              } else {
                                onStatusChange(emp.id, val);
                              }
                            }}
                            onManageStatuses={() => setShowManage(true)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Assigned section */}
                {visibleWorkAreas.map((wa) => {
                  const assignedEmps = activeEmployees.filter((e) =>
                    assignments.some((a) => a.employee_id === e.id && a.activeDepartmentId === wa.id)
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
                            <span className="ml-auto min-w-0 max-w-[45%] shrink-0 truncate text-right text-xs text-slate-400">{empStations.join(", ")}</span>
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
                            className="flex-1 cursor-grab truncate text-sm font-medium text-slate-800 active:cursor-grabbing">
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
                              onManageStatuses={() => setShowManage(true)}
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
          onUpdate={onUpdateStatusConfig}
          onDelete={onDeleteStatusConfig}
          onAdd={onAddStatusConfig}
          onReorder={onReorderStatusConfig}
          onClose={() => setShowManage(false)}
        />
      )}

      {assignModalEmp && (
        <AssignmentModal
          employee={assignModalEmp}
          workAreas={workAreas}
          stations={stations}
          assignedStationIds={new Set(assignments.filter((a) => a.employee_id === assignModalEmp.id).map((a) => a.station_id))}
          onSave={(waId: string, toAdd: string[], toRemove: string[]) => {
            const q = assignModalEmp.qualifiedDepartmentIds.includes(waId) ? assignModalEmp.qualifiedDepartmentIds : [waId, ...assignModalEmp.qualifiedDepartmentIds];
            onUpdate(assignModalEmp.id, { homeDepartmentId: waId, qualifiedDepartmentIds: q });
            toAdd.forEach((sid) => onAssignToStation(assignModalEmp.id, sid));
            toRemove.forEach((sid) => onUnassignFromStation(assignModalEmp.id, sid));
            setAssignModalEmp(null);
          }}
          onClear={() => {
            onUpdate(assignModalEmp.id, { homeDepartmentId: null });
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
          getEmployeeEffectiveDepartmentIds={getEmployeeEffectiveDepartmentIds}
          onManageStatuses={() => setShowManage(true)}
          onClose={() => setShowRosterManage(false)}
        />
      )}
    </div>
  );
}
