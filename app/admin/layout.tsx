import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminNavbar } from "./components/admin-navbar";
import { AdminSidebar } from "./components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <div className="flex min-h-screen bg-background text-foreground">
          <div className="flex-1 flex flex-col">
            <AdminNavbar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
