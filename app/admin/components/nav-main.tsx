"use client";

import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
  userRole,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  userRole: string;
}) {
  const pathname = usePathname();

  const filteredItems = items.filter((item) => {
    if (item.title === "Utilisateurs") {
      return userRole === "ADMIN";
    }

    return true;
  });

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {filteredItems.map((item) => (
            <Link
              href={`${item.url}`}
              key={`${item.title} - ${item.url}`}
              className=""
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={`text-white ${
                    pathname === item.url
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:text-primary-foreground link-active"
                      : "hover:bg-white/10"
                  } `}
                >
                  {item.icon && (
                    <item.icon
                      color={`#fff`}
                      className={`text-white ${
                        pathname !== item.url ? "" : ""
                      } `}
                    />
                  )}
                  <span className={`${pathname === item.url ? "" : ""} `}>
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
