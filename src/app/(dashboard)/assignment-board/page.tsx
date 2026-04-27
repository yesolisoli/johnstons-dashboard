import { AssignmentGrid } from "@/features/assignment-board/components/assignment-grid";
import { AssignmentSidebar } from "@/features/assignment-board/components/assignment-sidebar";

export default function AssignmentBoardPage() {
  return (
    <div className="flex items-start gap-6">
      <AssignmentSidebar />
      <div className="min-w-0 flex-1">
        <AssignmentGrid />
      </div>
    </div>
  );
}
