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
import { Lock } from "lucide-react";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Événements",
      url: "/admin/events",
      icon: IconCalendar,
    },
    {
      title: "Terminals",
      url: "/admin/terminals",
      icon: IconTerminal2,
    },
    {
      title: "Utilisateurs",
      url: "/admin/users",
      icon: IconUser,
    },
  ],
  navSecondary: [
    // {
    //   title: "Paramètres",
    //   url: "/admin/settings",
    //   icon: IconSettings,
    // },
  ],
};

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session, error, refetch } = authClient.useSession();
  const user = session?.user;
  const { state } = useSidebar();

  React.useEffect(() => {
    if (error) {
      console.error(error);
      refetch();
    }
  }, [error, refetch]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={`data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent hover:text-sidebar-foreground data-[slot=sidebar-menu-button]:w-full data-[slot=sidebar-menu-button]:h-14 ${
                state === "collapsed" ? "size-24!" : "size-full"
              }`}
            >
              <div className={`flex justify-start items-center`}>
                <div className="size-10 rounded-xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                  <Lock className="text-white" size={22} />
                </div>
                <span
                  className={`text-base font-semibold ${
                    state === "collapsed"
                      ? "opacity-0 w-0 overflow-hidden hidden"
                      : "opacity-100 w-auto"
                  }`}
                >
                  LokaPass
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} userRole={user?.role || ""} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user || { name: "Joe Itax", email: "itax@gmail.com", avatar: "" }
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
