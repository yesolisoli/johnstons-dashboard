"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockAssignments, mockEmployeeStatuses, mockEmployees, mockStations, mockWorkAreas, mockWorkDate } from "../mock-data";
import type { Employee, EmployeeStatus, ModeCode, ShiftCode, Station, StationAssignment, WorkArea } from "../types";
import { AssignmentGrid } from "./assignment-grid";
import { AssignmentSidebar } from "./assignment-sidebar";

export function AssignmentBoardClient() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [statuses, setStatuses] = useState<Record<string, EmployeeStatus>>(() => {
    const map: Record<string, EmployeeStatus> = {};
    mockEmployeeStatuses
      .filter((s) => s.work_date === mockWorkDate)
      .forEach((s) => { map[s.employee_id] = s.status; });
    return map;
  });
  const [assignments, setAssignments] = useState<StationAssignment[]>(mockAssignments);
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(mockWorkAreas);
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState<string>(mockWorkAreas[0].id);

  const UNAVAILABLE_STATUSES = new Set(["sick", "vacation", "injured"]);
  const disabledIds = new Set(
    Object.entries(statuses)
      .filter(([, s]) => UNAVAILABLE_STATUSES.has(s))
      .map(([id]) => id),
  );

  const handleAdd = (emp: Employee) => setEmployees((prev) => [...prev, emp]);
  const handleRemove = (id: string) => setEmployees((prev) => prev.filter((e) => e.id !== id));
  const handleUpdate = (id: string, updates: Partial<Employee>) =>
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  const handleStatusChange = (id: string, status: EmployeeStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const handleAssign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    if (assignments.some((a) => a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)) return;
    setAssignments((prev) => [...prev, { id: `a_${Date.now()}`, employee_id: employeeId, station_id: stationId, work_date: mockWorkDate, shift_code: shiftCode, mode_code: modeCode }]);
    // Sync roster: set dept to the station's work area and ensure status is available
    const station = stations.find((s) => s.id === stationId);
    const workArea = station ? workAreas.find((wa) => wa.id === station.work_area_id) : null;
    if (workArea) {
      setEmployees((prev) => prev.map((e) => e.id === employeeId
        ? { ...e, departments: e.departments.includes(workArea.name) ? e.departments : [...e.departments, workArea.name] }
        : e));
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
    }
  };

  const handleUnassign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    const remaining = assignments.filter(
      (a) => !(a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)
    );
    setAssignments(remaining);
    if (!remaining.some((a) => a.employee_id === employeeId)) {
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
      const removedStation = stations.find((s) => s.id === stationId);
      const removedWa = removedStation ? workAreas.find((wa) => wa.id === removedStation.work_area_id) : null;
      if (removedWa) {
        setEmployees((prev) => prev.map((e) => e.id === employeeId
          ? { ...e, departments: e.departments.filter((d) => d !== removedWa.name) }
          : e));
      }
    }
  };

  const handleUnassignAll = (employeeId: string) => {
    setAssignments((prev) => prev.filter((a) => a.employee_id !== employeeId));
    setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
    setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, departments: [] } : e));
  };

  const handleUnassignFromStation = (employeeId: string, stationId: string) => {
    const remaining = assignments.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId));
    setAssignments(remaining);
    if (!remaining.some((a) => a.employee_id === employeeId)) {
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
      const removedStation = stations.find((s) => s.id === stationId);
      const removedWa = removedStation ? workAreas.find((wa) => wa.id === removedStation.work_area_id) : null;
      if (removedWa) {
        setEmployees((prev) => prev.map((e) => e.id === employeeId
          ? { ...e, departments: e.departments.filter((d) => d !== removedWa.name) }
          : e));
      }
    }
  };

  const handleClearWorkArea = (workAreaId: string) => {
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    const removed = assignments.filter((a) => stationIds.has(a.station_id));
    const remaining = assignments.filter((a) => !stationIds.has(a.station_id));
    setAssignments(remaining);
    const clearedWa = workAreas.find((wa) => wa.id === workAreaId);
    const affectedEmpIds = new Set(removed.map((a) => a.employee_id));
    affectedEmpIds.forEach((empId) => {
      if (!remaining.some((a) => a.employee_id === empId)) {
        setStatuses((prev) => ({ ...prev, [empId]: "available" }));
      }
      if (clearedWa) {
        setEmployees((prev) => prev.map((e) => e.id === empId
          ? { ...e, departments: e.departments.filter((d) => d !== clearedWa.name) }
          : e));
      }
    });
  };

  const handleQuickAssign = (employeeId: string, stationId: string) => {
    const wa = workAreas.find((w) => stations.find((s) => s.id === stationId)?.work_area_id === w.id);
    const defaultMode: ModeCode = (wa?.mode_views?.[0]?.mode_code as ModeCode) ?? "normal";
    handleAssign(employeeId, stationId, "shift_1", defaultMode);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full items-stretch gap-0">
      {/* Sidebar + collapse toggle */}
      <div className={`relative flex shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-0 overflow-hidden opacity-0" : "w-72 opacity-100"}`}>
        <AssignmentSidebar
          employees={employees}
          statuses={statuses}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          selectedWorkAreaId={selectedWorkAreaId}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onAssignToStation={handleQuickAssign}
          onUnassignAll={handleUnassignAll}
          onUnassignFromStation={handleUnassignFromStation}
        />
      </div>

      {/* Collapsed bar / toggle */}
      {sidebarCollapsed ? (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="group relative flex h-full w-4 shrink-0 cursor-pointer flex-col items-center justify-center gap-1"
          title="Show sidebar"
        >
          {/* thin line */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-slate-200 transition-colors group-hover:bg-slate-400" />
          {/* arrow chip */}
          <div className="relative z-10 flex h-7 w-4 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-slate-400 group-hover:bg-slate-50">
            <ChevronRight size={11} className="text-slate-400 group-hover:text-slate-600" />
          </div>
        </button>
      ) : (
        <div className="relative flex w-10 shrink-0 items-center justify-center">
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="z-10 flex h-7 w-4 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            title="Hide sidebar"
          >
            <ChevronLeft size={11} />
          </button>
        </div>
      )}

      <div className={`min-w-0 flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "ml-4" : "ml-0"}`}>
        <AssignmentGrid
          employees={employees}
          statuses={statuses}
          disabledEmployeeIds={disabledIds}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          selectedWorkAreaId={selectedWorkAreaId}
          onWorkAreaChange={setSelectedWorkAreaId}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onClearWorkArea={handleClearWorkArea}
          onStationsChange={setStations}
          onWorkAreasChange={setWorkAreas}
        />
      </div>
    </div>
  );
}
