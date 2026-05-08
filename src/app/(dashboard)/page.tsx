import Link from "next/link";
import {
  ArrowRight,
  Beef,
  CalendarRange,
  Calculator,
  LayoutGrid,
  Package,
  Settings,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";

const modules = [
  {
    href: "/assignment-board",
    title: "Assignment Board",
    description: "View and manage assignments and tasks.",
    icon: LayoutGrid,
    accent: "text-blue-700",
    iconColor: "text-blue-600",
    cardClassName: "bg-blue-100/70 ring-blue-200/80",
    wide: false,
  },
  {
    href: "/hog-intake",
    title: "Hog Intake",
    description: "Record and manage hog intake information.",
    icon: Beef,
    accent: "text-emerald-700",
    iconColor: "text-emerald-600",
    cardClassName: "bg-emerald-100/70 ring-emerald-200/80",
    wide: false,
  },
  {
    href: "/primal-calc",
    title: "Primal Calc",
    description: "Calculate and manage primal values.",
    icon: Calculator,
    accent: "text-violet-700",
    iconColor: "text-violet-600",
    cardClassName: "bg-violet-100/70 ring-violet-200/80",
    wide: false,
  },
  {
    href: "/orders-allocation",
    title: "Orders & Allocation",
    description: "Manage orders and allocations efficiently.",
    icon: Package,
    accent: "text-amber-700",
    iconColor: "text-amber-600",
    cardClassName: "bg-amber-100/70 ring-amber-200/80",
    wide: false,
  },
  {
    href: "/production-planner",
    title: "Production Planner",
    description: "Plan and schedule production activities.",
    icon: CalendarRange,
    accent: "text-red-600",
    iconColor: "text-red-500",
    cardClassName: "bg-red-100/70 ring-red-200/80",
    wide: true,
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Configure system settings and preferences.",
    icon: Settings,
    accent: "text-sky-700",
    iconColor: "text-sky-600",
    cardClassName: "bg-sky-100/70 ring-sky-200/80",
    wide: true,
  },
];

export default function DashboardHomePage() {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <AppHeader
        title="Dashboard"
        description="Select a module to get started."
      />

      <section className="min-h-0 flex-1 bg-slate-50 px-7 pt-8 pb-5 lg:px-10 lg:pt-8 lg:pb-6 xl:px-12">
        <div className="mx-auto flex h-full min-h-0 max-w-[1660px] overflow-visible bg-slate-50">
          <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:grid-rows-2 xl:gap-5">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className={[
                    "group relative overflow-hidden rounded-[1.65rem] p-5 shadow-none ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-none lg:p-6",
                    module.cardClassName,
                    module.wide
                      ? "md:col-span-2 min-h-[14rem] xl:min-h-0 xl:h-full"
                      : "min-h-[15.5rem] xl:min-h-0 xl:h-full",
                  ].join(" ")}
                >
                  <div className="relative flex h-full flex-col">
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/95 shadow-none lg:h-20 lg:w-20">
                      <Icon className={module.iconColor} size={32} strokeWidth={2} />
                    </div>

                    <div className="mt-4 max-w-[15rem]">
                      <h2
                        className={`text-[1.4rem] leading-none font-black tracking-tight ${module.accent} lg:text-[1.6rem]`}
                      >
                        {module.title}
                      </h2>
                      <p className="mt-3 text-[0.95rem] leading-7 text-slate-700 lg:text-[1rem] lg:leading-7">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-auto flex justify-end pt-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-none transition-transform duration-300 group-hover:translate-x-1 lg:h-16 lg:w-16">
                        <ArrowRight
                          className={module.iconColor}
                          size={26}
                          strokeWidth={2.2}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
