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
} from "@/components/ui/sidebar";
// import { LinkIcon } from "lucide-react";
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

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, error, refetch } = authClient.useSession();
  const user = session?.user;

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
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent hover:text-sidebar-foreground data-[slot=sidebar-menu-button]:w-full data-[slot=sidebar-menu-button]:h-16"
            >
              <div className="flex justify-start items-center">
                {/* <LinkIcon className="size-6!" /> */}
                {/* data-[state=close]:size6! data-[state=collapsed]:size!6 */}
                <div className="size-10!  bg-[#FDB623] rounded-full flex items-center justify-center drop-shadow-[0_0_21px_#FDB623] p-1.5">
                  <Image
                    src="/logo-app/logo-white.svg"
                    alt="QuickPass"
                    width={100}
                    height={100}
                    className="m-auto size-full"
                  />
                </div>
                <span className="text-base font-semibold ml-3">Quick Scan</span>
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
