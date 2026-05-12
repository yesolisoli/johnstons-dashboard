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
import type { Employee, EmployeeStatus, ModeCode, ShiftCode, ShiftInfo, Station, StationAssignment, WorkArea, WorkAreaModeView } from "../types";
import { getUnavailableStatusCodes } from "../components/status-select";
import { useStatusConfigs } from "./use-status-configs";

export function useAssignmentBoardData() {
  const {
    statusConfigs,
    handleUpdateConfig: handleUpdateStatusConfig,
    handleDeleteConfig: handleDeleteStatusConfig,
    handleAddConfig: handleAddStatusConfig,
    handleReorderConfig: handleReorderStatusConfig,
  } = useStatusConfigs();

  const [currentWorkDate] = useState<string>(mockWorkDate);
  const [announcement, setAnnouncement] = useState("Please clean your work area and report any equipment issues.");

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

  const unavailableCodes = getUnavailableStatusCodes(statusConfigs);
  const disabledIds = new Set(
    Object.entries(statuses)
      .filter(([, s]) => unavailableCodes.has(s))
      .map(([id]) => id),
  );

  // Shift template used when seeding a newly created work area
  const defaultShiftTemplate: ShiftInfo[] = workAreaShifts[workAreas[0]?.id] ?? [...mockShifts];

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
      work_date: currentWorkDate,
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

  const handleDeleteShift = (workAreaId: string, code: ShiftCode) => {
    setWorkAreaShifts((prev) => ({
      ...prev,
      [workAreaId]: (prev[workAreaId] ?? []).filter((s) => s.code !== code),
    }));
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    setAssignments((prev) => prev.filter((a) => !(stationIds.has(a.station_id) && a.shift_code === code)));
  };

  const handleUpdateShift = (workAreaId: string, code: ShiftCode, label: string, startTime: string, endTime: string) => {
    setWorkAreaShifts((prev) => ({
      ...prev,
      [workAreaId]: (prev[workAreaId] ?? []).map((s) =>
        s.code === code ? { ...s, label, time_range: startTime && endTime ? `${startTime}-${endTime}` : "" } : s,
      ),
    }));
  };

  const handleAddShift = (workAreaId: string, label: string, startTime: string, endTime: string) => {
    const code = `shift_${Date.now()}`;
    setWorkAreaShifts((prev) => ({
      ...prev,
      [workAreaId]: [
        ...(prev[workAreaId] ?? []),
        { code, label, time_range: startTime && endTime ? `${startTime}-${endTime}` : "" },
      ],
    }));
    stations
      .filter((s) => s.work_area_id === workAreaId && s.defaultEmployeeId)
      .forEach((s) => {
        const mode: ModeCode = s.mode_code ?? "normal";
        if (!assignments.some((a) => a.station_id === s.id && a.shift_code === code && a.mode_code === mode)) {
          handleAssign(s.defaultEmployeeId!, s.id, code, mode);
        }
      });
  };

  const handleDeleteWorkArea = (workAreaId: string) => {
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    setWorkAreas((prev) => prev.filter((w) => w.id !== workAreaId));
    setStations((prev) => prev.filter((s) => s.work_area_id !== workAreaId));
    setAssignments((prev) => prev.filter((a) => !stationIds.has(a.station_id)));
    setWorkAreaShifts((prev) => { const next = { ...prev }; delete next[workAreaId]; return next; });
  };

  const handleUpdateWorkArea = (id: string, name: string, color: string, modeViews: WorkAreaModeView[]) => {
    setWorkAreas((prev) =>
      prev.map((wa) => wa.id === id ? { ...wa, name, color_hex: color, mode_views: modeViews.length ? modeViews : undefined } : wa),
    );
  };

  const handleAddWorkArea = (name: string, color: string, modeViews: WorkAreaModeView[]): string => {
    const newId = `wa_${Date.now()}`;
    const newWa: WorkArea = {
      id: newId,
      name,
      color_hex: color,
      display_order: workAreas.length + 1,
      mode_views: modeViews.length ? modeViews : undefined,
    };
    setWorkAreas((prev) => [...prev, newWa]);
    setWorkAreaShifts((prev) => ({ ...prev, [newId]: [...defaultShiftTemplate] }));
    return newId;
  };

  const handleReorderStation = (draggedStationId: string, targetStationId: string) => {
    setStations((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const dragged = sorted.find((s) => s.id === draggedStationId);
      const target = sorted.find((s) => s.id === targetStationId);
      if (!dragged || !target) return prev;
      const wa = workAreas.find((w) => w.id === dragged.work_area_id);
      const hasModes = !!(wa?.mode_views?.length);
      const sameArea = sorted.filter((s) => s.work_area_id === dragged.work_area_id && (!hasModes || s.mode_code === dragged.mode_code));
      const draggedOriginalIdx = sameArea.findIndex((s) => s.id === draggedStationId);
      const targetOriginalIdx = sameArea.findIndex((s) => s.id === targetStationId);
      const movingUp = draggedOriginalIdx > targetOriginalIdx;
      if (dragged.protected) return prev;
      if (movingUp && target.protected) return prev;
      const withoutDragged = sameArea.filter((s) => s.id !== draggedStationId);
      const targetIdx = withoutDragged.findIndex((s) => s.id === targetStationId);
      withoutDragged.splice(movingUp ? targetIdx : targetIdx + 1, 0, { ...dragged, group: target.group });
      withoutDragged.forEach((s, i) => { s.display_order = i + 1; });
      return prev.map((s) => withoutDragged.find((u) => u.id === s.id) ?? s);
    });
  };

  const handleDeleteStation = (stationId: string) => {
    setStations((prev) => prev.filter((s) => s.id !== stationId));
    setAssignments((prev) => prev.filter((a) => a.station_id !== stationId));
  };

  const handleUpdateStation = (
    stationId: string,
    params: { name: string; group?: string; genderRestriction?: "M" | "F"; defaultEmployeeId?: string },
  ) => {
    const station = stations.find((s) => s.id === stationId);
    if (!station) return;
    const wa = workAreas.find((w) => w.id === station.work_area_id);
    const hasModes = !!(wa?.mode_views?.length);
    const newGroup = params.group || undefined;

    setStations((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const target = sorted.find((s) => s.id === stationId);
      if (!target || target.group === newGroup) {
        return prev.map((s) =>
          s.id === stationId
            ? { ...s, name: params.name, group: newGroup, gender_restriction: params.genderRestriction, defaultEmployeeId: params.defaultEmployeeId }
            : s,
        );
      }
      const sameArea = sorted.filter((s) => s.work_area_id === target.work_area_id && (!hasModes || s.mode_code === target.mode_code));
      const groupStations = newGroup ? sameArea.filter((s) => s.id !== stationId && s.group === newGroup) : [];
      const insertAfterOrder = groupStations.length > 0
        ? groupStations[groupStations.length - 1].display_order
        : sameArea[sameArea.length - 1]?.display_order ?? 0;
      const withoutTarget = sameArea.filter((s) => s.id !== stationId).map((s) => ({ ...s }));
      const insertIdx = withoutTarget.findIndex((s) => s.display_order === insertAfterOrder);
      withoutTarget.splice(insertIdx + 1, 0, { ...target, name: params.name, group: newGroup, gender_restriction: params.genderRestriction, defaultEmployeeId: params.defaultEmployeeId });
      withoutTarget.forEach((s, i) => { s.display_order = i + 1; });
      return prev.map((s) => withoutTarget.find((u) => u.id === s.id) ?? s);
    });

    if (params.defaultEmployeeId) {
      const modeCode: ModeCode = station.mode_code ?? "normal";
      (workAreaShifts[station.work_area_id] ?? []).forEach((shift) => {
        if (!assignments.some((a) => a.station_id === stationId && a.shift_code === shift.code && a.mode_code === modeCode)) {
          handleAssign(params.defaultEmployeeId!, stationId, shift.code, modeCode);
        }
      });
    }
  };

  const handleAddStation = (params: {
    workAreaId: string;
    name: string;
    group?: string;
    genderRestriction?: "M" | "F";
    defaultEmployeeId?: string;
    modeCode: ModeCode;
  }) => {
    const stationId = `st_${Date.now()}`;
    const wa = workAreas.find((w) => w.id === params.workAreaId);
    const hasModes = !!(wa?.mode_views?.length);
    const currentShifts = workAreaShifts[params.workAreaId] ?? [];
    const displayOrder =
      stations.filter(
        (s) => s.work_area_id === params.workAreaId && (!hasModes || s.mode_code === params.modeCode),
      ).length + 1;

    setStations((prev) => [
      ...prev,
      {
        id: stationId,
        work_area_id: params.workAreaId,
        name: params.name,
        required_headcount: 1,
        display_order: displayOrder,
        ...(hasModes ? { mode_code: params.modeCode } : {}),
        ...(params.group ? { group: params.group } : {}),
        ...(params.genderRestriction ? { gender_restriction: params.genderRestriction } : {}),
        ...(params.defaultEmployeeId ? { defaultEmployeeId: params.defaultEmployeeId } : {}),
      },
    ]);

    if (params.defaultEmployeeId) {
      currentShifts.forEach((shift) => {
        if (!assignments.some((a) => a.station_id === stationId && a.shift_code === shift.code && a.mode_code === params.modeCode)) {
          handleAssign(params.defaultEmployeeId!, stationId, shift.code, params.modeCode);
        }
      });
    }
  };

  const handleStationsChange = (next: Station[]) => setStations(next);
  const handleWorkAreasChange = (next: WorkArea[]) => setWorkAreas(next);
  const handleWorkAreaShiftsChange = (next: Record<string, ShiftInfo[]>) => setWorkAreaShifts(next);
  const handleWorkAreaChange = (id: string) => setSelectedWorkAreaId(id);
  const handleAnnouncementChange = (text: string) => setAnnouncement(text);

  return {
    // Status configs
    statusConfigs,
    handleUpdateStatusConfig,
    handleDeleteStatusConfig,
    handleAddStatusConfig,
    handleReorderStatusConfig,
    // Work date
    currentWorkDate,
    // Announcement
    announcement,
    handleAnnouncementChange,
    // Board data
    employees,
    statuses,
    assignments,
    stations,
    workAreas,
    workAreaShifts,
    selectedWorkAreaId,
    disabledIds,
    defaultShiftTemplate,
    handleDeleteShift,
    handleUpdateShift,
    handleAddShift,
    handleDeleteWorkArea,
    handleUpdateWorkArea,
    handleAddWorkArea,
    handleReorderStation,
    handleDeleteStation,
    handleUpdateStation,
    handleAddStation,
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
