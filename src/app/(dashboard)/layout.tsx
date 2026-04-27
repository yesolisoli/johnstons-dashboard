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
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar />
        <div className="min-h-screen flex-1">
          <AppHeader userEmail={userEmail} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}