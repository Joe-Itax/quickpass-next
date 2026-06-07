"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEventInvitations, useEvent } from "@/hooks/use-event";
import { Invitation, Event2 } from "@/types/types";
import {
  ChevronRight,
  MoveLeftIcon,
  Search,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useRealtimeList } from "@/hooks/use-realtime-list";
import { toast } from "sonner";
import AddGuest from "../add-guest";
import DataStatusDisplay from "@/components/data-status-display";
import { motion } from "motion/react";

function GuestCard({
  invitation,
  eventId,
  refetch,
}: {
  invitation: Invitation;
  eventId: number;
  refetch: () => void;
}) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);

  const handleSendSingle = async (channel: "email" | "whatsapp") => {
    if (channel === "email") setIsSendingEmail(true);
    if (channel === "whatsapp") setIsSendingWhatsapp(true);

    try {
      const res = await fetch(
        `/api/events/${eventId}/invitations/${invitation.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        if (channel === "whatsapp") {
          toast.success(
            data.queuedBehindExisting
              ? `${data.queued || 1} message WhatsApp ajoute a la suite de la file active`
              : `${data.queued || 1} message WhatsApp planifie`,
          );
          if (data.workerError) {
            toast.warning("File creee. Le worker reprendra via sa boucle.");
          }
          refetch();
          return;
        }
        toast.success("Invitation envoyée par Email !");
        refetch();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi.");
      }
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      if (channel === "email") setIsSendingEmail(false);
      if (channel === "whatsapp") setIsSendingWhatsapp(false);
    }
  };

  return (
    <div className="group bg-white/5 border border-white/10 rounded-4xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="text-left">
            <h3 className="text-xl font-black uppercase italic text-white mb-1">
              {invitation.label}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ID: {invitation.id.toString().padStart(4, "0")} •{" "}
              {invitation.peopleCount} PAX
            </p>
            <p>
              {invitation?.allocations && invitation?.allocations.length && (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Table:{" "}
                  {invitation.allocations
                    .map((alloc) => alloc.table.name)
                    .join(" - ")}
                </span>
              )}
            </p>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
              invitation.scannedCount > 0
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-yellow-500/10 text-yellow-500",
            )}
          >
            {invitation.scannedCount > 0 ? "Présent" : "Attendu"}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {invitation.whatsapp && (
            <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden group/btn">
              <div className="flex-1 p-3 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    WhatsApp
                    {invitation.isSentWhatsapp && (
                      <CheckCircle size={8} className="text-green-500" />
                    )}
                  </p>
                  <p className="text-xs font-bold text-white tracking-tight">
                    {invitation.whatsapp}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendSingle("whatsapp")}
                disabled={isSendingWhatsapp}
                className="px-4 flex flex-col items-center justify-center border-l border-white/10 hover:bg-green-500/10 transition-all cursor-pointer text-green-500 disabled:opacity-50"
              >
                {isSendingWhatsapp ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          )}

          {invitation.email && (
            <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden group/btn">
              <div className="flex-1 p-3 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    Email
                    {invitation.isSentEmail && (
                      <CheckCircle size={8} className="text-blue-500" />
                    )}
                  </p>
                  <p className="text-xs font-bold text-white tracking-tight truncate w-32 md:w-40">
                    {invitation.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendSingle("email")}
                disabled={isSendingEmail}
                className="px-4 flex flex-col items-center justify-center border-l border-white/10 hover:bg-blue-500/10 transition-all cursor-pointer text-blue-500 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          )}

          {!invitation.whatsapp && !invitation.email && (
            <p className="text-xs text-gray-600 italic">
              Aucun contact enregistré
            </p>
          )}
        </div>
      </div>

      <Link
        href={`/admin/events/${eventId}/guests/${invitation.id}`}
        className="pt-4 border-t border-white/5 flex items-center justify-between text-gray-500 hover:text-primary transition-colors"
      >
        <span className="text-[10px] font-black uppercase">
          Ouvrir le profil
        </span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export default function GuestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { eventId } = useParams();
  const router = useRouter();

  const {
    data: invsData,
    isPending: isPendingI,
    isError: isErrorI,
    error: errorI,
    refetch: refetchI,
  } = useEventInvitations(Number(eventId));
  const {
    data: eventDatas,
    isPending: isPendingE,
    isError: isErrorE,
    error: errorE,
    refetch: refetchE,
  } = useEvent(Number(eventId));

  const eventData = eventDatas as Event2;

  const isPending = isPendingI || isPendingE;
  const isError = isErrorI || isErrorE;
  const error = errorI || errorE;

  const handleRefetch = () => {
    refetchI();
    refetchE();
  };

  // Synchronisation en temps réel
  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => {
      refetchI();
      refetchE();
    },
  });
  useRealtimeList(refetchI);
  useRealtimeList(refetchE);

  const invitations = (invsData as Invitation[]) || [];

  const filteredGuests = invitations.filter(
    (inv) =>
      inv.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.whatsapp?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isPending || isError || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={handleRefetch}
      />
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#050505] min-h-screen">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="group size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer"
          >
            <MoveLeftIcon className="text-gray-500 group-hover:text-primary transition-colors" />
          </button>
          <div className="flex w-full max-[500px]:flex-col flex-row justify-between gap-2">
            <div>
              <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                {eventData?.name} <br />
                <span className="text-white/60"> Gestion des Invités</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Liste complète et envois rapides
              </p>
            </div>
            <div>
              <AddGuest eventId={Number(eventId)} />
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un invité (Nom, Email, WhatsApp)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors italic font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGuests.map((invitation, index) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
          >
            <GuestCard
              invitation={invitation}
              eventId={Number(eventId)}
              refetch={refetchI}
            />
          </motion.div>
        ))}
        {filteredGuests.length === 0 && (
          <p className="text-gray-500 italic col-span-full">
            Aucun invité trouvé.
          </p>
        )}
      </div>
    </div>
  );
}
