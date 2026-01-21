"use client";

import { useState } from "react";
import {
  Plus,
  Calendar,
  MapPin,
  AlignLeft,
  Info,
  Sparkles,
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
import { useCreateEvent } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Event2 } from "@/types/types";

type EventFormData = {
  name: string;
  description: string;
  date: string;
  startTime: string;
  durationHours: number;
  location: string;
};

export default function AddEvent() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    date: "",
    startTime: "12:00",
    durationHours: 24,
    location: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});
  const { mutateAsync: createEvent, isPending } = useCreateEvent();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "NOM REQUIS";
    if (!formData.description.trim())
      newErrors.description = "DESCRIPTION REQUISE";
    if (!formData.date.trim()) newErrors.date = "DATE REQUISE";
    if (!formData.startTime.trim()) newErrors.startTime = "HEURE REQUISE";
    if (!formData.location.trim()) newErrors.location = "LIEU REQUIS";
    if (formData.durationHours <= 0) newErrors.durationHours = "DURÉE INVALIDE";

    const combinedDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const now = new Date();

    if (formData.date && combinedDateTime < now) {
      newErrors.date = "DATE/HEURE INVALIDE (PASSÉE)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const finalDateTime = new Date(`${formData.date}T${formData.startTime}`);

      await createEvent({
        name: formData.name,
        description: formData.description,
        date: finalDateTime.toISOString(),
        durationHours: Number(formData.durationHours),
        location: formData.location,
      } as unknown as Event2);

      setFormData({
        name: "",
        description: "",
        date: "",
        startTime: "12:00",
        durationHours: 24,
        location: "",
      });
      setOpenDialog(false);
    } catch (error) {
      console.error(error);
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
        <Button className="rounded-2xl bg-primary font-black uppercase italic hover:scale-105 transition-transform px-6 shadow-[0_0_20px_rgba(253,182,35,0.3)]">
          <Plus className="mr-2" size={20} strokeWidth={3} />
          Nouvel Événement
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(253,182,35,0.3)]">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Initialisation
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                Déploiement d&apos;un nouvel événement
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 ml-1">
              <Info size={12} /> Nom de l&apos;événement
            </Label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={cn(
                "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold italic text-white transition-all focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-700",
                errors.name ? "border-red-500 bg-red-500/5" : "border-white/10",
              )}
              placeholder="Ex: GALA DE CHARITÉ 2026"
            />
            <ErrorMessage message={errors.name} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
                <Calendar size={12} /> Date
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

            {/* Heure de début */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
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
            {/* Durée */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
                <Timer size={12} /> Durée prévue (Heures)
              </Label>
              <input
                name="durationHours"
                type="number"
                min="1"
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

            {/* Lieu */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
                <MapPin size={12} /> Localisation
              </Label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Pullman Hotel"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white transition-all focus:outline-none focus:border-primary placeholder:text-gray-700",
                  errors.location
                    ? "border-red-500 bg-red-500/5"
                    : "border-white/10",
                )}
              />
              <ErrorMessage message={errors.location} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
              <AlignLeft size={12} /> Briefing
            </Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className={cn(
                "w-full p-4 rounded-xl bg-white/5 border text-sm font-medium text-white/70 transition-all focus:outline-none focus:border-primary resize-none placeholder:text-gray-700",
                errors.description
                  ? "border-red-500 bg-red-500/5"
                  : "border-white/10",
              )}
              placeholder="Décrivez l'enjeu de cet événement..."
            />
            <ErrorMessage message={errors.description} />
          </div>
        </div>

        {/* FOOTER */}
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
            className="rounded-2xl bg-primary font-black uppercase italic text-xs px-10 h-12 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(253,182,35,0.2)] border-none"
          >
            {isPending ? "Initialisation..." : "Déployer l'événement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper pour afficher l'erreur avec animation
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
