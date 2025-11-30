"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  IconDotsVertical,
  IconLogout,
  // IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { signOut } = authClient;
  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };
  const avatarFallback = user.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar hover:bg-white/10 data-[state=open]:text-white"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscal">
                <AvatarFallback className="rounded-lg bg-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight text-white">
                <span className="truncate font-medium text-inherit">
                  {user.name}
                </span>
                <span className="text-inherit truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg text-white bg-background shadow-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-transparent">
                  <AvatarFallback className="rounded-lg bg-primary">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-white truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/admin/account">
                <DropdownMenuItem>
                  <IconUserCircle />
                  Compte
                </DropdownMenuItem>
              </Link>
              {/* <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Se deconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
