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
import { useUpdateEvent } from "@/hooks/use-event";
import { Event2 } from "@/types/types";

type EventFormData = {
  name: string;
  description: string;
  location: string;
  date: string;
};

type ModifyEventProps = {
  event: Event2;
  onEventUpdated?: () => void;
};

export default function ModifyEvent({
  event,
  onEventUpdated,
}: ModifyEventProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: event.name,
    description: event.description || "",
    location: event.location,
    date: event.date.split("T")[0], // Format YYYY-MM-DD pour l'input date
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});

  const { mutateAsync: updateEvent, isPending } = useUpdateEvent(event.id);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'événement est requis";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Le lieu est requis";
    }

    if (!formData.date) {
      newErrors.date = "La date est requise";
    }

    // Vérifier que la date n'est pas dans le passé
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      newErrors.date = "La date ne peut pas être dans le passé";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convertir la date au format ISO et créer l'objet Event2
      const eventData: Event2 = {
        ...event, // Conserver toutes les propriétés existantes
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: new Date(formData.date).toISOString(),
      };

      await updateEvent(eventData);

      setOpenDialog(false);
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof EventFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (open) {
      // Réinitialiser le formulaire avec les données actuelles de l'événement
      setFormData({
        name: event.name,
        description: event.description || "",
        location: event.location,
        date: event.date.split("T")[0],
      });
      setErrors({});
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <EditIcon className="w-4 h-4 mr-2" />
          Modifier l&apos;événement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md text-white/80 bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-white">
            Modifier l&apos;événement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">
              Nom de l&apos;événement *
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
              placeholder="Ex: Mariage de Jane et John"
            />
            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80">
              Description
            </Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded bg-white/5 border-white/20 text-white placeholder-white/40 resize-none"
              placeholder="Description de l'événement..."
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white/80">
              Lieu *
            </Label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.location ? "border-red-500" : "border-white/20"
              } placeholder-white/40`}
              placeholder="Ex: Salle des fêtes, Paris"
            />
            {errors.location && (
              <p className="text-red-400 text-sm">{errors.location}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white/80">
              Date de l&apos;événement *
            </Label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full p-2 border rounded bg-white/5 border-white/20 text-white ${
                errors.date ? "border-red-500" : "border-white/20"
              }`}
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.date && (
              <p className="text-red-400 text-sm">{errors.date}</p>
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
            {isPending ? "Modification..." : "Modifier l'événement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
