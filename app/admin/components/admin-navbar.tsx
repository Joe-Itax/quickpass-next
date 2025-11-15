"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminNavbar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-lg font-semibold flex gap-1">Admin Dashboard</h1>
      </div>
    </header>
  );
}
