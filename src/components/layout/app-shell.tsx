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
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen">
        <AppSidebar profile={profile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader profile={profile} />
          <main className="flex-1 px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
