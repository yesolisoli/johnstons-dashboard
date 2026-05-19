import { AppHeader } from "@/components/layout/app-header";
import { HistoryClient } from "@/features/assignment-board/components/history-client";

export default function HistoryPage() {
  return (
    <div className="flex h-full min-h-full flex-col">
      <AppHeader eyebrow="Archive" title="Shift History" />
      <div className="min-h-0 flex-1 p-6">
        <HistoryClient />
      </div>
    </div>
  );
}
