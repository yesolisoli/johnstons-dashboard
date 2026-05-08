"use client";

import { useEffect, useState } from "react";
import { Megaphone, Monitor } from "lucide-react";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssignmentBoardHeaderActions() {
  const [displayDate, setDisplayDate] = useState("2026-04-16");

  useEffect(() => {
    const handler = (e: Event) => {
      setDisplayDate((e as CustomEvent<string>).detail);
    };

    window.addEventListener("date-changed", handler);
    return () => window.removeEventListener("date-changed", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("announcement-edit"))}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-900 text-sm font-medium text-white hover:bg-slate-700"
        title="Edit Announcement"
      >
        <Megaphone size={16} />
      </button>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent("tv-open"))}
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"
      >
        <Monitor size={16} />
        TV Display
      </button>
    </>
  );
}
