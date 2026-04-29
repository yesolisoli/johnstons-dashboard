"use client";

import { useState } from "react";
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
      setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, default_department: workArea.name } : e));
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
      setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, default_department: null } : e));
    }
  };

  const handleUnassignAll = (employeeId: string) => {
    setAssignments((prev) => prev.filter((a) => a.employee_id !== employeeId));
    setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
    setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, default_department: null } : e));
  };

  const handleUnassignFromStation = (employeeId: string, stationId: string) => {
    const remaining = assignments.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId));
    setAssignments(remaining);
    if (!remaining.some((a) => a.employee_id === employeeId)) {
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
      setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, default_department: null } : e));
    }
  };

  const handleClearWorkArea = (workAreaId: string) => {
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    const removed = assignments.filter((a) => stationIds.has(a.station_id));
    const remaining = assignments.filter((a) => !stationIds.has(a.station_id));
    setAssignments(remaining);
    const affectedEmpIds = new Set(removed.map((a) => a.employee_id));
    affectedEmpIds.forEach((empId) => {
      if (!remaining.some((a) => a.employee_id === empId)) {
        setStatuses((prev) => ({ ...prev, [empId]: "available" }));
        setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, default_department: null } : e));
      }
    });
  };

  const handleQuickAssign = (employeeId: string, stationId: string) => {
    const wa = workAreas.find((w) => stations.find((s) => s.id === stationId)?.work_area_id === w.id);
    const defaultMode: ModeCode = (wa?.mode_views?.[0]?.mode_code as ModeCode) ?? "normal";
    handleAssign(employeeId, stationId, "shift_1", defaultMode);
  };

  return (
    <div className="flex h-full items-stretch gap-6">
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
      <div className="min-w-0 flex-1 overflow-hidden">
        <AssignmentGrid
          employees={employees}
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
