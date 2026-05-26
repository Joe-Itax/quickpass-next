"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";
import type { Event2, Invitation } from "@/types/types";

type InvitationTicketProps = {
  invitation: Invitation;
  event?: Event2;
  className?: string;
};

export function InvitationTicket({
  invitation,
  event,
  className,
}: InvitationTicketProps) {
  const sourceEvent = event ?? invitation.event;
  const assignedTable = getAssignedTable(invitation);
  const seatsAssigned = getSeatsAssigned(invitation);
  const templateLayout = sourceEvent?.invitationTemplate?.layoutData;
  const formattedDate = sourceEvent?.date
    ? new Date(sourceEvent.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  if (templateLayout) {
    return (
      <div className={cn("w-full", className)}>
        <InvitationRenderer
          templateData={templateLayout}
          guestData={{
            name: invitation.label,
            table: assignedTable,
            peopleCount: invitation.peopleCount,
            email: invitation.email,
            whatsapp: invitation.whatsapp,
            seatsAssigned,
            qrCodeData: invitation.qrCode,
          }}
          eventData={{
            name: sourceEvent?.name,
            description: sourceEvent?.description,
            date: formattedDate,
            durationHours: sourceEvent?.durationHours,
            location: sourceEvent?.location,
            fullLocation: sourceEvent?.fullLocation,
            invitationMessage: sourceEvent?.invitationMessage,
            peopleCount: invitation.peopleCount,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-2xl",
        className,
      )}
    >
      <div className="bg-primary p-6 text-center">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-black">
          Official Digital Pass
        </p>
        <h1 className="text-xl font-black uppercase italic leading-tight text-black">
          {sourceEvent?.name}
        </h1>
      </div>

      <div className="flex flex-col items-center space-y-8 p-8">
        <div className="flex size-64 items-center justify-center rounded-3xl border-4 border-white bg-white p-4 shadow-xl">
          <QRCodeCanvas
            value={invitation.qrCode}
            size={220}
            level="H"
            imageSettings={{
              src: "/logo-app/icon-1024.png",
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            {invitation.label}
          </h2>
          <Badge className="mt-2 border-primary/20 bg-primary/10 font-bold uppercase text-primary">
            {invitation.peopleCount} PLACES (PAX)
          </Badge>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-4 text-gray-400">
            <Calendar className="size-5 text-primary" />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <MapPin className="size-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase text-white">
                {sourceEvent?.location}
              </span>
              <span className="text-[10px]">{sourceEvent?.fullLocation}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Ticket className="size-5 text-primary" />
            <span className="text-sm font-bold uppercase italic text-white">
              TABLE: {invitation.allocations?.[0]?.table.name || "SANS PLACE"}
            </span>
          </div>
        </div>

        <p className="text-center text-[8px] font-bold uppercase tracking-widest text-gray-300">
          Veuillez presenter ce QR Code a l&apos;accueil.
        </p>
      </div>
    </div>
  );
}

function getAssignedTable(invitation: Invitation) {
  return (
    invitation.allocations
      ?.map((allocation) => allocation.table?.name)
      .filter(Boolean)
      .join(", ") || "SANS PLACE"
  );
}

function getSeatsAssigned(invitation: Invitation) {
  return (
    invitation.allocations?.reduce(
      (total, allocation) => total + allocation.seatsAssigned,
      0,
    ) || invitation.peopleCount
  );
}
