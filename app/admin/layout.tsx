import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminNavbar } from "./components/admin-navbar";
import { AdminSidebar } from "./components/admin-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      {/* Sidebar avec effet de flou */}
      <AdminSidebar
        variant="inset"
        className="bg-black/40 backdrop-blur-xl border-r border-white/5"
      />

      <SidebarInset className="bg-[#050505] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover">
        <div className="flex min-h-screen flex-col">
          <AdminNavbar />

          <main className="flex-1 p-2 sm:p-8 max-w-400 mx-auto w-full">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
