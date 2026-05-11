"use client";

import { useEffect, useRef, useState } from "react";
import type { Employee } from "../../types";

export function EmployeeSelect({ employees, value, onChange }: {
  employees: Employee[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = employees.find((e) => e.id === value);
  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(query.toLowerCase()) ||
    (e.employee_code ?? "").toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50);

  const handleSelect = (id: string | undefined) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="w-full rounded-xl border border-slate-800 bg-slate-50 px-4 py-3 text-left text-sm font-medium transition-colors focus:bg-white focus:outline-none"
      >
        {selected
          ? <span className="text-slate-800">{selected.full_name}{selected.employee_code ? <span className="ml-1.5 text-xs text-slate-400">#{selected.employee_code}</span> : null}</span>
          : <span className="text-slate-400">None</span>
        }
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${!value ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              None
            </button>
            {filtered.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleSelect(emp.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === emp.id ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {emp.full_name}
                {emp.employee_code && (
                  <span className={`ml-1.5 text-xs ${value === emp.id ? "text-slate-300" : "text-slate-400"}`}>#{emp.employee_code}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No employees found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
