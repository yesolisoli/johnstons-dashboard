import {
  mockAssignments,
  mockEmployeeStatuses,
  mockEmployees,
  mockFilters,
  mockStations,
  mockWorkAreas,
} from "../mock-data";
import { buildAssignmentBoardData } from "../utils";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "vacation":
      return "bg-yellow-100 text-yellow-800";
    case "absent":
    case "sick":
    case "injured":
      return "bg-red-100 text-red-700";
    case "training":
      return "bg-blue-100 text-blue-700";
    case "off_shift":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

export function AssignmentGrid() {
  const { board, stats, unassignedAvailableEmployees, unavailableEmployees } =
    buildAssignmentBoardData({
      filters: mockFilters,
      employees: mockEmployees,
      employeeStatuses: mockEmployeeStatuses,
      workAreas: mockWorkAreas,
      stations: mockStations,
      assignments: mockAssignments,
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatBox label="Total Staff" value={stats.totalStaff} />
        <StatBox label="Assigned" value={stats.assignedCount} />
        <StatBox label="Unassigned" value={stats.unassignedCount} />
        <StatBox label="Unavailable" value={stats.unavailableCount} />
        <StatBox label="Efficiency" value={`${stats.efficiency}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Unavailable Today</h3>
            <div className="mt-4 space-y-3">
              {unavailableEmployees.length > 0 ? (
                unavailableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-xl border bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">
                        {employee.full_name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                          employee.status
                        )}`}
                      >
                        {employee.status}
                      </span>
                    </div>
                    {employee.reason ? (
                      <p className="mt-2 text-sm text-slate-500">
                        {employee.reason}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No unavailable staff.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Unassigned Available Staff</h3>
            <div className="mt-4 space-y-3">
              {unassignedAvailableEmployees.length > 0 ? (
                unassignedAvailableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-xl border bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {employee.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {employee.employee_code ?? "No code"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  All available staff are assigned.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white p-5 shadow-sm">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-5 gap-4">
              {board.map((workArea) => (
                <div key={workArea.id} className="space-y-4">
                  <div
                    className="rounded-2xl px-4 py-3 text-white"
                    style={{ backgroundColor: workArea.color_hex ?? "#334155" }}
                  >
                    <p className="text-sm font-semibold">{workArea.name}</p>
                  </div>

                  <div className="space-y-4">
                    {workArea.stations.map((station) => (
                      <div
                        key={station.id}
                        className="rounded-2xl border bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {station.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Required: {station.required_headcount}
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                            {station.assignedEmployees.length}/
                            {station.required_headcount}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {station.assignedEmployees.length > 0 ? (
                            station.assignedEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="rounded-xl bg-white px-3 py-2 text-sm shadow-sm"
                              >
                                <p className="font-medium text-slate-900">
                                  {employee.full_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {employee.employee_code ?? "No code"}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
                              No assignment
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}