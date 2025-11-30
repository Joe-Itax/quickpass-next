"use client";

import { useState, useEffect, useCallback } from "react";
import { EditIcon } from "lucide-react";

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
    guest.id
  );
  const { data: dataTables } = useTables(eventId);
  const { data: existingInvitations } = useEventInvitations(eventId);

  const tables = dataTables as Table[];
  const invitations = existingInvitations as Invitation[];

  // Trouver l'invité complet avec ses allocations depuis la liste des invitations
  const currentGuest = invitations?.find((inv) => inv.id === guest.id) || guest;

  // Calculer les places disponibles pour chaque table
  const [availableTables, setAvailableTables] = useState<
    TableWithAvailability[]
  >([]);

  // Gérer les changements de peopleCount avec un flag pour éviter la boucle
  //   const [shouldAutoDistribute, setShouldAutoDistribute] = useState(false);

  // Fonction pour calculer les places réellement disponibles (en excluant l'invité actuel)
  const calculateAvailableSeats = useCallback(
    (tables: Table[], invitations: Invitation[], currentGuest: Invitation) => {
      const tableAssignmentsMap = new Map<number, number>();

      invitations?.forEach((invitation) => {
        // Exclure l'invité actuel du calcul des places occupées
        if (invitation.id !== currentGuest.id) {
          invitation.allocations?.forEach((allocation) => {
            const tableId = allocation.table?.id || allocation.tableId;
            if (tableId) {
              const current = tableAssignmentsMap.get(tableId) || 0;
              tableAssignmentsMap.set(
                tableId,
                current + allocation.seatsAssigned
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
          assignedSeats: 0, // Sera mis à jour dans initializeForm
          totalAssignedSeats,
        };
      });
    },
    []
  );

  // Fonction pour suggérer une répartition automatique
  const suggestAutoDistribution = useCallback(
    (peopleCount: number, tables: TableWithAvailability[]) => {
      if (peopleCount <= 0 || tables.length === 0)
        return { assignments: [], updatedTables: tables };

      const assignments: { tableId: number; seatsAssigned: number }[] = [];
      let remainingPeople = peopleCount;

      // Réinitialiser les assignations actuelles pour CET invité
      const updatedTables = tables.map((table) => ({
        ...table,
        assignedSeats: 0,
      }));

      // Trier les tables par capacité disponible (descendant)
      const sortedTables = [...updatedTables].sort(
        (a, b) => b.availableSeats - a.availableSeats
      );

      // Essayer de trouver une table avec assez de places
      const singleTable = sortedTables.find(
        (table) => table.availableSeats >= remainingPeople
      );

      if (singleTable) {
        assignments.push({
          tableId: singleTable.id,
          seatsAssigned: remainingPeople,
        });
        singleTable.assignedSeats = remainingPeople;
      } else {
        // Répartir sur plusieurs tables
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
    []
  );

  // Fonction pour initialiser le formulaire avec les données de l'invité
  const initializeForm = useCallback(() => {
    if (tables && currentGuest && invitations) {
      console.log("Initializing form with guest:", currentGuest);
      console.log("Guest allocations:", currentGuest.allocations);

      const tablesWithAvailability = calculateAvailableSeats(
        tables,
        invitations,
        currentGuest
      );

      // Récupérer les assignations actuelles de l'invité
      const currentAssignments =
        currentGuest.allocations
          ?.map((alloc) => ({
            tableId: alloc.table?.id || alloc.tableId,
            seatsAssigned: alloc.seatsAssigned,
          }))
          .filter(
            (assignment) => assignment.tableId && assignment.seatsAssigned > 0
          ) || [];

      console.log("Current assignments found:", currentAssignments);

      // Mettre à jour les assignedSeats dans les tables
      const updatedTables = tablesWithAvailability.map((table) => {
        const currentAssignment = currentAssignments.find(
          (assignment) => assignment.tableId === table.id
        );
        const assignedSeats = currentAssignment?.seatsAssigned || 0;

        console.log(`Table ${table.name}: assignedSeats = ${assignedSeats}`);

        return {
          ...table,
          assignedSeats: assignedSeats,
          // Ajuster les places disponibles en tenant compte des assignations actuelles
          availableSeats: Math.max(0, table.availableSeats - assignedSeats),
        };
      });

      const formData = {
        label: currentGuest.label,
        peopleCount: currentGuest.peopleCount,
        tableAssignments: currentAssignments,
      };

      console.log("Final form data:", formData);
      console.log("Final tables:", updatedTables);

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

  // Initialiser les tables quand le dialog s'ouvre
  useEffect(() => {
    if (openDialog && tables && currentGuest && invitations) {
      console.log("Dialog opened, initializing form...");

      const { updatedTables, formData } = initializeForm();

      // Utiliser setTimeout pour s'assurer que le rendu est terminé
      setTimeout(() => {
        setAvailableTables(updatedTables);
        setFormData(formData);

        console.log("Form initialized:", {
          formData,
          availableTables: updatedTables,
        });
      }, 0);
    }
  }, [openDialog, tables, currentGuest, invitations, initializeForm]);

  // CORRECTION 1: Utiliser useCallback au lieu de useEffect pour la répartition automatique
  const handlePeopleCountChange = useCallback(
    (newPeopleCount: number) => {
      setFormData((prev) => ({
        ...prev,
        peopleCount: newPeopleCount,
      }));

      // Appliquer la répartition automatique immédiatement
      if (newPeopleCount > 0 && availableTables.length > 0) {
        const { assignments, updatedTables } = suggestAutoDistribution(
          newPeopleCount,
          availableTables
        );

        setFormData((prev) => ({
          ...prev,
          tableAssignments: assignments,
        }));
        setAvailableTables(updatedTables);
      }
    },
    [availableTables, suggestAutoDistribution]
  );

  // CORRECTION 2: Supprimer l'useEffect problématique pour la répartition automatique
  // et gérer la réinitialisation différemment

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestFormData, string>> & {
      tables?: string;
    } = {};

    if (!formData.label.trim())
      newErrors.label = "Le nom de l'invité est requis";
    if (!formData.peopleCount || formData.peopleCount <= 0)
      newErrors.peopleCount = "Le nombre de personnes doit être supérieur à 0";

    // Vérifier si la répartition est complète
    const totalAssignedSeats = formData.tableAssignments.reduce(
      (sum, assignment) => sum + assignment.seatsAssigned,
      0
    );
    if (totalAssignedSeats !== formData.peopleCount) {
      newErrors.tables = `Répartition incomplète: ${totalAssignedSeats}/${formData.peopleCount} places assignées`;
    }

    // Vérifier si les assignations dépassent les capacités RÉELLES
    for (const assignment of formData.tableAssignments) {
      const table = availableTables.find((t) => t.id === assignment.tableId);
      if (table) {
        const totalAfterAssignment =
          table.totalAssignedSeats + assignment.seatsAssigned;
        if (totalAfterAssignment > table.capacity) {
          newErrors.tables = `La table "${table.name}" ne peut pas accueillir ${assignment.seatsAssigned} places (${table.totalAssignedSeats}/${table.capacity} places déjà assignées par d'autres invités)`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const validTableAssignments = formData.tableAssignments.filter(
        (assignment) => assignment.tableId && assignment.seatsAssigned > 0
      );

      console.log("Submitting with assignments:", validTableAssignments);

      await updateInvitation({
        label: formData.label,
        peopleCount: formData.peopleCount,
        tableAssignments: validTableAssignments,
      } as unknown as Invitation);

      setOpenDialog(false);
      if (onGuestUpdated) {
        onGuestUpdated();
      }
    } catch (error) {
      console.error("Error updating invitation:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "peopleCount") {
      handlePeopleCountChange(Number(value));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name as keyof GuestFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTableAssignmentChange = (tableId: number, seats: number) => {
    const updatedAssignments = [...formData.tableAssignments];
    const existingAssignmentIndex = updatedAssignments.findIndex(
      (a) => a.tableId === tableId
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
        table.id === tableId ? { ...table, assignedSeats: seats } : table
      )
    );
  };

  const handleAutoDistribution = () => {
    if (formData.peopleCount > 0 && availableTables.length > 0) {
      const { assignments, updatedTables } = suggestAutoDistribution(
        formData.peopleCount,
        availableTables
      );

      setFormData((prev) => ({
        ...prev,
        tableAssignments: assignments,
      }));
      setAvailableTables(updatedTables);
    }
  };

  const clearAllAssignments = () => {
    setFormData((prev) => ({
      ...prev,
      tableAssignments: [],
    }));
    setAvailableTables((prev) =>
      prev.map((table) => ({ ...table, assignedSeats: 0 }))
    );
  };

  // CORRECTION 3: Gérer la réinitialisation dans le onOpenChange du Dialog
  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      // Réinitialiser le formulaire quand le dialog se ferme
      setTimeout(() => {
        setFormData({
          label: "",
          peopleCount: 1,
          tableAssignments: [],
        });
        setAvailableTables([]);
        setErrors({});
      }, 300); // Attendre que l'animation de fermeture soit terminée
    }
  };

  const totalAssignedSeats = formData.tableAssignments.reduce(
    (sum, assignment) => sum + assignment.seatsAssigned,
    0
  );

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
        >
          <EditIcon className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg text-white/80 bg-background">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-white">
            Modifier l&apos;invité
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Guest Name */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-white/80">
              Nom de l&apos;invité *
            </Label>
            <input
              id="label"
              name="label"
              type="text"
              value={formData.label}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.label ? "border-red-500" : "border-white/20"
              } placeholder-white/40`}
              placeholder="Ex: Joe Itax ou Couple Mutombo"
            />
            {errors.label && (
              <p className="text-red-400 text-sm">{errors.label}</p>
            )}
          </div>

          {/* People Count */}
          <div className="space-y-2">
            <Label htmlFor="peopleCount" className="text-white/80">
              Nombre de personnes *
            </Label>
            <input
              id="peopleCount"
              name="peopleCount"
              type="number"
              min={1}
              value={formData.peopleCount}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.peopleCount ? "border-red-500" : "border-white/20"
              }`}
            />
            {errors.peopleCount && (
              <p className="text-red-400 text-sm">{errors.peopleCount}</p>
            )}
          </div>

          {/* Tables Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Assignation aux tables</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDistribution}
                  disabled={formData.peopleCount <= 0}
                  className="text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
                >
                  Auto-répartition
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllAssignments}
                  className="text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
                >
                  Tout effacer
                </Button>
              </div>
            </div>

            {errors.tables && (
              <p className="text-red-400 text-sm">{errors.tables}</p>
            )}

            <div className="text-sm text-white/60 mb-2">
              Places assignées: {totalAssignedSeats}/{formData.peopleCount}
              {totalAssignedSeats !== formData.peopleCount && (
                <span className="text-red-400 ml-2">
                  ⚠ Répartition incomplète
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableTables.map((table) => {
                const currentAssignment = formData.tableAssignments.find(
                  (a) => a.tableId === table.id
                );
                const currentSeats = currentAssignment?.seatsAssigned || 0;

                return (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-3 border rounded border-white/20 bg-white/5"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-white">
                        {table.name}
                      </span>
                      <span className="text-sm text-white/60 ml-2">
                        (Capacité: {table.capacity}, Occupé par autres:{" "}
                        {table.totalAssignedSeats}, Vous assignez:{" "}
                        {currentSeats}, Disponible: {table.availableSeats})
                      </span>
                      {currentSeats > 0 && table.availableSeats < 0 && (
                        <span className="text-red-400 text-xs ml-2">
                          ⚠ Dépassement de capacité!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={currentSeats}
                        onChange={(e) =>
                          handleTableAssignmentChange(
                            table.id,
                            Number(e.target.value)
                          )
                        }
                        className="p-1 border rounded bg-white/5 border-white/20 text-white"
                      >
                        {Array.from({ length: table.capacity + 1 }, (_, i) => (
                          <option key={i} value={i} className="bg-gray-800">
                            {i}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-white/60 w-12">places</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableTables.length === 0 && (
              <p className="text-yellow-400 text-sm">
                Aucune table disponible pour cet événement. Veuillez
                d&apos;abord créer des tables.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {isPending ? "Modification..." : "Modifier l'invité"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
