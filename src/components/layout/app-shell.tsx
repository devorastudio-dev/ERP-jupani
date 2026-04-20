import type { AuthUserProfile } from "@/types/app";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppShell({
  profile,
  children,
}: {
  profile: AuthUserProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,188,0.25),_transparent_40%),linear-gradient(180deg,#fffdfb_0%,#fff7f2_100%)]">
      <div className="flex min-h-screen">
        <AppSidebar profile={profile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader profile={profile} />
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
