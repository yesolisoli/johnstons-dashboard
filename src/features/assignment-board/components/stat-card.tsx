"use client";

export function StatCard({ label, value, color = "text-slate-900", bg = "bg-slate-50", labelColor = "text-slate-500", borderColor = "border-slate-200" }: { label: string; value: string | number; color?: string; bg?: string; labelColor?: string; borderColor?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${bg} ${borderColor}`}>
      <p className={`text-xs font-medium ${labelColor}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
