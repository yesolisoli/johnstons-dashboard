"use client";

import React from "react";
import type { Employee } from "../types";
import type { ModeCode, ShiftCode } from "../types";

export function EmployeeCard({ employee, stationId, shiftCode, modeCode, onRemove }: {
  employee: Employee;
  stationId: string;
  shiftCode: ShiftCode;
  modeCode: ModeCode;
  onRemove: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      employeeId: employee.id,
      fromStationId: stationId,
      fromShiftCode: shiftCode,
      fromModeCode: modeCode,
    }));
    const ghost = document.createElement("div");
    ghost.textContent = employee.full_name;
    Object.assign(ghost.style, {
      position: "fixed", top: "-200px", left: "-200px",
      background: "white", padding: "6px 12px", borderRadius: "6px",
      fontSize: "13px", fontWeight: "600", color: "#475569",
      boxShadow: "0 4px 14px rgba(0,0,0,0.18)", border: "1px solid #e2e8f0",
      whiteSpace: "nowrap", pointerEvents: "none",
    });
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex cursor-grab items-center justify-between gap-2 rounded-md bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <p className="font-bold text-slate-600 truncate">{employee.full_name}</p>
        {employee.temporary && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Temp
          </span>
        )}
      </div>
      <button onClick={onRemove} className="invisible shrink-0 rounded px-1 text-xs text-slate-400 transition-colors group-hover:visible hover:bg-slate-100 hover:text-slate-700">
        ×
      </button>
    </div>
  );
}
