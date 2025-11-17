"use client";

import * as React from "react";
import { IconDashboard, IconSettings, IconCalendar } from "@tabler/icons-react";

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
      title: "Paramètres",
      url: "",
      icon: IconSettings,
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
                <div
                  className={`bg-primary rounded-full flex items-center justify-center drop-shadow-[0_0_5px_#FDB623] shrink-0 p-1 ${
                    state === "collapsed" ? "size-6! m-auto" : "size-10!"
                  }`}
                >
                  <Image
                    src="/logo-app/logo-white.svg"
                    alt="QuickPass"
                    width={100}
                    height={100}
                    className="size-full"
                  />
                </div>
                <span
                  className={`text-base font-semibold ml-3 ${
                    state === "collapsed"
                      ? "opacity-0 w-0 overflow-hidden hidden"
                      : "opacity-100 w-auto"
                  }`}
                >
                  Quick Scan
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
