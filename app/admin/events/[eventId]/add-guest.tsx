"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon } from "lucide-react";

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

type GuestFormData = {
  label: string;
  peopleCount: number;
  eventId: number;
  userId: string;
  tableAssignments: { tableId: number; seatsAssigned: number }[];
};

type TableWithAvailability = Table & {
  availableSeats: number; // Places réellement disponibles (capacity - seats déjà assignés aux autres invités)
  assignedSeats: number; // Places assignées à CET invité dans le formulaire
  totalAssignedSeats: number; // Total des places assignées à tous les invités
};

export default function AddGuest({ eventId }: { eventId: number }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({
    label: "",
    peopleCount: 1,
    eventId: eventId,
    userId: "",
    tableAssignments: [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof GuestFormData, string>> & { tables?: string }
  >({});
  const { mutateAsync: createInvitation, isPending } =
    useCreateInvitation(eventId);
  const { data: session } = authClient.useSession();
  const { data: dataTables } = useTables(eventId);
  const { data: existingInvitations } = useEventInvitations(eventId);

  const tables = dataTables as Table[];
  const invitations = existingInvitations as Invitation[];

  // Calculer les places disponibles pour chaque table
  const [availableTables, setAvailableTables] = useState<
    TableWithAvailability[]
  >([]);

  // Fonction pour calculer les places réellement disponibles
  const calculateAvailableSeats = useCallback(
    (tables: Table[], invitations: Invitation[]) => {
      // Calculer le total des places déjà assignées par table
      const tableAssignmentsMap = new Map<number, number>();

      invitations?.forEach((invitation) => {
        invitation.allocations?.forEach((allocation) => {
          const current = tableAssignmentsMap.get(allocation.tableId) || 0;
          tableAssignmentsMap.set(
            allocation.tableId,
            current + allocation.seatsAssigned
          );
        });
      });

      return tables.map((table: Table) => {
        const totalAssignedSeats = tableAssignmentsMap.get(table.id) || 0;
        const availableSeats = Math.max(0, table.capacity - totalAssignedSeats);

        return {
          ...table,
          availableSeats,
          assignedSeats: 0, // Pour cet invité en cours de création
          totalAssignedSeats, // Total de toutes les assignations existantes
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

  // Fonction pour initialiser le formulaire
  const initializeForm = useCallback(() => {
    if (tables && invitations) {
      const tablesWithAvailability = calculateAvailableSeats(
        tables,
        invitations
      );

      // Calculer les assignations initiales
      const { assignments, updatedTables } = suggestAutoDistribution(
        1,
        tablesWithAvailability
      );

      return { assignments, updatedTables };
    }
    return { assignments: [], updatedTables: [] };
  }, [tables, invitations, calculateAvailableSeats, suggestAutoDistribution]);

  // Initialiser les tables quand le dialog s'ouvre
  useEffect(() => {
    if (openDialog && tables && invitations) {
      const { assignments, updatedTables } = initializeForm();

      // Utiliser requestAnimationFrame pour éviter les appels synchrones
      requestAnimationFrame(() => {
        setAvailableTables(updatedTables);
        setFormData((prev) => ({
          ...prev,
          tableAssignments: assignments,
          peopleCount: 1,
          label: "",
        }));
      });
    }
  }, [openDialog, tables, invitations, initializeForm]);

  // Gérer les changements de peopleCount avec un flag pour éviter la boucle
  const [shouldAutoDistribute, setShouldAutoDistribute] = useState(true);

  const handlePeopleCountChange = useCallback((newPeopleCount: number) => {
    setFormData((prev) => ({
      ...prev,
      peopleCount: newPeopleCount,
    }));
    setShouldAutoDistribute(true);
  }, []);

  // Appliquer la répartition automatique quand nécessaire
  useEffect(() => {
    if (
      shouldAutoDistribute &&
      formData.peopleCount > 0 &&
      availableTables.length > 0
    ) {
      const { assignments, updatedTables } = suggestAutoDistribution(
        formData.peopleCount,
        availableTables
      );

      requestAnimationFrame(() => {
        setFormData((prev) => ({
          ...prev,
          tableAssignments: assignments,
        }));
        setAvailableTables(updatedTables);
        setShouldAutoDistribute(false);
      });
    }
  }, [
    shouldAutoDistribute,
    formData.peopleCount,
    availableTables,
    suggestAutoDistribution,
  ]);

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
        // Vérifier que l'assignation ne dépasse pas la capacité disponible
        const totalAfterAssignment =
          table.totalAssignedSeats + assignment.seatsAssigned;
        if (totalAfterAssignment > table.capacity) {
          newErrors.tables = `La table "${table.name}" ne peut pas accueillir ${assignment.seatsAssigned} places supplémentaires (${table.totalAssignedSeats}/${table.capacity} places déjà assignées)`;
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
      await createInvitation({
        label: formData.label,
        peopleCount: formData.peopleCount,
        eventId: formData.eventId,
        userId: session?.user?.id || "",
        tableAssignments: formData.tableAssignments,
      } as unknown as Invitation);

      // Réinitialiser le formulaire
      setFormData({
        label: "",
        peopleCount: 1,
        eventId: eventId,
        userId: "",
        tableAssignments: [],
      });
      setOpenDialog(false);
    } catch (error) {
      console.error(error);
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
        // Supprimer l'assignation
        updatedAssignments.splice(existingAssignmentIndex, 1);
      } else {
        // Modifier l'assignation
        updatedAssignments[existingAssignmentIndex].seatsAssigned = seats;
      }
    } else if (seats > 0) {
      // Ajouter une nouvelle assignation
      updatedAssignments.push({ tableId, seatsAssigned: seats });
    }

    setFormData((prev) => ({
      ...prev,
      tableAssignments: updatedAssignments,
    }));

    // Mettre à jour les tables disponibles (seulement l'assignedSeats pour cet invité)
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

      requestAnimationFrame(() => {
        setFormData((prev) => ({
          ...prev,
          tableAssignments: assignments,
        }));
        setAvailableTables(updatedTables);
      });
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

  const totalAssignedSeats = formData.tableAssignments.reduce(
    (sum, assignment) => sum + assignment.seatsAssigned,
    0
  );

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="m-auto" variant="outline">
          <PlusIcon className="-ms-1 opacity-60" size={16} />
          Ajouter un invité
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Ajouter un nouvel invité</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Guest Name */}
          <div className="space-y-2">
            <Label htmlFor="label">Nom de l&apos;invité *</Label>
            <input
              id="label"
              name="label"
              type="text"
              value={formData.label}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.label ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Joe Itax ou Couple Mutombo"
            />
            {errors.label && (
              <p className="text-red-500 text-sm">{errors.label}</p>
            )}
          </div>

          {/* People Count */}
          <div className="space-y-2">
            <Label htmlFor="peopleCount">Nombre de personnes *</Label>
            <input
              id="peopleCount"
              name="peopleCount"
              type="number"
              min={1}
              value={formData.peopleCount}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.peopleCount ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.peopleCount && (
              <p className="text-red-500 text-sm">{errors.peopleCount}</p>
            )}
          </div>

          {/* Tables Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Assignation aux tables</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDistribution}
                  disabled={formData.peopleCount <= 0}
                >
                  Auto-répartition
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllAssignments}
                >
                  Tout effacer
                </Button>
              </div>
            </div>

            {errors.tables && (
              <p className="text-red-500 text-sm">{errors.tables}</p>
            )}

            <div className="text-sm text-gray-200 mb-2">
              Places assignées: {totalAssignedSeats}/{formData.peopleCount}
              {totalAssignedSeats !== formData.peopleCount && (
                <span className="text-red-500 ml-2">
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
                const remainingAfterAssignment =
                  table.availableSeats - currentSeats;

                return (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{table.name}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        (Capacité: {table.capacity}, Occupé:{" "}
                        {table.totalAssignedSeats}, Disponible:{" "}
                        {remainingAfterAssignment >= 0
                          ? remainingAfterAssignment
                          : 0}
                        )
                      </span>
                      {remainingAfterAssignment < 0 && (
                        <span className="text-red-500 text-xs ml-2">
                          ⚠ Dépassement!
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
                        className="p-1 border rounded"
                      >
                        {Array.from(
                          {
                            length:
                              Math.min(
                                table.availableSeats,
                                formData.peopleCount
                              ) + 1,
                          },
                          (_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          )
                        )}
                      </select>
                      <span className="text-sm w-12">places</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableTables.length === 0 && (
              <p className="text-yellow-600 text-sm">
                Aucune table disponible pour cet événement. Veuillez
                d&apos;abord créer des tables.
              </p>
            )}
          </div>

          {/* Hidden fields */}
          <input type="hidden" name="eventId" value={formData.eventId} />
          <input type="hidden" name="userId" value={session?.user?.id || ""} />
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Ajout en cours..." : "Ajouter l'invité"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
