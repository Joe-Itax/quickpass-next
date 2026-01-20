"use client";

import { useState } from "react";
import { Plus, Monitor} from "lucide-react";
import { useCreateTerminal } from "@/hooks/use-event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function QuickAddTerminal({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutateAsync: createTerminal, isPending } = useCreateTerminal();

  const handleSubmit = async () => {
    if (!name) return;
    try {
      await createTerminal({ name, eventId: eventId.toString() });
      setName("");
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer">
          <Plus size={16} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-6 border-b border-white/5 flex flex-row items-center gap-4 space-y-0">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Monitor className="text-primary" size={20} />
          </div>
          <DialogTitle className="text-xl font-black italic uppercase text-white tracking-tighter">
            Lier un Terminal
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-widest">
              Nom du point de contrôle
            </Label>
            <input
              autoFocus
              placeholder="Ex: Entrée VIP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold italic focus:border-primary focus:outline-none transition-all placeholder:text-white/10"
            />
          </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name}
            className="rounded-xl bg-primary font-black uppercase italic text-[10px] px-6 h-10 shadow-lg shadow-primary/20"
          >
            {isPending ? "Lien..." : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
