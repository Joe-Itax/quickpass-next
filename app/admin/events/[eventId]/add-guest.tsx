"use client";

import { useState, useMemo } from "react";
import { PlusIcon, Users, Table2, Wand2 } from "lucide-react";
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
  useCreateInvitation,
  useTables,
  useEventInvitations,
} from "@/hooks/use-event";
import { authClient } from "@/lib/auth-client";
import { Invitation, Table } from "@/types/types";
import { cn } from "@/lib/utils";

export default function AddGuest({ eventId }: { eventId: number }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    peopleCount: 1,
    tableAssignments: [] as { tableId: number; seatsAssigned: number }[],
  });

  const { mutateAsync: createInvitation, isPending } =
    useCreateInvitation(eventId);
  const { data: session } = authClient.useSession();
  const { data: dataTables } = useTables(eventId);
  const { data: dataInvs } = useEventInvitations(eventId);

  // --- LOGIQUE DE CALCUL ---
  const tableStats = useMemo(() => {
    const tables = (dataTables as Table[]) || [];
    const invitations = (dataInvs as Invitation[]) || [];

    const map = new Map<number, number>();
    invitations.forEach((inv) => {
      inv.allocations?.forEach((alloc) => {
        map.set(
          alloc.tableId,
          (map.get(alloc.tableId) || 0) + alloc.seatsAssigned,
        );
      });
    });

    return tables.map((t) => {
      const occupied = map.get(t.id) || 0;
      const currentAssigned =
        formData.tableAssignments.find((a) => a.tableId === t.id)
          ?.seatsAssigned || 0;
      return {
        ...t,
        alreadyOccupied: occupied,
        realAvailable: Math.max(0, t.capacity - occupied),
        currentAssigned,
      };
    });
  }, [dataTables, dataInvs, formData.tableAssignments]);

  const totalAssigned = formData.tableAssignments.reduce(
    (sum, a) => sum + a.seatsAssigned,
    0,
  );
  const isAllocationComplete = totalAssigned === formData.peopleCount;
  const hasOverfill = tableStats.some(
    (t) => t.currentAssigned > t.realAvailable,
  );

  // --- ACTIONS ---
  const handleAutoFill = () => {
    let remaining = formData.peopleCount;
    const newAssignments: { tableId: number; seatsAssigned: number }[] = [];

    // On trie par places dispo réelles
    const sorted = [...tableStats].sort(
      (a, b) => b.realAvailable - a.realAvailable,
    );

    for (const t of sorted) {
      if (remaining <= 0) break;
      const toAssign = Math.min(t.realAvailable, remaining);
      if (toAssign > 0) {
        newAssignments.push({ tableId: t.id, seatsAssigned: toAssign });
        remaining -= toAssign;
      }
    }
    setFormData((p) => ({ ...p, tableAssignments: newAssignments }));
  };

  const handleTableChange = (tableId: number, seats: number) => {
    setFormData((prev) => {
      const filtered = prev.tableAssignments.filter(
        (a) => a.tableId !== tableId,
      );
      return {
        ...prev,
        tableAssignments:
          seats > 0
            ? [...filtered, { tableId, seatsAssigned: seats }]
            : filtered,
      };
    });
  };

  const handleSubmit = async () => {
    // DOUBLE SÉCURITÉ : On empêche le submit si calcul faux
    if (!isAllocationComplete || hasOverfill || !formData.label.trim()) return;

    try {
      await createInvitation({
        label: formData.label,
        peopleCount: formData.peopleCount,
        eventId,
        userId: session?.user?.id || "",
        tableAssignments: formData.tableAssignments,
      } as unknown as Invitation);

      setFormData({ label: "", peopleCount: 1, tableAssignments: [] });
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <PlusIcon className="mr-2 size-4 text-primary" /> Ajouter Invité
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase text-white">
                Guest Entry
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase">
                Vérification des capacités
              </p>
            </div>
          </div>
          <div
            className={cn(
              "px-4 py-2 rounded-xl border font-black italic text-xs",
              isAllocationComplete && !hasOverfill
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-red-500/10 border-red-500/20 text-red-500",
            )}
          >
            {totalAssigned} / {formData.peopleCount} PLACES
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Nom du groupe
              </Label>
              <input
                value={formData.label}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, label: e.target.value }))
                }
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold italic focus:border-primary focus:outline-none"
                placeholder="Ex: SMITH FAMILY"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Nombre d&apos;invités
              </Label>
              <input
                type="number"
                min={1}
                value={formData.peopleCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData((p) => ({
                    ...p,
                    peopleCount: val,
                    tableAssignments: [],
                  })); // Reset assignments on count change
                }}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Table2 size={14} /> Allocation par table
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutoFill}
                className="h-8 text-[9px] font-black uppercase bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Wand2 size={12} className="mr-2" /> Auto-Répartition
              </Button>
            </div>

            <div className="grid gap-3">
              {tableStats.map((table) => (
                <div
                  key={table.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    table.currentAssigned > 0
                      ? "bg-white/5 border-primary/30"
                      : "bg-white/1 border-white/5",
                  )}
                >
                  <div>
                    <p className="font-black uppercase italic text-sm text-white">
                      {table.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            table.alreadyOccupied / table.capacity > 0.9
                              ? "bg-red-500"
                              : "bg-emerald-500",
                          )}
                          style={{
                            width: `${(table.alreadyOccupied / table.capacity) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-gray-500">
                        {table.alreadyOccupied} / {table.capacity} OCCUPÉS
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-[8px] font-black text-gray-500 uppercase">
                        Disponible
                      </p>
                      <p className="text-xs font-mono font-bold text-emerald-400">
                        {table.realAvailable}
                      </p>
                    </div>
                    <select
                      value={table.currentAssigned}
                      onChange={(e) =>
                        handleTableChange(table.id, Number(e.target.value))
                      }
                      className="bg-black border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white focus:ring-1 focus:ring-primary outline-none"
                    >
                      {/* LE COEUR DE LA SÉCURITÉ : On ne propose jamais plus que le disponible réel */}
                      {Array.from(
                        { length: table.realAvailable + 1 },
                        (_, i) => (
                          <option key={i} value={i}>
                            {i} places
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px]"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !isAllocationComplete ||
              hasOverfill ||
              !formData.label.trim()
            }
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              isAllocationComplete && (!hasOverfill || !formData.label.trim())
                ? "bg-primary shadow-[0_0_20px_rgba(253,182,35,0.3)]"
                : "bg-white/10 text-gray-500 cursor-not-allowed",
            )}
          >
            {isPending ? "Initialisation..." : "Enregistrer l'invité"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
