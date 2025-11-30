"use client";

import { useState } from "react";
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
import { useUpdateTable } from "@/hooks/use-event";
import { Table } from "@/types/types";

type TableFormData = {
  name: string;
  capacity: number;
};

type ModifyTableProps = {
  eventId: number;
  table: Table;
  onTableUpdated?: () => void;
};

export default function ModifyTable({
  eventId,
  table,
  onTableUpdated,
}: ModifyTableProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<TableFormData>({
    name: table.name,
    capacity: table.capacity,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof TableFormData, string>>
  >({});

  const { mutateAsync: updateTable, isPending } = useUpdateTable(
    eventId,
    table.id
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TableFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la table est requis";
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = "La capacité doit être supérieure à 0";
    }

    if (formData.capacity > 100) {
      newErrors.capacity = "La capacité ne peut pas dépasser 100 places";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await updateTable({
        name: formData.name,
        capacity: formData.capacity,
      } as Table);

      setOpenDialog(false);
      if (onTableUpdated) {
        onTableUpdated();
      }
    } catch (error) {
      console.error("Error updating table:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));

    if (errors[name as keyof TableFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (open) {
      // Réinitialiser le formulaire avec les données actuelles de la table
      setFormData({
        name: table.name,
        capacity: table.capacity,
      });
      setErrors({});
    }
  };

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

      <DialogContent className="sm:max-w-md text-white/80 bg-background">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-white">Modifier la table</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">
              Nom de la table *
            </Label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.name ? "border-red-500" : "border-white/20"
              } placeholder-white/40`}
              placeholder="Ex: Table 1, VIP, Famille..."
            />
            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-white/80">
              Capacité (nombre de places) *
            </Label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={100}
              value={formData.capacity}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.capacity ? "border-red-500" : "border-white/20"
              }`}
            />
            {errors.capacity && (
              <p className="text-red-400 text-sm">{errors.capacity}</p>
            )}
            <p className="text-sm text-white/60">
              Nombre maximum de personnes que cette table peut accueillir
            </p>
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
            {isPending ? "Modification..." : "Modifier la table"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
