"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AssignmentBoardClient } from "@/features/assignment-board/components/assignment-board-client";
import { AssignmentBoardHeaderActions } from "./header-actions";

export default function AssignmentBoardPage() {
  return (
    <div className="flex h-full min-h-full flex-col">
      <AppHeader
        eyebrow="Supervisor / Lead Hand"
        title="Packaging Department Employee Assignment"
        actions={<AssignmentBoardHeaderActions />}
      />

      <div className="min-h-0 flex-1 p-6">
        <AssignmentBoardClient />
      </div>
    </div>
  );
}
