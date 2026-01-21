"use client";

import { useState } from "react";
import {
  Settings2,
  Calendar,
  MapPin,
  AlignLeft,
  Info,
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
import { useUpdateEvent } from "@/hooks/use-event";
import { Event2 } from "@/types/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

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
    date: event.date.split("T")[0],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});

  const { mutateAsync: updateEvent, isPending } = useUpdateEvent(event.id);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "IDENTIFIANT REQUIS";
    if (!formData.location.trim()) newErrors.location = "COORDONNÉES REQUISES";
    if (!formData.date) newErrors.date = "HORODATAGE REQUIS";

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) newErrors.date = "DATE INVALIDE (PASSÉ)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const eventData: Event2 = {
        ...event,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: new Date(formData.date).toISOString(),
      };
      await updateEvent(eventData);
      setOpenDialog(false);
      onEventUpdated?.();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EventFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <Settings2 className="size-4 mr-2 text-primary" />
          Éditer Paramètres
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Settings2 className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Configuration
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                Édition des paramètres d&apos;événement
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Nom de l'événement */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Info size={12} /> Désignation Système
            </Label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold italic text-white transition-all focus:outline-none focus:ring-1 focus:ring-primary",
                errors.name ? "border-red-500 bg-red-500/5" : "border-white/10",
              )}
              placeholder="Nom de l'événement..."
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-[9px] font-black italic uppercase tracking-widest"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <AlignLeft size={12} /> Détails additionnels
            </Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 transition-all focus:outline-none focus:border-primary resize-none"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lieu */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <MapPin size={12} /> Localisation
              </Label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white transition-all focus:outline-none focus:border-primary",
                  errors.location
                    ? "border-red-500 bg-red-500/5"
                    : "border-white/10",
                )}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <Calendar size={12} /> Horodatage
              </Label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white transition-all focus:outline-none focus:border-primary scheme-dark",
                  errors.date
                    ? "border-red-500 bg-red-500/5"
                    : "border-white/10",
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between gap-4">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              Annuler
            </Button>
          </DialogClose>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-2xl bg-primary font-black uppercase italic text-xs px-8 h-12 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(253,182,35,0.2)]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="size-4 border-2 border-white border-t-transparent rounded-full"
                />
                Mise à jour...
              </span>
            ) : (
              "Valider les modifications"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
