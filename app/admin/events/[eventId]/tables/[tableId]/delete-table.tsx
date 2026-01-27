"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTable } from "@/hooks/use-event";
import { cn } from "@/lib/utils";

export default function DeleteTable({
  tableId,
  tableName,
  eventId,
  occupiedSeats,
}: {
  tableId: number;
  tableName: string;
  eventId: number;
  occupiedSeats: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { mutateAsync: deleteTable, isPending } = useDeleteTable(
    eventId,
    tableId,
  );

  const hasGuests = occupiedSeats > 0;

  const handleDelete = async () => {
    if (hasGuests) return;
    try {
      await deleteTable(tableId);
      setOpen(false);
      router.push(`/admin/events/${eventId}/tables`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="rounded-xl font-black uppercase italic text-[10px] h-11 px-6 border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl sm:max-w-md">
        <DialogHeader className="bg-red-500/10 p-8 border-b border-red-500/10">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase text-white">
                Attention
              </DialogTitle>
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">
                Action irréversible
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            Êtes-vous sûr de vouloir supprimer la table{" "}
            <span className="text-white font-black italic">
              &quot;{tableName.toUpperCase()}&quot;
            </span>{" "}
            ? Cette action effacera définitivement la table de l&apos;événement.
          </p>

          {hasGuests && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2 text-red-500">
                <X size={16} strokeWidth={3} />
                <p className="text-[10px] font-black uppercase">
                  Action bloquée
                </p>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
                Il y a actuellement{" "}
                <span className="text-white">{occupiedSeats} invités</span>{" "}
                assignés à cette table. Vous devez les déplacer ou supprimer
                leurs invitations avant de pouvoir supprimer cette table.
              </p>
            </div>
          )}
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
            disabled={isPending || hasGuests}
            onClick={handleDelete}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-8 h-12 transition-all",
              hasGuests
                ? "bg-white/5 text-gray-700 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
            )}
          >
            {isPending ? "Suppression..." : "Confirmer la suppression"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
