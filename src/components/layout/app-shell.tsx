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
    <div className="h-screen overflow-hidden bg-transparent">
      <div className="flex h-screen">
        <AppSidebar profile={profile} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader profile={profile} />
          <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
