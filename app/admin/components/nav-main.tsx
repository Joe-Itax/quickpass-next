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
import { motion } from "motion/react";

export function NavMain({
  items,
  userRole,
}: {
  items: { title: string; url: string; icon?: Icon }[];
  userRole: string;
}) {
  const pathname = usePathname();

  const filteredItems = items.filter((item) => {
    if (item.title === "Utilisateurs") return userRole === "ADMIN";
    return true;
  });

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`relative h-11 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    {/* Indicateur de sélection vertical */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_#FDB623]"
                      />
                    )}

                    {item.icon && (
                      <item.icon
                        size={20}
                        stroke={isActive ? 2.5 : 1.5}
                        className={`transition-colors ${isActive ? "text-primary" : "group-hover:text-white"}`}
                      />
                    )}

                    <span
                      className={`text-xs font-black uppercase tracking-widest italic ${isActive ? "opacity-100" : "opacity-70"}`}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
