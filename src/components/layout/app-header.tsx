"use client";

import { CalendarDays, Monitor } from "lucide-react";

type AppHeaderProps = {
  userEmail: string;
};

export function AppHeader({ userEmail }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Supervisor / Lead Hand
          </p>
          <h1 className="text-xl font-bold text-white">
            Packaging Department Employee Assignment
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600">
            <CalendarDays size={16} />
            Apr 16, 2026
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            <Monitor size={16} />
            TV Display
          </button>

          <div className="rounded-full bg-blue-500 px-3 py-2 text-sm font-semibold text-white">
            {userEmail.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}