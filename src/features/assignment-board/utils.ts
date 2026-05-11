import type {
  AssignmentBoardFilters,
  Employee,
  EmployeeDailyStatus,
  ShiftInfo,
  Station,
  StationAssignment,
  WorkArea,
} from "./types";

export function abbrevDept(dept: string): string {
  return dept.split(/\s+/).map((w) => w[0].toUpperCase()).join("");
}

export function parseTimeMin(t: string): number {
  const [h, m] = t.trim().split(":").map(Number);
  return h * 60 + m;
}

export function getActiveShift(shifts: ShiftInfo[], now: Date): ShiftInfo | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return (
    shifts.find((s) => {
      if (!s.time_range.includes("-")) return false;
      const [a, b] = s.time_range.split("-");
      return nowMin >= parseTimeMin(a) && nowMin <= parseTimeMin(b);
    }) ?? null
  );
}

export function getWaActiveMode(wa: WorkArea, nowMin: number): string {
  if (!wa.mode_views || wa.mode_views.length === 0) return "normal";
  for (const mv of wa.mode_views) {
    if (!mv.time_range) continue;
    const parts = mv.time_range.split("-").map((s) => s.trim());
    if (parts.length === 2 && nowMin >= parseTimeMin(parts[0]) && nowMin <= parseTimeMin(parts[1])) {
      return mv.mode_code;
    }
  }
  return "normal";
}

export function getNextShift(shifts: ShiftInfo[], current: ShiftInfo | null): ShiftInfo | null {
  if (!current) return shifts[0] ?? null;
  const idx = shifts.findIndex((s) => s.code === current.code);
  return shifts[idx + 1] ?? null;
}

type BoardEmployee = {
  id: string;
  full_name: string;
  employee_code: string | null;
  status: string;
};

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

type BuildBoardParams = {
  filters: AssignmentBoardFilters;
  employees: Employee[];
  employeeStatuses: EmployeeDailyStatus[];
  workAreas: WorkArea[];
  stations: Station[];
  assignments: StationAssignment[];
};

export function buildAssignmentBoardData({
  filters,
  employees,
  employeeStatuses,
  workAreas,
  stations,
  assignments,
}: BuildBoardParams) {
  const filteredStatuses = employeeStatuses.filter(
    (item) =>
      item.work_date === filters.work_date &&
      item.shift_code === filters.shift_code &&
      item.mode_code === filters.mode_code
  );

  const filteredAssignments = assignments.filter(
    (item) =>
      item.work_date === filters.work_date &&
      item.shift_code === filters.shift_code &&
      item.mode_code === filters.mode_code
  );

  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const statusMap = new Map(filteredStatuses.map((status) => [status.employee_id, status]));

  const sortedWorkAreas = [...workAreas].sort(
    (a, b) => a.display_order - b.display_order
  );

  const stationsByArea = sortedWorkAreas.map((workArea) => {
    const areaStations = stations
      .filter((station) => station.work_area_id === workArea.id)
      .sort((a, b) => a.display_order - b.display_order);

    return {
      ...workArea,
      stations: areaStations.map((station) => {
        const stationAssignments = filteredAssignments.filter(
          (assignment) => assignment.station_id === station.id
        );

        const assignedEmployees: BoardEmployee[] = stationAssignments
          .map((assignment) => {
            const employee = employeeMap.get(assignment.employee_id);
            const status = statusMap.get(assignment.employee_id);

            if (!employee) {
              return null;
            }

            return {
              id: employee.id,
              full_name: employee.full_name,
              employee_code: employee.employee_code,
              status: status?.status ?? "available",
            };
          })
          .filter(isNotNull);

        return {
          ...station,
          assignedEmployees,
        };
      }),
    };
  });

  const totalStaff = filteredStatuses.length;
  const assignedCount = filteredAssignments.length;
  const unavailableStatuses = filteredStatuses.filter(
    (item) => item.status !== "available"
  );
  const unavailableEmployeeIds = new Set(
    unavailableStatuses.map((item) => item.employee_id)
  );
  const assignedEmployeeIds = new Set(
    filteredAssignments.map((item) => item.employee_id)
  );

  const unassignedAvailableEmployees = filteredStatuses
  .filter((item) => item.status === "available")
  .filter((item) => !assignedEmployeeIds.has(item.employee_id))
  .map((item) => {
    const employee = employeeMap.get(item.employee_id);
    if (!employee) {
      return null;
    }

    return {
      id: employee.id,
      full_name: employee.full_name,
      employee_code: employee.employee_code,
    };
  })
  .filter(isNotNull);

  const unavailableEmployees = filteredStatuses
  .filter((item) => item.status !== "available")
  .map((item) => {
    const employee = employeeMap.get(item.employee_id);
    if (!employee) {
      return null;
    }

    return {
      id: employee.id,
      full_name: employee.full_name,
      employee_code: employee.employee_code,
      status: item.status,
      reason: item.reason,
    };
  })
  .filter(isNotNull);

  const availableStaff = totalStaff - unavailableEmployeeIds.size;
  const efficiency =
    availableStaff > 0 ? Math.round((assignedCount / availableStaff) * 100) : 0;

  return {
    board: stationsByArea,
    stats: {
      totalStaff,
      assignedCount,
      unassignedCount: unassignedAvailableEmployees.length,
      unavailableCount: unavailableEmployees.length,
      efficiency,
    },
    unassignedAvailableEmployees,
    unavailableEmployees,
  };
}