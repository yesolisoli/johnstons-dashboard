type BoardEmployee = {
  id: string;
  full_name: string;
  employee_code: string | null;
  status: string;
};

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

import type {
  AssignmentBoardFilters,
  Employee,
  EmployeeDailyStatus,
  Station,
  StationAssignment,
  WorkArea,
} from "./types";

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