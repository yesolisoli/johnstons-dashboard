"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAssignmentBoardData } from "../hooks/use-assignment-board-data";
import { AssignmentGrid } from "./assignment-grid";
import { AssignmentSidebar } from "./assignment-sidebar";
import { TVDisplay } from "./tv-display";

export function AssignmentBoardClient() {
  const {
    employees,
    statuses,
    assignments,
    stations,
    workAreas,
    workAreaShifts,
    selectedWorkAreaId,
    disabledIds,
    handleStationsChange,
    handleWorkAreasChange,
    handleWorkAreaShiftsChange,
    handleWorkAreaChange,
    handleAdd,
    handleRemoveEmployee,
    handleUpdate,
    handleStatusChange,
    handleAssign,
    handleUnassign,
    handleUnassignAll,
    handleUnassignFromStation,
    handleClearWorkArea,
    handleQuickAssign,
  } = useAssignmentBoardData();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTV, setShowTV] = useState(false);
  const [announcement, setAnnouncement] = useState("Please clean your work area and report any equipment issues.");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState(announcement);

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
            onRemove={handleRemoveEmployee}
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
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-slate-200 transition-colors group-hover:bg-slate-400" />
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
            onWorkAreaChange={handleWorkAreaChange}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            onClearWorkArea={handleClearWorkArea}
            onStationsChange={handleStationsChange}
            workAreaShifts={workAreaShifts}
            onWorkAreaShiftsChange={handleWorkAreaShiftsChange}
            onWorkAreasChange={handleWorkAreasChange}
          />
        </div>
      </div>
    </>
  );
}
