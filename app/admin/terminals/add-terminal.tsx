"use client";

import { useState } from "react";
import { PlusIcon, Monitor, Calendar, CheckCircle2, X } from "lucide-react";
import { useCreateTerminal, useEvents } from "@/hooks/use-event";
import { Event } from "@/types/types";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AddTerminal() {
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");

  const { data: events } = useEvents();
  const { mutateAsync: createTerminal, isPending } = useCreateTerminal();

  const handleSubmit = async () => {
    if (!name || !eventId) return;

    try {
      await createTerminal({ name, eventId });
      setName("");
      setEventId("");
      setOpenDialog(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <PlusIcon className="mr-2" size={18} />
          Ajouter un terminal
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        {/* HEADER STYLISÉ */}
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row items-center gap-4 space-y-0">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Monitor className="text-primary" size={24} />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black italic uppercase text-white tracking-tighter">
              New Terminal
            </DialogTitle>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Configuration du point de contrôle
            </p>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* INPUT NOM */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-widest"
            >
              Nom du terminal
            </Label>
            <div className="relative">
              <input
                id="name"
                placeholder="Ex: Entrée VIP Nord"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold italic focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
              />
              <Monitor
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10"
                size={18}
              />
            </div>
          </div>

          {/* SELECT ÉVÉNEMENT */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-widest">
              Événement rattaché
            </Label>
            <Select onValueChange={setEventId} value={eventId}>
              <SelectTrigger className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold italic focus:ring-0 focus:ring-offset-0 focus:border-primary transition-all">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <SelectValue placeholder="SÉLECTIONNER L'ÉVÉNEMENT" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10 rounded-2xl text-white">
                {Array.isArray(events) &&
                  events.map((ev: Event) => (
                    <SelectItem
                      key={ev.id}
                      value={ev.id.toString()}
                      className="font-bold uppercase italic text-xs py-3 focus:bg-primary focus:text-white transition-colors"
                    >
                      {ev.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
            >
              <X className="mr-2" size={14} /> Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name || !eventId}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              name && eventId
                ? "bg-primary text- shadow-[0_0_20px_rgba(253,182,35,0.3)]"
                : "bg-white/10 text-gray-500",
            )}
          >
            {isPending ? (
              "Sync..."
            ) : (
              <>
                <CheckCircle2 className="mr-2" size={16} /> Confirmer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
