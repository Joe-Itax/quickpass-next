"use client";

import { useState } from "react";
import { Edit3, AlertTriangle, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table } from "@/types/types";
import { useUpdateTable } from "@/hooks/use-event";
import { cn } from "@/lib/utils";

export default function ModifyTable({
  table,
  occupiedSeats,
  eventId,
}: {
  table: Table;
  occupiedSeats: number;
  eventId: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(table.name);
  const [capacity, setCapacity] = useState(table.capacity);

  // Utilisation de ta fonction : useUpdateTable(eventId, tableId)
  const { mutateAsync: updateTable, isPending } = useUpdateTable(
    eventId,
    table.id,
  );

  const isCapacityTooLow = capacity < occupiedSeats;

  const handleSave = async () => {
    if (isCapacityTooLow) return;
    try {
      await updateTable({
        ...table,
        name,
        capacity,
      });
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-[10px] font-black uppercase italic tracking-widest h-11 px-6 transition-all"
        >
          <Edit3 className="w-4 h-4 mr-2 text-primary" /> Modifier Config
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl sm:max-w-md">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Table2 className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase text-white">
                Édition Table
              </DialogTitle>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                Configuration technique
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
              Nom / Numéro
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="h-12 bg-white/5 border-white/10 text-white font-bold italic focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
                Capacité totale
              </Label>
              <span className="text-[10px] font-black text-emerald-500 uppercase">
                {occupiedSeats} Occupés
              </span>
            </div>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className={cn(
                "h-12 bg-white/5 font-bold text-white",
                isCapacityTooLow
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-white/10",
              )}
            />
            {isCapacityTooLow && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-3 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="text-red-500 shrink-0" size={14} />
                <p className="text-[9px] font-bold text-red-500 uppercase leading-relaxed">
                  Réduction impossible : {occupiedSeats} places sont déjà
                  réservées par des invités sur cette table.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-500 font-bold uppercase text-[10px]"
          >
            Annuler
          </Button>
          <Button
            disabled={isPending || isCapacityTooLow}
            onClick={handleSave}
            className="rounded-2xl font-black uppercase italic text-xs px-8 h-12 transition-colors"
          >
            {isPending ? "Mise à jour..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
