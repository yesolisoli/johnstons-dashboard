"use client";

import { useState } from "react";
import {
  mockAssignments,
  mockEmployeeStatuses,
  mockEmployees,
  mockShifts,
  mockStations,
  mockWorkAreas,
  mockWorkDate,
} from "../mock-data";
import type { Employee, EmployeeStatus, ModeCode, ShiftCode, ShiftInfo, Station, StationAssignment, WorkArea } from "../types";

const UNAVAILABLE_STATUSES = new Set(["sick", "vacation", "injured"]);

export function useAssignmentBoardData() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [statuses, setStatuses] = useState<Record<string, EmployeeStatus>>(() => {
    const map: Record<string, EmployeeStatus> = {};
    mockEmployeeStatuses
      .filter((s) => s.work_date === mockWorkDate)
      .forEach((s) => { map[s.employee_id] = s.status; });
    return map;
  });
  const [assignments, setAssignmentsState] = useState<StationAssignment[]>(mockAssignments);
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(mockWorkAreas);
  const [workAreaShifts, setWorkAreaShifts] = useState<Record<string, ShiftInfo[]>>(() =>
    Object.fromEntries(mockWorkAreas.map((wa) => [wa.id, [...mockShifts]]))
  );
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState<string>(mockWorkAreas[0].id);

  const setAssignments = (updater: StationAssignment[] | ((prev: StationAssignment[]) => StationAssignment[])) => {
    setAssignmentsState((prev) => typeof updater === "function" ? updater(prev) : updater);
  };

  const disabledIds = new Set(
    Object.entries(statuses)
      .filter(([, s]) => UNAVAILABLE_STATUSES.has(s))
      .map(([id]) => id),
  );

  const handleAdd = (emp: Employee) => setEmployees((prev) => [...prev, emp]);
  const handleRemoveEmployee = (id: string) => setEmployees((prev) => prev.filter((e) => e.id !== id));
  const handleUpdate = (id: string, updates: Partial<Employee>) =>
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  const handleStatusChange = (id: string, status: EmployeeStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const handleAssign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    if (assignments.some((a) => a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)) return;
    const station = stations.find((s) => s.id === stationId);
    setAssignments((prev) => [...prev, {
      id: `a_${Date.now()}`,
      employee_id: employeeId,
      station_id: stationId,
      work_date: mockWorkDate,
      shift_code: shiftCode,
      mode_code: modeCode,
      activeDepartmentId: station?.work_area_id ?? "",
    }]);
  };

  const handleUnassign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    setAssignments((prev) => prev.filter(
      (a) => !(a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)
    ));
  };

  const handleUnassignAll = (employeeId: string) => {
    setAssignments((prev) => prev.filter((a) => a.employee_id !== employeeId));
    setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
  };

  const handleUnassignFromStation = (employeeId: string, stationId: string) => {
    setAssignments((prev) => prev.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId)));
  };

  const handleClearWorkArea = (workAreaId: string) => {
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    setAssignments((prev) => prev.filter((a) => !stationIds.has(a.station_id)));
  };

  const handleQuickAssign = (employeeId: string, stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    const wa = workAreas.find((w) => w.id === station?.work_area_id);
    const defaultMode: ModeCode = (wa?.mode_views?.[0]?.mode_code as ModeCode) ?? "normal";
    const defaultShiftCode = workAreaShifts[wa?.id ?? ""]?.[0]?.code;
    if (!defaultShiftCode) return;
    handleAssign(employeeId, stationId, defaultShiftCode, defaultMode);
  };

  const handleStationsChange = (next: Station[]) => setStations(next);
  const handleWorkAreasChange = (next: WorkArea[]) => setWorkAreas(next);
  const handleWorkAreaShiftsChange = (next: Record<string, ShiftInfo[]>) => setWorkAreaShifts(next);
  const handleWorkAreaChange = (id: string) => setSelectedWorkAreaId(id);

  return {
    employees,
    statuses,
    assignments,
    stations,
    workAreas,
    workAreaShifts,
    selectedWorkAreaId,
    disabledIds,
    handleStationsChange,
    handleWorkAreasChange,
    handleWorkAreaShiftsChange,
    handleWorkAreaChange,
    handleAdd,
    handleRemoveEmployee,
    handleUpdate,
    handleStatusChange,
    handleAssign,
    handleUnassign,
    handleUnassignAll,
    handleUnassignFromStation,
    handleClearWorkArea,
    handleQuickAssign,
  };
}
