import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";

export default function AssignmentBoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Assignment Management</p>
        <h2 className="text-2xl font-bold text-slate-900">Assignment Board</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Assignment Board
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium">
          Daily Lineup (Absences)
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium">
          Employee Roster
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium">
          Dept Lineup Settings
        </button>
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium">
          History & Logs
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value="34" />
        <StatCard label="Assigned" value="32" />
        <StatCard label="Unassigned" value="2" />
        <StatCard label="Efficiency" value="94.1%" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <SectionCard title="Today’s Status">
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              Absences, vacation, off-shift, training, and quick actions panel
            </div>
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              Add Employee / Add Station / Import / Export actions
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Assignment Grid">
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-600">
            Work Area x Station matrix goes here
          </div>
        </SectionCard>
      </div>

      <SectionCard title="TV Display Preview">
        <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-600">
          Same assignment data, read-only view
        </div>
      </SectionCard>
    </div>
  );
}