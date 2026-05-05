"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockAssignments, mockEmployeeStatuses, mockEmployees, mockShifts, mockStations, mockWorkAreas, mockWorkDate } from "../mock-data";
import type { Employee, EmployeeStatus, ModeCode, ShiftCode, ShiftInfo, Station, StationAssignment, WorkArea } from "../types";
import { AssignmentGrid } from "./assignment-grid";
import { AssignmentSidebar } from "./assignment-sidebar";
import { TVDisplay } from "./tv-display";

export function AssignmentBoardClient() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [statuses, setStatuses] = useState<Record<string, EmployeeStatus>>(() => {
    const map: Record<string, EmployeeStatus> = {};
    mockEmployeeStatuses
      .filter((s) => s.work_date === mockWorkDate)
      .forEach((s) => { map[s.employee_id] = s.status; });
    return map;
  });
  const [currentDate, setCurrentDate] = useState(mockWorkDate);
  const [assignmentsByDate, setAssignmentsByDate] = useState<Record<string, StationAssignment[]>>({ [mockWorkDate]: mockAssignments });

  const assignments = assignmentsByDate[currentDate] ?? [];
  const setAssignments = (updater: StationAssignment[] | ((prev: StationAssignment[]) => StationAssignment[])) => {
    setAssignmentsByDate((prev) => {
      const current = prev[currentDate] ?? [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [currentDate]: next };
    });
  };
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(mockWorkAreas);
  const [workAreaShifts, setWorkAreaShifts] = useState<Record<string, ShiftInfo[]>>(() =>
    Object.fromEntries(mockWorkAreas.map((wa) => [wa.id, [...mockShifts]]))
  );
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState<string>(mockWorkAreas[0].id);

  const UNAVAILABLE_STATUSES = new Set(["sick", "vacation", "injured"]);
  const disabledIds = new Set(
    Object.entries(statuses)
      .filter(([, s]) => UNAVAILABLE_STATUSES.has(s))
      .map(([id]) => id),
  );

  const handleAdd = (emp: Employee) => setEmployees((prev) => [...prev, emp]);
  const handleRemove = (id: string) => setEmployees((prev) => prev.filter((e) => e.id !== id));
  const handleUpdate = (id: string, updates: Partial<Employee>) =>
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  const handleStatusChange = (id: string, status: EmployeeStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const handleAssign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    if (assignments.some((a) => a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)) return;
    setAssignments((prev) => [...prev, { id: `a_${Date.now()}`, employee_id: employeeId, station_id: stationId, work_date: currentDate, shift_code: shiftCode, mode_code: modeCode }]);
    // Sync roster: set dept to the station's work area and ensure status is available
    const station = stations.find((s) => s.id === stationId);
    const workArea = station ? workAreas.find((wa) => wa.id === station.work_area_id) : null;
    if (workArea) {
      setEmployees((prev) => prev.map((e) => e.id === employeeId
        ? { ...e, departments: e.departments.includes(workArea.name) ? e.departments : [...e.departments, workArea.name] }
        : e));
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
    }
  };

  const handleUnassign = (employeeId: string, stationId: string, shiftCode: ShiftCode, modeCode: ModeCode) => {
    const remaining = assignments.filter(
      (a) => !(a.employee_id === employeeId && a.station_id === stationId && a.shift_code === shiftCode && a.mode_code === modeCode)
    );
    setAssignments(remaining);
    if (!remaining.some((a) => a.employee_id === employeeId)) {
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
      const removedStation = stations.find((s) => s.id === stationId);
      const removedWa = removedStation ? workAreas.find((wa) => wa.id === removedStation.work_area_id) : null;
      if (removedWa) {
        setEmployees((prev) => prev.map((e) => e.id === employeeId
          ? { ...e, departments: e.departments.filter((d) => d !== removedWa.name) }
          : e));
      }
    }
  };

  const handleUnassignAll = (employeeId: string) => {
    setAssignments((prev) => prev.filter((a) => a.employee_id !== employeeId));
    setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
    setEmployees((prev) => prev.map((e) => e.id === employeeId ? { ...e, departments: [] } : e));
  };

  const handleUnassignFromStation = (employeeId: string, stationId: string) => {
    const remaining = assignments.filter((a) => !(a.employee_id === employeeId && a.station_id === stationId));
    setAssignments(remaining);
    if (!remaining.some((a) => a.employee_id === employeeId)) {
      setStatuses((prev) => ({ ...prev, [employeeId]: "available" }));
      const removedStation = stations.find((s) => s.id === stationId);
      const removedWa = removedStation ? workAreas.find((wa) => wa.id === removedStation.work_area_id) : null;
      if (removedWa) {
        setEmployees((prev) => prev.map((e) => e.id === employeeId
          ? { ...e, departments: e.departments.filter((d) => d !== removedWa.name) }
          : e));
      }
    }
  };

  const handleClearWorkArea = (workAreaId: string) => {
    const stationIds = new Set(stations.filter((s) => s.work_area_id === workAreaId).map((s) => s.id));
    const removed = assignments.filter((a) => stationIds.has(a.station_id));
    const remaining = assignments.filter((a) => !stationIds.has(a.station_id));
    setAssignments(remaining);
    const clearedWa = workAreas.find((wa) => wa.id === workAreaId);
    const affectedEmpIds = new Set(removed.map((a) => a.employee_id));
    affectedEmpIds.forEach((empId) => {
      if (!remaining.some((a) => a.employee_id === empId)) {
        setStatuses((prev) => ({ ...prev, [empId]: "available" }));
      }
      if (clearedWa) {
        setEmployees((prev) => prev.map((e) => e.id === empId
          ? { ...e, departments: e.departments.filter((d) => d !== clearedWa.name) }
          : e));
      }
    });
  };

  const handleQuickAssign = (employeeId: string, stationId: string) => {
    const wa = workAreas.find((w) => stations.find((s) => s.id === stationId)?.work_area_id === w.id);
    const defaultMode: ModeCode = (wa?.mode_views?.[0]?.mode_code as ModeCode) ?? "normal";
    handleAssign(employeeId, stationId, "shift_1", defaultMode);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTV, setShowTV] = useState(false);
  const [announcement, setAnnouncement] = useState("Please clean your work area and report any equipment issues.");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState(announcement);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateDraft, setDateDraft] = useState(currentDate);

  useEffect(() => {
    const handler = () => setShowTV(true);
    window.addEventListener("tv-open", handler);
    return () => window.removeEventListener("tv-open", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setAnnouncementDraft(announcement);
      setShowAnnouncementModal(true);
    };
    window.addEventListener("announcement-edit", handler);
    return () => window.removeEventListener("announcement-edit", handler);
  }, [announcement]);

  useEffect(() => {
    const handler = () => {
      setDateDraft(currentDate);
      setShowDateModal(true);
    };
    window.addEventListener("date-picker-open", handler);
    return () => window.removeEventListener("date-picker-open", handler);
  }, [currentDate]);

  return (
    <>
    {showTV && (
      <TVDisplay
        employees={employees}
        statuses={statuses}
        assignments={assignments}
        stations={stations}
        workAreas={workAreas}
        shifts={Object.values(workAreaShifts).flat().filter((s, i, arr) => arr.findIndex(x => x.code === s.code) === i)}
        workAreaShifts={workAreaShifts}
        announcement={announcement}
        onClose={() => setShowTV(false)}
      />
    )}
    {showDateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDateModal(false)}>
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="mb-4 text-base font-bold text-slate-800">Select Date</h2>
          <input
            autoFocus
            type="date"
            value={dateDraft}
            onChange={(e) => setDateDraft(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowDateModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button
              onClick={() => {
                setCurrentDate(dateDraft);
                window.dispatchEvent(new CustomEvent("date-changed", { detail: dateDraft }));
                setShowDateModal(false);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go
            </button>
          </div>
        </div>
      </div>
    )}
    {showAnnouncementModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAnnouncementModal(false)}>
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="mb-4 text-base font-bold text-slate-800">Edit Announcement</h2>
          <textarea
            autoFocus
            value={announcementDraft}
            onChange={(e) => setAnnouncementDraft(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none resize-none"
            placeholder="Enter announcement for TV display..."
          />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowAnnouncementModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => { setAnnouncement(announcementDraft); setShowAnnouncementModal(false); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    )}
    <div className="flex h-full items-stretch gap-0">
      {/* Sidebar + collapse toggle */}
      <div className={`relative flex shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-0 overflow-hidden opacity-0" : "w-72 opacity-100"}`}>
        <AssignmentSidebar
          employees={employees}
          statuses={statuses}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          selectedWorkAreaId={selectedWorkAreaId}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onAssignToStation={handleQuickAssign}
          onUnassignAll={handleUnassignAll}
          onUnassignFromStation={handleUnassignFromStation}
        />
      </div>

      {/* Collapsed bar / toggle */}
      {sidebarCollapsed ? (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="group relative flex h-full w-4 shrink-0 cursor-pointer flex-col items-center justify-center gap-1"
          title="Show sidebar"
        >
          {/* thin line */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-slate-200 transition-colors group-hover:bg-slate-400" />
          {/* arrow chip */}
          <div className="relative z-10 flex h-7 w-4 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-slate-400 group-hover:bg-slate-50">
            <ChevronRight size={11} className="text-slate-400 group-hover:text-slate-600" />
          </div>
        </button>
      ) : (
        <div className="relative flex w-10 shrink-0 items-center justify-center">
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="z-10 flex h-7 w-4 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            title="Hide sidebar"
          >
            <ChevronLeft size={11} />
          </button>
        </div>
      )}

      <div className={`relative min-w-0 flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "ml-4" : "ml-0"}`}>
        <AssignmentGrid
          employees={employees}
          statuses={statuses}
          disabledEmployeeIds={disabledIds}
          assignments={assignments}
          stations={stations}
          workAreas={workAreas}
          selectedWorkAreaId={selectedWorkAreaId}
          onWorkAreaChange={setSelectedWorkAreaId}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onClearWorkArea={handleClearWorkArea}
          onStationsChange={setStations}
          workAreaShifts={workAreaShifts}
          onWorkAreaShiftsChange={setWorkAreaShifts}
          onWorkAreasChange={setWorkAreas}
        />
      </div>
    </div>
    </>
  );
}
