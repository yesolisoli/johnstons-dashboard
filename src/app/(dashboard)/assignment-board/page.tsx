import { AssignmentGrid } from "@/features/assignment-board/components/assignment-grid";

export default function AssignmentBoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Assignment Management</p>
        <h2 className="text-2xl font-bold text-slate-900">
          Assignment Board
        </h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Assignment Board
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Daily Lineup (Absences)
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Employee Roster
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Dept Lineup Settings
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700">
          History & Logs
        </button>
      </div>

      <AssignmentGrid />
    </div>
  );
}