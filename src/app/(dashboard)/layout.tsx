import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AUTH_ENABLED } from "@/lib/config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "";

  if (AUTH_ENABLED) {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    userEmail = user.email ?? "";
  }
  
  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-full">
        <AppSidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader userEmail={userEmail} />
          <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}