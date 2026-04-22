"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Beef,
  Calculator,
  Package,
  CalendarRange,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assignment-board", label: "Assignment Board", icon: Users },
  { href: "/hog-intake", label: "Hog Intake", icon: Beef },
  { href: "/primal-calc", label: "Primal Calc", icon: Calculator },
  { href: "/orders-allocation", label: "Orders & Allocation", icon: Package },
  { href: "/production-planner", label: "Production Planner", icon: CalendarRange },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-72 border-r bg-white p-4">
      <div className="mb-6 rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">
          Johnston Packers 1995 LTD
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          Packaging Department Dashboard
        </h2>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}