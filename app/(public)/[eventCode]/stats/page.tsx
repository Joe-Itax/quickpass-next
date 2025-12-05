"use client";

import { useParams } from "next/navigation";
import {
  useEventByEventCode,
  useEventInvitationsByEventCode,
} from "@/hooks/use-event";
import StatCard from "./stat-card";
import Guests from "./guest";
import DataStatusDisplay from "@/components/data-status-display";
import { Event2, Invitation } from "@/types/types";
import formatDateToCustom from "@/utils/format-date-to-custom";

export default function StatsPage() {
  const { eventCode } = useParams();

  // Récupérer l'événement et les invitations depuis la BD
  const {
    data: eventData,
    isPending: isEventPending,
    isError: isEventError,
    error: eventError,
  } = useEventByEventCode(eventCode as string);

  const event = eventData as Event2;

  const {
    data: invitationsData,
    isPending: isInvitationsPending,
    isError: isInvitationsError,
    error: invitationsError,
  } = useEventInvitationsByEventCode(eventCode as string);
  const invitations = (invitationsData as Invitation[]) || [];

  const isPending = isEventPending || isInvitationsPending;
  const hasError = isEventError || isInvitationsError;
  const error = eventError || invitationsError;

  if (hasError) {
    return (
      <DataStatusDisplay
        isPending={false}
        hasError={hasError}
        errorObject={error}
        refetch={() => window.location.reload()}
      />
    );
  }

  // Invitations
  const invitationsTotal = invitations.length;
  const invitationsUnscanned = invitations.filter(
    (inv) => inv.scannedCount === 0
  ).length;
  const invitationsPartial = invitations.filter(
    (inv) => inv.scannedCount > 0 && inv.scannedCount < inv.peopleCount
  ).length;
  const invitationsComplete = invitations.filter(
    (inv) => inv.scannedCount === inv.peopleCount
  ).length;

  // Personnes
  const personsTotalCapacity = invitations.reduce(
    (sum, inv) => sum + inv.peopleCount,
    0
  );
  const personsTotalScanned = invitations.reduce(
    (sum, inv) => sum + inv.scannedCount,
    0
  );
  const personsRemaining = Math.max(
    0,
    personsTotalCapacity - personsTotalScanned
  );

  return (
    <div className="p-6 pb-40 flex flex-col gap-6 min-h-screen bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques des invités</h1>
          <p className="text-sm text-gray-300">
            Gérez vos invités, filtres et états de scannage.
          </p>
          <div className="pt-8">
            <h2 className="text-2xl font-bold">{event?.name || "Événement"}</h2>
            <p className="text-sm text-gray-300">
              {event?.description || "Aucune description disponible."}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Lieu: {event?.location} • Date:{" "}
              {event?.date ? formatDateToCustom(event.date) : "Non définie"}
            </p>
          </div>
        </div>
      </div>

      {/* --- Stat Cards --- */}
      <StatCard
        invitationsTotal={invitationsTotal}
        invitationsUnscanned={invitationsUnscanned}
        invitationsPartial={invitationsPartial}
        invitationsComplete={invitationsComplete}
        personsTotalCapacity={personsTotalCapacity}
        personsTotalScanned={personsTotalScanned}
        personsRemaining={personsRemaining}
        loading={isPending}
      />

      {/* Liste des invités */}
      <Guests />
    </div>
  );
}
