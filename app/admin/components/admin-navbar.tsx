"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { motion } from "motion/react";
import { Bell, ShieldCheck } from "lucide-react";

export function AdminNavbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <SidebarTrigger className="text-gray-400 hover:text-primary transition-colors" />
          <Separator orientation="vertical" className="mx-4 h-6 bg-white/10" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <ShieldCheck size={18} className="text-primary opacity-50" />
          <h1 className="text-sm font-black italic uppercase tracking-widest text-white/90">
            Control <span className="text-primary">Center</span>
          </h1>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        {/* Indicateur de statut live */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tight text-emerald-400">
            System Live
          </span>
        </div>

        <button className="relative size-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-[#050505]" />
        </button>
      </div>
    </header>
  );
}
