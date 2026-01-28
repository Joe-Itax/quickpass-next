"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Search, Check, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useEventInvitations,
  useUpdateTableAllocation,
} from "@/hooks/use-event"; // Supposant que tu as un hook pour l'allocation
import { Invitation } from "@/types/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AssignGuests({
  eventId,
  tableId,
  remainingCapacity,
}: {
  eventId: number;
  tableId: number;
  remainingCapacity: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: invitations, isPending } = useEventInvitations(eventId);
  // On imagine un hook qui fait un POST sur /api/events/[eventId]/tables/[tableId]/allocate
  const { mutateAsync: allocate, isPending: isSaving } =
    useUpdateTableAllocation(eventId, tableId);

  // Filtrer les invités non assignés ou partiellement assignés
  const availableGuests = useMemo(() => {
    if (!invitations) return [];
    return (invitations as Invitation[]).filter((inv) => {
      const alreadyAssigned =
        inv.allocations?.reduce((sum, a) => sum + a.seatsAssigned, 0) || 0;
      const needsTable = alreadyAssigned < inv.peopleCount;
      const matchesSearch = inv.label
        .toLowerCase()
        .includes(search.toLowerCase());
      return needsTable && matchesSearch;
    });
  }, [invitations, search]);

  const totalSelectedSeats = useMemo(() => {
    return availableGuests
      .filter((g) => selectedIds.includes(g.id))
      .reduce((sum, g) => sum + g.peopleCount, 0);
  }, [selectedIds, availableGuests]);

  const isOverCapacity = totalSelectedSeats > remainingCapacity;

  const toggleGuest = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (isOverCapacity) return;
    try {
      await allocate({ guestIds: selectedIds });
      toast.success("Invités assignés avec succès");
      setOpen(false);
      setSelectedIds([]);
    } catch (e) {
      console.error("Error assigning guests:", e);
      toast.error("Erreur lors de l'assignation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <Plus className="size-4 mr-2 text-primary" /> Ajouter des invités
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl sm:max-w-xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black italic uppercase text-white">
                  Assigner à la table
                </DialogTitle>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  Places libres :{" "}
                  <span className="text-primary">
                    {remainingCapacity - totalSelectedSeats}
                  </span>{" "}
                  / {remainingCapacity}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={16}
            />
            <Input
              placeholder="RECHERCHER UN INVITÉ (NOM, FAMILLE...)"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white font-bold italic text-xs"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {isPending ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              availableGuests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => toggleGuest(guest.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                    selectedIds.includes(guest.id)
                      ? "bg-primary/10 border-primary/50"
                      : "bg-white/5 border-white/5 hover:border-white/20",
                  )}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className={cn(
                        "size-5 rounded-md border flex items-center justify-center transition-colors",
                        selectedIds.includes(guest.id)
                          ? "bg-primary border-primary text-black"
                          : "border-white/20",
                      )}
                    >
                      {selectedIds.includes(guest.id) && (
                        <Check size={12} strokeWidth={4} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase italic text-[11px]">
                        {guest.label}
                      </p>
                      <p className="text-[9px] font-black text-gray-500 uppercase">
                        {guest.peopleCount} PERSONNES
                      </p>
                    </div>
                  </div>
                  {selectedIds.includes(guest.id) && (
                    <span className="text-[10px] font-black text-primary uppercase italic">
                      Sélectionné
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {isOverCapacity && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={18} />
              <p className="text-[10px] font-black uppercase italic">
                Capacité dépassée ! Retirez des invités.
              </p>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[9px] font-black text-gray-500 uppercase">
              Total sélection
            </p>
            <p
              className={cn(
                "text-xl font-black italic",
                isOverCapacity ? "text-red-500" : "text-white",
              )}
            >
              {totalSelectedSeats} PAX
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-gray-500 font-bold uppercase text-[10px]"
            >
              Annuler
            </Button>
            <Button
              disabled={selectedIds.length === 0 || isOverCapacity || isSaving}
              onClick={handleSave}
              className="bg-primary text- rounded-2xl font-black uppercase italic text-xs px-8 h-12"
            >
              {isSaving ? "Assignation..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
