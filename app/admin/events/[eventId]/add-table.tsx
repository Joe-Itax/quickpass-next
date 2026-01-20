"use client";

import { useState } from "react";
import { Table2, Users, LayoutGrid, Info } from "lucide-react";

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
import { useCreateTable } from "@/hooks/use-event";
import { Table } from "@/types/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type TableFormData = {
  name: string;
  capacity: number;
};

type AddTableProps = {
  eventId: number;
  onTableAdded?: () => void;
};

export default function AddTable({ eventId, onTableAdded }: AddTableProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<TableFormData>({
    name: "",
    capacity: 6,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof TableFormData, string>>
  >({});

  const { mutateAsync: createTable, isPending } = useCreateTable(eventId);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TableFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "IDENTIFIANT REQUIS";
    if (!formData.capacity || formData.capacity <= 0)
      newErrors.capacity = "MIN 1 SIÈGE";
    if (formData.capacity > 100) newErrors.capacity = "MAX 100 SIÈGES";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createTable({
        name: formData.name.toUpperCase(),
        capacity: formData.capacity,
      } as Table);

      setFormData({ name: "", capacity: 6 });
      setOpenDialog(false);
      onTableAdded?.();
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  const updateCapacity = (val: number) => {
    setFormData((prev) => ({
      ...prev,
      capacity: Math.max(1, Math.min(100, prev.capacity + val)),
    }));
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <LayoutGrid className="size-4 mr-2 text-primary" />
          Nouvelle Table
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        {/* HEADER */}
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 relative">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Table2 className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Ressource Table
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Initialisation de capacité
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Nom de la table */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 ml-1">
              <Info size={12} /> Désignation
            </Label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className={cn(
                "w-full h-14 px-4 rounded-2xl bg-white/5 border text-lg font-black italic text-white transition-all focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-800",
                errors.name ? "border-red-500" : "border-white/10",
              )}
              placeholder="EX: TABLE VIP 01"
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-[9px] font-black italic uppercase tracking-widest ml-1"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Capacité avec contrôles rapides */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 ml-1">
              <Users size={12} /> Capacité Totale (Sièges)
            </Label>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <span className="text-2xl font-black italic text-white">
                  {formData.capacity}
                </span>
                <span className="ml-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  Places
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => updateCapacity(-1)}
                  variant="outline"
                  className="size-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-xl font-black"
                >
                  -
                </Button>
                <Button
                  onClick={() => updateCapacity(1)}
                  variant="outline"
                  className="size-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xl font-black text-primary hover:text-primary"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[4, 6, 8, 12].map((val) => (
                <button
                  key={val}
                  onClick={() => setFormData((p) => ({ ...p, capacity: val }))}
                  className={cn(
                    "py-2 rounded-lg border text-[10px] font-black transition-all",
                    formData.capacity === val
                      ? "bg-primary border-primary"
                      : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20",
                  )}
                >
                  {val} PLACES
                </button>
              ))}
            </div>
            {errors.capacity && (
              <p className="text-red-500 text-[9px] font-black italic uppercase ml-1">
                {errors.capacity}
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between gap-4">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-black"
            >
              Annuler
            </Button>
          </DialogClose>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-2xl bg-primary font-black uppercase italic text-xs px-10 h-14 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(253,182,35,0.2)] border-none"
          >
            {isPending ? "Configuration..." : "Enregistrer Table"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
