"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, quickNavigation } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppQuickNav() {
  const pathname = usePathname();
  const items = navigation.filter((item) =>
    quickNavigation.some((href) => href === item.href),
  );

  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition-all",
              active
                ? "border-rose-200 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/60"
                : "border-white/80 bg-white/80 text-stone-600 hover:border-rose-100 hover:bg-white hover:text-stone-900",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                active ? "bg-white text-rose-600" : "bg-stone-100/80 text-stone-500",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
