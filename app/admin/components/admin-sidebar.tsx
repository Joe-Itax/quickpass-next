"use client";

import * as React from "react";
import {
  IconDashboard,
  IconCalendar,
  IconUser,
  IconTerminal2,
} from "@tabler/icons-react";

import { NavMain } from "@/app/admin/components/nav-main";
import { NavSecondary } from "@/app/admin/components/nav-secondary";
import { NavUser } from "@/app/admin/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

const data = {
  navMain: [
    { title: "Dashboard", url: "/admin", icon: IconDashboard },
    { title: "Événements", url: "/admin/events", icon: IconCalendar },
    { title: "Terminals", url: "/admin/terminals", icon: IconTerminal2 },
    { title: "Utilisateurs", url: "/admin/users", icon: IconUser },
  ],
  navSecondary: [],
};

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { state } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-white/5 bg-black/40 backdrop-blur-xl z-100"
    >
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent h-12 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 max-[390px]:size-8 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Image
                    src={`/logo-app/icon-1024-no_background.png`}
                    width={40}
                    height={40}
                    alt="Logo YambiPass"
                    className="w-full p-1"
                  />
                </div>
                <div
                  className={`flex flex-col transition-opacity duration-300 ${
                    state === "collapsed" ? "opacity-0 w-0" : "opacity-100"
                  }`}
                >
                  <p className="text-2xl max-[390px]:text-xl tracking-tighter">
                    <span className="font-black"> Yambi</span>
                    <span>Pass</span>
                  </p>
                  <span className="text-[8px] font-bold text-primary tracking-[0.2em] uppercase leading-none">
                    Admin Panel
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-">
        <NavMain items={data.navMain} userRole={user?.role || ""} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 bg-white/2">
        <NavUser
          user={
            user || { name: "Joe Itax", email: "itax@gmail.com", avatar: "" }
          }
          state={state}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
