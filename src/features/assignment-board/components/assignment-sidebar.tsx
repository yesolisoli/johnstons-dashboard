import {
  mockAssignments,
  mockEmployeeStatuses,
  mockEmployees,
  mockWorkDate,
} from "../mock-data";
import type { EmployeeStatus } from "../types";

const STATUS_STYLE: Record<EmployeeStatus, { label: string; className: string }> = {
  available:  { label: "Available",    className: "bg-green-100 text-green-700" },
  absent:     { label: "Absent",       className: "bg-red-100 text-red-600" },
  sick:       { label: "Sick",         className: "bg-red-100 text-red-600" },
  vacation:   { label: "Vacation",     className: "bg-yellow-100 text-yellow-700" },
  injured:    { label: "Injured",      className: "bg-orange-100 text-orange-700" },
  training:   { label: "Training",     className: "bg-purple-100 text-purple-700" },
  off_shift:  { label: "Off Shift",    className: "bg-slate-100 text-slate-600" },
};

export function AssignmentSidebar() {
  const activeEmployees = mockEmployees.filter((e) => e.active);
  const totalStaff = activeEmployees.length;

  const todayStatuses = mockEmployeeStatuses.filter((s) => s.work_date === mockWorkDate);
  const unavailableIds = new Set(
    todayStatuses.filter((s) => s.status !== "available").map((s) => s.employee_id),
  );

  const assignedIds = new Set(
    mockAssignments.filter((a) => a.work_date === mockWorkDate).map((a) => a.employee_id),
  );

  const availableCount = totalStaff - unavailableIds.size;
  const assignedCount = assignedIds.size;
  const unassignedCount = Math.max(0, availableCount - assignedCount);
  const efficiency = availableCount > 0 ? ((assignedCount / availableCount) * 100).toFixed(1) : "0.0";

  const employeesWithStatus = activeEmployees.map((emp) => {
    const statusEntry = todayStatuses.find((s) => s.employee_id === emp.id);
    return {
      ...emp,
      status: (statusEntry?.status ?? "available") as EmployeeStatus,
      reason: statusEntry?.reason ?? null,
    };
  });

  // Sort: unavailable first, then available
  const sorted = [...employeesWithStatus].sort((a, b) => {
    if (a.status === "available" && b.status !== "available") return 1;
    if (a.status !== "available" && b.status === "available") return -1;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <div className="w-72 shrink-0 space-y-4">
      {/* Today's Status */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Today's Status
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Total Staff" value={totalStaff} />
          <StatCard label="Assigned" value={assignedCount} color="text-green-600" />
          <StatCard label="Unassigned" value={unassignedCount} color="text-red-500" />
          <StatCard label="Efficiency" value={`${efficiency}%`} />
        </div>
      </div>

      {/* Employee Roster */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Employee Roster
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {totalStaff}
            </span>
          </p>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          {sorted.map((emp) => {
            const style = STATUS_STYLE[emp.status];
            return (
              <div
                key={emp.id}
                className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {emp.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{emp.full_name}</p>
                  <p className="truncate text-xs text-slate-400">{emp.default_department ?? "—"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
