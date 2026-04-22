import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar />
        <div className="min-h-screen flex-1">
          <AppHeader userEmail={user.email ?? ""} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}