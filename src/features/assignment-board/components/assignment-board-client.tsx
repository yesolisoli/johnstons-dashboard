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

  const disabledIds = new Set(
    Object.entries(statuses)
      .filter(([, s]) => s === "unassigned")
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
  };

  const handleUnassign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    setAssignments((prev) => prev.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)));
  };

  const handleUnassignAll = (employeeId: string) =>
    setAssignments((prev) => prev.filter((a) => a.employee_id !== employeeId));

  const handleUnassignFromStation = (employeeId: string, stationId: string) =>
    setAssignments((prev) => prev.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId)));

  const handleQuickAssign = (employeeId: string, stationId: string) => {
    const wa = workAreas.find((w) => stations.find((s) => s.id === stationId)?.work_area_id === w.id);
    const defaultMode: ModeCode = (wa?.mode_views?.[0]?.mode_code as ModeCode) ?? "normal";
    handleAssign(employeeId, stationId, "shift_1", defaultMode);
  };

  return (
    <div className="flex items-start gap-6">
      <AssignmentSidebar
        employees={employees}
        statuses={statuses}
        assignments={assignments}
        stations={stations}
        workAreas={workAreas}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        onStatusChange={handleStatusChange}
        onAssignToStation={handleQuickAssign}
        onUnassignAll={handleUnassignAll}
        onUnassignFromStation={handleUnassignFromStation}
      />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <AssignmentGrid
          employees={employees}
          disabledEmployeeIds={disabledIds}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onStationsChange={setStations}
          onWorkAreasChange={setWorkAreas}
        />
      </div>
    </div>
  );
}
