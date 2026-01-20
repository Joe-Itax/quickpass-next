"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconDotsVertical,
  IconLogout,
  IconQrcode,
  IconUserCircle,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  user: { name: string; email: string; avatar?: string; role?: string };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { signOut } = authClient;

  const handleLogout = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  const avatarFallback = user.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-2xl hover:bg-white/5 transition-all group"
            >
              <Avatar className="h-9 w-9 rounded-xl border border-white/10">
                <AvatarFallback className="bg-primary text-white font-black text-xs">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight ml-1">
                <span className="truncate text-xs font-black uppercase italic text-white group-hover:text-primary transition-colors">
                  {user.name}
                </span>
                <span className="truncate text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                  {user.role || "Opérateur"}
                </span>
              </div>
              <IconDotsVertical
                size={16}
                className="text-gray-600 group-hover:text-white transition-colors"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 rounded-2xl bg-[#0a0a0a] border-white/10 text-white shadow-2xl backdrop-blur-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
                  Connecté en tant que
                </p>
                <p className="text-sm font-bold truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/5" />

            <DropdownMenuGroup className="p-2">
              <Link href="/admin/account">
                <DropdownMenuItem className="rounded-xl focus:bg-white/5 focus:text-primary cursor-pointer gap-3 py-3">
                  <IconUserCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Mon Compte
                  </span>
                </DropdownMenuItem>
              </Link>

              <Link href="/scan-portail">
                <DropdownMenuItem className="rounded-xl focus:bg-white/5 focus:text-primary cursor-pointer gap-3 py-3">
                  <IconQrcode size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Zone de scan
                  </span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/5" />

            <div className="p-2">
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl focus:bg-red-500/10 focus:text-red-500 cursor-pointer gap-3 py-3 text-red-400"
              >
                <IconLogout size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Déconnexion
                </span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
