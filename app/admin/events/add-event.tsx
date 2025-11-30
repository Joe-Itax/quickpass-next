"use client";

import { useState } from "react";
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

import { useCreateEvent } from "@/hooks/use-event";

type EventFormData = {
  name: string;
  description: string;
  date: string;
  location: string;
};

export default function AddEvent() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    date: "",
    location: "",
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});
  const { mutateAsync: createEvent, isPending } = useCreateEvent();

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.description.trim())
      newErrors.description = "Unepetite description de l'événement est requis";
    if (!formData.date.trim()) newErrors.date = "La date est requise";
    if (!formData.location.trim()) newErrors.location = "Le lieu est requis";
    // if (!formData.totalCapacity || formData.totalCapacity <= 0)
    //   newErrors.totalCapacity = "La capacité doit être > 0";

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
      await createEvent({
        name: formData.name,
        description: formData.description,
        date: formData.date,
        location: formData.location,
      } as Parameters<typeof createEvent>[0]);

      setFormData({
        name: "",
        description: "",
        date: "",
        location: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setOpenDialog(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalCapacity" ? Number(value) : value,
    }));

    if (errors[name as keyof EventFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="m-auto" variant="outline">
          <PlusIcon className="-ms-1 opacity-60" size={16} />
          Ajouter un événement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Créer un nouvel événement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="name">Description *</Label>
            <input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.date ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Lieu *</Label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.location ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location}</p>
            )}
          </div>

          {/* Capacity */}
          {/* <div className="space-y-2">
            <Label htmlFor="totalCapacity">Capacité totale *</Label>
            <input
              id="totalCapacity"
              name="totalCapacity"
              type="number"
              min={1}
              value={formData.totalCapacity}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.totalCapacity ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.totalCapacity && (
              <p className="text-red-500 text-sm">{errors.totalCapacity}</p>
            )}
          </div> */}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Création..." : "Créer l'événement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
