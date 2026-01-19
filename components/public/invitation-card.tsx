"use client";

import { Badge } from "@/components/ui/badge";
import { Invitation } from "@/types/types";
import { UserCheck, UserPlus, MapPin, Hash } from "lucide-react";

export default function InvitationCard({
  invitation,
}: {
  invitation: Invitation;
}) {
  const isFull = invitation.scannedCount >= invitation.peopleCount;
  const isPartial =
    invitation.scannedCount > 0 &&
    invitation.scannedCount < invitation.peopleCount;

  return (
    <div className="relative group overflow-hidden bg-white/3 hover:bg-white/6 border border-white/10 rounded-4xl transition-all duration-300 backdrop-blur-md">
      {/* INDICATEUR LATÉRAL DE STATUT */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
          isFull
            ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
            : isPartial
              ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
              : "bg-white/10"
        }`}
      />

      <div className="p-5 pl-7 flex flex-col gap-4">
        {/* HEADER : NOM & BADGE */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight truncate text-white">
              {invitation.label || "Sans Nom"}
            </h3>
            {invitation.email && (
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                {invitation.email}
              </p>
            )}
          </div>

          <Badge
            className={`
              shrink-0 border-none rounded-lg font-black text-[10px] uppercase px-2 py-1 shadow-lg
              ${
                isFull
                  ? "bg-green-500/10 text-green-400"
                  : isPartial
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-white/5 text-gray-400"
              }
            `}
          >
            {invitation.scannedCount}/{invitation.peopleCount}
          </Badge>
        </div>

        {/* INFO TABLES */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin size={14} className="text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-tight">
              {invitation.allocations && invitation.allocations.length > 0
                ? invitation.allocations.map((t, idx) => (
                    <span key={idx}>
                      <span className="text-white">{t.table.name}</span>
                      {invitation.allocations &&
                        invitation.allocations?.length >= 2 && (
                          <span className="text-[9px] ml-1 opacity-60">
                            ({t.seatsAssigned} PL.)
                          </span>
                        )}
                      {idx < (invitation.allocations?.length ?? 0) - 1 && " • "}
                    </span>
                  ))
                : "Non assigné"}
            </span>
          </div>

          {/* PROGRESS BAR MINI */}
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFull ? "bg-green-500" : "bg-primary"
              }`}
              style={{
                width: `${(invitation.scannedCount / invitation.peopleCount) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* FOOTER : ID & ICON STATUS */}
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Hash size={12} />
            <span className="text-[9px] font-mono tracking-tighter uppercase">
              {invitation.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFull ? (
              <UserCheck size={16} className="text-green-500" />
            ) : (
              <UserPlus size={16} className="text-gray-700" />
            )}
            <span
              className={`text-[10px] font-black uppercase italic ${isFull ? "text-green-500" : "text-gray-600"}`}
            >
              {isFull ? "Check-in OK" : "En attente"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
