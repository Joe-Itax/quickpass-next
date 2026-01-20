"use client";

import { useState, useEffect, useCallback } from "react";
import {
  EditIcon,
  Table2,
  Wand2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

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
  useUpdateInvitation,
  useTables,
  useEventInvitations,
} from "@/hooks/use-event";
import { Invitation, Table } from "@/types/types";
import { cn } from "@/lib/utils";

type GuestFormData = {
  label: string;
  peopleCount: number;
  tableAssignments: { tableId: number; seatsAssigned: number }[];
};

type TableWithAvailability = Table & {
  availableSeats: number;
  assignedSeats: number;
  totalAssignedSeats: number;
};

type ModifyGuestProps = {
  eventId: number;
  guest: Invitation;
  onGuestUpdated?: () => void;
};

export default function ModifyGuest({
  eventId,
  guest,
  onGuestUpdated,
}: ModifyGuestProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({
    label: "",
    peopleCount: 1,
    tableAssignments: [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof GuestFormData, string>> & { tables?: string }
  >({});

  const { mutateAsync: updateInvitation, isPending } = useUpdateInvitation(
    eventId,
    guest.id,
  );
  const { data: dataTables } = useTables(eventId);
  const { data: existingInvitations } = useEventInvitations(eventId);

  const tables = dataTables as Table[];
  const invitations = existingInvitations as Invitation[];

  const currentGuest = invitations?.find((inv) => inv.id === guest.id) || guest;

  const [availableTables, setAvailableTables] = useState<
    TableWithAvailability[]
  >([]);

  const calculateAvailableSeats = useCallback(
    (tables: Table[], invitations: Invitation[], currentGuest: Invitation) => {
      const tableAssignmentsMap = new Map<number, number>();

      invitations?.forEach((invitation) => {
        if (invitation.id !== currentGuest.id) {
          invitation.allocations?.forEach((allocation) => {
            const tableId = allocation.table?.id || allocation.tableId;
            if (tableId) {
              const current = tableAssignmentsMap.get(tableId) || 0;
              tableAssignmentsMap.set(
                tableId,
                current + allocation.seatsAssigned,
              );
            }
          });
        }
      });

      return tables.map((table: Table) => {
        const totalAssignedSeats = tableAssignmentsMap.get(table.id) || 0;
        const availableSeats = Math.max(0, table.capacity - totalAssignedSeats);

        return {
          ...table,
          availableSeats,
          assignedSeats: 0,
          totalAssignedSeats,
        };
      });
    },
    [],
  );

  const suggestAutoDistribution = useCallback(
    (peopleCount: number, tables: TableWithAvailability[]) => {
      if (peopleCount <= 0 || tables.length === 0)
        return { assignments: [], updatedTables: tables };

      const assignments: { tableId: number; seatsAssigned: number }[] = [];
      let remainingPeople = peopleCount;

      const updatedTables = tables.map((table) => ({
        ...table,
        assignedSeats: 0,
      }));

      const sortedTables = [...updatedTables].sort(
        (a, b) => b.availableSeats - a.availableSeats,
      );

      const singleTable = sortedTables.find(
        (table) => table.availableSeats >= remainingPeople,
      );

      if (singleTable) {
        assignments.push({
          tableId: singleTable.id,
          seatsAssigned: remainingPeople,
        });
        singleTable.assignedSeats = remainingPeople;
      } else {
        for (const table of sortedTables) {
          if (remainingPeople <= 0) break;
          const seatsToAssign = Math.min(table.availableSeats, remainingPeople);
          if (seatsToAssign > 0) {
            assignments.push({
              tableId: table.id,
              seatsAssigned: seatsToAssign,
            });
            table.assignedSeats = seatsToAssign;
            remainingPeople -= seatsToAssign;
          }
        }
      }

      return { assignments, updatedTables };
    },
    [],
  );

  const initializeForm = useCallback(() => {
    if (tables && currentGuest && invitations) {
      const tablesWithAvailability = calculateAvailableSeats(
        tables,
        invitations,
        currentGuest,
      );

      const currentAssignments =
        currentGuest.allocations
          ?.map((alloc) => ({
            tableId: alloc.table?.id || alloc.tableId,
            seatsAssigned: alloc.seatsAssigned,
          }))
          .filter(
            (assignment) => assignment.tableId && assignment.seatsAssigned > 0,
          ) || [];

      const updatedTables = tablesWithAvailability.map((table) => {
        const currentAssignment = currentAssignments.find(
          (assignment) => assignment.tableId === table.id,
        );
        const assignedSeats = currentAssignment?.seatsAssigned || 0;

        return {
          ...table,
          assignedSeats: assignedSeats,
          availableSeats: Math.max(0, table.availableSeats - assignedSeats),
        };
      });

      const formData = {
        label: currentGuest.label,
        peopleCount: currentGuest.peopleCount,
        tableAssignments: currentAssignments,
      };

      return {
        assignments: currentAssignments,
        updatedTables: updatedTables,
        formData: formData,
      };
    }
    return {
      assignments: [],
      updatedTables: [],
      formData: { label: "", peopleCount: 1, tableAssignments: [] },
    };
  }, [tables, currentGuest, invitations, calculateAvailableSeats]);

  useEffect(() => {
    if (openDialog && tables && currentGuest && invitations) {
      const { updatedTables, formData } = initializeForm();
      setTimeout(() => {
        setAvailableTables(updatedTables);
        setFormData(formData);
      }, 0);
    }
  }, [openDialog, tables, currentGuest, invitations, initializeForm]);

  const handlePeopleCountChange = useCallback(
    (newPeopleCount: number) => {
      setFormData((prev) => ({
        ...prev,
        peopleCount: newPeopleCount,
      }));

      if (newPeopleCount > 0 && availableTables.length > 0) {
        const { assignments, updatedTables } = suggestAutoDistribution(
          newPeopleCount,
          availableTables,
        );

        setFormData((prev) => ({
          ...prev,
          tableAssignments: assignments,
        }));
        setAvailableTables(updatedTables);
      }
    },
    [availableTables, suggestAutoDistribution],
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestFormData, string>> & {
      tables?: string;
    } = {};

    if (!formData.label.trim()) newErrors.label = "Identifiant requis";
    if (!formData.peopleCount || formData.peopleCount <= 0)
      newErrors.peopleCount = "Quantité invalide";

    const totalAssignedSeats = formData.tableAssignments.reduce(
      (sum, assignment) => sum + assignment.seatsAssigned,
      0,
    );
    if (totalAssignedSeats !== formData.peopleCount) {
      newErrors.tables = `Incomplet: ${totalAssignedSeats}/${formData.peopleCount}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const validTableAssignments = formData.tableAssignments.filter(
        (assignment) => assignment.tableId && assignment.seatsAssigned > 0,
      );

      await updateInvitation({
        label: formData.label,
        peopleCount: formData.peopleCount,
        tableAssignments: validTableAssignments,
      } as unknown as Invitation);

      setOpenDialog(false);
      if (onGuestUpdated) onGuestUpdated();
    } catch (error) {
      console.error("Error updating invitation:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "peopleCount") {
      handlePeopleCountChange(Number(value));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof GuestFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTableAssignmentChange = (tableId: number, seats: number) => {
    const updatedAssignments = [...formData.tableAssignments];
    const existingAssignmentIndex = updatedAssignments.findIndex(
      (a) => a.tableId === tableId,
    );

    if (existingAssignmentIndex >= 0) {
      if (seats === 0) {
        updatedAssignments.splice(existingAssignmentIndex, 1);
      } else {
        updatedAssignments[existingAssignmentIndex].seatsAssigned = seats;
      }
    } else if (seats > 0) {
      updatedAssignments.push({ tableId, seatsAssigned: seats });
    }

    setFormData((prev) => ({
      ...prev,
      tableAssignments: updatedAssignments,
    }));

    setAvailableTables((prev) =>
      prev.map((table) =>
        table.id === tableId ? { ...table, assignedSeats: seats } : table,
      ),
    );
  };

  const handleAutoDistribution = () => {
    if (formData.peopleCount > 0 && availableTables.length > 0) {
      const { assignments, updatedTables } = suggestAutoDistribution(
        formData.peopleCount,
        availableTables,
      );
      setFormData((prev) => ({ ...prev, tableAssignments: assignments }));
      setAvailableTables(updatedTables);
    }
  };

  const clearAllAssignments = () => {
    setFormData((prev) => ({ ...prev, tableAssignments: [] }));
    setAvailableTables((prev) =>
      prev.map((table) => ({ ...table, assignedSeats: 0 })),
    );
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      setTimeout(() => {
        setFormData({ label: "", peopleCount: 1, tableAssignments: [] });
        setAvailableTables([]);
        setErrors({});
      }, 300);
    }
  };

  const totalAssignedSeats = formData.tableAssignments.reduce(
    (sum, assignment) => sum + assignment.seatsAssigned,
    0,
  );

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <EditIcon className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        {/* HEADER */}
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <RefreshCcw className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase text-white tracking-tighter">
                Guest Edit
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Modification des accès
              </p>
            </div>
          </div>
          <div
            className={cn(
              "px-4 py-2 rounded-xl border font-black italic text-xs transition-all flex items-center gap-2",
              totalAssignedSeats === formData.peopleCount
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-red-500/10 border-red-500/20 text-red-500",
            )}
          >
            {totalAssignedSeats === formData.peopleCount ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            {totalAssignedSeats} / {formData.peopleCount} ALLOUÉS
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
                Nom du groupe
              </Label>
              <input
                name="label"
                value={formData.label}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-white font-bold italic focus:border-primary focus:outline-none transition-all",
                  errors.label ? "border-red-500" : "border-white/10",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
                Effectif
              </Label>
              <input
                name="peopleCount"
                type="number"
                min={1}
                value={formData.peopleCount}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-white font-bold focus:border-primary focus:outline-none transition-all",
                  errors.peopleCount ? "border-red-500" : "border-white/10",
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Table2 size={14} /> Répartition des sièges
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoDistribution}
                  className="h-8 text-[9px] font-black uppercase bg-primary/10 text-primary hover:text-primary hover:bg-primary/20"
                >
                  <Wand2 size={12} className="mr-2" /> Auto-Fill
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllAssignments}
                  className="h-8 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 hover:text-destructive"
                >
                  <Trash2 size={12} className="mr-2" /> Reset
                </Button>
              </div>
            </div>

            {errors.tables && (
              <p className="text-red-400 text-[10px] font-black uppercase italic ml-1 flex items-center gap-2">
                <AlertTriangle size={12} /> {errors.tables}
              </p>
            )}

            <div className="grid gap-3">
              {availableTables.map((table) => {
                const currentAssignment = formData.tableAssignments.find(
                  (a) => a.tableId === table.id,
                );
                const currentSeats = currentAssignment?.seatsAssigned || 0;

                // BLOQUAGE DES OPTIONS :
                // On calcule le maximum de places qu'on peut allouer à CET invité sur CETTE table.
                // C'est : (Ce qui est libre) + (Ce qu'il occupe déjà là)
                const maxSelectableForThisGuest =
                  table.availableSeats + currentSeats;

                return (
                  <div
                    key={table.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between",
                      currentSeats > 0
                        ? "bg-white/5 border-primary/30"
                        : "bg-white/1 border-white/5",
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-black uppercase italic text-sm text-white">
                        {table.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-gray-600 uppercase">
                          Capacité: {table.capacity} | Autres:{" "}
                          {table.totalAssignedSeats} | Dispo:{" "}
                          {table.availableSeats}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <select
                        value={currentSeats}
                        onChange={(e) =>
                          handleTableAssignmentChange(
                            table.id,
                            Number(e.target.value),
                          )
                        }
                        className="bg-black border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-primary outline-none"
                      >
                        {/* On limite dynamiquement la liste ici */}
                        {Array.from(
                          { length: maxSelectableForThisGuest + 1 },
                          (_, i) => (
                            <option key={i} value={i} className="bg-[#0a0a0a]">
                              {i} places
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              totalAssignedSeats === formData.peopleCount
                ? "bg-primary shadow-[0_0_20px_rgba(253,182,35,0.3)]"
                : "bg-white/10 text-gray-500",
            )}
          >
            {isPending ? "Sync..." : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
