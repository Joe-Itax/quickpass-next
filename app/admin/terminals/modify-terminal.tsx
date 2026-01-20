"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Save, X, Power, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModifyTerminalProps {
  terminal: { id: number; name: string; isActive: boolean };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModifyTerminal({
  terminal,
  open,
  onOpenChange,
}: ModifyTerminalProps) {
  const [name, setName] = useState(terminal.name);
  const [isActive, setIsActive] = useState(terminal.isActive);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/terminals/${terminal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, isActive }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-with-terminals"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        {/* HEADER */}
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row items-center gap-4 space-y-0">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Settings2 className="text-primary" size={24} />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black italic uppercase text-white tracking-tighter">
              Terminal Config
            </DialogTitle>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ID: #{terminal.id.toString().padStart(3, "0")}
            </p>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* INPUT NOM */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-widest">
              Désignation du point
            </Label>
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold italic focus:border-primary focus:outline-none transition-all"
                placeholder="Nom du terminal..."
              />
              <Monitor
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10"
                size={18}
              />
            </div>
          </div>

          {/* STATUS TOGGLE CARD */}
          <div
            className={cn(
              "group flex items-center justify-between p-6 rounded-4xl border transition-all",
              isActive
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-red-500/5 border-red-500/20",
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center border transition-colors",
                  isActive
                    ? "bg-emerald-500 text-black border-emerald-400"
                    : "bg-red-900/50 text-red-500 border-red-500/30",
                )}
              >
                <Power size={18} className={isActive ? "animate-pulse" : ""} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase italic text-white tracking-wide">
                  Statut Opérationnel
                </Label>
                <p className="text-[9px] font-bold text-gray-500 uppercase leading-none">
                  {isActive ? "Scans autorisés" : "Point verrouillé"}
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-900 cursor-pointer"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
            >
              <X className="mr-2" size={14} /> Abandonner
            </Button>
          </DialogClose>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !name}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              "bg-primary shadow-[0_0_20px_rgba(253,182,35,0.3)] hover:scale-105 active:scale-95",
            )}
          >
            {isPending ? (
              "Mise à jour..."
            ) : (
              <>
                <Save className="mr-2" size={16} /> Sauvegarder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
