import type {
  Employee,
  ShiftInfo,
  Station,
  StationAssignment,
  WorkArea,
} from "./types";

export function isEmployeeEligibleForWorkArea(employee: Employee, workAreaId: string): boolean {
  if (employee.homeDepartmentId === workAreaId) return true;
  if (employee.qualifiedDepartmentIds.includes(workAreaId)) return true;
  return false;
}

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

export function getAssignmentWorkAreaId(
  assignment: StationAssignment,
  stations: Station[],
): string | undefined {
  return stations.find((s) => s.id === assignment.station_id)?.work_area_id;
}

export function getEmployeeActiveDepartmentIds(
  employeeId: string,
  assignments: StationAssignment[],
  stations: Station[],
): string[] {
  return [
    ...new Set(
      assignments
        .filter((a) => a.employee_id === employeeId)
        .map((a) => stations.find((s) => s.id === a.station_id)?.work_area_id)
        .filter((id): id is string => id !== undefined),
    ),
  ];
}

