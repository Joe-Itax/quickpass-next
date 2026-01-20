"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteEvent } from "@/hooks/use-event";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteEventProps {
  eventId: number;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteEvent({
  eventId,
  eventName,
  open,
  onOpenChange,
}: DeleteEventProps) {
  const router = useRouter();
  const { mutateAsync: deleteEvent, isPending } = useDeleteEvent(eventId);

  const handleDelete = async () => {
    try {
      await deleteEvent(eventId);
      onOpenChange(false);
      router.push("/admin/events");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0a0a0a] border-red-500/20 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border max-w-md">
        {/* HEADER DANGER */}
        <div className="bg-red-500/10 p-8 border-b border-red-500/10 flex flex-col items-center text-center space-y-4">
          <div className="size-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 animate-pulse">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <div>
            <AlertDialogTitle className="text-2xl font-black italic uppercase text-white tracking-tighter">
              Alerte Critique
            </AlertDialogTitle>
            <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-[0.2em]">
              Suppression de l&apos;événement
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <AlertDialogDescription className="text-center text-gray-400 font-medium leading-relaxed">
            Vous allez supprimer définitivement <br />
            <span className="text-white font-black italic uppercase bg-white/5 px-2 py-1 rounded-lg border border-white/10 mx-1">
              {eventName}
            </span>
            <br />
            <br />
            <span className="text-[11px] uppercase font-bold tracking-tight text-red-500/80">
              Cette action effacera toutes les invitations, les tables et les
              logs de scan associés.
            </span>
          </AlertDialogDescription>
        </div>

        <div className="p-6 bg-black/40 flex items-center justify-between gap-4">
          <AlertDialogCancel className="flex-1 h-12 rounded-2xl border-white/10 bg-white/5 text-gray-400 font-black uppercase italic text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all">
            <X className="mr-2" size={14} /> Annuler
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className={cn(
              "flex-1 h-12 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all",
              "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)]",
            )}
          >
            {isPending ? "Destruction..." : "Confirmer"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
