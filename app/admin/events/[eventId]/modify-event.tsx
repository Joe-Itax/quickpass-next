"use client";

import { useState, useMemo } from "react";
import {
  Settings2,
  Calendar,
  MapPin,
  AlignLeft,
  Info,
  Clock,
  Timer,
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
  startTime: string;
  durationHours: number;
};

type ModifyEventProps = {
  event: Event2;
  onEventUpdated?: () => void;
};

const ErrorMessage = ({ message }: { message?: string }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.p
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="text-red-500 text-[9px] font-black italic uppercase tracking-widest ml-1 mt-1"
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

export default function ModifyEvent({
  event,
  onEventUpdated,
}: ModifyEventProps) {
  const [openDialog, setOpenDialog] = useState(false);

  const initialData = useMemo(() => {
    const d = new Date(event.date);
    return {
      date: event.date.split("T")[0],
      time: d.toTimeString().split(" ")[0].slice(0, 5),
    };
  }, [event.date]);

  const [formData, setFormData] = useState<EventFormData>({
    name: event.name,
    description: event.description || "",
    location: event.location,
    date: initialData.date,
    startTime: initialData.time,
    durationHours: event.durationHours || 24,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});

  const { mutateAsync: updateEvent, isPending } = useUpdateEvent(event.id);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "IDENTIFIANT REQUIS";
    if (!formData.description.trim())
      newErrors.description = "DESCRIPTION REQUISE";
    if (!formData.location.trim()) newErrors.location = "COORDONNÉES REQUISES";
    if (!formData.date) {
      newErrors.date = "DATE REQUISE";
    } else {
      // Validation : Date doit être aujourd'hui ou futur
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "DATE INVALIDE (PASSÉE)";
      }
    }

    if (!formData.startTime) newErrors.startTime = "HEURE REQUISE";
    if (formData.durationHours <= 0) newErrors.durationHours = "DURÉE INVALIDE";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const finalDateTime = new Date(`${formData.date}T${formData.startTime}`);

      const eventData: Event2 = {
        ...event,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: finalDateTime.toISOString(),
        durationHours: Number(formData.durationHours),
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "durationHours" ? parseInt(value) || 0 : value,
    }));
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

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/30 blur-sm" />
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Settings2 className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Configuration
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                Mise à jour des paramètres système
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Nom */}
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
            />
            <ErrorMessage message={errors.name} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <Calendar size={12} /> Horodatage (Date)
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
              <ErrorMessage message={errors.date} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <Clock size={12} /> Heure de Début
              </Label>
              <input
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white transition-all focus:outline-none focus:border-primary scheme-dark",
                  errors.startTime
                    ? "border-red-500 bg-red-500/5"
                    : "border-white/10",
                )}
              />
              <ErrorMessage message={errors.startTime} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <Timer size={12} /> Durée prévue (H)
              </Label>
              <input
                name="durationHours"
                type="number"
                value={formData.durationHours}
                onChange={handleChange}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white transition-all focus:outline-none focus:border-primary",
                  errors.durationHours
                    ? "border-red-500 bg-red-500/5"
                    : "border-white/10",
                )}
              />
              <ErrorMessage message={errors.durationHours} />
            </div>

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
              <ErrorMessage message={errors.location} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <AlignLeft size={12} /> Briefing
            </Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={cn(
                "w-full p-4 rounded-xl bg-white/5 border text-sm font-medium text-white/70 transition-all focus:outline-none focus:border-primary resize-none custom-scrollbar",
                errors.description
                  ? "border-red-500 bg-red-500/5"
                  : "border-white/10",
              )}
            />
            <ErrorMessage message={errors.description} />
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between gap-4">
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
            className="rounded-2xl bg-primary font-black uppercase italic text-xs px-8 h-12 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(253,182,35,0.2)] border-none"
          >
            {isPending ? "Traitement..." : "Appliquer les changements"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}