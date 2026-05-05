"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Megaphone, Monitor } from "lucide-react";

type AppHeaderProps = {
  userEmail: string;
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const [displayDate, setDisplayDate] = useState("2026-04-16");

  useEffect(() => {
    const handler = (e: Event) => setDisplayDate((e as CustomEvent<string>).detail);
    window.addEventListener("date-changed", handler);
    return () => window.removeEventListener("date-changed", handler);
  }, []);

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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("announcement-edit"))}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-600 bg-slate-900 text-sm font-medium text-white hover:bg-slate-700"
            title="Edit Announcement"
          >
            <Megaphone size={16} />
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("date-picker-open"))}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"
          >
            <CalendarDays size={16} />
            {formatDate(displayDate)}
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("tv-open"))}
            className="flex items-center gap-2 h-10 rounded-xl border border-slate-600 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"
          >
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